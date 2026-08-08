import os
from dotenv import load_dotenv
load_dotenv()
from app import create_app
from models import db, Autopay

app = create_app()

with app.app_context():
    active_cycle = Autopay.query.filter_by(status='ACTIVE').first()
    if not active_cycle:
        print("No active cycle found. Creating one for testing.")
        active_cycle = Autopay(user_id=1, level='EASY', target_amount=100.0, daily_deduction=3.33)
        db.session.add(active_cycle)
        db.session.commit()
    
    print(f"Active cycle: {active_cycle.id}, manual_pauses: {active_cycle.manual_pauses}")
    try:
        if active_cycle.manual_pauses is None:
            active_cycle.manual_pauses = 0
            
        active_cycle.manual_pauses += 1
        active_cycle.status = 'USER_PAUSED'
        
        db.session.commit()
        print(f"Successfully paused. new manual_pauses: {active_cycle.manual_pauses}")
    except Exception as e:
        print(f"Error: {e}")
