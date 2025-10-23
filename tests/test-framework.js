// tests/test-framework.js

const Test = (() => {
    // 1. Build the private modules by calling their factory functions.
    // These functions must be defined in scripts loaded before this one.
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
            // testFn will use the public Assertions API, which will throw on failure.
            testFn();
            Collector.addTestResult({ name: description, status: 'PASS' });
        } catch (error) {
            Collector.addTestResult({ name: description, status: 'FAIL', error });
        } finally {
            if (currentAfterEach) currentAfterEach();
        }
    };

    const summarize = () => {
        const results = Collector.getResults();
        Reporter.summarize(results);
        Collector.initialize(); // Reset for a potential re-run on the same page
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