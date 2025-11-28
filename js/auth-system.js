redirectBasedOnRole() {
  if (!this.userRole) return;

  // Get current page
  const currentPage = window.location.pathname.split('/').pop();
  
  // Don't redirect if already on correct portal page
  const portalPages = {
    'admin': ['admin-portal.html', 'financial-portal.html', 'withdrawal-management.html', 'withdrawal-requests.html'],
    'finance': ['financial-portal.html', 'withdrawal-management.html', 'withdrawal-requests.html'],
    'creator': ['creator-dashboard.html', 'creator-withdrawal.html']
  };

  const allowedPages = portalPages[this.userRole] || [];
  if (allowedPages.includes(currentPage)) {
    return; // Already on allowed page
  }

  // Redirect to appropriate portal
  const redirects = {
    'admin': 'admin-portal.html',
    'finance': 'financial-portal.html', 
    'creator': 'creator-dashboard.html'
  };

  const redirectUrl = redirects[this.userRole];
  if (redirectUrl && currentPage !== 'index.html') {
    console.log(`Redirecting ${this.userRole} to ${redirectUrl}`);
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);
  }
}
