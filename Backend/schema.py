from pydantic import BaseModel
from typing import Optional

class NotesBase(BaseModel):
    title: str
    content: str

class NotesCreate(NotesBase):
    pass

class NotesUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NotesResponse(BaseModel):
    id: int
    title: str
    content: str
from pydantic import BaseModel
from datetime import datetime

class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime  
    updated_at: datetime 


    class Config:
        orm_mode = True
