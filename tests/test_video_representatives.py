from datetime import datetime, timedelta

from flask import Flask

from models import db
from video_representatives import (
    RepresentativeProfile,
    VideoCallRequest,
    video_representatives_bp,
)


def build_test_app():
    app = Flask(__name__)
    app.config.update(
        TESTING=True,
        SECRET_KEY="test-secret",
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        VIDEO_REPRESENTATIVE_DB_READY=True,
    )
    db.init_app(app)
    app.register_blueprint(video_representatives_bp)
    return app


def test_public_api_only_returns_active_approved_public_profiles():
    app = build_test_app()
    with app.app_context():
        db.create_all()
        db.session.add_all(
            [
                RepresentativeProfile(
                    slug="approved-advisor",
                    display_name="Approved Advisor",
                    role_title="Property Consultant",
                    department="Real Estate",
                    authorization_status="approved",
                    is_public=True,
                    is_call_selectable=True,
                    is_active=True,
                    requires_disclosure=True,
                    disclosure_text="Virtual representative notice.",
                ),
                RepresentativeProfile(
                    slug="private-advisor",
                    display_name="Private Advisor",
                    role_title="Property Consultant",
                    department="Real Estate",
                    authorization_status="approved",
                    is_public=False,
                    is_call_selectable=True,
                    is_active=True,
                    requires_disclosure=True,
                    disclosure_text="Virtual representative notice.",
                ),
                RepresentativeProfile(
                    slug="pending-advisor",
                    display_name="Pending Advisor",
                    role_title="Property Consultant",
                    department="Real Estate",
                    authorization_status="pending",
                    is_public=True,
                    is_call_selectable=True,
                    is_active=True,
                    requires_disclosure=True,
                    disclosure_text="Virtual representative notice.",
                ),
            ]
        )
        db.session.commit()

    response = app.test_client().get("/api/video-representatives")
    assert response.status_code == 200
    payload = response.get_json()
    assert [item["slug"] for item in payload["profiles"]] == ["approved-advisor"]


def test_expired_authorization_is_not_valid():
    profile = RepresentativeProfile(
        slug="expired-profile",
        display_name="Expired Profile",
        role_title="Support Representative",
        department="Support",
        authorization_status="approved",
        authorization_expires_at=datetime.utcnow() - timedelta(minutes=1),
    )
    assert profile.is_authorized is False


def test_call_request_keeps_disclosure_and_handoff_records():
    app = build_test_app()
    with app.app_context():
        db.create_all()
        profile = RepresentativeProfile(
            slug="support-guide",
            display_name="Support Guide",
            role_title="Client Support",
            department="Support",
            authorization_status="approved",
            is_public=True,
            is_call_selectable=True,
            is_active=True,
            requires_disclosure=True,
            disclosure_text="Virtual representative notice.",
        )
        db.session.add(profile)
        db.session.flush()
        call = VideoCallRequest(
            requester_name="Test Client",
            requester_email="client@example.com",
            topic="Project discussion",
            requested_profile=profile,
            representative_disclosure_acknowledged=True,
            human_handoff_requested=True,
        )
        db.session.add(call)
        db.session.commit()

        stored = VideoCallRequest.query.one()
        assert stored.requested_profile.slug == "support-guide"
        assert stored.representative_disclosure_acknowledged is True
        assert stored.human_handoff_requested is True
