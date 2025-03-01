// Affiliate Program Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Enable scrolling
    document.body.classList.add('affiliate-page');
    
    // Initialize Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand(); // Expand the WebApp to full height
        tg.enableClosingConfirmation();
    }
    
    const socket = io();
    
    // DOM Elements
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const affiliateLink = document.getElementById('affiliate-link');
    const shareTelegramBtn = document.getElementById('share-telegram');
    const referralCountEl = document.getElementById('referral-count');
    const totalEarningsEl = document.getElementById('total-earnings');
    
    // User data
    let userData = {
        telegramId: tg?.initDataUnsafe?.user?.id || 'demo-user',
        username: tg?.initDataUnsafe?.user?.username || 'demo-user',
        referrals: 0,
        earnings: 0,
        referralCode: ''
    };

    // Add haptic feedback to buttons
    document.querySelectorAll('.persian-button').forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('button-press');
            if (tg) {
                tg.HapticFeedback.impactOccurred('medium');
            }
            setTimeout(() => button.classList.remove('button-press'), 200);
        });
    });

    // Load affiliate data from server
    function loadAffiliateData() {
        // If we're in demo mode, use sample data
        if (!tg || !tg.initDataUnsafe?.user) {
            updateUIWithDemoData();
            return;
        }

        // Otherwise, request data from server
        socket.emit('getAffiliateData', { 
            telegramId: userData.telegramId,
            username: userData.username
        });

        // Listen for response from server
        socket.on('affiliateData', (data) => {
            userData = {
                ...userData,
                referrals: data.referrals || 0,
                earnings: data.earnings || 0,
                referralCode: data.referralCode || generateReferralCode()
            };
            updateUI();
        });
    }

    // Generate a referral code if one wasn't provided
    function generateReferralCode() {
        const prefix = userData.username.slice(0, 5);
        const randomString = Math.random().toString(36).substring(2, 7);
        return `${prefix}-${randomString}`;
    }

    // Update UI with affiliate data
    function updateUI() {
        referralCountEl.textContent = userData.referrals;
        totalEarningsEl.textContent = userData.earnings;
        
        // Create referral link
        const baseUrl = window.location.origin;
        const referralLink = `${baseUrl}?ref=${userData.referralCode}`;
        affiliateLink.value = referralLink;
    }

    // For demo purposes only
    function updateUIWithDemoData() {
        userData = {
            ...userData,
            referrals: 12,
            earnings: 450,
            referralCode: 'demo-' + Math.random().toString(36).substring(2, 7)
        };
        updateUI();
    }

    // Copy link to clipboard
    copyLinkBtn.addEventListener('click', () => {
        affiliateLink.select();
        document.execCommand('copy');
        
        // Visual feedback for copied link
        showToast('Link copied to clipboard!');
        
        if (tg) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    });

    // Share on Telegram functionality
    shareTelegramBtn.addEventListener('click', () => {
        const text = `Join me on Golden Glow and embark on a mystical journey of games and rewards! Use my link to start your adventure: ${affiliateLink.value}`;
        
        if (tg) {
            tg.shareData({
                text: text
            });
        } else {
            // Fallback for browsers
            window.open(`https://t.me/share/url?url=${encodeURIComponent(affiliateLink.value)}&text=${encodeURIComponent(text)}`, '_blank');
        }
    });

    // Toast notification helper
    function showToast(message) {
        // Check if a toast container already exists
        let toastContainer = document.querySelector('.toast-container');
        
        if (!toastContainer) {
            // Create toast container if it doesn't exist
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Add CSS for toast notifications
    const style = document.createElement('style');
    style.textContent = `
        .toast-container {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
        }
        
        .toast-notification {
            background: rgba(221, 185, 117, 0.9);
            color: #191423;
            padding: 10px 20px;
            border-radius: 20px;
            margin-bottom: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            font-weight: bold;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
        }
        
        .toast-notification.show {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);

    // Function to check and process referral code from URL
    function processReferralCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode && tg?.initDataUnsafe?.user) {
            // Send referral data to server
            socket.emit('processReferral', {
                referralCode: refCode,
                newUserId: tg.initDataUnsafe.user.id,
                newUsername: tg.initDataUnsafe.user.username
            });
        }
    }

    // Add scroll event listener to check if we need to add/remove shadow to header
    const header = document.querySelector('.game-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.classList.add('with-shadow');
        } else {
            header.classList.remove('with-shadow');
        }
    });

    // Ensure proper resize event handling
    window.addEventListener('resize', () => {
        // Force reflow to handle height calculations properly
        document.body.style.height = window.innerHeight + 'px';
        setTimeout(() => {
            document.body.style.height = '';
        }, 10);
    });

    // Initialize
    loadAffiliateData();
    processReferralCode();
});

// Add animation for the stars in the background
class AffiliateAnimation {
    constructor() {
        this.animateStars();
    }
    
    animateStars() {
        const starsContainer = document.querySelector('.stars');
        if (!starsContainer) return;
        
        // Clear existing stars
        starsContainer.innerHTML = '';
        
        // Create new stars
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            star.style.animationDuration = `${3 + Math.random() * 7}s`;
            
            starsContainer.appendChild(star);
        }
    }
}

// Initialize animations
document.addEventListener('DOMContentLoaded', () => {
    new AffiliateAnimation();
}); 