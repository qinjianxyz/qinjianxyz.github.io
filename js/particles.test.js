const { ParticleSystem, Particle } = require('./particles');

describe('ParticleSystem', () => {
  let canvas;
  let ctx;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    ctx = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0
    };
    canvas.getContext = jest.fn(() => ctx);
    canvas.width = 1024;
    canvas.height = 768;
  });

  test('initializes correctly', () => {
    const system = new ParticleSystem(canvas);
    expect(system.canvas).toBe(canvas);
    expect(system.ctx).toBe(ctx);
    expect(Array.isArray(system.particles)).toBe(true);
    expect(system.particles.length).toBeGreaterThan(0);
  });

  test('detects mobile environment', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    const system = new ParticleSystem(canvas);
    expect(system.isMobile()).toBe(true);
    expect(system.config.particleCount).toBe(40); // Mobile count

    // Reset
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });

  test('resize updates canvas dimensions', () => {
    const system = new ParticleSystem(canvas);
    window.innerWidth = 800;
    window.innerHeight = 600;
    system.resize();
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });
});
