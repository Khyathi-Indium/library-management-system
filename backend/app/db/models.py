from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.db.database import Base

class UserRole(str, PyEnum):
    ADMIN = "admin"
    USER = "user"

class BorrowStatus(str, PyEnum):
    BORROWED = "borrowed"
    RETURNED = "returned"
    OVERDUE = "overdue"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.USER.value)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    borrow_records = relationship(
        "BorrowRecord", back_populates="user", cascade="all, delete-orphan"
    )

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    isbn = Column(String(20), unique=True, index=True, nullable=False)
    total_copies = Column(Integer, nullable=False, default=1)
    available_copies = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    borrow_records = relationship(
        "BorrowRecord", back_populates="book", cascade="all, delete-orphan"
    )

class BorrowRecord(Base):
    __tablename__ = "borrow_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    borrow_date = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    due_date = Column(DateTime(timezone=True), nullable=False)
    return_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default=BorrowStatus.BORROWED.value)
    fine_amount = Column(Float, nullable=False, default=0.0)

    user = relationship("User", back_populates="borrow_records")
    book = relationship("Book", back_populates="borrow_records")
