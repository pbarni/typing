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
 */
export function isGateBlocking(key, typedText, originalText) {
    if (key !== ' ' && key !== 'Enter') return false;

    // startsWith is efficient and widely supported
    const isCorrectSoFar = originalText.startsWith(typedText);
    
    return !isCorrectSoFar;
}