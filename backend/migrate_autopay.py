import os
from dotenv import load_dotenv
load_dotenv()
from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE autopay ADD COLUMN manual_pauses INTEGER DEFAULT 0"))
        db.session.commit()
        print("Successfully added manual_pauses to autopay table")
    except Exception as e:
        db.session.rollback()
        print(f"Skipping manual_pauses, might already exist or error: {e}")
        
print("Migration completed.")
