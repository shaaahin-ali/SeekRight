import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, LayoutTemplate, Clock, ChevronRight } from 'lucide-react';

const QueriesView = ({ history, onSelectSession }) => {
    const [sessionsWithQueries, setSessionsWithQueries] = useState([]);

    useEffect(() => {
        const fetchQueries = async () => {
            const grouped = [];
            for (const session of history) {
                const chatKey = `seekright_chat_${session.session_id}`;
                const chatData = localStorage.getItem(chatKey);
                
                if (chatData) {
                    try {
                        const messages = JSON.parse(chatData);
                        const realMessages = messages.filter(m => m.content && !m.content.startsWith('Transcription complete!') && !m.content.startsWith('Analysis complete!'));
                        
                        if (realMessages.length > 0) {
                            const qaPairs = [];
                            for(let i=0; i < realMessages.length; i++) {
                                if (realMessages[i].role === 'user') {
                                    const q = realMessages[i].content;
                                    let a = "No response.";
                                    if (i + 1 < realMessages.length && realMessages[i+1].role === 'assistant') {
                                        a = realMessages[i+1].content;
                                        i++;
                                    }
                                    qaPairs.push({ question: q, answer: a });
                                }
                            }
                            
                            if (qaPairs.length > 0) {
                                // Push the group immediately using youtube_url as the placeholder summary
                                grouped.push({
                                    session_id: session.session_id,
                                    youtube_url: session.youtube_url,
                                    summary: session.youtube_url, // initial fallback to render instantly
                                    date: session.date,
                                    qaPairs: qaPairs
                                });
                            }
                        }
                    } catch(e) {}
                }
            }
            // Render immediately
            setSessionsWithQueries(grouped);

            // Fetch summaries asynchronously in the background
            grouped.forEach(async (g) => {
                try {
                    const res = await fetch(`/api/session/${g.session_id}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.summary) {
                            setSessionsWithQueries(prev => prev.map(s => 
                                s.session_id === g.session_id ? { ...s, summary: data.summary } : s
                            ));
                        }
                    }
                } catch(e) {}
            });
        };
        fetchQueries();
    }, [history]);

    return (
        <main className="container" style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '8px' }}>Your <span className="text-gradient">Past Queries</span></h1>
                <p style={{ color: 'var(--text-muted)' }}>Review your questions and answers grouped by transcribed sessions.</p>
            </motion.div>

            {sessionsWithQueries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>No Queries Found</h3>
                    <p style={{ color: 'var(--text-muted)' }}>You haven't asked any questions yet. Start a session and chat with SeekRight!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {sessionsWithQueries.map((sessionGroup, i) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: i * 0.05 }}
                            key={i}
                            style={{ 
                                padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', 
                                border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '16px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                                <div style={{ flex: 1, overflow: 'hidden', paddingRight: '20px' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{sessionGroup.summary}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        <LayoutTemplate size={14} color="var(--accent-ice-blue)" flexShrink={0} /> {sessionGroup.youtube_url}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onSelectSession(sessionGroup.session_id)}
                                    className="btn btn-primary"
                                    style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                                >
                                    Resume Session <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {sessionGroup.qaPairs.map((qa, j) => (
                                    <div key={j} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-muted)' }}>Q</div>
                                        <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '4px' }}>{qa.question}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </main>
    );
};

export default QueriesView;
