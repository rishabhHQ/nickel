import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md h-[72px] transition-all duration-300 font-space text-white shadow-2xl">
                <div className="h-full px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <img src="/logo.png" alt="nickel logo" className="w-8 h-8 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] object-cover" />
                        <span className="font-bold text-xl tracking-tight text-white group-hover:text-gray-300 transition-colors">nickel</span>
                    </div>

                    {/* Center Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Work</a>
                        <a href="#about" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">About</a>
                    </div>

                    {/* Right Side */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Log In</Link>
                        <Link to="/signup" className="text-sm font-semibold text-white bg-white px-5 py-2 rounded-full hover:bg-gray-200 hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden absolute top-full left-0 right-0 mt-2 border border-white/10 bg-black/80 backdrop-blur-xl rounded-2xl transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 py-6 flex flex-col gap-5">
                        <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:text-white font-medium text-lg">Features</a>
                        <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:text-white font-medium text-lg">Work</a>
                        <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:text-white font-medium text-lg">About</a>
                        <div className="h-px bg-white/10 w-full my-2"></div>
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:text-white font-medium text-lg">Log In</Link>
                        <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="bg-white text-black px-5 py-3 rounded-xl font-bold text-lg text-center shadow-lg transition-all">Get Started</Link>
                    </div>
                </div>
            </nav>
        </>
    );
}
