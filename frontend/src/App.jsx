import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Pages

import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';

// App.css removed as we rely on index.css
// Create a wrapper for animated routes
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* Global Background Elements */}
      <div className="bg-orb" style={{ top: '-10%', left: '-10%', width: '40vw', height: '40vw' }}></div>
      <div className="bg-orb" style={{ bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', opacity: 0.5 }}></div>
      
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
