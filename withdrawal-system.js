// Withdrawal System Core Functions

// Toggle withdrawal access for a report
async function toggleWithdrawal(reportId) {
    try {
        const reportRef = db.collection('monthlyReports').doc(reportId);
        const reportDoc = await reportRef.get();
        
        if (!reportDoc.exists) {
            showNotification('Report not found', 'error');
            return;
        }

        const report = reportDoc.data();
        
        // Can't toggle if report is settled
        if (report.status === 'settled') {
            showNotification('Cannot modify withdrawal access for settled reports', 'error');
            return;
        }

        const newStatus = !report.withdrawalEnabled;
        
        await reportRef.update({
            withdrawalEnabled: newStatus,
            withdrawalStatus: newStatus ? 'enabled' : 'disabled',
            lastModified: new Date(),
            modifiedBy: auth.currentUser.uid
        });

        // Log the action
        await logWithdrawalAction(reportId, newStatus ? 'enabled' : 'disabled');

        showNotification(`Withdrawal ${newStatus ? 'enabled' : 'disabled'} successfully`, 'success');
        
        // Reload the reports
        loadMonthlyReports();

    } catch (error) {
        console.error('Error toggling withdrawal:', error);
        showNotification('Error updating withdrawal status: ' + error.message, 'error');
    }
}

// Mark report as settled (auto-disables withdrawals)
async function settleReport(reportId) {
    try {
        const reportRef = db.collection('monthlyReports').doc(reportId);
        
        await reportRef.update({
            status: 'settled',
            withdrawalEnabled: false,
            withdrawalStatus: 'auto-disabled',
            settledAt: new Date(),
            settledBy: auth.currentUser.uid
        });

        // Log the settlement action
        await logWithdrawalAction(reportId, 'auto-disabled');

        showNotification('Report marked as settled - withdrawals auto-disabled', 'success');
        
        // Reload the reports
        loadMonthlyReports();

    } catch (error) {
        console.error('Error settling report:', error);
        showNotification('Error settling report: ' + error.message, 'error');
    }
}

// View report details
async function viewReport(reportId) {
    // This would open a detailed view of the report
    // For now, just show a notification
    showNotification('Opening report details...', 'success');
    
    // In a full implementation, this would navigate to a report details page
    // window.location.href = `report-details.html?id=${reportId}`;
}

// Log withdrawal actions for audit trail
async function logWithdrawalAction(reportId, action) {
    try {
        await db.collection('withdrawalLogs').add({
            reportId: reportId,
            action: action,
            performedBy: auth.currentUser.uid,
            performedAt: new Date(),
            userEmail: auth.currentUser.email
        });
    } catch (error) {
        console.error('Error logging withdrawal action:', error);
    }
}

// Get withdrawal status text for display
function getWithdrawalStatusText(report) {
    if (report.status === 'settled') {
        return 'Auto-Disabled';
    }
    return report.withdrawalEnabled ? 'Enabled' : 'Disabled';
}

// Get withdrawal status class for styling
function getWithdrawalStatusClass(report) {
    if (report.status === 'settled') {
        return 'auto-disabled';
    }
    return report.withdrawalEnabled ? 'enabled' : 'disabled';
}

// Initialize withdrawal system
function initializeWithdrawalSystem() {
    console.log('Withdrawal system initialized');
    
    // Set up real-time listeners for reports
    db.collection('monthlyReports')
        .where('withdrawalEnabled', '==', true)
        .onSnapshot((snapshot) => {
            console.log(`Active withdrawal reports: ${snapshot.size}`);
            // Update UI or send notifications if needed
        });
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleWithdrawal,
        settleReport,
        viewReport,
        getWithdrawalStatusText,
        getWithdrawalStatusClass,
        initializeWithdrawalSystem
    };
}
