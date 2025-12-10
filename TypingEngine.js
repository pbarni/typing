// TypingEngine.js

import { computeGameState } from './StateAnalyzer.js';
import { ErrorLogger } from './ErrorLogger.js';

export class TypingEngine {
    // Private State
    #originalText = "";
    #historyLog = [];
    #isRunning = false;
    #startTime = 0;
    #lastTextState = "";
    
    // Dependencies
    #renderer;
    #rules;
    #generator;
    #dom;

    constructor(domElements, dependencies) {
        this.#dom = domElements;
        this.#renderer = dependencies.renderer;
        this.#rules = dependencies.rules;
        this.#generator = dependencies.generator;

        // Expose for Debug
        window.engine = this;
        window.Debug = ErrorLogger;
    }

    get historyLog() { return this.#historyLog; }

    init() {
        this.#bindEvents();
        this.startSession();
        ErrorLogger.printHelp();
    }

    #bindEvents() {
        this.#dom.resetButton.addEventListener('click', () => this.startSession());
        
        // Input Handling
        this.#dom.textInput.addEventListener('keydown', (e) => this.#handleInput(e));
        ['input', 'keyup'].forEach(event => {
            this.#dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.#updateLoop()));
        });

        // FOCUS MANAGEMENT
        // When the user clicks the visible text wrapper, we must focus the hidden input.
        this.#dom.textWrapper.addEventListener('click', (e) => {
            this.#dom.textInput.focus();
        });

        // Global fallback: If user clicks background (but not buttons), reclaim focus.
        document.body.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && e.target !== this.#dom.textInput) {
                this.#dom.textInput.focus();
            }
        });
    }

    #handleInput(event) {
        if (!this.#isRunning) return;

        if (this.#rules.shouldIgnoreInput(event)) {
            if (event.key.startsWith('Arrow')) event.preventDefault();
            return;
        }

        if (event.key === 'Backspace') return;

        const typedText = this.#dom.textInput.value;
        const expectedChar = this.#originalText[typedText.length];

        // Guard: Prevent typing past the end of the text
        if (!expectedChar) {
            event.preventDefault();
            return;
        }

        const blockCheck = this.#rules.shouldBlockInput(event.key, typedText, this.#originalText);
        
        if (blockCheck.isBlocked) {
            ErrorLogger.logGateBlock(typedText, this.#originalText, event.key, blockCheck.reason);
            event.preventDefault();
            return;
        }

        if (this.#rules.isEnterMappedToSpace(event.key, expectedChar)) {
            event.preventDefault();
            this.#insertVirtualChar(' ');
            return;
        }
    }

    #insertVirtualChar(char) {
        const input = this.#dom.textInput;
        input.setRangeText(char, input.selectionStart, input.selectionEnd, 'end');
        this.#updateLoop();
    }

    startSession() {
        this.#isRunning = true;
        this.#startTime = 0; 
        this.#historyLog = []; 
        this.#lastTextState = ''; 
        this.#dom.textInput.value = ''; 
        
        this.#originalText = this.#generator.generate(); 
        
        this.#renderer.initializeText(this.#originalText); 
        
        requestAnimationFrame(() => {
            this.#renderer.setWindowSize(); 
            this.#updateLoop();
            this.#dom.textInput.focus(); // Force focus immediately
        });
    }

    #updateLoop() {
        if (!this.#isRunning) return;

        // Force cursor to end of text
        const currentLength = this.#dom.textInput.value.length;
        if (this.#dom.textInput.selectionStart !== currentLength) {
            this.#dom.textInput.selectionStart = currentLength;
            this.#dom.textInput.selectionEnd = currentLength;
        }

        const typedText = this.#dom.textInput.value;
        
        if (this.#startTime === 0 && typedText.length > 0) {
            this.#startTime = performance.now();
        }

        this.#recordHistory(typedText);

        const state = computeGameState(this.#originalText, typedText, this.#startTime);
        
        this.#renderer.render({
            characters: state.charStates,
            cursorPos: currentLength
        }, state.stats);

        if (state.isFinished) {
            this.#isRunning = false;
            console.log("Session Complete.");
        }
    }

    #recordHistory(currentText) {
        const previousText = this.#lastTextState;
        if (currentText === previousText) return;
        const timestamp = performance.now();

        if (currentText.length < previousText.length) {
             const count = previousText.length - currentText.length;
             Array.from({ length: count }).forEach((_, i) => {
                this.#historyLog.push({ 
                    ts: timestamp, 
                    action: 'delete', 
                    char: 'Backspace', 
                    expected: null, 
                    index: previousText.length - 1 - i, 
                    isError: false 
                });
             });
        } else if (currentText.length > previousText.length) {
            const addedText = currentText.substring(previousText.length);
            [...addedText].forEach((char, i) => {
                const currentPos = previousText.length + i;
                const expectedChar = this.#originalText[currentPos];
                if (expectedChar) {
                    this.#historyLog.push({ 
                        ts: timestamp, 
                        action: 'insert', 
                        char: char, 
                        expected: expectedChar, 
                        index: currentPos, 
                        isError: char !== expectedChar 
                    });
                }
            });
        }
        this.#lastTextState = currentText;
    }
}