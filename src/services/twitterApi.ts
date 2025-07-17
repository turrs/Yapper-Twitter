// Twitter API Service for real data fetching
interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url: string;
}

interface TwitterApiResponse {
  data: TwitterTweet[];
  includes?: {
    users: TwitterUser[];
  };
  meta: {
    result_count: number;
    next_token?: string;
  };
}

class TwitterApiService {
  private bearerToken: string;
  private baseUrl = 'https://api.twitter.com/2';

  constructor() {
    this.bearerToken = import.meta.env.TWITTER_BEARER_TOKEN || '';
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.bearerToken) {
      throw new Error('Twitter Bearer Token not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Twitter Bearer Token');
        } else if (response.status === 429) {
          throw new Error('Twitter API rate limit exceeded');
        } else if (response.status === 403) {
          throw new Error('Twitter API access forbidden - check your subscription');
        }
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error - check your internet connection');
      }
      throw error;
    }
  }

  async searchTweets(query: string, maxResults: number = 10): Promise<any[]> {
    const encodedQuery = encodeURIComponent(query);
    const endpoint = `/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username,profile_image_url`;
    
    try {
      const response: TwitterApiResponse = await this.makeRequest(endpoint);
      
      if (!response.data || response.data.length === 0) {
        return [];
      }

      // Map Twitter API response to our format
      return response.data.map(tweet => {
        const author = response.includes?.users?.find(user => user.id === tweet.author_id);
        
        return {
          id: tweet.id,
          username: author?.name || 'Unknown User',
          handle: `@${author?.username || 'unknown'}`,
          content: tweet.text,
          timestamp: this.formatTimestamp(tweet.created_at),
          likes: tweet.public_metrics.like_count,
          retweets: tweet.public_metrics.retweet_count,
          replies: tweet.public_metrics.reply_count,
          avatar: author?.profile_image_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop',
          url: `https://twitter.com/${author?.username}/status/${tweet.id}`
        };
      });
    } catch (error) {
      console.error('Twitter API Error:', error);
      throw error;
    }
  }

  private formatTimestamp(createdAt: string): string {
    const now = new Date();
    const tweetTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - tweetTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d`;
    }
  }

  isConfigured(): boolean {
    return !!this.bearerToken;
  }
}

export const twitterApi = new TwitterApiService();