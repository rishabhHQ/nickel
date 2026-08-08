import { useState, useEffect } from 'react';
import { X, Target, Smartphone, Laptop, Bike, Plane, Car, GraduationCap, PiggyBank } from 'lucide-react';

const PREDEFINED_GOALS = [
    { id: 'mobile', name: 'Buy a Mobile', icon: '📱', desc: 'Upgrade to the latest smartphone.', defaultTarget: 50000 },
    { id: 'laptop', name: 'Buy a Laptop', icon: '💻', desc: 'Save consistently for your dream laptop.', defaultTarget: 80000 },
    { id: 'bike', name: 'Buy a Bike', icon: '🏍', desc: 'Hit the road with a new bike.', defaultTarget: 150000 },
    { id: 'vacation', name: 'Vacation', icon: '✈', desc: 'Plan your next dream trip.', defaultTarget: 100000 },
    { id: 'car', name: 'Buy a Car', icon: '🚗', desc: 'Your dream car awaits.', defaultTarget: 800000 },
    { id: 'education', name: 'Education', icon: '🎓', desc: 'Invest in your future.', defaultTarget: 200000 },
    { id: 'emergency', name: 'Emergency Fund', icon: '💰', desc: 'A safety net for unexpected situations.', defaultTarget: 100000 },
];

export default function CreateGoalModal({ isOpen, onClose, onSave }: any) {
    const [step, setStep] = useState(1); // 1: Choose Type, 2: Configure, 3: Auto Saving
    const [goalType, setGoalType] = useState('predefined'); // predefined | custom
    const [selectedPredefined, setSelectedPredefined] = useState<any>(null);
    
    // Form Data
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🎯');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [description, setDescription] = useState('');
    
    // Auto Saving
    const [freq, setFreq] = useState('MONTHLY');
    const [customDays, setCustomDays] = useState('15');
    const [autoAmount, setAutoAmount] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setName('');
            setTargetAmount('');
            setTargetDate('');
            setFreq('MONTHLY');
            setAutoAmount('');
        }
    }, [isOpen]);

    // Recalculate recommended savings when target or date changes
    useEffect(() => {
        if (targetAmount && targetDate) {
            const amount = parseFloat(targetAmount);
            const date = new Date(targetDate);
            const today = new Date();
            const days = (date.getTime() - today.getTime()) / (1000 * 3600 * 24);
            
            if (days > 0) {
                const daily = amount / days;
                let recommended = 0;
                if (freq === 'DAILY') recommended = daily;
                else if (freq === 'WEEKLY') recommended = daily * 7;
                else if (freq === 'MONTHLY') recommended = daily * 30;
                else if (freq === 'CUSTOM') recommended = daily * parseInt(customDays || '1');
                
                setAutoAmount(Math.ceil(recommended).toString());
            }
        }
    }, [targetAmount, targetDate, freq, customDays]);

    if (!isOpen) return null;

    const handlePredefinedSelect = (g: any) => {
        setSelectedPredefined(g);
        setName(g.name);
        setIcon(g.icon);
        setDescription(g.desc);
        setTargetAmount(g.defaultTarget.toString());
        setStep(2);
    };

    const handleNext = () => {
        if (step === 2) {
            if (!name || !targetAmount || !targetDate) return alert('Please fill required fields.');
            setStep(3);
        } else if (step === 3) {
            // Save
            onSave({
                name,
                icon,
                description,
                target_amount: parseFloat(targetAmount),
                target_date: targetDate,
                auto_saving: {
                    frequency: freq,
                    amount: parseFloat(autoAmount),
                    custom_days: freq === 'CUSTOM' ? parseInt(customDays) : null
                }
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-full">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">
                        {step === 1 ? 'Create Goal' : step === 2 ? 'Goal Details' : 'Auto Savings Plan'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-white dark:bg-gray-800 rounded-full shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {PREDEFINED_GOALS.map(g => (
                                    <button 
                                        key={g.id}
                                        onClick={() => handlePredefinedSelect(g)}
                                        className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 text-left transition-all group"
                                    >
                                        <span className="text-3xl bg-gray-100 dark:bg-gray-800 w-12 h-12 flex items-center justify-center rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">{g.icon}</span>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{g.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{g.desc}</p>
                                        </div>
                                    </button>
                                ))}
                                <button 
                                    onClick={() => { setGoalType('custom'); setStep(2); setIcon('🎯'); }}
                                    className="flex items-start gap-4 p-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 text-left transition-all"
                                >
                                    <span className="text-3xl bg-gray-100 dark:bg-gray-800 w-12 h-12 flex items-center justify-center rounded-xl">✨</span>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Custom Goal</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create your own unique financial goal.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Goal Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white" placeholder="e.g. MacBook Pro" />
                                </div>
                                <div className="w-24">
                                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Icon</label>
                                    <input type="text" value={icon} onChange={e => setIcon(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-xl" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Target Amount (₹)</label>
                                <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white" placeholder="80000" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Target Date</label>
                                <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Description (Optional)</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white resize-none" rows={3} placeholder="Add some motivation..." />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1 flex items-center gap-2"><Target className="w-5 h-5"/> AI Saving Recommendation</h3>
                                <p className="text-sm text-indigo-700 dark:text-indigo-400">To reach ₹{targetAmount} by {new Date(targetDate).toLocaleDateString()}, you need to save consistently.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Saving Frequency</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'].map(f => (
                                        <button 
                                            key={f}
                                            onClick={() => setFreq(f)}
                                            className={`py-2 rounded-xl text-sm font-bold transition-colors border ${freq === f ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {freq === 'CUSTOM' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Save every X days</label>
                                    <input type="number" value={customDays} onChange={e => setCustomDays(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-white" placeholder="15" />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Auto Saving Amount (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-500 font-bold">₹</span>
                                    <input type="number" value={autoAmount} onChange={e => setAutoAmount(e.target.value)} className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg text-gray-900 dark:text-white" />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">You can accept the AI recommendation or enter your own amount.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Back
                        </button>
                    )}
                    {step > 1 ? (
                        <button onClick={handleNext} className="px-6 py-2.5 rounded-xl font-bold text-white gradient-bg hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
                            {step === 3 ? 'Start Saving Goal' : 'Continue'}
                        </button>
                    ) : (
                        <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
