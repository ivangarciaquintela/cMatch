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
            displaySearchResults(results, token);
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
    console.log(method)
    if (!token) return;

    let searchButton;
    let formData = new FormData();
    let endpoint = '/search/visual/';
    console.log(method)
    
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
            displaySearchResults(results, token);
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

function displaySearchResults(results, authToken) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    const resultsHeader = document.createElement('h2');
    resultsHeader.textContent = 'Results:';
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

        const contentContainer = document.createElement('div');
        contentContainer.className = 'p-4'; // Add padding to the content

        // Create a link for the item name only
        const itemNameLink = document.createElement('a');
        itemNameLink.href = product.link; // Link to the product
        itemNameLink.textContent = product.name; // Display the product name
        itemNameLink.className = 'text-lg font-bold text-blue-600 hover:underline'; // Styling for the link

        // Append the item name link to the content container
        contentContainer.appendChild(itemNameLink);

        // Add item description if available
        if (product.description) {
            const itemDescription = document.createElement('p');
            itemDescription.textContent = product.description;
            contentContainer.appendChild(itemDescription);
        }

        // Add item price if available
        if (product.price && product.price.value && product.price.value.current) {
            const itemPrice = document.createElement('p');
            itemPrice.textContent = `$${product.price.value.current}`;
            contentContainer.appendChild(itemPrice);
        }

        // Wishlist button
        const wishlistButton = document.createElement('button');
        wishlistButton.textContent = 'Add to Wishlist';
        wishlistButton.className = 'mt-2 px-4 py-2 bg-white border border-black text-black hover:bg-black hover:text-white transition duration-200';

        wishlistButton.onclick = async (event) => {
            event.stopPropagation();
            console.log('Wishlist button clicked');
            
            const itemData = {
                item_name: product.name,
                item_description: product.description || '',
                price: product.price?.value?.current || null
            };
            
            console.log('Sending item data:', itemData); // Debug log
            
            try {
                const response = await fetch('/api/wishlist/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(itemData)
                });
                
                console.log('Response status:', response.status); // Debug log
                
                const responseData = await response.json();
                console.log('Response data:', responseData); // Debug log
                
                if (response.ok) {
                    alert('Item added to wishlist!');
                } else {
                    alert(`Failed to add to wishlist: ${responseData.detail || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error adding to wishlist:', error);
                alert('An error occurred while adding to wishlist.');
            }
        };
        contentContainer.appendChild(wishlistButton);

        // Closet button
        const closetButton = document.createElement('button');
        closetButton.textContent = 'Add to Closet';
        closetButton.className = 'mt-2 px-4 py-2 bg-white border border-black text-black hover:bg-black hover:text-white transition duration-200';

        closetButton.onclick = async (event) => {
            event.stopPropagation(); // Prevent the click from bubbling up
            console.log('Closet button clicked'); // Debug log
            try {
                const response = await fetch('/api/closet/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        item_name: product.name,
                        item_description: product.description || '',
                        price: product.price?.value?.current || null
                    })
                });
                if (response.ok) {
                    alert('Item added to closet!');
                } else {
                    const errorData = await response.json();
                    alert(`Failed to add to closet: ${errorData.detail}`);
                }
            } catch (error) {
                console.error('Error adding to closet:', error);
                alert('An error occurred while adding to closet.');
            }
        };
        contentContainer.appendChild(closetButton);

        productCard.appendChild(contentContainer);
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