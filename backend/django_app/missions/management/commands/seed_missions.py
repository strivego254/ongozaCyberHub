"""
Django management command to seed missions.
"""
from django.core.management.base import BaseCommand
from missions.models import Mission


class Command(BaseCommand):
    help = 'Seed missions'

    def handle(self, *args, **options):
        missions = [
            {
                'title': 'Build SIEM Dashboard',
                'description': 'Create a Security Information and Event Management dashboard using Splunk or ELK',
                'difficulty': 'intermediate',
                'est_hours': 4,
                'competencies': ['siem', 'splunk', 'elk', 'log_analysis'],
            },
            {
                'title': 'DNS Sinkhole with pfSense',
                'description': 'Configure a DNS sinkhole to block malicious domains using pfSense',
                'difficulty': 'beginner',
                'est_hours': 2,
                'competencies': ['networking', 'security', 'pfSense', 'dns'],
            },
            {
                'title': 'Incident Response Playbook',
                'description': 'Develop a comprehensive incident response playbook for a ransomware attack',
                'difficulty': 'advanced',
                'est_hours': 8,
                'competencies': ['incident_response', 'dfir', 'documentation'],
            },
            {
                'title': 'Python Security Scanner',
                'description': 'Build a Python script to scan for common security vulnerabilities',
                'difficulty': 'intermediate',
                'est_hours': 6,
                'competencies': ['python', 'security', 'automation'],
            },
        ]
        
        for mission_data in missions:
            mission, created = Mission.objects.update_or_create(
                title=mission_data['title'],
                defaults=mission_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created mission: {mission.title}'))
            else:
                self.stdout.write(self.style.WARNING(f'Updated mission: {mission.title}'))

