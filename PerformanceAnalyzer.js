// PerformanceAnalyzer.js

class PerformanceAnalyzer {
    // Generates character states based on the LIVE typed text from the textarea
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

    // Calculates stats based on the LIVE typed text
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