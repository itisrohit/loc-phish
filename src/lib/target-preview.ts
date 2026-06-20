import type { Campaign } from "@/types";

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readMetaContent(html: string, attribute: "property" | "name", key: string) {
  const attr = escapeRegExp(attribute);
  const escapedKey = escapeRegExp(key);
  const patterns = [
    new RegExp(
      `<meta[^>]*${attr}=["']${escapedKey}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${escapedKey}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return "";
}

function readTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : "";
}

function normalizeUrl(url: string, baseUrl: string) {
  if (!url) return "";

  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return "";
  }
}

export async function fetchTargetPreview(targetUrl: string) {
  try {
    const parsedTarget = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsedTarget.protocol)) {
      return null;
    }

    const response = await fetch(parsedTarget.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PreviewBot/1.0; +https://vercel.com)",
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const html = await response.text();
    const title =
      readMetaContent(html, "property", "og:title") ||
      readMetaContent(html, "name", "twitter:title") ||
      readTitle(html);
    const description =
      readMetaContent(html, "property", "og:description") ||
      readMetaContent(html, "name", "description") ||
      readMetaContent(html, "name", "twitter:description");
    const image = normalizeUrl(
      readMetaContent(html, "property", "og:image") ||
        readMetaContent(html, "name", "twitter:image"),
      parsedTarget.toString()
    );
    const siteName = readMetaContent(html, "property", "og:site_name");

    if (!title && !description && !image && !siteName) {
      return null;
    }

    return {
      previewTitle: title || undefined,
      previewDescription: description || undefined,
      previewImage: image || undefined,
      previewSiteName: siteName || undefined,
    } satisfies Pick<
      Campaign,
      "previewTitle" | "previewDescription" | "previewImage" | "previewSiteName"
    >;
  } catch (error) {
    console.error("Failed to fetch target preview metadata:", error);
    return null;
  }
}
