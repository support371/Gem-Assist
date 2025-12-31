import os
import datetime
import logging
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy

# Import GitHub OAuth authentication
try:
    from github_auth import github_auth
    GITHUB_AUTH_AVAILABLE = True
except ImportError:
    GITHUB_AUTH_AVAILABLE = False
    logging.warning("GitHub OAuth not available")

# Try to import the original notion client for existing functionality
try:
    from notion_client import Client as NotionClient
    NOTION_LIBRARY_AVAILABLE = True
except ImportError:
    NOTION_LIBRARY_AVAILABLE = False
    NotionClient = None
    logging.warning("Notion library not available")

# Try to import custom leadership client
try:
    from gem_notion_client import get_leadership_data_from_notion
    LEADERSHIP_CLIENT_AVAILABLE = True
except ImportError:
    LEADERSHIP_CLIENT_AVAILABLE = False
    get_leadership_data_from_notion = lambda: []
    logging.warning("Custom leadership client not available")

# Import Notion CMS
try:
    from notion_cms import (
        notion_cms,
        get_services_from_notion,
        get_news_from_notion,
        get_testimonials_from_notion,
        get_featured_content,
        create_sample_content
    )
    from notion_content_sync import (
        content_sync,
        auto_sync_content,
        get_cached_content,
        initialize_default_content
    )
    CMS_AVAILABLE = True
except ImportError:
    CMS_AVAILABLE = False
    notion_cms = None
    content_sync = None
    get_services_from_notion = lambda: []
    get_news_from_notion = lambda: []
    get_testimonials_from_notion = lambda: []
    get_featured_content = lambda: []
    create_sample_content = lambda: False
    auto_sync_content = lambda: {}
    get_cached_content = lambda: {}
    initialize_default_content = lambda: False
    logging.warning("Notion CMS not available")

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)

# Import OpenAI for AI Cybersecurity Assistant
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    openai_client = None
    logging.warning("OpenAI not available for AI assistant")

# Import GEM Telegram Workflow Bots
try:
    from gem_telegram_workflows import GEMWorkflowBots, GEMAutomationWorkflows
    telegram_bot_instance = GEMWorkflowBots()
    BOT_AVAILABLE = True
except ImportError as e:
    BOT_AVAILABLE = False
    telegram_bot_instance = None
    logging.warning(f"GEM Telegram workflow bots not available: {e}")

def get_notion_team_data():
    """Fetch team member data from Notion database"""
    if not NOTION_LIBRARY_AVAILABLE or not NotionClient:
        return []

    try:
        notion = NotionClient(auth=os.environ.get('NOTION_INTEGRATION_SECRET'))
        database_id = os.environ.get('NOTION_DATABASE_ID')

        if not notion or not database_id:
            return []

        # Query the database
        response = notion.databases.query(database_id=database_id)

        team_members = []
        for page in response['results']:
            properties = page['properties']

            # Extract member data
            member = {
                'name': '',
                'position': '',
                'department': '',
                'email': '',
                'bio': '',
                'image': ''
            }

            # Try common field names for team member data
            for prop_name, prop_data in properties.items():
                prop_type = prop_data['type']

                if prop_type == 'title' and prop_data['title']:
                    member['name'] = prop_data['title'][0]['plain_text']
                elif prop_type == 'rich_text' and prop_data['rich_text']:
                    text_content = prop_data['rich_text'][0]['plain_text']
                    if 'position' in prop_name.lower() or 'role' in prop_name.lower():
                        member['position'] = text_content
                    elif 'department' in prop_name.lower() or 'division' in prop_name.lower():
                        member['department'] = text_content
                    elif 'email' in prop_name.lower():
                        member['email'] = text_content
                    elif 'bio' in prop_name.lower() or 'description' in prop_name.lower():
                        member['bio'] = text_content
                elif prop_type == 'select' and prop_data['select']:
                    if 'department' in prop_name.lower() or 'division' in prop_name.lower():
                        member['department'] = prop_data['select']['name']
                elif prop_type == 'files' and prop_data['files']:
                    member['image'] = prop_data['files'][0]['file']['url']

            if member['name']:  # Only add if we have at least a name
                team_members.append(member)

        return team_members

    except Exception as e:
        logging.error(f"Error fetching Notion data: {e}")
        return []

def categorize_team_members(team_members):
    """Categorize team members into cybersecurity and real estate divisions"""
    cybersecurity_team = []
    real_estate_team = []

    cybersecurity_keywords = ['cyber', 'security', 'threat', 'analyst', 'monitoring', 'compliance', 'incident', 'forensic']
    real_estate_keywords = ['real estate', 'property', 'investment', 'mortgage', 'leasing', 'portfolio', 'advisor', 'broker']

    for member in team_members:
        member_text = f"{member['position']} {member['department']} {member['bio']}".lower()

        if any(keyword in member_text for keyword in cybersecurity_keywords):
            cybersecurity_team.append(member)
        elif any(keyword in member_text for keyword in real_estate_keywords):
            real_estate_team.append(member)
        else:
            # Default assignment based on company structure
            if 'manager' in member['position'].lower() or 'ceo' in member['position'].lower():
                cybersecurity_team.append(member)
            else:
                real_estate_team.append(member)

    return cybersecurity_team, real_estate_team

# Try to import media blueprint (optional feature)
try:
    from media_server import media_bp
    MEDIA_SERVER_AVAILABLE = True
except ImportError as e:
    MEDIA_SERVER_AVAILABLE = False
    media_bp = None
    logging.warning(f"Media server not available: {e}")

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Register media blueprint if available
if MEDIA_SERVER_AVAILABLE and media_bp:
    app.register_blueprint(media_bp)

# Database configuration
database_url = os.environ.get('DATABASE_URL')
if database_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
    app.config['UPLOAD_FOLDER'] = 'static/uploads'
    USE_DATABASE = True
else:
    USE_DATABASE = False
    logging.warning("Database not configured - testimonials will not be saved")

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'wmv', 'webm'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'webm'}
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Initialize database if available
if USE_DATABASE:
    from models import db, Testimonial, ContactSubmission, NewsletterSubscriber, ServiceType, TestimonialStatus, VIPBoardMember, BoardMember
    db.init_app(app)

    # Create tables
    with app.app_context():
        from models import PasswordReset, User, Organization, UserRole, AuditLog, Team, Grant, PortfolioItem, Investment, ContactMessage
        db.create_all()
        
        # Seed default org
        if not Organization.query.filter_by(name="GEM & ATR").first():
            default_org = Organization(name="GEM & ATR")
            db.session.add(default_org)
            db.session.commit()

        # Seed test users
        try:
            from werkzeug.security import generate_password_hash
            if not User.query.filter_by(username='admin').first():
                admin = User(username='admin', email='admin@example.com', password_hash=generate_password_hash('admin123'), role=UserRole.ADMIN)
                db.session.add(admin)
            if not User.query.filter_by(username='client').first():
                client = User(username='client', email='client@example.com', password_hash=generate_password_hash('client123'), role=UserRole.CLIENT)
                db.session.add(client)
            db.session.commit()
        except Exception as e:
            logging.error(f"Seeding error: {e}")
else:
    db = None
    Testimonial = None
    ContactSubmission = None
    NewsletterSubscriber = None
    ServiceType = None
    TestimonialStatus = None
    VIPBoardMember = None
    BoardMember = None
    PasswordReset = None
    User = None
    Organization = None
    UserRole = None
    AuditLog = None
    Team = None
    Grant = None
    PortfolioItem = None
    Investment = None

def allowed_file(filename, file_type='any'):
    if file_type == 'video':
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS
    elif file_type == 'image':
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS
    else:
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/auth/password/forgot', methods=['POST'])
def forgot_password():
    """Request a password reset token"""
    email = request.json.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # In a real app, we'd check if user exists and send email
    # For now, we just return success to avoid leaking emails
    import secrets
    import hashlib
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    
    if USE_DATABASE:
        reset = PasswordReset(email=email, token_hash=token_hash, expiry=expiry)
        db.session.add(reset)
        db.session.commit()
        
    logging.info(f"DEBUG: Password reset token for {email}: {token}")
    return jsonify({'ok': True, 'message': 'If an account exists, a reset link has been sent.'}), 200

@app.route('/api/auth/password/reset', methods=['POST'])
def reset_password():
    """Reset password using a token"""
    data = request.json
    token = data.get('token')
    new_password = data.get('newPassword')
    
    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400
        
    import hashlib
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    if USE_DATABASE:
        reset = PasswordReset.query.filter_by(token_hash=token_hash).first()
        if not reset or reset.expiry < datetime.datetime.utcnow():
            return jsonify({'error': 'Invalid or expired token'}), 400
            
        from werkzeug.security import generate_password_hash
        user = User.query.filter_by(email=reset.email).first()
        if user:
            user.password_hash = generate_password_hash(new_password)
            db.session.delete(reset)
            db.session.commit()
            return jsonify({'ok': True}), 200
            
    return jsonify({'error': 'User not found'}), 404

# Health check endpoint
@app.route('/api/health')
def api_health():
    """API health check endpoint"""
    return jsonify({
        'ok': True,
        'version': '1.0.0',
        'env': os.environ.get('FLASK_ENV', 'development'),
        'timestamp': datetime.datetime.now().isoformat()
    }), 200

@app.route('/api/auth/me')
def auth_me():
    """Protected whoami endpoint for debugging auth"""
    if 'github_user' in session:
        return jsonify({
            'user': session['github_user'],
            'roles': session.get('user_roles', ['VIEWER']),
            'org': session.get('user_org', 'Default Org')
        }), 200
    return jsonify({'error': 'Unauthorized'}), 401

# Health check endpoint (legacy)
@app.route('/health')
def health():
    """Health check endpoint for deployment monitoring"""
    return {'status': 'healthy', 'timestamp': datetime.datetime.now().isoformat()}, 200

@app.route('/forgot-password')
def forgot_password_page():
    return render_template('forgot_password.html')

@app.route('/reset-password')
def reset_password_page():
    return render_template('reset_password.html')

@app.route('/admin')
def admin_dashboard():
    if 'user_role' in session and session['user_role'] == 'admin':
        return render_template('admin.html')
    return jsonify({'error': 'Forbidden'}), 403

@app.route('/dashboard')
def team_dashboard():
    if 'user_role' in session and session['user_role'] in ['admin', 'team']:
        return render_template('teams.html')
    return jsonify({'error': 'Forbidden'}), 403

@app.route('/portal')
def client_portal():
    if 'user_role' in session and session['user_role'] in ['admin', 'team', 'client']:
        return render_template('client.html')
    return jsonify({'error': 'Forbidden'}), 403

def require_role(roles):
    from functools import wraps
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_role' not in session or session['user_role'] not in roles:
                return jsonify({'error': 'Forbidden'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/admin/audit-logs')
@require_role(['ADMIN', 'OWNER'])
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return jsonify([{'action': l.action, 'created_at': l.created_at.isoformat()} for l in logs])

@app.route('/api/admin/users')
@require_role(['ADMIN', 'OWNER'])
def get_users():
    users = User.query.all()
    return jsonify([{'username': u.username, 'role': u.role.value if u.role else 'VIEWER'} for u in users])

@app.route('/grants')
def grants_page():
    if 'user_role' in session:
        return render_template('grants.html')
    return redirect(url_for('index'))

@app.route('/api/grants', methods=['GET', 'POST'])
def handle_grants():
    if request.method == 'POST':
        data = request.json
        new_grant = Grant(name=data['name'], amount=data['amount'], org_id=session.get('org_id', 1))
        db.session.add(new_grant)
        db.session.commit()
        return jsonify({'ok': True}), 201
    grants = Grant.query.filter_by(org_id=session.get('org_id', 1)).all()
    return jsonify([{'name': g.name, 'amount': g.amount, 'status': g.status} for g in grants])

@app.route('/api/contact', methods=['POST'])
@limiter.limit("5 per minute")
def submit_contact_form():
    try:
        data = request.json
        # Basic validation
        required_fields = ['first_name', 'last_name', 'email', 'message']
        if not all(k in data for k in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        new_msg = ContactMessage(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            phone=data.get('phone'),
            service_interest=data.get('service_interest'),
            message=data['message'],
            consent_ack=data.get('consent_ack', False),
            org_id=session.get('org_id', 1)
        )
        db.session.add(new_msg)
        db.session.commit()
        
        logging.info(f"New contact message received from {data['email']}")
        # Notification placeholder
        print(f"NOTIFICATION: New contact message from {data['email']} - ID: {new_msg.id}")
        
        return jsonify({'ok': True, 'id': new_msg.id}), 201
    except Exception as e:
        logging.error(f"Contact form error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/contact', methods=['GET'])
@require_role(['admin'])
def get_admin_contacts():
    status_filter = request.args.get('status')
    query = ContactMessage.query
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    messages = query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([{
        'id': m.id,
        'created_at': m.created_at.isoformat(),
        'first_name': m.first_name,
        'last_name': m.last_name,
        'email': m.email,
        'status': m.status.value,
        'message': m.message
    } for m in messages])

@app.route('/api/admin/contact/<int:msg_id>', methods=['PATCH'])
@require_role(['admin'])
def update_admin_contact(msg_id):
    msg = ContactMessage.query.get_or_404(msg_id)
    data = request.json
    
    if 'status' in data:
        msg.status = data['status']
    if 'assigned_to_user_id' in data:
        msg.assigned_to_user_id = data['assigned_to_user_id']
    
    msg.last_activity_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True})

@app.route('/admin/inbox')
@require_role(['admin'])
def admin_inbox_page():
    return render_template('admin_inbox.html')

@app.route('/admin/team')
@require_role(['admin'])
def admin_team_page():
    return render_template('admin_team.html')

@app.route('/admin/org')
@require_role(['admin'])
def admin_org_page():
    return render_template('admin_org.html')

@app.route('/admin/diagnostics')
@require_role(['admin'])
def admin_diagnostics_page():
    return render_template('admin_diagnostics.html')

# GitHub OAuth Routes
@app.route('/auth/github')
def github_login():
    """Redirect user to GitHub for OAuth authentication"""
    if not GITHUB_AUTH_AVAILABLE or not github_auth.is_configured():
        flash('GitHub authentication is not configured', 'error')
        return redirect(url_for('index'))
    
    callback_url = url_for('github_callback', _external=True)
    auth_url, state = github_auth.get_authorize_url(callback_url)
    session['github_oauth_state'] = state
    
    return redirect(auth_url)

@app.route('/auth/github/callback')
def github_callback():
    """Handle GitHub OAuth callback"""
    if not GITHUB_AUTH_AVAILABLE or not github_auth.is_configured():
        flash('GitHub authentication is not configured', 'error')
        return redirect(url_for('index'))
    
    code = request.args.get('code')
    state = request.args.get('state')
    
    if not code or not state:
        flash('Missing authorization code or state', 'error')
        return redirect(url_for('index'))
    
    if state != session.get('github_oauth_state'):
        flash('Invalid state parameter - possible CSRF attack', 'error')
        return redirect(url_for('index'))
    
    access_token = github_auth.exchange_code_for_token(code)
    if not access_token:
        flash('Failed to obtain access token from GitHub', 'error')
        return redirect(url_for('index'))
    
    user_info = github_auth.get_user_info(access_token)
    if not user_info:
        flash('Failed to fetch user information from GitHub', 'error')
        return redirect(url_for('index'))
    
    session['github_user'] = user_info
    session['github_token'] = access_token
    session.permanent = True
    
    flash(f"Welcome, {user_info.get('name', user_info.get('login'))}!", 'success')
    return redirect(url_for('index'))

@app.route('/auth/logout')
def logout():
    """Logout user and clear session"""
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

# Routes
@app.route('/')
def index():
    """Home page with main services overview"""
    return render_template('index.html')

@app.route('/notion')
def raw_notion():
    """Query the Notion database and return entries as JSON (from server.py)"""
    if not NOTION_LIBRARY_AVAILABLE or not NotionClient:
        return jsonify({"error": "Notion library not available"}), 503
    
    try:
        notion_secret = os.environ.get('NOTION_INTEGRATION_SECRET')
        database_id = os.environ.get('NOTION_DATABASE_ID')
        
        if not notion_secret or not database_id:
            return jsonify({"error": "Notion configuration missing"}), 400
            
        notion = NotionClient(auth=notion_secret)
        response = notion.databases.query(database_id=database_id)
        return jsonify(response)
    except Exception as e:
        logging.error(f"Error in raw notion route: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/cyber-portal')
def cyber_portal():
    """Cybersecurity Portal Landing Page"""
    return render_template('cyber_portal.html')

@app.route('/enterprise/security/<path:service>')
def security_service_detail(service):
    """Dynamic security service detail redirect or placeholder"""
    # This acts as the destination for portal links
    return render_template('services.html', active_service=service)

@app.route('/about')
def about():
    """About Gem Assist Enterprise"""
    return render_template('about.html')

@app.route('/services')
def services():
    """Services overview page"""
    # Get services content from Notion if available
    notion_services = []
    if CMS_AVAILABLE:
        # Try to get content from cache first, then sync if needed
        cached = get_cached_content()
        notion_services = cached.get('services', [])

        # If no cached content, try to sync
        if not notion_services:
            content = auto_sync_content()
            notion_services = content.get('services', [])

    return render_template('services.html', notion_services=notion_services)

@app.route('/contact')
def contact():
    """Contact information and form"""
    return render_template('contact.html')

@app.route('/telegram-bot-automation')
def telegram_bot():
    """Telegram bot automation services"""
    return render_template('telegram.html')

# Telegram Bot Webhook Endpoints
@app.route('/telegram/webhook', methods=['POST'])
def telegram_webhook():
    """Handle incoming Telegram bot updates"""
    if not BOT_AVAILABLE:
        return jsonify({'error': 'Bot handler not available'}), 503

    try:
        # Get update data
        update = request.get_json()

        # Verify webhook signature if needed
        signature = request.headers.get('X-Telegram-Bot-Api-Secret-Token', '')

        # Process the update
        result = telegram_bot_instance.process_update(update)

        logging.info(f"Telegram webhook processed: {result}")

        return jsonify(result), 200
    except Exception as e:
        logging.error(f"Telegram webhook error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/make/webhook', methods=['POST'])
def make_webhook():
    """Handle incoming Make.com automation triggers"""
    try:
        # Get webhook data
        data = request.get_json()
        event_type = data.get('event_type', 'unknown')

        logging.info(f"Make.com webhook received: {event_type}")

        # Process based on event type
        if event_type == 'security_alert':
            # Broadcast security alert to Telegram channel
            if BOT_AVAILABLE and telegram_bot_instance:
                message = data.get('message', 'Security alert detected')
                telegram_bot_instance.broadcast_to_channel(message, 'danger')

        elif event_type == 'property_update':
            # Handle property updates
            if BOT_AVAILABLE and telegram_bot_instance:
                message = f"Property Update: {data.get('property', 'Unknown')} - {data.get('status', 'Updated')}"
                telegram_bot_instance.broadcast_to_channel(message, 'info')

        elif event_type == 'recovery_update':
            # Handle recovery case updates
            if BOT_AVAILABLE and telegram_bot_instance:
                message = f"Recovery Update: Case {data.get('case_id', 'Unknown')} - {data.get('status', 'In Progress')}"
                telegram_bot_instance.broadcast_to_channel(message, 'warning')

        return jsonify({'status': 'success', 'event': event_type}), 200

    except Exception as e:
        logging.error(f"Make webhook error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/telegram/bot-setup')
def telegram_bot_setup():
    """Telegram bot setup instructions"""
    # Check environment variable status
    bot_token_set = bool(os.environ.get('TELEGRAM_BOT_TOKEN'))
    channel_id_set = bool(os.environ.get('TELEGRAM_CHANNEL_ID'))
    make_webhook_set = bool(os.environ.get('MAKE_WEBHOOK_URL'))

    return render_template('telegram_setup.html',
                         bot_token_set=bot_token_set,
                         channel_id_set=channel_id_set,
                         make_webhook_set=make_webhook_set)

@app.route('/telegram/test-bot', methods=['GET'])
def test_bot():
    """Test bot functionality endpoint"""
    if not BOT_AVAILABLE:
        return jsonify({'status': 'error', 'message': 'Bot handler not available'}), 503

    # Test bot configuration for GEM workflow bots
    tests = {
        'bot_handler': 'Available' if telegram_bot_instance else 'Not Available',
        'active_token': 'Configured' if telegram_bot_instance and telegram_bot_instance.active_bot else 'Not Configured',
        'bots_configured': len(telegram_bot_instance.bot_configs) if telegram_bot_instance else 0,
        'integrations': list(telegram_bot_instance.integrations.keys()) if telegram_bot_instance else [],
        'channels': list(telegram_bot_instance.channels.keys()) if telegram_bot_instance else [],
        'status': 'Ready' if telegram_bot_instance and telegram_bot_instance.active_bot else 'Needs Configuration'
    }

    return jsonify(tests), 200

@app.route('/recovery-service-handbook')
def recovery_service():
    """Professional Asset Recovery Service Handbook"""
    return render_template('recovery-handbook.html')

@app.route('/business-analysis-service')
def business_analysis():
    """Comprehensive Business Analysis & Integration Service"""
    return render_template('business-analysis.html')

@app.route('/leadership-vision')
def leadership_vision():
    """Leadership Team, Vision & Mission"""
    return render_template('leadership-vision.html')

@app.route('/leadership')
def leadership():
    """Company Leadership and Board Members"""
    executives = {}
    board_members = []
    departments = {}

    if USE_DATABASE:
        # Get VIP executives
        executives = {
            'CEO': VIPBoardMember.query.filter_by(position='CEO', is_active=True).first(),
            'CFO': VIPBoardMember.query.filter_by(position='CFO', is_active=True).first(),
            'COO': VIPBoardMember.query.filter_by(position='COO', is_active=True).first(),
            'LEGAL': VIPBoardMember.query.filter_by(position='LEGAL', is_active=True).first()
        }

        # Get all board members grouped by department
        all_board_members = BoardMember.query.filter_by(is_active=True).order_by(BoardMember.order_index, BoardMember.name).all()

        for member in all_board_members:
            dept = member.department or 'General'
            if dept not in departments:
                departments[dept] = []
            departments[dept].append(member)

    # Try to get data from Notion as fallback
    leadership_data = get_leadership_data_from_notion()

    return render_template('leadership.html',
                         executives=executives,
                         departments=departments,
                         leadership_data=leadership_data)

@app.route('/api/leadership-data')
def api_leadership_data():
    """API endpoint for leadership data"""
    leadership_data = get_leadership_data_from_notion()
    return jsonify(leadership_data)

@app.route('/membership')
def membership():
    """Membership portal and information"""
    membership_tiers = {
        'gold': {
            'name': 'Gold Membership',
            'price': '$500/month',
            'benefits': [
                'Priority access to all services',
                'Dedicated account manager',
                'Monthly security audits',
                '24/7 emergency support',
                'Custom automation solutions',
                'VIP event invitations'
            ]
        },
        'silver': {
            'name': 'Silver Membership',
            'price': '$250/month',
            'benefits': [
                'Access to core services',
                'Quarterly security reviews',
                'Business hours support',
                'Standard automation tools',
                'Member-only resources'
            ]
        },
        'bronze': {
            'name': 'Bronze Membership',
            'price': '$100/month',
            'benefits': [
                'Basic service access',
                'Annual security check',
                'Email support',
                'Community access'
            ]
        }
    }

    members = []
    if USE_DATABASE:
        # Get active members for public display (limited info)
        members = Membership.query.filter_by(status='active', is_verified=True).limit(20).all()

    return render_template('membership.html', membership_tiers=membership_tiers, members=members)

@app.route('/apply-membership', methods=['GET', 'POST'])
def apply_membership():
    """Membership application form"""
    if request.method == 'POST':
        if not USE_DATABASE:
            flash('Membership applications are temporarily unavailable.', 'error')
            return redirect(url_for('membership'))

        try:
            # Generate unique member ID
            import random
            import string
            member_id = 'GEM' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

            membership = Membership(
                member_id=member_id,
                full_name=request.form.get('full_name'),
                email=request.form.get('email'),
                phone=request.form.get('phone'),
                company=request.form.get('company'),
                position=request.form.get('position'),
                membership_type=request.form.get('membership_type'),
                referred_by=request.form.get('referred_by'),
                status='pending'
            )

            db.session.add(membership)
            db.session.commit()

            flash(f'Thank you for applying! Your membership ID is {member_id}. We will contact you soon.', 'success')
            return redirect(url_for('membership'))

        except Exception as e:
            flash('Error processing your application. Please try again.', 'error')
            return redirect(url_for('apply_membership'))

    return render_template('apply_membership.html')

@app.route('/admin/board-members', methods=['GET', 'POST'])
def admin_board_members():
    """Admin interface for managing board members"""
    if not USE_DATABASE:
        flash('Database not available', 'error')
        return redirect(url_for('admin_panel'))

    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'add':
            member = BoardMember(
                name=request.form.get('name'),
                position=request.form.get('position'),
                department=request.form.get('department'),
                bio=request.form.get('bio'),
                email=request.form.get('email'),
                phone=request.form.get('phone'),
                alignable_url=request.form.get('alignable_url'),
                specialties=request.form.get('specialties'),
                responsibilities=request.form.get('responsibilities'),
                is_executive=request.form.get('is_executive') == 'true',
                order_index=int(request.form.get('order_index', 0))
            )

            # Handle photo upload
            if 'photo' in request.files:
                file = request.files['photo']
                if file and file.filename and allowed_file(file.filename, 'image'):
                    filename = secure_filename(f"board_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
                    file_path = os.path.join('static/uploads/board', filename)
                    os.makedirs(os.path.dirname(os.path.join(app.root_path, file_path)), exist_ok=True)
                    full_path = os.path.join(app.root_path, file_path)
                    file.save(full_path)
                    member.photo_url = '/' + file_path

            db.session.add(member)
            db.session.commit()
            flash('Board member added successfully', 'success')

        elif action == 'update':
            member_id = request.form.get('member_id')
            member = BoardMember.query.get(member_id)
            if member:
                member.name = request.form.get('name')
                member.position = request.form.get('position')
                member.department = request.form.get('department')
                member.bio = request.form.get('bio')
                member.email = request.form.get('email')
                member.phone = request.form.get('phone')
                member.alignable_url = request.form.get('alignable_url')
                member.specialties = request.form.get('specialties')
                member.responsibilities = request.form.get('responsibilities')
                member.is_executive = request.form.get('is_executive') == 'true'
                member.order_index = int(request.form.get('order_index', 0))

                db.session.commit()
                flash('Board member updated successfully', 'success')

        return redirect(url_for('admin_board_members'))

    board_members = BoardMember.query.order_by(BoardMember.department, BoardMember.order_index).all()
    return render_template('admin_board_members.html', board_members=board_members)

@app.route('/admin/memberships')
def admin_memberships():
    """Admin interface for managing memberships"""
    if not USE_DATABASE:
        flash('Database not available', 'error')
        return redirect(url_for('admin_panel'))

    memberships = Membership.query.order_by(Membership.created_at.desc()).all()
    return render_template('admin_memberships.html', memberships=memberships)

@app.route('/admin/membership/<int:id>/approve', methods=['POST'])
def approve_membership(id):
    """Approve a membership application"""
    if not USE_DATABASE:
        return jsonify({'error': 'Database not configured'}), 500

    membership = Membership.query.get_or_404(id)
    membership.status = 'active'
    membership.is_verified = True

    # Set expiry date based on membership type
    from datetime import timedelta
    if membership.membership_type == 'gold':
        membership.expiry_date = datetime.utcnow() + timedelta(days=365)
    elif membership.membership_type == 'silver':
        membership.expiry_date = datetime.utcnow() + timedelta(days=180)
    else:
        membership.expiry_date = datetime.utcnow() + timedelta(days=90)

    db.session.commit()
    flash(f'Membership {membership.member_id} approved!', 'success')
    return redirect(url_for('admin_memberships'))

@app.route('/media-generator')
def media_generator():
    """AI Media Generator - Enterprise content creation"""
    return render_template('sidebar-media.html')

@app.route('/market-insights')
def market_insights():
    """Active Market Insights and Trends"""
    return render_template('market_insights.html')

@app.route('/quantum-financial-system')
@app.route('/qfs')
def quantum_financial_system():
    """Quantum Financial System (QFS) - Next-generation financial infrastructure"""
    return render_template('qfs.html')

@app.route('/power_of_attorney')
def power_of_attorney():
    """Power of Attorney services"""
    return render_template('power-of-attorney.html')

@app.route('/monitoring-threats')
def monitoring():
    """Threat monitoring services"""
    return render_template('monitoring.html')

@app.route('/real-estate-testimonials')
def testimonials():
    """Client testimonials for real estate services"""
    # Try to get testimonials from Notion first
    notion_testimonials = []
    if CMS_AVAILABLE:
        cached = get_cached_content()
        notion_testimonials = cached.get('testimonials', [])

        # If no cached content, try to sync
        if not notion_testimonials:
            content = auto_sync_content()
            notion_testimonials = content.get('testimonials', [])

    # Fallback to database testimonials if available
    featured_testimonials = []
    regular_testimonials = []
    if USE_DATABASE and not notion_testimonials:
        approved_testimonials = Testimonial.query.filter_by(status=TestimonialStatus.APPROVED).order_by(Testimonial.display_order, Testimonial.submitted_at.desc()).all()
        featured_testimonials = [t for t in approved_testimonials if t.is_featured]
        regular_testimonials = [t for t in approved_testimonials if not t.is_featured]

    return render_template('testimonials.html',
                         notion_testimonials=notion_testimonials,
                         featured_testimonials=featured_testimonials,
                         regular_testimonials=regular_testimonials)

@app.route('/partners-and-trustees')
def partners():
    """Partners and trustees information"""
    return render_template('partners.html')

@app.route('/client-access')
def client_access():
    """Client portal access"""
    return render_template('client.html')

@app.route('/admin-panel')
def admin_panel():
    """Administrative panel"""
    return render_template('admin.html')

@app.route('/gem-news-and-newsletter')
def news():
    """News and newsletter page"""
    # Get news from Notion if available
    notion_news = []
    if CMS_AVAILABLE:
        # Try to get content from cache first, then sync if needed
        cached = get_cached_content()
        notion_news = cached.get('news', [])

        # If no cached content, try to sync
        if not notion_news:
            content = auto_sync_content()
            notion_news = content.get('news', [])

    return render_template('news.html', notion_news=notion_news)

@app.route('/subscribe-newsletter', methods=['POST'])
def subscribe_newsletter():
    """Handle newsletter subscription"""
    if not USE_DATABASE:
        flash('Newsletter subscription is temporarily unavailable.', 'error')
        return redirect(url_for('news'))

    try:
        email = request.form.get('email')
        name = request.form.get('name', '')
        interests = request.form.get('interests', 'all')

        # Check if email already exists
        existing = NewsletterSubscriber.query.filter_by(email=email).first()
        
        if existing:
            if existing.is_active:
                flash('You are already subscribed to our newsletter!', 'info')
            else:
                # Reactivate subscription
                existing.is_active = True
                existing.unsubscribed_at = None
                db.session.commit()
                flash('Welcome back! Your subscription has been reactivated.', 'success')
        else:
            # Create new subscription
            subscriber = NewsletterSubscriber(
                email=email,
                name=name,
                is_active=True
            )
            db.session.add(subscriber)
            db.session.commit()
            flash('Thank you for subscribing to our newsletter!', 'success')

        return redirect(url_for('news'))

    except Exception as e:
        logging.error(f"Error subscribing to newsletter: {e}")
        flash('An error occurred. Please try again.', 'error')
        return redirect(url_for('news'))

@app.route('/unsubscribe-newsletter', methods=['GET', 'POST'])
def unsubscribe_newsletter():
    """Handle newsletter unsubscription"""
    if not USE_DATABASE:
        flash('Newsletter management is temporarily unavailable.', 'error')
        return redirect(url_for('news'))

    if request.method == 'POST':
        email = request.form.get('email')
        
        try:
            subscriber = NewsletterSubscriber.query.filter_by(email=email).first()
            
            if subscriber and subscriber.is_active:
                subscriber.is_active = False
                subscriber.unsubscribed_at = datetime.utcnow()
                db.session.commit()
                flash('You have been unsubscribed from our newsletter.', 'info')
            else:
                flash('Email not found in our subscription list.', 'warning')
                
        except Exception as e:
            logging.error(f"Error unsubscribing: {e}")
            flash('An error occurred. Please try again.', 'error')
            
        return redirect(url_for('news'))
    
    return render_template('news.html')

@app.route('/teams')
def teams():
    """Team members and structure"""
    # Try to get team members from Notion CMS first
    notion_team = []
    if CMS_AVAILABLE:
        cached = get_cached_content()
        notion_team = cached.get('team_members', [])

        # If no cached content, try to sync
        if not notion_team:
            content = auto_sync_content()
            notion_team = content.get('team_members', [])

    # Fallback to custom client if available
    if not notion_team:
        team_data = get_notion_team_data()
        cybersecurity_team, real_estate_team = categorize_team_members(team_data)
    else:
        # Categorize Notion team members
        cybersecurity_team = [m for m in notion_team if 'Cybersecurity' in m.get('category', [])]
        real_estate_team = [m for m in notion_team if 'Real Estate' in m.get('category', [])]

    return render_template('teams.html',
                         cybersecurity_team=cybersecurity_team,
                         real_estate_team=real_estate_team,
                         notion_team=notion_team)

@app.route('/investment-portfolio')
def investment_portfolio():
    """Investment portfolio services"""
    return render_template('portfolio.html')

@app.route('/vip-board-members')
def vip_board():
    """VIP Board Members - Executive Leadership"""
    executives = {}
    if USE_DATABASE:
        # Get all VIP board members from database
        ceo = VIPBoardMember.query.filter_by(position='CEO', is_active=True).first()
        cfo = VIPBoardMember.query.filter_by(position='CFO', is_active=True).first()
        coo = VIPBoardMember.query.filter_by(position='COO', is_active=True).first()
        legal = VIPBoardMember.query.filter_by(position='LEGAL', is_active=True).first()

        executives = {
            'CEO': ceo,
            'CFO': cfo,
            'COO': coo,
            'LEGAL': legal
        }

    return render_template('vip_board.html', executives=executives)

@app.route('/submit-testimonial', methods=['GET', 'POST'])
def submit_testimonial():
    """Handle testimonial submission"""
    if request.method == 'POST':
        if not USE_DATABASE:
            flash('Database not configured. Testimonial submission is temporarily unavailable.', 'error')
            return redirect(url_for('submit_testimonial'))

        try:
            # Get form data
            testimonial = Testimonial(
                client_name=request.form.get('client_name'),
                client_email=request.form.get('client_email'),
                client_phone=request.form.get('client_phone'),
                company_name=request.form.get('company_name'),
                company_position=request.form.get('company_position'),
                service_type=ServiceType[request.form.get('service_type', 'OTHER').upper()],
                rating=float(request.form.get('rating', 5)),
                title=request.form.get('title'),
                testimonial_text=request.form.get('testimonial_text'),
                consent_to_display=request.form.get('consent_display') == 'on',
                consent_to_contact=request.form.get('consent_contact') == 'on'
            )

            # Handle video upload
            if 'video_file' in request.files:
                video = request.files['video_file']
                if video and video.filename and allowed_file(video.filename, 'video'):
                    filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{video.filename}")
                    video_path = os.path.join('static/uploads/videos', filename)
                    video.save(video_path)
                    testimonial.video_url = f'/static/uploads/videos/{filename}'

            # Handle image upload
            if 'image_file' in request.files:
                image = request.files['image_file']
                if image and image.filename and allowed_file(image.filename, 'image'):
                    filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{image.filename}")
                    image_path = os.path.join('static/uploads/testimonials', filename)
                    image.save(image_path)
                    testimonial.image_url = f'/static/uploads/testimonials/{filename}'

            # Handle company logo upload
            if 'logo_file' in request.files:
                logo = request.files['logo_file']
                if logo and logo.filename and allowed_file(logo.filename, 'image'):
                    filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{logo.filename}")
                    logo_path = os.path.join('static/uploads/logos', filename)
                    logo.save(logo_path)
                    testimonial.company_logo_url = f'/static/uploads/logos/{filename}'

            # Save to database
            db.session.add(testimonial)
            db.session.commit()

            flash('Thank you for your testimonial! It will be reviewed and published soon.', 'success')
            return redirect(url_for('testimonials'))

        except Exception as e:
            logging.error(f"Error submitting testimonial: {e}")
            flash('An error occurred while submitting your testimonial. Please try again.', 'error')
            return redirect(url_for('submit_testimonial'))

    return render_template('submit_testimonial.html')

@app.route('/admin/testimonials')
def admin_testimonials():
    """Admin panel for managing testimonials"""
    if not USE_DATABASE:
        flash('Database not configured.', 'error')
        return redirect(url_for('admin_panel'))

    pending = Testimonial.query.filter_by(status=TestimonialStatus.PENDING).order_by(Testimonial.submitted_at.desc()).all()
    approved = Testimonial.query.filter_by(status=TestimonialStatus.APPROVED).order_by(Testimonial.submitted_at.desc()).all()
    rejected = Testimonial.query.filter_by(status=TestimonialStatus.REJECTED).order_by(Testimonial.submitted_at.desc()).all()

    return render_template('admin_testimonials.html',
                         pending=pending,
                         approved=approved,
                         rejected=rejected)

@app.route('/admin/testimonial/<int:id>/approve', methods=['POST'])
def approve_testimonial(id):
    """Approve a testimonial"""
    if not USE_DATABASE:
        return jsonify({'error': 'Database not configured'}), 500

    testimonial = Testimonial.query.get_or_404(id)
    testimonial.status = TestimonialStatus.APPROVED
    testimonial.approved_at = datetime.utcnow()
    testimonial.approved_by = 'Admin'  # You can add authentication later

    db.session.commit()
    flash('Testimonial approved successfully!', 'success')
    return redirect(url_for('admin_testimonials'))

@app.route('/admin/testimonial/<int:id>/reject', methods=['POST'])
def reject_testimonial(id):
    """Reject a testimonial"""
    if not USE_DATABASE:
        return jsonify({'error': 'Database not configured'}), 500

    testimonial = Testimonial.query.get_or_404(id)
    testimonial.status = TestimonialStatus.REJECTED

    db.session.commit()
    flash('Testimonial rejected.', 'info')
    return redirect(url_for('admin_testimonials'))

@app.route('/admin/vip-board', methods=['GET', 'POST'])
def admin_vip_board():
    """Admin interface for managing VIP board members"""
    if not USE_DATABASE:
        flash('Database not available', 'error')
        return redirect(url_for('admin_panel'))

    if request.method == 'POST':
        position = request.form.get('position')
        name = request.form.get('name')
        title = request.form.get('title')
        bio = request.form.get('bio')
        alignable_url = request.form.get('alignable_url')
        email = request.form.get('email')
        years_experience = request.form.get('years_experience')
        specialties = request.form.get('specialties')
        achievements = request.form.get('achievements')

        # Check if member exists for this position
        member = VIPBoardMember.query.filter_by(position=position).first()

        if not member:
            member = VIPBoardMember(position=position)
            db.session.add(member)

        # Update member details
        member.name = name
        member.title = title
        member.bio = bio
        member.alignable_url = alignable_url
        member.email = email
        member.years_experience = int(years_experience) if years_experience else None
        member.specialties = specialties
        member.achievements = achievements
        member.is_active = True

        # Handle headshot upload
        if 'headshot' in request.files:
            file = request.files['headshot']
            if file and file.filename and allowed_file(file.filename, 'image'):
                # Delete old headshot if exists
                if member.headshot_url:
                    try:
                        old_path = os.path.join(app.root_path, member.headshot_url[1:])
                        if os.path.exists(old_path):
                            os.remove(old_path)
                    except:
                        pass

                # Save new headshot
                filename = secure_filename(f"{position.lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
                file_path = os.path.join('static/uploads/headshots', filename)
                full_path = os.path.join(app.root_path, file_path)
                file.save(full_path)
                member.headshot_url = '/' + file_path

        db.session.commit()
        flash(f'{position} profile updated successfully', 'success')
        return redirect(url_for('admin_vip_board'))

    # Get all board members
    executives = {
        'CEO': VIPBoardMember.query.filter_by(position='CEO').first(),
        'CFO': VIPBoardMember.query.filter_by(position='CFO').first(),
        'COO': VIPBoardMember.query.filter_by(position='COO').first(),
        'LEGAL': VIPBoardMember.query.filter_by(position='LEGAL').first()
    }

    return render_template('admin_vip_board.html', executives=executives)

@app.route('/admin/testimonial/<int:id>/feature', methods=['POST'])
def feature_testimonial(id):
    """Toggle featured status of a testimonial"""
    if not USE_DATABASE:
        return jsonify({'error': 'Database not configured'}), 500

    testimonial = Testimonial.query.get_or_404(id)
    testimonial.is_featured = not testimonial.is_featured

    db.session.commit()
    status = 'featured' if testimonial.is_featured else 'unfeatured'
    flash(f'Testimonial {status} successfully!', 'success')
    return redirect(url_for('admin_testimonials'))

# Notion CMS API endpoints
@app.route('/api/notion/content/<content_type>')
def api_notion_content(content_type):
    """API endpoint to get content from Notion CMS"""
    if not CMS_AVAILABLE:
        return jsonify({'error': 'Notion CMS not available'}), 503

    content = []
    if content_type == 'services':
        content = get_services_from_notion()
    elif content_type == 'news':
        content = get_news_from_notion()
    elif content_type == 'testimonials':
        content = get_testimonials_from_notion()
    elif content_type == 'featured':
        content = get_featured_content()
    else:
        return jsonify({'error': 'Invalid content type'}), 400

    return jsonify(content)

@app.route('/api/notion/sync', methods=['POST'])
def api_notion_sync():
    """Sync content from Notion database"""
    if not CMS_AVAILABLE:
        return jsonify({'error': 'Notion CMS not available'}), 503

    try:
        # Use the sync service to refresh and cache content
        content = auto_sync_content()

        return jsonify({
            'success': True,
            'content_counts': {
                'services': len(content.get('services', [])),
                'news': len(content.get('news', [])),
                'testimonials': len(content.get('testimonials', [])),
                'featured': len(content.get('featured', []))
            },
            'last_sync': content.get('last_sync'),
            'sync_status': content.get('sync_status')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/notion-setup')
def notion_setup():
    """Setup page for Notion CMS configuration"""
    if not CMS_AVAILABLE:
        flash('Notion CMS is not available. Please check your configuration.', 'error')
        return redirect(url_for('admin_panel'))

    # Check if Notion is configured
    notion_configured = notion_cms.client is not None

    # Get current content stats if configured
    content_stats = {}
    if notion_configured:
        try:
            # Use cached content for better performance
            cached = get_cached_content()
            content_stats = {
                'services': len(cached.get('services', [])),
                'news': len(cached.get('news', [])),
                'testimonials': len(cached.get('testimonials', [])),
                'featured': len(cached.get('featured', []))
            }
        except:
            content_stats = {}

    return render_template('notion_setup.html',
                         notion_configured=notion_configured,
                         content_stats=content_stats)

@app.route('/admin/notion-onboarding')
def notion_onboarding():
    """Notion CMS onboarding guide"""
    has_secret = os.environ.get('NOTION_INTEGRATION_SECRET') is not None
    has_database = os.environ.get('NOTION_DATABASE_ID') is not None

    return render_template('notion_onboarding.html',
                         has_secret=has_secret,
                         has_database=has_database)

@app.route('/admin/notion-setup/initialize', methods=['POST'])
def notion_initialize():
    """Initialize Notion database with sample content"""
    if not CMS_AVAILABLE:
        return jsonify({'error': 'Notion CMS not available'}), 503

    try:
        success = initialize_default_content()
        if success:
            # Sync the new content to cache
            auto_sync_content()
            flash('Sample content created successfully in Notion!', 'success')
        else:
            flash('Failed to create sample content. Please check your Notion configuration.', 'error')
    except Exception as e:
        flash(f'Error: {str(e)}', 'error')

    return redirect(url_for('notion_setup'))

@app.route('/service/<slug>')
def service_detail(slug):
    """Display individual service content from Notion"""
    if CMS_AVAILABLE and content_sync:
        service = content_sync.get_service_by_slug(slug)
        if service:
            return render_template('notion_content_display.html',
                                 content=service,
                                 page_title=service.get('title', 'Service'))

    # Fallback to 404 if not found
    return render_template('index.html'), 404

@app.route('/api/notion/clear-cache', methods=['POST'])
def api_clear_cache():
    """Clear the Notion content cache"""
    if not CMS_AVAILABLE:
        return jsonify({'error': 'Notion CMS not available'}), 503

    try:
        success = content_sync.clear_cache()
        if success:
            return jsonify({'success': True, 'message': 'Cache cleared successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to clear cache'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notion/cached-content')
def api_cached_content():
    """Get cached content without syncing"""
    if not CMS_AVAILABLE:
        return jsonify({'error': 'Notion CMS not available'}), 503

    try:
        cached = get_cached_content()
        return jsonify(cached)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ai-assistant')
def ai_assistant():
    """Load the Gem AI Cybersecurity Assistant page"""
    return render_template('ai_assistant.html')

@app.route('/chat', methods=['POST'])
def chat():
    """AI Chat endpoint - connects to OpenAI for cybersecurity guidance"""
    if not AI_AVAILABLE or not openai_client:
        return jsonify({"reply": "AI assistant is not available. Please check configuration."}), 503

    data = request.json
    user_message = data.get("message", "")

    if not user_message.strip():
        return jsonify({"reply": "Please type a message so I can help you."})

    try:
        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are the Gem AI Cybersecurity Assistant. "
                        "You provide safe, educational cybersecurity guidance in clear steps. "
                        "You do NOT ask for or process passwords, full credit card numbers, "
                        "private keys, or any extremely sensitive data. "
                        "You help users understand threats, phishing, scams, and good practice."
                    )
                },
                {"role": "user", "content": user_message}
            ]
        )
        reply = completion.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        logging.error(f"OpenAI API error: {str(e)}")
        return jsonify({"reply": f"I encountered an error: {str(e)}"}), 500

@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors"""
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return render_template('index.html'), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)