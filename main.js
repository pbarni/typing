// main.js

import { GameConfig } from './GameConfig.js';
import { TypingEngine } from './TypingEngine.js';
import { Renderer } from './Renderer.js';
import { InputPolicy } from './InputPolicy.js';
import { TextGenerator } from './TextGenerator.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements (The View)
    const dom = {
        textWrapper: document.getElementById('text-wrapper'),
        textDisplay: document.getElementById('text-to-type'),
        textInput: document.getElementById('text-input'),
        resetButton: document.getElementById('reset-btn'),
        wpmDisplay: document.getElementById('wpm'),
        accuracyDisplay: document.getElementById('accuracy'),
    };

    // 2. Instantiate the "Modules" (The Logic Parts)
    
    // Renderer needs config for visibleLines
    const renderer = new Renderer(dom, GameConfig);
    
    // Policy has built-in mechanics now, no config needed
    const rules = new InputPolicy();
    
    // Generator needs wordCount
    const generator = new TextGenerator(GameConfig);

    // 3. Assemble the Engine
    const engine = new TypingEngine(dom, {
        renderer: renderer,
        rules: rules,
        generator: generator
    });

    engine.init();
});