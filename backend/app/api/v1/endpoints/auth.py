from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse
from app.schemas.common import ApiResponse

router = APIRouter()


@router.post("/register", response_model=ApiResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    if repo.get_by_email(data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    pwd_hash = get_password_hash(data.password)
    user = repo.create(
        name=data.name,
        email=data.email,
        password_hash=pwd_hash,
        is_admin=False,
    )

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return ApiResponse(
        data=TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        ),
        message="Registration successful",
    )


@router.post("/login", response_model=ApiResponse[TokenResponse])
def login(data: UserLogin, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(data.email)
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return ApiResponse(
        data=TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        ),
        message="Login successful",
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        data=UserResponse.model_validate(current_user),
        message="Profile retrieved",
    )
