// InputPolicy.js

export class InputPolicy {
    // We pass the config in. This is the "Dependency Injection".
    constructor(mechanicsConfig) {
        this.config = mechanicsConfig;
        
        // Faster lookup for forbidden keys
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
        // If the 'stopOnError' rule is disabled in config, never block!
        if (!this.config.stopOnError) return { isBlocked: false };

        const nextIndex = typedText.length;
        const expectedChar = originalText[nextIndex];

        // 1. Strict Space Rule
        if (this.config.strictSpace) {
            // If we are at a space, and user types something else -> Block
            if (expectedChar === ' ' && key !== ' ' && key !== 'Enter') {
                return { isBlocked: true, reason: 'strict-space' };
            }
        }

        // 2. TypeRacer Gate Rule (Must be clean before advancing)
        if (key === ' ' || key === 'Enter') {
            const isCorrectSoFar = originalText.startsWith(typedText);
            if (!isCorrectSoFar) {
                return { isBlocked: true, reason: 'typeracer-gate' };
            }
        }

        return { isBlocked: false };
    }

    isEnterMappedToSpace(key, expectedChar) {
        return key === 'Enter' && expectedChar === ' ';
    }
}