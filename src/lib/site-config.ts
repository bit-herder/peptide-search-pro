/**
 * Link this app to your main site for traffic + branding.
 * Set these in Vercel env vars (or .env.local).
 */
export const siteConfig = {
  /** Your main site URL, e.g. https://yoursite.com */
  parentSiteUrl: process.env.NEXT_PUBLIC_PARENT_SITE_URL ?? "",
  /** Label for the back link in the header */
  parentSiteName: process.env.NEXT_PUBLIC_PARENT_SITE_NAME ?? "Main site",
  /** Public URL of this tool (for canonical/OG). Defaults to Vercel URL in prod. */
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
  /** Optional path prefix if mounted under your main domain, e.g. /tools/peptide-search */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};

export function parentSiteHref(): string | null {
  const url = siteConfig.parentSiteUrl.trim();
  return url || null;
}
