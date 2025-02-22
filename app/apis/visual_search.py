# visual_search.py
from .inditex_api import InditexAPI
import requests
from config import VISUAL_SEARCH_BASE_URL
import json

def search_by_image(image_url, page=1, per_page=5):
    """
    Búsqueda visual con paginación.
    Args:
        image_url: URL of the image to search
        page: Page number for pagination
        per_page: Number of results per page
    """
    api = InditexAPI()
    token = api.get_token()

    if not token:
        print("Error: No se pudo obtener el token de autenticación.")
        return None

    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {token}",
        "User-Agent": "postman/1.0"
    }

    params = {
        "image": image_url,
        "page": page,
        "perPage": per_page
    }

    try:
        response = requests.get(
            VISUAL_SEARCH_BASE_URL,
            headers=headers,
            params=params
        )
        response.raise_for_status()
        print("Visual Search Response:", response.text)  # Debug line
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error en Visual Search: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response text: {e.response.text}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error al decodificar JSON. Respuesta: {response.text}")
        return None
