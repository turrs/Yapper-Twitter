import React, { useEffect, useState } from 'react';

export default function TwitterOauthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setStatus('loading'); // Show loading immediately
    setMessage('Processing Twitter login...');
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) {
      setStatus('error');
      setMessage('No code found in URL.');
      return;
    }
    // Send code to backend for token exchange
    fetch('http://localhost:4000/oauth/twitter/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Token exchange failed');
        }
        return res.json();
      })
      .then((data) => {
        setStatus('success');
        setMessage('Twitter login successful! Redirecting...');
        setUser(data.user?.data || null);
        if (data.user?.data) {
          localStorage.setItem('twitter_user', JSON.stringify(data.user.data));
        }
        window.location.href = 'http://localhost:5173/';
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {status === 'loading' && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>{message || 'Processing Twitter login...'}</p>
        </>
      )}
      {status === 'success' && (
        <div className="text-center">
          <p className="text-green-600 mb-2">{message}</p>
          {user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
              <div className="font-bold mb-1">User Info</div>
              <div><b>ID:</b> {user.id}</div>
              <div><b>Username:</b> @{user.username}</div>
              <div><b>Name:</b> {user.name}</div>
            </div>
          )}
        </div>
      )}
      {status === 'error' && <p className="text-red-600">{message}</p>}
    </div>
  );
} 