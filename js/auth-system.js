// Authentication System
class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.init();
  }

  init() {
    // Listen for auth state changes
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.currentUser = user;
        await this.loadUserRole();
        this.redirectBasedOnRole();
      } else {
        this.currentUser = null;
        this.userRole = null;
      }
    });

    // Enter key login
    document.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.login();
      }
    });

    // Auto-focus email field
    document.addEventListener('DOMContentLoaded', () => {
      const emailField = document.getElementById('email');
      if (emailField) emailField.focus();
    });
  }

  async login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
      this.showNotification('Please enter both email and password', 'error');
      return;
    }

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Role will be loaded in auth state change handler
      this.showNotification('Login successful! Redirecting...', 'success');

    } catch (error) {
      console.error('Login error:', error);
      this.handleLoginError(error);
    }
  }

  async loadUserRole() {
    if (!this.currentUser) return;

    try {
      const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        this.userRole = userData.role;
        localStorage.setItem('userRole', this.userRole);
        localStorage.setItem('userName', userData.name || userData.email);
      } else {
        this.showNotification('User profile not found', 'error');
        await this.logout();
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      this.showNotification('Error loading user profile', 'error');
    }
  }

  redirectBasedOnRole() {
    if (!this.userRole) return;

    const redirects = {
      'admin': 'admin-portal.html',
      'finance': 'financial-portal.html',
      'creator': 'creator-dashboard.html'
    };

    const redirectUrl = redirects[this.userRole];
    if (redirectUrl) {
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    } else {
      this.showNotification('No portal access configured for your role', 'error');
    }
  }

  handleLoginError(error) {
    const errorMessages = {
      'auth/wrong-password': 'Invalid password',
      'auth/user-not-found': 'User not found',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'Account has been disabled',
      'auth/too-many-requests': 'Too many attempts. Try again later'
    };

    const message = errorMessages[error.code] || `Login failed: ${error.message}`;
    this.showNotification(message, 'error');
  }

  async logout() {
    try {
      await auth.signOut();
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  showNotification(message, type = 'error') {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.textContent = message;
      notification.className = `notification ${type}`;
    }
  }

  // Check if user has required role
  hasRole(requiredRole) {
    return this.userRole === requiredRole || this.userRole === 'admin';
  }

  // Get current user info
  getUserInfo() {
    return {
      uid: this.currentUser?.uid,
      email: this.currentUser?.email,
      role: this.userRole,
      name: localStorage.getItem('userName')
    };
  }
}

// Initialize auth system
const authSystem = new AuthSystem();

// Global login function for HTML onclick
function login() {
  authSystem.login();
}

// Global logout function
function logout() {
  authSystem.logout();
        }
