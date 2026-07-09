(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation');
      });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation');
        toggle.focus();
      }
    });
  }

  var triageData = {
    workflow: {
      blocker: 'The work is manual, fragmented, or impossible to inspect.',
      artifact: 'A workflow map and one working vertical slice.',
      foot: 'No AI requirement. No preferred tool. Start with the bottleneck.'
    },
    product: {
      blocker: 'Users are hitting friction, but the team is arguing from symptoms.',
      artifact: 'A measured problem definition and the smallest shippable change.',
      foot: 'Observe behavior, isolate the constraint, ship, and measure again.'
    },
    decision: {
      blocker: 'A costly commitment depends on an untested technical claim.',
      artifact: 'An evidence map, risk register, and reversible next decision.',
      foot: 'Unknowns stay visible. Confidence must point back to evidence.'
    },
    physical: {
      blocker: 'Software assumptions have not met geometry, hardware, or operators.',
      artifact: 'A staged experiment with instruments, limits, and acceptance cases.',
      foot: 'The physical world gets a vote. Test the smallest dangerous assumption first.'
    }
  };
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.triage-tab'));
  var blocker = document.getElementById('triageBlocker');
  var artifact = document.getElementById('triageArtifact');
  var foot = document.getElementById('triageFoot');
  var activateTab = function (tab) {
    var item = triageData[tab.getAttribute('data-problem')];
    if (!item) return;
    tabs.forEach(function (other) {
      var active = other === tab;
      other.classList.toggle('active', active);
      other.setAttribute('aria-pressed', active ? 'true' : 'false');
      other.setAttribute('tabindex', active ? '0' : '-1');
    });
    if (blocker) blocker.textContent = item.blocker;
    if (artifact) artifact.textContent = item.artifact;
    if (foot) foot.textContent = item.foot;
  };
  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { activateTab(tab); });
    tab.addEventListener('keydown', function (event) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      var next = index;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      activateTab(tabs[next]);
      tabs[next].focus();
    });
  });

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(function (element) { observer.observe(element); });
  } else {
    reveals.forEach(function (element) { element.classList.add('on'); });
  }

  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var read = function (id) { return ((document.getElementById(id) || {}).value || '').trim(); };
      var required = ['cf-name', 'cf-email', 'cf-msg'];
      var missing = required.find(function (id) { return !read(id); });
      var note = document.getElementById('formNote');
      if (missing) {
        if (note) note.textContent = 'Add your name, email, and a short project description.';
        document.getElementById(missing).focus();
        return;
      }
      var body = [
        'Name: ' + read('cf-name'),
        'Email: ' + read('cf-email'),
        'Organization: ' + read('cf-org'),
        'Project type: ' + read('cf-which'),
        'Budget / timing: ' + read('cf-budget'),
        '',
        read('cf-msg')
      ].join('\r\n');
      window.location.href = 'mailto:qinjianxyz@gmail.com?subject=' +
        encodeURIComponent('Problem for Ray — ' + read('cf-name')) + '&body=' + encodeURIComponent(body);
      if (note) note.textContent = 'Opening your email app. If nothing happens, write qinjianxyz@gmail.com.';
    });
  }
})();
