import { setupReservationNotice } from "../notifications/notifications.js";
export function setupWaitlist(card, { onReserved, onReset }) {
  const form = document.querySelector("#waitlist-form");
  const name = form.elements.name;
  const email = form.elements.email;
  const error = document.querySelector("#form-error");
  const save = document.querySelector("#save-step");
  const reserve = document.querySelector("#reserve-button");
  const back = document.querySelector("#previous-step");
  const heading = document.querySelector("#journey-title");
  const description = document.querySelector("#journey-description");
  const summary = document.querySelector("#reservation-summary");
  function reset() {
    onReset();
    summary.hidden = true;
    card.setLocked(false);
    form.reset();
    card.update("", "");
    show("name");
  }
  const notice = setupReservationNotice(reset, () => {
    const target =
      step === "result"
        ? document.querySelector("#another-invitation")
        : step === "name"
          ? name
          : reserve;
    target.focus({ preventScroll: true });
  });
  document
    .querySelector("#another-invitation")
    .addEventListener("click", reset);
  let step = "name";
  let busy = false;
  function show(next, focus = true) {
    step = next;
    error.textContent = "";
    form.hidden = false;
    document.querySelector("#journey-start").hidden = true;
    document.querySelector("#wizard-controls").hidden = false;
    document.querySelector("#entry-panel").hidden = !["name", "email"].includes(
      step,
    );
    document.querySelector("#review-panel").hidden = step !== "review";
    save.hidden = step === "review";
    reserve.hidden = step !== "review";
    document.querySelector("#entry-note").hidden = step === "review";
    document.querySelector("#step-status").textContent = "";
    name.hidden = name.disabled = step !== "name";
    email.hidden = email.disabled = step !== "email";
    back.hidden = step === "name" || step === "result";
    document.querySelectorAll("[data-step]").forEach((item) => {
      if (item.dataset.step === step) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
      item.classList.toggle(
        "complete",
        ["name", "email", "review", "result"].indexOf(item.dataset.step) <
          ["name", "email", "review", "result"].indexOf(step),
      );
    });
    const titles = {
      name: "First, make it yours.",
      email: "A way to stay close.",
      review: "One last introduction.",
    };
    const descriptions = {
      name: "Enter your name on the card, then save.",
      email: "Save your email to continue.",
      review: "Your invitation is ready. Make it official.",
    };
    if (titles[step]) {
      heading.textContent = titles[step];
      description.textContent = descriptions[step];
    }
    if (step === "name" || step === "email") {
      const active = step === "name" ? name : email;
      document.querySelector("#entry-label").textContent =
        step === "name" ? "01 / YOUR NAME" : "02 / YOUR EMAIL";
      document.querySelector("#entry-label").htmlFor = active.id;
      document.querySelector("#entry-note").textContent =
        step === "name"
          ? "Every invitation begins with a name."
          : "Just the first word on what comes next.";
      save.setAttribute("aria-label", `Save ${step}`);
      save.title = `Save ${step}`;
      if (focus) active.focus({ preventScroll: true });
    }
    if (step === "review") {
      document.querySelector("#review-name").textContent = name.value.trim();
      document.querySelector("#review-email").textContent = email.value.trim();
      if (focus) reserve.focus({ preventScroll: true });
    }
  }
  form.addEventListener("input", () => {
    card.update(name.value, email.value);
    error.textContent = "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || step === "result") return;
    if (step !== "review") {
      const field = step === "name" ? name : email;
      if (!field.value.trim() || !field.checkValidity()) {
        error.textContent =
          step === "name"
            ? "Please enter your name."
            : "Please enter a valid email address.";
        field.focus({ preventScroll: true });
        return;
      }
      const saved = step;
      show(step === "name" ? "email" : "review");
      document.querySelector("#step-status").textContent =
        saved === "name"
          ? "Name saved"
          : "Email saved · Your access card is ready";
      return;
    }
    busy = true;
    card.setLocked(true);
    const finish = card.getFinish();
    reserve.disabled = true;
    back.disabled = true;
    document.querySelector("#step-status").textContent =
      "Reserving your invitation…";
    reserve.textContent = "Authorising your invitation…";
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.value,
          email: email.value,
          finish,
          website: form.elements.website.value,
        }),
        signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to reserve. Please try again.");
      if (result.status === "reserved") {
        show("result", false);
        form.hidden = true;
        document.querySelector("#wizard-controls").hidden = true;
        heading.textContent = "Your place is reserved.";
        description.textContent = "Welcome to the inner circle.";
        document.querySelector("#reserved-finish").textContent = finish;
        document.querySelector("#reserved-reference").textContent =
          result.reference;
        summary.hidden = false;
        onReserved();
      }
      notice.show({
        declined: result.status === "already_registered",
        reference: result.reference,
        emailed: result.emailed,
      });
    } catch (failure) {
      error.textContent =
        failure.name === "TimeoutError"
          ? "That took too long. Please try again."
          : failure instanceof TypeError
            ? "Unable to connect. Please try again."
            : failure.message;
    } finally {
      busy = false;
      card.setLocked(step === "result");
      reserve.disabled = false;
      back.disabled = false;
      reserve.innerHTML = "Reserve invitation <span>↗</span>";
      document.querySelector("#step-status").textContent = "";
    }
  });
  back.addEventListener("click", () => {
    if (!busy) show(step === "review" ? "email" : "name");
  });
  return { start: () => show("name", false) };
}
