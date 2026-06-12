import { useState, useRef, useEffect, FormEvent } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BarChart3,
  TrendingUp,
  HelpCircle,
  Loader,
  Copy,
  Check,
} from 'lucide-react';
import { classNames } from '../utils/helpers';
import type { Dataset, ChatMessage } from '../types';
import ChartVisualization from './ChartVisualization';
import { sampleQueries } from '../utils/helpers';

interface AIChatProps {
  dataset: Dataset;
  data: Record<string, unknown>[];
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function AIChat({ dataset, messages, onSendMessage, isLoading }: AIChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleSampleQuery = (query: string) => {
    if (!isLoading) {
      onSendMessage(query);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Chat</h1>
            <p className="text-secondary-400 mt-1">
              Ask questions about your data in natural language
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-500/20 rounded-full">
            <Sparkles className="w-4 h-4 text-accent-400" />
            <span className="text-xs text-accent-400 font-medium">AI-Powered</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-secondary-900/50 rounded-xl border border-secondary-800 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-white font-medium mb-2">Start a conversation</h3>
            <p className="text-secondary-400 text-sm text-center max-w-md mb-6">
              Ask questions about your data and I will analyze it to provide insights,
              visualizations, and recommendations.
            </p>

            {/* Column Suggestions */}
            <div className="w-full max-w-lg">
              <p className="text-secondary-500 text-xs mb-2">Available columns:</p>
              <div className="flex flex-wrap gap-2">
                {dataset.columns.slice(0, 8).map((col) => (
                  <span
                    key={col.name}
                    className="px-2 py-1 bg-secondary-800 rounded text-xs text-secondary-300"
                  >
                    {col.name}
                  </span>
                ))}
                {dataset.columns.length > 8 && (
                  <span className="px-2 py-1 text-secondary-500 text-xs">
                    +{dataset.columns.length - 8} more
                  </span>
                )}
              </div>
            </div>

            {/* Sample Queries */}
            <div className="w-full max-w-lg mt-6">
              <p className="text-secondary-500 text-xs mb-2">Try asking:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleQueries.slice(0, 4).map((query, i) => (
                  <button
                    key={i}
                    onClick={() => handleSampleQuery(query)}
                    className="text-left px-3 py-2 bg-secondary-800 rounded-lg text-secondary-300 text-sm hover:bg-secondary-700 hover:text-white transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-400" />
                </div>
                <div className="flex-1 bg-secondary-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Loader className="w-4 h-4 text-primary-400 animate-spin" />
                    <span className="text-secondary-400 text-sm">Analyzing your question...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex-shrink-0">
        <div className="relative flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            disabled={isLoading}
            className="flex-1 pl-4 pr-12 py-3 bg-secondary-900 border border-secondary-700 rounded-xl text-white placeholder-secondary-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={classNames(
              'absolute right-2 p-2 rounded-lg transition-all',
              input.trim() && !isLoading
                ? 'bg-primary-600 text-white hover:bg-primary-500'
                : 'bg-secondary-800 text-secondary-500 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => handleSampleQuery('Show summary statistics')}
            className="flex-shrink-0 px-3 py-1.5 bg-secondary-800 rounded-lg text-secondary-300 text-xs hover:bg-secondary-700 transition-colors"
          >
            <BarChart3 className="w-3 h-3 inline mr-1" />
            Summary
          </button>
          <button
            type="button"
            onClick={() => handleSampleQuery('Show trends over time')}
            className="flex-shrink-0 px-3 py-1.5 bg-secondary-800 rounded-lg text-secondary-300 text-xs hover:bg-secondary-700 transition-colors"
          >
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Trends
          </button>
          <button
            type="button"
            onClick={() => handleSampleQuery('What are the key insights?')}
            className="flex-shrink-0 px-3 py-1.5 bg-secondary-800 rounded-lg text-secondary-300 text-xs hover:bg-secondary-700 transition-colors"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            Insights
          </button>
          <button
            type="button"
            onClick={() => handleSampleQuery('Help me understand my data')}
            className="flex-shrink-0 px-3 py-1.5 bg-secondary-800 rounded-lg text-secondary-300 text-xs hover:bg-secondary-700 transition-colors"
          >
            <HelpCircle className="w-3 h-3 inline mr-1" />
            Help
          </button>
        </div>
      </form>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  data?: Record<string, unknown>[];
  dataset?: Dataset;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={classNames('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : '')}>
      <div
        className={classNames(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          message.role === 'user' ? 'bg-accent-500/20' : 'bg-primary-500/20'
        )}
      >
        {message.role === 'user' ? (
          <User className="w-4 h-4 text-accent-400" />
        ) : (
          <Bot className="w-4 h-4 text-primary-400" />
        )}
      </div>

      <div
        className={classNames(
          'flex-1 max-w-[85%] rounded-xl p-4',
          message.role === 'user'
            ? 'bg-accent-600/20 border border-accent-600/30'
            : 'bg-secondary-800 border border-secondary-700'
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
          {message.role === 'assistant' && (
            <button
              onClick={handleCopy}
              className="flex-shrink-0 ml-2 p-1 rounded hover:bg-secondary-700 text-secondary-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Chart Visualization */}
        {message.role === 'assistant' && message.chart_config && (
          <div className="mt-4">
            <ChartVisualization config={message.chart_config} />
          </div>
        )}

        {/* Query Result */}
        {message.role === 'assistant' && message.query_result && (
          <div className="mt-4 p-3 bg-secondary-900 rounded-lg">
            <p className="text-xs text-secondary-500 mb-2">Query Result</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-secondary-700">
                    {Object.keys(message.query_result[0] || {}).map((key) => (
                      <th key={key} className="px-2 py-1 text-left text-secondary-400 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(message.query_result)
                    ? message.query_result.slice(0, 5)
                    : [message.query_result]
                  ).map((row: Record<string, unknown>, i: number) => (
                    <tr key={i} className="border-b border-secondary-800">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-2 py-1 text-secondary-300">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {message.execution_time_ms && (
          <p className="text-xs text-secondary-500 mt-2">
            Executed in {message.execution_time_ms}ms
          </p>
        )}
      </div>
    </div>
  );
}
