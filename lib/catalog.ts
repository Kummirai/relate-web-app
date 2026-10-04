/**
 * Shared web-side catalog constants (mirrors frontend/src/constants/clubs.ts).
 * Used by the public site and the admin editor to pick which club a magazine
 * belongs to.
 */

export type ClubEntry = {
  slug: string;
  name: string;
  color: string;
  tagline?: string;
};

export const CLUBS: ClubEntry[] = [
  { slug: "sprout", name: "Sprout", color: "#4CAF50", tagline: "Little ones growing together" },
  { slug: "sprout-kids", name: "Sprout Kids", color: "#66BB6A", tagline: "Kids 6–8 learning to read God's story" },
  { slug: "sprout-tweens", name: "Sprout Tweens", color: "#4CAF50", tagline: "Tweens 9–11 growing deep roots" },
  { slug: "sprout-teens", name: "Sprout Teens", color: "#43A047", tagline: "Teens 12–15 finding their footing" },
  { slug: "surge", name: "Surge", color: "#FF6B00", tagline: "Youth stepping into purpose" },
  { slug: "pulse", name: "Pulse", color: "#00B4D8", tagline: "Young adults building life and faith" },
  { slug: "prime", name: "Prime", color: "#6C2BD9", tagline: "Adults in their prime" },
  { slug: "anchor", name: "Anchor", color: "#2E7D32", tagline: "Holding families steady" },
  { slug: "spark", name: "Spark", color: "#E8A2B6", tagline: "Newly married couples building the foundation" },
  { slug: "synergy", name: "Synergy", color: "#8A9A5B", tagline: "Seasoned couples building legacy" },
];

export const clubBySlug = (slug?: string | null): ClubEntry | undefined =>
  CLUBS.find((c) => c.slug === slug);

export const clubName = (slug?: string | null): string =>
  slug ? clubBySlug(slug)?.name || slug : "Relate";

/** Magazine series offered today. "Relate" is the no-club umbrella series. */
export const SERIES = ["Relate", "Rooted", "Footsteps"];

export const PUBLICATION_KINDS = ["magazine", "bulletin"] as const;
export const PUBLICATION_STATUSES = ["published", "draft"] as const;

export const SEASON_NAMES = ["Spring", "Summer", "Autumn", "Winter"];

export const BLOCK_TYPES = [
  { type: "paragraph", label: "Paragraph" },
  { type: "heading", label: "Heading" },
  { type: "quote", label: "Quote" },
  { type: "image", label: "Image" },
  { type: "list", label: "Bullet list" },
  { type: "checklist", label: "Checklist" },
  { type: "quiz", label: "Quiz" },
  { type: "reflection", label: "Reflection" },
  { type: "pray", label: "Prayer" },
] as const;