// Gestion de l'inscription avec API Flask
document.addEventListener('DOMContentLoaded', function() {
    // Validation en temps réel
    const form = document.getElementById('signupForm');
    const fields = {
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        terms: document.getElementById('terms')
    };

    // Vérification des éléments DOM
    if (!form) {
        console.error('Formulaire d\'inscription non trouvé');
        return;
    }

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
        
        if (!validationDiv || !field) return true;
        
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
                if (fieldName === 'confirmPassword' || (fieldName === 'password' && fields.confirmPassword && fields.confirmPassword.value)) {
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
            if (fieldName !== 'terms' && fields[fieldName]) {
                if (!validateField(fieldName, fields[fieldName].value)) {
                    isValid = false;
                }
            }
        });

        // Vérifier les conditions
        if (fields.terms && !fields.terms.checked) {
            showError('Vous devez accepter les conditions d\'utilisation');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // Préparation des données pour l'API Flask
        const formData = {
            email: fields.email.value.trim(),
            password: fields.password.value,
            nom: fields.lastName.value.trim(),
            prenom: fields.firstName.value.trim(),
            telephone: fields.phone ? fields.phone.value.trim() : ''
        };

        // Affichage du loading
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        if (submitBtn) submitBtn.disabled = true;
        if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
        if (submitText) submitText.textContent = 'Création en cours...';

        try {
            // Appel à l'API Flask
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                // Succès
                showSuccess(data.message + ' Redirection en cours...');
                
                // Redirection après 2 secondes
                setTimeout(() => {
                    window.location.href = data.redirect || '/connexion';
                    }, 2000);


            } else {
                // Erreur retournée par l'API
                showError(data.message);
                resetSubmitButton();
            }

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            showError('Une erreur s\'est produite lors de la création du compte. Veuillez réessayer.');
            resetSubmitButton();
        }
    });

    function resetSubmitButton() {
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        if (submitBtn) submitBtn.disabled = false;
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (submitText) submitText.textContent = 'Créer mon compte';
    }

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        if (successDiv) {
            successDiv.style.display = 'none';
        }
    }

    function showSuccess(message) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
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

    // Initialisation
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
});