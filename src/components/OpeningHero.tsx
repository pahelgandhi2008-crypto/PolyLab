import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, GitCompare, Zap, Atom } from 'lucide-react';

interface OpeningHeroProps {
  onEnterLab: () => void;
  onComparePolymers: () => void;
  onQuickCategory: (category: string) => void;
  onSimulateRadicalPulse: () => void;
}

const DOMAIN_BUTTONS = [
  { label: 'Oncology & Cancer Therapy', cat: 'Cancer Therapy' },
  { label: 'Pharmaceutical Polymers', cat: 'Pharmaceutical' },
  { label: 'Engineering PP & Polyolefins', cat: 'Co-polymer & Commodity' },
  { label: 'Epoxy Resins (DGEBA/Amine)', cat: 'Epoxy & Thermoset' },
  { label: 'Conducting Polymers & Doping', cat: 'Conducting & Doped' },
  { label: 'Liquid Crystal Polymers (LCP)', cat: 'Liquid Crystal (LCP)' },
  { label: 'Smart Stimuli-Responsive (PNIPAM)', cat: 'Smart Polymer' },
];

export const OpeningHero: React.FC<OpeningHeroProps> = ({
  onEnterLab,
  onComparePolymers,
  onQuickCategory,
  onSimulateRadicalPulse,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pulseCount, setPulseCount] = useState(0);
  const pulseIntensityRef = useRef(0);

  const triggerRadicalPulse = () => {
    pulseIntensityRef.current = 1.0;
    setPulseCount((c) => c + 1);
    onSimulateRadicalPulse();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 660);

    interface ChainNode {
      x: number;
      y: number;
      baseY: number;
      phase: number;
      radius: number;
      color: string;
      symbol: string;
    }

    const nodePalette = [
      { color: '#22D3EE', symbol: 'C' },
      { color: '#10B981', symbol: 'O' },
      { color: '#F59E0B', symbol: 'N' },
      { color: '#EC4899', symbol: '' },
      { color: '#38BDF8', symbol: 'C' },
      { color: '#A78BFA', symbol: 'S' },
    ];

    const chains: ChainNode[][] = [];
    const chainCount = 4;
    const nodesPerChain = 18;

    for (let c = 0; c < chainCount; c++) {
      const nodes: ChainNode[] = [];
      const baseY = height * (0.18 + c * 0.22);
      for (let i = 0; i < nodesPerChain; i++) {
        const spec = nodePalette[(c * 3 + i) % nodePalette.length];
        nodes.push({
          x: (width / (nodesPerChain - 1)) * i,
          y: baseY,
          baseY,
          phase: c * 1.4 + i * 0.42,
          radius: i % 3 === 0 ? 6.5 : 4.2,
          color: spec.color,
          symbol: spec.symbol,
        });
      }
      chains.push(nodes);
    }

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      chains.forEach((chain, c) => {
        const baseY = height * (0.18 + c * 0.22);
        chain.forEach((n, i) => {
          n.x = (width / (nodesPerChain - 1)) * i;
          n.baseY = baseY;
        });
      });
    };

    window.addEventListener('resize', handleResize);
    let rafId = 0;
    let time = 0;

    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // Decay radical pulse boost
      pulseIntensityRef.current *= 0.975;
      const boost = pulseIntensityRef.current;

      // Subtle dark cyan blueprint coordinate grid
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 46) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 46) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      chains.forEach((chain, cIdx) => {
        const amp = 24 + cIdx * 5 + boost * 18;
        chain.forEach((n) => {
          n.y = n.baseY + Math.sin(time * (0.022 + boost * 0.03) + n.phase) * amp;
        });

        // Glowing covalent backbone strand
        ctx.beginPath();
        ctx.strokeStyle =
          cIdx % 2 === 0
            ? `rgba(34, 211, 238, ${0.42 + boost * 0.4})`
            : `rgba(59, 130, 246, ${0.32 + boost * 0.4})`;
        ctx.lineWidth = 1.8 + boost * 1.4;
        chain.forEach((n, idx) => {
          if (idx === 0) ctx.moveTo(n.x, n.y);
          else ctx.lineTo(n.x, n.y);
        });
        ctx.stroke();

        // Colored monomer nodes along strand
        chain.forEach((n) => {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + boost * 2, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.fill();

          if (n.symbol && n.radius > 5) {
            ctx.fillStyle = '#050B14';
            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(n.symbol, n.x, n.y + 0.5);
          }
        });
      });

      if (!prefersReduced) {
        time += 1 + boost * 2.5;
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const polyChars = 'POLY'.split('');
  const labChars = 'LAB'.split('');

  return (
    <div className="relative overflow-hidden bg-[#050B14]">
      <section className="relative flex min-h-[calc(100vh-116px)] flex-col items-center justify-center border-b border-slate-800/80 px-6 py-16">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        {/* Subtle radial dark readability vignette behind center text */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,11,20,0.84)_0%,rgba(5,11,20,0.35)_65%,transparent_100%)]"
        />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-[#0B1424]/90 px-4 py-1.5 text-xs font-mono text-cyan-300"
          >
            <Atom className="h-3.5 w-3.5 text-cyan-400" />
            <span>IUPAC-Calibrated Macromolecular Science Suite</span>
          </motion.div>

          {/* Animated Staggered POLYLAB Wordmark */}
          <h1
            aria-label="POLYLAB"
            className="mt-6 flex items-baseline justify-center font-display text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl"
          >
            {polyChars.map((ch, idx) => (
              <motion.span
                key={`poly-${idx}`}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="text-cyan-400"
              >
                {ch}
              </motion.span>
            ))}
            {labChars.map((ch, idx) => (
              <motion.span
                key={`lab-${idx}`}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: (polyChars.length + idx) * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-white"
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45 }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg text-balance"
          >
            Interactive macromolecular laboratory for simulating synthesis kinetics, 3D molecular
            conformations, molecular weight distributions, coupling termination, and ML property
            prediction.
          </motion.p>

          {/* Interactive Polymer Domain Selector Row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.6 }}
            className="mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5"
          >
            {DOMAIN_BUTTONS.map((dom) => (
              <button
                key={dom.label}
                type="button"
                onClick={() => onQuickCategory(dom.cat)}
                className="rounded-lg border border-cyan-500/25 bg-[#0B1424]/90 px-3.5 py-2 text-xs font-medium text-slate-200 transition-all hover:border-cyan-400 hover:bg-cyan-950/60 hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {dom.label}
              </button>
            ))}
          </motion.div>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={onEnterLab}
              className="group inline-flex items-center gap-2.5 rounded-lg bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-all hover:bg-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Enter Macromolecular Laboratory</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={onComparePolymers}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/45 bg-[#0B1424]/90 px-5 py-3.5 text-sm font-semibold text-amber-200 transition-colors hover:border-amber-400 hover:bg-amber-950/30 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <GitCompare className="h-4 w-4 text-amber-400" />
              <span>Compare Two Polymers</span>
            </button>

            <button
              type="button"
              onClick={triggerRadicalPulse}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0B1424]/90 px-5 py-3.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400 hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Zap className="h-4 w-4 text-cyan-400" />
              <span>Simulate Radical Pulse ({pulseCount})</span>
            </button>
          </motion.div>

          {/* Clean Unboxed Capability Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-slate-800/80 pt-6 text-xs font-mono text-slate-400"
          >
            <span>Verified IUPAC Equations</span>
            <span aria-hidden="true" className="text-slate-700">|</span>
            <span>Flory–Schulz MWD Physics</span>
            <span aria-hidden="true" className="text-slate-700">|</span>
            <span>Analytical vs. Theoretical Comparison</span>
            <span aria-hidden="true" className="text-slate-700">|</span>
            <span>Group-Contribution QSPR ML Models</span>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
