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
        this.startTime = 0; 
    }

    init() {
        this.bindEvents();
        this.startNewGame();
    }

    bindEvents() {
        this.dom.resetButton.addEventListener('click', () => this.startNewGame());
        
        // Main Input Handler
        this.dom.textInput.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Sync triggers
        ['input', 'keyup'].forEach(event => {
            this.dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.syncUI()));
        });

        // Focus management: Always keep focus, but NO click-to-move-cursor logic
        document.body.addEventListener('click', () => {
             this.dom.textInput.focus();
        });
        
        window.addEventListener('resize', () => this.onResize());
    }

    /**
     * Strict Input Control
     * 1. Blocks Navigation (Stream Mode)
     * 2. Blocks Invalid Word Boundaries (TypeRacer Mode)
     */
    handleKeydown(event) {
        if (!this.isGameActive) return;

        // --- 1. Block Navigation ---
        // We want a "Typewriter" feel. You cannot move the cursor back.
        // You can only Backspace.
        const forbiddenKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Home', 'End', 'PageUp', 'PageDown', 'Delete' // Delete is forward-delete
        ];

        if (forbiddenKeys.includes(event.key)) {
            event.preventDefault();
            return;
        }

        // Allow Ctrl+Backspace (Native behavior), Block others if needed?
        // For now, standard Backspace and Ctrl+Backspace are allowed.

        // --- 2. Word Boundary Gate ---
        // (Prevent moving to next word if current one is wrong)
        
        // Always allow Backspace
        if (event.key === 'Backspace') return;

        // Ignore modifier keys alone
        if (event.key === 'Control' || event.key === 'Shift' || event.key === 'Alt') return;

        const typedText = this.dom.textInput.value;
        const nextIndex = typedText.length;
        
        if (nextIndex >= this.journal.originalText.length) return;

        const expectedChar = this.journal.originalText[nextIndex];

        if (expectedChar === ' ') {
            const isCorrectSoFar = this.journal.originalText.startsWith(typedText);
            if (!isCorrectSoFar) {
                event.preventDefault(); // Trap user in the current word
            }
        }
    }

    startNewGame() {
        this.isGameActive = true;
        this.startTime = 0; 
        
        const text = TextGenerator.generate(this.config.wordCount, this.config.wordsPerLine);
        this.journal = new TypingJournal(text);
        
        this.lastText = ''; 

        this.dom.textInput.value = ''; 
        
        this.renderer.initializeText(this.journal.originalText); 
        
        requestAnimationFrame(() => {
            this.renderer.initializeLayout();
            this.syncUI();
        });
    }

    syncUI() {
        if (!this.isGameActive) return;

        // Enforce Cursor Lock: Always at the end
        const currentLength = this.dom.textInput.value.length;
        if (this.dom.textInput.selectionStart !== currentLength) {
            this.dom.textInput.selectionStart = currentLength;
            this.dom.textInput.selectionEnd = currentLength;
        }

        const typedText = this.dom.textInput.value;
        
        if (this.startTime === 0 && typedText.length > 0) {
            this.startTime = Date.now();
        }

        this.recordToJournal(typedText);

        const state = GameLogic.analyze(this.journal.originalText, typedText, this.startTime);
        
        this.renderer.render({
            characters: state.charStates,
            cursorPos: currentLength // Cursor is simply the length of input
        }, state.stats);

        if (state.isGameFinished) {
            this.isGameActive = false;
            console.log("Finished! Log:", this.journal.getLog());
        }
    }

    recordToJournal(currentText) {
        const previousText = this.lastText;
        if (currentText === previousText) return;

        const timestamp = performance.now();

        // 1. Backspaces
        if (currentText.length < previousText.length) {
            const charsToDelete = previousText.length - currentText.length;
            for (let i = 0; i < charsToDelete; i++) {
                this.journal.addEvent({
                    ts: timestamp,
                    action: 'delete',
                    char: 'Backspace', 
                    expected: null,
                    index: previousText.length - 1 - i
                });
            }
        }

        // 2. Typing
        if (currentText.length > previousText.length) {
            const addedText = currentText.substring(previousText.length);
            addedText.split('').forEach((char, i) => {
                const currentPos = previousText.length + i;
                const expectedChar = this.journal.originalText[currentPos];
                
                if (!expectedChar) return; 

                this.journal.addEvent({
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

    onResize() {
        this.renderer.initializeLayout();
        this.syncUI();
    }
}