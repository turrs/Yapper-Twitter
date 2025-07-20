// Settings page for Yapping extension
// Handles customization of Kaito AI API parameters
document.getElementById('saveBtn').addEventListener('click', function(e) {
  e.preventDefault();
  saveSettings();
});
// Simpan settings
async function saveSettings() {
  // 1. Ambil data dari form
  console.log('Saving settings...');
  const duration = document.getElementById('duration').value;
  const topic_id = document.getElementById('topic_id').value;
  const top_n = document.getElementById('top_n').value;
  const authResult = await new Promise((resolve) => {
    chrome.storage.local.get(['authToken', 'userEmail'], resolve);
  });
  
  if (!authResult.authToken || !authResult.userEmail) {
    alert('Anda harus login terlebih dahulu! Silakan buka extension popup untuk login.');
    btn.disabled = false;
    btn.textContent = 'Generate Comment';
    return;
  }
  // 2. Kirim ke API
  try {
    const response = await fetch('https://yapper-twitter.vercel.app/api/kaito-yaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authResult.authToken}` },
      body: JSON.stringify({ duration, topic_id, top_n })
    });

    if (!response.ok) {
      throw new Error('Gagal menghubungi API');
    }

    // 3. Ambil respon dari API
    const data = await response.json();

    // 4. Simpan respon ke chrome.storage.local
    chrome.storage.local.set({ kaitoYapsResponse: data }, function() {
      // 5. Tampilkan status sukses
      alert('Settings berhasil disimpan dan respon API sudah disimpan!');
    });
  } catch (err) {
    alert('Gagal menyimpan settings: ' + err.message);
  }
}
document.addEventListener('DOMContentLoaded', function() {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      window.location.href = 'popup.html';
    });
  }
  // ... kode lain ...
  loadSettings();
});
// Load settings
function loadSettings() {
  chrome.storage.local.get(['mySetting'], function(result) {
    if (result.mySetting) {
      document.getElementById('mySetting').value = result.mySetting;
    }
  });
}
