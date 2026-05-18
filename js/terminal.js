/* ==========================================================================
   Ray Qin Terminal Engine
   ========================================================================== */

class Terminal {
  constructor(container) {
    this.container = container;
    this.outputEl = container.querySelector('.terminal-output');
    this.inputEl = container.querySelector('.terminal-input');
    this.hintsEl = container.querySelector('.command-hints');

    this.history = [];
    this.historyIndex = -1;
    this.isProcessing = false;

    this.commands = this.initCommands();
    this.secretsUnlocked = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.setupMobileHints();
    this.showWelcome();
    this.focusInput();
  }

  bindEvents() {
    // Input events
    this.inputEl.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Click anywhere to focus input
    this.container.addEventListener('click', (e) => {
      if (!e.target.closest('.photo-thumb') && !e.target.closest('.command-hint')) {
        this.focusInput();
      }
    });

    // Image viewer
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('photo-thumb')) {
        this.showImage(e.target.src);
      }
    });

    const viewer = document.getElementById('image-viewer');
    if (viewer) {
      viewer.addEventListener('click', () => this.hideImage());
    }
  }

  setupMobileHints() {
    const hints = ['help', 'ray --journey', 'ray --human', 'salmon --vision', 'contact'];
    hints.forEach(cmd => {
      const btn = document.createElement('button');
      btn.className = 'command-hint';
      btn.textContent = cmd;
      btn.addEventListener('click', () => {
        this.inputEl.value = cmd;
        this.executeCommand(cmd);
      });
      this.hintsEl.appendChild(btn);
    });
  }

  handleKeyDown(e) {
    if (this.isProcessing) {
      e.preventDefault();
      return;
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        const input = this.inputEl.value.trim();
        if (input) {
          this.history.push(input);
          this.historyIndex = this.history.length;
          this.executeCommand(input);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.inputEl.value = this.history[this.historyIndex];
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.inputEl.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = this.history.length;
          this.inputEl.value = '';
        }
        break;

      case 'Tab':
        e.preventDefault();
        this.tabComplete();
        break;

      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          this.clearOutput();
        }
        break;
    }
  }

  tabComplete() {
    const input = this.inputEl.value.toLowerCase();
    if (!input) return;

    const allCommands = Object.keys(this.commands);
    const matches = allCommands.filter(cmd =>
      cmd.startsWith(input) && !this.commands[cmd].hidden
    );

    if (matches.length === 1) {
      this.inputEl.value = matches[0];
    } else if (matches.length > 1) {
      this.printLine(`\nMatches: ${matches.join(', ')}`, 'system');
    }
  }

  async executeCommand(input) {
    this.isProcessing = true;
    this.inputEl.value = '';

    // Echo the command
    this.printPrompt(input);

    // Parse command and args
    const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1).map(a => a.replace(/"/g, ''));

    // Find and execute command
    const handler = this.commands[cmd];

    if (handler) {
      try {
        await handler.execute(args, this);
      } catch (err) {
        this.printLine(`Error: ${err.message}`, 'error');
      }
    } else {
      this.printLine(`Command not found: ${cmd}`, 'error');
      this.printLine(`Type 'help' for available commands.`, 'system');
    }

    this.isProcessing = false;
    this.focusInput();
    this.scrollToBottom();
  }

  // -------------------------------------------------------------------------
  // Output Methods
  // -------------------------------------------------------------------------

  printPrompt(input) {
    const line = document.createElement('div');
    line.className = 'output-line command';
    line.innerHTML = `<span class="prompt"><span class="prompt-user">ray@salmon</span><span class="prompt-separator">:</span><span class="prompt-path">~</span><span class="prompt-symbol">$</span></span> ${this.escapeHtml(input)}`;
    this.outputEl.appendChild(line);
  }

  printLine(text, className = 'response') {
    const line = document.createElement('div');
    line.className = `output-line ${className} fade-in`;
    line.innerHTML = text;
    this.outputEl.appendChild(line);
    this.scrollToBottom();
  }

  async printTyped(text, speed = 15) {
    const line = document.createElement('div');
    line.className = 'output-line response';
    this.outputEl.appendChild(line);

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        line.innerHTML += '<br>';
      }
      for (const char of lines[i]) {
        line.innerHTML += this.escapeHtml(char);
        this.scrollToBottom();
        await this.sleep(speed);
      }
    }
    return line;
  }

  async printBlock(text) {
    const line = document.createElement('div');
    line.className = 'output-line response fade-in';
    line.innerHTML = `<pre>${text}</pre>`;
    this.outputEl.appendChild(line);
    this.scrollToBottom();
  }

  printHTML(html) {
    const line = document.createElement('div');
    line.className = 'output-line response fade-in';
    line.innerHTML = html;
    this.outputEl.appendChild(line);
    this.scrollToBottom();
  }

  clearOutput() {
    this.outputEl.innerHTML = '';
  }

  // -------------------------------------------------------------------------
  // Image Handling
  // -------------------------------------------------------------------------

  showPhotos(photos) {
    const gallery = document.createElement('div');
    gallery.className = 'photo-gallery fade-in';
    photos.forEach(src => {
      const img = document.createElement('img');
      img.className = 'photo-thumb';
      img.src = src;
      img.alt = 'Photo';
      img.loading = 'lazy';
      gallery.appendChild(img);
    });
    this.outputEl.appendChild(gallery);
    this.scrollToBottom();
  }

  showImage(src) {
    const viewer = document.getElementById('image-viewer');
    const img = document.getElementById('viewer-image');
    img.src = src;
    viewer.classList.remove('hidden');
  }

  hideImage() {
    const viewer = document.getElementById('image-viewer');
    viewer.classList.add('hidden');
  }

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  focusInput() {
    this.inputEl.focus();
  }

  scrollToBottom() {
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  unlockSecrets() {
    this.secretsUnlocked = true;
  }

  // -------------------------------------------------------------------------
  // Welcome Message
  // -------------------------------------------------------------------------

  async showWelcome() {
    const ascii = `
<span class="highlight">
 ██████╗   █████╗  ██╗   ██╗     ██████╗  ██╗ ███╗   ██╗
 ██╔══██╗ ██╔══██╗ ╚██╗ ██╔╝    ██╔═══██╗ ██║ ████╗  ██║
 ██████╔╝ ███████║  ╚████╔╝     ██║   ██║ ██║ ██╔██╗ ██║
 ██╔══██╗ ██╔══██║   ╚██╔╝      ██║▄▄ ██║ ██║ ██║╚██╗██║
 ██║  ██║ ██║  ██║    ██║       ╚██████╔╝ ██║ ██║ ╚████║
 ╚═╝  ╚═╝ ╚═╝  ╚═╝    ╚═╝        ╚══▀▀═╝  ╚═╝ ╚═╝  ╚═══╝
</span>`;

    this.printHTML(`<pre class="ascii-art">${ascii}</pre>`);

    await this.sleep(300);

    this.printHTML(`
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  <span class="highlight">Senior Software Engineer</span> · <span class="highlight-secondary">AI Agent Engineer</span>
  Building <span class="highlight-tertiary">Enterprise OS</span> — autonomous operating systems for organizations

<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  Type <span class="highlight">'help'</span> to see available commands.
  Or just start exploring...

`);
  }

  // -------------------------------------------------------------------------
  // Command Definitions
  // -------------------------------------------------------------------------

  initCommands() {
    return {
      help: {
        description: 'Show available commands',
        execute: async (args, term) => {
          term.printHTML(`
<span class="highlight">Available Commands</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  <span class="highlight-secondary">ABOUT ME</span>
  <span class="dim">────────</span>
  <span class="highlight">whoami</span>              Quick introduction
  <span class="highlight">ray --journey</span>       My path from China to Silicon Valley
  <span class="highlight">ray --human</span>         The person behind the code
  <span class="highlight">ray --philosophy</span>    Quotes and principles I live by

  <span class="highlight-secondary">WORK & PROJECTS</span>
  <span class="dim">───────────────</span>
  <span class="highlight">ray --projects</span>      Technical projects I've built
  <span class="highlight">ray --skills</span>        Technologies I work with
  <span class="highlight">resume</span>              Download my resume

  <span class="highlight-secondary">SALMON</span>
  <span class="dim">──────</span>
  <span class="highlight">salmon --vision</span>     What I'm building and why
  <span class="highlight">salmon --status</span>     Current progress

  <span class="highlight-secondary">CONNECT</span>
  <span class="dim">───────</span>
  <span class="highlight">contact</span>             Ways to reach me
  <span class="highlight">social</span>              Social links

  <span class="highlight-secondary">UTILITIES</span>
  <span class="dim">─────────</span>
  <span class="highlight">clear</span>               Clear the terminal
  <span class="highlight">help</span>                Show this message

<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
  <span class="dim">Hint: There are secrets hidden for the curious...</span>
`);
        }
      },

      whoami: {
        description: 'Quick intro',
        execute: async (args, term) => {
          term.printHTML(`
  <span class="highlight">Ray Qin</span>
  <span class="dim">───────</span>
  Senior Software Engineer @ ZipRecruiter
  AI Engineer building Enterprise OS and Anvil Sim

  <span class="dim">"The coolest engineer you'll meet."</span>

  Type <span class="highlight">'ray --journey'</span> to learn my story.
`);
        }
      },

      ray: {
        description: 'Learn about Ray',
        execute: async (args, term) => {
          const flag = args[0];

          switch(flag) {
            case '--journey':
              term.printHTML(`
<span class="highlight">THE JOURNEY</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  <span class="highlight-tertiary">🇨🇳 CHAPTER 1: Origins</span> <span class="dim">(China)</span>
  <span class="dim">─────────────────────────</span>
  Born in China, raised with the mindset that
  impossible is just a word lazy people use.

  <span class="highlight-tertiary">🎓 CHAPTER 2: The Leap</span> <span class="dim">(San Domenico School)</span>
  <span class="dim">─────────────────────────────────────────────</span>
  At 15, moved alone to California for boarding school.
  Learned that discomfort is where growth happens.
  Won the <span class="highlight">Veritas Award</span> — highest honor for a senior.

  <span class="highlight-tertiary">🔬 CHAPTER 3: Engineering</span> <span class="dim">(UC San Diego)</span>
  <span class="dim">───────────────────────────────────────────</span>
  Double majored: <span class="highlight-secondary">Computer Science</span> + <span class="highlight-secondary">Mechanical Engineering</span>
  Because why choose when you can do both?
  Graduated <span class="highlight">Cum Laude</span> with 3.9 GPA.

  <span class="highlight-tertiary">💼 CHAPTER 4: Industry</span> <span class="dim">(ZipRecruiter)</span>
  <span class="dim">──────────────────────────────────────────</span>
  AI Labs Working Group · Full Stack Development
  Recommendation Systems · API Design · Web Security
  Hosted company-wide Cursor workshop & AI Research Meetings.

  <span class="highlight-tertiary">🚀 CHAPTER 5: Now</span> <span class="dim">(Building Enterprise OS and Anvil Sim)</span>
  <span class="dim">────────────────────────────────────────</span>
  Building Enterprise OS to scale organizational execution with AI agents.
  Building Anvil Sim to make serious engineering simulation more AI-native and accessible.

<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
  <span class="dim">"The best time to plant a tree was 20 years ago.</span>
  <span class="dim"> The second best time is now."</span>
`);
              break;

            case '--human':
              term.printHTML(`
<span class="highlight">THE HUMAN SIDE</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  <span class="highlight-tertiary">🏃 MARATHON RUNNER</span>
  <span class="dim">──────────────────</span>
  I don't just run. I chase impossible goals.
  <span class="dim">"The wall exists to show us how bad we want it."</span>

  <span class="highlight-tertiary">🏀 BASKETBALL</span>
  <span class="dim">─────────────</span>
  Varsity Track MVP. BCL Basketball Champion.
  Sports taught me: individual skill wins games,
  but teamwork wins championships.

  <span class="highlight-tertiary">💪 FITNESS PHILOSOPHY</span>
  <span class="dim">────────────────────</span>
  The body is the hardware that runs the mind.
  Managed fitness groups with 60+ people.
  Helped 100+ people achieve their goals.

  <span class="highlight-tertiary">📚 CONTINUOUS LEARNER</span>
  <span class="dim">────────────────────</span>
  <span class="dim">"Learning is like rowing upstream:</span>
  <span class="dim"> not to advance is to drop back."</span>

`);
              term.showPhotos([
                'media/profile-2025.jpg',
                'media/carol/1.jpg',
                'media/carol/3.jpg',
                'media/carol/2.jpg'
              ]);
              break;

            case '--philosophy':
              term.printHTML(`
<span class="highlight">PRINCIPLES I LIVE BY</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  <span class="highlight-secondary">"The best time to plant a tree was 20 years ago.</span>
  <span class="highlight-secondary"> The second best time is now."</span>

  <span class="highlight-secondary">"If you want to go fast, go alone.</span>
  <span class="highlight-secondary"> If you want to go far, GO TOGETHER."</span>

  <span class="highlight-secondary">"In a gentle way, you can shake the world."</span>

  <span class="highlight-secondary">"Tell me and I forget.</span>
  <span class="highlight-secondary"> Teach me and I remember.</span>
  <span class="highlight-secondary"> Involve me and I learn."</span>

  <span class="highlight-secondary">"Learning is like rowing upstream:</span>
  <span class="highlight-secondary"> not to advance is to drop back."</span>

  <span class="highlight-secondary">"The market for shortcuts is infinite."</span>

<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
  These aren't just words. They're code I live by.
`);
              break;

            case '--projects':
              term.printHTML(`
<span class="highlight">PROJECT ARCHIVE</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  <span class="highlight-tertiary">🚗 AUTONOMOUS NAVIGATION SYSTEM</span>
  <span class="dim">───────────────────────────────</span>
  Built a 1/8 scale self-driving car.
  Stack: <span class="highlight-secondary">TensorFlow, ROS2, YOLOv5, NVIDIA Jetson</span>
  90%+ success rate on complex tracks.
  <span class="dim">→ github.com/qinjianxyz/ros2_ws</span>

  <span class="highlight-tertiary">⚡ SQLightning</span>
  <span class="dim">─────────────</span>
  A relational database from scratch in C++.
  83% performance improvement with LRU cache.
  Custom tokenizer, typed-stream encoder.
  <span class="dim">→ github.com/qinjianxyz/SQLightning</span>

  <span class="highlight-tertiary">☁️ Cloud Drive & Analytics</span>
  <span class="dim">─────────────────────────</span>
  Full-stack app: <span class="highlight-secondary">React + Firebase + Node.js</span>
  <span class="dim">→ drive-xyz.netlify.app</span>

  <span class="highlight-tertiary">🦁 Zoo Seeker</span>
  <span class="dim">────────────</span>
  Android path-finding app for San Diego Zoo.
  Dijkstra algorithm + Google Maps API.
  Team of 6, Agile methodology.

<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
  <span class="dim">Full portfolio: github.com/qinjianxyz</span>
`);
              break;

            case '--skills':
              term.printHTML(`
<span class="highlight">TECHNICAL SKILLS</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  <span class="highlight-secondary">Languages</span>
`);
              term.printHTML('<div class="skills-grid">' +
                ['Golang', 'Python', 'TypeScript', 'JavaScript', 'C/C++', 'Rust', 'SQL', 'Bash'].map(s =>
                  `<div class="skill-item">${s}</div>`
                ).join('') + '</div>');

              term.printHTML(`
  <span class="highlight-secondary">AI & ML</span>
`);
              term.printHTML('<div class="skills-grid">' +
                ['LLM', 'Claude', 'MCP', 'Cursor', 'Agents', 'RAG', 'Embeddings'].map(s =>
                  `<div class="skill-item">${s}</div>`
                ).join('') + '</div>');

              term.printHTML(`
  <span class="highlight-secondary">Infrastructure</span>
`);
              term.printHTML('<div class="skills-grid">' +
                ['AWS', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Kafka', 'Redis'].map(s =>
                  `<div class="skill-item">${s}</div>`
                ).join('') + '</div>');

              term.printHTML(`
  <span class="highlight-secondary">Web & Data</span>
`);
              term.printHTML('<div class="skills-grid">' +
                ['React', 'Next.js', 'Node', 'gRPC', 'PostgreSQL', 'MongoDB', 'Spark'].map(s =>
                  `<div class="skill-item">${s}</div>`
                ).join('') + '</div>');
              break;

            default:
              term.printHTML(`
  <span class="highlight">Usage:</span> ray [flag]

  <span class="highlight-secondary">Flags:</span>
    --journey      My path from China to Silicon Valley
    --human        The person behind the code
    --projects     Technical projects I've built
    --skills       Technologies I work with
    --philosophy   Quotes and principles I live by
`);
          }
        }
      },

      salmon: {
        description: 'Learn about Salmon',
        execute: async (args, term) => {
          const flag = args[0];

          switch(flag) {
            case '--vision':
              term.printHTML(`
<span class="highlight">🐟 SALMON: THE VISION</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  <span class="highlight-tertiary">THE PROBLEM</span>
  <span class="dim">───────────</span>
  Organizations hit execution limits long before they
  run out of ideas. Infrastructure drifts, context gets
  lost, and software delivery does not scale cleanly.

  <span class="highlight-tertiary">THE INSIGHT</span>
  <span class="dim">───────────</span>
  AI agents can do more than assist.
  They can <span class="highlight">operate</span> inside machine-enforced process,
  persistent memory, and bounded execution loops.

  <span class="highlight-tertiary">THE SOLUTION</span>
  <span class="dim">────────────</span>
  Salmon is the early expression of <span class="highlight-secondary">Enterprise OS</span>.
  An autonomous operating system for organizations.
  Not a chatbot. Not a copilot.
  A system that helps run infrastructure, ship software,
  and scale execution with AI agents.

  <span class="highlight-tertiary">WHY THIS WORK</span>
  <span class="dim">────────────</span>
  The goal is software with real leverage:
  systems that make execution more reliable,
  more autonomous, and more compounding.

  <span class="highlight-tertiary">THE MISSION</span>
  <span class="dim">───────────</span>
  Scale intelligence without linearly scaling headcount.
  Build tools that turn AI capability into reliable output.

<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
  <span class="dim">Interested? Type 'contact' to connect.</span>
`);
              break;

            case '--status':
              term.printHTML(`
  <span class="highlight-tertiary">🔧 Status:</span> Building in stealth mode
  <span class="highlight-tertiary">📍 Stage:</span> Deep development
  <span class="highlight-tertiary">🎯 Focus:</span> Core agent architecture

  Want updates? Type <span class="highlight">'contact'</span> to subscribe.
`);
              break;

            case '--secret':
              if (term.secretsUnlocked) {
                term.printHTML(`
<span class="highlight">THE REAL STORY BEHIND SALMON</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  You found the secret.

  Salmon was born from frustration.
  I watched capable teams lose speed because
  operations, context, and execution kept breaking.

  I'm building the tool I wish existed:
  a system that turns AI capability into reliable,
  repeatable execution instead of scattered demos.

  If you found this, you're my kind of person.
  Let's talk.

<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
`);
              } else {
                term.printLine('Access denied. This command is locked.', 'error');
                term.printLine('Hint: There are ways to unlock secrets...', 'system');
              }
              break;

            default:
              term.printHTML(`
  <span class="highlight">Usage:</span> salmon [flag]

  <span class="highlight-secondary">Flags:</span>
    --vision     What I'm building and why
    --status     Current progress
`);
          }
        }
      },

      contact: {
        description: 'Contact info',
        execute: async (args, term) => {
          term.printHTML(`
<span class="highlight">LET'S CONNECT</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  <span class="highlight-tertiary">📧 Email:</span>      qinjianxyz@gmail.com
  <span class="highlight-tertiary">💼 LinkedIn:</span>   <a href="https://linkedin.com/in/qinjianxyz" target="_blank" style="color: var(--term-secondary)">linkedin.com/in/qinjianxyz</a>
  <span class="highlight-tertiary">🐙 GitHub:</span>     <a href="https://github.com/qinjianxyz" target="_blank" style="color: var(--term-secondary)">github.com/qinjianxyz</a>
  <span class="highlight-tertiary">📄 Resume:</span>     type <span class="highlight">'resume'</span> to download

<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
  I respond to every message.
  Let's build something together.
`);
        }
      },

      social: {
        description: 'Social links',
        execute: async (args, term) => {
          term.printHTML(`
  <span class="highlight-tertiary">LinkedIn:</span>  <a href="https://linkedin.com/in/qinjianxyz" target="_blank" style="color: var(--term-secondary)">linkedin.com/in/qinjianxyz</a>
  <span class="highlight-tertiary">GitHub:</span>    <a href="https://github.com/qinjianxyz" target="_blank" style="color: var(--term-secondary)">github.com/qinjianxyz</a>
`);
        }
      },

      resume: {
        description: 'Download resume',
        execute: async (args, term) => {
          term.printLine('Opening resume...', 'system');
          window.open('media/Ray_Resume.pdf', '_blank');
          term.printLine('Resume opened in new tab.', 'success');
        }
      },

      clear: {
        description: 'Clear terminal',
        execute: (args, term) => {
          term.clearOutput();
        }
      },

      // -----------------------------------------------------------------------
      // Easter Egg Commands (hidden)
      // -----------------------------------------------------------------------

      sudo: {
        hidden: true,
        execute: async (args, term) => {
          term.printHTML(`
  <span class="error">Nice try! But you're not root here.</span>

  ...although if you know about sudo,
  we should probably talk.

  Type <span class="highlight">'contact'</span> to reach me.
`);
        }
      },

      'ls': {
        hidden: true,
        execute: async (args, term) => {
          if (args[0] === '-la' || args[0] === '-al') {
            term.printHTML(`
<span class="dim">drwxr-xr-x  ray  wheel  4096  Jan 29 16:00  .</span>
<span class="dim">drwxr-xr-x  ray  wheel  4096  Jan 29 16:00  ..</span>
<span class="dim">-rw-r--r--  ray  wheel   420  Jan 29 16:00  </span><span class="highlight">.secrets</span>
<span class="dim">-rw-r--r--  ray  wheel  1337  Jan 29 16:00  ambition.txt</span>
<span class="dim">-rwxr-xr-x  ray  wheel  9001  Jan 29 16:00  </span><span class="highlight-tertiary">build-the-future*</span>
<span class="dim">drwxr-xr-x  ray  wheel  4096  Jan 29 16:00  salmon/</span>
<span class="dim">drwxr-xr-x  ray  wheel  4096  Jan 29 16:00  dreams/</span>

  Looks like you know your way around a terminal.
  Try <span class="highlight">'cat .secrets'</span> for something special.
`);
          } else {
            term.printLine('ambition.txt  build-the-future  salmon/  dreams/', 'response');
          }
        }
      },

      cat: {
        hidden: true,
        execute: async (args, term) => {
          if (args[0] === '.secrets') {
            term.printHTML(`
<span class="highlight">SECRETS UNLOCKED</span>
<span class="dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>

  You're clearly not a casual visitor.
  You dig, you explore, you test boundaries.

  That's exactly the kind of person I want
  on my team.

  Enterprise OS is the direction.
  If that excites you...

  <span class="highlight-tertiary">📧 Reach out:</span> qinjianxyz@gmail.com
  <span class="highlight-tertiary">Subject line:</span> "I found .secrets"

  I'll know you're one of us.
`);
          } else {
            term.printLine(`cat: ${args[0] || ''}: No such file`, 'error');
          }
        }
      },

      matrix: {
        hidden: true,
        execute: async (args, term) => {
          if (term.secretsUnlocked || true) { // Always allow for fun
            term.printLine('The Matrix has you...', 'success');
            if (window.startMatrix) {
              window.startMatrix(8000);
            }
          } else {
            term.printLine('Command locked. Find the secrets first.', 'error');
          }
        }
      },

      hack: {
        hidden: true,
        execute: async (args, term) => {
          const sequence = [
            'Initializing exploit framework...',
            'Scanning network topology...',
            'Bypassing firewall... [OK]',
            'Injecting payload...',
            'Establishing reverse shell...',
            'Access granted.',
            '',
            '...just kidding. But you found a secret! 🎉',
            "Type 'help' to see what else you can explore."
          ];

          for (const line of sequence) {
            term.printLine(line, line.includes('[OK]') || line.includes('granted') ? 'success' : 'response');
            await term.sleep(400);
          }
        }
      },

      coffee: {
        hidden: true,
        execute: async (args, term) => {
          term.printHTML(`
<pre class="highlight">
       ) (
      ( ) )
        ) ( (
      _______)_
   .-'---------|
  ( C|/\\/\\/\\/\\/|
   '-./\\/\\/\\/\\/|
     '_________'
      '-------'
</pre>
  Here's some virtual coffee! ☕
  Fuel for late night coding sessions.
`);
        }
      },

      'rm': {
        hidden: true,
        execute: async (args, term) => {
          if (args.join(' ').includes('-rf')) {
            term.printLine('Deleting everything...', 'error');
            await term.sleep(1500);
            term.printLine('Just kidding. This is a static website. 😄', 'success');
            term.printLine("But I appreciate a developer who tests edge cases.", 'system');
          } else {
            term.printLine('rm: missing operand', 'error');
          }
        }
      },

      pwd: {
        hidden: true,
        execute: async (args, term) => {
          term.printLine('/home/ray/the-future', 'response');
        }
      },

      echo: {
        hidden: true,
        execute: async (args, term) => {
          term.printLine(args.join(' ') || '', 'response');
        }
      },

      exit: {
        hidden: true,
        execute: async (args, term) => {
          term.printLine('There is no escape. You are trapped in the terminal.', 'system');
          term.printLine('(Just kidding, close the tab if you must.)', 'dim');
        }
      },

      vim: {
        hidden: true,
        execute: async (args, term) => {
          term.printLine('I see you are a person of culture.', 'success');
          term.printLine('But this terminal does not support vim.', 'system');
          term.printLine('...yet. 😏', 'dim');
        }
      },

      emacs: {
        hidden: true,
        execute: async (args, term) => {
          term.printLine('Emacs? In this economy?', 'response');
          term.printLine('Just kidding. All text editors are valid.', 'system');
          term.printLine('(But vim is better.)', 'dim');
        }
      },

      ping: {
        hidden: true,
        execute: async (args, term) => {
          const target = args[0] || 'the-void';
          for (let i = 0; i < 4; i++) {
            term.printLine(`PING ${target}: seq=${i} time=${Math.floor(Math.random() * 50 + 10)}ms`, 'response');
            await term.sleep(500);
          }
          term.printLine('', 'response');
          term.printLine('Connection to your dreams: stable ✓', 'success');
        }
      },

      neofetch: {
        hidden: true,
        execute: async (args, term) => {
          term.printHTML(`
<span class="highlight">
       .---.        </span><span class="highlight-secondary">ray@salmon</span>
<span class="highlight">      /     \\       </span><span class="dim">-----------</span>
<span class="highlight">      \\.@-@./       </span><span class="highlight-tertiary">OS:</span> Human 1.0 (Ambitious Build)
<span class="highlight">      /\`\\_/\`\\       </span><span class="highlight-tertiary">Host:</span> Earth, California
<span class="highlight">     //  _  \\\\      </span><span class="highlight-tertiary">Uptime:</span> ${new Date().getFullYear() - 1998} years
<span class="highlight">    | \\     )|_     </span><span class="highlight-tertiary">Shell:</span> bash (but zsh at home)
<span class="highlight">   /\`\\_\`>  <_/ \\    </span><span class="highlight-tertiary">Terminal:</span> qinjianxyz.github.io
<span class="highlight">   \\__/'---'\\__/    </span><span class="highlight-tertiary">CPU:</span> Caffeinated Mind @ 3.9GHz
<span class="highlight">                    </span><span class="highlight-tertiary">Memory:</span> Mostly song lyrics
`);
        }
      }
    };
  }
}

// Initialize terminal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('terminal') || document.getElementById('terminal-container');
  const terminal = new Terminal(container);
  container.terminal = terminal;
});
