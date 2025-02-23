// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return null;
    }
    return token;
}

async function loadWishlistItems() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch('/api/wishlist/list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const items = await response.json();
            displayItems(items);
        } else if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
    }
}

async function deleteItem(itemId) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`/api/wishlist/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadWishlistItems(); // Reload the list
        } else {
            const error = await response.json();
            alert(error.detail || 'Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
    }
}
function displayItems(items) {
    const container = document.getElementById('wishlistItems');
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No items in wishlist</p>';
        return;
    }

    // Add a wrapper for the scrolling functionality
    const scrollableWrapper = document.createElement('div');
    scrollableWrapper.className = 'overflow-y-auto max-h-[48rem]'; // Add Tailwind classes for scrolling and max height

    items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-white bg-opacity-80 shadow rounded-lg p-4 flex justify-between items-center mb-4'; // Added mb-4 for spacing between items

        const itemInfo = document.createElement('div');
        itemInfo.innerHTML = `
            <h3 class="font-bold">${item.item_name}</h3>
            ${item.item_description ? `<p class="text-gray-600">${item.item_description}</p>` : ''}
            ${item.price ? `<p class="text-gray-800">$${item.price}</p>` : ''}
            <p class="text-gray-500 text-sm">${new Date(item.added_date).toLocaleDateString()}</p>
        `;

        // --- Image Container ---
        const imageContainer = document.createElement('div');
        imageContainer.className = 'mb-4';

        const productImage = document.createElement('img');
        // Construct the image path dynamically
        productImage.src = `/static/img/prenda_${index + 1}.jpg`; // Use index + 1
        productImage.alt = item.item_name || 'Product Image';
        productImage.className = 'w-full h-48 object-cover rounded-t-lg';
        imageContainer.appendChild(productImage);
        itemElement.appendChild(imageContainer);

        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex gap-2';

        const moveToClosetButton = document.createElement('button');
        moveToClosetButton.innerHTML = '<img src="/static/img/clothes.png" alt="Move to Closet" class="h-6 w-6">'; // Keep image size
        moveToClosetButton.className = 'bg-white border border-black rounded-full hover:bg-gray-200 p-1'; // Style adjustments
        moveToClosetButton.onclick = () => moveToCloset(item);

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<img src="/static/img/delete.svg" alt="Delete" class="h-6 w-6 fill-current text-black">'; // Initial black icon
        deleteButton.className = 'bg-white border border-black rounded-full p-1 hover:bg-red-500 hover:text-white'; // Base and hover styles
        deleteButton.onclick = () => deleteItem(item.item_id);

        buttonsContainer.appendChild(moveToClosetButton);
        buttonsContainer.appendChild(deleteButton);

        itemElement.appendChild(itemInfo);
        itemElement.appendChild(buttonsContainer);
        scrollableWrapper.appendChild(itemElement); // Append to the scrollable wrapper
    });

    container.appendChild(scrollableWrapper); // Append the wrapper to the main container
}

// Add the moveToCloset function
async function moveToCloset(item) {
    const token = checkAuth();
    if (!token) return;

    try {
        // First, add to closet
        const addToClosetResponse = await fetch('/api/closet/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                item_name: item.item_name,
                item_description: item.item_description,
                price: item.price
            })
        });

        if (!addToClosetResponse.ok) {
            const error = await addToClosetResponse.json();
            throw new Error(error.detail || 'Failed to add item to closet');
        }

        // Then, delete from wishlist
        const deleteFromWishlistResponse = await fetch(`/api/wishlist/${item.item_id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!deleteFromWishlistResponse.ok) {
            const error = await deleteFromWishlistResponse.json();
            throw new Error(error.detail || 'Failed to remove item from wishlist');
        }

        // Reload the wishlist
        loadWishlistItems();
        alert('Item moved to closet successfully!');
    } catch (error) {
        console.error('Error moving item to closet:', error);
        alert(error.message || 'Failed to move item to closet');
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadWishlistItems();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});