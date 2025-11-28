// Notification System for Real-time Updates
class NotificationSystem {
    constructor() {
        this.init();
    }

    init() {
        this.setupGlobalNotifications();
    }

    setupGlobalNotifications() {
        // Listen for new withdrawal requests (for admin/finance)
        if (authSystem.hasRole('admin') || authSystem.hasRole('finance')) {
            this.setupAdminNotifications();
        }

        // Listen for request updates (for creators)
        if (authSystem.userRole === 'creator') {
            this.setupCreatorNotifications();
        }
    }

    setupAdminNotifications() {
        // Listen for new pending requests
        db.collection('withdrawalRequests')
            .where('status', '==', 'pending')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.showAdminNotification(change.doc.data());
                    }
                });
            });
    }

    setupCreatorNotifications() {
        const creatorId = authSystem.currentUser?.uid;
        if (!creatorId) return;

        // Listen for request status changes
        db.collection('withdrawalRequests')
            .where('creatorId', '==', creatorId)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'modified') {
                        const newData = change.doc.data();
                        const oldData = change.doc._previousData || {};
                        
                        if (newData.status !== oldData.status) {
                            this.showCreatorNotification(newData, oldData.status);
                        }
                    }
                });
            });
    }

    showAdminNotification(request) {
        if (this.shouldShowNotification()) {
            this.showBrowserNotification(
                'New Withdrawal Request',
                `${request.creatorName} requested $${request.amount} withdrawal`,
                '/icon-192.png'
            );
        }
    }

    showCreatorNotification(request, oldStatus) {
        if (this.shouldShowNotification()) {
            const messages = {
                'approved': 'Your withdrawal request has been approved!',
                'paid': 'Your withdrawal has been processed and paid!',
                'rejected': 'Your withdrawal request was rejected.'
            };

            const message = messages[request.status];
            if (message) {
                this.showBrowserNotification(
                    'Withdrawal Status Update',
                    message,
                    '/icon-192.png'
                );
            }
        }
    }

    showBrowserNotification(title, body, icon) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon });
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    shouldShowNotification() {
        // Don't show notifications if the tab is active
        return document.hidden;
    }

    // In-app toast notifications
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }
}

// Initialize notification system
const notificationSystem = new NotificationSystem();

// Request notification permission on user interaction
document.addEventListener('click', () => {
    notificationSystem.requestNotificationPermission();
});
