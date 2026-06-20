import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VerifyClient from "@/components/VerifyClient";
import { getServerSessionBySlug } from "@/lib/firebase-server";

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

const DEFAULT_PREVIEW_IMAGE =
  process.env.NEXT_PUBLIC_DEFAULT_PREVIEW_IMAGE || "https://cloudflare.com/img/logo-web-badges/cf-logo-on-white-bg.svg";

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const session = await getServerSessionBySlug(slug);

  if (!session) {
    return {
      title: "Secure Verification",
      description: "Verification page unavailable.",
    };
  }

  const title = session.previewTitle || session.name || session.hostname || "Secure Verification";
  const description =
    session.previewDescription ||
    `Continue to ${session.hostname || "the requested site"} after verification.`;
  const image = session.previewImage || DEFAULT_PREVIEW_IMAGE;
  const siteName = session.previewSiteName || session.hostname || "Secure Verification";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName,
      type: "website",
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicVerifyPage({ params }: RouteParams) {
  const { slug } = await params;
  const session = await getServerSessionBySlug(slug);

  if (!session) {
    notFound();
  }

  return (
    <VerifyClient
      sessionId={session.id}
      hostname={session.hostname}
      redirectUrl={session.redirect}
    />
  );
}
