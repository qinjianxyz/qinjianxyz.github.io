/* ==========================================================================
   Particle System - Interactive Canvas Background
   ========================================================================== */

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    this.animationId = null;

    // Configuration
    this.config = {
      particleCount: this.isMobile() ? 40 : 80,
      particleColor: { r: 0, g: 255, b: 156 },
      lineColor: { r: 0, g: 255, b: 156 },
      maxDistance: 150,
      speed: 0.3,
      size: { min: 1, max: 2.5 },
      mouseRepelForce: 0.8,
      returnSpeed: 0.02
    };

    this.init();
  }

  isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent) ||
           window.innerWidth < 768;
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(new Particle(this));
    }
  }

  bindEvents() {
    // Resize handler with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.resize();
        this.createParticles();
      }, 250);
    });

    // Mouse tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });

    // Touch support
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    this.particles.forEach(particle => {
      particle.update();
      particle.draw();
    });

    // Draw connections
    this.drawConnections();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawConnections() {
    const { maxDistance, lineColor } = this.config;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.15;
          this.ctx.strokeStyle = `rgba(${lineColor.r}, ${lineColor.g}, ${lineColor.b}, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // Draw connections to mouse
    if (this.mouse.x !== null && this.mouse.y !== null) {
      this.particles.forEach(particle => {
        const dx = particle.x - this.mouse.x;
        const dy = particle.y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.mouse.radius) {
          const opacity = (1 - distance / this.mouse.radius) * 0.3;
          this.ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.stroke();
        }
      });
    }
  }

  start() {
    if (!this.animationId) {
      this.animate();
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

class Particle {
  constructor(system) {
    this.system = system;
    this.canvas = system.canvas;
    this.ctx = system.ctx;
    this.config = system.config;

    // Position
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;

    // Size
    this.size = Math.random() * (this.config.size.max - this.config.size.min) + this.config.size.min;

    // Velocity
    this.speedX = (Math.random() - 0.5) * this.config.speed * 2;
    this.speedY = (Math.random() - 0.5) * this.config.speed * 2;
    this.baseSpeedX = this.speedX;
    this.baseSpeedY = this.speedY;

    // Visual
    this.opacity = Math.random() * 0.5 + 0.3;
  }

  update() {
    const { mouse } = this.system;
    const { mouseRepelForce, returnSpeed } = this.config;

    // Mouse interaction - particles flee from cursor
    if (mouse.x !== null && mouse.y !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouse.radius) {
        const force = (mouse.radius - distance) / mouse.radius;
        const angle = Math.atan2(dy, dx);
        this.speedX += Math.cos(angle) * force * mouseRepelForce;
        this.speedY += Math.sin(angle) * force * mouseRepelForce;
      }
    }

    // Gradually return to base speed
    this.speedX += (this.baseSpeedX - this.speedX) * returnSpeed;
    this.speedY += (this.baseSpeedY - this.speedY) * returnSpeed;

    // Update position
    this.x += this.speedX;
    this.y += this.speedY;

    // Wrap around edges
    if (this.x < -10) this.x = this.canvas.width + 10;
    if (this.x > this.canvas.width + 10) this.x = -10;
    if (this.y < -10) this.y = this.canvas.height + 10;
    if (this.y > this.canvas.height + 10) this.y = -10;
  }

  draw() {
    const { particleColor } = this.config;

    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${this.opacity})`;
    this.ctx.fill();

    // Add glow effect for larger particles
    if (this.size > 2) {
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, 0.1)`;
      this.ctx.fill();
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    window.particleSystem = new ParticleSystem(canvas);
  }
});
