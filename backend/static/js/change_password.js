class DriveGoPasswordManager {
    constructor() {
        this.form = document.getElementById('changePasswordForm');
        this.currentPasswordInput = document.getElementById('current_password');
        this.newPasswordInput = document.getElementById('new_password');
        this.confirmPasswordInput = document.getElementById('confirm_password');
        this.submitBtn = document.getElementById('submitBtn');
        this.messageDiv = document.getElementById('message');
        this.currentPasswordGroup = document.getElementById('currentPasswordGroup');
        
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Validation en temps réel
        this.newPasswordInput.addEventListener('input', () => {
            this.checkPasswordStrength();
            this.validateForm();
        });
        
        this.newPasswordInput.addEventListener('focus', () => {
            document.getElementById('passwordRequirements').classList.add('show');
            document.getElementById('strengthMeter').classList.add('show');
        });

        this.confirmPasswordInput.addEventListener('input', () => {
            this.validatePasswordMatch();
            this.validateForm();
        });

        this.currentPasswordInput.addEventListener('input', () => {
            this.validateForm();
        });

        // Soumission du formulaire
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    checkPasswordStrength() {
        const password = this.newPasswordInput.value;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        // Mettre à jour les exigences visuelles
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(req);
            if (requirements[req]) {
                element.classList.add('met');
            } else {
                element.classList.remove('met');
            }
        });

        const metRequirements = Object.values(requirements).filter(Boolean).length;
        let strength = 'weak';
        let strengthText = 'Faible';

        if (metRequirements >= 5) {
            strength = 'strong';
            strengthText = 'Fort';
        } else if (metRequirements >= 4) {
            strength = 'good';
            strengthText = 'Bon';
        } else if (metRequirements >= 2) {
            strength = 'fair';
            strengthText = 'Moyen';
        }

        const strengthBar = document.getElementById('strengthBar');
        const strengthTextEl = document.getElementById('strengthText');
        
        strengthBar.className = `strength-bar ${strength}`;
        strengthTextEl.className = `strength-text ${strength} show`;
        strengthTextEl.textContent = `Force du mot de passe: ${strengthText}`;

        return metRequirements >= 4;
    }

    validatePasswordMatch() {
        const newPassword = this.newPasswordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        const errorElement = document.getElementById('confirmPasswordError');

        if (confirmPassword && newPassword !== confirmPassword) {
            errorElement.textContent = 'Les mots de passe ne correspondent pas';
            errorElement.classList.add('show');
            return false;
        } else {
            errorElement.classList.remove('show');
            return true;
        }
    }

    validateForm() {
        const currentPassword = this.currentPasswordInput.value;
        const newPassword = this.newPasswordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        
        const isPasswordStrong = this.checkPasswordStrength();
        const passwordsMatch = this.validatePasswordMatch();

        // Vérifier si le champ mot de passe actuel est visible
        const isCurrentPasswordRequired = this.currentPasswordGroup.offsetParent !== null; // vrai si visible
        const hasCurrentPassword = isCurrentPasswordRequired ? currentPassword.length > 0 : true;

        // Vérifier que le nouveau mot de passe est différent de l'ancien si nécessaire
        let isDifferent = true;
        if (isCurrentPasswordRequired && currentPassword && newPassword && currentPassword === newPassword) {
            const errorElement = document.getElementById('newPasswordError');
            errorElement.textContent = 'Le nouveau mot de passe doit être différent de l\'ancien';
            errorElement.classList.add('show');
            isDifferent = false;
        } else {
            document.getElementById('newPasswordError').classList.remove('show');
        }

        const isValid = hasCurrentPassword && 
                        newPassword.length > 0 && 
                        confirmPassword.length > 0 &&
                        isPasswordStrong && 
                        passwordsMatch &&
                        isDifferent;

        this.submitBtn.disabled = !isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        
        this.submitBtn.classList.add('loading');
        this.submitBtn.disabled = true;
        this.hideMessage();

        try {
            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showMessage('Mot de passe modifié avec succès !', 'success');
                this.form.reset();
                document.getElementById('passwordRequirements').classList.remove('show');
                document.getElementById('strengthMeter').classList.remove('show');
                document.getElementById('strengthText').classList.remove('show');
                
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            } else {
                this.showMessage(result.message || 'Une erreur est survenue', 'error');
                
                if (result.errors) {
                    if (result.errors.current_password) {
                        const errorEl = document.getElementById('currentPasswordError');
                        errorEl.textContent = result.errors.current_password;
                        errorEl.classList.add('show');
                    }
                    if (result.errors.confirm_password) {
                        const errorEl = document.getElementById('confirmPasswordError');
                        errorEl.textContent = result.errors.confirm_password;
                        errorEl.classList.add('show');
                    }
                    if (result.errors.new_password) {
                        const errorEl = document.getElementById('newPasswordError');
                        errorEl.textContent = result.errors.new_password;
                        errorEl.classList.add('show');
                    }
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showMessage('Erreur de connexion. Veuillez réessayer.', 'error');
        } finally {
            this.submitBtn.classList.remove('loading');
            this.validateForm();
        }
    }

    showMessage(text, type) {
        this.messageDiv.textContent = text;
        this.messageDiv.className = `message ${type} show`;
    }

    hideMessage() {
        this.messageDiv.classList.remove('show');
    }
}

// Fonctions auxiliaires
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
    } else {
        input.type = 'password';
        toggle.textContent = '👁';
    }
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/dashboard';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') goBack();
});

document.addEventListener('DOMContentLoaded', () => {
    new DriveGoPasswordManager();
});

window.addEventListener('error', (e) => {
    console.error('Erreur JavaScript:', e.error);
});
