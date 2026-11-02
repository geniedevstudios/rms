export function setupJourney(onReady) {
  const journey = document.querySelector(".journey");
  const position = document.querySelector(".card-position");
  const card = document.querySelector("#membership-card");
  const front = document.querySelector(".card-front");
  const back = document.querySelector(".card-back");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let started = false;
  let skip = false;
  let editing = false;
  let reserved = false;
  function start() {
    if (started) return;
    started = true;
    onReady();
  }
  function render() {
    frame = 0;
    if (reserved) {
      journey.classList.add("is-ready", "is-reserved");
      position.style.transform = "none";
      card.style.transform = "rotateY(0deg)";
      front.inert = false;
      front.setAttribute("aria-hidden", "false");
      back.inert = true;
      back.setAttribute("aria-hidden", "true");
      return;
    }
    const distance = Math.max(1, journey.offsetHeight - window.innerHeight);
    const progress = Math.min(
      1,
      Math.max(0, -journey.getBoundingClientRect().top / distance),
    );
    const eased = progress * progress * (3 - 2 * progress);
    // Grow and travel first, then turn over to reveal the form on the reverse.
    const turn = Math.min(1, Math.max(0, (progress - 0.25) / 0.6));
    const rotation = turn * turn * (3 - 2 * turn) * 180;
    const ready = progress >= 0.85 || skip || editing || motion.matches;
    journey.classList.toggle("is-ready", ready);
    if (!motion.matches && !skip && !editing) {
      position.style.transform = `translateX(${(1 - eased) * -10}%) translateY(${(1 - eased) * 12}px) rotate(${(1 - eased) * -13}deg) scale(${0.78 + eased * 0.22})`;
      card.style.transform = `rotateX(${(1 - turn) * 10}deg) rotateY(${rotation}deg)`;
    } else {
      position.style.transform = "none";
      card.style.transform = "rotateY(180deg)";
    }
    front.inert = ready;
    front.setAttribute("aria-hidden", String(ready));
    back.inert = !ready;
    back.setAttribute("aria-hidden", String(!ready));
    if (ready) start();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  window.addEventListener("scroll", schedule, { passive: true });
  document.querySelector("#waitlist-form").addEventListener("focusin", () => {
    if (!back.inert) {
      editing = true;
      schedule();
    }
  });
  window.addEventListener("resize", schedule);
  motion.addEventListener("change", schedule);
  const revealName = () => {
    skip = true;
    window.scrollTo({
      top: journey.offsetTop + journey.offsetHeight - window.innerHeight,
      behavior: motion.matches ? "instant" : "smooth",
    });
    render();
  };
  document
    .querySelector("#begin-invitation")
    .addEventListener("click", revealName);
  document.querySelector("#early-access").addEventListener("click", () => {
    if (reserved) {
      document.querySelector("#reservation-summary").scrollIntoView({
        behavior: motion.matches ? "instant" : "smooth",
        block: "center",
      });
      return;
    }
    skip = true;
    render();
    document.getElementById("name").scrollIntoView({
      behavior: motion.matches ? "instant" : "smooth",
      block: "center",
    });
  });
  render();
  return {
    complete() {
      reserved = true;
      render();
    },
    edit() {
      reserved = false;
      editing = true;
      journey.classList.remove("is-reserved");
      render();
    },
  };
}
