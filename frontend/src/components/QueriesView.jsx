import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, LayoutTemplate, Clock, ChevronRight } from 'lucide-react';

const QueriesView = ({ history, onSelectSession }) => {
    const [queries, setQueries] = useState([]);

    useEffect(() => {
        const allQueries = [];
        // Iterate through all sessions in history
        history.forEach(session => {
            const chatKey = `seekright_chat_${session.session_id}`;
            const chatData = localStorage.getItem(chatKey);
            if (chatData) {
                try {
                    const messages = JSON.parse(chatData);
                    // Filter user messages
                    const userMessages = messages.filter(msg => msg.role === 'user');
                    userMessages.forEach(msg => {
                        allQueries.push({
                            session_id: session.session_id,
                            youtube_url: session.youtube_url,
                            date: session.date, // You could get the query timestamp if you added it in the chat, else fallback to session date
                            content: msg.content
                        });
                    });
                } catch (e) {
                    console.error("Failed to parse chat data for session", session.session_id);
                }
            }
        });

        // Optionally sort queries by date or keep session order (history is newest first)
        setQueries(allQueries);
    }, [history]);

    return (
        <main className="container" style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '8px' }}>Your <span className="text-gradient">Past Queries</span></h1>
                <p style={{ color: 'var(--text-muted)' }}>Review all the questions you've asked across your transcribed sessions.</p>
            </motion.div>

            {queries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>No Queries Found</h3>
                    <p style={{ color: 'var(--text-muted)' }}>You haven't asked any questions yet. Start a session and chat with SeekRight!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {queries.map((q, i) => {
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: i * 0.05 }}
                                key={i}
                                onClick={() => onSelectSession(q.session_id)}
                                style={{ 
                                    padding: '24px', 
                                    borderRadius: '16px', 
                                    background: 'rgba(255, 255, 255, 0.03)', 
                                    border: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                className="hover-bg-surface hover-border-blue"
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                                    <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.5 }}>
                                        "{q.content}"
                                    </div>
                                </div>
                                
                                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '8px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <LayoutTemplate size={14} color="var(--accent-ice-blue)" />
                                        <span style={{ 
                                            whiteSpace: 'nowrap', 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis' 
                                        }}>
                                            {q.youtube_url}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={12} />
                                            {new Date(q.date).toLocaleDateString()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-ice-blue)' }}>
                                            Session #{q.session_id} <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </main>
    );
};

export default QueriesView;
