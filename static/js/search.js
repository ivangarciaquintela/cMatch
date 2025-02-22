// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return null;
    }
    return token;
}

// Handle Search
async function handleSearch() {
    const token = checkAuth();
    if (!token) return;

    const query = document.getElementById('searchQuery').value;
    const brand = document.getElementById('searchBrand').value;

    try {
        const response = await fetch('/search/products/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query,
                brand,
                page: 1,
                per_page: 10
            })
        });

        if (response.ok) {
            const results = await response.json();
            displaySearchResults(results);
        } else if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        } else {
            alert('Search failed. Please try again.');
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('An error occurred during search.');
    }
}

// Handle Visual Search
async function handleVisualSearch() {
    const token = checkAuth();
    if (!token) return;

    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image.');
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }

    // Display image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px;">`;
    }
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/search/visual/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const results = await response.json();
            displaySearchResults(results);
        } else if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        } else {
            const errorData = await response.json();
            alert(`Search failed: ${errorData.detail}`);
        }
    } catch (error) {
        console.error('Visual search error:', error);
        alert('An error occurred during visual search.');
    }
}

// Display Search Results
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    const resultsHeader = document.createElement('h2');
    resultsHeader.textContent = 'Results:';
    resultsContainer.appendChild(resultsHeader);

    results.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';

        const productLink = document.createElement('a');
        productLink.href = product.link;
        productLink.style.textDecoration = 'none';
        productLink.style.color = 'inherit';

        let productHTML = `
            <h3>${product.name}</h3>
            <p style="font-weight: bold;">${product.brand.toUpperCase()}</p>
            <p>`;

        if (product.price?.value?.current !== undefined && product.price?.currency) {
            productHTML += `Price: ${product.price.value.current} ${product.price.currency}`;
        } else {
            productHTML += 'Price: N/A';
        }

        productHTML += `</p>
            <button onclick="addToWishlist(${product.id})">Add to Wishlist</button>
        `;

        productElement.innerHTML = productHTML;
        productLink.appendChild(productElement);
        resultsContainer.appendChild(productLink);
    });
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
}

// Initialize search page
function init() {
    checkAuth();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

init(); 