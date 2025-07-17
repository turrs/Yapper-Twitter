import React from 'react';
import { MessageSquare, PlayCircle, Bot } from 'lucide-react';

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

interface TweetListProps {
  tweets: Tweet[];
  isGenerating: boolean;
  selectedTweet: string | null;
  onGenerateComment: (tweetId: string) => void;
  onAutoCommentAll: () => void;
}

const TweetList: React.FC<TweetListProps> = ({
  tweets,
  isGenerating,
  selectedTweet,
  onGenerateComment,
  onAutoCommentAll,
}) => {
  if (!tweets.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center">
          <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
          Real Tweets ({tweets.length})
        </h2>
        <button
          onClick={onAutoCommentAll}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          Auto Comment All
        </button>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {tweets.map((tweet) => (
          <div key={tweet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <img src={tweet.avatar} alt={tweet.username} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">{tweet.username}</span>
                  <span className="text-gray-500">{tweet.handle}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-500">{tweet.timestamp}</span>
                </div>
                <p className="text-gray-800 mb-3">{tweet.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span>❤️ {tweet.likes.toLocaleString()}</span>
                  <span>🔄 {tweet.retweets}</span>
                  <span>💬 {tweet.replies}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onGenerateComment(tweet.id)}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGenerating && selectedTweet === tweet.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        Generate Comment
                      </>
                    )}
                  </button>
                  <a
                    href={tweet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    View Tweet
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TweetList;
