# visual_search.py

import requests
from config import API_TOKEN, VISUAL_SEARCH_BASE_URL
import json

def search_by_image(image_url, page=1, per_page=5): #valores por defecto
    """
    Búsqueda visual con paginación.
    """
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"  # ¡Usamos Bearer Token!
        # "Content-Type": "application/json"   <- No es necesario en GET
    }
    params = {
        "image": image_url,
        "page": page,
        "perPage": per_page
    }

    try:
        response = requests.get(VISUAL_SEARCH_BASE_URL, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error en Visual Search: {e}")
        return None
    except json.JSONDecodeError:
       print(f"Error al decodificar JSON. Respuesta: {response.text}")
       return  None