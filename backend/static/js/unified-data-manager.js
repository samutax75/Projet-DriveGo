// === SYSTÈME UNIFIÉ DRIVEGO CORRIGÉ ===
class DriveGoUnifiedManager {
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
        
        // Initialiser les écouteurs de connectivité
        this.setupConnectivityListeners();
    }
    
    setupConnectivityListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('📡 Connexion rétablie');
            this.loadAllData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Mode hors ligne activé');
        });
    }
    
    async initializeData() {
        console.log('🔄 Initialisation des données...');
        
        try {
            if (this.isOnline) {
                await this.loadAllData();
            } else {
                this.loadFromCache();
            }
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
            this.loadFromCache();
        }
    }
    
    async loadAllData() {
        try {
            // Charger l'utilisateur actuel
            await this.loadCurrentUser();
            
            // Charger les véhicules
            await this.loadVehicles();
            
            // Charger les réservations
            await this.loadReservations();
            
            // Charger les missions
            await this.loadMissions();
            await this.loadActiveMissions();
            
            // Appliquer les statuts
            this.applyVehicleStatuses();
            
            // Sauvegarder en cache
            this.saveToCache();
            
            // Notifier les listeners
            this.notifyDataChange();
            
            console.log('✅ Données chargées:', {
                vehicles: this.vehicles.length,
                reservations: this.reservations.length,
                user: this.currentUser?.nom || 'Non connecté'
            });
            
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            this.loadFromCache();
        }
    }
    
    async loadCurrentUser() {
        try {
            const response = await fetch(`${this.apiEndpoint}/user/current`);
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
            }
        } catch (error) {
            console.warn('⚠️ Utilisateur non chargé:', error);
        }
    }
    
    async loadVehicles() {
        try {
            const response = await fetch(`${this.apiEndpoint}/vehicules`);
            if (response.ok) {
                const data = await response.json();
                this.vehicles = this.transformVehiclesFromAPI(data.vehicules || []);
            }
        } catch (error) {
            console.error('❌ Erreur véhicules:', error);
            this.setDefaultVehicles();
        }
    }
    
    async loadReservations() {
        try {
            const response = await fetch(`${this.apiEndpoint}/reservations`);
            if (response.ok) {
                const data = await response.json();
                this.reservations = data.reservations || [];
            }
        } catch (error) {
            console.error('❌ Erreur réservations:', error);
            this.reservations = [];
        }
    }
    
    async loadMissions() {
        try {
            const response = await fetch(`${this.apiEndpoint}/missions`);
            if (response.ok) {
                const data = await response.json();
                this.missions = data.missions || [];
            }
        } catch (error) {
            console.error('❌ Erreur missions:', error);
            this.missions = [];
        }
    }
    
    async loadActiveMissions() {
        try {
            const response = await fetch(`${this.apiEndpoint}/missions/active`);
            if (response.ok) {
                const data = await response.json();
                this.activeMissions = data.activeMissions || [];
            }
        } catch (error) {
            console.error('❌ Erreur missions actives:', error);
            this.activeMissions = [];
        }
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
            status: "available" // Par défaut, sera mis à jour
        }));
    }
    
    getVehicleTypeIcon(nom) {
        const nomLower = nom.toLowerCase();
        if (nomLower.includes('pmr')) return '♿';
        if (nomLower.includes('kangoo')) return '🏎️';
        return '🚐';
    }
    
    setDefaultVehicles() {
        this.vehicles = [
            {
                id: 1,
                name: "TRAFIC BLANC",
                type: "🚐",
                immatriculation: "FV-088-JJ",
                dateImmatriculation: "26/11/2020",
                status: "available"
            },
            {
                id: 2,
                name: "TRAFIC PMR", 
                type: "♿",
                immatriculation: "GT-176-AF",
                dateImmatriculation: "14/12/2023",
                status: "available"
            },
            {
                id: 3,
                name: "TRAFIC VERT",
                type: "🚐", 
                immatriculation: "EJ-374-TT",
                dateImmatriculation: "02/02/2017",
                status: "available"
            }
        ];
    }
    
    applyVehicleStatuses() {
        // Réinitialiser tous les véhicules à disponible
        this.vehicles.forEach(v => {
            v.status = 'available';
            delete v.reservedBy;
            delete v.reservationDate;
            delete v.reservationTime;
            delete v.reservationId;
            delete v.missionBy;
            delete v.missionInfo;
        });
        
        // Appliquer les missions actives (priorité)
        this.activeMissions.forEach(mission => {
            const vehicle = this.vehicles.find(v => 
                v.id === mission.vehicule_id || v.id === mission.vehicleId
            );
            if (vehicle) {
                vehicle.status = 'mission';
                vehicle.missionBy = mission.nom;
                vehicle.missionInfo = {
                    destination: mission.destination,
                    departureTime: mission.departureTime
                };
            }
        });
        
        // Appliquer les réservations (si pas de mission)
        this.reservations.forEach(reservation => {
            const vehicle = this.vehicles.find(v => 
                v.id === (reservation.vehicule_id || reservation.vehicleId)
            );
            if (vehicle && vehicle.status === 'available') {
                vehicle.status = 'reserved';
                vehicle.reservedBy = reservation.user_prenom ? 
                    `${reservation.user_prenom} ${reservation.user_nom}` : 
                    reservation.conducteur;
                vehicle.reservationDate = this.formatDate(reservation.date_debut || reservation.date);
                vehicle.reservationTime = reservation.horaire || 
                    `${reservation.heure_depart}-${reservation.heure_arrivee}`;
                vehicle.reservationId = `RES-${reservation.id}`;
            }
        });
        
        console.log('🔄 Statuts véhicules mis à jour:', 
            this.vehicles.map(v => `${v.name}: ${v.status}`));
    }
    
    // === GESTION RÉSERVATIONS ===
    async addReservation(reservationData) {
        const requestData = {
            vehicule_id: reservationData.vehicleId,
            date_debut: reservationData.date,
            date_fin: reservationData.date,
            heure_depart: reservationData.heureDepart,
            heure_arrivee: reservationData.heureArrivee,
            user_prenom: this.currentUser?.prenom || reservationData.conducteur.split(' ')[0],
            user_nom: this.currentUser?.nom || reservationData.conducteur.split(' ')[1],
            notes: `Conducteur: ${reservationData.conducteur}`
        };
        
        try {
            if (this.isOnline) {
                const response = await fetch(`${this.apiEndpoint}/reservations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    // Recharger toutes les données pour synchroniser
                    await this.loadAllData();
                    return result;
                }
            }
            
            // Mode hors ligne
            return this.addReservationOffline(requestData);
            
        } catch (error) {
            console.error('❌ Erreur réservation:', error);
            return this.addReservationOffline(requestData);
        }
    }
    
    addReservationOffline(data) {
        const reservation = {
            id: Date.now(),
            ...data,
            statut: 'en_attente',
            horaire: `${data.heure_depart}-${data.heure_arrivee}`,
            conducteur: `${data.user_prenom} ${data.user_nom}`,
            _offline: true
        };
        
        this.reservations.push(reservation);
        this.applyVehicleStatuses();
        this.saveToCache();
        this.notifyDataChange();
        
        return reservation;
    }
    
    async cancelReservation(reservationId) {
        const numericId = reservationId.replace('RES-', '');
        
        try {
            if (this.isOnline) {
                const response = await fetch(`${this.apiEndpoint}/reservations/${numericId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    await this.loadAllData();
                    return true;
                }
            }
            
            // Fallback local
            const index = this.reservations.findIndex(r => r.id == numericId);
            if (index !== -1) {
                this.reservations.splice(index, 1);
                this.applyVehicleStatuses();
                this.saveToCache();
                this.notifyDataChange();
                return true;
            }
            
        } catch (error) {
            console.error('❌ Erreur annulation:', error);
        }
        
        return false;
    }
    
    // === CACHE LOCAL ===
    saveToCache() {
        try {
            const data = {
                currentUser: this.currentUser,
                vehicles: this.vehicles,
                reservations: this.reservations,
                missions: this.missions,
                activeMissions: this.activeMissions,
                lastSync: new Date().toISOString()
            };
            localStorage.setItem('drivego_unified_data', JSON.stringify(data));
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde cache:', error);
        }
    }
    
    loadFromCache() {
        try {
            const cached = localStorage.getItem('drivego_unified_data');
            if (cached) {
                const data = JSON.parse(cached);
                this.currentUser = data.currentUser;
                this.vehicles = data.vehicles || [];
                this.reservations = data.reservations || [];
                this.missions = data.missions || [];
                this.activeMissions = data.activeMissions || [];
                this.lastSync = data.lastSync;
                
                if (this.vehicles.length === 0) {
                    this.setDefaultVehicles();
                }
                
                this.applyVehicleStatuses();
                this.notifyDataChange();
                console.log('📦 Données chargées depuis le cache');
            } else {
                this.setDefaultVehicles();
                this.notifyDataChange();
            }
        } catch (error) {
            console.error('❌ Erreur cache:', error);
            this.setDefaultVehicles();
            this.notifyDataChange();
        }
    }
    
    // === UTILITAIRES ===
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    }
    
    // === GETTERS ===
    getVehicles() { return this.vehicles; }
    getReservations() { return this.reservations; }
    getCurrentUser() { return this.currentUser; }
    getMissions() { return this.missions; }
    getActiveMissions() { return this.activeMissions; }
    
    // === LISTENERS ===
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    notifyDataChange() {
        this.listeners.forEach(listener => {
            try {
                listener('dataChanged', {
                    currentUser: this.currentUser,
                    vehicles: this.vehicles,
                    reservations: this.reservations,
                    missions: this.missions,
                    activeMissions: this.activeMissions
                });
            } catch (error) {
                console.error('❌ Erreur listener:', error);
            }
        });
    }
    
    // === SYNCHRONISATION PÉRIODIQUE ===
    startPeriodicSync() {
        setInterval(() => {
            if (this.isOnline) {
                console.log('🔄 Synchronisation automatique...');
                this.loadAllData();
            }
        }, 30000);
    }
}

// === INSTANCE GLOBALE ===
let globalUnifiedManager = null;

async function initDriveGoSystem() {
    if (!globalUnifiedManager) {
        globalUnifiedManager = new DriveGoUnifiedManager();
        await globalUnifiedManager.initializeData();
        globalUnifiedManager.startPeriodicSync();
        
        // Exposer globalement
        window.DriveGoData = globalUnifiedManager;
        
        console.log('✅ Système DriveGo initialisé');
    }
    return globalUnifiedManager;
}

// === FONCTIONS HELPER ===
function fillUserDataInForms() {
    if (!globalUnifiedManager || !globalUnifiedManager.currentUser) return;
    
    const user = globalUnifiedManager.currentUser;
    const nomComplet = `${user.prenom || ''} ${user.nom || ''}`.trim();
    
    const nomFields = ['nom', 'nom-mobile', 'conducteur', 'conducteur-mobile'];
    nomFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value) {
            field.value = nomComplet;
            if (fieldId.includes('nom')) {
                field.readOnly = true;
                field.style.backgroundColor = '#f3f4f6';
                field.title = 'Rempli automatiquement';
            }
        }
    });
}

// === EXPORT GLOBAL ===
window.initDriveGoSystem = initDriveGoSystem;
window.fillUserDataInForms = fillUserDataInForms;

// === DEBUG ===
window.DriveGoDebug = {
    showData: () => {
        if (globalUnifiedManager) {
            console.log('Véhicules:', globalUnifiedManager.vehicles);
            console.log('Réservations:', globalUnifiedManager.reservations);
            console.log('Utilisateur:', globalUnifiedManager.currentUser);
        }
    },
    reload: () => globalUnifiedManager?.loadAllData(),
    syncNow: () => globalUnifiedManager?.loadAllData()
};