import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PiggyBank, Brain, Trophy, Coins, LogOut, Settings, ChevronLeft, ChevronRight, ShoppingBag, Target } from 'lucide-react';

const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home', end: true },
    { to: '/dashboard/save', icon: PiggyBank, label: 'Save Money' },
    { to: '/dashboard/goals', icon: Target, label: 'Goal Based Saving' },
    { to: '/dashboard/quiz', icon: Brain, label: 'Quiz' },
    { to: '/dashboard/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/dashboard/shop', icon: ShoppingBag, label: 'Shop' },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const logout = () => {
        localStorage.removeItem('nickle_token');
        localStorage.removeItem('nickle_user');
        navigate('/login');
    };

    return (
        <aside className={`
            relative h-full flex flex-col flex-shrink-0
            bg-white dark:bg-gray-900
            border-r border-gray-100 dark:border-gray-800
            shadow-xl transition-all duration-300 ease-in-out
            ${collapsed ? 'w-20' : 'w-64'}
        `}>
            {/* Logo */}
            <div className={`flex items-center h-20 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 overflow-hidden transition-all duration-300 ${collapsed ? 'justify-center px-2' : 'px-6 gap-2'}`}>
                <img src="/logo.png" alt="Nickle Logo" className="w-9 h-9 rounded-xl shadow-lg shadow-indigo-500/10 object-cover flex-shrink-0" />
                {!collapsed && (
                    <span className="font-heading font-bold text-xl text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
                        nickle
                    </span>
                )}
            </div>

            {/* Collapse Toggle Button */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="absolute -right-3.5 top-[72px] z-50 w-7 h-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-md hover:shadow-indigo-500/20 hover:border-indigo-400 transition-all"
            >
                {collapsed
                    ? <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                    : <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
                }
            </button>

            {/* Nav Links */}
            <nav className={`flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2' : 'px-4'}`}>
                {links.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all
                            ${collapsed ? 'justify-center px-0' : 'px-4'}
                            ${isActive
                                ? 'gradient-bg text-white shadow-md shadow-indigo-500/25'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="whitespace-nowrap">{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className={`py-4 border-t border-gray-100 dark:border-gray-800 ${collapsed ? 'px-2' : 'px-4'}`}>
                <button
                    onClick={logout}
                    title={collapsed ? 'Logout' : undefined}
                    className={`flex items-center gap-3 w-full py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${collapsed ? 'justify-center px-0' : 'px-4'}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
