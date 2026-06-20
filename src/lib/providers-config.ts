import type { ProviderConfig } from "@/lib/scraper/types";

/** Editorial baseline trust (0–10). Live scores also use scraped COA/catalog data. */
function wc(
  slug: string,
  name: string,
  host: string,
  trust: number,
  extra?: Partial<ProviderConfig>
): ProviderConfig {
  const website = host.startsWith("http") ? host : `https://${host}`;
  return {
    slug,
    name,
    website,
    trust_score: trust,
    enabled: true,
    scraper: "woocommerce",
    ...extra,
  };
}

/**
 * Tracked supplier registry — curated from community directories (e.g. Peptigrity),
 * industry lists, and live WooCommerce probes. Web discovery fills gaps beyond this list.
 */
export const PROVIDERS: ProviderConfig[] = [
  {
    slug: "vpr-members-club",
    name: "VPR Members Club",
    website: "https://vprmembersclub.com",
    trust_score: 9.1,
    enabled: true,
    scraper: "vpr",
  },
  wc("certified-pep", "Certified Pep", "certified-pep.com", 9.0),
  wc("licensed-peptides", "Licensed Peptides", "licensedpeptides.com", 9.0),
  wc("penguin-peptides", "Penguin Peptides", "penguinpeptides.com", 9.0),
  wc("instant-peptides", "Instant Peptides", "instantpeptides.com", 8.9),
  wc("koi-peptides", "Koi Peptides", "koipeptides.com", 8.8),
  wc("life-link-research", "Life Link Research", "lifelinkresearch.com", 8.8),
  wc("panda-peptides", "Panda Peptides", "pandapeptides.com", 8.7),
  wc("verified-peptides", "Verified Peptides", "verifiedpeptides.com", 8.7),
  wc("hydro-research-peptides", "Hydro Research Peptides", "hydroresearchpeptides.com", 8.6),
  wc("biotech-peptides", "Biotech Peptides", "biotechpeptides.com", 8.4, { shopPath: "/" }),
  wc("precisely-peptides", "Precisely Peptides", "www.preciselypeptides.com", 8.4),
  wc("primelab-peptides", "PrimeLab Peptides", "primelab-peptides.com", 8.4),
  {
    slug: "pure-rawz",
    name: "PureRawz",
    website: "https://purerawz.co",
    trust_score: 8.5,
    enabled: true,
    scraper: "catalog",
  },
  wc("ng-peptide", "NG Peptide", "ngpeptide.com", 8.3),
  wc("core-peptides", "Core Peptides", "corepeptides.com", 8.3, { shopPath: "/" }),
  wc("aio-peptides", "AIO Peptides", "aaiopeptides.com", 8.2),
  wc("swiss-chems", "Swiss Chems", "swisschems.is", 8.2),
  wc("loti-labs", "Loti Labs", "lotilabs.com", 8.1),
  wc("skye-peptides", "Skye Peptides", "skyepeptides.com", 8.0),
  wc("ascension-peptides", "Ascension Peptides", "ascensionpeptides.com", 8.0),
  wc("peptide-partners", "Peptide Partners", "peptide.partners", 8.0),
  wc("peptidic-research", "Peptidic Research", "peptidicresearch.com", 7.9),
  wc("adonis-research", "Adonis Research", "adonisresearch.is", 7.9),
  wc("beyond-peptides", "Beyond Peptides", "beyond-peptides.com", 7.9),
  wc("vital-core", "Vital Core Research", "vitalcoreresearch.com", 7.9),
  wc("fusion-peptide", "Fusion Peptide", "fusionpeptide.com", 7.8),
  wc("peptide-crafters", "Peptide Crafters", "peptidecrafters.com", 7.8),
  wc("trusted-peptides", "Trusted Peptides", "trustedpeptides.store", 7.8),
  wc("peptide-supply-co", "Peptide Supply Co", "peptidesupplyco.com", 7.8),
  wc("protide-health", "Protide Health", "protidehealth.com", 7.8),
  wc("wolverine-peptides", "Wolverine Peptides", "wolverinepeptides.net", 7.8),
  wc("behemoth-labz", "Behemoth Labz", "behemothlabz.com", 7.8),
  wc("peptidology", "Peptidology", "peptidology.co", 7.8),
  wc("peptira", "Peptira", "peptira.com", 7.7),
  wc("ez-peptides", "EZ Peptides", "ezpeptides.com", 7.7),
  wc("particle-peptides", "Particle Peptides", "particlepeptides.com", 7.7),
  wc("nuscience-peptides", "NuScience Peptides", "nusciencepeptides.com", 7.5),
  wc("modern-aminos", "Modern Aminos", "modernaminos.com", 7.6),
  wc("paramount-peptides", "Paramount Peptides", "paramountpeptides.com", 7.6),
  wc("peptide-pros", "Peptide Pros", "peptidepros.net", 7.6),
  wc("simple-peptide", "Simple Peptide", "simplepeptide.com", 7.6),
  wc("almighty-peptides", "Almighty Peptides", "almightypeptides.com", 7.6),
  wc("prime-peptides", "Prime Peptides", "primepeptides.co", 7.6),
  wc("royal-peptides", "Royal Peptides", "royalpeptides.com", 7.5),
  wc("alpha-omega-peptide", "Alpha Omega Peptide", "alphaomegapeptide.com", 7.5),
  wc("spartan-peptides", "Spartan Peptides", "spartanpeptides.com", 7.5),
  wc("atomik-labz", "Atomik Labz", "atomiklabz.com", 7.5),
  wc("limitless-life", "Limitless Life Nootropics", "limitlesslifenootropics.com", 7.5),
  wc("peak-peptide", "Peak Peptide", "peakpeptide.com", 7.5),
  wc("mile-high-compounds", "Mile High Compounds", "milehighcompounds.com", 7.4),
  wc("omegamino", "Omegamino", "omegamino.com", 7.4),
  wc("regenerative-research", "Regenerative Research", "regenerativeresearch.com", 7.4),
  wc("peptide-direct", "Peptide Direct", "peptidedirect.com", 7.4),
  wc("peptide-outlet", "Peptide Outlet", "peptideoutlet.com", 7.4),
  wc("peptide-zone", "Peptide Zone", "peptidezone.com", 7.4),
  wc("peptide-heaven", "Peptide Heaven", "peptideheaven.com", 7.4),
  wc("peptide-pharm", "Peptide Pharm", "peptidepharm.com", 7.4),
  wc("peptide-verse", "Peptide Verse", "peptideverse.com", 7.4),
  wc("peptide-zen", "Peptide Zen", "peptidezen.com", 7.4),
  wc("peptide-hq", "Peptide HQ", "peptidehq.com", 7.4),
];

export function getProviderBySlug(slug: string): ProviderConfig | undefined {
  return PROVIDERS.find((p) => p.slug === slug);
}

export const TRACKED_PROVIDER_COUNT = PROVIDERS.filter((p) => p.enabled).length;
