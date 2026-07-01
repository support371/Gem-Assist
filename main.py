from app import app
import os
import logging

from video_representatives import register_video_representatives

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Register the profile-driven video representative feature for both
# `python main.py` and `gunicorn main:app` deployments.
register_video_representatives(app)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting Flask app on port {port}")
    try:
        app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
    except Exception as e:
        logger.error(f"Failed to start app: {e}")
        raise
