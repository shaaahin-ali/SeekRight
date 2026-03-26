import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Youtube, Loader2, CheckCircle2, History, Plus, ArrowLeft, LayoutGrid, MessageSquare, Circle } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import QueriesView from '../components/QueriesView';

// ---- History Item with async topic fetch ----
const HistoryItem = ({ item, onClick, getThumbnail }) => {
    const [summary, setSummary] = useState(null);
    const thumbnail = getThumbnail(item.youtube_url);

    useEffect(() => {
        fetch(`/api/session/${item.session_id}`)
            .then(res => res.json())
            .then(data => { if (data.summary) setSummary(data.summary); })
            .catch(() => {});
    }, [item.session_id]);

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200"
        >
            {thumbnail && (
                <img
                    src={thumbnail}
                    alt="thumb"
                    className="w-16 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10"
                    onError={e => { e.target.style.display = 'none'; }}
                />
            )}
            <div className="flex-1 overflow-hidden">
                <div className="text-sm font-medium text-white truncate">
                    {summary || <span className="text-white/30 italic">Loading title...</span>}
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                    Session #{item.session_id} · {new Date(item.date).toLocaleDateString()}
                </div>
            </div>
            <span className="text-xs text-cyan-400/80 font-medium px-2 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex-shrink-0">
                Open
            </span>
        </motion.button>
    );
};

// ---- Main Home Component ----
const Home = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState('');
    const [url, setUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [sessionStatus, setSessionStatus] = useState(null);
    const [failureReason, setFailureReason] = useState(null);
    const [history, setHistory] = useState([]);

    const getYouTubeThumbnail = (youtubeUrl) => {
        try {
            const u = new URL(youtubeUrl);
            let videoId = null;
            if (u.hostname.includes('youtube.com')) videoId = u.searchParams.get('v');
            else if (u.hostname.includes('youtu.be')) videoId = u.pathname.slice(1);
            if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        } catch { }
        return null;
    };

    // Auth guard
    useEffect(() => {
        const activeUser = localStorage.getItem('seekright_active_user');
        if (!activeUser) { navigate('/login'); return; }
        const username = activeUser.split('@')[0];
        setUserEmail(username.charAt(0).toUpperCase() + username.slice(1));
        const userHistory = JSON.parse(localStorage.getItem(`seekright_history_${activeUser}`) || '[]');
        setHistory(userHistory);
    }, [navigate]);

    // Polling effect for processing status
    useEffect(() => {
        let interval;
        const isProcessing = ['PENDING', 'PROCESSING', 'TRANSCRIBING', 'CHUNKING'].includes(sessionStatus);
        if (activeSessionId && isProcessing) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/session/${activeSessionId}/status`);
                    const data = await res.json();
                    setSessionStatus(data.processing_status);
                    if (data.failure_reason) setFailureReason(data.failure_reason);
                } catch (err) { console.error('Poll failed', err); }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [activeSessionId, sessionStatus]);

    const handleTranscribe = async (e) => {
        e.preventDefault();
        if (!url) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject_id: 1, youtube_url: url, uploaded_by: 1 })
            });
            if (!response.ok) throw new Error('Failed to create session');
            const data = await response.json();
            setActiveSessionId(data.session_id);
            setSessionStatus(data.processing_status);
            const activeUser = localStorage.getItem('seekright_active_user');
            if (activeUser) {
                const updated = [{ session_id: data.session_id, youtube_url: url, date: new Date().toISOString() }, ...history];
                setHistory(updated);
                localStorage.setItem(`seekright_history_${activeUser}`, JSON.stringify(updated));
            }
            setUrl('');
        } catch (error) {
            console.error(error);
            alert('Failed to reach backend API. Ensure Uvicorn is running.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isProcessing = ['PENDING', 'PROCESSING', 'TRANSCRIBING', 'CHUNKING'].includes(sessionStatus);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-[#030303] text-white font-['Inter',sans-serif] flex flex-col"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* Ambient Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/[0.04] rounded-full blur-3xl" />
            </div>

            {/* ---- NAV ---- */}
            <nav className="sticky top-0 z-50 h-16 border-b border-white/[0.06] bg-[#030303]/80 backdrop-blur-xl flex items-center">
                <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <button onClick={() => navigate('/landing')} className="flex items-center gap-2 group">
                            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs group-hover:bg-white/15 transition-all">SR</div>
                            <span className="font-semibold text-base tracking-tight">SeekRight</span>
                        </button>

                        {/* Nav Tabs */}
                        <div className="hidden md:flex items-center gap-1">
                            {[
                                { label: 'Dashboard', icon: <LayoutGrid size={14} /> },
                                { label: 'Queries', icon: <MessageSquare size={14} /> }
                            ].map(({ label, icon }) => (
                                <button
                                    key={label}
                                    onClick={() => setActiveTab(label)}
                                    className={`relative flex items-center gap-1.5 px-4 py-2 text-sm rounded-full transition-all duration-200 ${activeTab === label ? 'bg-white/10 text-white border border-white/15' : 'text-white/50 hover:text-white/80'}`}
                                >
                                    {icon} {label}
                                    {activeTab === label && (
                                        <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]">
                            <Circle size={6} className="fill-emerald-400 text-emerald-400" />
                            <span className="text-xs text-white/60">{userEmail}</span>
                        </div>
                        <button
                            onClick={() => { localStorage.removeItem('seekright_active_user'); navigate('/login'); }}
                            title="Sign Out"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20 transition-all text-xs"
                        >
                            <LogOut size={13} /> Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* ---- MAIN CONTENT ---- */}
            <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'Dashboard' ? (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start"
                        >
                            {/* ---- LEFT COLUMN ---- */}
                            <div className="flex flex-col gap-6">
                                {/* Welcome header */}
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">
                                        Welcome back,{' '}
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-rose-300">
                                            {userEmail}
                                        </span>
                                    </h1>
                                    <p className="text-white/40 mt-1 text-sm">Analyze YouTube transcripts seamlessly.</p>
                                </div>

                                {/* Recent Transcriptions */}
                                {!activeSessionId && history.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                                    >
                                        <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
                                            <History size={16} className="text-cyan-400" />
                                            Recent Transcriptions
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            {history.map((item, idx) => (
                                                <HistoryItem
                                                    key={idx}
                                                    item={item}
                                                    onClick={() => { setActiveSessionId(item.session_id); setSessionStatus('COMPLETED'); }}
                                                    getThumbnail={getYouTubeThumbnail}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Empty state */}
                                {!activeSessionId && history.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="rounded-2xl border border-dashed border-white/10 p-12 text-center"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                                            <Youtube size={22} className="text-white/30" />
                                        </div>
                                        <p className="text-white/40 text-sm">Paste a YouTube URL to get started.</p>
                                    </motion.div>
                                )}

                                {/* Chat Interface */}
                                <AnimatePresence>
                                    {activeSessionId && sessionStatus === 'COMPLETED' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <button
                                                onClick={() => { setActiveSessionId(null); setSessionStatus(null); setFailureReason(null); }}
                                                className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-4 transition-colors"
                                            >
                                                <ArrowLeft size={14} /> Back to Sessions
                                            </button>
                                            <ChatInterface key={activeSessionId} sessionId={activeSessionId} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* ---- RIGHT COLUMN ---- */}
                            <div className="flex flex-col gap-4 xl:sticky xl:top-24">

                                {/* New Analysis Form */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                                >
                                    <h2 className="flex items-center gap-2 text-base font-semibold mb-4">
                                        <Plus size={16} className="text-cyan-400" /> New Analysis
                                    </h2>
                                    <form onSubmit={handleTranscribe} className="flex flex-col gap-3">
                                        <div>
                                            <label className="text-xs text-white/40 mb-2 block">YouTube URL</label>
                                            <div className="relative">
                                                <Youtube size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />
                                                <input
                                                    type="url"
                                                    placeholder="https://youtube.com/watch?v=..."
                                                    value={url}
                                                    onChange={e => setUrl(e.target.value)}
                                                    required
                                                    className="w-full bg-white/5 text-white border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder-white/20 focus:outline-none focus:border-white/25 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || (activeSessionId && isProcessing)}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Processing...</> : 'Start Transcription'}
                                        </button>
                                    </form>
                                </motion.div>

                                {/* Processing Status Card */}
                                <AnimatePresence>
                                    {activeSessionId && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={`rounded-2xl border p-4 ${sessionStatus === 'COMPLETED' ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : sessionStatus === 'FAILED' ? 'border-red-500/30 bg-red-500/[0.04]' : 'border-cyan-400/30 bg-cyan-400/[0.04]'}`}
                                        >
                                            <div className="text-xs text-white/30 mb-2">Session #{activeSessionId}</div>
                                            <div className="flex items-center gap-2 font-medium text-sm">
                                                {isProcessing ? (
                                                    <><Loader2 size={15} className="animate-spin text-cyan-400" />
                                                        <span className="text-cyan-400">
                                                            {sessionStatus === 'TRANSCRIBING' ? 'Transcribing Audio...' : sessionStatus === 'CHUNKING' ? 'Generating Chunks...' : 'Extracting Audio...'}
                                                        </span>
                                                    </>
                                                ) : sessionStatus === 'COMPLETED' ? (
                                                    <><CheckCircle2 size={15} className="text-emerald-400" /><span className="text-emerald-400">Ready for Analysis</span></>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-red-400">⚠ Transcription Failed</span>
                                                        {failureReason && <span className="text-white/40 text-xs font-normal">{failureReason}</span>}
                                                    </div>
                                                )}
                                            </div>
                                            {isProcessing && (
                                                <div className="mt-3 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: '8%' }}
                                                        animate={{ width: '95%' }}
                                                        transition={{ duration: 18, ease: 'linear' }}
                                                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                                    />
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="queries"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <QueriesView
                                history={history}
                                onSelectSession={(sessionId) => {
                                    setActiveSessionId(sessionId);
                                    setSessionStatus('COMPLETED');
                                    setActiveTab('Dashboard');
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </motion.div>
    );
};

export default Home;
