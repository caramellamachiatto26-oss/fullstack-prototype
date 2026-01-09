/**
 * LocalStorage & Authentication Logic
 */

// Helper to get users from localStorage
const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];

/**
 * Loads the current user data from localStorage into the Profile UI
 */
function loadProfileData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        // Updates the HTML elements in the profile section
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileRole = document.getElementById('profile-role');

        if (profileName) profileName.innerText = `${user.firstName} ${user.lastName}`;
        if (profileEmail) profileEmail.innerText = user.email;
        if (profileRole) profileRole.innerText = user.role || 'Admin';
    }
}

/**
 * Updated View Switching Logic
 * Now includes 'accounts' and 'requests'
 */
function showSection(sectionId) {
    // List ALL section IDs here
    const sections = ['home', 'employees', 'departments', 'accounts', 'profile', 'register', 'login', 'requests'];
    
    sections.forEach(id => {
        const el = document.getElementById(id + '-section');
        if (el) el.classList.add('d-none'); // Hide everyone
    });

    // Show only the selected one
    const target = document.getElementById(sectionId + '-section');
    if (target) {
        // Run profile update if that section is chosen
        if (sectionId === 'profile') loadProfileData();
        target.classList.remove('d-none');
    }
}


function updateAuthUI(isLoggedIn) {
    const guestLinks = document.getElementById('guest-links');
    const adminNavItem = document.getElementById('admin-nav-item');

    if (isLoggedIn) {
        if (guestLinks) guestLinks.classList.add('d-none');
        if (adminNavItem) adminNavItem.classList.remove('d-none');
    } else {
        if (guestLinks) guestLinks.classList.remove('d-none');
        if (adminNavItem) adminNavItem.classList.add('d-none');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const firstName = document.getElementById('reg-fname').value;
            const lastName = document.getElementById('reg-lname').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            const users = getUsers();

            if (users.find(u => u.email === email)) {
                alert("Email already registered!");
                return;
            }

            const newUser = { firstName, lastName, email, password, role: 'admin' };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            alert("Registration Successful! Please login.");
            this.reset();
            showSection('login');
        });
    }

    // --- Login Logic ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const users = getUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                updateAuthUI(true);
                showSection('home');
                loginForm.reset();
            } else {
                alert("Invalid email or password!");
            }
        });
    }

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        updateAuthUI(true);
    } else {
        updateAuthUI(false);
    }
    
    showSection('home');
});


function handleLogout() {
    localStorage.removeItem('currentUser');
    updateAuthUI(false);
    showSection('home');
}