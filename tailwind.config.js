/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                heading: ['Poppins', 'sans-serif'],
                body: ['Work Sans', 'sans-serif'],
                space: ['"Space Grotesk"', 'sans-serif'],
            },
            spacing: { base: '1rem' },
            borderRadius: {
                small: '12px',
                large: '24px',
            },
            boxShadow: {
                custom: '0px 8px 32px rgba(99, 102, 241, 0.15)',
                'custom-hover': '0px 20px 60px rgba(99, 102, 241, 0.25)',
                'glow': '0 0 40px -10px rgba(139, 92, 246, 0.5)',
            },
            colors: {
                brand: {
                    blue: '#3B82F6',
                    purple: '#8B5CF6',
                    teal: '#14B8A6',
                    indigo: '#6366F1',
                    pink: '#EC4899',
                }
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 3s infinite',
                'float-fast': 'float 4s ease-in-out infinite',
                'pulse-slow': 'pulse 4s ease-in-out infinite',
                'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'fade-in': 'fadeIn 1s ease-out forwards',
                'bounce-soft': 'bounceSoft 2s infinite',
                'spin-slow': 'spin 12s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                bounceSoft: {
                    '0%, 100%': { transform: 'translateY(-5%)' },
                    '50%': { transform: 'translateY(0)' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(40px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                }
            }
        }
    },
    plugins: [],
}
