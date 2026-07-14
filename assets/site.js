(function () {
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    var closeNavigation = function (returnFocus) {
      links.classList.remove('open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeNavigation(false);
      });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && links.classList.contains('open')) {
        closeNavigation(true);
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && links.classList.contains('open')) closeNavigation(false);
    });
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
        encodeURIComponent('Project for Ray: ' + read('cf-name')) + '&body=' + encodeURIComponent(body);
      if (note) note.textContent = 'Opening your email app. If nothing happens, write qinjianxyz@gmail.com.';
    });
  }
})();
