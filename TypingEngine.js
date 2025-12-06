// TypingEngine.js

import { generateText } from './TextGenerator.js';
import { computeGameState } from './StateAnalyzer.js';
import { Renderer } from './Renderer.js';
import { ErrorLogger } from './ErrorLogger.js';
import * as Policy from './InputPolicy.js';

export class TypingEngine {
    constructor(config, domElements) {
        this.config = config;
        this.dom = domElements;
        this.renderer = new Renderer(this.dom, this.config); 
        
        // Game State
        this.originalText = "";
        this.historyLog = []; // Renamed from 'log' to 'historyLog' for clarity
        this.isRunning = false;
        this.startTime = 0; 

        // Expose to Global Scope for ErrorLogger
        window.engine = this;
        window.Debug = ErrorLogger;
    }

    init() {
        this.bindEvents();
        this.startSession();
        ErrorLogger.printHelp();
    }

    bindEvents() {
        this.dom.resetButton.addEventListener('click', () => this.startSession());
        
        // Keydown: Handles Permissions & Blocking (The Policy Layer)
        this.dom.textInput.addEventListener('keydown', (e) => this.handleInputIntent(e));
        
        // Input/Keyup: Handles Visual Updates (The View Layer)
        ['input', 'keyup'].forEach(event => {
            this.dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.updateLoop()));
        });

        // Focus trap
        document.body.addEventListener('click', () => this.dom.textInput.focus());
    }

    /**
     * Decides if an input is allowed based on Policy.
     */
    handleInputIntent(event) {
        if (!this.isRunning) return;

        // 1. Check System Filters (F12, Nav keys, etc.)
        if (Policy.shouldIgnoreInput(event)) {
            // Explicitly block navigation keys to keep cursor at end
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
            }
            return;
        }

        // Backspace is always allowed
        if (event.key === 'Backspace') return;

        const typedText = this.dom.textInput.value;
        const expectedChar = this.originalText[typedText.length];

        // 2. Check "Gate" Policy (Block on errors)
        if (Policy.isGateBlocking(event.key, typedText, this.originalText)) {
            ErrorLogger.logGateBlock(typedText, this.originalText, this.historyLog);
            event.preventDefault(); 
            return;
        }

        // 3. Check "Enter -> Space" Mapping Policy
        if (Policy.isEnterToSpaceMapping(event.key, expectedChar)) {
            event.preventDefault(); 
            this.insertVirtualChar(' ');   
            return;
        }
    }

    insertVirtualChar(char) {
        const input = this.dom.textInput;
        input.setRangeText(char, input.selectionStart, input.selectionEnd, 'end');
        this.updateLoop();
    }

    startSession() {
        this.isRunning = true;
        this.startTime = 0; 
        
        this.originalText = generateText(this.config.wordCount);
        this.historyLog = []; 
        this.lastTextState = ''; 
        this.dom.textInput.value = ''; 
        
        this.renderer.initializeText(this.originalText); 
        
        requestAnimationFrame(() => {
            this.renderer.setWindowSize(); 
            this.updateLoop();
        });
    }

    updateLoop() {
        if (!this.isRunning) return;

        // Enforce Cursor Lock (UI Hack)
        const currentLength = this.dom.textInput.value.length;
        if (this.dom.textInput.selectionStart !== currentLength) {
            this.dom.textInput.selectionStart = currentLength;
            this.dom.textInput.selectionEnd = currentLength;
        }

        const typedText = this.dom.textInput.value;
        
        // Start Timer
        if (this.startTime === 0 && typedText.length > 0) {
            this.startTime = Date.now();
        }

        this.recordHistory(typedText);

        // Analyze State
        const state = computeGameState(this.originalText, typedText, this.startTime);
        
        // Render
        this.renderer.render({
            characters: state.charStates,
            cursorPos: currentLength
        }, state.stats);

        // End Game Check
        if (state.isFinished) {
            this.isRunning = false;
            console.log("Session Complete. History:", this.historyLog);
        }
    }

    recordHistory(currentText) {
        const previousText = this.lastTextState;
        if (currentText === previousText) return;

        const timestamp = performance.now();

        // Handle Deletions
        if (currentText.length < previousText.length) {
            const count = previousText.length - currentText.length;
            for (let i = 0; i < count; i++) {
                this.historyLog.push({
                    ts: timestamp,
                    action: 'delete',
                    char: 'Backspace', 
                    expected: null,
                    index: previousText.length - 1 - i,
                    isError: false
                });
            }
        }

        // Handle Insertions
        if (currentText.length > previousText.length) {
            const addedText = currentText.substring(previousText.length);
            addedText.split('').forEach((char, i) => {
                const currentPos = previousText.length + i;
                const expectedChar = this.originalText[currentPos];
                
                // End of text guard
                if (!expectedChar) return; 

                this.historyLog.push({
                    ts: timestamp,
                    action: 'insert',
                    char: char,
                    expected: expectedChar,
                    index: currentPos, 
                    isError: char !== expectedChar 
                });
            });
        }
        
        this.lastTextState = currentText;
    }
}