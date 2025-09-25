// Gestion de l'inscription - Version corrigée pour correspondre au HTML
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signupForm');
    const fields = {
        prenom: document.getElementById('prenom'),
        nom: document.getElementById('nom'),
        email: document.getElementById('email'),
        telephone: document.getElementById('telephone'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        fonction: document.getElementById('fonction'),
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
        telephone: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    };

    // Messages de validation
    const validationMessages = {
        prenom: {
            empty: 'Le prénom est requis',
            short: 'Minimum 2 caractères requis',
            valid: 'Prénom valide'
        },
        nom: {
            empty: 'Le nom est requis',
            short: 'Minimum 2 caractères requis',
            valid: 'Nom valide'
        },
        email: {
            empty: 'L\'email est requis',
            invalid: 'Format d\'email invalide',
            valid: 'Email valide'
        },
        telephone: {
            empty: 'Le téléphone est requis',
            invalid: 'Format de téléphone invalide (ex: 0123456789)',
            valid: 'Téléphone valide'
        },
        password: {
            empty: 'Le mot de passe est requis',
            short: 'Minimum 8 caractères requis',
            weak: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
            valid: 'Mot de passe sécurisé'
        },
        confirmPassword: {
            empty: 'Veuillez confirmer le mot de passe',
            mismatch: 'Les mots de passe ne correspondent pas',
            valid: 'Mots de passe identiques'
        },
        fonction: {
            empty: 'Veuillez sélectionner votre fonction',
            valid: 'Fonction sélectionnée'
        }
    };

    // Fonction utilitaire debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Fonction de validation
    function validateField(fieldName, value) {
        const validationDiv = document.getElementById(fieldName + 'Validation');
        const field = fields[fieldName];
        
        if (!validationDiv) return true;
        
        switch(fieldName) {
            case 'prenom':
            case 'nom':
                if (!value || !value.trim()) {
                    showValidation(field, validationDiv, validationMessages[fieldName].empty, false);
                    return false;
                }
                if (value.trim().length < 2) {
                    showValidation(field, validationDiv, validationMessages[fieldName].short, false);
                    return false;
                }
                showValidation(field, validationDiv, validationMessages[fieldName].valid, true);
                return true;

            case 'email':
                if (!value || !value.trim()) {
                    showValidation(field, validationDiv, validationMessages.email.empty, false);
                    return false;
                }
                if (!patterns.email.test(value.trim())) {
                    showValidation(field, validationDiv, validationMessages.email.invalid, false);
                    return false;
                }
                showValidation(field, validationDiv, validationMessages.email.valid, true);
                return true;

            case 'telephone':
                // Le téléphone n'est pas obligatoire selon votre HTML
                if (!value || !value.trim()) {
                    // Pas d'erreur si vide, juste effacer la validation
                    showValidation(field, validationDiv, '', true);
                    return true;
                }
                // Nettoyer le numéro (enlever espaces, points, tirets)
                const cleanPhone = value.replace(/[\s\-\.]/g, '');
                if (!patterns.telephone.test(cleanPhone)) {
                    showValidation(field, validationDiv, validationMessages.telephone.invalid, false);
                    return false;
                }
                showValidation(field, validationDiv, validationMessages.telephone.valid, true);
                return true;

            case 'password':
                if (!value || !value.trim()) {
                    showValidation(field, validationDiv, validationMessages.password.empty, false);
                    return false;
                }
                if (value.length < 8) {
                    showValidation(field, validationDiv, validationMessages.password.short, false);
                    return false;
                }
                if (!patterns.password.test(value)) {
                    showValidation(field, validationDiv, validationMessages.password.weak, false);
                    return false;
                }
                showValidation(field, validationDiv, validationMessages.password.valid, true);
                return true;

            case 'confirmPassword':
                if (!value || !value.trim()) {
                    showValidation(field, validationDiv, validationMessages.confirmPassword.empty, false);
                    return false;
                }
                if (fields.password && value !== fields.password.value) {
                    showValidation(field, validationDiv, validationMessages.confirmPassword.mismatch, false);
                    return false;
                }
                showValidation(field, validationDiv, validationMessages.confirmPassword.valid, true);
                return true;

            case 'fonction':
                if (!value) {
                    showValidation(field, validationDiv, validationMessages.fonction.empty, false);
                    return false;
                }
                showValidation(field, validationDiv, validationMessages.fonction.valid, true);
                return true;

            default:
                return true;
        }
    }

    function showValidation(field, validationDiv, message, isValid) {
        if (validationDiv) {
            validationDiv.textContent = message;
            validationDiv.className = `validation-message ${isValid ? 'success' : 'error'}`;
        }
        
        if (field) {
            field.classList.remove('valid', 'invalid');
            field.classList.add(isValid ? 'valid' : 'invalid');
        }
    }

    // Event listeners pour validation en temps réel
    Object.keys(fields).forEach(fieldName => {
        const field = fields[fieldName];
        
        if (field && fieldName !== 'terms' && fieldName !== 'fonction') {
            // Validation immédiate à la perte de focus
            field.addEventListener('blur', (e) => {
                const value = e.target.value;
                validateField(fieldName, value);
            });

            // Validation différée pendant la saisie
            const debouncedValidation = debounce((value) => {
                validateField(fieldName, value);
                
                // Si on modifie le mot de passe et que la confirmation existe, la revalider
                if (fieldName === 'password' && fields.confirmPassword && fields.confirmPassword.value) {
                    setTimeout(() => {
                        validateField('confirmPassword', fields.confirmPassword.value);
                    }, 100);
                }
            }, 400);

            field.addEventListener('input', (e) => {
                debouncedValidation(e.target.value);
            });
        }
    });

    // Event listener spécifique pour le select fonction
    if (fields.fonction) {
        fields.fonction.addEventListener('change', (e) => {
            validateField('fonction', e.target.value);
        });
    }

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Masquer les messages précédents
        hideMessages();
        
        // Validation complète de tous les champs
        let isFormValid = true;
        const validationResults = {};

        // Valider tous les champs sauf 'terms'
        Object.keys(fields).forEach(fieldName => {
            if (fieldName !== 'terms' && fields[fieldName]) {
                const field = fields[fieldName];
                const value = field.value;
                const isValid = validateField(fieldName, value);
                validationResults[fieldName] = isValid;
                
                if (!isValid) {
                    isFormValid = false;
                }
            }
        });

        // Vérifier les conditions d'utilisation
        if (fields.terms && !fields.terms.checked) {
            showError('Vous devez accepter les conditions d\'utilisation pour continuer.');
            isFormValid = false;
        }

        // Si le formulaire n'est pas valide, arrêter et faire défiler vers la première erreur
        if (!isFormValid) {
            const firstErrorField = document.querySelector('.validation-message.error, input.invalid, select.invalid');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
            return;
        }

        // Préparer les données pour l'envoi
        const formData = new FormData(form);

        // Afficher le state de chargement
        setLoadingState(true);

        try {
            // Envoyer le formulaire directement (pas d'API JSON ici car votre backend attend du FormData)
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            // Vérifier si la réponse est une redirection (succès)
            if (response.redirected) {
                showSuccess('Compte créé avec succès ! Redirection en cours...');
                setTimeout(() => {
                    window.location.href = response.url;
                }, 2000);
                return;
            }

            // Si pas de redirection, traiter comme une erreur
            const responseText = await response.text();
            
            // Vérifier s'il y a un message d'erreur dans la réponse HTML
            if (responseText.includes('error') || responseText.includes('erreur')) {
                // Parser la réponse HTML pour extraire le message d'erreur si possible
                const parser = new DOMParser();
                const doc = parser.parseFromString(responseText, 'text/html');
                const errorElement = doc.querySelector('.flash-error, .error-message');
                const errorMessage = errorElement ? errorElement.textContent.trim() : 'Une erreur est survenue lors de la création du compte.';
                
                showError(errorMessage);
            } else {
                showSuccess('Compte créé avec succès ! Redirection en cours...');
                setTimeout(() => {
                    window.location.href = '/connexion';
                }, 2000);
            }

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            showError('Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.');
        } finally {
            setLoadingState(false);
        }
    });

    // Fonction pour gérer l'état de chargement
    function setLoadingState(isLoading) {
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        if (submitBtn) {
            submitBtn.disabled = isLoading;
        }
        
        if (loadingSpinner) {
            loadingSpinner.style.display = isLoading ? 'inline-block' : 'none';
        }
        
        if (submitText) {
            const emailField = document.getElementById('email');
            const hasInvitation = emailField && emailField.value && emailField.hasAttribute('readonly');
            
            if (isLoading) {
                submitText.textContent = 'Création en cours...';
            } else {
                submitText.textContent = hasInvitation ? 'Finaliser mon inscription' : 'Créer mon compte';
            }
        }
    }

    // Fonctions de gestion des messages
    function hideMessages() {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (successDiv) successDiv.style.display = 'none';
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function showSuccess(message) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (errorDiv) errorDiv.style.display = 'none';
        
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Gestion spéciale pour les emails d'invitation (readonly)
    const emailField = document.getElementById('email');
    if (emailField && emailField.hasAttribute('readonly')) {
        emailField.style.cursor = 'not-allowed';
        emailField.title = 'Email fourni par l\'invitation - non modifiable';
        
        // Empêcher la modification
        emailField.addEventListener('keydown', (e) => {
            e.preventDefault();
        });
        
        emailField.addEventListener('paste', (e) => {
            e.preventDefault();
        });
    }

    // Auto-focus sur le premier champ (UX)
    if (fields.prenom) {
        setTimeout(() => {
            fields.prenom.focus();
        }, 300);
    }

    // Initialisation - masquer les messages au chargement
    hideMessages();

    console.log('Script d\'inscription chargé avec succès');
});