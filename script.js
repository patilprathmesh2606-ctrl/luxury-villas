// Configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyYFI6zP4Q5V5SECoXpf94IBJJvi7HxVSsxNTllXdV87clPcA8tVpIaPctdyjzr_wSVzg/exec';

// Global Variables
let villas = [];
let currentUser = null;
let isAdminLoggedIn = false;
let currentVillaId = null;

// Sample Data (Fallback)
const SAMPLE_VILLAS = [
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
        ],
        createdAt: "2023-01-15T10:30:00.000Z"
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
        ],
        createdAt: "2023-02-20T14:45:00.000Z"
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Luxury Villas - Application Starting...');
    
    // Initialize data
    loadVillas();
    setupEventListeners();
    updateUserUI();
    
    // Check for saved user session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            isAdminLoggedIn = currentUser.isAdmin || false;
            updateUserUI();
            showNotification(`Welcome back, ${currentUser.firstName}!`, 'success');
        } catch (e) {
            console.error('Error parsing saved user:', e);
        }
    }
    
    // Set up back to top button
    setupBackToTop();
});

// ========== DATA LOADING FUNCTIONS ==========

// Load villas from localStorage or sample data
async function loadVillas() {
    console.log('Loading villas...');
    
    // First try Google Sheets
    await loadVillasFromGoogleSheets();
    
    // If no villas loaded, try localStorage
    if (villas.length === 0) {
        loadVillasFromLocalStorage();
    }
    
    // If still no villas, use sample data
    if (villas.length === 0) {
        villas = [...SAMPLE_VILLAS];
        saveVillasToLocalStorage();
        showNotification('Using sample villas', 'info');
    }
    
    // Render the villas
    renderVillaCards();
    renderAdminVillasTable();
}

// Load villas from Google Sheets (optional)
async function loadVillasFromGoogleSheets() {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getVillas&timestamp=${Date.now()}`);
        const data = await response.json();
        
        if (data && data.villas && data.villas.length > 0) {
            villas = data.villas;
            saveVillasToLocalStorage();
            console.log(`Loaded ${villas.length} villas from Google Sheets`);
        }
    } catch (error) {
        console.log('Google Sheets not available, using local storage');
    }
}

// Load villas from localStorage
function loadVillasFromLocalStorage() {
    try {
        const savedVillas = localStorage.getItem('villas');
        if (savedVillas) {
            villas = JSON.parse(savedVillas);
            console.log(`Loaded ${villas.length} villas from localStorage`);
        }
    } catch (error) {
        console.error('Error loading villas from localStorage:', error);
    }
}

// Save villas to localStorage
function saveVillasToLocalStorage() {
    try {
        localStorage.setItem('villas', JSON.stringify(villas));
    } catch (error) {
        console.error('Error saving villas to localStorage:', error);
    }
}

// ========== UI RENDERING FUNCTIONS ==========

// Render villa cards on homepage
function renderVillaCards() {
    const villasContainer = document.getElementById('villas-container');
    if (!villasContainer) return;
    
    if (villas.length === 0) {
        villasContainer.innerHTML = '<p class="no-villas">No villas available. Please check back later.</p>';
        return;
    }
    
    let html = '';
    villas.forEach(villa => {
        html += `
            <div class="villa-card">
                <img src="${villa.image}" alt="${villa.name}" class="villa-img" onerror="this.src='https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'">
                <div class="villa-info">
                    <h3 class="villa-name">${villa.name}</h3>
                    <p class="villa-place">${villa.place}</p>
                    <div class="villa-features">
                        ${(villa.features || []).slice(0, 3).map(feature => `<span>${feature}</span>`).join('')}
                        ${(villa.features || []).length > 3 ? '<span>+ more</span>' : ''}
                    </div>
                    <div class="villa-price">
                        <div class="price">₹${villa.price.toLocaleString('en-IN')} <span>/ night</span></div>
                        <button class="btn view-details" data-id="${villa.id}">View Details</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    villasContainer.innerHTML = html;
    
    // Add click handlers to view details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const villaId = parseInt(this.getAttribute('data-id'));
            showVillaDetails(villaId);
        });
    });
}

// Show detailed villa view
function showVillaDetails(villaId) {
    const villa = villas.find(v => v.id === villaId);
    if (!villa) return;
    
    currentVillaId = villaId;
    
    // Update villa details
    document.getElementById('detail-title').textContent = villa.name;
    document.getElementById('detail-location').textContent = villa.place;
    document.getElementById('detail-price').innerHTML = `₹${villa.price.toLocaleString('en-IN')} <span>/ night</span>`;
    
    // Update images
    const mainImage = document.getElementById('main-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    
    if (mainImage) {
        mainImage.src = villa.image;
        mainImage.alt = villa.name;
    }
    
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        const images = villa.images && villa.images.length > 0 ? villa.images : [villa.image];
        
        images.forEach((img, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = img;
            thumbnail.alt = `${villa.name} - View ${index + 1}`;
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.addEventListener('click', function() {
                if (mainImage) mainImage.src = img;
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
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
                <div class="feature-icon"><i class="fas fa-check"></i></div>
                <div>${feature}</div>
            `;
            featuresContainer.appendChild(featureItem);
        });
    }
    
    // Update safety features
    const safetyContainer = document.getElementById('safety-container');
    if (safetyContainer) {
        safetyContainer.innerHTML = '';
        (villa.safety || []).forEach(safetyItem => {
            const safetyDiv = document.createElement('div');
            safetyDiv.className = 'safety-item';
            safetyDiv.innerHTML = `
                <h4><i class="fas fa-shield-alt"></i> ${safetyItem}</h4>
                <p>For your safety and peace of mind.</p>
            `;
            safetyContainer.appendChild(safetyDiv);
        });
    }
    
    // Update reviews
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
        reviewsContainer.innerHTML = '';
        (villa.reviews || []).forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="review-header">
                    <div class="reviewer">
                        <img src="https://i.pravatar.cc/50?u=${review.name}" alt="${review.name}" class="reviewer-img">
                        <div class="reviewer-info">
                            <h4>${review.name}</h4>
                            <div class="review-date">${review.date}</div>
                        </div>
                    </div>
                    <div class="rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </div>
                <p>${review.text}</p>
            `;
            reviewsContainer.appendChild(reviewCard);
        });
    }
    
    // Show villa detail section and hide others
    document.getElementById('villa-detail').style.display = 'block';
    document.getElementById('villas').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Render admin villas table
function renderAdminVillasTable() {
    const tableBody = document.getElementById('admin-villas-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
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
    
    // Add event listeners to admin buttons
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
                deleteVilla(villaId);
            });
        });
    }, 100);
}

// Update user interface based on login state
function updateUserUI() {
    const userActionsContainer = document.querySelector('.user-actions');
    if (!userActionsContainer) return;
    
    if (currentUser) {
        userActionsContainer.innerHTML = `
            <span style="color: var(--primary); font-weight: 600;">Welcome, ${currentUser.firstName}</span>
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
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('register-btn')?.addEventListener('click', showRegistrationModal);
            document.getElementById('login-btn')?.addEventListener('click', showLoginModal);
            document.getElementById('admin-login-btn')?.addEventListener('click', showAdminLoginModal);
        }, 100);
    }
}

// ========== AUTHENTICATION FUNCTIONS ==========

// Register new user
async function registerUser(userData) {
    try {
        // Check if passwords match
        if (userData.password !== userData.confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if user already exists
        if (users.some(u => u.email === userData.email)) {
            throw new Error('User with this email already exists');
        }
        
        // Create new user
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
            phone: userData.phone,
            address: userData.address,
            idProof: userData.idProof,
            isAdmin: false,
            bookings: [],
            createdAt: new Date().toISOString()
        };
        
        // Save user
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Set as current user
        currentUser = {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            phone: newUser.phone,
            isAdmin: false
        };
        
        isAdminLoggedIn = false;
        
        return { success: true, user: currentUser };
        
    } catch (error) {
        throw error;
    }
}

// Login user
async function loginUser(email, password) {
    try {
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        // Set as current user
        currentUser = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin || false
        };
        
        isAdminLoggedIn = user.isAdmin || false;
        
        return { success: true, user: currentUser };
        
    } catch (error) {
        throw error;
    }
}

// Admin login
function adminLogin(username, password) {
    // Hardcoded admin credentials (for demo)
    if (username === 'admin' && password === 'admin123') {
        currentUser = {
            id: 0,
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@luxuryvillas.com',
            phone: '1234567890',
            isAdmin: true
        };
        
        isAdminLoggedIn = true;
        
        return { success: true, user: currentUser };
    }
    
    throw new Error('Invalid admin credentials');
}

// Logout user
function logoutUser() {
    currentUser = null;
    isAdminLoggedIn = false;
    updateUserUI();
    showNotification('Logged out successfully', 'success');
    
    // Hide admin dashboard if visible
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('villas').style.display = 'block';
}

// ========== BOOKING FUNCTIONS ==========

// Create new booking
async function createBooking(bookingData) {
    try {
        // Get existing bookings
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        
        // Create new booking
        const newBooking = {
            id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1,
            ...bookingData,
            status: 'confirmed',
            bookingDate: new Date().toISOString().split('T')[0]
        };
        
        // Save booking
        bookings.push(newBooking);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Update user's bookings
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === bookingData.userId);
        if (userIndex !== -1) {
            if (!users[userIndex].bookings) {
                users[userIndex].bookings = [];
            }
            users[userIndex].bookings.push(newBooking.id);
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        return { success: true, booking: newBooking };
        
    } catch (error) {
        throw error;
    }
}

// Get user bookings
function getUserBookings(userId) {
    try {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        return bookings.filter(booking => booking.userId === userId);
    } catch (error) {
        console.error('Error getting user bookings:', error);
        return [];
    }
}

// ========== VILLA MANAGEMENT FUNCTIONS ==========

// Save villa (add or edit)
async function saveVilla(villaData) {
    try {
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
            villaD
