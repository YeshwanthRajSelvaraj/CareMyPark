import bcrypt
import pyotp
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
# import firebase_admin
# from firebase_admin import auth, credentials
from config import Config

# Initialize Firebase
# cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS)
# firebase_admin.initialize_app(cred)

def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed_password):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_otp_secret():
    """Generate a new OTP secret for 2FA"""
    return pyotp.random_base32()

def verify_otp(secret, otp):
    """Verify OTP using TOTP"""
    totp = pyotp.TOTP(secret)
    return totp.verify(otp)

def generate_token(user_email, role):
    """Generate JWT token for authentication"""
    payload = {
        'email': user_email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        request.user = payload
        return f(*args, **kwargs)
    return decorated

def role_required(required_role):
    """Decorator to check user role"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if request.user.get('role') != required_role:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator