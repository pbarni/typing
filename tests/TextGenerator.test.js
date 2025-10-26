// tests/TextGenerator/TextGenerator.test.js

import { Test } from './framework/test-framework.js';
import { TextGenerator } from '../TextGenerator.js';

Test.describe("TextGenerator.generate()", () => {

    // --- This test has unique logic (word counting), so it stays as a standard 'it' block. ---
    Test.describe("Equivalence Partitioning", () => {
        Test.it("should generate the correct number of words for a typical input", () => {
            const text = TextGenerator.generate(50, 10);
            const wordCount = text.split(/[ \n]+/).filter(Boolean).length;
            Test.assertEqual(wordCount, 50, "Word count should be 50 for a standard case");
        });
    });

    // --- These tests all check the newline count based on inputs. Perfect for 'it.each'. ---
    Test.describe("Boundary Value Analysis (Newline Count)", () => {

        const testCases = [
            { wordCount: 0, wordsPerLine: 10, expected: 0, message: "Output should be an empty string for wordCount 0" },
            { wordCount: 1, wordsPerLine: 10, expected: 0, message: "Should not contain a newline for a single word" },
            { wordCount: 9, wordsPerLine: 10, expected: 0, message: "Should have 0 newlines when count is just under the boundary" },
            { wordCount: 10, wordsPerLine: 10, expected: 1, message: "Should have 1 newline when count is exactly on the boundary" },
            { wordCount: 11, wordsPerLine: 10, expected: 1, message: "Should have 1 newline when count is just over the boundary" },
            { wordCount: 30, wordsPerLine: 10, expected: 3, message: "Should have 3 newlines for 30 words at 10 per line" },
        ];

        Test.it.each(testCases)(
            "should have {expected} newlines for {wordCount} words and {wordsPerLine} per line",
            ({ wordCount, wordsPerLine, expected, message }) => {
                const text = TextGenerator.generate(wordCount, wordsPerLine);

                // Special case for wordCount 0
                if (wordCount === 0) {
                    Test.assertEqual(text, "", message);
                    return;
                }

                const newlineCount = (text.match(/\n/g) || []).length;
                Test.assertEqual(newlineCount, expected, message);
            }
        );
    });
});