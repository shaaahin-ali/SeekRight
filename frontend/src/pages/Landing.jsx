import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();
    const [showDetails, setShowDetails] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Simple Navigation */}
            <header className="container" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-ice-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
                        SR
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.5px' }}>SeekRight</span>
                </div>
                <div>
                    <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative' }}>

                {/* Decorative elements */}
                <motion.div
                    className="animate-pulse-glow"
                    style={{ position: 'absolute', top: '10%', right: '20%', color: 'var(--accent-ice-blue)' }}
                >
                    <Sparkles size={24} />
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '20px', background: 'rgba(0, 210, 255, 0.1)', color: 'var(--accent-ice-blue)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '24px' }}>
                        Next-Generation Search
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700, marginBottom: '24px', maxWidth: '800px', lineHeight: 1.1 }}
                >
                    Discover the truth with <span className="text-gradient">SeekRight</span>
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{ color: 'var(--text-muted)', fontSize: 'clamp(1rem, 2vw, 1.25rem)', maxWidth: '600px', marginBottom: '40px' }}
                >
                    Enterprise-grade analysis, lightning-fast queries, and actionable insights powered by cutting edge AI.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}
                >
                    <button className="btn btn-primary" onClick={() => setShowDetails(!showDetails)} style={{ height: '48px', padding: '0 32px' }}>
                        Learn More <ArrowRight size={18} />
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/login')} style={{ height: '48px', padding: '0 32px' }}>
                        Start
                    </button>
                </motion.div>

                {/* Details Section */}
                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: 20 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -20 }}
                            style={{ overflow: 'hidden', marginTop: '32px', maxWidth: '800px', textAlign: 'left' }}
                        >
                            <div className="glass-panel" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--accent-ice-blue)' }}>How SeekRight Works</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6' }}>
                                    SeekRight uses advanced AI models to seamlessly transcribe lengthy YouTube videos. Once transcribed, our intelligence engine chunks and embeddings the transcript, allowing you to ask natural language questions and get precise, sourced answers instantly.
                                </p>
                                <ul style={{ color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <li><strong>1. Ingest:</strong> Paste a YouTube URL. We extract the audio.</li>
                                    <li><strong>2. Transcribe:</strong> Our models convert speech to text with high accuracy.</li>
                                    <li><strong>3. Search & Chat:</strong> Stop watching hours of video. Just ask what you need to know.</li>
                                </ul>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feature Cards Showcase */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', width: '100%', marginTop: '80px', textAlign: 'left' }}
                >
                    {[
                        { icon: <Zap size={24} color="var(--accent-ice-blue)" />, title: 'Lightning Fast', desc: 'Real-time query processing.' },
                        { icon: <Shield size={24} color="var(--accent-ice-blue)" />, title: 'Enterprise Secure', desc: 'Bank-grade data protection.' },
                        { icon: <Sparkles size={24} color="var(--accent-ice-blue)" />, title: 'AI Powered', desc: 'Advanced language models.' }
                    ].map((feature, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 210, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {feature.icon}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{feature.title}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{feature.desc}</p>
                        </div>
                    ))}
                </motion.div>

            </main>

            <footer className="container" style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 'auto' }}>
                © {new Date().getFullYear()} SeekRight. All rights reserved.
            </footer>
        </motion.div>
    );
};

export default Landing;
