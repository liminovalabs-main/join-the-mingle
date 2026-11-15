"""Unit and integration tests for the /health/ endpoint and system monitoring."""
import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestHealthCheckEndpoint:
    """Tests for the /health/ and /api/v1/health/ monitoring endpoints."""

    def test_health_check_root_success(self, api_client: APIClient):
        """Verifies GET /health/ returns 200 OK when database and cache are operational."""
        response = api_client.get('/health/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'mingler-api'
        assert data['components']['database'] == 'healthy'
        assert data['components']['cache'] == 'healthy'
        assert 'timestamp' in data

    def test_health_check_api_v1_alias(self, api_client: APIClient):
        """Verifies GET /api/v1/health/ behaves identically to /health/."""
        response = api_client.get('/api/v1/health/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['components']['database'] == 'healthy'

    def test_health_check_database_failure(self, api_client: APIClient):
        """Verifies GET /health/ returns 503 when the database connection fails."""
        with patch('django.db.connection.ensure_connection', side_effect=Exception('DB connection timeout')):
            response = api_client.get('/health/')
            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            data = response.json()
            assert data['status'] == 'unhealthy'
            assert data['components']['database'] == 'unhealthy'

    def test_health_check_cache_degraded(self, api_client: APIClient):
        """Verifies GET /health/ returns 200 with degraded cache if Redis cache encounters an issue."""
        with patch('django.core.cache.cache.set', side_effect=Exception('Redis connection refused')):
            response = api_client.get('/health/')
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data['status'] == 'healthy'
            assert data['components']['cache'] == 'degraded'
