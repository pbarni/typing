// Renderer.js

/**
 * Manages all direct DOM manipulation for the typing game. It is responsible for
 * rendering the text, cursor, selections, and performance stats onto the page.
 * It operates on a "write-only" basis, receiving state from the main game
 * controller and translating it into visual output without modifying the game state itself.
 */
export class Renderer {
    /**
     * Creates a new Renderer instance.
     * @param {object} domElements An object containing references to the key DOM elements.
     * @param {HTMLElement} domElements.textDisplay The element where the typing text will be rendered.
     * @param {HTMLElement} domElements.textWrapper The scrolling container for the text display.
     * @param {HTMLElement} domElements.wpmDisplay The element to display the WPM stat.
     * @param {HTMLElement} domElements.accuracyDisplay The element to display the accuracy stat.
     * @param {object} config The application configuration object.
     * @param {number} config.visibleLines The number of text lines visible in the text wrapper.
     * @param {number} config.scrollTargetLine The line the cursor should reach before scrolling occurs.
     */
    constructor(domElements, config) {
        this.dom = domElements;
        this.config = config;
        this.layout = { lineHeight: 0 };
    }

    /**
     * The main rendering orchestrator. It updates all visual parts of the UI
     * based on the provided state and stats.
     * @param {object} uiState The current UI state to be rendered.
     * @param {{characters: Array<object>, cursorPos: number, selectionEnd: number}} uiState
     * @param {object} stats The current performance stats.
     * @param {{wpm: number, accuracy: number}} stats
     */
    render(uiState, stats) {
        this.renderStats(stats);
        this.renderText(uiState);
        
        // requestAnimationFrame ensures we calculate scroll AFTER the text has been rendered
        requestAnimationFrame(() => this.renderScroll(uiState.cursorPos));
    }

    /**
     * Updates the WPM and accuracy display elements with the latest statistics.
     * @param {{wpm: number, accuracy: number}} stats The performance stats to display.
     */
    renderStats(stats) {
        this.dom.wpmDisplay.innerText = stats.wpm;
        this.dom.accuracyDisplay.innerText = stats.accuracy;
    }

    /**
     * Renders the main typing text, including character states, cursor, and selections.
     * It uses a DocumentFragment for efficient batch DOM updates.
     * @param {{characters: Array<object>, cursorPos: number, selectionEnd: number}} uiState The UI state for the text.
     */
    renderText({ characters, cursorPos, selectionEnd }) {
        const fragment = document.createDocumentFragment();
        const hasSelection = cursorPos !== selectionEnd;

        characters.forEach((charObj, index) => {
            const span = this.createCharacterSpan(charObj, index, cursorPos, selectionEnd, hasSelection);
            fragment.appendChild(span);
        });

        // Add a visible cursor at the very end of the text if it's the active position
        if (!hasSelection && cursorPos === characters.length && characters.length > 0) {
            const cursorSpan = document.createElement('span');
            cursorSpan.innerHTML = '&nbsp;'; // Non-breaking space to give it width
            cursorSpan.classList.add('cursor');
            fragment.appendChild(cursorSpan);
        }

        this.dom.textDisplay.innerHTML = '';
        this.dom.textDisplay.appendChild(fragment);
    }
    
    /**
     * Creates a single `<span>` element for a character, styled with the appropriate
     * CSS classes based on its state (correct, incorrect, selected, cursor, etc.).
     * @param {object} charObj The character object, e.g., { char: 'a', state: 'correct' }.
     * @param {number} index The index of this character in the full text.
     * @param {number} cursorPos The current primary cursor position.
     * @param {number} selectionEnd The end position of a text selection.
     * @param {boolean} hasSelection A flag indicating if a selection is active.
     * @returns {HTMLSpanElement} The fully styled span element for the character.
     * @private
     */
    createCharacterSpan(charObj, index, cursorPos, selectionEnd, hasSelection) {
        const span = document.createElement('span');
        // Replace newline characters with a visible symbol
        if (charObj.char === '\n') {
            span.innerHTML = '↵';
        } else {
            span.innerText = charObj.char;
        }

        const classes = [charObj.state];
        if (charObj.state === 'incorrect') {
            classes.push('underline');
        }

        if (hasSelection && index >= cursorPos && index < selectionEnd) {
            classes.push('selected');
            if (index === cursorPos) classes.push('selection-start');
            if (index === selectionEnd - 1) classes.push('selection-end');
        } 
        else if (index === cursorPos) {
            classes.push('cursor');
        }
        
        span.classList.add(...classes);
        return span;
    }

    /**
     * Calculates and caches critical layout values from the DOM, such as line height.
     * It also sets the fixed height of the text wrapper to prevent layout shifts during scrolling.
     * This should be called once on initialization and on any viewport resize.
     */
    initializeLayout() {
        const computedStyle = window.getComputedStyle(this.dom.textDisplay);
        this.layout.lineHeight = parseFloat(computedStyle.lineHeight);
        const padding = parseFloat(window.getComputedStyle(this.dom.textWrapper).paddingTop) + parseFloat(window.getComputedStyle(this.dom.textWrapper).paddingBottom);
        this.dom.textWrapper.style.height = `${(this.layout.lineHeight * this.config.visibleLines) + padding}px`;
    }
    
    /**
     * Calculates and applies the necessary vertical scroll to the text display element
     * to keep the cursor within the visible area.
     * @param {number} cursorPos The current cursor position.
     */
    renderScroll(cursorPos) {
        if (this.layout.lineHeight === 0) return;

        const spans = Array.from(this.dom.textDisplay.children);
        if (spans.length === 0) return;
        
        // 1. Calculate the start index of each line based on their rendered top offset.
        const lineBreaks = [0];
        let lastOffsetTop = spans[0].offsetTop;
        spans.forEach((span, index) => {
            if (span.offsetTop > lastOffsetTop) {
                lineBreaks.push(index);
                lastOffsetTop = span.offsetTop;
            }
        });

        // 2. Find which line index the cursor is currently on.
        let currentLineIndex = lineBreaks.findIndex((breakIndex, i) => {
            const nextBreakIndex = lineBreaks[i + 1] || spans.length;
            return cursorPos >= breakIndex && cursorPos < nextBreakIndex;
        });

        if (currentLineIndex === -1) {
            currentLineIndex = lineBreaks.length - 1;
        }

        // 3. Determine how many lines to scroll up.
        // This ensures scrolling only starts after the cursor passes the target line.
        const scrollTargetLine = Math.max(0, currentLineIndex - this.config.scrollTargetLine);
        const scrollAmount = scrollTargetLine * this.layout.lineHeight;
        
        this.dom.textDisplay.style.top = `-${scrollAmount}px`;
    }
}