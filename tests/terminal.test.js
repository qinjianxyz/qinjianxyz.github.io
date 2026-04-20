const Terminal = require('../js/terminal.js');

describe('Terminal', () => {
  let terminal;
  let container;
  let outputEl;
  let inputEl;
  let hintsEl;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div id="terminal">
        <div class="terminal-output"></div>
        <input class="terminal-input" type="text" />
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

    // Mock scrollToBottom to avoid layout-dependent errors in JSDOM
    // Since JSDOM doesn't do layout, scrollHeight/scrollTop behavior might be limited
    Element.prototype.scrollTo = jest.fn();

    terminal = new Terminal(container);
    // Override scrollToBottom on the instance
    terminal.scrollToBottom = jest.fn();
    // Also override sleep to speed up tests
    terminal.sleep = jest.fn().mockResolvedValue();
  });

  test('sudo command should return permission denied message', async () => {
    await terminal.executeCommand('sudo');

    expect(outputEl.innerHTML).toContain('Nice try! But you\'re not root here.');
    expect(outputEl.innerHTML).toContain('we should probably talk');
  });
});
