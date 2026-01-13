// Luxury Villas - Working Solution
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxEmLrHwliDilacP8XNik78QbtpP9do6qDl0uJeeH2ZzU4se5FQn58ePYr8a5HNq_c/exec';

let villas = [];
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Luxury Villas - Starting...');
    
    // Clear any demo data
    localStorage.removeItem('demo_villas');
    localStorage.removeItem('villas_cache');
    
    // Load REAL data from Google Sheets
    loadRealVillasFromGoogleSheets();
    
    // Setup UI
    setupEventListeners();
    
    // Check user session
    const savedUser = localStorage.getItem('luxury_villas_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUserUI();
        } catch (e) {}
    }
});

// Load REAL villas from Google Sheets
function loadRealVillasFromGoogleSheets() {
    console.log('📥 Loading REAL villas from Google Sheets...');
    
    const container = document.getElementById('villas-container');
    if (container) {
        container.innerHTML = '<div class="loading">Loading villas from Google Sheets...</div>';
    }
    
    // Use JSONP to bypass CORS
    const callbackName = 'villasCallback_' + Date.now();
    const script = document.createElement('script');
    
    script.src = GOOGLE_SCRIPT_URL + '?action=getVillas&callback=' + callbackName;
    
    window[callbackName] = function(data) {
        console.log('✅ Received villas from Google Sheets:', data);
        
        // Clean up
        delete window[callbackName];
        document.head.removeChild(script);
        
        if (data && data.villas) {
            villas = data.villas;
            console.log(`✅ Loaded ${villas.length} REAL villas from Google Sheets`);
            
            // Show which villas are loaded
            villas.forEach((villa, index) => {
                console.log(`Villa ${index + 1}: ${villa.name} - ₹${villa.price}`);
            });
            
            renderVillas();
        } else {
            console.error('❌ No villas data received');
            showError('No villas found in Google Sheets');
        }
    };
    
    script.onerror = function() {
        delete window[callbackName];
        console.error('❌ Failed to load from Google Sheets');
        showError('Failed to connect to Google Sheets');
    };
    
    document.head.appendChild(script);
}

// Render villas
function renderVillas() {
    const container = document.getElementById('villas-container');
    if (!container) return;
    
    if (villas.length === 0) {
        container.innerHTML = `
            <div class="no-villas">
                <h3>No Villas in Database</h3>
                <p>Google Sheets has no villa data.</p>
                <button onclick="loadRealVillasFromGoogleSheets()" class="btn">Retry</button>
            </div>
        `;
        return;
    }
    
    let html = '';
    villas.forEach(villa => {
        // Fix data structure issues
        const features = Array.isArray(villa.features) ? villa.features : [];
        const images = Array.isArray(villa.images) ? villa.images : [];
        const mainImage = images.length > 0 ? images[0] : villa.image;
        
        html += `
            <div class="villa-card">
                <img src="${mainImage}" alt="${villa.name}" class="villa-img">
                <div class="villa-info">
                    <h3 class="villa-name">${villa.name}</h3>
                    <p class="villa-place">${villa.place}</p>
                    <div class="villa-features">
                        ${features.slice(0, 3).map(f => `<span>${f}</span>`).join('')}
                    </div>
                    <div class="villa-price">
                        <div class="price">₹${villa.price.toLocaleString('en-IN')} <span>/ night</span></div>
                        <button class="btn" onclick="viewVillaDetails(${villa.id})">View Details</button>
                    </div>
                </div>
                <div style="font-size: 10px; color: green; padding: 5px; text-align: right;">
                    ✓ Live from Google Sheets
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function viewVillaDetails(villaId) {
    const villa = villas.find(v => v.id === villaId);
    if (villa) {
        alert(`
            ${villa.name}
            Location: ${villa.place}
            Price: ₹${villa.price}/night
            
            ✅ Loaded from Google Sheets
            Villa ID: ${villa.id}
        `);
    }
}

function showError(message) {
    const container = document.getElementById('villas-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3>⚠️ Connection Issue</h3>
                <p>${message}</p>
                <button onclick="loadRealVillasFromGoogleSheets()" class="btn">Try Again</button>
            </div>
        `;
    }
}

// Event Listeners
function setupEventListeners() {
    // Modal buttons
    document.getElementById('register-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        showModal('registration-modal');
    });
    
    document.getElementById('login-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        showModal('login-modal');
    });
    
    document.getElementById('admin-login-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        showModal('admin-login-modal');
    });
    
    // Close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) hideModal(modal.id);
        });
    });
    
    // Form submissions
    document.getElementById('registration-form')?.addEventListener('submit', handleRegistration);
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('admin-login-form')?.addEventListener('submit', handleAdminLogin);
    
    // Modal links
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
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Form handlers - Use localStorage for demo on GitHub Pages
async function handleRegistration(e) {
    e.preventDefault();
    
    const userData = {
        firstName: document.getElementById('first-name').value.trim(),
        lastName: document.getElementById('last-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value
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
    
    // For GitHub Pages demo, use localStorage
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    
    // Check if user exists
    if (users.some(u => u.email === userData.email)) {
        alert('User already exists');
        return;
    }
    
    // Create user
    const newUser = {
        id: Date.now(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        isAdmin: false
    };
    
    users.push(newUser);
    localStorage.setItem('demo_users', JSON.stringify(users));
    localStorage.setItem('luxury_villas_user', JSON.stringify(newUser));
    
    currentUser = newUser;
    updateUserUI();
    hideModal('registration-modal');
    
    alert(`Welcome ${userData.firstName}! Registration successful (demo mode).`);
    document.getElementById('registration-form').reset();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    // For GitHub Pages demo
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    const user = users.find(u => u.email === email);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('luxury_villas_user', JSON.stringify(user));
        updateUserUI();
        hideModal('login-modal');
        alert(`Welcome back ${user.firstName}! (demo mode)`);
        document.getElementById('login-form').reset();
    } else {
        alert('User not found. Please register first.');
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    
    if (!username || !password) {
        alert('Please enter admin credentials');
        return;
    }
    
    // Hardcoded admin for demo
    if (username === 'admin' && password === 'admin123') {
        currentUser = {
            id: 0,
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@luxuryvillas.com',
            phone: '1234567890',
            isAdmin: true
        };
        
        localStorage.setItem('luxury_villas_user', JSON.stringify(currentUser));
        updateUserUI();
        hideModal('admin-login-modal');
        alert('Admin login successful! (demo mode)');
        document.getElementById('admin-login-form').reset();
    } else {
        alert('Invalid admin credentials');
    }
}

// User UI
function updateUserUI() {
    const container = document.getElementById('user-actions-container');
    if (!container) return;
    
    if (currentUser) {
        container.innerHTML = `
            <span style="color: #1a5f7a; font-weight: 600;">👤 ${currentUser.firstName}</span>
            <a href="#" id="logout-btn">Logout</a>
            ${currentUser.isAdmin ? '<a href="#" class="admin-btn" id="admin-dashboard-btn">Dashboard</a>' : ''}
        `;
        
        setTimeout(() => {
            document.getElementById('logout-btn')?.addEventListener('click', logoutUser);
            document.getElementById('admin-dashboard-btn')?.addEventListener('click', showAdminDashboard);
        }, 100);
    } else {
        container.innerHTML = `
            <a href="#" id="register-btn">Register</a>
            <a href="#" id="login-btn">Login</a>
            <a href="#" class="admin-btn" id="admin-login-btn">Admin</a>
        `;
        
        setTimeout(() => {
            setupEventListeners();
        }, 100);
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('luxury_villas_user');
    updateUserUI();
    alert('Logged out successfully');
}

function showAdminDashboard() {
    alert(`Admin Dashboard\n\nVillas loaded from Google Sheets: ${villas.length}\n\nYou can manage villas in Google Sheets.`);
}

// Debug function
window.debugVillas = function() {
    console.log('Current villas:', villas);
    console.log('Villa count:', villas.length);
    alert(`Villas loaded: ${villas.length}\n\nCheck console for details.`);
};
