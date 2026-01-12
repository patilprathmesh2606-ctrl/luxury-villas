
/*************************************************
 * Luxury Villas – Frontend Script
 * Works with Google Apps Script Backend
 * Author: Prathmesh Patil
 *************************************************/

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyYFI6zP4Q5V5SECoXpf94IBJJvi7HxVSsxNTllXdV87clPcA8tVpIaPctdyjzr_wSVzg/exec";

/* ========== GLOBAL STATE ========== */
let villas = [];
let isAdmin = false;

/* ========== INITIALIZE APP ========== */
document.addEventListener("DOMContentLoaded", () => {
    loadVillas();
    setupAdminLogin();
});

/* ========== LOAD VILLAS ========== */
async function loadVillas() {
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getVillas`);
        const data = await res.json();

        if (data.success) {
            villas = data.villas || [];
            saveToLocal();
            renderVillas();
            console.log("✅ Villas loaded from Google Sheet");
            return;
        }
    } catch (e) {
        console.warn("⚠️ API failed, loading from localStorage");
    }

    villas = JSON.parse(localStorage.getItem("villas") || "[]");
    renderVillas();
}

/* ========== SAVE TO LOCAL ========== */
function saveToLocal() {
    localStorage.setItem("villas", JSON.stringify(villas));
}

/* ========== RENDER VILLAS ========== */
function renderVillas() {
    const container = document.getElementById("villa-list");
    if (!container) return;

    container.innerHTML = "";

    if (villas.length === 0) {
        container.innerHTML = "<p>No villas available</p>";
        return;
    }

    villas.forEach(v => {
        const card = document.createElement("div");
        card.className = "villa-card";

        card.innerHTML = `
            <img src="${v.image}" alt="${v.name}">
            <h3>${v.name}</h3>
            <p>${v.place}</p>
            <p>₹${v.price}/night</p>
            ${isAdmin ? `
                <button onclick="editVilla(${v.id})">Edit</button>
                <button onclick="deleteVillaUI(${v.id})">Delete</button>
            ` : ""}
        `;

        container.appendChild(card);
    });
}

/* ========== ADMIN LOGIN (SIMPLE) ========== */
function setupAdminLogin() {
    const btn = document.getElementById("admin-login");
    if (!btn) return;

    btn.addEventListener("click", () => {
        const pass = prompt("Enter admin password:");
        if (pass === "admin123") {
            isAdmin = true;
            alert("Admin access granted");
            renderVillas();
            renderAdminPanel();
        } else {
            alert("Wrong password");
        }
    });
}

/* ========== ADMIN PANEL ========== */
function renderAdminPanel() {
    const panel = document.getElementById("admin-panel");
    if (!panel) return;

    panel.innerHTML = `
        <h2>Add / Edit Villa</h2>
        <form id="villa-form">
            <input type="hidden" id="villa-id">
            <input id="villa-name" placeholder="Villa Name" required>
            <input id="villa-location" placeholder="Location" required>
            <input id="villa-price" type="number" placeholder="Price" required>
            <input id="villa-image" placeholder="Main Image URL">
            <textarea id="villa-description" placeholder="Description"></textarea>
            <button type="submit">Save Villa</button>
        </form>
    `;

    document.getElementById("villa-form").addEventListener("submit", submitVilla);
}

/* ========== SUBMIT VILLA ========== */
async function submitVilla(e) {
    e.preventDefault();

    const data = {
        id: document.getElementById("villa-id").value || null,
        name: document.getElementById("villa-name").value,
        place: document.getElementById("villa-location").value,
        price: document.getElementById("villa-price").value,
        image: document.getElementById("villa-image").value,
        description: document.getElementById("villa-description").value
    };

    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "saveVilla",
                data
            })
        });

        const result = await res.json();

        if (result.success) {
            alert("Villa saved successfully");
            clearForm();
            await loadVillas();
        } else {
            alert(result.error || "Save failed");
        }
    } catch (err) {
        alert("Network error");
    }
}

/* ========== EDIT VILLA ========== */
function editVilla(id) {
    const v = villas.find(v => v.id === id);
    if (!v) return;

    document.getElementById("villa-id").value = v.id;
    document.getElementById("villa-name").value = v.name;
    document.getElementById("villa-location").value = v.place;
    document.getElementById("villa-price").value = v.price;
    document.getElementById("villa-image").value = v.image;
    document.getElementById("villa-description").value = v.description;
}

/* ========== DELETE (UI ONLY) ========== */
function deleteVillaUI(id) {
    if (!confirm("Delete villa (UI only)?")) return;

    villas = villas.filter(v => v.id !== id);
    saveToLocal();
    renderVillas();
}

/* ========== CLEAR FORM ========== */
function clearForm() {
    document.getElementById("villa-id").value = "";
    document.getElementById("villa-form").reset();
}
function updateAuthUI() {
  const user = JSON.parse(localStorage.getItem("user"));

  // Get buttons
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const adminBtn = document.getElementById("adminBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Safety check
  if (!loginBtn || !registerBtn) return;

  if (!user) {
    // Not logged in
    loginBtn.style.display = "inline-block";
    registerBtn.style.display = "inline-block";
    if (adminBtn) adminBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
    return;
  }

  // Logged in
  loginBtn.style.display = "none";
  registerBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-block";

  if (user.role === "admin" && adminBtn) {
    adminBtn.style.display = "inline-block";
  } else if (adminBtn) {
    adminBtn.style.display = "none";
  }
}
function logout() {
  localStorage.removeItem("user");
  updateAuthUI();
  alert("Logged out successfully");
}
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
});



