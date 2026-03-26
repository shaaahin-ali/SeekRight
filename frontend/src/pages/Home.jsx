import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Youtube, Loader2, CheckCircle2, History, Plus, ArrowLeft } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';

const Home = () => {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState('');
    const [url, setUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [sessionStatus, setSessionStatus] = useState(null); // PENDING, PROCESSING, COMPLETED, FAILED
    const [failureReason, setFailureReason] = useState(null);
    const [history, setHistory] = useState([]);

    // Extract YouTube video ID and return thumbnail URL
    const getYouTubeThumbnail = (youtubeUrl) => {
        try {
            const url = new URL(youtubeUrl);
            let videoId = null;
            if (url.hostname.includes('youtube.com')) {
                videoId = url.searchParams.get('v');
            } else if (url.hostname.includes('youtu.be')) {
                videoId = url.pathname.slice(1);
            }
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }
        } catch { /* ignore invalid URLs */ }
        return null;
    };

    // Check Auth on Mount
    useEffect(() => {
        const activeUser = localStorage.getItem('seekright_active_user');
        if (!activeUser) {
            navigate('/login');
            return;
        }

        // Extract username from email
        const username = activeUser.split('@')[0];
        const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
        setUserEmail(formattedName);

        // Load specific user history
        const userHistory = JSON.parse(localStorage.getItem(`seekright_history_${activeUser}`) || '[]');
        setHistory(userHistory);
    }, [navigate]);

    // Polling Effect for Processing Status
    useEffect(() => {
        let interval;
        const isProcessing = ['PENDING', 'PROCESSING', 'TRANSCRIBING', 'CHUNKING'].includes(sessionStatus);

        if (activeSessionId && isProcessing) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/session/${activeSessionId}/status`);
                    const data = await res.json();
                    setSessionStatus(data.processing_status);
                    if (data.failure_reason) {
                        setFailureReason(data.failure_reason);
                    }
                } catch (err) {
                    console.error("Failed to poll status", err);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [activeSessionId, sessionStatus]);

    const handleTranscribe = async (e) => {
        e.preventDefault();
        if (!url) return;

        setIsSubmitting(true);
        try {
            // Connect to Backend API
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject_id: 1,
                    youtube_url: url,
                    uploaded_by: 1
                })
            });

            if (!response.ok) throw new Error('Failed to create session');

            const data = await response.json();
            setActiveSessionId(data.session_id);
            setSessionStatus(data.processing_status);

            // Save to Local History
            const activeUser = localStorage.getItem('seekright_active_user');
            if (activeUser) {
                const updatedHistory = [{ session_id: data.session_id, youtube_url: url, date: new Date().toISOString() }, ...history];
                setHistory(updatedHistory);
                localStorage.setItem(`seekright_history_${activeUser}`, JSON.stringify(updatedHistory));
            }

            setUrl('');
        } catch (error) {
            console.error(error);
            alert("Failed to reach backend API. Ensure Uvicorn is running.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Top Navigation */}
            <nav style={{ height: '72px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
                <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/landing')}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-ice-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '14px' }}>SR</div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>SeekRight</span>
                        </div>
                        {/* Nav Links */}
                        <div style={{ display: 'none', gap: '24px' }} className="md-flex">
                            {['Dashboard', 'Queries', 'Analytics'].map((item, i) => (
                                <a key={i} href="#" style={{ color: i === 0 ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500, position: 'relative' }}>
                                    {item}
                                    {i === 0 && <motion.div layoutId="nav-indicator" style={{ position: 'absolute', bottom: '-26px', left: 0, right: 0, height: '2px', background: 'var(--accent-ice-blue)' }} />}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => {
                                localStorage.removeItem('seekright_active_user');
                                navigate('/login');
                            }}
                            title="Sign Out"
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-dark)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            <style>{`@media(min-width: 768px) { .md-flex { display: flex !important; } }`}</style>

            {/* Main Content Area */}
            <main className="container" style={{ flex: 1, padding: '40px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '32px', alignItems: 'start' }}>

                {/* Left Column (Stats & Chat) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '8px' }}>Welcome, <span className="text-gradient">{userEmail}</span></h1>
                        <p style={{ color: 'var(--text-muted)' }}>Analyze YouTube transcripts seamlessly.</p>
                    </motion.div>

                    {/* Activity Log / History Section */}
                    {!activeSessionId && history.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <History size={20} color="var(--accent-ice-blue)" /> Recent Transcriptions
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {history.map((item, idx) => {
                                    const thumbnail = getYouTubeThumbnail(item.youtube_url);
                                    return (
                                        <div key={idx} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                                            className="hover-bg-surface hover-border-blue"
                                            onClick={() => {
                                                setActiveSessionId(item.session_id);
                                                setSessionStatus('COMPLETED');
                                            }}
                                        >
                                            {/* YouTube Thumbnail */}
                                            {thumbnail && (
                                                <img
                                                    src={thumbnail}
                                                    alt="Video thumbnail"
                                                    style={{ width: '80px', height: '45px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            )}
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.youtube_url}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Session #{item.session_id} • {new Date(item.date).toLocaleDateString()}</div>
                                            </div>
                                            <div style={{ color: 'var(--accent-ice-blue)', fontSize: '0.85rem', fontWeight: 600, padding: '4px 8px', borderRadius: '16px', background: 'rgba(0, 210, 255, 0.1)', flexShrink: 0 }}>
                                                Query
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Chat Interface (Only shows if a session is actively completed) */}
                    <AnimatePresence>
                        {activeSessionId && sessionStatus === 'COMPLETED' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Back to Sessions Button */}
                                <button
                                    onClick={() => {
                                        setActiveSessionId(null);
                                        setSessionStatus(null);
                                        setFailureReason(null);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '8px 16px', marginBottom: '16px',
                                        borderRadius: '12px', border: '1px solid var(--glass-border)',
                                        background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-muted)',
                                        cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                                        transition: 'all 0.2s'
                                    }}
                                    className="hover-bg-surface hover-border-blue"
                                >
                                    <ArrowLeft size={16} /> Back to Sessions
                                </button>
                                <ChatInterface sessionId={activeSessionId} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column (New Session Form & Status) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '96px' }}>

                    <motion.div className="glass-panel" style={{ padding: '24px' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={20} color="var(--accent-ice-blue)" /> New Analysis
                        </h2>

                        <form onSubmit={handleTranscribe} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>YouTube URL</label>
                                <div style={{ position: 'relative' }}>
                                    <Youtube size={18} color="#ef4444" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="url"
                                        className="glass-input"
                                        placeholder="https://youtube.com/watch?v=..."
                                        style={{ paddingLeft: '44px' }}
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting || (activeSessionId && sessionStatus !== 'COMPLETED' && sessionStatus !== 'FAILED')}
                                style={{ width: '100%', height: '48px', position: 'relative' }}
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Start Transcription'}
                            </button>
                        </form>
                    </motion.div>

                    {/* Processing Status Card */}
                    <AnimatePresence>
                        {activeSessionId && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="glass-panel"
                                style={{ padding: '20px', border: sessionStatus === 'COMPLETED' ? '1px solid rgba(16, 185, 129, 0.4)' : sessionStatus === 'FAILED' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--accent-ice-blue)' }}
                            >
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Session #{activeSessionId}</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {['PENDING', 'PROCESSING', 'TRANSCRIBING', 'CHUNKING'].includes(sessionStatus) ? (
                                            <><Loader2 size={18} color="var(--accent-ice-blue)" className="animate-spin" /> {sessionStatus === 'TRANSCRIBING' ? 'Transcribing Audio...' : sessionStatus === 'CHUNKING' ? 'Generating Chunks...' : 'Extracting Audio...'}</>
                                        ) : sessionStatus === 'COMPLETED' ? (
                                            <><CheckCircle2 size={18} color="#10b981" /> Ready for Analysis</>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ color: '#ef4444' }}>⚠️ Transcription Failed</span>
                                                {failureReason && (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'normal' }}>Error: {failureReason}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {['PENDING', 'PROCESSING', 'TRANSCRIBING', 'CHUNKING'].includes(sessionStatus) && (
                                    <div style={{ width: '100%', height: '4px', background: 'var(--surface-dark)', borderRadius: '2px', overflow: 'hidden', marginTop: '16px' }}>
                                        <motion.div
                                            initial={{ width: '10%' }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 15, ease: 'linear' }}
                                            style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-ice-blue) 0%, #3b82f6 100%)' }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
    );
};

export default Home;
