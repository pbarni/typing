// StateAnalyzer.js

/**
 * Pure function: Analyzes text state and calculates statistics.
 * Modernized with Unicode support and Immutable returns.
 * 
 * @param {string} originalText 
 * @param {string} typedText 
 * @param {number} startTime 
 */
export function computeGameState(originalText, typedText, startTime) {
    // 1. Unicode-safe splitting (handles emojis/special chars correctly)
    const targetChars = [...originalText];
    const typedChars = [...typedText];
    
    const maxLength = targetChars.length;
    const safeTyped = typedChars.slice(0, maxLength);
    
    // 2. Generate Character States
    let correctChars = 0;
    
    const charStates = targetChars.map((char, index) => {
        const typedChar = safeTyped[index];
        
        if (typedChar === undefined) {
            return { char, state: 'default' };
        }
        if (typedChar === char) {
            correctChars++;
            return { char, state: 'correct' };
        }
        return { char, state: 'incorrect' };
    });

    // 3. Calculate Stats
    // Logical OR (||) handles the 0 division case cleanly
    const accuracy = safeTyped.length > 0 
        ? Math.round((correctChars / safeTyped.length) * 100) 
        : 100;

    let wpm = 0;
    if (startTime > 0) {
        const timeElapsedMin = (performance.now() - startTime) / 60000;
        if (timeElapsedMin > 0.001) { 
            wpm = Math.round((correctChars / 5) / timeElapsedMin);
        }
    }

    // 4. Return Frozen Object (Immutable)
    return Object.freeze({
        charStates,
        cursorPos: safeTyped.length,
        isFinished: safeTyped.length === maxLength && safeTyped.every((c, i) => c === targetChars[i]),
        stats: { wpm, accuracy }
    });
}