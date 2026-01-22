export function extractUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s)\]]+/gim);
  return matches ? Array.from(new Set(matches)) : [];
}

export function extractFirstUrl(text: string): string | null {
  return extractUrls(text)[0] ?? null;
}

export function isYouTubeUrl(url: string) {
  try {
    const u = new URL(url);
    return ["youtube.com", "www.youtube.com", "youtu.be"].includes(u.hostname);
  } catch {
    return false;
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;

    // /live/ID or /embed/ID or /shorts/ID
    const parts = u.pathname.split("/").filter(Boolean);
    const maybeId = parts[1];
    if (["live", "embed", "shorts"].includes(parts[0]) && maybeId) {
      return `https://www.youtube.com/embed/${maybeId}`;
    }

    return null;
  } catch {
    return null;
  }
}

export function getGoogleDriveFileId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("drive.google.com")) return null;

    // patterns:
    // https://drive.google.com/file/d/<id>/view
    const m1 = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m1?.[1]) return m1[1];

    // https://drive.google.com/open?id=<id>
    const id = u.searchParams.get("id");
    if (id) return id;

    return null;
  } catch {
    return null;
  }
}

export function getGoogleDrivePreviewUrl(url: string): string | null {
  const id = getGoogleDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}
