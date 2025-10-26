// tests/TypingGame/TypingGame.test.js

import { Test } from './framework/test-framework.js';
import { TypingGame } from '../TypingGame.js';

Test.describe("TypingGame", () => {
    let game;
    let dom;
    let sandbox;
    let config;
    let originalRequestAnimationFrame; // To store the real function

    Test.beforeEach(() => {
        // --- Mocking requestAnimationFrame ---
        // Store the original function so we can restore it later.
        originalRequestAnimationFrame = window.requestAnimationFrame;
        // Replace it with a function that executes the callback immediately.
        window.requestAnimationFrame = (callback) => callback();

        sandbox = document.getElementById('test-sandbox');
        if (!sandbox) throw new Error("Test sandbox not found!");

        // 1. Create the full DOM structure required by the game
        sandbox.innerHTML = `
            <div id="text-wrapper" style="padding: 10px; height: 100px;">
                <div id="text-to-type" style="line-height: 20px;"></div>
            </div>
            <textarea id="text-input"></textarea>
            <button id="reset-btn"></button>
            <span id="wpm">0</span>
            <span id="accuracy">100</span>
        `;

        // 2. Collect all necessary DOM elements
        dom = {
            textWrapper: document.getElementById('text-wrapper'),
            textDisplay: document.getElementById('text-to-type'),
            textInput: document.getElementById('text-input'),
            resetButton: document.getElementById('reset-btn'),
            wpmDisplay: document.getElementById('wpm'),
            accuracyDisplay: document.getElementById('accuracy'),
        };

        // 3. Define a standard config
        config = {
            wordCount: 10, // Keep it short for tests
            visibleLines: 5,
            scrollTargetLine: 2,
            wordsPerLine: 5,
        };

        // 4. Instantiate the game
        game = new TypingGame(config, dom);
    });

    Test.afterEach(() => {
        // --- Restore the original function ---
        window.requestAnimationFrame = originalRequestAnimationFrame;
        sandbox.innerHTML = '';
    });

    // ==================================================================
    // Testing: Initialization
    // ==================================================================
    Test.describe("Initialization", () => {
        Test.it("should initialize and start a new game correctly", () => {
            game.init(); // This calls startNewGame() inside it

            Test.assertTrue(game.isGameActive, "Game should be active after init.");
            Test.assertTrue(!!game.journal, "Journal should be created.");
            Test.assertTrue(dom.textDisplay.children.length > 0, "Text display should be populated with character spans.");
            Test.assertEqual(dom.textInput.value, "", "Text input should be cleared for a new game.");
        });
    });

    // ==================================================================
    // Testing: Core Gameplay Loop
    // ==================================================================
    Test.describe("syncUI() - Core Update Loop", () => {
        Test.it("should update the character states and cursor in the DOM", () => {
            game.init();
            
            // Manually simulate the user typing "he" into the textarea
            // Note: The default generated text starts with 'the be of...'
            const firstTwoChars = game.journal.originalText.substring(0, 2);
            dom.textInput.value = firstTwoChars;
            dom.textInput.selectionStart = 2;
            dom.textInput.selectionEnd = 2;

            // Manually trigger the update loop
            game.syncUI();

            const spans = dom.textDisplay.children;
            
            Test.assertTrue(spans[0].classList.contains('correct'), "First character should be marked correct.");
            Test.assertTrue(spans[1].classList.contains('correct'), "Second character should be marked correct.");
            
            // The cursor should be on the third character
            Test.assertTrue(spans[2].classList.contains('cursor'), "The span at the cursor position should have the 'cursor' class.");
        });
    });

    // ==================================================================
    // Testing: Game Completion
    // ==================================================================
    Test.describe("Game Completion", () => {
        Test.it("should set isGameActive to false when the text is typed correctly", () => {
            game.init();
            const correctText = game.journal.originalText;

            // Manually simulate completing the text
            dom.textInput.value = correctText;
            
            game.syncUI();

            Test.assertTrue(!game.isGameactive, "Game should become inactive after the text is correctly completed.");
        });
    });
});