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
        window.game = this;
        window.Debug = ErrorLogger;
    }

    init() {
        this.bindEvents();
        this.startNewGame();
        
        // Print the debug banner on startup
        ErrorLogger.printHelp();
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

        // 1. Block Navigation Keys that move the cursor
        const forbiddenKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Delete'];
        if (forbiddenKeys.includes(event.key)) {
            event.preventDefault();
            return;
        }

        // 2. Allow Browser Function Keys (F5, F11, F12, etc.)
        // This regex ensures we match "F1"..."F12" but NOT just the letter "F"
        if (/^F\d+$/.test(event.key)) {
            return;
        }

        // 3. Allow Modifiers and Backspace
        // This ensures commands like Ctrl+R or Ctrl+Shift+I still work
        if (event.key === 'Backspace' || event.ctrlKey || event.metaKey || event.altKey) return;

        const typedText = this.dom.textInput.value;
        const nextIndex = typedText.length;
        
        if (nextIndex >= this.originalText.length) return;

        const expectedChar = this.originalText[nextIndex];

        // --- 4. ENTER KEY MAPPING ---
        if (event.key === 'Enter') {
            event.preventDefault(); 

            if (expectedChar === ' ') {
                const isCorrectSoFar = this.originalText.startsWith(typedText);
                if (isCorrectSoFar) {
                    this.insertChar(' '); 
                } else {
                    ErrorLogger.logGateBlock(typedText, this.originalText, this.log);
                }
            }
            return;
        }

        // --- 5. TypeRacer Gate (Stop on Error) ---
        if (expectedChar === ' ') {
            const isCorrectSoFar = this.originalText.startsWith(typedText);
            if (!isCorrectSoFar) {
                ErrorLogger.logGateBlock(typedText, this.originalText, this.log);
                
                // This prevents the space, but strictly calling preventDefault 
                // on everything else is what broke F12.
                // Now that F-keys are handled above, this is safe.
                event.preventDefault();
            }
        }
    }

    insertChar(char) {
        const input = this.dom.textInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        input.setRangeText(char, start, end, 'end');
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