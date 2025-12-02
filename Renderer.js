// Renderer.js

export class Renderer {
    constructor(domElements, config) {
        this.dom = domElements;
        this.config = config;
        this.layout = { lineHeight: 0 };
        this.spanCache = []; 
    }

    /**
     * ONE-TIME SETUP: Creates the span elements for the entire text.
     */
    initializeText(originalText) {
        this.spanCache = [];
        const fragment = document.createDocumentFragment();

        // 1. Create spans for all characters
        originalText.split('').forEach(char => {
            const span = document.createElement('span');
            if (char === '\n') {
                span.innerHTML = '↵';
            } else {
                span.innerText = char;
            }
            span.className = 'default'; 
            
            this.spanCache.push(span);
            fragment.appendChild(span);
        });

        // 2. Create a "Ghost" cursor span at the very end
        const cursorSpan = document.createElement('span');
        cursorSpan.innerHTML = '&nbsp;'; 
        cursorSpan.className = 'default';
        this.spanCache.push(cursorSpan);
        fragment.appendChild(cursorSpan);

        // 3. Mount to DOM
        this.dom.textDisplay.innerHTML = '';
        this.dom.textDisplay.appendChild(fragment);
    }

    /**
     * THE LOOP: Efficiently updates classes. 
     * SIMPLIFIED: No selection logic anymore.
     */
    render(uiState, stats) {
        this.renderStats(stats);
        this.updateCharacterClasses(uiState);
        requestAnimationFrame(() => this.renderScroll(uiState.cursorPos));
    }

    renderStats(stats) {
        this.dom.wpmDisplay.innerText = stats.wpm;
        this.dom.accuracyDisplay.innerText = stats.accuracy;
    }

    updateCharacterClasses({ characters, cursorPos }) {
        // We loop through our CACHE.
        for (let i = 0; i < this.spanCache.length; i++) {
            const span = this.spanCache[i];
            
            const charData = characters[i];
            let newClass = charData ? charData.state : 'default';

            // --- Decoration Logic (Simplified) ---
            
            // 1. Cursor: Only show at the exact typing position
            if (i === cursorPos) {
                newClass += ' cursor';
            }
            
            // 2. Incorrect Underline
            if (charData && charData.state === 'incorrect') {
                newClass += ' underline';
            }

            // --- The "Virtual DOM" Check ---
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

        const activeSpan = this.spanCache[cursorPos] || this.spanCache[this.spanCache.length - 1];
        if (!activeSpan) return;

        const spanTop = activeSpan.offsetTop;
        const lineHeight = this.layout.lineHeight;
        
        const currentLine = Math.floor(spanTop / lineHeight);
        const targetLine = Math.max(0, currentLine - this.config.scrollTargetLine);
        const scrollAmount = targetLine * lineHeight;

        this.dom.textDisplay.style.top = `-${scrollAmount}px`;
    }
}