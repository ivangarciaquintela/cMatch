class Product:
    """
    Clase para representar un producto con sus atributos.
    """

    def __init__(self, product_id=None, name=None, price_currency=None, price_current=None, price_original=None, link=None, brand=None):
        """
        Inicializa una instancia de Product.

        Args:
            product_id (int, optional): Identificador único del producto.  Puede ser None.
            name (str, optional): Nombre del producto.
            price_currency (str, optional):  Moneda del precio (e.g., "EUR", "USD").
            price_current (float, optional): Precio actual del producto.
            price_original (float, optional): Precio original del producto (si es diferente del actual).  Puede ser None.
            link (str, optional): URL del producto.
            brand (str, optional): Marca del producto.
        """
        self.id = product_id
        self.name = name
        self.price_currency = price_currency
        self.price_current = price_current
        self.price_original = price_original
        self.link = link
        self.brand = brand
        #Mejora: Podríamos añadir validaciones para verificar que los datos sean del tipo y formato correctos

    def __str__(self):
        """
        Representación en cadena de texto del objeto Product.
        Facilita la visualización de los datos.
        """
        return (f"Product(id={self.id}, name='{self.name}', price_current={self.price_current}, "
                f"price_currency='{self.price_currency}', price_original={self.price_original}, "
                f"link='{self.link}', brand='{self.brand}')")

    def __repr__(self):
        """
        Representación "oficial" en cadena de texto del producto (para debugging).
        """
        return self.__str__()  # Usamos la misma representación que __str__ para simplificar


    @classmethod
    def from_dict(cls, product_dict):
        """
        Crea una instancia de Product a partir de un diccionario.
        Este método de clase simplifica la creación de objetos Product desde
        estructuras de datos como las que se obtienen de JSON.


        Args:
            product_dict (dict): Diccionario con los datos del producto.

        Returns:
            Product: Una instancia de la clase Product.

        Raises:
            KeyError: Si alguna de las claves esperadas no está en el diccionario.
                Maneja con gracia las claves faltantes, proporcionando valores
                predeterminados o lanzando una excepción más específica si es necesario.
            TypeError: Si los valores no son del tipo correcto
        """
        try:
            #Acceso a las claves y anidaciones correctas.
            price_data = product_dict.get('price', {})  # Usamos .get() para evitar errores si 'price' no existe
            value_data = price_data.get('value', {})
            
            return cls(
              product_id=product_dict.get('id'),
              name=product_dict.get('name'),
              price_currency=price_data.get('currency'), #.get() para valores opcionales. 
              price_current=value_data.get('current'),
              price_original=value_data.get('original'),
              link=product_dict.get('link'),
              brand=product_dict.get('brand')
            )

        except KeyError as e:
            raise KeyError(f"Missing key in product dictionary: {e}")  from e
        except TypeError as e:
            raise TypeError(f"Incorrect data type in product dictionary: {e}") from e
        # No necesitamos un bloque `except Exception` general si KeyError y TypeError cubren todos los casos posibles.


    def to_dict(self):
      """Convierte la instancia de Product en un diccionario.
      Útil para serializar el objeto, por ejemplo, para guardarlo en un archivo JSON.
      """
      return {
          "id": self.id,
          "name": self.name,
          "price": {
              "currency": self.price_currency,
              "value": {
                  "current": self.price_current,
                  "original": self.price_original,
              },
          },
          "link": self.link,
          "brand": self.brand,
      }