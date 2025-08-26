// === SYSTÈME UNIFIÉ DE GESTION DES DONNÉES DRIVEGO ===
class UnifiedDataManager {
    constructor() {
        this.apiEndpoint = '/api';
        this.listeners = [];
        this.currentUser = null;
        this.vehicles = [];
        this.reservations = [];
        this.missions = [];
        this.activeMissions = [];
        this.lastSync = null;
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        
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
                await this.loadFromServer();
            } else {
                this.loadFromCache();
            }
            
            this.startPeriodicSync();
            
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
            this.loadFromCache();
        }
    }
    
    async loadFromServer() {
        try {
            // Charger l'utilisateur actuel
            await this.loadCurrentUser();
            
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
            }
            
            // Charger les missions
            const missionsResponse = await fetch(`${this.apiEndpoint}/missions`);
            if (missionsResponse.ok) {
                const missionsData = await missionsResponse.json();
                this.missions = missionsData.missions || [];
            }
            
            // Charger les missions actives
            const activeMissionsResponse = await fetch(`${this.apiEndpoint}/missions/active`);
            if (activeMissionsResponse.ok) {
                const activeMissionsData = await activeMissionsResponse.json();
                this.activeMissions = activeMissionsData.activeMissions || [];
            }
            
            // Appliquer les statuts aux véhicules
            this.applyStatusToVehicles();
            
            this.lastSync = new Date().toISOString();
            this.saveToCache();
            
            console.log('✅ Données chargées depuis le serveur');
            this.notifyListeners('dataChanged', this.getAllData());
            
        } catch (error) {
            console.error('❌ Erreur chargement serveur:', error);
            throw error;
        }
    }
    
    async loadCurrentUser() {
        try {
            const response = await fetch(`${this.apiEndpoint}/user/current`);
            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData.user;
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger l\'utilisateur actuel:', error);
        }
    }
    
    loadFromCache() {
        try {
            const cached = localStorage.getItem('drivego_unified_cache');
            if (cached) {
                const data = JSON.parse(cached);
                this.currentUser = data.currentUser || null;
                this.vehicles = data.vehicles || [];
                this.reservations = data.reservations || [];
                this.missions = data.missions || [];
                this.activeMissions = data.activeMissions || [];
                this.lastSync = data.lastSync;
                console.log('📦 Données chargées depuis le cache');
            } else {
                this.setDefaultData();
            }
            
            this.applyStatusToVehicles();
            this.notifyListeners('dataChanged', this.getAllData());
            
        } catch (error) {
            console.error('❌ Erreur chargement cache:', error);
            this.setDefaultData();
        }
    }
    
    saveToCache() {
        try {
            const cacheData = {
                currentUser: this.currentUser,
                vehicles: this.vehicles,
                reservations: this.reservations,
                missions: this.missions,
                activeMissions: this.activeMissions,
                lastSync: this.lastSync
            };
            localStorage.setItem('drivego_unified_cache', JSON.stringify(cacheData));
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
        this.missions = [];
        this.activeMissions = [];
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
    
    applyStatusToVehicles() {
        // Réinitialiser le statut des véhicules
        this.vehicles.forEach(v => {
            if (v.status !== 'maintenance') {
                v.status = 'available';
                delete v.reservedBy;
                delete v.reservationDate;
                delete v.reservationTime;
                delete v.reservationId;
                delete v.missionBy;
                delete v.missionInfo;
            }
        });
        
        // Appliquer les missions actives (priorité sur les réservations)
        this.activeMissions.forEach(mission => {
            const vehicle = this.vehicles.find(v => v.id === mission.vehicule_id || v.id === mission.vehicleId);
            if (vehicle) {
                vehicle.status = 'mission';
                vehicle.missionBy = mission.nom || mission.user_nom;
                vehicle.missionInfo = {
                    id: mission.id,
                    destination: mission.destination,
                    departureTime: mission.departureTime || mission.heure_depart,
                    date: mission.missionDate || mission.date_mission
                };
            }
        });
        
        // Appliquer les réservations actives (seulement si pas de mission)
        const activeReservations = this.reservations.filter(r => 
            r.statut === 'en_attente' || r.statut === 'confirmee' || r.status === 'active'
        );
        
        activeReservations.forEach(reservation => {
            const vehicle = this.vehicles.find(v => v.id === (reservation.vehicule_id || reservation.vehicleId));
            if (vehicle && vehicle.status === 'available') {
                vehicle.status = 'reserved';
                vehicle.reservedBy = reservation.user_prenom ? 
                    `${reservation.user_prenom} ${reservation.user_nom}` : 
                    reservation.conducteur;
                vehicle.reservationDate = this.formatDate(reservation.date_debut || reservation.date);
                vehicle.reservationTime = reservation.horaire || 
                    `${reservation.heure_depart || ''} - ${reservation.heure_arrivee || ''}`;
                vehicle.reservationId = `RES-${reservation.id}`;
            }
        });
    }
    
    // === GESTION DES RÉSERVATIONS ===
    async addReservation(reservationData) {
        try {
            // Préparer les données avec l'utilisateur connecté
            const requestData = {
                vehicule_id: reservationData.vehicleId,
                date_debut: reservationData.date,
                date_fin: reservationData.date,
                heure_depart: reservationData.heureDepart,
                heure_arrivee: reservationData.heureArrivee,
                notes: `Conducteur: ${reservationData.conducteur}`,
                // Ajouter automatiquement les informations utilisateur si disponibles
                user_prenom: this.currentUser?.prenom || reservationData.conducteur.split(' ')[0] || '',
                user_nom: this.currentUser?.nom || reservationData.conducteur.split(' ').slice(1).join(' ') || ''
            };
            
            if (this.isOnline && !this.syncInProgress) {
                const response = await fetch(`${this.apiEndpoint}/reservations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Erreur serveur');
                }
                
                const result = await response.json();
                
                // Recharger toutes les données pour synchroniser
                await this.loadFromServer();
                
                console.log('✅ Réservation créée sur le serveur');
                return result;
                
            } else {
                // Mode hors ligne
                return this.addReservationOffline(requestData);
            }
            
        } catch (error) {
            console.error('❌ Erreur création réservation:', error);
            
            // Fallback en mode hors ligne
            if (this.isOnline) {
                this.showMessage('Erreur serveur - Passage en mode hors ligne', 'warning');
            }
            
            return this.addReservationOffline(reservationData);
        }
    }
    
    addReservationOffline(reservationData) {
        const localReservation = {
            id: Date.now(),
            vehicule_id: reservationData.vehicule_id || reservationData.vehicleId,
            user_prenom: reservationData.user_prenom || this.currentUser?.prenom || '',
            user_nom: reservationData.user_nom || this.currentUser?.nom || '',
            conducteur: reservationData.conducteur,
            date_debut: reservationData.date_debut || reservationData.date,
            date_fin: reservationData.date_fin || reservationData.date,
            heure_depart: reservationData.heure_depart || reservationData.heureDepart,
            heure_arrivee: reservationData.heure_arrivee || reservationData.heureArrivee,
            horaire: reservationData.horaire || `${reservationData.heureDepart || reservationData.heure_depart}-${reservationData.heureArrivee || reservationData.heure_arrivee}`,
            statut: 'en_attente',
            status: 'active',
            notes: reservationData.notes || '',
            _offline: true
        };
        
        this.reservations.push(localReservation);
        this.applyStatusToVehicles();
        this.saveToCache();
        
        this.notifyListeners('dataChanged', this.getAllData());
        this.notifyListeners('reservationAdded', localReservation);
        
        return localReservation;
    }
    
    async cancelReservation(reservationId) {
        try {
            const numericId = reservationId.replace('RES-', '');
            
            if (this.isOnline && !this.syncInProgress) {
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
                this.applyStatusToVehicles();
                this.saveToCache();
                
                this.notifyListeners('dataChanged', this.getAllData());
                this.notifyListeners('reservationCancelled', reservationId);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erreur annulation:', error);
            return false;
        }
    }
    
    // === GESTION DES MISSIONS ===
    async addMission(missionData) {
        try {
            const requestData = {
                vehicleId: missionData.vehicleId,
                missionDate: missionData.missionDate,
                departureTime: missionData.departureTime,
                missionNature: missionData.missionNature,
                destination: missionData.destination,
                passengers: missionData.passengers,
                kmDepart: missionData.kmDepart,
                // Ajouter automatiquement les informations utilisateur
                user_id: this.currentUser?.id,
                nom: this.currentUser ? `${this.currentUser.prenom} ${this.currentUser.nom}` : missionData.nom
            };
            
            if (this.isOnline && !this.syncInProgress) {
                const response = await fetch(`${this.apiEndpoint}/missions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Erreur serveur');
                }
                
                const result = await response.json();
                await this.loadFromServer();
                
                console.log('✅ Mission créée sur le serveur');
                return result;
                
            } else {
                return this.addMissionOffline(requestData);
            }
            
        } catch (error) {
            console.error('❌ Erreur création mission:', error);
            return this.addMissionOffline(missionData);
        }
    }
    
    addMissionOffline(missionData) {
        const localMission = {
            id: Date.now(),
            ...missionData,
            status: 'active',
            startTime: new Date().toISOString(),
            _offline: true
        };
        
        this.activeMissions.push(localMission);
        this.applyStatusToVehicles();
        this.saveToCache();
        
        this.notifyListeners('dataChanged', this.getAllData());
        this.notifyListeners('missionStarted', localMission);
        
        return localMission;
    }
    
    async endMission(missionId, endData) {
        try {
            if (this.isOnline && !this.syncInProgress) {
                const response = await fetch(`${this.apiEndpoint}/missions/${missionId}/end`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(endData)
                });
                
                if (response.ok) {
                    await this.loadFromServer();
                    console.log('✅ Mission terminée sur le serveur');
                    return true;
                }
            }
            
            // Fallback local
            const missionIndex = this.activeMissions.findIndex(m => m.id === missionId);
            if (missionIndex !== -1) {
                const mission = this.activeMissions[missionIndex];
                mission.status = 'completed';
                mission.endTime = new Date().toISOString();
                mission.arrivalTime = endData.arrivalTime;
                mission.kmArrivee = endData.kmArrivee;
                mission.notes = endData.notes;
                mission.distanceParcourue = endData.kmArrivee - mission.kmDepart;
                
                // Déplacer vers l'historique des missions
                this.missions.push(mission);
                this.activeMissions.splice(missionIndex, 1);
                
                this.applyStatusToVehicles();
                this.saveToCache();
                
                this.notifyListeners('dataChanged', this.getAllData());
                this.notifyListeners('missionEnded', mission);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erreur fin mission:', error);
            return false;
        }
    }
    
    // === SYNCHRONISATION ===
    async syncWithServer() {
        if (!this.isOnline || this.syncInProgress) return;
        
        this.syncInProgress = true;
        
        try {
            console.log('🔄 Synchronisation avec le serveur...');
            
            // Synchroniser les réservations hors ligne
            const offlineReservations = this.reservations.filter(r => r._offline);
            for (const reservation of offlineReservations) {
                try {
                    await this.syncReservation(reservation);
                } catch (error) {
                    console.warn('⚠️ Erreur sync réservation:', error);
                }
            }
            
            // Synchroniser les missions hors ligne
            const offlineMissions = [...this.activeMissions, ...this.missions].filter(m => m._offline);
            for (const mission of offlineMissions) {
                try {
                    await this.syncMission(mission);
                } catch (error) {
                    console.warn('⚠️ Erreur sync mission:', error);
                }
            }
            
            // Recharger toutes les données
            await this.loadFromServer();
            
            this.showMessage('✅ Synchronisation réussie', 'success');
            
        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    async syncReservation(reservation) {
        const response = await fetch(`${this.apiEndpoint}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vehicule_id: reservation.vehicule_id,
                date_debut: reservation.date_debut,
                date_fin: reservation.date_fin,
                heure_depart: reservation.heure_depart,
                heure_arrivee: reservation.heure_arrivee,
                notes: reservation.notes,
                user_prenom: reservation.user_prenom,
                user_nom: reservation.user_nom
            })
        });
        
        if (response.ok) {
            reservation._offline = false;
        }
    }
    
    async syncMission(mission) {
        if (mission.status === 'active') {
            // Mission active - créer sur le serveur
            const response = await fetch(`${this.apiEndpoint}/missions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mission)
            });
            
            if (response.ok) {
                mission._offline = false;
            }
        } else if (mission.status === 'completed') {
            // Mission terminée - sync complète
            // Logique plus complexe selon votre API
            mission._offline = false;
        }
    }
    
    startPeriodicSync() {
        setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.syncWithServer();
            }
        }, 30000);
    }
    
    // === GETTERS ET UTILITAIRES ===
    getAllData() {
        return {
            currentUser: this.currentUser,
            vehicles: this.vehicles,
            reservations: this.reservations,
            missions: this.missions,
            activeMissions: this.activeMissions
        };
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    getVehicles() {
        return this.vehicles;
    }
    
    getReservations() {
        return this.reservations;
    }
    
    getMissions() {
        return this.missions;
    }
    
    getActiveMissions() {
        return this.activeMissions;
    }
    
    getUserReservations() {
        if (!this.currentUser) return [];
        return this.reservations.filter(r => 
            r.user_prenom === this.currentUser.prenom && 
            r.user_nom === this.currentUser.nom
        );
    }
    
    getUserMissions() {
        if (!this.currentUser) return [];
        return this.missions.filter(m => m.user_id === this.currentUser.id);
    }
    
    getUserActiveMissions() {
        if (!this.currentUser) return [];
        return this.activeMissions.filter(m => m.user_id === this.currentUser.id);
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }
    
    showMessage(message, type) {
        if (typeof showMessage === 'function') {
            showMessage(message, type);
        } else if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    // === LISTENERS ===
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
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

// === GESTIONNAIRE GLOBAL ===
let globalDataManager = null;

// Initialisation du gestionnaire global
async function initializeGlobalDataManager() {
    if (!globalDataManager) {
        globalDataManager = new UnifiedDataManager();
        window.DriveGoData = globalDataManager;
        
        // Attendre que les données soient chargées
        return new Promise((resolve) => {
            const checkDataLoaded = () => {
                if (globalDataManager.vehicles.length > 0 || globalDataManager.lastSync) {
                    resolve(globalDataManager);
                } else {
                    setTimeout(checkDataLoaded, 100);
                }
            };
            checkDataLoaded();
        });
    }
    return globalDataManager;
}

// === FONCTIONS HELPER POUR LES PAGES ===

// Pour la page réservation
function getDataManagerForReservation() {
    return globalDataManager || window.DriveGoData;
}

// Pour la page véhicules
function getDataManagerForVehicles() {
    return globalDataManager || window.DriveGoData;
}

// Pré-remplir les formulaires avec les données utilisateur
function fillUserDataInForms() {
    const dataManager = globalDataManager || window.DriveGoData;
    if (!dataManager || !dataManager.currentUser) return;
    
    const user = dataManager.currentUser;
    const nomComplet = `${user.prenom || ''} ${user.nom || ''}`.trim();
    
    // Remplir tous les champs nom/conducteur
    const nomFields = [
        'nom', 'nom-mobile', 'conducteur', 'conducteur-mobile'
    ];
    
    nomFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value) {
            field.value = nomComplet;
            // Rendre le champ readonly si c'est un champ utilisateur connecté
            if (fieldId.includes('nom') && user.id) {
                field.readOnly = true;
                field.style.backgroundColor = '#f3f4f6';
                field.style.opacity = '0.8';
                field.title = 'Rempli automatiquement depuis votre profil';
            }
        }
    });
}

// === EXPORT POUR UTILISATION GLOBALE ===
window.UnifiedDataManager = UnifiedDataManager;
window.initializeGlobalDataManager = initializeGlobalDataManager;
window.getDataManagerForReservation = getDataManagerForReservation;
window.getDataManagerForVehicles = getDataManagerForVehicles;
window.fillUserDataInForms = fillUserDataInForms;

// Debug helpers
window.DriveGoDebug = {
    showAllData: () => console.table(globalDataManager?.getAllData()),
    showVehicles: () => console.table(globalDataManager?.getVehicles()),
    showReservations: () => console.table(globalDataManager?.getReservations()),
    showMissions: () => console.table(globalDataManager?.getMissions()),
    showUser: () => console.table(globalDataManager?.getCurrentUser()),
    syncNow: () => globalDataManager?.syncWithServer(),
    toggleOffline: () => {
        if (globalDataManager) {
            globalDataManager.isOnline = !globalDataManager.isOnline;
            console.log('Mode:', globalDataManager.isOnline ? 'En ligne' : 'Hors ligne');
        }
    }
};