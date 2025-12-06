// StateAnalyzer.js

/**
 * Pure function: Analyzes text state and calculates statistics.
 * 
 * @param {string} originalText - The target text.
 * @param {string} typedText - The user's current input.
 * @param {number} startTime - Timestamp when typing began (or 0).
 * @returns {object} - Contains { charStates, cursorPos, isFinished, stats }
 */
export function computeGameState(originalText, typedText, startTime) {
    const maxLength = originalText.length;
    // Prevent typing past the end from breaking arrays
    const safeTyped = typedText.slice(0, maxLength);
    
    // 1. Generate Character States (for Visuals)
    let correctChars = 0;
    const charStates = originalText.split('').map((char, index) => {
        const typedChar = safeTyped[index];
        if (typedChar === undefined) {
            return { char, state: 'default' };
        }
        if (typedChar === char) {
            correctChars++;
            return { char, state: 'correct' };
        }
        return { char, state: 'incorrect' };
    });

    // 2. Calculate Stats (Math)
    // Accuracy (Raw comparison)
    const accuracy = safeTyped.length > 0 
        ? Math.round((correctChars / safeTyped.length) * 100) 
        : 100;

    // WPM Calculation
    let wpm = 0;
    if (startTime > 0) {
        const timeElapsedMin = (Date.now() - startTime) / 60000;
        // Avoid division by zero or immediate spikes
        if (timeElapsedMin > 0.001) { 
            // Standard: 5 characters = 1 word
            wpm = Math.round((correctChars / 5) / timeElapsedMin);
        }
    }

    return {
        charStates,
        // The cursor is visually at the end of the input
        cursorPos: safeTyped.length,
        isFinished: safeTyped === originalText,
        stats: { wpm, accuracy }
    };
}