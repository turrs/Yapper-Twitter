// Helper: Ambil isi tweet dari halaman detail
function getTweetTextFromDetailPage() {
  const tweetTextElem = document.querySelector('[data-testid="tweetText"]');
  return tweetTextElem ? tweetTextElem.innerText : '';
}

// Helper: Ambil isi tweet dari modal reply
function getTweetTextFromModal(modal) {
  const tweetTextElem = modal.querySelector('[data-testid="tweetText"]');
  return tweetTextElem ? tweetTextElem.innerText : '';
}

// Helper: Cari kolom komentar aktif
function getCommentBox(container=document) {
  return container.querySelector('div[role="textbox"][data-testid="tweetTextarea_0"]');
}

// Sisipkan tombol generate comment
function insertGenerateButton(commentBox, getTweetTextFn) {
  console.log('insertGenerateButton dipanggil', commentBox, getTweetTextFn);
  if (!commentBox) return;
  let parent = commentBox.closest('div[data-testid="tweetTextarea_0"]')?.parentNode;
  if (!parent) parent = commentBox.parentNode;
  if (parent.querySelector('.generate-comment-btn')) {
    console.log('Tombol sudah ada, skip');
    return;
  }

  const btn = document.createElement('button');
  btn.textContent = 'Generate Comment';
  btn.className = 'generate-comment-btn';
  btn.style.margin = '8px 8px 0 0';
  btn.style.padding = '4px 12px';
  btn.style.background = '#1da1f2';
  btn.style.color = '#fff';
  btn.style.border = 'none';
  btn.style.borderRadius = '4px';
  btn.style.cursor = 'pointer';

  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = 'Loading...';
    
    // Check authentication first
    const authResult = await new Promise((resolve) => {
      chrome.storage.local.get(['authToken', 'userEmail'], resolve);
    });
    
    if (!authResult.authToken || !authResult.userEmail) {
      alert('Anda harus login terlebih dahulu! Silakan buka extension popup untuk login.');
      btn.disabled = false;
      btn.textContent = 'Generate Comment';
      return;
    }
    
    const tweetText = getTweetTextFn();
    if (!tweetText) {
      alert('Isi tweet tidak ditemukan!');
      btn.disabled = false;
      btn.textContent = 'Generate Comment';
      return;
    }
    console.log('tweetText:', tweetText);
    
    const backendUrl = 'https://yapper-twitter.vercel.app/api/ai-generate-comment-supabase';
    try {
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authResult.authToken}`
        },
        body: JSON.stringify({
              tweet: `Saya merupakan user twitter yang akan membalas tweet ini, tolong balaskan saya sebagai pemula untuk membalas tweet ini, lansung on point balasannnya dalam bahasa inggris, jangan balas selain itu : ${tweetText}`    
        })
      });
      
      if (res.status === 401) {
        // Token expired or invalid
        chrome.storage.local.remove(['authToken', 'userEmail', 'userId'], () => {
          alert('Session expired. Please login again.');
        });
        btn.disabled = false;
        btn.textContent = 'Generate Comment';
        return;
      }
      
      const data = await res.json();
      console.log('data generate comment:', data);
      let comment = '';
      if (data && data.data && data.data.choices && data.data.choices[0] && data.data.choices[0].message && data.data.choices[0].message.content) {
        comment = data.data.choices[0].message.content;
      } else if (data && data.comment) {
        comment = data.comment;
      }
      if (comment) {
        commentBox.focus();
        document.execCommand('insertText', false, comment);
      } else {
        alert('Gagal generate comment');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
    btn.disabled = false;
    btn.textContent = 'Generate Comment';
  };
  const replyBtn = parent.querySelector('div[role="button"][data-testid="tweetButtonInline"]');
  console.log('replyBtn:', replyBtn, 'parent:', parent);
  if (replyBtn) {
    parent.insertBefore(btn, replyBtn);
    console.log('Tombol disisipkan sebelum replyBtn');
  } else {
    parent.appendChild(btn);
    console.log('Tombol disisipkan di parent');
  }
}

// Observer untuk halaman detail tweet
function observeDetailPage() {
  console.log('observeDetailPage running');
  const tryInsert = () => {
    const commentBox = getCommentBox();
    console.log('tryInsert, commentBox:', commentBox);
    if (commentBox) {
      insertGenerateButton(commentBox, getTweetTextFromDetailPage);
    }
  };
  setInterval(tryInsert, 1000);
}

// Observer untuk modal reply
function observeModalReply() {
  console.log('observeModalReply running');
  const observer = new MutationObserver(() => {
    const modals = document.querySelectorAll('div[role="dialog"]');
    modals.forEach(modal => {
      const commentBox = getCommentBox(modal);
      console.log('modal observer, commentBox:', commentBox);
      if (commentBox) {
        insertGenerateButton(commentBox, () => getTweetTextFromModal(modal));
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Jalankan observer
observeDetailPage();
observeModalReply();

// Listener untuk pesan dari popup (jika masih ingin support popup)
chrome.runtime && chrome.runtime.onMessage && chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fill_comment' && msg.comment) {
    let commentBox = getCommentBox();
    if (!commentBox) {
      const modals = document.querySelectorAll('div[role="dialog"]');
      for (const modal of modals) {
        commentBox = getCommentBox(modal);
        if (commentBox) break;
      }
    }
    if (commentBox) {
      commentBox.focus();
      document.execCommand('insertText', false, msg.comment);
    }
  }
}); 