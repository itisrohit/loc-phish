export function generatePublicSlug(length = 7) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let slug = "";

  for (let index = 0; index < length; index += 1) {
    slug += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return slug;
}

export async function createUniquePublicSlug(exists: (slug: string) => Promise<boolean>) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = generatePublicSlug();
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique public slug");
}

export function buildCampaignLink(
  origin: string,
  session: { id: string; publicSlug?: string },
  options?: { useSlug?: boolean }
) {
  if (options?.useSlug !== false && session.publicSlug) {
    return `${origin}/v/${session.publicSlug}`;
  }

  return `${origin}/verify?s=${session.id}`;
}
