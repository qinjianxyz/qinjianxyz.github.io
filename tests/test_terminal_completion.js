const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Mock DOM classes and objects
class MockHTMLElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.className = '';
    this.value = '';
    this.innerHTML = '';
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.classList = {
      add: (c) => {},
      remove: (c) => {},
      contains: (c) => false
    };
    this.scrollHeight = 100;
    this.scrollTop = 0;
  }

  querySelector(selector) {
    if (selector === '.terminal-output') return mockOutput;
    if (selector === '.terminal-input') return mockInput;
    if (selector === '.command-hints') return mockHints;
    return null;
  }

  appendChild(child) {
    this.children.push(child);
  }

  addEventListener(event, handler) {
    this.listeners[event] = handler;
  }

  focus() {}

  closest() { return null; }
}

const mockInput = new MockHTMLElement('input');
const mockOutput = new MockHTMLElement('div');
const mockHints = new MockHTMLElement('div');
const mockContainer = new MockHTMLElement('div');

const mockDocument = {
  createElement: (tag) => new MockHTMLElement(tag),
  getElementById: (id) => new MockHTMLElement('div'),
  addEventListener: () => {},
};

const mockWindow = {
  open: () => {},
  terminal: null
};

// Read the source file
const terminalJsPath = path.join(__dirname, '../js/terminal.js');
let terminalJsContent = fs.readFileSync(terminalJsPath, 'utf8');

// The original file does not export the class, and it runs code on load.
// We need to modify it slightly to make it testable in this sandbox environment
// without rewriting the original file permanently.
// We will wrap the class definition to expose it.

// Remove the DOMContentLoaded listener setup at the bottom of the file
const initializationBlock = "document.addEventListener('DOMContentLoaded',";
const index = terminalJsContent.indexOf(initializationBlock);
if (index !== -1) {
    terminalJsContent = terminalJsContent.substring(0, index);
}

// Run the script in a sandbox
const sandbox = {
  document: mockDocument,
  window: mockWindow,
  console: console,
  setTimeout: (fn, ms) => fn(), // Execute immediately for tests
  Promise: Promise
};

vm.createContext(sandbox);

// Execute the modified content
// Then explicitly export the class so we can access it
vm.runInNewContext(terminalJsContent + "\nthis.Terminal = Terminal;", sandbox);

const Terminal = sandbox.Terminal;

// Test Suite
console.log('🧪 Running Terminal Tab Completion Tests...\n');
let passed = 0;
let failed = 0;

try {
  if (!Terminal) {
      throw new Error("Terminal class not found in sandbox.");
  }

  // Setup
  const term = new Terminal(mockContainer);

  // Override commands for controlled testing
  term.commands = {
    'apple': { hidden: false },
    'apricot': { hidden: false },
    'banana': { hidden: false },
    'secret': { hidden: true }
  };

  // Test 1: Single Match
  console.log('Test 1: Single Match (b -> banana)');
  mockInput.value = 'b';
  term.tabComplete();
  assert.strictEqual(mockInput.value, 'banana', `Expected 'banana', got '${mockInput.value}'`);
  console.log('✅ Passed\n');
  passed++;

  // Test 2: Multiple Matches
  console.log('Test 2: Multiple Matches (a -> apple, apricot)');
  mockInput.value = 'a';
  const initialChildrenCount = mockOutput.children.length;
  term.tabComplete();
  assert.strictEqual(mockInput.value, 'a', `Expected input to remain 'a', got '${mockInput.value}'`);

  // Verify output was printed
  // The terminal adds a line to output for multiple matches
  const outputLines = mockOutput.children;
  const lastLine = outputLines[outputLines.length - 1];
  const lastText = lastLine ? lastLine.innerHTML : '';

  assert.ok(mockOutput.children.length > initialChildrenCount, 'Output should have increased');
  assert.ok(lastText.includes('apple') && lastText.includes('apricot'), `Expected output to contain matches, got: ${lastText}`);
  console.log('✅ Passed\n');
  passed++;

  // Test 3: No Match
  console.log('Test 3: No Match (z -> z)');
  mockInput.value = 'z';
  term.tabComplete();
  assert.strictEqual(mockInput.value, 'z', `Expected input to remain 'z', got '${mockInput.value}'`);
  console.log('✅ Passed\n');
  passed++;

  // Test 4: Hidden Command
  console.log('Test 4: Hidden Command (sec -> secret)');
  mockInput.value = 'sec';
  term.tabComplete();
  assert.strictEqual(mockInput.value, 'sec', `Expected input to remain 'sec' (hidden), got '${mockInput.value}'`);
  console.log('✅ Passed\n');
  passed++;

} catch (err) {
  console.error('❌ Test Failed:', err.message);
  failed++;
  process.exit(1);
}

console.log(`Summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
