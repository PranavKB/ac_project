/**
 * Utility functions for client-side JWT parsing and expiration checking.
 */

/**
 * Safely decodes a base64url-encoded string (JWT payload section).
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  try {
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Extracts and parses the payload object from a JWT token.
 * @param {string} token - The raw JWT token string
 * @returns {object|null} The parsed payload or null if invalid
 */
export function parseJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  return base64UrlDecode(parts[1]);
}

/**
 * Checks whether a given JWT token is expired or invalid.
 * @param {string} token - The raw JWT token string
 * @param {number} safetyBufferSeconds - Optional safety margin in seconds (default 5s)
 * @returns {boolean} True if token is missing, malformed, or past expiry date
 */
export function isTokenExpired(token, safetyBufferSeconds = 5) {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp - safetyBufferSeconds <= currentTime;
}
