import { useState, useEffect } from 'react';
import { PiggyBank, Briefcase, Activity, AlertCircle, Play, Pause, Square, Plus, FastForward, Edit3, Check, X } from 'lucide-react';
import { api } from '../api';
import { useDashboard } from '../DashboardLayout';

const LEVELS = [
    { key: 'EASY', label: 'Easy', pct: '20%', xp: '+100 XP', color: 'border-teal-400 bg-teal-50 dark:bg-teal-900/20' },
    { key: 'MEDIUM', label: 'Medium', pct: '30%', xp: '+200 XP', color: 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' },
    { key: 'HARD', label: 'Hard', pct: '40%', xp: '+300 XP', color: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' },
];

export default function SavingWalletCard() {
    const { refreshUser } = useDashboard();
    const [bankBalance, setBankBalance] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);
    const [cycle, setCycle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('EASY');
    const [depositAmount, setDepositAmount] = useState('');
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [editAmount, setEditAmount] = useState('');
    const [showBalanceWarning, setShowBalanceWarning] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const b = await api.bank.getBalance();
            setBankBalance(b.balance || 0);
            
            const w = await api.autopay.getWallet();
            setWalletBalance(w.wallet_balance || 0);
            
            const s = await api.autopay.getStatus();
            setCycle(s.has_active_cycle ? s.cycle : null);
            
        } catch (e: any) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDeposit = async () => {
        if (!depositAmount || Number(depositAmount) <= 0) return;
        setError('');
        try {
            await api.bank.deposit(Number(depositAmount));
            setDepositAmount('');
            setIsEditingBank(false);
            fetchData();
        } catch (e: any) { setError(e.message); }
    };

    const handleEditBank = async () => {
        if (!editAmount || Number(editAmount) < 0) return;
        setError('');
        try {
            await api.bank.edit(Number(editAmount));
            setIsEditingBank(false);
            fetchData();
        } catch (e: any) { setError(e.message); }
    };

    const handleStart = async () => {
        setError('');
        setShowBalanceWarning(false);
        if (bankBalance < 1000) {
            setShowBalanceWarning(true);
            return;
        }
        try {
            await api.autopay.start(selectedLevel);
            fetchData();
        } catch (e: any) { setError(e.message); }
    };

    const handleAction = async (action: 'pause' | 'resume' | 'stop' | 'simulateDay') => {
        setError('');
        try {
            const res = await api.autopay[action]();
            if (res && res.streak_reset) {
                setAlertMessage(res.message || "Your streak has been reset to 0.");
            }
            fetchData();
            refreshUser();
        } catch (e: any) { setError(e.message); }
    };

    if (loading) return <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 h-64 border border-gray-100 dark:border-gray-800 animate-pulse"></div>;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 card-glow">
            {/* Header: Balances */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Briefcase className="w-4 h-4"/> <span className="text-xs font-bold uppercase">Dummy Bank</span>
                        </div>
                        <button onClick={() => { setIsEditingBank(!isEditingBank); setEditAmount(bankBalance.toString()); }} className="text-gray-400 hover:text-indigo-500 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    
                    {isEditingBank ? (
                        <div className="mt-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex gap-1 text-2xl font-black text-gray-900 dark:text-white items-center">
                                <span>₹</span>
                                <input type="number" autoFocus value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-full bg-transparent border-b-2 border-indigo-500 outline-none p-0 focus:ring-0" />
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={handleEditBank} className="flex-1 bg-indigo-500 text-white p-1 rounded font-bold text-xs flex justify-center items-center h-7 hover:bg-indigo-600"><Check className="w-4 h-4"/></button>
                                <button onClick={() => setIsEditingBank(false)} className="px-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex justify-center items-center h-7"><X className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-200">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">₹{bankBalance.toLocaleString()}</div>
                            <div className="flex gap-2 mt-3">
                                <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Deposit Amount" className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" />
                                <button onClick={handleDeposit} className="bg-indigo-500 text-white px-2 rounded hover:bg-indigo-600 transition-colors font-bold text-xs text-center flex justify-center items-center h-7">Add</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-900/50">
                    <div className="flex items-center gap-2 text-teal-600 mb-1"><PiggyBank className="w-4 h-4"/> <span className="text-xs font-bold uppercase">Savings Wallet</span></div>
                    <div className="text-2xl font-black text-teal-700 dark:text-teal-300">₹{walletBalance.toLocaleString()}</div>
                </div>
            </div>

            {error && <div className="text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg text-xs mb-4 flex items-center gap-2 font-medium"><AlertCircle className="w-4 h-4 flex-shrink-0"/><span>{error}</span></div>}

            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white">Autopay Cycle</h3>
                    </div>
                    {cycle && (
                        <div className={`text-xs font-black px-2.5 py-1 rounded-full shadow-md ${
                            cycle.level === 'EASY' ? 'bg-teal-100 text-teal-700' :
                            cycle.level === 'MEDIUM' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-purple-100 text-purple-700'
                        }`}>
                            {cycle.level.charAt(0) + cycle.level.slice(1).toLowerCase()}
                        </div>
                    )}
                </div>

                {!cycle ? (
                    <div>
                        {showBalanceWarning && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded-r-xl mb-4 text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5 text-orange-500" />
                                    <h4 className="font-bold text-orange-800 dark:text-orange-300">Minimum Balance Required</h4>
                                </div>
                                <p className="text-xs text-orange-700 dark:text-orange-400 mb-3 leading-relaxed">
                                    Your bank account balance must be at least ₹1000 before Autopay can begin.
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                                        <span className="block text-gray-500 mb-0.5">Current Balance</span>
                                        <span className="font-black text-orange-700 dark:text-orange-400">₹{bankBalance.toLocaleString()}</span>
                                    </div>
                                    <div className="bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                                        <span className="block text-gray-500 mb-0.5">Required Balance</span>
                                        <span className="font-black text-gray-900 dark:text-gray-100">₹1,000</span>
                                    </div>
                                </div>
                                <p className="text-xs text-orange-700 dark:text-orange-400 mt-3 font-medium italic">
                                    Please deposit additional funds to activate Autopay.
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mb-3">Turn on Autopay to automate your savings and earn daily XP!</p>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {LEVELS.map(l => (
                                <button key={l.key} onClick={() => setSelectedLevel(l.key)} className={`border-2 rounded-xl p-2 text-center transition-all ${selectedLevel === l.key ? l.color + ' border-opacity-100 scale-105 shadow-sm' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}>
                                    <div className="font-bold text-sm text-gray-900 dark:text-white">{l.label}</div>
                                    <div className="text-[10px] text-gray-500">{l.pct}</div>
                                </button>
                            ))}
                        </div>
                        <button onClick={handleStart} className="w-full gradient-bg text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-transform hover:scale-[1.02]">Start Autopay ({LEVELS.find(l=>l.key===selectedLevel)?.pct})</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Status</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${cycle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{cycle.status}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Target / Deduction</span>
                            <span className="font-bold text-gray-900 dark:text-white">₹{cycle.target_amount.toLocaleString()} / ₹{cycle.daily_deduction.toLocaleString()}</span>
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Day {cycle.current_day} of 30</span>
                                <span className="text-indigo-500 font-bold">{Math.round((cycle.current_day/30)*100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full gradient-bg transition-all" style={{ width: `${(cycle.current_day/30)*100}%` }} />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {cycle.status === 'ACTIVE' ? (
                                <button onClick={() => handleAction('pause')} className="flex-1 bg-orange-100 text-orange-700 py-2.5 rounded-xl flex justify-center items-center gap-1.5 font-bold text-sm hover:bg-orange-200 transition-colors"><Pause className="w-4 h-4"/> Pause</button>
                            ) : (
                                <button onClick={() => handleAction('resume')} className="flex-1 bg-green-100 text-green-700 py-2.5 rounded-xl flex justify-center items-center gap-1.5 font-bold text-sm hover:bg-green-200 transition-colors"><Play className="w-4 h-4"/> Resume</button>
                            )}
                            <button onClick={() => handleAction('stop')} className="flex-1 bg-red-100 text-red-700 py-2.5 rounded-xl flex justify-center items-center gap-1.5 font-bold text-sm hover:bg-red-200 transition-colors"><Square className="w-4 h-4"/> Stop</button>
                        </div>

                        <button onClick={() => handleAction('simulateDay')} className="w-full border-2 border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                            <FastForward className="w-4 h-4"/> Simulate Next Day
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Alert Modal */}
            {alertMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-center font-bold text-lg text-gray-900 dark:text-white mb-2">Streak Reset</h3>
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            {alertMessage}
                        </p>
                        <button 
                            onClick={() => setAlertMessage('')}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Got it, thanks
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
