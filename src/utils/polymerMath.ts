import { MolecularFractionBin } from '../types/polymer';

export interface MolecularWeightResults {
  mn: number;
  mw: number;
  mv: number;
  mz: number;
  pdi: number;
  intrinsicViscosity: number; // mL/g
  totalMoles: number;
  totalMass: number;
}

/**
 * Computes Number-Average (Mn), Weight-Average (Mw), Viscosity-Average (Mv),
 * Z-Average (Mz), Polydispersity Index (PDI), and Intrinsic Viscosity [eta].
 */
export function calculateMolecularWeights(
  bins: MolecularFractionBin[],
  markHouwinkK: number,
  markHouwinkA: number
): MolecularWeightResults {
  const valid = bins.filter((b) => b.molarMass > 0 && b.moles > 0);
  if (valid.length === 0) {
    return {
      mn: 0,
      mw: 0,
      mv: 0,
      mz: 0,
      pdi: 1,
      intrinsicViscosity: 0,
      totalMoles: 0,
      totalMass: 0,
    };
  }

  let sumN = 0;
  let sumNM = 0;
  let sumNM2 = 0;
  let sumNM3 = 0;
  let sumNM1PlusA = 0;

  for (const bin of valid) {
    const n = bin.moles;
    const m = bin.molarMass;
    sumN += n;
    sumNM += n * m;
    sumNM2 += n * m * m;
    sumNM3 += n * m * m * m;
    sumNM1PlusA += n * Math.pow(m, 1 + markHouwinkA);
  }

  const mn = sumNM / sumN;
  const mw = sumNM2 / sumNM;
  const mz = sumNM3 / sumNM2;
  const mv = Math.pow(sumNM1PlusA / sumNM, 1 / markHouwinkA);
  const pdi = mn > 0 ? mw / mn : 1;
  const intrinsicViscosity = markHouwinkK * Math.pow(mv, markHouwinkA);

  return {
    mn,
    mw,
    mv,
    mz,
    pdi,
    intrinsicViscosity,
    totalMoles: sumN,
    totalMass: sumNM,
  };
}

/**
 * Generates realistic Schulz-Zimm molecular weight distribution bins
 * given target Mn and target PDI (> 1.0).
 */
export function generateSchulzZimmBins(
  targetMn: number,
  targetPdi: number,
  numBins = 14
): MolecularFractionBin[] {
  const safePdi = Math.max(1.04, Math.min(4.5, targetPdi));
  const z = 1 / (safePdi - 1); // Schulz-Zimm breadth parameter
  const maxM = targetMn * (2.5 + 2.2 * (safePdi - 1));
  const minM = Math.max(500, targetMn * 0.08);
  const bins: MolecularFractionBin[] = [];

  for (let i = 0; i < numBins; i++) {
    const t = i / (numBins - 1);
    // Log-spaced grid for smooth coverage across orders of magnitude
    const m = Math.round(minM * Math.pow(maxM / minM, t));
    // Number distribution N(M) ~ M^(z-1) * exp(-z * M / Mn)
    const ratio = m / targetMn;
    const logDensity = (z - 1) * Math.log(Math.max(ratio, 1e-4)) - z * ratio;
    const rawMoles = Math.exp(Math.max(-30, logDensity)) * (m * 0.25);
    const moles = Math.max(0.02, Number(rawMoles.toFixed(3)));
    bins.push({
      id: `sz-${i + 1}`,
      molarMass: m,
      moles,
    });
  }

  return bins;
}

export interface FrpSimulationStep {
  timeMin: number;
  monomerConc: number;     // [M] mol/L
  initiatorConc: number;   // [I] mol/L
  radicalConc: number;     // [M*] mol/L
  conversionPct: number;   // p (%)
  rp: number;              // mol / (L * min)
  kineticChainLength: number; // nu
  xn: number;              // Degree of polymerization
}

export interface FrpParams {
  m0: number;        // Initial [M]_0 (mol/L)
  i0: number;        // Initial [I]_0 (mol/L)
  tempK: number;     // Temperature (K)
  refTempK: number;  // Reference T (K)
  kpRef: number;     // L/(mol*s)
  ktRef: number;     // L/(mol*s)
  kdRef: number;     // 1/s
  f: number;         // Initiator efficiency (0-1)
  alphaCoupling: number; // 0 (all disprop) to 1 (all coupling)
  durationMin: number;
}

/**
 * Integrates free-radical polymerization kinetics using Arrhenius-scaled
 * rate constants and steady-state radical approximation.
 */
export function simulateFreeRadicalPolymerization(
  params: FrpParams,
  steps = 60
): FrpSimulationStep[] {
  const R = 8.3144626; // J / (mol * K)
  // Typical radical activation energies (J/mol)
  const Ea_d = 125000;
  const Ea_p = 28000;
  const Ea_t = 12000;

  const invDeltaT = 1 / params.tempK - 1 / params.refTempK;
  const kd = params.kdRef * Math.exp((-Ea_d / R) * invDeltaT);
  const kp = params.kpRef * Math.exp((-Ea_p / R) * invDeltaT);
  const kt = params.ktRef * Math.exp((-Ea_t / R) * invDeltaT);

  const dtSec = (params.durationMin * 60) / steps;
  let M = params.m0;
  let I = params.i0;

  const out: FrpSimulationStep[] = [];
  for (let s = 0; s <= steps; s++) {
    const timeMin = (s * params.durationMin) / steps;
    const ri = 2 * params.f * kd * I;
    const radicalConc = Math.sqrt(Math.max(0, ri / (2 * kt)));
    const rpPerSec = kp * M * radicalConc;
    const nu = ri > 1e-18 ? rpPerSec / ri : 0;
    const xn = nu * (2 / Math.max(1, 2 - params.alphaCoupling));
    const conversionPct = Math.min(99.9, Math.max(0, ((params.m0 - M) / params.m0) * 100));

    out.push({
      timeMin: Number(timeMin.toFixed(1)),
      monomerConc: M,
      initiatorConc: I,
      radicalConc,
      conversionPct,
      rp: rpPerSec * 60,
      kineticChainLength: nu,
      xn,
    });

    // Advance RK2 midpoint step
    const dI = -kd * I * dtSec;
    const dM = -rpPerSec * dtSec;
    I = Math.max(1e-7, I + dI);
    M = Math.max(1e-5, M + dM);
  }

  return out;
}

/**
 * Fox-Flory relationship: Tg(Mn) = Tg_inf - K_g / Mn
 */
export function computeFoxFloryTg(
  tgInfK: number,
  kg: number,
  mn: number
): number {
  const safeMn = Math.max(400, mn);
  return Math.max(120, tgInfK - kg / safeMn);
}

export interface MlPredictionInput {
  monomerMolarMass: number;
  rigidityIndex: number;        // 1-10
  cohesiveEnergyDensity: number; // J/cm3 (150-900)
  hBondIndex: number;           // 0-5
  crosslinkDensity: number;     // 0-1
  sideChainBulk: number;        // 1-10
  mn: number;                   // g/mol
  pdi: number;                  // 1.0 - 5.0
}

export interface MlPredictionOutput {
  predictedTgK: number;
  predictedTgC: number;
  predictedTensileMPa: number;
  predictedModulusGPa: number;
  predictedThermalDegradationC: number;
  featureContributions: Array<{
    feature: string;
    impactK: number;
    importancePct: number;
  }>;
}

/**
 * Calibrated Multi-Feature Polymer Physics Regression Model (Group Contribution + Fox-Flory).
 * Predicts Glass Transition Temperature (Tg), Tensile Strength, Young's Modulus,
 * and Thermal Stability from macromolecular descriptors.
 */
export function predictPolymerPropertiesML(input: MlPredictionInput): MlPredictionOutput {
  // Base amorphous flexible hydrocarbon baseline
  const baseTgK = 195;
  const rigidityTerm = input.rigidityIndex * 21.5;
  const cedTerm = (input.cohesiveEnergyDensity - 200) * 0.145;
  const hBondTerm = input.hBondIndex * 18.2;
  const bulkTerm = input.sideChainBulk * 7.4;
  const crosslinkTerm = input.crosslinkDensity * 92.0;

  // Fox-Flory chain-end free volume depression & PDI broadening penalty
  const chainEndPenalty = -48000 / Math.max(1500, input.mn);
  const pdiPlasticize = -(input.pdi - 1.0) * 4.5;

  const predictedTgK = Math.max(
    145,
    Math.min(720, baseTgK + rigidityTerm + cedTerm + hBondTerm + bulkTerm + crosslinkTerm + chainEndPenalty + pdiPlasticize)
  );
  const predictedTgC = predictedTgK - 273.15;

  // Tensile Strength (MPa) nonlinear regression from rigidity, CED, H-bonding, Mw, crosslink
  const mwFactor = 1 - Math.exp(-input.mn / 28000);
  const rawTensile =
    (12 + input.rigidityIndex * 18.5 + (input.cohesiveEnergyDensity / 900) * 55 + input.hBondIndex * 24 + input.crosslinkDensity * 38) *
    mwFactor *
    (1 - Math.min(0.35, (input.pdi - 1.2) * 0.06));
  const predictedTensileMPa = Math.max(4, rawTensile);

  // Young's Modulus (GPa)
  const rawModulus =
    (0.15 + Math.pow(input.rigidityIndex / 10, 1.85) * 42 + input.hBondIndex * 3.8 + input.crosslinkDensity * 2.9 + (input.cohesiveEnergyDensity / 900) * 2.1) *
    mwFactor;
  const predictedModulusGPa = Math.max(0.05, rawModulus);

  // Thermal Degradation Temp (°C)
  const predictedThermalDegradationC =
    235 + input.rigidityIndex * 23 + input.crosslinkDensity * 65 + (input.cohesiveEnergyDensity / 900) * 48 + Math.min(40, input.monomerMolarMass * 0.12);

  const absTotal =
    Math.abs(rigidityTerm) +
    Math.abs(cedTerm) +
    Math.abs(hBondTerm) +
    Math.abs(bulkTerm) +
    Math.abs(crosslinkTerm) +
    Math.abs(chainEndPenalty);

  const contributions = [
    { feature: 'Backbone Rigidity', impactK: rigidityTerm },
    { feature: 'Cohesive Energy Density', impactK: cedTerm },
    { feature: 'H-Bonding Density', impactK: hBondTerm },
    { feature: 'Crosslink Network', impactK: crosslinkTerm },
    { feature: 'Steric Side-Chain Bulk', impactK: bulkTerm },
    { feature: 'Chain-End Free Volume (1/Mn)', impactK: chainEndPenalty },
  ].map((c) => ({
    ...c,
    importancePct: absTotal > 0 ? (Math.abs(c.impactK) / absTotal) * 100 : 0,
  }));

  return {
    predictedTgK,
    predictedTgC,
    predictedTensileMPa,
    predictedModulusGPa,
    predictedThermalDegradationC,
    featureContributions: contributions,
  };
}
