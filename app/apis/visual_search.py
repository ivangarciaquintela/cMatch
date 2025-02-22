# visual_search.py
from .inditex_api import InditexAPI
import requests
from config import API_TOKEN, VISUAL_SEARCH_BASE_URL
import json

def search_by_image(image_url, page=1, per_page=5):
    """
    Búsqueda visual con paginación.
    """
    api = InditexAPI()  # Crea instancia de la clase InditexAPI
    token = api.get_token()    # Obtiene el token

    if not token:  # Manejar el caso donde el token no se puede obtener
      print("Error: No se pudo obtener el token de autenticación.")
      return None

    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {token}"  # Usar token desde la instancia
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
