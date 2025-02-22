from pydantic import BaseModel, validator
from typing import List, Optional, Union
from datetime import date, datetime

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

class UserSizes(BaseModel):
    shirt: Optional[str] = None
    pants: Optional[str] = None
    shoes: Optional[str] = None

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[Union[date, str]] = None
    style_preferences: Optional[List[str]] = None
    favorite_brands: Optional[List[str]] = None
    preferred_colors: Optional[List[str]] = None
    usual_sizes: Optional[UserSizes] = None

    @validator('birth_date', pre=True)
    def parse_birth_date(cls, value):
        if value is None:
            return None
        if isinstance(value, date):
            return value
        try:
            # Try to parse date in YYYY-MM-DD format
            return datetime.strptime(value, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return None

class UserProfile(UserProfileUpdate):
    email: str
    username: str
    created_at: datetime
    
    class Config:
        orm_mode = True 