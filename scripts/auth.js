/**
 * Authentication Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles user authentication, session management, and role-based access control
 */

// Constants
const ADMIN_ROLE = 'admin';
const EMPLOYEE_ROLE = 'employee';
const SESSION_KEY = 'nomina_session';

// Default users for demo (in a real app, this would come from a database)
const DEFAULT_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123', // In a real app, this would be hashed
    role: ADMIN_ROLE,
    name: 'Administrador del Sistema'
  },
  {
    id: 101,
    username: 'empleado1',
    password: 'empleado123', // In a real app, this would be hashed
    role: EMPLOYEE_ROLE,
    name: 'Juan Pérez',
    employeeId: '1001'
  },
  {
    id: 102,
    username: 'empleado2',
    password: 'empleado123', // In a real app, this would be hashed
    role: EMPLOYEE_ROLE,
    name: 'María Rodríguez',
    employeeId: '1002'
  }
];

// Initialize user data in localStorage if it doesn't exist
function initializeUsers() {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
  }
}

// Authentication function
function authenticateUser(username, password) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Create session
    const session = {
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      employeeId: user.employeeId || null,
      loggedInAt: new Date().toISOString()
    };
    
    // Store session
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  }
  
  return false;
}

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem(SESSION_KEY) !== null;
}

// Get current user session
function getCurrentUser() {
  const sessionData = localStorage.getItem(SESSION_KEY);
  return sessionData ? JSON.parse(sessionData) : null;
}

// Check if current user has admin role
function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === ADMIN_ROLE;
}

// Check if current user has employee role
function isEmployee() {
  const user = getCurrentUser();
  return user && user.role === EMPLOYEE_ROLE;
}

// Logout user
function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '../index.html';
}

// Redirect if not authenticated
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
  }
}

// Redirect if not admin
function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) {
    if (isLoggedIn()) {
      logout(); // Force logout if trying to access admin page as employee
    } else {
      window.location.href = 'index.html';
    }
  }
}

// Redirect if not employee
function requireEmployee() {
  if (!isLoggedIn() || !isEmployee()) {
    if (isLoggedIn()) {
      logout(); // Force logout if trying to access employee page as admin
    } else {
      window.location.href = 'index.html';
    }
  }
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard() {
  if (isLoggedIn()) {
    const user = getCurrentUser();
    if (user.role === ADMIN_ROLE) {
      window.location.href = 'pages/admin.html';
    } else if (user.role === EMPLOYEE_ROLE) {
      window.location.href = 'pages/employee.html';
    }
  }
}

// Event handlers for login page
document.addEventListener('DOMContentLoaded', function() {
  // Initialize default users
  initializeUsers();
  
  // If we're on the login page and already logged in, redirect to dashboard
  if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
    if (isLoggedIn()) {
      redirectToDashboard();
      return;
    }
    
    // Login form handling
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
      loginButton.addEventListener('click', function() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('login-error');
        
        if (!username || !password) {
          errorMessage.textContent = 'Por favor ingrese usuario y contraseña';
          errorMessage.classList.remove('hide');
          return;
        }
        
        const isAuthenticated = authenticateUser(username, password);
        
        if (isAuthenticated) {
          errorMessage.classList.add('hide');
          // Add animation before redirect
          document.querySelector('.login-form-container').classList.add('fade-out');
          setTimeout(() => {
            redirectToDashboard();
          }, 500);
        } else {
          errorMessage.textContent = 'Usuario o contraseña incorrectos';
          errorMessage.classList.remove('hide');
          // Shake animation for error
          const loginForm = document.querySelector('.login-form-container');
          loginForm.classList.add('shake');
          setTimeout(() => {
            loginForm.classList.remove('shake');
          }, 500);
        }
      });
      
      // Allow login with Enter key
      document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          loginButton.click();
        }
      });
    }
  }
});

// Export functions for use in other modules
window.Auth = {
  isLoggedIn,
  getCurrentUser,
  isAdmin,
  isEmployee,
  logout,
  requireAuth,
  requireAdmin,
  requireEmployee
};