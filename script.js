// Google Sheets API Configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwkzujgDSl9UDoKwdiGFLH1ibhorHpnGtUNgBCPem8i7M9UaS6-nM3vGcDmhuAU350xGw/exec'; // Replace with your Web App URL

// Global Variables
let villas = [];
let currentUser = null;
let isAdminLoggedIn = false;
let currentVillaId = null;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

async function initializeApp() {
    // Load villas from Google Sheets
    await loadVillasFromGoogleSheets();
    
    // Setup event listeners
    setupEventListeners();
    
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
    
    // Initialize back to top button
    initBackToTop();
}

// ========== GOOGLE SHEETS API FUNCTIONS ==========

// Load villas from Google Sheets
async function loadVillasFromGoogleSheets() {
    try {
        console.log('Loading villas from Google Sheets...');
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getVillas&timestamp=${Date.now()}`);
        const data = await response.json();
        
        if (data && data.villas) {
            villas = data.villas;
            console.log(`Loaded ${villas.length} villas from Google Sheets`);
            renderVillas();
        } else {
            throw new Error('No villas data received');
        }
    } catch (error) {
        console.error('Error loading villas from Google Sheets:', error);
        showNotification('Error loading villas. Using fallback data.', 'danger');
        await loadFallbackData();
    }
}

// Load fallback data if Google Sheets fails
async function loadFallbackData() {
    try {
        const savedVillas = localStorage.getItem('villas');
        if (savedVillas) {
            villas = JSON.parse(savedVillas);
            console.log(`Loaded ${villas.length} villas from localStorage`);
        } else {
            // Use sample data
            villas = [
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
                    description: "A beautiful mountain view villa with all amenities",
                    reviews: [
                        {name: "Sarah Johnson", date: "May 2023", rating: 5, text: "Absolutely stunning villa!"}
                    ],
                    createdAt: "2023-01-15T10:30:00.000Z"
                }
            ];
            localStorage.setItem('villas', JSON.stringify(villas));
        }
        renderVillas();
    } catch (error) {
        console.error('Error loading fallback data:', error);
    }
}

// Register user via Google Sheets
async function registerUserToGoogleSheets(userData) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'registerUser',
                user: userData
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

// Login user via Google Sheets
async function loginUserFromGoogleSheets(email, password) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'loginUser',
                email: email,
                password: password
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

// Admin login via Google Sheets
async function adminLoginFromGoogleSheets(username, password) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'adminLogin',
                username: username,
                password: password
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error with admin login:', error);
        throw error;
    }
}

// Create booking via Google Sheets
async function createBookingInGoogleSheets(bookingData) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'createBooking',
                booking: bookingData
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

// Add villa via Google Sheets (admin only)
async function addVillaToGoogleSheets(villaData) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'addVilla',
                villa: villaData
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error adding villa:', error);
        throw error;
    }
}

// Update villa via Google Sheets (admin only)
async function updateVillaInGoogleSheets(villaData) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateVilla',
                villa: villaData
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating villa:', error);
        throw error;
    }
}

// Delete villa via Google Sheets (admin only)
async function deleteVillaFromGoogleSheets(villaId) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'deleteVilla',
                villaId: villaId
            })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting villa:', error);
        throw error;
    }
}

// Get user bookings from Google Sheets
async function getUserBookingsFromGoogleSheets(userId) {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getUserBookings&userId=${userId}`);
        const data = await response.json();
        return data.bookings || [];
    } catch (error) {
        console.error('Error getting user bookings:', error);
        return [];
    }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Mobile menu toggle
    document.getElementById('mobile-menu')?.addEventListener('click', toggleMobileMenu);
    
    // Direct button event listeners
    setTimeout(() => {
        setupDirectEventListeners();
    }, 100);
    
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function setupDirectEventListeners() {
    // Register button
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showModal('registration-modal');
        });
    }
    
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showModal('login-modal');
        });
    }
    
    // Admin login button
    const adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showModal('admin-login-modal');
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
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
    
    // Form submissions
    document.getElementById('registration-form')?.addEventListener('submit', handleRegistration);
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('admin-login-form')?.addEventListener('submit', handleAdminLogin);
    document.getElementById('booking-form')?.addEventListener('submit', handleBooking);
    document.getElementById('villa-form')?.addEventListener('submit', handleVillaSubmit);
    
    // Admin buttons
    document.getElementById('add-villa-btn')?.addEventListener('click', function() {
        showVillaModal();
    });
    
    document.getElementById('book-villa-btn')?.addEventListener('click', showBookingModal);
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const userActions = document.querySelector('.user-actions');
    navLinks.classList.toggle('active');
    userActions.classList.toggle('active');
}

// ========== MODAL FUNCTIONS ==========
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ========== FORM HANDLERS ==========
async function handleRegistration(e) {
    e.preventDefault();
    console.log('Registration form submitted');
    
    try {
        const userData = {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('password').value,
            address: document.getElementById('address').value,
            idProof: document.getElementById('id-proof').value,
            isAdmin: false
        };
        
        // Basic validation
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (document.getElementById('password').value !== document.getElementById('confirm-password').value) {
            alert('Passwords do not match');
            return;
        }
        
        // Register user via Google Sheets
        const result = await registerUserToGoogleSheets(userData);
        
        if (result.success) {
            // Set current user
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUserUI();
            
            // Close modal and show success
            closeModal('registration-modal');
            alert(`Welcome ${currentUser.firstName}! Registration successful.`);
        } else {
            alert(result.error || 'Registration failed');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }
        
        // Login user via Google Sheets
        const result = await loginUserFromGoogleSheets(email, password);
        
        if (result.success) {
            // Set current user
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUserUI();
            
            // Close modal
            closeModal('login-modal');
            alert(`Welcome back, ${currentUser.firstName}!`);
        } else {
            alert(result.error || 'Invalid email or password');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    console.log('Admin login form submitted');
    
    try {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        // Admin login via Google Sheets
        const result = await adminLoginFromGoogleSheets(username, password);
        
        if (result.success) {
            // Set current user
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUserUI();
            
            // Close modal
            closeModal('admin-login-modal');
            alert('Admin login successful!');
            
            // Show admin dashboard
            showAdminDashboard();
        } else {
            alert(result.error || 'Invalid admin credentials');
        }
        
    } catch (error) {
        console.error('Admin login error:', error);
        alert('Admin login failed.');
    }
}

async function handleBooking(e) {
    e.preventDefault();
    console.log('Booking form submitted');
    
    if (!currentUser) {
        alert('Please login to book a villa.');
        closeModal('booking-modal');
        showModal('login-modal');
        return;
    }
    
    try {
        const villa = villas.find(v => v.id === currentVillaId);
        if (!villa) {
            alert('Villa not found');
            return;
        }
        
        const bookingData = {
            userId: currentUser.id,
            villaId: currentVillaId,
            villaName: villa.name,
            checkInDate: document.getElementById('check-in').value,
            checkOutDate: document.getElementById('check-out').value,
            guests: parseInt(document.getElementById('guests').value),
            specialRequests: document.getElementById('special-requests').value,
            totalPrice: parseFloat(document.getElementById('total-price').value.replace('₹', '').replace(',', '')),
            status: 'confirmed'
        };
        
        // Create booking via Google Sheets
        const result = await createBookingInGoogleSheets(bookingData);
        
        if (result.success) {
            alert(`Booking confirmed!\n\nVilla: ${villa.name}\nDates: ${bookingData.checkInDate} to ${bookingData.checkOutDate}\nTotal: ₹${bookingData.totalPrice.toLocaleString('en-IN')}`);
            
            // Close modal and reset form
            closeModal('booking-modal');
            document.getElementById('booking-form').reset();
        } else {
            alert(result.error || 'Booking failed');
        }
        
    } catch (error) {
        console.error('Booking error:', error);
        alert('Booking failed. Please try again.');
    }
}

async function handleVillaSubmit(e) {
    e.preventDefault();
    
    try {
        const villaData = {
            name: document.getElementById('villa-name').value,
            place: document.getElementById('villa-location').value,
            price: parseInt(document.getElementById('villa-price').value),
            image: document.getElementById('villa-image').value,
            images: document.getElementById('villa-images').value.split(',').map(img => img.trim()).filter(img => img),
            features: document.getElementById('villa-features').value.split(',').map(f => f.trim()).filter(f => f),
            safety: document.getElementById('villa-safety').value.split(',').map(s => s.trim()).filter(s => s),
            description: document.getElementById('villa-description').value
        };
        
        const villaId = document.getElementById('villa-id').value;
        let result;
        
        if (villaId) {
            // Update existing villa
            villaData.id = parseInt(villaId);
            result = await updateVillaInGoogleSheets(villaData);
        } else {
            // Add new villa
            result = await addVillaToGoogleSheets(villaData);
        }
        
        if (result.success) {
            alert(villaId ? 'Villa updated successfully!' : 'Villa added successfully!');
            
            // Close modal and reload villas
            closeModal('villa-modal');
            await loadVillasFromGoogleSheets();
        } else {
            alert(result.error || 'Operation failed');
        }
        
    } catch (error) {
        console.error('Villa operation error:', error);
        alert('Operation failed. Please try again.');
    }
}

// ========== UI FUNCTIONS ==========
function renderVillas() {
    const container = document.getElementById('villas-container');
    if (!container) return;
    
    if (villas.length === 0) {
        container.innerHTML = '<p class="no-villas">No villas available.</p>';
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
    
    container.innerHTML = html;
    
    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const villaId = parseInt(this.getAttribute('data-id'));
            showVillaDetails(villaId);
        });
    });
}

function showVillaDetails(villaId) {
    const villa = villas.find(v => v.id === villaId);
    if (!villa) return;
    
    currentVillaId = villaId;
    
    // Update villa details
    document.getElementById('detail-title').textContent = villa.name;
    document.getElementById('detail-location').textContent = villa.place;
    document.getElementById('detail-price').innerHTML = `₹${villa.price.toLocaleString('en-IN')} <span>/ night</span>`;
    
    // Update main image
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = villa.image;
        mainImage.alt = villa.name;
    }
    
    // Update thumbnails
    const thumbnailContainer = document.getElementById('thumbnail-container');
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
    
    // Show villa detail section
    document.getElementById('villa-detail').style.display = 'block';
    document.getElementById('villas').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function updateUserUI() {
    const userActionsContainer = document.getElementById('user-actions-container');
    if (!userActionsContainer) return;
    
    if (currentUser) {
        userActionsContainer.innerHTML = `
            <span style="color: var(--primary); font-weight: 600;">Welcome, ${currentUser.firstName}</span>
            ${!currentUser.isAdmin ? '<a href="#" id="my-bookings-btn">My Bookings</a>' : ''}
            <a href="#" id="logout-btn">Logout</a>
            ${currentUser.isAdmin ? '<a href="#" class="admin-btn" id="dashboard-btn">Dashboard</a>' : ''}
        `;
        
        // Add event listeners for new buttons
        setTimeout(() => {
            document.getElementById('logout-btn')?.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
            
            document.getElementById('dashboard-btn')?.addEventListener('click', function(e) {
                e.preventDefault();
                showAdminDashboard();
            });
            
            document.getElementById('my-bookings-btn')?.addEventListener('click', async function(e) {
                e.preventDefault();
                await showMyBookings();
            });
        }, 100);
        
    } else {
        userActionsContainer.innerHTML = `
            <a href="#" id="register-btn">Register</a>
            <a href="#" id="login-btn">Login</a>
            <a href="#" class="admin-btn" id="admin-login-btn">Admin</a>
        `;
        
        // Re-add event listeners
        setTimeout(() => {
            setupDirectEventListeners();
        }, 100);
    }
}

async function showMyBookings() {
    if (!currentUser) return;
    
    try {
        const bookings = await getUserBookingsFromGoogleSheets(currentUser.id);
        
        if (bookings.length === 0) {
            alert('You have no bookings yet.');
            return;
        }
        
        let message = 'Your Bookings:\n\n';
        bookings.forEach((booking, index) => {
            message += `${index + 1}. ${booking.villaName}\n`;
            message += `   Dates: ${booking.checkInDate} to ${booking.checkOutDate}\n`;
            message += `   Guests: ${booking.guests}\n`;
            message += `   Total: ₹${booking.totalPrice.toLocaleString('en-IN')}\n`;
            message += `   Status: ${booking.status}\n\n`;
        });
        
        alert(message);
    } catch (error) {
        console.error('Error showing bookings:', error);
        alert('Error loading your bookings.');
    }
}

function showAdminDashboard() {
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('villas').style.display = 'none';
    document.getElementById('villa-detail').style.display = 'none';
    window.scrollTo({top: 0, behavior: 'smooth'});
    
    // Render admin villas table
    renderAdminVillasTable();
}

function renderAdminVillasTable() {
    const tableBody = document.getElementById('admin-villas-table');
    if (!tableBody) return;
    
    let html = '';
    villas.forEach(villa => {
        html += `
            <tr>
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
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to admin buttons
    setTimeout(() => {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const villaId = parseInt(this.getAttribute('data-id'));
                showVillaModal(villaId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const villaId = parseInt(this.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this villa?')) {
                    const result = await deleteVillaFromGoogleSheets(villaId);
                    if (result.success) {
                        alert('Villa deleted successfully!');
                        await loadVillasFromGoogleSheets();
                        renderAdminVillasTable();
                    } else {
                        alert(result.error || 'Failed to delete villa');
                    }
                }
            });
        });
    }, 100);
}

function showVillaModal(villaId = null) {
    const modal = document.getElementById('villa-modal');
    const title = document.getElementById('villa-modal-title');
    const form = document.getElementById('villa-form');
    
    if (villaId) {
        // Edit mode
        title.textContent = 'Edit Villa';
        const villa = villas.find(v => v.id === villaId);
        
        if (villa) {
            document.getElementById('villa-id').value = villa.id;
            document.getElementById('villa-name').value = villa.name;
            document.getElementById('villa-location').value = villa.place;
            document.getElementById('villa-price').value = villa.price;
            document.getElementById('villa-image').value = villa.image;
            document.getElementById('villa-images').value = villa.images ? villa.images.join(', ') : '';
            document.getElementById('villa-features').value = villa.features ? villa.features.join(', ') : '';
            document.getElementById('villa-safety').value = villa.safety ? villa.safety.join(', ') : '';
            document.getElementById('villa-description').value = villa.description || '';
        }
    } else {
        // Add mode
        title.textContent = 'Add New Villa';
        form.reset();
        document.getElementById('villa-id').value = '';
    }
    
    showModal('villa-modal');
}

function showBookingModal() {
    const modal = document.getElementById('booking-modal');
    const villa = villas.find(v => v.id === currentVillaId);
    
    if (villa) {
        document.getElementById('booking-villa-name').value = villa.name;
        
        // Set minimum dates
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('check-in').min = today;
        document.getElementById('check-out').min = today;
        
        // Calculate price when dates change
        document.getElementById('check-in').addEventListener('change', calculateBookingPrice);
        document.getElementById('check-out').addEventListener('change', calculateBookingPrice);
    }
    
    showModal('booking-modal');
}

function calculateBookingPrice() {
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    
    if (!checkIn || !checkOut) return;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    if (end <= start) {
        document.getElementById('total-price').value = 'Invalid dates';
        return;
    }
    
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const villa = villas.find(v => v.id === currentVillaId);
    
    if (villa) {
        const total = villa.price * nights;
        document.getElementById('total-price').value = `₹${total.toLocaleString('en-IN')}`;
    }
}

function logoutUser() {
    currentUser = null;
    isAdminLoggedIn = false;
    localStorage.removeItem('currentUser');
    updateUserUI();
    alert('Logged out successfully');
    
    // Hide admin dashboard if visible
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('villas').style.display = 'block';
}

// ========== HELPER FUNCTIONS ==========
function showNotification(message, type) {
    // Simple notification using alert for now
    console.log(`${type}: ${message}`);
}

function initBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('active');
        } else {
            backToTop.classList.remove('active');
        }
    });
    
    backToTop.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
}