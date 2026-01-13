from datetime import datetime, timedelta
from bson import ObjectId

class User:
    def __init__(self, email, password_hash, role='visitor', is_verified=False):
        self.email = email
        self.password_hash = password_hash
        self.role = role  # 'visitor' or 'authority'
        self.is_verified = is_verified
        self.created_at = datetime.utcnow()
        self.last_login = None
        self.two_factor_enabled = False
        self.otp_secret = None
        
    def to_dict(self):
        return {
            'email': self.email,
            'password_hash': self.password_hash,
            'role': self.role,
            'is_verified': self.is_verified,
            'created_at': self.created_at,
            'last_login': self.last_login,
            'two_factor_enabled': self.two_factor_enabled,
            'otp_secret': self.otp_secret
        }

class Report:
    def __init__(self, user_email, problem_type, description, location, status='submitted'):
        self.user_email = user_email
        self.problem_type = problem_type
        self.description = description
        self.location = location
        self.status = status  # 'submitted', 'in_process', 'resolved'
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.reference_id = self.generate_reference_id()
        self.photos = []
        self.is_anonymous = False
        self.priority = 'medium'  # 'low', 'medium', 'high'
        
    def generate_reference_id(self):
        import random
        import string
        timestamp = datetime.utcnow().strftime('%Y%m%d')
        random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"CMP-{timestamp}-{random_chars}"
    
    def to_dict(self):
        return {
            'reference_id': self.reference_id,
            'user_email': self.user_email,
            'problem_type': self.problem_type,
            'description': self.description,
            'location': self.location,
            'status': self.status,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'photos': self.photos,
            'is_anonymous': self.is_anonymous,
            'priority': self.priority
        }