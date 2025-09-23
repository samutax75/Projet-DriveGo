// DriveGo Support Page - JavaScript avec UX améliorée

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const form = document.getElementById('incident-form');
    const submitBtn = document.getElementById('submit-btn');
    const prioriteSelect = document.getElementById('priorite');
    const typeIncidentSelect = document.getElementById('type-incident');
    const descriptionTextarea = document.getElementById('description');
    
    let currentStep = 1;
    const totalSteps = 3;
    
    // Validation des numéros de téléphone français
    function validatePhoneNumber(phone) {
        const phoneRegex = /^(0[1-9]|[1-9][0-9])[0-9]{8}$/;
        const cleanPhone = phone.replace(/\s+/g, '').replace(/[.-]/g, '');
        return phoneRegex.test(cleanPhone);
    }
    
    // Validation email
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Formatage automatique du numéro de téléphone
    function formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        
        if (value.length >= 2) {
            value = value.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        }
        
        input.value = value;
    }
    
    // Gestion du formatage du téléphone en temps réel
    const phoneInput = document.getElementById('telephone');
    phoneInput.addEventListener('input', function() {
        formatPhoneNumber(this);
        validateField(this);
    });
    
    // Compteur de caractères pour la description
    descriptionTextarea.addEventListener('input', function() {
        const count = this.value.length;
        const maxLength = 500;
        document.getElementById('desc-count').textContent = count;
        
        if (count > maxLength) {
            this.value = this.value.substring(0, maxLength);
            document.getElementById('desc-count').textContent = maxLength;
        }
        
        validateField(this);
    });
    
    // Gestion de la priorité avec indicateurs visuels
    prioriteSelect.addEventListener('change', function() {
        const priority = this.value;
        this.className = this.className.replace(/priority-\w+/, '');
        
        if (priority) {
            this.classList.add(`priority-${priority}`);
        }
        
        // Afficher des conseils selon la priorité
        showPriorityAdvice(priority);
        validateField(this);
    });
    
    function showPriorityAdvice(priority) {
        const advice = {
            'critique': 'En cas de danger immédiat, contactez d\'abord les secours (15, 17, 18) !',
            'elevee': 'Si le véhicule est immobilisé, appelez l\'astreinte : 06 12 34 56 78',
            'normale': 'Votre signalement sera traité dans les meilleurs délais.',
            'faible': 'Merci pour ce signalement préventif, il sera traité prochainement.'
        };
        
        if (advice[priority]) {
            showFieldAdvice('priorite', advice[priority], priority === 'critique' ? 'error' : 'info');
        }
    }
    
    // Géolocalisation
    window.getCurrentLocation = function() {
        if (navigator.geolocation) {
            const locationBtn = document.querySelector('.btn-location');
            locationBtn.innerHTML = '⏳';
            locationBtn.disabled = true;
            
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude.toFixed(6);
                    const lon = position.coords.longitude.toFixed(6);
                    
                    const locationInput = document.getElementById('localisation');
                    locationInput.value = `Coordonnées GPS: ${lat}, ${lon}`;
                    
                    locationBtn.innerHTML = '✅';
                    setTimeout(() => {
                        locationBtn.innerHTML = '📍';
                        locationBtn.disabled = false;
                    }, 2000);
                    
                    validateField(locationInput);
                },
                function(error) {
                    console.error('Erreur de géolocalisation:', error);
                    showFieldAdvice('localisation', 'Impossible d\'obtenir votre position. Saisissez manuellement.', 'warning');
                    
                    const locationBtn = document.querySelector('.btn-location');
                    locationBtn.innerHTML = '❌';
                    setTimeout(() => {
                        locationBtn.innerHTML = '📍';
                        locationBtn.disabled = false;
                    }, 2000);
                }
            );
        } else {
            showFieldAdvice('localisation', 'Géolocalisation non supportée par votre navigateur.', 'warning');
        }
    };
    
    // Navigation entre les étapes
    window.nextStep = function(step) {
        if (validateCurrentStep()) {
            showStep(step);
            updateSummary();
        }
    };
    
    window.prevStep = function(step) {
        showStep(step);
    };
    
    function showStep(step) {
        // Masquer toutes les étapes
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.progress-step').forEach(s => s.classList.remove('active'));
        
        // Afficher l'étape courante
        document.getElementById(`step-${step}`).classList.add('active');
        document.querySelector(`[data-step="${step}"]`).classList.add('active');
        
        // Marquer les étapes précédentes comme complétées
        for (let i = 1; i < step; i++) {
            document.querySelector(`[data-step="${i}"]`).classList.add('completed');
        }
        
        currentStep = step;
        
        // Scroll vers le haut du formulaire
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    }
    
    function validateCurrentStep() {
        const stepElement = document.getElementById(`step-${currentStep}`);
        const requiredFields = stepElement.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    function validateField(field) {
        const value = field.value.trim();
        const fieldGroup = field.closest('.form-group');
        const errorElement = fieldGroup.querySelector('.field-error');
        
        // Reset état
        field.classList.remove('field-valid', 'field-invalid');
        errorElement.textContent = '';
        
        // Validation selon le type de champ
        let isValid = true;
        let errorMessage = '';
        
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'Ce champ est obligatoire';
        } else if (field.type === 'tel' && value && !validatePhoneNumber(value)) {
            isValid = false;
            errorMessage = 'Format de téléphone invalide (ex: 06 12 34 56 78)';
        } else if (field.type === 'email' && value && !validateEmail(value)) {
            isValid = false;
            errorMessage = 'Format d\'email invalide';
        } else if (field.id === 'description' && value.length < 10) {
            isValid = false;
            errorMessage = 'Description trop courte (minimum 10 caractères)';
        }
        
        if (isValid) {
            field.classList.add('field-valid');
        } else {
            field.classList.add('field-invalid');
            errorElement.textContent = errorMessage;
        }
        
        return isValid;
    }
    
    function showFieldAdvice(fieldId, message, type = 'info') {
        const field = document.getElementById(fieldId);
        const fieldGroup = field.closest('.form-group');
        
        // Supprimer les anciens conseils
        const existingAdvice = fieldGroup.querySelector('.field-advice');
        if (existingAdvice) {
            existingAdvice.remove();
        }
        
        // Créer le nouveau conseil
        const advice = document.createElement('div');
        advice.className = `field-advice ${type}`;
        advice.textContent = message;
        
        fieldGroup.appendChild(advice);
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            if (advice.parentElement) {
                advice.remove();
            }
        }, 5000);
    }
    
    function updateSummary() {
        document.getElementById('summary-conducteur').textContent = 
            `${document.getElementById('conducteur-prenom').value} ${document.getElementById('conducteur-nom').value}`;
        
        const vehiculeSelect = document.getElementById('vehicule-incident');
        document.getElementById('summary-vehicule').textContent = 
            vehiculeSelect.options[vehiculeSelect.selectedIndex]?.text || '-';
        
        const prioriteSelect = document.getElementById('priorite');
        document.getElementById('summary-priorite').textContent = 
            prioriteSelect.options[prioriteSelect.selectedIndex]?.text || '-';
        
        const typeSelect = document.getElementById('type-incident');
        document.getElementById('summary-type').textContent = 
            typeSelect.options[typeSelect.selectedIndex]?.text || '-';
        
        document.getElementById('summary-localisation').textContent = 
            document.getElementById('localisation').value || '-';
    }
    
    // Validation en temps réel sur tous les champs
    form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('field-invalid')) {
                validateField(field);
            }
        });
    });
    
    // Soumission du formulaire
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validation finale
        if (!validateCurrentStep()) {
            showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
            return;
        }
        
        // État de chargement
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Envoi en cours...';
        submitBtn.disabled = true;
        
        // Collecter les données
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Ajouter des métadonnées
        data.timestamp = new Date().toISOString();
        data.user_agent = navigator.userAgent;
        data.current_url = window.location.href;
        
        // Envoi vers le serveur
        fetch('/api/support/incident', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Succès
                showSuccessPage(result);
            } else {
                throw new Error(result.message || 'Erreur lors de l\'envoi');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification(
                'Erreur lors de l\'envoi du signalement. Veuillez réessayer ou contactez directement l\'astreinte au 06 12 34 56 78.',
                'error'
            );
        })
        .finally(() => {
            // Réinitialiser le bouton
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<span class="btn-icon">📤</span> Envoyer le Signalement';
            submitBtn.disabled = false;
        });
    });
    
    function showSuccessPage(result) {
        // Masquer le formulaire et afficher la page de succès
        const formCard = document.querySelector('.form-card');
        formCard.innerHTML = `
            <div class="success-container">
                <div class="success-icon">✅</div>
                <h3>Signalement envoyé avec succès !</h3>
                <div class="success-details">
                    <p><strong>Numéro de ticket :</strong> #${result.ticket_id}</p>
                    <p><strong>Priorité :</strong> ${getPriorityLabel(result.priority)}</p>
                    <p>Votre signalement a été transmis à l'équipe technique.</p>
                    ${result.priority === 'critique' ? 
                        '<div class="critical-notice">🚨 Urgence critique détectée - L\'astreinte va vous contacter sous 5 minutes</div>' : 
                        '<p>Vous recevrez une confirmation par email si une adresse a été fournie.</p>'
                    }
                </div>
                <div class="success-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        Nouveau signalement
                    </button>
                    <a href="/" class="btn btn-secondary">
                        Retour à l'accueil
                    </a>
                </div>
            </div>
        `;
        
        // Notification selon la priorité
        if (result.priority === 'critique') {
            setTimeout(() => {
                showNotification(
                    'URGENCE CRITIQUE : L\'équipe d\'astreinte va vous contacter immédiatement. Gardez votre téléphone à portée.',
                    'error',
                    10000
                );
            }, 1000);
        }
    }
    
    function getPriorityLabel(priority) {
        const labels = {
            'critique': '🔴 Critique',
            'elevee': '🟠 Élevée',
            'normale': '🟡 Normale',
            'faible': '🟢 Faible'
        };
        return labels[priority] || priority;
    }
    
    // Fonction pour afficher les notifications
    function showNotification(message, type = 'success', duration = 5000) {
        // Supprimer les anciennes notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        // Créer la nouvelle notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '10000',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            background: type === 'success' ? '#d4edda' : 
                       type === 'error' ? '#f8d7da' : 
                       type === 'warning' ? '#fff3cd' : '#d1ecf1',
            border: `1px solid ${type === 'success' ? '#c3e6cb' : 
                                type === 'error' ? '#f5c6cb' : 
                                type === 'warning' ? '#ffeaa7' : '#bee5eb'}`,
            color: type === 'success' ? '#155724' : 
                   type === 'error' ? '#721c24' : 
                   type === 'warning' ? '#856404' : '#0c5460',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transform: 'translateX(100%)',
            opacity: '0',
            transition: 'all 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Auto-suppression
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.transform = 'translateX(100%)';
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }
    
    // Sauvegarde automatique en mode hors ligne
    function saveToLocalStorage() {
        const formData = {};
        form.querySelectorAll('input, select, textarea').forEach(field => {
            if (field.value) {
                formData[field.name] = field.value;
            }
        });
        
        localStorage.setItem('incident-form-draft', JSON.stringify({
            data: formData,
            timestamp: Date.now()
        }));
    }
    
    function loadFromLocalStorage() {
        const saved = localStorage.getItem('incident-form-draft');
        if (saved) {
            try {
                const { data, timestamp } = JSON.parse(saved);
                
                // Vérifier que les données ne sont pas trop anciennes (24h)
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    Object.keys(data).forEach(name => {
                        const field = form.querySelector(`[name="${name}"]`);
                        if (field) {
                            field.value = data[name];
                        }
                    });
                    
                    showNotification('Données précédentes restaurées', 'info');
                }
            } catch (e) {
                console.error('Erreur restauration données:', e);
            }
        }
    }
    
    // Sauvegarder automatiquement à chaque modification
    form.addEventListener('input', debounce(saveToLocalStorage, 1000));
    
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
    
    // Gestion hors ligne
    window.addEventListener('online', function() {
        showNotification('Connexion internet rétablie', 'success');
    });
    
    window.addEventListener('offline', function() {
        showNotification('Mode hors ligne - Vos données seront sauvegardées localement', 'warning');
    });
    
    // Raccourcis clavier
    document.addEventListener('keydown', function(e) {
        // Échap pour fermer les notifications
        if (e.key === 'Escape') {
            document.querySelectorAll('.notification').forEach(n => n.remove());
        }
        
        // Flèches pour naviguer entre les étapes
        if (e.altKey) {
            if (e.key === 'ArrowRight' && currentStep < totalSteps) {
                nextStep(currentStep + 1);
                e.preventDefault();
            } else if (e.key === 'ArrowLeft' && currentStep > 1) {
                prevStep(currentStep - 1);
                e.preventDefault();
            }
        }
    });
    
    // Initialisation
    loadFromLocalStorage();
    
    // Gestion des liens de téléphone avec confirmation
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const number = this.getAttribute('href').replace('tel:', '');
            const emergencyNumbers = ['15', '17', '18', '112'];
            
            if (emergencyNumbers.includes(number)) {
                const confirmation = confirm(
                    `Vous êtes sur le point d'appeler le ${number}.\n\n` +
                    'Confirmez-vous qu\'il s\'agit d\'une réelle urgence ?'
                );
                
                if (!confirmation) {
                    e.preventDefault();
                }
            }
        });
    });
    
    console.log('Support DriveGo initialisé avec succès');
});