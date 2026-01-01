import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    const canvasRef = useRef(null);
    const [typedText, setTypedText] = useState('');
    const fullText = "> Initialize OdooOps_v1.0... Access Granted.";

    // Matrix Rain Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%";
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0'; // Green text
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = letters[Math.floor(Math.random() * letters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        const interval = setInterval(draw, 33);
        return () => clearInterval(interval);
    }, []);

    // Typing Effect
    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            setTypedText((prev) => prev + fullText.charAt(index));
            index++;
            if (index === fullText.length) clearInterval(timer);
        }, 50);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative h-[80vh] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Canvas */}
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full opacity-20 z-0" />

            {/* Content Content */}
            <div className="z-10 text-center p-6 bg-black/60 backdrop-blur-sm border border-neon-blue/30 rounded-lg shadow-2xl relative scanline">
                <h1 className="text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-green-400 font-mono tracking-tighter glitch-hover cursor-pointer" title="SYSTEM ROOT">
                    OdooOps
                </h1>

                <div className="h-8 mb-8">
                    <p className="text-xl text-green-400 font-mono">
                        {typedText}<span className="animate-pulse">_</span>
                    </p>
                </div>

                <div className="flex gap-6 justify-center mt-8">
                    <Link to="/quiz" className="relative group px-8 py-3 bg-black border border-neon-blue text-neon-blue font-mono font-bold uppercase tracking-widest overflow-hidden hover:text-black hover:bg-neon-blue transition-all duration-300">
                        <span className="relative z-10 flex items-center gap-2">
                            Execute_Quiz
                        </span>
                        <div className="absolute inset-0 bg-neon-blue/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    </Link>

                    <Link to="/leaderboard" className="relative group px-8 py-3 bg-black border border-neon-purple text-neon-purple font-mono font-bold uppercase tracking-widest overflow-hidden hover:text-black hover:bg-neon-purple transition-all duration-300">
                        <span className="relative z-10">
                            Sys_Rankings
                        </span>
                    </Link>
                </div>

                <div className="mt-8 text-xs text-gray-500 font-mono">
                    STATUS: ONLINE | SECURITY: HIGH | PING: 24ms
                </div>
            </div>
        </div>
    );
};

export default Home;
