from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.execute(select(User).where(User.email == email.lower().strip())).scalar_one_or_none()

    def create(self, name: str, email: str, password_hash: Optional[str] = None, is_admin: bool = False) -> User:
        user = User(
            name=name.strip(),
            email=email.lower().strip(),
            password_hash=password_hash,
            is_admin=is_admin,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_all(self, skip: int = 0, limit: int = 50) -> List[User]:
        return list(self.db.execute(select(User).offset(skip).limit(limit)).scalars().all())
