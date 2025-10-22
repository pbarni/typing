Test.describe("TextGenerator.generate()", () => {

    // --- Equivalence Partitioning ---
    // This section tests a "typical" valid input to ensure the core logic works.
    // We assume if it works for 50 words, it works for any other "normal" number.
    Test.describe("Equivalence Partitioning", () => {
        Test.it("should generate the correct number of words for a typical input", () => {
            const text = TextGenerator.generate(50, 10);
            // A robust way to count words, ignoring extra spaces.
            const wordCount = text.split(/[ \n]+/).filter(Boolean).length;
            Test.assertEqual(wordCount, 50, "Word count should be 50 for a standard case");
        });
    });


    // --- Boundary Value Analysis ---
    // This section tests the "edges" where logic is most likely to fail.
    Test.describe("Boundary Value Analysis", () => {

        Test.it("should return an empty string when wordCount is 0 (lower boundary)", () => {
            const text = TextGenerator.generate(0, 10);
            Test.assertEqual(text, "", "Output should be an empty string for wordCount 0");
        });

        Test.it("should generate a single word when wordCount is 1 (lowest valid input)", () => {
            const text = TextGenerator.generate(1, 10);
            const wordCount = text.split(/[ \n]+/).filter(Boolean).length;
            Test.assertEqual(wordCount, 1, "Word count should be 1");
            const hasNewline = text.includes('\n');
            Test.assertTrue(!hasNewline, "Should not contain a newline for a single word");
        });

        Test.it("should not add a newline when wordCount is one less than wordsPerLine", () => {
            const text = TextGenerator.generate(9, 10);
            // A simple regex to count all newline characters in the string.
            const newlineCount = (text.match(/\n/g) || []).length;
            Test.assertEqual(newlineCount, 0, "Should have 0 newlines when count is just under the boundary");
        });

        Test.it("should add exactly one newline when wordCount is equal to wordsPerLine", () => {
            const text = TextGenerator.generate(10, 10);
            const newlineCount = (text.match(/\n/g) || []).length;
            Test.assertEqual(newlineCount, 1, "Should have 1 newline when count is exactly on the boundary");
        });

        Test.it("should add exactly one newline when wordCount is one more than wordsPerLine", () => {
            const text = TextGenerator.generate(11, 10);
            const newlineCount = (text.match(/\n/g) || []).length;
            Test.assertEqual(newlineCount, 1, "Should have 1 newline when count is just over the boundary");
        });

        Test.it("should correctly handle wordCount being a perfect multiple of wordsPerLine", () => {
            const text = TextGenerator.generate(30, 10);
            const newlineCount = (text.match(/\n/g) || []).length;
            Test.assertEqual(newlineCount, 3, "Should have 3 newlines for 30 words at 10 per line");
        });
    });
});