from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.database import User
from .. import auth
from pydantic import BaseModel

router = APIRouter()

# Pydantic models for request/response validation
class ItemBase(BaseModel):
    item_name: str
    item_description: Optional[str] = None
    price: Optional[float] = None

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    item_id: int
    user_id: int
    added_date: datetime

    class Config:
        orm_mode = True

# Helper function to get current user
async def get_current_user(token: str = Depends(auth.oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Wishlist endpoints
@router.post("/wishlist/", response_model=Item)
async def create_wishlist_item(
    item: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.query("wishlist").insert().values(
        user_id=current_user.user_id,
        item_name=item.item_name,
        item_description=item.item_description,
        price=item.price
    ).returning("*")
    db.commit()
    return db_item.first()

@router.get("/wishlist/", response_model=List[Item])
async def get_wishlist_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.execute(
        "SELECT * FROM wishlist WHERE user_id = :user_id ORDER BY added_date DESC",
        {"user_id": current_user.user_id}
    ).fetchall()
    return items

@router.delete("/wishlist/{item_id}")
async def delete_wishlist_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.execute(
        """DELETE FROM wishlist 
        WHERE wishlist_id = :item_id AND user_id = :user_id
        RETURNING wishlist_id""",
        {"item_id": item_id, "user_id": current_user.user_id}
    )
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Item not found or not authorized to delete"
        )
    return {"message": "Item deleted successfully"}

# Closet endpoints
@router.post("/closet/", response_model=Item)
async def create_closet_item(
    item: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_item = db.execute(
        """INSERT INTO closet (user_id, item_name, item_description, price)
        VALUES (:user_id, :item_name, :item_description, :price)
        RETURNING *""",
        {
            "user_id": current_user.user_id,
            "item_name": item.item_name,
            "item_description": item.item_description,
            "price": item.price
        }
    )
    db.commit()
    return db_item.first()

@router.get("/closet/", response_model=List[Item])
async def get_closet_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.execute(
        "SELECT * FROM closet WHERE user_id = :user_id ORDER BY added_date DESC",
        {"user_id": current_user.user_id}
    ).fetchall()
    return items

@router.delete("/closet/{item_id}")
async def delete_closet_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.execute(
        """DELETE FROM closet 
        WHERE closet_id = :item_id AND user_id = :user_id
        RETURNING closet_id""",
        {"item_id": item_id, "user_id": current_user.user_id}
    )
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Item not found or not authorized to delete"
        )
    return {"message": "Item deleted successfully"} 