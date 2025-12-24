"""
FastAPI router for AI profiling endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
import time

from schemas.profiling import (
    ProfilingSession, ProfilingResult, ProfilingProgress,
    TrackRecommendation, OCH_TRACKS
)
from schemas.profiling_questions import ALL_PROFILING_QUESTIONS
from services.profiling_service import profiling_service
from utils.auth import verify_token

async def get_current_user_id(token: str = Depends(verify_token)) -> UUID:
    """Extract user ID from JWT token."""
    return token

router = APIRouter(prefix="/api/v1/profiling", tags=["ai-profiling"])


# In-memory session storage (in production, use Redis or database)
_active_sessions = {}


@router.post("/session/start", response_model=dict)
async def start_profiling_session(user_id: UUID = Depends(get_current_user_id)):
    """
    Start a new AI profiling session for a user.

    Returns session ID and initial progress information.
    """
    # Check if user already has an active session
    existing_session = None
    for session in _active_sessions.values():
        if session.user_id == user_id and session.completed_at is None:
            existing_session = session
            break

    if existing_session:
        progress = profiling_service.get_progress(existing_session)
        return {
            "session_id": existing_session.id,
            "status": "existing_session_resumed",
            "progress": progress.dict(),
            "message": "Resumed existing profiling session"
        }

    # Create new session
    session = profiling_service.create_session(user_id)
    _active_sessions[session.id] = session

    progress = profiling_service.get_progress(session)

    return {
        "session_id": session.id,
        "status": "new_session_started",
        "progress": progress.dict(),
        "message": "AI profiling session started successfully"
    }


@router.get("/session/{session_id}/progress", response_model=ProfilingProgress)
async def get_session_progress(
    session_id: str,
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Get current progress for a profiling session.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    progress = profiling_service.get_progress(session)
    return progress


@router.get("/questions", response_model=List[dict])
async def get_profiling_questions(user_id: UUID = Depends(get_current_user_id)):
    """
    Get all profiling questions for the assessment.
    """
    questions = profiling_service.get_all_questions()
    return questions


@router.get("/question/{question_id}")
async def get_specific_question(
    question_id: str,
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Get a specific profiling question.
    """
    question = profiling_service.get_question(question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    return question


@router.post("/session/{session_id}/respond")
async def submit_question_response(
    session_id: str,
    question_id: str,
    selected_option: str,
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Submit a response to a profiling question.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    if session.completed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profiling session is already completed"
        )

    # Record response time
    start_time = time.time()
    success = profiling_service.submit_response(
        session, question_id, selected_option
    )
    response_time_ms = int((time.time() - start_time) * 1000)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question ID or option value"
        )

    # Update response time
    for response in session.responses:
        if response.question_id == question_id:
            response.response_time_ms = response_time_ms
            break

    progress = profiling_service.get_progress(session)

    return {
        "success": True,
        "progress": progress.dict(),
        "message": f"Response recorded for question {question_id}"
    }


@router.post("/session/{session_id}/complete", response_model=ProfilingResult)
async def complete_profiling_session(
    session_id: str,
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Complete a profiling session and generate track recommendations.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    if session.completed_at is not None:
        # Return existing results if already completed
        result = ProfilingResult(
            user_id=session.user_id,
            session_id=session.id,
            recommendations=[],  # Would load from storage in production
            primary_track=OCH_TRACKS[session.recommended_track],
            assessment_summary="Session already completed",
            completed_at=session.completed_at
        )
        return result

    try:
        result = profiling_service.complete_session(session)

        # In production, save results to database
        # For now, just mark session as completed
        session.completed_at = result.completed_at

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/tracks", response_model=dict)
async def get_available_tracks(user_id: UUID = Depends(get_current_user_id)):
    """
    Get information about all available OCH tracks.
    """
    tracks = {}
    for key, track in OCH_TRACKS.items():
        tracks[key] = track.dict()

    return {
        "tracks": tracks,
        "total_tracks": len(tracks),
        "description": "Available OCH career tracks for AI-powered matching"
    }


@router.get("/session/{session_id}/results", response_model=ProfilingResult)
async def get_profiling_results(
    session_id: str,
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Get profiling results for a completed session.
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    if session.completed_at is None or session.recommended_track is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profiling session is not completed yet"
        )

    # Reconstruct result from session data
    recommendations = profiling_service.generate_recommendations(session.scores)
    primary_track = OCH_TRACKS[session.recommended_track]
    assessment_summary = profiling_service._generate_assessment_summary(recommendations)

    result = ProfilingResult(
        user_id=session.user_id,
        session_id=session.id,
        recommendations=recommendations,
        primary_track=primary_track,
        assessment_summary=assessment_summary,
        completed_at=session.completed_at
    )

    return result


@router.delete("/session/{session_id}")
async def delete_profiling_session(
    session_id: str,
    user_id: UUID = Depends(get_current_user_id)
):
    """
    Delete a profiling session (for testing/admin purposes).
    """
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profiling session not found"
        )

    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this profiling session"
        )

    # Remove session
    del _active_sessions[session_id]

    return {
        "success": True,
        "message": "Profiling session deleted successfully"
    }
