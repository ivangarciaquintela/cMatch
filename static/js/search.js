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
    if (!token) return;

    let searchButton;
    let formData = new FormData();
    let endpoint = '/search/visual/';
    
    if (method === 'image') {
        const fileInput = document.getElementById('dropzone-file');
        searchButton = fileInput.nextElementSibling;

        if (!fileInput || !fileInput.files[0]) {
            alert('Please select an image.');
            return;
        }

        const file = fileInput.files[0];

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
        // Use POST method for file upload
        const response = await fetch(endpoint, {
            method: 'POST', // Ensure POST is used for file upload
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData // Send the form data containing the file
        });
        console.log(endpoint)
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
    } else {
        const urlInput = document.getElementById('imageUrl');
        searchButton = urlInput.nextElementSibling;

        if (!urlInput || !urlInput.value.trim()) {
            alert('Please enter an image URL.');
            return;
        }

        endpoint += `?image_url=${encodeURIComponent(urlInput.value.trim())}`;
        
        // Use GET method for URL input
        const response = await fetch(endpoint, {
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
            const errorData = await response.json();
            alert(`Search failed: ${errorData.detail}`);
        }
    }

    // Reset button state
    if (searchButton) {
        searchButton.disabled = false;
        searchButton.textContent = originalText;
    }
}

function displaySearchResults8(results, authToken) {
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

    const scrollableContainer = document.createElement('div');
    scrollableContainer.className = 'overflow-y-auto max-h-[60vh]';

    results.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-white shadow overflow-hidden mb-4 product-card';

        const contentContainer = document.createElement('div');
        contentContainer.className = 'p-4';

        // Product info
        const itemNameLink = document.createElement('a');
        itemNameLink.href = product.link;
        itemNameLink.target = '_blank';
        itemNameLink.textContent = product.name;
        itemNameLink.className = 'text-lg font-bold mb-2 hover:underline block';
        contentContainer.appendChild(itemNameLink);

        if (product.description) {
            const itemDescription = document.createElement('p');
            itemDescription.textContent = product.description;
            itemDescription.className = 'text-gray-600 mb-2';
            contentContainer.appendChild(itemDescription);
        }

        if (product.price?.value?.current) {
            const itemPrice = document.createElement('p');
            itemPrice.textContent = `$${product.price.value.current}`;
            itemPrice.className = 'text-gray-800 font-semibold';
            contentContainer.appendChild(itemPrice);
        }

        // Add buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex gap-2 mt-4';

        // Wishlist button
        const wishlistButton = document.createElement('button');
        wishlistButton.textContent = 'Add to Wishlist';
        wishlistButton.className = 'flex-1 px-4 py-2 bg-white border border-black text-black hover:bg-black hover:text-white transition duration-200';
        wishlistButton.onclick = () => handleWishlistAdd(product, authToken);

        // Closet button
        const closetButton = document.createElement('button');
        closetButton.textContent = 'Add to Closet';
        closetButton.className = 'flex-1 px-4 py-2 bg-white border border-black text-black hover:bg-black hover:text-white transition duration-200';
        closetButton.onclick = () => handleClosetAdd(product, authToken);

        buttonsContainer.appendChild(wishlistButton);
        buttonsContainer.appendChild(closetButton);
        contentContainer.appendChild(buttonsContainer);

        productCard.appendChild(contentContainer);
        scrollableContainer.appendChild(productCard);
    });

    resultsContainer.appendChild(scrollableContainer);
}

function displaySearchResults(results, authToken) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = ''; // Limpiar resultados anteriores

    if (!results || results.length === 0) {
        const noResults = document.createElement('p');
        noResults.textContent = 'No results found.';
        noResults.className = "text-gray-600";
        resultsContainer.appendChild(noResults);
        return;
    }

    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'relative w-full overflow-hidden py-8 ';


    const carouselTrack = document.createElement('div');
    carouselTrack.className = 'flex transition-transform duration-500 ease-in-out';
    carouselContainer.appendChild(carouselTrack);

    results.forEach((product, index) => { // Add index to forEach
        const productCard = document.createElement('div');
        productCard.className = 'bg-white shadow rounded-lg p-6 min-w-[300px] md:min-w-[350px] mx-4 shrink-0';

        // --- Image Container ---
        const imageContainer = document.createElement('div');
        imageContainer.className = 'mb-4';

        const productImage = document.createElement('img');
        // Construct the image path dynamically
        productImage.src = `/static/img/prenda_${index + 1}.jpg`; // Use index + 1
        productImage.alt = product.name || 'Product Image';
        productImage.className = 'w-full h-48 object-cover rounded-t-lg';
        imageContainer.appendChild(productImage);
        productCard.appendChild(imageContainer);


        // Product info
        const itemNameLink = document.createElement('a');
        itemNameLink.href = product.link;
        itemNameLink.target = '_blank';
        itemNameLink.textContent = product.name;
        itemNameLink.className = 'text-lg font-bold mb-2 hover:underline block';
        productCard.appendChild(itemNameLink);

        if (product.description) {
            const itemDescription = document.createElement('p');
            itemDescription.textContent = product.description;
            itemDescription.className = 'text-gray-600 mb-2';
            productCard.appendChild(itemDescription);
        }

        if (product.price?.value?.current) {
            const itemPrice = document.createElement('p');
            itemPrice.textContent = `$${product.price.value.current}`;
            itemPrice.className = 'text-gray-800 font-semibold';
            productCard.appendChild(itemPrice);
        }

        // Add buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex gap-2 mt-4';

        // Wishlist button
        const wishlistButton = document.createElement('button');
        wishlistButton.innerHTML = '<img src="/static/img/heart.png" alt="Add to Wishlist" class="h-6 w-6">';
        wishlistButton.className = 'border border-black rounded-full hover:bg-red-200 p-1 bg-white';
        wishlistButton.onclick = () => handleWishlistAdd(product, authToken);

        // Closet button
        const closetButton = document.createElement('button');
        closetButton.innerHTML = '<img src="/static/img/clothes.png" alt="Add to Closet" class="h-6 w-6">';
        closetButton.className = 'border border-black rounded-full hover:bg-gray-200 p-1 bg-white';
        closetButton.onclick = () => handleClosetAdd(product, authToken);
        
    
        buttonsContainer.appendChild(wishlistButton);
        buttonsContainer.appendChild(closetButton);
        productCard.appendChild(buttonsContainer);

        carouselTrack.appendChild(productCard);
    });


    // --- Carousel Navigation ---
    let currentPosition = 0;
    let cardWidth;

    function createNavButton(direction) {
        const button = document.createElement('button');
        button.className = `absolute top-1/2 transform -translate-y-1/2 ${direction === 'left' ? 'left-0' : 'right-0'}  text-2xl p-3  hover:bg-gray-200/50 rounded-full focus:outline-none z-10`;
        button.innerHTML = direction === 'left' ? '&#8592;' : '&#8594;';
        return button;
    }

    const prevButton = createNavButton('left');
    const nextButton = createNavButton('right');


    function updateCarousel() {
      const itemsToShow = Math.max(1, Math.floor(resultsContainer.offsetWidth / (cardWidth + 32)));
      const maxPosition = -(carouselTrack.children.length - itemsToShow) * (cardWidth + 32);
      const translateX = Math.max(Math.min(currentPosition, 0), maxPosition);

      carouselTrack.style.transform = `translateX(${translateX}px)`;

        prevButton.disabled = currentPosition >= 0;
        nextButton.disabled = currentPosition <= maxPosition;
    }


    function initializeCarousel() {
        if (carouselTrack.children.length > 0) {
            cardWidth = carouselTrack.children[0].offsetWidth;
            updateCarousel();
        }
            window.addEventListener('resize', debounce(updateCarousel, 250));
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    prevButton.addEventListener('click', () => {
      currentPosition += cardWidth + 32;
      updateCarousel();
    });

    nextButton.addEventListener('click', () => {
        currentPosition -= cardWidth + 32;
        updateCarousel();
    });



    carouselContainer.appendChild(prevButton);
    carouselContainer.appendChild(nextButton);
    resultsContainer.appendChild(carouselContainer);

    initializeCarousel()
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

async function handleWishlistAdd(product, token) {
    try {
        const response = await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                item_name: product.name,
                item_description: product.description || '',
                item_price: product.price?.value?.current || 0,
                item_url: product.link,
                item_image: product.imageUrl || '',
                item_brand: product.brand || '',
                item_category: product.category || ''
            })
        });

        if (response.ok) {
            alert('Item added to wishlist successfully!');
        } else if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        } else {
            const error = await response.json();
            alert(`Failed to add item to wishlist: ${error.detail}`);
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        alert('Failed to add item to wishlist. Please try again.');
    }
}

async function handleClosetAdd(product, token) {
    try {
        const response = await fetch('/api/closet/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                item_name: product.name,
                item_description: product.description || '',
                item_price: product.price?.value?.current || 0,
                item_url: product.link,
                item_image: product.imageUrl || '',
                item_brand: product.brand || '',
                item_category: product.category || ''
            })
        });

        if (response.ok) {
            alert('Item added to closet successfully!');
        } else if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        } else {
            const error = await response.json();
            alert(`Failed to add item to closet: ${error.detail}`);
        }
    } catch (error) {
        console.error('Error adding to closet:', error);
        alert('Failed to add item to closet. Please try again.');
    }
}

init(); 