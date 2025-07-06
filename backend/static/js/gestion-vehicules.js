// Données des véhicules avec statuts de mission
const vehicles = [
    {
        id: 1,
        nom: "TRAFIC BLANC",
        immatriculation: "FV-088-JJ",
        dateImmatriculation: "26/11/2020",
        controle: "29/10/2024",
        prochainControle: "28/10/2026",
        finValidite: "30/09/2026",
        numeroCarte: "4985080",
        status: "disponible"
    },
    {
        id: 2,
        nom: "TRAFIC PMR",
        immatriculation: "GT-176-AF",
        dateImmatriculation: "14/12/2023",
        controle: "",
        prochainControle: "14/12/2027",
        finValidite: "30/06/2029",
        numeroCarte: "8954319",
        status: "disponible"
    },
    {
        id: 3,
        nom: "TRAFIC VERT",
        immatriculation: "EJ-374-TT",
        dateImmatriculation: "02/02/2017",
        controle: "12/03/2025",
        prochainControle: "11/03/2027",
        finValidite: "30/09/2026",
        numeroCarte: "4985081",
        status: "disponible"
    },
    {
        id: 4,
        nom: "TRAFIC ROUGE",
        immatriculation: "CW-819-FR",
        dateImmatriculation: "26/06/2013",
        controle: "27/01/2025",
        prochainControle: "26/01/2027",
        finValidite: "30/09/2026",
        numeroCarte: "4985082",
        status: "disponible"
    },
    {
        id: 5,
        nom: "KANGOO",
        immatriculation: "DS-429-PF",
        dateImmatriculation: "22/06/2015",
        controle: "29/01/2025",
        prochainControle: "28/01/2027",
        finValidite: "30/09/2026",
        numeroCarte: "4985084",
        status: "disponible"
    }
];

let selectedVehicle = null;
let missions = [];
let activeMissions = {};
let missionTimers = {};

// Fonctions utilitaires
function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function getStatusInfo(dateStr) {
    if (!dateStr) return { class: 'unknown', text: 'Non renseigné' };

    const today = new Date();
    const checkDate = parseDate(dateStr);
    const diffTime = checkDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { class: 'expired', text: `Expiré depuis ${Math.abs(diffDays)} jours` };
    if (diffDays < 30) return { class: 'warning', text: `Expire dans ${diffDays} jours` };
    if (diffDays < 90) return { class: 'caution', text: `Expire dans ${diffDays} jours` };
    return { class: 'good', text: `${diffDays} jours restants` };
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Génération de la liste des véhicules
function generateVehicleList() {
    const vehicleList = document.getElementById('vehicleList');
    vehicleList.innerHTML = '';

    vehicles.forEach(vehicle => {
        const status = getStatusInfo(vehicle.controle);
        const isInMission = activeMissions[vehicle.id];

        // Récupération du nom du conducteur en mission
        let driverName = '';
        if (isInMission && activeMissions[vehicle.id].nom) {
            driverName = activeMissions[vehicle.id].nom;
        }

        const vehicleItem = document.createElement('div');
        vehicleItem.className = `vehicle-item ${isInMission ? 'in-mission' : ''}`;

        vehicleItem.onclick = () => selectVehicle(vehicle);

        vehicleItem.innerHTML = `
            <div class="vehicle-header">
                <div>
                    <div class="vehicle-name">${vehicle.nom}</div>
                    <div class="vehicle-plate">${vehicle.immatriculation}</div>
                    ${isInMission && driverName ? `<div class="driver-name">👤 ${driverName}</div>` : ''}
                </div>
                <div class="status ${isInMission ? 'mission' : 'available'}">
                    ${isInMission ? '🚗 En mission' : '✅ Disponible'}
                </div>
            </div>
            ${isInMission ? '<div class="mission-badge">🎯</div>' : ''}
        `;

        vehicleList.appendChild(vehicleItem);
    });
}

// Sélection d'un véhicule
function selectVehicle(vehicle) {
    selectedVehicle = vehicle;

    // Mise à jour de l'affichage de la liste
    const vehicleItems = document.querySelectorAll('.vehicle-item');
    vehicleItems.forEach((item, index) => {
        if (index === vehicle.id - 1) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });

    // Affichage des détails
    showVehicleDetails(vehicle);
}

// Affichage des détails du véhicule
function showVehicleDetails(vehicle) {
    document.getElementById('noSelection').style.display = 'none';
    document.getElementById('vehicleDetails').style.display = 'block';

    const isInMission = activeMissions[vehicle.id];

    let missionControlHTML = '';

    if (isInMission) {
        const mission = activeMissions[vehicle.id];
        const progress = (mission.elapsedTime / mission.totalTime) * 100;

        missionControlHTML = `
            <div class="mission-active">
                <h4>🎯 Mission en cours</h4>
                <div class="mission-info">
                    <div class="mission-info-item">
                        <div class="mission-info-label">Conducteur</div>
                        <div class="mission-info-value">👤 ${mission.nom}</div>
                    </div>
                    <div class="mission-info-item">
                        <div class="mission-info-label">Date</div>
                        <div class="mission-info-value">${mission.missionDate}</div>
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
                                       placeholder="Ex: 45280" min="${mission.kmDepart}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="notes">📝 Notes / Observations (optionnel)</label>
                            <textarea id="notes" name="notes" rows="3" 
                                      placeholder="Remarques, incidents, observations..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-danger">
                            ⏹️ Terminer la mission
                        </button>
                    </form>
                </div>
            </div>
        `;
    } else {
        missionControlHTML = `
            <div class="mission-control">
                <h4>🚀 Nouvelle Mission</h4>
                <form onsubmit="startMission(event, ${vehicle.id})">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="nom">Nom du conducteur</label>
                            <input type="text" id="nom" name="nom" required placeholder="Entrez votre nom complet">
                        </div>
                        
                        <div class="form-group">
                            <label for="missionDate">📅 Date de mission</label>
                            <input type="date" id="missionDate" name="missionDate" 
                                   value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="departureTime">🕐 Heure de départ</label>
                            <input type="time" id="departureTime" name="departureTime" 
                                   value="${new Date().toTimeString().slice(0, 5)}" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="missionNature">📋 Nature de la mission</label>
                        <select id="missionNature" name="missionNature" required>
                            <option value="">Sélectionner le type de mission</option>
                            <option value="transport-personnel">Transport de personnel</option>
                            <option value="livraison">Livraison</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="urgence">Mission d'urgence</option>
                            <option value="formation">Formation/Conduite</option>
                            <option value="autre">Autre</option>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="destination">📍 Destination</label>
                            <input type="text" id="destination" name="destination" 
                                   placeholder="Ex: Centre-ville, Aéroport..." required>
                        </div>
                        <div class="form-group">
                            <label for="passengers">👥 Nombre de passagers</label>
                            <input type="number" id="passengers" name="passengers" 
                                   placeholder="2" min="0" max="8" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="kmDepart">🛣️ Kilométrage de départ</label>
                        <input type="number" id="kmDepart" name="kmDepart" 
                               placeholder="Ex: 45230" min="0" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        ▶️ Démarrer la mission
                    </button>
                </form>
            </div>
        `;
    }

    document.getElementById('vehicleDetails').innerHTML = `
        <div class="vehicle-header-detail">
            <h3>${vehicle.nom}</h3>
            <p>${vehicle.immatriculation}</p>
        </div>

        ${missionControlHTML}
    `;
}

// Démarrer une mission
function startMission(event, vehicleId) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const nom = formData.get('nom');
    const missionDate = formData.get('missionDate');
    const departureTime = formData.get('departureTime');
    const missionNature = formData.get('missionNature');
    const destination = formData.get('destination');
    const passengers = parseInt(formData.get('passengers'));
    const kmDepart = parseInt(formData.get('kmDepart'));

    const mission = {
        id: Date.now(),
        vehicleId: vehicleId,
        vehicleName: vehicles.find(v => v.id === vehicleId).nom,
        nom: nom,
        missionDate: missionDate,
        departureTime: departureTime,
        missionNature: missionNature,
        destination: destination,
        passengers: passengers,
        kmDepart: kmDepart,
        status: 'active',
        startTime: new Date()
    };

    // Ajouter à la liste des missions actives
    activeMissions[vehicleId] = mission;

    // Ajouter à l'historique
    missions.push(mission);

    // Mettre à jour l'affichage
    generateVehicleList();
    showVehicleDetails(selectedVehicle);
    updateMissionsList();
}

// Terminer une mission avec détails
function endMissionWithDetails(event, vehicleId) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const arrivalTime = formData.get('arrivalTime');
    const kmArrivee = parseInt(formData.get('kmArrivee'));
    const notes = formData.get('notes');

    if (activeMissions[vehicleId]) {
        const mission = activeMissions[vehicleId];

        // Calculer la distance parcourue
        const distanceParcourue = kmArrivee - mission.kmDepart;

        // Mettre à jour la mission
        mission.status = 'completed';
        mission.arrivalTime = arrivalTime;
        mission.kmArrivee = kmArrivee;
        mission.distanceParcourue = distanceParcourue;
        mission.notes = notes;
        mission.endTime = new Date();

        // Retirer de la liste des missions actives
        delete activeMissions[vehicleId];

        // Mettre à jour l'affichage
        generateVehicleList();
        if (selectedVehicle && selectedVehicle.id === vehicleId) {
            showVehicleDetails(selectedVehicle);
        }
        updateMissionsList();

        // Afficher confirmation
        alert(`Mission terminée !\nDistance parcourue: ${distanceParcourue} km\nDurée: ${mission.departureTime} - ${arrivalTime}`);
    }
}

// Terminer une mission
function endMission(vehicleId, autoComplete = false) {
    if (activeMissions[vehicleId]) {
        const mission = activeMissions[vehicleId];
        mission.status = 'completed';
        mission.endTime = new Date();
        mission.completed = autoComplete ? 'Terminée automatiquement' : 'Terminée manuellement';

        // Arrêter le timer
        if (missionTimers[vehicleId]) {
            clearInterval(missionTimers[vehicleId]);
            delete missionTimers[vehicleId];
        }

        // Retirer de la liste des missions actives
        delete activeMissions[vehicleId];

        // Mettre à jour l'affichage
        generateVehicleList();
        if (selectedVehicle && selectedVehicle.id === vehicleId) {
            showVehicleDetails(selectedVehicle);
        }
        updateMissionsList();
    }
}

// Mettre à jour la liste des missions
function updateMissionsList() {
    const missionsList = document.getElementById('missionsList');

    if (missions.length === 0) {
        missionsList.innerHTML = `
            <p style="text-align: center; color: #6b7280; padding: 40px;">
                Aucune mission enregistrée
            </p>
        `;
        return;
    }

    const sortedMissions = [...missions].sort((a, b) => b.startTime - a.startTime);

    missionsList.innerHTML = sortedMissions.map(mission => `
        <div class="mission-item ${mission.status}">
            <div class="mission-header">
                <div class="mission-destination">${mission.destination}</div>
                <div class="mission-status ${mission.status}">
                    ${mission.status === 'active' ? '🟡 En cours' : '✅ Terminée'}
                </div>
            </div>
            <div class="mission-details">
                <div>🚗 ${mission.vehicleName}</div>
                <div>👤 ${mission.nom}</div>
                <div>📅 ${mission.missionDate}</div>
                <div>📋 ${mission.missionNature}</div>
                <div>👥 ${mission.passengers} passagers</div>
                <div>🕐 ${mission.departureTime}${mission.arrivalTime ? ' - ' + mission.arrivalTime : ''}</div>
                <div>🛣️ Départ: ${mission.kmDepart} km</div>
                ${mission.kmArrivee ? `<div>🏁 Arrivée: ${mission.kmArrivee} km</div>` : ''}
                ${mission.distanceParcourue ? `<div>📏 Distance: ${mission.distanceParcourue} km</div>` : ''}
                ${mission.notes ? `<div>📝 ${mission.notes}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// Initialisation
document.addEventListener('DOMContentLoaded', function () {
    generateVehicleList();
    updateMissionsList();
});