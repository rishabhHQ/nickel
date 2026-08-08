import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const heroOpacity = Math.max(0, 1 - scrollY / 500);
    const heroTranslate = scrollY * 0.4;

    return (
        <section className="hero-section relative min-h-screen flex items-center pt-24 font-space overflow-hidden border-none">
            {/* Background Video */}
            <div className="fixed inset-0 w-full h-full z-[-1] bg-black">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="/background_video.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/45"></div>
            </div>

            <div 
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
                style={{ opacity: heroOpacity, transform: `translateY(${heroTranslate}px)` }}
            >
                <div className="max-w-3xl animate-slide-up">
                    <h1 className="font-black text-white text-5xl sm:text-6xl lg:text-7xl leading-[1.1] mb-12 tracking-tight drop-shadow-lg">
                        Gamify Your Savings.<br />
                        <span className="text-white">Build Wealth Every Day.</span>
                    </h1>
                    
                    <div 
                        className="flex flex-col sm:flex-row gap-5 items-start opacity-0 animate-slide-up" 
                        style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
                    >
                        <Link 
                            to="/signup" 
                            className="bg-gradient-to-r from-gray-100 via-gray-300 to-gray-400 text-black px-8 py-4 rounded-full font-bold text-[17px] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 transition-all duration-300 flex items-center justify-center border border-white/50"
                        >
                            Start Saving
                        </Link>
                        <a 
                            href="#features" 
                            className="bg-white/10 backdrop-blur-md border border-white/50 text-white px-8 py-4 rounded-full font-bold text-[17px] hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                        >
                            Explore Features
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
