/* Progressive enhancement only: all content and navigation work without JS. */
(() => {
  // Old root-language links may carry a Chinese translation anchor. The
  // English default keeps that paragraph reachable at its original-text ID.
  if (document.documentElement.lang === 'en' && /^#t\d+$/.test(location.hash)) {
    const id = location.hash.slice(1).replace(/^t/, 'p');
    const paragraph = document.getElementById(id);
    if (paragraph) {
      history.replaceState(null, '', location.pathname + location.search + '#' + id);
      paragraph.scrollIntoView();
    }
  }
  // Keep the reading position when changing language; paragraph IDs distinguish
  // original English (p) from the Chinese reading translation (t).
  const languageLink = document.querySelector('.language-link');
  const updateLanguageLink = () => {
    if (!languageLink) return;
    const target = new URL(languageLink.href);
    const hash = location.hash;
    target.hash = /^#[pt]\d+$/.test(hash) && location.pathname.includes('/writing/')
      ? hash.replace(/^#[pt]/, document.documentElement.lang === 'zh-CN' ? '#p' : '#t')
      : hash;
    languageLink.href = target.href;
  };
  updateLanguageLink();
  window.addEventListener('hashchange', updateLanguageLink);
  const revealLinkedOriginal = () => {
    if (!/^#p\d+$/.test(location.hash)) return;
    const target = document.getElementById(location.hash.slice(1));
    const disclosure = target?.closest('details');
    if (disclosure && !disclosure.open) {
      disclosure.open = true;
      target.scrollIntoView();
    }
  };
  revealLinkedOriginal();
  window.addEventListener('hashchange', revealLinkedOriginal);
  const dialog = document.querySelector(".image-dialog");
  let trigger;
  if (dialog && typeof dialog.showModal === "function") {
    const image = dialog.querySelector("img");
    const caption = dialog.querySelector("p");
    const gallery = [...document.querySelectorAll("[data-image]")];
    if (gallery.length < 2) dialog.querySelector('.dialog-navigation').hidden = true;
    let position = 0;
    const count = dialog.querySelector(".image-count");
    const show = index => {
      position = (index + gallery.length) % gallery.length;
      const item = gallery[position];
      image.src = item.dataset.image;
      image.alt = item.querySelector("img")?.alt || "";
      caption.textContent = item.dataset.caption || "";
      count.textContent = `${position + 1} / ${gallery.length}`;
    };
    gallery.forEach((button, index) => {
      button.addEventListener("click", () => {
        trigger = button;
        show(index);
        dialog.showModal();
      });
    });
    dialog.querySelector(".image-previous").addEventListener("click", () => show(position - 1));
    dialog.querySelector(".image-next").addEventListener("click", () => show(position + 1));
    dialog.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") { event.preventDefault(); show(position - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); show(position + 1); }
    });
    dialog
      .querySelector(".dialog-close")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    });
    dialog.addEventListener("close", () => trigger?.focus());
  } else {
    document.querySelectorAll("[data-image]").forEach((button) =>
      button.addEventListener("click", () => {
        location.href = button.dataset.image;
      }),
    );
  }
  const menu = document.querySelector(".mobile-menu");
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
  menu?.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      menu.open = false;
    }),
  );
  document.addEventListener("click", (event) => {
    if (menu?.open && !menu.contains(event.target)) menu.open = false;
  });
  const copy = document.querySelector("[data-copy-link]");
  copy?.addEventListener("click", async () => {
    const status = document.querySelector(".copy-status");
    const zh = document.documentElement.lang === "zh-CN";
    const canonical = document.querySelector('link[rel="canonical"]').href;
    const url = location.origin === new URL(canonical).origin ? canonical : `${location.origin}${location.pathname}`;
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = zh ? "文章链接已复制。" : "Article link copied.";
    } catch {
      status.textContent =
        (zh ? "可以复制这个链接：" : "Copy this link: ") + url;
    }
  });
  const progress = document.querySelector(".reading-progress");
  const body = document.querySelector(".essay-body");
  if (progress && body) {
    let queued = false;
    const update = () => {
      const rect = body.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight * 0.5);
      const value = Math.min(100, Math.max(0, (-rect.top / distance) * 100));
      progress.style.setProperty("--progress", `${value}%`);
      const paragraphs = [...document.querySelectorAll('.essay-aside a[href^="#"]')]
        .map(a => document.getElementById(a.hash.slice(1)))
        .filter(p => p && p.getClientRects().length);
      let current = paragraphs[0]?.id;
      paragraphs.forEach((p) => {
        if (p.getBoundingClientRect().top < window.innerHeight * 0.35)
          current = p.id;
      });
      document.querySelectorAll('.essay-aside a[href^="#"]').forEach((a) => {
        if (a.hash === `#${current}`)
          a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
      queued = false;
    };
    const schedule = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
  }
})();
