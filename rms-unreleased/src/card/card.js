export function setupCard() {
  const card = document.querySelector("#membership-card");
  const stage = document.querySelector("#card-stage");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  stage.addEventListener("pointermove", (event) => {
    if (
      event.pointerType !== "mouse" ||
      reducedMotion.matches ||
      card.classList.contains("flipped")
    )
      return;
    const bounds = stage.getBoundingClientRect();
    card.style.setProperty(
      "--ry",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 30}deg`,
    );
    card.style.setProperty(
      "--rx",
      `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 22}deg`,
    );
  });
  stage.addEventListener("pointerleave", () => {
    card.style.removeProperty("--rx");
    card.style.removeProperty("--ry");
  });
  document.querySelectorAll("[data-finish]").forEach((button) =>
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-finish]").forEach((item) => {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      card.classList.toggle("pearl-finish", button.dataset.finish === "pearl");
      document.querySelector("#finish-label").textContent =
        button.dataset.finish === "pearl" ? "Pearl" : "Obsidian";
    }),
  );
  return {
    setLocked(locked) {
      document.querySelectorAll("[data-finish]").forEach((button) => {
        button.disabled = locked;
      });
    },
    getFinish() {
      return (
        document.querySelector("[data-finish][aria-pressed='true']")?.dataset
          .finish || "obsidian"
      );
    },
    update(name, email) {
      document.querySelector("#cardholder").textContent =
        name.trim() || "YOUR NEXT CHAPTER";
      document.querySelector("#card-email").textContent =
        email.trim() || "A little closer to RivermindStyle.";
    },
  };
}
