// tests/PerformanceAnalyzer/PerformanceAnalyzer.test.js

Test.describe("PerformanceAnalyzer", () => {

    // ==================================================================
    // Testing: generateCharacterState()
    // ==================================================================
    Test.describe("generateCharacterState()", () => {
        const testCases = [
            {
                name: "should return all 'default' states for empty typed text",
                originalText: "cat",
                typedText: "",
                expected: [
                    { char: 'c', state: 'default' },
                    { char: 'a', state: 'default' },
                    { char: 't', state: 'default' },
                ]
            },
            {
                name: "should mark typed characters as 'correct'",
                originalText: "hello",
                typedText: "he",
                expected: [
                    { char: 'h', state: 'correct' },
                    { char: 'e', state: 'correct' },
                    { char: 'l', state: 'default' },
                    { char: 'l', state: 'default' },
                    { char: 'o', state: 'default' },
                ]
            },
            {
                name: "should mark incorrect characters as 'incorrect'",
                originalText: "world",
                typedText: "w-rld",
                expected: [
                    { char: 'w', state: 'correct' },
                    { char: 'o', state: 'incorrect' },
                    { char: 'r', state: 'correct' },
                    { char: 'l', state: 'correct' },
                    { char: 'd', state: 'correct' },
                ]
            },
            {
                name: "should handle typed text longer than original text gracefully",
                originalText: "hi",
                typedText: "hi there",
                expected: [
                    { char: 'h', state: 'correct' },
                    { char: 'i', state: 'correct' },
                ]
            },
            {
                name: "should return an empty array for empty original text",
                originalText: "",
                typedText: "anything",
                expected: []
            }
        ];

        Test.it.each(testCases)(
            "{name}",
            ({ originalText, typedText, expected }) => {
                const result = PerformanceAnalyzer.generateCharacterState(originalText, typedText);
                Test.assertDeepEqual(result, expected);
            }
        );
    });

    // ==================================================================
    // Testing: calculateLiveStats()
    // ==================================================================
    Test.describe("calculateLiveStats()", () => {
        const testCases = [
            {
                name: "should return initial stats for empty typed text",
                originalText: "some text",
                typedText: "",
                expected: { wpm: 0, accuracy: 100 }
            },
            {
                name: "should calculate 100% accuracy for correct text",
                originalText: "perfect",
                typedText: "perfect",
                expected: { wpm: 0, accuracy: 100 }
            },
            {
                name: "should calculate 0% accuracy for completely incorrect text",
                originalText: "abcdef",
                typedText: "ghijkl",
                expected: { wpm: 0, accuracy: 0 }
            },
            {
                name: "should calculate mixed accuracy correctly (50%)",
                originalText: "four",
                typedText: "fxur",
                expected: { wpm: 0, accuracy: 75 } // 3 of 4 correct
            },
            {
                name: "should round accuracy to the nearest whole number (67%)",
                originalText: "abc",
                typedText: "abd",
                expected: { wpm: 0, accuracy: 67 } // 2 of 3 correct is 66.66...%
            },
             {
                name: "should confirm WPM is currently hardcoded to 0",
                originalText: "wpm test",
                typedText: "wpm",
                expected: { wpm: 0, accuracy: 100 }
            }
        ];

        Test.it.each(testCases)(
            "{name}",
            ({ originalText, typedText, expected }) => {
                const result = PerformanceAnalyzer.calculateLiveStats(originalText, typedText);
                Test.assertDeepEqual(result, expected);
            }
        );
    });
});