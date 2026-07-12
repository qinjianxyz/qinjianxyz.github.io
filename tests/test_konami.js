const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- Mock Browser Environment ---

class MockDocument {
  constructor() {
    this.listeners = {};
    this.body = {
      appendChild: () => {},
      classList: {
          add: () => {},
          remove: () => {}
      }
    };
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Helper to trigger events
  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  getElementById() { return null; }
  createElement() { return { getContext: () => ({ fillRect: () => {}, fillText: () => {}, clearRect: () => {} }), classList: { add: () => {}, remove: () => {} } }; }
}

class MockWindow {
  constructor() {
    this.listeners = {};
    this.innerWidth = 1024;
    this.innerHeight = 768;
    this.outerWidth = 1024;
    this.outerHeight = 768;
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
}

// Global mocks
global.document = new MockDocument();
global.window = new MockWindow();
global.requestAnimationFrame = () => {};
global.cancelAnimationFrame = () => {};

// Mock setTimeout/clearTimeout to control time
let timeouts = {};
let nextTimeoutId = 1;

global.setTimeout = (callback, delay) => {
  const id = nextTimeoutId++;
  timeouts[id] = { callback, delay };
  return id;
};

global.clearTimeout = (id) => {
  delete timeouts[id];
};

// Helper to fast-forward time (run pending timeouts)
function fastForward(ms) {
  for (const id in timeouts) {
    if (timeouts[id].delay <= ms) {
        timeouts[id].callback();
        delete timeouts[id];
    }
  }
}


// --- Load Source Code ---

const sourceCode = fs.readFileSync(path.join(__dirname, '../js/easter-eggs.js'), 'utf8');

// We need to execute the code in the global context so classes are defined
vm.runInThisContext(sourceCode);


// --- Tests ---

console.log('🧪 Starting KonamiCode Tests...');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
  }
}

// Test 1: Happy Path
(() => {
  console.log('\nTest 1: Happy Path (Full Sequence)');
  let triggered = false;
  const konami = new KonamiCode(() => {
    triggered = true;
  });

  const sequence = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  sequence.forEach(key => {
    document.trigger('keydown', { key });
  });

  assert(triggered, 'Callback should be triggered after full sequence');
})();


// Test 2: Interrupted Sequence
(() => {
  console.log('\nTest 2: Interrupted Sequence');
  let triggerCount = 0;
  // Re-instantiate to clear state/listeners if needed,
  // but note that addEventListener accumulates.
  // For a simple script, we just ignore previous listeners or create a fresh instance if logic permits.
  // The class attaches a NEW listener every time.
  // To keep it clean, we might want to reset document listeners, but let's just see.
  // Actually, since KonamiCode attaches to document, multiple instances will ALL receive events.
  // We should reset the mock document listeners for isolation.

  document.listeners['keydown'] = []; // Reset listeners

  const konami = new KonamiCode(() => {
    triggerCount++;
  });

  // Up, Up, Down (Correct so far)
  document.trigger('keydown', { key: 'ArrowUp' });
  document.trigger('keydown', { key: 'ArrowUp' });
  document.trigger('keydown', { key: 'ArrowDown' });

  // Wrong key
  document.trigger('keydown', { key: 'x' });

  // Finish the rest of the sequence (should fail)
  const remaining = [
    'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  remaining.forEach(key => document.trigger('keydown', { key }));

  assert(triggerCount === 0, 'Callback should NOT be triggered after interrupted sequence');
})();


// Test 3: Timeout Reset
(() => {
  console.log('\nTest 3: Timeout Reset');
  document.listeners['keydown'] = []; // Reset listeners

  let triggered = false;
  const konami = new KonamiCode(() => {
    triggered = true;
  });

  // Up, Up
  document.trigger('keydown', { key: 'ArrowUp' });
  document.trigger('keydown', { key: 'ArrowUp' });

  // Wait too long (simulate 2.1 seconds)
  // The actual code uses setTimeout with 2000ms.
  // Our mock needs to execute that timeout callback.

  // We need to find the specific timeout registered by the class instance.
  // Since we are running in a single thread, we can just trigger ALL pending timeouts
  // that would have expired.

  // The code does: clearTimeout, then setTimeout(..., 2000).
  // So there should be one pending timeout.

  fastForward(2500); // Trigger the reset

  // Continue sequence (should fail because index was reset to 0)
  const remaining = [
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  remaining.forEach(key => document.trigger('keydown', { key }));

  assert(!triggered, 'Callback should NOT be triggered after timeout reset');

  // Verify we can start over
  const fullSequence = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  fullSequence.forEach(key => document.trigger('keydown', { key }));
  assert(triggered, 'Callback SHOULD be triggered after restarting sequence');

})();

// Summary
console.log(`\n--------------------------------------------------`);
console.log(`Tests Completed: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`--------------------------------------------------`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
