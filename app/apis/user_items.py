from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from sqlalchemy import text

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
    print(f"Received item data: {item}")  # Debug log
    
    stmt = text("""
        INSERT INTO wishlist (user_id, item_name, item_description, price)
        VALUES (:user_id, :item_name, :item_description, :price)
        RETURNING wishlist_id as item_id, user_id, item_name, item_description, price, added_date
    """)
    
    try:
        result = db.execute(
            stmt,
            {
                "user_id": current_user.user_id,
                "item_name": item.item_name,
                "item_description": item.item_description,
                "price": item.price
            }
        )
        db.commit()
        item_data = dict(result.first())
        print(f"Created item: {item_data}")  # Debug log
        return item_data
    except Exception as e:
        print(f"Error creating wishlist item: {e}")  # Debug log
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/wishlist/", response_model=List[Item])
async def get_wishlist_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Use text() for consistent SQL formatting and map wishlist_id to item_id
    stmt = text("""
        SELECT 
            wishlist_id as item_id,
            user_id,
            item_name,
            item_description,
            price,
            added_date
        FROM wishlist 
        WHERE user_id = :user_id 
        ORDER BY added_date DESC
    """)
    
    result = db.execute(stmt, {"user_id": current_user.user_id})
    items = [dict(row) for row in result]
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
    print(f"Received item data: {item}")  # Debug log
    
    stmt = text("""
        INSERT INTO closet (user_id, item_name, item_description, price)
        VALUES (:user_id, :item_name, :item_description, :price)
        RETURNING closet_id as item_id, user_id, item_name, item_description, price, added_date
    """)
    
    try:
        result = db.execute(
            stmt,
            {
                "user_id": current_user.user_id,
                "item_name": item.item_name,
                "item_description": item.item_description,
                "price": item.price
            }
        )
        db.commit()
        item_data = dict(result.first())
        print(f"Created item: {item_data}")  # Debug log
        return item_data
    except Exception as e:
        print(f"Error creating closet item: {e}")  # Debug log
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/closet/", response_model=List[Item])
async def get_closet_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Use text() for consistent SQL formatting and map closet_id to item_id
    stmt = text("""
        SELECT 
            closet_id as item_id,
            user_id,
            item_name,
            item_description,
            price,
            added_date
        FROM closet 
        WHERE user_id = :user_id 
        ORDER BY added_date DESC
    """)
    
    result = db.execute(stmt, {"user_id": current_user.user_id})
    items = [dict(row) for row in result]
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