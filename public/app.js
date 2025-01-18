const dictionaryList = document.getElementById("dictionary");
const searchInput = document.getElementById("search");

// Fetch initial data
async function fetchDictionary() {
  const response = await fetch("/api/dictionary");
  const data = await response.json();
  renderDictionary(data);
}

// Render dictionary
function renderDictionary(data) {
  dictionaryList.innerHTML = data
    .map(item => `<li><b>${item.word}:</b> ${item.meaning}</li>`)
    .join("");
}

// Add word
async function addWord() {
  const word = prompt("Enter word:");
  const meaning = prompt("Enter meaning:");
  if (word && meaning) {
    await fetch("/api/dictionary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, meaning }),
    });
  }
}

// WebSocket connection
const ws = new WebSocket(`ws://${location.host}`);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "update") {
    renderDictionary(message.data);
  }
};

// Initial fetch
fetchDictionary();
