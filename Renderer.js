// Renderer.js

export class Renderer {
    constructor(domElements, config) {
        this.dom = domElements;
        this.config = config; 
        this.spanCache = []; 
    }

    initializeText(originalText) {
        this.spanCache = [];
        const fragment = document.createDocumentFragment();

        // SIMPLIFIED: Just create linear spans. 
        // The browser's native text engine handles word wrapping perfectly 
        // now that we are using 'display: block' in CSS.
        originalText.split('').forEach(char => {
            const span = document.createElement('span');
            span.innerText = char;
            span.className = 'default'; 
            this.spanCache.push(span);
            fragment.appendChild(span);
        });

        // Ghost cursor
        const cursorSpan = document.createElement('span');
        cursorSpan.innerHTML = '&nbsp;'; 
        cursorSpan.className = 'default';
        this.spanCache.push(cursorSpan);
        fragment.appendChild(cursorSpan);

        this.dom.textDisplay.innerHTML = '';
        this.dom.textDisplay.appendChild(fragment);
    }

    setWindowSize() {
        if (this.spanCache.length === 0) return;
        
        const sampleSpan = this.spanCache[0];
        const computedStyle = window.getComputedStyle(sampleSpan);
        const lineHeight = parseFloat(computedStyle.lineHeight) || sampleSpan.offsetHeight;

        const wrapperStyle = window.getComputedStyle(this.dom.textWrapper);
        const padding = parseFloat(wrapperStyle.paddingTop) + parseFloat(wrapperStyle.paddingBottom);
        
        const totalHeight = (lineHeight * this.config.visibleLines) + padding;

        this.dom.textWrapper.style.height = `${totalHeight}px`;
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

        activeSpan.scrollIntoView({ 
            block: 'center',
            behavior: 'smooth' 
        });
    }
}