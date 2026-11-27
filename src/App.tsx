import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { POLYMER_DATABASE } from './data/polymers';
import { PolymerData } from './types/polymer';
import { OpeningHero } from './components/OpeningHero';
import { PolymerSelectorPage } from './components/PolymerSelectorPage';
import { FormulaAnd3DPage } from './components/FormulaAnd3DPage';
import { PropertiesAndSafetyPage } from './components/PropertiesAndSafetyPage';
import { MolecularWeightPage } from './components/MolecularWeightPage';
import { KineticsAndMLPage } from './components/KineticsAndMLPage';
import { ComparePolymersPage } from './components/ComparePolymersPage';
import { CelebrationBurst } from './components/CelebrationBurst';

type PageStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const NAV_ITEMS: Array<{ stage: PageStage; label: string }> = [
  { stage: 0, label: 'Overview' },
  { stage: 1, label: 'Polymer Registry' },
  { stage: 2, label: 'Formula & 3D' },
  { stage: 3, label: 'Properties & Safety' },
  { stage: 4, label: 'Molecular Weights & MWD' },
  { stage: 5, label: 'Kinetics, Fox-Flory & ML' },
  { stage: 6, label: 'Compare Polymers' },
];

export default function App() {
  const [stage, setStage] = useState<PageStage>(0);
  const [polymers, setPolymers] = useState<PolymerData[]>(POLYMER_DATABASE);
  const [selectedPolymer, setSelectedPolymer] = useState<PolymerData>(POLYMER_DATABASE[0]);
  const [quickCategory, setQuickCategory] = useState<string>('All');
  const [celebrationKey, setCelebrationKey] = useState<number>(0);

  const triggerCelebration = () => {
    setCelebrationKey((k) => k + 1);
  };

  const navigateTo = (nextStage: PageStage) => {
    if (nextStage === 6 && stage !== 6) {
      triggerCelebration();
    }
    setStage(nextStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnterLaboratory = () => {
    triggerCelebration();
    navigateTo(1);
  };

  const handleComparePolymers = () => {
    triggerCelebration();
    setStage(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickCategory = (cat: string) => {
    setQuickCategory(cat);
    triggerCelebration();
    navigateTo(1);
  };

  const handleAddResolvedPolymer = (resolved: PolymerData) => {
    setPolymers((prev) => {
      const exists = prev.some((p) => p.id === resolved.id);
      if (exists) return prev;
      return [resolved, ...prev];
    });
  };

  const nextActionLabel =
    stage === 0
      ? 'Enter Lab'
      : stage < 5
      ? 'Next Section'
      : stage === 5
      ? 'Compare Polymers'
      : 'Polymer Registry';

  const handlePrimaryCta = () => {
    if (stage === 0) {
      handleEnterLaboratory();
    } else if (stage < 6) {
      navigateTo((stage + 1) as PageStage);
    } else {
      navigateTo(1);
    }
  };

  return (
    <div className="lab-grid-bg flex min-h-screen flex-col bg-[#050B14] text-slate-100">
      <CelebrationBurst triggerKey={celebrationKey} />
      {/* Top Bar Contract: 3 zones (Brand Wordmark — Single-Line Nav Links — 1 Primary Action) */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-[#070D18]/95">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-6 px-6 py-3.5">
          {/* Zone 1: Single-line Brand Title */}
          <button
            type="button"
            onClick={() => navigateTo(0)}
            className="font-display text-lg font-extrabold tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="text-cyan-400">POLY</span>
            <span className="text-white">LAB</span>
          </button>

          {/* Zone 2: Concise Single-Line Navigation Links */}
          <nav
            aria-label="Polymer analysis sections"
            className="hidden items-center gap-5 lg:flex overflow-x-auto"
          >
            {NAV_ITEMS.map((item) => {
              const active = stage === item.stage;
              return (
                <button
                  key={item.stage}
                  type="button"
                  onClick={() => navigateTo(item.stage)}
                  className={`border-b-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {nextActionLabel}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Compact Stage Bar */}
        <div className="flex items-center gap-4 overflow-x-auto border-t border-slate-800/80 px-6 py-2 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.stage}
              type="button"
              onClick={() => navigateTo(item.stage)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                stage === item.stage ? 'text-cyan-300 font-semibold' : 'text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Active Page Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div
              key="stage-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <OpeningHero
                onEnterLab={handleEnterLaboratory}
                onComparePolymers={handleComparePolymers}
                onQuickCategory={handleQuickCategory}
                onSimulateRadicalPulse={triggerCelebration}
              />
            </motion.div>
          )}

          {stage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PolymerSelectorPage
                polymers={polymers}
                selectedPolymer={selectedPolymer}
                initialCategory={quickCategory}
                onSelectPolymer={setSelectedPolymer}
                onProceedNext={() => navigateTo(2)}
                onAddResolvedPolymer={handleAddResolvedPolymer}
              />
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FormulaAnd3DPage
                polymer={selectedPolymer}
                onBack={() => navigateTo(1)}
                onNext={() => navigateTo(3)}
              />
            </motion.div>
          )}

          {stage === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PropertiesAndSafetyPage
                polymer={selectedPolymer}
                onBack={() => navigateTo(2)}
                onNext={() => navigateTo(4)}
              />
            </motion.div>
          )}

          {stage === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MolecularWeightPage
                polymer={selectedPolymer}
                onBack={() => navigateTo(3)}
                onNext={() => navigateTo(5)}
              />
            </motion.div>
          )}

          {stage === 5 && (
            <motion.div
              key="stage-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <KineticsAndMLPage
                polymer={selectedPolymer}
                onBack={() => navigateTo(4)}
                onRestart={() => navigateTo(0)}
              />
            </motion.div>
          )}

          {stage === 6 && (
            <motion.div
              key="stage-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ComparePolymersPage
                polymers={polymers}
                initialPolymerA={selectedPolymer}
                onSelectForDeepDive={(poly) => {
                  setSelectedPolymer(poly);
                  navigateTo(2);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quiet Scientific Footer */}
      <footer className="border-t border-slate-800/90 bg-[#070D18]">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-6 py-5 text-xs text-slate-400">
          <span>PolyLab · Polymer Chemistry &amp; Macromolecular Engineering Platform</span>
          <span className="font-mono text-slate-300">
            Active: {selectedPolymer.shortName} · CAS {selectedPolymer.casNumber}
          </span>
        </div>
      </footer>
    </div>
  );
}
