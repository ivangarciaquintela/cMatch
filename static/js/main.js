// State management
let currentUser = null;
let authToken = null;

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const mainContent = document.getElementById('mainContent');

// Event Listeners
loginBtn.addEventListener('click', () => showForm('login'));
registerBtn.addEventListener('click', () => showForm('register'));
logoutBtn.addEventListener('click', handleLogout);

// Show/Hide Forms
function showForm(formType) {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    mainContent.classList.add('hidden');

    if (formType === 'login') {
        loginForm.classList.remove('hidden');
    } else if (formType === 'register') {
        registerForm.classList.remove('hidden');
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            await getCurrentUser();
            showMainContent();
        } else {
            alert('Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login.');
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            alert('Registration successful! Please login.');
            showForm('login');
        } else {
            alert('Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration.');
    }
}

// Handle Search
async function handleSearch() {
    const query = document.getElementById('searchQuery').value;
    const brand = document.getElementById('searchBrand').value;

    try {
        const response = await fetch('/search/products/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
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
            updateSearchHistory(query);
        } else {
            alert('Search failed. Please try again.');
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('An error occurred during search.');
    }
}

// Display Search Results
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';

    results.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <p>Price: ${product.price}</p>
            <button onclick="addToWishlist(${product.id})">Add to Wishlist</button>
        `;
        resultsContainer.appendChild(productElement);
    });
}

// Handle Logout
function handleLogout() {
    authToken = null;
    currentUser = null;
    showForm('login');
    updateNavigation();
}

// Update Navigation
function updateNavigation() {
    if (currentUser) {
        loginBtn.classList.add('hidden');
        registerBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        loginBtn.classList.remove('hidden');
        registerBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
    }
}

// Show Main Content
function showMainContent() {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    mainContent.classList.remove('hidden');
    updateNavigation();
}

// Get Current User
async function getCurrentUser() {
    try {
        const response = await fetch('/users/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (response.ok) {
            currentUser = await response.json();
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

// Initialize the app
function init() {
    updateNavigation();
    if (!currentUser) {
        showForm('login');
    }
}

init(); 