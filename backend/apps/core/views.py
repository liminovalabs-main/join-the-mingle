"""Core application views for Mingler platform.

Provides system health and liveness checks for container orchestration,
reverse proxy health probes (Caddy), and external uptime monitoring.
"""
import logging
from django.db import connection
from django.core.cache import cache
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiResponse

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """Liveness and readiness probe for Docker, Caddy, and monitoring services.
    
    Verifies:
      1. Web server is running and routing requests.
      2. PostgreSQL database connection is operational.
      3. Redis cache / broker connection is responsive.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        summary="Service Health Check",
        description="Returns system operational status, verifying database and cache connectivity.",
        responses={
            200: OpenApiResponse(description="All systems healthy"),
            503: OpenApiResponse(description="One or more critical services unavailable"),
        },
    )
    def get(self, request):
        checks = {
            "database": "unknown",
            "cache": "unknown",
        }
        healthy = True

        # 1. Database check
        try:
            connection.ensure_connection()
            checks["database"] = "healthy"
        except Exception as exc:
            logger.error("Health check database probe failed: %s", exc)
            checks["database"] = "unhealthy"
            healthy = False

        # 2. Redis Cache check
        try:
            cache_key = "_mingler_health_probe"
            cache.set(cache_key, "1", timeout=5)
            if cache.get(cache_key) == "1":
                checks["cache"] = "healthy"
            else:
                checks["cache"] = "unresponsive"
                healthy = False
        except Exception as exc:
            logger.warning("Health check cache probe error: %s", exc)
            # Cache failure is degraded, but allow reporting
            checks["cache"] = "degraded"

        status_code = status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(
            {
                "status": "healthy" if healthy else "unhealthy",
                "timestamp": timezone.now().isoformat(),
                "service": "mingler-api",
                "components": checks,
            },
            status=status_code,
        )
