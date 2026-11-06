/**
 * Formats a player ID for consistent display across all screens.
 * Retains the full ID in the database and state, while presenting
 * a clean cyberpunk-themed hex identifier (e.g. 0x9B6D2A or 0x9B6D).
 */
export function formatPlayerId(id?: string | null): string {
  if (!id) return "0x0000";

  // If already prefixed with 0x
  if (id.startsWith("0x") || id.startsWith("0X")) {
    const raw = id.slice(2).replace(/[^a-fA-F0-9]/g, "");
    return `0x${(raw.slice(0, 6) || "0000").toUpperCase()}`;
  }

  // If standard UUID or alphanumeric string, extract hex chars
  const hexOnly = id.replace(/[^a-fA-F0-9]/g, "");
  if (hexOnly.length >= 4) {
    return `0x${hexOnly.slice(0, 6).toUpperCase()}`;
  }

  return `0x${id.slice(0, 6).toUpperCase()}`;
}
