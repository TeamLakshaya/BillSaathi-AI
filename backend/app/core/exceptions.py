from typing import Any, Optional


class AppException(Exception):
    """Base application exception with standardized code and status."""
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: str = "BAD_REQUEST",
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details=details,
        )


class UnauthorizedError(AppException):
    def __init__(self, message: str = "Invalid credentials or session expired.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="UNAUTHORIZED",
            details=details,
        )


class PermissionDeniedError(AppException):
    def __init__(self, message: str = "Access denied. Insufficient permissions.", details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN",
            details=details,
        )


class FileValidationError(AppException):
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="FILE_VALIDATION_ERROR",
            details=details,
        )


class StorageError(AppException):
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="STORAGE_ERROR",
            details=details,
        )


# Backward compatibility aliases
NotFoundException = NotFoundError
UnauthorizedException = UnauthorizedError
ForbiddenException = PermissionDeniedError
FileProcessingException = FileValidationError
ValidationException = FileValidationError
