// TypingGame.js

import { TextGenerator } from './TextGenerator.js';
import { TypingJournal } from './TypingJournal.js';
import { PerformanceAnalyzer } from './PerformanceAnalyzer.js';
import { Renderer } from './Renderer.js';
// --- FIX 1: Import the InputHandler ---
import { InputHandler } from './InputHandler.js'; 

/**
 * The main controller class for the typing game.
 */
export class TypingGame {
    constructor(config, domElements) {
        this.config = config;
        this.dom = domElements;
        this.renderer = new Renderer(this.dom, this.config);
        this.journal = null;
        this.isGameActive = false;
        
        // Initial UI state
        this.uiState = {
            characters: [],
            cursorPos: 0,
            selectionEnd: 0
        };
    }

    init() {
        this.bindEvents();
        this.startNewGame();
    }

    bindEvents() {
        this.dom.resetButton.addEventListener('click', () => this.startNewGame());
        
        const eventsToSync = ['input', 'keydown', 'keyup', 'select', 'mousedown', 'mouseup'];
        eventsToSync.forEach(event => {
            this.dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.syncUI()));
        });

        document.body.addEventListener('click', () => this.dom.textInput.focus());
        this.dom.textWrapper.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('resize', () => this.onResize());
    }

    startNewGame() {
        this.isGameActive = true;
        const text = TextGenerator.generate(this.config.wordCount, this.config.wordsPerLine);
        this.journal = new TypingJournal(text);
        
        this.lastText = ''; 
        
        // --- NEW: Generate the DOM nodes once ---
        this.renderer.initializeText(this.journal.originalText);
        // ---------------------------------------

        this.dom.textInput.value = ''; 
        
        requestAnimationFrame(() => {
            this.renderer.initializeLayout();
            this.syncUI();
        });
    }

    syncUI() {
        if (!this.isGameActive) return;

        // 1. Get Reality
        const typedText = this.dom.textInput.value;
        this.uiState.cursorPos = this.dom.textInput.selectionStart;
        this.uiState.selectionEnd = this.dom.textInput.selectionEnd;

        // 2. Diff & Log
        this.recordToJournal(typedText);

        // 3. Logic (The new InputHandler)
        const { charStates, isGameFinished } = InputHandler.compare(this.journal.originalText, typedText);
        
        // --- FIX 2: Bridge to the old Renderer ---
        // Your current Renderer expects an object called 'uiState' with 'characters', 
        // and a second argument for 'stats'. We construct those here.
        this.uiState.characters = charStates; // Map the new 'charStates' to the expected 'characters' prop

        // We still need to calculate stats for the display
        const stats = PerformanceAnalyzer.calculateLiveStats(this.journal.originalText, typedText);
        
        // Render using the OLD signature: render(uiState, stats)
        this.renderer.render(this.uiState, stats); 
        // ----------------------------------------

        // 4. End Game check
        if (isGameFinished) {
            this.isGameActive = false;
            console.log("Game Over. Journal:", this.journal.getLog());
        }
    }

    recordToJournal(currentText) {
        const previousText = this.lastText;
        if (currentText === previousText) return;
    
        const timestamp = Date.now();
    
        // 1. Detect Backspaces
        if (currentText.length < previousText.length) {
            const charsToDelete = previousText.length - currentText.length;
            for (let i = 0; i < charsToDelete; i++) {
                this.journal.addEvent({
                    key: 'Backspace',
                    type: 'backspace',
                    timestamp: timestamp,
                    cursorPos: previousText.length - i 
                });
            }
        }
    
        // 2. Detect Additions
        if (currentText.length > previousText.length) {
            const addedText = currentText.substring(previousText.length);
            addedText.split('').forEach((char, index) => {
                const currentPos = previousText.length + index;
                const expectedChar = this.journal.originalText[currentPos];
                const isCorrect = char === expectedChar;
                
                this.journal.addEvent({
                    key: char,
                    type: isCorrect ? 'correct' : 'error',
                    isCorrect: isCorrect,
                    expectedChar: expectedChar,
                    timestamp: timestamp,
                    cursorPos: currentPos + 1
                });
            });
        }
    
        // 3. Update state
        this.lastText = currentText;
    }

    onClick(event) {
        if (event.target.tagName !== 'SPAN') return;
        const spans = Array.from(this.dom.textDisplay.children);
        const clickedIndex = spans.indexOf(event.target);
        this.dom.textInput.selectionStart = clickedIndex;
        this.dom.textInput.selectionEnd = clickedIndex;
        this.syncUI();
    }

    onResize() {
        this.renderer.initializeLayout();
        // Ensure onResize also works with the existing PerformanceAnalyzer
        this.renderer.render(this.uiState, PerformanceAnalyzer.calculateLiveStats(this.journal.originalText, this.dom.textInput.value));
    }
}