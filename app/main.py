from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request, Query, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import os
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import base64
import aiofiles
from datetime import datetime
import requests
import json
import logging

# Use relative imports since we're inside the app package
from .models.database import User, Base
from .database import get_db, engine
from .apis.product_search import search_products
from .apis.visual_search import search_by_image
from .apis.imgbb_api import upload_image_to_freeimage
from . import schemas
from . import auth
from .views import router as views_router
from .apis.user_items import router as user_items_router
from .apis.user_profile import router as user_profile_router
from .services.screenshot import capture_screenshot

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount the uploads directory
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Add near the top of the file, after imports
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# User management endpoints
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": user.email}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Product search endpoints
@app.get("/search/products/")
async def search_products_endpoint(
    query: str,
    brand: str = None,
    page: int = 1,
    per_page: int = 10,
    # token: str = Depends(oauth2_scheme),
    # authorization: str = Header(None)
):
    # Allow internal requests from the agent service
    # if authorization == f"Bearer {os.getenv('INTERNAL_TOKEN')}":
    #     pass
    # # For regular users, verify their token
    # elif not token:
    #     raise HTTPException(
    #         status_code=401,
    #         detail="Not authenticated"
    #     )

    results = search_products(
        query,
        brand,
        page=page,
        per_page=per_page
    )
    return results

@app.get("/search/visual/")
async def visual_search_url_endpoint(
    image_url: str = Query(..., description="URL of the image to search"),
    page: int = 1,
    per_page: int = 10,
    token: str = Depends(oauth2_scheme)
):
    try:
        results = search_by_image(
            image_url,
            page=page,
            per_page=per_page
        )
        if results is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to perform visual search"
            )
        print("urlimg")
        return results
        
    except Exception as e:
        print(f"Error in visual search endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/search/visual/")
async def visual_search_file_endpoint(
    file: UploadFile = File(...),
    page: int = 1,
    per_page: int = 10,
    token: str = Depends(oauth2_scheme)
):
    try:
        # Log the incoming request details
        print(f"Received file upload: {file.filename}, type: {file.content_type}, size: {file.spool_max_size} bytes")
        
        # Read the file content
        content = await file.read()
        print(f"File content read successfully, size: {len(content)} bytes")
        
        # Upload to ImgBB
        image_url = upload_image_to_freeimage(content, name=file.filename)
        print(f"Image uploaded to ImgBB, URL: {image_url}")
        
        if not image_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload image"
            )
        
        # Pass the ImgBB URL to the search function
        results = search_by_image(
            image_url,
            page=page,
            per_page=per_page
        )
        print(f"Search results: {results}")
        
        if results is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to perform visual search"
            )
            
        return results
        
    except Exception as e:
        print(f"Error in visual search endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Add this line after creating the FastAPI app but before other routes
app.include_router(views_router)

# Add this line after your other app.include_router() calls
app.include_router(user_items_router, prefix="/api", tags=["user items"])
app.include_router(user_profile_router, prefix="/api/user", tags=["user profile"])

# Update the clothing recommendations endpoint
@app.get("/agent/clothing-recommendations/")
async def clothing_recommendations_endpoint(
    query: str,
    token: str = Depends(oauth2_scheme)
):
    """
    Get clothing recommendations based on natural language query.
    """
    try:
        logger.info(f"Forwarding recommendation request to agent service: {query}")
        response = requests.get(
            f"http://agent:8001/recommendations",
            params={"query": query},
            timeout=300  # 5 minute timeout
        )
        
        logger.info(f"Agent service responded with status code: {response.status_code}")
        if not response.ok:
            logger.error(f"Agent service error response: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Agent service error: {response.text}"
            )
        
        data = response.json()
        logger.info("Successfully parsed agent response")
        return data
            
    except requests.Timeout:
        logger.error("Request to agent service timed out")
        raise HTTPException(
            status_code=504,
            detail="Request to agent service timed out"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

# Remove or comment out the existing root route
# @app.get("/")
# async def root():
#     return RedirectResponse(url="/static/login.html") 

@app.get("/preview/{item_id}")
async def get_preview(
    item_id: str,
    url: str,
    token: str = Depends(oauth2_scheme)
):
    try:
        screenshot_base64 = await capture_screenshot(url)
        if screenshot_base64:
            return {"image": f"data:image/jpeg;base64,{screenshot_base64}"}
        raise HTTPException(status_code=500, detail="Failed to generate preview")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 