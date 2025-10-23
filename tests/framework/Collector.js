// tests/framework/Collector.js

function createCollectorModule() {
    let testTree = {};
    let suiteStack = [];

    return {
        initialize() {
            this.testTree = { name: "Test Suite", children: [] };
            this.suiteStack = [this.testTree];
        },
        getCurrentSuite() {
            return this.suiteStack[this.suiteStack.length - 1];
        },
        startSuite(suiteName) {
            const parentSuite = this.getCurrentSuite();
            const newSuite = { name: suiteName, children: [] };
            parentSuite.children.push(newSuite);
            this.suiteStack.push(newSuite);
        },
        endSuite() {
            this.suiteStack.pop();
        },
        addTestResult(result) {
            this.getCurrentSuite().children.push(result);
        },
        getResults() {
            return this.testTree;
        }
    };
}