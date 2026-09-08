(() => {
  const dialog = document.querySelector(".photo-dialog");
  if (!dialog) return;
  const img = dialog.querySelector("img"),
    caption = dialog.querySelector("p");
  let trigger;
  document.querySelectorAll("[data-full]").forEach((button) =>
    button.addEventListener("click", () => {
      trigger = button;
      img.src = button.dataset.full;
      img.alt = button.querySelector("img").alt;
      caption.textContent =
        button.dataset.captionZh + " / " + button.dataset.captionEn;
      dialog.showModal();
    }),
  );
  dialog.querySelector(".photo-close").onclick = () => dialog.close();
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }
  });
  dialog.addEventListener("close", () => trigger?.focus());
})();
