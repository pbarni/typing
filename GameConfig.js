// GameConfig.js

export const GameConfig = {
    // Content Settings
    wordCount: 120, // Change this to test! (e.g., 10, 50, 100)
    
    // Visual Settings
    visibleLines: 5,
    
    // Mechanics (The Rules)
    mechanics: {
        strictSpace: true,      // Must type Space at word boundary
        stopOnError: true,      // TypeRacer style gate
        allowBackspace: true
    }
};