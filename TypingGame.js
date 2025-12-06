// TypingGame.js

import { generateText } from './TextGenerator.js';
import { analyzeState } from './GameLogic.js';
import { Renderer } from './Renderer.js';
import { ErrorLogger } from './ErrorLogger.js';
import * as Rules from './InputRules.js'; // Import our new rules

export class TypingGame {
    constructor(config, domElements) {
        this.config = config;
        this.dom = domElements;
        this.renderer = new Renderer(this.dom, this.config); 
        
        this.originalText = "";
        this.log = []; 
        this.isGameActive = false;
        this.startTime = 0; 

        // Debugging Access
        window.game = this;
        window.Debug = ErrorLogger;
    }

    init() {
        this.bindEvents();
        this.startNewGame();
        ErrorLogger.printHelp();
    }

    bindEvents() {
        this.dom.resetButton.addEventListener('click', () => this.startNewGame());
        
        // Input Controls
        this.dom.textInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // UI Sync (Handles Visuals)
        ['input', 'keyup'].forEach(event => {
            this.dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.syncUI()));
        });

        document.body.addEventListener('click', () => this.dom.textInput.focus());
    }

    handleKeydown(event) {
        if (!this.isGameActive) return;

        // 1. Filter "System" keys (F12, Ctrl+C, etc)
        // If we should ignore it, we return immediately and let the browser handle it.
        // Note: We might want to preventDefault on Navigation keys specifically, 
        // but for now returning lets the text input behave normally (or do nothing).
        if (Rules.shouldIgnoreInput(event)) {
            // Special case: We usually want to block Cursor movement in the textarea
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
            }
            return;
        }

        // Allow Backspace to always pass through
        if (event.key === 'Backspace') return;

        // 2. Prepare Context
        const typedText = this.dom.textInput.value;
        const expectedChar = this.originalText[typedText.length];

        // 3. Check "Gate" Rule (Block progress on errors)
        if (Rules.isGateBlocking(event.key, typedText, this.originalText)) {
            ErrorLogger.logGateBlock(typedText, this.originalText, this.log);
            event.preventDefault(); // Stop the character from being typed
            return;
        }

        // 4. Check "Enter -> Space" Mapping Rule
        if (Rules.isEnterToSpaceMapping(event.key, expectedChar)) {
            event.preventDefault(); // Don't add a newline
            this.insertChar(' ');   // Add a space instead
            return;
        }
    }

    insertChar(char) {
        const input = this.dom.textInput;
        // setRangeText is the modern, clean way to insert text at cursor
        input.setRangeText(char, input.selectionStart, input.selectionEnd, 'end');
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

        // Lock Cursor to end of text
        const currentLength = this.dom.textInput.value.length;
        if (this.dom.textInput.selectionStart !== currentLength) {
            this.dom.textInput.selectionStart = currentLength;
            this.dom.textInput.selectionEnd = currentLength;
        }

        const typedText = this.dom.textInput.value;
        
        // Start timer on first char
        if (this.startTime === 0 && typedText.length > 0) {
            this.startTime = Date.now();
        }

        this.recordToLog(typedText);

        // Analyze and Render
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
        // ... (Log logic remains the same, it is specific to the Game instance) ...
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