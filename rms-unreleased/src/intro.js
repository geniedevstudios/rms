export function playIntro() {
  const intro = document.getElementById("intro");
  if (!intro) return;
  const rest = [...document.body.children].filter((node) => node !== intro);
  for (const node of rest) node.inert = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    intro.remove();
    document.documentElement.classList.remove("intro-on");
    for (const node of rest) node.inert = false;
  };
  if (reduce) {
    setTimeout(finish, 700);
    return;
  }
  intro.addEventListener("animationend", (event) => {
    if (event.target === intro && event.animationName === "intro-leave") finish();
  });
  setTimeout(finish, 4000);
}
