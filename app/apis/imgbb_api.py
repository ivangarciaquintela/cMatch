import requests

def upload_image_to_freeimage(image_data, name=None):
    """
    Upload an image to freeimage.host and return the URL.
    Args:
        image_data: Binary image data
        name: Optional filename
    Returns:
        URL of the uploaded image or None if upload fails
    """
    url = "https://freeimage.host/api/1/upload"
    
    payload = {
        'key': '6d207e02198a847aa98d0a2a901485a5',
        'action': 'upload',
        'format': 'json'
    }
    
    files = {
        'source': ('image.jpg', image_data, 'image/jpeg')
    }
    
    if name:
        payload['name'] = name

    try:
        response = requests.post(url, data=payload, files=files)
        response.raise_for_status()
        
        result = response.json()
        if result['status_code'] == 200:
            return result['image']['url']
        else:
            print("Freeimage upload failed:", result)
            return None
            
    except Exception as e:
        print(f"Error uploading to Freeimage: {e}")
        return None 