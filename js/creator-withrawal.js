// Creator Withdrawal System
class CreatorWithdrawal {
    constructor() {
        this.creatorId = authSystem.currentUser?.uid;
        this.creatorEmail = authSystem.currentUser?.email;
        this.currentReport = null;
        this.init();
    }

    init() {
        this.loadAvailableReports();
        this.loadPendingRequests();
        this.setupRealTimeListeners();
    }

    async loadAvailableReports() {
        if (!this.creatorId) return;

        try {
            const snapshot = await db.collection('monthlyReports')
                .where('creatorId', '==', this.creatorId)
                .where('withdrawalEnabled', '==', true)
                .where('status', '==', 'unsettled')
                .orderBy('month', 'desc')
                .get();

            this.displayAvailableReports(snapshot);
            this.updateBalanceCard(snapshot);

        } catch (error) {
            console.error('Error loading available reports:', error);
            this.showNotification('Error loading reports', 'error');
        }
    }

    displayAvailableReports(snapshot) {
        const container = document.getElementById('availableReports');
        const emptyState = document.getElementById('noReportsEmpty');

        if (snapshot.empty) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = snapshot.docs.map(doc => {
            const report = doc.data();
            return this.createReportCard(report, doc.id);
        }).join('');
    }

    createReportCard(report, reportId) {
        const month = this.formatMonth(report.month);
        const amount = report.totalEarnings || 0;
        const generatedDate = report.createdAt?.toDate().toLocaleDateString() || 'Unknown';

        return `
            <div class="report-card">
                <div class="report-header">
                    <div class="report-period">${month}</div>
                    <div class="report-badge">Available</div>
                </div>
                <div class="report-amount">$${amount.toLocaleString()}</div>
                <div class="report-details">
                    <div class="report-detail">
                        <span class="detail-label">Generated:</span>
                        <span class="detail-value">${generatedDate}</span>
                    </div>
                    <div class="report-detail">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">Ready for Withdrawal</span>
                    </div>
                </div>
                <button class="withdraw-btn" onclick="openWithdrawalModal('${reportId}')">
                    <i class="fas fa-paper-plane"></i> Request Withdrawal
                </button>
            </div>
        `;
    }

    updateBalanceCard(snapshot) {
        let totalAvailable = 0;
        snapshot.forEach(doc => {
            totalAvailable += doc.data().totalEarnings || 0;
        });

        document.getElementById('totalAvailable').textContent = `$${totalAvailable.toLocaleString()}`;
        document.getElementById('availableReportsCount').textContent = `${snapshot.size} reports available`;
    }

    async loadPendingRequests() {
        if (!this.creatorId) return;

        try {
            const snapshot = await db.collection('withdrawalRequests')
                .where('creatorId', '==', this.creatorId)
                .orderBy('requestedAt', 'desc')
                .limit(10)
                .get();

            this.displayPendingRequests(snapshot);

        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    }

    displayPendingRequests(snapshot) {
        const container = document.getElementById('pendingRequests');
        const emptyState = document.getElementById('noPendingEmpty');

        if (snapshot.empty) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = snapshot.docs.map(doc => {
            const request = doc.data();
            return this.createRequestItem(request, doc.id);
        }).join('');
    }

    createRequestItem(request, requestId) {
        const statusConfig = {
            'pending': { class: 'pending', icon: 'fa-clock', text: 'Under Review' },
            'approved': { class: 'approved', icon: 'fa-check', text: 'Approved' },
            'paid': { class: 'paid', icon: 'fa-money-bill', text: 'Paid' },
            'rejected': { class: 'rejected', icon: 'fa-times', text: 'Rejected' }
        };

        const config = statusConfig[request.status] || statusConfig.pending;
        const date = request.requestedAt?.toDate().toLocaleDateString() || 'Unknown';
        const month = this.formatMonth(request.reportMonth);

        return `
            <div class="request-item">
                <div class="request-icon ${config.class}">
                    <i class="fas ${config.icon}"></i>
                </div>
                <div class="request-details">
                    <div class="request-amount">$${request.amount?.toLocaleString()}</div>
                    <div class="request-period">${month} • ${request.reportId}</div>
                    <div class="request-meta">
                        <span class="request-status ${config.class}">${config.text}</span>
                        <span class="request-date">Requested: ${date}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async openWithdrawalModal(reportId) {
        try {
            const reportDoc = await db.collection('monthlyReports').doc(reportId).get();
            
            if (!reportDoc.exists) {
                this.showNotification('Report not found', 'error');
                return;
            }

            const report = reportDoc.data();
            this.currentReport = { id: reportId, ...report };

            // Update modal content
            document.getElementById('modalMonth').textContent = this.formatMonth(report.month);
            document.getElementById('modalAmount').textContent = `$${(report.totalEarnings || 0).toLocaleString()}`;

            // Show modal
            document.getElementById('withdrawalModal').classList.add('show');

        } catch (error) {
            console.error('Error opening withdrawal modal:', error);
            this.showNotification('Error loading report details', 'error');
        }
    }

    async confirmWithdrawal() {
        if (!this.currentReport) return;

        try {
            const requestData = {
                creatorId: this.creatorId,
                creatorEmail: this.creatorEmail,
                creatorName: localStorage.getItem('userName') || this.creatorEmail,
                reportId: this.currentReport.id,
                reportMonth: this.currentReport.month,
                amount: this.currentReport.totalEarnings || 0,
                status: 'pending',
                requestedAt: new Date(),
                currency: 'USD'
            };

            // Create withdrawal request
            await db.collection('withdrawalRequests').add(requestData);

            // Log the action
            await db.collection('withdrawalLogs').add({
                action: 'request_created',
                reportId: this.currentReport.id,
                creatorId: this.creatorId,
                creatorEmail: this.creatorEmail,
                amount: this.currentReport.totalEarnings,
                performedAt: new Date()
            });

            this.showNotification('Withdrawal request submitted successfully!', 'success');
            this.closeModal();

            // Reload data
            this.loadAvailableReports();
            this.loadPendingRequests();

        } catch (error) {
            console.error('Error creating withdrawal request:', error);
            this.showNotification('Error submitting withdrawal request', 'error');
        }
    }

    closeModal() {
        document.getElementById('withdrawalModal').classList.remove('show');
        this.currentReport = null;
    }

    formatMonth(monthString) {
        if (!monthString) return 'Unknown Period';
        const [year, month] = monthString.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }

    setupRealTimeListeners() {
        if (!this.creatorId) return;

        // Real-time updates for available reports
        db.collection('monthlyReports')
            .where('creatorId', '==', this.creatorId)
            .where('withdrawalEnabled', '==', true)
            .where('status', '==', 'unsettled')
            .onSnapshot((snapshot) => {
                this.loadAvailableReports();
            });

        // Real-time updates for withdrawal requests
        db.collection('withdrawalRequests')
            .where('creatorId', '==', this.creatorId)
            .onSnapshot((snapshot) => {
                this.loadPendingRequests();
            });
    }

    showNotification(message, type = 'error') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }
}

// Global functions for HTML onclick
function openWithdrawalModal(reportId) {
    if (!window.creatorWithdrawal) {
        window.creatorWithdrawal = new CreatorWithdrawal();
    }
    window.creatorWithdrawal.openWithdrawalModal(reportId);
}

function confirmWithdrawal() {
    if (window.creatorWithdrawal) {
        window.creatorWithdrawal.confirmWithdrawal();
    }
}

function closeModal() {
    if (window.creatorWithdrawal) {
        window.creatorWithdrawal.closeModal();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (authSystem.userRole === 'creator') {
        window.creatorWithdrawal = new CreatorWithdrawal();
    } else {
        window.location.href = 'index.html';
    }
});
