// Proxy service for CORS bypass
class ProxyService {
  private proxyUrl: string;

  constructor() {
    // Default ke backend Express lokal
    this.proxyUrl = import.meta.env.VITE_URL_BACKEND;
  }

  async searchTweetsViaProxy(query: string, maxResults: number = 10): Promise<any[]> {
    // Tidak perlu Bearer Token di frontend, cukup kirim ke backend
    const params = new URLSearchParams({ query, max_results: String(maxResults) });
    try {
      const response = await fetch(`${this.proxyUrl}/api/twitter-search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status}`);
      }
      const data = await response.json();
      if (!data.data || data.data.length === 0) {
        return [];
      }
      return data.data; // langsung return array tweet hasil mapping backend
    } catch (error) {
      console.error('Proxy API Error:', error);
      throw new Error('Failed to fetch tweets via proxy. Try a different method.');
    }
  }

  async generateCommentViaProxy(tweet: string): Promise<any> {
    try {
      const response = await fetch(`${this.proxyUrl}/api/ai-generate-comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tweet }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Proxy AI comment generation failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Proxy API Error:', error);
      throw new Error('Failed to generate comment via proxy.');
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
}

export const proxyService = new ProxyService();

// This is a new file to initialize and export the Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);