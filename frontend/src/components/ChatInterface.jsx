import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Sparkles, BookOpen, Activity, Play, FileText } from 'lucide-react';

const WELCOME_MESSAGE = {
    role: 'assistant',
    content: 'Transcription complete! Ask me any questions about this session.',
    sources: []
};

const ChatInterface = ({ sessionId }) => {
    const [messages, setMessages] = useState(() => {
        if (sessionId) {
            try {
                const activeUser = localStorage.getItem('seekright_active_user') || 'default';
                const saved = localStorage.getItem(`seekright_chat_${activeUser}_${sessionId}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch(e) {}
        }
        return [WELCOME_MESSAGE];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionDetails, setSessionDetails] = useState(null);
    const messagesEndRef = useRef(null);
    const prevSessionIdRef = useRef(sessionId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        if (sessionId && messages.length > 0) {
            const activeUser = localStorage.getItem('seekright_active_user') || 'default';
            const storageKey = `seekright_chat_${activeUser}_${sessionId}`;
            try {
                localStorage.setItem(storageKey, JSON.stringify(messages));
            } catch (e) {
                console.warn('Failed to save chat history:', e);
            }
        }
    }, [messages, sessionId]);

    // Fetch session details for Summary, FAQs, and Links
    useEffect(() => {
        if (!sessionId) return;

        const fetchDetails = async () => {
            try {
                const res = await fetch(`/api/session/${sessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSessionDetails(data);
                    
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        // Safely update the welcome message summary if it's still the first message
                        if (newMsgs.length > 0 && newMsgs[0].role === 'assistant' && (newMsgs[0].content === WELCOME_MESSAGE.content || newMsgs[0].content.includes('Analysis complete!'))) {
                            if (data.summary) {
                                let parsedFaqs = [];
                                try { parsedFaqs = data.faqs ? JSON.parse(data.faqs) : []; } catch(e) {}
                                newMsgs[0] = {
                                    ...newMsgs[0],
                                    content: `Analysis complete! Here is a perfect, concise summary of the video:\n\n${data.summary}\n\nAsk me any questions below!`,
                                    faqs: parsedFaqs
                                };
                            }
                        }
                        return newMsgs;
                    });
                }
            } catch (err) {
                console.error("Failed to fetch session details", err);
            }
        };
        fetchDetails();
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping || !sessionId) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsTyping(true);

        try {
            // Build chat history, excluding the current message and the welcome message
            const historyForApi = messages
                .filter(m => m.role && m.content && !m.isError && m !== WELCOME_MESSAGE)
                .slice(-6); // Keep last 6 messages

            const payload = { 
                question: userMessage, 
                context_id: sessionId.toString(),
                chat_history: historyForApi.map(m => ({ role: m.role, content: m.content }))
            };

            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to query the backend');

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                sources: data.sources || []
            }]);
        } catch (error) {
            console.error("Query Error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I encountered an error while processing your question.",
                isError: true
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden', position: 'relative', borderRadius: '20px', background: 'rgba(5, 5, 5, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

            {/* Ambient Background Glow inside the chat panel */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '100px', background: 'radial-gradient(circle, rgba(0,210,255,0.05) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

            {/* Premium Header */}
            <div style={{ padding: '20px 24px', position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.8) 0%, rgba(10, 10, 10, 0) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(0, 136, 255, 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 210, 255, 0.2)', boxShadow: 'inset 0 0 12px rgba(0, 210, 255, 0.1)' }}>
                            <Activity size={20} color="var(--accent-ice-blue)" />
                        </div>
                        {/* Online Indicator */}
                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid var(--surface-dark)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.3px', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            SeekRight
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(0, 210, 255, 0.1)', color: 'var(--accent-ice-blue)', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Intelligence</span>
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                            Session Context #{sessionId}
                        </div>
                    </div>
                </div>

                {/* Video & Transcript Action Links */}
                {sessionDetails && sessionDetails.youtube_url && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <a href={sessionDetails.youtube_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', textDecoration: 'none', fontWeight: 500, border: '1px solid rgba(239, 68, 68, 0.2)', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>
                            <Play size={14} /> View Video
                        </a>
                        <a href={`/api/session/${sessionId}/transcript/raw`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500, border: '1px solid var(--glass-border)', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}>
                            <FileText size={14} /> Full Transcript
                        </a>
                    </div>
                )}
            </div>

            {/* Custom Scrollbar Styles for the Messages Area */}
            <style>{`
                .chat-scroll::-webkit-scrollbar { width: 6px; }
                .chat-scroll::-webkit-scrollbar-track { background: transparent; }
                .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
                
                .typing-dot {
                    width: 5px; height: 5px; background: var(--text-muted); border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .typing-dot:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
                    40% { transform: scale(1); opacity: 1; }
                }
            `}</style>

            {/* Messages Area */}
            <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '28px', scrollBehavior: 'smooth' }}>
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
                            style={{ display: 'flex', gap: '16px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}
                        >
                            {/* Avatar */}
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                                background: msg.role === 'user' ? 'rgba(255, 255, 255, 0.05)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: msg.role === 'user' ? 'var(--text-muted)' : 'var(--accent-ice-blue)',
                                marginBottom: '4px'
                            }}>
                                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={20} />}
                            </div>

                            {/* Bubble Content */}
                            <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    padding: '14px 18px',
                                    borderRadius: '20px',
                                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                                    borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '20px',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, rgba(0, 180, 255, 0.15) 0%, rgba(0, 120, 255, 0.05) 100%)'
                                        : 'rgba(255, 255, 255, 0.03)',
                                    border: msg.role === 'user'
                                        ? '1px solid rgba(0, 210, 255, 0.15)'
                                        : '1px solid rgba(255, 255, 255, 0.04)',
                                    color: msg.isError ? '#ef4444' : 'var(--text-main)',
                                    lineHeight: 1.6,
                                    fontSize: '0.95rem',
                                    letterSpacing: '0.2px',
                                    boxShadow: msg.role === 'user' ? '0 10px 25px -5px rgba(0, 210, 255, 0.05)' : 'none',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Glass reflection top-edge highlight */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)' }} />

                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {msg.content}
                                    </div>

                                    {/* Render FAQs if any on the welcome message */}
                                    {msg.faqs && msg.faqs.length > 0 && (
                                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Frequently Asked Questions:</div>
                                            {msg.faqs.map((faq, fidx) => (
                                                <button 
                                                    key={fidx}
                                                    onClick={() => setInput(faq)}
                                                    style={{
                                                        textAlign: 'left', padding: '10px 14px', borderRadius: '12px',
                                                        background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)',
                                                        color: 'var(--accent-ice-blue)', fontSize: '0.9rem', cursor: 'pointer',
                                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 210, 255, 0.1)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 210, 255, 0.05)'}
                                                >
                                                    <Sparkles size={14} style={{ flexShrink: 0 }} /> <span>{faq}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Sources Display */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {msg.sources.map((src, idx) => (
                                            <motion.button
                                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                                whileTap={{ scale: 0.95 }}
                                                key={idx}
                                                style={{
                                                    fontSize: '0.75rem', padding: '6px 10px', borderRadius: '12px',
                                                    background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)',
                                                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px',
                                                    cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
                                                }}>
                                                <BookOpen size={12} color="var(--accent-ice-blue)" /> <span>Source {idx + 1}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {/* Natural Typing Indicator */}
                    {isTyping && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginTop: '8px' }}>
                            <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                                <Sparkles size={20} color="var(--accent-ice-blue)" style={{ opacity: 0.6 }} />
                            </div>
                            <div style={{
                                padding: '16px 20px', borderRadius: '20px', borderBottomLeftRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.03)',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Floating Input Area */}
            <div style={{ padding: '24px', background: 'linear-gradient(0deg, rgba(5, 5, 5, 0.9) 0%, rgba(5, 5, 5, 0) 100%)', position: 'relative', zIndex: 10 }}>
                <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>

                    {/* Input Glow Effect */}
                    <div style={{ position: 'absolute', inset: '-2px', background: 'linear-gradient(90deg, rgba(0,210,255,0.1), rgba(0,0,0,0), rgba(0,210,255,0.1))', borderRadius: '30px', filter: 'blur(8px)', opacity: input.trim() ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: 'none' }} />

                    <input
                        type="text"
                        placeholder="Ask a question about the recording..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isTyping}
                        style={{
                            width: '100%',
                            padding: '16px 24px',
                            paddingRight: '60px',
                            borderRadius: '30px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-main)',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                            position: 'relative',
                            zIndex: 2
                        }}
                        onFocus={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.06)'; e.target.style.borderColor = 'rgba(0, 210, 255, 0.3)'; }}
                        onBlur={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.04)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                    />
                    <motion.button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        whileHover={input.trim() && !isTyping ? { scale: 1.05 } : {}}
                        whileTap={input.trim() && !isTyping ? { scale: 0.95 } : {}}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: 'none',
                            background: input.trim() && !isTyping ? 'var(--accent-ice-blue)' : 'rgba(255,255,255,0.05)',
                            color: input.trim() && !isTyping ? 'var(--bg-black)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                            transition: 'background 0.3s, color 0.3s',
                            zIndex: 3,
                            boxShadow: input.trim() && !isTyping ? '0 4px 15px rgba(0, 210, 255, 0.4)' : 'none'
                        }}
                    >
                        <Send size={18} style={{ marginLeft: '2px' }} />
                    </motion.button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
