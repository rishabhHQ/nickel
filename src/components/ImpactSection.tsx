export default function ImpactSection() {
    return (
        <section id="about" className="py-20 md:py-32 bg-white dark:bg-gray-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 observe-animate">
                    <span className="inline-block bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full mb-6 border border-green-100 dark:border-green-800/50">Real Impact</span>
                    <h2 className="font-heading font-black text-4xl sm:text-5xl text-gray-900 dark:text-white mb-6">The Difference nickle<br /><span className="gradient-text">Makes in Your Life</span></h2>
                    <p className="text-gray-600 dark:text-gray-400 text-xl max-w-2xl mx-auto">Real results for real people. Here's what happens when saving becomes a game you actually want to play.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-[24px] card-glow observe-animate border border-blue-100 dark:border-indigo-800/30 text-gray-900 dark:text-white">
                        <div className="text-5xl mb-6">📚</div>
                        <h3 className="font-heading font-bold text-xl mb-3">Financial Literacy</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">Users report 3x improvement in financial knowledge after just 30 days.</p>
                        <div className="font-heading font-black text-4xl text-indigo-600 dark:text-indigo-400">3x</div>
                    </div>
                    <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-[24px] card-glow observe-animate border border-purple-100 dark:border-purple-800/30 text-gray-900 dark:text-white" style={{ transitionDelay: '0.1s' }}>
                        <div className="text-5xl mb-6">💰</div>
                        <h3 className="font-heading font-bold text-xl mb-3">Saving Habits</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">Streak mechanics create lasting saving habits that stick beyond the app.</p>
                        <div className="font-heading font-black text-4xl text-purple-600 dark:text-purple-400">89%</div>
                    </div>
                    <div className="text-center p-8 bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 rounded-[24px] card-glow observe-animate border border-teal-100 dark:border-teal-800/30 text-gray-900 dark:text-white" style={{ transitionDelay: '0.2s' }}>
                        <div className="text-5xl mb-6">🛑</div>
                        <h3 className="font-heading font-bold text-xl mb-3">Less Impulse Buys</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">Goal visualization helps users make more intentional financial decisions.</p>
                        <div className="font-heading font-black text-4xl text-teal-600 dark:text-teal-400">-42%</div>
                    </div>
                    <div className="text-center p-8 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-[24px] card-glow observe-animate border border-yellow-100 dark:border-yellow-800/30 text-gray-900 dark:text-white" style={{ transitionDelay: '0.3s' }}>
                        <div className="text-5xl mb-6">💪</div>
                        <h3 className="font-heading font-bold text-xl mb-3">Confidence</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">Achieving goals builds genuine confidence in managing personal finances.</p>
                        <div className="font-heading font-black text-4xl text-yellow-600 dark:text-yellow-400">94%</div>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-[24px] p-8 card-glow observe-animate border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-1 mb-4">
                            <span className="text-yellow-400 dark:text-yellow-500 text-lg">★★★★★</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">"I saved $1,200 in 3 months without even feeling it. The daily challenges made it feel like a game, not a chore!"</p>
                        <div className="flex items-center gap-4">
                            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face" alt="User" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                            <div>
                                <div className="font-heading font-bold text-gray-900 dark:text-white">Maya K.</div>
                                <div className="text-gray-500 dark:text-gray-400 text-sm">College Student, 21</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-[24px] p-8 card-glow observe-animate border border-gray-100 dark:border-gray-700" style={{ transitionDelay: '0.1s' }}>
                        <div className="flex items-center gap-1 mb-4">
                            <span className="text-yellow-400 dark:text-yellow-500 text-lg">★★★★★</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">"The financial quizzes taught me more about investing in a week than 4 years of school. And I'm level 18 now! 🔥"</p>
                        <div className="flex items-center gap-4">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face" alt="User" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                            <div>
                                <div className="font-heading font-bold text-gray-900 dark:text-white">Jordan T.</div>
                                <div className="text-gray-500 dark:text-gray-400 text-sm">Young Professional, 24</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-[24px] p-8 card-glow observe-animate border border-gray-100 dark:border-gray-700" style={{ transitionDelay: '0.2s' }}>
                        <div className="flex items-center gap-1 mb-4">
                            <span className="text-yellow-400 dark:text-yellow-500 text-lg">★★★★★</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">"My 47-day streak is my most prized possession. nickle turned me from a spender into a saver. Genuinely life-changing."</p>
                        <div className="flex items-center gap-4">
                            <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face" alt="User" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                            <div>
                                <div className="font-heading font-bold text-gray-900 dark:text-white">Priya S.</div>
                                <div className="text-gray-500 dark:text-gray-400 text-sm">First-time Saver, 22</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
