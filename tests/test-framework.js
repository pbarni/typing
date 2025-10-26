// tests/test-framework.js

// --- NEW: Import the dependencies from their modules ---
import { createAssertionsModule } from './framework/Assertions.js';
import { createCollectorModule } from './framework/Collector.js';
import { createReporterModule } from './framework/Reporter.js';

// --- NEW: Export the final 'Test' object so the runner can import it ---
export const Test = (() => {
    // 1. Build the private modules by calling their factory functions.
    // This code now works because the functions have been imported.
    const Assertions = createAssertionsModule();
    const Collector = createCollectorModule();
    const Reporter = createReporterModule();

    // 2. Define the public-facing functions that orchestrate the modules.
    let currentBeforeEach = null;
    let currentAfterEach = null;

    const describe = (suiteName, suiteFn) => {
        Collector.startSuite(suiteName);
        const parentBeforeEach = currentBeforeEach;
        const parentAfterEach = currentAfterEach;
        
        try {
            suiteFn();
        } finally {
            currentBeforeEach = parentBeforeEach;
            currentAfterEach = parentAfterEach;
            Collector.endSuite();
        }
    };

    const it = (description, testFn) => {
        try {
            if (currentBeforeEach) currentBeforeEach();
            testFn();
            Collector.addTestResult({ name: description, status: 'PASS' });
        } catch (error) {
            Collector.addTestResult({ name: description, status: 'FAIL', error });
        } finally {
            if (currentAfterEach) currentAfterEach();
        }
    };
    
    it.each = (cases) => (descriptionTemplate, testFn) => {
        cases.forEach(caseData => {
            const description = descriptionTemplate.replace(
                /\{(\w+)\}/g,
                (match, key) => caseData[key] ?? match
            );
            it(description, () => testFn(caseData));
        });
    };

    const summarize = () => {
        const results = Collector.getResults();
        Reporter.summarize(results);
        Collector.initialize();
    };

    // 3. Initialize the stateful module.
    Collector.initialize();

    // 4. Return the public API (the Façade).
    return {
        describe,
        it,
        beforeEach: (fn) => { currentBeforeEach = fn; },
        afterEach: (fn) => { currentAfterEach = fn; },
        summarize,
        assertEqual: Assertions.assertEqual,
        assertDeepEqual: Assertions.assertDeepEqual,
        assertTrue: Assertions.assertTrue,
    };
})();