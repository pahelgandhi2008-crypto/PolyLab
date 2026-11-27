import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle, HeartPulse, Bug, FlaskConical, ExternalLink } from 'lucide-react';
import { PolymerData } from '../types/polymer';

interface PropertiesAndSafetyPageProps {
  polymer: PolymerData;
  onBack: () => void;
  onNext: () => void;
}

const RADAR_AXES: Array<{ key: keyof PolymerData['radarProfile']; label: string }> = [
  { key: 'thermalStability', label: 'THERMAL' },
  { key: 'mechanicalStrength', label: 'STRENGTH' },
  { key: 'chemicalResistance', label: 'CHEM RESIST' },
  { key: 'conductivity', label: 'CONDUCTIVITY' },
  { key: 'biocompatibility', label: 'BIOCOMPAT' },
  { key: 'processability', label: 'PROCESS' },
];

export const PropertiesAndSafetyPage: React.FC<PropertiesAndSafetyPageProps> = ({
  polymer,
  onBack,
  onNext,
}) => {
  const [showAnalytical, setShowAnalytical] = useState(true);
  const [analyticalRadar, setAnalyticalRadar] = useState<PolymerData['radarProfile']>({
    thermalStability: Math.min(100, Math.max(5, polymer.radarProfile.thermalStability - 6)),
    mechanicalStrength: Math.min(100, Math.max(5, polymer.radarProfile.mechanicalStrength + 4)),
    chemicalResistance: Math.min(100, Math.max(5, polymer.radarProfile.chemicalResistance - 5)),
    conductivity: polymer.radarProfile.conductivity,
    biocompatibility: Math.min(100, Math.max(5, polymer.radarProfile.biocompatibility - 4)),
    processability: Math.min(100, Math.max(5, polymer.radarProfile.processability + 3)),
  });

  useEffect(() => {
    setAnalyticalRadar({
      thermalStability: Math.min(100, Math.max(5, polymer.radarProfile.thermalStability - 6)),
      mechanicalStrength: Math.min(100, Math.max(5, polymer.radarProfile.mechanicalStrength + 4)),
      chemicalResistance: Math.min(100, Math.max(5, polymer.radarProfile.chemicalResistance - 5)),
      conductivity: polymer.radarProfile.conductivity,
      biocompatibility: Math.min(100, Math.max(5, polymer.radarProfile.biocompatibility - 4)),
      processability: Math.min(100, Math.max(5, polymer.radarProfile.processability + 3)),
    });
  }, [polymer]);

  const cx = 140;
  const cy = 140;
  const maxR = 96;

  const getPoint = (idx: number, val0to100: number) => {
    const angle = (Math.PI * 2 * idx) / RADAR_AXES.length - Math.PI / 2;
    const r = (Math.max(4, Math.min(100, val0to100)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const dataPolygon = RADAR_AXES.map((axis, idx) => {
    const pt = getPoint(idx, polymer.radarProfile[axis.key]);
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }).join(' ');

  const analyticalPolygon = RADAR_AXES.map((axis, idx) => {
    const pt = getPoint(idx, analyticalRadar[axis.key]);
    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }).join(' ');

  const ghsTone =
    polymer.precautions.ghsSignal === 'Danger'
      ? 'text-rose-300 border-rose-500/40 bg-rose-950/40'
      : polymer.precautions.ghsSignal === 'Warning'
      ? 'text-amber-300 border-amber-500/40 bg-amber-950/40'
      : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40';

  const meanAbsDelta =
    RADAR_AXES.reduce(
      (sum, a) => sum + Math.abs(analyticalRadar[a.key] - polymer.radarProfile[a.key]),
      0
    ) / RADAR_AXES.length;

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
              <span className="font-semibold text-cyan-400">Properties, Toxicology &amp; Safety</span>
              <span aria-hidden="true">·</span>
              <span>{polymer.name}</span>
              <span aria-hidden="true">·</span>
              <span>CAS {polymer.casNumber}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
              Physical &amp; Chemical Properties, Biological Hazards &amp; Safety
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0B1424] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Formula &amp; 3D Structure</span>
            </button>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Molecular Weights &amp; MWD</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Physical & Chemical Properties + Analytical Radar Overlay */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-white">
            Physical &amp; Chemical Properties
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Physical Properties Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5 lg:col-span-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Physical &amp; Mechanical Constants
              </h3>
              <dl className="mt-3 divide-y divide-slate-800/80 text-sm">
                {[
                  ['Density', polymer.physicalProperties.densityGcm3],
                  ['Glass Transition (Tg)', polymer.physicalProperties.tgC],
                  ['Melting Point (Tm)', polymer.physicalProperties.tmC],
                  ['Tensile Strength', polymer.physicalProperties.tensileStrengthMPa],
                  ["Young's Modulus", polymer.physicalProperties.youngsModulusGPa],
                  ['Elongation at Break', polymer.physicalProperties.elongationPct],
                  ['Conductivity', polymer.physicalProperties.conductivitySCm],
                  ['Morphology', polymer.physicalProperties.crystallinity],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-xs text-slate-400 shrink-0">{label}</dt>
                    <dd className="text-right font-mono text-xs font-semibold text-white tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Chemical Properties */}
            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5 lg:col-span-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Chemical Reactivity &amp; Solubility
              </h3>
              <div className="mt-3 space-y-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Solubility Profile</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                    {polymer.chemicalProperties.solubility}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Chemical Resistance</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                    {polymer.chemicalProperties.chemicalResistance}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Thermal Degradation Window
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-slate-300">
                    {polymer.chemicalProperties.thermalDegradationC}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Reactivity, Doping &amp; Functional Groups
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                    {polymer.chemicalProperties.reactivityAndDoping}{' '}
                    <span className="font-mono text-cyan-300">
                      ({polymer.chemicalProperties.functionalGroups})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Spider / Radar Chart + Analytical Value Input */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0B1424] p-5 lg:col-span-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                  Calibration Radar vs. Analytical
                </span>
                <button
                  type="button"
                  onClick={() => setShowAnalytical((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-mono cursor-pointer ${
                    showAnalytical
                      ? 'border-amber-400/50 bg-amber-950/40 text-amber-300'
                      : 'border-slate-700 bg-[#070E1A] text-slate-400'
                  }`}
                >
                  <FlaskConical className="h-3 w-3" />
                  <span>{showAnalytical ? 'Analytical ON' : 'Analytical OFF'}</span>
                </button>
              </div>

              <svg
                viewBox="0 0 280 280"
                className="mx-auto my-2 h-52 w-52"
                role="img"
                aria-label="Polymer physical property calibration radar chart compared with analytical values"
              >
                {[25, 50, 75, 100].map((level) => {
                  const pts = RADAR_AXES.map((_, idx) => {
                    const p = getPoint(idx, level);
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
                  const outer = getPoint(idx, 100);
                  const labelPt = getPoint(idx, 122);
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
                        x={labelPt.x}
                        y={labelPt.y}
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
                  points={dataPolygon}
                  fill="rgba(34, 211, 238, 0.2)"
                  stroke="#22D3EE"
                  strokeWidth="2"
                />
                {showAnalytical && (
                  <polygon
                    points={analyticalPolygon}
                    fill="rgba(251, 191, 36, 0.14)"
                    stroke="#FBBF24"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}
                {RADAR_AXES.map((axis, idx) => {
                  const pt = getPoint(idx, polymer.radarProfile[axis.key]);
                  return <circle key={axis.key} cx={pt.x} cy={pt.y} r="3" fill="#22D3EE" />;
                })}
              </svg>

              {/* Analytical Value Comparison Inputs */}
              <div className="border-t border-slate-800 pt-3">
                <div className="mb-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-amber-300">Enter Analytical Values (0–100)</span>
                  <span className="text-slate-400 tabular-nums">Mean |Δ| = {meanAbsDelta.toFixed(1)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  {RADAR_AXES.map((axis) => {
                    const modelVal = polymer.radarProfile[axis.key];
                    const expVal = analyticalRadar[axis.key];
                    const delta = expVal - modelVal;
                    return (
                      <label
                        key={axis.key}
                        className="flex items-center justify-between gap-1.5 rounded border border-slate-800 bg-[#070E1A] px-2 py-1"
                      >
                        <span className="truncate text-slate-400">{axis.label}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={expVal}
                            onChange={(e) =>
                              setAnalyticalRadar((prev) => ({
                                ...prev,
                                [axis.key]: Math.max(0, Math.min(100, Number(e.target.value))),
                              }))
                            }
                            className="w-11 rounded border border-slate-700 bg-[#0B1424] px-1 py-0.5 text-right text-amber-300 focus:border-amber-400 focus:outline-none tabular-nums"
                          />
                          <span className="w-8 text-right text-[10px] text-slate-500 tabular-nums">
                            {delta >= 0 ? `+${delta}` : delta}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Biological Disadvantages & Toxicity in Humans and Animals */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-white">
            Biological Disadvantages &amp; Hazards (Humans &amp; Animals)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Toxicological risks from residual monomers, processing emissions, nanocarrier clearance, and ecological persistence
          </p>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <HeartPulse className="h-4 w-4 text-rose-400" />
                <span>Human Health Disadvantages</span>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                {polymer.humanHazards.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-xs font-semibold text-rose-400 tabular-nums">
                      0{i + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Bug className="h-4 w-4 text-amber-400" />
                <span>Animal &amp; Ecological Disadvantages</span>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                {polymer.animalEcoHazards.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-xs font-semibold text-amber-400 tabular-nums">
                      0{i + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Required Safety Precautions */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Required Safety Precautions During Contact &amp; Handling
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Laboratory PPE, engineering ventilation, and hazardous waste protocols
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-mono font-semibold ${ghsTone}`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>GHS Signal: {polymer.precautions.ghsSignal}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Personal Protective Equipment (PPE)</span>
              </div>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-300">
                {polymer.precautions.ppe.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Engineering &amp; Process Controls
              </div>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-300">
                {polymer.precautions.engineeringControls.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Storage, Spill &amp; Waste Disposal
              </div>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-300">
                {polymer.precautions.handlingAndDisposal.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Verified Chemistry & Safety References */}
        <section className="mt-8 rounded-xl border border-slate-800 bg-[#0B1424] p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Verified Toxicology &amp; Polymer Literature Sources
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {polymer.sources.map((src) => (
              <a
                key={src.url + src.title}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-300 underline-offset-4 hover:underline"
              >
                <span>
                  {src.title} ({src.publisher})
                </span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
};
