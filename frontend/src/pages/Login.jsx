import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setPasswordError('');

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address (e.g., name@gmail.com)');
            return;
        }
        setEmailError('');

        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);

            // Check LocalStorage Users mapping
            const usersMap = JSON.parse(localStorage.getItem('seekright_users') || '{}');

            if (usersMap[email]) {
                // User exists, verify password
                if (usersMap[email] === password) {
                    localStorage.setItem('seekright_active_user', email);
                    navigate('/home');
                } else {
                    setPasswordError('Incorrect password for this email.');
                }
            } else {
                // User doesn't exist, auto-create (simulating registration)
                usersMap[email] = password;
                localStorage.setItem('seekright_users', JSON.stringify(usersMap));
                localStorage.setItem('seekright_active_user', email);
                navigate('/home');
            }
        }, 1500);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                position: 'relative'
            }}
        >
            <button
                style={{ position: 'absolute', top: '24px', left: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => navigate('/landing')}
            >
                &larr; Back
            </button>

            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-ice-blue)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
                        SR
                    </div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Welcome back</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Enter your credentials to access SeekRight</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                className="glass-input"
                                placeholder="you@gmail.com"
                                style={{ paddingLeft: '44px', borderColor: emailError ? '#ef4444' : undefined }}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError('');
                                }}
                                required
                            />
                        </div>
                        <AnimatePresence>
                            {emailError && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                                    {emailError}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Password</label>
                            <a href="#" style={{ fontSize: '0.9rem', color: 'var(--accent-ice-blue)' }}>Forgot?</a>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                className="glass-input"
                                placeholder="••••••••"
                                style={{ paddingLeft: '44px', borderColor: passwordError ? '#ef4444' : undefined }}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (passwordError) setPasswordError('');
                                }}
                                required
                            />
                        </div>
                        <AnimatePresence>
                            {passwordError && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>
                                    {passwordError}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '12px', height: '48px', position: 'relative' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%' }}
                            />
                        ) : (
                            <>Sign In <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <a href="#" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Request access</a>
                </div>
            </div>
        </motion.div>
    );
};

export default Login;
