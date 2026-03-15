from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserRole(str, PyEnum):
    ADMIN = "admin"
    USER = "user"


class BorrowStatus(str, PyEnum):
    BORROWED = "borrowed"
    RETURNED = "returned"
    OVERDUE = "overdue"


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(ORMModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: Optional[str] = None


class BookBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    isbn: str = Field(min_length=10, max_length=20)
    total_copies: int = Field(ge=1)


class BookCreate(BookBase):
    available_copies: Optional[int] = Field(default=None, ge=0)


class BookUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    author: Optional[str] = Field(default=None, min_length=1, max_length=255)
    isbn: Optional[str] = Field(default=None, min_length=10, max_length=20)
    total_copies: Optional[int] = Field(default=None, ge=1)
    available_copies: Optional[int] = Field(default=None, ge=0)


class BookRead(ORMModel):
    id: int
    title: str
    author: str
    isbn: str
    total_copies: int
    available_copies: int
    created_at: datetime


class BorrowRequest(BaseModel):
    book_id: int = Field(gt=0)
    borrow_days: int = Field(default=14, ge=1, le=60)


class BorrowRecordRead(ORMModel):
    id: int
    user_id: int
    book_id: int
    book_title: str
    book_author: str
    book_isbn: str
    borrower_name: Optional[str] = None
    borrower_email: Optional[EmailStr] = None
    borrow_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    status: BorrowStatus
    fine_amount: float
    is_overdue: bool
    days_remaining: int
    days_overdue: int


class BorrowReturnRead(ORMModel):
    id: int
    status: BorrowStatus
    return_date: Optional[datetime] = None
    fine_amount: float

class FinePreview(ORMModel):
    id: int
    book_id: int
    book_title: str
    borrow_date: datetime
    due_date: datetime
    status: BorrowStatus
    days_overdue: int
    fine_amount: float


class OverdueSummary(ORMModel):
    total_overdue_books: int
    total_estimated_fine: float
    records: list[BorrowRecordRead]