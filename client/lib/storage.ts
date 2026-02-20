/**
 * Generate a unique 12-character access key
 * Format: XXXX-XXXX-XXXX (without dashes for display)
 */
export function generateAccessKey(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluded similar characters (I,O,0,1)
  let result = ""

  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }

  return result
}

/**
 * Validate access key format
 */
export function validateAccessKey(key: string): boolean {
  // Must be exactly 12 characters
  if (key.length !== 12) return false

  // Must only contain allowed characters
  const allowedPattern = /^[A-HJ-NP-Z2-9]+$/
  return allowedPattern.test(key)
}

/**
 * Format access key for display (add dashes)
 */
export function formatAccessKey(key: string): string {
  if (key.length !== 12) return key
  return `${key.slice(0, 4)}-${key.slice(4, 8)}-${key.slice(8, 12)}`
}

/**
 * Store access key in local storage (optional - for user convenience)
 * Note: This is purely for UX, the key should be the only way to access reports
 */
export function storeAccessKey(key: string): void {
  try {
    const stored = getStoredAccessKeys()
    if (!stored.includes(key)) {
      stored.push(key)
      localStorage.setItem("yourvoice_keys", JSON.stringify(stored))
    }
  } catch {
    // localStorage might be unavailable
    console.warn("Could not store access key in localStorage")
  }
}

/**
 * Get stored access keys from local storage
 */
export function getStoredAccessKeys(): string[] {
  try {
    const stored = localStorage.getItem("yourvoice_keys")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Remove an access key from local storage
 */
export function removeStoredAccessKey(key: string): void {
  try {
    const stored = getStoredAccessKeys()
    const filtered = stored.filter((k) => k !== key)
    localStorage.setItem("yourvoice_keys", JSON.stringify(filtered))
  } catch {
    console.warn("Could not remove access key from localStorage")
  }
}
