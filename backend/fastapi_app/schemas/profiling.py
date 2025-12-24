"""
Schemas for AI profiling system.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from uuid import UUID


class TrackInfo(BaseModel):
    """Information about an OCH track."""
    key: str
    name: str
    description: str
    focus_areas: List[str]
    career_paths: List[str]


class ProfilingQuestion(BaseModel):
    """A profiling question with multiple choice options."""
    id: str
    question: str
    category: str  # technical_aptitude, problem_solving, scenario_preference, work_style
    options: List[Dict[str, str]]  # [{"value": "A", "text": "Option A", "scores": {"builders": 2, "leaders": 1}}]


class ProfilingResponse(BaseModel):
    """User's response to a profiling question."""
    question_id: str
    selected_option: str
    response_time_ms: Optional[int] = None


class ProfilingSession(BaseModel):
    """A complete profiling session."""
    id: str
    user_id: UUID
    responses: List[ProfilingResponse]
    started_at: datetime
    completed_at: Optional[datetime] = None
    scores: Optional[Dict[str, float]] = None
    recommended_track: Optional[str] = None


class TrackRecommendation(BaseModel):
    """Recommendation result for a track."""
    track_key: str
    track_name: str
    score: float
    confidence_level: str  # high, medium, low
    reasoning: List[str]
    career_suggestions: List[str]


class ProfilingResult(BaseModel):
    """Complete profiling result."""
    user_id: UUID
    session_id: str
    recommendations: List[TrackRecommendation]
    primary_track: TrackInfo
    assessment_summary: str
    completed_at: datetime


class ProfilingProgress(BaseModel):
    """Current progress in profiling session."""
    session_id: str
    current_question: int
    total_questions: int
    progress_percentage: float
    estimated_time_remaining: int  # seconds


# OCH Tracks Definition
OCH_TRACKS = {
    "builders": TrackInfo(
        key="builders",
        name="Builders",
        description="Focused on engineering and technical construction. You excel at building robust systems, writing clean code, and turning complex technical requirements into working solutions.",
        focus_areas=[
            "Software Architecture",
            "System Design",
            "Code Quality",
            "Technical Implementation",
            "DevOps & Infrastructure"
        ],
        career_paths=[
            "Software Engineer",
            "System Architect",
            "DevOps Engineer",
            "Full-Stack Developer",
            "Technical Lead"
        ]
    ),
    "leaders": TrackInfo(
        key="leaders",
        name="Leaders",
        description="Focused on management and executive decision-making. You thrive in coordinating teams, making strategic decisions, and driving organizational success.",
        focus_areas=[
            "Team Management",
            "Strategic Planning",
            "Project Coordination",
            "Stakeholder Management",
            "Business Strategy"
        ],
        career_paths=[
            "Engineering Manager",
            "Product Manager",
            "Technical Program Manager",
            "VP of Engineering",
            "CTO"
        ]
    ),
    "entrepreneurs": TrackInfo(
        key="entrepreneurs",
        name="Entrepreneurs",
        description="Focused on transforming skills into business value. You excel at identifying market opportunities, building products, and creating sustainable business models.",
        focus_areas=[
            "Product Development",
            "Market Analysis",
            "Business Development",
            "Customer Discovery",
            "Revenue Models"
        ],
        career_paths=[
            "Startup Founder",
            "Product Entrepreneur",
            "Business Development Manager",
            "Innovation Lead",
            "Entrepreneur-in-Residence"
        ]
    ),
    "researchers": TrackInfo(
        key="researchers",
        name="Researchers",
        description="Focused on deep-dive technical investigation. You love exploring cutting-edge technologies, conducting experiments, and pushing the boundaries of what's possible.",
        focus_areas=[
            "Research & Development",
            "Technical Innovation",
            "Data Science",
            "Machine Learning",
            "Emerging Technologies"
        ],
        career_paths=[
            "Research Scientist",
            "Data Scientist",
            "ML Engineer",
            "Research Engineer",
            "Principal Researcher"
        ]
    ),
    "educators": TrackInfo(
        key="educators",
        name="Educators",
        description="Focused on training and knowledge transfer. You excel at breaking down complex concepts, mentoring others, and fostering learning environments.",
        focus_areas=[
            "Technical Training",
            "Mentorship",
            "Content Creation",
            "Knowledge Sharing",
            "Community Building"
        ],
        career_paths=[
            "Technical Trainer",
            "Engineering Mentor",
            "Content Creator",
            "Community Manager",
            "Learning & Development Lead"
        ]
    )
}


