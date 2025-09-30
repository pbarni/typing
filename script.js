document.addEventListener('DOMContentLoaded', () => {
    const textWrapper = document.getElementById('text-wrapper');
    const textToTypeElement = document.getElementById('text-to-type');
    const textInputElement = document.getElementById('text-input');
    const resetButton = document.getElementById('reset-btn');

    const words = [
        'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they', 'I', 'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you', 'do', 'but', 'from', 'or', 'which', 'one', 'would', 'all', 'will', 'there', 'say', 'who', 'make', 'when', 'can', 'more', 'if', 'no', 'man', 'out', 'other', 'so', 'what', 'time', 'up', 'go', 'about', 'than', 'into', 'could', 'state', 'only', 'new', 'year', 'some', 'take', 'come', 'these', 'know', 'see', 'use', 'get', 'like', 'then', 'first', 'any', 'work', 'now', 'may', 'such', 'give', 'over', 'think', 'most', 'even', 'find', 'day', 'also', 'after', 'way', 'many', 'must', 'look', 'before', 'great', 'back', 'through', 'long', 'where', 'much', 'should', 'well', 'people', 'down', 'own', 'just', 'because', 'good', 'each', 'those', 'feel', 'seem', 'how', 'high', 'too', 'place', 'little', 'world', 'very', 'still', 'nation', 'hand', 'old', 'life', 'tell', 'write', 'become', 'here', 'show', 'house', 'both', 'between', 'need', 'mean', 'call', 'develop', 'under', 'last', 'right', 'move', 'thing', 'general', 'school', 'never', 'same', 'another', 'begin', 'while', 'number', 'part', 'turn', 'real', 'leave', 'might', 'want', 'point', 'form', 'off', 'child', 'few', 'small', 'since', 'against', 'ask', 'late', 'home', 'interest', 'large', 'person', 'end', 'open', 'public', 'follow', 'during', 'present', 'without', 'again', 'hold', 'govern', 'around', 'possible', 'head', 'consider', 'word', 'program', 'problem', 'however', 'lead', 'system', 'set', 'order', 'eye', 'plan', 'run', 'keep', 'face', 'fact', 'group', 'play', 'stand', 'increase', 'early', 'course', 'change', 'help', 'line'
    ];

    let lineHeight = 0;
    let lineBreaks = [];

    function generateRandomText(wordCount) {
        let text = [];
        for (let i = 0; i < wordCount; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            text.push(words[randomIndex]);
        }
        return text.join(' ');
    }

    function calculateLayout() {
        const allChars = Array.from(textToTypeElement.querySelectorAll('span'));
        if (allChars.length === 0) return;
        
        const computedStyle = window.getComputedStyle(textToTypeElement);
        lineHeight = parseFloat(computedStyle.lineHeight);
        
        const padding = parseFloat(window.getComputedStyle(textWrapper).paddingTop) + parseFloat(window.getComputedStyle(textWrapper).paddingBottom);
        textWrapper.style.height = `${(lineHeight * 5) + padding}px`;
        
        lineBreaks = [0];
        let lastOffsetTop = allChars[0].offsetTop;

        allChars.forEach((charSpan, index) => {
            if (charSpan.offsetTop > lastOffsetTop) {
                lineBreaks.push(index);
                lastOffsetTop = charSpan.offsetTop;
            }
        });
    }

    function getNextText() {
        const text = generateRandomText(150);
        textToTypeElement.innerHTML = '';
        text.split('').forEach(character => {
            const charSpan = document.createElement('span');
            charSpan.innerText = character;
            textToTypeElement.appendChild(charSpan);
        });
        
        textInputElement.value = '';
        textToTypeElement.style.top = '0px';

        // Wait for the browser to render the new text, then calculate.
        requestAnimationFrame(() => {
            calculateLayout();
            updateActiveCharacterAndScroll();
        });
    }

    function updateActiveCharacterAndScroll() {
        const typedValue = textInputElement.value;
        const allChars = textToTypeElement.querySelectorAll('span');
        
        allChars.forEach(span => span.classList.remove('active'));

        if (typedValue.length < allChars.length) {
            const activeChar = allChars[typedValue.length];
            activeChar.classList.add('active');
            
            let currentLineIndex = lineBreaks.findIndex((breakIndex, i) => {
                const nextBreakIndex = lineBreaks[i + 1] || allChars.length;
                return typedValue.length >= breakIndex && typedValue.length < nextBreakIndex;
            });

            if (currentLineIndex === -1) currentLineIndex = lineBreaks.length - 1;

            let scrollTargetLine = Math.max(0, currentLineIndex - 2);
            const scrollOffset = -scrollTargetLine * lineHeight;
            textToTypeElement.style.top = `${scrollOffset}px`;
        }
    }

    textInputElement.addEventListener('input', () => {
        const typedValue = textInputElement.value;
        const allChars = textToTypeElement.querySelectorAll('span');

        allChars.forEach((charSpan, index) => {
            charSpan.classList.remove('correct', 'incorrect');
            const typedChar = typedValue[index];
            if (typedChar == null) {
                // Untyped
            } else if (typedChar === charSpan.innerText) {
                charSpan.classList.add('correct');
            } else {
                charSpan.classList.add('incorrect');
            }
        });

        updateActiveCharacterAndScroll();
    });
    
    // Recalculate layout on window resize as line breaks will change
    window.addEventListener('resize', () => {
        calculateLayout();
        updateActiveCharacterAndScroll();
    });

    textToTypeElement.addEventListener('click', () => textInputElement.focus());
    resetButton.addEventListener('click', getNextText);

    getNextText();
});