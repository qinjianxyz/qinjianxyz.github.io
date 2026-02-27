const Terminal = require('../js/terminal');

describe('Terminal History Navigation', () => {
  let terminal;
  let container;
  let outputEl;
  let inputEl;
  let hintsEl;

  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = `
      <div id="terminal">
        <div class="terminal-output"></div>
        <input type="text" class="terminal-input" />
        <div class="command-hints"></div>
      </div>
      <div id="image-viewer" class="hidden">
        <img id="viewer-image" />
      </div>
    `;

    container = document.getElementById('terminal');
    outputEl = container.querySelector('.terminal-output');
    inputEl = container.querySelector('.terminal-input');
    hintsEl = container.querySelector('.command-hints');

    // Mock necessary DOM methods
    HTMLElement.prototype.scrollIntoView = jest.fn();
    HTMLElement.prototype.scrollTo = jest.fn();
    HTMLElement.prototype.focus = jest.fn();

    // Mock window.scrollTo (used in some places)
    window.scrollTo = jest.fn();

    // Instantiate Terminal
    terminal = new Terminal(container);

    // Mock executeCommand to avoid side effects but allow history update logic to run
    jest.spyOn(terminal, 'executeCommand').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('ArrowUp does nothing when history is empty', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    inputEl.dispatchEvent(event);

    expect(terminal.historyIndex).toBe(-1);
    expect(inputEl.value).toBe('');
  });

  test('Enter key adds command to history', () => {
    inputEl.value = 'help';
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    inputEl.dispatchEvent(event);

    expect(terminal.history).toContain('help');
    expect(terminal.historyIndex).toBe(1); // Points to end of history (length)
    expect(terminal.executeCommand).toHaveBeenCalledWith('help');
  });

  test('ArrowUp navigates back through history', () => {
    // Populate history
    terminal.history = ['cmd1', 'cmd2', 'cmd3'];
    terminal.historyIndex = 3; // Initially at end

    // Press Up once -> cmd3
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(terminal.historyIndex).toBe(2);
    expect(inputEl.value).toBe('cmd3');

    // Press Up again -> cmd2
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(terminal.historyIndex).toBe(1);
    expect(inputEl.value).toBe('cmd2');

    // Press Up again -> cmd1
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(terminal.historyIndex).toBe(0);
    expect(inputEl.value).toBe('cmd1');
  });

  test('ArrowUp stops at the beginning of history', () => {
    terminal.history = ['cmd1'];
    terminal.historyIndex = 1;

    // Up -> cmd1
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(terminal.historyIndex).toBe(0);
    expect(inputEl.value).toBe('cmd1');

    // Up again -> should stay at cmd1
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(terminal.historyIndex).toBe(0);
    expect(inputEl.value).toBe('cmd1');
  });

  test('ArrowDown navigates forward through history', () => {
    terminal.history = ['cmd1', 'cmd2'];
    terminal.historyIndex = 0; // Currently at 'cmd1'
    inputEl.value = 'cmd1';

    // Down -> cmd2
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(terminal.historyIndex).toBe(1);
    expect(inputEl.value).toBe('cmd2');
  });

  test('ArrowDown clears input at the end of history', () => {
    terminal.history = ['cmd1'];
    terminal.historyIndex = 0;
    inputEl.value = 'cmd1';

    // Down -> new empty line
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(terminal.historyIndex).toBe(1);
    expect(inputEl.value).toBe('');
  });

  test('ArrowDown stops at the end (empty input)', () => {
    terminal.history = ['cmd1'];
    terminal.historyIndex = 1;
    inputEl.value = '';

    // Down -> stays empty
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(terminal.historyIndex).toBe(1);
    expect(inputEl.value).toBe('');
  });
});
