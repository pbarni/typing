// PerformanceAnalyzer.js

/**
 * A static utility class for calculating typing performance metrics and generating
 * UI state. All methods within this class are pure functions, meaning they produce
 * output based solely on their inputs without side effects.
 */
class PerformanceAnalyzer {
    /**
     * Generates an array of character state objects by comparing the original text
     * with the user's typed text. This array is used by the Renderer to display
     * each character with the correct color (e.g., correct, incorrect, or default).
     *
     * @static
     * @param {string} originalText The source text for the typing test.
     * @param {string} typedText The current text as typed by the user.
     * @returns {{char: string, state: 'correct'|'incorrect'|'default'}[]} An array of objects,
     *   where each object contains a character from the original text and its current state.
     */
    static generateCharacterState(originalText, typedText) {
        return originalText.split('').map((char, index) => {
            const typedChar = typedText[index];
            let state = 'default';
            if (typedChar !== undefined) {
                state = (typedChar === char) ? 'correct' : 'incorrect';
            }
            return { char, state };
        });
    }

    /**
     * Calculates live statistics, including Words Per Minute (WPM) and accuracy.
     * NOTE: The WPM calculation is currently a placeholder and will require a timer
     * implementation (e.g., tracking a start time) to be functional.
     *
     * @static
     * @param {string} originalText The source text for the typing test.
     * @param {string} typedText The current text as typed by the user.
     * @returns {{wpm: number, accuracy: number}} An object containing the calculated
     *   WPM and the accuracy percentage (rounded to the nearest whole number).
     */
    static calculateLiveStats(originalText, typedText) {
        if (typedText.length === 0) {
            return { wpm: 0, accuracy: 100 };
        }
        
        // Accuracy calculation
        let correctChars = 0;
        for (let i = 0; i < typedText.length; i++) {
            if (typedText[i] === originalText[i]) {
                correctChars++;
            }
        }
        const accuracy = Math.round((correctChars / typedText.length) * 100);

        // WPM calculation (simplified for live updates, can be enhanced with a timer)
        const wordsTyped = typedText.trim().split(/\s+/).length;
        // This needs a start time to be accurate, but for now we'll mock it.
        // A more robust implementation would store a startTime in the TypingGame class.
        const wpm = 0; // WPM calculation would need a timer started on first keypress.

        return { wpm, accuracy };
    }
}