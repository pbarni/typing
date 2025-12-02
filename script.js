// script.js

import { TypingGame } from './TypingGame.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Define configuration
    const config = {
        wordCount: 150,
        visibleLines: 5,
    };

    // 2. Select DOM elements
    const domElements = {
        textWrapper: document.getElementById('text-wrapper'),
        textDisplay: document.getElementById('text-to-type'),
        textInput: document.getElementById('text-input'),
        resetButton: document.getElementById('reset-btn'),
        wpmDisplay: document.getElementById('wpm'),
        accuracyDisplay: document.getElementById('accuracy'),
    };

    // 3. Start
    const game = new TypingGame(config, domElements);
    game.init();
});