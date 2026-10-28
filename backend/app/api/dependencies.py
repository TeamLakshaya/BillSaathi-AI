from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

security_scheme = HTTPBearer(auto_error=False)


def get_session_id(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
) -> Optional[str]:
    """Retrieves client session identifier from X-Session-ID header for guest sessions."""
    if x_session_id:
        cleaned = x_session_id.strip()
        if 4 <= len(cleaned) <= 64:
            return cleaned
    return None



def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Returns authenticated user if a valid bearer token is provided,
    otherwise returns None (allowing public demo mode sessions).
    """
    if not auth:
        return None
    token = auth.credentials
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    user_repo = UserRepository(db)
    return user_repo.get_by_id(user_id)


def get_current_user(
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Enforces authentication; raises 401 Unauthorized if missing."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required for this action.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Enforces administrator privileges."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges are required for this action.",
        )
    return current_user
