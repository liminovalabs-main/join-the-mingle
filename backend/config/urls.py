"""Root URL configuration for Mingler API.

All API endpoints are versioned under /api/v1/.
Swagger and ReDoc documentation available at /api/docs/ and /api/redoc/.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # API v1 Routes
    path('api/v1/auth/', include('apps.users.urls.auth_urls')),
    path('api/v1/profiles/', include('apps.users.urls.profile_urls')),
    path('api/v1/venues/', include('apps.venues.urls')),
    path('api/v1/mingles/', include('apps.mingles.urls')),
    path('api/v1/bookings/', include('apps.bookings.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/interactions/', include('apps.interactions.urls')),
    path('api/v1/admin/', include('apps.administration.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files locally in development mode
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

