import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowRight, Loader2, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { PolymerCategory, PolymerData } from '../types/polymer';
import { POLYMER_CATEGORIES, VERIFIED_ONCOLOGY_ATLAS } from '../data/polymers';

interface PolymerSelectorPageProps {
  polymers: PolymerData[];
  selectedPolymer: PolymerData;
  initialCategory?: string;
  onSelectPolymer: (polymer: PolymerData) => void;
  onProceedNext: () => void;
  onAddResolvedPolymer: (polymer: PolymerData) => void;
}

export const PolymerSelectorPage: React.FC<PolymerSelectorPageProps> = ({
  polymers,
  selectedPolymer,
  initialCategory = 'All',
  onSelectPolymer,
  onProceedNext,
  onAddResolvedPolymer,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | PolymerCategory>(
    (POLYMER_CATEGORIES.includes(initialCategory as PolymerCategory)
      ? initialCategory
      : 'All') as 'All' | PolymerCategory
  );
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory === 'All' || POLYMER_CATEGORIES.includes(initialCategory as PolymerCategory)) {
      setActiveCategory(initialCategory as 'All' | PolymerCategory);
    }
  }, [initialCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: polymers.length };
    for (const p of polymers) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [polymers]);

  const filteredPolymers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return polymers.filter((p) => {
      const catMatch = activeCategory === 'All' || p.category === activeCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.shortName.toLowerCase().includes(q) ||
        p.iupacName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.casNumber.toLowerCase().includes(q)
      );
    });
  }, [polymers, query, activeCategory]);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const exactMatch = polymers.find(
      (p) =>
        p.name.toLowerCase() === trimmed.toLowerCase() ||
        p.shortName.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactMatch) {
      onSelectPolymer(exactMatch);
      onProceedNext();
      return;
    }

    setIsResolving(true);
    setResolveError(null);
    try {
      const res = await fetch('/api/polymer-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.polymer) {
        setResolveError(data.error || 'Unable to verify polymer chemistry record.');
        return;
      }
      onAddResolvedPolymer(data.polymer as PolymerData);
      onSelectPolymer(data.polymer as PolymerData);
      onProceedNext();
    } catch {
      setResolveError('Network error while connecting to the chemistry verification server.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Polymer Registry &amp; Identification
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-white">
              Enter Polymer Name or Select Specimen
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Enter any polymer (e.g., Polystyrene, PTFE, Nylon 6,6, Chitosan, Doxorubicin-PEG) or
              choose from validated specimens across oncology, pharmaceutical, epoxy, ABS, PP,
              conducting/doped polymers, LCPs, and smart polymers.
            </p>
          </div>
          <button
            type="button"
            onClick={onProceedNext}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Analyze {selectedPolymer.shortName}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Custom Polymer Entry Form */}
        <form onSubmit={handleLookupSubmit} className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (resolveError) setResolveError(null);
                }}
                placeholder="Enter polymer name (e.g. Polypropylene, PLGA, Polyaniline, Kevlar, PNIPAM, Polystyrene, PTFE)..."
                aria-label="Enter polymer name"
                className="w-full rounded-lg border border-slate-700 bg-[#0B1424] py-3.5 pr-4 pl-11 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isResolving || query.trim().length < 2}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isResolving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Chemistry Data...</span>
                </>
              ) : (
                <>
                  <span>Load &amp; Analyze Polymer</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
          {resolveError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-2.5 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{resolveError}</span>
            </div>
          )}
        </form>

        {/* Category Segmented Filter Bar with Live Counts */}
        <div className="mt-8 flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-800 bg-[#070E1A] p-1.5">
          {POLYMER_CATEGORIES.map((category) => {
            const active = activeCategory === category;
            const count = categoryCounts[category] ?? 0;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {category} <span className="ml-1 font-mono text-[11px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Verified Cancer & Pharmaceutical Polymer Landscape Summary */}
        {(activeCategory === 'Cancer Therapy' || activeCategory === 'Pharmaceutical' || activeCategory === 'All') && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-[#091221] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  <span>Verified Cancer &amp; Pharmaceutical Polymer Scope</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                  {VERIFIED_ONCOLOGY_ATLAS.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-left font-mono">
                <div className="rounded-lg border border-slate-800 bg-[#050B14] px-3.5 py-2">
                  <div className="text-[11px] text-slate-400">Cancer Polymers Here</div>
                  <div className="text-lg font-bold text-cyan-300 tabular-nums">
                    {categoryCounts['Cancer Therapy'] ?? 0} Verified
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#050B14] px-3.5 py-2">
                  <div className="text-[11px] text-slate-400">Pharmaceutical Here</div>
                  <div className="text-lg font-bold text-emerald-300 tabular-nums">
                    {categoryCounts['Pharmaceutical'] ?? 0} Verified
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#050B14] px-3.5 py-2">
                  <div className="text-[11px] text-slate-400">Clinical Global Scope</div>
                  <div className="text-xs font-semibold text-amber-300">
                    {VERIFIED_ONCOLOGY_ATLAS.fdaAndGlobalApprovedCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {VERIFIED_ONCOLOGY_ATLAS.classes.map((cls) => (
                <div
                  key={cls.className}
                  className="rounded-lg border border-slate-800/90 bg-[#050B14]/80 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{cls.className}</span>
                    <span className="font-mono text-[11px] text-cyan-400 tabular-nums">
                      {cls.countInRegistry} here
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                    {cls.clinicalExamples}
                  </p>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-800/70 pt-2 text-[10px] font-mono">
                    <span className="text-emerald-300">{cls.verifiedStatus}</span>
                    <a
                      href={cls.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                    >
                      <span>Source</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Specimen Banner */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-cyan-500/30 bg-cyan-950/25 px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="font-semibold text-white">Active Specimen:</span>
            <span className="font-mono text-cyan-300">{selectedPolymer.name}</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-xs font-mono text-slate-400">
              CAS {selectedPolymer.casNumber}
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-xs font-mono text-slate-300">
              {selectedPolymer.repeatUnitFormula}
            </span>
          </div>
          <button
            type="button"
            onClick={onProceedNext}
            className="text-xs font-semibold text-cyan-300 underline-offset-4 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Continue to Formula &amp; 3D Structure →
          </button>
        </div>

        {/* Curated Polymer Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPolymers.map((polymer, idx) => {
            const isSelected = polymer.id === selectedPolymer.id;
            return (
              <motion.button
                key={polymer.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.3, idx * 0.03), duration: 0.3 }}
                onClick={() => onSelectPolymer(polymer)}
                className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-[#0E1B30] ring-1 ring-cyan-400/30'
                    : 'border-slate-800 bg-[#0B1424] hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
                    <span>{polymer.category}</span>
                    <span>CAS {polymer.casNumber}</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-white">
                    {polymer.name}
                  </h3>
                  <p className="mt-1 text-xs font-mono text-cyan-400">
                    {polymer.repeatUnitFormula}
                  </p>
                  <p className="mt-2.5 line-clamp-2 text-sm text-slate-400">
                    {polymer.mechanismHighlight}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-mono text-slate-400">
                  <span>Tg: {polymer.physicalProperties.tgC}</span>
                  <span className="text-[11px] text-slate-500">
                    {polymer.sources[0]?.publisher ?? 'PubChem'}
                  </span>
                  <span className={isSelected ? 'font-semibold text-cyan-300' : 'text-slate-300'}>
                    {isSelected ? 'Selected ✓' : 'Select'}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {filteredPolymers.length === 0 && !isResolving && (
          <div className="mt-8 rounded-xl border border-slate-800 bg-[#0B1424] p-8 text-center">
            <p className="text-sm font-medium text-slate-200">
              No local preset matches "{query}".
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Click <strong>Load &amp; Analyze Polymer</strong> above to fetch verified chemistry,
              3D repeat-unit geometry, toxicology, and kinetic parameters from PubChem &amp; scientific literature.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
