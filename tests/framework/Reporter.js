// tests/framework/Reporter.js

function createReporterModule() {
    const collectStats = (suite) => {
        let stats = { passed: 0, failed: 0 };
        for (const child of suite.children) {
            if (child.status === 'PASS') stats.passed++;
            else if (child.status === 'FAIL') stats.failed++;
            else {
                const nestedStats = collectStats(child);
                stats.passed += nestedStats.passed;
                stats.failed += nestedStats.failed;
            }
        }
        return stats;
    };

    const printSuite = (suite) => {
        const stats = collectStats(suite);
        const total = stats.passed + stats.failed;
        const groupLabel = total > 0 ? `${suite.name} (${stats.passed}/${total} passed)` : suite.name;
        const groupColor = stats.failed > 0 ? 'color: #e74c3c;' : 'color: #2ecc71;';

        if (total > 0) {
            console.groupCollapsed(`%c${groupLabel}`, groupColor);
        } else if (suite.children.length > 0) { // Only print suites that contain other suites
            console.groupCollapsed(groupLabel);
        } else {
             return; // Don't print empty suites
        }

        const failedTests = suite.children.filter(c => c.status === 'FAIL');
        const passedTests = suite.children.filter(c => c.status === 'PASS');
        const nestedSuites = suite.children.filter(c => !c.status);

        if (failedTests.length > 0) {
            console.group(`%c✗ Failed Tests`, 'color: #e74c3c;');
            failedTests.forEach(test => {
                console.groupCollapsed(`%c${test.name}`, 'color: #e74c3c;');
                console.error(test.error);
                console.groupEnd();
            });
            console.groupEnd();
        }
        if (passedTests.length > 0) {
            console.groupCollapsed(`%c✓ Passed Tests`, 'color: #2ecc71;');
            passedTests.forEach(test => console.log(`%c${test.name}`, 'color: #2ecc71;'));
            console.groupEnd();
        }
        nestedSuites.forEach(subSuite => printSuite(subSuite));
        console.groupEnd();
    };

    return {
        summarize(testTree) {
            console.group("--- Test Summary ---");
            // Start printing from the root's children to avoid the outer "Test Suite" group
            testTree.children.forEach(suite => printSuite(suite));

            const finalStats = collectStats(testTree);
            const totalCount = finalStats.passed + finalStats.failed;
            const summaryColor = finalStats.failed > 0 ? '#e74c3c' : '#2ecc71';
            console.log(`%cTotal Tests: ${totalCount} | Passed: ${finalStats.passed} | Failed: ${finalStats.failed}`, `color: ${summaryColor}; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 10px;`);
            console.groupEnd();
        }
    };
}