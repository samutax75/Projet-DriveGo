// Le token est passé depuis Flask via le template
        const token = '{{ token }}';

        // Vérification de la présence du token (géré côté serveur)
        if (!token || token === '') {
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorText').textContent = 'Token de réinitialisation manquant ou invalide.';
            document.getElementById('resetPasswordForm').style.display = 'none';
        }

        // Éléments du DOM
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const togglePassword = document.getElementById('togglePassword');
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        const passwordStrength = document.getElementById('passwordStrength');
        const submitBtn = document.getElementById('submitBtn');
        const form = document.getElementById('resetPasswordForm');

        // Éléments des exigences
        const requirements = {
            length: document.getElementById('lengthReq'),
            uppercase: document.getElementById('uppercaseReq'),
            lowercase: document.getElementById('lowercaseReq'),
            number: document.getElementById('numberReq'),
            special: document.getElementById('specialReq')
        };

        // Toggle visibilité du mot de passe
        function togglePasswordVisibility(input, icon) {
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }

        togglePassword.addEventListener('click', () => {
            togglePasswordVisibility(newPasswordInput, togglePassword);
        });

        toggleConfirmPassword.addEventListener('click', () => {
            togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
        });

        // Vérification de la force du mot de passe
        function checkPasswordStrength(password) {
            let score = 0;
            const checks = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /\d/.test(password),
                special: /[^A-Za-z0-9]/.test(password)
            };

            // Mise à jour des exigences visuelles
            Object.keys(checks).forEach(key => {
                const req = requirements[key];
                const icon = req.querySelector('i');
                if (checks[key]) {
                    req.classList.add('valid');
                    icon.className = 'fas fa-check';
                    score++;
                } else {
                    req.classList.remove('valid');
                    icon.className = 'fas fa-times';
                }
            });

            // Mise à jour de la barre de force
            passwordStrength.className = 'password-strength';
            if (score < 3) {
                passwordStrength.classList.add('strength-weak');
                passwordStrength.querySelector('.strength-text').textContent = 'Faible';
            } else if (score < 5) {
                passwordStrength.classList.add('strength-medium');
                passwordStrength.querySelector('.strength-text').textContent = 'Moyen';
            } else {
                passwordStrength.classList.add('strength-strong');
                passwordStrength.querySelector('.strength-text').textContent = 'Fort';
            }

            return score === 5;
        }

        // Validation du formulaire
        function validateForm() {
            const password = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            const isPasswordStrong = checkPasswordStrength(password);
            const passwordsMatch = password === confirmPassword && password !== '';

            // Validation visuelle de la confirmation
            if (confirmPassword && !passwordsMatch) {
                confirmPasswordInput.style.borderColor = '#ff4757';
            } else if (passwordsMatch) {
                confirmPasswordInput.style.borderColor = '#2ed573';
            } else {
                confirmPasswordInput.style.borderColor = '#e1e5e9';
            }

            // Activation/désactivation du bouton
            submitBtn.disabled = !(isPasswordStrong && passwordsMatch);
        }

        // Écouteurs d'événements
        newPasswordInput.addEventListener('input', validateForm);
        confirmPasswordInput.addEventListener('input', validateForm);

        // Soumission du formulaire (soumission normale, pas AJAX)
        form.addEventListener('submit', (e) => {
            const password = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Validation finale côté client
            if (!checkPasswordStrength(password)) {
                e.preventDefault();
                showError('Le mot de passe ne respecte pas les exigences de sécurité.');
                return;
            }

            if (password !== confirmPassword) {
                e.preventDefault();
                showError('Les mots de passe ne correspondent pas.');
                return;
            }

            // Animation de chargement
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mise à jour...';
            
            // Le formulaire sera soumis normalement vers Flask
        });

        function showError(message) {
            document.getElementById('errorText').textContent = message;
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('successMessage').style.display = 'none';
        }

        function showSuccess() {
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('errorMessage').style.display = 'none';
            form.style.display = 'none';
        }

        // Animation d'entrée
        window.addEventListener('load', () => {
            document.querySelector('.container').style.animation = 'slideInUp 0.6s ease-out';
        });

        