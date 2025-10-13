// InputHandler.js

class InputHandler {
    static process(event, journal) {
        const { key } = event;
        const timestamp = Date.now();
        const log = journal.getLog();

        // Determine the current cursor position by replaying the log
        let cursorPos = 0;
        log.forEach(e => {
            if (e.type === 'correct' || e.type === 'error') cursorPos++;
            if (e.type === 'backspace') cursorPos = Math.max(0, cursorPos - 1);
        });

        // 1. Classify the key type
        if (key === 'Backspace') {
            return { key, type: 'backspace', timestamp, cursorPos: Math.max(0, cursorPos - 1) };
        }
        if (key.length > 1) { // Catches 'Shift', 'Control', 'ArrowLeft', etc.
            return { key, type: 'special', timestamp, cursorPos };
        }
        // Prevent typing past the end
        if (cursorPos >= journal.originalText.length) {
            return { key, type: 'extra', timestamp, cursorPos };
        }

        // 2. If it's a typing character, analyze it
        const expectedChar = journal.originalText[cursorPos];
        const isCorrect = key === expectedChar;

        return {
            key,
            expectedChar,
            isCorrect,
            type: isCorrect ? 'correct' : 'error',
            timestamp,
            cursorPos
        };
    }
}