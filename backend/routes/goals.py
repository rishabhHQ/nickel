import math
from datetime import datetime, timezone, date, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User, Goal, GoalAutoSaving, GoalTransaction, GoalDelayHistory

goals_bp = Blueprint('goals', __name__)

@goals_bp.route('/', methods=['GET'])
@jwt_required()
def get_goals():
    user_id = get_jwt_identity()
    goals = Goal.query.filter_by(user_id=user_id).all()
    
    active_goals = [g for g in goals if g.status == 'ACTIVE']
    completed_goals = [g for g in goals if g.status == 'COMPLETED']
    
    total_saved = sum(g.saved_amount for g in goals)
    total_target = sum(g.target_amount for g in goals)
    total_remaining = sum(g.target_amount - g.saved_amount for g in active_goals)
    
    # Calculate average progress
    progress_sum = 0
    for g in active_goals:
        progress = (g.saved_amount / g.target_amount) * 100 if g.target_amount > 0 else 0
        progress_sum += min(progress, 100)
    avg_progress = progress_sum / len(active_goals) if active_goals else 0
    
    # Calculate monthly saving (based on auto savings of active goals)
    monthly_saving = 0
    auto_savings = GoalAutoSaving.query.join(Goal).filter(Goal.user_id == user_id, Goal.status == 'ACTIVE').all()
    for a_s in auto_savings:
        if a_s.frequency == 'DAILY':
            monthly_saving += a_s.amount * 30
        elif a_s.frequency == 'WEEKLY':
            monthly_saving += a_s.amount * 4
        elif a_s.frequency == 'MONTHLY':
            monthly_saving += a_s.amount
        elif a_s.frequency == 'CUSTOM' and a_s.custom_days and a_s.custom_days > 0:
            monthly_saving += a_s.amount * (30 / a_s.custom_days)

    goals_data = []
    for g in goals:
        g_dict = g.to_dict()
        a_s = next((a for a in auto_savings if a.goal_id == g.id), None)
        if not a_s:
            a_s = GoalAutoSaving.query.filter_by(goal_id=g.id).first()
        g_dict['auto_saving'] = a_s.to_dict() if a_s else None
        goals_data.append(g_dict)

    return jsonify({
        'goals': goals_data,
        'summary': {
            'total_active': len(active_goals),
            'total_completed': len(completed_goals),
            'total_saved': total_saved,
            'total_remaining': total_remaining,
            'avg_progress': avg_progress,
            'monthly_saving_rate': monthly_saving
        }
    }), 200

@goals_bp.route('/', methods=['POST'])
@jwt_required()
def create_goal():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    name = data.get('name')
    target_amount = float(data.get('target_amount', 0))
    target_date_str = data.get('target_date')
    icon = data.get('icon', '🎯')
    description = data.get('description', '')
    
    if not name or not target_amount or not target_date_str:
        return jsonify({'error': 'Missing required fields'}), 400
        
    target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
    
    goal = Goal(
        user_id=user_id,
        name=name,
        target_amount=target_amount,
        target_date=target_date,
        original_completion_date=target_date,
        current_completion_date=target_date,
        icon=icon,
        description=description
    )
    db.session.add(goal)
    db.session.flush() # get goal.id
    
    auto_saving_data = data.get('auto_saving')
    if auto_saving_data:
        freq = auto_saving_data.get('frequency', 'MONTHLY')
        amount = float(auto_saving_data.get('amount', 0))
        custom_days = auto_saving_data.get('custom_days', None)
        
        # calculate next run date (tomorrow for daily, etc., keep it simple)
        next_run = date.today() + timedelta(days=1)
        
        auto_saving = GoalAutoSaving(
            goal_id=goal.id,
            frequency=freq,
            custom_days=custom_days,
            amount=amount,
            next_run_date=next_run
        )
        db.session.add(auto_saving)
        
    db.session.commit()
    return jsonify({'message': 'Goal created successfully', 'goal': goal.to_dict()}), 201

@goals_bp.route('/<int:goal_id>', methods=['GET'])
@jwt_required()
def get_goal(goal_id):
    user_id = get_jwt_identity()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
        
    auto_saving = GoalAutoSaving.query.filter_by(goal_id=goal.id).first()
    transactions = GoalTransaction.query.filter_by(goal_id=goal.id).order_by(GoalTransaction.created_at.desc()).all()
    delay_history = GoalDelayHistory.query.filter_by(goal_id=goal.id).order_by(GoalDelayHistory.created_at.desc()).all()
    
    goal_dict = goal.to_dict()
    goal_dict['auto_saving'] = auto_saving.to_dict() if auto_saving else None
    goal_dict['transactions'] = [t.to_dict() for t in transactions]
    goal_dict['delay_history'] = [d.to_dict() for d in delay_history]
    
    return jsonify(goal_dict), 200

@goals_bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    user_id = get_jwt_identity()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
        
    GoalAutoSaving.query.filter_by(goal_id=goal.id).delete()
    GoalTransaction.query.filter_by(goal_id=goal.id).delete()
    GoalDelayHistory.query.filter_by(goal_id=goal.id).delete()
    db.session.delete(goal)
    db.session.commit()
    
    return jsonify({'message': 'Goal deleted'}), 200

@goals_bp.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
def edit_goal(goal_id):
    user_id = get_jwt_identity()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
        
    data = request.get_json()
    if 'name' in data and data['name']:
        goal.name = data['name']
    if 'target_amount' in data:
        try:
            goal.target_amount = float(data['target_amount'])
        except ValueError:
            pass
    if 'description' in data:
        goal.description = data['description']
            
    db.session.commit()
    return jsonify({'message': 'Goal updated', 'goal': goal.to_dict()}), 200

@goals_bp.route('/<int:goal_id>/status', methods=['PUT'])
@jwt_required()
def update_goal_status(goal_id):
    user_id = get_jwt_identity()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
        
    if goal.status == 'ACTIVE':
        goal.status = 'PAUSED'
    elif goal.status == 'PAUSED':
        goal.status = 'ACTIVE'
        
    db.session.commit()
    return jsonify({'message': 'Goal status updated', 'status': goal.status}), 200

@goals_bp.route('/<int:goal_id>/simulate-purchase', methods=['POST'])
@jwt_required()
def simulate_purchase(goal_id):
    user_id = get_jwt_identity()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
        
    data = request.get_json()
    purchase_amount = float(data.get('purchase_amount', 0))
    
    if purchase_amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
        
    auto_saving = GoalAutoSaving.query.filter_by(goal_id=goal.id).first()
    
    if not auto_saving or auto_saving.amount <= 0:
        return jsonify({'error': 'No auto-saving configured to calculate delay'}), 400
        
    # Calculate daily saving rate
    daily_rate = 0
    if auto_saving.frequency == 'DAILY':
        daily_rate = auto_saving.amount
    elif auto_saving.frequency == 'WEEKLY':
        daily_rate = auto_saving.amount / 7.0
    elif auto_saving.frequency == 'MONTHLY':
        daily_rate = auto_saving.amount / 30.0
    elif auto_saving.frequency == 'CUSTOM' and auto_saving.custom_days:
        daily_rate = auto_saving.amount / float(auto_saving.custom_days)
        
    if daily_rate <= 0:
        return jsonify({'error': 'Invalid daily saving rate'}), 400
        
    delay_days = math.ceil(purchase_amount / daily_rate)
    new_completion_date = goal.current_completion_date + timedelta(days=delay_days)
    
    return jsonify({
        'delay_days': delay_days,
        'new_completion_date': new_completion_date.isoformat(),
        'current_completion_date': goal.current_completion_date.isoformat(),
        'goal_name': goal.name
    }), 200

@goals_bp.route('/<int:goal_id>/decision', methods=['POST'])
@jwt_required()
def purchase_decision(goal_id):
    user_id = get_jwt_identity()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
        
    data = request.get_json()
    decision = data.get('decision') # 'SKIP' or 'BUY'
    purchase_amount = float(data.get('purchase_amount', 0))
    purchase_name = data.get('purchase_name', 'Unknown Item')
    
    if decision not in ['SKIP', 'BUY'] or purchase_amount <= 0:
        return jsonify({'error': 'Invalid request'}), 400
        
    if decision == 'SKIP':
        goal.saved_amount += purchase_amount
        
        if goal.saved_amount >= goal.target_amount:
            goal.status = 'COMPLETED'
            goal.current_completion_date = date.today()
        else:
            auto_saving = GoalAutoSaving.query.filter_by(goal_id=goal.id).first()
            if auto_saving:
                daily_rate = 0
                if auto_saving.frequency == 'DAILY': daily_rate = auto_saving.amount
                elif auto_saving.frequency == 'WEEKLY': daily_rate = auto_saving.amount / 7.0
                elif auto_saving.frequency == 'MONTHLY': daily_rate = auto_saving.amount / 30.0
                elif auto_saving.frequency == 'CUSTOM' and auto_saving.custom_days: daily_rate = auto_saving.amount / float(auto_saving.custom_days)
                
                if daily_rate > 0:
                    advance_days = math.ceil(purchase_amount / daily_rate)
                    goal.current_completion_date -= timedelta(days=advance_days)
                    if goal.current_completion_date < date.today():
                        goal.current_completion_date = date.today()
        
        tx = GoalTransaction(goal_id=goal.id, type='CREDIT', amount=purchase_amount, description=f'Skipped purchase: {purchase_name}')
        db.session.add(tx)
        
    elif decision == 'BUY':
        auto_saving = GoalAutoSaving.query.filter_by(goal_id=goal.id).first()
        if auto_saving:
            daily_rate = 0
            if auto_saving.frequency == 'DAILY': daily_rate = auto_saving.amount
            elif auto_saving.frequency == 'WEEKLY': daily_rate = auto_saving.amount / 7.0
            elif auto_saving.frequency == 'MONTHLY': daily_rate = auto_saving.amount / 30.0
            elif auto_saving.frequency == 'CUSTOM' and auto_saving.custom_days: daily_rate = auto_saving.amount / float(auto_saving.custom_days)
            
            if daily_rate > 0:
                delay_days = math.ceil(purchase_amount / daily_rate)
                prev_date = goal.current_completion_date
                goal.current_completion_date += timedelta(days=delay_days)
                
                delay_hist = GoalDelayHistory(
                    goal_id=goal.id,
                    purchase_name=purchase_name,
                    purchase_amount=purchase_amount,
                    delay_days=delay_days,
                    previous_completion_date=prev_date,
                    new_completion_date=goal.current_completion_date
                )
                db.session.add(delay_hist)
                
        tx = GoalTransaction(goal_id=goal.id, type='SPLURGE', amount=purchase_amount, description=f'Bought: {purchase_name}')
        db.session.add(tx)
        
    db.session.commit()
    
    return jsonify({
        'message': 'Decision recorded',
        'goal': goal.to_dict()
    }), 200

@goals_bp.route('/<int:goal_id>/autopay/run', methods=['POST'])
@jwt_required()
def run_goal_autopay(goal_id):
    user_id = get_jwt_identity()
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
        
    auto_saving = GoalAutoSaving.query.filter_by(goal_id=goal.id).first()
    if not auto_saving:
        return jsonify({'error': 'No auto-saving configured for this goal'}), 400
        
    if goal.status != 'ACTIVE':
        return jsonify({'error': f'Goal is {goal.status}, cannot run autopay'}), 400
        
    from scheduler import process_goal_autopay
    from datetime import date
    
    # We call the scheduler function directly for manual test
    try:
        process_goal_autopay(auto_saving, date.today())
        
        # After execution, fetch latest state to return
        db.session.refresh(goal)
        db.session.refresh(auto_saving)
        
        latest_tx = GoalTransaction.query.filter_by(goal_id=goal.id, type='GOAL_AUTOPAY').order_by(GoalTransaction.id.desc()).first()
        
        return jsonify({
            'message': 'AutoPay executed',
            'goal': goal.to_dict(),
            'transaction': latest_tx.to_dict() if latest_tx else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

