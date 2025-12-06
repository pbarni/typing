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

    // The Constructor is now an "Injection Port"
    constructor(domElements, dependencies) {
        this.#dom = domElements;
        
        // We unpack the tools we were given
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
        this.#dom.textInput.addEventListener('keydown', (e) => this.#handleInput(e));
        
        ['input', 'keyup'].forEach(event => {
            this.#dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.#updateLoop()));
        });
        
        document.body.addEventListener('click', () => this.#dom.textInput.focus());
    }

    #handleInput(event) {
        if (!this.#isRunning) return;

        // 1. Ask Policy: "Should I ignore this?"
        if (this.#rules.shouldIgnoreInput(event)) {
            if (event.key.startsWith('Arrow')) event.preventDefault();
            return;
        }

        if (event.key === 'Backspace') return;

        const typedText = this.#dom.textInput.value;
        const expectedChar = this.#originalText[typedText.length];

        // 2. Ask Policy: "Is this input blocked?"
        const blockCheck = this.#rules.shouldBlockInput(event.key, typedText, this.#originalText);
        
        if (blockCheck.isBlocked) {
            ErrorLogger.logGateBlock(typedText, this.#originalText, event.key, blockCheck.reason);
            event.preventDefault();
            return;
        }

        // 3. Ask Policy: "Should I map Enter to Space?"
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
        
        // FIX: No hardcoded number here. 
        // The generator already has the config.
        this.#originalText = this.#generator.generate(); 
        
        this.#renderer.initializeText(this.#originalText); 
        
        requestAnimationFrame(() => {
            this.#renderer.setWindowSize(); 
            this.#updateLoop();
        });
    }

    #updateLoop() {
        if (!this.#isRunning) return;

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
                this.#historyLog.push({ ts: timestamp, action: 'delete', char: 'Backspace', expected: null, index: previousText.length - 1 - i, isError: false });
             });
        } else if (currentText.length > previousText.length) {
            const addedText = currentText.substring(previousText.length);
            [...addedText].forEach((char, i) => {
                const currentPos = previousText.length + i;
                const expectedChar = this.#originalText[currentPos];
                if (expectedChar) {
                    this.#historyLog.push({ ts: timestamp, action: 'insert', char: char, expected: expectedChar, index: currentPos, isError: char !== expectedChar });
                }
            });
        }
        this.#lastTextState = currentText;
    }
}