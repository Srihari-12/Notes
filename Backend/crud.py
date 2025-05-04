from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from model import Notes
from schema import NotesCreate, NotesUpdate, NotesResponse
from typing import List

router = APIRouter(tags=["Notes"], prefix="/notes")

@router.post("/", response_model=NotesResponse)
def create_notes(notes: NotesCreate, db: Session = Depends(get_db)):
    db_notes = Notes(**notes.dict())
    db.add(db_notes)
    db.commit()
    db.refresh(db_notes)
    return db_notes

@router.get("/", response_model=List[NotesResponse])
def get_notes(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(Notes).offset(skip).limit(limit).all()

@router.get("/{notes_id}", response_model=NotesResponse)
def get_notes_by_id(notes_id: int, db: Session = Depends(get_db)):
    notes = db.query(Notes).filter(Notes.id == notes_id).first()
    if not notes:
        raise HTTPException(status_code=404, detail="Notes not found")
    return notes

@router.put("/{notes_id}", response_model=NotesResponse)
def update_notes(notes_id: int, notes: NotesUpdate, db: Session = Depends(get_db)):
    db_notes = db.query(Notes).filter(Notes.id == notes_id).first()
    if not db_notes:
        raise HTTPException(status_code=404, detail="Notes not found")
    for key, value in notes.dict(exclude_unset=True).items():
        setattr(db_notes, key, value)
    db.commit()
    db.refresh(db_notes)
    return db_notes

@router.delete("/{notes_id}", response_model=NotesResponse)
def delete_notes(notes_id: int, db: Session = Depends(get_db)):
    db_notes = db.query(Notes).filter(Notes.id == notes_id).first()
    if not db_notes:
        raise HTTPException(status_code=404, detail="Notes not found")
    db.delete(db_notes)
    db.commit()
    return db_notes

@router.get("/search/", response_model=List[NotesResponse])
def search_notes(query: str, db: Session = Depends(get_db)):
    return db.query(Notes).filter(Notes.title.contains(query) | Notes.content.contains(query)).all()


@router.get("/recent/", response_model=List[NotesResponse])
def get_recent_notes(limit: int = 5, db: Session = Depends(get_db)):
    return db.query(Notes).order_by(Notes.id.desc()).limit(limit).all()