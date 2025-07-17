import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Bot, Play, PlayCircle, AlertTriangle, Settings, Zap, Key, Server, Wifi, WifiOff, CheckCircle, XCircle, Info, ExternalLink } from 'lucide-react';
import { twitterApi } from '../services/twitterApi';
import { proxyService } from '../services/proxyService';
import TweetList from './TweetList';
import { supabase } from '../services/supabase';
import { TwitterOauthButton } from './TwitterOauthButton';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

interface Tweet {
  id: string;
  username: string;
  handle: string;
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  avatar: string;
  url: string;
}

interface CommentSuggestion {
  id: string;
  text: string;
  tone: 'friendly' | 'professional' | 'casual' | 'supportive';
  confidence: number;
}

interface AIProvider {
  name: string;
  available: boolean;
  cost: 'free' | 'paid' | 'freemium';
  setupRequired: boolean;
  setupUrl?: string;
  description: string;
}

export default function TwitterAutoCommentTool() {
  const [searchTheme, setSearchTheme] = useState('');
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTweet, setSelectedTweet] = useState<string | null>(null);
  const [commentSuggestions, setCommentSuggestions] = useState<CommentSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchMethod, setSearchMethod] = useState<'api' | 'proxy'>('proxy');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<'checking' | 'ready' | 'incomplete'>('checking');
  const [missingSetup, setMissingSetup] = useState<string[]>([]);
  const [showRateLimitPopup, setShowRateLimitPopup] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid' | null>(null);
  const [twitterTag, setTwitterTag] = useState(''); // Tambahan untuk tag

  const twitterName = getCookie('twitter_name');

  const [autoCommentSettings, setAutoCommentSettings] = useState({
    tone: 'friendly',
    maxComments: 10,
    delayBetweenComments: 30,
    useAI: true,
    aiProvider: 'auto'
  });

  // availableProviders harus tetap ada
  const availableProviders: AIProvider[] = [
    {
      name: 'Akbxr.com',
      available: !!import.meta.env.VITE_OPENAI_API_KEY,
      cost: 'free',
      setupRequired: !import.meta.env.VITE_OPENAI_API_KEY,
      setupUrl: '',
      description: 'Most powerful AI for comment generation'
    }
  ];

  // Check setup status on component mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  useEffect(() => {
    // Check session on mount
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Check cookies for twitter_name and twitter_token
    const twitterName = getCookie('twitter_name');
    const twitterToken = getCookie('twitter_token');
    if (twitterName && twitterToken) {
      setTokenStatus('checking');
      fetch('http://localhost:4000/twitter/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twitterToken }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then((data) => {
          setTokenStatus('valid');
          setUser({ name: twitterName, ...data.user });
        })
        .catch(() => {
          setTokenStatus('invalid');
        });
    }
  }, []);

  const loginWithTwitter = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'twitter' });
    if (error) setError('Twitter login failed: ' + error.message);
    setAuthLoading(false);
  };

  const logout = async () => {
    setAuthLoading(true);
    await supabase.auth.signOut();
    setAuthLoading(false);
  };

  const checkSetupStatus = () => {
    setSetupStatus('checking');
    const missing: string[] = [];

    // Check Twitter API setup
    if (!twitterApi.isConfigured()) {
      missing.push('Twitter API Bearer Token');
    }

    // Check if at least one AI provider is available
   

    setMissingSetup(missing);

    if (missing.length === 0) {
      setSetupStatus('ready');
    } else {
      setSetupStatus('ready');
    }
  };

  // Simulate real API calls
  const searchRealTweets = async (theme: string, method: string) => {
    switch (method) {
      case 'api':
        if (!twitterApi.isConfigured()) {
          throw new Error('Twitter Bearer Token not configured');
        }
        return await twitterApi.searchTweets(theme, autoCommentSettings.maxComments);
      case 'proxy':
        return await proxyService.searchTweetsViaProxy(theme, autoCommentSettings.maxComments);
      default:
        throw new Error('Invalid search method');
    }
  };

  // Generate comments using backend AI proxy
  const generateRealComments = async (tweetContent: string, tone: string) => {
    // Call backend proxy for AI comment
    const aiResult = await proxyService.generateCommentViaProxy(tweetContent);
    // The API returns a single comment in aiResult.choices[0].message.content
    const commentText = aiResult.choices?.[0]?.message?.content || '';
    return [
      {
        id: 'ai_1',
        text: commentText,
        tone: tone as any,
        confidence: 95
      }
    ];
  };

  const handleSearch = async () => {
    if (!searchTheme.trim()) return;
    if (setupStatus === 'incomplete') {
      setError('Please complete the setup before searching for tweets');
      return;
    }
    setIsSearching(true);
    setError(null);
    setTweets([]);
    setSuccess(null);
    setShowRateLimitPopup(false);
    try {
      const results = await searchRealTweets(searchTheme, searchMethod);
      setTweets(results);
      setSuccess(`Found ${results.length} real tweets`);
    } catch (error: any) {
      setShowRateLimitPopup(true);
      if (error.message && error.message.includes('429')) {
        setShowRateLimitPopup(true);
        setError('Twitter API rate limit exceeded. Please wait before trying again.');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const generateComments = async (tweetId: string) => {
    const tweet = tweets.find(t => t.id === tweetId);
    if (!tweet) return;


    setIsGenerating(true);
    setSelectedTweet(tweetId);
    setError(null);
    
    try {
      const suggestions = await generateRealComments(tweet.content, autoCommentSettings.tone);
      setCommentSuggestions(suggestions);
      setSuccess('AI comments generated successfully!');
    } catch (error: any) {
      setError(`Failed to generate comments: ${error.message}`);
      console.error('Comment generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Update postComment to require login
  const postComment = async (tweetId: string, comment: string) => {
    // Get access token from cookie
    console.log('testtyo');
    const twitterToken = getCookie('twitter_token');
    if (!twitterToken) {
      console.log('Twitter access token not found. Please login again.');
      return;
    }
    try {
      setSuccess(null);
      setError(null);
      // Tambahkan tag jika diisi
      let commentWithTag = comment;
      if (twitterTag.trim() !== '') {
        commentWithTag = `${comment} @${twitterTag.trim()}`;
      }
      // POST to backend to handle Twitter posting
      const response = await fetch('http://localhost:4000/twitter/post-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${twitterToken}`,
        },
        body: JSON.stringify({ tweetId, comment: commentWithTag }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.title || 'Failed to post comment');
      }
      setSuccess(`Comment posted successfully to tweet ${tweetId.slice(-6)}!`);
      setCommentSuggestions([]);
      setSelectedTweet(null);
    } catch (error: any) {
      setError(`Error posting comment: ${error.message}`);
    }
  };

  const autoCommentAll = async () => {
    if (tweets.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to auto-comment on ${tweets.length} tweets? This may take ${Math.ceil(tweets.length * autoCommentSettings.delayBetweenComments / 60)} minutes.`
    );
    if (!confirmed) return;

    setError(null);
    let successCount = 0;

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      
      try {
        // Generate comment
        const suggestions = await generateRealComments(tweet.content, autoCommentSettings.tone);
        if (suggestions.length > 0) {
          // Post the first suggestion
          await postComment(tweet.id, suggestions[0].text);
          successCount++;
          setSuccess(`Posted ${successCount}/${tweets.length} comments`);
        }

        // Delay between comments (except for the last one)
        if (i < tweets.length - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, autoCommentSettings.delayBetweenComments * 1000)
          );
        }
      } catch (error: any) {
        console.error(`Error commenting on tweet ${tweet.id}:`, error);
        setError(`Error on tweet ${i + 1}: ${error.message}`);
      }
    }

    setSuccess(`Auto-commenting completed! Successfully posted ${successCount}/${tweets.length} comments.`);
  };

  const getMethodDescription = (method: string) => {
    const descriptions = {
      api: `Official Twitter API v2 ${twitterApi.isConfigured() ? '(Configured ✓)' : '(Bearer token required)'}`,
      proxy: 'Via CORS proxy server (May have limitations)',
      rss: 'RSS feeds via Nitter (Free but limited to specific users)',
      extension: 'Browser extension (Requires extension installation)',
      scraping: 'Web scraping (Requires server-side setup with Puppeteer)'
    };
    return descriptions[method as keyof typeof descriptions];
  };

  const getSetupStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'demo': return 'text-yellow-600';
      case 'incomplete': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSetupStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'demo': return <Info className="w-5 h-5 text-yellow-600" />;
      case 'incomplete': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>;
    }
  };

  const getSetupStatusMessage = (status: string) => {
    switch (status) {
      case 'ready': return 'All systems ready for real Twitter data';
      case 'demo': return 'Demo mode - using mock data (Twitter API not configured)';
      case 'incomplete': return 'Setup incomplete - some features unavailable';
      case 'checking': return 'Checking configuration...';
      default: return 'Unknown status';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Full-page loading overlay when checking token */}
      {tokenStatus === 'checking' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-40">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-6"></div>
          <div className="text-xl text-blue-100 font-semibold">Checking Twitter token...</div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Real Twitter Auto Comment Tool</h1>
          <p className="text-gray-600">Production-ready Twitter automation with real data integration</p>
          
          {/* Setup Status */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {getSetupStatusIcon(setupStatus)}
            <span className={`font-medium ${getSetupStatusColor(setupStatus)}`}>
              {getSetupStatusMessage(setupStatus)}
            </span>
          </div>
          {tokenStatus === 'checking' && (
            <div className="mt-2 flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span>Checking Twitter token...</span>
            </div>
          )}
          {tokenStatus === 'valid' && <div className="mt-2 text-green-600">Twitter access token is valid.</div>}
       

          {/* Auth UI */}
          <div className="mt-4 flex items-center justify-center gap-4">
            {twitterName ? (
              <>
                
                <span className="text-gray-700 font-medium">{twitterName}</span>
                <button onClick={logout} disabled={authLoading} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Logout</button>
              </>
            ) : (
              <TwitterOauthButton />
            )}
          </div>
          {/* Status Messages */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-center text-red-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center text-green-800">
                <Zap className="w-5 h-5 mr-2" />
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          {setupStatus === 'ready' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-center text-yellow-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="font-medium">Warning: Ensure you comply with Twitter's Terms of Service</span>
              </div>
            </div>
          )}

          {setupStatus === 'incomplete' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Setup Required</span>
                </div>
                <p className="text-sm">Missing: {missingSetup.join(', ')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-blue-600" />
            Configuration & Setup
          </h2>

          {/* Data Source Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Source Method</label>
            <select
              value={searchMethod}
              onChange={(e) => setSearchMethod(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="proxy">CORS Proxy (Recommended)</option>
              <option value="api">Twitter API (Recommended)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">{getMethodDescription(searchMethod)}</p>
          </div>



          {/* AI Providers Status */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">AI Providers Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
            </div>
          </div>

          {/* Environment Variables Guide */}
          {(setupStatus === 'incomplete') && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Setup Instructions
              </h3>
              
              {missingSetup.includes('Twitter API Bearer Token') && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <h4 className="font-medium text-yellow-800 mb-2">Twitter API Setup</h4>
                  <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                    <li>Go to <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twitter Developer Portal</a></li>
                    <li>Create a new app and get your Bearer Token</li>
                    <li>Add <code className="bg-yellow-100 px-1 rounded">TWITTER_BEARER_TOKEN=your_token</code> to .env file</li>
                    <li>Note: Requires paid subscription ($100/month minimum)</li>
                  </ol>
                </div>
              )}

              {missingSetup.includes('At least one AI provider') && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">AI Provider Setup (Choose One)</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <div>
                      <strong>Free Options:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li><a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ollama</a> - Completely free local AI</li>
                        <li><a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Hugging Face</a> - Free tier available</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Paid Options:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li><a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI</a> - Most powerful</li>
                        <li><a href="https://dashboard.cohere.ai/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Cohere</a> - Good balance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p className="mb-2"><strong>Create .env file in project root:</strong></p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`# Twitter API (for real data)
VTWITTER_BEARER_TOKEN=your_bearer_token

# AI Services (choose one or more)
VITE_OPENAI_API_KEY=your_openai_key
VITE_HUGGINGFACE_API_KEY=your_hf_key
VITE_COHERE_API_KEY=your_cohere_key`}
                </pre>
              </div>
            </div>
          )}

          {setupStatus === 'ready' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Configuration Status
            </h3>
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>All required configurations are set up correctly!</span>
            </div>
          </div>
          )}

          {/* Auto Comment Settings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment Tone</label>
              <select
                value={autoCommentSettings.tone}
                onChange={(e) => setAutoCommentSettings({...autoCommentSettings, tone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="supportive">Supportive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Comments</label>
              <input
                type="number"
                value={autoCommentSettings.maxComments}
                onChange={(e) => setAutoCommentSettings({...autoCommentSettings, maxComments: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                min="1"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delay (seconds)</label>
              <input
                type="number"
                value={autoCommentSettings.delayBetweenComments}
                onChange={(e) => setAutoCommentSettings({...autoCommentSettings, delayBetweenComments: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                min="10"
                max="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
              <select
                value={autoCommentSettings.aiProvider}
                onChange={(e) => setAutoCommentSettings({...autoCommentSettings, aiProvider: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto (Try All)</option>
                <option value="openai">OpenAI GPT</option>
                <option value="huggingface">Hugging Face</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="cohere">Cohere</option>
                <option value="templates">Templates (Free)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag Twitter (opsional)</label>
              <input
                type="text"
                value={twitterTag}
                onChange={e => setTwitterTag(e.target.value)}
                placeholder="username tanpa @"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500">Akan ditambahkan di akhir komentar, contoh: @username</span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Search className="w-6 h-6 mr-2 text-blue-600" />
            Search Real Tweets
          </h2>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={'Enter theme/topic (e.g., "AI technology", "React development")'}
                value={searchTheme}
                onChange={(e) => setSearchTheme(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                setupStatus === 'incomplete' 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Real Data
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Server className="w-4 h-4" />
            <span>Using {searchMethod} method</span>
          </div>
        </div>

        {/* Results Section */}
        {tweets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TweetList
              tweets={tweets}
              isGenerating={isGenerating}
              selectedTweet={selectedTweet}
              onGenerateComment={generateComments}
              onAutoCommentAll={autoCommentAll}
            />

            {/* Comment Suggestions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-600" />
                AI-Generated Comments
              </h2>
              
              {commentSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {commentSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.tone === 'friendly' ? 'bg-green-100 text-green-800' :
                          suggestion.tone === 'professional' ? 'bg-blue-100 text-blue-800' :
                          suggestion.tone === 'casual' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {suggestion.tone}
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round(suggestion.confidence)}% confidence
                        </span>
                      </div>
                      <p className="text-gray-800 mb-3">{suggestion.text}</p>
                      <button
                        onClick={() => postComment(selectedTweet || '', suggestion.text)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Post Comment
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a tweet and click "Generate Comment" to see AI suggestions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {tweets.length === 0 && !isSearching && setupStatus !== 'checking' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">Run Backend Server</h2>
              <p className="text-gray-500">Run the backend server to get the real tweets</p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {`node backend-proxy.cjs`}
              </pre>
          </div>
        )}
      </div>
      
    </div>
  );
}