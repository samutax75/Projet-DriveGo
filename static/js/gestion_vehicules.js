// ========================================
// GESTION DYNAMIQUE DES DONNÉES
// ========================================

// Variables globales pour les données dynamiques
let currentUser = null;
let vehicles = [];
let activeMissions = [];
let completedMissions = [];
let selectedVehicle = null;
let capturedPhotos = []; // Stockage des photos prises

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
                    prenom: extractFirstName(data.user.nom), // Extraire le prénom
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

// Fonction pour extraire le prénom du nom complet
function extractFirstName(fullName) {
    if (!fullName) return '';
    // Séparer par espace et prendre le dernier mot (généralement le prénom en français)
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1];
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
                    vehicleName: mission.vehicule_nom || 'Véhicule inconnu',
                    nom: mission.conducteur_actuel, // UTILISER LE CONDUCTEUR ACTUEL
                    conducteurOriginal: mission.conducteur_original, // CONDUCTEUR ORIGINAL
                    conducteur2: mission.conducteur2 || '',
                    isTransferred: mission.is_transferred || false, // STATUT DE TRANSFERT
                    transferredToName: mission.transferred_to_name, // QUI A REÇU LE TRANSFERT
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
                
                // Même logique pour completedMissions...
                completedMissions = data.missions.filter(m => m.statut === 'completed').map(mission => ({
                    // ... même structure avec conducteur_actuel
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
// FONCTIONS PHOTO
// ========================================

// Fonction pour ouvrir la caméra et prendre une photo
async function takePhoto() {
    try {
        // Vérifier si l'API est supportée
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showNotification('Caméra non disponible sur cet appareil', 'error');
            return;
        }

        // Demander l'accès à la caméra
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment' // Préférer la caméra arrière
            } 
        });

        // Créer la modal caméra
        showCameraModal(stream);

    } catch (error) {
        console.error('Erreur accès caméra:', error);
        if (error.name === 'NotAllowedError') {
            showNotification('Accès à la caméra refusé. Vérifiez les permissions.', 'error');
        } else {
            showNotification('Erreur d\'accès à la caméra', 'error');
        }
    }
}

// Afficher la modal caméra
function showCameraModal(stream) {
    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    modal.innerHTML = `
        <div style="position: relative; width: 90%; max-width: 500px;">
            <video id="cameraVideo" autoplay playsinline style="width: 100%; border-radius: 10px;"></video>
            <canvas id="photoCanvas" style="display: none;"></canvas>
            <div style="text-align: center; margin-top: 20px;">
                <button id="captureBtn" style="
                    background: #fff;
                    border: none;
                    border-radius: 50%;
                    width: 70px;
                    height: 70px;
                    font-size: 24px;
                    margin: 0 10px;
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                ">📷</button>
                <button id="closeCameraBtn" style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 10px 20px;
                    margin: 0 10px;
                    cursor: pointer;
                ">Fermer</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('photoCanvas');
    const captureBtn = document.getElementById('captureBtn');
    const closeBtn = document.getElementById('closeCameraBtn');

    // Démarrer la vidéo
    video.srcObject = stream;

    // Capturer la photo
    captureBtn.onclick = () => {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // Convertir en blob
        canvas.toBlob((blob) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const photoFile = new File([blob], `photo_mission_${timestamp}.jpg`, { type: 'image/jpeg' });
            
            capturedPhotos.push(photoFile);
            updatePhotosPreview();
            showNotification(`Photo ${capturedPhotos.length} capturée`, 'success');
        }, 'image/jpeg', 0.8);
    };

    // Fermer la modal
    closeBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
    };

    // Fermer en cliquant à l'extérieur
    modal.onclick = (e) => {
        if (e.target === modal) {
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(modal);
        }
    };
}

// Mettre à jour l'aperçu des photos
function updatePhotosPreview() {
    const previewContainer = document.getElementById('photosPreview');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    capturedPhotos.forEach((photo, index) => {
        const photoDiv = document.createElement('div');
        photoDiv.style.cssText = `
            display: inline-block;
            margin: 5px;
            position: relative;
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        `;

        const img = document.createElement('img');
        img.src = URL.createObjectURL(photo);
        img.style.cssText = `
            width: 80px;
            height: 80px;
            object-fit: cover;
        `;

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            cursor: pointer;
            font-size: 12px;
        `;
        deleteBtn.onclick = () => removePhoto(index);

        photoDiv.appendChild(img);
        photoDiv.appendChild(deleteBtn);
        previewContainer.appendChild(photoDiv);
    });

    // Mettre à jour le compteur
    const photoCount = document.getElementById('photoCount');
    if (photoCount) {
        photoCount.textContent = `${capturedPhotos.length} photo(s) prise(s)`;
    }
}

// Supprimer une photo
function removePhoto(index) {
    capturedPhotos.splice(index, 1);
    updatePhotosPreview();
    showNotification('Photo supprimée', 'info');
}

// Réinitialiser les photos
function clearPhotos() {
    capturedPhotos = [];
    updatePhotosPreview();
}

// ========================================
// FONCTIONS UTILITAIRES (reste du code inchangé)
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
    
    const userActiveMission = activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicle.id);
    if (userActiveMission) return { canAccess: true, reason: 'my-mission' };

    const vehicleOccupied = activeMissions.some(m => m.vehicleId === vehicle.id);
    
    if (!vehicleOccupied && !hasActiveUserMission() && vehicle.disponible) {
        return { canAccess: true, reason: 'available' };
    }

    if (!vehicle.disponible) {
        return { canAccess: false, reason: 'maintenance' };
    }

    return { canAccess: false, reason: 'occupied' };
}
function getVehicleStatus(vehicle) {
    // Vérifier d'abord le statut de la base de données
    if (vehicle.statut === 'En mission') {
        // Vérifier si c'est MA mission
        const myMission = activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicle.id);
        
        if (myMission) {
            const creneauText = getCreneauText(myMission.creneau);
            return {
                status: 'my-mission',
                text: `🎯 ${creneauText} - ${currentUser.prenom}`,
                user: currentUser.prenom,
                canSelect: true
            };
        } else {
            // Mission d'un autre utilisateur
            return {
                status: 'occupied',
                text: '🚗 En mission - Autre utilisateur',
                user: 'Autre utilisateur',
                canSelect: false
            };
        }
    }
    
    // Véhicule en maintenance
    if (!vehicle.disponible) {
        return {
            status: 'maintenance',
            text: '🔧 Maintenance',
            user: null,
            canSelect: false
        };
    }
    
    // Vérifier si l'utilisateur a déjà une mission active
    const hasActiveUserMission = activeMissions.some(m => m.userId === currentUser.id);
    
    if (vehicle.disponible && vehicle.statut === 'actif' && !hasActiveUserMission) {
        return {
            status: 'available',
            text: '✅ Disponible',
            user: null,
            canSelect: true
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

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        userInfo.textContent = `👤 ${currentUser.prenom}`;
    }
}

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
            const isCurrentUser = vehicleStatus.user === currentUser?.prenom;
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

async function completeMission(missionId, completionData) {
    console.log('🏁 Tentative de finalisation de mission:', missionId);
    console.log('📋 Données envoyées:', completionData);
    
    try {
        const formData = new FormData();
        
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
        
        // Utiliser les photos capturées
        if (capturedPhotos && capturedPhotos.length > 0) {
            console.log(`📷 Ajout de ${capturedPhotos.length} photo(s) capturée(s)`);
            for (let i = 0; i < capturedPhotos.length; i++) {
                const photo = capturedPhotos[i];
                formData.append('photos[]', photo, photo.name);
                console.log(`📸 Photo ${i + 1}: ${photo.name} (${photo.size} bytes)`);
            }
        }

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
            clearPhotos(); // Nettoyer les photos après succès
            return true;
        } else {
            console.error('❌ Échec rapporté par le serveur:', data.message || 'Erreur inconnue');
            throw new Error(data.message || 'Échec de la finalisation de la mission');
        }
        
    } catch (error) {
        console.error('💥 Erreur lors de la finalisation de la mission:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log('🌐 Erreur réseau détectée');
            if (confirm('Erreur de connexion. Voulez-vous réessayer ?')) {
                return await completeMission(missionId, completionData);
            }
        }
        
        return false;
    }
}

// ========================================
// LOGIQUE MÉTIER
// ========================================

function selectVehicle(vehicle) {
    const access = canUserAccessVehicle(vehicle);
    if (!access.canAccess) {
        showNotification('❌ Vous ne pouvez pas accéder à ce véhicule', 'error');
        return;
    }

    selectedVehicle = vehicle;
    clearPhotos(); // Réinitialiser les photos à chaque sélection

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

async function startMission(event, vehicleId) {
    event.preventDefault();

    if (hasActiveUserMission()) {
        showNotification('❌ Vous avez déjà une mission active', 'error');
        return;
    }

    const formData = new FormData(event.target);
    const conducteur2 = formData.get('conducteur2');
    const missionDate = formData.get('missionDate');
    const creneau = formData.get('creneau');
    const departureTime = formData.get('departureTime');
    let missionNature = formData.get('mission');
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

async function endMissionWithDetails(event, vehicleId) {
    event.preventDefault();
    console.log('🚀 Début de la finalisation de mission pour véhicule:', vehicleId);

    const formData = new FormData(event.target);
    const arrivalTime = formData.get('arrivalTime');
    const kmArrivee = parseInt(formData.get('kmArrivee'));
    const carburantArrivee = formData.get('carburantArrivee');
    const pleinEffectue = formData.get('pleinEffectue') === 'on';
    const notes = formData.get('notes');

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

    if (kmArrivee < userMission.kmDepart) {
        showNotification(`❌ Le kilométrage d'arrivée (${kmArrivee}) ne peut pas être inférieur au départ (${userMission.kmDepart})`, 'error');
        return;
    }

    const completionData = {
        arrivalTime: arrivalTime,
        kmArrivee: kmArrivee,
        carburantArrivee: carburantArrivee,
        pleinEffectue: pleinEffectue,
        notes: notes
    };

    console.log('📤 Données de finalisation préparées:', completionData);

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
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '⏹️ Terminer la mission';
        }
    }
}

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
    
    // Vérifier l'accès au véhicule
    if (!access.canAccess) {
        return generateAccessDeniedHTML(access.reason);
    }

    // Chercher une mission active pour ce véhicule et cet utilisateur
    const userActiveMission = activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicle.id);
    
    let missionControlHTML = '';
    
    if (userActiveMission) {
        missionControlHTML = generateActiveMissionHTML(userActiveMission, vehicle.id);
    } else {
        missionControlHTML = generateNewMissionHTML(vehicle.id);
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

// Fonction pour générer le HTML d'accès refusé
function generateAccessDeniedHTML(reason) {
    let message = 'Ce véhicule n\'est pas disponible.';
    
    if (reason === 'maintenance') {
        message = 'Ce véhicule est en maintenance.';
    } else if (reason === 'occupied') {
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

// Fonction pour générer le HTML d'une mission active
function generateActiveMissionHTML(mission, vehicleId) {
    return `
        <div class="mission-active">
            <h4>🎯 Mission en cours</h4>
            
            ${generateMissionInfoSection(mission)}
            
            ${generateTransferStatusSection(mission)}
            
            ${generateNavigationSection(mission)}
            
            ${generateEndMissionSection(vehicleId, mission)}
        </div>
    `;
}

// Fonction pour générer la section d'informations de mission
function generateMissionInfoSection(mission) {
    return `
        <div class="mission-info">
            <div class="mission-info-item">
                <div class="mission-info-label">Conducteur actuel</div>
                <div class="mission-info-value">👤 ${mission.nom}
                    ${mission.isTransferred ? '<span style="color: #10b981; font-size: 12px; margin-left: 8px;">(Mission transférée)</span>' : ''}
                </div>
            </div>
            
            ${mission.isTransferred && mission.conducteurOriginal && mission.conducteurOriginal !== mission.nom ? `
            <div class="mission-info-item">
                <div class="mission-info-label">Conducteur original</div>
                <div class="mission-info-value">👤 ${mission.conducteurOriginal}</div>
            </div>
            ` : ''}
            
            ${mission.conducteur2 ? `
            <div class="mission-info-item">
                <div class="mission-info-label">2ème conducteur</div>
                <div class="mission-info-value">👤 ${mission.conducteur2}</div>
            </div>
            ` : ''}
            
            ${mission.isTransferred && mission.transferredToName ? `
            <div class="mission-info-item">
                <div class="mission-info-label">Transférée à</div>
                <div class="mission-info-value">👤 ${mission.transferredToName}
                    <span style="color: #f59e0b; font-size: 12px; margin-left: 8px;">(Contrôle transféré)</span>
                </div>
            </div>
            ` : ''}
            
            <div class="mission-info-item">
                <div class="mission-info-label">Date</div>
                <div class="mission-info-value">${new Date(mission.missionDate).toLocaleDateString('fr-FR')}</div>
            </div>
            
            <div class="mission-info-item">
                <div class="mission-info-label">Créneau</div>
                <div class="mission-info-value">${getCreneauText(mission.creneau)}</div>
            </div>
            
            <div class="mission-info-item">
                <div class="mission-info-label">Heure de départ</div>
                <div class="mission-info-value">${mission.departureTime}</div>
            </div>
            
            <div class="mission-info-item">
                <div class="mission-info-label">Nature</div>
                <div class="mission-info-value">${mission.missionNature}</div>
            </div>
            
            <div class="mission-info-item">
                <div class="mission-info-label">Destination</div>
                <div class="mission-info-value">${mission.destination}</div>
            </div>
            
            <div class="mission-info-item">
                <div class="mission-info-label">Passagers</div>
                <div class="mission-info-value">${mission.passengers}</div>
            </div>
            
            <div class="mission-info-item">
                <div class="mission-info-label">Km départ</div>
                <div class="mission-info-value">${mission.kmDepart} km</div>
            </div>
            
            <div class="mission-info-item">
                <div class="mission-info-label">Carburant départ</div>
                <div class="mission-info-value">${getCarburantText(mission.carburantDepart)}</div>
            </div>
        </div>
    `;
}

// Fonction pour générer la section de statut de transfert
function generateTransferStatusSection(mission) {
    if (!mission.isTransferred) {
        return '';
    }
    
    return `
        <div class="transfer-status" style="margin: 20px 0; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 5px;">
            <h5 style="color: #92400e; margin: 0 0 10px 0;">⚡ Statut de transfert</h5>
            <p style="color: #92400e; margin: 0; font-size: 14px;">
                Le contrôle de cette mission a été transféré à <strong>${mission.transferredToName}</strong>.
                Vous pouvez toujours terminer la mission si nécessaire.
            </p>
        </div>
    `;
}

// Fonction pour générer la section navigation
function generateNavigationSection(mission) {
    return `
        <div class="navigation-section" style="margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #f8faff 0%, #e0f2fe 100%); border-radius: 10px; border-left: 4px solid #667eea;">
            <h4 style="color: #1f2937; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                🧭 Navigation
            </h4>
            <button onclick="openWaze('${mission.destination.replace(/'/g, "\\'")}')" style="
                background: linear-gradient(45deg, #667eea, #764ba2);
                border: none;
                border-radius: 25px;
                padding: 12px 24px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 18px rgba(102, 126, 234, 0.4)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                </svg>
                Lancer Waze
            </button>
            <div style="font-size: 12px; color: #6b7280; margin-top: 8px; text-align: center;">
                📍 ${mission.destination}
            </div>
        </div>
    `;
}

// Fonction pour générer la section de fin de mission
function generateEndMissionSection(vehicleId, mission) {
    return `
        <div class="mission-control">
            <h4 style="color: #1f2937; margin-bottom: 20px;">🏁 Terminer la mission</h4>
            <form onsubmit="endMissionWithDetails(event, ${vehicleId})">
                ${generateEndMissionFormFields(mission)}
                ${generatePhotosSection()}
                <button type="submit" class="btn btn-danger">
                    ⏹️ Terminer la mission
                </button>
            </form>
        </div>
    `;
}

// Fonction pour générer les champs du formulaire de fin de mission
function generateEndMissionFormFields(mission) {
    return `
        <div class="form-row">
            <div class="form-group">
                <label for="arrivalTime">🕐 Heure d'arrivée</label>
                <input type="time" id="arrivalTime" name="arrivalTime" 
                       value="${new Date().toTimeString().slice(0, 5)}" required>
            </div>
            <div class="form-group">
                <label for="kmArrivee">🛣️ Kilométrage d'arrivée</label>
                <input type="number" id="kmArrivee" name="kmArrivee" 
                       placeholder="Ex: 45280" min="${mission.kmDepart}" required>
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
    `;
}

// Fonction pour générer la section photos
function generatePhotosSection() {
    return `
        <div class="form-group">
            <label>📷 Photos de mission</label>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <button type="button" onclick="takePhoto()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 10px 15px;
                    cursor: pointer;
                ">📷 Prendre une photo</button>
                <button type="button" onclick="clearPhotos()" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 10px 15px;
                    cursor: pointer;
                ">🗑️ Effacer tout</button>
            </div>
            <div id="photoCount" style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                ${capturedPhotos.length} photo(s) prise(s)
            </div>
            <div id="photosPreview" style="
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid #ddd;
                padding: 10px;
                border-radius: 5px;
            "></div>
        </div>
    `;
}

// Fonction pour générer le HTML d'une nouvelle mission
function generateNewMissionHTML(vehicleId) {
    return `
        <div class="mission-control">
            <h4>🚀 Nouvelle Mission</h4>
            <form onsubmit="startMission(event, ${vehicleId})">
                ${generateDriverFields()}
                ${generateDateTimeFields()}
                ${generateMissionTypeFields()}
                ${generateDestinationFields()}
                ${generateFuelField()}
                <button type="submit" class="btn btn-primary">
                    ▶️ Démarrer la mission
                </button>
            </form>
        </div>
    `;
}

// Fonction pour générer les champs conducteurs
function generateDriverFields() {
    return `
        <div class="form-row">
            <div class="form-group">
                <label for="nom">👤 Conducteur principal</label>
                <input type="text" id="nom" name="nom" value="${currentUser?.prenom || ''}" readonly 
                       style="background-color: #f3f4f6; opacity: 0.8;">
            </div>
            
            <div class="form-group">
                <label for="conducteur2">👤 2ème conducteur (optionnel)</label>
                <input type="text" id="conducteur2" name="conducteur2" 
                       placeholder="Nom du deuxième conducteur">
            </div>
        </div>
    `;
}

// Fonction pour générer les champs date/heure
function generateDateTimeFields() {
    return `
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
                       placeholder="2" min="0" max="200" required>
            </div>
        </div>
    `;
}

// Fonction pour générer les champs type de mission
function generateMissionTypeFields() {
    return `
        <div class="form-group">
            <label for="mission">Nature de la mission</label>
            <select id="mission" name="mission" onchange="checkAutre(this)" required>
                <option value="" disabled selected>-- Sélectionner une mission --</option>

                <optgroup label="🎯 Sorties éducatives & culturelles">
                    <option value="cinema">🎬 Cinéma / Spectacle</option>
                    <option value="musee">🎨 Musée / Exposition</option>
                    <option value="bibliotheque">📚 Bibliothèque / Médiathèque</option>
                </optgroup>

                <optgroup label="🏀 Sorties sport & loisirs">
                    <option value="piscine">🏊 Piscine / Sport adapté</option>
                    <option value="loisirs">🎳 Loisirs (bowling, jeux, parc…)</option>
                    <option value="restaurant">🍔 Sortie restaurant / café</option>
                </optgroup>

                <optgroup label="🌳 Sorties nature & découvertes">
                    <option value="parc">🌳 Parc / Balade</option>
                    <option value="ferme">🐑 Ferme pédagogique / Zoo</option>
                </optgroup>

                <optgroup label="🏥 Santé">
                    <option value="medical">🏥 Rendez-vous médical / accompagnement</option>
                </optgroup>

                <optgroup label="⚙️ Services & interventions">
                    <option value="livraison">📦 Livraison</option>
                    <option value="maintenance">🔧 Maintenance</option>
                    <option value="urgence">🚨 Mission d'urgence</option>
                </optgroup>

                <optgroup label="✏️ Divers">
                    <option value="autre">✏️ Autre</option>
                </optgroup>
            </select>
        </div>
        
        <div class="form-group hidden" id="autreGroup">
            <label for="autreText">✏️ Précisez la mission</label>
            <input type="text" id="autreText" name="autreText" placeholder="Décrivez la mission">
        </div>
    `;
}

// Fonction pour générer les champs destination/km
function generateDestinationFields() {
    return `
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
    `;
}

// Fonction pour générer le champ carburant
function generateFuelField() {
    return `
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
    `;
}



// fonction waze

function openWaze(destination) {
    if (!destination) {
        showNotification('Aucune destination trouvée', 'error');
        return;
    }
    
    const address = encodeURIComponent(destination);
    const wazeApp = `waze://?q=${address}&navigate=yes`;
    const wazeWeb = `https://www.waze.com/ul?q=${address}&navigate=yes`;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = wazeApp;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
            if (document.hasFocus()) {
                window.open(wazeWeb, '_blank');
            }
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        }, 2000);
    } else {
        window.open(wazeWeb, '_blank');
    }
    
    showNotification(`Navigation lancée vers ${destination}`, 'success');
}




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

function showVehicleDetails(vehicle) {
    const noSelection = document.getElementById('noSelection');
    const vehicleDetails = document.getElementById('vehicleDetails');
    
    if (noSelection) noSelection.style.display = 'none';
    if (vehicleDetails) {
        vehicleDetails.style.display = 'block';
        vehicleDetails.innerHTML = generateVehicleDetailsHTML(vehicle);
        // Mettre à jour l'aperçu des photos après génération du HTML
        setTimeout(() => updatePhotosPreview(), 100);
    }
}

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

function calculateConsommation(niveauDepart, niveauArrivee, pleinEffectue) {
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

function updateMissionsList() {
    const missionsList = document.getElementById('missionsList');
    if (missionsList) {
        missionsList.innerHTML = generateUserMissionsList();
    }
}

// ========================================
// FONCTIONS D'EXPORT PDF
// ========================================

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
        const filename = `missions_${currentUser.prenom}_${new Date().toISOString().split('T')[0]}.pdf`;

        const response = await fetch('/api/missions/export-pdf', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html_content: htmlContent, filename: filename })
        });

        if (!response.ok) throw new Error('Erreur lors de la génération du PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
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
            <title>Rapport de Missions - ${currentUser.prenom}</title>
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
                    <strong>${currentUser.prenom}</strong><br>
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

window.addEventListener('resize', () => {
    if (window.innerWidth > 1200) {
        closeMobileModal();
        closeMissionsModal();
        if (selectedVehicle) {
            showVehicleDetails(selectedVehicle);
        }
    }
});

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
        const userLoaded = await fetchCurrentUser();
        if (!userLoaded) {
            console.error('Impossible de charger les données utilisateur');
            return;
        }
        
        const [vehiclesLoaded, missionsLoaded] = await Promise.all([
            loadVehicles(),
            loadUserMissions()
        ]);
        
        if (!vehiclesLoaded) {
            console.error('Impossible de charger les véhicules');
        }
        
        generateVehicleList();
        updateMissionsList();

        const noSelection = document.getElementById('noSelection');
        const details = document.getElementById('vehicleDetails');
        
        if (noSelection) noSelection.style.display = 'block';
        if (details) details.style.display = 'none';

        console.log(`👤 Utilisateur connecté: ${currentUser?.prenom}`);
        console.log(`🚗 ${vehicles.length} véhicules chargés`);
        console.log(`🎯 ${activeMissions.length} missions actives`);
        console.log(`✅ ${completedMissions.length} missions terminées`);
        
     } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
});


// passer voalnt 


// ========================================
// FONCTION POUR NAVIGUER VERS PASSER LE VOLANT
// ========================================

function goToPasserVolant() {
    window.location.href = '/passer_volant';
}

// ========================================
// FONCTION POUR AJOUTER LE BOUTON AU CENTRE DE CONTRÔLE (DESKTOP)
// ========================================

function addPasserVolantButton() {
    // Trouver le titre du Centre de Contrôle
    const centreControleTitle = document.querySelector('.details-section .card-title');
    
    if (centreControleTitle && !document.querySelector('.btn-passer-volant-header')) {
        // Créer le conteneur header avec le bouton
        const headerContainer = document.createElement('div');
        headerContainer.className = 'card-header-with-button';
        headerContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        `;
        
        // Créer le bouton
        const passerVolantBtn = document.createElement('a');
        passerVolantBtn.href = '/passer_volant';
        passerVolantBtn.className = 'btn-passer-volant-header';
        passerVolantBtn.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 500;
            font-size: 14px;
            padding: 10px 16px;
            border-radius: 20px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            white-space: nowrap;
        `;
        
        passerVolantBtn.innerHTML = `
            <span class="icon" style="display: flex; align-items: center;">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                    <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8z"/>
                    <path d="M9 9h6v6H9z"/>
                    <path d="m5.64 7.05 1.42 1.42L5.64 9.89l-1.42-1.42 1.42-1.42zM18.36 16.95l-1.42-1.42 1.42-1.42 1.42 1.42-1.42 1.42z"/>
                </svg>
            </span>
            Passer le Volant
        `;
        
        // Ajouter les effets hover
        passerVolantBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 18px rgba(102, 126, 234, 0.4)';
            this.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6b42a0 100%)';
        });
        
        passerVolantBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        });
        
        // Réorganiser la structure
        const parent = centreControleTitle.parentNode;
        centreControleTitle.style.marginBottom = '0';
        
        // Insérer le nouveau container avant le titre
        parent.insertBefore(headerContainer, centreControleTitle);
        
        // Déplacer le titre dans le container
        headerContainer.appendChild(centreControleTitle);
        
        // Ajouter le bouton
        headerContainer.appendChild(passerVolantBtn);
    }
}

// ========================================
// MODIFICATION DE LA FONCTION openMobileModal POUR AJOUTER LE BOUTON
// ========================================

function openMobileModal(vehicle) {
    const modal = document.getElementById('mobileModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    modalTitle.textContent = `🎯 ${vehicle.nom}`;
    modalBody.innerHTML = generateVehicleDetailsHTML(vehicle);
    
    // AJOUTER LE BOUTON PASSER LE VOLANT EN HAUT DU MODAL
    const passerVolantSection = document.createElement('div');
    passerVolantSection.style.cssText = `
        text-align: center;
        margin-bottom: 20px;
        padding: 15px;
        background: linear-gradient(135deg, #f8faff 0%, #e0f2fe 100%);
        border-radius: 10px;
        border: 1px solid #bae6fd;
    `;
    
    const passerVolantBtn = document.createElement('a');
    passerVolantBtn.href = '/passer_volant';
    passerVolantBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        text-decoration: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        font-size: 16px;
        padding: 12px 24px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
        width: 100%;
        max-width: 280px;
    `;
    
    passerVolantBtn.innerHTML = `
        <span style="display: flex; align-items: center;">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8z"/>
                <path d="M9 9h6v6H9z"/>
                <path d="m5.64 7.05 1.42 1.42L5.64 9.89l-1.42-1.42 1.42-1.42zM18.36 16.95l-1.42-1.42 1.42-1.42 1.42 1.42-1.42 1.42z"/>
            </svg>
        </span>
        Passer le Volant
    `;
    
    passerVolantSection.appendChild(passerVolantBtn);
    modalBody.insertBefore(passerVolantSection, modalBody.firstChild);
    
    // Ajouter le bouton pour voir les missions à la fin
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

// ========================================
// MODIFICATION DE LA FONCTION openMissionsModal POUR AJOUTER LE BOUTON
// ========================================

function openMissionsModal() {
    const modal = document.getElementById('missionsModal');
    const missionsList = document.getElementById('modalMissionsList');
    
    if (!modal || !missionsList) return;
    
    // Ajouter le bouton Passer le Volant en haut des missions
    let missionsContent = `
        <div style="text-align: center; margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #f8faff 0%, #e0f2fe 100%); border-radius: 10px; border: 1px solid #bae6fd;">
            <a href="/passer_volant" style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                text-decoration: none;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: 600;
                font-size: 16px;
                padding: 12px 24px;
                border-radius: 25px;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                transition: all 0.3s ease;
                width: 100%;
                max-width: 280px;
            ">
                <span style="display: flex; align-items: center;">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                        <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8z"/>
                        <path d="M9 9h6v6H9z"/>
                        <path d="m5.64 7.05 1.42 1.42L5.64 9.89l-1.42-1.42 1.42-1.42zM18.36 16.95l-1.42-1.42 1.42-1.42 1.42 1.42-1.42 1.42z"/>
                    </svg>
                </span>
                Passer le Volant
            </a>
        </div>
    `;
    
    missionsContent += generateUserMissionsList();
    missionsList.innerHTML = missionsContent;
    
    modal.style.display = 'block';
}

// ========================================
// MODIFICATION DE L'INITIALISATION
// ========================================

document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚗 DriveGo - Initialisation de la page véhicules...');
    
    try {
        const userLoaded = await fetchCurrentUser();
        if (!userLoaded) {
            console.error('Impossible de charger les données utilisateur');
            return;
        }
        
        const [vehiclesLoaded, missionsLoaded] = await Promise.all([
            loadVehicles(),
            loadUserMissions()
        ]);
        
        if (!vehiclesLoaded) {
            console.error('Impossible de charger les véhicules');
        }
        
        generateVehicleList();
        updateMissionsList();
        
        // AJOUTER LE BOUTON PASSER LE VOLANT (DESKTOP UNIQUEMENT)
        addPasserVolantButton();

        const noSelection = document.getElementById('noSelection');
        const details = document.getElementById('vehicleDetails');
        
        if (noSelection) noSelection.style.display = 'block';
        if (details) details.style.display = 'none';

        console.log(`👤 Utilisateur connecté: ${currentUser?.prenom}`);
        console.log(`🚗 ${vehicles.length} véhicules chargés`);
        console.log(`🎯 ${activeMissions.length} missions actives`);
        console.log(`✅ ${completedMissions.length} missions terminées`);
        
     } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
});




// ========================================
// EXPOSER LES FONCTIONS GLOBALEMENT
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
window.takePhoto = takePhoto;
window.clearPhotos = clearPhotos;
window.removePhoto = removePhoto;
window.goToPasserVolant = goToPasserVolant;
window.addPasserVolantButton = addPasserVolantButton;
window.openWaze = openWaze;