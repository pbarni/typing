// TypingGame.js

import { TextGenerator } from './TextGenerator.js';
import { TypingJournal } from './TypingJournal.js';
import { Renderer } from './Renderer.js';
import { GameLogic } from './GameLogic.js';

export class TypingGame {
    constructor(config, domElements) {
        this.config = config;
        this.dom = domElements;
        this.renderer = new Renderer(this.dom, this.config);
        this.journal = null;
        this.isGameActive = false;
        this.startTime = 0; // Needed for WPM
    }

    init() {
        this.bindEvents();
        this.startNewGame();
    }

    bindEvents() {
        this.dom.resetButton.addEventListener('click', () => this.startNewGame());
        
        // Listen to everything that changes the input
        ['input', 'keydown', 'keyup', 'select', 'mouseup'].forEach(event => {
            this.dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.syncUI()));
        });

        document.body.addEventListener('click', () => this.dom.textInput.focus());
        this.dom.textWrapper.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('resize', () => this.onResize());
    }

    startNewGame() {
        this.isGameActive = true;
        this.startTime = 0; // Reset timer
        
        // Setup Logic & Data
        const text = TextGenerator.generate(this.config.wordCount, this.config.wordsPerLine);
        this.journal = new TypingJournal(text);
        
        // Reset Diffing State
        this.lastText = ''; 

        // Setup View
        this.dom.textInput.value = ''; 
        
        // Pre-build the DOM spans (Virtual DOM init)
        this.renderer.initializeText(this.journal.originalText); 
        
        requestAnimationFrame(() => {
            this.renderer.initializeLayout();
            this.syncUI();
        });
    }

    syncUI() {
        if (!this.isGameActive) return;

        const typedText = this.dom.textInput.value;
        
        // Start timer on first keypress
        if (this.startTime === 0 && typedText.length > 0) {
            this.startTime = Date.now();
        }

        // 1. Journaling: Reverse engineer the events
        this.recordToJournal(typedText);

        // 2. Logic: Analyze state
        const state = GameLogic.analyze(this.journal.originalText, typedText, this.startTime);
        
        // 3. Render: Update UI
        this.renderer.render({
            characters: state.charStates,
            // Use the DOM's native selection to tell Renderer where to paint
            cursorPos: this.dom.textInput.selectionStart, 
            selectionEnd: this.dom.textInput.selectionEnd
        }, state.stats);

        // 4. End Game
        if (state.isGameFinished) {
            this.isGameActive = false;
            console.log("Finished! Log:", this.journal.getLog());
        }
    }

    /**
     * Calculates the difference between the previous text state and the current
     * text state, then logs the appropriate events to the Journal.
     */
    recordToJournal(currentText) {
        const previousText = this.lastText;
        
        // If nothing changed, do nothing
        if (currentText === previousText) return;

        const timestamp = Date.now();

        // 1. Detect Backspaces (Shortening)
        // If current text is shorter, we treat it as deletions from the end.
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

        // 2. Detect Additions (Typing)
        // If current text is longer, we added characters.
        if (currentText.length > previousText.length) {
            // We only care about the new part at the end
            const addedText = currentText.substring(previousText.length);
            
            // Loop through the added chunk (usually just 1 char, but could be paste)
            addedText.split('').forEach((char, index) => {
                const currentPos = previousText.length + index;
                const expectedChar = this.journal.originalText[currentPos];
                
                // Safety check: if typed past end of original text
                if (!expectedChar) return; 

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

        // 3. Update our state for the next frame
        this.lastText = currentText;
    }
    
    onClick(event) {
        if (event.target.tagName !== 'SPAN') return;
        const spans = Array.from(this.dom.textDisplay.children);
        const clickedIndex = spans.indexOf(event.target);
        
        // Move native cursor
        this.dom.textInput.selectionStart = clickedIndex;
        this.dom.textInput.selectionEnd = clickedIndex;
        
        // Trigger update
        this.syncUI();
    }

    onResize() {
        this.renderer.initializeLayout();
        this.syncUI();
    }
}