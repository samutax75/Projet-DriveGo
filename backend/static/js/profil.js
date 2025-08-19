let isEditMode = false;
let originalData = {};

// Données utilisateur récupérées du backend via les templates Jinja2
// Ces données seront automatiquement injectées lors du rendu de la page
const userData = {
    firstName: document.getElementById('firstName')?.value || "",
    lastName: document.getElementById('lastName')?.value || "",
    email: document.getElementById('email')?.value || "",
    password: ""
};

function initializeProfile() {
    // Les données sont déjà injectées via Jinja2 dans le HTML
    // On synchronise juste l'objet userData avec les valeurs des champs
    Object.keys(userData).forEach(key => {
        const element = document.getElementById(key);
        if (element && element.value) {
            userData[key] = element.value;
        }
    });
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const form = document.getElementById('profileForm');
    const inputs = form.querySelectorAll('.form-input');
    const editButtons = document.querySelectorAll('.edit-mode');
    const viewButton = document.getElementById('editBtn');
    const passwordHint = document.getElementById('passwordHint');
    const passwordStrength = document.getElementById('passwordStrength');

    if (isEditMode) {
        // Sauvegarder les données originales
        originalData = {};
        inputs.forEach(input => {
            originalData[input.id] = input.value;
            input.removeAttribute('readonly');
        });

        // Ajouter les événements pour la validation du mot de passe
        document.getElementById('password').addEventListener('input', checkPasswordStrength);
        passwordHint.style.display = 'block';
        passwordStrength.style.display = 'block';

        // Changer l'affichage des boutons
        editButtons.forEach(btn => btn.style.display = 'inline-flex');
        viewButton.style.display = 'none';
        document.body.classList.add('editing');

        showStatus('Mode édition activé. Vous pouvez maintenant modifier vos informations.', 'info');
    } else {
        // Mode lecture
        inputs.forEach(input => {
            input.setAttribute('readonly', true);
        });

        // Retirer les événements et masquer les indicateurs
        document.getElementById('password').removeEventListener('input', checkPasswordStrength);
        passwordHint.style.display = 'none';
        passwordStrength.style.display = 'none';

        // Restaurer l'affichage des boutons
        editButtons.forEach(btn => btn.style.display = 'none');
        viewButton.style.display = 'inline-flex';
        document.body.classList.remove('editing');
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthBar = document.querySelector('.password-strength-bar');
    let strength = 0;

    // Critères de validation du mot de passe
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // Mise à jour visuelle de la force
    strengthBar.className = 'password-strength-bar';
    if (strength <= 2) {
        strengthBar.classList.add('weak');
    } else if (strength <= 3) {
        strengthBar.classList.add('medium');
    } else if (strength <= 4) {
        strengthBar.classList.add('good');
    } else {
        strengthBar.classList.add('strong');
    }
}

function changePassword() {
    if (!isEditMode) {
        showStatus('Veuillez activer le mode édition pour modifier votre mot de passe.', 'error');
        return;
    }
    
    const newPassword = prompt('Entrez votre nouveau mot de passe (minimum 8 caractères):');
    if (newPassword && newPassword.length >= 8) {
        document.getElementById('password').value = newPassword;
        checkPasswordStrength();
        showStatus('Nouveau mot de passe défini. N\'oubliez pas d\'enregistrer vos modifications.', 'success');
    } else if (newPassword) {
        showStatus('Le mot de passe doit contenir au moins 8 caractères.', 'error');
    }
}

function downloadData() {
    showStatus('Préparation de l\'export de vos données personnelles...', 'info');
    
    // Simulation du téléchargement des données
    setTimeout(() => {
        const dataToExport = {
            ...userData,
            exportDate: new Date().toISOString(),
            accountType: 'Éducateur DriveGo',
            platform: 'DriveGo - Fondation Perce-Neige'
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mes-donnees-drivego-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        showStatus('✨ Téléchargement de vos données terminé avec succès.', 'success');
    }, 2000);
}

function deleteAccount() {
    const userName = `${userData.firstName} ${userData.lastName}`;
    
    const confirmation = confirm(
        '⚠️ SUPPRESSION DÉFINITIVE DE COMPTE ⚠️\n\n' +
        `${userName}, êtes-vous absolument sûr(e) de vouloir supprimer votre compte ?\n\n` +
        '🔸 Toutes vos données personnelles seront perdues\n' +
        '🔸 Votre historique de réservations sera effacé\n' +
        '🔸 Cette action est 100% irréversible\n' +
        '🔸 Vous perdrez définitivement l\'accès à DriveGo\n\n' +
        'Si vous êtes certain(e), cliquez sur OK pour continuer.'
    );

    if (confirmation) {
        const finalConfirm = prompt(
            'CONFIRMATION FINALE\n\n' +
            'Pour confirmer définitivement la suppression de votre compte,\n' +
            'tapez exactement le mot : SUPPRIMER\n\n' +
            '(en majuscules, sans espaces)'
        );
        
        if (finalConfirm === 'SUPPRIMER') {
            // Animation de suppression
            showStatus('⚠️ Suppression du compte en cours... Vous allez être déconnecté.', 'error');
            
            // Simulation de la suppression
            setTimeout(() => {
                showStatus('🗑️ Suppression en cours... Effacement des données...', 'error');
            }, 1000);
            
            setTimeout(() => {
                alert('✅ Votre compte a été supprimé avec succès.\n\nMerci pour votre confiance. Au revoir !');
                // Ici vous ajouteriez la redirection vers la page de connexion
                // window.location.href = '/connexion';
            }, 3000);
            
        } else if (finalConfirm !== null) {
            showStatus('❌ Suppression annulée. Le texte de confirmation était incorrect.', 'info');
        }
    } else {
        showStatus('✅ Suppression annulée. Votre compte reste actif.', 'info');
    }
}

function saveProfile() {
    // Récupération et validation des données
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validations
    if (!firstName || !lastName) {
        showStatus('❌ Le prénom et le nom sont obligatoires.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showStatus('❌ Veuillez entrer une adresse email valide.', 'error');
        return;
    }

    if (password && password.length < 8) {
        showStatus('❌ Le mot de passe doit contenir au moins 8 caractères.', 'error');
        return;
    }

    // Animation de sauvegarde
    const saveBtn = document.querySelector('.btn-primary.edit-mode');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="loading-spinner"></span> Enregistrement...';
    saveBtn.disabled = true;

    showStatus('💾 Enregistrement de vos modifications en cours...', 'info');

    // Simulation de la sauvegarde
    setTimeout(() => {
        // Mise à jour des données utilisateur
        Object.keys(userData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                userData[key] = element.value;
            }
        });

        // Restauration du bouton
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        
        // Sortie du mode édition
        toggleEditMode();
        
        // Message de succès
        showStatus('✨ Profil mis à jour avec succès ! Toutes vos modifications ont été enregistrées.', 'success');
        
        // Ici vous ajouteriez l'envoi des données au serveur
        // sendProfileDataToServer(userData);
        
    }, 2000);
}

function cancelEdit() {
    // Restauration des données originales
    Object.keys(originalData).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = originalData[key];
        }
    });

    toggleEditMode();
    showStatus('↩️ Modifications annulées. Vos données ont été restaurées.', 'info');
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

function showStatus(message, type) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type} show`;

    // Auto-masquage après 5 secondes
    setTimeout(() => {
        statusElement.classList.remove('show');
    }, 5000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Fonction pour envoyer les données au serveur (à implémenter)
function sendProfileDataToServer(data) {
    // Exemple d'implémentation avec fetch
    /*
    fetch('/api/update-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showStatus('✅ Profil sauvegardé sur le serveur !', 'success');
        } else {
            showStatus('❌ Erreur lors de la sauvegarde.', 'error');
        }
    })
    .catch(error => {
        showStatus('❌ Erreur de connexion au serveur.', 'error');
    });
    */
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
    
    // Animation d'entrée progressive des éléments
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        setTimeout(() => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';
            group.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            setTimeout(() => {
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, 50);
        }, index * 150);
    });

    // Message de bienvenue
    setTimeout(() => {
        if (userData.firstName) {
            showStatus(`👋 Bienvenue ${userData.firstName} ! Votre profil est prêt.`, 'success');
        }
    }, 1000);
});

// Gestion des raccourcis clavier
document.addEventListener('keydown', function(event) {
    // Échap pour annuler l'édition
    if (event.key === 'Escape' && isEditMode) {
        cancelEdit();
    }
    // Ctrl+S pour sauvegarder
    if (event.ctrlKey && event.key === 's' && isEditMode) {
        event.preventDefault();
        saveProfile();
    }
    // Ctrl+E pour activer/désactiver l'édition
    if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        toggleEditMode();
    }
});

// Détection des changements pour avertir l'utilisateur
let hasUnsavedChanges = false;
document.addEventListener('input', function(event) {
    if (isEditMode && event.target.classList.contains('form-input')) {
        hasUnsavedChanges = true;
    }
});

// Avertissement avant fermeture si modifications non sauvegardées
window.addEventListener('beforeunload', function(event) {
    if (hasUnsavedChanges && isEditMode) {
        event.preventDefault();
        event.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
        return event.returnValue;
    }
});



 // Fonction pour générer une couleur d'avatar basée sur les initiales
        function generateAvatarColor(initials) {
            const colors = [
                'avatar-color-1', 'avatar-color-2', 'avatar-color-3', 'avatar-color-4',
                'avatar-color-5', 'avatar-color-6', 'avatar-color-7', 'avatar-color-8'
            ];
            
            // Utiliser le code ASCII des initiales pour choisir une couleur
            let hash = 0;
            for (let i = 0; i < initials.length; i++) {
                hash = initials.charCodeAt(i) + ((hash << 5) - hash);
            }
            
            return colors[Math.abs(hash) % colors.length];
        }

        // Appliquer la couleur à l'avatar au chargement de la page
        document.addEventListener('DOMContentLoaded', function() {
            const avatar = document.getElementById('profileAvatar');
            const initials = avatar.textContent.trim();
            
            if (initials && initials !== '??') {
                const colorClass = generateAvatarColor(initials);
                avatar.classList.add(colorClass);
            }
        });

        // Fonction pour afficher les notifications (gardée pour compatibilité)
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 10001;
                animation: slideIn 0.3s ease-out;
                max-width: 300px;
                background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                             type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                             'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'};
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            `;
            
            document.body.appendChild(notification);
            
            // Supprimer après 4 secondes
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        }

        // Ajouter les animations CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;


        function goBack() {
    window.history.back();
}
        document.head.appendChild(style);