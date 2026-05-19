/* ===== MediSlot — script.js ===== */

const API = 'http://127.0.0.1:8000';

/* ---------- STATE ---------- */
let currentDoctorId = null;
let currentDoctorName = '';
let notifCount = 0;
let notifications = [];
let cancelTargetId = null;

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollSpy();
  loadDoctors();
  updateAuthUI();
  initFAQs();
  initSmoothLinks();
  setMinDate();

  // Set up today's date as min for booking
  function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const bd = document.getElementById('bookDate');
    if (bd) bd.min = today;
  }

  // Auto-load appointments if on that page
  if (window.location.hash === '#appointments') {
    navigateTo('appointments');
  }
});

/* ---------- NAVIGATION ---------- */
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    if (pageId === 'doctors') {

      document.querySelectorAll('.page')
      .forEach(p => p.classList.remove('active'));

      document.getElementById('home')
      .classList.add('active');

      setTimeout(() => {

          document.getElementById('doctors')
          .scrollIntoView({
              behavior: 'smooth'
          });

      }, 100);

      return;
  }
  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const link = document.querySelector(`.nav-link[href="#${pageId}"]`);
  if (link) link.classList.add('active');

  // Handle auth-protected pages
  if (pageId === 'appointments') {
    const token = getToken();
    const wall = document.getElementById('apptLoginWall');
    const content = document.getElementById('apptContent');
    if (!token) {
      wall.style.display = 'flex';
      content.style.display = 'none';
    } else {
      wall.style.display = 'none';
      content.style.display = 'block';
      loadAppointments();
    }
  }

  closeAllDropdowns();
}

function initNav() {
  // Hamburger
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  // Profile dropdown
  document.getElementById('profileBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('profileDropdown');
    const btn = document.getElementById('profileBtn');
    dd.classList.toggle('open');
    btn.classList.toggle('open');
  });

  // Close dropdowns on outside click
  document.addEventListener('click', closeAllDropdowns);

  // Nav link clicks
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href').replace('#', '');
      navigateTo(href);
    });
  });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
}

function initScrollSpy() {
  window.addEventListener('scroll', () => {
    const sections = ['home', 'doctors', 'about', 'help', 'appointments'];
    const scrollY = window.scrollY;
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
    });
  });
}

function initSmoothLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href').replace('#', '');
      if (['home', 'about', 'help', 'appointments', 'doctors'].includes(href)) {
        e.preventDefault();
        navigateTo(href);
      }
    });
  });
}

function closeAllDropdowns() {
  document.getElementById('profileDropdown')?.classList.remove('open');
  document.getElementById('profileBtn')?.classList.remove('open');
}

/* ---------- AUTH HELPERS ---------- */
function getToken() { return localStorage.getItem('medislot_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('medislot_user')); } catch { return null; }
}
function setToken(token) { localStorage.setItem('medislot_token', token); }
function setUser(user) { localStorage.setItem('medislot_user', JSON.stringify(user)); }
function clearAuth() { localStorage.removeItem('medislot_token'); localStorage.removeItem('medislot_user'); }

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

function updateAuthUI() {
  const user = getUser();
  const token = getToken();
  const guestMenu = document.getElementById('guestMenu');
  const authMenu = document.getElementById('authMenu');
  const profileLabel = document.getElementById('profileLabel');
  const ddUserInfo = document.getElementById('ddUserInfo');

  if (token && user) {
    guestMenu.style.display = 'none';
    authMenu.style.display = 'block';
    profileLabel.textContent = user.name ? user.name.split(' ')[0] : 'My Account';
    ddUserInfo.innerHTML = `<i class="fa-solid fa-circle-user" style="color:var(--teal)"></i> ${user.name || 'Patient'}`;
  } else {
    guestMenu.style.display = 'block';
    authMenu.style.display = 'none';
    profileLabel.textContent = 'Account';
  }
}

/* ---------- LOGIN ---------- */
async function login() {
  const phone = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!phone || !password) { showToast('error', 'Missing Fields', 'Please enter phone number and password.'); return; }

  const btn = document.querySelector('#loginModal .btn-primary');
  setLoading(btn, true, 'Logging in...');

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phone, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast('error', 'Login Failed', data.detail || 'Invalid credentials.');
      setLoading(btn, false, '<i class="fa-solid fa-right-to-bracket"></i> Login');
      return;
    }

    setToken(data.access_token);
    // Store basic user info from login
    setUser({ name: phone, phone });

    // Try to fetch profile
    try {
      const profileRes = await fetch(`${API}/patient/me`, { headers: authHeaders() });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUser(profileData);
      }
    } catch {}

    closeModal('loginModal');
    updateAuthUI();
    showToast('success', 'Welcome Back!', 'You have logged in successfully.');
    addNotification('Login successful', 'You are now logged in to MediSlot.');

    document.getElementById('loginPhone').value = '';
    document.getElementById('loginPassword').value = '';

  } catch (err) {
    showToast('error', 'Connection Error', 'Could not reach the server. Please try again.');
  }

  setLoading(btn, false, '<i class="fa-solid fa-right-to-bracket"></i> Login');
}

/* ---------- REGISTER ---------- */
async function register() {
  const name = document.getElementById('regName').value.trim();
  const age = parseInt(document.getElementById('regAge').value);
  const gender = document.getElementById('regGender').value;
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!name || !age || !gender || !phone || !email || !password) {
    showToast('error', 'Incomplete Form', 'Please fill in all fields.'); return;
  }
  if (phone.length < 10) { showToast('error', 'Invalid Phone', 'Enter a valid 10-digit phone number.'); return; }
  if (!email.includes('@')) { showToast('error', 'Invalid Email', 'Enter a valid email address.'); return; }

  const btn = document.querySelector('#registerModal .btn-primary');
  setLoading(btn, true, 'Creating account...');

  try {
    const res = await fetch(`${API}/patient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, age, gender, phone_number: phone, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast('error', 'Registration Failed', data.detail || 'Could not create account.');
      setLoading(btn, false, '<i class="fa-solid fa-user-plus"></i> Create Account');
      return;
    }

    closeModal('registerModal');
    showToast('success', 'Account Created!', 'Your MediSlot account is ready. Please log in.');
    addNotification('Registration successful', `Welcome to MediSlot, ${name}!`);
    openModal('loginModal');

    // Clear form
    ['regName','regAge','regGender','regPhone','regEmail','regPassword'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

  } catch (err) {
    showToast('error', 'Connection Error', 'Could not reach the server.');
  }

  setLoading(btn, false, '<i class="fa-solid fa-user-plus"></i> Create Account');
}

/* ---------- LOGOUT ---------- */
function logout() {
  clearAuth();
  updateAuthUI();
  closeAllDropdowns();
  showToast('info', 'Logged Out', 'You have been logged out successfully.');
  addNotification('Logged out', 'Session ended. See you soon!');
  navigateTo('home');
}

/* ---------- DOCTORS ---------- */
async function loadDoctors() {
  const slider = document.getElementById('doctorsSlider');
  slider.innerHTML = '<div class="slider-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading doctors...</div>';

  try {
    const res = await fetch(`${API}/doctors`);
    if (!res.ok) throw new Error('Failed to load');
    const doctors = await res.json();

    if (!doctors || doctors.length === 0) {
      slider.innerHTML = '<div class="slider-loading">No doctors found.</div>';
      return;
    }

    slider.innerHTML = '';
    doctors.forEach(doc => {
      const card = createDoctorCard(doc);
      slider.appendChild(card);
    });

    initSliderArrows();
  } catch (err) {
    slider.innerHTML = `<div class="slider-loading" style="color:#ef4444"><i class="fa-solid fa-triangle-exclamation"></i> Could not load doctors. Make sure the server is running at ${API}</div>`;
    // Show demo cards as fallback
    loadDemoDoctors();
  }
}

function filterDoctors() {

    const search = document
    .getElementById('doctorSearch')
    .value
    .toLowerCase();

    const cards = document.querySelectorAll('.doctor-card');

    cards.forEach(card => {

        const text = card.innerText.toLowerCase();

        if (text.includes(search)) {

            card.style.display = 'flex';

        } else {

            card.style.display = 'none';
        }
    });
}

function createDoctorCard(doc) {
  const card = document.createElement('div');
  card.className = 'doctor-card';
  const initials = getInitials(doc.name || 'Dr');
  card.innerHTML = `
    <div class="doc-avatar">${initials}</div>
    <div class="doc-name">${doc.name || 'Unknown'}</div>
    <div class="doc-spec"><i class="fa-solid fa-briefcase-medical"></i> ${doc.specialization || 'Specialist'}</div>
    <div class="doc-email"><i class="fa-regular fa-envelope" style="color:var(--teal)"></i> ${doc.email || ''}</div>
    <button class="doc-book-btn" onclick="handleBookClick(${doc.id}, '${escapeHtml(doc.name || 'Doctor')}')">
      <i class="fa-solid fa-calendar-plus"></i> Book Appointment
    </button>
  `;
  return card;
}

function loadDemoDoctors() {
  const slider = document.getElementById('doctorsSlider');
  const demos = [
    { id: 1, name: 'Dr. Aanya Sharma', specialization: 'Cardiologist', email: 'aanya@medislot.com' },
    { id: 2, name: 'Dr. Rohan Mehta', specialization: 'Neurologist', email: 'rohan@medislot.com' },
    { id: 3, name: 'Dr. Priya Kapoor', specialization: 'Dermatologist', email: 'priya@medislot.com' },
    { id: 4, name: 'Dr. Vikram Nair', specialization: 'Orthopedist', email: 'vikram@medislot.com' },
    { id: 5, name: 'Dr. Sneha Pillai', specialization: 'Pediatrician', email: 'sneha@medislot.com' },
    { id: 6, name: 'Dr. Arjun Patel', specialization: 'ENT Specialist', email: 'arjun@medislot.com' },
  ];
  slider.innerHTML = '';
  demos.forEach(doc => slider.appendChild(createDoctorCard(doc)));
  initSliderArrows();
}

function initSliderArrows() {
  const slider = document.getElementById('doctorsSlider');
  document.getElementById('sliderPrev')?.addEventListener('click', () => {
    slider.scrollBy({ left: -290, behavior: 'smooth' });
  });
  document.getElementById('sliderNext')?.addEventListener('click', () => {
    slider.scrollBy({ left: 290, behavior: 'smooth' });
  });
}

/* ---------- BOOK APPOINTMENT ---------- */
function handleBookClick(doctorId, doctorName) {
  if (!getToken()) {
    showToast('info', 'Login Required', 'Please log in to book an appointment.');
    openModal('loginModal');
    return;
  }
  currentDoctorId = doctorId;
  currentDoctorName = doctorName;
  document.getElementById('bookingDoctorName').textContent = `with ${doctorName}`;
  document.getElementById('bookDate').value = '';
  document.getElementById('bookTime').value = '';
  openModal('bookingModal');
}

function handleHeroBooking() {

    if (!getToken()) {

        showToast(
            'info',
            'Login Required',
            'Please login first to book appointments.'
        );

        openModal('loginModal');

        return;
    }

    document.getElementById('doctors')
    .scrollIntoView({
        behavior: 'smooth'
    });
}

async function bookAppointment() {
  const date = document.getElementById('bookDate').value;
  const time = document.getElementById('bookTime').value;

  if (!date || !time) { showToast('error', 'Missing Details', 'Please select both date and time.'); return; }
  if (!currentDoctorId) { showToast('error', 'Error', 'No doctor selected.'); return; }

  const btn = document.querySelector('#bookingModal .btn-primary');
  setLoading(btn, true, 'Booking...');

  try {
    const res = await fetch(`${API}/appointment`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ doctor_id: currentDoctorId, date, time })
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.detail || 'Could not book appointment.';
      const isSlotTaken = msg.toLowerCase().includes('slot') || msg.toLowerCase().includes('booked') || res.status === 409;
      if (isSlotTaken) {
        showToast('error', 'Slot Unavailable', 'This time slot is already booked. Please choose a different time.');
      } else {
        showToast('error', 'Booking Failed', msg);
      }
      setLoading(btn, false, '<i class="fa-solid fa-check"></i> Confirm Booking');
      return;
    }

    closeModal('bookingModal');
    showToast('success', 'Appointment Booked!', `Your appointment with ${currentDoctorName} on ${formatDate(date)} at ${formatTime(time)} is confirmed.`);
    addNotification('Appointment confirmed', `${currentDoctorName} — ${formatDate(date)} at ${formatTime(time)}`);

  } catch (err) {
    showToast('error', 'Connection Error', 'Could not reach the server.');
  }

  setLoading(btn, false, '<i class="fa-solid fa-check"></i> Confirm Booking');
}

/* ---------- MY APPOINTMENTS ---------- */
async function loadAppointments() {
  if (!getToken()) return;
  const list = document.getElementById('apptList');
  list.innerHTML = '<div class="appt-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';

  try {
    const res = await fetch(`${API}/appointment`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed');
    const appointments = await res.json();

    if (!appointments || appointments.length === 0) {
      list.innerHTML = `<div class="appt-empty"><i class="fa-regular fa-calendar-xmark"></i><p>No appointments yet. <a href="#" onclick="navigateTo('doctors')" style="color:var(--teal)">Book one now →</a></p></div>`;
      return;
    }

    list.innerHTML = '';
    appointments.forEach(appt => {
      list.appendChild(createAppointmentCard(appt));
    });
  } catch (err) {
    list.innerHTML = `<div class="appt-loading" style="color:#ef4444"><i class="fa-solid fa-triangle-exclamation"></i> Could not load appointments.</div>`;
  }
}

function createAppointmentCard(appt) {
  const card = document.createElement('div');
  card.className = 'appt-card';
  const initials = getInitials(appt.doctor_name || 'Dr');
  card.innerHTML = `
    <div class="appt-card-header">
      <div class="appt-avatar">${initials}</div>
      <div>
        <div class="appt-doc-name">${appt.doctor_name || 'Doctor'}</div>
        <div class="appt-doc-spec">${appt.specialization || 'Specialist'}</div>
      </div>
    </div>
    <div class="appt-details">
      <div class="appt-detail"><i class="fa-solid fa-calendar-day"></i> ${formatDate(appt.date)}</div>
      <div class="appt-detail"><i class="fa-solid fa-clock"></i> ${formatTime(appt.time)}</div>
    </div>
    <button class="cancel-btn" onclick="confirmCancel(${appt.id})">
      <i class="fa-solid fa-ban"></i> Cancel Appointment
    </button>
  `;
  return card;
}

function confirmCancel(apptId) {
  cancelTargetId = apptId;
  openModal('cancelModal');
  document.getElementById('confirmCancelBtn').onclick = () => cancelAppointment(apptId);
}

async function cancelAppointment(apptId) {
  const btn = document.getElementById('confirmCancelBtn');
  setLoading(btn, true, 'Cancelling...');

  try {
    const res = await fetch(`${API}/appointment/${apptId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    if (!res.ok) {
      const data = await res.json();
      showToast('error', 'Cancel Failed', data.detail || 'Could not cancel appointment.');
      setLoading(btn, false, 'Yes, Cancel');
      return;
    }

    closeModal('cancelModal');
    showToast('success', 'Appointment Cancelled', 'Your appointment has been cancelled successfully.');
    addNotification('Appointment cancelled', `Appointment #${apptId} was cancelled.`);
    loadAppointments();
  } catch (err) {
    showToast('error', 'Error', 'Could not reach the server.');
    setLoading(btn, false, 'Yes, Cancel');
  }
}

/* ---------- NOTIFICATIONS ---------- */
function addNotification(title, message) {
  notifications.unshift({ title, message, time: new Date() });
  notifCount++;
  updateNotifBadge();
}

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (notifCount > 0) {
    badge.style.display = 'flex';
    badge.textContent = notifCount > 9 ? '9+' : notifCount;
  } else {
    badge.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('notifBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    notifCount = 0;
    updateNotifBadge();
    if (notifications.length > 0) {
      showNotifPanel();
    } else {
      showToast('info', 'No Notifications', 'You have no new notifications.');
    }
  });
});

function showNotifPanel() {
  // Remove existing panel
  const existing = document.getElementById('notifPanel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'notifPanel';
  panel.style.cssText = `
    position:fixed; top:calc(var(--nav-h) + 8px); right:24px; z-index:1500;
    background:white; border:1px solid var(--border); border-radius:16px;
    box-shadow:var(--shadow-lg); width:320px; max-height:400px; overflow-y:auto;
    animation: fadeUp 0.3s ease;
  `;

  let html = `<div style="padding:16px 20px; border-bottom:1px solid var(--border); font-weight:700; font-size:0.9rem; display:flex; align-items:center; gap:8px; color:var(--text)"><i class="fa-solid fa-bell" style="color:var(--teal)"></i> Notifications</div>`;
  notifications.slice(0, 10).forEach(n => {
    html += `
      <div style="padding:14px 20px; border-bottom:1px solid var(--border); cursor:default; transition:background 0.2s" onmouseover="this.style.background='var(--bg-soft)'" onmouseout="this.style.background=''">
        <div style="font-size:0.87rem; font-weight:600; margin-bottom:3px">${n.title}</div>
        <div style="font-size:0.8rem; color:var(--text-muted)">${n.message}</div>
        <div style="font-size:0.72rem; color:var(--text-light); margin-top:4px">${timeAgo(n.time)}</div>
      </div>
    `;
  });
  if (notifications.length === 0) {
    html += `<div style="padding:32px; text-align:center; color:var(--text-muted); font-size:0.88rem">No notifications yet.</div>`;
  }

  panel.innerHTML = html;
  document.body.appendChild(panel);

  setTimeout(() => {
    document.addEventListener('click', function handler() {
      panel.remove();
      document.removeEventListener('click', handler);
    }, { once: true });
  }, 100);
}

/* ---------- TOAST ---------- */
function showToast(type, title, message) {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <div class="toast-progress"></div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);

  toast.addEventListener('click', () => toast.remove());
}

/* ---------- FAQ ---------- */
function initFAQs() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ---------- MODALS ---------- */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 150);
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
});

// ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
  }
});

/* ---------- UTILS ---------- */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
  return String(str).replace(/['"]/g, '');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function setLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<i class="fa-solid fa-spinner fa-spin"></i> ' + text
    : text;
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
}

/* ---------- INITIAL PAGE ---------- */
navigateTo('home');