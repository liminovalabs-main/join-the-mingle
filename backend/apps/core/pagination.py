"""Custom pagination classes for the Mingler API."""
from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    """Standard cursor-based pagination for list endpoints.

    Returns 20 results per page by default, with a maximum
    of 100 results per page when overridden via query parameter.
    """

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
