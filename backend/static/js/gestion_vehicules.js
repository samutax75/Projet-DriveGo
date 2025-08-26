// === CODE CORRIGÉ POUR LA PAGE VÉHICULES ===
// Remplacez ENTIÈREMENT votre code JavaScript existant par celui-ci

let dataManager = null;
let currentUser = null;
let vehicles = [];
let reservations = [];
let missions = [];
let activeMissions = [];
let selectedVehicle = null;

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DriveGo Véhicules - Initialisation...');
    
    try {
        // Initialiser le système unifié
        dataManager = await initDriveGoSystem();
        
        // Écouter les changements de données
        dataManager.addListener((event, data) => {
            if (event === 'dataChanged') {
                // Mettre à jour toutes les données locales
                currentUser = data.currentUser;
                vehicles = data.vehicles;
                reservations = data.reservations;
                missions = data.missions;
                activeMissions = data.activeMissions;
                
                // Rafraîchir l'affichage
                generateVehicleList();
                updateMissionsList();
                updateUserInfo();
                
                console.log('Données véhicules mises à jour:', vehicles.length, 'véhicules');
            }
        });
        
        // Récupérer les données initiales
        currentUser = dataManager.getCurrentUser();
        vehicles = dataManager.getVehicles();
        reservations = dataManager.getReservations();
        missions = dataManager.getMissions();
        activeMissions = dataManager.getActiveMissions();
        
        // Initialiser l'affichage
        generateVehicleList();
        updateMissionsList();
        updateUserInfo();
        
        const noSelection = document.getElementById('noSelection');
        if (noSelection) noSelection.style.display = 'block';

        const details = document.getElementById('vehicleDetails');
        if (details) details.style.display = 'none';

        console.log('DriveGo Véhicules initialisé');
        console.log('Utilisateur connecté:', currentUser?.nom || 'Non connecté');
        console.log('Missions actives utilisateur:', hasActiveUserMission() ? 'Oui' : 'Non');
        
    } catch (error) {
        console.error('Erreur initialisation véhicules:', error);
        showNotification('Erreur de connexion - Mode dégradé', 'error');
    }
});

// === FONCTIONS UTILITAIRES ===
function hasActiveUserMission() {
    if (!currentUser) return false;
    return activeMissions.some(mission => 
        mission.userId === currentUser.id || mission.user_id === currentUser.id
    );
}

function getUserActiveMission() {
    if (!currentUser) return null;
    return activeMissions.find(mission => 
        mission.userId === currentUser.id || mission.user_id === currentUser.id
    );
}

function canUserAccessVehicle(vehicle) {
    if (!currentUser) return { canAccess: false, reason: 'no-user' };

    // 1. Utilisateur a une mission active sur ce véhicule
    const userActiveMission = activeMissions.find(m => 
        (m.userId === currentUser.id || m.user_id === currentUser.id) && 
        (m.vehicleId === vehicle.id || m.vehicule_id === vehicle.id)
    );
    if (userActiveMission) return { canAccess: true, reason: 'my-mission' };

    // 2. Utilisateur a une réservation sur ce véhicule
    const userReservation = reservations.find(r => 
        ((r.userId === currentUser.id) || 
         (r.user_prenom === currentUser.prenom && r.user_nom === currentUser.nom)) && 
        (r.vehicleId === vehicle.id || r.vehicule_id === vehicle.id) && 
        (r.status === 'active' || r.statut === 'en_attente' || r.statut === 'confirmee')
    );
    if (userReservation) return { canAccess: true, reason: 'my-reservation' };

    // 3. Véhicule libre ET utilisateur sans mission active
    const vehicleOccupied = activeMissions.some(m => 
        m.vehicleId === vehicle.id || m.vehicule_id === vehicle.id
    ) || reservations.some(r => 
        (r.vehicleId === vehicle.id || r.vehicule_id === vehicle.id) && 
        (r.status === 'active' || r.statut === 'en_attente' || r.statut === 'confirmee')
    );
    
    if (!vehicleOccupied && !hasActiveUserMission()) {
        return { canAccess: true, reason: 'available' };
    }

    return { canAccess: false, reason: 'occupied' };
}

function getVehicleStatus(vehicle) {
    const access = canUserAccessVehicle(vehicle);
    
    if (access.reason === 'my-mission') {
        return {
            status: 'my-mission',
            text: 'Ma mission',
            user: currentUser.nom,
            canSelect: true
        };
    }
    
    if (access.reason === 'my-reservation') {
        return {
            status: 'my-reservation',
            text: 'Ma réservation',
            user: currentUser.nom,
            canSelect: true
        };
    }
    
    if (access.reason === 'available') {
        return {
            status: 'available',
            text: 'Disponible',
            user: null,
            canSelect: true
        };
    }
    
    // Véhicule occupé par quelqu'un d'autre
    const otherMission = activeMissions.find(m => 
        m.vehicleId === vehicle.id || m.vehicule_id === vehicle.id
    );
    const otherReservation = reservations.find(r => 
        (r.vehicleId === vehicle.id || r.vehicule_id === vehicle.id) && 
        (r.status === 'active' || r.statut === 'en_attente' || r.statut === 'confirmee')
    );
    
    if (otherMission) {
        return {
            status: 'occupied',
            text: 'En mission',
            user: otherMission.nom || otherMission.user_nom || 'Utilisateur inconnu',
            canSelect: false
        };
    }
    
    if (otherReservation) {
        return {
            status: 'occupied',
            text: 'Réservé',
            user: otherReservation.userName || 
                  (otherReservation.user_prenom && otherReservation.user_nom ? 
                   `${otherReservation.user_prenom} ${otherReservation.user_nom}` : 
                   otherReservation.conducteur) || 'Utilisateur inconnu',
            canSelect: false
        };
    }
    
    return {
        status: 'occupied',
        text: 'Indisponible',
        user: null,
        canSelect: false
    };
}

// === AFFICHAGE ===
function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        const nomComplet = currentUser.prenom && currentUser.nom ? 
            `${currentUser.prenom} ${currentUser.nom}` : 
            currentUser.nom || 'Utilisateur';
        userInfo.textContent = nomComplet;
    }
}

function generateVehicleList() {
    const vehicleList = document.getElementById('vehicleList');
    if (!vehicleList) return;
    
    vehicleList.innerHTML = '';

    if (!vehicles || vehicles.length === 0) {
        vehicleList.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280;">Aucun véhicule disponible</div>';
        return;
    }

    vehicles.forEach(vehicle => {
        const vehicleStatus = getVehicleStatus(vehicle);
        
        const vehicleItem = document.createElement('div');
        let vehicleClass = `vehicle-item ${vehicleStatus.status}`;
        
        if (!vehicleStatus.canSelect) {
            vehicleClass += ' disabled';
        }

        vehicleItem.className = vehicleClass;
        
        if (vehicleStatus.canSelect) {
            vehicleItem.onclick = () => selectVehicle(vehicle);
        }

        let userInfo = '';
        if (vehicleStatus.user && vehicleStatus.status !== 'available') {
            const isCurrentUser = vehicleStatus.user === currentUser?.nom;
            userInfo = `<div class="user-badge">
                ${isCurrentUser ? 'Vous' : vehicleStatus.user}
            </div>`;
        }

        vehicleItem.innerHTML = `
            <div class="vehicle-header">
                <div>
                    <div class="vehicle-name">${vehicle.name}</div>
                    <div class="vehicle-plate">${vehicle.immatriculation}</div>
                    ${userInfo}
                </div>
                <div class="status ${vehicleStatus.status}">
                    ${vehicleStatus.text}
                </div>
            </div>
        `;

        vehicleList.appendChild(vehicleItem);
    });
}

// === SÉLECTION VÉHICULE ===
function selectVehicle(vehicle) {
    const access = canUserAccessVehicle(vehicle);
    if (!access.canAccess) {
        showNotification('Vous ne pouvez pas accéder à ce véhicule', 'error');
        return;
    }

    selectedVehicle = vehicle;

    const vehicleItems = document.querySelectorAll('.vehicle-item:not(.disabled)');
    vehicleItems.forEach(item => item.classList.remove('selected'));

    const currentIndex = vehicles.findIndex(v => v.id === vehicle.id);
    const currentItem = document.querySelectorAll('.vehicle-item')[currentIndex];
    if (currentItem && !currentItem.classList.contains('disabled')) {
        currentItem.classList.add('selected');
    }

    if (window.innerWidth <= 1200) {
        openMobileModal(vehicle);
    } else {
        showVehicleDetails(vehicle);
    }
}

// === GESTION DES DÉTAILS VÉHICULE ===
function showVehicleDetails(vehicle) {
    const noSelection = document.getElementById('noSelection');
    const vehicleDetails = document.getElementById('vehicleDetails');
    
    if (noSelection) noSelection.style.display = 'none';
    if (vehicleDetails) {
        vehicleDetails.style.display = 'block';
        vehicleDetails.innerHTML = generateVehicleDetailsHTML(vehicle);
    }
}

function generateVehicleDetailsHTML(vehicle) {
    const access = canUserAccessVehicle(vehicle);
    
    if (!access.canAccess) {
        return `
            <div class="access-denied">
                <h4>Accès non autorisé</h4>
                <p>Ce véhicule est utilisé par un autre utilisateur ou vous avez déjà une mission active.</p>
            </div>
        `;
    }

    const userActiveMission = activeMissions.find(m => 
        (m.userId === currentUser?.id || m.user_id === currentUser?.id) && 
        (m.vehicleId === vehicle.id || m.vehicule_id === vehicle.id)
    );
    
    const userReservation = reservations.find(r => 
        ((r.userId === currentUser?.id) || 
         (r.user_prenom === currentUser?.prenom && r.user_nom === currentUser?.nom)) && 
        (r.vehicleId === vehicle.id || r.vehicule_id === vehicle.id) && 
        (r.status === 'active' || r.statut === 'en_attente' || r.statut === 'confirmee')
    );

    let contentHTML = `
        <div class="vehicle-header-detail">
            <h3>${vehicle.name}</h3>
            <p>${vehicle.immatriculation}</p>
        </div>
    `;

    if (userActiveMission) {
        // Mission active
        contentHTML += `
            <div class="mission-active">
                <h4>Mission en cours</h4>
                <div class="mission-info">
                    <div class="mission-info-item">
                        <div class="mission-info-label">Conducteur</div>
                        <div class="mission-info-value">${userActiveMission.nom}</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Date</div>
                        <div class="mission-info-value">${new Date(userActiveMission.missionDate).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Destination</div>
                        <div class="mission-info-value">${userActiveMission.destination}</div>
                    </div>
                </div>
                
                <div class="mission-control">
                    <h4>Terminer la mission</h4>
                    <form onsubmit="endMissionWithDetails(event, ${vehicle.id})">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="arrivalTime">Heure d'arrivée</label>
                                <input type="time" id="arrivalTime" name="arrivalTime" 
                                       value="${new Date().toTimeString().slice(0, 5)}" required>
                            </div>
                            <div class="form-group">
                                <label for="kmArrivee">Kilométrage d'arrivée</label>
                                <input type="number" id="kmArrivee" name="kmArrivee" 
                                       placeholder="45280" min="${userActiveMission.kmDepart}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="notes">Notes (optionnel)</label>
                            <textarea id="notes" name="notes" rows="3"></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-danger">Terminer la mission</button>
                    </form>
                </div>
            </div>
        `;
    } else if (userReservation) {
        // Réservation active
        contentHTML += `
            <div class="reservation-active">
                <h4>Ma réservation</h4>
                <div class="reservation-info">
                    <div class="reservation-info-item">
                        <div class="mission-info-label">Date</div>
                        <div class="mission-info-value">${new Date(userReservation.date_debut || userReservation.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div class="reservation-info-item">
                        <div class="mission-info-label">Horaire</div>
                        <div class="mission-info-value">${userReservation.horaire || userReservation.timeSlot}</div>
                    </div>
                </div>
                
                <div class="reservation-actions">
                    <button onclick="cancelMyReservation(${vehicle.id})" class="btn btn-warning">
                        Annuler ma réservation
                    </button>
                    <button onclick="startMissionFromReservation(${vehicle.id})" class="btn btn-success">
                        Commencer la mission
                    </button>
                </div>
            </div>
        `;
    } else {
        // Nouvelle mission
        const nomComplet = currentUser ? 
            `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() : '';
            
        contentHTML += `
            <div class="mission-control">
                <h4>Nouvelle Mission</h4>
                <form onsubmit="startMission(event, ${vehicle.id})">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="nom">Nom du conducteur</label>
                            <input type="text" id="nom" name="nom" value="${nomComplet}" readonly 
                                   style="background-color: #f3f4f6; opacity: 0.8;">
                        </div>
                        
                        <div class="form-group">
                            <label for="missionDate">Date de mission</label>
                            <input type="date" id="missionDate" name="missionDate" 
                                   value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="departureTime">Heure de départ</label>
                            <input type="time" id="departureTime" name="departureTime" 
                                   value="${new Date().toTimeString().slice(0, 5)}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="passengers">Nombre de passagers</label>
                            <input type="number" id="passengers" name="passengers" 
                                   placeholder="2" min="0" max="8" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="missionNature">Nature de la mission</label>
                        <select id="missionNature" name="missionNature" required onchange="checkAutre(this)">
                            <option value="">Sélectionner le type de mission</option>
                            <option value="transport-personnel">Transport de personnel</option>
                            <option value="livraison">Livraison</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="urgence">Mission d'urgence</option>
                            <option value="formation">Formation/Conduite</option>
                            <option value="autre">Autre</option>
                        </select>
                    </div>
                    
                    <div class="form-group hidden" id="autreGroup">
                        <label for="autreText">Précisez la mission</label>
                        <input type="text" id="autreText" name="autreText" placeholder="Décrivez la mission">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="destination">Destination</label>
                            <input type="text" id="destination" name="destination" 
                                   placeholder="Ex: Centre-ville, Aéroport..." required>
                        </div>
                        
                        <div class="form-group">
                            <label for="kmDepart">Kilométrage de départ</label>
                            <input type="number" id="kmDepart" name="kmDepart" 
                                   placeholder="Ex: 45230" min="0" required>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Démarrer la mission</button>
                </form>
            </div>
        `;
    }

    return contentHTML;
}

// === GESTION DES MISSIONS ===
async function startMission(event, vehicleId) {
    event.preventDefault();

    if (hasActiveUserMission()) {
        showNotification('Vous avez déjà une mission active', 'error');
        return;
    }

    const formData = new FormData(event.target);
    let missionNature = formData.get('missionNature');
    const autreText = formData.get('autreText');

    if (missionNature === 'autre' && autreText) {
        missionNature = autreText;
    }

    const missionData = {
        vehicleId: vehicleId,
        missionDate: formData.get('missionDate'),
        departureTime: formData.get('departureTime'),
        missionNature: missionNature,
        destination: formData.get('destination'),
        passengers: parseInt(formData.get('passengers')),
        kmDepart: parseInt(formData.get('kmDepart'))
    };

    try {
        // Utiliser le gestionnaire unifié (qui n'existe pas encore dans le contexte missions)
        // Pour l'instant, simuler la création
        console.log('Création mission:', missionData);
        
        // Ajouter à la liste locale temporairement
        const newMission = {
            id: Date.now(),
            ...missionData,
            userId: currentUser.id,
            nom: `${currentUser.prenom} ${currentUser.nom}`,
            status: 'active'
        };
        
        activeMissions.push(newMission);
        
        // Rafraîchir l'affichage
        generateVehicleList();
        if (selectedVehicle && selectedVehicle.id === vehicleId) {
            showVehicleDetails(selectedVehicle);
        }
        
        showNotification('Mission démarrée avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur mission:', error);
        showNotification('Erreur lors du démarrage de la mission', 'error');
    }
}

async function endMissionWithDetails(event, vehicleId) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const endData = {
        arrivalTime: formData.get('arrivalTime'),
        kmArrivee: parseInt(formData.get('kmArrivee')),
        notes: formData.get('notes') || ''
    };

    const missionIndex = activeMissions.findIndex(m => 
        (m.userId === currentUser?.id || m.user_id === currentUser?.id) && 
        (m.vehicleId === vehicleId || m.vehicule_id === vehicleId)
    );
    
    if (missionIndex === -1) {
        showNotification('Mission non trouvée', 'error');
        return;
    }

    try {
        const mission = activeMissions[missionIndex];
        const distanceParcourue = endData.kmArrivee - mission.kmDepart;
        
        // Terminer la mission localement
        mission.status = 'completed';
        mission.endTime = new Date().toISOString();
        mission.arrivalTime = endData.arrivalTime;
        mission.kmArrivee = endData.kmArrivee;
        mission.notes = endData.notes;
        mission.distanceParcourue = distanceParcourue;
        
        // Déplacer vers l'historique
        missions.push(mission);
        activeMissions.splice(missionIndex, 1);
        
        // Rafraîchir l'affichage
        generateVehicleList();
        updateMissionsList();
        
        if (selectedVehicle && selectedVehicle.id === vehicleId) {
            showVehicleDetails(selectedVehicle);
        }
        
        showNotification(`Mission terminée ! Distance: ${distanceParcourue} km`, 'success');
        
    } catch (error) {
        console.error('Erreur fin mission:', error);
        showNotification('Erreur lors de la fin de mission', 'error');
    }
}

// === AUTRES FONCTIONS ===
function checkAutre(selectElement) {
    const autreGroup = document.getElementById("autreGroup");
    const autreText = document.getElementById("autreText");
    
    if (autreGroup && autreText) {
        if (selectElement.value === "autre") {
            autreGroup.classList.remove('hidden');
            autreText.required = true;
            autreText.focus();
        } else {
            autreGroup.classList.add('hidden');
            autreText.required = false;
            autreText.value = "";
        }
    }
}

async function cancelMyReservation(vehicleId) {
    const reservation = reservations.find(r => 
        ((r.userId === currentUser?.id) || 
         (r.user_prenom === currentUser?.prenom && r.user_nom === currentUser?.nom)) && 
        (r.vehicleId === vehicleId || r.vehicule_id === vehicleId) && 
        (r.status === 'active' || r.statut === 'en_attente' || r.statut === 'confirmee')
    );
    
    if (reservation) {
        if (confirm('Êtes-vous sûr de vouloir annuler votre réservation ?')) {
            try {
                const reservationId = `RES-${reservation.id}`;
                const success = await dataManager.cancelReservation(reservationId);

                if (success) {
                    showNotification('Réservation annulée avec succès', 'success');
                } else {
                    showNotification('Erreur lors de l\'annulation', 'error');
                }
            } catch (error) {
                console.error('Erreur annulation réservation:', error);
                showNotification('Erreur de connexion', 'error');
            }
        }
    }
}

function updateMissionsList() {
    const missionsList = document.getElementById('missionsList');
    if (!missionsList) return;
    
    const userMissions = missions.filter(m => 
        m.userId === currentUser?.id || m.user_id === currentUser?.id
    );

    if (userMissions.length === 0) {
        missionsList.innerHTML = '<p style="text-align: center; padding: 40px;">Aucune mission enregistrée</p>';
        return;
    }

    missionsList.innerHTML = userMissions.map(mission => `
        <div class="mission-item completed">
            <div class="mission-header">
                <div class="mission-destination">${mission.destination}</div>
                <div class="mission-status completed">Terminée</div>
            </div>
            <div class="mission-details">
                <div>Véhicule: ${mission.vehicleName || 'N/A'}</div>
                <div>Date: ${new Date(mission.missionDate).toLocaleDateString('fr-FR')}</div>
                <div>Distance: ${mission.distanceParcourue || 0} km</div>
            </div>
        </div>
    `).join('');
}

// === MODALES MOBILES ===
function openMobileModal(vehicle) {
    const modal = document.getElementById('mobileModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (modal && modalTitle && modalBody) {
        modalTitle.textContent = vehicle.name;
        modalBody.innerHTML = generateVehicleDetailsHTML(vehicle);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileModal() {
    const modal = document.getElementById('mobileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// === NOTIFICATIONS ===
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function goToHomePage() {
    if (confirm('Êtes-vous sûr de vouloir quitter la gestion des véhicules ?')) {
        window.location.href = "/";
    }
}

// Exposer les fonctions pour les événements HTML
window.selectVehicle = selectVehicle;
window.checkAutre = checkAutre;
window.startMission = startMission;
window.endMissionWithDetails = endMissionWithDetails;
window.cancelMyReservation = cancelMyReservation;
window.openMobileModal = openMobileModal;
window.closeMobileModal = closeMobileModal;
window.goToHomePage = goToHomePage;