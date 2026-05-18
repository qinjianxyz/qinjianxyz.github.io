const assert = require('assert');

// Mock global document and window
global.window = {};
global.document = {
  addEventListener: (event, handler) => {
    if (event === 'keydown') {
      global.keydownHandler = handler;
    }
  }
};

// Import KonamiCode
const { KonamiCode } = require('../js/easter-eggs.js');

function testResetOnIncorrectKey() {
  console.log('Test: Reset on Incorrect Key (Security Check)');

  let callbackFired = false;
  const konami = new KonamiCode(() => {
    callbackFired = true;
  });

  // 1. Enter partial correct sequence (Up, Up) -> Position should be 2
  global.keydownHandler({ key: 'ArrowUp' });
  global.keydownHandler({ key: 'ArrowUp' });

  // 2. Enter incorrect key (x) -> Position should reset to 0
  global.keydownHandler({ key: 'x' });

  // 3. Attempt to continue from position 2 (Down, Down, Left, Right...)
  // If the reset logic works, this sequence will fail because we are at pos 0
  // and 'ArrowDown' does not match 'ArrowUp'.
  // If the reset logic fails, we are still at pos 2, so 'ArrowDown' matches, and we continue to success.
  const continuationSequence = [
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  for (const key of continuationSequence) {
    global.keydownHandler({ key });
  }

  assert.strictEqual(callbackFired, false, 'Callback should NOT fire if sequence is interrupted by incorrect key');
  console.log('✅ Passed (Callback did not fire on interrupted sequence)');
}

function testRecoveryAfterError() {
  console.log('Test: Recovery After Error (Happy Path)');

  let callbackFired = false;
  const konami = new KonamiCode(() => {
    callbackFired = true;
  });

  // 1. Enter partial correct sequence
  global.keydownHandler({ key: 'ArrowUp' });
  global.keydownHandler({ key: 'ArrowUp' });

  // 2. Enter incorrect key
  global.keydownHandler({ key: 'x' });

  // 3. Enter FULL correct sequence from start
  const correctSequence = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  for (const key of correctSequence) {
    global.keydownHandler({ key });
  }

  assert.strictEqual(callbackFired, true, 'Callback should fire when sequence is restarted correctly');
  console.log('✅ Passed (Callback fired on retry)');
}

// Run tests
try {
  testResetOnIncorrectKey();
  testRecoveryAfterError();
  console.log('All tests passed!');
} catch (e) {
  console.error('Test failed:', e.message);
  process.exit(1);
}
