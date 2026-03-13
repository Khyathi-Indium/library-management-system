from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import app.crud.crud as crud, app.schemas.schemas as schemas
from app.db.database import get_db
from app.dependencies.dependencies import get_current_admin, get_current_user
from app.db.models import User, UserRole
from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    return crud.create_user(db, user_in, role=UserRole.USER)

@router.post("/admin/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register_admin(
    user_in: schemas.UserRegister,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin)
):
    existing = crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    return crud.create_user(db, user_in, role=UserRole.ADMIN)


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        subject=user.email,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return schemas.Token(access_token=access_token)


@router.get("/me", response_model=schemas.UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user
