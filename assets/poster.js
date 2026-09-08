const format = new URLSearchParams(location.search).get("format");
if (["portrait", "square"].includes(format)) {
  document.querySelector("#poster").classList.add(format);
  document.querySelector("#poster-png").href =
    "/media/education/bootcamp-poster-" + format + ".png";
  document.querySelector("#poster-pdf").href =
    "/media/education/bootcamp-poster-" + format + ".pdf";
}
