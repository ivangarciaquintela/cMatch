from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ProductSearch(BaseModel):
    query: str
    brand: Optional[str] = None
    page: Optional[int] = 1
    per_page: Optional[int] = 10

class VisualSearch(BaseModel):
    image_url: str
    page: Optional[int] = 1
    per_page: Optional[int] = 10 