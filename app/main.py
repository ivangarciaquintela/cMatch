from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request, Query
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

# Use relative imports since we're inside the app package
from .models.database import User, Base
from .database import get_db, engine
from .apis.product_search import search_products
from .apis.visual_search import search_by_image
from . import schemas
from . import auth
from .views import router as views_router

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
    token: str = Depends(oauth2_scheme)
):
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
            
        return results
        
    except Exception as e:
        print(f"Error in visual search endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/search/visual/")
async def visual_search_file_endpoint(
    request: Request,
    file: UploadFile = File(...),
    page: int = 1,
    per_page: int = 10,
    token: str = Depends(oauth2_scheme)
):
    try:
        # Create a unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        # Save the uploaded file
        async with aiofiles.open(filepath, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Generate the public URL for the image
        base_url = str(request.base_url)
        image_url = f"{base_url}uploads/{filename}"
        
        # Pass the image URL to the search function
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
            
        return results
        
    except Exception as e:
        print(f"Error in visual search endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Add this line after creating the FastAPI app but before other routes
app.include_router(views_router)

# Remove or comment out the existing root route
# @app.get("/")
# async def root():
#     return RedirectResponse(url="/static/login.html") 