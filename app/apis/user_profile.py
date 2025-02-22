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
        # Get the update data, excluding None values
        update_data = profile_update.dict(exclude_unset=True, exclude_none=True)
        
        # Convert usual_sizes dict to JSON string if present
        if 'usual_sizes' in update_data:
            # Check if usual_sizes is already a string
            if isinstance(update_data['usual_sizes'], dict):
                update_data['usual_sizes'] = json.dumps(update_data['usual_sizes'])
            elif update_data['usual_sizes'] is None:
                update_data['usual_sizes'] = '{}'
        
        # Handle array fields
        array_fields = ['style_preferences', 'favorite_brands', 'preferred_colors']
        for field in array_fields:
            if field in update_data and update_data[field] is None:
                update_data[field] = []
        
        # Build the SET clause dynamically based on provided fields
        set_clauses = []
        params = {"user_id": current_user.user_id}
        
        for key, value in update_data.items():
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
        
        # Convert usual_sizes JSON string back to dict
        if updated_profile['usual_sizes'] is None:
            updated_profile['usual_sizes'] = {}
        else:
            try:
                # Handle both string and already-parsed JSON
                if isinstance(updated_profile['usual_sizes'], str):
                    updated_profile['usual_sizes'] = json.loads(updated_profile['usual_sizes'])
            except json.JSONDecodeError:
                updated_profile['usual_sizes'] = {}
        
        return updated_profile
        
    except Exception as e:
        db.rollback()
        print(f"Error updating profile: {str(e)}")  # Add logging for debugging
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        ) 