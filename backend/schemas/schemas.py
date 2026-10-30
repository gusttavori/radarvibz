"""
Radar Vibz - Pydantic Request & Response Schemas
"""
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProfileBase(BaseModel):
    username: str
    display_name: str
    category: str
    city: str
    state: str = "BA"
    description: Optional[str] = ""
    internal_notes: Optional[str] = ""
    integration_method: str = "demo_simulation"
    followers_count: Optional[int] = 0

class ProfileCreate(ProfileBase):
    pass

class ProfileOut(ProfileBase):
    id: str
    profile_url: str
    monitoring_status: str
    created_at: datetime
    last_checked_at: Optional[datetime] = None
    last_post_at: Optional[datetime] = None
    total_posts_found: int = 0
    is_demo: bool = False

    class Config:
        from_attributes = True

class PublicationOut(BaseModel):
    id: str
    profile_id: str
    username: str
    external_id: str
    original_url: str
    media_type: str
    caption: str
    published_at: datetime
    detected_at: datetime
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    analysis_status: str
    relevance: str
    ai_analysis: Optional[Dict[str, Any]] = None
    is_reviewed: bool
    is_demo: bool = False

    class Config:
        from_attributes = True

class OpportunityOut(BaseModel):
    id: str
    publication_id: str
    profile_id: str
    username: str
    event_name: str
    category: str
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    city: str
    venue: Optional[str] = None
    artists: List[str] = []
    summary: str
    original_url: str
    relevance: str
    commercial_potential: str
    suggested_action: str
    detected_at: datetime
    status: str
    internal_notes: str
    contact_logs: List[Dict[str, Any]] = []
    is_demo: bool = False

    class Config:
        from_attributes = True

class ProfileCandidateOut(BaseModel):
    id: str
    username: str
    display_name: str
    probable_category: str
    city: str
    state: str
    justification: str
    source: str
    discovered_at: datetime
    status: str
    followers_estimated: int = 0
    is_demo: bool = False

    class Config:
        from_attributes = True
