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
    // We pass the config to the parts that need it.
    
    // Renderer needs config for visibleLines
    const renderer = new Renderer(dom, GameConfig);
    
    // Policy needs mechanics (strictSpace, stopOnError)
    const rules = new InputPolicy(GameConfig.mechanics);
    
    // Generator needs wordCount
    const generator = new TextGenerator(GameConfig);

    // 3. Assemble the Engine
    // "Here is your renderer, here are your rules, here is your generator. Go."
    const engine = new TypingEngine(dom, {
        renderer: renderer,
        rules: rules,
        generator: generator
    });

    engine.init();
});