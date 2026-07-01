"""Compliant profile-driven video representative registry for GEM Assist."""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime
from functools import wraps

from flask import (
    Blueprint,
    abort,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from sqlalchemy import or_

from models import db

logger = logging.getLogger(__name__)
video_representatives_bp = Blueprint("video_representatives", __name__)


class RepresentativeProfile(db.Model):
    __tablename__ = "video_representative_profiles"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(140), nullable=False)
    role_title = db.Column(db.String(180), nullable=False)
    department = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.Text, nullable=False, default="")
    expertise_json = db.Column(db.Text, nullable=False, default="[]")
    languages_json = db.Column(db.Text, nullable=False, default='["English"]')

    source_type = db.Column(db.String(30), nullable=False, default="company")
    profile_kind = db.Column(db.String(30), nullable=False, default="virtual")
    is_public = db.Column(db.Boolean, nullable=False, default=True)
    is_call_selectable = db.Column(db.Boolean, nullable=False, default=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    profile_image_url = db.Column(db.String(1000))
    avatar_provider = db.Column(db.String(80))
    avatar_id = db.Column(db.String(255))
    avatar_source_url = db.Column(db.String(1000))
    voice_provider = db.Column(db.String(80))
    voice_id = db.Column(db.String(255))
    voice_label = db.Column(db.String(160))
    voice_style = db.Column(db.String(160), default="Professional")

    knowledge_sources_json = db.Column(db.Text, nullable=False, default="[]")
    permitted_actions_json = db.Column(db.Text, nullable=False, default="[]")
    supervisor_name = db.Column(db.String(160))
    supervisor_email = db.Column(db.String(255))

    authorization_status = db.Column(db.String(30), nullable=False, default="pending")
    likeness_authorization_reference = db.Column(db.String(500))
    voice_authorization_reference = db.Column(db.String(500))
    authorization_expires_at = db.Column(db.DateTime)

    requires_disclosure = db.Column(db.Boolean, nullable=False, default=True)
    disclosure_text = db.Column(
        db.Text,
        nullable=False,
        default=(
            "You are meeting with a virtual company representative. "
            "A human team member can be requested at any time."
        ),
    )

    created_by = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    @staticmethod
    def decode_list(raw):
        try:
            value = json.loads(raw or "[]")
        except (TypeError, ValueError):
            return []
        return [str(item) for item in value] if isinstance(value, list) else []

    @property
    def expertise(self):
        return self.decode_list(self.expertise_json)

    @property
    def languages(self):
        return self.decode_list(self.languages_json)

    @property
    def permitted_actions(self):
        return self.decode_list(self.permitted_actions_json)

    @property
    def is_authorized(self):
        if self.authorization_status != "approved":
            return False
        return not (
            self.authorization_expires_at
            and self.authorization_expires_at < datetime.utcnow()
        )

    def to_public_dict(self):
        return {
            "slug": self.slug,
            "display_name": self.display_name,
            "role_title": self.role_title,
            "department": self.department,
            "bio": self.bio,
            "expertise": self.expertise,
            "languages": self.languages,
            "profile_kind": self.profile_kind,
            "profile_image_url": self.profile_image_url,
            "requires_disclosure": self.requires_disclosure,
            "disclosure_text": self.disclosure_text if self.requires_disclosure else None,
        }


class VideoCallRequest(db.Model):
    __tablename__ = "video_call_requests"

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        index=True,
        default=lambda: str(uuid.uuid4()),
    )
    requester_name = db.Column(db.String(140), nullable=False)
    requester_email = db.Column(db.String(255), nullable=False, index=True)
    requester_company = db.Column(db.String(180))
    topic = db.Column(db.String(240), nullable=False)
    details = db.Column(db.Text, nullable=False, default="")
    scheduled_for = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, nullable=False, default=30)
    language = db.Column(db.String(80), nullable=False, default="English")

    requested_profile_id = db.Column(
        db.Integer, db.ForeignKey("video_representative_profiles.id")
    )
    assigned_profile_id = db.Column(
        db.Integer, db.ForeignKey("video_representative_profiles.id")
    )
    requested_profile = db.relationship(
        "RepresentativeProfile", foreign_keys=[requested_profile_id]
    )
    assigned_profile = db.relationship(
        "RepresentativeProfile", foreign_keys=[assigned_profile_id]
    )

    status = db.Column(db.String(30), nullable=False, default="requested")
    room_provider = db.Column(db.String(80))
    room_name = db.Column(db.String(255))
    room_url = db.Column(db.String(1200))

    representative_disclosure_acknowledged = db.Column(
        db.Boolean, nullable=False, default=False
    )
    recording_consent = db.Column(db.Boolean, nullable=False, default=False)
    human_handoff_requested = db.Column(db.Boolean, nullable=False, default=False)
    internal_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


def _database_ready():
    return bool(current_app.config.get("VIDEO_REPRESENTATIVE_DB_READY"))


def _require_database():
    if not _database_ready():
        abort(503, description="Video representative database is not ready.")


def _admin_logins():
    raw = os.environ.get("REPRESENTATIVE_ADMIN_GITHUB_LOGINS", "support371")
    return {item.strip().lower() for item in raw.split(",") if item.strip()}


def _current_login():
    return str((session.get("github_user") or {}).get("login") or "").lower()


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_app.config.get("TESTING") and _current_login() not in _admin_logins():
            flash("Use an approved GitHub administrator account.", "warning")
            return redirect(url_for("github_login"))
        return view(*args, **kwargs)

    return wrapped


def _items(value):
    return [x.strip() for x in re.split(r"[\n,;]+", value or "") if x.strip()]


def _slug(value):
    result = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return result or f"representative-{uuid.uuid4().hex[:8]}"


def _unique_slug(name, profile_id=None):
    base, candidate, number = _slug(name), _slug(name), 2
    while True:
        query = RepresentativeProfile.query.filter_by(slug=candidate)
        if profile_id:
            query = query.filter(RepresentativeProfile.id != profile_id)
        if query.first() is None:
            return candidate
        candidate, number = f"{base}-{number}", number + 1


def _parse_datetime(value):
    try:
        return datetime.fromisoformat(value) if value else None
    except ValueError:
        return None


def _checked(name):
    return request.form.get(name) in {"1", "on", "yes", "true"}


def _public_profiles():
    now = datetime.utcnow()
    return RepresentativeProfile.query.filter(
        RepresentativeProfile.is_active.is_(True),
        RepresentativeProfile.is_public.is_(True),
        RepresentativeProfile.is_call_selectable.is_(True),
        RepresentativeProfile.authorization_status == "approved",
        or_(
            RepresentativeProfile.authorization_expires_at.is_(None),
            RepresentativeProfile.authorization_expires_at > now,
        ),
    )


def _apply_form(profile):
    profile.display_name = request.form.get("display_name", "").strip()
    profile.slug = _unique_slug(profile.display_name, profile.id)
    profile.role_title = request.form.get("role_title", "").strip()
    profile.department = request.form.get("department", "").strip()
    profile.bio = request.form.get("bio", "").strip()
    profile.expertise_json = json.dumps(_items(request.form.get("expertise")))
    profile.languages_json = json.dumps(_items(request.form.get("languages")) or ["English"])
    profile.source_type = request.form.get("source_type", "company")
    profile.profile_kind = request.form.get("profile_kind", "virtual")
    profile.is_public = _checked("is_public")
    profile.is_call_selectable = _checked("is_call_selectable")
    profile.is_active = _checked("is_active")
    profile.profile_image_url = request.form.get("profile_image_url", "").strip() or None
    profile.avatar_provider = request.form.get("avatar_provider", "").strip() or None
    profile.avatar_id = request.form.get("avatar_id", "").strip() or None
    profile.avatar_source_url = request.form.get("avatar_source_url", "").strip() or None
    profile.voice_provider = request.form.get("voice_provider", "").strip() or None
    profile.voice_id = request.form.get("voice_id", "").strip() or None
    profile.voice_label = request.form.get("voice_label", "").strip() or None
    profile.voice_style = request.form.get("voice_style", "").strip() or "Professional"
    profile.knowledge_sources_json = json.dumps(
        _items(request.form.get("knowledge_sources"))
    )
    profile.permitted_actions_json = json.dumps(
        _items(request.form.get("permitted_actions"))
    )
    profile.supervisor_name = request.form.get("supervisor_name", "").strip() or None
    profile.supervisor_email = request.form.get("supervisor_email", "").strip() or None
    profile.authorization_status = request.form.get("authorization_status", "pending")
    profile.likeness_authorization_reference = (
        request.form.get("likeness_authorization_reference", "").strip() or None
    )
    profile.voice_authorization_reference = (
        request.form.get("voice_authorization_reference", "").strip() or None
    )
    profile.authorization_expires_at = _parse_datetime(
        request.form.get("authorization_expires_at")
    )
    profile.requires_disclosure = _checked("requires_disclosure")
    profile.disclosure_text = request.form.get("disclosure_text", "").strip()


def _profile_errors():
    errors = []
    for name, label in (
        ("display_name", "Display name"),
        ("role_title", "Role title"),
        ("department", "Department"),
    ):
        if not request.form.get(name, "").strip():
            errors.append(f"{label} is required.")

    kind = request.form.get("profile_kind", "virtual")
    if kind in {"virtual", "hybrid"} and not _checked("requires_disclosure"):
        errors.append("Virtual and hybrid profiles must keep disclosure enabled.")
    if _checked("requires_disclosure") and not request.form.get(
        "disclosure_text", ""
    ).strip():
        errors.append("Disclosure text is required.")

    source = request.form.get("source_type", "company")
    status = request.form.get("authorization_status", "pending")
    if source in {"external", "private"} and status == "approved":
        if not (
            request.form.get("likeness_authorization_reference", "").strip()
            or request.form.get("avatar_provider", "").strip()
        ):
            errors.append("Approved external profiles need avatar authorization.")
        if not (
            request.form.get("voice_authorization_reference", "").strip()
            or request.form.get("voice_provider", "").strip()
        ):
            errors.append("Approved external profiles need voice authorization.")
    return errors


@video_representatives_bp.get("/video-representatives")
def representatives():
    _require_database()
    profiles = _public_profiles().order_by(
        RepresentativeProfile.department, RepresentativeProfile.display_name
    ).all()
    return render_template("video_representatives.html", profiles=profiles)


@video_representatives_bp.get("/video-representatives/<slug>")
def representative_detail(slug):
    _require_database()
    profile = _public_profiles().filter_by(slug=slug).first_or_404()
    return render_template("video_representative_detail.html", profile=profile)


@video_representatives_bp.get("/api/video-representatives")
def representatives_api():
    _require_database()
    profiles = _public_profiles().order_by(RepresentativeProfile.display_name).all()
    return jsonify({"profiles": [profile.to_public_dict() for profile in profiles]})


@video_representatives_bp.route("/video-call/request", methods=["GET", "POST"])
def request_video_call():
    _require_database()
    profiles = _public_profiles().order_by(
        RepresentativeProfile.department, RepresentativeProfile.display_name
    ).all()
    selected_slug = request.args.get("representative")
    selected_profile = next((x for x in profiles if x.slug == selected_slug), None)

    if request.method == "POST":
        profile_id = request.form.get("requested_profile_id", type=int)
        profile = _public_profiles().filter_by(id=profile_id).first() if profile_id else None
        errors = []
        if not request.form.get("requester_name", "").strip():
            errors.append("Your name is required.")
        email = request.form.get("requester_email", "").strip()
        if "@" not in email:
            errors.append("A valid email is required.")
        if not request.form.get("topic", "").strip():
            errors.append("A meeting topic is required.")
        if profile and profile.requires_disclosure and not _checked(
            "representative_disclosure_acknowledged"
        ):
            errors.append("Please acknowledge the representative disclosure.")

        if errors:
            for error in errors:
                flash(error, "error")
        else:
            call = VideoCallRequest(
                requester_name=request.form["requester_name"].strip(),
                requester_email=email,
                requester_company=request.form.get("requester_company", "").strip() or None,
                topic=request.form["topic"].strip(),
                details=request.form.get("details", "").strip(),
                scheduled_for=_parse_datetime(request.form.get("scheduled_for")),
                duration_minutes=request.form.get("duration_minutes", type=int) or 30,
                language=request.form.get("language", "").strip() or "English",
                requested_profile=profile,
                representative_disclosure_acknowledged=_checked(
                    "representative_disclosure_acknowledged"
                ),
                recording_consent=_checked("recording_consent"),
                human_handoff_requested=_checked("human_handoff_requested"),
            )
            db.session.add(call)
            db.session.commit()
            return redirect(
                url_for(
                    "video_representatives.video_call_confirmation",
                    public_id=call.public_id,
                )
            )

    return render_template(
        "video_call_request.html",
        profiles=profiles,
        selected_profile=selected_profile,
    )


@video_representatives_bp.get("/video-call/request/<public_id>")
def video_call_confirmation(public_id):
    _require_database()
    call = VideoCallRequest.query.filter_by(public_id=public_id).first_or_404()
    return render_template("video_call_confirmation.html", call_request=call)


@video_representatives_bp.route(
    "/admin/video-representatives", methods=["GET", "POST"]
)
@admin_required
def admin_representatives():
    _require_database()
    if request.method == "POST":
        errors = _profile_errors()
        if not errors:
            profile = RepresentativeProfile(
                slug=_unique_slug(request.form.get("display_name", "representative")),
                display_name="Temporary",
                role_title="Temporary",
                department="Temporary",
                created_by=_current_login() or "admin",
            )
            _apply_form(profile)
            db.session.add(profile)
            db.session.commit()
            flash("Representative profile created.", "success")
            return redirect(url_for("video_representatives.admin_representatives"))
        for error in errors:
            flash(error, "error")

    profiles = RepresentativeProfile.query.order_by(
        RepresentativeProfile.department, RepresentativeProfile.display_name
    ).all()
    return render_template("admin_video_representatives.html", profiles=profiles)


@video_representatives_bp.route(
    "/admin/video-representatives/<int:profile_id>/edit", methods=["GET", "POST"]
)
@admin_required
def edit_representative(profile_id):
    _require_database()
    profile = RepresentativeProfile.query.get_or_404(profile_id)
    if request.method == "POST":
        errors = _profile_errors()
        if not errors:
            _apply_form(profile)
            db.session.commit()
            flash("Representative profile updated.", "success")
            return redirect(url_for("video_representatives.admin_representatives"))
        for error in errors:
            flash(error, "error")
    return render_template("admin_video_representative_edit.html", profile=profile)


@video_representatives_bp.get("/admin/video-call-requests")
@admin_required
def admin_video_call_requests():
    _require_database()
    calls = VideoCallRequest.query.order_by(VideoCallRequest.created_at.desc()).all()
    profiles = RepresentativeProfile.query.filter_by(
        is_active=True, authorization_status="approved"
    ).order_by(RepresentativeProfile.department, RepresentativeProfile.display_name)
    return render_template(
        "admin_video_call_requests.html", calls=calls, profiles=profiles.all()
    )


@video_representatives_bp.post(
    "/admin/video-call-requests/<int:call_id>/assign"
)
@admin_required
def assign_video_call(call_id):
    _require_database()
    call = VideoCallRequest.query.get_or_404(call_id)
    profile = RepresentativeProfile.query.get(request.form.get("assigned_profile_id", type=int))
    if not profile or not profile.is_active or not profile.is_authorized:
        flash("Select an active, authorized representative.", "error")
        return redirect(url_for("video_representatives.admin_video_call_requests"))

    room_url = request.form.get("room_url", "").strip()
    if room_url and not room_url.startswith(("https://", "http://localhost")):
        flash("Meeting URLs must use HTTPS.", "error")
        return redirect(url_for("video_representatives.admin_video_call_requests"))

    call.assigned_profile = profile
    call.room_provider = request.form.get("room_provider", "").strip() or None
    call.room_name = request.form.get("room_name", "").strip() or None
    call.room_url = room_url or None
    call.internal_notes = request.form.get("internal_notes", "").strip() or None
    call.status = "scheduled" if room_url else "assigned"
    db.session.commit()
    flash("Video-call assignment saved.", "success")
    return redirect(url_for("video_representatives.admin_video_call_requests"))


def register_video_representatives(app):
    if "sqlalchemy" not in app.extensions:
        app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
            "VIDEO_REPRESENTATIVE_DATABASE_URL", "sqlite:///video_representatives.db"
        )
        app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)
        db.init_app(app)

    app.register_blueprint(video_representatives_bp)
    try:
        with app.app_context():
            db.create_all()
        app.config["VIDEO_REPRESENTATIVE_DB_READY"] = True
    except Exception:
        logger.exception("Unable to initialize video representative registry")
        app.config["VIDEO_REPRESENTATIVE_DB_READY"] = False
