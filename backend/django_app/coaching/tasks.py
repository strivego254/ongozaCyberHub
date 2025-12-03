"""
Background tasks for Coaching OS.
"""
import os
import logging
from .models import Reflection

logger = logging.getLogger(__name__)

try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator


@shared_task(name='coaching.analyze_reflection_sentiment')
def analyze_reflection_sentiment_task(reflection_id: str):
    """
    Analyze reflection sentiment using AI.
    """
    try:
        reflection = Reflection.objects.get(id=reflection_id)
        
        openai_key = os.environ.get('OPENAI_API_KEY')
        ai_coach_url = os.environ.get('AI_COACH_API_URL', 'http://localhost:8001/api/v1')
        ai_coach_key = os.environ.get('AI_COACH_API_KEY')
        
        sentiment_score = None
        behavior_tags = []
        
        # Try AI Coach API
        if ai_coach_key and ai_coach_url:
            try:
                import requests
                response = requests.post(
                    f"{ai_coach_url}/coaching/analyze-sentiment",
                    json={'text': reflection.response},
                    headers={'Authorization': f'Bearer {ai_coach_key}'},
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    sentiment_score = data.get('sentiment_score')
                    behavior_tags = data.get('behavior_tags', [])
            except Exception as e:
                logger.error(f"AI Coach API error: {e}")
        
        # Fallback to OpenAI
        if sentiment_score is None and openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                
                prompt = f"""Analyze this reflection text and return JSON with:
- sentiment_score: -0.5 to +0.5 (negative to positive)
- behavior_tags: Array of tags like ["discipline", "growth_mindset", "resilience"]

Text: {reflection.response}
"""
                
                response = client.chat.completions.create(
                    model=os.environ.get('AI_COACH_MODEL', 'gpt-4'),
                    messages=[
                        {'role': 'system', 'content': 'You are a sentiment analyzer. Return only valid JSON.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    temperature=0.3,
                    max_tokens=200
                )
                
                import json
                data = json.loads(response.choices[0].message.content)
                sentiment_score = data.get('sentiment_score', 0)
                behavior_tags = data.get('behavior_tags', [])
            except Exception as e:
                logger.error(f"OpenAI error: {e}")
        
        # Update reflection
        if sentiment_score is not None:
            reflection.sentiment_score = sentiment_score
            reflection.behavior_tags = behavior_tags
            reflection.save()
        
        logger.info(f"Analyzed sentiment for reflection {reflection_id}: {sentiment_score}")
        return {'status': 'success', 'sentiment_score': sentiment_score}
        
    except Reflection.DoesNotExist:
        logger.error(f"Reflection {reflection_id} not found")
        return {'status': 'error', 'message': 'Reflection not found'}
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {e}", exc_info=True)
        return {'status': 'error', 'message': str(e)}

