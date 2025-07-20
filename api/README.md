# API Functions - Vercel Serverless Limit Management

## 📊 Current API Functions (13/12 limit) ⚠️

### ✅ **Core Authentication Functions (4 functions)**
1. `login-supabase.js` - User login dengan Supabase
2. `register.js` - User registration
3. `logout.js` - User logout dan session cleanup
4. `validate-token.js` - Token validation

### ✅ **Core Extension Functions (2 functions)**
5. `ai-generate-comment-supabase.js` - Generate comment dengan auth
6. `ai-generate-comment.js` - **DEPRECATED** - Bisa dihapus

### ✅ **Twitter API Functions (6 functions)**
7. `twitter-generate-tweet.js` - Generate tweet
8. `oauth-twitter-callback.js` - Twitter OAuth callback
9. `twitter-me.js` - Get Twitter user info
10. `twitter-post-comment.js` - Post comment to Twitter
11. `twitter-post-tweet.js` - Post tweet to Twitter
12. `twitter-search.js` - Search Twitter

### ✅ **Kaito AI Integration (1 function)**
13. `kaito-yaps.js` - **NEW** - Fetch yapping history from Kaito AI API

## 🗑️ **Files to Remove (Optional)**

### **Deprecated Functions:**
- `ai-generate-comment.js` - **REPLACED** by `ai-generate-comment-supabase.js`
- `login.js` - **REPLACED** by `login-supabase.js` ✅ **ALREADY DELETED**

### **If you need more space, consider removing:**
- `twitter-me.js` - If not using Twitter user info
- `twitter-search.js` - If not using Twitter search
- `validate-token.js` - If not using separate token validation

## 🔧 **Optimization Strategies**

### **1. Combine Related Functions**
```javascript
// Instead of separate files, combine into one:
// twitter-operations.js
export default async function handler(req, res) {
  const { operation } = req.body;
  
  switch(operation) {
    case 'generate_tweet':
      return handleGenerateTweet(req, res);
    case 'post_tweet':
      return handlePostTweet(req, res);
    case 'post_comment':
      return handlePostComment(req, res);
    case 'search':
      return handleSearch(req, res);
    default:
      return res.status(400).json({ error: 'Invalid operation' });
  }
}
```

### **2. Use Edge Functions (Alternative)**
- Edge functions have different limits
- Faster cold start
- Better for simple operations

### **3. Implement Caching**
```javascript
// Add caching to reduce API calls
const cache = new Map();

export default async function handler(req, res) {
  const cacheKey = JSON.stringify(req.body);
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  // Your logic here
  const result = await yourLogic();
  cache.set(cacheKey, result);
  
  return res.json(result);
}
```

## 📈 **Current Usage Analysis**

### **Essential Functions (Must Keep):**
1. `login-supabase.js` - Core authentication
2. `register.js` - User registration
3. `logout.js` - Session management
4. `ai-generate-comment-supabase.js` - Main extension feature

### **Optional Functions (Can Remove):**
- Twitter-related functions if not using Twitter features
- `validate-token.js` if validation is handled in other functions

## 🚀 **Recommended Action Plan**

### **Step 1: Remove Deprecated Files**
```bash
# Remove these files:
rm project/api/ai-generate-comment.js  # Replaced by supabase version
```

### **Step 2: Combine Twitter Functions (Optional)**
If you need more space, combine Twitter functions into one file.

### **Step 3: Monitor Usage**
- Track function execution times
- Monitor cold start performance
- Check memory usage

## 🔧 **New Kaito AI Integration**

### **API Endpoint: `/api/kaito-yaps`**
- **Method**: GET
- **Query Parameters**: 
  - `username` (required): Twitter username
  - `duration` (optional): Time period (7d, 30d, 90d, 180d, 365d) - default: 30d
  - `topic_id` (optional): Topic identifier - default: CYSIC
  - `top_n` (optional): Number of top results (10-1000) - default: 100
- **Environment Variable**: `KAITO_API_KEY`
- **Response**: Yapping history data with engagement metrics from leaderboard

### **Usage Example:**
```javascript
// Basic request
const response = await fetch('/api/kaito-yaps?username=elonmusk');
const data = await response.json();

// With custom parameters
const params = new URLSearchParams({
  username: 'elonmusk',
  duration: '90d',
  topic_id: 'AI',
  top_n: '200'
});
const response = await fetch(`/api/kaito-yaps?${params.toString()}`);
const data = await response.json();

// Response format:
{
  "username": "elonmusk",
  "yaps": [
    {
      "id": "123456789",
      "content": "Tweet content here...",
      "timestamp": "2024-01-01T00:00:00Z",
      "likes": 1000,
      "replies": 100,
      "retweets": 50,
      "url": "https://twitter.com/elonmusk/status/123456789",
      "sentiment": "positive",
      "topics": ["technology", "space"],
      "engagement_score": 85
    }
  ],
  "total_count": 1,
  "last_updated": "2024-01-01T00:00:00Z",
  "settings": {
    "duration": "30d",
    "topic_id": "CYSIC",
    "top_n": "100"
  }
}
```

### **Extension Integration:**
The extension now displays yapping history indicators next to Twitter usernames:
- Shows summary: "📊 X yaps (Y avg likes)"
- Click to view detailed modal with full yapping history
- Caches results to improve performance
- Works on all Twitter pages (timeline, profile, etc.)

## 💡 **Alternative Solutions**

### **1. Use Supabase Edge Functions**
- Move some logic to Supabase
- Reduce Vercel function count
- Better for database operations

### **2. Use Vercel Pro**
- Upgrade to Pro for more functions
- Better performance limits
- More execution time

### **3. Hybrid Approach**
- Keep core functions on Vercel
- Move heavy operations to other services
- Use CDN for static content

## 📊 **Function Priority List**

### **High Priority (Keep):**
1. `login-supabase.js` - Authentication
2. `register.js` - User registration
3. `ai-generate-comment-supabase.js` - Core feature
4. `logout.js` - Session cleanup

### **Medium Priority:**
5. `validate-token.js` - Security
6. `twitter-generate-tweet.js` - If using Twitter
7. `oauth-twitter-callback.js` - If using Twitter OAuth

### **Low Priority (Can Remove):**
8. `twitter-me.js` - Twitter user info
9. `twitter-post-comment.js` - Twitter posting
10. `twitter-post-tweet.js` - Twitter posting
11. `twitter-search.js` - Twitter search 