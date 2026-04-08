import React from 'react';
import { motion } from 'framer-motion';
import { Circle, Youtube, Brain, FileText, Zap, MessageSquare, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TeamSection from '../components/TeamSection';

// ---------- ElegantShape ----------
function ElegantShape({ className, delay = 0, width = 400, height = 100, rotate = 0, gradient = 'from-white/[0.08]' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
            animate={{ opacity: 1, y: 0, rotate: rotate }}
            transition={{ duration: 2.4, delay, ease: [0.23, 0.86, 0.39, 0.96], opacity: { duration: 1.2 } }}
            className={`absolute ${className}`}
        >
            <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width, height }}
                className="relative"
            >
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r to-transparent ${gradient} backdrop-blur-[2px] border-2 border-white/[0.15] shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]`} />
            </motion.div>
        </motion.div>
    );
}

// ---------- Bento Grid ----------
const seekrightFeatures = [
    {
        title: 'YouTube Transcription',
        meta: 'AI-powered',
        description: 'Automatically transcribes any YouTube video in seconds using cutting-edge speech recognition.',
        icon: <Youtube className="w-4 h-4 text-red-400" />,
        status: 'Live',
        tags: ['Whisper AI', 'Auto'],
        colSpan: 2,
        hasPersistentHover: true,
    },
    {
        title: 'Smart Q&A',
        meta: 'Context-aware',
        description: 'Ask questions about your video and get precise answers sourced directly from the transcript.',
        icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
        status: 'Active',
        tags: ['LLM', 'RAG'],
    },
    {
        title: 'AI Summaries',
        meta: 'Instant',
        description: 'Get a crisp, one-line topic summary generated automatically for every transcription.',
        icon: <Brain className="w-4 h-4 text-purple-400" />,
        status: 'Active',
        tags: ['GPT', 'Auto'],
    },
    {
        title: 'Full Transcript Access',
        meta: 'Export ready',
        description: 'Access the complete raw transcript for in-depth study, search, and downloading.',
        icon: <FileText className="w-4 h-4 text-emerald-400" />,
        status: 'Live',
        tags: ['Export', 'Search'],
        colSpan: 2,
    },
    {
        title: 'Session History',
        meta: 'Persistent',
        description: 'All your sessions, queries and answers are stored and accessible anytime.',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        status: 'Live',
        tags: ['Storage', 'History'],
    },
];

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

function BentoGrid({ items }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 max-w-5xl mx-auto w-full">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={cn(
                        'group relative p-5 rounded-xl overflow-hidden transition-all duration-300',
                        'border border-white/10 bg-white/[0.03]',
                        'hover:shadow-[0_2px_20px_rgba(255,255,255,0.05)]',
                        'hover:-translate-y-0.5 will-change-transform',
                        item.colSpan === 2 ? 'md:col-span-2' : 'col-span-1',
                        item.hasPersistentHover ? 'shadow-[0_2px_20px_rgba(0,210,255,0.08)] border-white/20' : ''
                    )}
                >
                    <div className={`absolute inset-0 ${item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
                    </div>

                    <div className="relative flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 group-hover:bg-white/15 transition-all duration-300">
                                {item.icon}
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-white/10 text-gray-300 transition-colors duration-300 group-hover:bg-white/20">
                                {item.status || 'Active'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white tracking-tight text-[15px]">
                                {item.title} <span className="ml-1 text-xs text-gray-500 font-normal">{item.meta}</span>
                            </h3>
                            <p className="text-sm text-gray-400 leading-snug mt-1">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                {item.tags?.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-all duration-200">#{tag}</span>
                                ))}
                            </div>
                            <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Explore →</span>
                        </div>
                    </div>

                    <div className={`absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-white/5 to-transparent ${item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300`} />
                </div>
            ))}
        </div>
    );
}

// ---------- Main Landing Page ----------
export default function Landing() {
    const navigate = useNavigate();

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 1, delay: 0.5 + i * 0.2, ease: [0.25, 0.4, 0.25, 1] },
        }),
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#030303] text-white font-['Inter',sans-serif]">

            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl pointer-events-none" />

            {/* Floating Shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <ElegantShape delay={0.3} width={600} height={140} rotate={12} gradient="from-indigo-500/[0.15]" className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]" />
                <ElegantShape delay={0.5} width={500} height={120} rotate={-15} gradient="from-rose-500/[0.15]" className="right-[-5%] md:right-[0%] top-[60%] md:top-[65%]" />
                <ElegantShape delay={0.4} width={300} height={80} rotate={-8} gradient="from-violet-500/[0.15]" className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]" />
                <ElegantShape delay={0.6} width={200} height={60} rotate={20} gradient="from-amber-500/[0.15]" className="right-[15%] md:right-[20%] top-[10%] md:top-[12%]" />
                <ElegantShape delay={0.7} width={150} height={40} rotate={-25} gradient="from-cyan-500/[0.15]" className="left-[20%] md:left-[25%] top-[5%] md:top-[8%]" />
            </div>

            {/* Top gradient fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />

            {/* ---- NAV ---- */}
            <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm">SR</div>
                    <span className="font-semibold text-lg tracking-tight">SeekRight</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 text-sm border border-white/15 bg-white/5 text-gray-300 rounded-full hover:border-white/40 hover:text-white transition-all duration-200">
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 text-sm font-semibold text-black bg-white rounded-full hover:bg-white/90 transition-all duration-200">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* ---- HERO ---- */}
            <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 md:px-6 pt-24 pb-16">
                <motion.div
                    custom={0}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8"
                >
                    <Circle className="h-2 w-2 fill-rose-500/80" />
                    <span className="text-sm text-white/60 tracking-wide">AI-Powered Video Intelligence</span>
                </motion.div>

                <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                            SeekRight
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
                            Know Every Word
                        </span>
                    </h1>
                </motion.div>

                <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible">
                    <p className="text-base sm:text-lg md:text-xl text-white/40 mb-10 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
                        Transcribe any YouTube video, ask questions, and extract knowledge in seconds with the power of AI.
                    </p>
                </motion.div>

                <motion.div custom={3} variants={fadeUpVariants} initial="hidden" animate="visible" className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <Play size={16} className="fill-black" /> Start Analyzing
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-7 py-3 rounded-full border border-white/15 text-white/70 text-sm hover:border-white/30 hover:text-white transition-all duration-200">
                        Learn More
                    </button>
                </motion.div>
            </section>

            {/* ---- FEATURES BENTO ---- */}
            <section className="relative z-10 flex flex-col items-center px-4 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6, duration: 0.8 }}
                    className="text-center mb-10"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                        Everything You Need to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-rose-300">Understand Any Video</span>
                    </h2>
                    <p className="text-white/40 text-sm max-w-md mx-auto">From raw audio to structured knowledge — all automated.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.9, duration: 0.8 }}
                    className="w-full"
                >
                    <BentoGrid items={seekrightFeatures} />
                </motion.div>
            </section>

            {/* ---- CREATORS / TEAM ---- */}
            <TeamSection />

            {/* ---- FOOTER ---- */}
            <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center">
                <p className="text-white/20 text-xs">© 2026 SeekRight · Built with ❤️ by the SeekRight Team</p>
            </footer>

        </div>
    );
}
