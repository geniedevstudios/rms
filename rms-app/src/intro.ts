let token = 0;

function introNode() {
  const intro = document.createElement("div");
  intro.className = "intro";
  intro.id = "intro";
  const image = document.createElement("img");
  image.src = "/intro-logo.jpg";
  image.alt = "RIVERMINDSTYLE";
  image.width = 606;
  image.height = 372;
  intro.append(image);
  return intro;
}

function playIntro(replay: boolean) {
  const id = ++token;
  let intro = document.getElementById("intro");
  if (!intro) {
    intro = introNode();
    document.body.prepend(intro);
  } else if (replay) {
    const next = introNode();
    intro.replaceWith(next);
    intro = next;
  }
  const root = document.getElementById("root");
  document.documentElement.classList.add("intro-on");
  if (root) root.inert = true;
  const finish = () => {
    if (id !== token || !intro?.isConnected) return;
    intro.remove();
    document.documentElement.classList.remove("intro-on");
    if (root) root.inert = false;
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setTimeout(finish, 700);
    return;
  }
  const running = intro.getAnimations().filter((item) => item.playState === "running");
  if (intro.getAnimations().length && running.length === 0) {
    finish();
    return;
  }
  intro.addEventListener("animationend", (event) => {
    if (event.target === intro && event.animationName === "intro-leave") finish();
  });
  setTimeout(finish, 4000);
}

export function watchIntro() {
  playIntro(false);
  window.addEventListener("hashchange", () => playIntro(true));
}
