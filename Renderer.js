// Renderer.js

class Renderer {
    constructor(domElements, config) {
        this.dom = domElements;
        this.config = config;
        this.layout = { lineHeight: 0 };
    }

    render(uiState, stats) {
        this.renderStats(stats);
        this.renderText(uiState);
        
        // requestAnimationFrame ensures we calculate scroll AFTER the text has been rendered
        requestAnimationFrame(() => this.renderScroll(uiState.cursorPos));
    }

    renderStats(stats) {
        this.dom.wpmDisplay.innerText = stats.wpm;
        this.dom.accuracyDisplay.innerText = stats.accuracy;
    }

    renderText({ characters, cursorPos, selectionEnd }) {
        const fragment = document.createDocumentFragment();
        const hasSelection = cursorPos !== selectionEnd;

        characters.forEach((charObj, index) => {
            const span = this.createCharacterSpan(charObj, index, cursorPos, selectionEnd, hasSelection);
            fragment.appendChild(span);
        });

        if (!hasSelection && cursorPos === characters.length && characters.length > 0) {
            const cursorSpan = document.createElement('span');
            cursorSpan.innerHTML = '&nbsp;';
            cursorSpan.classList.add('cursor');
            fragment.appendChild(cursorSpan);
        }

        this.dom.textDisplay.innerHTML = '';
        this.dom.textDisplay.appendChild(fragment);
    }
    
    createCharacterSpan(charObj, index, cursorPos, selectionEnd, hasSelection) {
        const span = document.createElement('span');
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

    initializeLayout() {
        const computedStyle = window.getComputedStyle(this.dom.textDisplay);
        this.layout.lineHeight = parseFloat(computedStyle.lineHeight);
        const padding = parseFloat(window.getComputedStyle(this.dom.textWrapper).paddingTop) + parseFloat(window.getComputedStyle(this.dom.textWrapper).paddingBottom);
        this.dom.textWrapper.style.height = `${(this.layout.lineHeight * this.config.visibleLines) + padding}px`;
    }
    
    // THIS IS THE CORRECTED SCROLLING LOGIC
    renderScroll(cursorPos) {
        if (this.layout.lineHeight === 0) return;

        const spans = Array.from(this.dom.textDisplay.children);
        if (spans.length === 0) return;
        
        // 1. Calculate the start index of each line based on their rendered position.
        const lineBreaks = [0];
        let lastOffsetTop = spans[0].offsetTop;
        spans.forEach((span, index) => {
            if (span.offsetTop > lastOffsetTop) {
                lineBreaks.push(index);
                lastOffsetTop = span.offsetTop;
            }
        });

        // 2. Find which line the cursor is currently on.
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