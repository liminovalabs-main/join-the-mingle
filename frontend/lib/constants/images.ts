/**
 * Project Mingler — Centralized Category Images & Avatar Utilities.
 * Resolves Mingle cover images consistently across Catalog Cards, Detail Hero,
 * Checkout Summaries, and Member Bookings.
 */

export const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  dinner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  cocktails: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
  wine_tasting: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
  brunch: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80",
  cooking: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
  games: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1200&q=80",
  cultural: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80",
  wellness: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80",
  other: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
};

/**
 * Resolves the primary image URL for a Mingle event.
 * If hero_image is empty, returns the high-res category-specific image
 * matching the Mingle's experience type.
 */
export function getMingleImageUrl(heroImage?: string | null, experienceType?: string): string {
  if (heroImage && (heroImage.startsWith("http://") || heroImage.startsWith("https://") || heroImage.startsWith("/"))) {
    return heroImage;
  }
  if (experienceType && FALLBACK_CATEGORY_IMAGES[experienceType]) {
    return FALLBACK_CATEGORY_IMAGES[experienceType];
  }
  return FALLBACK_CATEGORY_IMAGES.other;
}

/**
 * Convenient alias for getMingleImageUrl with (experienceType, heroImage) parameter order.
 */
export function resolveCategoryHeroImage(
  experienceType?: string,
  heroImage?: string | null
): string {
  return getMingleImageUrl(heroImage, experienceType);
}


/**
 * Normalizes an avatar URL so relative media paths (/media/...) are prefixed
 * with the backend host if required.
 */
export function formatAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") || "http://127.0.0.1:8000";
  return `${backendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}
