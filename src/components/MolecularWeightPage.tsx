import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, RefreshCw, FlaskConical } from 'lucide-react';
import { MolecularFractionBin, PolymerData } from '../types/polymer';
import { calculateMolecularWeights, generateSchulzZimmBins } from '../utils/polymerMath';

interface MolecularWeightPageProps {
  polymer: PolymerData;
  onBack: () => void;
  onNext: () => void;
}

export const MolecularWeightPage: React.FC<MolecularWeightPageProps> = ({
  polymer,
  onBack,
  onNext,
}) => {
  const [bins, setBins] = useState<MolecularFractionBin[]>(polymer.defaultBins);
  const [markHouwinkA, setMarkHouwinkA] = useState<number>(polymer.markHouwinkA);
  const [markHouwinkK, setMarkHouwinkK] = useState<number>(polymer.markHouwinkK);
  const [targetMn, setTargetMn] = useState<number>(polymer.foxFlory.typicalMn);
  const [targetPdi, setTargetPdi] = useState<number>(1.8);
  const [logScale, setLogScale] = useState<boolean>(true);
  const [hoverBinIdx, setHoverBinIdx] = useState<number | null>(null);

  // Analytical GPC / Viscometry comparison state
  const initialCalc = useMemo(
    () =>
      calculateMolecularWeights(
        polymer.defaultBins,
        polymer.markHouwinkK,
        polymer.markHouwinkA
      ),
    [polymer]
  );

  const [showAnalytical, setShowAnalytical] = useState<boolean>(true);
  const [analyticalMn, setAnalyticalMn] = useState<number>(Math.round(initialCalc.mn * 0.96));
  const [analyticalMv, setAnalyticalMv] = useState<number>(Math.round(initialCalc.mv * 0.98));
  const [analyticalMw, setAnalyticalMw] = useState<number>(Math.round(initialCalc.mw * 1.03));

  useEffect(() => {
    setBins(polymer.defaultBins);
    setMarkHouwinkA(polymer.markHouwinkA);
    setMarkHouwinkK(polymer.markHouwinkK);
    setTargetMn(polymer.foxFlory.typicalMn);
    const base = calculateMolecularWeights(
      polymer.defaultBins,
      polymer.markHouwinkK,
      polymer.markHouwinkA
    );
    setAnalyticalMn(Math.round(base.mn * 0.96));
    setAnalyticalMv(Math.round(base.mv * 0.98));
    setAnalyticalMw(Math.round(base.mw * 1.03));
  }, [polymer]);

  const sortedBins = useMemo(
    () => [...bins].sort((a, b) => a.molarMass - b.molarMass),
    [bins]
  );

  const results = useMemo(
    () => calculateMolecularWeights(sortedBins, markHouwinkK, markHouwinkA),
    [sortedBins, markHouwinkK, markHouwinkA]
  );

  const analyticalPdi = analyticalMn > 0 ? analyticalMw / analyticalMn : 1;

  const handleBinChange = (id: string, field: 'molarMass' | 'moles', val: number) => {
    setBins((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: Math.max(0.001, val) } : b))
    );
  };

  const handleAddBin = () => {
    const lastM = sortedBins[sortedBins.length - 1]?.molarMass || 50000;
    setBins((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, molarMass: Math.round(lastM * 1.35), moles: 1.0 },
    ]);
  };

  const handleRemoveBin = (id: string) => {
    if (bins.length <= 2) return;
    setBins((prev) => prev.filter((b) => b.id !== id));
  };

  const handleGenerateSchulzZimm = () => {
    setBins(generateSchulzZimmBins(targetMn, targetPdi, 12));
  };

  const chartData = useMemo(() => {
    if (sortedBins.length === 0 || results.totalMass <= 0 || results.totalMoles <= 0) {
      return { points: [], maxW: 1, maxN: 1, minM: 1000, maxM: 100000 };
    }
    const points = sortedBins.map((b) => ({
      molarMass: b.molarMass,
      moles: b.moles,
      nFrac: b.moles / results.totalMoles,
      wFrac: (b.moles * b.molarMass) / results.totalMass,
    }));
    const maxW = Math.max(...points.map((p) => p.wFrac), 0.01);
    const maxN = Math.max(...points.map((p) => p.nFrac), 0.01);
    const minM = Math.min(points[0].molarMass, analyticalMn || Infinity);
    const maxM = Math.max(points[points.length - 1].molarMass, analyticalMw || 0);
    return { points, maxW, maxN, minM, maxM };
  }, [sortedBins, results, analyticalMn, analyticalMw]);

  const svgW = 760;
  const svgH = 330;
  const pad = { left: 60, right: 28, top: 28, bottom: 48 };
  const plotW = svgW - pad.left - pad.right;
  const plotH = svgH - pad.top - pad.bottom;

  const mapX = (m: number) => {
    const minVal = Math.max(100, chartData.minM * 0.85);
    const maxVal = Math.max(minVal + 1000, chartData.maxM * 1.1);
    if (logScale) {
      const lMin = Math.log10(minVal);
      const lMax = Math.log10(maxVal);
      const t = (Math.log10(Math.max(minVal, m)) - lMin) / Math.max(0.01, lMax - lMin);
      return pad.left + t * plotW;
    }
    const t = (m - minVal) / (maxVal - minVal);
    return pad.left + Math.max(0, Math.min(1, t)) * plotW;
  };

  const mapYWeight = (wFrac: number) => {
    const t = wFrac / (chartData.maxW * 1.15);
    return pad.top + plotH - t * plotH;
  };

  const mapYNumber = (nFrac: number) => {
    const t = nFrac / (chartData.maxN * 1.15);
    return pad.top + plotH - t * plotH;
  };

  const weightPath = chartData.points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.molarMass).toFixed(1)} ${mapYWeight(p.wFrac).toFixed(1)}`)
    .join(' ');

  const weightAreaPath =
    chartData.points.length > 0
      ? `${weightPath} L ${mapX(chartData.points[chartData.points.length - 1].molarMass).toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${mapX(chartData.points[0].molarMass).toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`
      : '';

  const numberPath = chartData.points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.molarMass).toFixed(1)} ${mapYNumber(p.nFrac).toFixed(1)}`)
    .join(' ');

  const avgMarkers = [
    { label: 'Mn', value: results.mn, color: '#38BDF8', yOff: 14 },
    { label: 'Mv', value: results.mv, color: '#2DD4BF', yOff: 28 },
    { label: 'Mw', value: results.mw, color: '#FBBF24', yOff: 42 },
    { label: 'Mz', value: results.mz, color: '#A78BFA', yOff: 56 },
  ];

  const analyticalMarkers = [
    { label: 'Mn(exp)', value: analyticalMn, color: '#FB7185', yOff: 76 },
    { label: 'Mv(exp)', value: analyticalMv, color: '#F59E0B', yOff: 90 },
    { label: 'Mw(exp)', value: analyticalMw, color: '#34D399', yOff: 104 },
  ];

  const pctDiff = (exp: number, calc: number) =>
    calc > 0 ? (((exp - calc) / calc) * 100).toFixed(2) : '0.00';

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
              <span className="font-semibold text-cyan-400">Molecular Weight &amp; Distribution Analysis</span>
              <span aria-hidden="true">·</span>
              <span>{polymer.name}</span>
              <span aria-hidden="true">·</span>
              <span>Mark-Houwink a = {markHouwinkA.toFixed(2)}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
              Molecular Weight Calculator &amp; Distribution (MWD)
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0B1424] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Properties &amp; Safety</span>
            </button>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Kinetics, ML &amp; Fox-Flory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Calculated Molecular Weight KPIs */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-white">
            Polymer Molecular Weight Averages (Mₙ, Mᵥ, Mw, Mz)
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                label: 'Number Average (Mₙ)',
                value: Math.round(results.mn).toLocaleString(),
                unit: 'g/mol',
                formula: 'Σ(NᵢMᵢ) / ΣNᵢ',
                accent: 'text-sky-400',
              },
              {
                label: 'Viscosity Average (Mᵥ)',
                value: Math.round(results.mv).toLocaleString(),
                unit: 'g/mol',
                formula: '[Σ(NᵢMᵢ¹⁺ᵃ) / Σ(NᵢMᵢ)]^(1/a)',
                accent: 'text-teal-400',
              },
              {
                label: 'Weight Average (Mw)',
                value: Math.round(results.mw).toLocaleString(),
                unit: 'g/mol',
                formula: 'Σ(NᵢMᵢ²) / Σ(NᵢMᵢ)',
                accent: 'text-amber-400',
              },
              {
                label: 'Polydispersity (PDI)',
                value: results.pdi.toFixed(3),
                unit: 'Mw / Mₙ',
                formula: 'Monodisperse = 1.000',
                accent: 'text-white',
              },
              {
                label: 'Intrinsic Viscosity [η]',
                value: results.intrinsicViscosity.toFixed(1),
                unit: 'mL/g',
                formula: 'K · Mᵥᵃ',
                accent: 'text-violet-400',
              },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-slate-800 bg-[#0B1424] p-4">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={`font-mono text-2xl font-bold tabular-nums ${kpi.accent}`}>
                    {kpi.value}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{kpi.unit}</span>
                </div>
                <div className="mt-1.5 font-mono text-[11px] text-slate-500">{kpi.formula}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MWD Plot + Analytical Comparison + Fraction Table */}
        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Molecular Weight Distribution (MWD) Plot
                </h2>
                <p className="text-xs text-slate-400">
                  Solid curve: Weight fraction w(M) · Dashed: Number fraction n(M) · Analytical markers overlaid
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnalytical((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-mono cursor-pointer ${
                    showAnalytical
                      ? 'border-amber-400/50 bg-amber-950/40 text-amber-300'
                      : 'border-slate-700 bg-[#070E1A] text-slate-400'
                  }`}
                >
                  <FlaskConical className="h-3 w-3" />
                  <span>{showAnalytical ? 'Analytical ON' : 'Analytical OFF'}</span>
                </button>
                <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#070E1A] p-1">
                  <button
                    type="button"
                    onClick={() => setLogScale(true)}
                    className={`rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                      logScale ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                    }`}
                  >
                    Log₁₀(M)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogScale(false)}
                    className={`rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                      !logScale ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                    }`}
                  >
                    Linear M
                  </button>
                </div>
              </div>
            </div>

            <div className="relative mt-4">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full overflow-visible"
                role="img"
                aria-label="Molecular weight distribution plot comparing calculated and analytical values"
              >
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const y = pad.top + plotH * (1 - t);
                  return (
                    <line
                      key={t}
                      x1={pad.left}
                      y1={y}
                      x2={pad.left + plotW}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.12)"
                      strokeWidth="1"
                    />
                  );
                })}

                <line
                  x1={pad.left}
                  y1={pad.top}
                  x2={pad.left}
                  y2={pad.top + plotH}
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <line
                  x1={pad.left}
                  y1={pad.top + plotH}
                  x2={pad.left + plotW}
                  y2={pad.top + plotH}
                  stroke="#475569"
                  strokeWidth="1.5"
                />

                {weightAreaPath && (
                  <path d={weightAreaPath} fill="rgba(34, 211, 238, 0.14)" />
                )}
                {weightPath && (
                  <path
                    d={weightPath}
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                )}
                {numberPath && (
                  <path
                    d={numberPath}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeLinejoin="round"
                  />
                )}

                {avgMarkers.map((mk) => {
                  const x = mapX(mk.value);
                  if (x < pad.left || x > pad.left + plotW || !Number.isFinite(x)) return null;
                  return (
                    <g key={mk.label}>
                      <line
                        x1={x}
                        y1={pad.top}
                        x2={x}
                        y2={pad.top + plotH}
                        stroke={mk.color}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={x + 4}
                        y={pad.top + mk.yOff}
                        fill={mk.color}
                        className="font-mono text-[10px] font-bold"
                      >
                        {mk.label}
                      </text>
                    </g>
                  );
                })}

                {/* Analytical Experimental Markers */}
                {showAnalytical &&
                  analyticalMarkers.map((mk) => {
                    const x = mapX(mk.value);
                    if (x < pad.left || x > pad.left + plotW || !Number.isFinite(x)) return null;
                    return (
                      <g key={mk.label}>
                        <line
                          x1={x}
                          y1={pad.top}
                          x2={x}
                          y2={pad.top + plotH}
                          stroke={mk.color}
                          strokeWidth="2"
                        />
                        <circle cx={x} cy={pad.top + plotH - 6} r="4" fill={mk.color} />
                        <text
                          x={x + 4}
                          y={pad.top + mk.yOff}
                          fill={mk.color}
                          className="font-mono text-[10px] font-bold"
                        >
                          {mk.label}
                        </text>
                      </g>
                    );
                  })}

                {chartData.points.map((pt, idx) => {
                  const cx = mapX(pt.molarMass);
                  const cy = mapYWeight(pt.wFrac);
                  const isHovered = hoverBinIdx === idx;
                  return (
                    <circle
                      key={pt.molarMass + '-' + idx}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#FFFFFF' : '#22D3EE'}
                      stroke="#050B14"
                      strokeWidth="1.5"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoverBinIdx(idx)}
                      onMouseLeave={() => setHoverBinIdx(null)}
                    />
                  );
                })}

                <text
                  x={pad.left + plotW / 2}
                  y={svgH - 8}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[11px]"
                >
                  Molar Mass Mᵢ (g/mol) {logScale ? '[Logarithmic Scale]' : '[Linear Scale]'}
                </text>
                <text
                  x={16}
                  y={pad.top + plotH / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 16 ${pad.top + plotH / 2})`}
                  className="fill-slate-400 font-mono text-[11px]"
                >
                  Normalized Fraction
                </text>
              </svg>

              {/* Crosshair Readout Bar */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-[#070E1A] px-3 py-2 text-xs font-mono text-slate-300 tabular-nums">
                {hoverBinIdx !== null && chartData.points[hoverBinIdx] ? (
                  <span>
                    Mᵢ = {chartData.points[hoverBinIdx].molarMass.toLocaleString()} g/mol · w(M) ={' '}
                    {(chartData.points[hoverBinIdx].wFrac * 100).toFixed(2)}% · n(M) ={' '}
                    {(chartData.points[hoverBinIdx].nFrac * 100).toFixed(2)}%
                  </span>
                ) : (
                  <span>
                    Calculated: Mₙ {Math.round(results.mn).toLocaleString()} ≤ Mᵥ{' '}
                    {Math.round(results.mv).toLocaleString()} ≤ Mw{' '}
                    {Math.round(results.mw).toLocaleString()}
                  </span>
                )}
                <span className="text-cyan-300">PDI = {results.pdi.toFixed(3)}</span>
              </div>
            </div>

            {/* Analytical Comparison Input & Delta Table */}
            <div className="mt-5 rounded-lg border border-amber-500/30 bg-[#070E1A] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-300">
                  Analytical GPC / Viscometry Comparison
                </h3>
                <span className="font-mono text-[11px] text-slate-400">
                  Analytical PDI = {analyticalPdi.toFixed(3)} (Δ{' '}
                  {(analyticalPdi - results.pdi >= 0 ? '+' : '') +
                    (analyticalPdi - results.pdi).toFixed(3)}
                  )
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs font-mono">
                {[
                  {
                    label: 'Analytical Mₙ (g/mol)',
                    val: analyticalMn,
                    set: setAnalyticalMn,
                    calc: results.mn,
                  },
                  {
                    label: 'Analytical Mᵥ (g/mol)',
                    val: analyticalMv,
                    set: setAnalyticalMv,
                    calc: results.mv,
                  },
                  {
                    label: 'Analytical Mw (g/mol)',
                    val: analyticalMw,
                    set: setAnalyticalMw,
                    calc: results.mw,
                  },
                ].map((item) => {
                  const dev = pctDiff(item.val, item.calc);
                  return (
                    <div key={item.label} className="rounded border border-slate-800 bg-[#0B1424] p-2.5">
                      <label className="block text-[11px] text-slate-400">{item.label}</label>
                      <input
                        type="number"
                        min={500}
                        step={500}
                        value={item.val}
                        onChange={(e) => item.set(Math.max(100, Number(e.target.value)))}
                        className="mt-1.5 w-full rounded border border-slate-700 bg-[#070E1A] px-2.5 py-1 text-xs text-amber-300 focus:border-amber-400 focus:outline-none tabular-nums"
                      />
                      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400 tabular-nums">
                        <span>Graph: {Math.round(item.calc).toLocaleString()}</span>
                        <span className="text-amber-300">
                          {Number(dev) >= 0 ? `+${dev}%` : `${dev}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schulz-Zimm & Mark-Houwink Controls */}
            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-800 pt-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-white">
                  Schulz–Zimm Distribution Generator
                </div>
                <div className="mt-2 space-y-2 text-xs font-mono text-slate-300">
                  <label className="flex items-center justify-between gap-2">
                    <span>Target Mₙ: {targetMn.toLocaleString()}</span>
                    <input
                      type="range"
                      min={5000}
                      max={150000}
                      step={2500}
                      value={targetMn}
                      onChange={(e) => setTargetMn(Number(e.target.value))}
                      className="w-28 accent-cyan-400 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span>Target PDI: {targetPdi.toFixed(2)}</span>
                    <input
                      type="range"
                      min={1.05}
                      max={3.8}
                      step={0.05}
                      value={targetPdi}
                      onChange={(e) => setTargetPdi(Number(e.target.value))}
                      className="w-28 accent-cyan-400 cursor-pointer"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSchulzZimm}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#070E1A] px-3 py-1.5 text-xs font-medium text-cyan-300 hover:border-cyan-500 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Apply Schulz–Zimm Curve</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-white">
                  Mark–Houwink Constants ([η] = K · Mᵥᵃ)
                </div>
                <div className="mt-2 space-y-2 text-xs font-mono text-slate-300">
                  <label className="flex items-center justify-between gap-2">
                    <span>Exponent a: {markHouwinkA.toFixed(2)}</span>
                    <input
                      type="range"
                      min={0.35}
                      max={1.15}
                      step={0.01}
                      value={markHouwinkA}
                      onChange={(e) => setMarkHouwinkA(Number(e.target.value))}
                      className="w-28 accent-teal-400 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span>Constant K: {markHouwinkK.toFixed(3)} mL/g</span>
                    <input
                      type="range"
                      min={0.004}
                      max={0.09}
                      step={0.002}
                      value={markHouwinkK}
                      onChange={(e) => setMarkHouwinkK(Number(e.target.value))}
                      className="w-28 accent-teal-400 cursor-pointer"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400">
                    a ≈ 0.5 (theta solvent), 0.7–0.8 (good solvent coil), &gt;0.95 (rigid-rod LCP)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Molecular Fraction Bins Table */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5 lg:col-span-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Polymer Chain Fractions (Nᵢ, Mᵢ)
                </h3>
                <p className="text-xs text-slate-400">
                  Edit molar mass or mole counts to recalculate live
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBin}
                className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#070E1A] px-2.5 py-1.5 text-xs font-medium text-cyan-300 hover:border-cyan-500 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Fraction</span>
              </button>
            </div>

            <div className="mt-4 max-h-[520px] overflow-y-auto border-t border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#070E1A] font-mono text-[11px] text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5 pr-2">#</th>
                    <th className="py-2.5 pr-2">Mᵢ (g/mol)</th>
                    <th className="py-2.5 pr-2">Nᵢ (moles)</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                  {sortedBins.map((bin, idx) => (
                    <tr key={bin.id}>
                      <td className="py-1.5 pr-2 text-slate-500">{idx + 1}</td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min={100}
                          step={500}
                          value={bin.molarMass}
                          onChange={(e) =>
                            handleBinChange(bin.id, 'molarMass', Number(e.target.value))
                          }
                          aria-label={`Molar mass fraction ${idx + 1}`}
                          className="w-28 rounded border border-slate-700 bg-[#070E1A] px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min={0.01}
                          step={0.1}
                          value={bin.moles}
                          onChange={(e) =>
                            handleBinChange(bin.id, 'moles', Number(e.target.value))
                          }
                          aria-label={`Moles fraction ${idx + 1}`}
                          className="w-20 rounded border border-slate-700 bg-[#070E1A] px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
                        />
                      </td>
                      <td className="py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveBin(bin.id)}
                          disabled={bins.length <= 2}
                          aria-label={`Remove fraction ${idx + 1}`}
                          className="rounded p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};
