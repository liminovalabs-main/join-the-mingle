"""Filters for the Mingles catalog."""
from django.utils import timezone
import django_filters
from apps.mingles.models import Mingle


class MingleFilter(django_filters.FilterSet):
    """FilterSet for the Mingle experience catalog."""

    experience_type = django_filters.CharFilter(field_name='experience_type', lookup_expr='iexact')
    area = django_filters.CharFilter(field_name='venue__area', lookup_expr='iexact')
    date_from = django_filters.DateFilter(field_name='event_date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='event_date', lookup_expr='lte')
    price_max = django_filters.NumberFilter(field_name='ticket_price', lookup_expr='lte')
    upcoming_only = django_filters.BooleanFilter(method='filter_upcoming_only')

    class Meta:
        model = Mingle
        fields = ['experience_type', 'area', 'date_from', 'date_to', 'price_max']

    def filter_upcoming_only(self, queryset, name, value):
        if value:
            return queryset.filter(event_date__gte=timezone.now().date())
        return queryset
