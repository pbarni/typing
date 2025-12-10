// InputPolicy.js

export class InputPolicy {
    constructor() {
        // Forbidden navigation/modifier keys
        this.forbiddenKeys = new Set([
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
            'Home', 'End', 'PageUp', 'PageDown', 'Delete'
        ]);
    }

    shouldIgnoreInput(event) {
        const { key, ctrlKey, metaKey, altKey } = event;
        if (/^F\d+$/.test(key)) return true;
        if (ctrlKey || metaKey || altKey) return true;
        if (this.forbiddenKeys.has(key)) return true;
        return false;
    }

    shouldBlockInput(key, typedText, originalText) {
        const nextIndex = typedText.length;
        const expectedChar = originalText[nextIndex];

        // LOGIC:
        // We only enforce rules when the USER is supposed to type a SPACE (Word Boundary).
        // 1. If we are at a boundary, previous text must be perfect (TypeRacer Gate).
        // 2. If we are at a boundary, the input must be a Space (Strict Space).
        // 3. Everywhere else? Allow everything (including mistaken spaces).

        if (expectedChar === ' ') {
            // Rule 1: Gate Check (History must be clean)
            // We check if the target text starts with what we typed so far.
            const isClean = originalText.startsWith(typedText);
            if (!isClean) {
                return { isBlocked: true, reason: 'typeracer-gate' };
            }

            // Rule 2: Strict Input Check (Must type Space/Enter)
            if (key !== ' ' && key !== 'Enter') {
                return { isBlocked: true, reason: 'strict-space' };
            }
        }

        // If we are NOT at a word boundary, we allow errors (mistaken chars or spaces).
        return { isBlocked: false };
    }

    isEnterMappedToSpace(key, expectedChar) {
        return key === 'Enter' && expectedChar === ' ';
    }
}