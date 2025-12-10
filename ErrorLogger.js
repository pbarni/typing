// ErrorLogger.js

export class ErrorLogger {
    
    static _getLogSource(providedLog) {
        if (providedLog) return providedLog;
        if (window.engine && window.engine.historyLog) return window.engine.historyLog;
        console.warn("ErrorLogger: Could not find engine history. Make sure window.engine is set.");
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

    static logGateBlock(typedText, originalText, attemptedKey, reason) {
        // 1. Log the Header
        console.log("%c⛔ INPUT BLOCKED", "color: red; font-weight: bold; font-size: 12px;");
        
        // 2. Open the Group
        console.group("Reason & Details");
        
        // 3. Log details using console.log with styling (instead of console.error) 
        // to prevent browser filters from hiding these lines.
        const errorStyle = "color: #e74c3c; font-weight: bold;";
        const detailStyle = "color: #c0392b;";

        if (reason === 'strict-space') {
             console.log(`%cConstraint: Strict Word Boundary`, errorStyle);
             console.log(`%cReason: You typed '${attemptedKey}' but a SPACE is required here.`, detailStyle);
        } else if (reason === 'typeracer-gate') {
             console.log(`%cConstraint: TypeRacer Gate (Typos Present)`, errorStyle);
             console.log(`%cReason: You cannot advance to the next word until previous errors are fixed.`, detailStyle);
        } else {
             console.log(`%cConstraint: Unknown Block`, errorStyle);
             console.log(`%cReason: Engine blocked input '${attemptedKey}' with reason code: ${reason}`, detailStyle);
        }

        // 4. Calculate Context
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
            console.log(`%cFirst Error at Index: ${errorIndex}`, "color: #d35400");
            console.log(`%cExpected: "${originalArr[errorIndex]}" | Found: "${typedArr[errorIndex]}"`, "color: #d35400");
        } else {
             console.log("%cText is clean so far (Blockage caused by next strict character).", "color: #27ae60");
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