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
        // HEADER SCROLL EFFECT (Adapté au design sombre)
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
        // GESTION DE L'AUTHENTIFICATION
        // ========================================
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
                    const hour = new Date().getHours();
                    let greeting = '';
                    if (hour < 12) greeting = 'Bonjour ';
                    else if (hour < 18) greeting = 'Bon après-midi ';
                    else greeting = 'Bonsoir ';
                    
                    welcomeMessage.textContent = `${greeting}${username} ! Gérez facilement vos missions d'accompagnement avec DriveGo.`;
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
                
                // Message d'accueil par défaut avec greeting
                if (welcomeMessage) {
                    const hour = new Date().getHours();
                    let greeting = '';
                    if (hour < 12) greeting = 'Bonjour ! ';
                    else if (hour < 18) greeting = 'Bon après-midi ! ';
                    else greeting = 'Bonsoir ! ';
                    
                    welcomeMessage.textContent = greeting + 'La solution moderne dédiée aux éducateurs de la Fondation Perce-Neige. Simplifiez l\'accès aux véhicules pour vos missions d\'accompagnement.';
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
        // INITIALISATION
        // ========================================
        document.addEventListener('DOMContentLoaded', function() {
            // Vérifier le statut de connexion
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

            // Observer pour les animations des cartes
            document.querySelectorAll('.feature-card').forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'all 0.6s ease-out';
                observer.observe(card);
            });
        });

        // Écouter les changements de localStorage d'autres onglets
        window.addEventListener('storage', function(e) {
            if (e.key === 'userLoggedIn' || e.key === 'username') {
                checkLoginStatus();
            }
        });




// script pour l'animation de chargement 
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
            
            // Reset si l'utilisateur ferme complètement l'onglet/navigateur
            window.addEventListener('beforeunload', function() {
                // Le sessionStorage se vide automatiquement à la fermeture
            });
        });
// Sur les actions importantes
if (navigator.vibrate) {
    navigator.vibrate(50); // Vibration courte
}




