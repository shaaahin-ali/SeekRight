import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles, BookOpen } from 'lucide-react';

const ChatInterface = ({ sessionId }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Transcription complete! Ask me any questions about this session.',
            sources: []
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMessage, context_id: sessionId.toString() })
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
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 210, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-ice-blue)' }}>
                    <Sparkles size={18} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>SeekRight Intelligence</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Session Context: #{sessionId}</span>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                display: 'flex',
                                gap: '16px',
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                            }}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                background: msg.role === 'user' ? 'var(--surface-dark)' : 'var(--accent-ice-blue)',
                                border: msg.role === 'user' ? '1px solid var(--glass-border)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: msg.role === 'user' ? 'var(--text-muted)' : '#000'
                            }}>
                                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                            </div>

                            <div style={{
                                maxWidth: '80%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                                    borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                                    background: msg.role === 'user' ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    border: msg.role === 'user' ? '1px solid rgba(0, 210, 255, 0.2)' : '1px solid var(--glass-border)',
                                    color: msg.isError ? '#ef4444' : 'var(--text-main)',
                                    lineHeight: 1.5,
                                    fontSize: '0.95rem'
                                }}>
                                    {msg.content}
                                </div>

                                {/* Sources Display */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {msg.sources.map((src, idx) => (
                                            <span key={idx} style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid var(--glass-border)',
                                                color: 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <BookOpen size={10} /> Source {idx + 1}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', gap: '16px' }}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-ice-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                                <Bot size={18} />
                            </div>
                            <div style={{ padding: '16px', borderRadius: '16px', borderTopLeftRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Loader2 size={16} className="animate-spin" color="var(--accent-ice-blue)" />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '8px' }}>Analyzing transcript...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', gap: '12px' }}>
                    <input
                        type="text"
                        className="glass-input"
                        placeholder="Ask about the key points inside the video..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isTyping}
                        style={{ paddingRight: '48px', borderRadius: '24px' }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: 'none',
                            background: input.trim() && !isTyping ? 'var(--accent-ice-blue)' : 'rgba(255,255,255,0.1)',
                            color: input.trim() && !isTyping ? '#000' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Send size={16} style={{ marginLeft: '2px' }} />
                    </button>
                </form>
            </div>

            <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default ChatInterface;
