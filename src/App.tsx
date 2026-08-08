import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSection from './components/ProblemSection';
import SolutionSection from './components/SolutionSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import TechSection from './components/TechSection';
import ImpactSection from './components/ImpactSection';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useEffect } from 'react';

// Dashboard
import DashboardLayout from './dashboard/DashboardLayout';
import DashboardHome from './dashboard/pages/DashboardHome';
import SavePage from './dashboard/pages/SavePage';
import QuizPage from './dashboard/pages/QuizPage';
import LeaderboardPage from './dashboard/pages/LeaderboardPage';
import CoinsPage from './dashboard/pages/CoinsPage';
import SettingsPage from './dashboard/pages/SettingsPage';
import ShopPage from './dashboard/pages/ShopPage';
import GoalsPage from './dashboard/pages/GoalsPage';
import GoalDetailsPage from './dashboard/pages/GoalDetailsPage';

function LandingPage() {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.observe-animate').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="dark video-theme flex flex-col min-h-screen overflow-hidden text-white transition-colors duration-300 font-body relative">
            <Navbar />
            <main className="relative z-10">
                <Hero />
                <ProblemSection />
                <SolutionSection />
                <FeaturesSection />
                <HowItWorksSection />
                <TechSection />
                <ImpactSection />
                <CtaSection />
            </main>
            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/verify-otp" element={<VerifyOtpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected Dashboard — nested layout */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<DashboardHome />} />
                    <Route path="save" element={<SavePage />} />
                    <Route path="quiz" element={<QuizPage />} />
                    <Route path="leaderboard" element={<LeaderboardPage />} />
                    <Route path="coins" element={<CoinsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="shop" element={<ShopPage />} />
                    <Route path="goals" element={<GoalsPage />} />
                    <Route path="goals/:id" element={<GoalDetailsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
