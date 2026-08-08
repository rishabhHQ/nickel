import { useState } from 'react';
import { ShoppingBag, AlertTriangle, ArrowRight, Zap, Check } from 'lucide-react';
import { api } from '../../api';

export default function FutureImpactSimulator({ goal, onSimulate, onDecision }: any) {
    const [purchaseName, setPurchaseName] = useState('');
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [simulation, setSimulation] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    
    const handleSimulate = async () => {
        if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) return;
        setLoading(true);
        try {
            const data = await api.post(`/api/goals/${goal.id}/simulate-purchase`, {
                purchase_amount: parseFloat(purchaseAmount)
            });
            setSimulation(data);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to simulate');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDecision = async (decision: 'SKIP' | 'BUY') => {
        setLoading(true);
        try {
            await api.post(`/api/goals/${goal.id}/decision`, {
                decision,
                purchase_amount: parseFloat(purchaseAmount),
                purchase_name: purchaseName || 'Unknown Item'
            });
            onDecision(); // refresh parent
            setSimulation(null);
            setPurchaseAmount('');
            setPurchaseName('');
        } catch (error: any) {
            alert('Failed to process decision');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
            
            <h3 className="font-bold text-lg font-heading mb-4 text-gray-900 dark:text-white flex items-center gap-2 relative z-10">
                <ShoppingBag className="w-5 h-5 text-indigo-500" /> Splurge Interceptor
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 relative z-10">
                Tempted to buy something? See how it impacts your <span className="font-bold text-indigo-500">{goal.name}</span> goal before you spend.
            </p>
            
            {!simulation ? (
                <div className="space-y-4 relative z-10">
                    <div>
                        <input 
                            type="text" 
                            placeholder="What do you want to buy? (e.g. Nike Shoes)" 
                            value={purchaseName}
                            onChange={(e) => setPurchaseName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-3 text-gray-500 font-bold text-sm">₹</span>
                            <input 
                                type="number" 
                                placeholder="Amount" 
                                value={purchaseAmount}
                                onChange={(e) => setPurchaseAmount(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-gray-900 dark:text-white"
                            />
                        </div>
                        <button 
                            onClick={handleSimulate}
                            disabled={loading || !purchaseAmount}
                            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                        >
                            {loading ? 'Wait...' : 'Analyze Impact'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 relative z-10 animate-fade-in">
                    {/* Impact Warning Card */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle className="w-16 h-16 text-red-500" />
                        </div>
                        <h4 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5" /> Future Impact Warning
                        </h4>
                        
                        <p className="text-red-800 dark:text-red-300 text-sm mb-4">
                            Buying this item will delay your goal by <span className="font-bold text-lg">{simulation.delay_days} days</span>.
                        </p>
                        
                        <div className="flex items-center justify-between text-sm bg-white/50 dark:bg-black/20 rounded-xl p-3">
                            <div className="text-center">
                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold mb-1">Current</p>
                                <p className="font-bold text-gray-900 dark:text-white">{new Date(simulation.current_completion_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <div className="text-center">
                                <p className="text-red-500 text-xs uppercase font-semibold mb-1">Delayed</p>
                                <p className="font-bold text-red-600 dark:text-red-400 animate-pulse">{new Date(simulation.new_completion_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* AI Insight */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 flex items-start gap-3">
                        <Zap className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-indigo-800 dark:text-indigo-300">
                            <strong>AI Insight:</strong> Skipping this purchase means you can reach your {goal.name} goal right on time. If you skip, we'll automatically add this ₹{purchaseAmount} to your savings!
                        </p>
                    </div>
                    
                    {/* Decision Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => handleDecision('SKIP')}
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" /> Skip Purchase
                        </button>
                        <button 
                            onClick={() => handleDecision('BUY')}
                            disabled={loading}
                            className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Buy Anyway
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => {setSimulation(null); setPurchaseAmount('');}} 
                        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-2"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
