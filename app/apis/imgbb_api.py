import requests
from config import IMGBB_API_KEY

def upload_image_to_imgbb(image_data, name=None):
    """
    Upload an image to ImgBB and return the URL.
    Args:
        image_data: Binary image data
        name: Optional filename
    Returns:
        URL of the uploaded image or None if upload fails
    """
    url = "https://api.imgbb.com/1/upload"
    
    payload = {
        'key': IMGBB_API_KEY,
    }
    
    files = {
        'image': ('image.jpg', image_data, 'image/jpeg')
    }
    
    if name:
        payload['name'] = name

    try:
        response = requests.post(url, data=payload, files=files)
        response.raise_for_status()
        
        result = response.json()
        if result['success']:
            return result['data']['url']
        else:
            print("ImgBB upload failed:", result)
            return None
            
    except Exception as e:
        print(f"Error uploading to ImgBB: {e}")
        return None 