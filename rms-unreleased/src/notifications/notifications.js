export function setupReservationNotice(onReset, onClose) {
  const dialog = document.querySelector("#reservation-dialog");
  const close = () => {
    dialog.close();
  };
  dialog.addEventListener("close", onClose);
  document.querySelector("#notice-close").addEventListener("click", close);
  document.querySelector("#notice-done").addEventListener("click", close);
  document.querySelector("#reset-form").addEventListener("click", () => {
    close();
    onReset();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      close();
  });
  return {
    show({ declined, reference, emailed }) {
      dialog.classList.toggle("already-reserved", declined);
      document.querySelector("#result-icon").textContent = declined ? "↗" : "✓";
      document.querySelector("#result-label").textContent = declined
        ? "ALREADY A MEMBER"
        : "ACCESS CONFIRMED";
      document.querySelector("#result-title").textContent = declined
        ? "You’re already on the list."
        : "Invitation reserved.";
      document.querySelector("#result-description").textContent = declined
        ? "This email already has an RMS invitation. Your place is still reserved—there’s nothing more to do."
        : emailed === false
          ? "Your place is reserved. The confirmation note could not be sent just now. We’ll still write when our new world opens."
          : emailed
            ? "Welcome to the inner circle. Your place is reserved, and a confirmation is on its way. We’ll write again when our new world opens."
            : "Welcome to the inner circle. Your place is reserved. We’ll be in touch when our new world opens.";
      document.querySelector("#receipt-id").textContent = declined
        ? "YOUR EXISTING INVITATION IS SAFE"
        : reference;
      document.querySelector("#reset-form").textContent = declined
        ? "Use a different email ↗"
        : "Create another invitation ↗";
      dialog.showModal();
    },
  };
}
