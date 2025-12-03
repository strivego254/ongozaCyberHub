"""
Background tasks for Missions MXP.
"""
import os
import logging
from django.utils import timezone
from django.db import transaction
from .models import MissionSubmission, MissionFile
from student_dashboard.services import DashboardAggregationService
from subscriptions.utils import get_user_tier

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator


@shared_task(name='missions.ai_review')
def ai_review_mission_task(submission_id: str):
    """
    AI review of mission submission.
    """
    try:
        submission = MissionSubmission.objects.get(id=submission_id)
        
        if submission.status != 'submitted':
            return {'status': 'skipped', 'message': 'Submission not in submitted status'}
        
        files = MissionFile.objects.filter(submission=submission)
        
        openai_key = os.environ.get('OPENAI_API_KEY')
        ai_coach_url = os.environ.get('AI_COACH_API_URL', 'http://localhost:8001/api/v1')
        ai_coach_key = os.environ.get('AI_COACH_API_KEY')
        
        ai_score = None
        ai_feedback = None
        
        # Try AI Coach API
        if ai_coach_key and ai_coach_url:
            try:
                import requests
                file_data = [{'filename': f.filename, 'url': f.file_url} for f in files]
                response = requests.post(
                    f"{ai_coach_url}/missions/review",
                    json={
                        'mission_id': str(submission.mission.id),
                        'mission_title': submission.mission.title,
                        'notes': submission.notes,
                        'files': file_data
                    },
                    headers={'Authorization': f'Bearer {ai_coach_key}'},
                    timeout=60
                )
                if response.status_code == 200:
                    data = response.json()
                    ai_score = data.get('score')
                    ai_feedback = data.get('feedback')
            except Exception as e:
                logger.error(f"AI Coach API error: {e}")
        
        # Fallback to OpenAI
        if ai_score is None and openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                
                prompt = f"""Review this mission submission and return JSON with:
- score: 0-100 (overall quality score)
- feedback: Detailed feedback text

Mission: {submission.mission.title}
Notes: {submission.notes}
Files: {[f.filename for f in files]}
"""
                
                response = client.chat.completions.create(
                    model=os.environ.get('AI_COACH_MODEL', 'gpt-4'),
                    messages=[
                        {'role': 'system', 'content': 'You are a cybersecurity mission reviewer. Return only valid JSON.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    temperature=0.3,
                    max_tokens=500
                )
                
                import json
                data = json.loads(response.choices[0].message.content)
                ai_score = data.get('score', 75)
                ai_feedback = data.get('feedback', 'Good work!')
            except Exception as e:
                logger.error(f"OpenAI error: {e}")
        
        # Default if AI unavailable
        if ai_score is None:
            ai_score = 75
            ai_feedback = 'Submission received. Review pending.'
        
        # Update submission
        with transaction.atomic():
            submission.ai_score = ai_score
            submission.ai_feedback = ai_feedback
            submission.status = 'ai_reviewed'
            
            # Check if mentor review needed (premium tier)
            user_tier = get_user_tier(submission.user.id)
            if user_tier == 'premium':
                submission.status = 'mentor_review'
            else:
                # Auto-approve for non-premium
                submission.status = 'approved'
                submission.reviewed_at = timezone.now()
            
            submission.save()
        
        # Trigger dashboard refresh
        DashboardAggregationService.queue_update(submission.user, 'mission_reviewed', 'high')
        
        logger.info(f"AI reviewed mission submission {submission_id}: score={ai_score}")
        return {'status': 'success', 'score': ai_score}
        
    except MissionSubmission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found")
        return {'status': 'error', 'message': 'Submission not found'}
    except Exception as e:
        logger.error(f"Error reviewing mission: {e}", exc_info=True)
        return {'status': 'error', 'message': str(e)}



