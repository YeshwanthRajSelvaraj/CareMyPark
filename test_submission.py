import requests

# URL for report submission
url = 'http://localhost:5000/api/reports'

# Test payload
data = {
    'problem_type': 'Litter/Garbage',
    'description': 'Test report from automation script',
    'location': 'Playground Area',
    'is_anonymous': 'true'
}

# Add a dummy file
files = {
    'photos': ('test.jpg', b'dummy content', 'image/jpeg')
}

# Headers - Assuming no auth for public submission or simulating logged in user (token would be needed if auth is required)
# Based on my analysis, app.py uses @token_required.
# I need to login first to get a token.

def test_submission():
    session = requests.Session()
    
    # 1. Register/Login a test user
    login_url = 'http://localhost:5000/api/login'
    login_data = {'email': 'testvisitor@example.com', 'password': 'password123'}
    
    # Try login first
    print('Attempting login...')
    response = session.post(login_url, json=login_data)
    
    if response.status_code == 401:
        # Register if not exists
        print('User not found, registering...')
        register_url = 'http://localhost:5000/api/register'
        reg_data = {'email': 'testvisitor@example.com', 'password': 'password123', 'role': 'visitor'}
        requests.post(register_url, json=reg_data)
        response = session.post(login_url, json=login_data)

    if response.status_code != 200:
        print(f'Login failed: {response.text}')
        return

    token = response.json().get('token')
    print('Login successful, got token.')

    # 2. Submit Report
    headers = {'Authorization': f'Bearer {token}'}
    print('Submitting report...')
    response = requests.post(url, data=data, files=files, headers=headers)
    
    print(f'Status Code: {response.status_code}')
    print(f'Response: {response.text}')

if __name__ == '__main__':
    test_submission()
