import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Marquee } from './ui/Marquee';
import { Users } from 'lucide-react';

const teamMembers = [
  {
    image: '/team/swavab.jpeg',
    name: 'Swavab V',
    role: 'Database Engineer',
    description: "Architect of SeekRight's high-concurrency SQLite layer with WAL mode, atomic transactions and robust state-machine schema.",
    badge: 'Database',
    badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    accentBorder: 'rgba(139,92,246,0.35)',
  },
  {
    image: '/team/aysha.jpeg',
    name: 'Aysha Fidha',
    role: 'Frontend Engineer',
    description: 'Crafted the cinematic dark-mode UI with Framer Motion animations, glassmorphism cards, and the real-time chat interface.',
    badge: 'Frontend',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    accentBorder: 'rgba(244,63,94,0.35)',
  },
  {
    image: '/team/shahin.jpeg',
    name: 'Shahin Ali',
    role: 'AI & Backend Engineer',
    description: 'Integrated Whisper transcription, FAISS-powered RAG retrieval and Mistral AI Q&A into a production-grade FastAPI backend.',
    badge: 'AI / Backend',
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
    accentBorder: 'rgba(0,210,255,0.35)',
  },
  {
    image: '/team/fiza.jpeg',
    name: 'Fiza Fathima',
    role: 'Frontend Engineer',
    description: 'Built the session history system, queries postcard grid, and the responsive Dashboard layout that ties the experience together.',
    badge: 'Frontend',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    accentBorder: 'rgba(16,185,129,0.35)',
  },
];

// Triplicate for a seamless infinite loop
const loopedMembers = [...teamMembers, ...teamMembers, ...teamMembers];

/**
 * Individual card — uses React state for hover so the grayscale→color
 * transition is completely independent of the Marquee's own `group` class.
 */
function MemberCard({ member }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex w-64 shrink-0 flex-col cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          borderRadius: '18px',
          border: `1px solid ${hovered ? member.accentBorder : 'rgba(255,255,255,0.08)'}`,
          background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          overflow: 'hidden',
          transition: 'border-color 0.4s ease, background 0.4s ease, box-shadow 0.4s ease',
          boxShadow: hovered ? `0 0 32px -4px ${member.accentBorder}` : 'none',
        }}
      >
        {/* Photo */}
        <div style={{ position: 'relative', height: '300px', width: '100%', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
          <img
            src={member.image}
            alt={member.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
              // Grayscale by default → full colour on hover
              filter: hovered ? 'grayscale(0%) brightness(1.05)' : 'grayscale(100%) brightness(0.85)',
              transform: hovered ? 'scale(1.07)' : 'scale(1)',
              transition: 'filter 0.55s ease, transform 0.55s ease',
              display: 'block',
            }}
            onError={(e) => {
              // Hide broken image and show an initials avatar instead
              const img = e.currentTarget;
              img.style.display = 'none';
              const container = img.parentElement;
              container.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(244,63,94,0.08))';
              if (!container.querySelector('.fallback-avatar')) {
                const av = document.createElement('div');
                av.className = 'fallback-avatar';
                av.style.cssText = `
                  position:absolute; inset:0; display:flex; align-items:center;
                  justify-content:center; font-size:3rem; font-weight:700;
                  color:rgba(255,255,255,0.15); letter-spacing:-2px;
                `;
                av.textContent = member.name.split(' ').map(w => w[0]).join('');
                container.appendChild(av);
              }
            }}
          />
          {/* Bottom gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(3,3,3,0.80) 0%, transparent 55%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px' }}>
          <span className={`inline-block mb-2 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${member.badgeColor}`}>
            {member.badge}
          </span>
          <h3 style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem', lineHeight: 1.3 }}>
            {member.name}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.40)', marginTop: '2px', marginBottom: '8px' }}>
            {member.role}
          </p>
          <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.6 }}>
            {member.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TeamSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#030303] py-20 md:py-28">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-500/[0.04] rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 flex flex-col items-center text-center px-6 mb-14"
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <Users className="w-5 h-5 text-indigo-300" />
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
          Meet the{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-rose-300">
            Creators
          </span>
        </h2>
        <p className="max-w-xl text-white/40 text-sm sm:text-base">
          Four engineers who built SeekRight from the ground up — database, backend, AI, and a stunning frontend.
        </p>
      </motion.div>

      {/* Marquee strip */}
      <div className="relative w-full">
        <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-28 bg-gradient-to-r from-[#030303] to-transparent" />
        <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-28 bg-gradient-to-l from-[#030303] to-transparent" />

        <Marquee className="[--gap:1.5rem] [--duration:32s]" pauseOnHover>
          {loopedMembers.map((member, idx) => (
            <MemberCard key={idx} member={member} />
          ))}
        </Marquee>
      </div>

      {/* Quote footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative z-10 mt-16 flex flex-col items-center text-center px-6"
      >
        <p className="max-w-2xl text-white/40 text-sm sm:text-base leading-relaxed italic">
          "SeekRight was built by a small, focused team — each member owning a critical slice of the stack and shipping with zero compromise."
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex -space-x-2">
            {teamMembers.map((m) => (
              <img
                key={m.name}
                src={m.image}
                alt={m.name}
                className="w-8 h-8 rounded-full border-2 border-[#030303] object-cover object-top"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ))}
          </div>
          <span className="text-white/30 text-xs">The SeekRight Team · 2026</span>
        </div>
      </motion.div>
    </section>
  );
}
