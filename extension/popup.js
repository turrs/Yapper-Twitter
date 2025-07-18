// Ganti URL backend di bawah ini sesuai kebutuhan
const tweetInput = document.getElementById('tweetText');
const generateBtn = document.getElementById('generateBtn');
const resultDiv = document.getElementById('result');
const fillBtn = document.getElementById('fillBtn');

let generatedComment = '';

// Ambil isi tweet dari tab aktif (jika twitter.com)
function getTweetTextFromActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.url && tab.url.includes('twitter.com')) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Ambil isi tweet utama
          const tweetTextElem = document.querySelector('[data-testid="tweetText"]');
          return tweetTextElem ? tweetTextElem.innerText : '';
        },
      }, (results) => {
        if (results && results[0] && results[0].result) {
          tweetInput.value = results[0].result;
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  getTweetTextFromActiveTab();
});

generateBtn.onclick = async () => {
  const tweetText = tweetInput.value.trim();
  if (!tweetText) {
    resultDiv.textContent = 'Isi tweet belum diisi!';
    return;
  }
  generateBtn.disabled = true;
  resultDiv.textContent = 'Loading...';
  fillBtn.style.display = 'none';
  try {
    const res = await fetch('https://your-backend-url/api/ai-generate-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tweet: tweetText })
    });
    const data = await res.json();
    let comment = '';
    if (data && data.data && data.data.choices && data.data.choices[0] && data.data.choices[0].message && data.data.choices[0].message.content) {
      comment = data.data.choices[0].message.content;
    } else if (data && data.comment) {
      comment = data.comment;
    }
    if (comment) {
      generatedComment = comment;
      resultDiv.textContent = comment;
      fillBtn.style.display = 'block';
    } else {
      resultDiv.textContent = 'Gagal generate comment';
    }
  } catch (e) {
    resultDiv.textContent = 'Error: ' + e.message;
  }
  generateBtn.disabled = false;
};

fillBtn.onclick = () => {
  // Kirim pesan ke content script untuk mengisi kolom komentar
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.url && tab.url.includes('twitter.com')) {
      chrome.tabs.sendMessage(tab.id, { action: 'fill_comment', comment: generatedComment });
    }
  });
}; 