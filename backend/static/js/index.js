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
// PROFIL DROPDOWN FUNCTIONALITY
// ========================================
function initProfileDropdown() {
    const profileHeader = document.getElementById('profileHeader');
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownArrow = document.querySelector('.profile-dropdown-arrow');
    
    if (profileHeader && profileDropdown) {
        // Toggle dropdown au clic sur le header
        profileHeader.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = profileDropdown.classList.contains('active');
            
            if (isOpen) {
                closeProfileDropdown();
            } else {
                openProfileDropdown();
            }
        });
        
        // Fermer si on clique ailleurs
        document.addEventListener('click', function(e) {
            if (!profileHeader.contains(e.target) && !profileDropdown.contains(e.target)) {
                closeProfileDropdown();
            }
        });
        
        // Gestion des actions personnalisées
        setupProfileDropdownActions();
    }
}

function openProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownArrow = document.querySelector('.profile-dropdown-arrow');
    
    profileDropdown.classList.add('active');
    if (dropdownArrow) {
        dropdownArrow.style.transform = 'rotate(180deg)';
    }
}

function closeProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownArrow = document.querySelector('.profile-dropdown-arrow');
    
    profileDropdown.classList.remove('active');
    if (dropdownArrow) {
        dropdownArrow.style.transform = 'rotate(0deg)';
    }
}

function setupProfileDropdownActions() {
    // Bouton Paramètres
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSettingsModal();
            closeProfileDropdown();
        });
    }
    
    // Bouton Contact
    const contactBtn = document.getElementById('contactBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showContactModal();
            closeProfileDropdown();
        });
    }
    
    // Fermer le dropdown après clic sur les liens
    document.querySelectorAll('.profile-dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            if (!this.getAttribute('href').startsWith('#')) {
                closeProfileDropdown();
            }
        });
    });
}

// ========================================
// MODAL PARAMÈTRES
// ========================================
function showSettingsModal() {
    const modal = createSettingsModal();
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 50);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal(modal);
        }
    });
}

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.innerHTML = `
        <div class="profile-modal-content">
            <div class="profile-modal-header">
                <h3 class="profile-modal-title">⚙️ Paramètres</h3>
                <button class="profile-modal-close" onclick="closeModal(this.closest('.profile-modal'))">✕</button>
            </div>
            <div class="settings-content">
                <div class="settings-group">
                    <h4 class="settings-group-title">🔔 Notifications</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" class="setting-checkbox" checked>
                            <span>Notifications de réservation</span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" class="setting-checkbox" checked>
                            <span>Rappels de missions</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h4 class="settings-group-title">🌙 Apparence</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <select class="setting-select">
                                <option value="auto">Automatique</option>
                                <option value="light">Mode clair</option>
                                <option value="dark" selected>Mode sombre</option>
                            </select>
                            <span>Thème de l'application</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h4 class="settings-group-title">🚗 Préférences véhicules</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" class="setting-checkbox">
                            <span>Véhicules adaptés PMR uniquement</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-save" onclick="saveSettings(this)">💾 Sauvegarder</button>
                <button class="btn-cancel" onclick="closeModal(this.closest('.profile-modal'))">❌ Annuler</button>
            </div>
        </div>
    `;
    return modal;
}

// ========================================
// MODAL CONTACT
// ========================================
function showContactModal() {
    const modal = createContactModal();
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 50);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal(modal);
        }
    });
}

function createContactModal() {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.innerHTML = `
        <div class="profile-modal-content">
            <div class="profile-modal-header">
                <h3 class="profile-modal-title">📞 Nous contacter</h3>
                <button class="profile-modal-close" onclick="closeModal(this.closest('.profile-modal'))">✕</button>
            </div>
            <div class="contact-content">
                <div class="contact-info">
                    <div class="contact-item">
                        <div class="contact-icon">🏢</div>
                        <div class="contact-details">
                            <h4>Fondation Perce-Neige</h4>
                        </div>
                    </div>
                    
                    <div class="contact-item">
                        <div class="contact-icon">📧</div>
                        <div class="contact-details">
                            <h4>Email</h4>
                            <p><a href="mailto:support.drivego@perce-neige.org">support.drivego@perce-neige.org</a></p>
                        </div>
                    </div>
                    
                    <div class="contact-item">
                        <div class="contact-icon">📞</div>
                        <div class="contact-details">
                            <h4>Téléphone</h4>
                            <p><a href="tel:0123456789">01 23 45 67 89</a></p>
                        </div>
                    </div>
                    
                    <div class="contact-item">
                        <div class="contact-icon">🕒</div>
                        <div class="contact-details">
                            <h4>Horaires support</h4>
                            <p>Lundi - Vendredi: 8h - 18h</p>
                        </div>
                    </div>
                </div>
                
                <form class="contact-form" onsubmit="sendContactMessage(event)">
                    <h4>💬 Message rapide</h4>
                    <div class="form-group">
                        <label>Sujet</label>
                        <select class="form-input" required>
                            <option value="">Choisir un sujet</option>
                            <option value="bug">🐛 Signaler un bug</option>
                            <option value="feature">💡 Demande de fonctionnalité</option>
                            <option value="help">❓ Besoin d'aide</option>
                            <option value="other">📝 Autre</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea class="form-input" rows="4" placeholder="Décrivez votre demande..." required></textarea>
                    </div>
                    <button type="submit" class="btn-save">📤 Envoyer</button>
                </form>
            </div>
        </div>
    `;
    return modal;
}

// ========================================
// FONCTIONS UTILITAIRES MODALES
// ========================================
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
}

function saveSettings(button) {
    // Simuler la sauvegarde des paramètres
    showNotification('⚙️ Paramètres sauvegardés avec succès !', 'success');
    closeModal(button.closest('.profile-modal'));
}

function sendContactMessage(event) {
    event.preventDefault();
    
    // Simuler l'envoi du message
    showNotification('📤 Message envoyé ! Nous vous répondrons rapidement.', 'success');
    closeModal(event.target.closest('.profile-modal'));
}
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
    
    // Initialiser le dropdown profil
    initProfileDropdown();
    
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
    logout: logout,
    openProfileDropdown: openProfileDropdown,
    closeProfileDropdown: closeProfileDropdown
};

 // Fonction pour l'upload rapide de photo de profil
        function quickPhotoUpload() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    uploadProfilePicture(file);
                }
            };
            input.click();
        }

        // Fonction pour gérer l'upload de la photo
        async function uploadProfilePicture(file) {
            const avatar = document.getElementById('mobileProfileAvatar');
            
            // Validation du fichier
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner un fichier image valide.');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB max
                alert('La taille du fichier ne doit pas dépasser 5MB.');
                return;
            }

            try {
                // Afficher l'état de chargement
                avatar.classList.add('avatar-uploading');
                
                // Créer FormData pour l'envoi
                const formData = new FormData();
                formData.append('profile_picture', file);
                
                // Envoyer la requête (remplacez par votre endpoint)
                const response = await fetch('/upload-profile-picture', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    // Mettre à jour l'avatar avec la nouvelle image
                    if (result.success && result.image_url) {
                        // Remplacer complètement le contenu de l'avatar
                        avatar.innerHTML = `
                            <img src="${result.image_url}" alt="Photo de profil" 
                                 style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                            <div class="avatar-overlay">
                                <span class="camera-icon">📷</span>
                            </div>
                        `;
                        
                        // Notification de succès
                        showNotification('Photo de profil mise à jour avec succès !', 'success');
                    }
                } else {
                    throw new Error('Erreur lors de l\'upload');
                }
                
            } catch (error) {
                console.error('Erreur upload:', error);
                showNotification('Erreur lors de la mise à jour de la photo', 'error');
            } finally {
                // Retirer l'état de chargement
                avatar.classList.remove('avatar-uploading');
            }
        }

        // Fonction pour afficher les notifications
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            `;
            
            document.body.appendChild(notification);
            
            // Supprimer après 3 secondes
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // Ajouter les animations CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);



console.log('✅ DriveGo JavaScript chargé - Version Flask/Jinja2');