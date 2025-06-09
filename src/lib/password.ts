import * as argon2 from "argon2";

// Argon2id configuration optimized for security and performance
// These values are recommended by OWASP for production use
export const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB - memory cost
  timeCost: 3, // Number of iterations
  parallelism: 1, // Number of parallel threads
  hashLength: 32, // Output hash length in bytes
  saltLength: 16, // Salt length in bytes
};

/**
 * Hash a password using Argon2id
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_CONFIG);
}

/**
 * Verify a password against its hash using Argon2id
 * @param hash - Stored password hash
 * @param password - Plain text password to verify
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Check if a hash was created with Argon2
 * @param hash - Password hash to check
 * @returns boolean - True if hash is Argon2 format
 */
export function isArgon2Hash(hash: string): boolean {
  return hash.startsWith("$argon2");
}

// Export configuration for consistency
export { argon2 };
