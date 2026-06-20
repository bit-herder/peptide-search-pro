import { PEPTIDE_CATALOG } from "./peptides";

/** Short research summaries for SEO landing pages — not medical advice */
export const PEPTIDE_GUIDES: Record<string, { summary: string; faq: { q: string; a: string }[] }> = {
  "bpc-157": {
    summary:
      "BPC-157 (Body Protection Compound-157) is a synthetic peptide fragment studied in preclinical models for tissue repair, gut integrity, and angiogenesis. It is one of the most searched research peptides for price comparison.",
    faq: [
      { q: "What is BPC-157 used for in research?", a: "Laboratory studies explore its effects on wound healing, tendon/ligament models, and GI protection. Not approved for human use." },
      { q: "How is BPC-157 priced?", a: "Prices vary by mg/vial and vendor. Compare normalized $/mg to evaluate different vial sizes fairly." },
    ],
  },
  semaglutide: {
    summary:
      "Semaglutide is a GLP-1 receptor agonist analog studied for metabolic research. Also known by brand-associated aliases Ozempic and Wegovy in clinical contexts.",
    faq: [
      { q: "Why do Semaglutide prices vary so much?", a: "Dosage (2mg vs 5mg vs 10mg), purity claims, and COA availability drive large price spreads across suppliers." },
      { q: "How should I compare Semaglutide listings?", a: "Use $/mg normalization and verify vial strength matches the listing title." },
    ],
  },
  tirzepatide: {
    summary:
      "Tirzepatide is a dual GIP/GLP-1 receptor agonist studied in metabolic research. High demand makes price comparison especially valuable.",
    faq: [
      { q: "What dosages are common?", a: "Research listings typically range from 5mg to 15mg+ per vial depending on supplier." },
    ],
  },
  "tb-500": {
    summary:
      "TB-500 is a synthetic fraction of thymosin beta-4 studied in research models for cell migration and tissue recovery pathways.",
    faq: [
      { q: "TB-500 vs BPC-157 pricing?", a: "Both are popular recovery-research peptides; compare $/mg across matched dosages." },
    ],
  },
  ipamorelin: {
    summary:
      "Ipamorelin is a selective growth hormone secretagogue peptide used in research studying GH release without strong cortisol/prolactin spikes.",
    faq: [],
  },
};

export function getPeptideGuide(key: string) {
  const meta = PEPTIDE_CATALOG[key];
  if (!meta) return null;
  const guide = PEPTIDE_GUIDES[key];
  return {
    key,
    label: meta.label,
    category: meta.category,
    aliases: meta.aliases,
    summary:
      guide?.summary ??
      `${meta.label} is a research peptide in the ${meta.category} category. Compare prices across tracked suppliers and live web discovery.`,
    faq: guide?.faq ?? [
      {
        q: `How do I find the best ${meta.label} price?`,
        a: "Search PeptideSearch Pro to compare normalized $/mg across indexed suppliers and web-discovered stores.",
      },
    ],
  };
}

export function getAllPeptideGuides() {
  return Object.keys(PEPTIDE_CATALOG).map((key) => getPeptideGuide(key)!);
}
