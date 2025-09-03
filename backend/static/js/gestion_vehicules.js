// ========================================
// GESTION DYNAMIQUE DES DONNÉES
// ========================================

// Variables globales pour les données dynamiques
let currentUser = null;
let vehicles = [];
let activeMissions = [];
let completedMissions = [];
let selectedVehicle = null;

// ========================================
// CHARGEMENT DES DONNÉES DEPUIS L'API
// ========================================

// Fonction pour récupérer l'utilisateur connecté
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
                currentUser = {
                    id: data.user.id,
                    nom: data.user.nom,
                    email: data.user.email,
                    role: data.user.role
                };
                updateUserInfo();
                return true;
            }
        } else if (response.status === 401 || response.status === 404) {
            handleAuthError();
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        handleAuthError();
    }
    return false;
}

// Fonction pour charger les véhicules
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
                vehicles = data.vehicules.map(vehicule => ({
                    id: vehicule.id,
                    nom: vehicule.nom,
                    immatriculation: vehicule.immatriculation,
                    dateImmatriculation: vehicule.dateImmatriculation,
                    controle: vehicule.controle || '',
                    prochainControle: vehicule.prochainControle || '',
                    finValidite: vehicule.finValidite || '',
                    numeroCarte: vehicule.numeroCarte || '',
                    disponible: vehicule.disponible,
                    statut: vehicule.statut,
                    notes: vehicule.notes || ''
                }));
                return true;
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des véhicules:', error);
    }
    return false;
}

// Fonction pour charger les missions de l'utilisateur
async function loadUserMissions() {
    if (!currentUser) return false;
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/missions`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.missions) {
                // Séparer les missions actives et terminées
                activeMissions = data.missions.filter(m => m.statut === 'active').map(mission => ({
                    id: mission.id,
                    vehicleId: mission.vehicule_id,
                    userId: mission.user_id,
                    vehicleName: getVehicleById(mission.vehicule_id)?.nom || 'Véhicule inconnu',
                    nom: currentUser.nom,
                    conducteur2: mission.conducteur2 || '',
                    missionDate: mission.date_mission,
                    creneau: mission.creneau || 'journee',
                    departureTime: mission.heure_debut,
                    arrivalTime: mission.heure_fin,
                    missionNature: mission.motif,
                    destination: mission.destination,
                    passengers: mission.nb_passagers || 1,
                    kmDepart: mission.km_depart,
                    kmArrivee: mission.km_arrivee,
                    carburantDepart: mission.carburant_depart || '',
                    carburantArrivee: mission.carburant_arrivee || '',
                    pleinEffectue: mission.plein_effectue || false,
                    status: 'active',
                    startTime: new Date(mission.created_at),
                    notes: mission.notes,
                    photos: mission.photos || []
                }));
                
                completedMissions = data.missions.filter(m => m.statut === 'completed').map(mission => ({
                    id: mission.id,
                    vehicleId: mission.vehicule_id,
                    userId: mission.user_id,
                    vehicleName: getVehicleById(mission.vehicule_id)?.nom || 'Véhicule inconnu',
                    nom: currentUser.nom,
                    conducteur2: mission.conducteur2 || '',
                    missionDate: mission.date_mission,
                    creneau: mission.creneau || 'journee',
                    departureTime: mission.heure_debut,
                    arrivalTime: mission.heure_fin,
                    missionNature: mission.motif,
                    destination: mission.destination,
                    passengers: mission.nb_passagers || 1,
                    kmDepart: mission.km_depart,
                    kmArrivee: mission.km_arrivee,
                    carburantDepart: mission.carburant_depart || '',
                    carburantArrivee: mission.carburant_arrivee || '',
                    pleinEffectue: mission.plein_effectue || false,
                    distanceParcourue: mission.km_arrivee - mission.km_depart,
                    status: 'completed',
                    startTime: new Date(mission.created_at),
                    endTime: new Date(mission.updated_at),
                    notes: mission.notes,
                    photos: mission.photos || []
                }));
                return true;
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des missions:', error);
    }
    return false;
}

// Fonction de gestion des erreurs d'authentification
function handleAuthError() {
    setTimeout(() => {
        window.location.href = '/login';
    }, 1500);
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function getVehicleById(vehicleId) {
    return vehicles.find(v => v.id === vehicleId);
}

function hasActiveUserMission() {
    return activeMissions.some(mission => mission.userId === currentUser?.id);
}

function getUserActiveMission() {
    return activeMissions.find(mission => mission.userId === currentUser?.id);
}

function canUserAccessVehicle(vehicle) {
    if (!currentUser) return { canAccess: false, reason: 'not-logged' };
    
    // L'utilisateur peut accéder au véhicule si:
    // 1. Il a une mission active dessus
    const userActiveMission = activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicle.id);
    if (userActiveMission) return { canAccess: true, reason: 'my-mission' };

    // 2. Le véhicule est libre ET l'utilisateur n'a pas d'autre mission active ET le véhicule est disponible
    const vehicleOccupied = activeMissions.some(m => m.vehicleId === vehicle.id);
    
    if (!vehicleOccupied && !hasActiveUserMission() && vehicle.disponible) {
        return { canAccess: true, reason: 'available' };
    }

    // 3. Véhicule en maintenance
    if (!vehicle.disponible) {
        return { canAccess: false, reason: 'maintenance' };
    }

    // 4. Sinon, accès refusé
    return { canAccess: false, reason: 'occupied' };
}

function getVehicleStatus(vehicle) {
    const access = canUserAccessVehicle(vehicle);
    
    if (access.reason === 'my-mission') {
        const mission = activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicle.id);
        const creneauText = getCreneauText(mission.creneau);
        return {
            status: 'my-mission',
            text: `🎯 ${creneauText} - ${currentUser.nom}`,
            user: currentUser.nom,
            canSelect: true
        };
    }
    
    if (access.reason === 'available') {
        return {
            status: 'available',
            text: '✅ Disponible',
            user: null,
            canSelect: true
        };
    }
    
    if (access.reason === 'maintenance') {
        return {
            status: 'maintenance',
            text: '🔧 Maintenance',
            user: null,
            canSelect: false
        };
    }
    
    // Véhicule occupé par quelqu'un d'autre
    const otherMission = activeMissions.find(m => m.vehicleId === vehicle.id);
    
    if (otherMission) {
        const creneauText = getCreneauText(otherMission.creneau);
        return {
            status: 'occupied',
            text: `🚗 ${creneauText} - Autre utilisateur`,
            user: 'Autre utilisateur',
            canSelect: false
        };
    }
    
    return {
        status: 'occupied',
        text: '❌ Indisponible',
        user: null,
        canSelect: false
    };
}

function getCreneauText(creneau) {
    const creneaux = {
        'matinee': 'Matinée',
        'apres-midi': 'Après-midi',
        'journee': 'Journée'
    };
    return creneaux[creneau] || 'Journée';
}

function getCarburantText(niveau) {
    const niveaux = {
        'plein': '🟢 Plein (100%)',
        '3/4': '🟡 3/4 (75%)',
        '1/2': '🟠 1/2 (50%)',
        '1/4': '🔴 1/4 (25%)',
        'reserve': '⚠️ Réserve (<10%)',
        'vide': '💀 Vide'
    };
    
    // Si c'est un pourcentage numérique
    if (!isNaN(niveau) && niveau !== '') {
        const pct = parseInt(niveau);
        if (pct >= 90) return `🟢 Plein (${pct}%)`;
        if (pct >= 65) return `🟡 3/4 (${pct}%)`;
        if (pct >= 35) return `🟠 1/2 (${pct}%)`;
        if (pct >= 15) return `🔴 1/4 (${pct}%)`;
        if (pct > 0) return `⚠️ Réserve (${pct}%)`;
        return `💀 Vide (${pct}%)`;
    }
    
    return niveaux[niveau] || niveau;
}

// ========================================
// FONCTIONS D'AFFICHAGE
// ========================================

// Mise à jour des informations utilisateur
function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        userInfo.textContent = `👤 ${currentUser.nom}`;
    }
}

// Génération de la liste des véhicules
function generateVehicleList() {
    const vehicleList = document.getElementById('vehicleList');
    if (!vehicleList) return;
    
    vehicleList.innerHTML = '';

    if (!vehicles || vehicles.length === 0) {
        vehicleList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <div>🚗</div>
                <h3>Aucun véhicule disponible</h3>
                <p>Chargement en cours...</p>
            </div>
        `;
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
                ${isCurrentUser ? '👤 Vous' : `👤 ${vehicleStatus.user}`}
            </div>`;
        }

        vehicleItem.innerHTML = `
            <div class="vehicle-header">
                <div>
                    <div class="vehicle-name">${vehicle.nom}</div>
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

// ========================================
// GESTION DES API POUR LES ACTIONS
// ========================================

// Fonction pour créer une mission
async function createMission(missionData) {
    try {
        const response = await fetch('/api/missions', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vehicule_id: missionData.vehicleId,
                conducteur2: missionData.conducteur2,
                date_mission: missionData.missionDate,
                creneau: missionData.creneau,
                heure_debut: missionData.departureTime,
                motif: missionData.missionNature,
                destination: missionData.destination,
                nb_passagers: missionData.passengers,
                km_depart: missionData.kmDepart,
                carburant_depart: missionData.carburantDepart,
                notes: missionData.notes || ''
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.success;
        }
    } catch (error) {
        console.error('Erreur lors de la création de la mission:', error);
    }
    return false;
}

// Fonction pour terminer une mission
async function completeMission(missionId, completionData) {
    try {
        const formData = new FormData();
        formData.append('heure_fin', completionData.arrivalTime);
        formData.append('km_arrivee', completionData.kmArrivee);
        formData.append('carburant_arrivee', completionData.carburantArrivee);
        formData.append('plein_effectue', completionData.pleinEffectue);
        formData.append('notes', completionData.notes || '');
        
        // Ajouter les photos
        if (completionData.photos && completionData.photos.length > 0) {
    console.log(`Ajout de ${completionData.photos.length} photo(s)`);
    for (let i = 0; i < completionData.photos.length; i++) {
        const photo = completionData.photos[i];
        if (photo && photo.size > 0) {
            formData.append('photos', photo);  // Sans les backticks
            console.log(`Photo ${i + 1}: ${photo.name} (${photo.size} bytes)`);
        } else {
            console.warn(`Photo ${i + 1} vide ou invalide`);
        }
    }
}

        const response = await fetch(`/api/missions/${missionId}/complete`, {
            method: 'PUT',
            credentials: 'include',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.success;
        }
    } catch (error) {
        console.error('Erreur lors de la finalisation de la mission:', error);
    }
    return false;
}

// ========================================
// LOGIQUE MÉTIER (adaptée pour l'API)
// ========================================

// Sélection d'un véhicule
function selectVehicle(vehicle) {
    const access = canUserAccessVehicle(vehicle);
    if (!access.canAccess) {
        showNotification('❌ Vous ne pouvez pas accéder à ce véhicule', 'error');
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

    // Sur mobile, ouvrir la modal
    if (window.innerWidth <= 1200) {
        openMobileModal(vehicle);
    } else {
        // Sur desktop, afficher dans le panneau
        showVehicleDetails(vehicle);
    }
}

// Démarrer une mission
async function startMission(event, vehicleId) {
    event.preventDefault();

    // Vérifier si l'utilisateur a déjà une mission active
    if (hasActiveUserMission()) {
        showNotification('❌ Vous avez déjà une mission active', 'error');
        return;
    }

    const formData = new FormData(event.target);
    const conducteur2 = formData.get('conducteur2');
    const missionDate = formData.get('missionDate');
    const creneau = formData.get('creneau');
    const departureTime = formData.get('departureTime');
    let missionNature = formData.get('missionNature');
    const autreText = formData.get('autreText');
    const destination = formData.get('destination');
    const passengers = parseInt(formData.get('passengers'));
    const kmDepart = parseInt(formData.get('kmDepart'));
    const carburantDepart = formData.get('carburantDepart');

    if (missionNature === 'autre' && autreText) {
        missionNature = autreText;
    }

    const missionData = {
        vehicleId: vehicleId,
        conducteur2: conducteur2,
        missionDate: missionDate,
        creneau: creneau,
        departureTime: departureTime,
        missionNature: missionNature,
        destination: destination,
        passengers: passengers,
        kmDepart: kmDepart,
        carburantDepart: carburantDepart
    };

    const success = await createMission(missionData);
    
    if (success) {
        showNotification('🚀 Mission démarrée avec succès', 'success');
        
        // Recharger les données
        await refreshData();
        
        if (window.innerWidth <= 1200) {
            openMobileModal(selectedVehicle);
        } else {
            showVehicleDetails(selectedVehicle);
        }
    } else {
        showNotification('❌ Erreur lors de la création de la mission', 'error');
    }
}

// Terminer une mission avec détails
async function endMissionWithDetails(event, vehicleId) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const arrivalTime = formData.get('arrivalTime');
    const kmArrivee = parseInt(formData.get('kmArrivee'));
    const carburantArrivee = formData.get('carburantArrivee');
    const pleinEffectue = formData.get('pleinEffectue') === 'on';
    const notes = formData.get('notes');
    const photoFiles = formData.getAll('photos');

    const userMission = activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicleId);
    if (!userMission) {
        showNotification('❌ Mission introuvable', 'error');
        return;
    }

    const completionData = {
        arrivalTime: arrivalTime,
        kmArrivee: kmArrivee,
        carburantArrivee: carburantArrivee,
        pleinEffectue: pleinEffectue,
        notes: notes,
        photos: photoFiles
    };

    const success = await completeMission(userMission.id, completionData);
    
    if (success) {
        const distanceParcourue = kmArrivee - userMission.kmDepart;
        showNotification(`🏁 Mission terminée ! Distance: ${distanceParcourue} km`, 'success');
        
        // Recharger les données
        await refreshData();
        
        if (selectedVehicle && selectedVehicle.id === vehicleId) {
            if (window.innerWidth <= 1200) {
                openMobileModal(selectedVehicle);
            } else {
                showVehicleDetails(selectedVehicle);
            }
        }
    } else {
        showNotification('❌ Erreur lors de la finalisation de la mission', 'error');
    }
}

// Fonction pour rafraîchir toutes les données
async function refreshData() {
    await loadVehicles();
    await loadUserMissions();
    generateVehicleList();
    updateMissionsList();
}

// ========================================
// FONCTIONS D'AFFICHAGE MODAL
// ========================================

function openMobileModal(vehicle) {
    const modal = document.getElementById('mobileModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    modalTitle.textContent = `🎯 ${vehicle.nom}`;
    modalBody.innerHTML = generateVehicleDetailsHTML(vehicle);
    
    // Ajouter le bouton pour voir les missions sur mobile
    modalBody.innerHTML += `
        <div style="margin-top: 30px; text-align: center;">
            <button onclick="openMissionsModal()" class="btn btn-primary">
                📊 Voir mes missions
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeMobileModal() {
    const modal = document.getElementById('mobileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function openMissionsModal() {
    const modal = document.getElementById('missionsModal');
    const missionsList = document.getElementById('modalMissionsList');
    
    if (!modal || !missionsList) return;
    
    // Synchroniser avec la liste des missions de l'utilisateur
    missionsList.innerHTML = generateUserMissionsList();
    
    modal.style.display = 'block';
}

function closeMissionsModal() {
    const modal = document.getElementById('missionsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function generateVehicleDetailsHTML(vehicle) {
    const access = canUserAccessVehicle(vehicle);
    
    if (!access.canAccess) {
        let message = 'Ce véhicule n\'est pas disponible.';
        if (access.reason === 'maintenance') {
            message = 'Ce véhicule est en maintenance.';
        } else if (access.reason === 'occupied') {
            message = 'Ce véhicule est utilisé par un autre utilisateur ou vous avez déjà une mission active.';
        }
        
        return `
            <div class="access-denied">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <h4>🚫 Accès non autorisé</h4>
                <p>${message}</p>
            </div>
        `;
    }

    const userActiveMission = activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicle.id);
    let missionControlHTML = '';

    if (userActiveMission) {
        // Utilisateur a une mission active sur ce véhicule
        missionControlHTML = `
            <div class="mission-active">
                <h4>🎯 Mission en cours</h4>
                <div class="mission-info">
                    <div class="mission-info-item">
                        <div class="mission-info-label">Conducteur principal</div>
                        <div class="mission-info-value">👤 ${userActiveMission.nom}</div>
                    </div>
                    ${userActiveMission.conducteur2 ? `
                    <div class="mission-info-item">
                        <div class="mission-info-label">2ème conducteur</div>
                        <div class="mission-info-value">👤 ${userActiveMission.conducteur2}</div>
                    </div>
                    ` : ''}
                    <div class="mission-info-item">
                        <div class="mission-info-label">Date</div>
                        <div class="mission-info-value">${new Date(userActiveMission.missionDate).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Créneau</div>
                        <div class="mission-info-value">${getCreneauText(userActiveMission.creneau)}</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Heure de départ</div>
                        <div class="mission-info-value">${userActiveMission.departureTime}</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Nature</div>
                        <div class="mission-info-value">${userActiveMission.missionNature}</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Destination</div>
                        <div class="mission-info-value">${userActiveMission.destination}</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Passagers</div>
                        <div class="mission-info-value">${userActiveMission.passengers}</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Km départ</div>
                        <div class="mission-info-value">${userActiveMission.kmDepart} km</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Carburant départ</div>
                        <div class="mission-info-value">${getCarburantText(userActiveMission.carburantDepart)}</div>
                    </div>
                </div>
                
                <div class="mission-control">
                    <h4 style="color: #1f2937; margin-bottom: 20px;">🏁 Terminer la mission</h4>
                    <form onsubmit="endMissionWithDetails(event, ${vehicle.id})">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="arrivalTime">🕐 Heure d'arrivée</label>
                                <input type="time" id="arrivalTime" name="arrivalTime" 
                                       value="${new Date().toTimeString().slice(0, 5)}" required>
                            </div>
                            <div class="form-group">
                                <label for="kmArrivee">🛣️ Kilométrage d'arrivée</label>
                                <input type="number" id="kmArrivee" name="kmArrivee" 
                                       placeholder="Ex: 45280" min="${userActiveMission.kmDepart}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="carburantArrivee">⛽ Niveau carburant arrivée</label>
                                <select id="carburantArrivee" name="carburantArrivee" required>
                                    <option value="">Sélectionner le niveau</option>
                                    <option value="plein">🟢 Plein (100%)</option>
                                    <option value="3/4">🟡 3/4 (75%)</option>
                                    <option value="1/2">🟠 1/2 (50%)</option>
                                    <option value="1/4">🔴 1/4 (25%)</option>
                                    <option value="reserve">⚠️ Réserve (<10%)</option>
                                    <option value="vide">💀 Vide</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <div class="checkbox-group">
                                    <input type="checkbox" id="pleinEffectue" name="pleinEffectue">
                                    <label for="pleinEffectue">⛽ Plein effectué</label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="notes">📝 Notes / Observations (optionnel)</label>
                            <textarea id="notes" name="notes" rows="3" 
                                      placeholder="Remarques, incidents, observations..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="photos">📷 Photos (optionnel)</label>
                            <input type="file" id="photos" name="photos" multiple accept="image/*" 
                                   style="padding: 10px; border: 2px dashed #d1d5db; border-radius: 8px;">
                            <small style="color: #6b7280; display: block; margin-top: 5px;">
                                Joignez des photos pour documenter la mission (accidents, dégâts, etc.)
                            </small>
                        </div>
                        
                        <button type="submit" class="btn btn-danger">
                            ⏹️ Terminer la mission
                        </button>
                    </form>
                </div>
            </div>
        `;
    } else {
        // Véhicule disponible pour une nouvelle mission
        missionControlHTML = `
            <div class="mission-control">
                <h4>🚀 Nouvelle Mission</h4>
                <form onsubmit="startMission(event, ${vehicle.id})">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="nom">👤 Conducteur principal</label>
                            <input type="text" id="nom" name="nom" value="${currentUser?.nom || ''}" readonly 
                                   style="background-color: #f3f4f6; opacity: 0.8;">
                        </div>
                        
                        <div class="form-group">
                            <label for="conducteur2">👤 2ème conducteur (optionnel)</label>
                            <input type="text" id="conducteur2" name="conducteur2" 
                                   placeholder="Nom du deuxième conducteur">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="missionDate">📅 Date de mission</label>
                            <input type="date" id="missionDate" name="missionDate" 
                                   value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="creneau">⏰ Créneau</label>
                            <select id="creneau" name="creneau" required>
                                <option value="">Sélectionner le créneau</option>
                                <option value="matinee">🌅 Matinée</option>
                                <option value="apres-midi">🌇 Après-midi</option>
                                <option value="journee">🌞 Journée complète</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="departureTime">🕐 Heure de départ</label>
                            <input type="time" id="departureTime" name="departureTime" 
                                   value="${new Date().toTimeString().slice(0, 5)}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="passengers">👥 Nombre de passagers</label>
                            <input type="number" id="passengers" name="passengers" 
                                   placeholder="2" min="0" max="8" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="missionNature">📋 Nature de la mission</label>
                        <select id="missionNature" name="missionNature" required onchange="checkAutre(this)">
                            <option value="">Sélectionner le type de mission</option>
                            <option value="transport-personnel">🚌 Transport de personnel</option>
                            <option value="livraison">📦 Livraison</option>
                            <option value="maintenance">🔧 Maintenance</option>
                            <option value="urgence">🚨 Mission d'urgence</option>
                            <option value="formation">🎓 Formation/Conduite</option>
                            <option value="autre">✏️ Autre</option>
                        </select>
                    </div>
                    
                    <div class="form-group hidden" id="autreGroup">
                        <label for="autreText">✏️ Précisez la mission</label>
                        <input type="text" id="autreText" name="autreText" placeholder="Décrivez la mission">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="destination">📍 Destination</label>
                            <input type="text" id="destination" name="destination" 
                                   placeholder="Ex: Centre-ville, Aéroport..." required>
                        </div>
                        
                        <div class="form-group">
                            <label for="kmDepart">🛣️ Kilométrage de départ</label>
                            <input type="number" id="kmDepart" name="kmDepart" 
                                   placeholder="Ex: 45230" min="0" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="carburantDepart">⛽ Niveau carburant départ</label>
                        <select id="carburantDepart" name="carburantDepart" required>
                            <option value="">Sélectionner le niveau</option>
                            <option value="plein">🟢 Plein (100%)</option>
                            <option value="3/4">🟡 3/4 (75%)</option>
                            <option value="1/2">🟠 1/2 (50%)</option>
                            <option value="1/4">🔴 1/4 (25%)</option>
                            <option value="reserve">⚠️ Réserve (<10%)</option>
                            <option value="vide">💀 Vide</option>
                        </select>
                        <small style="color: #6b7280; display: block; margin-top: 5px;">
                            Indiquez le niveau de carburant avant le départ
                        </small>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        ▶️ Démarrer la mission
                    </button>
                </form>
            </div>
        `;
    }

    return `
        <div class="vehicle-header-detail">
            <h3>${vehicle.nom}</h3>
            <p>${vehicle.immatriculation}</p>
            ${vehicle.dateImmatriculation ? `<small>Mise en service: ${vehicle.dateImmatriculation}</small>` : ''}
        </div>

        ${missionControlHTML}
    `;
}

// Fonction pour gérer la sélection "Autre" dans nature de mission
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

// Affichage des détails du véhicule
function showVehicleDetails(vehicle) {
    const noSelection = document.getElementById('noSelection');
    const vehicleDetails = document.getElementById('vehicleDetails');
    
    if (noSelection) noSelection.style.display = 'none';
    if (vehicleDetails) {
        vehicleDetails.style.display = 'block';
        vehicleDetails.innerHTML = generateVehicleDetailsHTML(vehicle);
    }
}

// Générer la liste des missions de l'utilisateur avec bouton export
function generateUserMissionsList() {
    const allMissions = [...activeMissions, ...completedMissions];
    const userMissions = allMissions.filter(m => m.userId === currentUser?.id);

    if (userMissions.length === 0) {
        return `
            <p style="text-align: center; color: #6b7280; padding: 40px;">
                🔍 Aucune mission enregistrée
            </p>
        `;
    }

    // Ajouter le bouton d'export en haut de la liste
    let exportButton = `
        <div style="text-align: center; margin-bottom: 20px;">
            <button onclick="exportMissionsToPDF()" class="btn btn-primary">
                📄 Exporter en PDF
            </button>
        </div>
    `;

    const sortedMissions = [...userMissions].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return exportButton + sortedMissions.map(mission => {
        const consommation = mission.carburantDepart && mission.carburantArrivee ? 
            calculateConsommation(mission.carburantDepart, mission.carburantArrivee, mission.pleinEffectue) : '';
        
        return `
            <div class="mission-item ${mission.status}">
                <div class="mission-header">
                    <div class="mission-destination">📍 ${mission.destination}</div>
                    <div class="mission-status ${mission.status}">
                        ${mission.status === 'active' ? '🟡 En cours' : '✅ Terminée'}
                    </div>
                </div>
                <div class="mission-details">
                    <div>🚗 ${mission.vehicleName}</div>
                    <div>👤 ${mission.nom}${mission.conducteur2 ? ` + ${mission.conducteur2}` : ''}</div>
                    <div>📅 ${new Date(mission.missionDate).toLocaleDateString('fr-FR')}</div>
                    <div>⏰ ${getCreneauText(mission.creneau)}</div>
                    <div>📋 ${mission.missionNature}</div>
                    <div>👥 ${mission.passengers} passagers</div>
                    <div>🕐 ${mission.departureTime}${mission.arrivalTime ? ' - ' + mission.arrivalTime : ''}</div>
                    <div>🛣️ Départ: ${mission.kmDepart} km</div>
                    ${mission.kmArrivee ? `<div>🏁 Arrivée: ${mission.kmArrivee} km</div>` : ''}
                    ${mission.distanceParcourue ? `<div>📏 Distance: ${mission.distanceParcourue} km</div>` : ''}
                    ${mission.carburantDepart ? `<div>⛽ Carburant départ: ${getCarburantText(mission.carburantDepart)}</div>` : ''}
                    ${mission.carburantArrivee ? `<div>⛽ Carburant arrivée: ${getCarburantText(mission.carburantArrivee)}</div>` : ''}
                    ${mission.pleinEffectue ? `<div>⛽ ✅ Plein effectué</div>` : ''}
                    ${consommation ? `<div>📊 ${consommation}</div>` : ''}
                    ${mission.notes ? `<div>📝 ${mission.notes}</div>` : ''}
                    ${mission.photos && mission.photos.length > 0 ? `<div>📷 ${mission.photos.length} photo(s) jointe(s)</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Calculer la consommation de carburant
function calculateConsommation(niveauDepart, niveauArrivee, pleinEffectue) {
    // Convertir les niveaux en pourcentages
    const convertToPercent = (niveau) => {
        if (!isNaN(niveau)) return parseInt(niveau);
        
        const conversions = {
            'plein': 100,
            '3/4': 75,
            '1/2': 50,
            '1/4': 25,
            'reserve': 10,
            'vide': 0
        };
        return conversions[niveau] || 0;
    };
    
    const departPct = convertToPercent(niveauDepart);
    const arriveePct = convertToPercent(niveauArrivee);
    
    if (pleinEffectue) {
        return `Consommation: ${100 - departPct}% (plein effectué)`;
    } else {
        const consommation = departPct - arriveePct;
        if (consommation > 0) {
            return `Consommation: ${consommation}%`;
        } else if (consommation < 0) {
            return `Niveau augmenté: +${Math.abs(consommation)}%`;
        } else {
            return `Pas de variation de carburant`;
        }
    }
}

// Mettre à jour la liste des missions avec bouton export
function updateMissionsList() {
    const missionsList = document.getElementById('missionsList');
    if (missionsList) {
        missionsList.innerHTML = generateUserMissionsList();
    }
}

// ========================================
// FONCTIONS D'EXPORT PDF
// ========================================

// Fonction pour exporter les missions en PDF
async function exportMissionsToPDF() {
    try {
        showNotification('🔄 Génération du PDF en cours...', 'info');

        const allMissions = [...activeMissions, ...completedMissions];
        const userMissions = allMissions.filter(m => m.userId === currentUser?.id);

        if (userMissions.length === 0) {
            showNotification('❌ Aucune mission à exporter', 'warning');
            return;
        }

        const htmlContent = generatePDFContent(userMissions);
        const filename = `missions_${currentUser.nom}_${new Date().toISOString().split('T')[0]}.pdf`;

        const response = await fetch('/api/missions/export-pdf', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html_content: htmlContent, filename: filename })
        });

        if (!response.ok) throw new Error('Erreur lors de la génération du PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Détection mobile / desktop
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            // Solution mobile optimisée
            try {
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);

                showNotification('✅ PDF téléchargé - Vérifiez vos téléchargements', 'success');
                
            } catch (downloadError) {
                console.warn('Téléchargement direct échoué:', downloadError);
                createManualDownloadLink(url, filename);
            }
        } else {
            // Desktop: téléchargement classique
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showNotification('✅ PDF téléchargé avec succès', 'success');
        }

    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        showNotification('❌ Erreur lors de la génération du PDF', 'error');
    }
}

// Fonction de fallback pour créer un lien de téléchargement manuel
function createManualDownloadLink(url, filename) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        max-width: 90%;
        max-height: 90%;
    `;

    content.innerHTML = `
        <h3>Téléchargement PDF</h3>
        <p>Cliquez sur le lien ci-dessous pour télécharger votre PDF :</p>
        <a href="${url}" download="${filename}" style="
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px;
        ">📄 Télécharger ${filename}</a>
        <br>
        <button onclick="this.closest('.modal').remove(); window.URL.revokeObjectURL('${url}')" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 5px 15px;
            border-radius: 3px;
            margin-top: 10px;
            cursor: pointer;
        ">Fermer</button>
    `;

    modal.className = 'modal';
    modal.appendChild(content);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            window.URL.revokeObjectURL(url);
        }
    });

    showNotification('📱 Lien de téléchargement affiché', 'info');
}

// Générer le contenu HTML pour le PDF
function generatePDFContent(missions) {
    const sortedMissions = [...missions].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    let missionsHTML = '';
    sortedMissions.forEach(mission => {
        const consommation = mission.carburantDepart && mission.carburantArrivee ? 
            calculateConsommation(mission.carburantDepart, mission.carburantArrivee, mission.pleinEffectue) : '';
            
        missionsHTML += `
            <div class="mission-pdf-item">
                <div class="mission-pdf-header">
                    <h3>${mission.destination}</h3>
                    <span class="status-badge ${mission.status}">
                        ${mission.status === 'active' ? 'En cours' : 'Terminée'}
                    </span>
                </div>
                <div class="mission-pdf-details">
                    <div class="detail-row">
                        <span class="label">Véhicule:</span>
                        <span class="value">${mission.vehicleName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Conducteur principal:</span>
                        <span class="value">${mission.nom}</span>
                    </div>
                    ${mission.conducteur2 ? `
                    <div class="detail-row">
                        <span class="label">2ème conducteur:</span>
                        <span class="value">${mission.conducteur2}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="label">Date:</span>
                        <span class="value">${new Date(mission.missionDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Créneau:</span>
                        <span class="value">${getCreneauText(mission.creneau)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Nature:</span>
                        <span class="value">${mission.missionNature}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Passagers:</span>
                        <span class="value">${mission.passengers}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Horaire:</span>
                        <span class="value">${mission.departureTime}${mission.arrivalTime ? ' - ' + mission.arrivalTime : ''}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Kilométrage:</span>
                        <span class="value">Départ: ${mission.kmDepart} km${mission.kmArrivee ? `, Arrivée: ${mission.kmArrivee} km` : ''}</span>
                    </div>
                    ${mission.distanceParcourue ? `
                    <div class="detail-row">
                        <span class="label">Distance parcourue:</span>
                        <span class="value">${mission.distanceParcourue} km</span>
                    </div>
                    ` : ''}
                    ${mission.carburantDepart ? `
                    <div class="detail-row">
                        <span class="label">Carburant départ:</span>
                        <span class="value">${getCarburantText(mission.carburantDepart)}</span>
                    </div>
                    ` : ''}
                    ${mission.carburantArrivee ? `
                    <div class="detail-row">
                        <span class="label">Carburant arrivée:</span>
                        <span class="value">${getCarburantText(mission.carburantArrivee)}</span>
                    </div>
                    ` : ''}
                    ${mission.pleinEffectue ? `
                    <div class="detail-row">
                        <span class="label">Plein effectué:</span>
                        <span class="value">✅ Oui</span>
                    </div>
                    ` : ''}
                    ${consommation ? `
                    <div class="detail-row">
                        <span class="label">Consommation:</span>
                        <span class="value">${consommation}</span>
                    </div>
                    ` : ''}
                    ${mission.notes ? `
                    <div class="detail-row">
                        <span class="label">Notes:</span>
                        <span class="value">${mission.notes}</span>
                    </div>
                    ` : ''}
                    ${mission.photos && mission.photos.length > 0 ? `
                    <div class="detail-row">
                        <span class="label">Photos:</span>
                        <span class="value">${mission.photos.length} photo(s) jointe(s)</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <title>Rapport de Missions - ${currentUser.nom}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #1f2937;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #e5e7eb;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #667eea;
                    margin-bottom: 10px;
                }
                .header .subtitle {
                    color: #6b7280;
                    font-size: 1.1rem;
                }
                .mission-pdf-item {
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    padding: 20px;
                    page-break-inside: avoid;
                }
                .mission-pdf-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    border-bottom: 1px solid #f3f4f6;
                    padding-bottom: 10px;
                }
                .mission-pdf-header h3 {
                    margin: 0;
                    color: #1f2937;
                }
                .status-badge {
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .status-badge.active {
                    background: #fef3c7;
                    color: #92400e;
                }
                .status-badge.completed {
                    background: #d1fae5;
                    color: #065f46;
                }
                .mission-pdf-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                }
                .label {
                    font-weight: 600;
                    color: #374151;
                }
                .value {
                    color: #6b7280;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 0.9rem;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Rapport de Missions</h1>
                <div class="subtitle">
                    <strong>${currentUser.nom}</strong><br>
                    Généré le ${new Date().toLocaleDateString('fr-FR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
            </div>
            
            <div class="missions-content">
                ${missionsHTML}
            </div>
            
            <div class="footer">
                <p>DriveGo - Système de Gestion du Parc Automobile</p>
                <p>Document généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
            </div>
        </body>
        </html>
    `;
}

// ========================================
// UTILITAIRES
// ========================================

// Système de notifications
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

// Bouton retour
function goToHomePage() {
    if (confirm('Êtes-vous sûr de vouloir quitter la gestion des véhicules ?')) {
        window.location.href = "/";
    }
}

// Gestion du redimensionnement
window.addEventListener('resize', () => {
    if (window.innerWidth > 1200) {
        closeMobileModal();
        closeMissionsModal();
        if (selectedVehicle) {
            showVehicleDetails(selectedVehicle);
        }
    }
});

// Fermeture des modals en cliquant à l'extérieur
document.addEventListener('DOMContentLoaded', function() {
    const mobileModal = document.getElementById('mobileModal');
    const missionsModal = document.getElementById('missionsModal');
    
    if (mobileModal) {
        mobileModal.addEventListener('click', (e) => {
            if (e.target.id === 'mobileModal') {
                closeMobileModal();
            }
        });
    }

    if (missionsModal) {
        missionsModal.addEventListener('click', (e) => {
            if (e.target.id === 'missionsModal') {
                closeMissionsModal();
            }
        });
    }
});

// ========================================
// INITIALISATION PRINCIPALE
// ========================================
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚗 DriveGo - Initialisation de la page véhicules...');
    
    try {
        // 1. Charger l'utilisateur connecté
        const userLoaded = await fetchCurrentUser();
        if (!userLoaded) {
            console.error('Impossible de charger les données utilisateur');
            return;
        }
        
        // 2. Charger toutes les données en parallèle
        const [vehiclesLoaded, missionsLoaded] = await Promise.all([
            loadVehicles(),
            loadUserMissions()
        ]);
        
        if (!vehiclesLoaded) {
            console.error('Impossible de charger les véhicules');
        }
        
        // 3. Initialiser l'interface
        generateVehicleList();
        updateMissionsList();

        // 4. Configurer l'affichage initial
        const noSelection = document.getElementById('noSelection');
        const details = document.getElementById('vehicleDetails');
        
        if (noSelection) noSelection.style.display = 'block';
        if (details) details.style.display = 'none';

        console.log(`👤 Utilisateur connecté: ${currentUser?.nom}`);
        console.log(`🚗 ${vehicles.length} véhicules chargés`);
        console.log(`🎯 ${activeMissions.length} missions actives`);
        console.log(`✅ ${completedMissions.length} missions terminées`);
        
     } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
});



// Fonction améliorée pour terminer une mission avec débogage détaillé
async function completeMission(missionId, completionData) {
    console.log('🏁 Tentative de finalisation de mission:', missionId);
    console.log('📋 Données envoyées:', completionData);
    
    try {
        const formData = new FormData();
        
        // Validation et ajout des champs obligatoires
        if (!completionData.arrivalTime) {
            throw new Error('Heure d\'arrivée manquante');
        }
        if (!completionData.kmArrivee || isNaN(completionData.kmArrivee)) {
            throw new Error('Kilométrage d\'arrivée invalide');
        }
        if (!completionData.carburantArrivee) {
            throw new Error('Niveau de carburant d\'arrivée manquant');
        }
        
        formData.append('heure_fin', completionData.arrivalTime);
        formData.append('km_arrivee', completionData.kmArrivee.toString());
        formData.append('carburant_arrivee', completionData.carburantArrivee);
        formData.append('plein_effectue', completionData.pleinEffectue ? '1' : '0');
        formData.append('notes', completionData.notes || '');
        
        // Gestion améliorée des photos
        if (completionData.photos && completionData.photos.length > 0) {
            console.log(`📷 Ajout de ${completionData.photos.length} photo(s)`);
            for (let i = 0; i < completionData.photos.length; i++) {
                const photo = completionData.photos[i];
                if (photo && photo.size > 0) {
                    formData.append('photos[]', photo, photo.name || `photo_${i}.jpg`);
                    console.log(`📸 Photo ${i + 1}: ${photo.name} (${photo.size} bytes)`);
                } else {
                    console.warn(`⚠️ Photo ${i + 1} vide ou invalide`);
                }
            }
        }

        // Log des données FormData pour débogage
        console.log('📦 Contenu FormData:');
        for (let pair of formData.entries()) {
            if (pair[1] instanceof File) {
                console.log(`  ${pair[0]}: [FILE] ${pair[1].name} (${pair[1].size} bytes)`);
            } else {
                console.log(`  ${pair[0]}: ${pair[1]}`);
            }
        }

        console.log(`🌐 Envoi de la requête vers: /api/missions/${missionId}/complete`);
        
        const response = await fetch(`/api/missions/${missionId}/complete`, {
            method: 'PUT',
            credentials: 'include',
            body: formData
        });
        
        console.log(`📡 Réponse HTTP: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur serveur:', errorText);
            
            // Messages d'erreur spécifiques selon le code de statut
            switch (response.status) {
                case 400:
                    throw new Error('Données invalides. Vérifiez tous les champs obligatoires.');
                case 401:
                    throw new Error('Session expirée. Reconnectez-vous.');
                case 404:
                    throw new Error('Mission introuvable.');
                case 413:
                    throw new Error('Fichiers trop volumineux. Réduisez la taille des photos.');
                case 500:
                    throw new Error('Erreur serveur. Réessayez plus tard.');
                default:
                    throw new Error(`Erreur ${response.status}: ${errorText}`);
            }
        }
        
        const data = await response.json();
        console.log('✅ Réponse serveur:', data);
        
        if (data.success) {
            console.log('🎉 Mission terminée avec succès !');
            return true;
        } else {
            console.error('❌ Échec rapporté par le serveur:', data.message || 'Erreur inconnue');
            throw new Error(data.message || 'Échec de la finalisation de la mission');
        }
        
    } catch (error) {
        console.error('💥 Erreur lors de la finalisation de la mission:', error);
        
        // Afficher l'erreur à l'utilisateur
        showNotification(`Erreur: ${error.message}`, 'error');
        
        // Si c'est une erreur réseau, proposer de réessayer
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log('🌐 Erreur réseau détectée');
            if (confirm('Erreur de connexion. Voulez-vous réessayer ?')) {
                return await completeMission(missionId, completionData);
            }
        }
        
        return false;
    }
}

// Fonction améliorée pour endMissionWithDetails avec validation
async function endMissionWithDetails(event, vehicleId) {
    event.preventDefault();
    console.log('🚀 Début de la finalisation de mission pour véhicule:', vehicleId);

    const formData = new FormData(event.target);
    const arrivalTime = formData.get('arrivalTime');
    const kmArrivee = parseInt(formData.get('kmArrivee'));
    const carburantArrivee = formData.get('carburantArrivee');
    const pleinEffectue = formData.get('pleinEffectue') === 'on';
    const notes = formData.get('notes');
    const photoFiles = formData.getAll('photos');

    // Validation côté client
    if (!arrivalTime) {
        showNotification('❌ Veuillez indiquer l\'heure d\'arrivée', 'error');
        return;
    }
    
    if (!kmArrivee || isNaN(kmArrivee)) {
        showNotification('❌ Veuillez indiquer un kilométrage d\'arrivée valide', 'error');
        return;
    }
    
    if (!carburantArrivee) {
        showNotification('❌ Veuillez sélectionner le niveau de carburant d\'arrivée', 'error');
        return;
    }

    const userMission = activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicleId);
    if (!userMission) {
        console.error('❌ Mission utilisateur introuvable');
        showNotification('❌ Mission introuvable', 'error');
        return;
    }

    console.log('📋 Mission trouvée:', userMission);

    // Validation du kilométrage
    if (kmArrivee < userMission.kmDepart) {
        showNotification(`❌ Le kilométrage d'arrivée (${kmArrivee}) ne peut pas être inférieur au départ (${userMission.kmDepart})`, 'error');
        return;
    }

    // Filtrer les fichiers photo valides
    const validPhotos = Array.from(photoFiles).filter(file => file && file.size > 0);
    if (photoFiles.length > validPhotos.length) {
        console.log(`⚠️ ${photoFiles.length - validPhotos.length} photo(s) vide(s) ignorée(s)`);
    }

    const completionData = {
        arrivalTime: arrivalTime,
        kmArrivee: kmArrivee,
        carburantArrivee: carburantArrivee,
        pleinEffectue: pleinEffectue,
        notes: notes,
        photos: validPhotos
    };

    console.log('📤 Données de finalisation préparées:', {
        ...completionData,
        photos: `${validPhotos.length} fichier(s)`
    });

    // Désactiver le bouton de soumission pour éviter les doubles envois
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '⏳ Finalisation en cours...';
    }

    try {
        const success = await completeMission(userMission.id, completionData);
        
        if (success) {
            const distanceParcourue = kmArrivee - userMission.kmDepart;
            showNotification(`🏁 Mission terminée ! Distance: ${distanceParcourue} km`, 'success');
            
            // Recharger les données
            await refreshData();
            
            if (selectedVehicle && selectedVehicle.id === vehicleId) {
                if (window.innerWidth <= 1200) {
                    openMobileModal(selectedVehicle);
                } else {
                    showVehicleDetails(selectedVehicle);
                }
            }
        }
    } catch (error) {
        console.error('💥 Erreur dans endMissionWithDetails:', error);
    } finally {
        // Réactiver le bouton
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '⏹️ Terminer la mission';
        }
    }
}













// Exposer les fonctions globalement pour les événements
window.selectVehicle = selectVehicle;
window.checkAutre = checkAutre;
window.startMission = startMission;
window.endMissionWithDetails = endMissionWithDetails;
window.openMobileModal = openMobileModal;
window.closeMobileModal = closeMobileModal;
window.openMissionsModal = openMissionsModal;
window.closeMissionsModal = closeMissionsModal;
window.goToHomePage = goToHomePage;
window.exportMissionsToPDF = exportMissionsToPDF;