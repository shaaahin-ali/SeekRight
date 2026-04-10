import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeroGeometric } from "./components/ui/shape-landing-hero";
import { SignInPage } from "./components/ui/sign-in-flow";
import Dashboard from "./pages/Dashboard";

type Page = "landing" | "signin" | "dashboard";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0 });
  };

  return (
    <AnimatePresence mode="wait">
      {currentPage === "landing" && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <HeroGeometric
            badge="AI-Powered Knowledge Retrieval"
            title1="Seek"
            title2="Right"
            description="Transform any YouTube video into a searchable knowledge base. Ask questions, get instant answers powered by AI."
            onGetStarted={() => handleNavigate("signin")}
          />
        </motion.div>
      )}

      {currentPage === "signin" && (
        <motion.div
          key="signin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <SignInPage onSuccess={() => handleNavigate("dashboard")} />
        </motion.div>
      )}

      {currentPage === "dashboard" && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Dashboard onNavigate={handleNavigate} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;
