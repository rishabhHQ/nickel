import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, TrendingUp, CheckCircle, PiggyBank, Calendar, AlertTriangle, Play, Pause, Edit3, Trash2, Search, X } from 'lucide-react';
import { api } from '../api';
import GoalCard from '../components/goals/GoalCard';
import CreateGoalModal from '../components/goals/CreateGoalModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function GoalsPage() {
    const navigate = useNavigate();
    const [goals, setGoals] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Paused' | 'Completed'>('All');

    // Action Modal State
    const [actionModal, setActionModal] = useState<{type: 'EDIT' | 'DELETE' | 'PAUSE' | null, goal: any}>({type: null, goal: null});
    const [editName, setEditName] = useState('');
    const [editTarget, setEditTarget] = useState('');
    const [editDescription, setEditDescription] = useState('');

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        setLoading(true);
        try {
            const data = await api.get('/api/goals/');
            setGoals(data.goals);
            setSummary(data.summary);
        } catch (error) {
            console.error('Failed to fetch goals', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGoal = async (goalData: any) => {
        try {
            await api.post('/api/goals/', goalData);
            fetchGoals();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteGoal = (id: number) => {
        const goal = goals.find(g => g.id === id);
        if (goal) setActionModal({ type: 'DELETE', goal });
    };

    const handlePauseGoal = (goal: any) => {
        setActionModal({ type: 'PAUSE', goal });
    };

    const handleEditGoal = (goal: any) => {
        setEditName(goal.name);
        setEditTarget(goal.target_amount.toString());
        setEditDescription(goal.description || '');
        setActionModal({ type: 'EDIT', goal });
    };

    const handleRunAutopay = async (goalId: number) => {
        try {
            const data = await api.goals.runAutopay(goalId);
            if (data.transaction && data.transaction.status === 'FAILED') {
                alert(`AutoPay Failed: ${data.transaction.reason}`);
            } else {
                // Success - the fetchGoals will re-render and animations will play naturally 
                // due to transition-all on the progress bar in GoalCard
            }
            fetchGoals();
        } catch (error: any) {
            alert(error.message || 'Failed to run AutoPay');
            console.error(error);
        }
    };
    
    const confirmAction = async () => {
        const { type, goal } = actionModal;
        if (!goal) return;
        
        try {
            if (type === 'DELETE') {
                await api.delete(`/api/goals/${goal.id}`);
            } else if (type === 'PAUSE') {
                await api.put(`/api/goals/${goal.id}/status`, {});
            } else if (type === 'EDIT') {
                if (!editName || !editTarget) return;
                await api.put(`/api/goals/${goal.id}`, { 
                    name: editName, 
                    target_amount: parseFloat(editTarget),
                    description: editDescription
                });
            }
            setActionModal({ type: null, goal: null });
            fetchGoals();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    }

    const filteredGoals = goals.filter(g => {
        if (searchQuery && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (statusFilter === 'Active' && g.status !== 'ACTIVE') return false;
        if (statusFilter === 'Paused' && g.status !== 'PAUSED') return false;
        if (statusFilter === 'Completed' && g.status !== 'COMPLETED') return false;
        return true;
    });

    const activeGoals = filteredGoals.filter(g => g.status !== 'COMPLETED');
    const completedGoals = filteredGoals.filter(g => g.status === 'COMPLETED');
    const isFiltering = searchQuery !== '' || statusFilter !== 'All';

    const chartData = goals.filter(g => g.status !== 'COMPLETED').map(g => ({
        name: g.name,
        Saved: g.saved_amount,
        Remaining: g.target_amount - g.saved_amount
    }));

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-heading text-gray-900 dark:text-white flex items-center gap-3">
                        <Target className="w-8 h-8 text-indigo-500" />
                        Goal Based Saving
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Save money for what matters most.</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white gradient-bg hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                >
                    <Plus className="w-5 h-5" /> Create Goal
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Goals</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_active}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_completed}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                            <PiggyBank className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Saved</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{summary.total_saved.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly Saving</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{summary.monthly_saving_rate.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Goals List */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search goals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-11 pr-10 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        <div className="sm:w-48 relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="block w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm appearance-none"
                            >
                                <option value="All">All</option>
                                <option value="Active">Active</option>
                                <option value="Paused">Paused</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {isFiltering && filteredGoals.length === 0 ? (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No goals found</h3>
                            <p className="text-gray-500 dark:text-gray-400">Try a different search term or status filter.</p>
                            <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); }} className="mt-6 px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Active Goals */}
                            {(activeGoals.length > 0 || !isFiltering) && (
                                <div>
                                    <h2 className="text-xl font-bold font-heading mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                        <Target className="w-5 h-5 text-indigo-500" /> Active Goals
                                    </h2>
                                    {activeGoals.length === 0 && !isFiltering ? (
                                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎯</div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No active goals yet</h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-6">Start saving for your dreams today.</p>
                                            <button onClick={() => setIsCreateModalOpen(true)} className="px-6 py-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                                                Create First Goal
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {activeGoals.map(goal => (
                                                <GoalCard 
                                                    key={goal.id} 
                                                    goal={goal} 
                                                    onView={(id: any) => navigate(`/dashboard/goals/${id}`)}
                                                    onEdit={handleEditGoal}
                                                    onPause={handlePauseGoal}
                                                    onDelete={handleDeleteGoal}
                                                    onRunAutopay={handleRunAutopay}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Completed Goals */}
                            {completedGoals.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold font-heading mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" /> Completed Goals
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {completedGoals.map(goal => (
                                            <GoalCard 
                                                key={goal.id} 
                                                goal={goal} 
                                                onView={(id: any) => navigate(`/dashboard/goals/${id}`)}
                                                onEdit={handleEditGoal}
                                                onPause={handlePauseGoal}
                                                onDelete={handleDeleteGoal}
                                                onRunAutopay={handleRunAutopay}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Right Column - Charts & Insights */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg font-heading mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" /> Progress Overview
                        </h3>
                        {chartData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                        <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="Saved" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="Remaining" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                                No data to display
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CreateGoalModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSave={handleCreateGoal} 
            />

            {/* Custom Action Modal */}
            {actionModal.type && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        {actionModal.type === 'DELETE' && (
                            <>
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 mb-4">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold font-heading text-gray-900 dark:text-white mb-2">Delete Goal</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete "{actionModal.goal.name}"? This action cannot be undone and will remove all tracking data for this goal.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setActionModal({type: null, goal: null})} className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                    <button onClick={confirmAction} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Delete Goal</button>
                                </div>
                            </>
                        )}
                        {actionModal.type === 'PAUSE' && (
                            <>
                                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-500 mb-4">
                                    {actionModal.goal.status === 'PAUSED' ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                                </div>
                                <h3 className="text-xl font-bold font-heading text-gray-900 dark:text-white mb-2">{actionModal.goal.status === 'PAUSED' ? 'Resume Goal' : 'Pause Goal'}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    {actionModal.goal.status === 'PAUSED' 
                                        ? `Are you sure you want to resume saving for "${actionModal.goal.name}"?` 
                                        : `Are you sure you want to pause saving for "${actionModal.goal.name}"? Your progress will be saved.`}
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setActionModal({type: null, goal: null})} className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                    <button onClick={confirmAction} className="flex-1 py-3 rounded-xl font-bold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/20">Confirm</button>
                                </div>
                            </>
                        )}
                        {actionModal.type === 'EDIT' && (
                            <>
                                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 mb-4">
                                    <Edit3 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold font-heading text-gray-900 dark:text-white mb-4">Edit Goal</h3>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Goal Name</label>
                                        <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Target Amount (₹)</label>
                                        <input 
                                            type="number" 
                                            value={editTarget}
                                            onChange={(e) => setEditTarget(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes / Description</label>
                                        <textarea 
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Add a note about this goal..."
                                            rows={3}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setActionModal({type: null, goal: null})} className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                                    <button onClick={confirmAction} className="flex-1 py-3 rounded-xl font-bold text-white gradient-bg hover:shadow-lg hover:shadow-indigo-500/30 transition-all">Save Changes</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
