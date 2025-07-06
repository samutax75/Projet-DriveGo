 // Validation en temps réel
        const form = document.getElementById('signupForm');
        const fields = {
            firstName: document.getElementById('firstName'),
            lastName: document.getElementById('lastName'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            department: document.getElementById('department'),
            password: document.getElementById('password'),
            confirmPassword: document.getElementById('confirmPassword'),
            terms: document.getElementById('terms')
        };

        // Patterns de validation
        const patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
        };

        // Messages de validation
        const validationMessages = {
            firstName: {
                empty: 'Le prénom est requis',
                valid: 'Prénom valide ✓'
            },
            lastName: {
                empty: 'Le nom est requis',
                valid: 'Nom valide ✓'
            },
            email: {
                empty: 'L\'email est requis',
                invalid: 'Format d\'email invalide',
                valid: 'Email valide ✓'
            },
            phone: {
                empty: 'Le téléphone est requis',
                invalid: 'Format de téléphone invalide',
                valid: 'Téléphone valide ✓'
            },
            department: {
                empty: 'Veuillez sélectionner un service',
                valid: 'Service sélectionné ✓'
            },
            password: {
                empty: 'Le mot de passe est requis',
                weak: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
                valid: 'Mot de passe fort ✓'
            },
            confirmPassword: {
                empty: 'Veuillez confirmer le mot de passe',
                mismatch: 'Les mots de passe ne correspondent pas',
                valid: 'Mots de passe identiques ✓'
            }
        };

        // Fonction de validation
        function validateField(fieldName, value) {
            const validationDiv = document.getElementById(fieldName + 'Validation');
            const field = fields[fieldName];
            
            switch(fieldName) {
                case 'firstName':
                case 'lastName':
                    if (!value.trim()) {
                        showValidation(field, validationDiv, validationMessages[fieldName].empty, false);
                        return false;
                    }
                    showValidation(field, validationDiv, validationMessages[fieldName].valid, true);
                    return true;

                case 'email':
                    if (!value.trim()) {
                        showValidation(field, validationDiv, validationMessages.email.empty, false);
                        return false;
                    }
                    if (!patterns.email.test(value)) {
                        showValidation(field, validationDiv, validationMessages.email.invalid, false);
                        return false;
                    }
                    showValidation(field, validationDiv, validationMessages.email.valid, true);
                    return true;

                case 'phone':
                    if (!value.trim()) {
                        showValidation(field, validationDiv, validationMessages.phone.empty, false);
                        return false;
                    }
                    if (!patterns.phone.test(value)) {
                        showValidation(field, validationDiv, validationMessages.phone.invalid, false);
                        return false;
                    }
                    showValidation(field, validationDiv, validationMessages.phone.valid, true);
                    return true;

                case 'department':
                    if (!value) {
                        showValidation(field, validationDiv, validationMessages.department.empty, false);
                        return false;
                    }
                    showValidation(field, validationDiv, validationMessages.department.valid, true);
                    return true;

                case 'password':
                    if (!value.trim()) {
                        showValidation(field, validationDiv, validationMessages.password.empty, false);
                        return false;
                    }
                    if (!patterns.password.test(value)) {
                        showValidation(field, validationDiv, validationMessages.password.weak, false);
                        return false;
                    }
                    showValidation(field, validationDiv, validationMessages.password.valid, true);
                    return true;

                case 'confirmPassword':
                    if (!value.trim()) {
                        showValidation(field, validationDiv, validationMessages.confirmPassword.empty, false);
                        return false;
                    }
                    if (value !== fields.password.value) {
                        showValidation(field, validationDiv, validationMessages.confirmPassword.mismatch, false);
                        return false;
                    }
                    showValidation(field, validationDiv, validationMessages.confirmPassword.valid, true);
                    return true;

                default:
                    return true;
            }
        }

        function showValidation(field, validationDiv, message, isValid) {
            validationDiv.textContent = message;
            validationDiv.className = `validation-message ${isValid ? 'success' : 'error'}`;
            field.className = field.className.replace(/\b(valid|invalid)\b/g, '') + (isValid ? ' valid' : ' invalid');
        }

        // Event listeners pour validation en temps réel
        Object.keys(fields).forEach(fieldName => {
            if (fields[fieldName] && fieldName !== 'terms') {
                fields[fieldName].addEventListener('blur', (e) => {
                    validateField(fieldName, e.target.value);
                });

                fields[fieldName].addEventListener('input', (e) => {
                    if (fieldName === 'confirmPassword' || (fieldName === 'password' && fields.confirmPassword.value)) {
                        setTimeout(() => {
                            validateField('confirmPassword', fields.confirmPassword.value);
                        }, 100);
                    }
                });
            }
        });

        // Gestion du formulaire
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validation complète
            let isValid = true;
            Object.keys(fields).forEach(fieldName => {
                if (fieldName !== 'terms') {
                    if (!validateField(fieldName, fields[fieldName].value)) {
                        isValid = false;
                    }
                }
            });

            // Vérifier les conditions
            if (!fields.terms.checked) {
                showError('Vous devez accepter les conditions d\'utilisation');
                isValid = false;
            }

            if (!isValid) {
                return;
            }

            // Simulation de l'envoi
            const submitBtn = document.getElementById('submitBtn');
            const submitText = document.getElementById('submitText');
            const loadingSpinner = document.getElementById('loadingSpinner');
            
            submitBtn.disabled = true;
            loadingSpinner.style.display = 'inline-block';
            submitText.textContent = 'Création en cours...';

            try {
                // Simulation d'appel API
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Succès
                showSuccess('Compte créé avec succès ! Redirection en cours...');
                
                // Redirection après 2 secondes
                setTimeout(() => {
                    window.location.href = 'connexion.html';
                }, 2000);

            } catch (error) {
                showError('Une erreur s\'est produite lors de la création du compte');
                submitBtn.disabled = false;
                loadingSpinner.style.display = 'none';
                submitText.textContent = 'Créer mon compte';
            }
        });

        function showError(message) {
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');
            
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            successDiv.style.display = 'none';
            
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function showSuccess(message) {
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');
            
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            errorDiv.style.display = 'none';
            
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

        // Initialisation
        document.addEventListener('DOMContentLoaded', () => {
            // Masquer les messages au chargement
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('successMessage').style.display = 'none';
        });