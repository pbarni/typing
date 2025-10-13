// TypingJournal.js

class TypingJournal {
    constructor(text) {
        this.originalText = text;
        this.keystrokeLog = [];
    }

    addEvent(event) {
        this.keystrokeLog.push(event);
    }

    // This method allows us to move the cursor back in time, for example, on a click.
    truncateLog(newCursorPos) {
        let currentPos = 0;
        let sliceIndex = 0;

        // Replay the log to find the exact event that corresponds to the new cursor position
        for (const event of this.keystrokeLog) {
            if (currentPos === newCursorPos) break;
            
            if (event.type === 'correct' || event.type === 'error') {
                currentPos++;
            } else if (event.type === 'backspace') {
                currentPos = Math.max(0, currentPos - 1);
            }
            sliceIndex++;
        }
        
        this.keystrokeLog = this.keystrokeLog.slice(0, sliceIndex);
    }

    getLog() {
        return this.keystrokeLog;
    }
}