// ErrorLogger.js

export class ErrorLogger {
    
    static _getLogSource(providedLog) {
        if (providedLog) return providedLog;
        if (window.engine && window.engine.historyLog) return window.engine.historyLog;
        console.warn("ErrorLogger: Could not find engine history.");
        return [];
    }

    static printHelp() {
        console.group("%c🛠️ Vibe Code Debugger", "background: #2c3e50; color: #3498db; padding: 5px; font-size: 14px; border-radius: 4px;");
        console.log("Welcome to the debug console! Commands:");
        console.log("---------------------------------------");
        console.log("%cDebug.printLog()", "color: #e67e22; font-family: monospace", "   - View full immutable event log.");
        console.log("%cDebug.printErrors()", "color: #e74c3c; font-family: monospace", "- View errors only.");
        console.log("%cDebug.printStats()", "color: #27ae60; font-family: monospace", " - View calculated stats.");
        console.log("%cDebug.getReport()", "color: #f1c40f; font-family: monospace", "  - Get copy-paste summary.");
        console.log("Global instance: %cwindow.engine", "font-family: monospace; font-weight: bold");
        console.groupEnd();
    }
    
    static help() { this.printHelp(); }

    /**
     * Updated to handle specific blockage reasons.
     * @param {string} typedText - Current input
     * @param {string} originalText - Target text
     * @param {string} attemptedKey - The key that triggered the block
     */
    static logGateBlock(typedText, originalText, attemptedKey = null) {
        const nextIndex = typedText.length;
        const expectedChar = originalText[nextIndex];
        
        console.log("%c⛔ INPUT BLOCKED", "color: red; font-weight: bold; font-size: 12px;");
        
        // Logic to determine WHY it was blocked
        const isSpaceBoundary = expectedChar === ' ';
        const isCleanSoFar = originalText.startsWith(typedText);

        console.groupCollapsed("Reason & Details");

        if (isSpaceBoundary && attemptedKey !== ' ' && attemptedKey !== 'Enter') {
             console.error("Constraint: Strict Word Boundary");
             console.error(`Reason: You tried to type '${attemptedKey}' but a SPACE is required here.`);
        } else if (!isCleanSoFar) {
             console.error("Constraint: TypeRacer Gate (Typos Present)");
             console.error("Reason: You cannot advance to the next word until previous errors are fixed.");
        } else {
             console.error("Constraint: Unknown Gate Block");
        }

        // Find mismatch
        let errorIndex = -1;
        const typedArr = [...typedText];
        const originalArr = [...originalText];

        for (let i = 0; i < typedArr.length; i++) {
            if (typedArr[i] !== originalArr[i]) {
                errorIndex = i;
                break;
            }
        }

        if (errorIndex !== -1) {
            console.warn(`First Error at Index: ${errorIndex}`);
            console.warn(`Expected: "${originalArr[errorIndex]}" | Found: "${typedArr[errorIndex]}"`);
        } else {
            console.info("Text is currently clean (Block caused by next strict character).");
        }

        console.groupEnd();
    }

    static getReport(optionalLog = null) {
        const log = this._getLogSource(optionalLog);
        if (log.length === 0) return "Log is empty.";

        const errors = log.filter(e => e.isError);
        const inserts = log.filter(e => e.action === 'insert');
        const correct = inserts.filter(e => !e.isError);
        const accuracy = inserts.length > 0 ? ((correct.length / inserts.length) * 100).toFixed(1) : 0;

        const lines = [
            "=== 📄 TYPING SESSION REPORT ===",
            `Time: ${new Date().toLocaleTimeString()}`,
            `Total Events: ${log.length}`,
            `Accuracy:     ${accuracy}%`,
            `Error Count:  ${errors.length}`,
            "",
            "--- ❌ ERROR LIST ---",
        ];

        if (errors.length === 0) {
            lines.push("None! Perfect run.");
        } else {
            errors.forEach(e => {
                lines.push(`[Index ${e.index}] Expected '${e.expected}' but typed '${e.char}'`);
            });
        }
        lines.push("================================");
        return lines.join('\n');
    }

    static printLog(optionalLog = null) {
        const log = this._getLogSource(optionalLog);
        console.log(`%c📜 Full Log (${log.length} events)`, "font-weight: bold; color: #3498db");
        if (log.length > 0) console.table(log, ['ts', 'action', 'char', 'expected', 'index', 'isError']);
    }

    static printErrors(optionalLog = null) {
        const log = this._getLogSource(optionalLog);
        const errors = log.filter(entry => entry.isError);
        console.log(`%c⚠️ Errors Found: ${errors.length}`, "font-weight: bold; color: #e74c3c");
        if (errors.length > 0) console.table(errors, ['ts', 'char', 'expected', 'index']);
    }

    static printStats(optionalLog = null) {
        const log = this._getLogSource(optionalLog);
        if (log.length === 0) return console.log("Log empty.");

        const inserts = log.filter(e => e.action === 'insert');
        const deletes = log.filter(e => e.action === 'delete');
        const errors = inserts.filter(e => e.isError);
        const correct = inserts.filter(e => !e.isError);
        const accuracy = inserts.length > 0 ? ((correct.length / inserts.length) * 100).toFixed(2) : 0;

        console.group("📊 Session Stats");
        console.log(`Inserts:    ${inserts.length}`);
        console.log(`Backspaces: ${deletes.length}`);
        console.log(`Accuracy:   ${accuracy}%`);
        console.groupEnd();
    }

    static getRaw(optionalLog = null) {
        return this._getLogSource(optionalLog);
    }
}