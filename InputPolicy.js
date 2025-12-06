// InputPolicy.js

// Pre-allocate sets for O(1) lookup performance
const FORBIDDEN_KEYS = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
    'Home', 'End', 'PageUp', 'PageDown', 'Delete'
]);

/**
 * Policy: System Level Filters.
 */
export function shouldIgnoreInput(event) {
    const { key, ctrlKey, metaKey, altKey } = event;

    // 1. Allow Function Keys (F1-F12)
    if (/^F\d+$/.test(key)) return true;

    // 2. Ignore Standard Modifiers
    if (ctrlKey || metaKey || altKey) return true;

    // 3. Ignore Navigation (Set lookup is O(1))
    if (FORBIDDEN_KEYS.has(key)) return true;

    return false;
}

/**
 * Policy: Key Mapping.
 */
export function isEnterToSpaceMapping(key, expectedChar) {
    return key === 'Enter' && expectedChar === ' ';
}

/**
 * Policy: The Gate (TypeRacer Rule).
 * Updated to enforce Strict Word Boundaries.
 */
export function isGateBlocking(key, typedText, originalText) {
    const currentIndex = typedText.length;
    const expectedChar = originalText[currentIndex];

    // Case A: User explicitly presses Space (or Enter)
    // We must ensure the word typed so far is completely correct.
    if (key === ' ' || key === 'Enter') {
        const isCorrectSoFar = originalText.startsWith(typedText);
        return !isCorrectSoFar; // Block if there are typos
    }

    // Case B: User is AT a word boundary (Expected Char is Space)
    // But they typed a letter/number instead (trying to skip the space).
    if (expectedChar === ' ') {
        // Since we know 'key' is NOT Space/Enter (passed Case A),
        // we must block this input to force the user to finish the word correctly.
        return true; 
    }

    return false;
}