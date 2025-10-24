// tests/Renderer/Renderer.test.js

Test.describe("Renderer", () => {
    let renderer;
    let dom; // To hold our fake DOM elements
    let sandbox; // To hold the dedicated testing area

    // This runs before each 'it' block, creating a fresh, isolated environment.
    Test.beforeEach(() => {
        // 1. Get the dedicated sandbox element from the runner page.
        sandbox = document.getElementById('test-sandbox');
        if (!sandbox) {
            throw new Error("The test runner HTML must include a <div id='test-sandbox'></div>");
        }

        // 2. Clear out the sandbox from any previous test and create the structure INSIDE it.
        sandbox.innerHTML = `
            <div id="text-wrapper" style="padding-top: 10px; padding-bottom: 10px;">
                <div id="text-display" style="line-height: 20px;"></div>
            </div>
            <span id="wpm">0</span>
            <span id="accuracy">100</span>
        `;
        
        // 3. Collect the elements into a dom object
        dom = {
            textWrapper: document.getElementById('text-wrapper'),
            textDisplay: document.getElementById('text-display'),
            wpmDisplay: document.getElementById('wpm'),
            accuracyDisplay: document.getElementById('accuracy'),
        };

        // 4. Instantiate the renderer with our sandbox DOM
        const config = { visibleLines: 5, scrollTargetLine: 2 };
        renderer = new Renderer(dom, config);
    });

    // This runs after each 'it' block, ensuring the sandbox is clean for the next test.
    Test.afterEach(() => {
        if (sandbox) {
            sandbox.innerHTML = '';
        }
    });

    // ==================================================================
    // Testing: renderStats()
    // ==================================================================
    Test.describe("renderStats()", () => {
        Test.it("should update the WPM and Accuracy displays", () => {
            const stats = { wpm: 52, accuracy: 98 };
            renderer.renderStats(stats);

            Test.assertEqual(dom.wpmDisplay.innerText, "52");
            Test.assertEqual(dom.accuracyDisplay.innerText, "98");
        });
    });

    // ==================================================================
    // Testing: renderText()
    // ==================================================================
    Test.describe("renderText()", () => {
        Test.it("should render the correct number of character spans", () => {
            const uiState = {
                characters: [
                    { char: 'h', state: 'correct' },
                    { char: 'e', state: 'default' },
                    { char: 'y', state: 'default' }
                ],
                cursorPos: 1,
                selectionEnd: 1
            };
            renderer.renderText(uiState);

            Test.assertEqual(dom.textDisplay.children.length, 3, "Should create one span per character.");
        });

        Test.it("should assign the correct classes for character states and cursor", () => {
            const uiState = {
                characters: [
                    { char: 'c', state: 'correct' },
                    { char: 'o', state: 'incorrect' },
                    { char: 'd', state: 'default' },
                ],
                cursorPos: 1, // Cursor should be on 'o'
                selectionEnd: 1
            };
            renderer.renderText(uiState);

            const spans = dom.textDisplay.children;
            Test.assertTrue(spans[0].classList.contains('correct'), "First span should have 'correct' class.");
            Test.assertTrue(spans[1].classList.contains('incorrect'), "Second span should have 'incorrect' class.");
            Test.assertTrue(spans[1].classList.contains('underline'), "Incorrect span should also have 'underline' class.");
            Test.assertTrue(spans[1].classList.contains('cursor'), "Second span should have 'cursor' class.");
            Test.assertTrue(spans[2].classList.contains('default'), "Third span should have 'default' class.");
        });

        Test.it("should correctly render a selection", () => {
            const uiState = {
                characters: "select".split('').map(c => ({ char: c, state: 'default' })),
                cursorPos: 1,     // Selection starts at 'e'
                selectionEnd: 4   // Selection ends before 'c' (covers 'e', 'l', 'e')
            };
            renderer.renderText(uiState);
            const spans = dom.textDisplay.children;

            Test.assertTrue(spans[0].classList.contains('selected') === false, "Character before selection should not be selected.");
            Test.assertTrue(spans[1].classList.contains('selected'), "First character in selection should be selected.");
            Test.assertTrue(spans[3].classList.contains('selected'), "Last character in selection should be selected.");
            Test.assertTrue(spans[4].classList.contains('selected') === false, "Character after selection should not be selected.");
            Test.assertTrue(spans[1].classList.contains('selection-start'), "Selection start class should be present.");
            Test.assertTrue(spans[3].classList.contains('selection-end'), "Selection end class should be present.");
        });
        
        Test.it("should render the special character for a newline", () => {
            const uiState = {
                characters: [{ char: '\n', state: 'default' }],
                cursorPos: 0,
                selectionEnd: 0
            };
            renderer.renderText(uiState);
            Test.assertEqual(dom.textDisplay.children[0].innerHTML, '↵');
        });
    });
});