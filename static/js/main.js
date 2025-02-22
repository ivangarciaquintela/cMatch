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
    const resultsHeader = document.createElement('h2');
    resultsHeader.textContent = 'Results:';  // O "Search Results:" si prefieres
    resultsContainer.appendChild(resultsHeader);

    results.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';

        // Crear el enlace que envuelve todo
        const productLink = document.createElement('a');
        productLink.href = product.link;
        productLink.style.textDecoration = 'none'; // Quita el subrayado predeterminado del enlace
        productLink.style.color = 'inherit'; // Hereda el color del texto del padre (para evitar el azul predeterminado)

        // Construir el contenido HTML del producto
        let productHTML = `
            <h3>${product.name}</h3>
            <p style="font-weight: bold;">${product.brand.toUpperCase()}</p>
            <p>`;

        // Manejar la estructura del precio
        if (product.price && product.price.value && product.price.value.current !== undefined && product.price.currency) {
            productHTML += `Price: ${product.price.value.current} ${product.price.currency}`;
        } else {
            productHTML += 'Price: N/A'; // Muestra N/A si no hay precio
        }

        productHTML += `</p>
            <button onclick="addToWishlist(${product.id})">Add to Wishlist</button>
        `; // No hay problema con addToWishlist aquí, porque se ejecuta *después* de cargar

        productElement.innerHTML = productHTML;


        // Agregar el contenido del producto al enlace
        productLink.appendChild(productElement);
        // Agregar el enlace al contenedor de resultados
        resultsContainer.appendChild(productLink);


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

async function handleVisualSearch() {
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
    reader.readAsDataURL(file); // Read as Data URL for preview


    const formData = new FormData();  // Use FormData for file uploads
    formData.append('file', file);
    try {
        const response = await fetch('/search/visual/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`  // Send the token!
                // Don't set Content-Type for FormData; browser sets it
            },
            body: formData  // Send FormData
        });


        if (response.ok) {
            const results = await response.json();
            displaySearchResults(results);
        } else if (response.status === 401) {
            alert('Unauthorized. Please log in.'); // Handle unauthorized access
            showForm('login');
        }
         else {
            const errorData = await response.json();
            alert(`Search failed: ${errorData.detail}`);
        }
    } catch (error) {
        console.error('Visual search error:', error);
        alert('An error occurred during visual search.');
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