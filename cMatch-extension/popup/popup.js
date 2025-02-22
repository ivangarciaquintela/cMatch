const API_BASE_URL = 'http://100.83.166.6:8000';

// Generate icons programmatically
function generateIcons() {
    const canvas = document.createElement('canvas');
    const sizes = [16, 48, 128];
    const icons = {};

    sizes.forEach(size => {
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw a simple icon - black background with 'cM' text
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('cM', size/2, size/2);

        icons[size] = canvas.toDataURL();
    });

    return icons;
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.access_token);
            toggleLoginForm(false);
            checkAuth();
        } else {
            alert('Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login.');
    }
}

// Toggle login form visibility
function toggleLoginForm(show) {
    const loginForm = document.getElementById('loginForm');
    const mainContent = document.getElementById('mainContent');
    
    if (show) {
        loginForm.classList.add('active');
        mainContent.classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        mainContent.classList.add('active');
    }
}

// Handle authentication
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userStatus = document.getElementById('userStatus');
    const authButton = document.getElementById('authButton');

    if (token) {
        userStatus.textContent = 'Logged in';
        authButton.textContent = 'Logout';
        toggleLoginForm(false);
        return token;
    } else {
        userStatus.textContent = 'Not logged in';
        authButton.textContent = 'Login';
        return null;
    }
}

// Toggle search forms
function setupSearchToggle() {
    const textSearchToggle = document.getElementById('textSearchToggle');
    const visualSearchToggle = document.getElementById('visualSearchToggle');
    const textSearchForm = document.getElementById('textSearchForm');
    const visualSearchForm = document.getElementById('visualSearchForm');
    const resultsContainer = document.getElementById('results');

    textSearchToggle.addEventListener('click', () => {
        textSearchToggle.classList.add('active');
        visualSearchToggle.classList.remove('active');
        textSearchForm.classList.add('active');
        visualSearchForm.classList.remove('active');
        // Clear results and inputs
        resultsContainer.innerHTML = '';
        document.getElementById('imageUrl').value = '';
    });

    visualSearchToggle.addEventListener('click', () => {
        visualSearchToggle.classList.add('active');
        textSearchToggle.classList.remove('active');
        visualSearchForm.classList.add('active');
        textSearchForm.classList.remove('active');
        // Clear results and inputs
        resultsContainer.innerHTML = '';
        document.getElementById('searchQuery').value = '';
        document.getElementById('searchBrand').value = '';
    });
}

// Show loading state
function showLoading() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<div class="loading">Searching</div>';
}

// Handle text search
async function handleTextSearch() {
    const token = await checkAuth();
    if (!token) {
        alert('Please log in first');
        return;
    }

    const query = document.getElementById('searchQuery').value;
    const brand = document.getElementById('searchBrand').value;

    if (!query.trim()) {
        alert('Please enter a search query');
        return;
    }

    showLoading();

    try {
        const params = new URLSearchParams({ query, page: 1, per_page: 10 });
        if (brand) params.append('brand', brand);

        const response = await fetch(`${API_BASE_URL}/search/products/?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const results = await response.json();
            displayResults(results);
        } else if (response.status === 401) {
            localStorage.removeItem('authToken');
            checkAuth();
            alert('Session expired. Please log in again.');
        } else {
            alert('Search failed. Please try again.');
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('An error occurred during search.');
    }
}

// Handle visual search
async function handleVisualSearch() {
    const token = await checkAuth();
    if (!token) {
        alert('Please log in first');
        return;
    }

    const imageUrl = document.getElementById('imageUrl').value.trim();
    if (!imageUrl) {
        alert('Please enter an image URL');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/search/visual/?image_url=${encodeURIComponent(imageUrl)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const results = await response.json();
            displayResults(results);
        } else if (response.status === 401) {
            localStorage.removeItem('authToken');
            checkAuth();
            alert('Session expired. Please log in again.');
        } else {
            alert('Visual search failed. Please try again.');
        }
    } catch (error) {
        console.error('Visual search error:', error);
        alert('An error occurred during visual search.');
    }
}

// Display results
function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<div class="product-card">No results found</div>';
        return;
    }

    results.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <h3>${product.name}</h3>
            <p><strong>${product.brand.toUpperCase()}</strong></p>
            <p>${product.price?.value?.current ? `Price: ${product.price.value.current} ${product.price.currency}` : 'Price: N/A'}</p>
        `;
        resultsContainer.appendChild(productCard);
    });
}

// Update the handleImageSelection function to properly handle the image data
async function handleImageSelection() {
    try {
        // First, capture the screenshot
        chrome.runtime.sendMessage({action: 'captureTab'}, async function(response) {
            if (response && response.imageData) {
                // Show the screenshot in a canvas for selection
                const resultsContainer = document.getElementById('results');
                resultsContainer.innerHTML = `
                    <div class="screenshot-preview">
                        <div class="canvas-container">
                            <canvas id="screenshotCanvas"></canvas>
                            <div id="selection-box"></div>
                        </div>
                        <div class="button-container">
                            <button id="confirmSearch">Search with selection</button>
                            <button id="cancelSearch" class="secondary-button">Cancel</button>
                        </div>
                    </div>
                `;

                const canvas = document.getElementById('screenshotCanvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    initializeSelection(canvas);
                };
                img.src = response.imageData;

                document.getElementById('cancelSearch').addEventListener('click', () => {
                    resultsContainer.innerHTML = '';
                });
            }
        });
    } catch (error) {
        console.error('Screenshot error:', error);
        alert('Failed to capture screenshot. Please try again.');
    }
}

// Update the initializeSelection function to properly handle the image data
function initializeSelection(canvas) {
    const selectionBox = document.getElementById('selection-box');
    let isSelecting = false;
    let startX, startY;

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        isSelecting = true;

        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = '0';
        selectionBox.style.height = '0';
        selectionBox.style.display = 'block';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;

        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const width = currentX - startX;
        const height = currentY - startY;

        selectionBox.style.width = `${Math.abs(width)}px`;
        selectionBox.style.height = `${Math.abs(height)}px`;
        selectionBox.style.left = `${width < 0 ? currentX : startX}px`;
        selectionBox.style.top = `${height < 0 ? currentY : startY}px`;
    });

    canvas.addEventListener('mouseup', () => {
        isSelecting = false;
    });

    document.getElementById('confirmSearch').addEventListener('click', async () => {
        const token = await checkAuth();
        if (!token) {
            alert('Please log in first');
            return;
        }

        showLoading();

        try {
            const selection = selectionBox.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            
            // Create a new canvas for the cropped image
            const cropCanvas = document.createElement('canvas');
            const ctx = cropCanvas.getContext('2d');
            
            // Calculate selection coordinates relative to canvas
            const x = (selection.left - canvasRect.left) * (canvas.width / canvasRect.width);
            const y = (selection.top - canvasRect.top) * (canvas.height / canvasRect.height);
            const width = selection.width * (canvas.width / canvasRect.width);
            const height = selection.height * (canvas.height / canvasRect.height);
            
            cropCanvas.width = width;
            cropCanvas.height = height;
            
            // Draw the selected portion
            ctx.drawImage(
                canvas,
                x, y, width, height,
                0, 0, width, height
            );

            // Get base64 data URL first
            const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.95);
            
            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // Verify blob was created correctly
            if (!(blob instanceof Blob)) {
                throw new Error('Failed to create valid blob from image');
            }

            console.log('Blob created:', blob.type, blob.size);

            // Create FormData and append the blob
            const formData = new FormData();
            formData.append('file', blob, 'screenshot.jpg');

            // Send to API
            const apiResponse = await fetch(`${API_BASE_URL}/search/visual/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (apiResponse.ok) {
                const results = await apiResponse.json();
                displayResults(results);
            } else {
                const errorData = await apiResponse.json().catch(() => ({ detail: 'Unknown error occurred' }));
                throw new Error(errorData.detail || 'API request failed');
            }
        } catch (error) {
            console.error('Visual search error:', error);
            alert(`Visual search failed: ${error.message}`);
            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = '';
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    generateIcons();
    setupSearchToggle();
    checkAuth();

    document.getElementById('searchButton').addEventListener('click', handleTextSearch);
    document.getElementById('visualSearchButton').addEventListener('click', handleVisualSearch);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('authButton').addEventListener('click', () => {
        if (localStorage.getItem('authToken')) {
            localStorage.removeItem('authToken');
            checkAuth();
        } else {
            toggleLoginForm(true);
        }
    });
    document.getElementById('selectImageButton').addEventListener('click', handleImageSelection);
}); 