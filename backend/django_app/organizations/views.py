"""
Organization views for DRF.
"""
from rest_framework import viewsets, permissions
from .models import Organization, OrganizationMember
from .serializers import OrganizationSerializer, OrganizationMemberSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Organization model.
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """
        Filter organizations by user membership.
        """
        user = self.request.user
        return Organization.objects.filter(
            members=user
        ).distinct()
    
    def perform_create(self, serializer):
        """
        Set the owner when creating an organization.
        """
        serializer.save(owner=self.request.user)


class OrganizationMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for OrganizationMember model.
    """
    queryset = OrganizationMember.objects.all()
    serializer_class = OrganizationMemberSerializer
    permission_classes = [permissions.IsAuthenticated]


