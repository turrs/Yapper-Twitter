# API Functions - Vercel Serverless Limit Management

## 📊 Current API Functions (12/12 limit)

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