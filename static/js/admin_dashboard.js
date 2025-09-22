// ===============================
// VARIABLES GLOBALES
// ===============================
let currentVehicleId = null;
let currentUserId = null;
let vehicles = [];
let users = [];

// ===============================
// GESTION DE LA NAVIGATION
// ===============================
function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Désactiver tous les onglets
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Afficher la section sélectionnée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Activer l'onglet correspondant
    const activeTab = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Charger les données spécifiques à la section
    switch (sectionId) {
        case 'vehicles':
            loadVehicles();
            break;
        case 'users':
            loadUsers();
            break;
        case 'dashboard':
            loadDashboardStats();
            break;
    }
}

// ===============================
// GESTION DES MODALES
// ===============================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Focus sur le premier input
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Reset form
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            clearFormResults(form);
        }

        // Reset variables
        resetModalVariables(modalId);
    }
}

function resetModalVariables(modalId) {
    if (modalId === 'addVehicleModal') {
        currentVehicleId = null;
        const title = document.querySelector('#addVehicleModal .modal-header h2');
        if (title) title.textContent = 'Ajouter un véhicule';
    } else if (modalId === 'addUserModal') {
        currentUserId = null;
        const title = document.querySelector('#addUserModal .modal-header h2');
        if (title) title.textContent = 'Ajouter un conducteur';
    }
}

function clearFormResults(form) {
    const results = form.querySelectorAll('.form-result');
    results.forEach(result => {
        result.textContent = '';
        result.className = 'form-result';
        result.style.display = 'none';
    });
}

// ===============================
// SYSTÈME DE NOTIFICATIONS
// ===============================
function showNotification(message, type = 'success', duration = 4000) {
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());

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

    // Styles inline pour la notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '10000',
        padding: '16px 24px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontWeight: '500',
        maxWidth: '400px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
        transform: 'translateX(100%)',
        opacity: '0',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    });

    // Couleurs selon le type
    const colors = {
        success: 'background: rgba(16, 185, 129, 0.9); color: white; border-color: rgba(16, 185, 129, 0.3);',
        error: 'background: rgba(239, 68, 68, 0.9); color: white; border-color: rgba(239, 68, 68, 0.3);',
        warning: 'background: rgba(245, 158, 11, 0.9); color: white; border-color: rgba(245, 158, 11, 0.3);',
        info: 'background: rgba(59, 130, 246, 0.9); color: white; border-color: rgba(59, 130, 246, 0.3);'
    };

    notification.style.cssText += colors[type] || colors.info;

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
                setTimeout(() => notification.remove(), 400);
            }
        }, duration);
    }
}

// ===============================
// CHARGEMENT DES DONNÉES
// ===============================
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/dashboard/stats');
        const data = await response.json();

        if (data.success) {
            const stats = data.stats;
            // Mise à jour des statistiques avec animation
            updateStatWithAnimation('totalVehicles', stats.totalVehicles);
            updateStatWithAnimation('availableVehicles', stats.availableVehicles);
            updateStatWithAnimation('totalUsers', stats.totalUsers);
            updateStatWithAnimation('alertsCount', stats.alertsCount);

            // Charger les alertes
            loadAlerts();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        showNotification('Erreur lors du chargement des statistiques', 'error');
        // Valeurs par défaut en cas d'erreur
        updateStatWithAnimation('totalVehicles', 0);
        updateStatWithAnimation('availableVehicles', 0);
        updateStatWithAnimation('totalUsers', 0);
        updateStatWithAnimation('alertsCount', 0);
    }
}

function updateStatWithAnimation(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentValue = Math.round(startValue + (newValue - startValue) * easeOutCubic(progress));
        element.textContent = currentValue;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

async function loadAlerts() {
    try {
        const response = await fetch('/api/admin/alerts');
        const data = await response.json();

        if (data.success) {
            displayAlerts(data.alerts);
        }
    } catch (error) {
        console.error('Erreur chargement alertes:', error);
    }
}

function displayAlerts(alerts) {
    const alertList = document.querySelector('.alert-list');
    if (!alertList) return;
    
    if (alerts.length === 0) {
        alertList.innerHTML = `
            <div class="alert-item success">
                <div class="alert-icon">✅</div>
                <div class="alert-content">
                    <strong>Aucune alerte</strong>
                    <p>Tous vos véhicules sont à jour !</p>
                </div>
            </div>
        `;
        return;
    }
    
    alertList.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
            <div class="alert-icon">${alert.type === 'urgent' ? '🚨' : '⚠️'}</div>
            <div class="alert-content">
                <strong>${alert.title}</strong>
                <p>${alert.description}</p>
            </div>
            <div class="alert-actions">
                <button class="btn btn-sm" onclick="viewVehicleDetails(${getVehicleIdByPlate(alert.vehicle_plate)})">Voir détails</button>
            </div>
        </div>
    `).join('');
}

function getVehicleIdByPlate(plate) {
    const vehicle = vehicles.find(v => v.immatriculation === plate);
    return vehicle ? vehicle.id : 1;
}

async function loadVehicles() {
    try {
        const response = await fetch('/api/admin/vehicles');
        const data = await response.json();

        if (data.success) {
            vehicles = data.vehicles;
            displayVehicles(vehicles);
        } else {
            throw new Error(data.message || 'Erreur lors du chargement');
        }
    } catch (error) {
        console.error('Erreur chargement véhicules:', error);
        showNotification('Erreur lors du chargement des véhicules', 'error');
        displayVehicles([]);
    }
}

function displayVehicles(vehiclesList) {
    const container = document.getElementById('vehiclesGrid');
    if (!container) return;

    if (vehiclesList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🚗</div>
                <h3>Aucun véhicule</h3>
                <p>Commencez par ajouter votre premier véhicule au parc automobile.</p>
                <button class="btn btn-primary" onclick="showModal('addVehicleModal')">
                    <span class="icon">➕</span>
                    Ajouter un véhicule
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = vehiclesList.map(vehicle => `
        <div class="vehicle-card" data-vehicle-id="${vehicle.id}">
            <div class="vehicle-header">
                <div>
                    <div class="vehicle-name">${vehicle.nom}</div>
                    <div class="vehicle-plate">${vehicle.immatriculation}</div>
                </div>
                <div class="vehicle-status ${vehicle.statut || 'actif'}">${getStatusText(vehicle.statut || 'actif')}</div>
            </div>
            <div class="vehicle-details">
                <div class="vehicle-detail-item">
                    <span class="vehicle-detail-label">Date d'immatriculation</span>
                    <span class="vehicle-detail-value">${vehicle.dateImmatriculation || 'Non renseigné'}</span>
                </div>
                <div class="vehicle-detail-item">
                    <span class="vehicle-detail-label">Prochain contrôle</span>
                    <span class="vehicle-detail-value">${vehicle.prochainControle || 'Non renseigné'}</span>
                </div>
                <div class="vehicle-detail-item">
                    <span class="vehicle-detail-label">Numéro de carte</span>
                    <span class="vehicle-detail-value">${vehicle.numeroCarte || 'Non renseigné'}</span>
                </div>
            </div>
            <div class="vehicle-actions">
                <button class="btn btn-sm btn-primary" onclick="viewVehicleDetails(${vehicle.id})">
                    <span class="icon">👁️</span>
                    Voir détails
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editVehicle(${vehicle.id})">
                    <span class="icon">✏️</span>
                    Modifier
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteVehicle(${vehicle.id})">
                    <span class="icon">🗑️</span>
                    Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'actif': 'Actif',
        'maintenance': 'Maintenance',
        'hors-service': 'Hors service'
    };
    return statusMap[status] || 'Actif';
}

async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();

        if (data.success) {
            users = data.users;
            displayUsers(users);
        } else {
            throw new Error(data.message || 'Erreur lors du chargement');
        }
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
        showNotification('Erreur lors du chargement des utilisateurs', 'error');
        displayUsers([]);
    }
}

function displayUsers(usersList) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (usersList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state-table">
                    <div class="empty-icon">👥</div>
                    <h3>Aucun conducteur</h3>
                    <p>Commencez par ajouter votre premier conducteur.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usersList.map(user => `
        <tr data-user-id="${user.id}">
            <td>
                <div class="user-info">
                    <div class="user-avatar">${getInitials(user.prenom, user.nom)}</div>
                    <div class="user-details">
                        <h4>${user.prenom} ${user.nom}</h4>
                        <p>${user.email}</p>
                    </div>
                </div>
            </td>
            <td>${user.telephone || 'Non renseigné'}</td>
            <td>
                <span class="vehicle-status ${user.statut || 'actif'}">${getStatusText(user.statut || 'actif')}</span>
            </td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">Modifier</button>
                    ${user.statut === 'suspendu' ?
            `<button class="btn btn-sm btn-success" onclick="activateUser(${user.id})">Réactiver</button>` :
            `<button class="btn btn-sm btn-danger" onclick="suspendUser(${user.id})">Suspendre</button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

function getInitials(prenom, nom) {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
}

function formatDate(dateString) {
    if (!dateString) return 'Non renseigné';
    return new Date(dateString).toLocaleDateString('fr-FR');
}

// ===============================
// GESTION DES VÉHICULES
// ===============================
function viewVehicleDetails(vehicleId) {
    window.location.href = `/vehicules/${vehicleId}`;
}

function editVehicle(vehicleId) {
    currentVehicleId = vehicleId;
    const vehicle = vehicles.find(v => v.id === vehicleId);

    if (!vehicle) {
        showNotification('Véhicule introuvable', 'error');
        return;
    }

    // Pré-remplir le formulaire
    document.getElementById('vehicleName').value = vehicle.nom || '';
    document.getElementById('vehiclePlate').value = vehicle.immatriculation || '';
    document.getElementById('vehicleBrand').value = vehicle.carteGrise?.marque || '';
    document.getElementById('vehicleModel').value = vehicle.carteGrise?.modele || '';
    document.getElementById('vehicleRegistrationDate').value = formatDateForInput(vehicle.dateImmatriculation);

    // Changer le titre du modal
    const title = document.querySelector('#addVehicleModal .modal-header h2');
    if (title) title.textContent = 'Modifier le véhicule';

    showModal('addVehicleModal');
}

async function deleteVehicle(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer le véhicule "${vehicle.nom}" ?`)) {
        try {
            const response = await fetch(`/api/admin/vehicles/${vehicleId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                loadVehicles();
                loadDashboardStats();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Erreur suppression véhicule:', error);
            showNotification(error.message || 'Erreur lors de la suppression', 'error');
        }
    }
}

// ===============================
// GESTION DES UTILISATEURS
// ===============================
function editUser(userId) {
    currentUserId = userId;
    const user = users.find(u => u.id === userId);

    if (!user) {
        showNotification('Utilisateur introuvable', 'error');
        return;
    }

    // Pré-remplir le formulaire
    document.getElementById('userFirstName').value = user.prenom || '';
    document.getElementById('userLastName').value = user.nom || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.telephone || '';

    // Changer le titre du modal
    const title = document.querySelector('#addUserModal .modal-header h2');
    if (title) title.textContent = 'Modifier le conducteur';

    showModal('addUserModal');
}

async function suspendUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Êtes-vous sûr de vouloir suspendre ${user.prenom} ${user.nom} ?`)) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/suspend`, {
                method: 'PUT'
            });
            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message);
                loadUsers();
                loadDashboardStats();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Erreur suspension utilisateur:', error);
            showNotification(error.message || 'Erreur lors de la suspension', 'error');
        }
    }
}

async function activateUser(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/activate`, {
            method: 'PUT'
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message);
            loadUsers();
            loadDashboardStats();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erreur réactivation utilisateur:', error);
        showNotification(error.message || 'Erreur lors de la réactivation', 'error');
    }
}

// ===============================
// GESTION DES FORMULAIRES
// ===============================
async function handleVehicleForm(event) {
    event.preventDefault();

    const formData = {
        nom: document.getElementById('vehicleName').value,
        immatriculation: document.getElementById('vehiclePlate').value,
        dateImmatriculation: document.getElementById('vehicleRegistrationDate').value,
        marque: document.getElementById('vehicleBrand').value,
        modele: document.getElementById('vehicleModel').value,
        numeroCarteGrise: '',
        dateEmission: document.getElementById('vehicleRegistrationDate').value,
        titulaire: 'Fondation Perce-Neige'
    };

    const url = currentVehicleId ?
        `/api/admin/vehicles/${currentVehicleId}` :
        '/api/admin/vehicles';
    const method = currentVehicleId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            const message = currentVehicleId ? 'Véhicule modifié avec succès' : 'Véhicule ajouté avec succès';
            showNotification(message);
            closeModal('addVehicleModal');
            loadVehicles();
            loadDashboardStats();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erreur formulaire véhicule:', error);
        showFormError('vehicleForm', error.message || 'Erreur lors de l\'opération');
    }
}

async function handleUserForm(event) {
    event.preventDefault();
    
    const formData = {
        prenom: document.getElementById('userFirstName').value,
        nom: document.getElementById('userLastName').value,
        email: document.getElementById('userEmail').value,
        telephone: document.getElementById('userPhone').value
    };
    
    const url = currentUserId ?
        `/api/admin/users/${currentUserId}` :
        '/api/admin/users';
    const method = currentUserId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            const message = currentUserId ? 'Conducteur modifié avec succès' : 'Conducteur ajouté avec succès';
            showNotification(message);

            if (!currentUserId && data.temp_password) {
                showNotification(`Mot de passe temporaire: ${data.temp_password}`, 'info', 10000);
            }

            closeModal('addUserModal');
            loadUsers();
            loadDashboardStats();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erreur formulaire utilisateur:', error);
        showFormError('userForm', error.message || 'Erreur lors de l\'opération');
    }
}

// ===============================
// FONCTION D'INVITATION (CORRIGÉE)
// ===============================
async function sendInvitation(event) {
    event.preventDefault();

    const email = document.getElementById('inviteEmail').value;
    const message = document.getElementById('inviteMessage').value;
    
    console.log('=== DEBUG INVITATION ===');
    console.log('Email:', email);
    console.log('Message:', message);
    
    if (!email || !email.includes('@')) {
        showFormError('invitationForm', 'Veuillez saisir une adresse email valide');
        return;
    }

    // Désactiver le bouton de soumission
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';
    }

    try {
        console.log('Envoi de la requête...');
        
        const response = await fetch('/api/admin/send-invitation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, message })
        });

        const data = await response.json();
        console.log('Réponse reçue:', data);

        if (data.success) {
            showFormSuccess('invitationForm', data.message);
            document.getElementById('inviteEmail').value = '';
            document.getElementById('inviteMessage').value = '';
            showNotification(data.message);
            closeModal('inviteUserModal');
        } else {
            throw new Error(data.message || 'Erreur lors de l\'envoi');
        }
    } catch (error) {
        console.error('Erreur envoi invitation:', error);
        showFormError('invitationForm', error.message || 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
        // Réactiver le bouton
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer l\'invitation';
        }
    }
}

function showFormError(formId, message) {
    showFormResult(formId, message, 'error');
}

function showFormSuccess(formId, message) {
    showFormResult(formId, message, 'success');
}

function showFormResult(formId, message, type) {
    const form = document.getElementById(formId);
    if (!form) return;

    let result = form.querySelector('.form-result');
    if (!result) {
        result = document.createElement('div');
        result.className = 'form-result';
        form.appendChild(result);
    }

    result.textContent = message;
    result.className = `form-result ${type}`;
    result.style.display = 'block';

    setTimeout(() => {
        result.style.display = 'none';
    }, 5000);
}

// ===============================
// FONCTIONS D'EXPORT
// ===============================
function exportDashboardCSV() {
    const data = [
        ['Métrique', 'Valeur'],
        ['Véhicules actifs', document.getElementById('totalVehicles')?.textContent || '0'],
        ['Véhicules disponibles', document.getElementById('availableVehicles')?.textContent || '0'],
        ['Conducteurs actifs', document.getElementById('totalUsers')?.textContent || '0'],
        ['Alertes actives', document.getElementById('alertsCount')?.textContent || '0']
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const filename = `dashboard_drivego_${new Date().toISOString().split('T')[0]}.csv`;

    downloadCSV(filename, csvContent);
    showNotification('Dashboard exporté en CSV avec succès');
}

function exportVehiclesCSV() {
    if (vehicles.length === 0) {
        showNotification('Aucun véhicule à exporter', 'warning');
        return;
    }

    const headers = ['Nom', 'Immatriculation', 'Date d\'immatriculation', 'Statut', 'Prochain contrôle'];
    const data = [headers];

    vehicles.forEach(vehicle => {
        data.push([
            vehicle.nom,
            vehicle.immatriculation,
            vehicle.dateImmatriculation || '',
            vehicle.statut || 'actif',
            vehicle.prochainControle || ''
        ]);
    });

    const csvContent = data.map(row => row.join(',')).join('\n');
    const filename = `vehicules_drivego_${new Date().toISOString().split('T')[0]}.csv`;

    downloadCSV(filename, csvContent);
    showNotification('Véhicules exportés en CSV avec succès');
}

function exportUsersCSV() {
    if (users.length === 0) {
        showNotification('Aucun utilisateur à exporter', 'warning');
        return;
    }

    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Statut', 'Date d\'inscription'];
    const data = [headers];

    users.forEach(user => {
        data.push([
            user.prenom,
            user.nom,
            user.email,
            user.telephone || '',
            user.statut || 'actif',
            formatDate(user.created_at)
        ]);
    });

    const csvContent = data.map(row => row.join(',')).join('\n');
    const filename = `conducteurs_drivego_${new Date().toISOString().split('T')[0]}.csv`;

    downloadCSV(filename, csvContent);
    showNotification('Conducteurs exportés en CSV avec succès');
}

function downloadCSV(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===============================
// FONCTIONS UTILITAIRES
// ===============================
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

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

// Fonction de recherche avec debounce
const debouncedVehicleSearch = debounce((searchTerm) => {
    const filtered = vehicles.filter(vehicle =>
        vehicle.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.immatriculation.toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayVehicles(filtered);
}, 300);

const debouncedUserSearch = debounce((searchTerm) => {
    const filtered = users.filter(user =>
        `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayUsers(filtered);
}, 300);

// ===============================
// INITIALISATION ET ÉVÉNEMENTS
// ===============================
document.addEventListener('DOMContentLoaded', function () {
    // Chargement initial
    loadDashboardStats();
    
    // Gestionnaires de formulaires
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', handleVehicleForm);
    }

    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserForm);
    }
    
    const invitationForm = document.getElementById('invitationForm');
    if (invitationForm) {
        invitationForm.addEventListener('submit', sendInvitation);
    }

    // Gestionnaires de recherche
    const vehicleSearch = document.getElementById('vehicleSearch');
    if (vehicleSearch) {
        vehicleSearch.addEventListener('input', (e) => {
            debouncedVehicleSearch(e.target.value);
        });
    }

    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', (e) => {
            debouncedUserSearch(e.target.value);
        });
    }

    // Fermeture des modales en cliquant à l'extérieur
    window.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal')) {
            const modalId = event.target.id;
            closeModal(modalId);
        }
    });

    // Gestion des touches clavier
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });

    // Animation progressive des cartes au chargement
    setTimeout(() => {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'fadeInUp 0.6s ease-out both';
            }, index * 100);
        });
    }, 500);
});