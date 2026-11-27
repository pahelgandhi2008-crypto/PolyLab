export type PolymerCategory =
  | 'Cancer Therapy'
  | 'Pharmaceutical'
  | 'Epoxy & Thermoset'
  | 'Co-polymer & Commodity'
  | 'Conducting & Doped'
  | 'Liquid Crystal (LCP)'
  | 'Smart Polymer';

export type ElementSymbol = 'C' | 'H' | 'O' | 'N' | 'S' | 'Cl' | 'F' | 'I' | 'P';

export interface Atom3D {
  id: number;
  element: ElementSymbol;
  x: number;
  y: number;
  z: number;
  hybridization?: string;
  role?: string;
}

export interface Bond3D {
  from: number;
  to: number;
  order: 1 | 2 | 3 | 1.5; // 1.5 = aromatic/conjugated
}

export interface MolecularFractionBin {
  id: string;
  molarMass: number; // M_i (g/mol)
  moles: number;     // N_i (relative moles or chain count)
}

export interface PolymerSource {
  title: string;
  publisher: string;
  url: string;
}

export interface PolymerData {
  id: string;
  name: string;
  shortName: string;
  iupacName: string;
  casNumber: string;
  pubchemCid: string;
  category: PolymerCategory;
  mechanismHighlight: string;
  definition?: string;
  balancedEquation?: string;

  // Formula & Equation (Point 3)
  monomerName: string;
  monomerFormula: string;
  repeatUnitFormula: string;
  monomerMolarMass: number; // g/mol
  polymerizationType: string;
  equationReactants: string;
  equationConditions: string;
  equationProducts: string;
  equationNotes: string;

  // 3D Geometry (Point 4)
  atoms3D: Atom3D[];
  bonds3D: Bond3D[];
  chainStepVector: [number, number, number];
  headAtomIndex: number;
  tailAtomIndex: number;

  // Physical & Chemical Properties (Point 5)
  physicalProperties: {
    densityGcm3: string;
    tgC: string;
    tmC: string;
    tensileStrengthMPa: string;
    youngsModulusGPa: string;
    elongationPct: string;
    conductivitySCm: string;
    crystallinity: string;
  };
  chemicalProperties: {
    solubility: string;
    chemicalResistance: string;
    thermalDegradationC: string;
    reactivityAndDoping: string;
    functionalGroups: string;
  };
  radarProfile: {
    thermalStability: number;   // 0-100
    mechanicalStrength: number; // 0-100
    chemicalResistance: number; // 0-100
    conductivity: number;       // 0-100
    biocompatibility: number;   // 0-100
    processability: number;     // 0-100
  };

  // Disadvantages in Humans & Animals (Point 6)
  humanHazards: string[];
  animalEcoHazards: string[];

  // Precautions (Point 7)
  precautions: {
    ghsSignal: 'Danger' | 'Warning' | 'Low Hazard';
    ppe: string[];
    engineeringControls: string[];
    handlingAndDisposal: string[];
  };

  // Molecular Weight & Distribution (Points 8 & 9)
  markHouwinkK: number; // mL/g
  markHouwinkA: number; // dimensionless exponent (0.5 - 1.0+)
  defaultBins: MolecularFractionBin[];

  // Fox-Flory, PDI/Tg, Kinetics, ML (Points 10 - 13)
  foxFlory: {
    tgInfK: number;
    kg: number; // K * g/mol
    typicalMn: number;
  };
  kinetics: {
    kp: number; // L / (mol * s) at reference T
    kt: number; // L / (mol * s)
    kd: number; // 1/s initiator dissociation
    f: number;  // initiator efficiency (0-1)
    referenceTempK: number;
    alphaCoupling: number; // 0 to 1 (fraction of coupling termination)
  };
  mlDescriptors: {
    rigidityIndex: number;        // 1 (flexible) to 10 (rigid aromatic/ladder)
    cohesiveEnergyDensity: number; // J/cm^3 (150 to 900)
    hBondIndex: number;           // 0 to 5
    crosslinkDensity: number;     // 0 to 1
    sideChainBulk: number;        // 1 to 10
    experimentalTgK: number;
    experimentalTensileMPa: number;
    experimentalModulusGPa: number;
  };
  pdiTgNotes: {
    pdiEffect: string;
    tgEffect: string;
    structuralDrivers: string[];
  };
  sources: PolymerSource[];
  isResolvedExternal?: boolean;
}
