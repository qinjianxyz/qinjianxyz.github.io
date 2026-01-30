/* ==========================================================================
   Easter Eggs - Konami Code, Matrix Rain, Console Art
   ========================================================================== */

// -------------------------------------------------------------------------
// Konami Code Detector
// -------------------------------------------------------------------------
class KonamiCode {
  constructor(callback) {
    this.sequence = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];
    this.position = 0;
    this.callback = callback;
    this.timeout = null;

    document.addEventListener('keydown', (e) => this.check(e));
  }

  check(e) {
    // Reset if too slow
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.position = 0;
    }, 2000);

    const key = e.key;
    const expectedKey = this.sequence[this.position];

    if (key === expectedKey) {
      this.position++;
      if (this.position === this.sequence.length) {
        this.callback();
        this.position = 0;
      }
    } else {
      this.position = 0;
    }
  }
}

// -------------------------------------------------------------------------
// Matrix Rain Effect
// -------------------------------------------------------------------------
class MatrixRain {
  constructor() {
    this.canvas = document.getElementById('matrix-canvas');
    if (!this.canvas) {
      this.createCanvas();
    }
    this.ctx = this.canvas.getContext('2d');
    this.columns = [];
    this.animationId = null;
    this.chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'matrix-canvas';
    document.body.appendChild(this.canvas);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    const fontSize = 14;
    const columnCount = Math.floor(this.canvas.width / fontSize);

    this.columns = [];
    for (let i = 0; i < columnCount; i++) {
      this.columns.push({
        x: i * fontSize,
        y: Math.random() * this.canvas.height,
        speed: Math.random() * 20 + 10,
        fontSize: fontSize
      });
    }
  }

  draw() {
    // Fade effect
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = '14px monospace';

    this.columns.forEach(column => {
      // Random character
      const char = this.chars[Math.floor(Math.random() * this.chars.length)];

      // Gradient color from bright to dim
      const brightness = Math.random();
      if (brightness > 0.98) {
        this.ctx.fillStyle = '#fff';
      } else if (brightness > 0.9) {
        this.ctx.fillStyle = '#00ff9c';
      } else {
        this.ctx.fillStyle = `rgba(0, 255, 156, ${0.3 + brightness * 0.5})`;
      }

      this.ctx.fillText(char, column.x, column.y);

      // Move column down
      column.y += column.speed;

      // Reset when off screen
      if (column.y > this.canvas.height && Math.random() > 0.95) {
        column.y = 0;
      }
    });

    this.animationId = requestAnimationFrame(() => this.draw());
  }

  start(duration = 5000) {
    this.canvas.classList.add('active');
    this.draw();

    setTimeout(() => {
      this.stop();
    }, duration);
  }

  stop() {
    this.canvas.classList.remove('active');
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// -------------------------------------------------------------------------
// Console Art
// -------------------------------------------------------------------------
function showConsoleArt() {
  const art = `
%c
 ██████╗   █████╗  ██╗   ██╗     ██████╗  ██╗ ███╗   ██╗
 ██╔══██╗ ██╔══██╗ ╚██╗ ██╔╝    ██╔═══██╗ ██║ ████╗  ██║
 ██████╔╝ ███████║  ╚████╔╝     ██║   ██║ ██║ ██╔██╗ ██║
 ██╔══██╗ ██╔══██║   ╚██╔╝      ██║▄▄ ██║ ██║ ██║╚██╗██║
 ██║  ██║ ██║  ██║    ██║       ╚██████╔╝ ██║ ██║ ╚████║
 ╚═╝  ╚═╝ ╚═╝  ╚═╝    ╚═╝        ╚══▀▀═╝  ╚═╝ ╚═╝  ╚═══╝

 You opened the dev tools? I like you already.

 If you're poking around in here, you're probably:
 a) A developer curious how this site works
 b) Looking for secrets (there are some!)
 c) Checking for vulnerabilities (it's just static HTML)

 Try these in the terminal:
 → ls -la
 → cat .secrets
 → neofetch
 → And the Konami code... ↑↑↓↓←→←→BA

 Want to build something together?
 → github.com/qinjianxyz
 → linkedin.com/in/qinjianxyz
 → qinjianxyz@gmail.com

`;

  console.log(art, 'color: #00ff9c; font-family: monospace; font-size: 12px;');

  console.log(
    '%c🐟 Building Salmon - intelligence scaling for one-person startups',
    'color: #ff6b35; font-size: 14px; font-weight: bold;'
  );
}

// -------------------------------------------------------------------------
// Initialize
// -------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Matrix Rain
  const matrixRain = new MatrixRain();
  window.startMatrix = (duration) => matrixRain.start(duration);

  // Initialize Konami Code
  new KonamiCode(() => {
    // Show celebration
    if (window.terminal) {
      window.terminal.printHTML(`
<span class="highlight">
██╗   ██╗ ██████╗ ██╗   ██╗    ███████╗ ██████╗ ██╗   ██╗███╗   ██╗██████╗
╚██╗ ██╔╝██╔═══██╗██║   ██║    ██╔════╝██╔═══██╗██║   ██║████╗  ██║██╔══██╗
 ╚████╔╝ ██║   ██║██║   ██║    █████╗  ██║   ██║██║   ██║██╔██╗ ██║██║  ██║
  ╚██╔╝  ██║   ██║██║   ██║    ██╔══╝  ██║   ██║██║   ██║██║╚██╗██║██║  ██║
   ██║   ╚██████╔╝╚██████╔╝    ██║     ╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝
   ╚═╝    ╚═════╝  ╚═════╝     ╚═╝      ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝
</span>
                      <span class="highlight-tertiary">THE SECRET SECTION</span>

  You found it. Welcome to the inner circle.

  <span class="highlight-secondary">Secret commands unlocked:</span>
    <span class="highlight">matrix</span>           Watch the matrix rain
    <span class="highlight">hack</span>             Simulate a "hacking" sequence
    <span class="highlight">coffee</span>           A caffeinated surprise
    <span class="highlight">neofetch</span>         System information
    <span class="highlight">salmon --secret</span>  The real story behind the name

`);
      window.terminal.unlockSecrets();
      window.terminal.scrollToBottom();
    }

    // Trigger matrix rain
    matrixRain.start(5000);
  });

  // Show console art
  showConsoleArt();

  // Easter egg: detect devtools
  let devtoolsOpen = false;
  const threshold = 160;

  setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
      devtoolsOpen = true;
      console.clear();
      showConsoleArt();
    } else if (!widthThreshold && !heightThreshold) {
      devtoolsOpen = false;
    }
  }, 1000);
});
