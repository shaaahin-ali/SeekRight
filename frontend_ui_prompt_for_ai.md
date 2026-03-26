# SeekRight - Project Description & Frontend UI Requirements

*This document is formatted as a prompt/reference guide for an AI Assistant (e.g., Google IDX, GitHub Copilot) to generate UI components and frontend code for the SeekRight project.*

## 1. Project Overview & Goals
**SeekRight** is a startup-grade, AI-powered Retrieval-Augmented Generation (RAG) platform. The core functionality allows users to input a YouTube URL or upload media files. The backend then transcribes the audio, segments the text into semantic chunks, and stores it in a database. Finally, users can interact with an LLM to query and ask questions about the transcribed content.

**Primary Goal:** Deliver a seamless, commercial-grade, and responsive user experience that feels state-of-the-art. The application should be highly interactive, performing smooth transitions between processing states (Transcribing -> Chunking -> Completed) and providing an intuitive chat interface for querying.

## 2. Tech Stack Ecosystem
- **Core Framework:** React (via Vite)
- **Language:** JavaScript (ES6+ / JSX) or TypeScript (if refactoring)
- **Styling:** Tailwind CSS + Vanilla CSS for custom animations/variables
- **Animations:** Framer Motion (page transitions, micro-interactions)
- **Component Library Base:** Custom built (incorporating modern Radix UI primitives if necessary)
- **Routing:** React Router v7 (`react-router-dom`)

## 3. Design Aesthetics & Vibe
- **Theme:** Dark Mode by default.
- **Color Palette:** Black backgrounds with "Ice Blue" accents (e.g., `#1EAEDB`, `#38BDF8`).
- **Style Details:** 
  - Glassmorphism (translucent backgrounds with backdrop blur).
  - Soft, glowing gradients (e.g., hidden background orbs).
  - Rounded corners (`rounded-2xl`, `rounded-3xl` for cards and inputs).
  - Soft, colored box-shadows to indicate focus or active states.
- **Interactions:** Dynamic micro-animations on hover, smooth component mounting, and satisfying touch-friendly target sizes (mobile-first approach).

## 4. Required Pages & Flow
The application uses `AnimatePresence` for smooth route transitions.
1. **Splash Page (`/`)**: 
   - Initial loading screen.
   - Shows "SR" logo expanding dynamically into the full "SeekRight" wordmark.
2. **Landing Page (`/landing`)**:
   - Modern Hero section with animated shapes or typography.
   - Feature highlight cards.
   - "Start" and "Learn More" Call-to-Action (CTA) buttons routing to authentication or features.
3. **Login Page (`/login`)**:
   - Authentication form with robust email validation.
   - Elegant, glassmorphic card design.
4. **Home / Dashboard Page (`/home`)**:
   - The core workspace.
   - Shows active processing states for media ingestion.
   - **Main Component:** A prominent, highly polished AI Prompt Input Box where users paste URLs or ask questions.

## 5. UI Components Needed
*Please generate these components ensuring they strictly follow the "Design Aesthetics" outlined above.*

### A. AI Prompt Input Box (`PromptInputBox`)
- A versatile, expanding text area at the bottom or center of the dashboard.
- Features: Auto-resizing, submit button (changes to stop/loading state), attachment/upload icon for local media, and subtle glowing border when focused.

### B. Landing Hero Section (`HeroGeometric`)
- A visually striking header for the `/landing` page.
- Animated floating elements (shapes or orbs) in the background.
- Big, bold typography with a gradient text clip.

### C. Processing Status Indicators
- Visual components reflecting backend states: `PENDING`, `PROCESSING`, `TRANSCRIBING`, `CHUNKING`, `COMPLETED`, `FAILED`.
- E.g., loading spinners, progress steps, or pulsing badges.

### D. Chat / Answer Interface
- Chat bubbles for the User Query vs. the AI Response.
- Clean typography and markdown rendering for the LLM output.

## 6. Developer Instructions for Google Stitch / AI
1. **Tailwind First:** Always use Tailwind CSS utility classes over custom CSS unless building complex keyframe animations or custom scrollbars.
2. **Animations:** Liberally use `framer-motion` for `initial`, `animate`, and `exit` states on modals, pages, and dynamic lists.
3. **Responsiveness:** Test all layouts against mobile (`sm:`), tablet (`md:`), and desktop (`lg:`) Tailwind breakpoints.
4. **Modularity:** Keep components small, decoupled, and reusable. Abstract generic buttons, inputs, and dialogs into a `src/components/ui/` directory.
