import { sortWordsByStart, normalizeWordSequence, findWordIndexForSplit } from './src/utils/timelineUtils.js';
import { generateSRT } from './src/utils/srtExport.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

function runTests() {
    console.log("Running smoke tests...");

    // Test timelineUtils
    const words = [
        { id: "1", word: "Hello", start: 1, end: 2 },
        { id: "2", word: "world", start: 0, end: 0.5 }
    ];
    const sorted = sortWordsByStart(words);
    assert(sorted[0].id === "2", "Sort failed");
    
    const idx = findWordIndexForSplit(sorted, 1.5);
    assert(idx === 1, "Find word index failed");

    // Test srtExport
    const srt = generateSRT(sorted);
    assert(srt.includes("00:00:00,000 --> 00:00:00,500"), "SRT format failed");
    
    console.log("Smoke tests passed successfully!");
}

runTests();
