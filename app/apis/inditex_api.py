# apis/inditex_api.py
import requests
import json
from datetime import datetime, timedelta
from config import CLIENT_ID, CLIENT_SECRET, TOKEN_URL  # Import from config


class InditexAPI:
    """
    Clase para interactuar con la API de Inditex, incluyendo la obtención y
    gestión del token de acceso OAuth 2.0.
    """

    def __init__(self,
                 scope="technology.catalog.read",
                 user_agent="cMatch"):
        """
        Inicializa la clase InditexAPI.

        Args:

            scope:  Alcance (scope) solicitado.
            user_agent:  Valor para la cabecera User-Agent.
        """
        self.token_url = TOKEN_URL # Now uses the config values.
        self.client_id = CLIENT_ID
        self.client_secret = CLIENT_SECRET
        self.scope = scope
        self.user_agent = user_agent
        self._token = None  # Almacena el token actual
        self._token_expiration = None  # Almacena la fecha/hora de expiración


    def get_token(self):
        """
        Obtiene un token de acceso OAuth 2.0 de la API de Inditex.
        Gestiona la expiración y re-autenticación automáticamente.

        Returns:
            str: El token de acceso (Bearer token) si se obtiene correctamente,
                 o None si hay un error.
        """

        if self._token and self._token_expiration and datetime.now() < self._token_expiration:
            #print("Usando token existente.")  # Para debugging
            return self._token

        #  Necesitamos (re)autenticar:
        headers = {
            "User-Agent": self.user_agent
        }
        auth = (self.client_id, self.client_secret)
        data = {
            "grant_type": "client_credentials",
            "scope": self.scope
        }

        try:
            response = requests.post(self.token_url, headers=headers, auth=auth, data=data)
            response.raise_for_status()  # Lanza excepción si hay error HTTP (4xx, 5xx)
            token_data = response.json()

            self._token = token_data["id_token"]
            expires_in = token_data["expires_in"]  # Segundos hasta expiración

            # Calculamos el tiempo de expiración (con un pequeño margen de seguridad)
            self._token_expiration = datetime.now() + timedelta(seconds=expires_in - 60)  # Restamos 60 segundos
            return self._token


        except requests.exceptions.RequestException as e:
            print(f"Error obteniendo token de Inditex API: {e}")
            return None
        except KeyError as e:
            print(f"Error: La respuesta de la API no contiene el campo esperado: {e}")
            print(f"Respuesta completa: {response.text}")  # Imprime la respuesta completa
            return None
        except json.JSONDecodeError:
            print(f"Error al decodificar la respuesta JSON. Respuesta: {response.text}")
            return  None
        except Exception as e: # para cubrir más casos
            print(f"Error durante la autenticacion: {e}")
            return None