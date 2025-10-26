// tests/InputHandler/InputHandler.test.js

import { Test } from '../test-framework.js';
import { InputHandler } from '../../InputHandler.js';

Test.describe("InputHandler.process()", () => {

    // --- Test Setup ---
    // The InputHandler needs a 'journal' object to work. We create a mock
    // version for our tests. This mock only needs to provide the methods
    // that the InputHandler actually uses: getLog() and originalText.
    const createMockJournal = (originalText, keystrokeLog = []) => ({
        originalText: originalText,
        getLog: () => keystrokeLog,
    });

    // ==================================================================
    // Equivalence Partitioning: Testing different classes of key types.
    // ==================================================================

    Test.describe("Partition: Character Keys", () => {
        const testCases = [
            // Correct Characters
            { name: "a correct lowercase character", key: 'h', expectedType: 'correct', expectedIsCorrect: true },
            
            // --- THIS IS THE LINE TO CHANGE ---
            // FROM:
            // { name: "a correct space character", key: ' ', expectedType: 'correct', expectedIsCorrect: true },
            // TO (add the 'text' property):
            { name: "a correct space character", key: ' ', expectedType: 'correct', expectedIsCorrect: true, text: " hello world" },
            
            // Incorrect Characters
            { name: "an incorrect character", key: 'x', expectedType: 'error', expectedIsCorrect: false },
            { name: "an incorrect character when a space is expected", key: 'a', expectedType: 'error', expectedIsCorrect: false, text: "word another" },
        ];

        Test.it.each(testCases)(
            "should process {name} correctly",
            ({ key, expectedType, expectedIsCorrect, text = "hello world" }) => {
                const journal = createMockJournal(text);
                const event = { key };
                
                const result = InputHandler.process(event, journal);

                Test.assertEqual(result.type, expectedType, "The event type should be correct.");
                Test.assertEqual(result.isCorrect, expectedIsCorrect, "The isCorrect flag should be set correctly.");
                Test.assertEqual(result.key, key, "The event should log the actual key pressed.");
                Test.assertEqual(result.cursorPos, 0, "Cursor position should be at the start for a new log.");
            }
        );
    });

    Test.describe("Partition: Non-Character and Special Keys", () => {
        const testCases = [
            { key: 'Backspace', expectedType: 'backspace' },
            { key: 'Shift', expectedType: 'special' },
            { key: 'Control', expectedType: 'special' },
            { key: 'ArrowLeft', expectedType: 'special' },
            { key: 'F5', expectedType: 'special' },
        ];

        Test.it.each(testCases)(
            "should classify '{key}' as a '{expectedType}' event",
            ({ key, expectedType }) => {
                const journal = createMockJournal("any text");
                const event = { key };

                const result = InputHandler.process(event, journal);

                Test.assertEqual(result.type, expectedType);
                Test.assertEqual(result.key, key);
            }
        );
    });

    // ==================================================================
    // Boundary Value Analysis: Testing the "edges" of the logic.
    // ==================================================================

    Test.describe("Boundary Value Analysis", () => {

        Test.it("should process the correct next character after replaying a log with backspaces", () => {
            const text = "one two";
            // Log simulates typing 'o', 'n', 'e', ' ', then a backspace.
            const log = [
                { type: 'correct' }, // o
                { type: 'correct' }, // n
                { type: 'correct' }, // e
                { type: 'correct' }, // (space)
                { type: 'backspace' }  // cursor moves back, typed text is now "one"
            ];
            // After replay, cursor should be at index 3, expecting the character ' '.
            const journal = createMockJournal(text, log);
            const event = { key: ' ' }; // Pressing the correct next character (' ')
        
            const result = InputHandler.process(event, journal);
        
            Test.assertEqual(result.cursorPos, 3, "Cursor position should be 3 after the log replay.");
            Test.assertEqual(result.type, 'correct', "Should correctly identify ' ' as correct at the new position.");
        });

        Test.it("should return an 'extra' event when typing past the end of the text", () => {
            const text = "end";
            const log = [{ type: 'correct' }, { type: 'correct' }, { type: 'correct' }]; // Simulates 'e', 'n', 'd' typed
            const journal = createMockJournal(text, log);
            const event = { key: 'a' }; // Attempting to type an extra 'a'

            const result = InputHandler.process(event, journal);
            
            Test.assertEqual(result.type, 'extra', "Event type for typing past the end should be 'extra'.");
            Test.assertEqual(result.cursorPos, 3, "Cursor position should be at the end of the text.");
        });

        Test.it("should handle backspace when the cursor is at position 0", () => {
            const journal = createMockJournal("hello", []); // Empty log means cursor is at 0
            const event = { key: 'Backspace' };
            
            const result = InputHandler.process(event, journal);

            Test.assertEqual(result.type, 'backspace', "Event type should be backspace.");
            Test.assertEqual(result.cursorPos, 0, "Cursor position should remain 0 when backspacing at the start.");
        });
    });
});