"""Custom exception handler for consistent API error responses."""
import logging

from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Wrap DRF default exceptions in a consistent envelope.

    Response format:
        {
            "success": false,
            "error": {
                "code": "<error_code>",
                "message": "<human_readable_message>",
                "details": { ... }  // optional field-level errors
            }
        }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            'success': False,
            'error': {
                'code': exc.__class__.__name__,
                'message': str(exc.detail) if hasattr(exc, 'detail') else str(exc),
                'details': response.data if isinstance(response.data, dict) else None,
            },
        }
        response.data = error_payload
    else:
        logger.exception('Unhandled exception in %s', context.get('view'))

    return response
