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
        scrollTargetLine: 2, // The line to keep the cursor on (0-indexed, so 2 is the 3rd line)
    };

    const words = [
        'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they', 'I', 'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you', 'do', 'but', 'from', 'or', 'which', 'one', 'would', 'all', 'will', 'there', 'say', 'who', 'make', 'when', 'can', 'more', 'if', 'no', 'man', 'out', 'other', 'so', 'what', 'time', 'up', 'go', 'about', 'than', 'into', 'could', 'state', 'only', 'new', 'year', 'some', 'take', 'come', 'these', 'know', 'see', 'use', 'get', 'like', 'then', 'first', 'any', 'work', 'now', 'may', 'such', 'give', 'over', 'think', 'most', 'even', 'find', 'day', 'also', 'after', 'way', 'many', 'must', 'look', 'before', 'great', 'back', 'through', 'long', 'where', 'much', 'should', 'well', 'people', 'down', 'own', 'just', 'because', 'good', 'each', 'those', 'feel', 'seem', 'how', 'high', 'too', 'place', 'little', 'world', 'very', 'still', 'nation', 'hand', 'old', 'life', 'tell', 'write', 'become', 'here', 'show', 'house', 'both', 'between', 'need', 'mean', 'call', 'develop', 'under', 'last', 'right', 'move', 'thing', 'general', 'school', 'never', 'same', 'another', 'begin', 'while', 'number', 'part', 'turn', 'real', 'leave', 'might', 'want', 'point', 'form', 'off', 'child', 'few', 'small', 'since', 'against', 'ask', 'late', 'home', 'interest', 'large', 'person', 'end', 'open', 'public', 'follow', 'during', 'present', 'without', 'again', 'hold', 'govern', 'around', 'possible', 'head', 'consider', 'word', 'program', 'problem', 'however', 'lead', 'system', 'set', 'order', 'eye', 'plan', 'run', 'keep', 'face', 'fact', 'group', 'play', 'stand', 'increase', 'early', 'course', 'change', 'help', 'line'
    ];

    let state = {};

    function getInitialState() {
        return {
            originalText: '',
            typedText: '',
            characters: [], // { char: 'a', state: 'default' | 'correct' | 'incorrect' }
            layout: {
                lineHeight: 0,
                lineBreaks: [],
            },
            stats: {
                startTime: null,
                wpm: 0,
                accuracy: 100,
            },
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
            return text.join(' ');
        },

        updateCharacterState: (state) => {
            const { originalText, typedText } = state;
            state.characters = originalText.split('').map((char, index) => {
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
            const elapsedTime = (new Date() - state.stats.startTime) / 1000;
            if (elapsedTime === 0) return;

            const correctChars = state.characters.filter((c, i) => i < state.typedText.length && c.state === 'correct').length;
            const wordsTyped = state.typedText.trim().split(/\s+/).filter(Boolean).length;

            state.stats.wpm = Math.round((wordsTyped / elapsedTime) * 60) || 0;
            state.stats.accuracy = Math.round((correctChars / state.typedText.length) * 100) || 100;
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
            const { typedText, layout } = state;
            if (layout.lineBreaks.length === 0) return 0;

            let currentLineIndex = layout.lineBreaks.findIndex((breakIndex, i) => {
                const nextBreakIndex = layout.lineBreaks[i + 1] || state.originalText.length;
                return typedText.length >= breakIndex && typedText.length < nextBreakIndex;
            });

            if (currentLineIndex === -1) currentLineIndex = layout.lineBreaks.length - 1;

            const scrollTargetLine = Math.max(0, currentLineIndex - config.scrollTargetLine);
            return -scrollTargetLine * layout.lineHeight;
        }
    };

    // --- RENDERER MODULE ---

    const Renderer = {
        renderText: (state) => {
            const fragment = document.createDocumentFragment();
            state.characters.forEach(charObj => {
                const span = document.createElement('span');
                span.innerText = charObj.char;
                span.className = charObj.state;
                fragment.appendChild(span);
            });
            // Add the active cursor
            if (state.typedText.length < state.originalText.length) {
                const activeSpan = fragment.children[state.typedText.length];
                if(activeSpan) activeSpan.classList.add('active');
            }
            DOMElements.textDisplay.innerHTML = '';
            DOMElements.textDisplay.appendChild(fragment);
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

    function onInput() {
        if (state.gameFinished) return;

        if (!state.stats.startTime) {
            state.stats.startTime = new Date();
        }
        
        state.typedText = DOMElements.textInput.value;
        state.gameFinished = state.typedText.length === state.originalText.length;

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
        Renderer.renderText(state);
        Renderer.renderStats(state);

        requestAnimationFrame(() => {
            state.layout = TypingLogic.calculateLayout();
            Renderer.updateLayoutHeight(state.layout.lineHeight);
            const scrollPosition = TypingLogic.determineScrollPosition(state);
            Renderer.renderScroll(scrollPosition);
        });
    }

    function init() {
        DOMElements.textInput.addEventListener('input', onInput);
        DOMElements.resetButton.addEventListener('click', startNewGame);
        window.addEventListener('resize', onResize);
        startNewGame();
    }

    init();
});