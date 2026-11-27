import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ExternalLink, FlaskConical, Scale } from 'lucide-react';
import { PolymerData } from '../types/polymer';
import { ThreePolymerViewer } from './ThreePolymerViewer';
import { getPolymerDefinitionAndSynthesis } from '../utils/polymerSynthesisData';

interface FormulaAnd3DPageProps {
  polymer: PolymerData;
  onBack: () => void;
  onNext: () => void;
}

export const FormulaAnd3DPage: React.FC<FormulaAnd3DPageProps> = ({
  polymer,
  onBack,
  onNext,
}) => {
  const [animateMechanism, setAnimateMechanism] = useState(true);
  const synthesisMeta = getPolymerDefinitionAndSynthesis(polymer);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header & Navigation */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="font-semibold text-cyan-400">Formula &amp; 3D Structure</span>
              <span aria-hidden="true">·</span>
              <span>{polymer.category}</span>
              <span aria-hidden="true">·</span>
              <span>CAS {polymer.casNumber}</span>
              <span aria-hidden="true">·</span>
              <span>PubChem CID {polymer.pubchemCid}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
              {polymer.name}
            </h1>
            <p className="mt-1 text-sm font-mono text-slate-400">
              IUPAC: {polymer.iupacName}
            </p>
            <div className="mt-3 max-w-3xl rounded-lg border border-cyan-500/25 bg-[#091322] px-4 py-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                Definition
              </span>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">
                {synthesisMeta.definition}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0B1424] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change Polymer</span>
            </button>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Properties &amp; Safety</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Mechanism Summary */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-[#0B1424] p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Macromolecular Classification &amp; Functional Mechanism
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            {polymer.mechanismHighlight}
          </p>
        </div>

        {/* Chemical Formula & Balanced Polymerization Equation */}
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Chemical Formula &amp; Polymerization Equation
              </h2>
              <p className="text-xs text-slate-400">
                Stoichiometric repeat unit, monomer molar mass (M₀), and synthesis pathway
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAnimateMechanism((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-[#0B1424] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500 cursor-pointer"
            >
              <FlaskConical className="h-3.5 w-3.5 text-cyan-400" />
              <span>{animateMechanism ? 'Pause Reaction Pulse' : 'Animate Reaction'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5">
              <div className="text-xs font-mono text-slate-400 uppercase">Monomer</div>
              <div className="mt-1.5 font-display text-base font-bold text-white">
                {polymer.monomerName}
              </div>
              <div className="mt-2 font-mono text-sm text-cyan-300">
                {polymer.monomerFormula}
              </div>
              <div className="mt-3 border-t border-slate-800 pt-2.5 text-xs font-mono text-slate-400 tabular-nums">
                Repeat Unit M₀ = {polymer.monomerMolarMass.toFixed(2)} g/mol
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0B1424] p-5 lg:col-span-2">
              <div className="text-xs font-mono text-slate-400 uppercase">
                Polymer Repeat Unit Formula &amp; Reaction Class
              </div>
              <div className="mt-1.5 font-mono text-lg font-bold text-white">
                {polymer.repeatUnitFormula}
              </div>
              <div className="mt-1 text-xs font-medium text-cyan-400">
                {polymer.polymerizationType}
              </div>

              {/* Balanced Equation Diagram */}
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-[#070E1A] px-4 py-3.5 font-mono text-sm">
                <span className="font-semibold text-slate-200">{polymer.equationReactants}</span>

                <div className="flex flex-col items-center px-2">
                  <span className="text-[11px] text-cyan-400">{polymer.equationConditions}</span>
                  <svg width="88" height="14" viewBox="0 0 88 14" aria-hidden="true">
                    <line
                      x1="2"
                      y1="7"
                      x2="78"
                      y2="7"
                      stroke="#22D3EE"
                      strokeWidth="2"
                      className={animateMechanism ? 'animate-bond-dash' : ''}
                    />
                    <polygon points="78,3 87,7 78,11" fill="#22D3EE" />
                  </svg>
                </div>

                <span className="font-bold text-cyan-300">{polymer.equationProducts}</span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                {polymer.equationNotes}
              </p>
            </div>
          </div>
        </section>

        {/* Interactive 3D Molecular & Chain Model */}
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Interactive 3D Macromolecular Model
              </h2>
              <p className="text-xs text-slate-400">
                CPK atomic coloring (C: charcoal, H: white, O: red, N: blue, S: yellow, Cl: green, I: violet) · Switch between Ball &amp; Stick, Space-Filling, and Backbone Tube
              </p>
            </div>
          </div>

          <ThreePolymerViewer polymer={polymer} />
        </section>

        {/* Balanced Synthesis Equation & Stoichiometric Conservation */}
        <section className="mt-10 rounded-xl border border-cyan-500/25 bg-[#091322] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
                <Scale className="h-4 w-4 text-cyan-400" />
                <span>Balanced Synthesis Equation</span>
              </div>
              <h2 className="mt-1 font-display text-xl font-bold text-white">
                Stoichiometric Reaction &amp; Atom Conservation
              </h2>
            </div>
            <span className="rounded-md border border-emerald-500/35 bg-emerald-950/35 px-3 py-1.5 text-xs font-mono text-emerald-300">
              {synthesisMeta.stoichiometryType}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-[#050B14] px-5 py-4 font-mono text-sm">
            <span className="font-semibold text-slate-100">{synthesisMeta.balancedReactants}</span>

            <div className="flex flex-col items-center px-2">
              <span className="text-[11px] text-amber-300 text-center">
                {synthesisMeta.balancedArrowConditions}
              </span>
              <svg width="108" height="14" viewBox="0 0 108 14" aria-hidden="true">
                <line
                  x1="2"
                  y1="7"
                  x2="98"
                  y2="7"
                  stroke="#22D3EE"
                  strokeWidth="2"
                  className={animateMechanism ? 'animate-bond-dash' : ''}
                />
                <polygon points="98,3 107,7 98,11" fill="#22D3EE" />
              </svg>
            </div>

            <span className="font-bold text-cyan-300">{synthesisMeta.balancedProducts}</span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-300 font-mono">
            Atom &amp; Mass Balance: <span className="text-slate-400 font-sans">{synthesisMeta.atomBalanceNote}</span>
          </p>
        </section>

        {/* Verified Chemical Literature Sources */}
        <section className="mt-8 rounded-xl border border-slate-800 bg-[#0B1424] p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Verified Chemistry Data Resources
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
                <span>{src.title} ({src.publisher})</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
};
