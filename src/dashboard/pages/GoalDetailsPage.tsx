import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Calendar, Clock, History, CreditCard, ShoppingCart, Activity, Zap, CheckCircle2, XCircle, FileText, Download } from 'lucide-react';
import { api } from '../api';
import { generateGoalSummaryPDF } from '../../utils/pdfGenerator';
import FutureImpactSimulator from '../components/goals/FutureImpactSimulator';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function GoalDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [goalData, setGoalData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

    const handleExport = () => {
        setIsExporting(true);
        setExportMessage(null);
        setTimeout(() => {
            try {
                generateGoalSummaryPDF(goalData);
                setExportMessage({ type: 'success', text: 'Goal summary exported successfully.' });
            } catch (err) {
                console.error(err);
                setExportMessage({ type: 'error', text: 'Unable to generate the goal summary. Please try again.' });
            } finally {
                setIsExporting(false);
                setTimeout(() => setExportMessage(null), 3000);
            }
        }, 300);
    };

    const fetchGoal = async () => {
        try {
            const data = await api.get(`/api/goals/${id}`);
            setGoalData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoal();
    }, [id]);

    if (loading) {
        return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    }

    if (!goalData) {
        return <div className="text-center p-10 text-gray-500">Goal not found.</div>;
    }

    const { auto_saving, transactions, delay_history, ...goal } = goalData;
    const progress = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
    const progressCapped = Math.min(progress, 100).toFixed(0);

    // Chart data mapping (Cumulative Savings over time)
    // We reverse transactions because they come ordered by desc, we want asc for chart
    const ascTransactions = [...transactions].reverse();
    let cumulative = 0;
    const chartData = ascTransactions.filter(t => t.type === 'CREDIT').map(t => {
        cumulative += t.amount;
        return {
            date: new Date(t.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
            Saved: cumulative
        };
    });
    // Add current state as the last point if empty or to ensure it matches
    if (chartData.length === 0 || chartData[chartData.length - 1].Saved !== goal.saved_amount) {
        chartData.push({
            date: 'Now',
            Saved: goal.saved_amount
        });
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header / Back */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-indigo-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-white flex items-center gap-3">
                        Goal Details
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {exportMessage && (
                        <span className={`text-sm font-semibold ${exportMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                            {exportMessage.text}
                        </span>
                    )}
                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {isExporting ? (
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {isExporting ? 'Generating PDF...' : 'Export Goal Summary'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Details & Timeline */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Goal Header Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
                        {goal.status === 'COMPLETED' && <div className="absolute top-0 left-0 right-0 h-2 bg-green-500" />}
                        
                        <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-5xl shadow-inner flex-shrink-0">
                            {goal.icon}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mb-2">{goal.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">{goal.description || 'Saving for your dreams.'}</p>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-8">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Target</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">₹{goal.target_amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Saved</p>
                                    <p className="text-xl font-bold text-indigo-500">₹{goal.saved_amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Est. Completion</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{new Date(goal.current_completion_date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-gray-900 dark:text-white">{progressCapped}% Completed</span>
                                    <span className="text-gray-500">₹{(goal.target_amount - goal.saved_amount).toLocaleString()} left</span>
                                </div>
                                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${goal.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                        style={{ width: `${progressCapped}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart & Auto Saving */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg font-heading mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-500" /> Saving Trend
                            </h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Line type="monotone" dataKey="Saved" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#6366f1' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg font-heading mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-500" /> Auto Saving Info
                            </h3>
                            {auto_saving ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <span className="text-sm text-gray-500">Frequency</span>
                                        <span className="font-bold">{auto_saving.frequency}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <span className="text-sm text-gray-500">Amount</span>
                                        <span className="font-bold text-indigo-500">₹{auto_saving.amount}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <span className="text-sm text-gray-500">Next Run</span>
                                        <span className="font-bold">{new Date(auto_saving.next_run_date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-6">No auto-saving configured.</p>
                            )}
                        </div>
                    </div>

                    {/* Timeline / Goal Delay History */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg font-heading mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" /> Completion Timeline
                        </h3>
                        
                        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
                            
                            {/* Original */}
                            <div className="relative">
                                <div className="absolute -left-[31px] bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 w-4 h-4 rounded-full"></div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Original Target</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{new Date(goal.original_completion_date).toLocaleDateString()}</p>
                            </div>

                            {/* Delays */}
                            {delay_history.map((dh: any) => (
                                <div key={dh.id} className="relative">
                                    <div className="absolute -left-[31px] bg-white dark:bg-gray-900 border-2 border-red-400 w-4 h-4 rounded-full"></div>
                                    <p className="text-sm font-bold text-red-500 uppercase tracking-wide">Delayed by {dh.delay_days} days</p>
                                    <p className="text-sm text-gray-500">Bought {dh.purchase_name} for ₹{dh.purchase_amount}</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white line-through opacity-50">{new Date(dh.previous_completion_date).toLocaleDateString()}</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{new Date(dh.new_completion_date).toLocaleDateString()}</p>
                                </div>
                            ))}
                            
                            {/* Current */}
                            <div className="relative">
                                <div className="absolute -left-[31px] bg-white dark:bg-gray-900 border-2 border-indigo-500 w-4 h-4 rounded-full"></div>
                                <p className="text-sm font-bold text-indigo-500 uppercase tracking-wide">Current Target</p>
                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{new Date(goal.current_completion_date).toLocaleDateString()}</p>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Right Column - Simulator & History */}
                <div className="space-y-6">
                    
                    {goal.status !== 'COMPLETED' && (
                        <FutureImpactSimulator goal={goal} onDecision={fetchGoal} />
                    )}

                    {/* Transaction History */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg font-heading mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-500" /> Recent Activity
                        </h3>
                        
                        <div className="space-y-4">
                            {transactions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No activity yet.</p>
                            ) : (
                                transactions.slice(0, 5).map((t: any) => (
                                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${t.type === 'CREDIT' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                                {t.type === 'CREDIT' ? <CreditCard className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white">{t.description}</p>
                                                <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className={`font-bold text-sm ${t.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
            {/* Goal AutoPay Transaction History (Full Width) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg font-heading text-gray-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-indigo-500" /> Goal AutoPay History
                    </h3>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">Last 30 transactions</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                                <th className="pb-4 font-semibold px-4">Date & Time</th>
                                <th className="pb-4 font-semibold px-4">Goal Name</th>
                                <th className="pb-4 font-semibold px-4 text-right">Amount</th>
                                <th className="pb-4 font-semibold px-4 text-center">Status</th>
                                <th className="pb-4 font-semibold px-4">Source</th>
                                <th className="pb-4 font-semibold px-4 text-right">Remaining Goal</th>
                                <th className="pb-4 font-semibold px-4 text-right">Current Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.filter((t: any) => t.type === 'GOAL_AUTOPAY').slice(0, 30).length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">No AutoPay transactions yet.</td>
                                </tr>
                            ) : (
                                transactions.filter((t: any) => t.type === 'GOAL_AUTOPAY').slice(0, 30).map((t: any) => (
                                    <tr key={t.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-300">
                                            <div>{new Date(t.created_at).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-400">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="py-4 px-4 text-sm font-bold text-gray-900 dark:text-white">{goal.name}</td>
                                        <td className="py-4 px-4 text-sm font-bold text-right text-gray-900 dark:text-white">₹{t.amount.toLocaleString()}</td>
                                        <td className="py-4 px-4 text-center">
                                            {t.status === 'SUCCESS' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle2 className="w-3 h-3" /> Success
                                                </span>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        <XCircle className="w-3 h-3" /> Failed
                                                    </span>
                                                    <span className="text-[10px] text-red-500 max-w-[120px] truncate" title={t.reason}>{t.reason}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-500">{t.source || 'Dummy Bank'}</td>
                                        <td className="py-4 px-4 text-sm font-medium text-right text-gray-500">
                                            {t.remaining_balance != null ? `₹${t.remaining_balance.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-sm font-bold text-right text-indigo-500">
                                            {t.current_balance != null ? `₹${t.current_balance.toLocaleString()}` : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
