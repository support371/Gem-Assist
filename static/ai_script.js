const inputEl = document.getElementById("userInput");
const chatboxEl = document.getElementById("chatbox");
const sendBtn = document.getElementById("sendButton");

async function sendMessage() {
  if (!inputEl || !chatboxEl || !sendBtn) return;

  const text = inputEl.value.trim();
  if (!text) return;

  // Show user message
  appendMessage("You", text, "user");

  // Clear input and disable button while waiting
  inputEl.value = "";
  inputEl.focus();
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();
    appendMessage("AI", data.reply, "ai");
  } catch (err) {
    appendMessage(
      "AI",
      "Sorry, something went wrong while contacting the assistant.",
      "ai",
    );
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    chatboxEl.scrollTop = chatboxEl.scrollHeight;
  }
}

function appendMessage(sender, text, type) {
  if (!chatboxEl) return;
  const p = document.createElement("p");
  p.classList.add("message", type);
  p.innerHTML = "<b>" + sender + ":</b> " + escapeHtml(text);
  chatboxEl.appendChild(p);
  chatboxEl.scrollTop = chatboxEl.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Allow pressing Enter to send
if (inputEl) {
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}
