import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { api } from './api';

interface Message {
    role: 'user' | 'ai';
    text: string;
}

const SUGGESTIONS = [
    "What's my current bank balance?",
    "Can you analyze my recent spends?",
    "How to build an emergency fund?",
    "Create a plan for savings.",
];

export default function ChatBot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: "Hi! I'm **Nickel AI** ✨ Your personal finance advisor.\n\nI can check your balances, analyze your spending, and help you reach your goals faster. What would you like to know today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const showSuggestions = messages.length === 1;

    useEffect(() => {
        if (open) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [messages, open]);

    const sendMessage = async (overrideText?: string) => {
        const text = (overrideText ?? input).trim();
        if (!text || loading) return;

        const userMsg: Message = { role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', text: m.text }));
            const data = await api.post('/api/chat', { message: text, history });
            setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
        } finally {
            setLoading(false);
        }
    };

    const formatText = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-body">
            {/* Chat window */}
            <div 
                className={`transition-all duration-500 ease-in-out origin-bottom-right ${
                    open ? 'scale-100 opacity-100 mb-0' : 'scale-90 opacity-0 pointer-events-none -mb-10 absolute'
                }`}
            >
                <div className="w-[380px] bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/10 border border-gray-100/50 dark:border-gray-800/50 overflow-hidden flex flex-col"
                    style={{ height: '560px' }}>
                    
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between relative overflow-hidden">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-black/10 rounded-full blur-lg"></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base tracking-wide font-heading">Nickel AI</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-indigo-100 text-xs font-medium">Online & Ready</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setOpen(false)} 
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-all relative z-10"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50 dark:bg-gray-900/30">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'ai' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}>
                                    {msg.role === 'ai' ? <Sparkles className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-gray-400" />}
                                </div>
                                <div className={`max-w-[260px] px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                                    msg.role === 'ai'
                                        ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700/50'
                                        : 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                                }`} dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                            </div>
                        ))}

                        {/* Suggestions */}
                        {showSuggestions && !loading && (
                            <div className="flex flex-col gap-2 mt-4 ml-11">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Suggested for you</p>
                                {SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(s)}
                                        className="text-left text-sm bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 px-4 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm max-w-[260px]"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} className="h-2" />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder="Ask about your finances..."
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl pl-5 pr-14 py-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className="absolute right-2 w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-700 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/25 transition-all"
                            >
                                {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative z-50 ${
                    open 
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-95' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 hover:shadow-indigo-500/40'
                }`}
            >
                {open ? <X className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
                {!open && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-950 animate-pulse" />
                )}
            </button>
        </div>
    );
}
