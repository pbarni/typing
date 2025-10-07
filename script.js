document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION & STATE ---

    const DOMElements = {
        textWrapper: document.getElementById('text-wrapper'),
        textDisplay: document.getElementById('text-to-type'),
        textInput: document.getElementById('text-input'),
        resetButton: document.getElementById('reset-btn'),
        wpmDisplay: document.getElementById('wpm'),
        accuracyDisplay: document.getElementById('accuracy'),
    };

    const config = {
        wordCount: 150,
        visibleLines: 5,
        scrollTargetLine: 2,
        wordsPerLine: 12, // REFACTOR: Extracted "magic number"
    };

    const words = [
        'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they', 'I', 'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you', 'do', 'but', 'from', 'or', 'which', 'one', 'would', 'all', 'will', 'there', 'say', 'who', 'make', 'when', 'can', 'more', 'if', 'no', 'man', 'out', 'other', 'so', 'what', 'time', 'up', 'go', 'about', 'than', 'into', 'could', 'state', 'only', 'new', 'year', 'some', 'take', 'come', 'these', 'know', 'see', 'use', 'get', 'like', 'then', 'first', 'any', 'work', 'now', 'may', 'such', 'give', 'over', 'think', 'most', 'even', 'find', 'day', 'also', 'after', 'way', 'many', 'must', 'look', 'before', 'great', 'back', 'through', 'long', 'where', 'much', 'should', 'well', 'people', 'down', 'own', 'just', 'because', 'good', 'each', 'those', 'feel', 'seem', 'how', 'high', 'too', 'place', 'little', 'world', 'very', 'still', 'nation', 'hand', 'old', 'life', 'tell', 'write', 'become', 'here', 'show', 'house', 'both', 'between', 'need', 'mean', 'call', 'develop', 'under', 'last', 'right', 'move', 'thing', 'general', 'school', 'never', 'same', 'another', 'begin', 'while', 'number', 'part', 'turn', 'real', 'leave', 'might', 'want', 'point', 'form', 'off', 'child', 'few', 'small', 'since', 'against', 'ask', 'late', 'home', 'interest', 'large', 'person', 'end', 'open', 'public', 'follow', 'during', 'present', 'without', 'again', 'hold', 'govern', 'around', 'possible', 'head', 'consider', 'word', 'program', 'problem', 'however', 'lead', 'system', 'set', 'order', 'eye', 'plan', 'run', 'keep', 'face', 'fact', 'group', 'play', 'stand', 'increase', 'early', 'course', 'change', 'help', 'line'
    ];

    let state = {};

    function getInitialState() {
        return {
            originalText: '', characters: [], cursorPos: 0, selectionEnd: 0,
            layout: { lineHeight: 0, lineBreaks: [] },
            stats: { startTime: null, wpm: 0, accuracy: 100 },
            gameFinished: false,
        };
    }

    // --- LOGIC MODULE ---

    const TypingLogic = {
        generateRandomText: (wordCount) => {
            let text = [];
            for (let i = 0; i < wordCount; i++) {
                text.push(words[Math.floor(Math.random() * words.length)]);
            }
            let textString = text.join(' ');
            let spaceCount = 0;
            return textString.replace(/ /g, () => {
                spaceCount++;
                // REFACTOR: Use value from config object
                return (spaceCount % config.wordsPerLine === 0) ? '\n' : ' ';
            });
        },
        updateCharacterState: (state) => {
            const typedText = DOMElements.textInput.value;
            state.characters = state.originalText.split('').map((char, index) => {
                const typedChar = typedText[index];
                let charState = 'default';
                if (typedChar !== undefined) {
                    charState = (typedChar === char) ? 'correct' : 'incorrect';
                }
                return { char, state: charState };
            });
        },
        calculateStats: (state) => {
            if (!state.stats.startTime) return;
            const typedText = DOMElements.textInput.value;
            const elapsedTime = (new Date() - state.stats.startTime) / 1000;
            if (elapsedTime === 0) return;
            const correctChars = state.characters.filter((c, i) => i < typedText.length && c.state === 'correct').length;
            const wordsTyped = typedText.trim().split(/\s+/).filter(Boolean).length;
            state.stats.wpm = Math.round((wordsTyped / elapsedTime) * 60) || 0;
            state.stats.accuracy = Math.round((correctChars / typedText.length) * 100) || 100;
        },
        calculateLayout: () => {
            const spans = Array.from(DOMElements.textDisplay.querySelectorAll('span'));
            if (spans.length === 0) return { lineHeight: 0, lineBreaks: [] };
            const computedStyle = window.getComputedStyle(DOMElements.textDisplay);
            const lineHeight = parseFloat(computedStyle.lineHeight);
            const lineBreaks = [0];
            let lastOffsetTop = spans[0].offsetTop;
            spans.forEach((span, index) => {
                if (span.offsetTop > lastOffsetTop) {
                    lineBreaks.push(index);
                    lastOffsetTop = span.offsetTop;
                }
            });
            return { lineHeight, lineBreaks };
        },
        determineScrollPosition: (state) => {
            const { cursorPos, layout } = state;
            if (layout.lineBreaks.length === 0) return 0;
            let currentLineIndex = layout.lineBreaks.findIndex((breakIndex, i) => {
                const nextBreakIndex = layout.lineBreaks[i + 1] || state.originalText.length;
                return cursorPos >= breakIndex && cursorPos < nextBreakIndex;
            });
            if (currentLineIndex === -1) currentLineIndex = layout.lineBreaks.length - 1;
            const scrollTargetLine = Math.max(0, currentLineIndex - config.scrollTargetLine);
            return -scrollTargetLine * layout.lineHeight;
        }
    };

    // --- RENDERER MODULE (Refactored) ---

    const Renderer = {
        // REFACTOR: This is now a high-level orchestrator
        renderText: (state) => {
            const fragment = document.createDocumentFragment();
            const hasSelection = state.cursorPos !== state.selectionEnd;

            state.characters.forEach((charObj, index) => {
                const charElement = Renderer.createCharacterSpan(charObj, index, state, hasSelection);
                fragment.appendChild(charElement);
            });

            if (!hasSelection && state.cursorPos === state.originalText.length) {
                fragment.appendChild(Renderer.createEndOfTextCursor());
            }

            DOMElements.textDisplay.innerHTML = '';
            DOMElements.textDisplay.appendChild(fragment);
        },

        // REFACTOR: New helper function for creating and styling a single character span
        createCharacterSpan: (charObj, index, state, hasSelection) => {
            const span = document.createElement('span');
            
            // Handle content (character or newline symbol)
            if (charObj.char === '\n') {
                span.innerHTML = '↵';
            } else {
                span.innerText = charObj.char;
            }

            // REFACTOR: Simplified class application
            const classes = [charObj.state];
            if (charObj.state === 'incorrect') {
                classes.push('underline');
            }

            if (hasSelection) {
                if (index >= state.cursorPos && index < state.selectionEnd) {
                    classes.push('selected');
                    if (index === state.cursorPos) classes.push('selection-start');
                    if (index === state.selectionEnd - 1) classes.push('selection-end');
                }
            } else { // No selection, so show cursor
                if (index === state.cursorPos) {
                    classes.push('cursor');
                }
            }
            
            span.classList.add(...classes);
            return span;
        },

        // REFACTOR: New helper function for the cursor at the end of the text
        createEndOfTextCursor: () => {
            const cursorSpan = document.createElement('span');
            cursorSpan.innerHTML = '&nbsp;';
            cursorSpan.classList.add('cursor');
            return cursorSpan;
        },

        renderStats: (state) => {
            DOMElements.wpmDisplay.innerText = state.stats.wpm;
            DOMElements.accuracyDisplay.innerText = state.stats.accuracy;
        },
        renderScroll: (scrollPosition) => {
            DOMElements.textDisplay.style.top = `${scrollPosition}px`;
        },
        updateLayoutHeight: (lineHeight) => {
            const padding = parseFloat(window.getComputedStyle(DOMElements.textWrapper).paddingTop) + parseFloat(window.getComputedStyle(DOMElements.textWrapper).paddingBottom);
            DOMElements.textWrapper.style.height = `${(lineHeight * config.visibleLines) + padding}px`;
        }
    };

    // --- APPLICATION FLOW ---

    function syncUI() {
        if (state.gameFinished) return;
        const typedText = DOMElements.textInput.value;
        state.cursorPos = DOMElements.textInput.selectionStart;
        state.selectionEnd = DOMElements.textInput.selectionEnd;
        if (!state.stats.startTime && typedText.length > 0) {
            state.stats.startTime = new Date();
        }
        state.gameFinished = typedText.length === state.originalText.length && state.cursorPos === state.originalText.length;
        TypingLogic.updateCharacterState(state);
        TypingLogic.calculateStats(state);
        const scrollPosition = TypingLogic.determineScrollPosition(state);
        Renderer.renderText(state);
        Renderer.renderStats(state);
        Renderer.renderScroll(scrollPosition);
    }

    function onResize() {
        state.layout = TypingLogic.calculateLayout();
        Renderer.updateLayoutHeight(state.layout.lineHeight);
        const scrollPosition = TypingLogic.determineScrollPosition(state);
        Renderer.renderScroll(scrollPosition);
    }

    function startNewGame() {
        state = getInitialState();
        state.originalText = TypingLogic.generateRandomText(config.wordCount);
        DOMElements.textInput.value = '';
        TypingLogic.updateCharacterState(state);
        Renderer.renderStats(state);
        DOMElements.textInput.focus();
        requestAnimationFrame(() => {
            Renderer.renderText(state);
            state.layout = TypingLogic.calculateLayout();
            Renderer.updateLayoutHeight(state.layout.lineHeight);
            const scrollPosition = TypingLogic.determineScrollPosition(state);
            Renderer.renderScroll(scrollPosition);
            syncUI();
        });
    }

    function init() {
        const eventsToSync = ['input', 'keydown', 'keyup', 'click', 'mousedown', 'mouseup', 'select'];
        eventsToSync.forEach(event => {
            DOMElements.textInput.addEventListener(event, () => {
                requestAnimationFrame(syncUI);
            });
        });
        DOMElements.textWrapper.addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN') {
                const spans = Array.from(DOMElements.textDisplay.children);
                const clickedIndex = spans.indexOf(e.target);
                const typedTextLength = DOMElements.textInput.value.length;
                const newCursorPos = (clickedIndex < typedTextLength) ? clickedIndex : typedTextLength;
                DOMElements.textInput.selectionStart = newCursorPos;
                DOMElements.textInput.selectionEnd = newCursorPos;
            }
            DOMElements.textInput.focus();
            syncUI();
        });
        DOMElements.resetButton.addEventListener('click', startNewGame);
        window.addEventListener('resize', onResize);
        startNewGame();
    }

    init();
});