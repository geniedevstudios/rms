let token = 0;

function introNode() {
  const intro = document.createElement("div");
  intro.className = "intro";
  intro.id = "intro";
  intro.setAttribute("aria-hidden", "true");
  const lockup = document.createElement("div");
  lockup.className = "intro-lockup";
  const image = document.createElement("img");
  image.src = "/intro-mark.png";
  image.alt = "";
  image.width = 970;
  image.height = 840;
  const name = document.createElement("p");
  name.textContent = "RIVERMINDSTYLE";
  lockup.append(image, name);
  intro.append(lockup);
  return intro;
}

function cover() {
  let intro = document.getElementById("intro");
  if (!intro || intro.classList.contains("is-leaving")) {
    const next = introNode();
    if (intro) intro.replaceWith(next);
    else document.body.prepend(next);
    intro = next;
  }
  document.documentElement.classList.add("intro-on");
  const root = document.getElementById("root");
  if (root) root.inert = true;
  return intro;
}

let coveredAt = performance.now();

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function afterPaint() {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    requestAnimationFrame(() => requestAnimationFrame(finish));
    setTimeout(finish, 80);
  });
}

/** Photographs and the hero film that will be on screen when the cover lifts. */
function pendingMedia(root: ParentNode, timeout: number) {
  const height = window.innerHeight || 800;
  const images = [...root.querySelectorAll("img")].filter((img) => {
    if (img.classList.contains("hover-shot")) return false;
    if (img.complete && img.naturalWidth > 0) return false;
    if (img.getAttribute("loading") === "lazy") {
      const rect = img.getBoundingClientRect();
      return rect.top < height + 80 && rect.bottom > -40;
    }
    return true;
  });
  const videos = [...root.querySelectorAll("video")].filter((video) => {
    if (video.readyState >= 2) return false;
    const rect = video.getBoundingClientRect();
    if (rect.top > height + 40 || rect.bottom < -40) return false;
    if (video.closest(".managed-hero") && !video.classList.contains("is-active")) return false;
    return true;
  });
  const listeners = new AbortController();
  const done = (element: HTMLImageElement | HTMLVideoElement, event: string) =>
    new Promise<void>((resolve) => {
      const ready =
        element instanceof HTMLImageElement
          ? element.complete
          : element.readyState >= 2;
      if (ready) {
        resolve();
        return;
      }
      const options = { once: true, signal: listeners.signal };
      element.addEventListener(event, () => resolve(), options);
      element.addEventListener("error", () => resolve(), options);
    });
  return Promise.race([
    Promise.all([
      ...images.map((img) => done(img, "load")),
      ...videos.map((video) => done(video, "loadeddata")),
    ]),
    wait(timeout),
  ]).finally(() => listeners.abort());
}

async function whenPageExists(id: number) {
  const root = document.getElementById("root");
  if (!root || root.childElementCount > 0) return;
  await new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (id !== token || root.childElementCount > 0) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(root, { childList: true });
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 8000);
  });
}

function lift(intro: HTMLElement, id: number, routeChange = false) {
  if (intro.classList.contains("is-leaving")) return;
  const finish = () => {
    if (id !== token || !intro.isConnected) return;
    intro.remove();
    document.documentElement.classList.remove("intro-on");
    const root = document.getElementById("root");
    if (root) root.inert = false;
    if (routeChange) document.getElementById("main-content")?.focus({ preventScroll: true });
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finish();
    return;
  }
  intro.classList.add("is-leaving");
  intro.addEventListener("animationend", (event) => {
    if (event.target === intro && event.animationName === "intro-leave") finish();
  });
  setTimeout(finish, routeChange ? 600 : 1200);
}

async function settle(id: number, routeChange = false) {
  if (!routeChange) await whenPageExists(id);
  if (id !== token) return;
  await afterPaint();
  if (id !== token) return;
  const root = document.getElementById("root");
  if (root) {
    const main = routeChange ? root.querySelector("main") : root;
    if (main) await pendingMedia(main, routeChange ? 1200 : 8000);
  }
  if (id !== token) return;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const minimum = routeChange ? (reducedMotion ? 180 : 450) : (reducedMotion ? 400 : 1000);
  const remaining = minimum - (performance.now() - coveredAt);
  if (remaining > 0) await wait(remaining);
  if (id !== token) return;
  const intro = document.getElementById("intro");
  if (intro) lift(intro, id, routeChange);
}

function begin(routeChange = false) {
  const id = ++token;
  coveredAt = performance.now();
  cover().classList.toggle("intro--route", routeChange);
  return id;
}

export function watchIntro() {
  const id = begin();
  setTimeout(() => {
    if (id !== token) return;
    const intro = document.getElementById("intro");
    if (intro) lift(intro, id);
  }, 9000);
}

/** The catalogue is in the page. Lift the cover once its photographs are ready. */
export function revealIntro() {
  const id = token;
  queueMicrotask(() => {
    void settle(id);
  });
}


export function showRouteIntro() {
  const id = begin(true);
  window.scrollTo({ top: 0, behavior: "instant" });
  void settle(id, true);
}
