
// Configuration
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE'; // You'll get this from Google Apps Script

// Global Variables
let villas = [];
let currentUser = null;
let isAdminLoggedIn = false;
let currentVillaId = null;

// Sample data (fallback if Google Sheets is not set up)
const sampleVillas = [
    {
        id: 1,
        name: "Mountain View Retreat",
        place: "Aspen, Colorado",
        price: 65000,
        image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        images: [
            "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        ],
        features: ["Swimming Pool", "Mountain View", "Fireplace", "3 Bedrooms", "Hot Tub"],
        safety: ["24/7 Security", "Smoke Detectors", "First Aid Kit"],
        reviews: [
            {name: "Sarah Johnson", date: "May 2023", rating: 5, text: "Absolutely stunning villa!"}
        ]
    },
    {
        id: 2,
        name: "Lakefront Paradise",
        place: "Lake Tahoe, California",
        price: 75000,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        images: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
        ],
        features: ["Lake View", "Private Dock", "Boating", "4 Bedrooms"],
        safety: ["Security Cameras", "Fire Alarm System", "First Aid Kit"],
        reviews: [
            {name: "Jennifer Lee", date: "June 2023", rating: 5, text: "Perfect lakefront location!"}
        ]
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadVillas();
    setupEventListeners();
    updateUserUI();
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isAdminLoggedIn = currentUser.isAdmin || false;
        updateUserUI();
    }
});

// ========== GOOGLE SHEETS API FUNCTIONS ==========

// Load villas from Google Sheets
async function loadVillas() {
    try {
        // Try to load from Google Sheets
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getVillas`);
            if (response.ok) {
                const data = await response.json();
                villas = data.villas || [];
            }
        }
        
        // If no villas loaded, use sample data
        if (!villas || villas.length === 0) {
            villas = [...sampleVillas];
            showNotification('Using sample data. Set up Google Sheets for live data.', 'info');
        }
        
        renderVillaCards();
    } catch (error) {
        console.error('Error loading villas:', error);
        villas = [...sampleVillas];
        renderVillaCards();
        showNotification('Using sample data. Set up Google Sheets for live data.', 'info');
    }
}

// Save villa to Google Sheets
async function saveVilla(villaData) {
    try {
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveVilla',
                    data: villaData
                })
            });
            
            if (response.ok) {
                return await response.json();
            }
        }
        
        // If Google Sheets not set up, use local storage
        return saveVillaToLocal(villaData);
    } catch (error) {
        console.error('Error saving villa:', error);
        return saveVillaToLocal(villaData);
    }
}

// Save villa to local storage (fallback)
function saveVillaToLocal(villaData) {
    if (villaData.id) {
        // Update existing villa
        const index = villas.findIndex(v => v.id === villaData.id);
        if (index !== -1) {
            villas[index] = { ...villas[index], ...villaData };
        }
    } else {
        // Add new villa
        const newId = villas.length > 0 ? Math.max(...villas.map(v => v.id)) + 1 : 1;
        villaData.id = newId;
        villas.push(villaData);
    }
    
    // Save to localStorage
    localStorage.setItem('villas', JSON.stringify(villas));
    
    return { success: true, id: villaData.id };
}

// Register user
async function registerUser(userData) {
    try {
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'registerUser',
                    data: userData
                })
            });
            
            if (response.ok) {
                return await response.json();
            }
        }
        
        // If Google Sheets not set up, use local storage
        return registerUserLocal(userData);
    } catch (error) {
        console.error('Error registering user:', error);
        return registerUserLocal(userData);
    }
}

// Register user locally
function registerUserLocal(userData) {
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.email === userData.email)) {
        throw new Error('User with this email already exists');
    }
    
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        ...userData,
        isAdmin: false,
        bookings: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return {
        user: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            phone: newUser.phone,
            isAdmin: false
        }
    };
}

// Login user
async function loginUser(email, password) {
    try {
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'loginUser',
                    email: email,
                    password: password
                })
            });
            
            if (response.ok) {
                return await response.json();
            }
        }
        
        // If Google Sheets not set up, use local storage
        return loginUserLocal(email, password);
    } catch (error) {
        console.error('Error logging in:', error);
        return loginUserLocal(email, password);
    }
}

// Login user locally
function loginUserLocal(email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        throw new Error('Invalid email or password');
    }
    
    return {
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin || false
        }
    };
}

// Admin login
function adminLogin(username, password) {
    if (username === 'admin' && password === 'admin123') {
        return {
            user: {
                id: 0,
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@luxuryvillas.com',
                phone: '1234567890',
                isAdmin: true
            }
        };
    }
    throw new Error('Invalid admin credentials');
}

// Create booking
async function createBooking(bookingData) {
    try {
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'createBooking',
                    data: bookingData
                })
            });
            
            if (response.ok) {
                return await response.json();
            }
        }
        
        // If Google Sheets not set up, use local storage
        return createBookingLocal(bookingData);
    } catch (error) {
        console.error('Error creating booking:', error);
        return createBookingLocal(bookingData);
    }
}

// Create booking locally
function createBookingLocal(bookingData) {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
    
    const newBooking = {
        id: newId,
        ...bookingData,
        status: 'confirmed',
        bookingDate: new Date().toISOString().split('T')[0]
    };
    
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    return newBooking;
}

// ========== UI FUNCTIONS ==========

// Render Villa Cards
function renderVillaCards() {
    const villasContainer = document.getElementById('villas-container');
    if (!villasContainer) return;
    
    villasContainer.innerHTML = '';
    
    if (villas.length === 0) {
        villasContainer.innerHTML = '<p class="no-villas">No villas available at the moment.</p>';
        return;
    }
    
    villas.forEach(villa => {
        const card = document.createElement('div');
        card.className = 'villa-card';
        card.innerHTML = `
            <img src="${villa.image}" alt="${villa.name}" class="villa-img">
            <div class="villa-info">
                <h3 class="villa-name">${villa.name}</h3>
                <p class="villa-place">${villa.place}</p>
                <div class="villa-features">
                    ${(villa.features || []).slice(0, 3).map(feature => `<span>${feature}</span>`).join('')}
                </div>
                <div class="villa-price">
                    <div class="price">₹${villa.price.toLocaleString('en-IN')} <span>/ night</span></div>
                    <button class="btn view-details" data-id="${villa.id}">View Details</button>
                </div>
            </div>
        `;
        villasContainer.appendChild(card);
    });
    
    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const villaId = parseInt(this.getAttribute('data-id'));
            showVillaDetails(villaId);
        });
    });
}

// Show Villa Details
function showVillaDetails(villaId) {
    const villa = villas.find(v => v.id === villaId);
    if (!villa) return;
    
    currentVillaId = villaId;
    
    // Update main content
    document.getElementById('detail-title').textContent = villa.name;
    document.getElementById('detail-location').textContent = villa.place;
    document.getElementById('detail-price').innerHTML = `₹${villa.price.toLocaleString('en-IN')} <span>/ night</span>`;
    document.getElementById('main-image').src = villa.image;
    
    // Update thumbnails
    const thumbnailContainer = document.getElementById('thumbnail-container');
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        const images = villa.images || [villa.image];
        
        images.forEach((img, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = img;
            thumbnail.alt = `${villa.name} - Image ${index + 1}`;
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.addEventListener('click', function() {
                document.getElementById('main-image').src = img;
                document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
                this.classList.add('active');
            });
            thumbnailContainer.appendChild(thumbnail);
        });
    }
    
    // Update features
    const featuresContainer = document.getElementById('features-container');
    if (featuresContainer) {
        featuresContainer.innerHTML = '';
        (villa.features || []).forEach(feature => {
            const featureItem = document.createElement('div');
            featureItem.className = 'feature-item';
            featureItem.innerHTML = `
                <div class="feature-icon"><i class="fas fa-check-circle"></i></div>
                <div>${feature}</div>
            `;
            featuresContainer.appendChild(featureItem);
        });
    }
    
    // Show detail page and hide main section
    document.getElementById('villa-detail').style.display = 'block';
    document.getElementById('villas').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Update User UI
function updateUserUI() {
    const userActionsContainer = document.getElementById('user-actions-container');
    if (!userActionsContainer) return;
    
    if (currentUser) {
        userActionsContainer.innerHTML = `
            <span>Welcome, ${currentUser.firstName}</span>
            ${!currentUser.isAdmin ? '<a href="#" id="user-bookings-btn">My Bookings</a>' : ''}
            <a href="#" id="logout-user">Logout</a>
            ${currentUser.isAdmin ? '<a href="#" class="admin-btn" id="admin-dashboard-btn">Admin Dashboard</a>' : ''}
        `;
        
        // Save user to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('logout-user')?.addEventListener('click', logoutUser);
            document.getElementById('admin-dashboard-btn')?.addEventListener('click', showAdminDashboard);
            document.getElementById('user-bookings-btn')?.addEventListener('click', showUserBookings);
        }, 100);
        
    } else {
        userActionsContainer.innerHTML = `
            <a href="#" id="register-btn">Register</a>
            <a href="#" id="login-btn">Login</a>
            <a href="#" class="admin-btn" id="admin-login-btn">Admin</a>
        `;
        
        // Remove user from localStorage
        localStorage.removeItem('currentUser');
    }
}

// Logout User
function logoutUser() {
    currentUser = null;
    isAdminLoggedIn = false;
    updateUserUI();
    showNotification('Logged out successfully', 'success');
    
    // Hide admin dashboard if visible
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('villas').style.display = 'block';
}

// Show Admin Dashboard
function showAdminDashboard() {
    document.getElementById('villa-detail').style.display = 'none';
    document.getElementById('villas').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    // Load admin villas table
    renderAdminVillasTable();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Render Admin Villas Table
function renderAdminVillasTable() {
    const tableBody = document.getElementById('admin-villas-table');
    const table = document.querySelector('.admin-table table');
    const loading = document.querySelector('.loading-villas');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (villas.length === 0) {
        if (loading) loading.textContent = 'No villas found';
        if (table) table.style.display = 'none';
        return;
    }
    
    villas.forEach(villa => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${villa.id}</td>
            <td>${villa.name}</td>
            <td>${villa.place}</td>
            <td>₹${villa.price.toLocaleString('en-IN')}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit-btn" data-id="${villa.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${villa.id}">Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    if (loading) loading.style.display = 'none';
    if (table) table.style.display = 'table';
    
    // Add event listeners
    setTimeout(() => {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const villaId = parseInt(this.getAttribute('data-id'));
                showVillaModal(villaId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const villaId = parseInt(this.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this villa?')) {
                    deleteVilla(villaId);
                }
            });
        });
    }, 100);
}

// Show Villa Modal
function showVillaModal(villaId = null) {
    const isEditing = villaId !== null;
    
    if (isEditing) {
        const villa = villas.find(v => v.id === villaId);
        if (villa) {
            document.getElementById('villa-modal-title').textContent = 'Edit Villa';
            document.getElementById('villa-id').value = villa.id;
            document.getElementById('villa-name').value = villa.name;
            document.getElementById('villa-location').value = villa.place;
            document.getElementById('villa-price').value = villa.price;
            document.getElementById('villa-image').value = villa.image;
            document.getElementById('villa-images').value = (villa.images || []).join(', ');
            document.getElementById('villa-features').value = (villa.features || []).join(', ');
            document.getElementById('villa-safety').value = (villa.safety || []).join(', ');
            document.getElementById('villa-description').value = villa.description || '';
            document.getElementById('villa-submit-btn').textContent = 'Update Villa';
        }
    } else {
        document.getElementById('villa-modal-title').textContent = 'Add New Villa';
        document.getElementById('villa-form').reset();
        document.getElementById('villa-id').value = '';
        document.getElementById('villa-submit-btn').textContent = 'Add Villa';
    }
    
    document.getElementById('villa-modal').style.display = 'flex';
}

// Delete Villa
async function deleteVilla(villaId) {
    try {
        // Remove from local array
        villas = villas.filter(v => v.id !== villaId);
        
        // Update UI
        renderVillaCards();
        renderAdminVillasTable();
        
        // Save to localStorage
        localStorage.setItem('villas', JSON.stringify(villas));
        
        showNotification('Villa deleted successfully', 'success');
    } catch (error) {
        showNotification('Error deleting villa', 'danger');
    }
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobile-menu')?.addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('active');
        document.querySelector('.user-actions').classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelector('.nav-links').classList.remove('active');
            document.querySelector('.user-actions').classList.remove('active');
        });
    });
    
    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
    
    // Back to villas button
    document.getElementById('back-to-villas')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('villa-detail').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'none';
        document.getElementById('villas').style.display = 'block';
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
    
    // Book villa button
    document.getElementById('book-villa-btn')?.addEventListener('click', function() {
        if (!currentUser) {
            showNotification('Please login or register to book a villa', 'danger');
            showLoginModal();
        } else {
            showBookingModal();
        }
    });
    
    // Registration form
    document.getElementById('registration-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userData = {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('password').value,
            address: document.getElementById('address').value,
            idProof: document.getElementById('id-proof').value
        };
        
        // Validate passwords match
        if (userData.password !== document.getElementById('confirm-password').value) {
            showNotification('Passwords do not match', 'danger');
            return;
        }
        
        try {
            const result = await registerUser(userData);
            currentUser = result.user;
            isAdminLoggedIn = false;
            
            updateUserUI();
            closeModal('registration-modal');
            showNotification('Registration successful! Welcome to Luxury Villas.', 'success');
        } catch (error) {
            showNotification(error.message, 'danger');
        }
    });
    
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const result = await loginUser(email, password);
            currentUser = result.user;
            isAdminLoggedIn = currentUser.isAdmin || false;
            
            updateUserUI();
            closeModal('login-modal');
            showNotification('Login successful!', 'success');
        } catch (error) {
            showNotification(error.message, 'danger');
        }
    });
    
    // Admin login form
    document.getElementById('admin-login-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        try {
            const result = adminLogin(username, password);
            currentUser = result.user;
            isAdminLoggedIn = true;
            
            updateUserUI();
            closeModal('admin-login-modal');
            showAdminDashboard();
            showNotification('Admin login successful!', 'success');
        } catch (error) {
            showNotification(error.message, 'danger');
        }
    });
    
    // Booking form
    document.getElementById('booking-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const villa = villas.find(v => v.id === currentVillaId);
        const checkIn = document.getElementById('check-in').value;
        const checkOut = document.getElementById('check-out').value;
        const guests = document.getElementById('guests').value;
        const specialRequests = document.getElementById('special-requests').value;
        
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const diffTime = Math.abs(checkOutDate - checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalPrice = villa.price * diffDays;
        
        const bookingData = {
            userId: currentUser.id,
            villaId: currentVillaId,
            villaName: villa.name,
            checkIn,
            checkOut,
            guests,
            specialRequests,
            totalPrice
        };
        
        try {
            await createBooking(bookingData);
            closeModal('booking-modal');
            showNotification(`Booking confirmed for ${villa.name}! Total: ₹${totalPrice.toLocaleString('en-IN')}`, 'success');
        } catch (error) {
            showNotification('Error creating booking', 'danger');
        }
    });
    
    // Villa form
    document.getElementById('villa-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const villaData = {
            id: document.getElementById('villa-id').value ? parseInt(document.getElementById('villa-id').value) : null,
            name: document.getElementById('villa-name').value,
            location: document.getElementById('villa-location').value,
            price: parseInt(document.getElementById('villa-price').value),
            image: document.getElementById('villa-image').value,
            images: document.getElementById('villa-images').value.split(',').map(img => img.trim()).filter(img => img),
            features: document.getElementById('villa-features').value.split(',').map(f => f.trim()).filter(f => f),
            safety: document.getElementById('villa-safety').value.split(',').map(s => s.trim()).filter(s => s),
            description: document.getElementById('villa-description').value
        };
        
        try {
            await saveVilla(villaData);
            await loadVillas(); // Reload villas
            closeModal('villa-modal');
            showNotification('Villa saved successfully', 'success');
        } catch (error) {
            showNotification('Error saving villa', 'danger');
        }
    });
    
    // Modal close buttons
    document.getElementById('close-registration')?.addEventListener('click', () => closeModal('registration-modal'));
    document.getElementById('close-login')?.addEventListener('click', () => closeModal('login-modal'));
    document.getElementById('close-admin-login')?.addEventListener('click', () => closeModal('admin-login-modal'));
    document.getElementById('close-booking')?.addEventListener('click', () => closeModal('booking-modal'));
    document.getElementById('close-villa-modal')?.addEventListener('click', () => closeModal('villa-modal'));
    
    // Switch between login and registration
    document.getElementById('show-login-from-reg')?.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal('registration-modal');
        showModal('login-modal');
    });
    
    document.getElementById('show-register-from-login')?.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal('login-modal');
        showModal('registration-modal');
    });
    
    // Admin dashboard buttons
    document.getElementById('logout-admin')?.addEventListener('click', logoutUser);
    document.getElementById('add-villa-btn')?.addEventListener('click', () => showVillaModal());
    document.getElementById('back-to-home-admin')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('admin-dashboard').style.display = 'none';
        document.getElementById('villas').style.display = 'block';
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
    
    // View My Bookings button
    document.getElementById('user-view-bookings-btn')?.addEventListener('click', function() {
        closeModal('login-modal');
        showUserBookings();
    });
    
    // Booking date calculations
    document.getElementById('check-in')?.addEventListener('change', function() {
        const checkIn = this.value;
        const checkOut = document.getElementById('check-out');
        if (checkOut) checkOut.min = checkIn;
        calculateBookingPrice();
    });
    
    document.getElementById('check-out')?.addEventListener('change', calculateBookingPrice);
    
    // Initial button event listeners
    setTimeout(() => {
        document.getElementById('register-btn')?.addEventListener('click', showRegistrationModal);
        document.getElementById('login-btn')?.addEventListener('click', showLoginModal);
        document.getElementById('admin-login-btn')?.addEventListener('click', showAdminLoginModal);
    }, 100);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Back to top button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('active');
            } else {
                backToTopBtn.classList.remove('active');
            }
        });
        
        backToTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    }
}

// ========== MODAL FUNCTIONS ==========

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showRegistrationModal(e) {
    if (e) e.preventDefault();
    showModal('registration-modal');
}

function showLoginModal(e) {
    if (e) e.preventDefault();
    showModal('login-modal');
}

function showAdminLoginModal(e) {
    if (e) e.preventDefault();
    showModal('admin-login-modal');
}

function showBookingModal() {
    const villa = villas.find(v => v.id === currentVillaId);
    if (!villa) return;
    
    // Set today's date as min for check-in
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('check-in').min = today;
    document.getElementById('check-in').value = today;
    
    // Set villa name
    document.getElementById('booking-villa-name').value = villa.name;
    
    // Calculate price
    calculateBookingPrice();
    
    showModal('booking-modal');
}

function calculateBookingPrice() {
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const diffTime = Math.abs(checkOutDate - checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            const villa = villas.find(v => v.id === currentVillaId);
            if (villa) {
                const totalPrice = villa.price * diffDays;
                document.getElementById('total-price').value = `₹${totalPrice.toLocaleString('en-IN')} for ${diffDays} night(s)`;
            }
        }
    }
}

// ========== NOTIFICATION ==========

function showNotification(message, type) {
    // Remove any existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#dc3545'};
        color: ${type === 'warning' ? '#333' : 'white'};
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== USER BOOKINGS ==========

function showUserBookings() {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const userBookings = bookings.filter(b => b.userId === currentUser.id);
    
    if (userBookings.length === 0) {
        showNotification('No bookings found', 'warning');
        return;
    }
    
    let bookingsHTML = '<div class="bookings-list">';
    userBookings.forEach(booking => {
        bookingsHTML += `
            <div class="booking-card">
                <div class="booking-header">
                    <h3>${booking.villaName}</h3>
                    <span class="booking-status ${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-details">
                    <p><strong>Check-in:</strong> ${booking.checkIn}</p>
                    <p><strong>Check-out:</strong> ${booking.checkOut}</p>
                    <p><strong>Guests:</strong> ${booking.guests}</p>
                    <p><strong>Total Price:</strong> ₹${booking.totalPrice.toLocaleString('en-IN')}</p>
                </div>
            </div>
        `;
    });
    bookingsHTML += '</div>';
    
    // Create modal
    const modalHTML = `
        <div class="modal" id="user-bookings-modal">
            <div class="modal-content modal-large">
                <span class="close-modal" id="close-user-bookings">&times;</span>
                <h2>My Bookings</h2>
                ${bookingsHTML}
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    document.getElementById('user-bookings-modal').style.display = 'flex';
    
    // Add close event
    document.getElementById('close-user-bookings').addEventListener('click', () => {
        document.getElementById('user-bookings-modal').remove();
    });
    
    // Close when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.id === 'user-bookings-modal') {
            document.getElementById('user-bookings-modal').remove();
        }
    });
}