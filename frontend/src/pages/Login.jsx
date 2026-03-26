import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

// ---- Utility ----
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

// ---- WebGL Shader internals ----
const ShaderMaterial = ({ source, uniforms, maxFps = 60 }) => {
    const { size } = useThree();
    const ref = useRef(null);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const material = ref.current.material;
        material.uniforms.u_time.value = clock.getElapsedTime();
    });

    const getUniforms = () => {
        const out = {};
        for (const name in uniforms) {
            const u = uniforms[name];
            switch (u.type) {
                case 'uniform1f': out[name] = { value: u.value }; break;
                case 'uniform1i': out[name] = { value: u.value }; break;
                case 'uniform1fv': out[name] = { value: u.value }; break;
                case 'uniform3fv':
                    out[name] = { value: u.value.map(v => new THREE.Vector3().fromArray(v)) }; break;
                default: break;
            }
        }
        out.u_time = { value: 0 };
        out.u_resolution = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
        return out;
    };

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: `
            precision mediump float;
            uniform vec2 u_resolution;
            out vec2 fragCoord;
            void main(){
                gl_Position = vec4(position.xy, 0.0, 1.0);
                fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
                fragCoord.y = u_resolution.y - fragCoord.y;
            }`,
            fragmentShader: source,
            uniforms: getUniforms(),
            glslVersion: THREE.GLSL3,
            blending: THREE.CustomBlending,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.OneFactor,
        });
    }, [size.width, size.height, source]);

    return (
        <mesh ref={ref}>
            <planeGeometry args={[2, 2]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
};

const Shader = ({ source, uniforms }) => (
    <Canvas className="absolute inset-0 h-full w-full">
        <ShaderMaterial source={source} uniforms={uniforms} />
    </Canvas>
);

const DotMatrix = ({ colors = [[0, 0, 0]], opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14], totalSize = 20, dotSize = 2, shader = '', center = ['x', 'y'] }) => {
    const uniforms = useMemo(() => {
        let ca = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
        if (colors.length === 2) ca = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
        else if (colors.length === 3) ca = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
        return {
            u_colors: { value: ca.map(c => [c[0] / 255, c[1] / 255, c[2] / 255]), type: 'uniform3fv' },
            u_opacities: { value: opacities, type: 'uniform1fv' },
            u_total_size: { value: totalSize, type: 'uniform1f' },
            u_dot_size: { value: dotSize, type: 'uniform1f' },
            u_reverse: { value: shader.includes('u_reverse_active') ? 1 : 0, type: 'uniform1i' },
        };
    }, [colors, opacities, totalSize, dotSize, shader]);

    return (
        <Shader
            source={`
            precision mediump float;
            in vec2 fragCoord;
            uniform float u_time;
            uniform float u_opacities[10];
            uniform vec3 u_colors[6];
            uniform float u_total_size;
            uniform float u_dot_size;
            uniform vec2 u_resolution;
            uniform int u_reverse;
            out vec4 fragColor;
            float PHI = 1.61803398874989484820459;
            float random(vec2 xy){ return fract(tan(distance(xy*PHI,xy)*0.5)*xy.x); }
            void main(){
                vec2 st = fragCoord.xy;
                ${center.includes('x') ? 'st.x -= abs(floor((mod(u_resolution.x,u_total_size)-u_dot_size)*0.5));' : ''}
                ${center.includes('y') ? 'st.y -= abs(floor((mod(u_resolution.y,u_total_size)-u_dot_size)*0.5));' : ''}
                float opacity = step(0.0,st.x)*step(0.0,st.y);
                vec2 st2 = vec2(int(st.x/u_total_size),int(st.y/u_total_size));
                float show_offset = random(st2);
                float rand = random(st2*floor((u_time/5.0)+show_offset+5.0));
                opacity *= u_opacities[int(rand*10.0)];
                opacity *= 1.0-step(u_dot_size/u_total_size,fract(st.x/u_total_size));
                opacity *= 1.0-step(u_dot_size/u_total_size,fract(st.y/u_total_size));
                vec3 color = u_colors[int(show_offset*6.0)];
                vec2 center_grid = u_resolution/2.0/u_total_size;
                float dist = distance(center_grid,st2);
                float timing = u_reverse==1
                    ? (distance(center_grid,vec2(0.0))-dist)*0.02+(random(st2+42.0)*0.2)
                    : dist*0.01+(random(st2)*0.15);
                opacity *= u_reverse==1
                    ? (1.0-step(timing,u_time*0.5))*clamp((step(timing+0.1,u_time*0.5))*1.25,1.0,1.25)
                    : step(timing,u_time*0.5)*clamp((1.0-step(timing+0.1,u_time*0.5))*1.25,1.0,1.25);
                fragColor = vec4(color,opacity);
                fragColor.rgb *= fragColor.a;
            }`}
            uniforms={uniforms}
        />
    );
};

const CanvasRevealEffect = ({ animationSpeed = 10, opacities, colors = [[0, 255, 255]], containerClassName, dotSize, showGradient = true, reverse = false }) => (
    <div className={cn('h-full relative w-full', containerClassName)}>
        <div className="h-full w-full">
            <DotMatrix
                colors={colors}
                dotSize={dotSize ?? 3}
                opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
                shader={reverse ? 'u_reverse_active_;' : 'false_;'}
                center={['x', 'y']}
            />
        </div>
        {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />}
    </div>
);

// ---- Main Login / Sign-In Page ----
export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [canvasVisible] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !name) { setError('Please fill in all fields.'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { setError('Please enter a valid email address.'); return; }

        // Store auth and navigate
        localStorage.setItem('seekright_active_user', email);
        navigate('/home');
    };

    return (
        <div className="flex w-full flex-col min-h-screen bg-black relative font-['Inter',sans-serif]">
            {/* Background canvas */}
            <div className="absolute inset-0 z-0">
                {canvasVisible && (
                    <div className="absolute inset-0">
                        <CanvasRevealEffect
                            animationSpeed={3}
                            containerClassName="bg-black"
                            colors={[[255, 255, 255], [255, 255, 255]]}
                            dotSize={6}
                            reverse={false}
                        />
                    </div>
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.85)_0%,_transparent_100%)]" />
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-6 py-5">
                    <button onClick={() => navigate('/landing')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200">
                        <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs">SR</div>
                        <span className="font-semibold text-sm tracking-tight">SeekRight</span>
                    </button>
                    <button onClick={() => navigate('/landing')} className="text-xs text-white/40 hover:text-white/60 transition-colors">← Back to Home</button>
                </div>

                {/* Form */}
                <div className="flex flex-1 items-center justify-center px-4 pb-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="sign-in"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="w-full max-w-sm space-y-6 text-center"
                        >
                            <div className="space-y-2">
                                <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Welcome Back</h1>
                                <p className="text-[1.1rem] text-white/50 font-light">Sign in to SeekRight</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3 text-left">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setError(''); }}
                                        className="w-full bg-white/5 text-white border border-white/10 rounded-full py-3 px-5 focus:outline-none focus:border-white/30 text-sm placeholder-white/30 transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                        className="w-full bg-white/5 text-white border border-white/10 rounded-full py-3 px-5 pr-12 focus:outline-none focus:border-white/30 text-sm placeholder-white/30 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white text-black text-base hover:bg-white/90 transition-all"
                                    >→</button>
                                </div>

                                {error && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center px-2">{error}</motion.p>
                                )}

                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full rounded-full bg-white text-black font-semibold py-3 text-sm hover:bg-white/90 transition-all"
                                >
                                    Continue to Dashboard →
                                </motion.button>
                            </form>

                            <p className="text-xs text-white/30 leading-relaxed">
                                By continuing, you agree to our{' '}
                                <span className="underline cursor-pointer hover:text-white/50 transition-colors">Terms of Service</span>{' '}
                                and{' '}
                                <span className="underline cursor-pointer hover:text-white/50 transition-colors">Privacy Policy</span>.
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
