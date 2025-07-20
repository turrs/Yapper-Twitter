# Kaito AI API Integration Setup Guide

## Overview
This guide explains how to set up and use the Kaito AI API integration for fetching yapping history of Twitter users.

## Prerequisites
1. Kaito AI API account and API key
2. Vercel deployment with environment variables configured
3. Browser extension with the new content script

## Setup Steps

### 1. Get Kaito AI API Key
1. Visit [Kaito AI](https://kaito.ai)
2. Sign up for an account
3. Navigate to API settings
4. Generate an API key
5. Copy the API key for use in environment variables

### 2. Configure Environment Variables

#### For Local Development:
Create a `.env.local` file in your project root:
```bash
KAITO_API_KEY=your_kaito_api_key_here
```

#### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add a new variable:
   - **Name**: `KAITO_API_KEY`
   - **Value**: Your Kaito AI API key
   - **Environment**: Production (and Preview if needed)

### 3. API Endpoint Details

#### Endpoint: `/api/kaito-yaps`
- **Method**: GET
- **Query Parameters**: 
  - `username` (required): Twitter username without @ symbol
  - `duration` (optional): Time period (7d, 30d, 90d, 180d, 365d) - default: 30d
  - `topic_id` (optional): Topic identifier - default: CYSIC
  - `top_n` (optional): Number of top results (10-1000) - default: 100
- **Headers**: 
  - `Authorization: Bearer {KAITO_API_KEY}`
  - `Content-Type: application/json`

#### Example Request:
```bash
# Basic request
curl "https://your-domain.vercel.app/api/kaito-yaps?username=elonmusk"

# With custom parameters
curl "https://your-domain.vercel.app/api/kaito-yaps?username=elonmusk&duration=90d&topic_id=AI&top_n=200"
```

#### Example Response:
```json
{
  "username": "elonmusk",
  "yaps": [
    {
      "id": "123456789",
      "content": "Just launched a new rocket! 🚀",
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

### 4. Browser Extension Integration

The extension automatically displays yapping history indicators next to Twitter usernames:

#### Features:
- **Automatic Detection**: Finds usernames on Twitter pages
- **Caching**: Stores results to improve performance
- **Summary Display**: Shows "📊 X yaps (Y avg likes)" next to usernames
- **Detailed Modal**: Click to view full yapping history with engagement metrics
- **Error Handling**: Gracefully handles API errors and missing data

#### How it Works:
1. Content script scans Twitter pages for usernames
2. For each username, fetches yapping data from the API
3. Displays a small indicator next to the username
4. Clicking the indicator opens a detailed modal
5. Results are cached to avoid repeated API calls

### 5. Testing

#### Test the API Endpoint:
```bash
# Test locally
curl "http://localhost:3000/api/kaito-yaps?username=elonmusk"

# Test with custom parameters
curl "http://localhost:3000/api/kaito-yaps?username=elonmusk&duration=90d&topic_id=AI&top_n=200"

# Test production
curl "https://your-domain.vercel.app/api/kaito-yaps?username=elonmusk"
```

#### Test the Extension:
1. Load the extension in Chrome
2. Navigate to Twitter/X
3. Look for yapping indicators next to usernames
4. Click on indicators to view detailed history

### 6. Troubleshooting

#### Common Issues:

**API Key Not Configured:**
```
Error: Kaito API Key not configured
```
**Solution**: Ensure `KAITO_API_KEY` is set in environment variables

**Invalid Username:**
```
Error: Missing username parameter
```
**Solution**: Provide a valid Twitter username in the query parameter

**API Rate Limits:**
```
Error: Failed to fetch yapping history
```
**Solution**: Check Kaito AI API rate limits and upgrade plan if needed

**CORS Issues:**
```
Error: CORS policy blocked request
```
**Solution**: Ensure CORS headers are properly set (already included in the API)

### 7. Performance Optimization

#### Caching Strategy:
- Results are cached in memory for the session
- Cache is cleared when page is refreshed
- Consider implementing persistent caching for better performance

#### Rate Limiting:
- Monitor API usage to stay within Kaito AI limits
- Implement request throttling if needed
- Consider batch requests for multiple usernames

### 8. Security Considerations

#### API Key Security:
- Never expose API keys in client-side code
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Monitor API usage for suspicious activity

#### Data Privacy:
- Only fetch data for publicly available usernames
- Respect Twitter's terms of service
- Implement proper error handling for private accounts

## Support

For issues with:
- **Kaito AI API**: Contact Kaito AI support
- **Extension**: Check browser console for errors
- **Deployment**: Check Vercel logs and environment variables 