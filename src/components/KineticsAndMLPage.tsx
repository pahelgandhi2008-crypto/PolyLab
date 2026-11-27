import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, Pause, RotateCcw, Sliders, Cpu, Plus, Trash2, FlaskConical } from 'lucide-react';
import { PolymerData } from '../types/polymer';
import {
  computeFoxFloryTg,
  predictPolymerPropertiesML,
  simulateFreeRadicalPolymerization,
} from '../utils/polymerMath';

interface KineticsAndMLPageProps {
  polymer: PolymerData;
  onBack: () => void;
  onRestart: () => void;
}

interface AnalyticalConversionPoint {
  id: string;
  timeMin: number;
  conversionPct: number;
}

interface AnalyticalFoxFloryPoint {
  id: string;
  mn: number;
  tgK: number;
}

const PROPERTY_IMPACT_MATRIX = [
  {
    factor: 'Backbone Rigidity (Aromatic vs. Aliphatic)',
    pdiEffect: 'Step-growth polycondensation locks PDI ≈ 2.0; living chain-growth keeps PDI < 1.2.',
    tgEffect: 'Strongly increases Tg (+100 to +300 K) by raising rotational energy barriers.',
  },
  {
    factor: 'Bulky Pendant Side Groups',
    pdiEffect: 'Minimal direct effect on PDI; can slow propagation kp relative to transfer.',
    tgEffect: 'Increases Tg (+40 to +120 K) via steric hindrance (e.g. PS 100 °C vs PE -120 °C).',
  },
  {
    factor: 'Crosslinking Density',
    pdiEffect: 'Drives PDI → ∞ past the gel point as chains merge into a single 3D network.',
    tgEffect: 'Substantially raises Tg and suppresses viscous flow above Tg.',
  },
  {
    factor: 'Plasticizers / Low-MW Oligomers',
    pdiEffect: 'Low-MW tail broadens PDI (> 2.5) and shifts Mn downward disproportionately.',
    tgEffect: 'Decreases Tg (-20 to -80 K) by increasing fractional free volume between chains.',
  },
  {
    factor: 'Hydrogen Bonding & Polarity (CED)',
    pdiEffect: 'Can induce viscosity gel effects (Trommsdorff-Norrish), broadening PDI in bulk FRP.',
    tgEffect: 'Strongly elevates Tg via interchain cohesive forces (e.g. Kevlar, PAA, HPMC).',
  },
];

export const KineticsAndMLPage: React.FC<KineticsAndMLPageProps> = ({
  polymer,
  onBack,
  onRestart,
}) => {
  // Free-Radical Polymerization Simulator state
  const [m0, setM0] = useState(4.0);
  const [i0, setI0] = useState(0.04);
  const [tempC, setTempC] = useState(Math.round(polymer.kinetics.referenceTempK - 273.15));
  const [alphaCoupling, setAlphaCoupling] = useState(polymer.kinetics.alphaCoupling);
  const [simPlaying, setSimPlaying] = useState(true);
  const [simResetKey, setSimResetKey] = useState(0);
  const frpCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Analytical FRP Conversion comparison points
  const [showAnalyticalFrp, setShowAnalyticalFrp] = useState(true);
  const [analyticalFrpPoints, setAnalyticalFrpPoints] = useState<AnalyticalConversionPoint[]>([
    { id: 'frp-1', timeMin: 20, conversionPct: 18.5 },
    { id: 'frp-2', timeMin: 60, conversionPct: 46.0 },
    { id: 'frp-3', timeMin: 100, conversionPct: 68.0 },
  ]);

  // ML Predictor state
  const [rigidity, setRigidity] = useState(polymer.mlDescriptors.rigidityIndex);
  const [ced, setCed] = useState(polymer.mlDescriptors.cohesiveEnergyDensity);
  const [hBond, setHBond] = useState(polymer.mlDescriptors.hBondIndex);
  const [crosslink, setCrosslink] = useState(polymer.mlDescriptors.crosslinkDensity);
  const [sideBulk, setSideBulk] = useState(polymer.mlDescriptors.sideChainBulk);
  const [mlMn, setMlMn] = useState(polymer.foxFlory.typicalMn);
  const [mlPdi, setMlPdi] = useState(1.8);

  // Fox-Flory Plot state + Analytical DSC points
  const [ffTgInfK, setFfTgInfK] = useState(polymer.foxFlory.tgInfK);
  const [ffKg, setFfKg] = useState(polymer.foxFlory.kg);
  const [ffProbeMn, setFfProbeMn] = useState(polymer.foxFlory.typicalMn);
  const [showAnalyticalFf, setShowAnalyticalFf] = useState(true);
  const [analyticalFfPoints, setAnalyticalFfPoints] = useState<AnalyticalFoxFloryPoint[]>([
    {
      id: 'ff-1',
      mn: 12000,
      tgK: Math.round(computeFoxFloryTg(polymer.foxFlory.tgInfK, polymer.foxFlory.kg, 12000) - 3),
    },
    {
      id: 'ff-2',
      mn: 45000,
      tgK: Math.round(computeFoxFloryTg(polymer.foxFlory.tgInfK, polymer.foxFlory.kg, 45000) + 2),
    },
    {
      id: 'ff-3',
      mn: 110000,
      tgK: Math.round(computeFoxFloryTg(polymer.foxFlory.tgInfK, polymer.foxFlory.kg, 110000) - 1),
    },
  ]);

  useEffect(() => {
    setTempC(Math.round(polymer.kinetics.referenceTempK - 273.15));
    setAlphaCoupling(polymer.kinetics.alphaCoupling);
    setRigidity(polymer.mlDescriptors.rigidityIndex);
    setCed(polymer.mlDescriptors.cohesiveEnergyDensity);
    setHBond(polymer.mlDescriptors.hBondIndex);
    setCrosslink(polymer.mlDescriptors.crosslinkDensity);
    setSideBulk(polymer.mlDescriptors.sideChainBulk);
    setMlMn(polymer.foxFlory.typicalMn);
    setFfTgInfK(polymer.foxFlory.tgInfK);
    setFfKg(polymer.foxFlory.kg);
    setFfProbeMn(polymer.foxFlory.typicalMn);
    setAnalyticalFfPoints([
      {
        id: 'ff-1',
        mn: 12000,
        tgK: Math.round(computeFoxFloryTg(polymer.foxFlory.tgInfK, polymer.foxFlory.kg, 12000) - 3),
      },
      {
        id: 'ff-2',
        mn: 45000,
        tgK: Math.round(computeFoxFloryTg(polymer.foxFlory.tgInfK, polymer.foxFlory.kg, 45000) + 2),
      },
      {
        id: 'ff-3',
        mn: 110000,
        tgK: Math.round(computeFoxFloryTg(polymer.foxFlory.tgInfK, polymer.foxFlory.kg, 110000) - 1),
      },
    ]);
  }, [polymer]);

  // Simulate FRP Kinetics
  const frpSteps = useMemo(
    () =>
      simulateFreeRadicalPolymerization(
        {
          m0,
          i0,
          tempK: tempC + 273.15,
          refTempK: polymer.kinetics.referenceTempK,
          kpRef: polymer.kinetics.kp,
          ktRef: polymer.kinetics.kt,
          kdRef: polymer.kinetics.kd,
          f: polymer.kinetics.f,
          alphaCoupling,
          durationMin: 120,
        },
        48
      ),
    [m0, i0, tempC, alphaCoupling, polymer]
  );

  const initialFrp = frpSteps[0];
  const finalFrp = frpSteps[frpSteps.length - 1];

  // Interpolate simulated conversion at any timeMin
  const getSimulatedConversionAt = (timeMin: number) => {
    const clamped = Math.max(0, Math.min(120, timeMin));
    const exactIdx = (clamped / 120) * (frpSteps.length - 1);
    const low = Math.floor(exactIdx);
    const high = Math.min(frpSteps.length - 1, Math.ceil(exactIdx));
    const frac = exactIdx - low;
    return (
      frpSteps[low].conversionPct * (1 - frac) + frpSteps[high].conversionPct * frac
    );
  };

  const frpMae = useMemo(() => {
    if (analyticalFrpPoints.length === 0) return 0;
    const sum = analyticalFrpPoints.reduce(
      (acc, pt) => acc + Math.abs(pt.conversionPct - getSimulatedConversionAt(pt.timeMin)),
      0
    );
    return sum / analyticalFrpPoints.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticalFrpPoints, frpSteps]);

  // Animated 2D Free-Radical Chain Growth Canvas
  useEffect(() => {
    const canvas = frpCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = canvas.parentElement?.clientWidth || 520);
    const h = (canvas.height = 240);

    interface MonomerDot {
      x: number;
      y: number;
      vx: number;
      vy: number;
      consumed: boolean;
    }

    interface GrowingChain {
      nodes: Array<{ x: number; y: number }>;
      angle: number;
      active: boolean;
      speed: number;
    }

    const monomers: MonomerDot[] = Array.from({ length: 75 }, () => ({
      x: 20 + Math.random() * (w - 40),
      y: 20 + Math.random() * (h - 40),
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.4,
      consumed: false,
    }));

    const chainCount = Math.max(3, Math.min(10, Math.round(i0 * 140)));
    const chains: GrowingChain[] = Array.from({ length: chainCount }, () => ({
      nodes: [{ x: 40 + Math.random() * (w - 80), y: 40 + Math.random() * (h - 80) }],
      angle: Math.random() * Math.PI * 2,
      active: true,
      speed: 0.7 + (tempC + 50) / 140,
    }));

    let rafId = 0;
    let tickCount = 0;

    const draw = () => {
      ctx.fillStyle = '#070E1A';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.06)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 36) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }

      if (simPlaying) {
        tickCount++;
        for (const m of monomers) {
          if (m.consumed) continue;
          m.x += m.vx;
          m.y += m.vy;
          if (m.x < 12 || m.x > w - 12) m.vx *= -1;
          if (m.y < 12 || m.y > h - 12) m.vy *= -1;
        }

        if (tickCount % 6 === 0) {
          for (const ch of chains) {
            if (!ch.active) continue;
            const head = ch.nodes[ch.nodes.length - 1];
            let nearestIdx = -1;
            let bestDist = 55;
            monomers.forEach((m, idx) => {
              if (m.consumed) return;
              const d = Math.hypot(m.x - head.x, m.y - head.y);
              if (d < bestDist) {
                bestDist = d;
                nearestIdx = idx;
              }
            });

            if (nearestIdx !== -1) {
              const target = monomers[nearestIdx];
              ch.angle = Math.atan2(target.y - head.y, target.x - head.x);
              if (bestDist < 16 && ch.nodes.length < 28) {
                target.consumed = true;
                ch.nodes.push({ x: target.x, y: target.y });
              } else if (ch.nodes.length < 28) {
                const nx = Math.max(14, Math.min(w - 14, head.x + Math.cos(ch.angle) * 9 * ch.speed));
                const ny = Math.max(14, Math.min(h - 14, head.y + Math.sin(ch.angle) * 9 * ch.speed));
                ch.nodes.push({ x: nx, y: ny });
              }
            } else {
              ch.angle += (Math.random() - 0.5) * 0.9;
              const nx = Math.max(14, Math.min(w - 14, head.x + Math.cos(ch.angle) * 8));
              const ny = Math.max(14, Math.min(h - 14, head.y + Math.sin(ch.angle) * 8));
              if (ch.nodes.length < 26) ch.nodes.push({ x: nx, y: ny });
              else ch.active = false;
            }
          }
        }
      }

      for (const m of monomers) {
        if (m.consumed) continue;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();
      }

      for (const ch of chains) {
        ctx.beginPath();
        ctx.strokeStyle = ch.active ? '#22D3EE' : '#94A3B8';
        ctx.lineWidth = 2.4;
        ch.nodes.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        const tip = ch.nodes[ch.nodes.length - 1];
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, ch.active ? 4.8 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = ch.active ? '#F59E0B' : '#CBD5E1';
        ctx.fill();
      }

      if (simPlaying) {
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [i0, tempC, simPlaying, simResetKey]);

  // Coupling vs Disproportionation Quantitative Comparison
  const nu = initialFrp?.kineticChainLength || 250;
  const xnBlended = (2 / (2 - alphaCoupling)) * nu;
  const xwBlended = (2 + alphaCoupling) * nu;
  const pdiTheory = 2 - (alphaCoupling * alphaCoupling) / 2;

  // ML Prediction
  const mlPred = useMemo(
    () =>
      predictPolymerPropertiesML({
        monomerMolarMass: polymer.monomerMolarMass,
        rigidityIndex: rigidity,
        cohesiveEnergyDensity: ced,
        hBondIndex: hBond,
        crosslinkDensity: crosslink,
        sideChainBulk: sideBulk,
        mn: mlMn,
        pdi: mlPdi,
      }),
    [polymer.monomerMolarMass, rigidity, ced, hBond, crosslink, sideBulk, mlMn, mlPdi]
  );

  // Fox-Flory curve data
  const ffPoints = useMemo(() => {
    const mnValues = [2000, 3500, 5000, 7500, 10000, 15000, 22000, 35000, 55000, 85000, 120000, 160000];
    return mnValues.map((mn) => ({
      mn,
      tgK: computeFoxFloryTg(ffTgInfK, ffKg, mn),
    }));
  }, [ffTgInfK, ffKg]);

  const ffProbeTgK = computeFoxFloryTg(ffTgInfK, ffKg, ffProbeMn);

  const ffW = 560;
  const ffH = 260;
  const ffPad = { left: 56, right: 24, top: 22, bottom: 42 };
  const ffPlotW = ffW - ffPad.left - ffPad.right;
  const ffPlotH = ffH - ffPad.top - ffPad.bottom;
  const allFfTgs = [
    ...ffPoints.map((p) => p.tgK),
    ...(showAnalyticalFf ? analyticalFfPoints.map((a) => a.tgK) : []),
  ];
  const ffMinTg = Math.min(...allFfTgs) - 14;
  const ffMaxTg = Math.max(ffTgInfK, ...allFfTgs) + 12;

  const mapFfX = (mn: number) =>
    ffPad.left + ((Math.max(2000, Math.min(160000, mn)) - 2000) / (160000 - 2000)) * ffPlotW;
  const mapFfY = (tgK: number) =>
    ffPad.top + ffPlotH - ((tgK - ffMinTg) / Math.max(10, ffMaxTg - ffMinTg)) * ffPlotH;

  const ffPath = ffPoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapFfX(p.mn).toFixed(1)} ${mapFfY(p.tgK).toFixed(1)}`)
    .join(' ');

  const ffMaeK = useMemo(() => {
    if (analyticalFfPoints.length === 0) return 0;
    const sum = analyticalFfPoints.reduce(
      (acc, pt) => acc + Math.abs(pt.tgK - computeFoxFloryTg(ffTgInfK, ffKg, pt.mn)),
      0
    );
    return sum / analyticalFfPoints.length;
  }, [analyticalFfPoints, ffTgInfK, ffKg]);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="font-semibold text-cyan-400">Kinetics, Fox–Flory &amp; Machine Learning</span>
              <span aria-hidden="true">·</span>
              <span>{polymer.name}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
              PDI/Tg Correlations, Free-Radical Simulation &amp; Machine Learning
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0B1424] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Molecular Weights &amp; MWD</span>
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Go to Overview</span>
            </button>
          </div>
        </div>

        {/* How Polymer Structure & Properties Affect PDI and Tg */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-white">
            How Polymer Structure &amp; Properties Affect PDI and Tg
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                {polymer.shortName} PDI Behavior
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {polymer.pdiTgNotes.pdiEffect}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                {polymer.shortName} Tg Drivers
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {polymer.pdiTgNotes.tgEffect}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Primary Structural Drivers
              </div>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {polymer.pdiTgNotes.structuralDrivers.map((d, i) => (
                  <li key={i} className="font-mono text-xs">
                    0{i + 1}. {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-[#0B1424]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-[#070E1A] font-mono text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Molecular Property</th>
                  <th className="px-4 py-3">Impact on Polydispersity (PDI)</th>
                  <th className="px-4 py-3">Impact on Glass Transition (Tg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {PROPERTY_IMPACT_MATRIX.map((row) => (
                  <tr key={row.factor}>
                    <td className="px-4 py-3 font-semibold text-white">{row.factor}</td>
                    <td className="px-4 py-3">{row.pdiEffect}</td>
                    <td className="px-4 py-3">{row.tgEffect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Free-Radical Polymerization Simulator + Analytical Conversion Comparison */}
        <section className="mt-10 rounded-xl border border-slate-800 bg-[#0B1424] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Free-Radical Polymerization (FRP) Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Steady-state radical kinetics: Rₚ = kₚ[M](f·k_d[I]/kₜ)^(1/2) · Amber tips = active radicals (M·), Cyan = free monomers
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAnalyticalFrp((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-mono cursor-pointer ${
                  showAnalyticalFrp
                    ? 'border-amber-400/50 bg-amber-950/40 text-amber-300'
                    : 'border-slate-700 bg-[#070E1A] text-slate-400'
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                <span>{showAnalyticalFrp ? 'Analytical ON' : 'Analytical OFF'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSimPlaying((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#070E1A] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500 cursor-pointer"
              >
                {simPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{simPlaying ? 'Pause' : 'Run'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSimResetKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#070E1A] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Re-seed Reactor</span>
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Live Particle Vessel + Parameter Sliders */}
            <div className="space-y-4 lg:col-span-6">
              <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#070E1A]">
                <canvas ref={frpCanvasRef} className="block h-[240px] w-full" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs font-mono">
                <label className="rounded border border-slate-800 bg-[#070E1A] p-3">
                  <div className="text-slate-400">[M]₀: {m0.toFixed(1)} mol/L</div>
                  <input
                    type="range"
                    min={1.0}
                    max={8.0}
                    step={0.5}
                    value={m0}
                    onChange={(e) => setM0(Number(e.target.value))}
                    className="mt-2 w-full accent-cyan-400 cursor-pointer"
                  />
                </label>
                <label className="rounded border border-slate-800 bg-[#070E1A] p-3">
                  <div className="text-slate-400">[I]₀: {i0.toFixed(3)} mol/L</div>
                  <input
                    type="range"
                    min={0.005}
                    max={0.1}
                    step={0.005}
                    value={i0}
                    onChange={(e) => setI0(Number(e.target.value))}
                    className="mt-2 w-full accent-cyan-400 cursor-pointer"
                  />
                </label>
                <label className="rounded border border-slate-800 bg-[#070E1A] p-3">
                  <div className="text-slate-400">Temp: {tempC} °C</div>
                  <input
                    type="range"
                    min={20}
                    max={140}
                    step={5}
                    value={tempC}
                    onChange={(e) => setTempC(Number(e.target.value))}
                    className="mt-2 w-full accent-cyan-400 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Conversion Graph + Analytical Value Comparison */}
            <div className="flex flex-col justify-between lg:col-span-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono">
                <div className="rounded border border-slate-800 bg-[#070E1A] p-3">
                  <div className="text-[10px] text-slate-400 uppercase">120m Conversion</div>
                  <div className="mt-1 text-lg font-bold text-cyan-300 tabular-nums">
                    {finalFrp.conversionPct.toFixed(1)}%
                  </div>
                </div>
                <div className="rounded border border-slate-800 bg-[#070E1A] p-3">
                  <div className="text-[10px] text-slate-400 uppercase">Initial Rate Rₚ</div>
                  <div className="mt-1 text-lg font-bold text-white tabular-nums">
                    {initialFrp.rp.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500">mol/L·min</div>
                </div>
                <div className="rounded border border-slate-800 bg-[#070E1A] p-3">
                  <div className="text-[10px] text-slate-400 uppercase">Chain Length ν</div>
                  <div className="mt-1 text-lg font-bold text-white tabular-nums">
                    {Math.round(initialFrp.kineticChainLength)}
                  </div>
                </div>
                <div className="rounded border border-slate-800 bg-[#070E1A] p-3">
                  <div className="text-[10px] text-slate-400 uppercase">Degree X̄ₙ</div>
                  <div className="mt-1 text-lg font-bold text-amber-300 tabular-nums">
                    {Math.round(initialFrp.xn)}
                  </div>
                </div>
              </div>

              {/* Conversion p(t) SVG Chart with Analytical Overlay */}
              <div className="mt-4">
                <svg
                  viewBox="0 0 520 190"
                  className="w-full"
                  role="img"
                  aria-label="FRP conversion curve compared with analytical data points"
                >
                  <line x1="46" y1="16" x2="46" y2="154" stroke="#475569" strokeWidth="1.5" />
                  <line x1="46" y1="154" x2="500" y2="154" stroke="#475569" strokeWidth="1.5" />
                  {[0, 50, 100].map((pct) => {
                    const y = 154 - (pct / 100) * 134;
                    return (
                      <g key={pct}>
                        <line x1="46" y1={y} x2="500" y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
                        <text x="38" y={y + 3} textAnchor="end" className="fill-slate-400 font-mono text-[10px]">
                          {pct}%
                        </text>
                      </g>
                    );
                  })}
                  <path
                    d={frpSteps
                      .map((s, idx) => {
                        const x = 46 + (s.timeMin / 120) * 454;
                        const y = 154 - (s.conversionPct / 100) * 134;
                        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="2.5"
                  />

                  {/* Analytical Experimental Points */}
                  {showAnalyticalFrp && analyticalFrpPoints.length > 0 && (
                    <g>
                      <path
                        d={[...analyticalFrpPoints]
                          .sort((a, b) => a.timeMin - b.timeMin)
                          .map((pt, idx) => {
                            const x = 46 + (Math.max(0, Math.min(120, pt.timeMin)) / 120) * 454;
                            const y = 154 - (Math.max(0, Math.min(100, pt.conversionPct)) / 100) * 134;
                            return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#FBBF24"
                        strokeWidth="1.8"
                        strokeDasharray="5 4"
                      />
                      {analyticalFrpPoints.map((pt) => {
                        const x = 46 + (Math.max(0, Math.min(120, pt.timeMin)) / 120) * 454;
                        const y = 154 - (Math.max(0, Math.min(100, pt.conversionPct)) / 100) * 134;
                        return (
                          <polygon
                            key={pt.id}
                            points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`}
                            fill="#FBBF24"
                            stroke="#050B14"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </g>
                  )}

                  <text x="273" y="180" textAnchor="middle" className="fill-slate-400 font-mono text-[10px]">
                    Reaction Time (0 – 120 min) · Cyan: Simulated · Amber: Analytical
                  </text>
                </svg>
              </div>

              {/* Analytical Conversion Input Table */}
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-[#070E1A] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-amber-300">
                    Analytical NMR / Gravimetric Conversion Points (MAE: {frpMae.toFixed(2)}%)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAnalyticalFrpPoints((prev) => [
                        ...prev,
                        { id: `frp-${Date.now()}`, timeMin: 80, conversionPct: 55 },
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#0B1424] px-2 py-0.5 text-[10px] text-cyan-300 hover:border-cyan-400 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Point</span>
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 text-[11px] font-mono">
                  {analyticalFrpPoints.map((pt) => {
                    const simVal = getSimulatedConversionAt(pt.timeMin);
                    const err = pt.conversionPct - simVal;
                    return (
                      <div
                        key={pt.id}
                        className="flex items-center justify-between gap-1.5 rounded border border-slate-800 bg-[#0B1424] px-2 py-1.5"
                      >
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={120}
                            value={pt.timeMin}
                            onChange={(e) =>
                              setAnalyticalFrpPoints((prev) =>
                                prev.map((x) =>
                                  x.id === pt.id ? { ...x, timeMin: Number(e.target.value) } : x
                                )
                              )
                            }
                            aria-label="Analytical time in minutes"
                            className="w-11 rounded border border-slate-700 bg-[#070E1A] px-1 py-0.5 text-white tabular-nums"
                          />
                          <span className="text-slate-500">m</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={pt.conversionPct}
                            onChange={(e) =>
                              setAnalyticalFrpPoints((prev) =>
                                prev.map((x) =>
                                  x.id === pt.id
                                    ? { ...x, conversionPct: Number(e.target.value) }
                                    : x
                                )
                              )
                            }
                            aria-label="Analytical conversion percent"
                            className="w-12 rounded border border-slate-700 bg-[#070E1A] px-1 py-0.5 text-amber-300 tabular-nums"
                          />
                          <span className="text-slate-500">%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            Δ{err >= 0 ? `+${err.toFixed(1)}` : err.toFixed(1)}
                          </span>
                          {analyticalFrpPoints.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setAnalyticalFrpPoints((prev) => prev.filter((x) => x.id !== pt.id))
                              }
                              className="text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Termination Mechanism: Coupling vs Disproportionation */}
        <section className="mt-10 rounded-xl border border-slate-800 bg-[#0B1424] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Termination Mechanism: Coupling vs. Disproportionation
              </h2>
              <p className="text-xs text-slate-400">
                Adjust coupling fraction α to observe how termination pathway alters chain ends, X̄ₙ, and theoretical PDI
              </p>
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#070E1A] px-4 py-2 font-mono text-xs text-slate-200">
              <span>Coupling Fraction α = {(alphaCoupling * 100).toFixed(0)}%</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={alphaCoupling}
                onChange={(e) => setAlphaCoupling(Number(e.target.value))}
                className="w-32 accent-cyan-400 cursor-pointer"
              />
            </label>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#070E1A] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-white">
                  Coupling (Combination, α → 1)
                </h3>
                <span className="font-mono text-xs font-semibold text-cyan-400">PDI Limit = 1.50</span>
              </div>
              <div className="mt-3 rounded border border-slate-800 bg-[#0B1424] px-3.5 py-2.5 font-mono text-xs text-slate-200">
                Pₘ· + ·Pₙ → Pₘ₋Pₙ (Single dead chain, 2 initiator end-groups)
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
                <li>
                  • Degree of Polymerization:{' '}
                  <strong className="font-mono text-white">X̄ₙ = 2ν = {Math.round(2 * nu)}</strong>
                </li>
                <li>• Forms a head-to-head covalent C–C bond junction; zero unsaturated vinyl ends.</li>
                <li>• Dominant in polystyrene and acrylonitrile terminations (low steric hindrance).</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#070E1A] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-white">
                  Disproportionation (H-Abstraction, α → 0)
                </h3>
                <span className="font-mono text-xs font-semibold text-amber-400">PDI Limit = 2.00</span>
              </div>
              <div className="mt-3 rounded border border-slate-800 bg-[#0B1424] px-3.5 py-2.5 font-mono text-xs text-slate-200">
                Pₘ· + ·Pₙ → Pₘ(=) + Pₙ(–H) (Two dead chains, 1 alkene end)
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
                <li>
                  • Degree of Polymerization:{' '}
                  <strong className="font-mono text-white">X̄ₙ = ν = {Math.round(nu)}</strong>
                </li>
                <li>• Generates 50% terminal C=C double bonds susceptible to thermal unzipping/UV attack.</li>
                <li>• Dominant in PMMA and α-methyl bulky methacrylates due to steric crowding.</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-cyan-500/30 bg-cyan-950/25 p-4 sm:grid-cols-3 font-mono text-xs tabular-nums">
            <div>
              <span className="text-slate-400">Blended X̄ₙ = 2ν/(2−α): </span>
              <strong className="text-white">{Math.round(xnBlended)} units</strong>
            </div>
            <div>
              <span className="text-slate-400">Blended X̄w = (2+α)ν: </span>
              <strong className="text-white">{Math.round(xwBlended)} units</strong>
            </div>
            <div>
              <span className="text-slate-400">Theoretical PDI (2 − α²/2): </span>
              <strong className="text-cyan-300">{pdiTheory.toFixed(3)}</strong>
            </div>
          </div>
        </section>

        {/* Machine Learning Predictor & Fox-Flory Relationship Plot */}
        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ML Predictor */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-6 lg:col-span-6">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <h2 className="font-display text-xl font-bold text-white">
                Machine Learning Property Predictor
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Multi-feature group-contribution &amp; Fox-Flory regression predicting Tg, mechanical strength, and thermal stability
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono tabular-nums">
              <div className="rounded border border-cyan-500/40 bg-cyan-950/30 p-3">
                <div className="text-[10px] text-slate-400 uppercase">Predicted Tg</div>
                <div className="mt-1 text-lg font-bold text-cyan-300">
                  {mlPred.predictedTgC.toFixed(0)} °C
                </div>
                <div className="text-[10px] text-slate-400">{mlPred.predictedTgK.toFixed(0)} K</div>
              </div>
              <div className="rounded border border-slate-800 bg-[#070E1A] p-3">
                <div className="text-[10px] text-slate-400 uppercase">Tensile Str.</div>
                <div className="mt-1 text-lg font-bold text-white">
                  {mlPred.predictedTensileMPa.toFixed(0)}
                </div>
                <div className="text-[10px] text-slate-500">MPa</div>
              </div>
              <div className="rounded border border-slate-800 bg-[#070E1A] p-3">
                <div className="text-[10px] text-slate-400 uppercase">Modulus</div>
                <div className="mt-1 text-lg font-bold text-white">
                  {mlPred.predictedModulusGPa.toFixed(1)}
                </div>
                <div className="text-[10px] text-slate-500">GPa</div>
              </div>
              <div className="rounded border border-slate-800 bg-[#070E1A] p-3">
                <div className="text-[10px] text-slate-400 uppercase">Degrad. T</div>
                <div className="mt-1 text-lg font-bold text-white">
                  {mlPred.predictedThermalDegradationC.toFixed(0)}
                </div>
                <div className="text-[10px] text-slate-500">°C</div>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2 text-slate-400 uppercase text-[11px]">
                <Sliders className="h-3.5 w-3.5" />
                <span>Adjust Molecular Descriptors</span>
              </div>

              {[
                { label: 'Backbone Rigidity', val: rigidity, set: setRigidity, min: 1, max: 10, step: 0.2 },
                { label: 'Cohesive Energy Density (J/cm³)', val: ced, set: setCed, min: 150, max: 850, step: 10 },
                { label: 'H-Bonding Index', val: hBond, set: setHBond, min: 0, max: 5, step: 0.2 },
                { label: 'Crosslink Density', val: crosslink, set: setCrosslink, min: 0, max: 1, step: 0.05 },
                { label: 'Side-Chain Steric Bulk', val: sideBulk, set: setSideBulk, min: 1, max: 10, step: 0.2 },
                { label: 'Mₙ (g/mol)', val: mlMn, set: setMlMn, min: 2000, max: 150000, step: 2000 },
                { label: 'PDI (Mw/Mₙ)', val: mlPdi, set: setMlPdi, min: 1.0, max: 4.0, step: 0.1 },
              ].map((s) => (
                <label key={s.label} className="grid grid-cols-12 items-center gap-2">
                  <span className="col-span-6 truncate">{s.label}</span>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={s.val}
                    onChange={(e) => s.set(Number(e.target.value))}
                    className="col-span-4 accent-cyan-400 cursor-pointer"
                  />
                  <span className="col-span-2 text-right font-semibold text-white tabular-nums">
                    {s.val >= 1000 ? s.val.toLocaleString() : s.val.toFixed(1)}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-5 border-t border-slate-800 pt-4">
              <div className="text-[11px] font-mono uppercase text-slate-400">
                ML Feature Attribution (ΔTg Impact)
              </div>
              <div className="mt-2.5 space-y-2">
                {mlPred.featureContributions.map((fc) => (
                  <div key={fc.feature} className="flex items-center gap-2 text-xs">
                    <span className="w-40 truncate text-slate-400">{fc.feature}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full ${fc.impactK >= 0 ? 'bg-cyan-400' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, fc.importancePct)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono text-[11px] text-slate-200 tabular-nums">
                      {fc.impactK >= 0 ? '+' : ''}
                      {fc.impactK.toFixed(1)} K
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fox-Flory Relationship Plot + Analytical DSC Overlay */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-6 lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  Fox–Flory Relationship Plot
                </h2>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  Tg(Mₙ) = Tg,∞ − K_g / Mₙ · Cyan: Fox–Flory Model · Amber: Analytical DSC
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAnalyticalFf((v) => !v)}
                className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-mono cursor-pointer ${
                  showAnalyticalFf
                    ? 'border-amber-400/50 bg-amber-950/40 text-amber-300'
                    : 'border-slate-700 bg-[#070E1A] text-slate-400'
                }`}
              >
                <FlaskConical className="h-3 w-3" />
                <span>{showAnalyticalFf ? 'Analytical ON' : 'Analytical OFF'}</span>
              </button>
            </div>

            <div className="mt-4">
              <svg
                viewBox={`0 0 ${ffW} ${ffH}`}
                className="w-full overflow-visible"
                role="img"
                aria-label="Fox-Flory relationship plot compared with analytical DSC Tg points"
              >
                <line
                  x1={ffPad.left}
                  y1={mapFfY(ffTgInfK)}
                  x2={ffPad.left + ffPlotW}
                  y2={mapFfY(ffTgInfK)}
                  stroke="#64748B"
                  strokeDasharray="5 4"
                  strokeWidth="1.2"
                />
                <text
                  x={ffPad.left + ffPlotW - 4}
                  y={mapFfY(ffTgInfK) - 6}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  Tg,∞ = {ffTgInfK} K ({(ffTgInfK - 273.15).toFixed(0)} °C)
                </text>

                <line
                  x1={ffPad.left}
                  y1={ffPad.top}
                  x2={ffPad.left}
                  y2={ffPad.top + ffPlotH}
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <line
                  x1={ffPad.left}
                  y1={ffPad.top + ffPlotH}
                  x2={ffPad.left + ffPlotW}
                  y2={ffPad.top + ffPlotH}
                  stroke="#475569"
                  strokeWidth="1.5"
                />

                <path
                  d={ffPath}
                  fill="none"
                  stroke="#22D3EE"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                />

                {/* Analytical DSC Points & Residual Lines */}
                {showAnalyticalFf &&
                  analyticalFfPoints.map((pt) => {
                    const cx = mapFfX(pt.mn);
                    const cyExp = mapFfY(pt.tgK);
                    const cyModel = mapFfY(computeFoxFloryTg(ffTgInfK, ffKg, pt.mn));
                    return (
                      <g key={pt.id}>
                        <line
                          x1={cx}
                          y1={cyModel}
                          x2={cx}
                          y2={cyExp}
                          stroke="#FBBF24"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                        <rect
                          x={cx - 4.5}
                          y={cyExp - 4.5}
                          width="9"
                          height="9"
                          fill="#FBBF24"
                          stroke="#050B14"
                          strokeWidth="1.2"
                        />
                      </g>
                    );
                  })}

                {/* Live Probe Marker */}
                <line
                  x1={mapFfX(ffProbeMn)}
                  y1={ffPad.top}
                  x2={mapFfX(ffProbeMn)}
                  y2={ffPad.top + ffPlotH}
                  stroke="#94A3B8"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <circle
                  cx={mapFfX(ffProbeMn)}
                  cy={mapFfY(ffProbeTgK)}
                  r="6"
                  fill="#22D3EE"
                  stroke="#050B14"
                  strokeWidth="2"
                />

                <text
                  x={ffPad.left + ffPlotW / 2}
                  y={ffH - 6}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[11px]"
                >
                  Number-Average Molecular Weight Mₙ (2,000 – 160,000 g/mol)
                </text>
                <text
                  x={15}
                  y={ffPad.top + ffPlotH / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 15 ${ffPad.top + ffPlotH / 2})`}
                  className="fill-slate-400 font-mono text-[11px]"
                >
                  Tg (Kelvin)
                </text>
              </svg>
            </div>

            {/* Analytical DSC Comparison Input Table */}
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-[#070E1A] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <span className="text-amber-300">
                  Analytical DSC Measurements (MAE: {ffMaeK.toFixed(1)} K)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setAnalyticalFfPoints((prev) => [
                      ...prev,
                      {
                        id: `ff-${Date.now()}`,
                        mn: 65000,
                        tgK: Math.round(computeFoxFloryTg(ffTgInfK, ffKg, 65000)),
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#0B1424] px-2 py-0.5 text-[10px] text-cyan-300 hover:border-cyan-400 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add DSC Point</span>
                </button>
              </div>

              <div className="mt-2 space-y-1.5 text-[11px] font-mono">
                {analyticalFfPoints.map((pt) => {
                  const modelTg = computeFoxFloryTg(ffTgInfK, ffKg, pt.mn);
                  const deltaTg = pt.tgK - modelTg;
                  return (
                    <div
                      key={pt.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-[#0B1424] px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Mₙ</span>
                        <input
                          type="number"
                          min={2000}
                          max={160000}
                          step={1000}
                          value={pt.mn}
                          onChange={(e) =>
                            setAnalyticalFfPoints((prev) =>
                              prev.map((x) =>
                                x.id === pt.id ? { ...x, mn: Number(e.target.value) } : x
                              )
                            )
                          }
                          aria-label="Analytical Mn value"
                          className="w-20 rounded border border-slate-700 bg-[#070E1A] px-1.5 py-0.5 text-white tabular-nums"
                        />
                        <span className="text-slate-400">Tg (K)</span>
                        <input
                          type="number"
                          min={120}
                          max={700}
                          step={1}
                          value={pt.tgK}
                          onChange={(e) =>
                            setAnalyticalFfPoints((prev) =>
                              prev.map((x) =>
                                x.id === pt.id ? { ...x, tgK: Number(e.target.value) } : x
                              )
                            )
                          }
                          aria-label="Analytical Tg in Kelvin"
                          className="w-16 rounded border border-slate-700 bg-[#070E1A] px-1.5 py-0.5 text-amber-300 tabular-nums"
                        />
                      </div>
                      <div className="flex items-center gap-2 tabular-nums">
                        <span className="text-slate-400">Model: {modelTg.toFixed(1)} K</span>
                        <span className="text-amber-300">
                          Δ{deltaTg >= 0 ? `+${deltaTg.toFixed(1)}` : deltaTg.toFixed(1)} K
                        </span>
                        {analyticalFfPoints.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setAnalyticalFfPoints((prev) => prev.filter((x) => x.id !== pt.id))
                            }
                            className="text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Fox-Flory Sliders */}
            <div className="mt-4 space-y-2.5 border-t border-slate-800 pt-4 text-xs font-mono">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded border border-slate-800 bg-[#070E1A] p-2.5 tabular-nums">
                  <div className="text-[10px] text-slate-400 uppercase">Probe Tg(Mₙ)</div>
                  <div className="mt-1 text-base font-bold text-cyan-300">
                    {(ffProbeTgK - 273.15).toFixed(1)} °C
                  </div>
                  <div className="text-[10px] text-slate-400">{ffProbeTgK.toFixed(1)} K</div>
                </div>
                <div className="rounded border border-slate-800 bg-[#070E1A] p-2.5 tabular-nums">
                  <div className="text-[10px] text-slate-400 uppercase">Free-Vol Drop ΔTg</div>
                  <div className="mt-1 text-base font-bold text-amber-300">
                    -{(ffTgInfK - ffProbeTgK).toFixed(1)} K
                  </div>
                </div>
                <div className="rounded border border-slate-800 bg-[#070E1A] p-2.5 tabular-nums">
                  <div className="text-[10px] text-slate-400 uppercase">Probe Mₙ</div>
                  <div className="mt-1 text-base font-bold text-white">
                    {ffProbeMn.toLocaleString()}
                  </div>
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 text-slate-300">
                <span>Probe Mₙ: {ffProbeMn.toLocaleString()} g/mol</span>
                <input
                  type="range"
                  min={2000}
                  max={160000}
                  step={1000}
                  value={ffProbeMn}
                  onChange={(e) => setFfProbeMn(Number(e.target.value))}
                  className="w-40 accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 text-slate-300">
                <span>Asymptotic Tg,∞: {ffTgInfK} K</span>
                <input
                  type="range"
                  min={220}
                  max={650}
                  step={5}
                  value={ffTgInfK}
                  onChange={(e) => setFfTgInfK(Number(e.target.value))}
                  className="w-40 accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 text-slate-300">
                <span>Fox–Flory Constant K_g: {ffKg.toLocaleString()}</span>
                <input
                  type="range"
                  min={15000}
                  max={150000}
                  step={2500}
                  value={ffKg}
                  onChange={(e) => setFfKg(Number(e.target.value))}
                  className="w-40 accent-cyan-400 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};
