/***************************************
 * CONFIG
 ***************************************/
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyYFI6zP4Q5V5SECoXpf94IBJJvi7HxVSsxNTllXdV87clPcA8tVpIaPctdyjzr_wSVzg/exec";

/***************************************
 * HELPERS
 ***************************************/
function qs(id) {
  return document.getElementById(id);
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem("user");
}

/***************************************
 * UI STATE HANDLER (CRITICAL)
 ***************************************/
function updateAuthUI() {
  const user = getUser();

  const loginBtn = qs("loginBtn");
  const registerBtn = qs("registerBtn");
  const adminBtn = qs("adminBtn");
  const logoutBtn = qs("logoutBtn");

  // Default safety
  if (loginBtn) loginBtn.style.display = "inline-block";
  if (registerBtn) registerBtn.style.display = "inline-block";
  if (adminBtn) adminBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "none";

  if (!user) return;

  // Logged in
  if (loginBtn) loginBtn.style.display = "none";
  if (registerBtn) registerBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-block";

  if (user.role === "admin" && adminBtn) {
    adminBtn.style.display = "inline-block";
  }
}

/***************************************
 * REGISTER
 ***************************************/
async function registerUser() {
  const name = qs("regName").value.trim();
  const email = qs("regEmail").value.trim();
  const password = qs("regPassword").value.trim();

  if (!name || !email || !password) {
    alert("All fields required");
    return;
  }

  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "register",
      name,
      email,
      password
    })
  });

  const data = await res.json();

  if (data.status === "success") {
    alert("Registered successfully");
  } else {
    alert(data.message || "Registration failed");
  }
}

/***************************************
 * LOGIN
 ***************************************/
async function loginUser() {
  const email = qs("loginEmail").value.trim();
  const password = qs("loginPassword").value.trim();

  if (!email || !password) {
    alert("Email & password required");
    return;
  }

  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      email,
      password
    })
  });

  const data = await res.json();

  if (data.status === "success") {
    setUser(data.user);
    updateAuthUI();
    alert("Login successful");
  } else {
    alert(data.message || "Invalid login");
  }
}

/***************************************
 * LOGOUT
 ***************************************/
function logout() {
  clearUser();
  updateAuthUI();
  alert("Logged out");
}

/***************************************
 * ADD VILLA (ADMIN)
 ***************************************/
async function addVilla() {
  const user = getUser();
  if (!user || user.role !== "admin") {
    alert("Unauthorized");
    return;
  }

  const name = qs("villaName").value.trim();
  const price = qs("villaPrice").value.trim();
  const location = qs("villaLocation").value.trim();

  if (!name || !price || !location) {
    alert("All fields required");
    return;
  }

  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "addVilla",
      name,
      price,
      location
    })
  });

  const data = await res.json();

  if (data.status === "success") {
    alert("Villa added");
    loadVillas();
  } else {
    alert("Failed to add villa");
  }
}

/***************************************
 * LOAD VILLAS (PUBLIC)
 ***************************************/
async function loadVillas() {
  const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getVillas`);
  const data = await res.json();

  const container = qs("villaList");
  if (!container) return;

  container.innerHTML = "";

  data.villas.forEach(v => {
    const div = document.createElement("div");
    div.className = "villa-card";
    div.innerHTML = `
      <h3>${v.name}</h3>
      <p>₹ ${v.price}</p>
      <p>${v.location}</p>
    `;
    container.appendChild(div);
  });
}

/***************************************
 * INIT (VERY IMPORTANT)
 ***************************************/
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  loadVillas();
});
