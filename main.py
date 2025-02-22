# main.py

from apis.product_search import search_products
from apis.visual_search import search_by_image
from models.product import Product

if __name__ == "__main__":
    # Ejemplo de búsqueda por texto con paginación
    product_results = search_products("shirt", "zara", page=2, per_page=10)  # Página 2, 10 elementos
    if product_results:
        print("Resultados de Product Search:")
        productos = []
        for producto_dict in product_results:
            try:
                producto = Product.from_dict(producto_dict)
                productos.append(producto)
            except (KeyError, TypeError) as e:
                print(f"Error al procesar un producto: {e}")
                # Opcionalmente:  podrías registrar el error, omitir el producto, etc.

        for p in productos :
            print(p)
            print("\n")


    # Ejemplo de búsqueda visual con paginación
    #  Recuerda: Obtén una URL *directa* a la imagen, no la URL de la página de Pinterest.
    image_url = "https://URL_DIRECTA_A_LA_IMAGEN.jpg"  #  ¡Cambia esto!
    visual_results = search_by_image(image_url, page=1, per_page=5)
    if visual_results:
        print("\nResultados de Visual Search:")
        productos = []
        for producto_dict in visual_results:
            try:
                producto = Product.from_dict(producto_dict)
                productos.append(producto)
            except (KeyError, TypeError) as e:
                print(f"Error al procesar un producto: {e}")
                # Opcionalmente:  podrías registrar el error, omitir el producto, etc.

        for p in productos :
            print(p)
            print("\n")
        print("\n")
