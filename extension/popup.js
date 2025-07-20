// Authentication and UI elements
const tweetInput = document.getElementById('tweetText');
const generateBtn = document.getElementById('generateBtn');
const resultDiv = document.getElementById('result');
const fillBtn = document.getElementById('fillBtn');
const userInfoDiv = document.getElementById('userInfo');
const logoutBtn = document.getElementById('logoutBtn');
const settingsBtn = document.getElementById('settingsBtn');

let generatedComment = '';
let authToken = '';
let userEmail = '';

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

// Check authentication status
function checkAuth() {
  chrome.storage.local.get(['authToken', 'userEmail', 'userRole'], (result) => {
    if (!result.authToken || !result.userEmail) {
      // Not authenticated, redirect to login
      window.location.href = 'login.html';
      return;
    }
    
    authToken = result.authToken;
    userEmail = result.userEmail;
    const userRole = result.userRole || 'user';
    
    userInfoDiv.innerHTML = `
      <div>Logged in as: ${userEmail}</div>
      <div style="font-size: 10px; color: #999;">Role: ${userRole}</div>
    `;
    
    // Now get tweet text from active tab
    getTweetTextFromActiveTab();
  });
}

// Handle logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      // Call logout API
      const response = await fetch('https://yapper-twitter.vercel.app/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Clear local storage regardless of API response
      chrome.storage.local.remove(['authToken', 'userEmail', 'userId', 'userRole'], () => {
        window.location.href = 'login.html';
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage and redirect
      chrome.storage.local.remove(['authToken', 'userEmail', 'userId', 'userRole'], () => {
        window.location.href = 'login.html';
      });
    }
  });
}

if (settingsBtn) {
  settingsBtn.addEventListener('click', function() {
    window.location.href = 'settings.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

generateBtn.onclick = async () => {
  const tweetText = tweetInput.value.trim();
  if (!tweetText) {
    resultDiv.textContent = 'Isi tweet belum diisi!';
    return;
  }
  
  if (!authToken) {
    resultDiv.textContent = 'Anda harus login terlebih dahulu!';
    return;
  }
  
  generateBtn.disabled = true;
  resultDiv.textContent = 'Loading...';
  fillBtn.style.display = 'none';
  try {
    const res = await fetch('https://yapper-twitter.vercel.app/api/ai-generate-comment-supabase', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ tweet: tweetText })
    });
    
    if (res.status === 401) {
      // Token expired or invalid
      chrome.storage.local.remove(['authToken', 'userEmail', 'userId'], () => {
        resultDiv.textContent = 'Session expired. Please login again.';
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      });
      return;
    }
    
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