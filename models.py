from datetime import datetime
from typing import Optional
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    Boolean,
    Enum,
    Date,
)
import enum


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


class ServiceType(enum.Enum):
    CYBERSECURITY = "cybersecurity"
    REAL_ESTATE = "real_estate"
    TELEGRAM_BOT = "telegram_bot"
    RECOVERY_SERVICE = "recovery_service"
    POWER_OF_ATTORNEY = "power_of_attorney"
    INVESTMENT = "investment"
    BUSINESS_ANALYSIS = "business_analysis"
    OTHER = "other"


class TestimonialStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FEATURED = "featured"


class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True)

    # Client Information
    client_name = Column(String(100), nullable=False)
    client_email = Column(String(120), nullable=False)
    client_phone = Column(String(20))
    company_name = Column(String(100))
    company_position = Column(String(100))

    # Testimonial Content
    service_type: Column = Column(Enum(ServiceType), nullable=False)
    rating = Column(Float, nullable=False, default=5.0)
    title = Column(String(200))
    testimonial_text = Column(Text, nullable=False)

    # Media Files
    video_url = Column(String(500))  # Path to uploaded video
    image_url = Column(String(500))  # Path to uploaded image/logo
    company_logo_url = Column(String(500))  # Company logo

    # Metadata
    status: Column = Column(Enum(TestimonialStatus), default=TestimonialStatus.PENDING)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime)
    approved_by = Column(String(100))

    # Display Options
    is_featured = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)

    # Consent
    consent_to_display = Column(Boolean, default=False)
    consent_to_contact = Column(Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "client_name": self.client_name,
            "company_name": self.company_name,
            "company_position": self.company_position,
            "service_type": self.service_type.value if self.service_type else None,
            "rating": self.rating,
            "title": self.title,
            "testimonial_text": self.testimonial_text,
            "video_url": self.video_url,
            "image_url": self.image_url,
            "company_logo_url": self.company_logo_url,
            "submitted_at": (
                self.submitted_at.isoformat() if self.submitted_at else None
            ),
            "is_featured": self.is_featured,
        }


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(20))
    subject = Column(String(200))
    message = Column(Text, nullable=False)
    service_interest = Column(String(100))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    responded_at = Column(DateTime)


class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False)
    name = Column(String(100))
    subscribed_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    unsubscribed_at = Column(DateTime)


class VIPBoardMember(Base):
    __tablename__ = "vip_board_members"

    id = Column(Integer, primary_key=True)
    position = Column(String(50), unique=True, nullable=False)  # CEO, CFO, COO, LEGAL
    name = Column(String(100), nullable=False)
    title = Column(String(200))
    bio = Column(Text)
    headshot_url = Column(String(500))  # Path to uploaded headshot
    alignable_url = Column(String(200))
    email = Column(String(120))
    years_experience = Column(Integer)
    specialties = Column(Text)  # Comma-separated specialties
    achievements = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class BoardMember(Base):
    __tablename__ = "board_members"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    position = Column(String(200), nullable=False)
    department = Column(String(100))  # Executive, Advisory, Operations, etc.
    bio = Column(Text)
    photo_url = Column(String(500))
    alignable_url = Column(String(200))
    email = Column(String(120))
    phone = Column(String(20))
    start_date = Column(Date)
    specialties = Column(Text)
    responsibilities = Column(Text)
    order_index = Column(Integer, default=0)  # For custom ordering
    is_executive = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True)
    member_id = Column(String(50), unique=True, nullable=False)  # Unique membership ID
    full_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    phone = Column(String(20))
    company = Column(String(200))
    position = Column(String(100))
    membership_type = Column(String(50))  # Gold, Silver, Bronze, Basic
    status = Column(
        String(20), default="pending"
    )  # pending, active, suspended, expired
    join_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime)
    last_payment_date = Column(DateTime)
    benefits = Column(Text)  # JSON string of benefits
    notes = Column(Text)
    referred_by = Column(String(100))
    photo_url = Column(String(500))
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
