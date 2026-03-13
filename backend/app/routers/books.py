from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import app.crud.crud as crud, app.schemas.schemas as schemas
from app.db.database import get_db
from app.dependencies.dependencies import get_current_admin, get_current_user
from app.db.models import User

router = APIRouter(prefix="/api/v1/books", tags=["books"])


@router.get("/", response_model=list[schemas.BookRead])
def list_books(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return crud.get_books(db)

@router.get("/search_avail_books", response_model=list[schemas.BookRead])
def search_for_available_books(
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return crud.search_avail_books(db, query)
     

@router.get("/{book_id}", response_model=schemas.BookRead)
def get_book(
    book_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book


@router.post("/", response_model=schemas.BookRead, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: schemas.BookCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return crud.create_book(db, book_in)


@router.put("/{book_id}", response_model=schemas.BookRead)
def update_book(
    book_id: int,
    book_in: schemas.BookUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return crud.update_book(db, book, book_in)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    crud.delete_book(db, book)
    return None

