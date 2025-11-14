import os
import logging
from flask import Flask, render_template, request, redirect, url_for, flash

# Try to import Notion client, handle if not available
try:
    from notion_client import Client

    NOTION_AVAILABLE = True
except ImportError:
    NOTION_AVAILABLE = False
    logging.warning("Notion client not available")

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)


def get_notion_team_data():
    """Fetch team member data from Notion database"""
    if not NOTION_AVAILABLE:
        return []

    try:
        notion = Client(auth=os.environ.get("NOTION_INTEGRATION_SECRET"))
        database_id = os.environ.get("NOTION_DATABASE_ID")

        if not notion or not database_id:
            return []

        # Query the database
        response = notion.databases.query(database_id=database_id)

        team_members = []
        for page in response["results"]:
            properties = page["properties"]

            # Extract member data
            member = {
                "name": "",
                "position": "",
                "department": "",
                "email": "",
                "bio": "",
                "image": "",
            }

            # Try common field names for team member data
            for prop_name, prop_data in properties.items():
                prop_type = prop_data["type"]

                if prop_type == "title" and prop_data["title"]:
                    member["name"] = prop_data["title"][0]["plain_text"]
                elif prop_type == "rich_text" and prop_data["rich_text"]:
                    text_content = prop_data["rich_text"][0]["plain_text"]
                    if "position" in prop_name.lower() or "role" in prop_name.lower():
                        member["position"] = text_content
                    elif (
                        "department" in prop_name.lower()
                        or "division" in prop_name.lower()
                    ):
                        member["department"] = text_content
                    elif "email" in prop_name.lower():
                        member["email"] = text_content
                    elif (
                        "bio" in prop_name.lower() or "description" in prop_name.lower()
                    ):
                        member["bio"] = text_content
                elif prop_type == "select" and prop_data["select"]:
                    if (
                        "department" in prop_name.lower()
                        or "division" in prop_name.lower()
                    ):
                        member["department"] = prop_data["select"]["name"]
                elif prop_type == "files" and prop_data["files"]:
                    member["image"] = prop_data["files"][0]["file"]["url"]

            if member["name"]:  # Only add if we have at least a name
                team_members.append(member)

        return team_members

    except Exception as e:
        logging.error(f"Error fetching Notion data: {e}")
        return []


def categorize_team_members(team_members):
    """Categorize team members into cybersecurity and real estate divisions"""
    cybersecurity_team = []
    real_estate_team = []

    cybersecurity_keywords = [
        "cyber",
        "security",
        "threat",
        "analyst",
        "monitoring",
        "compliance",
        "incident",
        "forensic",
    ]
    real_estate_keywords = [
        "real estate",
        "property",
        "investment",
        "mortgage",
        "leasing",
        "portfolio",
        "advisor",
        "broker",
    ]

    for member in team_members:
        member_text = (
            f"{member['position']} {member['department']} {member['bio']}".lower()
        )

        if any(keyword in member_text for keyword in cybersecurity_keywords):
            cybersecurity_team.append(member)
        elif any(keyword in member_text for keyword in real_estate_keywords):
            real_estate_team.append(member)
        else:
            # Default assignment based on company structure
            if (
                "manager" in member["position"].lower()
                or "ceo" in member["position"].lower()
            ):
                cybersecurity_team.append(member)
            else:
                real_estate_team.append(member)

    return cybersecurity_team, real_estate_team


# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "gem-assist-enterprise-secret-key")


# Routes
@app.route("/")
def index():
    """Home page with main services overview"""
    return render_template("index.html")


@app.route("/about")
def about():
    """About Gem Assist Enterprise"""
    return render_template("about.html")


@app.route("/services")
def services():
    """Services overview page"""
    return render_template("services.html")


@app.route("/contact")
def contact():
    """Contact information and form"""
    return render_template("contact.html")


@app.route("/telegram-bot-automation")
def telegram_bot():
    """Telegram bot automation services"""
    return render_template("telegram-bot.html")


@app.route("/power_of_attorney")
def power_of_attorney():
    """Power of Attorney services"""
    return render_template("power-of-attorney.html")


@app.route("/monitoring-threats")
def monitoring():
    """Threat monitoring services"""
    return render_template("monitoring.html")


@app.route("/testimonials")
def testimonials():
    """Client stories and testimonials for all services"""
    return render_template("testimonials.html")


@app.route("/partners-and-trustees")
def partners():
    """Partners and trustees information"""
    return render_template("partners.html")


@app.route("/client-access")
def client_access():
    """Client portal access"""
    return render_template("client.html")


@app.route("/admin-panel")
def admin_panel():
    """Administrative panel"""
    return render_template("admin.html")


@app.route("/gem-news-and-newsletter")
def news():
    """News and newsletter page"""
    return render_template("news.html")


@app.route("/teams")
def teams():
    """Leadership and team members structure"""
    team_data = get_notion_team_data()
    cybersecurity_team, real_estate_team = categorize_team_members(team_data)

    # Get the Notion database ID for embedding
    notion_database_id = os.environ.get("NOTION_DATABASE_ID", "")

    return render_template(
        "teams.html",
        cybersecurity_team=cybersecurity_team,
        real_estate_team=real_estate_team,
        database_id=notion_database_id,
    )


@app.route("/investment-portfolio")
def investment_portfolio():
    """Investment portfolio services"""
    return render_template("portfolio.html")


@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors"""
    return render_template("index.html"), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return render_template("index.html"), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
