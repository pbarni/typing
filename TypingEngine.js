// TypingEngine.js

import { generateText } from './TextGenerator.js';
import { computeGameState } from './StateAnalyzer.js';
import { Renderer } from './Renderer.js';
import { ErrorLogger } from './ErrorLogger.js';
import * as Policy from './InputPolicy.js';

export class TypingEngine {
    // Private Fields (EcmaScript 2022)
    #config;
    #dom;
    #renderer;
    
    #originalText = "";
    #historyLog = [];
    #isRunning = false;
    #startTime = 0;
    #lastTextState = "";

    constructor(config, domElements) {
        this.#config = config;
        this.#dom = domElements;
        this.#renderer = new Renderer(this.#dom, this.#config); 
        
        // Expose instance safely to window for Debugger
        window.engine = this;
        window.Debug = ErrorLogger;
    }

    // Getter for the debugger to access private history
    get historyLog() {
        return this.#historyLog;
    }

    init() {
        this.#bindEvents();
        this.startSession();
        ErrorLogger.printHelp();
    }

    #bindEvents() {
        this.#dom.resetButton.addEventListener('click', () => this.startSession());
        this.#dom.textInput.addEventListener('keydown', (e) => this.#handleInputIntent(e));
        
        ['input', 'keyup'].forEach(event => {
            this.#dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.#updateLoop()));
        });

        document.body.addEventListener('click', () => this.#dom.textInput.focus());
    }

    #handleInputIntent(event) {
        if (!this.#isRunning) return;

        if (Policy.shouldIgnoreInput(event)) {
            // Block navigation keys to keep cursor at end
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
            }
            return;
        }

        if (event.key === 'Backspace') return;

        const typedText = this.#dom.textInput.value;
        const expectedChar = this.#originalText[typedText.length];

        // Policy Checks
        if (Policy.isGateBlocking(event.key, typedText, this.#originalText)) {
            ErrorLogger.logGateBlock(typedText, this.#originalText);
            event.preventDefault(); 
            return;
        }

        if (Policy.isEnterToSpaceMapping(event.key, expectedChar)) {
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
        
        this.#originalText = generateText(this.#config.wordCount);
        this.#dom.textInput.value = ''; 
        
        this.#renderer.initializeText(this.#originalText); 
        
        requestAnimationFrame(() => {
            this.#renderer.setWindowSize(); 
            this.#updateLoop();
        });
    }

    #updateLoop() {
        if (!this.#isRunning) return;

        // UI Hack: Force Cursor Lock
        const currentLength = this.#dom.textInput.value.length;
        if (this.#dom.textInput.selectionStart !== currentLength) {
            this.#dom.textInput.selectionStart = currentLength;
            this.#dom.textInput.selectionEnd = currentLength;
        }

        const typedText = this.#dom.textInput.value;
        
        // Start High-Res Timer
        if (this.#startTime === 0 && typedText.length > 0) {
            this.#startTime = performance.now();
        }

        this.#recordHistory(typedText);

        // Analyze
        const state = computeGameState(this.#originalText, typedText, this.#startTime);
        
        // Render
        this.#renderer.render({
            characters: state.charStates,
            cursorPos: currentLength
        }, state.stats);

        if (state.isFinished) {
            this.#isRunning = false;
            console.log("Session Complete. History:", this.#historyLog);
        }
    }

    #recordHistory(currentText) {
        const previousText = this.#lastTextState;
        if (currentText === previousText) return;

        const timestamp = performance.now();

        // 1. Detect Deletions
        if (currentText.length < previousText.length) {
            const count = previousText.length - currentText.length;
            // Use Array.from to create an iterator for cleaner loops
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
        }

        // 2. Detect Insertions
        if (currentText.length > previousText.length) {
            const addedText = currentText.substring(previousText.length);
            
            [...addedText].forEach((char, i) => {
                const currentPos = previousText.length + i;
                const expectedChar = this.#originalText[currentPos];
                
                if (!expectedChar) return; 

                this.#historyLog.push({
                    ts: timestamp,
                    action: 'insert',
                    char: char,
                    expected: expectedChar,
                    index: currentPos, 
                    isError: char !== expectedChar 
                });
            });
        }
        
        this.#lastTextState = currentText;
    }
}