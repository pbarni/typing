// Input-Handler.js

/**
 * A static class responsible for processing raw keyboard events and classifying them
 * into meaningful, structured event objects for the typing game. It determines the
 * type of key pressed (e.g., correct, error, backspace) based on the current
 * state of the typing journal.
 */
export class InputHandler {
    /**
     * Analyzes a keyboard event against the current state of the typing journal
     * to produce a detailed event log object.
     *
     * This method first calculates the current cursor position by replaying the
     * journal's keystroke log. It then classifies the incoming key event based
     * on this calculated position and the original text.
     *
     * @static
     * @param {KeyboardEvent} event - The DOM keyboard event, primarily using the `key` property.
     * @param {TypingJournal} journal - The current typing journal instance, which provides
     *   the original text and the keystroke history.
     * @returns {{
     *   key: string,
     *   type: 'correct'|'error'|'backspace'|'special'|'extra',
     *   timestamp: number,
     *   cursorPos: number,
     *   expectedChar?: string,
     *   isCorrect?: boolean
     * }} A structured object describing the processed event.
     * - `type`: The classification of the key press.
     *   - `correct`: The pressed key matches the expected character.
     *   - `error`: The pressed key does not match the expected character.
     *   - `backspace`: The 'Backspace' key was pressed.
     *   - `special`: A non-typing key (e.g., 'Shift', 'Control') was pressed.
     *   - `extra`: A character was typed after the end of the original text.
     */
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