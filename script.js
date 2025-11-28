// script.js

import { TypingGame } from './TypingGame.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Define configuration
    const config = {
        wordCount: 150,
        visibleLines: 5,
        scrollTargetLine: 2,
        wordsPerLine: 12,
    };

    // 2. Select all necessary DOM elements
    const domElements = {
        textWrapper: document.getElementById('text-wrapper'),
        textDisplay: document.getElementById('text-to-type'),
        textInput: document.getElementById('text-input'),
        resetButton: document.getElementById('reset-btn'),
        wpmDisplay: document.getElementById('wpm'),
        accuracyDisplay: document.getElementById('accuracy'),
    };

    // 3. Create the main application instance
    const game = new TypingGame(config, domElements);

    // 4. Start the application
    game.init();
});