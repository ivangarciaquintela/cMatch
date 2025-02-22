# product_search.py
from .inditex_api import InditexAPI
import requests
from config import PRODUCT_SEARCH_BASE_URL  # Import the correct base URL
import json


def search_products(query, brand, page=1, per_page=5):
    """
    Busca productos con paginación, usando la clase InditexAPI para la autenticación.
    """
    api = InditexAPI()  # Create an instance of InditexAPI
    token = api.get_token()  # Get the token
    print(token)
    if not token:
        print("Error: No se pudo obtener el token de autenticación.")
        return None

    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {token}", # Use the obtained token
    }
    params = {
        "query": query,
        "brand": brand,
        "page": page,
        "perPage": per_page
    }

    try:
        # Use VISUAL_SEARCH_BASE_URL,  OR  create and use a separate PRODUCT_SEARCH_BASE_URL in config.py
        response = requests.get(PRODUCT_SEARCH_BASE_URL, headers=headers, params=params)  # Or your product search URL
        response.raise_for_status()
        print(response.json)
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error en Product Search: {e}")
        return None
    except json.JSONDecodeError:
        print(f"Error al decodificar JSON.  Respuesta: {response.text}")
        return None

# --- Example Usage (optional, for testing) ---
if __name__ == '__main__':
    results = search_products(query="t-shirt", brand="zara")
    if results:
      print("Product Search Results:")
      print(json.dumps(results, indent=2))