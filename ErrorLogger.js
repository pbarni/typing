// ErrorLogger.js

export class ErrorLogger {
    
    /**
     * Tries to retrieve the log from the global game instance if not provided.
     */
    static _getLogSource(providedLog) {
        if (providedLog) return providedLog;
        if (window.game && window.game.log) return window.game.log;
        console.warn("ErrorLogger: Could not find game log. Make sure window.game is set.");
        return [];
    }

    /**
     * Standard block message (from previous step).
     */
    static logGateBlock(typedText, originalText, gameLog) {
        console.group("%c⛔ INPUT BLOCKED", "color: red; font-weight: bold; font-size: 12px;");
        console.error("Constraint: TypeRacer Gate Active");
        console.error("Reason: Cannot advance to next word (SPACE) while current word has errors.");

        let errorIndex = -1;
        for (let i = 0; i < typedText.length; i++) {
            if (typedText[i] !== originalText[i]) {
                errorIndex = i;
                break;
            }
        }

        if (errorIndex !== -1) {
            console.warn(`First Error at Index: ${errorIndex}`);
            console.warn(`Expected: "${originalText[errorIndex]}" | Found: "${typedText[errorIndex]}"`);
        }
        
        console.groupEnd();
    }

    /**
     * Prints the entire immutable log history as a formatted table.
     * Callable from console via: Debug.printLog()
     */
    static printLog(optionalLog = null) {
        const log = this._getLogSource(optionalLog);
        
        console.group("📜 Full Game Log (Immutable Memory)");
        console.log(`Total Events: ${log.length}`);
        
        if (log.length === 0) {
            console.log("Log is empty.");
        } else {
            // console.table gives a nice spreadsheet view of the array
            console.table(log, ['ts', 'action', 'char', 'expected', 'index', 'isError']);
        }
        console.groupEnd();
    }

    /**
     * Filters and prints only the error events.
     * Callable from console via: Debug.printErrors()
     */
    static printErrors(optionalLog = null) {
        const log = this._getLogSource(optionalLog);
        const errors = log.filter(entry => entry.isError);

        console.group("rw Errors Only");
        console.log(`Total Errors Found: ${errors.length}`);
        
        if (errors.length > 0) {
            console.table(errors, ['ts', 'char', 'expected', 'index']);
        } else {
            console.log("No errors recorded yet. Clean run!");
        }
        console.groupEnd();
    }

    /**
     * Returns the raw log array for manual manipulation in console.
     * Usage: const history = Debug.getRaw();
     */
    static getRaw(optionalLog = null) {
        return this._getLogSource(optionalLog);
    }
}