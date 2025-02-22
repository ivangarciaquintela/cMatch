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

// Add this function to your existing popup.js
async function handleImageSelection() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Minimize popup
    window.blur();
    
    try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
        
        if (response && response.imageData) {
            // Upload the image data to your server or use it directly
            const imageBlob = await (await fetch(response.imageData)).blob();
            const formData = new FormData();
            formData.append('file', imageBlob, 'screenshot.jpg');
            
            const token = await checkAuth();
            if (!token) {
                alert('Please log in first');
                return;
            }

            showLoading();

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
                alert('Visual search failed. Please try again.');
            }
        }
    } catch (error) {
        console.error('Selection error:', error);
        alert('Failed to capture selection. Please try again.');
    }
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