// TypingGame.js

/**
 * The main controller class for the typing game. It orchestrates all other modules
 * to manage the game's state, handle user input, and render the UI. This class
 * acts as the central hub, connecting the data models (Journal), logic modules
 * (PerformanceAnalyzer, InputHandler), and the view layer (Renderer).
 */
class TypingGame {
    /**
     * Creates a new TypingGame instance.
     * @param {object} config - The application's configuration settings.
     * @param {object} domElements - An object containing references to all necessary DOM elements.
     */
    constructor(config, domElements) {
        this.config = config;
        this.dom = domElements;
        
        /**
         * An instance of the Renderer class, responsible for all DOM manipulations.
         * @type {Renderer}
         */
        this.renderer = new Renderer(this.dom, this.config);
        
        /**
         * An instance of the TypingJournal, which logs all user input and holds the source text.
         * @type {TypingJournal|null}
         */
        this.journal = null;

        /**
         * A flag indicating whether the typing test is currently active.
         * @type {boolean}
         */
        this.isGameActive = false;
        
        /**
         * An object holding the immediate state of the UI, primarily derived from the
         * hidden textarea. This state is passed to the renderer.
         * @type {{characters: Array, cursorPos: number, selectionEnd: number}}
         */
        this.uiState = {
            characters: [],
            cursorPos: 0,
            selectionEnd: 0
        };
    }

    /**
     * Initializes the application. It binds all necessary event listeners and
     * starts the first game. This should be the main entry point after instantiation.
     */
    init() {
        this.bindEvents();
        this.startNewGame();
    }

    /**
     * Sets up all event listeners for the application, including user input,
     * button clicks, and window resizing.
     * @private
     */
    bindEvents() {
        this.dom.resetButton.addEventListener('click', () => this.startNewGame());
        
        // Listen to a wide range of events on the hidden textarea to ensure the UI
        // is always in sync with its state.
        const eventsToSync = ['input', 'keydown', 'keyup', 'select', 'mousedown', 'mouseup'];
        eventsToSync.forEach(event => {
            this.dom.textInput.addEventListener(event, () => requestAnimationFrame(() => this.syncUI()));
        });

        // Ensure the hidden textarea is always focused to capture typing.
        document.body.addEventListener('click', () => this.dom.textInput.focus());
        this.dom.textWrapper.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('resize', () => this.onResize());
    }

    /**
     * Resets the game to its initial state. It generates a new block of text,
     * creates a new journal, clears the input, and performs the initial render.
     */
    startNewGame() {
        this.isGameActive = true;
        const text = TextGenerator.generate(this.config.wordCount, this.config.wordsPerLine);
        this.journal = new TypingJournal(text);
        
        this.dom.textInput.value = ''; // Clear the textarea
        
        // Use requestAnimationFrame to ensure layout calculations happen after
        // the browser has had a chance to paint the initial, unstyled text.
        requestAnimationFrame(() => {
            this.renderer.initializeLayout();
            this.syncUI(); // Perform the initial render
        });
    }

    /**
     * The core update loop of the application. It reads the current state from the
     * hidden textarea (value and selection), uses PerformanceAnalyzer to calculate
     * character states and stats, and then tells the Renderer to update the DOM.
     * It also checks for the game's end condition.
     */
    syncUI() {
        if (!this.isGameActive) return;

        // 1. Get live state from the hidden textarea (the "source of truth" for UI state).
        const typedText = this.dom.textInput.value;
        this.uiState.cursorPos = this.dom.textInput.selectionStart;
        this.uiState.selectionEnd = this.dom.textInput.selectionEnd;

        // 2. Update character states based on the live text.
        this.uiState.characters = PerformanceAnalyzer.generateCharacterState(this.journal.originalText, typedText);

        // 3. Recalculate stats based on the live text.
        const stats = PerformanceAnalyzer.calculateLiveStats(this.journal.originalText, typedText);
        
        // 4. Render everything.
        this.renderer.render(this.uiState, stats);

        // 5. Check for game end condition.
        if (typedText === this.journal.originalText) {
            this.isGameActive = false;
        }
    }

    /**
     * Handles click events on the displayed text, allowing the user to reposition
     * the cursor. It calculates the clicked character index and programmatically
     * updates the hidden textarea's selection, which then triggers a `syncUI` update.
     * @param {MouseEvent} event The DOM click event.
     */
    onClick(event) {
        // Only respond to clicks on the character spans themselves.
        if (event.target.tagName !== 'SPAN') return;

        const spans = Array.from(this.dom.textDisplay.children);
        const clickedIndex = spans.indexOf(event.target);
        
        // Programmatically set the textarea's cursor, which will trigger the 'select'
        // event listener and call syncUI.
        this.dom.textInput.selectionStart = clickedIndex;
        this.dom.textInput.selectionEnd = clickedIndex;
        
        this.syncUI(); // Force an immediate update for responsiveness.
    }

    /**
     * Handles the window resize event. It re-initializes the renderer's layout
     * calculations and triggers a re-render to ensure the scrolling and text
     * wrapping are adjusted correctly.
     */
    onResize() {
        this.renderer.initializeLayout();
        this.renderer.render(this.uiState, PerformanceAnalyzer.calculateLiveStats(this.journal.originalText, this.dom.textInput.value));
    }
}