import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeftRight, GitCompare, ShieldAlert, Atom } from 'lucide-react';
import { PolymerData } from '../types/polymer';
import { calculateMolecularWeights, computeFoxFloryTg } from '../utils/polymerMath';

interface ComparePolymersPageProps {
  polymers: PolymerData[];
  initialPolymerA: PolymerData;
  onSelectForDeepDive: (polymer: PolymerData) => void;
}

const RADAR_AXES: Array<{ key: keyof PolymerData['radarProfile']; label: string }> = [
  { key: 'thermalStability', label: 'THERMAL' },
  { key: 'mechanicalStrength', label: 'STRENGTH' },
  { key: 'chemicalResistance', label: 'CHEM RESIST' },
  { key: 'conductivity', label: 'CONDUCTIVITY' },
  { key: 'biocompatibility', label: 'BIOCOMPAT' },
  { key: 'processability', label: 'PROCESS' },
];

export const ComparePolymersPage: React.FC<ComparePolymersPageProps> = ({
  polymers,
  initialPolymerA,
  onSelectForDeepDive,
}) => {
  const [idA, setIdA] = useState<string>(initialPolymerA.id);
  const [idB, setIdB] = useState<string>(() => {
    const alt = polymers.find((p) => p.id !== initialPolymerA.id);
    return alt ? alt.id : initialPolymerA.id;
  });

  const polymerA = useMemo(
    () => polymers.find((p) => p.id === idA) || polymers[0],
    [polymers, idA]
  );
  const polymerB = useMemo(
    () => polymers.find((p) => p.id === idB) || polymers[1] || polymers[0],
    [polymers, idB]
  );

  const mwA = useMemo(
    () =>
      calculateMolecularWeights(
        polymerA.defaultBins,
        polymerA.markHouwinkK,
        polymerA.markHouwinkA
      ),
    [polymerA]
  );
  const mwB = useMemo(
    () =>
      calculateMolecularWeights(
        polymerB.defaultBins,
        polymerB.markHouwinkK,
        polymerB.markHouwinkA
      ),
    [polymerB]
  );

  const handleSwap = () => {
    setIdA(polymerB.id);
    setIdB(polymerA.id);
  };

  // Radar helper
  const cx = 150;
  const cy = 150;
  const maxR = 102;
  const getRadarPoint = (idx: number, val: number) => {
    const angle = (Math.PI * 2 * idx) / RADAR_AXES.length - Math.PI / 2;
    const r = (Math.max(4, Math.min(100, val)) / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const polyPointsA = RADAR_AXES.map((a, i) => {
    const p = getRadarPoint(i, polymerA.radarProfile[a.key]);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  const polyPointsB = RADAR_AXES.map((a, i) => {
    const p = getRadarPoint(i, polymerB.radarProfile[a.key]);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  // Dual Fox-Flory Overlay Chart
  const ffW = 540;
  const ffH = 250;
  const ffPad = { left: 54, right: 20, top: 20, bottom: 40 };
  const ffPlotW = ffW - ffPad.left - ffPad.right;
  const ffPlotH = ffH - ffPad.top - ffPad.bottom;
  const mnGrid = [2500, 5000, 10000, 18000, 30000, 50000, 80000, 120000, 160000];

  const ffSeriesA = mnGrid.map((mn) => ({
    mn,
    tgK: computeFoxFloryTg(polymerA.foxFlory.tgInfK, polymerA.foxFlory.kg, mn),
  }));
  const ffSeriesB = mnGrid.map((mn) => ({
    mn,
    tgK: computeFoxFloryTg(polymerB.foxFlory.tgInfK, polymerB.foxFlory.kg, mn),
  }));

  const minTg = Math.min(...ffSeriesA.map((d) => d.tgK), ...ffSeriesB.map((d) => d.tgK)) - 15;
  const maxTg = Math.max(polymerA.foxFlory.tgInfK, polymerB.foxFlory.tgInfK) + 15;

  const mapFfX = (mn: number) => ffPad.left + ((mn - 2500) / (160000 - 2500)) * ffPlotW;
  const mapFfY = (tgK: number) =>
    ffPad.top + ffPlotH - ((tgK - minTg) / Math.max(20, maxTg - minTg)) * ffPlotH;

  const ffPathA = ffSeriesA
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapFfX(p.mn).toFixed(1)} ${mapFfY(p.tgK).toFixed(1)}`)
    .join(' ');
  const ffPathB = ffSeriesB
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapFfX(p.mn).toFixed(1)} ${mapFfY(p.tgK).toFixed(1)}`)
    .join(' ');

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Comparative Macromolecular Analysis
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
              Compare Two Polymers Side by Side
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Contrast chemical structure, thermophysical properties, MWD statistics, Fox-Flory curves, and biological safety.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <span className="text-cyan-300">{polymerA.shortName}</span>
            <span className="mx-2 text-slate-600">vs</span>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-amber-300">{polymerB.shortName}</span>
          </div>
        </div>

        {/* Dual Selector Bar */}
        <div className="mt-6 grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-800 bg-[#0B1424] p-5 md:grid-cols-11">
          <div className="md:col-span-5">
            <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400">
              Polymer A (Cyan Curve)
            </label>
            <select
              value={polymerA.id}
              onChange={(e) => setIdA(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#070E1A] px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {polymers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center md:col-span-1">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap Polymer A and Polymer B"
              className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#070E1A] text-slate-300 transition-colors hover:border-cyan-500 hover:text-cyan-300 cursor-pointer"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-mono uppercase tracking-wider text-amber-400">
              Polymer B (Amber Curve)
            </label>
            <select
              value={polymerB.id}
              onChange={(e) => setIdB(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#070E1A] px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            >
              {polymers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Formula & Identity Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            { poly: polymerA, mw: mwA, accent: 'border-cyan-500/40', titleColor: 'text-cyan-300', badge: 'Polymer A' },
            { poly: polymerB, mw: mwB, accent: 'border-amber-500/40', titleColor: 'text-amber-300', badge: 'Polymer B' },
          ].map(({ poly, mw, accent, titleColor, badge }) => (
            <div key={badge} className={`rounded-xl border ${accent} bg-[#0B1424] p-5`}>
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className={titleColor}>{badge} · {poly.category}</span>
                <span className="text-slate-400">CAS {poly.casNumber}</span>
              </div>
              <h2 className="mt-1.5 font-display text-xl font-bold text-white">{poly.name}</h2>
              <div className="mt-2 font-mono text-sm text-slate-200">{poly.repeatUnitFormula}</div>
              <p className="mt-2 text-xs text-slate-400">{poly.polymerizationType}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs font-mono">
                <span className="text-slate-300 tabular-nums">
                  M₀ = {poly.monomerMolarMass.toFixed(2)} g/mol · Mₙ ≈ {Math.round(mw.mn).toLocaleString()} · PDI {mw.pdi.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectForDeepDive(poly)}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  <Atom className="h-3.5 w-3.5" />
                  <span>Open in 3D Lab →</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dual Overlay Visual Charts: Radar & Fox-Flory */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Dual Radar Comparison */}
          <div className="flex flex-col items-center justify-between rounded-xl border border-slate-800 bg-[#0B1424] p-5 lg:col-span-5">
            <div className="flex w-full items-center justify-between">
              <h3 className="font-display text-base font-bold text-white">
                Performance Radar Overlay
              </h3>
              <GitCompare className="h-4 w-4 text-cyan-400" />
            </div>

            <svg viewBox="0 0 300 300" className="my-2 h-64 w-64">
              {[25, 50, 75, 100].map((level) => {
                const pts = RADAR_AXES.map((_, idx) => {
                  const p = getRadarPoint(idx, level);
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                }).join(' ');
                return (
                  <polygon
                    key={level}
                    points={pts}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.16)"
                    strokeWidth="1"
                  />
                );
              })}
              {RADAR_AXES.map((axis, idx) => {
                const outer = getRadarPoint(idx, 100);
                const lbl = getRadarPoint(idx, 122);
                return (
                  <g key={axis.key}>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="rgba(148, 163, 184, 0.2)"
                      strokeWidth="1"
                    />
                    <text
                      x={lbl.x}
                      y={lbl.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-400 font-mono text-[9px] font-semibold"
                    >
                      {axis.label}
                    </text>
                  </g>
                );
              })}
              <polygon
                points={polyPointsA}
                fill="rgba(34, 211, 238, 0.18)"
                stroke="#22D3EE"
                strokeWidth="2"
              />
              <polygon
                points={polyPointsB}
                fill="rgba(251, 191, 36, 0.16)"
                stroke="#FBBF24"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
            </svg>

            <div className="flex w-full justify-center gap-6 text-xs font-mono">
              <span className="text-cyan-300">── {polymerA.shortName}</span>
              <span className="text-amber-300">- - {polymerB.shortName}</span>
            </div>
          </div>

          {/* Dual Fox-Flory Tg(Mn) Comparison */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Fox–Flory Tg(Mₙ) Overlay Comparison
                </h3>
                <p className="text-xs text-slate-400">
                  Compares chain-end free volume depression across Mₙ (2,500 – 160,000 g/mol)
                </p>
              </div>
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-cyan-300">{polymerA.shortName} (Tg,∞ {polymerA.foxFlory.tgInfK} K)</span>
                <span className="text-amber-300">{polymerB.shortName} (Tg,∞ {polymerB.foxFlory.tgInfK} K)</span>
              </div>
            </div>

            <div className="mt-3">
              <svg viewBox={`0 0 ${ffW} ${ffH}`} className="w-full overflow-visible">
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
                {[0.25, 0.5, 0.75].map((t) => {
                  const y = ffPad.top + ffPlotH * t;
                  const tgVal = maxTg - t * (maxTg - minTg);
                  return (
                    <g key={t}>
                      <line
                        x1={ffPad.left}
                        y1={y}
                        x2={ffPad.left + ffPlotW}
                        y2={y}
                        stroke="rgba(148, 163, 184, 0.1)"
                      />
                      <text
                        x={ffPad.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-slate-400 font-mono text-[10px]"
                      >
                        {Math.round(tgVal)} K
                      </text>
                    </g>
                  );
                })}
                <path d={ffPathA} fill="none" stroke="#22D3EE" strokeWidth="2.5" />
                <path
                  d={ffPathB}
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
                <text
                  x={ffPad.left + ffPlotW / 2}
                  y={ffH - 6}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  Number-Average Molecular Weight Mₙ (g/mol)
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Full Quantitative Properties & Safety Comparison Table */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-[#0B1424]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-[#070E1A] font-mono text-[11px] uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Engineering / Chemical Metric</th>
                <th className="px-5 py-3.5 text-cyan-300">{polymerA.shortName}</th>
                <th className="px-5 py-3.5 text-amber-300">{polymerB.shortName}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {[
                ['Density', polymerA.physicalProperties.densityGcm3, polymerB.physicalProperties.densityGcm3],
                ['Glass Transition (Tg)', polymerA.physicalProperties.tgC, polymerB.physicalProperties.tgC],
                ['Melting Point (Tm)', polymerA.physicalProperties.tmC, polymerB.physicalProperties.tmC],
                ['Tensile Strength', polymerA.physicalProperties.tensileStrengthMPa, polymerB.physicalProperties.tensileStrengthMPa],
                ["Young's Modulus", polymerA.physicalProperties.youngsModulusGPa, polymerB.physicalProperties.youngsModulusGPa],
                ['Electrical Conductivity', polymerA.physicalProperties.conductivitySCm, polymerB.physicalProperties.conductivitySCm],
                ['Mark-Houwink (K, a)', `K=${polymerA.markHouwinkK}, a=${polymerA.markHouwinkA}`, `K=${polymerB.markHouwinkK}, a=${polymerB.markHouwinkA}`],
                ['Typical Mn / Mw / PDI', `${Math.round(mwA.mn).toLocaleString()} / ${Math.round(mwA.mw).toLocaleString()} / ${mwA.pdi.toFixed(2)}`, `${Math.round(mwB.mn).toLocaleString()} / ${Math.round(mwB.mw).toLocaleString()} / ${mwB.pdi.toFixed(2)}`],
                ['Thermal Degradation', polymerA.chemicalProperties.thermalDegradationC, polymerB.chemicalProperties.thermalDegradationC],
                ['Solubility', polymerA.chemicalProperties.solubility, polymerB.chemicalProperties.solubility],
                ['GHS Hazard Signal', polymerA.precautions.ghsSignal, polymerB.precautions.ghsSignal],
              ].map(([metric, valA, valB]) => (
                <tr key={metric}>
                  <td className="px-5 py-3 font-medium text-slate-400">{metric}</td>
                  <td className="px-5 py-3 font-mono text-slate-100 tabular-nums">{valA}</td>
                  <td className="px-5 py-3 font-mono text-slate-100 tabular-nums">{valB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Biological Hazards Comparison */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            { poly: polymerA, border: 'border-cyan-500/30', label: 'text-cyan-300' },
            { poly: polymerB, border: 'border-amber-500/30', label: 'text-amber-300' },
          ].map(({ poly, border, label }) => (
            <div key={poly.id} className={`rounded-xl border ${border} bg-[#0B1424] p-5`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span className={label}>{poly.shortName}</span>
                <span>Health &amp; Safety Summary</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
                {poly.humanHazards.slice(0, 2).map((h, i) => (
                  <li key={i}>• {h}</li>
                ))}
              </ul>
              <div className="mt-3 border-t border-slate-800 pt-2.5 text-xs text-slate-400">
                <strong className="text-slate-200">Primary PPE:</strong> {poly.precautions.ppe[0]}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
