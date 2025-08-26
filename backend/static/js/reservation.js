// === SYSTÈME DE SYNCHRONISATION AVEC BASE DE DONNÉES ===
class DriveGoDataManager {
    constructor() {
        this.apiEndpoint = '/api';
        this.listeners = [];
        this.vehicles = [];
        this.reservations = [];
        this.lastSync = null;
        this.isOnline = navigator.onLine;
        
        // Initialiser les écouteurs de connectivité
        this.setupConnectivityListeners();
        
        // Charger les données au démarrage
        this.initializeData();
    }
    
    setupConnectivityListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('📡 Connexion rétablie - Synchronisation...');
            this.syncWithServer();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Mode hors ligne activé');
            this.showMessage('Mode hors ligne - Les modifications seront synchronisées à la reconnexion', 'warning');
        });
    }
    
    async initializeData() {
        try {
            console.log('🔄 Initialisation des données...');
            
            if (this.isOnline) {
                // Charger depuis le serveur
                await this.loadFromServer();
            } else {
                // Charger depuis le cache local
                this.loadFromCache();
            }
            
            // Programmer une synchronisation périodique
            this.startPeriodicSync();
            
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
            this.loadFromCache(); // Fallback sur le cache
        }
    }
    
    async loadFromServer() {
        try {
            // Charger les véhicules
            const vehiclesResponse = await fetch(`${this.apiEndpoint}/vehicules`);
            if (vehiclesResponse.ok) {
                const vehiclesData = await vehiclesResponse.json();
                this.vehicles = this.transformVehiclesFromAPI(vehiclesData.vehicules || []);
            }
            
            // Charger les réservations
            const reservationsResponse = await fetch(`${this.apiEndpoint}/reservations`);
            if (reservationsResponse.ok) {
                const reservationsData = await reservationsResponse.json();
                this.reservations = reservationsData.reservations || [];
                this.applyReservationsToVehicles();
            }
            
            this.lastSync = new Date().toISOString();
            this.saveToCache();
            
            console.log('✅ Données chargées depuis le serveur');
            this.notifyListeners('dataChanged', { vehicles: this.vehicles, reservations: this.reservations });
            
        } catch (error) {
            console.error('❌ Erreur chargement serveur:', error);
            throw error;
        }
    }
    
    loadFromCache() {
        try {
            const cached = localStorage.getItem('drivego_cache');
            if (cached) {
                const data = JSON.parse(cached);
                this.vehicles = data.vehicles || [];
                this.reservations = data.reservations || [];
                this.lastSync = data.lastSync;
                console.log('📦 Données chargées depuis le cache');
            } else {
                // Données par défaut si pas de cache
                this.setDefaultData();
            }
            
            this.notifyListeners('dataChanged', { vehicles: this.vehicles, reservations: this.reservations });
            
        } catch (error) {
            console.error('❌ Erreur chargement cache:', error);
            this.setDefaultData();
        }
    }
    
    saveToCache() {
        try {
            const cacheData = {
                vehicles: this.vehicles,
                reservations: this.reservations,
                lastSync: this.lastSync
            };
            localStorage.setItem('drivego_cache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde cache:', error);
        }
    }
    
    setDefaultData() {
        this.vehicles = [
            {
                id: 1,
                name: "TRAFIC BLANC",
                type: "🚐",
                immatriculation: "FV-088-JJ",
                dateImmatriculation: "26/11/2020",
                controletech: "29/10/2024",
                prochainControle: "28/10/2026",
                finValidite: "30/09/2026",
                carteStationnement: "4985080",
                status: "available"
            },
            {
                id: 2,
                name: "TRAFIC PMR",
                type: "♿",
                immatriculation: "GT-176-AF",
                dateImmatriculation: "14/12/2023",
                controletech: "",
                prochainControle: "14/12/2027",
                finValidite: "30/06/2029",
                carteStationnement: "8954319",
                status: "available"
            },
            {
                id: 3,
                name: "TRAFIC VERT",
                type: "🚐",
                immatriculation: "EJ-374-TT",
                dateImmatriculation: "02/02/2017",
                controletech: "12/03/2025",
                prochainControle: "11/03/2027",
                finValidite: "30/09/2026",
                carteStationnement: "4985081",
                status: "available"
            },
            {
                id: 4,
                name: "TRAFIC ROUGE",
                type: "🚐",
                immatriculation: "CW-819-FR",
                dateImmatriculation: "26/06/2013",
                controletech: "27/01/2025",
                prochainControle: "26/01/2027",
                finValidite: "30/09/2026",
                carteStationnement: "4985082",
                status: "maintenance"
            },
            {
                id: 5,
                name: "KANGOO",
                type: "🏎️",
                immatriculation: "DS-429-PF",
                dateImmatriculation: "22/06/2015",
                controletech: "29/01/2025",
                prochainControle: "28/01/2027",
                finValidite: "30/09/2026",
                carteStationnement: "4985084",
                status: "available"
            }
        ];
        
        this.reservations = [];
        this.lastSync = new Date().toISOString();
    }
    
    transformVehiclesFromAPI(apiVehicles) {
        return apiVehicles.map(v => ({
            id: v.id,
            name: v.nom,
            type: this.getVehicleTypeIcon(v.nom),
            immatriculation: v.immatriculation,
            dateImmatriculation: v.date_immatriculation,
            controletech: v.controle || "",
            prochainControle: v.prochain_controle,
            finValidite: v.fin_validite,
            carteStationnement: v.numero_carte,
            status: v.disponible ? "available" : "maintenance"
        }));
    }
    
    getVehicleTypeIcon(nom) {
        const nomLower = nom.toLowerCase();
        if (nomLower.includes('pmr')) return '♿';
        if (nomLower.includes('kangoo')) return '🏎️';
        return '🚐';
    }
    
    applyReservationsToVehicles() {
        // Réinitialiser le statut des véhicules
        this.vehicles.forEach(v => {
            if (v.status === 'reserved') {
                v.status = 'available';
                delete v.reservedBy;
                delete v.reservationDate;
                delete v.reservationTime;
                delete v.reservationId;
            }
        });
        
        // Appliquer les réservations actives
        const activeReservations = this.reservations.filter(r => 
            r.statut === 'en_attente' || r.statut === 'confirmee'
        );
        
        activeReservations.forEach(reservation => {
            const vehicle = this.vehicles.find(v => v.id === reservation.vehicule_id);
            if (vehicle) {
                vehicle.status = 'reserved';
                vehicle.reservedBy = `${reservation.user_prenom} ${reservation.user_nom}`;
                vehicle.reservationDate = this.formatDate(reservation.date_debut);
                vehicle.reservationTime = `${reservation.date_debut} - ${reservation.date_fin}`;
                vehicle.reservationId = `RES-${reservation.id}`;
            }
        });
    }
    
    async addReservation(reservation) {
        try {
            if (this.isOnline) {
                // Envoyer au serveur
                const response = await fetch(`${this.apiEndpoint}/reservations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        vehicule_id: reservation.vehicleId,
                        date_debut: reservation.date,
                        date_fin: reservation.date, // Pour l'instant même jour
                        notes: `Horaire: ${reservation.horaire} - Conducteur: ${reservation.conducteur}`
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Erreur serveur');
                }
                
                const result = await response.json();
                
                // Recharger les données depuis le serveur
                await this.loadFromServer();
                
                console.log('✅ Réservation créée sur le serveur');
                return result;
                
            } else {
                // Mode hors ligne - stocker localement
                return this.addReservationOffline(reservation);
            }
            
        } catch (error) {
            console.error('❌ Erreur création réservation:', error);
            
            // Fallback en mode hors ligne
            if (this.isOnline) {
                this.showMessage('Erreur serveur - Passage en mode hors ligne', 'warning');
            }
            
            return this.addReservationOffline(reservation);
        }
    }
    
    addReservationOffline(reservation) {
        // Ajouter à la liste locale
        const localReservation = {
            id: Date.now(),
            vehicule_id: reservation.vehicleId,
            user_prenom: reservation.conducteur.split(' ')[0] || '',
            user_nom: reservation.conducteur.split(' ').slice(1).join(' ') || '',
            date_debut: reservation.date,
            date_fin: reservation.date,
            statut: 'en_attente',
            notes: `Horaire: ${reservation.horaire}`,
            _offline: true // Marqueur pour sync ultérieure
        };
        
        this.reservations.push(localReservation);
        this.applyReservationsToVehicles();
        this.saveToCache();
        
        this.notifyListeners('dataChanged', { vehicles: this.vehicles, reservations: this.reservations });
        
        return localReservation;
    }
    
    async cancelReservation(reservationId) {
        try {
            // Extraire l'ID numérique si c'est un ID formaté
            const numericId = reservationId.replace('RES-', '');
            
            if (this.isOnline) {
                const response = await fetch(`${this.apiEndpoint}/reservations/${numericId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    await this.loadFromServer();
                    console.log('✅ Réservation annulée sur le serveur');
                    return true;
                }
            }
            
            // Fallback local
            const reservationIndex = this.reservations.findIndex(r => 
                r.id == numericId || `RES-${r.id}` === reservationId
            );
            
            if (reservationIndex !== -1) {
                this.reservations.splice(reservationIndex, 1);
                this.applyReservationsToVehicles();
                this.saveToCache();
                
                this.notifyListeners('dataChanged', { vehicles: this.vehicles, reservations: this.reservations });
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erreur annulation:', error);
            return false;
        }
    }
    
    async syncWithServer() {
        if (!this.isOnline) return;
        
        try {
            console.log('🔄 Synchronisation avec le serveur...');
            
            // Envoyer les réservations hors ligne
            const offlineReservations = this.reservations.filter(r => r._offline);
            
            for (const reservation of offlineReservations) {
                try {
                    const response = await fetch(`${this.apiEndpoint}/reservations`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            vehicule_id: reservation.vehicule_id,
                            date_debut: reservation.date_debut,
                            date_fin: reservation.date_fin,
                            notes: reservation.notes
                        })
                    });
                    
                    if (response.ok) {
                        // Marquer comme synchronisé
                        reservation._offline = false;
                    }
                } catch (syncError) {
                    console.warn('⚠️ Erreur sync réservation:', syncError);
                }
            }
            
            // Recharger toutes les données
            await this.loadFromServer();
            
            this.showMessage('✅ Synchronisation réussie', 'success');
            
        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
        }
    }
    
    startPeriodicSync() {
        // Synchroniser toutes les 30 secondes si en ligne
        setInterval(() => {
            if (this.isOnline) {
                this.syncWithServer();
            }
        }, 30000);
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }
    
    showMessage(message, type) {
        // Déléguer à la fonction globale
        if (typeof showMessage === 'function') {
            showMessage(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    getVehicles() {
        return this.vehicles;
    }
    
    getReservations() {
        return this.reservations;
    }
    
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    notifyListeners(event, data) {
        this.listeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (error) {
                console.error('❌ Erreur listener:', error);
            }
        });
    }
}

// === FONCTIONS UTILITAIRES (inchangées) ===
function getStatusText(status) {
    switch(status) {
        case 'available': return 'Disponible';
        case 'reserved': return 'Réservé';
        case 'maintenance': return 'Maintenance';
        default: return status;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function showMessage(message, type) {
    const confirmationDiv = document.getElementById('confirmation');
    if (!confirmationDiv) return;
    
    const typeClass = type === 'success' ? 'confirmation' : type;
    confirmationDiv.innerHTML = `<div class="${typeClass}">${message}</div>`;
    
    confirmationDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
        confirmationDiv.innerHTML = '';
    }, 7000);
}

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = ['date', 'date-mobile'];
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.min = today;
            if (!input.value) {
                input.value = today;
            }
        }
    });
}

// === AFFICHAGE ET GESTION UI ===
let dataManager;
let vehicles = [];

function displayVehiclesStatus() {
    const container = document.getElementById('vehicles-status');
    if (!container) return;
    
    vehicles = dataManager.getVehicles();
    
    container.innerHTML = vehicles.map(vehicle => {
        const statusClass = `status-${vehicle.status}`;
        const statusText = getStatusText(vehicle.status);
        
        let reservationInfo = '';
        if (vehicle.status === 'reserved' && vehicle.reservedBy) {
            reservationInfo = `
                <div class="reserved-by">
                    <strong>👤 Réservé par:</strong> ${vehicle.reservedBy}<br>
                    <strong>📅 Date:</strong> ${vehicle.reservationDate}<br>
                    <strong>🕐 Horaire:</strong> ${vehicle.reservationTime}<br>
                    <strong>🆔 ID:</strong> ${vehicle.reservationId}
                </div>
            `;
        }

        return `
            <div class="vehicle-item" onclick="selectVehicleOnMobile(${vehicle.id})">
                <div class="vehicle-header">
                    <div class="vehicle-name">${vehicle.type} ${vehicle.name}</div>
                    <div class="status-badge ${statusClass}">${statusText}</div>
                </div>
                <div class="vehicle-info">
                    <strong>📋 Immatriculation:</strong> ${vehicle.immatriculation}
                </div>
                ${reservationInfo}
            </div>
        `;
    }).join('');
    
    console.log('📊 Affichage mis à jour - Véhicules:', vehicles.length);
}

function populateVehicleSelect() {
    const selects = ['vehicule', 'vehicule-mobile'];
    
    vehicles = dataManager.getVehicles();
    const availableVehicles = vehicles.filter(v => v.status === 'available');
    
    console.log('🚗 Véhicules disponibles:', availableVehicles.length);
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Sélectionner un véhicule --</option>';
        
        if (availableVehicles.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '❌ Aucun véhicule disponible';
            option.disabled = true;
            select.appendChild(option);
        } else {
            availableVehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.type} ${vehicle.name} - ${vehicle.immatriculation}`;
                select.appendChild(option);
            });
        }
    });
}

// === GESTION MOBILE (inchangée) ===
function openMobileModal() {
    const modal = document.getElementById('mobile-modal');
    const backdrop = document.getElementById('modal-backdrop');
    
    populateVehicleSelect();
    setMinDate();
    
    modal.classList.add('show');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeMobileModal() {
    const modal = document.getElementById('mobile-modal');
    const backdrop = document.getElementById('modal-backdrop');
    
    modal.classList.remove('show');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
    
    const form = document.getElementById('form-reservation-mobile');
    if (form) form.reset();
    setMinDate();
}

function selectVehicleOnMobile(vehicleId) {
    if (window.innerWidth <= 767) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle && vehicle.status === 'available') {
            openMobileModal();
            setTimeout(() => {
                const select = document.getElementById('vehicule-mobile');
                if (select) select.value = vehicleId;
            }, 100);
        }
    }
}

// === CONFIRMATION RÉSERVATION (mise à jour) ===
function showLoadingState(formId, loading = true) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.btn-text');
    const loadingSpinner = button.querySelector('.loading');
    
    if (loading) {
        button.disabled = true;
        if (buttonText) buttonText.style.display = 'none';
        if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
    } else {
        button.disabled = false;
        if (buttonText) buttonText.style.display = 'inline-flex';
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

async function confirmReservation(event, isMobile = false) {
    event.preventDefault();
    
    const prefix = isMobile ? '-mobile' : '';
    const formId = isMobile ? 'form-reservation-mobile' : 'form-reservation';
    
    showLoadingState(formId, true);
    
    const nom = document.getElementById(`nom${prefix}`)?.value.trim();
    const date = document.getElementById(`date${prefix}`)?.value;
    const heureDepart = document.getElementById(`heure-depart${prefix}`)?.value;
    const heureArrivee = document.getElementById(`heure-arrivee${prefix}`)?.value;
    const vehiculeId = parseInt(document.getElementById(`vehicule${prefix}`)?.value);
    
    // Validation
    if (!nom || !date || !heureDepart || !heureArrivee || !vehiculeId) {
        showLoadingState(formId, false);
        showMessage('⚠️ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (heureDepart >= heureArrivee) {
        showLoadingState(formId, false);
        showMessage('⚠️ L\'heure d\'arrivée doit être postérieure à l\'heure de départ', 'error');
        return;
    }
    
    const vehicle = vehicles.find(v => v.id === vehiculeId);
    if (!vehicle || vehicle.status !== 'available') {
        showLoadingState(formId, false);
        showMessage('❌ Ce véhicule n\'est plus disponible', 'error');
        refreshData();
        return;
    }
    
    try {
        const reservation = {
            vehicleId: vehiculeId,
            conducteur: nom,
            date: date,
            horaire: `${heureDepart}-${heureArrivee}`
        };
        
        const result = await dataManager.addReservation(reservation);
        
        const reservationId = result.id ? `RES-${result.id}` : `RES-${Date.now()}`;
        
        showMessage(`
            <strong>✅ Réservation confirmée!</strong><br><br>
            <strong>🆔 ID:</strong> ${reservationId}<br>
            <strong>🚐 Véhicule:</strong> ${vehicle.type} ${vehicle.name}<br>
            <strong>👤 Conducteur:</strong> ${nom}<br>
            <strong>📅 Date:</strong> ${formatDate(date)}<br>
            <strong>🕐 Horaire:</strong> ${reservation.horaire}
        `, 'success');
        
        // Réinitialiser formulaire
        const form = document.getElementById(formId);
        if (form) form.reset();
        setMinDate();
        
        if (isMobile) {
            setTimeout(() => closeMobileModal(), 1500);
        }
        
        console.log('🎉 Réservation créée:', reservationId);
        
    } catch (error) {
        console.error('Erreur réservation:', error);
        showMessage('❌ Erreur lors de la réservation', 'error');
    } finally {
        showLoadingState(formId, false);
    }
}

// === GESTION RÉSERVATIONS (mise à jour) ===
async function annulerReservation() {
    const reservationId = document.getElementById('reservation-id')?.value.trim();
    if (!reservationId) {
        showMessage('⚠️ Veuillez entrer un identifiant de réservation', 'error');
        return;
    }
    
    const vehicle = vehicles.find(v => v.reservationId === reservationId);
    if (!vehicle) {
        showMessage('❌ Réservation non trouvée', 'error');
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir annuler la réservation ${reservationId} pour ${vehicle.reservedBy}?`)) {
        try {
            const success = await dataManager.cancelReservation(reservationId);
            
            if (success) {
                showMessage(`✅ Réservation ${reservationId} annulée avec succès`, 'success');
                document.getElementById('reservation-id').value = '';
            } else {
                showMessage('❌ Erreur lors de l\'annulation', 'error');
            }
        } catch (error) {
            console.error('Erreur annulation:', error);
            showMessage('❌ Erreur lors de l\'annulation', 'error');
        }
    }
}

function rechercherReservation() {
    const searchTerm = document.getElementById('search-reservation')?.value.toLowerCase().trim();
    if (!searchTerm) {
        showMessage('⚠️ Veuillez entrer un terme de recherche', 'error');
        return;
    }
    
    const results = vehicles.filter(v => 
        v.reservedBy && (
            v.reservedBy.toLowerCase().includes(searchTerm) ||
            v.name.toLowerCase().includes(searchTerm) ||
            v.immatriculation.toLowerCase().includes(searchTerm) ||
            (v.reservationId && v.reservationId.toLowerCase().includes(searchTerm))
        )
    );
    
    if (results.length === 0) {
        showMessage('❌ Aucune réservation trouvée', 'error');
    } else {
        const resultText = results.map(v => 
            `<strong>${v.reservationId}:</strong> ${v.reservedBy} - ${v.type} ${v.name} (${v.reservationDate} • ${v.reservationTime})`
        ).join('<br><br>');
        showMessage(`<strong>🔍 Réservations trouvées:</strong><br><br>${resultText}`, 'success');
    }
}

function refreshData() {
    console.log('🔄 Rafraîchissement...');
    displayVehiclesStatus();
    populateVehicleSelect();
}

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚗 DriveGo - Initialisation...');
    
    try {
        // Créer le gestionnaire de données
        dataManager = new DriveGoDataManager();
        window.DriveGoData = dataManager;
        
        // Attendre l'initialisation
        await new Promise(resolve => {
            if (dataManager.vehicles.length > 0) {
                resolve();
            } else {
                dataManager.addListener((event) => {
                    if (event === 'dataChanged') resolve();
                });
            }
        });
        
        vehicles = dataManager.getVehicles();
        
        // Initialiser l'affichage
        displayVehiclesStatus();
        populateVehicleSelect();
        setMinDate();
        
        // Event listeners
        const form = document.getElementById('form-reservation');
        const formMobile = document.getElementById('form-reservation-mobile');
        
        if (form) form.addEventListener('submit', (e) => confirmReservation(e, false));
        if (formMobile) formMobile.addEventListener('submit', (e) => confirmReservation(e, true));
        
        // Listener pour les changements de données
        dataManager.addListener((event, data) => {
            if (event === 'dataChanged') {
                vehicles = data.vehicles;
                displayVehiclesStatus();
                populateVehicleSelect();
            }
        });
        
        // Gestion clavier
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMobileModal();
            }
        });
        
        console.log('✅ DriveGo initialisé avec base de données');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        showMessage('⚠️ Erreur de connexion - Mode dégradé', 'error');
    }
});

// === DEBUG ===
window.DriveGoDebug = {
    showVehicles: () => console.table(vehicles),
    showReservations: () => console.table(dataManager.getReservations()),
    syncNow: () => dataManager.syncWithServer(),
    toggleOffline: () => {
        dataManager.isOnline = !dataManager.isOnline;
        console.log('Mode:', dataManager.isOnline ? 'En ligne' : 'Hors ligne');
    }
};

function goBack() {
    window.location.href = "/";  // redirige vers la page index
}