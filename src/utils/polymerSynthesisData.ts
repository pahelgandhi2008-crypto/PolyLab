import { PolymerData } from '../types/polymer';

export interface PolymerDefinitionAndBalance {
  definition: string;
  balancedReactants: string;
  balancedArrowConditions: string;
  balancedProducts: string;
  stoichiometryType: string;
  atomBalanceNote: string;
}

const CURATED_SYNTHESIS_DATA: Record<string, PolymerDefinitionAndBalance> = {
  polypropylene: {
    definition:
      'Polypropylene (PP) is a linear, semi-crystalline aliphatic polyolefin thermoplastic synthesized from propene monomer. Its isotactic methyl stereoregularity yields high stiffness, chemical inertness, and a 165 °C melting point.',
    balancedReactants: 'n CH₂=CH(CH₃)  [C₃H₆]',
    balancedArrowConditions: 'TiCl₄ / Al(C₂H₅)₃, 60–80 °C, 10–40 atm',
    balancedProducts: '-[-CH₂-CH(CH₃)-]ₙ-  [(C₃H₆)ₙ]',
    stoichiometryType: 'Chain-Growth Coordination Addition · 100% Atom Economy',
    atomBalanceNote:
      'Reactants = 3n C, 6n H (42.08n g/mol); Product = 3n C, 6n H (42.08n g/mol). Zero small-molecule byproduct.',
  },
  'peg-pla-oncology': {
    definition:
      'PEG-b-PLA is an amphiphilic biodegradable diblock copolymer combining a hydrophilic poly(ethylene glycol) stealth shell with a hydrophobic poly(D,L-lactic acid) core that self-assembles into 20–80 nm oncology nanomicelles.',
    balancedReactants: 'CH₃O-(CH₂CH₂O)ₘ-H + n C₆H₈O₄ (D,L-Lactide)',
    balancedArrowConditions: 'Sn(Oct)₂, 130 °C, dry N₂',
    balancedProducts: 'CH₃O-(CH₂CH₂O)ₘ-[-CO-CH(CH₃)-O-]₂ₙ-H',
    stoichiometryType: 'Living Ring-Opening Polymerization (ROP) · 100% Atom Economy',
    atomBalanceNote:
      'Each cyclic D,L-lactide dimer (C₆H₈O₄, 144.13 g/mol) opens into 2 lactyl repeat units (2 × C₃H₄O₂); 6n C, 8n H, 4n O conserved.',
  },
  'pamam-oncology': {
    definition:
      'PAMAM (Generation 4) is a monodisperse, hyperbranched poly(amidoamine) dendrimer built radially from an ethylenediamine core, presenting 64 surface primary amine (-NH₂) groups for multivalent tumor targeting and drug/siRNA delivery.',
    balancedReactants: 'C₂H₄(NH₂)₂ (Core) + 124 CH₂=CHCOOCH₃ + 124 H₂N-CH₂CH₂-NH₂',
    balancedArrowConditions: 'MeOH, 25–45 °C, iterative 4-generation Michael addition & amidation',
    balancedProducts: 'G4-PAMAM-(NH₂)₆₄ [C₆₂₂H₁₂₄₈N₂₅₀O₁₂₄] + 124 CH₃OH',
    stoichiometryType: 'Divergent Iterative Condensation · 1 mol CH₃OH per Amide Bond',
    atomBalanceNote:
      'Exhaustive Michael addition (100% addition) followed by amidation eliminates 1 equiv CH₃OH per ester-to-amide conversion (124 mol CH₃OH for G4).',
  },
  plga: {
    definition:
      'PLGA is an FDA-approved biodegradable random aliphatic polyester copolymer of D,L-lactic acid and glycolic acid whose hydrolytic erosion rate in physiological media is tuned by the lactide-to-glycolide molar ratio.',
    balancedReactants: 'x C₆H₈O₄ (D,L-Lactide) + y C₄H₄O₄ (Glycolide)',
    balancedArrowConditions: 'Sn(Oct)₂, 140–175 °C, vacuum / N₂',
    balancedProducts: '-[-O-CH(CH₃)-CO-]₂ₓ-[-O-CH₂-CO-]₂ᵧ-',
    stoichiometryType: 'Ring-Opening Copolymerization · 100% Atom Economy',
    atomBalanceNote:
      'Reactants = (6x + 4y) C, (8x + 4y) H, (4x + 4y) O; completely conserved across 2x lactyl + 2y glycolyl ester repeat units.',
  },
  hpmc: {
    definition:
      'Hypromellose (HPMC) is a non-ionic semi-synthetic cellulose ether modified with methoxyl and 2-hydroxypropoxyl groups, widely used in pharmaceuticals as a swellable controlled-release tablet matrix and ophthalmic lubricant.',
    balancedReactants: '[C₆H₇O₂(OH)₃]ₙ + a·n CH₃Cl + b·n C₃H₆O + a·n NaOH',
    balancedArrowConditions: 'Aqueous alkali slurry, 50–85 °C, pressurized reactor',
    balancedProducts: '[C₆H₇O₂(OH)₃₋ₐ₋ᵦ(OCH₃)ₐ(OC₃H₆OH)ᵦ]ₙ + a·n NaCl + a·n H₂O',
    stoichiometryType: 'Williamson Etherification + Epoxide Addition',
    atomBalanceNote:
      'Each methoxyl substitution consumes 1 CH₃Cl + 1 NaOH and eliminates 1 NaCl + 1 H₂O; propylene oxide addition proceeds with 100% ring-opening addition.',
  },
  'dgeba-epoxy': {
    definition:
      'DGEBA/DETA Epoxy is a tightly crosslinked 3D thermoset polymer formed by step-growth ring-opening reaction of bisphenol A diglycidyl ether diepoxide with diethylenetriamine hardener.',
    balancedReactants: '5n C₂₁H₂₄O₄ (DGEBA, f=2) + 2n C₄H₁₃N₃ (DETA, f=5)',
    balancedArrowConditions: '25–120 °C exothermic cure (stoichiometric 1:1 amine-H : epoxide)',
    balancedProducts: 'Crosslinked 3D Poly(hydroxyaminoether) Network  [5:2 Molar Network]',
    stoichiometryType: 'Step-Growth Crosslinking · 100% Atom Economy (No Volatiles)',
    atomBalanceNote:
      '10 oxirane rings (5 × 2) open quantitatively across 10 active amine N-H bonds (2 × 5) yielding secondary -OH groups with zero volatile emission.',
  },
  'abs-copolymer': {
    definition:
      'ABS is a tough two-phase engineering terpolymer consisting of rigid styrene–acrylonitrile (SAN) chains grafted onto and dispersed around elastomeric polybutadiene rubber domains.',
    balancedReactants: 'x CH₂=CH(CN) + y CH₂=CH-CH=CH₂ + z CH₂=CH(C₆H₅)',
    balancedArrowConditions: 'K₂S₂O₈ radical initiator, 65–80 °C, aqueous emulsion graft',
    balancedProducts: '-[-CH₂-CH(CN)-]ₓ-[-CH₂-CH=CH-CH₂-]ᵧ-[-CH₂-CH(C₆H₅)-]₂-',
    stoichiometryType: 'Free-Radical Graft Terpolymerization · 100% Atom Economy',
    atomBalanceNote:
      'All monomer carbons, hydrogens, and nitrile nitrogens (3x+4y+8z C, 3x+6y+8z H, x N) are conserved inside the grafted terpolymer.',
  },
  polyaniline: {
    definition:
      'Polyaniline (emeraldine salt) is an intrinsically conducting conjugated polymer whose alternating benzenoid–quinoid amine/imine backbone becomes electrically conductive (1–300 S/cm) upon protonic acid doping.',
    balancedReactants: '4n C₆H₅NH₂ + 5n (NH₄)₂S₂O₈ + 2n HCl',
    balancedArrowConditions: '1 M HCl(aq), 0–5 °C, oxidative coupling & protonic doping',
    balancedProducts: '[(C₆H₄NH)₂(C₆H₄N⁺H)₂·2Cl⁻]ₙ + 5n (NH₄)₂SO₄ + 5n H₂SO₄',
    stoichiometryType: 'Oxidative Step-Growth Coupling + Acid Doping',
    atomBalanceNote:
      'Tetrameric emeraldine repeat requires 2e⁻ oxidation per aniline unit (5 persulfate equivalents per 4 anilines, including 2-electron emeraldine oxidation state).',
  },
  'pedot-pss': {
    definition:
      'PEDOT:PSS is a water-dispersible, optically transparent conducting polymer complex comprising oxidatively p-doped cationic poly(3,4-ethylenedioxythiophene) chains ionically stabilized by poly(styrenesulfonate) polyanions.',
    balancedReactants: '2n C₆H₆O₂S (EDOT) + 2.5n Na₂S₂O₈ + PSS-H',
    balancedArrowConditions: 'Aqueous PSS template, Fe₂(SO₄)₃ cat., 25 °C',
    balancedProducts: '[(C₆H₄O₂S)₂⁺₀.₅]ₙ : PSS⁻ + 2.5n Na₂SO₄ + 2n H₂SO₄',
    stoichiometryType: 'Oxidative Polyanion-Templated Polymerization',
    atomBalanceNote:
      'Each EDOT-to-EDOT oxidative C2–C5 coupling releases 2 H⁺ (2e⁻) plus ~0.25–0.33 positive charge per ring balanced electrostatically by PSS⁻ sulfonates.',
  },
  polyacetylene: {
    definition:
      'Iodine-doped trans-Polyacetylene is the Nobel Prize–winning prototypical conjugated polyene whose alternating C=C/C-C π-system transitions from semiconductor to metallic conductor (>10⁴ S/cm) upon oxidative I₂ doping.',
    balancedReactants: '2n HC≡CH (C₂H₂) + 3y·n I₂',
    balancedArrowConditions: 'Ti(OBu)₄ / AlEt₃ (-78 °C → 150 °C), then I₂ vapor',
    balancedProducts: 'trans-[(CH)⁺³ʸ(I₃⁻)ᵧ]₄ₙ',
    stoichiometryType: 'Coordination Insertion + Charge-Transfer Redox Doping',
    atomBalanceNote:
      'Polymerization of acetylene is 100% atom-economic; subsequent vapor doping adds 3y/2 I₂ per CH unit to form I₃⁻ polyiodide counterions.',
  },
  'kevlar-lcp': {
    definition:
      'Kevlar (PPTA) is a rigid-rod para-aramid lyotropic liquid crystal polymer whose coaxial aromatic rings and dense interchain hydrogen-bond sheets yield ultra-high tensile strength (3.6 GPa) and thermal stability.',
    balancedReactants: 'n H₂N-(p-C₆H₄)-NH₂ + n ClOC-(p-C₆H₄)-COCl',
    balancedArrowConditions: 'Anhydrous NMP / CaCl₂, 0–20 °C',
    balancedProducts: '-[-NH-(p-C₆H₄)-NH-CO-(p-C₆H₄)-CO-]ₙ- + 2n HCl',
    stoichiometryType: 'Low-Temperature Step-Growth Polycondensation',
    atomBalanceNote:
      'Reactants = 14n C, 12n H, 2n N, 2n O, 2n Cl; Products = repeat unit (14n C, 10n H, 2n N, 2n O) + 2n HCl (72.92 g/mol condensate).',
  },
  'vectra-lcp': {
    definition:
      'Vectra A950 is a melt-processable thermotropic liquid crystalline polyarylate copolymer of 4-hydroxybenzoic acid (73%) and 6-hydroxy-2-naphthoic acid (27%) featuring low melt viscosity and near-zero thermal expansion.',
    balancedReactants: '0.73n AcO-C₆H₄-COOH + 0.27n AcO-C₁₀H₆-COOH',
    balancedArrowConditions: '250–320 °C melt acidolysis under vacuum',
    balancedProducts: '-[(O-C₆H₄-CO)₀.₇₃-(O-C₁₀H₆-CO)₀.₂₇]ₙ- + n CH₃COOH',
    stoichiometryType: 'Melt Acidolysis Step-Growth Polycondensation',
    atomBalanceNote:
      'Each phenolic acetate reacts with a carboxylic acid group eliminating exactly 1 equivalent of acetic acid (CH₃COOH, 60.05 g/mol) per ester bond formed.',
  },
  pnipam: {
    definition:
      'PNIPAM is a thermo-responsive smart polymer exhibiting a sharp Lower Critical Solution Temperature (LCST) at 32 °C in water, reversibly switching between a hydrated coil and a collapsed hydrophobic globule near body temperature.',
    balancedReactants: 'n CH₂=CH-CO-NH-CH(CH₃)₂  [C₆H₁₁NO]',
    balancedArrowConditions: 'AIBN or KPS/TEMED radical initiator, 25–65 °C',
    balancedProducts: '-[-CH₂-CH(CONH-CH(CH₃)₂)-]ₙ-  [(C₆H₁₁NO)ₙ]',
    stoichiometryType: 'Free-Radical / RAFT Vinyl Addition · 100% Atom Economy',
    atomBalanceNote:
      'Vinyl π-bond converts to C-C σ-backbone with 100% mass conservation (6n C, 11n H, n N, n O; M₀ = 113.16 g/mol).',
  },
  'paa-smart': {
    definition:
      'Poly(acrylic acid) (PAA) is a pH-responsive weak polyacid (pKa ≈ 4.5) whose dense carboxylic acid groups ionize above pH 4.5, driving dramatic osmotic hydrogel swelling used in superabsorbents and enteric mucoadhesives.',
    balancedReactants: 'n CH₂=CH-COOH  [C₃H₄O₂]',
    balancedArrowConditions: '(NH₄)₂S₂O₈ initiator, H₂O, 60–75 °C',
    balancedProducts: '-[-CH₂-CH(COOH)-]ₙ-  [(C₃H₄O₂)ₙ]',
    stoichiometryType: 'Aqueous Free-Radical Addition · 100% Atom Economy',
    atomBalanceNote:
      'Reactants = 3n C, 4n H, 2n O (72.06n g/mol); Product = 3n C, 4n H, 2n O (72.06n g/mol).',
  },
  'hpma-doxorubicin': {
    definition:
      'HPMA Copolymer–Doxorubicin (PK1) is a water-soluble synthetic macromolecular prodrug linking doxorubicin via a cathepsin-B cleavable GFLG tetrapeptide spacer to a biocompatible poly(N-(2-hydroxypropyl)methacrylamide) carrier.',
    balancedReactants: 'n C₇H₁₃NO₂ (HPMA) + m MA-GFLG-ONp + m Dox·HCl',
    balancedArrowConditions: 'AIBN/DMSO (50 °C), then aminolysis with TEA',
    balancedProducts: '[HPMA]ₙ-co-[MA-GFLG-Dox]ₘ + m p-Nitrophenol + m Et₃NH⁺Cl⁻',
    stoichiometryType: 'Free-Radical Copolymerization + Active-Ester Aminolysis',
    atomBalanceNote:
      'Backbone copolymerization is 100% atom-economic; each Dox coupling displaces exactly 1 equiv p-nitrophenol leaving group.',
  },
  'polifeprosan-20': {
    definition:
      'Polifeprosan 20 (Gliadel Wafer matrix) is an FDA-approved biodegradable 20:80 polyanhydride copolymer of bis(p-carboxyphenoxy)propane and sebacic acid engineered for surface-eroding local carmustine brain-tumor delivery.',
    balancedReactants: '0.2n CPP-(CO-O-COCH₃)₂ + 0.8n SA-(CO-O-COCH₃)₂',
    balancedArrowConditions: '180 °C melt polycondensation, <0.1 mmHg vacuum',
    balancedProducts: '-[(CO-C₆H₄-O-(CH₂)₃-O-C₆H₄-CO-O)₀.₂-(CO-(CH₂)₈-CO-O)₀.₈]ₙ- + n (CH₃CO)₂O',
    stoichiometryType: 'Melt Mixed-Anhydride Polycondensation',
    atomBalanceNote:
      'Each diacid prepolymer unit eliminates 1 equivalent of acetic anhydride ((CH₃CO)₂O, 102.09 g/mol) during vacuum condensation.',
  },
  'paclitaxel-poliglumex': {
    definition:
      'Paclitaxel Poliglumex (Opaxio / PG-TXL) is a biodegradable α-L-glutamic acid polypeptide–drug conjugate that masks paclitaxel systemically until tumor EPR accumulation and lysosomal cathepsin-B cleavage.',
    balancedReactants: 'n C₁₂H₁₁NO₅ (Glu(OBzl)-NCA) → [Poly-Glu]ₙ + m Paclitaxel',
    balancedArrowConditions: 'NCA ROP (25 °C) + HBr deprotection + DCC/DMAP esterification',
    balancedProducts: '[Poly(L-Glu)]ₙ-(2\'-O-Paclitaxel)ₘ + n CO₂ + m DCU',
    stoichiometryType: 'NCA Ring-Opening Polymerization + Ester Conjugation',
    atomBalanceNote:
      'NCA ring-opening releases exactly 1 mol CO₂ per amino acid monomer; subsequent carbodiimide esterification yields 1 mol dicyclohexylurea (DCU) per drug.',
  },
  'peg-pasp-nk105': {
    definition:
      'PEG-b-Poly(aspartate) (NK105 / NC-6004 platform) is a biocompatible core–shell block copolymer combining a 12 kDa PEG stealth corona with a hydrophobic or platinum-coordinating poly(aspartic acid) core for tumor-targeted micelles.',
    balancedReactants: 'mPEG-NH₂ + n C₁₂H₁₁NO₅ (BLA-NCA) + n NaOH',
    balancedArrowConditions: 'DCM/DMF (35 °C) → alkaline deprotection / hydrophobic modification',
    balancedProducts: 'mPEG-[-NH-CH(CH₂COOH)-CO-]ₙ-H + n CO₂ + n C₆H₅CH₂OH',
    stoichiometryType: 'Macroinitiated NCA ROP + Side-Chain Deprotection',
    atomBalanceNote:
      'Each β-benzyl-L-aspartate NCA ring eliminates 1 mol CO₂ during chain propagation and 1 mol benzyl alcohol upon benzyl ester cleavage.',
  },
  'peg-pcl-micelle': {
    definition:
      'PEG-b-PCL is an amphiphilic polyether–polyester diblock copolymer that self-assembles into low-CMC core–shell nanomicelles for prolonged circulation and controlled release of hydrophobic chemotherapy agents.',
    balancedReactants: 'CH₃O-(CH₂CH₂O)ₘ-H + n C₆H₁₀O₂ (ε-Caprolactone)',
    balancedArrowConditions: 'Sn(Oct)₂ catalyst, 115–130 °C, dry N₂',
    balancedProducts: 'CH₃O-(CH₂CH₂O)ₘ-[-CO-(CH₂)₅-O-]ₙ-H',
    stoichiometryType: 'Living Ring-Opening Block Polymerization · 100% Atom Economy',
    atomBalanceNote:
      'Each ε-caprolactone ring (C₆H₁₀O₂, 114.14 g/mol) inserts cleanly into the living -OH chain end with zero byproduct formation.',
  },
  'chitosan-folate': {
    definition:
      'Chitosan is a natural cationic β-(1→4)-linked D-glucosamine polysaccharide obtained by alkaline N-deacetylation of marine chitin; its pKa 6.5 primary amines drive pH-triggered swelling in acidic tumor tissues.',
    balancedReactants: '[C₈H₁₃NO₅]ₙ (Chitin) + x·n NaOH (aq)',
    balancedArrowConditions: '40–50% NaOH(aq), 90–120 °C, N₂ atmosphere',
    balancedProducts: '[(C₆H₁₁NO₄)ₓ(C₈H₁₃NO₅)₁₋ₓ]ₙ (Chitosan) + x·n CH₃COONa',
    stoichiometryType: 'Alkaline N-Deacetylation of Biopolymer',
    atomBalanceNote:
      'Hydrolysis of each N-acetyl group (degree of deacetylation x) consumes 1 NaOH and generates 1 sodium acetate byproduct.',
  },
  'smancs-conjugate': {
    definition:
      'SMANCS is a clinically approved polymer–protein anticancer conjugate linking two low-molecular-weight poly(styrene-co-maleic acid) chains to neocarzinostatin, renowned for demonstrating the tumor EPR effect in hepatocellular carcinoma.',
    balancedReactants: 'n C₈H₈ + n C₄H₂O₃ → [SMA]ₙ + 0.5n NCS-(NH₂)₂',
    balancedArrowConditions: 'BPO (70 °C) alternating copolymerization; then NaHCO₃ buffer coupling',
    balancedProducts: 'SMANCS Conjugate [2 SMA chains per NCS protein]',
    stoichiometryType: 'Alternating Radical Copolymerization + Anhydride Amidation',
    atomBalanceNote:
      '1:1 alternating styrene–maleic anhydride copolymerization preserves 100% of monomer atoms; lysine amidation opens cyclic anhydrides with zero leaving group.',
  },
  'crlx101-cd-peg': {
    definition:
      'CRLX101 is a linear β-cyclodextrin–poly(ethylene glycol) copolymer conjugated to camptothecin that self-assembles into 20–40 nm nanoparticles for sustained topoisomerase I and HIF-1α inhibition in solid tumors.',
    balancedReactants: 'n β-CD-(NH₂)₂ + n PEG-(COOSu)₂ + m Gly-CPT',
    balancedArrowConditions: 'Anhydrous DMSO/TEA, 25 °C; EDC/NHS camptothecin coupling',
    balancedProducts: '[-β-CD-NH-CO-PEG-CO-NH-]ₙ-(CPT)ₘ + 2n HOSu',
    stoichiometryType: 'Step-Growth Active-Ester Polyamidation',
    atomBalanceNote:
      'Each amide bond formed between β-CD diamine and PEG-disuccinimidyl ester releases 1 equivalent of N-hydroxysuccinimide (HOSu).',
  },
  'peg-macrogol': {
    definition:
      'Polyethylene Glycol (PEG / Macrogol) is a water-soluble USP/FDA pharmaceutical polyether spanning liquid cosolvents (PEG 400) to crystalline osmotic laxatives and tablet binders (PEG 3350–8000).',
    balancedReactants: 'HO-CH₂CH₂-OH + (n − 1) C₂H₄O (Oxirane)',
    balancedArrowConditions: 'KOH / alkoxide catalyst, 80–120 °C, pressurized N₂',
    balancedProducts: 'H-[-O-CH₂-CH₂-]ₙ-OH',
    stoichiometryType: 'Anionic Ring-Opening Polymerization · 100% Atom Economy',
    atomBalanceNote:
      'Every ethylene oxide monomer (44.05 g/mol) adds quantitatively to the living alkoxide chain end with 100% atom conservation.',
  },
  'povidone-pvp': {
    definition:
      'Povidone (PVP) is an amorphous, water- and alcohol-soluble pharmaceutical polymer of N-vinyl-2-pyrrolidone used universally as a tablet binder, amorphous solid dispersion matrix, and iodine complexing carrier.',
    balancedReactants: 'n CH₂=CH-(NC₄H₆O)  [C₆H₉NO]',
    balancedArrowConditions: 'H₂O₂ / NH₄OH radical initiation, H₂O, 60–80 °C',
    balancedProducts: '-[-CH₂-CH(NC₄H₆O)-]ₙ-  [(C₆H₉NO)ₙ]',
    stoichiometryType: 'Aqueous Free-Radical Vinyl Addition · 100% Atom Economy',
    atomBalanceNote:
      '100% atom economy: 6n C, 9n H, n N, n O conserved directly from N-vinylpyrrolidone monomer (111.14n g/mol).',
  },
  'eudragit-l100': {
    definition:
      'Eudragit L100 is an anionic 1:1 copolymer of methacrylic acid and methyl methacrylate formulated as an oral enteric tablet coating that remains insoluble in gastric acid and dissolves at intestinal pH ≥ 6.0.',
    balancedReactants: 'n CH₂=C(CH₃)COOH + n CH₂=C(CH₃)COOCH₃',
    balancedArrowConditions: 'Persulfate/azo radical initiator, 70–85 °C',
    balancedProducts: '-[-CH₂-C(CH₃)(COOH)-]ₙ-[-CH₂-C(CH₃)(COOCH₃)-]ₙ-',
    stoichiometryType: 'Free-Radical 1:1 Copolymerization · 100% Atom Economy',
    atomBalanceNote:
      'Stoichiometric 1:1 feed preserves all 9n C, 14n H, 4n O across alternating/statistical methacrylic acid and methyl methacrylate units.',
  },
  'pcl-pharma': {
    definition:
      'Poly(ε-caprolactone) (PCL) is an FDA-cleared semi-crystalline biodegradable polyester featuring a 60 °C melting point and slow 1–3 year resorption profile ideal for long-acting subdermal drug depots and resorbable scaffolds.',
    balancedReactants: 'n C₆H₁₀O₂ (ε-Caprolactone) + R-OH',
    balancedArrowConditions: 'Sn(Oct)₂ catalyst, 110–140 °C, anhydrous N₂',
    balancedProducts: 'R-O-[-CO-(CH₂)₅-O-]ₙ-H',
    stoichiometryType: 'Ring-Opening Polymerization · 100% Atom Economy',
    atomBalanceNote:
      'Each cyclic lactone monomer (6 C, 10 H, 2 O) opens without condensation byproduct, conserving 100% of reactant mass.',
  },
  'pva-pharma': {
    definition:
      'Poly(vinyl alcohol) (PVA) is a biocompatible, water-soluble polyhydroxyl polymer produced by alcoholysis of poly(vinyl acetate), widely used in ophthalmic lubricants, tablet coatings, and freeze-thaw physical cryogels.',
    balancedReactants: '[-CH₂-CH(OCOCH₃)-]ₙ + n CH₃OH',
    balancedArrowConditions: 'NaOH catalyst, 40–60 °C methanolysis',
    balancedProducts: '[-CH₂-CH(OH)-]ₙ + n CH₃COOCH₃',
    stoichiometryType: 'Polymer-Analogous Base-Catalyzed Ester Interchange',
    atomBalanceNote:
      'Each vinyl acetate repeat unit (86.09 g/mol) exchanges with 1 CH₃OH (32.04 g/mol) to yield 1 vinyl alcohol unit (44.05 g/mol) + 1 methyl acetate (74.08 g/mol).',
  },
  'sodium-alginate': {
    definition:
      'Sodium Alginate is an anionic marine polysaccharide extracted from brown seaweed consisting of β-D-mannuronate and α-L-guluronate blocks that rapidly crosslink with Ca²⁺ ions into biocompatible hydrogel beads and gastric rafts.',
    balancedReactants: '2n [C₆H₇O₄(COO⁻Na⁺)] + n CaCl₂ (aq)',
    balancedArrowConditions: '25 °C aqueous ionic exchange (G-block egg-box chelation)',
    balancedProducts: '[C₆H₇O₄(COO⁻)]₂ₙ·Ca²⁺ₙ (Gel) + 2n NaCl (aq)',
    stoichiometryType: 'Divalent Ionic Crosslinking (2:1 Carboxylate : Ca²⁺)',
    atomBalanceNote:
      'Two monovalent Na⁺ counterions are stoichiometrically displaced by each divalent Ca²⁺ ion forming the insoluble calcium alginate hydrogel network.',
  },
};

export function getPolymerDefinitionAndSynthesis(
  polymer: PolymerData
): PolymerDefinitionAndBalance {
  const preset = CURATED_SYNTHESIS_DATA[polymer.id];
  if (preset) {
    return preset;
  }

  return {
    definition:
      polymer.definition ||
      `${polymer.name} (${polymer.iupacName}) is a ${polymer.category.toLowerCase()} macromolecule derived from ${polymer.monomerName} via ${polymer.polymerizationType.toLowerCase()}, possessing the repeating unit ${polymer.repeatUnitFormula}. ${polymer.mechanismHighlight}`,
    balancedReactants: polymer.equationReactants,
    balancedArrowConditions: polymer.equationConditions,
    balancedProducts: polymer.equationProducts,
    stoichiometryType: `${polymer.polymerizationType} · Stoichiometric Balance`,
    atomBalanceNote:
      polymer.balancedEquation ||
      `Monomer repeat unit molar mass M₀ = ${polymer.monomerMolarMass.toFixed(2)} g/mol. ${polymer.equationNotes}`,
  };
}
