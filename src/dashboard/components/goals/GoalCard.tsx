import { Target, Play, Pause, Edit3, Trash2, Calendar, TrendingUp, Zap } from 'lucide-react';

export default function GoalCard({ goal, onView, onEdit, onPause, onDelete, onRunAutopay }: any) {
    const progress = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
    const progressCapped = Math.min(progress, 100).toFixed(0);
    
    // Remaining days
    const today = new Date();
    const targetDate = new Date(goal.current_completion_date);
    const timeDiff = targetDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    
    const isCompleted = goal.status === 'COMPLETED';

    return (
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 group">
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} />
            
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                            {goal.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white font-heading">{goal.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isCompleted ? 'Goal Completed 🎉' : `${daysRemaining} days remaining`}
                            </p>
                        </div>
                    </div>
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                        goal.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }`}>
                        {goal.status}
                    </span>
                </div>

                {/* Amounts */}
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Saved</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{goal.saved_amount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Target</p>
                        <p className="text-lg font-bold text-gray-400">₹{goal.target_amount.toLocaleString()}</p>
                    </div>
                </div>

                {/* AutoPay Info */}
                {goal.auto_saving && (
                    <div className="mb-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-3 flex justify-between items-center text-xs">
                        <div className="text-gray-500 dark:text-gray-400">
                            AutoPay: <span className="font-bold text-indigo-500">{goal.auto_saving.frequency}</span>
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white">
                            ₹{goal.auto_saving.amount}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {goal.auto_saving.next_run_date ? new Date(goal.auto_saving.next_run_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'TBD'}
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4 shadow-inner">
                    <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                            isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${progressCapped}%` }}
                    />
                </div>
                
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                    <span>{progressCapped}% Completed</span>
                    {!isCompleted && <span>₹{(goal.target_amount - goal.saved_amount).toLocaleString()} left</span>}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => onView(goal.id)}
                        className="col-span-1 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <TrendingUp className="w-4 h-4" /> View
                    </button>
                    {!isCompleted && goal.auto_saving && (
                        <button 
                            onClick={() => onRunAutopay(goal.id)}
                            className="col-span-1 py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-500/20 flex items-center justify-center gap-2"
                            title="Test AutoPay Manually"
                        >
                            <Zap className="w-4 h-4" /> Run
                        </button>
                    )}
                    {/* Secondary Actions hover reveal or just icons */}
                    <div className="col-span-2 flex justify-end gap-2 mt-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                        <button onClick={() => onEdit(goal)} className="p-2 text-gray-400 hover:text-indigo-500 transition-colors" title="Edit">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        {!isCompleted && (
                            <button onClick={() => onPause(goal)} className={`p-2 transition-colors ${goal.status === 'PAUSED' ? 'text-green-500 hover:text-green-600' : 'text-yellow-500 hover:text-yellow-600'}`} title={goal.status === 'PAUSED' ? 'Resume' : 'Pause'}>
                                {goal.status === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </button>
                        )}
                        <button onClick={() => onDelete(goal.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
