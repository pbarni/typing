// InputRules.js

/**
 * Determines if a key event should be ignored by the game engine entirely
 * (e.g., browser shortcuts, navigation, modifiers).
 */
export function shouldIgnoreInput(event) {
    // 1. Allow Function Keys (F5, F12, etc.) to bubble up to browser
    if (/^F\d+$/.test(event.key)) return true;

    // 2. Ignore Standard Modifiers
    if (event.ctrlKey || event.metaKey || event.altKey) return true;

    // 3. Ignore Navigation Keys (Let the browser or default behavior handle them if needed, 
    //    but here we generally want to stop them from adding text)
    const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Delete'];
    if (navKeys.includes(event.key)) return true;

    return false;
}

/**
 * Game Rule: Map 'Enter' to 'Space' if the context allows it.
 */
export function isEnterToSpaceMapping(key, expectedChar) {
    return key === 'Enter' && expectedChar === ' ';
}

/**
 * Game Rule: The "Gate". 
 * Checks if the user is attempting to type a space (move to next word)
 * but has mistakes in the current word.
 */
export function isGateBlocking(key, typedText, originalText) {
    // If we aren't typing a space (or mapping Enter to space), the gate doesn't apply
    if (key !== ' ' && key !== 'Enter') return false;

    // Gate Logic: If the text typed so far doesn't match the start of the original text,
    // we are in an error state and should block the spacebar.
    const isCorrectSoFar = originalText.startsWith(typedText);
    return !isCorrectSoFar;
}