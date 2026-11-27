import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface PubChemPropertyResponse {
  PropertyTable?: {
    Properties?: Array<{
      CID: number;
      MolecularFormula?: string;
      MolecularWeight?: number;
      IUPACName?: string;
    }>;
  };
}

async function fetchPubChemMetadata(query: string): Promise<{
  cid: string | null;
  formula: string | null;
  mw: number | null;
  iupac: string | null;
}> {
  try {
    const clean = encodeURIComponent(query.trim());
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${clean}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { cid: null, formula: null, mw: null, iupac: null };
    const data = (await res.json()) as PubChemPropertyResponse;
    const p = data.PropertyTable?.Properties?.[0];
    if (!p) return { cid: null, formula: null, mw: null, iupac: null };
    return {
      cid: String(p.CID),
      formula: p.MolecularFormula ?? null,
      mw: p.MolecularWeight ? Number(p.MolecularWeight) : null,
      iupac: p.IUPACName ?? null,
    };
  } catch {
    return { cid: null, formula: null, mw: null, iupac: null };
  }
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw.trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'PolyLab Chemistry API' });
  });

  app.post('/api/polymer-resolve', async (req, res) => {
    const polymerName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!polymerName || polymerName.length < 2 || polymerName.length > 120) {
      res.status(400).json({ error: 'Please enter a valid polymer name (2–120 characters).' });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: 'Chemistry resolution service requires GEMINI_API_KEY in Secrets.',
      });
      return;
    }

    try {
      const pubchem = await fetchPubChemMetadata(polymerName);

      const prompt = `Look up verified peer-reviewed polymer chemistry data for "${polymerName}".
${pubchem.cid ? `PubChem reference found: CID ${pubchem.cid}, Formula ${pubchem.formula}, MW ${pubchem.mw}, IUPAC ${pubchem.iupac}.` : ''}

Return ONLY a single valid JSON object (no markdown commentary outside the JSON) matching this exact TypeScript structure:
{
  "id": "slug-name",
  "name": "Full Polymer Name",
  "shortName": "Short Abbreviation",
  "iupacName": "poly(...)",
  "casNumber": "real CAS number",
  "pubchemCid": "${pubchem.cid ?? 'relevant PubChem CID or N/A'}",
  "category": "one of: Cancer Therapy | Pharmaceutical | Epoxy & Thermoset | Co-polymer & Commodity | Conducting & Doped | Liquid Crystal (LCP) | Smart Polymer",
  "definition": "1-2 sentence formal polymer science definition naming monomer, backbone class, and primary function",
  "mechanismHighlight": "1-2 sentence mechanistic summary",
  "monomerName": "Monomer name(s)",
  "monomerFormula": "chemical formula with unicode subscripts",
  "repeatUnitFormula": "[-...-]ₙ",
  "monomerMolarMass": number (in g/mol, > 10),
  "polymerizationType": "reaction mechanism name",
  "equationReactants": "balanced reactants with stoichiometric n/m coefficients",
  "equationConditions": "catalyst, temp, pressure/solvent",
  "equationProducts": "balanced polymer + small-molecule byproducts (if any)",
  "balancedEquation": "atom and molar balance explanation (e.g. 100% atom economy or exact condensate moles eliminated)",
  "equationNotes": "concise mechanistic note",
  "atoms3D": [
    // 6 to 12 representative 3D atoms of ONE repeat unit centered near (0,0,0), backbone oriented along +X from headAtomIndex to tailAtomIndex, realistic bond lengths ~1.3-1.55 A
    { "id": 0, "element": "C|H|O|N|S|Cl|F|I|P", "x": number, "y": number, "z": number, "hybridization": "sp3|sp2|sp|1s", "role": "functional role" }
  ],
  "bonds3D": [
    { "from": 0, "to": 1, "order": 1 } // order is 1, 2, 3, or 1.5
  ],
  "chainStepVector": [number, 0, 0], // X translation between repeat units, e.g. [2.5, 0, 0] to [6.5, 0, 0]
  "headAtomIndex": 0,
  "tailAtomIndex": number,
  "physicalProperties": {
    "densityGcm3": "e.g. 1.05 g/cm³",
    "tgC": "e.g. 100 °C (373 K)",
    "tmC": "e.g. 240 °C or Amorphous",
    "tensileStrengthMPa": "e.g. 48 MPa",
    "youngsModulusGPa": "e.g. 3.1 GPa",
    "elongationPct": "e.g. 3–10%",
    "conductivitySCm": "e.g. 10⁻¹⁵ S/cm",
    "crystallinity": "e.g. Amorphous or 50%"
  },
  "chemicalProperties": {
    "solubility": "...",
    "chemicalResistance": "...",
    "thermalDegradationC": "...",
    "reactivityAndDoping": "...",
    "functionalGroups": "..."
  },
  "radarProfile": {
    "thermalStability": 0-100,
    "mechanicalStrength": 0-100,
    "chemicalResistance": 0-100,
    "conductivity": 0-100,
    "biocompatibility": 0-100,
    "processability": 0-100
  },
  "humanHazards": ["2-3 verified human toxicology/health disadvantages"],
  "animalEcoHazards": ["2-3 verified animal/ecological hazards"],
  "precautions": {
    "ghsSignal": "Danger | Warning | Low Hazard",
    "ppe": ["2-3 concrete PPE items"],
    "engineeringControls": ["2 concrete engineering controls"],
    "handlingAndDisposal": ["2 concrete storage/disposal rules"]
  },
  "markHouwinkK": number (in mL/g, e.g. 0.012),
  "markHouwinkA": number (between 0.5 and 1.1),
  "foxFlory": {
    "tgInfK": number (Kelvin, e.g. 373),
    "kg": number (K * g/mol, e.g. 60000),
    "typicalMn": number (e.g. 50000)
  },
  "kinetics": {
    "kp": number (L/mol/s),
    "kt": number (L/mol/s),
    "kd": number (1/s),
    "f": number (0.5-0.9),
    "referenceTempK": number,
    "alphaCoupling": number (0.0 to 1.0)
  },
  "mlDescriptors": {
    "rigidityIndex": number (1-10),
    "cohesiveEnergyDensity": number (150-900),
    "hBondIndex": number (0-5),
    "crosslinkDensity": number (0-1),
    "sideChainBulk": number (1-10),
    "experimentalTgK": number,
    "experimentalTensileMPa": number,
    "experimentalModulusGPa": number
  },
  "pdiTgNotes": {
    "pdiEffect": "...",
    "tgEffect": "...",
    "structuralDrivers": ["3 short phrases"]
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction:
            'You are an authoritative polymer chemist and chemical safety toxicologist. Use Google Search to verify real chemical formulas, CAS numbers, Tg, Tm, Mark-Houwink constants, Fox-Flory parameters, and GHS toxicology. Never fabricate invalid chemical claims. Return strictly valid JSON.',
        },
      });

      const text = response.text ?? '';
      const parsed = extractJsonObject(text);
      if (!parsed) {
        res.status(502).json({
          error: `Could not resolve structured chemistry data for "${polymerName}". Please verify the polymer name and try again.`,
        });
        return;
      }

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const groundedSources = groundingChunks
        .map((c: { web?: { uri?: string; title?: string } }) => c.web)
        .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri))
        .slice(0, 4)
        .map((w) => ({
          title: w.title || 'Verified Chemical Reference',
          publisher: 'Google Grounded Literature',
          url: w.uri,
        }));

      if (pubchem.cid) {
        groundedSources.unshift({
          title: `${polymerName} Compound Entry (CID ${pubchem.cid})`,
          publisher: 'PubChem / NCBI',
          url: `https://pubchem.ncbi.nlm.nih.gov/compound/${pubchem.cid}`,
        });
      }

      if (groundedSources.length === 0) {
        groundedSources.push({
          title: 'NIST Chemistry WebBook Polymer Reference',
          publisher: 'NIST',
          url: 'https://webbook.nist.gov/chemistry/',
        });
      }

      // Generate default MWD bins using the resolved typicalMn
      const foxFlory = (parsed.foxFlory as Record<string, number>) || {};
      const typicalMn = Number(foxFlory.typicalMn) || 45000;
      const defaultBins = Array.from({ length: 12 }, (_, i) => {
        const m = Math.round(typicalMn * 0.15 * Math.pow(18, i / 11));
        const ratio = m / typicalMn;
        const moles = Math.max(0.05, Number((Math.exp(-ratio) * ratio * 12).toFixed(3)));
        return { id: `res-${i + 1}`, molarMass: m, moles };
      });

      res.json({
        polymer: {
          ...parsed,
          defaultBins,
          sources: groundedSources,
          isResolvedExternal: true,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected server error';
      res.status(500).json({ error: `Polymer lookup failed: ${msg}` });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PolyLab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
