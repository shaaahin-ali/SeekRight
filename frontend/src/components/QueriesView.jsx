import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ExternalLink, ChevronRight, Trash2 } from 'lucide-react';

const QueriesView = ({ history, onSelectSession, onDeleteSession }) => {
    const [sessionsWithQueries, setSessionsWithQueries] = useState([]);

    useEffect(() => {
        const grouped = [];
        const activeUser = localStorage.getItem('seekright_active_user') || 'default';
        for (const session of history) {
            const chatKey = `seekright_chat_${activeUser}_${session.session_id}`;
            const chatData = localStorage.getItem(chatKey);
            if (chatData) {
                try {
                    const messages = JSON.parse(chatData);
                    const real = messages.filter(m => m.content && !m.content.startsWith('Transcription complete!') && !m.content.startsWith('Analysis complete!'));
                    if (real.length > 0) {
                        const qaPairs = [];
                        for (let i = 0; i < real.length; i++) {
                            if (real[i].role === 'user') {
                                const q = real[i].content;
                                let a = 'No response.';
                                if (i + 1 < real.length && real[i + 1].role === 'assistant') { a = real[i + 1].content; i++; }
                                qaPairs.push({ question: q, answer: a });
                            }
                        }
                        if (qaPairs.length > 0) {
                            grouped.push({ session_id: session.session_id, youtube_url: session.youtube_url, summary: session.youtube_url, date: session.date, qaPairs });
                        }
                    }
                } catch (e) { }
            }
        }
        setSessionsWithQueries(grouped);

        // Async background summary fetch
        grouped.forEach(async (g) => {
            try {
                const res = await fetch(`/api/session/${g.session_id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.summary) {
                        setSessionsWithQueries(prev => prev.map(s => s.session_id === g.session_id ? { ...s, summary: data.summary } : s));
                    }
                }
            } catch (e) { }
        });
    }, [history]);

    return (
        <div className="flex flex-col gap-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 className="text-3xl font-bold tracking-tight">
                    Your{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-rose-300">
                        Past Queries
                    </span>
                </h1>
                <p className="text-white/40 mt-1 text-sm">Review your questions grouped by video session.</p>
            </motion.div>

            {/* Empty State */}
            {sessionsWithQueries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={22} className="text-white/30" />
                    </div>
                    <h3 className="text-base font-medium text-white/60 mb-1">No queries yet</h3>
                    <p className="text-sm text-white/30">Start a session and ask questions to see your history here.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {sessionsWithQueries.map((sg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.4 }}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
                        >
                            {/* Session Header */}
                            <div className="flex items-center justify-between gap-4 p-5 border-b border-white/[0.06]">
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-semibold text-white text-base truncate">{sg.summary}</div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <ExternalLink size={11} className="text-cyan-400/60 flex-shrink-0" />
                                        <span className="text-xs text-white/30 truncate">{sg.youtube_url}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => onDeleteSession(sg.session_id)}
                                        className="p-2.5 rounded-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        title="Delete Postcard"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => onSelectSession(sg.session_id)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all flex-shrink-0"
                                    >
                                        Resume <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Questions list */}
                            <div className="flex flex-col divide-y divide-white/[0.04]">
                                {sg.qaPairs.map((qa, j) => (
                                    <div key={j} className="flex items-start gap-3 px-5 py-3">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 flex-shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-white/40">Q</span>
                                        </div>
                                        <p className="text-sm text-white/70 leading-relaxed">{qa.question}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QueriesView;
