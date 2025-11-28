// GameLogic.js

export class GameLogic {
    /**
     * Analyzes the state of the game in a single pass.
     * @param {string} originalText - The target text.
     * @param {string} typedText - The user's input.
     * @param {number} startTime - Timestamp when typing started (0 if not started).
     */
    static analyze(originalText, typedText, startTime) {
        const maxLength = originalText.length;
        // Prevent typing past the end from breaking arrays
        const safeTyped = typedText.slice(0, maxLength);
        
        // 1. Generate Character States (Visuals)
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
        // Accuracy
        const accuracy = safeTyped.length > 0 
            ? Math.round((correctChars / safeTyped.length) * 100) 
            : 100;

        // WPM Calculation
        // Formula: (Correct Characters / 5) / Time in Minutes
        let wpm = 0;
        if (startTime > 0) {
            const timeElapsedMin = (Date.now() - startTime) / 60000;
            // Avoid division by zero or weird spikes at the very start
            if (timeElapsedMin > 0.001) { 
                wpm = Math.round((correctChars / 5) / timeElapsedMin);
            }
        }

        return {
            charStates,
            // The cursor is visually at the end of the input
            cursorPos: safeTyped.length,
            isGameFinished: safeTyped === originalText,
            stats: { wpm, accuracy }
        };
    }
}