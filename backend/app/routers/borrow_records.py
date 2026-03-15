from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
import app.crud.crud as crud, app.schemas.schemas as schemas
from app.db.database import get_db
from app.dependencies.dependencies import get_current_admin, get_current_user
from app.db.models import User

router = APIRouter(prefix="/api/v1/borrow-records", tags=["borrow-records"])


@router.post("/borrow", response_model=schemas.BorrowRecordRead, status_code=status.HTTP_201_CREATED)
def borrow_book(
    borrow_in: schemas.BorrowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.borrow_book(db, current_user, borrow_in)


@router.post("/{record_id}/return", response_model=schemas.BorrowReturnRead)
def return_book(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.return_book(db, current_user, record_id)


@router.get("/me", response_model=list[schemas.BorrowRecordRead])
def my_borrow_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.get_my_records(db, current_user)

@router.get("/me/overdue", response_model=list[schemas.BorrowRecordRead])
def my_overdue_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.get_my_overdue_records(db, current_user)

@router.get("/me/active", response_model=list[schemas.BorrowRecordRead])
def my_active_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.get_my_active_records(db, current_user)


@router.get("/me/active-with-books", response_model=list[schemas.BorrowRecordRead])
def my_active_records_with_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.get_my_active_records_with_books(db, current_user)


@router.get("/admin/active", response_model=list[schemas.BorrowRecordRead])
def admin_active_records(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return crud.get_admin_active_records(db)


@router.get("/admin/overdue", response_model=list[schemas.BorrowRecordRead])
def admin_overdue_records(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return crud.get_admin_overdue_records(db)

@router.get("/me/{record_id}/preview-fine", response_model=schemas.FinePreview)
def preview_fine(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.preview_fine(db, current_user, record_id)

@router.get("/me/overdue-summary", response_model=schemas.OverdueSummary)
def overdue_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.overdue_summary(db, current_user)
