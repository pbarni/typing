export class InputHandler {
    /**
     * Pure function: Compare typed text vs original text
     * Returns the state needed for the Renderer.
     */
    static compare(originalText, typedText) {
        // We no longer guess "cursorPos" based on history.
        // We just verify the current input length.
        const maxLength = originalText.length;
        const currentLength = typedText.length;
        
        // Safety clip
        const safeTyped = typedText.slice(0, maxLength);

        // Generate character states for the Renderer
        const charStates = originalText.split('').map((char, index) => {
            const typedChar = safeTyped[index];
            if (typedChar === undefined) return { char, state: 'default' };
            return { char, state: typedChar === char ? 'correct' : 'incorrect' };
        });

        return {
            charStates,
            cursorPos: currentLength, // The cursor is always at the end of input
            isGameFinished: safeTyped === originalText
        };
    }
}