// Renderer.js

export class Renderer {
    constructor(domElements, config) {
        this.dom = domElements;
        this.config = config; // Needed for visibleLines
        this.spanCache = []; 
    }

    initializeText(originalText) {
        this.spanCache = [];
        const fragment = document.createDocumentFragment();

        originalText.split('').forEach(char => {
            const span = document.createElement('span');
            span.innerText = char;
            span.className = 'default'; 
            this.spanCache.push(span);
            fragment.appendChild(span);
        });

        const cursorSpan = document.createElement('span');
        cursorSpan.innerHTML = '&nbsp;'; 
        cursorSpan.className = 'default';
        this.spanCache.push(cursorSpan);
        fragment.appendChild(cursorSpan);

        this.dom.textDisplay.innerHTML = '';
        this.dom.textDisplay.appendChild(fragment);
    }

    /**
     * Calculates the height of the container to match 'visibleLines'
     */
    setWindowSize() {
        // Measure one span to get the line height
        if (this.spanCache.length === 0) return;
        
        const sampleSpan = this.spanCache[0];
        // We use computed style to get the precise pixel value
        const computedStyle = window.getComputedStyle(sampleSpan);
        const lineHeight = parseFloat(computedStyle.lineHeight) || sampleSpan.offsetHeight;

        // Calculate total height needed + padding
        const wrapperStyle = window.getComputedStyle(this.dom.textWrapper);
        const padding = parseFloat(wrapperStyle.paddingTop) + parseFloat(wrapperStyle.paddingBottom);
        
        const totalHeight = (lineHeight * this.config.visibleLines) + padding;

        // Apply to the wrapper
        this.dom.textWrapper.style.height = `${totalHeight}px`;
        
        // Ensure we hide the overflow so it looks like a "window"
        // This allows scrollIntoView to work but hides the scrollbar
        this.dom.textWrapper.style.overflow = 'hidden'; 
    }

    render(uiState, stats) {
        this.dom.wpmDisplay.innerText = stats.wpm;
        this.dom.accuracyDisplay.innerText = stats.accuracy;
        
        this.updateCharacterClasses(uiState);
        this.scrollCursorIntoView(uiState.cursorPos);
    }

    updateCharacterClasses({ characters, cursorPos }) {
        for (let i = 0; i < this.spanCache.length; i++) {
            const span = this.spanCache[i];
            const charData = characters[i];
            let newClass = charData ? charData.state : 'default';

            if (i === cursorPos) newClass += ' cursor';
            if (charData && charData.state === 'incorrect') newClass += ' underline';

            if (span.className !== newClass) span.className = newClass;
        }
    }
    
    scrollCursorIntoView(cursorPos) {
        const activeSpan = this.spanCache[cursorPos];
        if (!activeSpan) return;

        // 'block: center' ensures the active line is always in the middle 
        // of our little window (e.g., line 2 of 3).
        activeSpan.scrollIntoView({ 
            block: 'center',
            behavior: 'smooth' 
        });
    }
}