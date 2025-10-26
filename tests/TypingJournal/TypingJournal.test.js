// tests/TypingJournal/TypingJournal.test.js

import { Test } from '../test-framework.js';
import { TypingJournal } from '../../TypingJournal.js';

Test.describe("TypingJournal", () => {

    // ==================================================================
    // Testing: Constructor and Basic Methods
    // ==================================================================
    Test.describe("Initialization and Basic Methods", () => {
        Test.it("should initialize with the original text and an empty log", () => {
            const text = "hello world";
            const journal = new TypingJournal(text);

            Test.assertEqual(journal.originalText, text, "Original text should be set correctly.");
            Test.assertDeepEqual(journal.getLog(), [], "Keystroke log should initialize as an empty array.");
        });

        Test.it("should add an event to the keystroke log via addEvent()", () => {
            const journal = new TypingJournal("some text");
            const event = { type: 'correct', key: 's' };

            journal.addEvent(event);
            const log = journal.getLog();

            Test.assertEqual(log.length, 1, "Log should contain one event after adding.");
            Test.assertDeepEqual(log[0], event, "The correct event object should be in the log.");
        });
    });


    // ==================================================================
    // Testing: truncateLog()
    // ==================================================================
    Test.describe("truncateLog()", () => {
        // Helper events for building test logs
        const correct = { type: 'correct' };
        const error = { type: 'error' };
        const backspace = { type: 'backspace' };

        const testCases = [
            {
                name: "should do nothing on an empty log",
                initialLog: [],
                truncateTo: 5,
                expectedLength: 0
            },
            {
                name: "should truncate a simple log to a middle position",
                initialLog: [correct, correct, correct, correct, correct], // 5 events, cursorPos 5
                truncateTo: 2, // Truncate to where cursorPos would be 2
                expectedLength: 2
            },
            {
                name: "should truncate the log to the beginning",
                initialLog: [correct, error, correct],
                truncateTo: 0,
                expectedLength: 0
            },
            {
                name: "should do nothing if truncating to the current end position",
                initialLog: [correct, correct, correct],
                truncateTo: 3,
                expectedLength: 3
            },
            {
                name: "should do nothing if truncating beyond the current end position",
                initialLog: [correct, correct],
                truncateTo: 10,
                expectedLength: 2
            }
        ];

        Test.it.each(testCases)(
            "{name}",
            ({ initialLog, truncateTo, expectedLength }) => {
                const journal = new TypingJournal("any text");
                // Manually set the log for the test
                journal.keystrokeLog = [...initialLog];

                journal.truncateLog(truncateTo);
                
                Test.assertEqual(journal.getLog().length, expectedLength);
            }
        );

        Test.it("should correctly truncate a complex log containing backspaces", () => {
            // This sequence simulates typing "ax", backspacing, then typing "b".
            // Final typed text: "ab", final cursorPos: 2
            // Log has 4 events.
            const initialLog = [
                { type: 'correct' },   // 'a', cursorPos -> 1
                { type: 'error' },     // 'x', cursorPos -> 2
                { type: 'backspace' }, //      cursorPos -> 1
                { type: 'correct' }    // 'b', cursorPos -> 2
            ];
            
            const journal = new TypingJournal("ab");
            journal.keystrokeLog = [...initialLog];

            // Truncate to where the cursor was after just typing 'a'.
            journal.truncateLog(1);

            Test.assertEqual(journal.getLog().length, 1, "Log should be truncated to the first event.");
            Test.assertDeepEqual(journal.getLog()[0], { type: 'correct' }, "The remaining event should be the first 'correct' one.");
        });
    });
});