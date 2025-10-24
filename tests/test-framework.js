// tests/test-framework.js

const Test = (() => {
    // ... (Assertions, Collector, Reporter modules are built here as before) ...
    const Assertions = createAssertionsModule();
    const Collector = createCollectorModule();
    const Reporter = createReporterModule();

    let currentBeforeEach = null;
    let currentAfterEach = null;

    const describe = (suiteName, suiteFn) => {
        Collector.startSuite(suiteName);
        const parentBeforeEach = currentBeforeEach;
        const parentAfterEach = currentAfterEach;
        currentBeforeEach = null;
        currentAfterEach = null;
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

    // --- NEW FUNCTION ---
    // Takes an array of test case data.
    // Returns a function that you can call with the test name and logic.
    it.each = (cases) => (descriptionTemplate, testFn) => {
        cases.forEach(caseData => {
            // Create a dynamic test description from the template
            const description = descriptionTemplate.replace(
                /\{(\w+)\}/g,
                (match, key) => caseData[key] ?? match // Replace {key} with caseData.key
            );
            
            // Run the original 'it' function for each case
            it(description, () => testFn(caseData));
        });
    };

    const summarize = () => {
        const results = Collector.getResults();
        Reporter.summarize(results);
        Collector.initialize();
    };
    
    Collector.initialize();

    // --- UPDATED PUBLIC API ---
    return {
        describe,
        it, // The original 'it' is still here and fully functional
        beforeEach: (fn) => { currentBeforeEach = fn; },
        afterEach: (fn) => { currentAfterEach = fn; },
        summarize,
        assertEqual: Assertions.assertEqual,
        assertDeepEqual: Assertions.assertDeepEqual,
        assertTrue: Assertions.assertTrue,
    };
})();