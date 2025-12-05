// TypingGame.js

import { generateText } from './TextGenerator.js';
import { analyzeState } from './GameLogic.js';
import { Renderer } from './Renderer.js';
import { ErrorLogger } from './ErrorLogger.js';

export class TypingGame {
    constructor(config, domElements) {
        this.config = config;
        this.dom = domElements;
        this.renderer = new Renderer(this.dom, this.config); 
        
        this.originalText = "";
        this.log = []; 
        this.isGameActive = false;
        this.startTime = 0; 

        // --- EXPOSE FOR DEBUGGING ---
        // This allows you to type 'game' in the console to see this instance
        window.game = this;
        // This allows you to type 'Debug.printLog()' in the console
        window.Debug = ErrorLogger;
    }

    init() {
        this.bindEvents();
        this.startNewGame();
        console.log("Game initialized. Type 'Debug.printLog()' to inspect memory.");
    }

    bindEvents() {
        this.dom.resetButton.addEventListener('click', () => this.startNewGame());
        
        // Input Controls
        this.dom.textInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        ['input', 'keyup'].forEach(event => {
            this.dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.syncUI()));
        });

        document.body.addEventListener('click', () => this.dom.textInput.focus());
    }

    handleKeydown(event) {
        if (!this.isGameActive) return;

        const forbiddenKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Delete'];
        if (forbiddenKeys.includes(event.key)) {
            event.preventDefault();
            return;
        }

        if (event.key === 'Backspace' || event.ctrlKey || event.metaKey || event.altKey) return;

        const typedText = this.dom.textInput.value;
        const nextIndex = typedText.length;
        
        if (nextIndex >= this.originalText.length) return;

        const expectedChar = this.originalText[nextIndex];

        // --- 1. ENTER KEY MAPPING ---
        // If user types 'Enter' but we expect 'Space', map it!
        // This makes soft-wrapped lines feel natural.
        if (event.key === 'Enter') {
            event.preventDefault(); // Never allow actual newlines in the input

            if (expectedChar === ' ') {
                // Check TypeRacer Gate (Must be correct so far)
                const isCorrectSoFar = this.originalText.startsWith(typedText);
                if (isCorrectSoFar) {
                    // Manually insert a space
                    this.insertChar(' '); 
                } else {
                    // Log error if Enter was pressed but text was wrong
                    ErrorLogger.logGateBlock(typedText, this.originalText, this.log);
                }
            }
            return;
        }

        // --- 2. TypeRacer Gate (Stop on Error) ---
        // Only allows proceeding past a space if the current word is correct.
        if (expectedChar === ' ') {
            const isCorrectSoFar = this.originalText.startsWith(typedText);
            if (!isCorrectSoFar) {
                // Trigger the Error Framework
                ErrorLogger.logGateBlock(typedText, this.originalText, this.log);
                event.preventDefault();
            }
        }
    }

    /**
     * Helper to programmatically insert characters into the textarea
     * This allows us to map Enter -> Space while keeping undo history clean-ish.
     */
    insertChar(char) {
        const input = this.dom.textInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        // Insert text at cursor
        input.setRangeText(char, start, end, 'end');
        
        // Force sync immediately
        this.syncUI();
    }

    startNewGame() {
        this.isGameActive = true;
        this.startTime = 0; 
        
        this.originalText = generateText(this.config.wordCount);
        this.log = []; 
        this.lastText = ''; 
        this.dom.textInput.value = ''; 
        
        this.renderer.initializeText(this.originalText); 
        
        requestAnimationFrame(() => {
            this.renderer.setWindowSize(); 
            this.syncUI();
        });
    }

    syncUI() {
        if (!this.isGameActive) return;

        // Force Cursor Lock
        const currentLength = this.dom.textInput.value.length;
        if (this.dom.textInput.selectionStart !== currentLength) {
            this.dom.textInput.selectionStart = currentLength;
            this.dom.textInput.selectionEnd = currentLength;
        }

        const typedText = this.dom.textInput.value;
        
        if (this.startTime === 0 && typedText.length > 0) {
            this.startTime = Date.now();
        }

        this.recordToLog(typedText);

        const state = analyzeState(this.originalText, typedText, this.startTime);
        
        this.renderer.render({
            characters: state.charStates,
            cursorPos: currentLength
        }, state.stats);

        if (state.isGameFinished) {
            this.isGameActive = false;
            console.log("Finished! Final Log:", this.log);
        }
    }

    recordToLog(currentText) {
        const previousText = this.lastText;
        if (currentText === previousText) return;

        const timestamp = performance.now();

        if (currentText.length < previousText.length) {
            const charsToDelete = previousText.length - currentText.length;
            for (let i = 0; i < charsToDelete; i++) {
                this.log.push({
                    ts: timestamp,
                    action: 'delete',
                    char: 'Backspace', 
                    expected: null,
                    index: previousText.length - 1 - i,
                    isError: false
                });
            }
        }

        if (currentText.length > previousText.length) {
            const addedText = currentText.substring(previousText.length);
            addedText.split('').forEach((char, i) => {
                const currentPos = previousText.length + i;
                const expectedChar = this.originalText[currentPos];
                
                if (!expectedChar) return; 

                this.log.push({
                    ts: timestamp,
                    action: 'insert',
                    char: char,
                    expected: expectedChar,
                    index: currentPos, 
                    isError: char !== expectedChar 
                });
            });
        }
        
        this.lastText = currentText;
    }
}