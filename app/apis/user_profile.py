from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import json

from ..database import get_db
from ..models.database import User
from ..schemas import UserProfile, UserProfileUpdate
from ..auth import get_current_user

router = APIRouter()

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's profile"""
    stmt = text("""
        SELECT 
            user_id,
            username,
            email,
            first_name,
            last_name,
            birth_date,
            style_preferences,
            favorite_brands,
            preferred_colors,
            usual_sizes,
            created_at
        FROM users 
        WHERE user_id = :user_id
    """)
    
    result = db.execute(stmt, {"user_id": current_user.user_id}).first()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert row to dict and handle JSON/array fields
    profile_data = dict(result)
    if profile_data['usual_sizes'] is None:
        profile_data['usual_sizes'] = {}
    
    return profile_data

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current user's profile"""
    try:
        # Only include non-None values in the update
        update_data = profile_update.dict(exclude_unset=True, exclude_none=True)
        
        # Convert the UserSizes model to JSON string if it exists
        if 'usual_sizes' in update_data and update_data['usual_sizes']:
            update_data['usual_sizes'] = json.dumps(update_data['usual_sizes'].dict(exclude_none=True))
        
        # Build the SET clause dynamically based on provided fields
        set_clauses = []
        params = {"user_id": current_user.user_id}
        
        for key, value in update_data.items():
            if value is not None:  # Only include non-None values
                set_clauses.append(f"{key} = :{key}")
                params[key] = value
        
        # Add updated_at to the SET clause
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        
        # Construct the SQL statement
        stmt = text(f"""
            UPDATE users 
            SET {', '.join(set_clauses)}
            WHERE user_id = :user_id
            RETURNING 
                user_id,
                username,
                email,
                first_name,
                last_name,
                birth_date,
                style_preferences,
                favorite_brands,
                preferred_colors,
                usual_sizes,
                created_at
        """)
        
        result = db.execute(stmt, params)
        db.commit()
        
        updated_profile = dict(result.first())
        
        # Ensure usual_sizes is a dict
        if updated_profile['usual_sizes'] is None:
            updated_profile['usual_sizes'] = {}
            
        return updated_profile
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        ) 