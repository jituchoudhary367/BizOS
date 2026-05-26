import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, Paperclip, Sparkles, Plus, StopCircle,
  ShoppingCart, Package, TrendingUp, FileText, BarChart3, Phone, Truck, ClipboardList,
} from 'lucide-react';
import { useBrainStore } from '../../store/brainStore';
import { formatRelativeDate, getInitials } from '../../lib/formatters';
import { BRAIN_SUGGESTIONS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';

const ICON_MAP = { ShoppingCart, Package, TrendingUp, FileText, BarChart3, Phone, Truck, ClipboardList };

// Demo responses for when AI service is not connected
const DEMO_RESPONSES = {
  default: "I'm analyzing your business data... Based on the last 30 days, here's what I found:\n\n**Revenue**: ₹4,72,800 (↑8% vs last month)\n**Pending orders**: 4 orders worth ₹1,70,500\n**Critical alert**: Berger WeatherCoat stock will run out in 3 days\n\nWould you like me to create a purchase order for the paint?",
  "who hasn't paid": "**Overdue payments as of today:**\n\n| Customer | Amount | Days Overdue | Risk |\n|---------|--------|-------------|------|\n| Amit Traders | ₹2,10,000 | 18 days | 🔴 High |\n| Desai Infraprojects | ₹48,200 | 7 days | 🟡 Medium |\n| Rajput Plumbing | ₹28,000 | 12 days | 🔴 High |\n| Ravi Electronics | ₹8,640 | 4 days | 🟢 Low |\n\nTotal outstanding: **₹2,94,840**\n\nShould I send WhatsApp reminders to overdue customers?",
  "running low": "**Products approaching reorder level:**\n\n🔴 **Critical (< 5 units)**\n• Berger WeatherCoat 20L — 4 units (reorder: 8)\n• UltraTech Cement — 35 bags pending reorder\n\n🟡 **Warning (< 10 units)**\n• Asian Paints Apex 20L — 6 units\n• Vitrified Tiles 2x2 — 3 boxes\n\nI've prepared draft purchase orders for all critical items. Shall I send them to your suppliers?",
  "today's profit": "**Profit summary — today (May 22, 2026):**\n\n💰 Revenue: ₹1,47,200\n📦 COGS: ₹98,400\n**Gross profit: ₹48,800 (33.2% margin)**\n\nTop contributing products:\n1. UltraTech Cement — ₹18,200 gross\n2. Asian Paints — ₹14,600 gross\n3. TMT Steel — ₹9,800 gross\n\nYour margin is **4.2% above** your 30-day average. Great day! 🎉",
};

function getAIResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('paid') || lower.includes('outstanding')) return DEMO_RESPONSES["who hasn't paid"];
  if (lower.includes('low') || lower.includes('stock')) return DEMO_RESPONSES["running low"];
  if (lower.includes('profit') || lower.includes('revenue')) return DEMO_RESPONSES["today's profit"];
  return DEMO_RESPONSES.default;
}

export default function BrainPage() {
  const { conversations, messages, isStreaming, suggestedPrompts, addMessage, startNewConversation } = useBrainStore();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    addMessage({ role: 'user', content: msg });
    setIsTyping(true);

    // Simulate AI streaming
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    setIsTyping(false);

    const response = getAIResponse(msg);
    addMessage({ role: 'assistant', content: response });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem-3rem)] -m-6 overflow-hidden">
      {/* ─── Left: Conversation list ──────────────────── */}
      <div className="w-72 bg-surface-raised border-r border-surface-border flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-surface-border">
          <button
            onClick={startNewConversation}
            className="btn-primary w-full justify-center text-sm"
          >
            <Plus size={16} /> New conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-8">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface transition-colors mb-1"
              >
                <p className="text-xs font-medium text-text-primary truncate">{conv.title}</p>
                <p className="text-[11px] text-text-tertiary">{formatRelativeDate(conv.created_at)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── Right: Active conversation ───────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
            <Sparkles size={16} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">BizOS Brain</p>
            <p className="text-[11px] text-text-tertiary">Powered by Gemini 1.5 Pro + Groq</p>
          </div>
          {isStreaming && (
            <div className="ml-auto flex items-center gap-2 text-xs text-brand-400 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              Processing...
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Suggested prompts (empty state) */}
          {suggestedPrompts && messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={24} className="text-brand-400" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">What can I help you with?</h2>
                <p className="text-sm text-text-tertiary">Ask anything about your business — in Hindi, English, or Hinglish.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                {BRAIN_SUGGESTIONS.map((s, i) => {
                  const Icon = ICON_MAP[s.icon] || Sparkles;
                  return (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-center gap-3 p-4 card hover:border-brand-500/30 hover:bg-brand-500/5 text-left transition-all duration-200 group"
                    >
                      <Icon size={16} className="text-text-tertiary group-hover:text-brand-400 flex-shrink-0" />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary">{s.text}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Chat messages */}
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-raised border border-surface-border'
                }`}>
                  {msg.role === 'user'
                    ? <span className="text-xs font-medium">RS</span>
                    : <Sparkles size={14} className="text-brand-400" />
                  }
                </div>

                {/* Message bubble */}
                <div className={`flex-1 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-brand-500/15 text-text-primary rounded-br-md'
                      : 'bg-surface-raised border border-surface-border text-text-primary rounded-bl-md'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center">
                  <Sparkles size={14} className="text-brand-400" />
                </div>
                <div className="bg-surface-raised border border-surface-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="px-6 py-4 border-t border-surface-border">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 p-3 bg-surface-raised border border-surface-border rounded-2xl focus-within:border-brand-500/50 transition-colors">
              {/* Attach */}
              <button className="p-1 text-text-disabled hover:text-text-secondary transition-colors flex-shrink-0">
                <Paperclip size={18} />
              </button>

              {/* Input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your business... (Press Enter to send)"
                className="flex-1 bg-transparent text-text-primary placeholder:text-text-disabled resize-none focus:outline-none text-sm max-h-32"
                rows={1}
                style={{ height: 'auto' }}
              />

              {/* Voice */}
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={cn('p-1 flex-shrink-0 transition-colors', isRecording ? 'text-danger' : 'text-text-disabled hover:text-text-secondary')}
              >
                {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
              </button>

              {/* Send */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className="p-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[11px] text-text-disabled text-center mt-2">
              BizOS Brain can make mistakes. Verify important decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
