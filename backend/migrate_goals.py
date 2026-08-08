import os
from dotenv import load_dotenv
load_dotenv()
from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    columns = [
        "status VARCHAR(20) DEFAULT 'SUCCESS'",
        "source VARCHAR(100) DEFAULT 'Dummy Bank'",
        "destination VARCHAR(100) DEFAULT 'Goal Wallet'",
        "reason VARCHAR(255)",
        "remaining_balance FLOAT",
        "current_balance FLOAT"
    ]
    
    for col in columns:
        col_name = col.split()[0]
        try:
            db.session.execute(text(f"ALTER TABLE goal_transactions ADD COLUMN {col}"))
            db.session.commit()
            print(f"Successfully added {col_name}")
        except Exception as e:
            db.session.rollback()
            print(f"Skipping {col_name}, might already exist.")
            
print("Migration completed.")
