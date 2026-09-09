(() => {
  window.rayLanguage = () => "bilingual";
  window.rayPair = (tag, en, zh, cls) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    for (const [lang, text, name] of [
      ["zh-CN", zh, "copy-zh"],
      ["en", en, "copy-en"],
    ]) {
      const span = document.createElement("span");
      span.lang = lang;
      span.className = name;
      span.textContent = text;
      node.append(span);
    }
    return node;
  };
  const tablist = document.querySelector(".field-tabs");
  const tabs = [...document.querySelectorAll("[data-field-button]")];
  const panels = [...document.querySelectorAll("[data-field]")];
  function activateField(id) {
    if (!panels.some((panel) => panel.dataset.field === id))
      id = panels[0]?.dataset.field;
    for (const panel of panels) panel.hidden = panel.dataset.field !== id;
    for (const tab of tabs) {
      const selected = tab.dataset.fieldButton === id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
  }
  function revealProject() {
    const url = new URL(location.href);
    let hash = "";
    try {
      hash = decodeURIComponent(url.hash.slice(1));
    } catch {
      /* An invalid hash does not disable the page. */
    }
    const id = url.searchParams.get("project") || hash;
    const target = document.getElementById(id === "blockchain" ? "token" : id);
    const field =
      target?.closest("[data-field]")?.dataset.field ||
      url.searchParams.get("field");
    activateField(field);
    if (target?.tagName === "DETAILS") {
      target.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    }
  }
  if (tablist && tabs.length && panels.length) {
    tablist.setAttribute("role", "tablist");
    for (const panel of panels) {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", "tab-" + panel.dataset.field);
      panel.tabIndex = 0;
    }
    for (const tab of tabs) {
      tab.setAttribute("role", "tab");
      tab.addEventListener("click", () => {
        activateField(tab.dataset.fieldButton);
        const url = new URL(location.href);
        url.searchParams.set("field", tab.dataset.fieldButton);
        url.searchParams.delete("project");
        url.hash = "";
        history.pushState(null, "", url);
      });
      tab.addEventListener("keydown", (event) => {
        const index = tabs.indexOf(tab);
        const next = {
          ArrowRight: (index + 1) % tabs.length,
          ArrowLeft: (index + tabs.length - 1) % tabs.length,
          Home: 0,
          End: tabs.length - 1,
        }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        tabs[next].focus();
        tabs[next].click();
      });
    }
    tablist.hidden = false;
  }
  window.addEventListener("hashchange", revealProject);
  window.addEventListener("popstate", revealProject);
  revealProject();
  document
    .querySelector("#print-poster")
    ?.addEventListener("click", () => window.print());
})();
