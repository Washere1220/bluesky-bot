/**
 * Check if a Bluesky username is available
 * @param {string} username - Username to check (without .bsky.social)
 * @returns {Promise<boolean>} - true if available, false if taken
 */
export async function checkUsernameAvailability(username) {
  const handle = `${username}.bsky.social`;
  const url = `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`;

  try {
    const response = await fetch(url);

    if (response.status === 400) {
      // 400 = handle not found = available
      return true;
    } else if (response.status === 200) {
      // 200 with DID = taken
      const data = await response.json();
      return !data.did; // If DID exists, it's taken
    } else {
      // Unknown status, assume taken to be safe
      console.warn(`Unexpected status ${response.status} for ${handle}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking ${handle}:`, error);
    // On error, assume taken to be safe
    return false;
  }
}

/**
 * Add delay between checks for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check multiple usernames with rate limiting
 * @param {string[]} usernames - Array of usernames to check
 * @param {Function} onProgress - Callback for progress updates (checked, found, current)
 * @returns {Promise<string[]>} - Array of available usernames
 */
export async function checkMultipleUsernames(usernames, onProgress) {
  const available = [];
  let checked = 0;

  for (const username of usernames) {
    if (onProgress) {
      onProgress({
        checked,
        found: available.length,
        current: username,
        total: usernames.length
      });
    }

    const isAvailable = await checkUsernameAvailability(username);

    if (isAvailable) {
      available.push(username);
    }

    checked++;

    // Rate limiting: 100-200ms delay between checks
    const delayMs = 100 + Math.random() * 100;
    await delay(delayMs);
  }

  // Final progress update
  if (onProgress) {
    onProgress({
      checked,
      found: available.length,
      current: null,
      total: usernames.length
    });
  }

  return available;
}
