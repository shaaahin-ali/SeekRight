import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Splash = () => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        // Wait a brief moment, then expand
        const expandTimer = setTimeout(() => {
            setExpanded(true);
        }, 1200);

        // After expanding and holding for a moment, navigate to Landing
        const navTimer = setTimeout(() => {
            navigate('/landing');
        }, 4000);

        return () => {
            clearTimeout(expandTimer);
            clearTimeout(navTimer);
        };
    }, [navigate]);

    return (
        <motion.div
            className="splash-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100vw',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <motion.span
                    className="text-white"
                    style={{ fontSize: '4rem', fontWeight: 700, letterSpacing: '2px', color: '#fff' }}
                    layout
                >
                    S
                </motion.span>

                <AnimatePresence>
                    {expanded && (
                        <motion.span
                            key="eek"
                            className="text-white"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                            style={{ fontSize: '4rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', color: '#fff' }}
                        >
                            eek
                        </motion.span>
                    )}
                </AnimatePresence>

                <motion.span
                    className="text-white"
                    style={{ fontSize: '4rem', fontWeight: 700, letterSpacing: '2px', color: '#fff' }}
                    layout
                >
                    R
                </motion.span>

                <AnimatePresence>
                    {expanded && (
                        <motion.span
                            key="ight"
                            className="text-white"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                            style={{ fontSize: '4rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', color: '#fff' }}
                        >
                            ight
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default Splash;
