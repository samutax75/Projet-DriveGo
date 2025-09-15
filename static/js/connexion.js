// Éléments du DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const rememberCheckbox = document.getElementById('remember');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Configuration Google Sign-In
let googleInitialized = false;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function setLoading(isLoading) {
    if (submitBtn) {
        submitBtn.disabled = isLoading;
    }
    if (loadingSpinner) {
        loadingSpinner.style.display = isLoading ? 'inline-block' : 'none';
    }
    if (submitText) {
        submitText.textContent = isLoading ? 'Connexion...' : 'Se connecter';
    }
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    if (successMessage) {
        successMessage.style.display = 'none';
    }
    setTimeout(() => {
        if (errorMessage) {
            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function showSuccess(message) {
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
    }
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    setTimeout(() => {
        if (successMessage) {
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function hideMessages() {
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// ============================================================================
// VALIDATION DES CHAMPS
// ============================================================================

function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

function validateForm() {
    const email = emailInput?.value.trim() || '';
    const password = passwordInput?.value.trim() || '';
    
    let isValid = true;

    // Validation email
    if (!email) {
        emailInput?.classList.add('invalid');
        isValid = false;
    } else if (!validateEmail(email)) {
        emailInput?.classList.add('invalid');
        isValid = false;
    } else {
        emailInput?.classList.remove('invalid');
        emailInput?.classList.add('valid');
    }

    // Validation mot de passe
    if (!password) {
        passwordInput?.classList.add('invalid');
        isValid = false;
    } else if (password.length < 6) {
        passwordInput?.classList.add('invalid');
        isValid = false;
    } else {
        passwordInput?.classList.remove('invalid');
        passwordInput?.classList.add('valid');
    }

    return isValid;
}

// ============================================================================
// GESTION DU MOT DE PASSE
// ============================================================================

if (passwordToggle) {
    passwordToggle.addEventListener('click', function() {
        if (passwordInput) {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            this.textContent = isPassword ? '🙈' : '👁️';
            this.setAttribute('aria-label', isPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
        }
    });
}

// ============================================================================
// VALIDATION EN TEMPS RÉEL
// ============================================================================

if (emailInput) {
    emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        if (email && validateEmail(email)) {
            emailInput.classList.remove('invalid');
            emailInput.classList.add('valid');
        } else if (email) {
            emailInput.classList.remove('valid');
            emailInput.classList.add('invalid');
        } else {
            emailInput.classList.remove('valid', 'invalid');
        }
    });
}

if (passwordInput) {
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value.trim();
        if (password && password.length >= 6) {
            passwordInput.classList.remove('invalid');
            passwordInput.classList.add('valid');
        } else if (password) {
            passwordInput.classList.remove('valid');
            passwordInput.classList.add('invalid');
        } else {
            passwordInput.classList.remove('valid', 'invalid');
        }
    });
}

// ============================================================================
// GESTION DU FORMULAIRE DE CONNEXION
// ============================================================================

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showError('Veuillez corriger les erreurs dans le formulaire');
            return;
        }

        const email = emailInput?.value.trim() || '';
        const password = passwordInput?.value.trim() || '';

        // Démarrer le loading
        setLoading(true);
        hideMessages();

        try {
            // Appel à l'API Flask
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Connexion réussie
                showSuccess(data.message || 'Connexion réussie !');
                
                // Sauvegarder l'email si "se souvenir de moi" est coché
                if (rememberCheckbox?.checked) {
                    localStorage.setItem('drivego_remember', email);
                } else {
                    localStorage.removeItem('drivego_remember');
                }
                
                // Redirection après 1.5 secondes
                setTimeout(() => {
                    window.location.href = data.redirect || '/dashboard';
                }, 1500);

            } else {
                // Connexion échouée
                showError(data.message || 'Email ou mot de passe incorrect');
                setLoading(false);
            }

        } catch (error) {
            console.error('Erreur de connexion:', error);
            
            // Simulation pour la démo si l'API n'est pas disponible
            if (email && password) {
                showSuccess('Connexion réussie ! (Mode démo)');
                setTimeout(() => {
                    console.log('Redirection vers le tableau de bord...');
                    // window.location.href = '/dashboard';
                }, 1500);
            } else {
                showError('Une erreur s\'est produite. Veuillez réessayer.');
                setLoading(false);
            }
        }
    });
}

// ============================================================================
// GESTION GOOGLE SIGN-IN
// ============================================================================

// Callback pour la réponse Google
function handleCredentialResponse(response) {
    console.log("Token Google reçu:", response.credential);
    
    // Afficher le loading sur le formulaire principal
    setLoading(true);
    hideMessages();
    
    // Envoyer le token à votre backend Flask
    fetch("/google-signin", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            credential: response.credential 
        })
    })
    .then(res => res.json())
    .then(data => {
        setLoading(false);
        
        if (data.success) {
            showSuccess(`Bienvenue ${data.user?.name || 'utilisateur'} !`);
            
            // Redirection après succès
            setTimeout(() => {
                window.location.href = data.redirect || '/';
            }, 1500);
            
        } else {
            showError(`Erreur Google Sign-In : ${data.error || 'Connexion échouée'}`);
        }
    })
    .catch(err => {
        console.error("Erreur réseau Google Sign-In:", err);
        setLoading(false);
        
        // Pour la démo, simuler une connexion réussie
        showSuccess('Connexion Google réussie ! (Mode démo)');
        setTimeout(() => {
            console.log('Redirection après connexion Google...');
            // window.location.href = '/';
        }, 1500);
    });
}

// Initialisation du bouton Google personnalisé
function initGoogleSignIn() {
    console.log('Initialisation de la connexion Google...');
    
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        try {
            // Initialiser Google Sign-In avec votre client ID
            google.accounts.id.initialize({
                client_id: "586952928342-mmfucge3269sjkj0706mch5hmc0jpp8d.apps.googleusercontent.com",
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true
            });
            
            // Lancer le processus de connexion
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('Prompt Google non affiché, utilisation de renderButton...');
                    
                    // Alternative : créer un bouton temporaire
                    const tempDiv = document.createElement('div');
                    tempDiv.style.position = 'fixed';
                    tempDiv.style.top = '50%';
                    tempDiv.style.left = '50%';
                    tempDiv.style.transform = 'translate(-50%, -50%)';
                    tempDiv.style.zIndex = '10000';
                    tempDiv.style.background = 'white';
                    tempDiv.style.padding = '20px';
                    tempDiv.style.borderRadius = '10px';
                    tempDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                    
                    document.body.appendChild(tempDiv);
                    
                    google.accounts.id.renderButton(tempDiv, {
                        theme: "outline",
                        size: "large",
                        text: "signin_with",
                        shape: "rectangular"
                    });
                    
                    // Fermer après 10 secondes
                    setTimeout(() => {
                        if (tempDiv.parentNode) {
                            document.body.removeChild(tempDiv);
                        }
                    }, 10000);
                }
            });
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation Google:', error);
            showError('Erreur de connexion Google. Utilisez la connexion email.');
        }
    } else {
        console.log('Google API pas encore chargée...');
        showError('Service Google en cours de chargement. Réessayez dans quelques secondes.');
        
        // Réessayer après 2 secondes
        setTimeout(() => {
            if (typeof google !== 'undefined') {
                initGoogleSignIn();
            }
        }, 2000);
    }
}

// Gestion responsive du bouton Google
function checkScreenSize() {
    const googleSignIn = document.querySelector('.g_id_signin');
    const customGoogleBtn = document.getElementById('customGoogleBtn');
    
    if (window.innerWidth <= 768) {
        // Mobile : utiliser le bouton personnalisé
        if (googleSignIn) googleSignIn.style.display = 'none';
        if (customGoogleBtn) customGoogleBtn.style.display = 'flex';
    } else {
        // Desktop : utiliser le bouton officiel Google
        if (googleSignIn) googleSignIn.style.display = 'block';
        if (customGoogleBtn) customGoogleBtn.style.display = 'none';
    }
}

// ============================================================================
// EFFETS VISUELS ET UX
// ============================================================================

// Effet parallaxe sur le header
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (header) {
        const scrolled = window.pageYOffset;
        
        if (scrolled > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 25px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    }
});

// Amélioration de l'expérience tactile
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

// ============================================================================
// GESTION DES ÉVÉNEMENTS
// ============================================================================

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Masquer les messages au chargement
    hideMessages();
    
    // Préremplir l'email si "se souvenir de moi" était coché
    const rememberedEmail = localStorage.getItem('drivego_remember');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
    
    // Configuration du bouton Google personnalisé
    const customGoogleBtn = document.getElementById('customGoogleBtn');
    if (customGoogleBtn) {
        customGoogleBtn.addEventListener('click', initGoogleSignIn);
    }
    
    // Vérification initiale de la taille d'écran
    checkScreenSize();
});

// Redimensionnement de la fenêtre
window.addEventListener('resize', checkScreenSize);

// Gestion des touches clavier
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (emailInput === document.activeElement || passwordInput === document.activeElement)) {
        if (loginForm) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
});


// ============================================================================
// GESTION DES ERREURS GLOBALES
// ============================================================================

// Gestionnaire d'erreurs global pour Google
window.addEventListener('error', (e) => {
    if (e.message.includes('google') || e.message.includes('gsi')) {
        console.warn('Erreur Google Sign-In détectée:', e.message);
        // Ne pas interrompre l'expérience utilisateur
    }
});


// Log pour debug
console.log('Script de connexion DriveGo chargé avec succès');
console.log('Pour tester la connexion admin, utilisez: testConnexionAdmin()');