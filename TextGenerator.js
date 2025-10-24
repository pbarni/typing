// TextGenerator.js

/**
 * Provides functionality for generating random text for the typing game.
 * This is a static class that should not be instantiated.
 */
class TextGenerator {
    static words = [
        'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they', 'I', 'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you', 'do', 'but', 'from', 'or', 'which', 'one', 'would', 'all', 'will', 'there', 'say', 'who', 'make', 'when', 'can', 'more', 'if', 'no', 'man', 'out', 'other', 'so', 'what', 'time', 'up', 'go', 'about', 'than', 'into', 'could', 'state', 'only', 'new', 'year', 'some', 'take', 'come', 'these', 'know', 'see', 'use', 'get', 'like', 'then', 'first', 'any', 'work', 'now', 'may', 'such', 'give', 'over', 'think', 'most', 'even', 'find', 'day', 'also', 'after', 'way', 'many', 'must', 'look', 'before', 'great', 'back', 'through', 'long', 'where', 'much', 'should', 'well', 'people', 'down', 'own', 'just', 'because', 'good', 'each', 'those', 'feel', 'seem', 'how', 'high', 'too', 'place', 'little', 'world', 'very', 'still', 'nation', 'hand', 'old', 'life', 'tell', 'write', 'become', 'here', 'show', 'house', 'both', 'between', 'need', 'mean', 'call', 'develop', 'under', 'last', 'right', 'move', 'thing', 'general', 'school', 'never', 'same', 'another', 'begin', 'while', 'number', 'part', 'turn', 'real', 'leave', 'might', 'want', 'point', 'form', 'off', 'child', 'few', 'small', 'since', 'against', 'ask', 'late', 'home', 'interest', 'large', 'person', 'end', 'open', 'public', 'follow', 'during', 'present', 'without', 'again', 'hold', 'govern', 'around', 'possible', 'head', 'consider', 'word', 'program', 'problem', 'however', 'lead', 'system', 'set', 'order', 'eye', 'plan', 'run', 'keep', 'face', 'fact', 'group', 'play', 'stand', 'increase', 'early', 'course', 'change', 'help', 'line'
    ];

    /**
     * Generates a random string of text with a specified word count and line breaks.
     * The words are chosen from a predefined list. Lines are joined by a newline
     * character ('\n'), and a trailing newline is added if the word count is a
     * perfect multiple of the words per line.
     *
     * @static
     * @param {number} wordCount - The total number of words to generate.
     * @param {number} wordsPerLine - The number of words per line before inserting a newline.
     * @returns {string} The formatted string of generated words. Returns an empty string if wordCount is 0.
     */
    static generate(wordCount, wordsPerLine) {
        if (wordCount === 0) {
            return "";
        }

        // 1. Generate the full list of words.
        const words = [];
        for (let i = 0; i < wordCount; i++) {
            words.push(this.words[Math.floor(Math.random() * this.words.length)]);
        }

        // 2. Group the words into lines.
        const lines = [];
        for (let i = 0; i < words.length; i += wordsPerLine) {
            const chunk = words.slice(i, i + wordsPerLine);
            lines.push(chunk.join(' '));
        }

        // 3. Join the lines. This places '\n' *between* elements.
        let result = lines.join('\n');

        // 4. Add a trailing newline if wordCount is a perfect multiple of wordsPerLine,
        //    as defined by the test specifications.
        if (wordCount > 0 && wordCount % wordsPerLine === 0) {
            result += '\n';
        }

        return result;
    }
}