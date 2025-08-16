// ========================================
// MENU BURGER FUNCTIONALITY
// ========================================
const burgerMenu = document.getElementById('burgerMenu');
const mobileMenu = document.getElementById('mobileMenu');
const overlay = document.getElementById('overlay');

function toggleMenu() {
    burgerMenu.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
}

function closeMenu() {
    burgerMenu.classList.remove('active');
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Event Listeners pour le menu burger
burgerMenu.addEventListener('click', toggleMenu);
overlay.addEventListener('click', closeMenu);

// Close menu when clicking on a link
document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Close menu on window resize if mobile menu is open
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeMenu();
    }
});

// ========================================
// HEADER SCROLL EFFECT
// ========================================
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.background = 'rgba(26, 26, 46, 0.98)';
        header.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    } else {
        header.style.background = 'rgba(26, 26, 46, 0.95)';
        header.style.boxShadow = 'none';
    }
});

// ========================================
// GESTION DE L'AUTHENTIFICATION (Pour les anciennes sessions localStorage)
// ========================================
function checkLoginStatus() {
    // Cette fonction ne fait plus rien car l'authentification est gérée par Flask/Session
    // Gardée pour compatibilité avec d'anciens liens ou appels
    console.log('Authentification gérée par Flask/Session côté serveur');
}

// Fonction de déconnexion - redirige vers la route Flask
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        // Rediriger vers la route de déconnexion Flask
        window.location.href = '/logout';
    }
}

// ========================================
// ANIMATIONS ET EFFETS VISUELS
// ========================================

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// ========================================
// SPLASH SCREEN ANIMATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si c'est la première visite de la session
    const hasSeenSplash = sessionStorage.getItem('drivego_splash_seen');
    const splash = document.getElementById('splashScreen');
    const mainContent = document.querySelector('.main-content');
    
    if (hasSeenSplash) {
        // Si déjà vu dans cette session, masquer immédiatement le splash
        splash.style.display = 'none';
        mainContent.style.opacity = '1';
        mainContent.style.transform = 'scale(1)';
        mainContent.style.animation = 'none';
    } else {
        // Première fois : montrer l'animation complète
        console.log('Première ouverture DriveGo - Animation complète');
        
        // Marquer comme vu pour cette session
        sessionStorage.setItem('drivego_splash_seen', 'true');
        
        // Cache le splash après l'animation
        setTimeout(() => {
            splash.style.display = 'none';
        }, 3500);
    }
});

// ========================================
// SYSTÈME DE NOTIFICATIONS
// ========================================
function showNotification(message, type = 'info', duration = 4000) {
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Icônes selon le type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'apparition
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Suppression automatique
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DriveGo - Application initialisée');
    
    // Event listeners pour les boutons de déconnexion (s'ils existent)
    const logoutBtns = document.querySelectorAll('[href*="logout"], .logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
            closeMenu(); // Fermer le menu mobile si ouvert
        });
    });

    // Observer pour les animations des cartes
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
    
    // Initialiser les animations pour les éléments fade-in-up
    document.querySelectorAll('.fade-in-up').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease-out';
        observer.observe(element);
    });
});

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

// Fonction pour afficher les informations de debug (utilisée dans votre Flask)
function debugSession() {
    console.log('🔍 Mode debug - Session gérée côté serveur Flask');
}

// Export pour utilisation externe si nécessaire
window.DriveGo = {
    showNotification: showNotification,
    closeMenu: closeMenu,
    logout: logout
};

console.log('✅ DriveGo JavaScript chargé - Version Flask/Jinja2');