
// Configuration - USE YOUR ACTUAL URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4lwPh5ji4m3uLZq2xj5RU7SIjL4Tbu1tBrvwvnbHunzOV30jFJMUWfLAOS0PbvQVnww/exec';

// Global Variables
let villas = [];
let currentUser = null;
let isAdminLoggedIn = false;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Luxury Villas - Initializing...');
    console.log('API URL:', GOOGLE_SCRIPT_URL);
    initApp();
});

async function initApp() {
    try {
        // 1. Setup event listeners
        setupEventListeners();
        
        // 2. Load REAL data from Google Sheets
        console.log('📥 Loading REAL villas from Google Sheets...');
        await loadVillasFromGoogleSheets();
        
        // 3. Check for saved user
        const savedUser = localStorage.getItem('luxury_villas_user');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                isAdminLoggedIn = currentUser.isAdmin || false;
                updateUserUI();
                console.log('👤 User restored:', currentUser);
            } catch (e) {
                console.error('Error parsing saved user:', e);
            }
        }
        
        // 4. Test API connection
        await testApiConnection();
        
        console.log('✅ App initialized successfully');
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
    }
}

// ========== GOOGLE SHEETS API FUNCTIONS ==========

async function loadVillasFromGoogleSheets() {
    try {
        console.log('🔄 Fetching villas from:', GOOGLE_SCRIPT_URL);
        
        // Use XMLHttpRequest to avoid CORS issues
        const data = await makeRequest(`${GOOGLE_SCRIPT_URL}?action=getVillas`);
        
        console.log('📊 Villas data received:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (!data.villas || data.villas.length === 0) {
            console.warn('⚠️ No villas found in Google Sheets');
            villas = [];
        } else {
            villas = data.villas;
            console.log(`✅ Loaded ${villas.length} REAL villas from Google Sheets`);
            
            // Log first villa details
            if (villas.length > 0) {
                console.log('First villa from Google Sheets:', {
                    id: villas[0].id,
                    name: villas[0].name,
                    price: villas[0].price,
                    features: villas[0].features
                });
            }
        }
        
        renderVillas();
        
    } catch (error) {
        console.error('❌ Error loading villas from Google Sheets:', error);
        alert('Failed to load villas. Please refresh the page.');
        // DO NOT USE DEMO DATA - show empty state instead
        villas = [];
        renderVillas();
    }
}

// Universal request function (works with CORS)
function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        
        if (data) {
            xhr.setRequestHeader('Content-Type', 'application/json');
        }
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                    console.error('Parse error:', e, 'Response:', xhr.responseText);
                    reject(new Error('Invalid JSON response'));
                }
            } else {
                reject(new Error(`Request failed with status ${xhr.status}`));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error'));
        };
        
        xhr.ontimeout = function() {
            reject(new Error('Request timeout'));
        };
        
        if (data) {
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }
    });
}

async function registerUserToGoogleSheets(userData) {
    try {
        console.log('📝 Registering user via Google Sheets:', userData.email);
        
        const result = await makeRequest(GOOGLE_SCRIPT_URL, 'POST', {
            action: 'registerUser',
            user: userData
        });
        
        console.log('Registration API response:', result);
        return result;
        
    } catch (error) {
        console.error('Registration API error:', error);
        throw error;
    }
}

async function loginUserFromGoogleSheets(email, password) {
    try {
        console.log('🔐 Logging in user:', email);
        
        const result = await makeRequest(GOOGLE_SCRIPT_URL, 'POST', {
            action: 'loginUser',
            email: email,
            password: password
        });
        
        console.log('Login API response:', result);
        return result;
        
    } catch (error) {
        console.error('Login API error:', error);
        throw error;
    }
}

async function adminLoginFromGoogleSheets(username, password) {
    try {
        console.log('👑 Admin login attempt:', username);
        
        const result = await makeRequest(GOOGLE_SCRIPT_URL, 'POST', {
            action: 'adminLogin',
            username: username,
            password: password
        });
        
        console.log('Admin login API response:', result);
        return result;
        
    } catch (error) {
        console.error('Admin login API error:', error);
        throw error;
    }
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Mobile menu
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            const navLinks = document.querySelector('.nav-links');
            const userActions = document.querySelector('.user-actions');
            navLinks.classList.toggle('active');
            userActions.classList.toggle('active');
        });
    }
    
    // Setup modal listeners with delay to ensure DOM is ready
    setTimeout(() => {
        setupModalListeners();
    }, 100);
}

function setupModalListeners() {
    // Registration button
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📝 Register button clicked');
            showModal('registration-modal');
        });
    }
    
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔐 Login button clicked');
            showModal('login-modal');
        });
    }
    
    // Admin login button
    const adminBtn = document.getElementById('admin-login-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👑 Admin button clicked');
            showModal('admin-login-modal');
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                hideModal(modal.id);
            }
        });
    });
    
    // Switch between modals
    document.getElementById('show-login-from-reg')?.addEventListener('click', function(e) {
        e.preventDefault();
        hideModal('registration-modal');
        showModal('login-modal');
    });
    
    document.getElementById('show-register-from-login')?.addEventListener('click', function(e) {
        e.preventDefault();
        hideModal('login-modal');
        showModal('registration-modal');
    });
    
    // Form submissions
    document.getElementById('registration-form')?.addEventListener('submit', handleRegistration);
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('admin-login-form')?.addEventListener('submit', handleAdminLogin);
    
    // Close modal on outside click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target.id);
        }
    });
}

// ========== MODAL FUNCTIONS ==========

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        console.log(`📱 Modal shown: ${modalId}`);
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log(`📱 Modal hidden: ${modalId}`);
    }
}

// ========== FORM HANDLERS (REAL GOOGLE SHEETS) ==========

async function handleRegistration(e) {
    e.preventDefault();
    console.log('📝 Registration form submitted');
    
    try {
        // Get form data
        const userData = {
            firstName: document.getElementById('first-name').value.trim(),
            lastName: document.getElementById('last-name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value,
            address: document.getElementById('address')?.value.trim() || '',
            idProof: document.getElementById('id-proof')?.value.trim() || '',
            isAdmin: false
        };
        
        // Validation
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
            alert('❌ Please fill in all required fields');
            return;
        }
        
        if (document.getElementById('password').value !== document.getElementById('confirm-password').value) {
            alert('❌ Passwords do not match');
            return;
        }
        
        // Register with REAL Google Sheets
        console.log('🔄 Sending registration to Google Sheets...');
        const result = await registerUserToGoogleSheets(userData);
        
        if (result.success) {
            // Set current user
            currentUser = result.user;
            localStorage.setItem('luxury_villas_user', JSON.stringify(currentUser));
            
            // Update UI
            updateUserUI();
            
            // Close modal
            hideModal('registration-modal');
            
            // Show success
            alert(`🎉 Welcome ${currentUser.firstName}! Registration successful!`);
            
            // Clear form
            document.getElementById('registration-form').reset();
            
            console.log('✅ User registered and saved:', currentUser);
            
        } else {
            alert(`❌ Registration failed: ${result.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        alert('❌ Registration failed. Please try again.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login form submitted');
    
    try {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            alert('❌ Please enter email and password');
            return;
        }
        
        // Login with REAL Google Sheets
        console.log('🔄 Sending login to Google Sheets...');
        const result = await loginUserFromGoogleSheets(email, password);
        
        if (result.success) {
            // Set current user
            currentUser = result.user;
            localStorage.setItem('luxury_villas_user', JSON.stringify(currentUser));
            
            // Update UI
            updateUserUI();
            
            // Close modal
            hideModal('login-modal');
            
            // Show success
            alert(`👋 Welcome back, ${currentUser.firstName}!`);
            
            // Clear form
            document.getElementById('login-form').reset();
            
            console.log('✅ User logged in:', currentUser);
            
        } else {
            alert(`❌ Login failed: ${result.error || 'Invalid credentials'}`);
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        alert('❌ Login failed. Please check your connection.');
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    console.log('👑 Admin login form submitted');
    
    try {
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value;
        
        if (!username || !password) {
            alert('❌ Please enter admin credentials');
            return;
        }
        
        // Admin login with REAL Google Sheets
        console.log('🔄 Sending admin login to Google Sheets...');
        const result = await adminLoginFromGoogleSheets(username, password);
        
        if (result.success) {
            // Set current user
            currentUser = result.user;
            localStorage.setItem('luxury_villas_user', JSON.stringify(currentUser));
            
            // Update UI
            updateUserUI();
            
            // Close modal
            hideModal('admin-login-modal');
            
            // Show success
            alert('✅ Admin login successful!');
            
            // Clear form
            document.getElementById('admin-login-form').reset();
            
            console.log('✅ Admin logged in:', currentUser);
            
        } else {
            alert(`❌ Admin login failed: ${result.error || 'Invalid credentials'}`);
        }
        
    } catch (error) {
        console.error('❌ Admin login error:', error);
        alert('❌ Admin login failed. Please try again.');
    }
}

// ========== UI RENDERING ==========

function renderVillas() {
    const container = document.getElementById('villas-container');
    if (!container) {
        console.error('❌ Villas container not found');
        return;
    }
    
    console.log(`🎨 Rendering ${villas.length} villas`);
    
    if (villas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3>No Villas Available</h3>
                <p>No villas found in the database.</p>
                <p><small>Check Google Sheets or contact admin</small></p>
            </div>
        `;
        return;
    }
    
    let html = '';
    villas.forEach(villa => {
        // Fix data issues - some villas have images in features array
        const features = Array.isArray(villa.features) ? villa.features : [];
        const images = Array.isArray(villa.images) ? villa.images : [];
        
        // Use first image as main if available
        const mainImage = images.length > 0 ? images[0] : villa.image;
        
        html += `
            <div class="villa-card">
                <img src="${mainImage}" alt="${villa.name}" class="villa-img" 
                     onerror="this.src='https://images.unsplash.com/photo-1518780664697-55e3ad937233'">
                <div class="villa-info">
                    <h3 class="villa-name">${villa.name}</h3>
                    <p class="villa-place">${villa.place}</p>
                    <div class="villa-features">
                        ${features.slice(0, 3).map(feature => `<span>${feature}</span>`).join('')}
                        ${features.length > 3 ? '<span>+ more</span>' : ''}
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
    setTimeout(() => {
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', function() {
                const villaId = parseInt(this.getAttribute('data-id'));
                showVillaDetails(villaId);
            });
        });
    }, 100);
}

function showVillaDetails(villaId) {
    const villa = villas.find(v => v.id === villaId);
    if (!villa) return;
    
    alert(`
        Villa Details from Google Sheets:
        -------------------------------
        Name: ${villa.name}
        Location: ${villa.place}
        Price: ₹${villa.price.toLocaleString('en-IN')}/night
        Features: ${Array.isArray(villa.features) ? villa.features.join(', ') : 'No features listed'}
        Description: ${villa.description || 'No description'}
    `);
}

function updateUserUI() {
    const container = document.getElementById('user-actions-container');
    if (!container) {
        console.error('❌ User actions container not found');
        return;
    }
    
    if (currentUser) {
        container.innerHTML = `
            <span style="color: #1a5f7a; font-weight: 600;">👤 ${currentUser.firstName}</span>
            ${!currentUser.isAdmin ? '<a href="#" id="my-bookings-btn">My Bookings</a>' : ''}
            <a href="#" id="logout-btn">Logout</a>
            ${currentUser.isAdmin ? '<a href="#" class="admin-btn" id="admin-dashboard-btn">Dashboard</a>' : ''}
        `;
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('logout-btn')?.addEventListener('click', logoutUser);
            document.getElementById('admin-dashboard-btn')?.addEventListener('click', showAdminDashboard);
            document.getElementById('my-bookings-btn')?.addEventListener('click', showMyBookings);
        }, 100);
        
    } else {
        container.innerHTML = `
            <a href="#" id="register-btn">Register</a>
            <a href="#" id="login-btn">Login</a>
            <a href="#" class="admin-btn" id="admin-login-btn">Admin</a>
        `;
        
        // Re-add event listeners
        setTimeout(() => {
            setupModalListeners();
        }, 100);
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('luxury_villas_user');
    updateUserUI();
    alert('👋 Logged out successfully');
    console.log('✅ User logged out');
}

function showAdminDashboard() {
    alert('Admin dashboard - Connected to Google Sheets');
    console.log('📊 Admin dashboard accessed');
}

function showMyBookings() {
    alert('Your bookings - Connected to Google Sheets');
    console.log('📅 My bookings accessed');
}

// ========== HELPER FUNCTIONS ==========

async function testApiConnection() {
    try {
        console.log('🔗 Testing API connection...');
        const data = await makeRequest(`${GOOGLE_SCRIPT_URL}?action=test`);
        console.log('✅ API connection successful:', data);
        return true;
    } catch (error) {
        console.error('❌ API connection failed:', error);
        return false;
    }
}

// Debug: Check what's being loaded
console.log('🔍 Debug - Current villas array:', villas);

