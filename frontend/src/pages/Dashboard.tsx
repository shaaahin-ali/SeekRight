import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageCircle,
  ArrowUp,
  LogOut,
  Zap,
  Clock,
  ExternalLink,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const userEmail = localStorage.getItem("sr_email") || "user";

  // Session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [subjectId, setSubjectId] = useState("1");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [querying, setQuerying] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Poll session status
  useEffect(() => {
    if (!sessionId || status === "COMPLETED" || status === "FAILED") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/session/${sessionId}/status`);
        const data = await res.json();
        setStatus(data.processing_status);
        if (data.failure_reason) setFailureReason(data.failure_reason);
      } catch (err) {
        console.error("Status poll failed:", err);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [sessionId, status]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setFailureReason(null);

    try {
      const res = await fetch(`${API}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: parseInt(subjectId),
          youtube_url: url.trim(),
          uploaded_by: 1,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.session_id);
        setStatus(data.processing_status);
        setMessages([]);
      } else {
        setFailureReason(data.detail || "Failed to create session");
      }
    } catch {
      setFailureReason("Cannot reach server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !sessionId || querying) return;
    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question, timestamp: new Date() }]);
    setQuerying(true);

    try {
      const res = await fetch(`${API}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context_id: sessionId.toString() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer, sources: data.sources, timestamp: new Date() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.detail || "An error occurred.", timestamp: new Date() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Check if the backend is running.", timestamp: new Date() },
      ]);
    } finally {
      setQuerying(false);
      inputRef.current?.focus();
    }
  }, [input, sessionId, querying]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sr_token");
    localStorage.removeItem("sr_email");
    onNavigate("landing");
  };

  const handleReset = () => {
    setSessionId(null);
    setStatus(null);
    setUrl("");
    setFailureReason(null);
    setMessages([]);
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    PENDING: { color: "text-amber-400", icon: <Clock size={14} className="text-amber-400" />, label: "Pending" },
    PROCESSING: { color: "text-blue-400", icon: <Loader2 size={14} className="text-blue-400 animate-spin" />, label: "Processing" },
    TRANSCRIBING: { color: "text-indigo-400", icon: <Loader2 size={14} className="text-indigo-400 animate-spin" />, label: "Transcribing" },
    CHUNKING: { color: "text-violet-400", icon: <Loader2 size={14} className="text-violet-400 animate-spin" />, label: "Chunking" },
    COMPLETED: { color: "text-emerald-400", icon: <CheckCircle size={14} className="text-emerald-400" />, label: "Ready" },
    FAILED: { color: "text-red-400", icon: <AlertCircle size={14} className="text-red-400" />, label: "Failed" },
  };

  const currentStatus = status ? statusConfig[status] || statusConfig.PENDING : null;
  const isReady = status === "COMPLETED";

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#030303]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">
              Seek<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">Right</span>
            </h1>
            {currentStatus && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs">
                {currentStatus.icon}
                <span className={currentStatus.color}>{currentStatus.label}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 hidden sm:block">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 py-6 gap-6">
        {/* Ingestion Card */}
        <AnimatePresence mode="wait">
          {!sessionId ? (
            <motion.div
              key="ingest"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Upload size={15} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">New Session</h2>
                  <p className="text-xs text-white/40">Paste a YouTube URL to extract knowledge</p>
                </div>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none transition-colors"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Subject ID"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none transition-colors"
                  />
                </div>

                {failureReason && (
                  <div className="text-xs text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                    {failureReason}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap size={14} />}
                  {loading ? "Creating..." : "Extract Knowledge"}
                </button>
              </form>
            </motion.div>
          ) : !isReady ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentStatus?.icon}
                  <div>
                    <p className="text-sm font-medium">{currentStatus?.label || "Processing"}</p>
                    <p className="text-xs text-white/30">Session #{sessionId}</p>
                  </div>
                </div>
                {status === "FAILED" && (
                  <button onClick={handleReset} className="text-xs text-white/50 hover:text-white/80 underline transition-colors">
                    Try again
                  </button>
                )}
              </div>
              {failureReason && (
                <div className="mt-3 text-xs text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
                  {failureReason}
                </div>
              )}
              {status !== "FAILED" && (
                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      animate={{ width: ["0%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-300">Knowledge base ready</p>
                  <p className="text-xs text-white/30">Session #{sessionId} — Ask anything below</p>
                </div>
              </div>
              <button onClick={handleReset} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                New session
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat */}
        <div className="flex-1 flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden min-h-[400px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-sm text-white/30 mb-1">
                  {isReady ? "Your knowledge base is ready" : "No active session"}
                </p>
                <p className="text-xs text-white/15">
                  {isReady
                    ? "Ask anything about the video content"
                    : "Create a session above to start"}
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-white text-black rounded-br-md"
                        : "bg-white/[0.04] border border-white/[0.06] text-white/80 rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Sources</p>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.slice(0, 5).map((s, j) => (
                            <span key={j} className="text-[10px] text-white/30 bg-white/[0.04] rounded px-1.5 py-0.5">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
            {querying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: "0.15s" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.06] p-4">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isReady ? "Ask about the video..." : "Create a session first"}
                disabled={!isReady || querying}
                className="flex-1 resize-none bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/15 focus:outline-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!isReady || !input.trim() || querying}
                className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:opacity-20 disabled:cursor-not-allowed transition-all shrink-0"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
