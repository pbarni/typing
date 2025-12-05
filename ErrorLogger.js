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
     * Prints a nice help banner to the console.
     */
    static printHelp() {
        console.group("%c🛠️ Vibe Code Debugger", "background: #2c3e50; color: #3498db; padding: 5px; font-size: 14px; border-radius: 4px;");
        console.log("Welcome to the debug console! Here are your available commands:");
        console.log("---------------------------------------------------------------");
        console.log("%cDebug.printLog()", "color: #e67e22; font-family: monospace", "   - View the full immutable event log (Table).");
        console.log("%cDebug.printErrors()", "color: #e74c3c; font-family: monospace", "- View only the error events.");
        console.log("%cDebug.printStats()", "color: #27ae60; font-family: monospace", " - View calculated session statistics.");
        console.log("%cDebug.getReport()", "color: #f1c40f; font-family: monospace", "  - Get a copy-paste friendly text summary.");
        console.log("%cDebug.getRaw()", "color: #9b59b6; font-family: monospace", "     - Get the raw array for manual JS use.");
        console.log("---------------------------------------------------------------");
        console.groupEnd();
    }
    
    static help() {
        this.printHelp();
    }

    /**
     * Standard block message.
     */
    static logGateBlock(typedText, originalText, gameLog) {
        // We use console.log first to ensure visibility even if groups collapse
        console.log("%c⛔ INPUT BLOCKED: Fix your typos before proceeding.", "color: red; font-weight: bold");

        console.groupCollapsed("Details (Click to expand)");
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
     * Returns a string summary of the session, perfect for copy-pasting.
     * Usage: copy(Debug.getReport())
     */
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

    /**
     * Prints the entire immutable log history as a formatted table.
     */
    static printLog(optionalLog = null) {
        const log = this._getLogSource(optionalLog);
        
        // Using 'log' instead of 'group' ensures it's usually visible by default
        console.log(`%c📜 Full Log (${log.length} events)`, "font-weight: bold; color: #3498db");
        
        if (log.length === 0) {
            console.log("Log is empty.");
        } else {
            console.table(log, ['ts', 'action', 'char', 'expected', 'index', 'isError']);
        }
    }

    /**
     * Filters and prints only the error events.
     */
    static printErrors(optionalLog = null) {
        const log = this._getLogSource(optionalLog);
        const errors = log.filter(entry => entry.isError);

        console.log(`%c⚠️ Errors Found: ${errors.length}`, "font-weight: bold; color: #e74c3c");
        
        if (errors.length > 0) {
            console.table(errors, ['ts', 'char', 'expected', 'index']);
        } else {
            console.log("No errors recorded yet. Clean run!");
        }
    }

    /**
     * Calculates and prints aggregate statistics based on the log.
     */
    static printStats(optionalLog = null) {
        const log = this._getLogSource(optionalLog);
        
        if (log.length === 0) {
            console.log("No stats available (Log is empty).");
            return;
        }

        const inserts = log.filter(e => e.action === 'insert');
        const deletes = log.filter(e => e.action === 'delete');
        const errors = inserts.filter(e => e.isError);
        const correct = inserts.filter(e => !e.isError);

        const totalInserts = inserts.length;
        const accuracy = totalInserts > 0 
            ? ((correct.length / totalInserts) * 100).toFixed(2) 
            : 0;

        console.group("📊 Session Stats Analysis");
        console.log(`Total Keystrokes Logged: ${log.length}`);
        console.log(`-----------------------------------`);
        console.log(`⌨️  Insertions:   ${inserts.length}`);
        console.log(`🔙 Backspaces:   ${deletes.length}`);
        console.log(`-----------------------------------`);
        console.log(`✅ Correct Hits: ${correct.length}`);
        console.log(`❌ Miss/Typos:   ${errors.length}`);
        console.log(`-----------------------------------`);
        console.log(`🎯 Typing Accuracy: ${accuracy}%`);
        console.groupEnd();
    }

    /**
     * Returns the raw log array for manual manipulation.
     */
    static getRaw(optionalLog = null) {
        return this._getLogSource(optionalLog);
    }
}