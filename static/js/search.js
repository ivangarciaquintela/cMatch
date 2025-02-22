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
        // Build URL with query parameters
        const params = new URLSearchParams({
            query: query,
            page: 1,
            per_page: 10
        });
        if (brand) params.append('brand', brand);

        const response = await fetch(`/search/products/?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
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
async function handleVisualSearch(method) {
    const token = checkAuth();
    if (!token) return;

    let searchButton;
    let formData = new FormData();
    let endpoint = '/search/visual/';
    
    if (method === 'file') {
        const fileInput = document.getElementById('imageUpload');
        const file = fileInput.files[0];
        searchButton = fileInput.nextElementSibling;

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

        formData.append('file', file);
    } else {
        const urlInput = document.getElementById('imageUrl');
        const imageUrl = urlInput.value.trim();
        searchButton = urlInput.nextElementSibling;

        if (!imageUrl) {
            alert('Please enter an image URL.');
            return;
        }

        endpoint += `?image_url=${encodeURIComponent(imageUrl)}`;
    }

    // Show loading state
    const originalText = searchButton.textContent;
    searchButton.disabled = true;
    searchButton.textContent = 'Searching...';

    try {
        const response = await fetch(endpoint, {
            method: method === 'file' ? 'POST' : 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: method === 'file' ? formData : undefined
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
        alert('An error occurred during visual search. Please try again.');
    } finally {
        // Reset button state
        searchButton.disabled = false;
        searchButton.textContent = originalText;
    }
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';  // Clear previous results

    const resultsHeader = document.createElement('h2');
    resultsHeader.textContent = 'Results:';
    resultsHeader.className = "text-2xl font-semibold mb-4"; // Tailwind classes
    resultsContainer.appendChild(resultsHeader);

    if (!results || results.length === 0) {
        const noResults = document.createElement('p');
        noResults.textContent = 'No results found.';
        noResults.className = "text-gray-600";
        resultsContainer.appendChild(noResults);
        return;
    }

    // Create a scrollable container for the list
    const scrollableContainer = document.createElement('div');
    scrollableContainer.className = 'overflow-y-auto max-h-[60vh]'; // Key change: Enable vertical scrolling

    results.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-white shadow overflow-hidden mb-4 product-card'; // mb-4 for spacing

        const productLink = document.createElement('a');
        productLink.href = product.link;
        productLink.className = 'block no-underline text-current hover:text-current';

        if (product.image) {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'relative h-48 overflow-hidden'; // or any desired height
            const productImage = document.createElement('img');
            productImage.src = product.image;
            productImage.alt = product.name || 'Product Image';
            productImage.className = 'absolute inset-0 w-full h-full object-cover';
            imageContainer.appendChild(productImage);
            productLink.appendChild(imageContainer);
        }

        const contentContainer = document.createElement('div');
        contentContainer.className = 'p-4';

        const productName = document.createElement('h3');
        productName.textContent = product.name || 'No Name';
        productName.className = 'text-lg font-semibold text-gray-800';
        contentContainer.appendChild(productName);

        const productBrand = document.createElement('p');
        productBrand.textContent = product.brand ? product.brand.toUpperCase() : 'N/A';
        productBrand.className = 'text-sm font-bold text-gray-700';
        contentContainer.appendChild(productBrand);

        const productPrice = document.createElement('p');
        productPrice.className = "text-base text-gray-900";
        if (product.price?.value?.current !== undefined && product.price?.currency) {
            productPrice.textContent = `Price: ${product.price.value.current} ${product.price.currency}`;
        } else {
            productPrice.textContent = 'Price: N/A';
        }
        contentContainer.appendChild(productPrice);

        const wishlistButton = document.createElement('button');
        wishlistButton.textContent = 'Add to Wishlist';
        wishlistButton.className = 'mt-2 px-4 py-2 bg-white border border-black text-black  hover:bg-black hover:text-white transition duration-200';

        wishlistButton.onclick = () => {
            addToWishlist(product.id);
        };
        contentContainer.appendChild(wishlistButton);

        productLink.appendChild(contentContainer);
        productCard.appendChild(productLink);
        scrollableContainer.appendChild(productCard); // Add to scrollable container
    });

    resultsContainer.appendChild(scrollableContainer); // Add scrollable container to results
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