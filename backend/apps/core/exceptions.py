"""Custom exception handler for consistent API error responses."""
import logging

from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def _format_detail_message(detail):
    """Recursively unpack DRF ErrorDetail, list, or dict into a human-readable string."""
    if isinstance(detail, (list, tuple)):
        if detail:
            return _format_detail_message(detail[0])
        return "An error occurred."
    elif isinstance(detail, dict):
        if 'non_field_errors' in detail:
            return _format_detail_message(detail['non_field_errors'])
        if 'detail' in detail:
            return _format_detail_message(detail['detail'])
        # Field-level errors: pick first field
        for field, errors in detail.items():
            err_msg = _format_detail_message(errors)
            if field in ('non_field_errors', 'detail'):
                return err_msg
            field_name = field.replace('_', ' ').capitalize()
            return f"{field_name}: {err_msg}"
        return "An error occurred."
    return str(detail)


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
        message = (
            _format_detail_message(exc.detail)
            if hasattr(exc, 'detail')
            else str(exc)
        )
        error_payload = {
            'success': False,
            'error': {
                'code': exc.__class__.__name__,
                'message': message,
                'details': response.data if isinstance(response.data, dict) else None,
            },
        }
        response.data = error_payload
    else:
        logger.exception('Unhandled exception in %s', context.get('view'))

    return response
