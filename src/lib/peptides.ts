export const PEPTIDE_CATALOG: Record<
  string,
  { label: string; category: string; aliases: string[] }
> = {
  "bpc-157": {
    label: "BPC-157",
    category: "Healing & Recovery",
    aliases: ["bpc157", "body protection compound"],
  },
  "tb-500": {
    label: "TB-500",
    category: "Healing & Recovery",
    aliases: ["tb500", "thymosin beta-4"],
  },
  semaglutide: {
    label: "Semaglutide",
    category: "GLP-1 / Weight Loss",
    aliases: ["ozempic", "wegovy"],
  },
  tirzepatide: {
    label: "Tirzepatide",
    category: "GLP-1 / Weight Loss",
    aliases: ["mounjaro", "zepbound"],
  },
  retatrutide: {
    label: "Retatrutide",
    category: "GLP-1 / Weight Loss",
    aliases: ["ly3437943"],
  },
  ipamorelin: {
    label: "Ipamorelin",
    category: "Growth Hormone",
    aliases: ["ipa"],
  },
  "cjc-1295": {
    label: "CJC-1295",
    category: "Growth Hormone",
    aliases: ["cjc1295", "cjc 1295"],
  },
  "ghk-cu": {
    label: "GHK-Cu",
    category: "Anti-Aging",
    aliases: ["copper peptide", "ghk cu"],
  },
  "pt-141": {
    label: "PT-141",
    category: "Other",
    aliases: ["bremelanotide"],
  },
  "melanotan-ii": {
    label: "Melanotan II",
    category: "Other",
    aliases: ["mt2", "melanotan 2"],
  },
  "aod-9604": {
    label: "AOD-9604",
    category: "Weight Loss",
    aliases: ["aod9604"],
  },
  "mots-c": {
    label: "MOTS-c",
    category: "Mitochondrial",
    aliases: ["motsc"],
  },
  "nad-plus": {
    label: "NAD+",
    category: "Longevity",
    aliases: ["nad+", "nicotinamide adenine dinucleotide"],
  },
  sermorelin: {
    label: "Sermorelin",
    category: "Growth Hormone",
    aliases: ["grf 1-29"],
  },
  tesamorelin: {
    label: "Tesamorelin",
    category: "Growth Hormone",
    aliases: ["egrifta"],
  },
  epitalon: {
    label: "Epitalon",
    category: "Longevity",
    aliases: ["epithalon"],
  },
  selank: {
    label: "Selank",
    category: "Nootropic",
    aliases: [],
  },
  semax: {
    label: "Semax",
    category: "Nootropic",
    aliases: [],
  },
  "thymosin-alpha-1": {
    label: "Thymosin Alpha-1",
    category: "Immune",
    aliases: ["ta1", "thymosin alpha 1"],
  },
  "mk-677": {
    label: "MK-677",
    category: "Growth Hormone",
    aliases: ["ibutamoren"],
  },
  "hexarelin": {
    label: "Hexarelin",
    category: "Growth Hormone",
    aliases: [],
  },
  "dsip": {
    label: "DSIP",
    category: "Sleep",
    aliases: ["delta sleep inducing peptide"],
  },
  "kisspeptin": {
    label: "Kisspeptin",
    category: "Other",
    aliases: [],
  },
  "ll-37": {
    label: "LL-37",
    category: "Immune",
    aliases: [],
  },
  "foxo4-dri": {
    label: "FOXO4-DRI",
    category: "Longevity",
    aliases: ["foxo4"],
  },
};

export function normalizePeptideKey(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function resolvePeptideKey(query: string): string | null {
  const normalized = normalizePeptideKey(query);

  if (PEPTIDE_CATALOG[normalized]) return normalized;

  for (const [key, meta] of Object.entries(PEPTIDE_CATALOG)) {
    if (meta.label.toLowerCase() === query.toLowerCase().trim()) return key;
    if (meta.aliases.some((a) => a.toLowerCase() === query.toLowerCase().trim()))
      return key;
    if (key.replace(/-/g, "") === normalized.replace(/-/g, "")) return key;
  }

  for (const [key, meta] of Object.entries(PEPTIDE_CATALOG)) {
    if (
      key.includes(normalized) ||
      normalized.includes(key) ||
      meta.label.toLowerCase().includes(normalized) ||
      normalized.includes(meta.label.toLowerCase())
    ) {
      return key;
    }
  }

  return null;
}

export function parseDosageMg(text: string): { mg: number | null; label: string } {
  const cleaned = text.toLowerCase();
  const mgMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*mg/i);
  if (mgMatch) {
    return { mg: parseFloat(mgMatch[1]), label: `${mgMatch[1]}mg` };
  }
  const mcgMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*mcg/i);
  if (mcgMatch) {
    const mg = parseFloat(mcgMatch[1]) / 1000;
    return { mg, label: `${mcgMatch[1]}mcg` };
  }
  return { mg: null, label: text.trim() };
}

export function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d{2})?)/);
  return match ? parseFloat(match[1]) : null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calcPricePerMg(price: number, dosageMg: number | null): number | null {
  if (!dosageMg || dosageMg <= 0) return null;
  return Math.round((price / dosageMg) * 100) / 100;
}
