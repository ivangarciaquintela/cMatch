from playwright.async_api import async_playwright
import base64
from typing import Optional
import asyncio

async def capture_screenshot(url: str) -> Optional[str]:
    try:
        print(f"Capturing screenshot for URL: {url}")  # Print the link
        async with async_playwright() as p:
            # Launch browser with specific args for container environment
            browser = await p.chromium.launch(
                headless=True
            )
            
            # Create new context and page
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 800}
            )
            page = await context.new_page()
            
            # Navigate to URL with timeout
            await page.goto(url, wait_until='networkidle', timeout=30000)
            first_image = page.locator('.media-image_image').first
            await first_image.wait_for()  # Ensure the first image is loaded

            # Wait a bit for dynamic content
            await asyncio.sleep(1)
            
            # Take screenshot of the first image only
            screenshot_bytes = await first_image.screenshot(
                type='jpeg',
                quality=80,
                full_page=False
            )
            
            # Close browser
            await browser.close()
            
            # Convert to base64
            base64_image = base64.b64encode(screenshot_bytes).decode('utf-8')
            return base64_image
            
    except Exception as e:
        print(f"Screenshot error: {str(e)}")
        return None 