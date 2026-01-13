from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_pymongo import PyMongo
import os
from werkzeug.utils import secure_filename
from config import Config
from auth import hash_password, verify_password, generate_token, verify_otp, generate_otp_secret, token_required, role_required
from models import User, Report
from datetime import datetime
import json

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Initialize MongoDB
mongo = PyMongo(app)

# Create upload folder
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'visitor')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Check if user already exists
    if mongo.db.users.find_one({'email': email}):
        return jsonify({'error': 'User already exists'}), 409
    
    # Create new user
    user = User(
        email=email,
        password_hash=hash_password(password),
        role=role
    )
    
    # Insert into database
    mongo.db.users.insert_one(user.to_dict())
    
    return jsonify({
        'message': 'User registered successfully',
        'email': email,
        'role': role
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Find user
    user_data = mongo.db.users.find_one({'email': email})
    if not user_data:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Verify password
    if not verify_password(password, user_data['password_hash']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Check if 2FA is enabled
    if user_data.get('two_factor_enabled'):
        return jsonify({
            'message': '2FA required',
            'email': email,
            'requires_2fa': True
        }), 200
    
    # Generate token
    token = generate_token(email, user_data['role'])
    
    # Update last login
    mongo.db.users.update_one(
        {'email': email},
        {'$set': {'last_login': datetime.utcnow()}}
    )
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'email': email,
            'role': user_data['role']
        }
    }), 200

@app.route('/api/verify-2fa', methods=['POST'])
def verify_2fa():
    """Verify 2FA OTP"""
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    
    if not email or not otp:
        return jsonify({'error': 'Email and OTP are required'}), 400
    
    user_data = mongo.db.users.find_one({'email': email})
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
    
    secret = user_data.get('otp_secret')
    if not secret or not verify_otp(secret, otp):
        return jsonify({'error': 'Invalid OTP'}), 401
    
    # Generate token
    token = generate_token(email, user_data['role'])
    
    return jsonify({
        'message': '2FA verification successful',
        'token': token,
        'user': {
            'email': email,
            'role': user_data['role']
        }
    }), 200

@app.route('/api/enable-2fa', methods=['POST'])
def enable_2fa():
    """Enable 2FA for user"""
    from auth import token_required
    
    user_email = request.user.get('email')
    user_data = mongo.db.users.find_one({'email': user_email})
    
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
    
    # Generate new secret
    secret = generate_otp_secret()
    
    # Update user with 2FA secret
    mongo.db.users.update_one(
        {'email': user_email},
        {'$set': {
            'two_factor_enabled': True,
            'otp_secret': secret
        }}
    )
    
    # Generate provisioning URL for authenticator apps
    import pyotp
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user_email,
        issuer_name="CareMyPark"
    )
    
    return jsonify({
        'message': '2FA enabled successfully',
        'secret': secret,
        'provisioning_uri': provisioning_uri
    }), 200

@app.route('/api/reports', methods=['POST'])
@token_required
def create_report():
    """Create a new report"""
    data = request.form
    files = request.files
    
    user_email = request.user.get('email')
    
    report = Report(
        user_email=user_email,
        problem_type=data.get('problem_type'),
        description=data.get('description'),
        location=data.get('location', 'Unknown'),
        status='submitted'
    )
    
    # Handle anonymous reporting
    if data.get('is_anonymous') == 'true':
        report.is_anonymous = True
    
    # Handle file uploads
    photo_urls = []
    if 'photos' in files:
        for file in files.getlist('photos'):
            if file and allowed_file(file.filename):
                filename = secure_filename(f"{report.reference_id}_{file.filename}")
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                photo_urls.append(f"/uploads/{filename}")
    
    report.photos = photo_urls
    
    # Insert report into database
    mongo.db.reports.insert_one(report.to_dict())
    
    return jsonify({
        'message': 'Report submitted successfully',
        'reference_id': report.reference_id,
        'report': report.to_dict()
    }), 201

@app.route('/api/reports', methods=['GET'])
@token_required
def get_reports():
    """Get reports (filtered based on user role)"""
    user_email = request.user.get('email')
    user_role = request.user.get('role')
    
    # Build query based on user role
    query = {}
    if user_role == 'visitor':
        query['user_email'] = user_email
    else:
        # Authorities can filter
        status = request.args.get('status')
        problem_type = request.args.get('problem_type')
        priority = request.args.get('priority')
        
        if status:
            query['status'] = status
        if problem_type:
            query['problem_type'] = problem_type
        if priority:
            query['priority'] = priority
    
    # Get reports
    reports = list(mongo.db.reports.find(query).sort('created_at', -1).limit(50))
    
    # Convert ObjectId to string
    for report in reports:
        report['_id'] = str(report['_id'])
        # Hide email for anonymous reports
        if report.get('is_anonymous') and user_role == 'authority':
            report['user_email'] = 'Anonymous'
    
    return jsonify({'reports': reports}), 200

@app.route('/api/reports/<reference_id>', methods=['GET'])
@token_required
def get_report(reference_id):
    """Get a specific report"""
    report = mongo.db.reports.find_one({'reference_id': reference_id})
    
    if not report:
        return jsonify({'error': 'Report not found'}), 404
    
    # Check permissions
    user_email = request.user.get('email')
    user_role = request.user.get('role')
    
    if user_role == 'visitor' and report['user_email'] != user_email:
        return jsonify({'error': 'Access denied'}), 403
    
    report['_id'] = str(report['_id'])
    return jsonify({'report': report}), 200

@app.route('/api/reports/<reference_id>/status', methods=['PUT'])
@role_required('authority')
def update_report_status(reference_id):
    """Update report status (authority only)"""
    data = request.json
    new_status = data.get('status')
    priority = data.get('priority')
    
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400
    
    valid_statuses = ['submitted', 'in_process', 'resolved']
    if new_status not in valid_statuses:
        return jsonify({'error': f'Status must be one of: {valid_statuses}'}), 400
    
    update_data = {
        'status': new_status,
        'updated_at': datetime.utcnow()
    }
    
    if priority:
        update_data['priority'] = priority
    
    result = mongo.db.reports.update_one(
        {'reference_id': reference_id},
        {'$set': update_data}
    )
    
    if result.modified_count == 0:
        return jsonify({'error': 'Report not found or no changes made'}), 404
    
    return jsonify({'message': 'Status updated successfully'}), 200

@app.route('/api/statistics', methods=['GET'])
@token_required
def get_statistics():
    """Get statistics for dashboard"""
    user_role = request.user.get('role')
    
    if user_role != 'authority':
        return jsonify({'error': 'Access denied'}), 403
    
    # Calculate statistics
    total_reports = mongo.db.reports.count_documents({})
    resolved_reports = mongo.db.reports.count_documents({'status': 'resolved'})
    in_progress_reports = mongo.db.reports.count_documents({'status': 'in_process'})
    
    # Reports by type
    reports_by_type = mongo.db.reports.aggregate([
        {'$group': {'_id': '$problem_type', 'count': {'$sum': 1}}}
    ])
    
    # Weekly trend
    weekly_data = mongo.db.reports.aggregate([
        {
            '$group': {
                '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}},
                'count': {'$sum': 1}
            }
        },
        {'$sort': {'_id': 1}},
        {'$limit': 7}
    ])
    
    return jsonify({
        'total_reports': total_reports,
        'resolved_reports': resolved_reports,
        'in_progress_reports': in_progress_reports,
        'resolution_rate': (resolved_reports / total_reports * 100) if total_reports > 0 else 0,
        'reports_by_type': list(reports_by_type),
        'weekly_trend': list(weekly_data)
    }), 200

@app.route('/uploads/<filename>')
def serve_file(filename):
    """Serve uploaded files"""
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))

@app.route('/api/generate-qr', methods=['GET'])
def generate_qr():
    """Generate QR code for park locations"""
    import qrcode
    from io import BytesIO
    
    location = request.args.get('location', 'Main Park')
    qr_data = f"https://caremypark.com/report?location={location}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill='black', back_color='white')
    
    # Save to bytes
    img_bytes = BytesIO()
    img.save(img_bytes)
    img_bytes.seek(0)
    
    return send_file(img_bytes, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)