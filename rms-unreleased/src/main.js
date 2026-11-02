import { setupJourney } from "./journey/journey.js";
import { setupCard } from "./card/card.js";
import { setupWaitlist } from "./waitlist/waitlist.js";
const waitlist = setupWaitlist(setupCard(), {
  onReserved: () => journey.complete(),
  onReset: () => journey.edit(),
});
const journey = setupJourney(waitlist.start);
document.getElementById("back-to-top").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
const privacy = document.querySelector("#privacy-dialog");
for (const id of ["privacy-open", "privacy-footer"])
  document
    .getElementById(id)
    .addEventListener("click", () => privacy.showModal());
for (const selector of [".dialog-close", ".dialog-done"])
  privacy
    .querySelector(selector)
    .addEventListener("click", () => privacy.close());
privacy.addEventListener("click", (event) => {
  if (event.target === privacy) {
    const r = privacy.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      privacy.close();
  }
});
