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

        // Comptes de démonstration
        const demoAccounts = {
            'admin@drivego.com': {
                password: 'Admin123',
                role: 'admin',
                name: 'Administrateur'
            },
            'user@drivego.com': {
                password: 'User123',
                role: 'user',
                name: 'Utilisateur'
            }
        };

        // Basculer la visibilité du mot de passe
        passwordToggle.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            passwordToggle.textContent = isPassword ? '🙈' : '👁️';
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
                // Simulation d'appel API
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Vérifier les comptes de démonstration
                if (demoAccounts[email] && demoAccounts[email].password === password) {
                    // Connexion réussie
                    const user = demoAccounts[email];
                    
                    // Sauvegarder les informations de session
                    const sessionData = {
                        email: email,
                        role: user.role,
                        name: user.name,
                        loginTime: new Date().toISOString(),
                        rememberMe: rememberCheckbox.checked
                    };
                    
                    // Stocker en session (simulation)
                    sessionStorage.setItem('drivego_session', JSON.stringify(sessionData));
                    
                    if (rememberCheckbox.checked) {
                        localStorage.setItem('drivego_remember', email);
                    }

                    showSuccess(`Bienvenue ${user.name} ! Redirection en cours...`);
                    
                    // Redirection selon le rôle
                    setTimeout(() => {
                        if (user.role === 'admin') {
                            window.location.href = 'index.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }, 2000);

                } else {
                    // Connexion échouée
                    showError('Email ou mot de passe incorrect');
                    setLoading(false);
                }

            } catch (error) {
                showError('Une erreur s\'est produite. Veuillez réessayer.');
                setLoading(false);
            }
        });

        // Gestion des connexions sociales
        document.getElementById('googleLogin').addEventListener('click', () => {
            showError('La connexion Google sera bientôt disponible');
        });

        document.getElementById('microsoftLogin').addEventListener('click', () => {
            showError('La connexion Microsoft sera bientôt disponible');
        });

        // Gestion du mot de passe oublié
        document.getElementById('forgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Fonctionnalité de récupération de mot de passe bientôt disponible !');
        });

        // Fonctions utilitaires
        function setLoading(isLoading) {
            submitBtn.disabled = isLoading;
            loadingSpinner.style.display = isLoading ? 'inline-block' : 'none';
            submitText.textContent = isLoading ? 'Connexion...' : 'Se connecter';
        }

        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function showSuccess(message) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function hideMessages() {
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
        }

        // Effet parallaxe sur le header
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            const scrolled = window.pageYOffset;
            
            if (scrolled > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 2px 25px rgba(0, 0, 0, 0.15)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        });

        // Préremplir l'email si "se souvenir de moi" était coché
        document.addEventListener('DOMContentLoaded', () => {
            const rememberedEmail = localStorage.getItem('drivego_remember');
            if (rememberedEmail) {
                emailInput.value = rememberedEmail;
                rememberCheckbox.checked = true;
            }
            
            // Masquer les messages au chargement
            hideMessages();
        });

        // Gestion des touches clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (emailInput === document.activeElement || passwordInput === document.activeElement)) {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });