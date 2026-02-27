const Terminal = require('./terminal.js');

describe('Terminal Secret Command Locking', () => {
  let term;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="terminal">
        <div class="terminal-output"></div>
        <input class="terminal-input" type="text">
        <div class="command-hints"></div>
      </div>
      <div id="image-viewer" class="hidden"><img id="viewer-image"></div>
    `;

    // Mock scrolling methods which are not implemented in JSDOM
    HTMLElement.prototype.scrollIntoView = jest.fn();
    window.scrollTo = jest.fn();

    // Initialize Terminal
    const container = document.getElementById('terminal');
    term = new Terminal(container);

    // Silence console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should deny access to secret command when locked', async () => {
    // Ensure secrets are locked by default
    expect(term.secretsUnlocked).toBe(false);

    // Execute the secret command
    await term.executeCommand('salmon --secret');

    // Check output for denial message
    const output = term.outputEl.innerHTML;
    expect(output).toContain('Access denied. This command is locked.');
    expect(output).not.toContain('THE REAL STORY BEHIND SALMON');
  });

  test('should grant access to secret command when unlocked', async () => {
    // Unlock secrets
    term.secretsUnlocked = true;

    // Execute the secret command
    await term.executeCommand('salmon --secret');

    // Check output for success message
    const output = term.outputEl.innerHTML;
    expect(output).toContain('THE REAL STORY BEHIND SALMON');
    expect(output).not.toContain('Access denied');
  });
});
