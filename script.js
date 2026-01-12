// Configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUrb178Ikpx_Tklo8t08GxCklI_7X369teWnd_bPqzAWTALNi7ts2K51dmx01qwKA2-Q/exec';

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
            villaData.createdAt = new Date().toISOString();
            villaData.reviews = villaData.reviews || [];
            villas.push(villaData);
        }
        
        // Save to localStorage
        saveVillasToLocalStorage();
        
        // Update UI
        renderVillaCards();
        renderAdminVillasTable();
        
        return { success: true, id: villaData.id };
        
    } catch (error) {
        throw error;
    }
}

// Delete villa
function deleteVilla(villaId) {
    if (!confirm('Are you sure you want to delete this villa?')) return;
    
    // Remove villa from array
    villas = villas.filter(v => v.id !== villaId);
    
    // Save to localStorage
    saveVillasToLocalStorage();
    
    // Update UI
    renderVillaCards();
    renderAdminVillasTable();
    
    showNotification('Villa deleted successfully', 'success');
}

// ========== MODAL FUNCTIONS ==========

// Show registration modal
function showRegistrationModal(e) {
    if (e) e.preventDefault();
    showModal('registration-modal');
}

// Show login modal
function showLoginModal(e) {
    if (e) e.preventDefault();
    showModal('login-modal');
}

// Show admin login modal
function showAdminLoginModal(e) {
    if (e) e.preventDefault();
    showModal('admin-login-modal');
}

// Show booking modal
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

// Show villa modal (add/edit)
function showVillaModal(villaId = null) {
    if (villaId) {
        // Edit mode
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
        // Add mode
        document.getElementById('villa-modal-title').textContent = 'Add New Villa';
        document.getElementById('villa-form').reset();
        document.getElementById('villa-id').value = '';
        document.getElementById('villa-submit-btn').textContent = 'Add Villa';
    }
    
    showModal('villa-modal');
}

// Show admin dashboard
function showAdminDashboard() {
    document.getElementById('villa-detail').style.display = 'none';
    document.getElementById('villas').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    // Load admin data
    renderAdminVillasTable();
    
    // Scroll to top
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Show user bookings
function showUserBookings() {
    if (!currentUser) return;
    
    const userBookings = getUserBookings(currentUser.id);
    
    if (userBookings.length === 0) {
        showNotification('You have no bookings yet.', 'info');
        return;
    }
    
    // Create bookings list HTML
    let bookingsHTML = '<div class="bookings-list">';
    userBookings.forEach(booking => {
        bookingsHTML += `
            <div class="booking-card">
                <div class="booking-header">
                    <h3>${booking.villaName}</h3>
                    <span class="booking-status ${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-details">
                    <p><strong>Booking ID:</strong> #${booking.id.toString().padStart(3, '0')}</p>
                    <p><strong>Check-in:</strong> ${booking.checkIn}</p>
                    <p><strong>Check-out:</strong> ${booking.checkOut}</p>
                    <p><strong>Guests:</strong> ${booking.guests}</p>
                    <p><strong>Total Price:</strong> ₹${booking.totalPrice.toLocaleString('en-IN')}</p>
                    <p><strong>Status:</strong> ${booking.status}</p>
                </div>
            </div>
        `;
    });
    bookingsHTML += '</div>';
    
    // Create and show modal
    const modalHTML = `
        <div class="modal" id="user-bookings-modal">
            <div class="modal-content modal-large">
                <span class="close-modal" id="close-user-bookings">&times;</span>
                <h2>My Bookings</h2>
                ${bookingsHTML}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    showModal('user-bookings-modal');
    
    // Add close handler
    document.getElementById('close-user-bookings').addEventListener('click', () => {
        closeModal('user-bookings-modal');
        document.getElementById('user-bookings-modal').remove();
    });
}

// Show modal by ID
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

// Close modal by ID
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
}

// Calculate booking price based on dates
function calculateBookingPrice() {
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    
    if (checkIn && checkOut) {
        const villa = villas.find(v => v.id === currentVillaId);
        if (villa) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const diffTime = Math.abs(checkOutDate - checkInDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
                const totalPrice = villa.price * diffDays;
                document.getElementById('total-price').value = `₹${totalPrice.toLocaleString('en-IN')} for ${diffDays} night(s)`;
            }
        }
    }
}

// ========== EVENT LISTENERS ==========

// Setup all event listeners
function setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobile-menu')?.addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('active');
        document.querySelector('.user-actions').classList.toggle('active');
    });
    
    // Close mobile menu when clicking links
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
            showNotification('Please login or register to book a villa', 'warning');
            showLoginModal();
        } else {
            showBookingModal();
        }
    });
    
    // Registration form
    document.getElementById('registration-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userData = {
            firstName: document.getElementById('first-name').value.trim(),
            lastName: document.getElementById('last-name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirm-password').value,
            address: document.getElementById('address').value.trim(),
            idProof: document.getElementById('id-proof').value.trim()
        };
        
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
        
        const email = document.getElementById('login-email').value.trim();
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
        
        const username = document.getElementById('admin-username').value.trim();
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
        if (!villa || !currentUser) return;
        
        const checkIn = document.getElementById('check-in').value;
        const checkOut = document.getElementById('check-out').value;
        const guests = document.getElementById('guests').value;
        const specialRequests = document.getElementById('special-requests').value;
        
        // Calculate price
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
            showNotification('Error creating booking: ' + error.message, 'danger');
        }
    });
    
    // Villa form (add/edit)
    document.getElementById('villa-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const villaData = {
            id: document.getElementById('villa-id').value ? parseInt(document.getElementById('villa-id').value) : null,
            name: document.getElementById('villa-name').value.trim(),
            location: document.getElementById('villa-location').value.trim(),
            price: parseInt(document.getElementById('villa-price').value) || 0,
            image: document.getElementById('villa-image').value.trim(),
            images: document.getElementById('villa-images').value.split(',').map(img => img.trim()).filter(img => img),
            features: document.getElementById('villa-features').value.split(',').map(f => f.trim()).filter(f => f),
            safety: document.getElementById('villa-safety').value.split(',').map(s => s.trim()).filter(s => s),
            description: document.getElementById('villa-description').value.trim()
        };
        
        try {
            await saveVilla(villaData);
            closeModal('villa-modal');
            showNotification('Villa saved successfully!', 'success');
        } catch (error) {
            showNotification('Error saving villa: ' + error.message, 'danger');
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
    
    // View My Bookings button in login modal
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
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Admin management buttons
    setTimeout(() => {
        document.getElementById('admin-manage-bookings-btn')?.addEventListener('click', showAdminManageBookings);
        document.getElementById('admin-manage-users-btn')?.addEventListener('click', showAdminManageUsers);
    }, 1000);
}

// ========== UTILITY FUNCTIONS ==========

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : type === 'danger' ? '#dc3545' : '#17a2b8'};
        color: ${type === 'warning' ? '#333' : 'white'};
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Setup back to top button
function setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
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

// ========== ADMIN MANAGEMENT FUNCTIONS ==========

// Show admin manage bookings
function showAdminManageBookings() {
    try {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        
        if (bookings.length === 0) {
            showNotification('No bookings found', 'info');
            return;
        }
        
        let bookingsHTML = '<table><thead><tr><th>ID</th><th>User ID</th><th>Villa</th><th>Check-in</th><th>Check-out</th><th>Guests</th><th>Price</th><th>Status</th></tr></thead><tbody>';
        
        bookings.forEach(booking => {
            bookingsHTML += `
                <tr>
                    <td>#${booking.id.toString().padStart(3, '0')}</td>
                    <td>${booking.userId}</td>
                    <td>${booking.villaName}</td>
                    <td>${booking.checkIn}</td>
                    <td>${booking.checkOut}</td>
                    <td>${booking.guests}</td>
                    <td>₹${booking.totalPrice?.toLocaleString('en-IN') || '0'}</td>
                    <td><span class="booking-status ${booking.status}">${booking.status}</span></td>
                </tr>
            `;
        });
        
        bookingsHTML += '</tbody></table>';
        
        // Create modal
        const modalHTML = `
            <div class="modal" id="admin-bookings-modal">
                <div class="modal-content modal-large">
                    <span class="close-modal" id="close-admin-bookings">&times;</span>
                    <h2>Manage Bookings</h2>
                    <div class="admin-table">
                        <h3>All Bookings (${bookings.length})</h3>
                        ${bookingsHTML}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        showModal('admin-bookings-modal');
        
        // Add close handler
        document.getElementById('close-admin-bookings').addEventListener('click', () => {
            closeModal('admin-bookings-modal');
            document.getElementById('admin-bookings-modal').remove();
        });
        
    } catch (error) {
        showNotification('Error loading bookings: ' + error.message, 'danger');
    }
}

// Show admin manage users
function showAdminManageUsers() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.length === 0) {
            showNotification('No users found', 'info');
            return;
        }
        
        let usersHTML = '<table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Bookings</th><th>Role</th></tr></thead><tbody>';
        
        users.forEach(user => {
            usersHTML += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>${user.bookings?.length || 0}</td>
                    <td><span class="user-role ${user.isAdmin ? 'admin' : 'user'}">${user.isAdmin ? 'Admin' : 'User'}</span></td>
                </tr>
            `;
        });
        
        usersHTML += '</tbody></table>';
        
        // Create modal
        const modalHTML = `
            <div class="modal" id="admin-users-modal">
                <div class="modal-content modal-large">
                    <span class="close-modal" id="close-admin-users">&times;</span>
                    <h2>Manage Users</h2>
                    <div class="admin-table">
                        <h3>All Users (${users.length})</h3>
                        ${usersHTML}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        showModal('admin-users-modal');
        
        // Add close handler
        document.getElementById('close-admin-users').addEventListener('click', () => {
            closeModal('admin-users-modal');
            document.getElementById('admin-users-modal').remove();
        });
        
    } catch (error) {
        showNotification('Error loading users: ' + error.message, 'danger');
    }
}

// ========== ANIMATION KEYFRAMES ==========

// Add CSS keyframes for notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize
console.log('Luxury Villas - Application Initialized Successfully');
