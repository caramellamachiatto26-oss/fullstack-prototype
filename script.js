/**
 * LocalStorage & Authentication Logic
 */

// Helper to get users from localStorage
const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];

/**
 * Initialize window.db if it doesn't exist
 */
if (typeof window.db === 'undefined') {
    window.db = {
        accounts: [],
        requests: [],
        departments: []
    };
} else {
    if (!window.db.requests) {
        window.db.requests = [];
    }
    if (!window.db.departments) {
        window.db.departments = [];
    }
}

/**
 * Load accounts from localStorage into window.db.accounts
 * Ensures all users have IDs for security checks
 */
function loadAccountsToDb() {
    const users = getUsers();
    window.db.accounts = users.map(user => ensureUserHasId(user));
    // Save back to ensure IDs persist
    if (users.length > 0) {
        localStorage.setItem('users', JSON.stringify(window.db.accounts));
    }
}

/**
 * Save window.db.accounts to localStorage
 */
function saveToStorage() {
    localStorage.setItem('users', JSON.stringify(window.db.accounts));
}

/**
 * Save window.db.requests to localStorage
 */
function saveRequestsToStorage() {
    localStorage.setItem('requests', JSON.stringify(window.db.requests));
}

/**
 * Load requests from localStorage into window.db.requests
 */
function loadRequestsToDb() {
    const storedRequests = localStorage.getItem('requests');
    if (storedRequests) {
        window.db.requests = JSON.parse(storedRequests);
    } else {
        window.db.requests = [];
    }
}

/**
 * Render profile data to the UI
 */
function renderProfile() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileRole = document.getElementById('profile-role');

        if (profileName) profileName.innerText = `${user.firstName} ${user.lastName}`;
        if (profileEmail) profileEmail.innerText = user.email;
        if (profileRole) profileRole.innerText = user.role || 'User';
    }
}

/**
 * Loads the current user data from localStorage into the Profile UI
 */
function loadProfileData() {
    renderProfile();
}

/**
 * Updated View Switching Logic
 * Now includes 'accounts' and 'requests'
 */
function showSection(sectionId) {
    // List ALL section IDs here
    const sections = ['home', 'employees', 'departments', 'accounts', 'profile', 'register', 'login', 'requests', 'edit-account', 'edit-department'];
    
    sections.forEach(id => {
        const el = document.getElementById(id + '-section');
        if (el) el.classList.add('d-none'); // Hide everyone
    });

    // Show only the selected one
    const target = document.getElementById(sectionId + '-section');
    if (target) {
        // Run profile update if that section is chosen
        if (sectionId === 'profile') loadProfileData();
        // Run requests list render if that section is chosen
        if (sectionId === 'requests') renderRequestsList();
        // Run accounts list render if that section is chosen
        if (sectionId === 'accounts') renderAccounts();
        // Run departments list render if that section is chosen
        if (sectionId === 'departments') renderDepartments();
        // Update employee department dropdown if employees section is shown
        if (sectionId === 'employees') updateEmployeeDepartmentDropdown();
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
            ensureUserHasId(newUser);
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
                // Ensure user has ID for security checks
                ensureUserHasId(user);
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
    
    // Initialize window.db.accounts
    loadAccountsToDb();
    
    // Initialize window.db.requests
    loadRequestsToDb();
    
    // Initialize window.db.departments
    loadDepartmentsToDb();
    
    // Initialize employee department dropdown
    updateEmployeeDepartmentDropdown();
    
    // Request Form Handler
    const submitRequestBtn = document.getElementById('submitRequestBtn');
    if (submitRequestBtn) {
        submitRequestBtn.addEventListener('click', function() {
            handleRequestSubmission();
        });
    }

    // Request Form Item Management
    setupRequestFormItemManagement();

    // Reset request form when modal is closed
    const requestModal = document.getElementById('requestModal');
    if (requestModal) {
        requestModal.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('request-form');
            if (form) {
                form.reset();
                // Reset to default two item rows
                const itemsContainer = form.querySelector('.mb-2');
                if (itemsContainer) {
                    const existingGroups = itemsContainer.querySelectorAll('.input-group');
                    // Keep only first two groups, remove extras
                    existingGroups.forEach((group, index) => {
                        if (index >= 2) {
                            group.remove();
                        } else {
                            // Reset values
                            const nameInput = group.querySelector('input[type="text"]');
                            const qtyInput = group.querySelector('input[type="number"]');
                            if (nameInput) nameInput.value = '';
                            if (qtyInput) qtyInput.value = '1';
                            // Set button to + for first, × for second
                            const btn = group.querySelector('button');
                            if (btn) {
                                if (index === 0) {
                                    btn.className = 'btn btn-outline-secondary';
                                    btn.textContent = '+';
                                } else {
                                    btn.className = 'btn btn-outline-danger';
                                    btn.textContent = '×';
                                }
                            }
                        }
                    });
                }
            }
        });
    }
    
    // Edit Account Form Handler
    const editAccountForm = document.getElementById('edit-account-form');
    if (editAccountForm) {
        editAccountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const accountIdInput = document.getElementById('edit-acc-id');
            const accountId = accountIdInput ? accountIdInput.value : null;
            
            if (!accountId) {
                showToast('Error: Account ID not found', 'error');
                return;
            }
            
            const title = document.getElementById('edit-acc-title').value;
            const firstName = document.getElementById('edit-acc-fname').value.trim();
            const lastName = document.getElementById('edit-acc-lname').value.trim();
            const email = document.getElementById('edit-acc-email').value.trim();
            const role = document.getElementById('edit-acc-role').value;
            const status = document.getElementById('edit-acc-status').value;
            
            // Validation
            if (!firstName || !lastName || !email) {
                showToast('Please fill in all required fields', 'error');
                return;
            }
            
            loadAccountsToDb();
            
            const accountIndex = window.db.accounts.findIndex(acc => {
                ensureUserHasId(acc);
                return acc.id === accountId || acc.email === accountId;
            });
            
            if (accountIndex === -1) {
                showToast('Error: Account not found', 'error');
                return;
            }
            
            const existingAccount = window.db.accounts[accountIndex];
            
            // Check if email is being changed and if it's already taken
            if (email !== existingAccount.email) {
                const emailExists = window.db.accounts.some(acc => {
                    ensureUserHasId(acc);
                    return acc.email === email && acc.id !== existingAccount.id;
                });
                if (emailExists) {
                    showToast('Error: Email already exists', 'error');
                    return;
                }
            }
            
            // Update account
            window.db.accounts[accountIndex] = {
                ...existingAccount,
                title: title,
                firstName: firstName,
                lastName: lastName,
                email: email,
                role: role,
                status: status,
                verified: status === 'Active'
            };
            
            ensureUserHasId(window.db.accounts[accountIndex]);
            
            // Update currentUser if it's the same account
            const currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                ensureUserHasId(currentUser);
                if (currentUser.id === window.db.accounts[accountIndex].id || currentUser.email === window.db.accounts[accountIndex].email) {
                    localStorage.setItem('currentUser', JSON.stringify(window.db.accounts[accountIndex]));
                }
            }
            
            saveToStorage();
            showToast('Account updated successfully!', 'success');
            
            // Return to accounts list
            showSection('accounts');
        });
    }
    
    // Edit Department Section Form Handler
    const editDepartmentSectionForm = document.getElementById('edit-department-section-form');
    if (editDepartmentSectionForm) {
        editDepartmentSectionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const departmentIdInput = document.getElementById('edit-dept-section-id');
            const departmentId = departmentIdInput ? departmentIdInput.value : null;
            
            if (!departmentId) {
                showToast('Error: Department ID not found', 'error');
                return;
            }
            
            const name = document.getElementById('edit-dept-section-name').value.trim();
            const description = document.getElementById('edit-dept-section-description').value.trim();
            
            // Validation
            if (!name) {
                showToast('Please enter a department name', 'error');
                return;
            }
            
            loadDepartmentsToDb();
            
            const departmentIndex = window.db.departments.findIndex(dept => dept.id === departmentId);
            
            if (departmentIndex === -1) {
                showToast('Error: Department not found', 'error');
                return;
            }
            
            // Check if name is being changed and if it's already taken
            if (name !== window.db.departments[departmentIndex].name) {
                const nameExists = window.db.departments.some(dept => 
                    dept.name.toLowerCase() === name.toLowerCase() && dept.id !== departmentId
                );
                if (nameExists) {
                    showToast('Error: Department name already exists', 'error');
                    return;
                }
            }
            
            // Update department
            window.db.departments[departmentIndex] = {
                ...window.db.departments[departmentIndex],
                name: name,
                description: description
            };
            
            saveDepartmentsToStorage();
            showToast('Department updated successfully!', 'success');
            
            // Return to departments list
            showSection('departments');
            
            // Update employee form department dropdown
            updateEmployeeDepartmentDropdown();
        });
    }
    
    // Edit Profile Form Handler
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous errors
            clearValidationErrors();
            
            const firstName = document.getElementById('edit-fname').value.trim();
            const lastName = document.getElementById('edit-lname').value.trim();
            const password = document.getElementById('edit-password').value;
            
            let hasErrors = false;
            
            // Validate first name
            if (firstName.length < 2) {
                document.getElementById('edit-fname').classList.add('is-invalid');
                document.getElementById('edit-fname-error').textContent = 'First name must be at least 2 characters';
                hasErrors = true;
            }
            
            // Validate last name
            if (lastName.length < 2) {
                document.getElementById('edit-lname').classList.add('is-invalid');
                document.getElementById('edit-lname-error').textContent = 'Last name must be at least 2 characters';
                hasErrors = true;
            }
            
            // Validate password (if provided)
            if (password && password.length < 6) {
                document.getElementById('edit-password').classList.add('is-invalid');
                document.getElementById('edit-password-error').textContent = 'Password must be at least 6 characters';
                hasErrors = true;
            }
            
            if (hasErrors) {
                return;
            }
            
            // Get current user
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                showToast('Error: User not found', 'error');
                return;
            }
            
            // Update user object
            const updatedUser = {
                ...currentUser,
                firstName: firstName,
                lastName: lastName
            };
            
            // Update password only if provided
            if (password) {
                updatedUser.password = password;
            }
            
            // Update in window.db.accounts
            loadAccountsToDb();
            const accountIndex = window.db.accounts.findIndex(acc => acc.email === currentUser.email);
            if (accountIndex !== -1) {
                window.db.accounts[accountIndex] = { ...updatedUser };
                saveToStorage();
            }
            
            // Update currentUser in localStorage
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            // Re-render profile
            renderProfile();
            
            // Hide form and show view
            toggleEditProfileForm();
            
            // Show success toast
            showToast('Profile updated successfully!', 'success');
        });
    }
    
    showSection('home');
});


function handleLogout() {
    localStorage.removeItem('currentUser');
    updateAuthUI(false);
    showSection('home');
}

/**
 * Toggle edit profile form visibility
 */
function toggleEditProfileForm() {
    const profileView = document.getElementById('profile-view');
    const profileEditForm = document.getElementById('profile-edit-form');
    
    if (profileView && profileEditForm) {
        const isEditing = !profileEditForm.classList.contains('d-none');
        
        if (isEditing) {
            // Hide form, show view
            profileEditForm.classList.add('d-none');
            profileView.classList.remove('d-none');
        } else {
            // Show form, hide view
            profileView.classList.add('d-none');
            profileEditForm.classList.remove('d-none');
            
            // Pre-fill form with current user data
            const user = JSON.parse(localStorage.getItem('currentUser'));
            if (user) {
                document.getElementById('edit-fname').value = user.firstName || '';
                document.getElementById('edit-lname').value = user.lastName || '';
                document.getElementById('edit-email').value = user.email || '';
                document.getElementById('edit-role').value = user.role || 'User';
                document.getElementById('edit-password').value = '';
                
                // Clear previous validation errors
                clearValidationErrors();
            }
        }
    }
}

/**
 * Clear validation error messages
 */
function clearValidationErrors() {
    document.getElementById('edit-fname-error').textContent = '';
    document.getElementById('edit-lname-error').textContent = '';
    document.getElementById('edit-password-error').textContent = '';
    document.getElementById('edit-fname').classList.remove('is-invalid');
    document.getElementById('edit-lname').classList.remove('is-invalid');
    document.getElementById('edit-password').classList.remove('is-invalid');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToast = document.getElementById('toast-container');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    
    const bgColor = type === 'success' ? 'bg-success' : 'bg-danger';
    toastContainer.innerHTML = `
        <div class="toast show ${bgColor} text-white" role="alert">
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (toastContainer) {
            toastContainer.remove();
        }
    }, 3000);
}

/**
 * Ensure user has an ID field (for backward compatibility)
 * Uses email as the basis for ID since emails are unique
 */
function ensureUserHasId(user) {
    if (!user.id) {
        // Generate ID based on email (email should be unique per user)
        if (user.email) {
            // Use email as base for ID - consistent across loads
            user.id = `user_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        } else {
            // Fallback for users without email (shouldn't happen in normal flow)
            user.id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    }
    return user;
}

/**
 * Count how many admin accounts exist
 */
function countAdminAccounts() {
    loadAccountsToDb();
    return window.db.accounts.filter(acc => acc.role === 'admin' || acc.role === 'Admin').length;
}

/**
 * Secure deleteAccount function with multiple security checks
 * - Prevents self-deletion by comparing IDs
 * - Uses Bootstrap modal for confirmation
 * - Prevents deletion of the last admin
 */
function deleteAccount(id) {
    // Get current user
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
        showToast('Error: You must be logged in to delete accounts', 'error');
        return;
    }
    
    const currentUser = JSON.parse(currentUserStr);
    ensureUserHasId(currentUser);
    
    // Load accounts
    loadAccountsToDb();
    
    // Find the account to delete
    const accountToDelete = window.db.accounts.find(acc => {
        ensureUserHasId(acc);
        return acc.id === id || acc.email === id; // Support both ID and email for backward compatibility
    });
    
    if (!accountToDelete) {
        showToast('Error: Account not found', 'error');
        return;
    }
    
    ensureUserHasId(accountToDelete);
    
    // SECURITY CHECK 1: Prevent self-deletion by comparing IDs
    if (currentUser.id === accountToDelete.id) {
        showToast('Error: You cannot delete your own account', 'error');
        return;
    }
    
    // SECURITY CHECK 2: Prevent deletion of the last admin
    if (accountToDelete.role === 'admin' || accountToDelete.role === 'Admin') {
        const adminCount = countAdminAccounts();
        if (adminCount <= 1) {
            showToast('Error: Cannot delete the last admin account. At least one admin must remain.', 'error');
            return;
        }
    }
    
    // Show Bootstrap modal for confirmation
    const modalElement = document.getElementById('deleteAccountModal');
    if (!modalElement) {
        showToast('Error: Delete confirmation modal not found', 'error');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    const emailElement = document.getElementById('delete-account-email');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    
    if (emailElement) {
        emailElement.textContent = accountToDelete.email;
    }
    
    // Store the account ID in the modal's data attribute
    if (modalElement) {
        modalElement.setAttribute('data-account-id', accountToDelete.id);
    }
    
    // Set up one-time event listener for confirm button
    if (confirmBtn) {
        // Remove any existing listeners by replacing the button
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // Add event listener to the new button
        newConfirmBtn.addEventListener('click', function() {
            const accountId = modalElement.getAttribute('data-account-id');
            if (accountId) {
                performAccountDeletion(accountId);
                modal.hide();
            }
        });
    }
    
    modal.show();
}

/**
 * Perform the actual account deletion after confirmation
 */
function performAccountDeletion(id) {
    loadAccountsToDb();
    
    const accountToDelete = window.db.accounts.find(acc => {
        ensureUserHasId(acc);
        return acc.id === id || acc.email === id;
    });
    
    if (!accountToDelete) {
        showToast('Error: Account not found', 'error');
        return;
    }
    
    // Final security check: prevent self-deletion
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        ensureUserHasId(currentUser);
        ensureUserHasId(accountToDelete);
        
        if (currentUser.id === accountToDelete.id) {
            showToast('Error: You cannot delete your own account', 'error');
            return;
        }
    }
    
    // Final check: prevent deletion of last admin
    if (accountToDelete.role === 'admin' || accountToDelete.role === 'Admin') {
        const adminCount = countAdminAccounts();
        if (adminCount <= 1) {
            showToast('Error: Cannot delete the last admin account. At least one admin must remain.', 'error');
            return;
        }
    }
    
    // Remove account
    window.db.accounts = window.db.accounts.filter(acc => {
        ensureUserHasId(acc);
        ensureUserHasId(accountToDelete);
        return acc.id !== accountToDelete.id;
    });
    
    saveToStorage();
    showToast(`Account ${accountToDelete.email} deleted successfully`, 'success');
    
    // Refresh accounts list if it exists
    if (typeof renderAccounts === 'function') {
        renderAccounts();
    }
}

/**
 * Accounts Management Functions
 */

/**
 * Render accounts in the table
 */
function renderAccounts() {
    loadAccountsToDb();
    const accountsList = document.getElementById('accounts-list');
    if (!accountsList) return;

    accountsList.innerHTML = '';

    if (window.db.accounts.length === 0) {
        accountsList.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">No accounts found.</td></tr>';
        return;
    }

    window.db.accounts.forEach(account => {
        ensureUserHasId(account);
        const row = document.createElement('tr');
        
        // Get status badge class
        const status = account.status || (account.verified !== false ? 'Active' : 'Inactive');
        const statusClass = status === 'Active' ? 'bg-success' : 'bg-danger';
        const statusText = status === 'Active' ? 'Active' : 'Inactive';
        
        // Get title (default to empty if not set)
        const title = account.title || '';
        
        row.innerHTML = `
            <td>${escapeHtml(title)}</td>
            <td>${escapeHtml(account.firstName || '')}</td>
            <td>${escapeHtml(account.lastName || '')}</td>
            <td>${escapeHtml(account.email || '')}</td>
            <td>${escapeHtml(account.role || 'User')}</td>
            <td><span class="badge ${statusClass} text-white rounded-pill">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openEditAccountForm('${account.id}')">Edit</button>
                <button class="btn btn-sm btn-danger ms-1" onclick="deleteAccount('${account.id}')">Delete</button>
            </td>
        `;
        
        accountsList.appendChild(row);
    });
}

/**
 * Open account modal for add or edit
 */
function openAccountModal(accountId = null) {
    const form = document.getElementById('account-form');
    const modalLabel = document.getElementById('accountModalLabel');
    const accountIdInput = document.getElementById('acc-id');
    
    // Reset form
    if (form) form.reset();
    
    if (accountId) {
        // Edit mode
        if (modalLabel) modalLabel.textContent = 'Edit Account';
        
        loadAccountsToDb();
        const account = window.db.accounts.find(acc => {
            ensureUserHasId(acc);
            return acc.id === accountId || acc.email === accountId;
        });
        
        if (account) {
            if (accountIdInput) accountIdInput.value = account.id || account.email;
            document.getElementById('acc-title').value = account.title || 'Mr';
            document.getElementById('acc-fname').value = account.firstName || '';
            document.getElementById('acc-lname').value = account.lastName || '';
            document.getElementById('acc-email').value = account.email || '';
            document.getElementById('acc-role').value = account.role || 'User';
            document.getElementById('acc-status').value = account.status || (account.verified !== false ? 'Active' : 'Inactive');
            // Don't populate password field for security
        }
    } else {
        // Add mode
        if (modalLabel) modalLabel.textContent = 'Add Account';
        if (accountIdInput) accountIdInput.value = '';
    }
}

/**
 * Handle account form submission
 */
function handleAccountSubmission() {
    const accountIdInput = document.getElementById('acc-id');
    const accountId = accountIdInput ? accountIdInput.value : null;
    
    const title = document.getElementById('acc-title').value;
    const firstName = document.getElementById('acc-fname').value.trim();
    const lastName = document.getElementById('acc-lname').value.trim();
    const email = document.getElementById('acc-email').value.trim();
    const password = document.getElementById('acc-pass').value;
    const role = document.getElementById('acc-role').value;
    const status = document.getElementById('acc-status').value;
    
    // Validation
    if (!firstName || !lastName || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    loadAccountsToDb();
    
    if (accountId) {
        // Edit mode
        const accountIndex = window.db.accounts.findIndex(acc => {
            ensureUserHasId(acc);
            return acc.id === accountId || acc.email === accountId;
        });
        
        if (accountIndex === -1) {
            showToast('Error: Account not found', 'error');
            return;
        }
        
        const existingAccount = window.db.accounts[accountIndex];
        
        // Check if email is being changed and if it's already taken
        if (email !== existingAccount.email) {
            const emailExists = window.db.accounts.some(acc => {
                ensureUserHasId(acc);
                return acc.email === email && acc.id !== existingAccount.id;
            });
            if (emailExists) {
                showToast('Error: Email already exists', 'error');
                return;
            }
        }
        
        // Update account
        window.db.accounts[accountIndex] = {
            ...existingAccount,
            title: title,
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: role,
            status: status,
            verified: status === 'Active'
        };
        
        // Update password only if provided
        if (password) {
            window.db.accounts[accountIndex].password = password;
        }
        
        ensureUserHasId(window.db.accounts[accountIndex]);
        
        // Update currentUser if it's the same account
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            ensureUserHasId(currentUser);
            if (currentUser.id === window.db.accounts[accountIndex].id || currentUser.email === window.db.accounts[accountIndex].email) {
                localStorage.setItem('currentUser', JSON.stringify(window.db.accounts[accountIndex]));
            }
        }
        
        showToast('Account updated successfully!', 'success');
    } else {
        // Add mode
        // Check if email already exists
        const emailExists = window.db.accounts.some(acc => {
            ensureUserHasId(acc);
            return acc.email === email;
        });
        
        if (emailExists) {
            showToast('Error: Email already exists', 'error');
            return;
        }
        
        // Create new account
        const newAccount = {
            title: title,
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password || 'default123', // Default password if not provided
            role: role,
            status: status,
            verified: status === 'Active'
        };
        
        ensureUserHasId(newAccount);
        window.db.accounts.push(newAccount);
        
        showToast('Account created successfully!', 'success');
    }
    
    saveToStorage();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
    if (modal) modal.hide();
    
    // Reset form
    const form = document.getElementById('account-form');
    if (form) form.reset();
    
    // Refresh accounts list
    renderAccounts();
}

/**
 * Request Management Functions
 */

/**
 * Handle request form submission
 */
function handleRequestSubmission() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showToast('Error: You must be logged in to submit requests', 'error');
        return;
    }

    const typeInput = document.getElementById('req-type');
    if (!typeInput) return;

    const type = typeInput.value.trim();
    if (!type) {
        showToast('Please enter a request type', 'error');
        return;
    }

    // Collect items from the form
    const items = [];
    const itemGroups = document.querySelectorAll('#request-form .input-group');
    itemGroups.forEach(group => {
        const nameInput = group.querySelector('input[type="text"]');
        const qtyInput = group.querySelector('input[type="number"]');
        if (nameInput && qtyInput && nameInput.value.trim()) {
            items.push({
                name: nameInput.value.trim(),
                quantity: parseInt(qtyInput.value) || 1
            });
        }
    });

    if (items.length === 0) {
        showToast('Please add at least one item', 'error');
        return;
    }

    // Create new request
    const newRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.id || currentUser.email,
        type: type,
        items: items,
        status: 'Pending',
        date: new Date().toISOString()
    };

    // Add to window.db.requests
    loadRequestsToDb();
    window.db.requests.push(newRequest);
    saveRequestsToStorage();

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
    if (modal) modal.hide();
    document.getElementById('request-form').reset();

    // Re-render requests list
    renderRequestsList();

    showToast('Request submitted successfully!', 'success');
}

/**
 * Render the requests list for the current user
 */
function renderRequestsList() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        return;
    }

    loadRequestsToDb();
    ensureUserHasId(currentUser);

    // Filter requests for current user
    const userRequests = window.db.requests.filter(req => {
        return req.userId === currentUser.id || req.userId === currentUser.email;
    });

    const emptyDiv = document.getElementById('empty-requests');
    const tableContainer = document.getElementById('requests-table-container');
    const requestList = document.getElementById('request-list');

    if (!requestList) return;

    if (userRequests.length === 0) {
        if (emptyDiv) emptyDiv.classList.remove('d-none');
        if (tableContainer) tableContainer.classList.add('d-none');
        return;
    }

    if (emptyDiv) emptyDiv.classList.add('d-none');
    if (tableContainer) tableContainer.classList.remove('d-none');

    // Clear existing rows
    requestList.innerHTML = '';

    // Render each request
    userRequests.forEach(request => {
        const row = document.createElement('tr');
        
        // Format items as text
        const itemsText = request.items.map(item => 
            `${item.name} (${item.quantity})`
        ).join(', ');

        // Format date
        const date = new Date(request.date);
        const dateStr = date.toLocaleDateString();

        // Get status badge class
        let statusClass = 'bg-warning';
        if (request.status === 'Approved') {
            statusClass = 'bg-success';
        } else if (request.status === 'Rejected') {
            statusClass = 'bg-danger';
        }

        row.innerHTML = `
            <td>${escapeHtml(request.type)}</td>
            <td>${escapeHtml(itemsText)}</td>
            <td><span class="badge ${statusClass}">${escapeHtml(request.status)}</span></td>
            <td>${dateStr}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="openEditRequestModal('${request.id}')">
                    Edit
                </button>
            </td>
        `;

        requestList.appendChild(row);
    });
}

/**
 * Open edit request modal
 */
function openEditRequestModal(requestId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showToast('Error: You must be logged in to edit requests', 'error');
        return;
    }

    loadRequestsToDb();
    const request = window.db.requests.find(r => r.id === requestId);
    
    if (!request) {
        showToast('Error: Request not found', 'error');
        return;
    }

    // Check if user owns this request
    ensureUserHasId(currentUser);
    if (request.userId !== currentUser.id && request.userId !== currentUser.email) {
        showToast('Error: You can only edit your own requests', 'error');
        return;
    }

    // Populate edit modal
    const editTypeInput = document.getElementById('edit-req-type');
    const editItemsContainer = document.getElementById('edit-req-items');
    const editStatusSelect = document.getElementById('edit-req-status');
    const editRequestIdInput = document.getElementById('edit-req-id');

    if (editTypeInput) editTypeInput.value = request.type;
    if (editRequestIdInput) editRequestIdInput.value = request.id;

    // Populate items (read-only)
    if (editItemsContainer) {
        editItemsContainer.innerHTML = '';
        request.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'mb-2 p-2 bg-light rounded';
            itemDiv.textContent = `${item.name} (${item.quantity})`;
            editItemsContainer.appendChild(itemDiv);
        });
    }

    // Set status
    if (editStatusSelect) {
        editStatusSelect.value = request.status;
    }

    // Show modal
    const editModal = new bootstrap.Modal(document.getElementById('editRequestModal'));
    editModal.show();
}

/**
 * Handle edit request form submission
 */
function handleEditRequestSubmission() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showToast('Error: You must be logged in to edit requests', 'error');
        return;
    }

    const requestIdInput = document.getElementById('edit-req-id');
    const statusSelect = document.getElementById('edit-req-status');

    if (!requestIdInput || !statusSelect) {
        showToast('Error: Form elements not found', 'error');
        return;
    }

    const requestId = requestIdInput.value;
    const newStatus = statusSelect.value;

    if (!requestId || !newStatus) {
        showToast('Error: Invalid request data', 'error');
        return;
    }

    loadRequestsToDb();
    const requestIndex = window.db.requests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) {
        showToast('Error: Request not found', 'error');
        return;
    }

    const request = window.db.requests[requestIndex];
    ensureUserHasId(currentUser);

    // Verify ownership
    if (request.userId !== currentUser.id && request.userId !== currentUser.email) {
        showToast('Error: You can only edit your own requests', 'error');
        return;
    }

    // Update status
    window.db.requests[requestIndex].status = newStatus;
    saveRequestsToStorage();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editRequestModal'));
    if (modal) modal.hide();

    // Re-render list
    renderRequestsList();

    showToast('Request status updated.', 'success');
}

/**
 * Open edit account form section
 */
function openEditAccountForm(accountId) {
    if (!accountId) {
        showToast('Error: Account ID not provided', 'error');
        return;
    }
    
    loadAccountsToDb();
    const account = window.db.accounts.find(acc => {
        ensureUserHasId(acc);
        return acc.id === accountId || acc.email === accountId;
    });
    
    if (!account) {
        showToast('Error: Account not found', 'error');
        return;
    }
    
    // Populate form fields
    document.getElementById('edit-acc-id').value = account.id || account.email;
    document.getElementById('edit-acc-title').value = account.title || 'Mr';
    document.getElementById('edit-acc-fname').value = account.firstName || '';
    document.getElementById('edit-acc-lname').value = account.lastName || '';
    document.getElementById('edit-acc-email').value = account.email || '';
    document.getElementById('edit-acc-role').value = account.role || 'User';
    document.getElementById('edit-acc-status').value = account.status || (account.verified !== false ? 'Active' : 'Inactive');
    
    // Show edit account section
    showSection('edit-account');
}

/**
 * Cancel edit account and return to accounts list
 */
function cancelEditAccount() {
    showSection('accounts');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Setup request form item management (add/remove items)
 */
function setupRequestFormItemManagement() {
    const requestForm = document.getElementById('request-form');
    if (!requestForm) return;

    // Handle add item button clicks
    requestForm.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-outline-secondary') && e.target.textContent === '+') {
            e.preventDefault();
            addRequestFormItem();
        } else if (e.target.classList.contains('btn-outline-danger') && e.target.textContent === '×') {
            e.preventDefault();
            const itemGroup = e.target.closest('.input-group');
            if (itemGroup) {
                // Only remove if there's more than one item group
                const allGroups = requestForm.querySelectorAll('.input-group');
                if (allGroups.length > 1) {
                    itemGroup.remove();
                }
            }
        }
    });
}

/**
 * Add a new item row to the request form
 */
function addRequestFormItem() {
    const requestForm = document.getElementById('request-form');
    if (!requestForm) return;

    const itemsContainer = requestForm.querySelector('.mb-2');
    if (!itemsContainer) return;

    const newItemGroup = document.createElement('div');
    newItemGroup.className = 'input-group mb-2';
    newItemGroup.innerHTML = `
        <input type="text" class="form-control" placeholder="Item name">
        <input type="number" class="form-control" value="1" style="max-width: 80px;">
        <button class="btn btn-outline-danger" type="button">×</button>
    `;
    itemsContainer.appendChild(newItemGroup);
}

/**
 * Department Management Functions
 */

/**
 * Load departments from localStorage into window.db.departments
 */
function loadDepartmentsToDb() {
    const storedDepartments = localStorage.getItem('departments');
    if (storedDepartments) {
        window.db.departments = JSON.parse(storedDepartments);
    } else {
        // Initialize with default departments if none exist
        window.db.departments = [
            { id: 'dept_1', name: 'Engineering', description: 'Software team' },
            { id: 'dept_2', name: 'HR', description: 'Human Resources' }
        ];
        saveDepartmentsToStorage();
    }
}

/**
 * Save window.db.departments to localStorage
 */
function saveDepartmentsToStorage() {
    localStorage.setItem('departments', JSON.stringify(window.db.departments));
}

/**
 * Render departments in the table
 */
function renderDepartments() {
    loadDepartmentsToDb();
    const departmentList = document.getElementById('department-list');
    if (!departmentList) return;

    departmentList.innerHTML = '';

    if (window.db.departments.length === 0) {
        departmentList.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-muted">No departments found.</td></tr>';
        return;
    }

    window.db.departments.forEach(department => {
        const row = document.createElement('tr');
        row.className = 'border-bottom';
        
        row.innerHTML = `
            <td class="py-3">${escapeHtml(department.name || '')}</td>
            <td class="text-muted">${escapeHtml(department.description || '')}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditDepartmentSection('${department.id}')">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment('${department.id}')">Delete</button>
            </td>
        `;
        
        departmentList.appendChild(row);
    });
}

/**
 * Open department modal for add or edit
 */
function openDepartmentModal(departmentId = null) {
    const form = document.getElementById('department-form');
    const modalLabel = document.getElementById('departmentModalLabel');
    const departmentIdInput = document.getElementById('dept-id');
    
    // Reset form
    if (form) form.reset();
    
    if (departmentId) {
        // Edit mode
        if (modalLabel) modalLabel.textContent = 'Edit Department';
        
        loadDepartmentsToDb();
        const department = window.db.departments.find(dept => dept.id === departmentId);
        
        if (department) {
            if (departmentIdInput) departmentIdInput.value = department.id;
            document.getElementById('dept-name').value = department.name || '';
            document.getElementById('dept-description').value = department.description || '';
        }
    } else {
        // Add mode
        if (modalLabel) modalLabel.textContent = 'Add Department';
        if (departmentIdInput) departmentIdInput.value = '';
    }
}

/**
 * Handle department form submission
 */
function handleDepartmentSubmission() {
    const departmentIdInput = document.getElementById('dept-id');
    const departmentId = departmentIdInput ? departmentIdInput.value : null;
    
    const name = document.getElementById('dept-name').value.trim();
    const description = document.getElementById('dept-description').value.trim();
    
    // Validation
    if (!name) {
        showToast('Please enter a department name', 'error');
        return;
    }
    
    loadDepartmentsToDb();
    
    if (departmentId) {
        // Edit mode
        const departmentIndex = window.db.departments.findIndex(dept => dept.id === departmentId);
        
        if (departmentIndex === -1) {
            showToast('Error: Department not found', 'error');
            return;
        }
        
        // Check if name is being changed and if it's already taken
        if (name !== window.db.departments[departmentIndex].name) {
            const nameExists = window.db.departments.some(dept => 
                dept.name.toLowerCase() === name.toLowerCase() && dept.id !== departmentId
            );
            if (nameExists) {
                showToast('Error: Department name already exists', 'error');
                return;
            }
        }
        
        // Update department
        window.db.departments[departmentIndex] = {
            ...window.db.departments[departmentIndex],
            name: name,
            description: description
        };
        
        showToast('Department updated successfully!', 'success');
    } else {
        // Add mode
        // Check if name already exists
        const nameExists = window.db.departments.some(dept => 
            dept.name.toLowerCase() === name.toLowerCase()
        );
        
        if (nameExists) {
            showToast('Error: Department name already exists', 'error');
            return;
        }
        
        // Create new department
        const newDepartment = {
            id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            description: description
        };
        
        window.db.departments.push(newDepartment);
        
        showToast('Department created successfully!', 'success');
    }
    
    saveDepartmentsToStorage();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('departmentModal'));
    if (modal) modal.hide();
    
    // Reset form
    const form = document.getElementById('department-form');
    if (form) form.reset();
    
    // Refresh departments list
    renderDepartments();
    
    // Update employee form department dropdown
    updateEmployeeDepartmentDropdown();
}

/**
 * Delete department with confirmation
 */
function deleteDepartment(departmentId) {
    loadDepartmentsToDb();
    
    const departmentToDelete = window.db.departments.find(dept => dept.id === departmentId);
    
    if (!departmentToDelete) {
        showToast('Error: Department not found', 'error');
        return;
    }
    
    // Show Bootstrap modal for confirmation
    const modalElement = document.getElementById('deleteDepartmentModal');
    if (!modalElement) {
        showToast('Error: Delete confirmation modal not found', 'error');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    const nameElement = document.getElementById('delete-department-name');
    const confirmBtn = document.getElementById('confirm-delete-dept-btn');
    
    if (nameElement) {
        nameElement.textContent = departmentToDelete.name;
    }
    
    // Store the department ID in the modal's data attribute
    if (modalElement) {
        modalElement.setAttribute('data-department-id', departmentToDelete.id);
    }
    
    // Set up one-time event listener for confirm button
    if (confirmBtn) {
        // Remove any existing listeners by replacing the button
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // Add event listener to the new button
        newConfirmBtn.addEventListener('click', function() {
            const deptId = modalElement.getAttribute('data-department-id');
            if (deptId) {
                performDepartmentDeletion(deptId);
                modal.hide();
            }
        });
    }
    
    modal.show();
}

/**
 * Perform the actual department deletion after confirmation
 */
function performDepartmentDeletion(departmentId) {
    loadDepartmentsToDb();
    
    const departmentToDelete = window.db.departments.find(dept => dept.id === departmentId);
    
    if (!departmentToDelete) {
        showToast('Error: Department not found', 'error');
        return;
    }
    
    // Remove department
    window.db.departments = window.db.departments.filter(dept => dept.id !== departmentToDelete.id);
    
    saveDepartmentsToStorage();
    showToast(`Department ${departmentToDelete.name} deleted successfully`, 'success');
    
    // Refresh departments list
    renderDepartments();
    
    // Update employee form department dropdown
    updateEmployeeDepartmentDropdown();
}

/**
 * Update employee form department dropdown with current departments
 */
function updateEmployeeDepartmentDropdown() {
    loadDepartmentsToDb();
    const empDeptSelect = document.getElementById('emp-dept');
    if (!empDeptSelect) return;
    
    const currentValue = empDeptSelect.value;
    
    // Clear existing options
    empDeptSelect.innerHTML = '';
    
    // Add departments
    window.db.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        empDeptSelect.appendChild(option);
    });
    
    // Restore previous value if it still exists
    if (currentValue) {
        const optionExists = Array.from(empDeptSelect.options).some(opt => opt.value === currentValue);
        if (optionExists) {
            empDeptSelect.value = currentValue;
        }
    }
}

/**
 * Edit Department Modal Functions
 */

/**
 * Open edit department modal
 */
function openEditDepartmentModal(departmentId) {
    if (!departmentId) {
        showToast('Error: Department ID not provided', 'error');
        return;
    }
    
    loadDepartmentsToDb();
    const department = window.db.departments.find(dept => dept.id === departmentId);
    
    if (!department) {
        showToast('Error: Department not found', 'error');
        return;
    }
    
    // Populate form fields
    document.getElementById('edit-dept-id').value = department.id;
    document.getElementById('edit-dept-name').value = department.name || '';
    document.getElementById('edit-dept-description').value = department.description || '';
    
    // Show modal
    const editModal = new bootstrap.Modal(document.getElementById('editDepartmentModal'));
    editModal.show();
}

/**
 * Handle edit department form submission
 */
function handleEditDepartmentSubmission() {
    const departmentIdInput = document.getElementById('edit-dept-id');
    const departmentId = departmentIdInput ? departmentIdInput.value : null;
    
    if (!departmentId) {
        showToast('Error: Department ID not found', 'error');
        return;
    }
    
    const name = document.getElementById('edit-dept-name').value.trim();
    const description = document.getElementById('edit-dept-description').value.trim();
    
    // Validation
    if (!name) {
        showToast('Please enter a department name', 'error');
        return;
    }
    
    loadDepartmentsToDb();
    
    const departmentIndex = window.db.departments.findIndex(dept => dept.id === departmentId);
    
    if (departmentIndex === -1) {
        showToast('Error: Department not found', 'error');
        return;
    }
    
    // Check if name is being changed and if it's already taken
    if (name !== window.db.departments[departmentIndex].name) {
        const nameExists = window.db.departments.some(dept => 
            dept.name.toLowerCase() === name.toLowerCase() && dept.id !== departmentId
        );
        if (nameExists) {
            showToast('Error: Department name already exists', 'error');
            return;
        }
    }
    
    // Update department
    window.db.departments[departmentIndex] = {
        ...window.db.departments[departmentIndex],
        name: name,
        description: description
    };
    
    saveDepartmentsToStorage();
    showToast('Department updated successfully!', 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editDepartmentModal'));
    if (modal) modal.hide();
    
    // Reset form
    const form = document.getElementById('edit-department-form');
    if (form) form.reset();
    
    // Refresh departments list
    renderDepartments();
    
    // Update employee form department dropdown
    updateEmployeeDepartmentDropdown();
}

/**
 * Open edit department section (not modal)
 */
function openEditDepartmentSection(departmentId) {
    if (!departmentId) {
        showToast('Error: Department ID not provided', 'error');
        return;
    }
    
    loadDepartmentsToDb();
    const department = window.db.departments.find(dept => dept.id === departmentId);
    
    if (!department) {
        showToast('Error: Department not found', 'error');
        return;
    }
    
    // Populate form fields
    document.getElementById('edit-dept-section-id').value = department.id;
    document.getElementById('edit-dept-section-name').value = department.name || '';
    document.getElementById('edit-dept-section-description').value = department.description || '';
    
    // Show edit department section
    showSection('edit-department');
}

/**
 * Cancel edit department and return to departments list
 */
function cancelEditDepartment() {
    showSection('departments');
}