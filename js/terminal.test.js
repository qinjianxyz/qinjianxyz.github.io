const Terminal = require('./terminal');

describe('Terminal', () => {
  let container;
  let terminal;

  beforeEach(() => {
    // Set up a mock DOM structure that matches what Terminal expects
    document.body.innerHTML = `
      <div id="terminal">
        <div class="terminal-output"></div>
        <input class="terminal-input" type="text" />
        <div class="command-hints"></div>
      </div>
      <div id="image-viewer" class="hidden">
        <img id="viewer-image" src="" alt="Full size photo" />
      </div>
    `;

    container = document.getElementById('terminal');

    // Mock HTMLElement.prototype.scrollIntoView since JSDOM doesn't implement it
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    // Mock window.scrollTo/scrollBy if needed
    window.scrollTo = jest.fn();

    // Initialize the Terminal instance
    terminal = new Terminal(container);

    // Mock sleep to be instantaneous
    terminal.sleep = jest.fn().mockResolvedValue();

    // Mock window.open for commands that open links
    window.open = jest.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('should initialize correctly', () => {
    expect(terminal).toBeDefined();
    expect(terminal.container).toBe(container);
    expect(terminal.outputEl).toBeTruthy();
    expect(terminal.inputEl).toBeTruthy();
    expect(terminal.hintsEl).toBeTruthy();
  });

  describe('help command', () => {
    test('should display available commands', async () => {
      // Execute the help command directly via the handler
      await terminal.commands.help.execute([], terminal);

      const outputHtml = terminal.outputEl.innerHTML;

      // Check for key sections and commands in the output
      expect(outputHtml).toContain('Available Commands');
      expect(outputHtml).toContain('whoami');
      expect(outputHtml).toContain('ray --journey');
      expect(outputHtml).toContain('ray --human');
      expect(outputHtml).toContain('ray --philosophy');
      expect(outputHtml).toContain('salmon --vision');
      expect(outputHtml).toContain('contact');
      expect(outputHtml).toContain('social');
      expect(outputHtml).toContain('clear');
    });
  });

  describe('executeCommand', () => {
      test('should call the correct handler for a known command', async () => {
          const spy = jest.spyOn(terminal.commands.help, 'execute');
          await terminal.executeCommand('help');
          expect(spy).toHaveBeenCalled();
      });

      test('should handle unknown commands', async () => {
          const spy = jest.spyOn(terminal, 'printLine');
          await terminal.executeCommand('unknown_command');
          expect(spy).toHaveBeenCalledWith(expect.stringContaining('Command not found: unknown_command'), 'error');
      });
  });
});
