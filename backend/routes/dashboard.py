import os
import json
import logging
import random
from datetime import datetime, timezone, date, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User, Saving, Quiz, QuizAttempt, xp_for_level, GlobalState, Notification, BankAccount, Transaction, Goal

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.before_app_request
def check_season_rollover():
    try:
        now = datetime.now(timezone.utc)
        current_week_str = now.strftime('%G-W%V')
        state = GlobalState.query.filter_by(key='current_season_week').first()
        season_state = GlobalState.query.filter_by(key='current_season_number').first()
        
        if not season_state:
            season_state = GlobalState(key='current_season_number', value='1')
            db.session.add(season_state)
            
        if not state:
            state = GlobalState(key='current_season_week', value=current_week_str)
            db.session.add(state)
            db.session.commit()
            return
            
        if state.value < current_week_str:
            top_users = User.query.filter(User.xp > 0, User.is_verified == True).order_by(User.xp.desc()).all()
            for rank, u in enumerate(top_users, start=1):
                coins = 0
                if rank == 1: coins = 5000
                elif rank == 2: coins = 2500
                elif rank == 3: coins = 1000
                elif rank <= 10: coins = 750
                elif rank <= 50: coins = 500
                elif rank <= 100: coins = 250
                else: coins = 25
                
                u.coins += coins
                msg = f"Season ended! You placed Rank #{rank} and won {coins} Coins!"
                notif = Notification(user_id=u.id, title="Season Rewards 🏆", message=msg, type="reward")
                db.session.add(notif)
                
            User.query.update({'xp': 0})
            state.value = current_week_str
            season_state.value = str(int(season_state.value) + 1)
            db.session.commit()
    except Exception:
        pass

# ─────────────────────────── helpers ───────────────────────────

STREAK_XP_PER_DAY = 50  # Flat XP awarded every day the streak is kept alive

SAVING_CONFIG = {
    'easy':   {'pct': 0.20, 'xp': 100},
    'medium': {'pct': 0.30, 'xp': 200},
    'hard':   {'pct': 0.40, 'xp': 300},
}

def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))

def total_xp_for_level(level: int) -> int:
    n = level - 1
    if n <= 0: return 0
    return (n * (2000 + (n - 1) * 500)) // 2

def level_up(user: User):
    """Check and apply level-up(s) based on cumulative lifetime XP."""
    while True:
        xp_needed_for_next = total_xp_for_level(user.level + 1)
        if user.lifetime_xp >= xp_needed_for_next:
            user.level += 1
            
            # Award Gold Coins based on new level tier
            # Level 1-10 -> 10, 11-20 -> 15, 21-30 -> 20, etc.
            coins_reward = 10 + ((user.level - 1) // 10) * 5
            user.coins += coins_reward
        else:
            break


# ─────────────────────────── routes ────────────────────────────

@dashboard_bp.route('/user-profile', methods=['GET'])
@jwt_required()
def user_profile():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200





@dashboard_bp.route('/streak', methods=['GET'])
@jwt_required()
def streak():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    next_checkpoint = next((c for c in [7, 14, 21, 30, 50] if c > user.current_streak), None)
    return jsonify({
        'current_streak': user.current_streak,
        'last_save_date': str(user.last_save_date) if user.last_save_date else None,
        'xp_per_day': 50,
        'next_checkpoint': next_checkpoint,
    }), 200


def generate_ai_quiz_questions() -> list:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_google_gemini_api_key_here":
        return []
    
    try:
        import google.genai as genai
        client = genai.Client(api_key=api_key)
        
        prompt = (
            "You are a financial educator. Generate 5 multiple-choice questions "
            "about personal finance (topics: Saving, Budgeting, Interest, Investing). "
            "Return the output STRICTLY as a valid JSON array of objects. "
            "Do not include markdown json block syntax (like ```json), just raw array. "
            "Each object must have the following exact keys: "
            '"topic", "question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation". '
            'The "correct_answer" must be exactly one of "a", "b", "c", or "d". '
            'The "explanation" must be a concise 1-2 sentence explanation of why the correct answer is right. '
            "Ensure questions are practical, accurate, and unique."
        )
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        text = response.text.strip()
        
        # Strip markdown code fences if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        data = json.loads(text)
        
        new_questions = []
        for item in data:
            q = Quiz(
                topic=item.get("topic", "Finance"),
                question=item.get("question"),
                option_a=item.get("option_a"),
                option_b=item.get("option_b"),
                option_c=item.get("option_c"),
                option_d=item.get("option_d"),
                correct_answer=item.get("correct_answer", "a").lower(),
                explanation=item.get("explanation", "")
            )
            new_questions.append(q)
            
        print(f"SUCCESS: Generated {len(new_questions)} AI questions!")
        return new_questions
    except Exception as e:
        print(f"AI GENERATION FAILED: {e}")
        logging.error(f"Error generating AI quiz questions: {e}")
        return []

@dashboard_bp.route('/weekly-quiz', methods=['GET'])
@jwt_required()
def weekly_quiz():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check if already attempted this week
    week_start = date.today() - timedelta(days=date.today().weekday())
    attempt = QuizAttempt.query.filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.attempt_date >= week_start
    ).first()

    # If already attempted, just return a random sample to display standard completion UI,
    # avoid unnecessary AI token costs since they can't submit anyway
    if attempt:
        questions = Quiz.query.all()
        sample = random.sample(questions, min(5, len(questions))) if questions else []
        return jsonify({
            'questions': [q.to_dict() for q in sample],
            'already_attempted': True,
            'coins_earned_this_week': attempt.coins_earned,
        }), 200

    # Try to generate new AI questions on the fly
    ai_questions = generate_ai_quiz_questions()
    
    if len(ai_questions) == 5:
        # Save to database to allocate IDs required for submission check
        db.session.add_all(ai_questions)
        db.session.commit()
        sample = ai_questions
    else:
        # Fallback to existing pool
        questions = Quiz.query.all()
        if not questions:
            return jsonify({'error': 'No quiz questions available yet', 'questions': []}), 200
        sample = random.sample(questions, min(5, len(questions)))

    return jsonify({
        'questions': [q.to_dict() for q in sample],
        'already_attempted': False,
        'coins_earned_this_week': 0,
    }), 200


@dashboard_bp.route('/submit-quiz', methods=['POST'])
@jwt_required()
def submit_quiz():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Block re-attempt this week
    week_start = date.today() - timedelta(days=date.today().weekday())
    existing = QuizAttempt.query.filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.attempt_date >= week_start
    ).first()
    if existing:
        return jsonify({'error': 'You already completed this week\'s quiz'}), 409

    data = request.get_json()
    answers = data.get('answers', {})  # {question_id: 'a'|'b'|'c'|'d'}

    question_ids = [int(k) for k in answers.keys()]
    questions = Quiz.query.filter(Quiz.id.in_(question_ids)).all()

    score = sum(1 for q in questions if answers.get(str(q.id), '').lower() == q.correct_answer)
    total = len(questions)

    # Coin reward tiers
    if score == total and total >= 5:
        coins = 200
    elif score >= 5:
        coins = 120
    elif score >= 3:
        coins = 60
    elif score >= 1:
        coins = 20
    else:
        coins = 0

    user.coins += coins
    db.session.add(QuizAttempt(user_id=user.id, score=score, coins_earned=coins))
    db.session.commit()

    return jsonify({
        'score': score,
        'total': total,
        'coins_earned': coins,
        'user': user.to_dict(),
        'results': [
            {
                'id': q.id,
                'question': q.question,
                'user_answer': answers.get(str(q.id), '').lower(),
                'correct_answer': q.correct_answer,
                'explanation': q.explanation
            } for q in questions
        ]
    }), 200


@dashboard_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def leaderboard():
    user = get_current_user()
    top_users = User.query.filter_by(is_verified=True).order_by(User.xp.desc()).limit(100).all()

    def rank_coins(rank):
        if rank == 1: return 5000
        if rank == 2: return 2500
        if rank == 3: return 1000
        if rank <= 10: return 750
        if rank <= 50: return 500
        if rank <= 100: return 250
        return 25

    board = [
        {
            'rank': i + 1,
            'name': u.full_name,
            'xp': u.xp,   # display ONLY Season XP
            'level': u.level,
            'coins': u.coins,
            'rank_coins': rank_coins(i + 1),
            'is_current_user': u.id == user.id,
        }
        for i, u in enumerate(top_users)
    ]

    # Find current user's rank if not in top 100
    user_rank = next((e['rank'] for e in board if e['is_current_user']), None)
    if user_rank is None:
        count = User.query.filter(User.xp > user.xp, User.is_verified == True).count()
        user_rank = count + 1
    season_state = GlobalState.query.filter_by(key='current_season_number').first()
    season = int(season_state.value) if season_state else 1

    return jsonify({'leaderboard': board, 'your_rank': user_rank, 'season': season}), 200


@dashboard_bp.route('/coins', methods=['GET'])
@jwt_required()
def coins():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'coins': user.coins, 'user': user.to_dict()}), 200


@dashboard_bp.route('/seed-quiz', methods=['POST'])
def seed_quiz():
    """Seed question bank (admin only in dev — no auth for simplicity)."""
    # Clear existing questions to allow fresh seeding if requested
    data = request.get_json() or {}
    force = data.get('force', False)
    
    if Quiz.query.count() > 0 and not force:
        return jsonify({'message': 'Already seeded. Use {"force": true} to re-seed.'}), 200
    
    if force:
        Quiz.query.delete()

    questions = [
        # Saving
        Quiz(topic='Saving', question='What percentage of income does the 50/30/20 rule recommend saving?',
             option_a='10%', option_b='20%', option_c='30%', option_d='40%', correct_answer='b'),
        Quiz(topic='Saving', question='Which saving method involves setting aside money automatically each month?',
             option_a='Manual saving', option_b='Pay yourself first', option_c='Impulse saving', option_d='Budget saving', correct_answer='b'),
        Quiz(topic='Saving', question='An emergency fund should ideally cover how many months of expenses?',
             option_a='1', option_b='2', option_c='3–6', option_d='12', correct_answer='c'),
        Quiz(topic='Saving', question='What is the best account for an emergency fund?',
             option_a='Stocks', option_b='Savings account', option_c='Crypto', option_d='Real estate', correct_answer='b'),
        # Budgeting
        Quiz(topic='Budgeting', question='What does a "zero-based budget" mean?',
             option_a='Spending nothing', option_b='Every rupee is assigned a job', option_c='Only spending on needs', option_d='Saving zero money', correct_answer='b'),
        Quiz(topic='Budgeting', question='Which of the following is a "need"?',
             option_a='New phone', option_b='Movie tickets', option_c='Rent', option_d='Dining out', correct_answer='c'),
        Quiz(topic='Budgeting', question='Tracking expenses helps you to:',
             option_a='Earn more money', option_b='Identify spending habits', option_c='Avoid taxes', option_d='Get bank loans', correct_answer='b'),
        # Interest
        Quiz(topic='Interest', question='What is compound interest?',
             option_a='Interest on principal only', option_b='Interest on interest', option_c='Interest paid once', option_d='Zero-rate interest', correct_answer='b'),
        Quiz(topic='Interest', question='Which type of interest grows your savings faster?',
             option_a='Simple interest', option_b='Compound interest', option_c='Fixed interest', option_d='Flat rate interest', correct_answer='b'),
        Quiz(topic='Interest', question='If you save ₹1000 at 10% simple interest for 2 years, interest earned is:',
             option_a='₹100', option_b='₹200', option_c='₹210', option_d='₹220', correct_answer='b'),
        # Investing
        Quiz(topic='Investing', question='What does a mutual fund do?',
             option_a='Lends money to banks', option_b='Pools money from investors to buy assets', option_c='Prints currency', option_d='Pays fixed salary', correct_answer='b'),
        Quiz(topic='Investing', question='What is a stock?',
             option_a='A loan to a company', option_b='Part ownership in a company', option_c='A type of savings account', option_d='Government bond', correct_answer='b'),
        Quiz(topic='Investing', question='Diversification in investing means:',
             option_a='Putting all money in one asset', option_b='Spreading investments across assets', option_c='Avoiding investments', option_d='Only buying gold', correct_answer='b'),
        Quiz(topic='Investing', question='What is a SIP (Systematic Investment Plan)?',
             option_a='One-time large investment', option_b='Regular fixed-amount investment', option_c='Government scheme', option_d='Bank loan', correct_answer='b'),
        Quiz(topic='Investing', question='Risk and return in investing are generally:',
             option_a='Unrelated', option_b='Inversely related', option_c='Directly related', option_d='Always equal', correct_answer='c'),
    ]
    db.session.bulk_save_objects(questions)
    db.session.commit()
    return jsonify({'message': f'Seeded {len(questions)} questions'}), 201


@dashboard_bp.route('/reset-quiz', methods=['POST'])
def reset_quiz():
    """Clear all quiz questions and user attempts (admin only)."""
    try:
        QuizAttempt.query.delete()
        Quiz.query.delete()
        db.session.commit()
        return jsonify({'message': 'Quiz data reset successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


FINANCE_FALLBACK = {
    'emergency': "**Emergency Fund:** Aim for 3–6 months of expenses in a liquid FD or high-yield savings. Even ₹500/month is a great start!",
    'invest': "**Investing in India:** Start with ELSS (80C tax benefit), then PPF for guaranteed returns. SIPs from ₹500/month — consistency beats timing!",
    '50/30/20': "**50/30/20 Rule:** 50% on needs (rent, food), 30% on wants (entertainment), and 20% saved/invested. Simplest budgeting framework!",
    'sip': "**SIPs:** Invest a fixed monthly amount in mutual funds. ₹1000/month for 20 years at 12% = ₹20L+! Start on Groww or Zerodha Coin.",
    'budget': "**Budgeting Tip:** Track every expense for 30 days to find leaks. Use the envelope method — split cash into rent, groceries, and fun!",
    'debt': "**Debt Payoff:** Use the avalanche method — pay minimums everywhere, then dump extra cash on the highest-interest debt first (credit cards first).",
    'credit': "**Credit Score:** Pay on time, keep utilization below 30%, and avoid opening many new accounts. 750+ gets you the best loan rates!",
    'save': "**Saving Tips:** Automate savings on payday before spending anything. ₹200/day saved = ₹72,000/year!",
    'gold': "**Gold:** Consider Sovereign Gold Bonds (SGBs) — earn 2.5% interest + price appreciation. Safer than physical gold!",
    'ppf': "**PPF:** 15-year lock-in with 7.1% tax-free returns. Max deposit: ₹1.5 lakh/year. Perfect for retirement savings.",
    'fd': "**Fixed Deposits:** Safe returns of 5–7%, but barely beat inflation. Use for short-term goals (1–3 years) only.",
    'mutual fund': "**Mutual Funds:** Mix large-cap, mid-cap, and debt funds. Index funds are great for beginners — low cost, market-matching returns!",
    'insurance': "**Insurance First!** Get term life (10x annual income) and health insurance (₹5–10L cover) before investing anything else.",
    'tax': "**Tax Saving:** Max out 80C (₹1.5L) with ELSS + PPF + EPF. Add NPS (80CCD) for an extra ₹50K deduction!",
    'inflation': "**Beating Inflation:** India's inflation is ~6% yearly. Equity mutual funds historically return 12–15% long-term — your savings must outpace it!",
}

def get_finance_fallback(message: str) -> str:
    msg_lower = message.lower()
    for keyword, response in FINANCE_FALLBACK.items():
        if keyword in msg_lower:
            return response
    return ("Here's some universal financial wisdom:\n\n"
           "🎯 Save 20% of income automatically on payday.\n"
           "📈 Start a SIP — even ₹1,000/month compounds massively over time!\n"
           "🛡️ Get term life + health insurance before investing.")

@dashboard_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    user_message = data.get('message', '').strip()
    history = data.get('history', [])  # [{role, text}]

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key or api_key == 'your_google_gemini_api_key_here':
        return jsonify({'error': 'AI service is not configured'}), 503

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        
        # Gather enriched context
        bank_account = BankAccount.query.filter_by(user_id=user.id).first()
        balance = bank_account.balance if bank_account else 0.0
        
        recent_txs = Transaction.query.filter_by(user_id=user.id).order_by(Transaction.created_at.desc()).limit(5).all()
        tx_str = "\n".join([f"- {t.type}: ₹{t.amount} ({t.description})" for t in recent_txs]) if recent_txs else "No recent transactions."
        
        active_goals = Goal.query.filter_by(user_id=user.id, status='ACTIVE').all()
        goals_str = "\n".join([f"- {g.name}: Target ₹{g.target_amount}, Saved ₹{g.saved_amount}, Due: {g.current_completion_date.strftime('%b %d, %Y')}" for g in active_goals]) if active_goals else "No active goals."

        system_prompt = f"""You are Nickel AI, a highly professional, modern, and friendly personal finance advisor embedded in the Nickel FinTech app.

Here is the current user's profile and financial context:
- Name: {user.email.split('@')[0].capitalize()}
- Level: {user.level} (XP: {user.xp}, Coins: {user.coins})
- Current Streak: {user.current_streak} days
- Bank Balance: ₹{balance}
- Total Saved: ₹{user.total_saved or 0}

Recent Transactions (Spends/Deposits):
{tx_str}

Active Savings Goals:
{goals_str}

Your role is to give this specific user personalized, actionable financial advice based on their profile data above.
Rules:
1. You MUST only answer questions about personal finance (saving, budgeting, investing, spending, debt, etc.).
2. If asked about anything unrelated to finance, politely decline and redirect to finance topics.
3. Keep responses concise (2-4 sentences max), friendly, and extremely professional. Use markdown for styling (bolding, lists).
4. Reference the user's actual data (balance, recent spends, active goals) when relevant to make advice feel personal and accurate.
5. If you notice large spends compared to their balance, politely offer a warning.
6. Use Indian Rupee (₹) as the currency context."""

        # Build conversation history for multi-turn
        contents = []
        for msg in history[-10:]:  # last 10 messages for context
            role = "user" if msg['role'] == 'user' else "model"
            contents.append(types.Content(role=role, parts=[types.Part(text=msg['text'])]))

        contents.append(types.Content(role="user", parts=[types.Part(text=user_message)]))

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system_prompt)
        )

        return jsonify({'reply': response.text}), 200

    except Exception as e:
        err_str = str(e)
        logging.error(f"Chat error: {e}")
        if '429' in err_str or 'RESOURCE_EXHAUSTED' in err_str or 'retryDelay' in err_str:
            fallback = get_finance_fallback(user_message)
            return jsonify({'reply': fallback, 'fallback': True}), 200
        return jsonify({'reply': "Sorry, I'm having trouble connecting right now. Please try again in a moment."}), 200


@dashboard_bp.route('/spend-coins', methods=['POST'])
@jwt_required()
def spend_coins():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    amount = data.get('amount', 0)
    reason = data.get('reason', 'Shop purchase')

    if not isinstance(amount, int) or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    if user.coins < amount:
        return jsonify({'error': f'Insufficient coins. You have {user.coins} but need {amount}.'}), 400

    user.coins -= amount
    db.session.commit()
    logging.info(f"User {user.id} spent {amount} coins: {reason}. Remaining: {user.coins}")
    return jsonify({'message': f'Successfully redeemed! {amount} coins spent.', 'coins': user.coins}), 200


@dashboard_bp.route('/savings-history', methods=['GET'])
@jwt_required()
def savings_history():
    from models import Transaction
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    thirty_days_ago = date.today() - timedelta(days=30)
    savings = Transaction.query.filter(
        Transaction.user_id == user.id,
        Transaction.type == 'DEBIT',
        Transaction.created_at >= thirty_days_ago
    ).order_by(Transaction.created_at.asc()).all()

    daily_totals = {}
    for s in savings:
        if s.created_at:
            date_str = s.created_at.strftime('%Y-%m-%d')
            daily_totals[date_str] = daily_totals.get(date_str, 0) + s.amount

    history = []
    for i in range(30, -1, -1):
        day = date.today() - timedelta(days=i)
        day_str = day.strftime('%Y-%m-%d')
        label = day.strftime('%d %b')  # e.g., '25 Mar'
        history.append({
            'date': day_str,
            'label': label,
            'amount': round(daily_totals.get(day_str, 0), 2)
        })

    return jsonify({'history': history}), 200

@dashboard_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user = get_current_user()
    notifs = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(20).all()
    return jsonify({'notifications': [n.to_dict() for n in notifs]}), 200

@dashboard_bp.route('/notifications/read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    user = get_current_user()
    Notification.query.filter_by(user_id=user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'Notifications marked as read'}), 200

