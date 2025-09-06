// DriveGo Support Page - JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const form = document.getElementById('incident-form');
    const urgenceBtn = document.getElementById('urgence-btn');
    const submitBtn = document.getElementById('submit-btn');
    const prioriteSelect = document.getElementById('priorite');
    const typeIncidentSelect = document.getElementById('type-incident');
    
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
    });
    
    // Gestion du bouton d'urgence
    urgenceBtn.addEventListener('click', function() {
        const confirmation = confirm(
            '⚠️ ALERTE URGENCE ⚠️\n\n' +
            'Vous êtes sur le point de signaler une urgence.\n' +
            'Avez-vous déjà contacté les secours si nécessaire ?\n\n' +
            '• Accident avec blessés : 15 (SAMU)\n' +
            '• Incendie : 18 (Pompiers)\n' +
            '• Urgence générale : 112\n\n' +
            'Confirmer le signalement d\'urgence ?'
        );
        
        if (confirmation) {
            // Définir automatiquement la priorité comme critique
            prioriteSelect.value = 'critique';
            prioriteSelect.style.borderColor = '#e74c3c';
            prioriteSelect.style.backgroundColor = '#ffebee';
            
            // Scroll vers le formulaire
            form.scrollIntoView({ behavior: 'smooth' });
            
            // Focus sur le premier champ vide
            const firstEmptyField = form.querySelector('input:not([value]), select:not([value])');
            if (firstEmptyField) {
                firstEmptyField.focus();
            }
            
            // Ajouter une classe d'urgence au formulaire
            form.classList.add('urgence-mode');
            
            // Afficher un message d'urgence
            showAlert('Formulaire en mode URGENCE. Veuillez remplir tous les champs rapidement.', 'error');
        }
    });
    
    // Gestion de la priorité
    prioriteSelect.addEventListener('change', function() {
        const priority = this.value;
        this.style.borderColor = '';
        this.style.backgroundColor = '';
        
        switch(priority) {
            case 'critique':
                this.style.borderColor = '#e74c3c';
                this.style.backgroundColor = '#ffebee';
                break;
            case 'elevee':
                this.style.borderColor = '#f39c12';
                this.style.backgroundColor = '#fef9e7';
                break;
            case 'normale':
                this.style.borderColor = '#f1c40f';
                this.style.backgroundColor = '#fffef0';
                break;
            case 'faible':
                this.style.borderColor = '#27ae60';
                this.style.backgroundColor = '#eafaf1';
                break;
        }
    });
    
    // Suggestions automatiques pour la localisation
    const localisationInput = document.getElementById('localisation');
    localisationInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        
        // Suggestions basiques pour les lieux communs
        const suggestions = [
            'Autoroute A1 - Sortie 15',
            'Parking Carrefour - Centre Commercial',
            'Rue de la République - Centre ville',
            'Avenue des Champs-Élysées - Paris',
            'Rond-point Charles de Gaulle',
            'Zone industrielle - Entrée Nord'
        ];
        
        // Ici, vous pourriez implémenter une vraie API de géolocalisation
        // Pour cet exemple, on se contente de la validation
    });
    
    // Validation du formulaire
    function validateForm() {
        const errors = [];
        
        // Vérification des champs requis
        const requiredFields = [
            { id: 'conducteur-nom', name: 'Nom' },
            { id: 'conducteur-prenom', name: 'Prénom' },
            { id: 'vehicule-incident', name: 'Véhicule' },
            { id: 'priorite', name: 'Priorité' },
            { id: 'type-incident', name: 'Type d\'incident' },
            { id: 'localisation', name: 'Localisation' },
            { id: 'description', name: 'Description' },
            { id: 'telephone', name: 'Téléphone' }
        ];
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                errors.push(`Le champ "${field.name}" est requis.`);
                element.style.borderColor = '#e74c3c';
            } else {
                element.style.borderColor = '';
            }
        });
        
        // Validation du téléphone
        const phone = document.getElementById('telephone').value;
        if (phone && !validatePhoneNumber(phone)) {
            errors.push('Le numéro de téléphone n\'est pas valide.');
            document.getElementById('telephone').style.borderColor = '#e74c3c';
        }
        
        // Validation de l'email (optionnel)
        const email = document.getElementById('email').value;
        if (email && !validateEmail(email)) {
            errors.push('L\'adresse email n\'est pas valide.');
            document.getElementById('email').style.borderColor = '#e74c3c';
        }
        
        return errors;
    }
    
    // Fonction pour afficher les messages
    function showAlert(message, type = 'success') {
        // Supprimer les anciens messages
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Créer le nouveau message
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Insérer avant le formulaire
        const formContainer = document.querySelector('.incident-form-container');
        formContainer.insertBefore(alert, formContainer.firstChild);
        
        // Scroll vers le message
        alert.scrollIntoView({ behavior: 'smooth' });
        
        // Supprimer le message après 5 secondes
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
    
    // Soumission du formulaire
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validation
        const errors = validateForm();
        
        if (errors.length > 0) {
            showAlert('Erreurs dans le formulaire :\n' + errors.join('\n'), 'error');
            return;
        }
        
        // Simulation de l'envoi
        submitBtn.classList.add('loading');
        submitBtn.textContent = '📤 Envoi en cours...';
        submitBtn.disabled = true;
        
        // Collecter les données
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Ajouter un timestamp
        data.timestamp = new Date().toISOString();
        data.urgence = form.classList.contains('urgence-mode');
        
        // Simulation d'envoi (remplacer par un vrai appel API)
        setTimeout(() => {
            console.log('Données envoyées:', data);
            
            // Simuler une réponse
            const isSuccess = Math.random() > 0.1; // 90% de succès
            
            if (isSuccess) {
                showAlert(
                    '✅ Signalement envoyé avec succès!\n' +
                    'Numéro de ticket: #' + Math.random().toString(36).substr(2, 9).toUpperCase() + '\n' +
                    'Vous recevrez une confirmation par email/SMS.',
                    'success'
                );
                
                // Réinitialiser le formulaire
                form.reset();
                form.classList.remove('urgence-mode');
                
                // Réinitialiser les styles
                const fields = form.querySelectorAll('input, select, textarea');
                fields.forEach(field => {
                    field.style.borderColor = '';
                    field.style.backgroundColor = '';
                });
                
                // Selon la priorité, afficher des actions supplémentaires
                if (data.priorite === 'critique') {
                    setTimeout(() => {
                        alert(
                            '🚨 URGENCE DÉTECTÉE 🚨\n\n' +
                            'Votre signalement critique a été transmis.\n' +
                            'L\'équipe d\'astreinte va vous contacter sous 5 minutes.\n\n' +
                            'En attendant :\n' +
                            '• Restez en sécurité\n' +
                            '• Gardez votre téléphone à portée\n' +
                            '• Contactez le 06 12 34 56 78 si besoin'
                        );
                    }, 1000);
                }
                
            } else {
                showAlert(
                    '❌ Erreur lors de l\'envoi du signalement.\n' +
                    'Veuillez réessayer ou contacter directement l\'astreinte au 06 12 34 56 78.',
                    'error'
                );
            }
            
            // Réinitialiser le bouton
            submitBtn.classList.remove('loading');
            submitBtn.textContent = '📤 Envoyer le Signalement';
            submitBtn.disabled = false;
            
        }, 2000);
    });
    
    // Gestion des liens de téléphone
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Vérifier si c'est un numéro d'urgence
            const number = this.getAttribute('href').replace('tel:', '');
            const emergencyNumbers = ['15', '17', '18', '112'];
            
            if (emergencyNumbers.includes(number)) {
                const confirmation = confirm(
                    `Vous êtes sur le point d'appeler le ${number}.\n\n` +
                    'Êtes-vous sûr qu\'il s\'agit d\'une urgence réelle ?\n\n' +
                    'Confirmer l\'appel ?'
                );
                
                if (!confirmation) {
                    e.preventDefault();
                }
            }
        });
    });
    
    // Fonction pour obtenir la position géographique
    function getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    // Ici, vous pourriez utiliser une API de géocodage inverse
                    // Pour convertir les coordonnées en adresse
                    const locationText = `Coordonnées: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                    
                    const locationInput = document.getElementById('localisation');
                    if (!locationInput.value) {
                        locationInput.value = locationText;
                    }
                },
                function(error) {
                    console.log('Erreur de géolocalisation:', error);
                }
            );
        }
    }
    
    // Bouton pour obtenir la position actuelle
    const addLocationBtn = document.createElement('button');
    addLocationBtn.type = 'button';
    addLocationBtn.className = 'btn btn-secondary';
    addLocationBtn.innerHTML = '📍 Utiliser ma position';
    addLocationBtn.style.marginTop = '0.5rem';
    
    const locationGroup = document.getElementById('localisation').parentNode;
    locationGroup.appendChild(addLocationBtn);
    
    addLocationBtn.addEventListener('click', getCurrentLocation);
    
    // Auto-save des données du formulaire (simulation)
    const formFields = form.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
        field.addEventListener('input', function() {
            // Ici, vous pourriez sauvegarder automatiquement
            // les données dans le localStorage ou sur le serveur
            console.log(`Champ ${field.name} modifié:`, field.value);
        });
    });
    
    // Détection de l'état hors ligne
    window.addEventListener('online', function() {
        showAlert('🌐 Connexion internet rétablie.', 'success');
    });
    
    window.addEventListener('offline', function() {
        showAlert('⚠️ Connexion internet perdue. Les données seront sauvegardées localement.', 'error');
    });
    
    // Raccourcis clavier
    document.addEventListener('keydown', function(e) {
        // Ctrl + U pour urgence
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            urgenceBtn.click();
        }
        
        // Ctrl + Enter pour soumettre
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (form.checkValidity()) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    });
    
    console.log('DriveGo Support Page initialisée avec succès!');
});


// -----------------------------------------------------------------------------------------------------------

