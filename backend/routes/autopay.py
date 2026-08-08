from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, BankAccount, Autopay, SavingsWallet
from datetime import date

autopay_bp = Blueprint('autopay', __name__)

def get_current_user():
    return User.query.get(int(get_jwt_identity()))

def get_or_create_bank(user_id):
    bank = BankAccount.query.filter_by(user_id=user_id).first()
    if not bank:
        bank = BankAccount(user_id=user_id, balance=0.0)
        db.session.add(bank)
        db.session.commit()
    return bank

FREEZE_DAYS = {
    'EASY': 3,
    'MEDIUM': 1,
    'HARD': 0
}

TARGET_PCT = {
    'EASY': 0.20,
    'MEDIUM': 0.30,
    'HARD': 0.40
}

@autopay_bp.route('/start', methods=['POST'])
@jwt_required()
def start_autopay():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json()
    level = data.get('level', 'EASY').upper()
    
    if level not in FREEZE_DAYS:
        return jsonify({'error': 'Invalid level. Must be EASY, MEDIUM, or HARD'}), 400
        
    # Check for active cycle
    active_cycle = Autopay.query.filter(
        Autopay.user_id == user.id,
        Autopay.status.in_(['ACTIVE', 'PAUSED', 'USER_PAUSED'])
    ).first()
    
    if active_cycle:
        return jsonify({'error': 'An active autopay cycle already exists.'}), 400
        
    bank = get_or_create_bank(user.id)
    
    if bank.balance < 1000:
        return jsonify({'error': 'Minimum balance of ₹1000 is required to start Autopay.'}), 400
        
    target_amount = round(bank.balance * TARGET_PCT[level], 2)
    daily_deduction = round(target_amount / 30, 2)
    
    if target_amount <= 0:
        return jsonify({'error': 'Bank balance is 0. Cannot start autopay.'}), 400
        
    cycle = Autopay(
        user_id=user.id,
        level=level,
        status='ACTIVE',
        target_amount=target_amount,
        daily_deduction=daily_deduction,
        current_day=0,
        freeze_days_left=FREEZE_DAYS[level]
    )
    db.session.add(cycle)
    db.session.commit()
    
    return jsonify({
        'message': 'Autopay cycle started',
        'cycle_id': cycle.id,
        'target_amount': target_amount,
        'daily_deduction': daily_deduction,
        'freeze_days_total': FREEZE_DAYS[level],
        'status': 'ACTIVE'
    }), 201

@autopay_bp.route('/pause', methods=['POST'])
@jwt_required()
def pause_autopay():
    user = get_current_user()
    active_cycle = Autopay.query.filter_by(user_id=user.id, status='ACTIVE').first()
    
    if not active_cycle:
        return jsonify({'error': 'No active autopay cycle to pause.'}), 400
        
    if active_cycle.manual_pauses is None:
        active_cycle.manual_pauses = 0
        
    active_cycle.manual_pauses += 1
    active_cycle.status = 'USER_PAUSED'
    
    if active_cycle.manual_pauses >= 3:
        user.current_streak = 0
        db.session.commit()
        return jsonify({
            'message': 'Autopay paused, but your streak was reset to 0 because you exceeded the 2 pause limit this month!',
            'streak_reset': True
        }), 200
        
    db.session.commit()
    return jsonify({
        'message': f'Autopay paused ({active_cycle.manual_pauses}/2 pauses used).',
        'streak_reset': False,
        'status': 'USER_PAUSED',
        'freeze_days_left': active_cycle.freeze_days_left
    }), 200

@autopay_bp.route('/resume', methods=['POST'])
@jwt_required()
def resume_autopay():
    user = get_current_user()
    paused_cycle = Autopay.query.filter(
        Autopay.user_id == user.id,
        Autopay.status.in_(['USER_PAUSED', 'PAUSED'])
    ).first()
    
    if not paused_cycle:
        return jsonify({'error': 'No paused autopay cycle found.'}), 400
        
    paused_cycle.status = 'ACTIVE'
    db.session.commit()
    
    return jsonify({
        'message': 'Autopay resumed',
        'status': 'ACTIVE',
        'current_day': paused_cycle.current_day
    }), 200

@autopay_bp.route('/stop', methods=['POST'])
@jwt_required()
def stop_autopay():
    user = get_current_user()
    active_cycle = Autopay.query.filter(
        Autopay.user_id == user.id,
        Autopay.status.in_(['ACTIVE', 'PAUSED', 'USER_PAUSED'])
    ).first()
    
    if not active_cycle:
        return jsonify({'error': 'No active autopay cycle to stop.'}), 400
        
    user.current_streak = 0
    active_cycle.status = 'CANCELLED'
    db.session.commit()
    return jsonify({
        'message': 'Autopay stopped. Your streak has been reset to 0.',
        'streak_reset': True,
        'status': 'CANCELLED',
        'days_completed': active_cycle.current_day
    }), 200

@autopay_bp.route('/status', methods=['GET'])
@jwt_required()
def get_autopay_status():
    user = get_current_user()
    cycle = Autopay.query.filter(
        Autopay.user_id == user.id
    ).order_by(Autopay.id.desc()).first()
    
    if not cycle:
        return jsonify({'has_active_cycle': False}), 200
        
    return jsonify({
        'has_active_cycle': cycle.status in ['ACTIVE', 'PAUSED', 'USER_PAUSED'],
        'cycle': {
            'id': cycle.id,
            'level': cycle.level,
            'status': cycle.status,
            'target_amount': cycle.target_amount,
            'daily_deduction': cycle.daily_deduction,
            'current_day': cycle.current_day,
            'days_remaining': 30 - cycle.current_day,
            'freeze_days_left': cycle.freeze_days_left,
            'cycle_start_date': cycle.cycle_start_date.isoformat() if cycle.cycle_start_date else None,
            'last_run_date': cycle.last_run_date.isoformat() if cycle.last_run_date else None
        }
    }), 200

@autopay_bp.route('/wallet', methods=['GET'])
@jwt_required()
def get_wallet():
    user = get_current_user()
    wallet = SavingsWallet.query.filter_by(user_id=user.id).first()
    return jsonify({
        'wallet_balance': wallet.balance if wallet else 0.0,
        'last_updated': wallet.updated_at.isoformat() if wallet and wallet.updated_at else None
    }), 200

@autopay_bp.route('/simulate-day', methods=['POST'])
@jwt_required()
def simulate_day():
    user = get_current_user()
    cycle = Autopay.query.filter(
        Autopay.user_id == user.id,
        Autopay.status.in_(['ACTIVE', 'PAUSED'])
    ).first()
    
    if not cycle:
        return jsonify({'error': 'No active cycle to simulate.'}), 400
        
    from scheduler import process_single_autopay
    # Process it specifically for today + current day count essentially bypassing the date check
    process_single_autopay(cycle, date.today())
    
    return jsonify({'message': 'Simulated one day of autopay.'}), 200

