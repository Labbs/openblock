/**
 * Block ID generation.
 *
 * Generates RFC 4122 version 4 UUIDs using the platform's Web Crypto API,
 * so the core package has no runtime dependency for ID generation.
 *
 * @module
 */

const HEX: string[] = Array.from({ length: 256 }, (_, i) => (i + 0x100).toString(16).slice(1));

/**
 * Builds a v4 UUID from cryptographically secure random bytes.
 *
 * Used when `crypto.randomUUID` is unavailable: it only exists in secure
 * contexts (HTTPS / localhost), while `crypto.getRandomValues` is available
 * everywhere.
 */
function uuidFromRandomValues(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

  return (
    HEX[bytes[0]] + HEX[bytes[1]] + HEX[bytes[2]] + HEX[bytes[3]] + '-' +
    HEX[bytes[4]] + HEX[bytes[5]] + '-' +
    HEX[bytes[6]] + HEX[bytes[7]] + '-' +
    HEX[bytes[8]] + HEX[bytes[9]] + '-' +
    HEX[bytes[10]] + HEX[bytes[11]] + HEX[bytes[12]] +
    HEX[bytes[13]] + HEX[bytes[14]] + HEX[bytes[15]]
  );
}

/**
 * Generates a unique block ID (a random v4 UUID).
 *
 * @example
 * ```typescript
 * generateId(); // '3b241101-e2bb-4255-8caf-4136c566a962'
 * ```
 */
export function generateId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return uuidFromRandomValues();
}
