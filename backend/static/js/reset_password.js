 const form = document.getElementById('resetForm');
    const newPassword = document.getElementById('new_password');
    const confirmPassword = document.getElementById('confirm_password');
    const submitBtn = document.getElementById('submitBtn');
    const message = document.getElementById('message');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    // Critères de validation
    const requirements = {
        length: { element: document.getElementById('length'), regex: /.{8,}/ },
        uppercase: { element: document.getElementById('uppercase'), regex: /[A-Z]/ },
        lowercase: { element: document.getElementById('lowercase'), regex: /[a-z]/ },
        number: { element: document.getElementById('number'), regex: /\d/ },
        special: { element: document.getElementById('special'), regex: /[!@#$%^&*(),.?":{}|<>]/ }
    };

    function togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        const toggle = field.nextElementSibling;
        
        if (field.type === 'password') {
            field.type = 'text';
            toggle.textContent = '🙈';
        } else {
            field.type = 'password';
            toggle.textContent = '👁';
        }
    }

    function checkPasswordStrength(password) {
        let score = 0;
        let validRequirements = 0;

        // Vérifier chaque critère
        for (const [key, req] of Object.entries(requirements)) {
            const isValid = req.regex.test(password);
            req.element.className = isValid ? 'requirement valid' : 'requirement invalid';
            if (isValid) {
                score += 20;
                validRequirements++;
            }
        }

        // Bonus pour la longueur
        if (password.length >= 12) score += 10;
        if (password.length >= 16) score += 10;

        // Mettre à jour la barre de force
        let strength = 'weak';
        let strengthClass = 'strength-weak';
        let strengthTextContent = 'Faible';

        if (score >= 60) {
            strength = 'medium';
            strengthClass = 'strength-medium';
            strengthTextContent = 'Moyen';
        }
        if (score >= 90) {
            strength = 'strong';
            strengthClass = 'strength-strong';
            strengthTextContent = 'Fort';
        }

        strengthBar.style.width = Math.min(score, 100) + '%';
        strengthBar.className = 'strength-bar ' + strengthClass;
        strengthText.textContent = strengthTextContent;
        strengthText.className = 'strength-text ' + strengthClass;

        return validRequirements >= 4; // Au moins 4 critères sur 5
    }

    function validateForm() {
        const isPasswordStrong = checkPasswordStrength(newPassword.value);
        const passwordsMatch = newPassword.value === confirmPassword.value && newPassword.value.length > 0;
        
        submitBtn.disabled = !(isPasswordStrong && passwordsMatch);
        
        // Afficher message si les mots de passe ne correspondent pas
        if (confirmPassword.value.length > 0 && !passwordsMatch) {
            showMessage('Les mots de passe ne correspondent pas.', 'error');
        } else {
            hideMessage();
        }
    }

    function showMessage(text, type) {
        message.textContent = text;
        message.className = 'message ' + type;
        message.style.display = 'block';
    }

    function hideMessage() {
        message.style.display = 'none';
    }

    // Événements
    newPassword.addEventListener('input', validateForm);
    confirmPassword.addEventListener('input', validateForm);

    form.addEventListener('submit', function(e) {
        if (newPassword.value !== confirmPassword.value) {
            e.preventDefault();
            showMessage('Les mots de passe ne correspondent pas.', 'error');
            return;
        }
        
        if (!checkPasswordStrength(newPassword.value)) {
            e.preventDefault();
            showMessage('Le mot de passe ne respecte pas les critères de sécurité.', 'error');
            return;
        }
        
        // Si tout est OK, on peut soumettre
        showMessage('Réinitialisation en cours...', 'success');
    });

    // Animation au chargement
    window.addEventListener('load', function() {
        newPassword.focus();
    });