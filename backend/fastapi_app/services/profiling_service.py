"""
AI Profiling service for OCH track assessment.
"""
import uuid
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from collections import defaultdict

from schemas.profiling import (
    ProfilingSession, ProfilingResponse, TrackRecommendation,
    ProfilingResult, ProfilingProgress, OCH_TRACKS
)
from schemas.profiling_questions import (
    ALL_PROFILING_QUESTIONS, CATEGORY_WEIGHTS,
    MIN_QUESTIONS_FOR_ASSESSMENT
)


class ProfilingService:
    """
    Service for handling AI-based profiling and track recommendations.
    """

    def __init__(self):
        self.questions = ALL_PROFILING_QUESTIONS
        self.question_map = {q.id: q for q in self.questions}

    def create_session(self, user_id: str) -> ProfilingSession:
        """
        Create a new profiling session for a user.

        Args:
            user_id: UUID of the user

        Returns:
            ProfilingSession: New session object
        """
        session = ProfilingSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            responses=[],
            started_at=datetime.utcnow(),
            scores=None,
            recommended_track=None
        )
        return session

    def get_question(self, question_id: str) -> Optional[Dict]:
        """
        Get a question by ID.

        Args:
            question_id: Question identifier

        Returns:
            Question data or None if not found
        """
        question = self.question_map.get(question_id)
        if not question:
            return None

        return {
            "id": question.id,
            "question": question.question,
            "category": question.category,
            "options": [
                {"value": opt["value"], "text": opt["text"]}
                for opt in question.options
            ]
        }

    def get_all_questions(self) -> List[Dict]:
        """
        Get all profiling questions in order.

        Returns:
            List of question data
        """
        return [self.get_question(q.id) for q in self.questions]

    def submit_response(self, session: ProfilingSession, question_id: str,
                       selected_option: str, response_time_ms: Optional[int] = None) -> bool:
        """
        Submit a response to a profiling question.

        Args:
            session: Current profiling session
            question_id: Question identifier
            selected_option: Selected option value (A, B, C)
            response_time_ms: Response time in milliseconds

        Returns:
            True if response was accepted, False otherwise
        """
        question = self.question_map.get(question_id)
        if not question:
            return False

        # Validate option exists
        valid_options = [opt["value"] for opt in question.options]
        if selected_option not in valid_options:
            return False

        # Check if response already exists for this question
        existing_response = next(
            (r for r in session.responses if r.question_id == question_id),
            None
        )

        if existing_response:
            # Update existing response
            existing_response.selected_option = selected_option
            existing_response.response_time_ms = response_time_ms
        else:
            # Add new response
            response = ProfilingResponse(
                question_id=question_id,
                selected_option=selected_option,
                response_time_ms=response_time_ms
            )
            session.responses.append(response)

        return True

    def calculate_scores(self, session: ProfilingSession) -> Dict[str, float]:
        """
        Calculate track scores based on user responses.

        Args:
            session: Profiling session with responses

        Returns:
            Dictionary mapping track keys to scores
        """
        scores = defaultdict(float)
        category_counts = defaultdict(int)

        for response in session.responses:
            question = self.question_map.get(response.question_id)
            if not question:
                continue

            # Find the selected option and its scores
            selected_option_data = None
            for option in question.options:
                if option["value"] == response.selected_option:
                    selected_option_data = option
                    break

            if not selected_option_data:
                continue

            # Apply category weight
            weight = CATEGORY_WEIGHTS.get(question.category, 1.0)
            category_counts[question.category] += 1

            # Add weighted scores
            for track, score in selected_option_data["scores"].items():
                scores[track] += score * weight

        # Normalize scores by number of questions answered in each category
        normalized_scores = {}
        for track in OCH_TRACKS.keys():
            total_weighted_score = scores[track]
            # Simple normalization - could be enhanced with more sophisticated algorithms
            normalized_scores[track] = min(100.0, total_weighted_score * 10)  # Scale to 0-100

        return dict(normalized_scores)

    def generate_recommendations(self, scores: Dict[str, float]) -> List[TrackRecommendation]:
        """
        Generate track recommendations based on scores.

        Args:
            scores: Dictionary of track scores

        Returns:
            List of track recommendations
        """
        recommendations = []

        # Sort tracks by score (descending)
        sorted_tracks = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        for i, (track_key, score) in enumerate(sorted_tracks):
            track_info = OCH_TRACKS[track_key]

            # Determine confidence level
            if i == 0:
                confidence_level = "high"
            elif i <= 2:
                confidence_level = "medium"
            else:
                confidence_level = "low"

            # Generate reasoning based on score and position
            reasoning = self._generate_reasoning(track_key, score, i + 1)

            recommendation = TrackRecommendation(
                track_key=track_key,
                track_name=track_info.name,
                score=round(score, 1),
                confidence_level=confidence_level,
                reasoning=reasoning,
                career_suggestions=track_info.career_paths[:3]  # Top 3 career paths
            )

            recommendations.append(recommendation)

        return recommendations

    def _generate_reasoning(self, track_key: str, score: float, rank: int) -> List[str]:
        """
        Generate reasoning text for a track recommendation.

        Args:
            track_key: Track identifier
            score: Calculated score
            rank: Ranking position (1-based)

        Returns:
            List of reasoning statements
        """
        track_info = OCH_TRACKS[track_key]
        reasoning = []

        if rank == 1:
            reasoning.append(f"Your responses strongly align with {track_info.name} characteristics.")
        elif rank <= 3:
            reasoning.append(f"You show moderate alignment with {track_info.name} traits.")
        else:
            reasoning.append(f"You have some alignment with {track_info.name} characteristics.")

        # Add track-specific reasoning
        if track_key == "builders":
            reasoning.append("You prefer hands-on technical work and systematic problem-solving.")
        elif track_key == "leaders":
            reasoning.append("You excel at coordinating teams and strategic decision-making.")
        elif track_key == "entrepreneurs":
            reasoning.append("You focus on business value and market opportunities.")
        elif track_key == "researchers":
            reasoning.append("You enjoy deep technical exploration and innovation.")
        elif track_key == "educators":
            reasoning.append("You thrive on knowledge sharing and team development.")

        return reasoning

    def complete_session(self, session: ProfilingSession) -> ProfilingResult:
        """
        Complete a profiling session and generate results.

        Args:
            session: Profiling session to complete

        Returns:
            ProfilingResult: Complete assessment results
        """
        if len(session.responses) < MIN_QUESTIONS_FOR_ASSESSMENT:
            raise ValueError(f"Insufficient responses for assessment. Need at least {MIN_QUESTIONS_FOR_ASSESSMENT} responses.")

        # Calculate scores
        scores = self.calculate_scores(session)
        session.scores = scores

        # Generate recommendations
        recommendations = self.generate_recommendations(scores)

        # Determine primary track
        primary_recommendation = recommendations[0]
        primary_track = OCH_TRACKS[primary_recommendation.track_key]
        session.recommended_track = primary_recommendation.track_key
        session.completed_at = datetime.utcnow()

        # Generate assessment summary
        assessment_summary = self._generate_assessment_summary(recommendations)

        result = ProfilingResult(
            user_id=session.user_id,
            session_id=session.id,
            recommendations=recommendations,
            primary_track=primary_track,
            assessment_summary=assessment_summary,
            completed_at=session.completed_at
        )

        return result

    def _generate_assessment_summary(self, recommendations: List[TrackRecommendation]) -> str:
        """
        Generate a summary of the assessment.

        Args:
            recommendations: List of track recommendations

        Returns:
            Assessment summary text
        """
        primary = recommendations[0]

        summary = f"Based on your responses, you are best suited for the {primary.track_name} track "
        summary += f"with a strong fit score of {primary.score}%. "

        if len(recommendations) > 1:
            secondary = recommendations[1]
            summary += f"You also show potential in {secondary.track_name} "
            summary += f"with a score of {secondary.score}%. "

        summary += "This assessment considers your technical aptitude, problem-solving style, "
        summary += "scenario preferences, and work style preferences."

        return summary

    def get_progress(self, session: ProfilingSession) -> ProfilingProgress:
        """
        Get current progress in a profiling session.

        Args:
            session: Current profiling session

        Returns:
            ProfilingProgress: Progress information
        """
        total_questions = len(self.questions)
        answered_questions = len(session.responses)
        current_question = answered_questions + 1

        if answered_questions >= total_questions:
            progress_percentage = 100.0
            estimated_time_remaining = 0
        else:
            progress_percentage = (answered_questions / total_questions) * 100
            # Estimate 2 minutes per remaining question
            estimated_time_remaining = (total_questions - answered_questions) * 120

        return ProfilingProgress(
            session_id=session.id,
            current_question=min(current_question, total_questions),
            total_questions=total_questions,
            progress_percentage=round(progress_percentage, 1),
            estimated_time_remaining=estimated_time_remaining
        )


# Global service instance
profiling_service = ProfilingService()


