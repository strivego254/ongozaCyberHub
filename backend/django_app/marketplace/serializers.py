from rest_framework import serializers

from .models import Employer, MarketplaceProfile, EmployerInterestLog, JobPosting


class EmployerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employer
        fields = [
            'id',
            'company_name',
            'website',
            'sector',
            'country',
            'logo_url',
            'description',
        ]


class MarketplaceProfileListSerializer(serializers.ModelSerializer):
    mentee_id = serializers.SerializerMethodField()
    mentee_name = serializers.SerializerMethodField()
    mentee_country = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceProfile
        fields = [
            'id',
            'mentee_id',
            'mentee_name',
            'mentee_country',
            'tier',
            'readiness_score',
            'job_fit_score',
            'hiring_timeline_days',
            'profile_status',
            'primary_role',
            'primary_track_key',
            'skills',
            'portfolio_depth',
        ]

    def get_mentee_id(self, obj):
        return str(obj.mentee.id)

    def get_mentee_name(self, obj):
        try:
            return obj.mentee.get_full_name() or obj.mentee.email
        except Exception:
            return obj.mentee.email

    def get_mentee_country(self, obj):
        # Optional country field on user profile
        return getattr(obj.mentee, 'country', None)


class MarketplaceProfileDetailSerializer(MarketplaceProfileListSerializer):
    class Meta(MarketplaceProfileListSerializer.Meta):
        fields = MarketplaceProfileListSerializer.Meta.fields + [
            'is_visible',
            'employer_share_consent',
            'last_updated_at',
        ]


class JobPostingSerializer(serializers.ModelSerializer):
    employer = EmployerSerializer(read_only=True)
    employer_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = JobPosting
        fields = [
            'id',
            'employer',
            'employer_id',
            'title',
            'location',
            'job_type',
            'description',
            'required_skills',
            'salary_min',
            'salary_max',
            'salary_currency',
            'is_active',
            'posted_at',
            'application_deadline',
        ]
        read_only_fields = ['id', 'employer', 'posted_at']

    def create(self, validated_data):
        employer_id = validated_data.pop('employer_id', None)
        request = self.context.get('request')

        if employer_id:
            try:
                employer = Employer.objects.get(id=employer_id)
            except Employer.DoesNotExist:
                raise serializers.ValidationError({'employer_id': 'Employer not found'})
        else:
            # Default to employer profile for current user
            # Use the same helper function as views
            from .utils import get_employer_for_user
            employer = get_employer_for_user(request.user)
            if not employer:
                raise serializers.ValidationError(
                    {'detail': 'Employer profile not found. Please create an employer profile first.'}
                )

        return JobPosting.objects.create(employer=employer, **validated_data)


class EmployerInterestLogSerializer(serializers.ModelSerializer):
    employer = EmployerSerializer(read_only=True)
    profile = MarketplaceProfileListSerializer(read_only=True)

    class Meta:
        model = EmployerInterestLog
        fields = [
            'id',
            'employer',
            'profile',
            'action',
            'metadata',
            'created_at',
        ]


