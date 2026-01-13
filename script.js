
// ======================================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4lwPh5ji4m3uLZq2xj5RU7SIjL4Tbu1tBrvwvnbHunzOV30jFJMUWfLAOS0PbvQVnww/exec';

// Global variables
let villas = [];
let currentUser = null;
let jsonpCallbackId = 0;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Luxury Villas - Initializing with JSONP');
    initializeApp();
});

async function initializeApp() {
    try {
        // Load villas using JSONP (bypasses CORS)
        await loadVillasWithJSONP();
        
        // Setup event listeners
        setupEventListeners();
        
        // Check for user session
        const savedUser = localStorage.getItem('luxury_villas_user');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                updateUserUI();
                console.log('User session restored');
            } catch (e) {
                console.log('No valid user session');
            }
        }
        
        console.log('✅ App initialized successfully');
        
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// ========== JSONP API FUNCTIONS ==========

function loadVillasWithJSONP() {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonpCallback_' + Date.now();
        
        // Create script element
        const script = document.createElement('script');
        script.src = `${GOOGLE_SCRIPT_URL}?action=getVillas&callback=${callbackName}`;
        
        // Define the callback function
        window[callbackName] = function(data) {
            console.log('JSONP Response received:', data);
            
            // Clean up
            delete window[callbackName];
            document.head.removeChild(script);
            
            if (data && data.villas) {
                villas = data.villas;
                console.log(`✅ Loaded ${villas.length} villas via JSONP`);
                renderVillas();
                resolve(data);
            } else {
                console.error('No villas data in response');
                showNoVillasMessage();
                reject(new Error('No data received'));
            }
        };
        
        // Handle errors
        script.onerror = function() {
            delete window[callbackName];
            document.head.removeChild(script);
            console.error('JSONP request failed');
            showNoVillasMessage();
            reject(new Error('JSONP request failed'));
        };
        
        // Add script to head
        document.head.appendChild(script);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                document.head.removeChild(script);
                console.error('JSONP timeout');
                showNoVillasMessage();
                reject(new Error('Request timeout'));
            }
        }, 10000);
    });
}

// For POST requests, we need to use a different approach
async function makePostRequest(action, data) {
    // Create a hidden iframe form submission (bypasses CORS)
    return new Promise((resolve, reject) => {
        const formId = 'postForm_' + Date.now();
        const iframeId = 'postIframe_' + Date.now();
        
        // Create hidden iframe
        const iframe = document.createElement('iframe');
        iframe.id = iframeId;
        iframe.name = iframeId;
        iframe.style.display = 'none';
        
        // Create form
        const form = document.createElement('form');
        form.id = formId;
        form.method = 'POST';
        form.action = GOOGLE_SCRIPT_URL;
        form.target = iframeId;
        form.style.display = 'none';
        
        // Add action field
        const actionInput = document.createElement('input');
        actionInput.type = 'hidden';
        actionInput.name = 'action';
        actionInput.value = action;
        form.appendChild(actionInput);
        
        // Add data as JSON
        const dataInput = document.createElement('input');
        dataInput.type = 'hidden';
        dataInput.name = 'data';
        dataInput.value = JSON.stringify(data);
        form.appendChild(dataInput);
        
        // Add to document
        document.body.appendChild(iframe);
        document.body.appendChild(form);
        
        // Handle response
        iframe.onload = function() {
            try {
                const responseText = iframe.contentDocument.body.textContent;
                const response = JSON.parse(responseText);
                console.log('POST Response:', response);
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                }, 1000);
                
                resolve(response);
            } catch (e) {
                console.error('Error parsing response:', e);
                reject(e);
            }
        };
        
        iframe.onerror = function() {
            document.body.removeChild(form);
            document.body.removeChild(iframe);
            reject(new Error('POST request failed'));
        };
        
        // Submit form
        form.submit();
    });
}

// ========== UI RENDERING ==========

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
                <img src="${villa.image}" alt="${villa.name}" class="villa-img">
                <div class="villa-info">
                    <h3 class="villa-name">${villa.name}</h3>
                    <p class="villa-place">${villa.place}</p>
                    <div class="villa-features">
                        ${(villa.features || []).slice(0, 3).map(f => `<span>${f}</span>`).join('')}
                    </div>
                    <div class="villa-price">
                        <div class="price">₹${villa.price.toLocaleString('en-IN')} <span>/ night</span></div>
                        <button class="btn view-details" data-id="${villa.id}">View Details</button>
                    </div>
                </div>
                <div class="villa-source" style="font-size: 10px; color: #4CAF50; padding: 5px;">
                    ✓ Live from Google Sheets
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add click handlers
    setTimeout(() => {
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', function() {
                const villaId = parseInt(this.getAttribute('data-id'));
                const villa = villas.find(v => v.id === villaId);
                if (villa) {
                    alert(`
                        ${villa.name}
                        Location: ${villa.place}
                        Price: ₹${villa.price}/night
                        Features: ${(villa.features || []).join(', ')}
                        
                        ✅ Loaded from Google Sheets
                    `);
                }
            });
        });
    }, 100);
}

function showNoVillasMessage() {
    const container = document.getElementById('villas-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3>Cannot Load Villas</h3>
                <p>Unable to connect to the database.</p>
                <button onclick="location.reload()" class="btn">Retry</button>
            </div>
        `;
    }
}

// ========== SIMULATED AUTH (For Demo on GitHub Pages) ==========

// Since POST requests are tricky with CORS on GitHub Pages,
// we'll use localStorage for demo purposes

async function registerUser(userData) {
    // Simulate registration for GitHub Pages demo
    return new Promise((resolve) => {
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
            
            // Check if user exists
            if (users.some(u => u.email === userData.email)) {
                resolve({ success: false, error: 'User already exists' });
                return;
            }
            
            // Create new user
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
            
            resolve({
                success: true,
                user: newUser,
                message: 'Registration successful (demo mode)'
            });
        }, 500);
    });
}

async function loginUser(email, password) {
    // Simulate login for GitHub Pages demo
    return new Promise((resolve) => {
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
            const user = users.find(u => u.email === email);
            
            if (user) {
                resolve({
                    success: true,
                    user: user,
                    message: 'Login successful (demo mode)'
                });
            } else {
                // For demo, create a user if doesn't exist
                const newUser = {
                    id: Date.now(),
                    firstName: 'Demo',
                    lastName: 'User',
                    email: email,
                    phone: '1234567890',
                    isAdmin: false
                };
                
                users.push(newUser);
                localStorage.setItem('demo_users', JSON.stringify(users));
                
                resolve({
                    success: true,
                    user: newUser,
                    message: 'New user created (demo mode)'
                });
            }
        }, 500);
    });
}

async function adminLogin(username, password) {
    // Hardcoded admin for demo
    return new Promise((resolve) => {
        setTimeout(() => {
            if (username === 'admin' && password === 'admin123') {
                const adminUser = {
                    id: 0,
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@luxuryvillas.com',
                    phone: '1234567890',
                    isAdmin: true
                };
                
                resolve({
                    success: true,
                    user: adminUser,
                    message: 'Admin login successful (demo mode)'
                });
            } else {
                resolve({
                    success: false,
                    error: 'Invalid admin credentials'
                });
            }
        }, 500);
    });
}

// ========== FORM HANDLERS ==========

async function handleRegistration(e) {
    e.preventDefault();
    
    const userData = {
        firstName: document.getElementById('first-name').value.trim(),
        lastName: document.getElementById('last-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value,
        address: '',
        idProof: '',
        isAdmin: false
    };
    
    // Validation
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (document.getElementById('password').value !== document.getElementById('confirm-password').value) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        const result = await registerUser(userData);
        
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('luxury_villas_user', JSON.stringify(currentUser));
            updateUserUI();
            hideModal('registration-modal');
            alert(result.message);
            document.getElementById('registration-form').reset();
        } else {
            alert(result.error || 'Registration failed');
        }
    } catch (error) {
        alert('Registration error: ' + error.message);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    try {
        const result = await loginUser(email, password);
        
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('luxury_villas_user', JSON.stringify(currentUser));
            updateUserUI();
            hideModal('login-modal');
            alert(result.message);
            document.getElementById('login-form').reset();
        } else {
            alert(result.error || 'Login failed');
        }
    } catch (error) {
        alert('Login error: ' + error.message);
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
    
    try {
        const result = await adminLogin(username, password);
        
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('luxury_villas_user', JSON.stringify(currentUser));
            updateUserUI();
            hideModal('admin-login-modal');
            alert(result.message);
            document.getElementById('admin-login-form').reset();
        } else {
            alert(result.error || 'Admin login failed');
        }
    } catch (error) {
        alert('Admin login error: ' + error.message);
    }
}

// ========== UPDATE YOUR GOOGLE APPS SCRIPT ==========

// You need to update your Google Apps Script to support JSONP.
// Add this to the beginning of your doGet function:

/*
function doGet(e) {
  const callback = e.parameter.callback;
  const action = e.parameter.action;
  
  let result;
  // ... your existing switch statement ...
  
  if (callback) {
    // Return as JSONP
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Return as JSON
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
*/

// ========== EVENT LISTENERS ==========

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
    
    // Close on outside click
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
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ========== USER UI ==========

function updateUserUI() {
    const container = document.getElementById('user-actions-container');
    if (!container) return;
    
    if (currentUser) {
        container.innerHTML = `
            <span style="color: #1a5f7a; font-weight: 600;">👤 ${currentUser.firstName}</span>
            ${!currentUser.isAdmin ? '<a href="#" id="my-bookings-btn">My Bookings</a>' : ''}
            <a href="#" id="logout-btn">Logout</a>
            ${currentUser.isAdmin ? '<a href="#" class="admin-btn" id="admin-dashboard-btn">Dashboard</a>' : ''}
        `;
        
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
    alert('Admin Dashboard\nVillas loaded from Google Sheets: ' + villas.length);
}

function showMyBookings() {
    alert('My Bookings feature');
}

// ========== TEST FUNCTION ==========

// Test if villas are loaded from Google Sheets
setTimeout(() => {
    console.log('Current villas:', villas);
    console.log('Villas loaded from Google Sheets:', villas.length);
}, 2000);


