// Renderer.js

export class Renderer {
    constructor(domElements, config) {
        this.dom = domElements;
        this.config = config;
        this.layout = { lineHeight: 0 };
        this.spanCache = []; // We hold references to the DOM nodes here
    }

    /**
     * ONE-TIME SETUP: Creates the span elements for the entire text.
     * This is called only when a new game starts.
     */
    initializeText(originalText) {
        this.spanCache = [];
        const fragment = document.createDocumentFragment();

        // 1. Create spans for all characters
        originalText.split('').forEach(char => {
            const span = document.createElement('span');
            // Visual tweak: Show a symbol for newlines, otherwise text content
            if (char === '\n') {
                span.innerHTML = '↵';
            } else {
                span.innerText = char;
            }
            span.className = 'default'; // Start in neutral state
            
            this.spanCache.push(span);
            fragment.appendChild(span);
        });

        // 2. Create a "Ghost" cursor span at the very end
        // This is needed so the cursor has somewhere to sit if you type the whole text
        const cursorSpan = document.createElement('span');
        cursorSpan.innerHTML = '&nbsp;'; // Give it width so it's visible
        cursorSpan.className = 'default';
        this.spanCache.push(cursorSpan);
        fragment.appendChild(cursorSpan);

        // 3. Mount to DOM (The only heavy DOM operation)
        this.dom.textDisplay.innerHTML = '';
        this.dom.textDisplay.appendChild(fragment);
    }

    /**
     * THE LOOP: Efficiently updates classes on existing spans.
     */
    render(uiState, stats) {
        this.renderStats(stats);
        this.updateCharacterClasses(uiState);
        
        // Use requestAnimationFrame for scrolling to ensure styles have applied
        requestAnimationFrame(() => this.renderScroll(uiState.cursorPos));
    }

    renderStats(stats) {
        this.dom.wpmDisplay.innerText = stats.wpm;
        this.dom.accuracyDisplay.innerText = stats.accuracy;
    }

    updateCharacterClasses({ characters, cursorPos, selectionEnd }) {
        const hasSelection = cursorPos !== selectionEnd;
        // Ensure start is always the smaller number for math
        const start = Math.min(cursorPos, selectionEnd);
        const end = Math.max(cursorPos, selectionEnd);

        // We loop through our CACHE.
        // The cache size is always OriginalText + 1 (Ghost Span)
        for (let i = 0; i < this.spanCache.length; i++) {
            const span = this.spanCache[i];
            
            // Get the state from logic, or fallback to 'default'
            const charData = characters[i];
            let newClass = charData ? charData.state : 'default';

            // --- Decoration Logic ---
            
            // 1. Selection Highlight
            if (hasSelection && i >= start && i < end) {
                newClass += ' selected';
                if (i === start) newClass += ' selection-start';
                if (i === end - 1) newClass += ' selection-end';
            }
            // 2. Cursor (Only show if NO selection)
            else if (!hasSelection && i === cursorPos) {
                newClass += ' cursor';
            }
            
            // 3. Incorrect Underline
            if (charData && charData.state === 'incorrect') {
                newClass += ' underline';
            }

            // --- The "Virtual DOM" Check ---
            // Only touch the DOM if the class actually changed.
            if (span.className !== newClass) {
                span.className = newClass;
            }
        }
    }

    initializeLayout() {
        const computedStyle = window.getComputedStyle(this.dom.textDisplay);
        this.layout.lineHeight = parseFloat(computedStyle.lineHeight);
        
        const style = window.getComputedStyle(this.dom.textWrapper);
        const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        
        this.dom.textWrapper.style.height = `${(this.layout.lineHeight * this.config.visibleLines) + padding}px`;
    }
    
    renderScroll(cursorPos) {
        if (this.layout.lineHeight === 0 || this.spanCache.length === 0) return;

        // Use the span from cache to find position
        // If cursor is at the very end (ghost span), use that.
        const activeSpan = this.spanCache[cursorPos] || this.spanCache[this.spanCache.length - 1];
        if (!activeSpan) return;

        // Simple scroll logic
        const spanTop = activeSpan.offsetTop;
        const lineHeight = this.layout.lineHeight;
        
        // Calculate which "line number" we are on roughly
        const currentLine = Math.floor(spanTop / lineHeight);
        
        // Scroll so the cursor is on the 'scrollTargetLine' (e.g., line 2)
        const targetLine = Math.max(0, currentLine - this.config.scrollTargetLine);
        const scrollAmount = targetLine * lineHeight;

        this.dom.textDisplay.style.top = `-${scrollAmount}px`;
    }
}