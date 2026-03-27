
/**
 * @jest-environment jsdom
 */

const Terminal = require('./terminal.js');

describe('Terminal', () => {
  let terminal;
  let container;
  let outputEl;
  let inputEl;
  let hintsEl;

  beforeEach(() => {
    // Mock the DOM structure
    document.body.innerHTML = `
      <div id="terminal">
        <div class="terminal-output"></div>
        <div class="terminal-input-line">
            <span class="prompt"></span>
            <input type="text" class="terminal-input" autofocus>
        </div>
        <div class="command-hints"></div>
      </div>
    `;

    container = document.getElementById('terminal');
    outputEl = container.querySelector('.terminal-output');
    inputEl = container.querySelector('.terminal-input');
    hintsEl = container.querySelector('.command-hints');

    // Mock scrollToBottom and sleep because they interact with layout/timing
    Terminal.prototype.scrollToBottom = jest.fn();
    Terminal.prototype.sleep = jest.fn().mockResolvedValue(true);
    // Mock showWelcome to avoid async complexity in constructor
    Terminal.prototype.showWelcome = jest.fn();

    terminal = new Terminal(container);
  });

  test('tabComplete shows matches for "s" (salmon, social)', () => {
    inputEl.value = 's';
    terminal.tabComplete();

    const outputText = outputEl.textContent;
    // Expected output format: "\nMatches: salmon, social"
    // The implementation wraps it in a div, so we check if the div was added.
    const lastLine = outputEl.lastElementChild;
    expect(lastLine).toBeTruthy();
    expect(lastLine.innerHTML).toContain('Matches: salmon, social');
  });

  test('tabComplete shows matches for "r" (ray, resume)', () => {
    inputEl.value = 'r';
    terminal.tabComplete();

    const lastLine = outputEl.lastElementChild;
    expect(lastLine).toBeTruthy();
    expect(lastLine.innerHTML).toContain('Matches: ray, resume');
  });

  test('tabComplete does nothing for no match "z"', () => {
    inputEl.value = 'z';
    const initialChildCount = outputEl.childElementCount;

    terminal.tabComplete();

    // Should not add any new lines
    expect(outputEl.childElementCount).toBe(initialChildCount);
  });

  test('tabComplete autocompletes exact match "help"', () => {
    inputEl.value = 'hel';
    terminal.tabComplete();

    // Should autocomplete to "help"
    expect(inputEl.value).toBe('help');

    // Should not print matches
    const lastLine = outputEl.lastElementChild;
    // If output is empty, lastLine is null. If not, check content.
    if (lastLine) {
        expect(lastLine.innerHTML).not.toContain('Matches:');
    }
  });
});
