// Renderer.js

export class Renderer {
    // Private field to protect DOM state
    #spanCache = [];
    #dom;
    #config;

    constructor(domElements, config) {
        this.#dom = domElements;
        this.#config = config; 
    }

    initializeText(originalText) {
        this.#spanCache = [];
        const fragment = document.createDocumentFragment();

        // Spread syntax for iterator-safe splitting
        [...originalText].forEach(char => {
            const span = document.createElement('span');
            span.textContent = char; // textContent is slightly faster than innerText
            span.className = 'default'; 
            this.#spanCache.push(span);
            fragment.append(span);
        });

        // Ghost cursor
        const cursorSpan = document.createElement('span');
        cursorSpan.innerHTML = '&nbsp;'; 
        cursorSpan.className = 'default';
        this.#spanCache.push(cursorSpan);
        fragment.append(cursorSpan);

        // Modern DOM wipe and replace
        this.#dom.textDisplay.replaceChildren(fragment);
    }

    setWindowSize() {
        if (this.#spanCache.length === 0) return;
        
        const sampleSpan = this.#spanCache[0];
        const computedStyle = window.getComputedStyle(sampleSpan);
        const lineHeight = parseFloat(computedStyle.lineHeight) || sampleSpan.offsetHeight;

        const wrapperStyle = window.getComputedStyle(this.#dom.textWrapper);
        const padding = parseFloat(wrapperStyle.paddingTop) + parseFloat(wrapperStyle.paddingBottom);
        
        const totalHeight = (lineHeight * this.#config.visibleLines) + padding;

        this.#dom.textWrapper.style.height = `${totalHeight}px`;
        this.#dom.textWrapper.style.overflow = 'hidden'; 
    }

    render(uiState, stats) {
        // Safe check using Optional Chaining
        this.#dom.wpmDisplay.innerText = stats?.wpm ?? 0;
        this.#dom.accuracyDisplay.innerText = stats?.accuracy ?? 100;
        
        this.#updateCharacterClasses(uiState);
        this.#scrollCursorIntoView(uiState.cursorPos);
    }

    // Private method
    #updateCharacterClasses({ characters, cursorPos }) {
        for (let i = 0; i < this.#spanCache.length; i++) {
            const span = this.#spanCache[i];
            const charData = characters[i];
            
            let newClass = charData ? charData.state : 'default';

            if (i === cursorPos) newClass += ' cursor';
            if (charData?.state === 'incorrect') newClass += ' underline';

            // DOM touch minimization
            if (span.className !== newClass) span.className = newClass;
        }
    }
    
    // Private method
    #scrollCursorIntoView(cursorPos) {
        const activeSpan = this.#spanCache[cursorPos];
        if (!activeSpan) return;

        activeSpan.scrollIntoView({ 
            block: 'center',
            behavior: 'smooth' 
        });
    }
}