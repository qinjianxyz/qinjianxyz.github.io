const { ParticleSystem, Particle } = require('../js/particles');

describe('Particle System', () => {
  let canvas;
  let ctx;
  let particleSystem;

  beforeEach(() => {
    // Mock Canvas and Context
    canvas = {
      width: 1000,
      height: 800,
      getContext: jest.fn().mockReturnValue({
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0
      })
    };

    // Setup window properties used in ParticleSystem
    global.window.innerWidth = 1000;
    global.window.innerHeight = 800;
    global.requestAnimationFrame = jest.fn();
    global.cancelAnimationFrame = jest.fn();

    particleSystem = new ParticleSystem(canvas);
    // Stop the automatic animation loop for controlled testing
    particleSystem.stop();
  });

  test('initializes with particles', () => {
    expect(particleSystem.particles.length).toBeGreaterThan(0);
    expect(particleSystem.config.particleCount).toBeGreaterThan(0);
  });

  describe('Particle', () => {
    let particle;

    beforeEach(() => {
      // Create a single particle for testing
      particle = new Particle(particleSystem);
      // Place particle in center
      particle.x = 500;
      particle.y = 400;
      // Reset velocity
      particle.speedX = 0;
      particle.speedY = 0;
      particle.baseSpeedX = 0;
      particle.baseSpeedY = 0;
    });

    test('moves according to base speed when no mouse interaction', () => {
      // Set base speed
      particle.baseSpeedX = 1;
      particle.baseSpeedY = 1;
      particle.speedX = 1;
      particle.speedY = 1;

      // Ensure mouse is null
      particleSystem.mouse.x = null;
      particleSystem.mouse.y = null;

      const initialX = particle.x;
      const initialY = particle.y;

      particle.update();

      expect(particle.x).toBe(initialX + 1);
      expect(particle.y).toBe(initialY + 1);
    });

    test('flees from mouse when within radius', () => {
      // Position mouse close to particle
      // Particle at 500, 400. Mouse at 490, 400.
      // dx = 10, dy = 0. Distance = 10. Radius = 150.
      particleSystem.mouse.x = 490;
      particleSystem.mouse.y = 400;
      particleSystem.mouse.radius = 150;

      particle.update();

      // Should move away from mouse (positive X direction)
      expect(particle.speedX).toBeGreaterThan(0);

      // Since mouse is directly to the left, Y speed shouldn't change much (mostly 0)
      // but let's focus on the repulsion effect being present.
      expect(particle.x).toBeGreaterThan(500);
    });

    test('does not flee from mouse when outside radius', () => {
      // Position mouse far from particle
      // Particle at 500, 400. Mouse at 100, 100.
      // Distance > 150.
      particleSystem.mouse.x = 100;
      particleSystem.mouse.y = 100;
      particleSystem.mouse.radius = 150;

      particle.update();

      // Velocity should remain 0 (base speed)
      expect(particle.speedX).toBe(0);
      expect(particle.speedY).toBe(0);

      // Position should not change
      expect(particle.x).toBe(500);
      expect(particle.y).toBe(400);
    });

    test('returns to base speed after repulsion', () => {
        // First simulate repulsion
        particleSystem.mouse.x = 490;
        particleSystem.mouse.y = 400;
        particle.update();

        const repelledSpeedX = particle.speedX;
        expect(repelledSpeedX).toBeGreaterThan(0);

        // Now remove mouse interaction
        particleSystem.mouse.x = null;
        particleSystem.mouse.y = null;

        // Update multiple times to simulate return to base speed
        // returnSpeed is 0.02, so it takes time
        for(let i=0; i<10; i++) {
            particle.update();
        }

        // Speed should be decreasing towards baseSpeed (0)
        expect(particle.speedX).toBeLessThan(repelledSpeedX);
        expect(particle.speedX).toBeGreaterThan(0);
    });
  });
});
