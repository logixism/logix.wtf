import type { APIRoute } from "astro";
import {
  DISCORD_USER_ID,
  FALLBACK_AVATAR_URL,
} from "../shared/profile";

const DISCORD_AVATAR_HASH = /^(?:a_)?[a-f0-9]{16,128}$/i;
const SUPPORTED_IMAGE_TYPES: Record<string, true> = {
  "image/avif": true,
  "image/gif": true,
  "image/jpeg": true,
  "image/png": true,
  "image/webp": true,
};

function getAvatarSource(url: URL): {
  cacheControl: string;
  sourceUrl: string;
} {
  const avatarHash = url.searchParams.get("v");

  if (avatarHash !== null && DISCORD_AVATAR_HASH.test(avatarHash)) {
    return {
      cacheControl: "public, max-age=31536000, immutable",
      sourceUrl: `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${avatarHash}.webp?size=512&quality=lossless`,
    };
  }

  return {
    cacheControl: "public, max-age=300, stale-while-revalidate=86400",
    sourceUrl: FALLBACK_AVATAR_URL,
  };
}

export const GET = (async ({ url }) => {
  const { cacheControl, sourceUrl } = getAvatarSource(url);

  try {
    const upstream = await fetch(sourceUrl, {
      headers: {
        Accept: "image/webp,image/avif,image/png,image/jpeg,image/gif",
      },
      signal: AbortSignal.timeout(5_000),
    });
    const contentType = upstream.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase();

    if (
      !upstream.ok ||
      contentType === undefined ||
      SUPPORTED_IMAGE_TYPES[contentType] !== true
    ) {
      return new Response("Avatar unavailable", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const image = await upstream.arrayBuffer();

    return new Response(image, {
      headers: {
        "Cache-Control": cacheControl,
        "Content-Disposition": 'inline; filename="avatar.webp"',
        "Content-Length": String(image.byteLength),
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Could not proxy profile avatar", error);
    return new Response("Avatar unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}) satisfies APIRoute;
