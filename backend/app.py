import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from models import db
from routes.auth import auth_bp, bcrypt
from routes.dashboard import dashboard_bp
from routes.bank import bank_bp
from routes.autopay import autopay_bp
from routes.goals import goals_bp
from scheduler import start_scheduler

def create_app():
    app = Flask(__name__)

    # Config
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'change_me')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

    # Extensions
    CORS(app, origins=['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'], supports_credentials=True)
    db.init_app(app)
    bcrypt.init_app(app)
    JWTManager(app)

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(bank_bp, url_prefix='/api/bank')
    app.register_blueprint(autopay_bp, url_prefix='/api/autopay')
    app.register_blueprint(goals_bp, url_prefix='/api/goals')

    # Create tables
    with app.app_context():
        db.create_all()
        
    start_scheduler(app)

    return app


if __name__ == '__main__':
    app = create_app()
    print(">>> Nickel backend running on http://localhost:5000")
    app.run(debug=True, port=5000)
