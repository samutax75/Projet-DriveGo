// ========================================
// GESTION DYNAMIQUE DE L'UTILISATEUR
// ========================================

// Fonction pour extraire les initiales
function getInitials(fullName) {
    return fullName.split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('');
}

// Fonction pour mettre à jour l'interface utilisateur
function updateUserInfo(userData) {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-info span');
    
    if (userAvatar && userName && userData && userData.name) {
        userAvatar.textContent = getInitials(userData.name);
        userName.textContent = userData.name;
        
        // Ajouter une couleur de fond basée sur les initiales
        userAvatar.style.backgroundColor = generateAvatarColor(userData.name);
    }
}

// Fonction pour générer une couleur basée sur le nom
function generateAvatarColor(name) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
        '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
    ];
    const hash = name.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
}

// Fonction pour récupérer les données utilisateur depuis votre API
async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/user/current', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.user) {
                // Adapter la structure à votre API et remplacer les données statiques
                const userData = {
                    id: data.user.id,
                    name: data.user.nom,
                    email: data.user.email,
                    role: data.user.role,
                    department: "Direction", // À adapter selon vos données
                    initials: getInitials(data.user.nom)
                };
                
                // Remplacer la variable globale currentUser
                window.currentUser = userData;
                
                // Mettre à jour l'interface
                updateUserInfo(userData);
                
                // Recharger les réservations avec le bon user_id
                loadUserReservations(userData.id);
                
            } else {
                console.error('Erreur API:', data.error);
                handleAuthError();
            }
        } else if (response.status === 401 || response.status === 404) {
            handleAuthError();
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        handleAuthError();
    }
}

// Fonction de gestion des erreurs d'authentification
function handleAuthError() {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-info span');
    
    if (userAvatar) userAvatar.textContent = '?';
    if (userName) userName.textContent = 'Non connecté';
    
    setTimeout(() => {
        window.location.href = '/login'; // Adapter selon votre route de login
    }, 1500);
}

// ========================================
// GESTION DYNAMIQUE DES VÉHICULES
// ========================================

// Fonction pour charger les véhicules depuis l'API
async function loadVehicles() {
    try {
        const response = await fetch('/api/vehicules', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.vehicules) {
                // Transformer les données API vers le format attendu par l'interface
                vehicles = data.vehicules.map(vehicule => {
                    // Déterminer le type de véhicule basé sur le nom
                    let type = '🚗'; // Par défaut
                    if (vehicule.nom && vehicule.nom.toLowerCase().includes('trafic')) {
                        type = '🚐';
                    } else if (vehicule.nom && vehicule.nom.toLowerCase().includes('kangoo')) {
                        type = '🚗';
                    }
                    
                    // Déterminer le statut basé sur les données de la base
                    let status = 'available';
                    if (!vehicule.disponible) {
                        status = 'maintenance';
                    } else if (vehicule.statut && vehicule.statut.toLowerCase().includes('réservé')) {
                        status = 'reserved';
                    }
                    
                    return {
                        id: vehicule.id,
                        name: vehicule.nom,
                        type: type,
                        immatriculation: vehicule.immatriculation,
                        dateImmatriculation: vehicule.dateImmatriculation,
                        status: status,
                        controle: vehicule.controle,
                        prochainControle: vehicule.prochainControle,
                        finValidite: vehicule.finValidite,
                        numeroCarte: vehicule.numeroCarte,
                        notes: vehicule.notes,
                        // Ces champs seront remplis par les réservations actives
                        reservedBy: null,
                        reservedByUserId: null,
                        reservationDate: null,
                        reservationTime: null
                    };
                });
                
                // Charger les informations de réservation pour chaque véhicule
                await loadVehicleReservations();
                
                // Afficher les véhicules
                displayVehicles();
                
                console.log(`${vehicles.length} véhicules chargés depuis l'API`);
            }
        } else {
            console.error('Erreur lors du chargement des véhicules:', response.status);
            // En cas d'erreur, utiliser des données par défaut ou afficher un message d'erreur
            showMessage('Erreur lors du chargement des véhicules', 'error');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des véhicules:', error);
        showMessage('Erreur de connexion lors du chargement des véhicules', 'error');
    }
}

// Fonction pour charger les informations de réservation des véhicules
async function loadVehicleReservations() {
    try {
        const response = await fetch('/api/reservations/active', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.reservations) {
                // Mettre à jour les véhicules avec les informations de réservation
                data.reservations.forEach(reservation => {
                    const vehicle = vehicles.find(v => v.id === reservation.vehicule_id);
                    if (vehicle) {
                        vehicle.status = 'reserved';
                        vehicle.reservedBy = reservation.user_name || reservation.nom_utilisateur;
                        vehicle.reservedByUserId = reservation.user_id;
                        vehicle.reservationDate = reservation.date_reservation;
                        vehicle.reservationTime = `${reservation.heure_debut}-${reservation.heure_fin}`;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des réservations actives:', error);
        // Ne pas bloquer l'affichage des véhicules si les réservations ne se chargent pas
    }
}

// Fonction pour charger les réservations de l'utilisateur connecté
async function loadUserReservations(userId) {
    try {
        const response = await fetch(`/api/user/${userId}/reservations`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.reservations) {
                // Transformer les données API vers le format attendu
                userReservations = data.reservations.map(reservation => ({
                    id: reservation.id,
                    vehicleId: reservation.vehicule_id,
                    userId: reservation.user_id,
                    date: reservation.date_reservation,
                    startTime: reservation.heure_debut,
                    endTime: reservation.heure_fin,
                    destination: reservation.destination,
                    purpose: reservation.motif,
                    notes: reservation.notes,
                    status: reservation.statut || 'confirmed',
                    createdAt: reservation.created_at
                }));
                displayUserReservations();
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des réservations utilisateur:', error);
        // Garder un tableau vide si erreur
        userReservations = [];
    }
}

// ========================================
// VARIABLES GLOBALES MODIFIÉES
// ========================================


// Les véhicules seront maintenant chargés dynamiquement depuis l'API
let vehicles = [];

// Réservations de l'utilisateur connecté - sera remplacé par les données de l'API
let userReservations = [];

// ========================================
// FONCTIONS UTILITAIRES (inchangées)
// ========================================

function getStatusText(status) {
    switch(status) {
        case 'available': return 'Disponible';
        case 'reserved': return 'Réservé';
        case 'maintenance': return 'Maintenance';
        default: return status;
    }
}

function getPurposeText(purpose) {
    switch(purpose) {
        case 'mission': return 'Mission professionnelle';
        case 'formation': return 'Formation';
        case 'reunion': return 'Réunion externe';
        case 'transport': return 'Transport de matériel';
        case 'autre': return 'Autre';
        default: return purpose;
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function showMessage(message, type) {
    let messageContainer = document.getElementById('global-message');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'global-message';
        messageContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 3000;
            max-width: 400px;
        `;
        document.body.appendChild(messageContainer);
    }
    
    messageContainer.innerHTML = `<div class="${type}" style="margin-bottom: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">${message}</div>`;
    
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 4000);
}

function showModalMessage(message, type) {
    const messageDiv = document.getElementById('modal-message');
    messageDiv.innerHTML = `<div class="${type}">${message}</div>`;
}

function showEditModalMessage(message, type) {
    const messageDiv = document.getElementById('edit-modal-message');
    messageDiv.innerHTML = `<div class="${type}">${message}</div>`;
}

// ========================================
// GESTION DES ONGLETS ET AFFICHAGE
// ========================================

// Gestion des onglets
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetTab = tab.getAttribute('data-tab');
            document.getElementById(targetTab + '-tab').classList.add('active');

            if (targetTab === 'reservations') {
                displayUserReservations();
            } else if (targetTab === 'vehicles') {
                // Recharger les véhicules quand on revient sur l'onglet
                loadVehicles();
            }
        });
    });
}

// Affichage des véhicules avec gestion d'un état de chargement
function displayVehicles() {
    const container = document.getElementById('vehicles-grid');
    
    if (!vehicles || vehicles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🚗</div>
                <h3>Aucun véhicule disponible</h3>
                <p>Chargement en cours ou aucun véhicule dans la base de données.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = vehicles.map(vehicle => {
        const statusClass = `status-${vehicle.status}`;
        const statusText = getStatusText(vehicle.status);
        
        let actionButton = '';
        if (vehicle.status === 'available') {
            actionButton = `<button class="btn btn-success" onclick="openReservationModal(${vehicle.id})">📝 Réserver</button>`;
        } else if (vehicle.status === 'reserved') {
            actionButton = `<button class="btn" disabled>Indisponible</button>`;
        } else {
            actionButton = `<button class="btn" disabled>Maintenance</button>`;
        }

        return `
            <div class="vehicle-card ${vehicle.status}">
                <div class="vehicle-header">
                    <div class="vehicle-name">${vehicle.type} ${vehicle.name}</div>
                    <div class="status-badge ${statusClass}">${statusText}</div>
                </div>
                <div class="vehicle-info">
                    <div><strong>🔢 Immatriculation:</strong> ${vehicle.immatriculation}</div>
                    <div><strong>📅 Mise en service:</strong> ${vehicle.dateImmatriculation}</div>
                    ${vehicle.controle ? `<div><strong>🔧 Dernier contrôle:</strong> ${vehicle.controle}</div>` : ''}
                    ${vehicle.prochainControle ? `<div><strong>🔧 Prochain contrôle:</strong> ${vehicle.prochainControle}</div>` : ''}
                    ${vehicle.reservedBy ? `<div style="margin-top: 10px; color: #856404;"><strong>👤 Réservé par:</strong> ${vehicle.reservedBy}</div>` : ''}
                    ${vehicle.notes ? `<div style="margin-top: 8px; font-size: 0.9em; color: #666;"><strong>📝 Notes:</strong> ${vehicle.notes}</div>` : ''}
                </div>
                ${actionButton}
            </div>
        `;
    }).join('');
}

// Affichage des réservations utilisateur
function displayUserReservations() {
    const container = document.getElementById('reservations-list');
    
    if (userReservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📋</div>
                <h3>Aucune réservation</h3>
                <p>Vous n'avez pas encore de réservations en cours.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = userReservations.map(reservation => {
        const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
        const purposeText = getPurposeText(reservation.purpose);
        
        return `
            <div class="reservation-item">
                <div class="reservation-header">
                    <div class="reservation-main">
                        <div class="reservation-id">🎫 ${reservation.id}</div>
                        <div class="reservation-details">
                            <div><strong>🚗 Véhicule:</strong> ${vehicle?.type} ${vehicle?.name} (${vehicle?.immatriculation})</div>
                            <div><strong>📅 Date:</strong> ${formatDate(reservation.date)}</div>
                            <div><strong>🕐 Horaire:</strong> ${reservation.startTime} - ${reservation.endTime}</div>
                            <div><strong>📍 Destination:</strong> ${reservation.destination || 'Non spécifiée'}</div>
                            <div><strong>💼 Motif:</strong> ${purposeText}</div>
                            ${reservation.notes ? `<div><strong>📝 Notes:</strong> ${reservation.notes}</div>` : ''}
                        </div>
                    </div>
                    <div class="reservation-actions">
                        <button class="btn btn-warning" onclick="editReservation('${reservation.id}')" style="width: auto; padding: 8px 12px;">✏️</button>
                        <button class="btn btn-danger" onclick="cancelReservation('${reservation.id}')" style="width: auto; padding: 8px 12px;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// GESTION DES RÉSERVATIONS (reste identique)
// ========================================

// Ouvrir modal de réservation
function openReservationModal(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.status !== 'available') return;

    document.getElementById('vehicle-id').value = vehicleId;
    document.getElementById('vehicle-display').value = `${vehicle.type} ${vehicle.name} - ${vehicle.immatriculation}`;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reservation-date').min = today;
    
    document.getElementById('reservation-modal').classList.add('show');
}

// Fermer modals
function closeModal() {
    document.getElementById('reservation-modal').classList.remove('show');
    document.getElementById('reservation-form').reset();
    document.getElementById('modal-message').innerHTML = '';
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('show');
    document.getElementById('edit-form').reset();
    document.getElementById('edit-modal-message').innerHTML = '';
}

// Confirmer une réservation
function submitReservation(event) {
    event.preventDefault();
    
    const vehicleId = parseInt(document.getElementById('vehicle-id').value);
    const date = document.getElementById('reservation-date').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const destination = document.getElementById('destination').value;
    const purpose = document.getElementById('purpose').value;
    const notes = document.getElementById('notes').value;
    
    if (!date || !startTime || !endTime || !purpose) {
        showModalMessage('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    if (startTime >= endTime) {
        showModalMessage('L\'heure de fin doit être postérieure à l\'heure de début', 'error');
        return;
    }
    
    // Vérifier que currentUser est bien défini
    if (!currentUser || !currentUser.name) {
        showModalMessage('Erreur: utilisateur non identifié', 'error');
        return;
    }
    
    const reservationId = `RES-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    const newReservation = {
        id: reservationId,
        vehicleId: vehicleId,
        userId: currentUser.id,
        date: date,
        startTime: startTime,
        endTime: endTime,
        destination: destination || 'Non spécifiée',
        purpose: purpose,
        notes: notes,
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };
    
    userReservations.unshift(newReservation);
    
    // IMPORTANT: Utiliser le nom réel de l'utilisateur connecté
    vehicle.status = 'reserved';
    vehicle.reservedBy = currentUser.name; // Nom complet de l'utilisateur
    vehicle.reservedByUserId = currentUser.id; // ID pour référence
    vehicle.reservationDate = formatDate(date);
    vehicle.reservationTime = `${startTime}-${endTime}`;
    
    showModalMessage(`
        <strong>✅ Réservation confirmée!</strong><br>
        <strong>ID:</strong> ${reservationId}<br>
        <strong>Véhicule:</strong> ${vehicle.type} ${vehicle.name}<br>
        <strong>Date:</strong> ${formatDate(date)}<br>
        <strong>Horaire:</strong> ${startTime} - ${endTime}<br>
        <strong>Réservé par:</strong> ${currentUser.name}
    `, 'confirmation');
    
    displayVehicles();
    
    setTimeout(() => {
        closeModal();
    }, 3000);
}

// Modifier une réservation
function editReservation(reservationId) {
    const reservation = userReservations.find(r => r.id === reservationId);
    if (!reservation) return;
    
    const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
    
    document.getElementById('edit-reservation-id').value = reservationId;
    document.getElementById('edit-vehicle-display').value = `${vehicle.type} ${vehicle.name} - ${vehicle.immatriculation}`;
    document.getElementById('edit-date').value = reservation.date;
    document.getElementById('edit-start-time').value = reservation.startTime;
    document.getElementById('edit-end-time').value = reservation.endTime;
    document.getElementById('edit-destination').value = reservation.destination;
    document.getElementById('edit-purpose').value = reservation.purpose;
    document.getElementById('edit-notes').value = reservation.notes;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('edit-date').min = today;
    
    document.getElementById('edit-modal').classList.add('show');
}

// Sauvegarder modification
function submitEditReservation(event) {
    event.preventDefault();
    
    const reservationId = document.getElementById('edit-reservation-id').value;
    const date = document.getElementById('edit-date').value;
    const startTime = document.getElementById('edit-start-time').value;
    const endTime = document.getElementById('edit-end-time').value;
    const destination = document.getElementById('edit-destination').value;
    const purpose = document.getElementById('edit-purpose').value;
    const notes = document.getElementById('edit-notes').value;
    
    if (!date || !startTime || !endTime || !purpose) {
        showEditModalMessage('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    if (startTime >= endTime) {
        showEditModalMessage('L\'heure de fin doit être postérieure à l\'heure de début', 'error');
        return;
    }
    
    const reservationIndex = userReservations.findIndex(r => r.id === reservationId);
    if (reservationIndex !== -1) {
        userReservations[reservationIndex] = {
            ...userReservations[reservationIndex],
            date: date,
            startTime: startTime,
            endTime: endTime,
            destination: destination || 'Non spécifiée',
            purpose: purpose,
            notes: notes
        };
        
        const vehicle = vehicles.find(v => v.id === userReservations[reservationIndex].vehicleId);
        if (vehicle && vehicle.status === 'reserved') {
            vehicle.reservationDate = formatDate(date);
            vehicle.reservationTime = `${startTime}-${endTime}`;
        }
        
        showEditModalMessage('✅ Réservation modifiée avec succès!', 'confirmation');
        
        displayVehicles();
        displayUserReservations();
        
        setTimeout(() => {
            closeEditModal();
        }, 2000);
    }
}

// Annuler une réservation
function cancelReservation(reservationId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation?')) return;
    
    const reservationIndex = userReservations.findIndex(r => r.id === reservationId);
    if (reservationIndex === -1) return;
    
    const reservation = userReservations[reservationIndex];
    const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
    
    userReservations.splice(reservationIndex, 1);
    
    if (vehicle) {
        vehicle.status = 'available';
        delete vehicle.reservedBy;
        delete vehicle.reservationDate;
        delete vehicle.reservationTime;
    }
    
    displayVehicles();
    displayUserReservations();
    
    showMessage('✅ Réservation annulée avec succès', 'confirmation');
}

// Export des réservations (reste identique)
function exportReservations(format) {
    if (userReservations.length === 0) {
        showMessage('Aucune réservation à exporter', 'error');
        return;
    }

    const data = userReservations.map(reservation => {
        const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
        return {
            'ID Réservation': reservation.id,
            'Véhicule': `${vehicle?.type} ${vehicle?.name}`,
            'Immatriculation': vehicle?.immatriculation,
            'Date': formatDate(reservation.date),
            'Heure début': reservation.startTime,
            'Heure fin': reservation.endTime,
            'Destination': reservation.destination,
            'Motif': getPurposeText(reservation.purpose),
            'Notes': reservation.notes || '',
            'Statut': 'Confirmée',
            'Créé le': new Date(reservation.createdAt).toLocaleDateString('fr-FR')
        };
    });

    switch (format) {
        case 'csv':
            exportToCSV(data, 'mes_reservations.csv');
            break;
        case 'json':
            exportToJSON(data, 'mes_reservations.json');
            break;
        case 'pdf':
            exportToPDF(data);
            break;
    }
}

// Export CSV
function exportToCSV(data, filename) {
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(';'),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(';'))
    ].join('\n');
    
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    showMessage('✅ Export CSV téléchargé avec succès', 'confirmation');
}

// Export JSON
function exportToJSON(data, filename) {
    const jsonContent = JSON.stringify({
        exportDate: new Date().toISOString(),
        user: currentUser.name,
        reservations: data
    }, null, 2);
    downloadFile(jsonContent, filename, 'application/json');
    showMessage('✅ Export JSON téléchargé avec succès', 'confirmation');
}

// Export PDF (simulation textuelle)
function exportToPDF(data) {
    const content = `RAPPORT DE RÉSERVATIONS - ${currentUser.name}
Date d'export: ${new Date().toLocaleDateString('fr-FR')}
Département: ${currentUser.department}

==================================================

${data.map((item, index) => `
${index + 1}. RÉSERVATION ${item['ID Réservation']}
   Véhicule: ${item['Véhicule']} (${item['Immatriculation']})
   Date: ${item['Date']} 
   Horaires: ${item['Heure début']} - ${item['Heure fin']}
   Destination: ${item['Destination']}
   Motif: ${item['Motif']}
   ${item['Notes'] ? 'Notes: ' + item['Notes'] : ''}
   Créé le: ${item['Créé le']}
   --------------------------------------------------
`).join('')}

RÉSUMÉ:
Nombre total de réservations: ${data.length}
Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    
    downloadFile(content, 'mes_reservations.txt', 'text/plain');
    showMessage('✅ Export PDF (format texte) téléchargé avec succès', 'confirmation');
}

// Fonction utilitaire de téléchargement
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Fermeture modal au clic extérieur
window.addEventListener('click', function(event) {
    const reservationModal = document.getElementById('reservation-modal');
    const editModal = document.getElementById('edit-modal');
    
    if (event.target === reservationModal) {
        closeModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
});

// ========================================
// INITIALISATION MODIFIÉE
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // 1. Charger les données utilisateur depuis l'API
    fetchCurrentUser().then(() => {
        // 2. Une fois l'utilisateur chargé, initialiser le reste
        initTabs();
        
        // 3. Charger les véhicules depuis l'API
        loadVehicles();
        
        // 4. Configurer les événements
        document.getElementById('reservation-form').addEventListener('submit', submitReservation);
        document.getElementById('edit-form').addEventListener('submit', submitEditReservation);
        
        console.log('Application initialisée avec des données dynamiques');
    }).catch(error => {
        console.error('Erreur lors de l\'initialisation:', error);
        // En cas d'erreur, initialiser quand même l'interface avec des données par défaut
        initTabs();
        displayVehicles(); // Affichera le message "aucun véhicule"
        
        // Configurer les événements même en cas d'erreur
        if (document.getElementById('reservation-form')) {
            document.getElementById('reservation-form').addEventListener('submit', submitReservation);
        }
        if (document.getElementById('edit-form')) {
            document.getElementById('edit-form').addEventListener('submit', submitEditReservation);
        }
    });
});

fetch('/api/reservations', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        vehicule_id: selectedVehiculeId,
        date_debut: dateDebutValue,
        date_fin: dateFinValue,
        notes: notesValue
    })
})
.then(response => response.json())
.then(data => {
    console.log("Réponse API :", data);
})
.catch(error => console.error("Erreur fetch :", error));




// pré-remplir ce champ avec le nom de l’utilisateur connecté
function openReservationModal(vehicleId){
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if(!vehicle || vehicle.status !== 'available') return;

    // Pré-remplir véhicule
    document.getElementById('vehicle-id').value = vehicleId;
    document.getElementById('vehicle-display').value = `${vehicle.type} ${vehicle.name} - ${vehicle.immatriculation}`;

    // Pré-remplir conducteur
    if(window.currentUser && window.currentUser.name){
        document.getElementById('driver-name').value = window.currentUser.name;
    }

    // Date minimale et valeur par défaut = aujourd'hui
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    document.getElementById('reservation-date').min = dateStr;
    document.getElementById('reservation-date').value = dateStr;

    // Heure par défaut = maintenant
    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${min}`;
    document.getElementById('start-time').value = timeStr;

    // Heure de fin par défaut = +1h
    const endHour = String((today.getHours() + 1) % 24).padStart(2, '0');
    document.getElementById('end-time').value = `${endHour}:${min}`;

    document.getElementById('reservation-modal').classList.add('show');
}
