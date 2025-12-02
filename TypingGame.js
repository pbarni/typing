// TypingGame.js

import { TextGenerator } from './TextGenerator.js';
import { Renderer } from './Renderer.js';
import { GameLogic } from './GameLogic.js';

export class TypingGame {
    constructor(config, domElements) {
        this.config = config;
        this.dom = domElements;
        // Pass config back to Renderer
        this.renderer = new Renderer(this.dom, this.config); 
        
        this.originalText = "";
        this.log = []; 
        this.isGameActive = false;
        this.startTime = 0; 
    }

    init() {
        this.bindEvents();
        this.startNewGame();
    }

    bindEvents() {
        this.dom.resetButton.addEventListener('click', () => this.startNewGame());
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

        if (expectedChar === ' ') {
            const isCorrectSoFar = this.originalText.startsWith(typedText);
            if (!isCorrectSoFar) event.preventDefault();
        }
    }

    startNewGame() {
        this.isGameActive = true;
        this.startTime = 0; 
        
        this.originalText = TextGenerator.generate(this.config.wordCount);
        this.log = []; 
        
        this.lastText = ''; 
        this.dom.textInput.value = ''; 
        
        this.renderer.initializeText(this.originalText); 
        
        // Wait for render, then calculate the "Little Window" size
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

        const state = GameLogic.analyze(this.originalText, typedText, this.startTime);
        
        this.renderer.render({
            characters: state.charStates,
            cursorPos: currentLength
        }, state.stats);

        if (state.isGameFinished) {
            this.isGameActive = false;
            console.log("Finished! Log:", this.log);
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
                    index: previousText.length - 1 - i
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