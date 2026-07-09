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
        'Budget / engagement: ' + read('cf-budget'),
        '',
        read('cf-msg')
      ].join('\r\n');
      window.location.href = 'mailto:qinjianxyz@gmail.com?subject=' +
        encodeURIComponent('Project for Ray — ' + read('cf-name')) + '&body=' + encodeURIComponent(body);
      if (note) note.textContent = 'Opening your email app. If nothing happens, write qinjianxyz@gmail.com.';
    });
  }
})();
