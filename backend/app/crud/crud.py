from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

import app.db.models as models, app.schemas.schemas as schemas
from app.core.security import hash_password, verify_password

FINE_PER_DAY = 10.0

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def search_avail_books(db: Session, query: Optional[str] = None) -> list[models.Book]:
    if not query:
        return db.query(models.Book).filter(models.Book.available_copies > 0).all()
    return (
        db.query(models.Book)
        .filter(
            models.Book.available_copies > 0,
            (models.Book.title.ilike(f"%{query}%")) | (models.Book.author.ilike(f"%{query}%")),
        ).all()
    )


def create_user(db: Session, user_in: schemas.UserRegister, role: models.UserRole) -> models.User:
    user = models.User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role=role.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    print(user)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def create_book(db: Session, book_in: schemas.BookCreate):
    available = (
        book_in.available_copies
        if book_in.available_copies is not None
        else book_in.total_copies
    )
    if available > book_in.total_copies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="available_copies cannot be greater than total_copies",
        )

    book = models.Book(
        title=book_in.title,
        author=book_in.author,
        isbn=book_in.isbn,
        total_copies=book_in.total_copies,
        available_copies=available,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def get_book(db: Session, book_id: int):
    return db.query(models.Book).filter(models.Book.id == book_id).first()


def get_books(db: Session) -> list[models.Book]:
    return db.query(models.Book).all()


def update_book(db: Session, book: models.Book, book_in: schemas.BookUpdate) -> models.Book:
    update_data = book_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)

    if book.available_copies > book.total_copies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="available_copies cannot be greater than total_copies",
        )

    db.commit()
    db.refresh(book)
    return book


def delete_book(db: Session, book: models.Book):
    db.delete(book)
    db.commit()


def mark_overdue_records(db: Session):
    now = datetime.now(timezone.utc)
    records = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.status == models.BorrowStatus.BORROWED.value,
        models.BorrowRecord.due_date < now,
    )
    for record in records:
        record.status = models.BorrowStatus.OVERDUE.value
    db.commit()


def borrow_book(db: Session, user: models.User, borrow_in: schemas.BorrowRequest):
    mark_overdue_records(db)

    book = get_book(db, borrow_in.book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    if book.available_copies < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book is currently unavailable",
        )

    active_record = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.user_id == user.id,
        models.BorrowRecord.book_id == book.id,
        models.BorrowRecord.status.in_(
            [models.BorrowStatus.BORROWED.value, models.BorrowStatus.OVERDUE.value]
        ),
    ).first()
    if active_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have this book borrowed",
        )

    now = datetime.now(timezone.utc)
    due_date = now + timedelta(days=borrow_in.borrow_days)

    record = models.BorrowRecord(
        user_id=user.id,
        book_id=book.id,
        borrow_date=now,
        due_date=due_date,
        status=models.BorrowStatus.BORROWED.value,
        fine_amount=0.0,
    )
    book.available_copies -= 1
    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize_borrow_record(record)


def _calculate_fine(due_date: datetime, return_date: datetime):
    if return_date <= due_date:
        return 0.0
    overdue_days = (return_date - due_date).days
    if (return_date - due_date).seconds > 0:
        overdue_days += 1
    return overdue_days * FINE_PER_DAY


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _days_ceil(delta: timedelta) -> int:
    seconds = delta.total_seconds()
    if seconds <= 0:
        return 0
    return int((seconds + 86399) // 86400)


def _serialize_borrow_record(record: models.BorrowRecord, include_live_fine: bool = True):
    now = datetime.now(timezone.utc)
    borrow_date = _as_utc(record.borrow_date)
    due_date = _as_utc(record.due_date)
    return_date = _as_utc(record.return_date) if record.return_date else None

    if record.status == models.BorrowStatus.RETURNED.value:
        is_overdue = False
        days_remaining = 0
        days_overdue = _days_ceil(return_date - due_date) if return_date else 0
        fine_amount = record.fine_amount
    else:
        is_overdue = now > due_date
        days_remaining = 0 if is_overdue else _days_ceil(due_date - now)
        days_overdue = _days_ceil(now - due_date) if is_overdue else 0
        fine_amount = _calculate_fine(due_date, now) if include_live_fine else record.fine_amount

    book_title = record.book.title if record.book else "Unknown"
    book_author = record.book.author if record.book else "Unknown"
    book_isbn = record.book.isbn if record.book else "Unknown"

    return {
        "id": record.id,
        "user_id": record.user_id,
        "book_id": record.book_id,
        "book_title": book_title,
        "book_author": book_author,
        "book_isbn": book_isbn,
        "borrow_date": borrow_date,
        "due_date": due_date,
        "return_date": return_date,
        "status": record.status,
        "fine_amount": fine_amount,
        "is_overdue": is_overdue,
        "days_remaining": days_remaining,
        "days_overdue": days_overdue,
    }


def return_book(db: Session, user: models.User, record_id: int):
    mark_overdue_records(db)

    record = db.query(models.BorrowRecord).filter(models.BorrowRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow record not found",
        )

    if record.user_id != user.id and user.role != models.UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to return this record",
        )

    if record.status == models.BorrowStatus.RETURNED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book already returned",
        )

    book = get_book(db, record.book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    now = datetime.now(timezone.utc)
    record.return_date = now
    record.status = models.BorrowStatus.RETURNED.value
    record.fine_amount = _calculate_fine(record.due_date, now)

    if book.available_copies < book.total_copies:
        book.available_copies += 1

    db.commit()
    db.refresh(record)
    return {
        "id": record.id,
        "status": record.status,
        "return_date": record.return_date,
        "fine_amount": record.fine_amount,
    }


def get_my_records(db: Session, user: models.User):
    mark_overdue_records(db)
    records = (
        db.query(models.BorrowRecord)
        .options(selectinload(models.BorrowRecord.book))
        .filter(models.BorrowRecord.user_id == user.id)
        .all()
    )
    return [_serialize_borrow_record(record) for record in records]

def get_my_overdue_records(db: Session, user: models.User):
    mark_overdue_records(db)
    records = (
        db.query(models.BorrowRecord)
        .options(selectinload(models.BorrowRecord.book))
        .filter(
            models.BorrowRecord.user_id == user.id,
            models.BorrowRecord.status == models.BorrowStatus.OVERDUE.value,
        )
        .all()
    )
    return [_serialize_borrow_record(record) for record in records]

def get_my_active_records(db: Session, user: models.User):
    mark_overdue_records(db)
    records = (
        db.query(models.BorrowRecord)
        .options(selectinload(models.BorrowRecord.book))
        .filter(
            models.BorrowRecord.user_id == user.id,
            models.BorrowRecord.status.in_(
                [models.BorrowStatus.BORROWED.value, models.BorrowStatus.OVERDUE.value]
            ),
        )
        .all()
    )
    return [_serialize_borrow_record(record) for record in records]


def get_my_active_records_with_books(db: Session, user: models.User):
    return get_my_active_records(db, user)

def preview_fine(db: Session, user: models.User, record_id: int):
    mark_overdue_records(db)

    record = db.query(models.BorrowRecord).filter(models.BorrowRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrow record not found",
        )

    if record.user_id != user.id and user.role != models.UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to preview this record",
        )

    book = get_book(db, record.book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    due_date = _as_utc(record.due_date)
    borrow_date = _as_utc(record.borrow_date)
    now = datetime.now(timezone.utc)

    if record.status == models.BorrowStatus.RETURNED.value:
        reference_time = _as_utc(record.return_date) if record.return_date else now
        fine = record.fine_amount
    else:
        reference_time = now
        fine = _calculate_fine(due_date, now)

    days_overdue = _days_ceil(reference_time - due_date) if reference_time > due_date else 0

    return {
        "id": record.id,
        "book_id": record.book_id,
        "book_title": book.title,
        "borrow_date": borrow_date,
        "due_date": due_date,
        "status": record.status,
        "days_overdue": days_overdue,
        "fine_amount": fine,
    }

def overdue_summary(db: Session, user: models.User):
    mark_overdue_records(db)
    records = (
        db.query(models.BorrowRecord)
        .options(selectinload(models.BorrowRecord.book))
        .filter(
            models.BorrowRecord.user_id == user.id,
            models.BorrowRecord.status == models.BorrowStatus.OVERDUE.value,
        )
        .all()
    )
    serialized_records = [_serialize_borrow_record(record) for record in records]

    return {
        "total_overdue_books": len(serialized_records),
        "total_estimated_fine": sum(record["fine_amount"] for record in serialized_records),
        "records": serialized_records,
    }

