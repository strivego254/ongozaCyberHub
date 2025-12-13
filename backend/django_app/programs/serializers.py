"""
Serializers for Programs app.
"""
from rest_framework import serializers
from .models import (
    Program, Track, Milestone, Module, Specialization, Cohort, Enrollment,
    CalendarEvent, MentorAssignment, ProgramRule, Certificate, Waitlist
)


# Define serializers in dependency order: Module -> Milestone -> Track -> Program

class ModuleSerializer(serializers.ModelSerializer):
    milestone_name = serializers.CharField(source='milestone.name', read_only=True)
    applicable_track_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Module
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_applicable_track_names(self, obj):
        return [track.name for track in obj.applicable_tracks.all()]


class MilestoneSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source='track.name', read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Milestone
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TrackSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    
    class Meta:
        model = Track
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProgramSerializer(serializers.ModelSerializer):
    tracks = TrackSerializer(many=True, read_only=True)
    tracks_count = serializers.SerializerMethodField()
    categories = serializers.ListField(
        child=serializers.ChoiceField(choices=Program.PROGRAM_CATEGORY_CHOICES),
        required=False,
        allow_empty=True,
        help_text='List of categories'
    )
    category = serializers.ChoiceField(
        choices=Program.PROGRAM_CATEGORY_CHOICES,
        required=False,
        help_text='Primary category (auto-set from categories if not provided)'
    )
    
    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Ensure either category or categories is provided."""
        categories = data.get('categories', [])
        category = data.get('category')
        
        # If categories provided but no category, set category from first
        if categories and not category:
            data['category'] = categories[0]
        # If category provided but no categories, set categories from category
        elif category and not categories:
            data['categories'] = [category]
        # If neither provided, use default
        elif not category and not categories:
            data['category'] = 'technical'
            data['categories'] = ['technical']
        
        return data
    
    def get_tracks_count(self, obj):
        return obj.tracks.count()
    
    def create(self, validated_data):
        """Handle categories array and ensure backward compatibility with category field."""
        categories = validated_data.pop('categories', None)
        category = validated_data.get('category')
        
        # If categories provided, use first as primary category for backward compatibility
        if categories:
            validated_data['category'] = categories[0]
            program = super().create(validated_data)
            program.categories = categories
            program.save()
        # If only category provided (backward compatibility), populate categories array
        elif category:
            program = super().create(validated_data)
            program.categories = [category]
            program.save()
        else:
            # Default to empty categories if neither provided
            program = super().create(validated_data)
            program.categories = []
            program.save()
        return program
    
    def update(self, instance, validated_data):
        """Handle categories array and ensure backward compatibility with category field."""
        categories = validated_data.pop('categories', None)
        category = validated_data.get('category', None)
        
        # If categories provided, use first as primary category for backward compatibility
        if categories is not None:
            if categories:
                validated_data['category'] = categories[0]
                instance.categories = categories
            else:
                # If empty array, keep existing category but clear categories
                instance.categories = []
        # If only category provided (backward compatibility), update categories array
        elif category and category != instance.category:
            instance.categories = [category]
        
        program = super().update(instance, validated_data)
        return program


class ProgramDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with nested tracks, milestones, and modules."""
    tracks = TrackSerializer(many=True, read_only=True)
    categories = serializers.ListField(
        child=serializers.ChoiceField(choices=Program.PROGRAM_CATEGORY_CHOICES),
        required=False,
        allow_empty=True,
        help_text='List of categories'
    )
    category = serializers.ChoiceField(
        choices=Program.PROGRAM_CATEGORY_CHOICES,
        required=False,
        help_text='Primary category (auto-set from categories if not provided)'
    )
    
    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Ensure either category or categories is provided."""
        categories = data.get('categories', [])
        category = data.get('category')
        
        # If categories provided but no category, set category from first
        if categories and not category:
            data['category'] = categories[0]
        # If category provided but no categories, set categories from category
        elif category and not categories:
            data['categories'] = [category]
        # If neither provided, use default
        elif not category and not categories:
            data['category'] = 'technical'
            data['categories'] = ['technical']
        
        return data
    
    def create(self, validated_data):
        """Handle categories array and ensure backward compatibility with category field."""
        categories = validated_data.pop('categories', None)
        category = validated_data.get('category')
        
        # If categories provided, use first as primary category for backward compatibility
        if categories:
            validated_data['category'] = categories[0]
            program = super().create(validated_data)
            program.categories = categories
            program.save()
        # If only category provided (backward compatibility), populate categories array
        elif category:
            program = super().create(validated_data)
            program.categories = [category]
            program.save()
        else:
            # Default to empty categories if neither provided
            program = super().create(validated_data)
            program.categories = []
            program.save()
        return program
    
    def update(self, instance, validated_data):
        """Handle categories array and ensure backward compatibility with category field."""
        categories = validated_data.pop('categories', None)
        category = validated_data.get('category', None)
        
        # If categories provided, use first as primary category for backward compatibility
        if categories is not None:
            if categories:
                validated_data['category'] = categories[0]
                instance.categories = categories
            else:
                # If empty array, keep existing category but clear categories
                instance.categories = []
        # If only category provided (backward compatibility), update categories array
        elif category and category != instance.category:
            instance.categories = [category]
        
        program = super().update(instance, validated_data)
        return program


class SpecializationSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source='track.name', read_only=True)
    
    class Meta:
        model = Specialization
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CohortSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source='track.name', read_only=True)
    seat_utilization = serializers.FloatField(read_only=True)
    completion_rate = serializers.FloatField(read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cohort
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_enrolled_count(self, obj):
        return obj.enrollments.filter(status='active').count()


class EnrollmentSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['id', 'joined_at']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class CalendarEventSerializer(serializers.ModelSerializer):
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = CalendarEvent
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class MentorAssignmentSerializer(serializers.ModelSerializer):
    mentor_email = serializers.CharField(source='mentor.email', read_only=True)
    mentor_name = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = MentorAssignment
        fields = '__all__'
        read_only_fields = ['id', 'assigned_at']
    
    def get_mentor_name(self, obj):
        return obj.mentor.get_full_name() or obj.mentor.email


class ProgramRuleSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    class Meta:
        model = ProgramRule
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CertificateSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='enrollment.user.email', read_only=True)
    cohort_name = serializers.CharField(source='enrollment.cohort.name', read_only=True)
    
    class Meta:
        model = Certificate
        fields = '__all__'
        read_only_fields = ['id', 'issued_at']


class WaitlistSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source='cohort.name', read_only=True)
    
    class Meta:
        model = Waitlist
        fields = '__all__'
        read_only_fields = ['id', 'added_at', 'position']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class CohortDashboardSerializer(serializers.Serializer):
    """Serializer for cohort dashboard data."""
    cohort_id = serializers.UUIDField()
    cohort_name = serializers.CharField()
    track_name = serializers.CharField()
    enrollments_count = serializers.IntegerField()
    seat_utilization = serializers.FloatField()
    mentor_assignments_count = serializers.IntegerField()
    readiness_delta = serializers.FloatField()
    completion_percentage = serializers.FloatField()
    payments_complete = serializers.IntegerField()
    payments_pending = serializers.IntegerField()

