// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return null;
    }
    return token;
}

async function loadClosetItems() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch('/api/closet/list', {
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
        console.error('Error loading closet:', error);
    }
}

async function deleteItem(itemId) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`/api/closet/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadClosetItems(); // Reload the list
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
    const container = document.getElementById('closetItems');
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No items in closet</p>';
        return;
    }

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-white shadow rounded-lg p-4 flex justify-between items-center';
        
        const itemInfo = document.createElement('div');
        itemInfo.innerHTML = `
            <h3 class="font-bold">${item.item_name}</h3>
            ${item.item_description ? `<p class="text-gray-600">${item.item_description}</p>` : ''}
            ${item.price ? `<p class="text-gray-800">$${item.price}</p>` : ''}
            <p class="text-gray-500 text-sm">${new Date(item.added_date).toLocaleDateString()}</p>
        `;

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<img src="/static/img/delete.svg" alt="Delete" class="h-6 w-6 fill-current text-black">';
        deleteButton.className = 'bg-white border border-black rounded-full p-1 hover:bg-red-500 hover:text-white'; 
        deleteButton.onclick = () => deleteItem(item.item_id);

        itemElement.appendChild(itemInfo);
        itemElement.appendChild(deleteButton);
        container.appendChild(itemElement);
    });
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadClosetItems();
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});