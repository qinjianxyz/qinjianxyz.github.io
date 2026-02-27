const { ParticleSystem } = require('../js/particles.js');

describe('ParticleSystem', () => {
  let canvas;
  let originalInnerWidth;
  let originalUserAgent;

  beforeEach(() => {
    // Setup canvas mock
    canvas = document.createElement('canvas');
    canvas.getContext = jest.fn(() => ({
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn()
    }));

    // Save original window/navigator properties
    originalInnerWidth = window.innerWidth;
    originalUserAgent = navigator.userAgent;

    // Mock requestAnimationFrame to prevent loop
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });

    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: originalUserAgent
    });

    jest.restoreAllMocks();
  });

  test('should initialize with 80 particles on desktop', () => {
    // Mock Desktop environment
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    const system = new ParticleSystem(canvas);
    expect(system.config.particleCount).toBe(80);
  });

  test('should initialize with 40 particles on mobile width', () => {
    // Mock Mobile Width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });
    // Keep user agent as desktop to isolate width test
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    const system = new ParticleSystem(canvas);
    expect(system.config.particleCount).toBe(40);
  });

  test('should initialize with 40 particles on mobile user agent', () => {
    // Mock Desktop Width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    // Mock Mobile User Agent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36'
    });

    const system = new ParticleSystem(canvas);
    expect(system.config.particleCount).toBe(40);
  });
});
