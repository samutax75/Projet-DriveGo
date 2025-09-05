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

// Basculer la visibilité du mot de passe
passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    passwordToggle.textContent = isPassword ? '🙈' : '👀';
});

// Validation en temps réel
function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    let isValid = true;

    // Validation email
    if (!email) {
        emailInput.classList.add('invalid');
        isValid = false;
    } else if (!validateEmail(email)) {
        emailInput.classList.add('invalid');
        isValid = false;
    } else {
        emailInput.classList.remove('invalid');
        emailInput.classList.add('valid');
    }

    // Validation mot de passe
    if (!password) {
        passwordInput.classList.add('invalid');
        isValid = false;
    } else if (password.length < 6) {
        passwordInput.classList.add('invalid');
        isValid = false;
    } else {
        passwordInput.classList.remove('invalid');
        passwordInput.classList.add('valid');
    }

    return isValid;
}

// Validation en temps réel
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

// Gestion du formulaire de connexion
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        showError('Veuillez corriger les erreurs dans le formulaire');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

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
            showSuccess(data.message);
            
            // Sauvegarder l'email si "se souvenir de moi" est coché
            if (rememberCheckbox.checked) {
                localStorage.setItem('drivego_remember', email);
            } else {
                localStorage.removeItem('drivego_remember');
            }
            
            // Sauvegarder les informations de session (pour compatibilité)
            const sessionData = {
                email: email,
                role: data.user.role,
                name: `${data.user.prenom} ${data.user.nom}`,
                loginTime: new Date().toISOString(),
                rememberMe: rememberCheckbox.checked
            };
            
            // Stocker en sessionStorage pour compatibilité
            sessionStorage.setItem('drivego_session', JSON.stringify(sessionData));
            
            // Redirection après 1.5 secondes
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1500);

        } else {
            // Connexion échouée
            showError(data.message || 'Email ou mot de passe incorrect');
            setLoading(false);
        }

    } catch (error) {
        console.error('Erreur de connexion:', error);
        showError('Une erreur s\'est produite. Veuillez réessayer.');
        setLoading(false);
    }
});

// Gestion des connexions sociales
document.getElementById('googleLogin')?.addEventListener('click', () => {
    showError('La connexion Google sera bientôt disponible');
});


// Gestion du mot de passe oublié
document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Fonctionnalité de récupération de mot de passe bientôt disponible !');
});

// Fonctions utilitaires
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
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
    if (errorMessage) {
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showSuccess(message) {
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
    }
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    if (successMessage) {
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function hideMessages() {
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

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

// Préremplir l'email si "se souvenir de moi" était coché
document.addEventListener('DOMContentLoaded', () => {
    const rememberedEmail = localStorage.getItem('drivego_remember');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
    
    // Masquer les messages au chargement
    hideMessages();
});

// Gestion des touches clavier
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (emailInput === document.activeElement || passwordInput === document.activeElement)) {
        if (loginForm) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
});

// Fonction pour tester la connexion avec les comptes par défaut
function testConnexionAdmin() {
    if (emailInput && passwordInput) {
        emailInput.value = 'admin@drivego.com';
        passwordInput.value = 'admin123';
        console.log('Compte admin prérempli. Email: admin@drivego.com, Mot de passe: admin123');
    }
}



// Pour le debug - accessible depuis la console
window.testConnexionAdmin = testConnexionAdmin;

