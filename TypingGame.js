// TypingGame.js

class TypingGame {
    constructor(config, domElements) {
        this.config = config;
        this.dom = domElements;
        
        this.renderer = new Renderer(this.dom, this.config);
        this.journal = null;
        this.isGameActive = false;
        
        // This object will hold the live state read from the textarea
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
        
        // Listen to a wide range of events to capture all user interactions
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
        
        this.dom.textInput.value = ''; // Clear the textarea
        
        requestAnimationFrame(() => {
            this.renderer.initializeLayout();
            this.syncUI(); // Perform the initial render
        });
    }

    // This is the new heart of the application, replacing onKeyDown
    syncUI() {
        if (!this.isGameActive) return;

        // 1. Get live state from the hidden textarea
        const typedText = this.dom.textInput.value;
        this.uiState.cursorPos = this.dom.textInput.selectionStart;
        this.uiState.selectionEnd = this.dom.textInput.selectionEnd;

        // 2. Update character states based on the live text
        this.uiState.characters = PerformanceAnalyzer.generateCharacterState(this.journal.originalText, typedText);

        // 3. Recalculate stats based on the live text
        const stats = PerformanceAnalyzer.calculateLiveStats(this.journal.originalText, typedText);
        
        // 4. Render everything
        this.renderer.render(this.uiState, stats);

        // Check for game end
        if (typedText === this.journal.originalText) {
            this.isGameActive = false;
        }
    }

    onClick(event) {
        if (event.target.tagName !== 'SPAN') return;

        const spans = Array.from(this.dom.textDisplay.children);
        const clickedIndex = spans.indexOf(event.target);
        
        // Programmatically set the textarea's cursor, which will trigger syncUI
        this.dom.textInput.selectionStart = clickedIndex;
        this.dom.textInput.selectionEnd = clickedIndex;
        
        this.syncUI(); // Force an immediate update
    }

    onResize() {
        this.renderer.initializeLayout();
        this.renderer.render(this.uiState, PerformanceAnalyzer.calculateLiveStats(this.journal.originalText, this.dom.textInput.value));
    }
}