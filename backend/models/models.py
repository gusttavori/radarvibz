"""
Radar Vibz - SQLAlchemy ORM Models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.session import Base

class ProfileModel(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    profile_url = Column(String, nullable=False)
    category = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, default="BA")
    description = Column(Text, default="")
    internal_notes = Column(Text, default="")
    monitoring_status = Column(String, default="active") # active, paused, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    last_checked_at = Column(DateTime, nullable=True)
    last_post_at = Column(DateTime, nullable=True)
    integration_method = Column(String, default="demo_simulation")
    followers_count = Column(Integer, default=0)
    total_posts_found = Column(Integer, default=0)
    is_demo = Column(Boolean, default=False)

    publications = relationship("PublicationModel", back_populates="profile", cascade="all, delete-orphan")


class PublicationModel(Base):
    __tablename__ = "publications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    username = Column(String, index=True, nullable=False)
    external_id = Column(String, unique=True, index=True, nullable=False) # Instagram Media ID
    original_url = Column(String, nullable=False)
    media_type = Column(String, default="IMAGE")
    caption = Column(Text, default="")
    published_at = Column(DateTime, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow)
    media_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    analysis_status = Column(String, default="pending")
    relevance = Column(String, default="none")
    ai_analysis = Column(JSON, nullable=True)
    is_reviewed = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)

    profile = relationship("ProfileModel", back_populates="publications")
    opportunity = relationship("OpportunityModel", back_populates="publication", uselist=False)


class OpportunityModel(Base):
    __tablename__ = "opportunities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    publication_id = Column(String, ForeignKey("publications.id"), unique=True, nullable=False)
    profile_id = Column(String, nullable=False)
    username = Column(String, nullable=False)
    event_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    event_date = Column(String, nullable=True)
    event_time = Column(String, nullable=True)
    city = Column(String, nullable=False)
    venue = Column(String, nullable=True)
    artists = Column(JSON, default=list)
    summary = Column(Text, default="")
    original_url = Column(String, nullable=False)
    relevance = Column(String, default="medium")
    commercial_potential = Column(Text, default="")
    suggested_action = Column(Text, default="")
    detected_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Nova") # Nova, Em análise, Contato necessário, Em negociação, Convertida, Descartada
    internal_notes = Column(Text, default="")
    contact_logs = Column(JSON, default=list)
    is_demo = Column(Boolean, default=False)

    publication = relationship("PublicationModel", back_populates="opportunity")


class ProfileCandidateModel(Base):
    __tablename__ = "profile_candidates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    probable_category = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, default="BA")
    justification = Column(Text, default="")
    source = Column(String, default="Busca Regional")
    discovered_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Pendente") # Pendente, Aprovado, Rejeitado, Já cadastrado
    followers_estimated = Column(Integer, default=0)
    is_demo = Column(Boolean, default=False)


class MonitoringLogModel(Base):
    __tablename__ = "monitoring_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow)
    duration_ms = Column(Integer, default=0)
    profiles_checked = Column(Integer, default=0)
    new_posts_found = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    status = Column(String, default="success")
    details = Column(Text, default="")
    provider = Column(String, default="demo_simulation")
