// TextGenerator.js

export class TextGenerator {
    #words = [
        'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 
        'they', 'I', 'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you', 
        'do', 'but', 'from', 'or', 'which', 'one', 'would', 'all', 'will', 'there', 
        'say', 'who', 'make', 'when', 'can', 'more', 'if', 'no', 'man', 'out', 'other'
    ];

    #config;

    constructor(config) {
        this.#config = config;
    }

    /**
     * Generates text based on the injected configuration.
     */
    generate() {
        const count = this.#config.wordCount || 25; // Fallback if config is missing
        
        if (count === 0) return "";
        
        const selected = [];
        for (let i = 0; i < count; i++) {
            selected.push(this.#words[Math.floor(Math.random() * this.#words.length)]);
        }
        
        return selected.join(' ');
    }
}