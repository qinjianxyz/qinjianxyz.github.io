const { KonamiCode } = require('../js/easter-eggs');

describe('KonamiCode', () => {
  let callback;
  let konami;
  let keydownHandler;

  beforeEach(() => {
    // Mock document.addEventListener
    jest.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'keydown') {
        keydownHandler = handler;
      }
    });

    jest.useFakeTimers();
    callback = jest.fn();
    konami = new KonamiCode(callback);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  test('should trigger callback on full Konami sequence', () => {
    const sequence = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];

    sequence.forEach(key => {
      keydownHandler({ key });
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(konami.position).toBe(0); // Should reset after success
  });

  test('should reset position if timeout occurs', () => {
    // Enter partial sequence
    keydownHandler({ key: 'ArrowUp' });
    keydownHandler({ key: 'ArrowUp' });

    expect(konami.position).toBe(2);

    // Fast forward time by 2000ms
    jest.advanceTimersByTime(2000);

    // Position should be reset to 0
    expect(konami.position).toBe(0);
  });

  test('should not reset position if next key is pressed within timeout', () => {
    // Enter first key
    keydownHandler({ key: 'ArrowUp' });
    expect(konami.position).toBe(1);

    // Advance time by 1000ms (less than timeout)
    jest.advanceTimersByTime(1000);

    // Enter second key
    keydownHandler({ key: 'ArrowUp' });
    expect(konami.position).toBe(2);
  });

  test('should reset position on incorrect key', () => {
    keydownHandler({ key: 'ArrowUp' });
    expect(konami.position).toBe(1);

    // Wrong key
    keydownHandler({ key: 'b' });
    expect(konami.position).toBe(0);
  });
});
