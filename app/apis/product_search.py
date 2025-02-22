# product_search.py
import requests
from config import API_TOKEN, PRODUCT_SEARCH_BASE_URL
import json

def search_products(query, brand, page=1, per_page=5): #valores por defecto
    """
    Busca productos con paginación.
    """
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"
    }
    params = {
        "query": query,
        "brand": brand,
        "page": page,
        "perPage": per_page
    }

    try:
        response = requests.get(PRODUCT_SEARCH_BASE_URL, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error en Product Search: {e}")
        return None
    except json.JSONDecodeError:
       print(f"Error al decodificar JSON. Respuesta: {response.text}") #para ver la respuesta completa
       return  None