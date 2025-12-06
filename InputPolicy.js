// InputPolicy.js

/**
 * Policy: System Level Filters.
 * Determines if a key event should be ignored by the engine entirely
 * to allow browser defaults (like F12, F5) or prevent cursor navigation.
 */
export function shouldIgnoreInput(event) {
    // 1. Allow Function Keys (F1-F12)
    if (/^F\d+$/.test(event.key)) return true;

    // 2. Ignore Standard Modifiers (Ctrl, Alt, Meta)
    if (event.ctrlKey || event.metaKey || event.altKey) return true;

    // 3. Ignore Navigation Keys (we don't want the cursor moving inside the hidden textarea)
    const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Delete'];
    if (navKeys.includes(event.key)) return true;

    return false;
}

/**
 * Policy: Key Mapping.
 * Returns true if we should treat 'Enter' as a 'Space'.
 * This makes soft-wrapping lines feel natural to type.
 */
export function isEnterToSpaceMapping(key, expectedChar) {
    return key === 'Enter' && expectedChar === ' ';
}

/**
 * Policy: The Gate (TypeRacer Rule).
 * Prevents the user from typing a SPACE (advancing to the next word)
 * if the current word has not been typed correctly.
 */
export function isGateBlocking(key, typedText, originalText) {
    // The gate only applies when trying to end a word (Space or Enter-mapped-to-Space)
    if (key !== ' ' && key !== 'Enter') return false;

    // Check if the text typed so far perfectly matches the start of the target text.
    const isCorrectSoFar = originalText.startsWith(typedText);
    
    // If not correct, block the input.
    return !isCorrectSoFar;
}