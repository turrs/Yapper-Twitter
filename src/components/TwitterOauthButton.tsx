import xlogo from '../xlogo.png';

const TWITTER_CLIENT_ID = import.meta.env.VITE_TWITTER_CLIENT_ID || 'NU1aemxZTUZieXZqZkNEOXU1TkU6MTpjaQ';
const TWITTER_REDIRECT_URI = import.meta.env.VITE_TWITTER_REDIRECT_URI || 'http://localhost:4000/oauth/twitter/callback';
const TWITTER_CODE_CHALLENGE = import.meta.env.VITE_TWITTER_CODE_CHALLENGE || 'abc123';

function getTwitterOauthUrl() {
  const rootUrl = 'https://twitter.com/i/oauth2/authorize';

  // Scope di-encode agar spasi menjadi %20
  const scope = encodeURIComponent([
    'tweet.read',
    'tweet.write',
    'users.read',
    'offline.access'
  ].join(' '));

  const url = `${rootUrl}?response_type=code&client_id=${encodeURIComponent(TWITTER_CLIENT_ID)}&redirect_uri=${encodeURIComponent(TWITTER_REDIRECT_URI)}&scope=${scope}&state=state123&code_challenge=${encodeURIComponent(TWITTER_CODE_CHALLENGE)}&code_challenge_method=plain`;

  return url;
}

export function TwitterOauthButton() {
  return (
    <a className="a-button row-container" href={getTwitterOauthUrl()}>
      <img src={xlogo} alt="twitter icon" style={{ width: 24, height: 24, marginRight: 8 }} />
      <span>Login with Twitter</span>
    </a>
  );
}
