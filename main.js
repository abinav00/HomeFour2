const FEEDBACK_MS = 1600;
const INDIAN_MOBILE = /^(\+?91)?[6-9]\d{9}$/;
const ARROW_STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function flashLabel(button, message) {
  const original = button.textContent;
  button.textContent = message;
  setTimeout(() => { button.textContent = original; }, FEEDBACK_MS);
}

function selectText(node, button) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  flashLabel(button, "Press copy");
}

async function copyText(text, button, fallbackNode) {
  if (!navigator.clipboard?.writeText) {
    selectText(fallbackNode, button);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    flashLabel(button, "Copied");
  } catch {
    selectText(fallbackNode, button);
  }
}

function initCopyButtons() {
  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    const source = document.getElementById(button.dataset.copyTarget);
    if (!source) return;
    button.addEventListener("click", () => copyText(source.textContent.trim(), button, source));
  });
}

function initRoomTabs() {
  const panel = document.getElementById("room-panel");
  const tagline = document.getElementById("room-tagline");
  const tabs = [...document.querySelectorAll(".room-tab")];
  if (!panel || !tagline || tabs.length === 0) return;

  const photos = [...panel.querySelectorAll("picture")];

  function showRoom(index, moveFocus = false) {
    tabs.forEach((tab, tabIndex) => {
      const isActive = tabIndex === index;
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      photos[tabIndex].hidden = !isActive;
    });
    tagline.textContent = tabs[index].dataset.tagline;
    panel.setAttribute("aria-labelledby", tabs[index].id);
    if (moveFocus) tabs[index].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => showRoom(index));
    tab.addEventListener("keydown", (event) => {
      const step = ARROW_STEP[event.key];
      if (!step) return;
      event.preventDefault();
      showRoom((index + step + tabs.length) % tabs.length, true);
    });
  });
}

function setFieldError(input, message) {
  document.getElementById(`${input.id}-error`).textContent = message;
  input.setAttribute("aria-invalid", String(message !== ""));
}

function checkField(input, isValid, message) {
  setFieldError(input, isValid ? "" : message);
  return isValid;
}

function buildQuoteMessage({ name, phone, need, details }) {
  const lines = [
    "Hello Home Four, I would like a free quote.",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Looking for: ${need}`,
  ];
  if (details) lines.push(`Details: ${details}`);
  return lines.join("\n");
}

function renderQuoteSummary(form, quoteBox, message) {
  const template = document.getElementById("quote-summary-template");
  const summary = template.content.firstElementChild.cloneNode(true);
  const whatsappLink = summary.querySelector("[data-send-whatsapp]");
  const copyButton = summary.querySelector("[data-copy-summary]");
  const editButton = summary.querySelector("[data-edit]");
  const messageNode = summary.querySelector(".quote-summary__text");

  messageNode.textContent = message;
  whatsappLink.href = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(message)}`;
  copyButton.addEventListener("click", () => copyText(message, copyButton, messageNode));
  editButton.addEventListener("click", () => {
    summary.remove();
    form.hidden = false;
    form.elements.name.focus();
  });

  form.hidden = true;
  quoteBox.append(summary);
  summary.querySelector("h3").focus();
}

function initQuoteForm() {
  const form = document.getElementById("quote-form");
  const quoteBox = document.getElementById("quote-box");
  if (!form || !quoteBox) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const { name, phone, need, details } = Object.fromEntries(new FormData(form));
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    const nameIsValid = checkField(form.elements.name, cleanName !== "", "Enter your name.");
    const phoneIsValid = checkField(
      form.elements.phone,
      INDIAN_MOBILE.test(cleanPhone.replace(/[\s-]/g, "")),
      "Enter a 10 digit mobile number."
    );
    if (!nameIsValid || !phoneIsValid) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    const message = buildQuoteMessage({
      name: cleanName,
      phone: cleanPhone,
      need,
      details: details.trim(),
    });
    renderQuoteSummary(form, quoteBox, message);
  });
}

initCopyButtons();
initRoomTabs();
initQuoteForm();
