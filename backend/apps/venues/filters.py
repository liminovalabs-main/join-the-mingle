"""Filters for the Venues domain."""
import django_filters
from apps.venues.models import Venue


class VenueFilter(django_filters.FilterSet):
    """FilterSet for the Venue directory."""

    area = django_filters.CharFilter(field_name='area', lookup_expr='iexact')
    category = django_filters.CharFilter(field_name='category', lookup_expr='iexact')
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Venue
        fields = ['area', 'category']

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            django_filters.Q(name__icontains=value)
            | django_filters.Q(area__icontains=value)
            | django_filters.Q(postcode__icontains=value)
        )
