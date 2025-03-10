from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import os

# Create router instance
router = APIRouter()

# Set up templates directory - assuming static folder is at project root
templates_directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
templates = Jinja2Templates(directory=templates_directory)

@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/login", response_class=HTMLResponse)
async def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/register", response_class=HTMLResponse)
async def register(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@router.get("/search", response_class=HTMLResponse)
async def search(request: Request):
    return templates.TemplateResponse("search.html", {"request": request}) 

@router.get("/product", response_class=HTMLResponse)
async def search(request: Request):
    return templates.TemplateResponse("product.html", {"request": request}) 

@router.get("/visual", response_class=HTMLResponse)
async def search(request: Request):
    return templates.TemplateResponse("visual.html", {"request": request}) 

@router.get("/agent", response_class=HTMLResponse)
async def search(request: Request):
    return templates.TemplateResponse("agent.html", {"request": request}) 

@router.get("/stylia", response_class=HTMLResponse)
async def search(request: Request):
    return templates.TemplateResponse("agent.html", {"request": request}) 

@router.get("/wishlist", response_class=HTMLResponse)
async def search(request: Request):
    return templates.TemplateResponse("wishlist.html", {"request": request}) 

@router.get("/user", response_class=HTMLResponse)
async def search(request: Request):
    return templates.TemplateResponse("profile.html", {"request": request}) 

@router.get("/closet", response_class=HTMLResponse)
async def search(request: Request):
    return templates.TemplateResponse("closet.html", {"request": request}) 