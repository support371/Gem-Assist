# telegram_routes.py
import logging
from flask import Blueprint, render_template, redirect, request, jsonify, current_app, url_for
from datetime import datetime

# Local import of the bot implementation
try:
    from gem_telegram_workflows import GEMWorkflowBots
    BOT_IMPL_AVAILABLE = True
except Exception as e:
    logging.warning(f"GEMWorkflowBots import failed: {e}")
    BOT_IMPL_AVAILABLE = False

telegram_bp = Blueprint('telegram', __name__, template_folder='templates')

# Server-side canonical mapping for Telegram bot join links (keeps UI + server consistent)
BOT_URLS = {
    'cybersecurity': 'https://t.me/CyberSecurityBot',
    'asset': 'https://t.me/AssetRecoveryBot',
    'finance': 'https://t.me/FinanceMonitorBot',
    'realestate': 'https://t.me/RealEstateBot',
    'trading': 'https://t.me/TradingSignalsBot',
    'wallet': 'https://t.me/WalletSecurityBot',
}

# === UI routes ===
@telegram_bp.route('/bot-automation')
def bot_automation():
    """
    Serves the Telegram bot product page (telegram-bot.html).
    Matches the UI you added in templates/telegram-bot.html.
    """
    return render_template('telegram-bot.html')

# Server-side join route (called by client JS). Keeps analytics + optional DB logging.
@telegram_bp.route('/join/<bot_type>')
def join_bot(bot_type):
    """
    Redirect user to the canonical Telegram bot URL for the requested bot_type.
    This allows the server to log clicks, create Redirect DB rows, etc.
    """
    destination = BOT_URLS.get(bot_type)
    if not destination:
        return render_template('404.html'), 404

    # If you want to record metrics in DB, do it here (if models and DB configured)
    try:
        if current_app.config.get('USE_DATABASE', False):
            from models import Redirect  # optional: store redirect hits or create a short code
            # create lightweight log record (not a short link)
            # example: RedirectLog model would be better; avoid modifying Redirect model here.
    except Exception:
        logging.exception("Unable to write redirect log (database may be unavailable)")

    # Server-side redirect so the request passes through your domain
    return redirect(destination)


# === Webhook endpoint for Telegram updates ===
@telegram_bp.route('/webhook', methods=['POST'])
def telegram_webhook():
    """
    Accepts Telegram webhook POSTs. The incoming JSON should be the Telegram update.
    Optional: X-Telegram-Bot-Token header or ?token= query param can be used to
    identify which bot token the update belongs to.
    """
    try:
        update = request.get_json(force=True, silent=False)
    except Exception as e:
        logging.exception("Invalid JSON payload for Telegram webhook")
        return jsonify({'error': 'invalid json', 'detail': str(e)}), 400

    # look for a token to identify which configured bot this webhook belongs to
    token = request.headers.get('X-Telegram-Bot-Token') or request.args.get('token') or current_app.config.get('TELEGRAM_BOT_TOKEN')
    try:
        # Prefer the centrally created instance if present on the Flask module globals
        bot_instance = None
        # app.py creates a global telegram_bot_instance; try to reuse it
        bot_instance = getattr(current_app, 'telegram_bot_instance', None)
        if not bot_instance:
            # fallback to local instantiation
            if BOT_IMPL_AVAILABLE:
                bot_instance = GEMWorkflowBots()
            else:
                raise RuntimeError("No Telegram bot implementation available")

        result = bot_instance.process_update(update, bot_token=token)
        # result expected to be a dict; return it to Telegram (200 OK)
        return jsonify({'ok': True, 'result': result}), 200
    except Exception as e:
        logging.exception("Error processing Telegram webhook")
        return jsonify({'error': str(e)}), 500


# === API: request bot access / plan selection ===
@telegram_bp.route('/request-access', methods=['POST'])
def request_access():
    """
    Called when user picks a plan (basic/pro/pro/enterprise). Expects JSON or form:
    { plan: 'pro', name: 'Alice', email: 'alice@...', bot_types: ['finance','asset'] }
    This endpoint will:
      - validate payload
      - create a DB request or send a support email (simple example: return 202)
    """
    payload = request.get_json(silent=True) or request.form.to_dict()
    plan = payload.get('plan') or payload.get('plan_type')
    name = payload.get('name')
    email = payload.get('email')

    if not plan or not email:
        return jsonify({'error': 'missing plan or email'}), 400

    # Insert into DB or dispatch to CRM / Notion / Mailer
    try:
        if current_app.config.get('USE_DATABASE', False):
            from models import ContactSubmission
            cs = ContactSubmission(name=name or 'unknown', email=email, message=f"Bot access request: {plan}")
            db = getattr(current_app, 'db', None)
            if db:
                db.session.add(cs)
                db.session.commit()
        else:
            logging.info(f"Bot access (no-db) request: plan={plan}, name={name}, email={email}")
        # Optionally: notify integrations
        return jsonify({'status': 'accepted'}), 202
    except Exception as e:
        logging.exception("Error recording bot access request")
        return jsonify({'error': str(e)}), 500


# === Redirect to backend services (Make/Notion/dashboard) with small redirect page ===
@telegram_bp.route('/redirect/<service>')
def redirect_to_service(service):
    """
    Redirect page for internal backend services. Uses canonical URLs from app config
    so we avoid hardcoding them in multiple places.
    """
    services = {
        'make': current_app.config.get('MAKE_WEBHOOK_URL', ''),
        'notion': current_app.config.get('NOTION_WEBHOOK_URL', ''),
        'dashboard': current_app.config.get('DASHBOARD_URL', 'https://gem-enterprise.com/dashboard'),
        'kyc': current_app.config.get('KYC_URL', 'https://gem-enterprise.com/kyc')
    }
    destination = services.get(service)
    if not destination:
        return render_template('404.html'), 404

    # render a small 'redirecting' page (template below) which uses meta-refresh
    return render_template('redirecting.html', destination=destination)

# end of telegram_routes.py