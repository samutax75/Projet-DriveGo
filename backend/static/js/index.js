// Burger Menu Functionality
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
const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Close menu on window resize if mobile menu is open
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeMenu();
    }
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 4px 25px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Gestion de l'état de connexion
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    const loginLink = document.getElementById('loginLink');
    const loginLinkMobile = document.getElementById('loginLinkMobile');
    const registerLink = document.getElementById('registerLink');
    const registerLinkMobile = document.getElementById('registerLinkMobile');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (isLoggedIn) {
        // Afficher les boutons de déconnexion
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.textContent = username ? `Se déconnecter (${username})` : 'Se déconnecter';
        }
        if (logoutBtnMobile) {
            logoutBtnMobile.style.display = 'block';
            logoutBtnMobile.innerHTML = username ? `🚪 Se déconnecter (${username})` : '🚪 Se déconnecter';
        }
        
        // Masquer les liens de connexion et d'inscription
        if (loginLink) loginLink.style.display = 'none';
        if (loginLinkMobile) loginLinkMobile.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (registerLinkMobile) registerLinkMobile.style.display = 'none';
        
        // Personnaliser le message d'accueil
        if (welcomeMessage && username) {
            welcomeMessage.textContent = `Bienvenue ${username} ! Gérez facilement votre flotte de véhicules avec DriveGo.`;
        }
    } else {
        // Masquer les boutons de déconnexion
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (logoutBtnMobile) logoutBtnMobile.style.display = 'none';
        
        // Afficher les liens de connexion et d'inscription
        if (loginLink) loginLink.style.display = 'block';
        if (loginLinkMobile) loginLinkMobile.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        if (registerLinkMobile) registerLinkMobile.style.display = 'block';
        
        // Message d'accueil par défaut
        if (welcomeMessage) {
            welcomeMessage.textContent = 'La solution moderne pour la gestion de votre flotte de véhicules. Simplicité, efficacité et innovation au service de votre mobilité.';
        }
    }
}

// Fonction de déconnexion
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        // Supprimer les données de session
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        
        // Afficher un message de confirmation
        alert('Vous avez été déconnecté avec succès !');
        
        // Mettre à jour l'interface
        checkLoginStatus();
        
        // Optionnel : rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
            window.location.href = 'connexion.html';
        }, 2000);
    }
}

// Fonction pour simuler une connexion (pour test)
function simulateLogin(username = 'Utilisateur Test') {
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('username', username);
    localStorage.setItem('userToken', 'sample-token-123');
    checkLoginStatus();
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    
    // Event listeners pour les boutons de déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    if (logoutBtnMobile) {
        logoutBtnMobile.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
            closeMenu();
        });
    }
});

// Écouter les changements de localStorage d'autres onglets
window.addEventListener('storage', function(e) {
    if (e.key === 'userLoggedIn' || e.key === 'username') {
        checkLoginStatus();
    }
});