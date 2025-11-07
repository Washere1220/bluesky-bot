import { generateUsernameVariations } from '../utils/usernameGenerator';
import { checkUsernameAvailability, delay } from '../utils/blueskyUsernameChecker';

/**
 * Prepare available usernames for account creation
 * @param {string} baseWord - Base username to generate variations from
 * @param {number} neededCount - Number of available usernames needed
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} - Result object with usernames or error
 */
export async function prepareAvailableUsernames(baseWord, neededCount, onProgress) {
  try {
    // Generate variations (3x needed count for buffer)
    const variations = generateUsernameVariations(baseWord, neededCount);

    if (onProgress) {
      onProgress({
        type: 'generating',
        message: `Generated ${variations.length} username variations`,
        generated: variations.length
      });
    }

    // Check each variation for availability
    const availableUsernames = [];
    let checked = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    for (const username of variations) {
      // Stop if we have enough usernames
      if (availableUsernames.length >= neededCount) {
        break;
      }

      // Update progress
      if (onProgress) {
        onProgress({
          type: 'checking',
          checked,
          found: availableUsernames.length,
          needed: neededCount,
          current: username,
          total: variations.length,
          message: `Checking: ${username}.bsky.social`
        });
      }

      try {
        const isAvailable = await checkUsernameAvailability(username);

        if (isAvailable) {
          availableUsernames.push(username);
          consecutiveErrors = 0; // Reset error counter on success

          if (onProgress) {
            onProgress({
              type: 'found',
              username,
              found: availableUsernames.length,
              needed: neededCount,
              message: `✓ Found: ${username}.bsky.social`
            });
          }
        }

        checked++;

        // Rate limiting: 100-200ms delay
        const delayMs = 100 + Math.random() * 100;
        await delay(delayMs);

      } catch (error) {
        consecutiveErrors++;
        console.error(`Error checking ${username}:`, error);

        // If too many consecutive errors, might be rate limited or network issue
        if (consecutiveErrors >= maxConsecutiveErrors) {
          if (onProgress) {
            onProgress({
              type: 'warning',
              message: `Network issues detected. Slowing down checks...`,
              consecutiveErrors
            });
          }

          // Slow down significantly
          await delay(2000);
          consecutiveErrors = 0; // Reset after slowdown
        }
      }
    }

    // Check if we found enough usernames
    if (availableUsernames.length < neededCount) {
      return {
        success: false,
        error: 'not_enough_usernames',
        message: `Only found ${availableUsernames.length} available usernames out of ${neededCount} needed. Try a different base word or reduce the account count.`,
        found: availableUsernames.length,
        needed: neededCount,
        usernames: availableUsernames
      };
    }

    // Success!
    if (onProgress) {
      onProgress({
        type: 'complete',
        message: `✅ Ready! Found ${availableUsernames.length} available usernames`,
        usernames: availableUsernames,
        checked
      });
    }

    return {
      success: true,
      usernames: availableUsernames,
      checked,
      message: `Successfully found ${availableUsernames.length} available usernames`
    };

  } catch (error) {
    console.error('Error in prepareAvailableUsernames:', error);

    return {
      success: false,
      error: 'unknown_error',
      message: `An error occurred: ${error.message}`,
      details: error
    };
  }
}

/**
 * Retry username preparation with exponential backoff
 * @param {string} baseWord - Base username
 * @param {number} neededCount - Number needed
 * @param {Function} onProgress - Progress callback
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - Result object
 */
export async function prepareAvailableUsernamesWithRetry(baseWord, neededCount, onProgress, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;

    if (onProgress && attempt > 1) {
      onProgress({
        type: 'retry',
        attempt,
        maxRetries,
        message: `Retry attempt ${attempt}/${maxRetries}...`
      });
    }

    const result = await prepareAvailableUsernames(baseWord, neededCount, onProgress);

    if (result.success) {
      return result;
    }

    // If it's a "not enough usernames" error, don't retry
    if (result.error === 'not_enough_usernames') {
      return result;
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      if (onProgress) {
        onProgress({
          type: 'waiting',
          message: `Waiting ${waitTime / 1000}s before retry...`,
          waitTime
        });
      }
      await delay(waitTime);
    }
  }

  // All retries failed
  return {
    success: false,
    error: 'max_retries_exceeded',
    message: `Failed after ${maxRetries} attempts. Please try again later.`
  };
}
