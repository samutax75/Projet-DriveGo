// === SYSTÈME DE SYNCHRONISATION GLOBALE ===
        class DriveGoDataManager {
            constructor() {
                this.storageKey = 'drivego_data';
                this.listeners = [];
                this.initializeData();
            }
            
            initializeData() {
                const defaultData = {
                    vehicles: [
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
                            status: "reserved",
                            reservedBy: "Martin Dubois",
                            reservationDate: "08/07/2025",
                            reservationTime: "14:00-18:00",
                            reservationId: "RES-2025-001"
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
                    ],
                    reservations: [],
                    missions: [],
                    lastUpdate: new Date().toISOString()
                };
                
                const stored = this.getData();
                if (!stored || !stored.vehicles) {
                    this.saveData(defaultData);
                }
            }
            
            getData() {
                try {
                    const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
                    return data;
                } catch (e) {
                    console.warn('Erreur de lecture des données:', e);
                    return {};
                }
            }
            
            saveData(data) {
                try {
                    data.lastUpdate = new Date().toISOString();
                    localStorage.setItem(this.storageKey, JSON.stringify(data));
                    this.notifyListeners('dataChanged', data);
                    
                    // Événement global pour synchronisation
                    window.dispatchEvent(new CustomEvent('drivegoDataUpdate', { 
                        detail: { type: 'dataChanged', data: data } 
                    }));
                } catch (e) {
                    console.error('Erreur de sauvegarde:', e);
                }
            }
            
            getVehicles() {
                const data = this.getData();
                return data.vehicles || [];
            }
            
            updateVehicle(vehicleId, updates) {
                const data = this.getData();
                const vehicleIndex = data.vehicles.findIndex(v => v.id === vehicleId);
                
                if (vehicleIndex !== -1) {
                    const oldVehicle = { ...data.vehicles[vehicleIndex] };
                    data.vehicles[vehicleIndex] = { ...data.vehicles[vehicleIndex], ...updates };
                    
                    console.log('🔄 Véhicule mis à jour:', data.vehicles[vehicleIndex].name, '-', data.vehicles[vehicleIndex].status);
                    
                    this.saveData(data);
                    return data.vehicles[vehicleIndex];
                }
                
                return null;
            }
            
            addReservation(reservation) {
                const data = this.getData();
                if (!data.reservations) data.reservations = [];
                data.reservations.push(reservation);
                
                // Mettre à jour le véhicule
                const success = this.updateVehicle(reservation.vehicleId, {
                    status: 'reserved',
                    reservedBy: reservation.conducteur,
                    reservationDate: reservation.date,
                    reservationTime: reservation.horaire,
                    reservationId: reservation.id
                });
                
                this.saveData(data);
                return reservation;
            }
            
            cancelReservation(reservationId) {
                const data = this.getData();
                const reservationIndex = data.reservations.findIndex(r => r.id === reservationId);
                
                if (reservationIndex !== -1) {
                    const reservation = data.reservations[reservationIndex];
                    data.reservations.splice(reservationIndex, 1);
                    
                    // Libérer le véhicule
                    this.updateVehicle(reservation.vehicleId, {
                        status: 'available',
                        reservedBy: undefined,
                        reservationDate: undefined,
                        reservationTime: undefined,
                        reservationId: undefined
                    });
                    
                    this.saveData(data);
                    return true;
                }
                return false;
            }
            
            addListener(callback) {
                this.listeners.push(callback);
            }
            
            notifyListeners(event, data) {
                this.listeners.forEach(listener => listener(event, data));
            }
        }

        // Instance globale
        const dataManager = new DriveGoDataManager();
        window.DriveGoData = dataManager;

        let vehicles = dataManager.getVehicles();

        // === FONCTIONS UTILITAIRES ===
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
            confirmationDiv.innerHTML = `<div class="${type}">${message}</div>`;
            
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
                    input.value = today;
                }
            });
        }

        // === AFFICHAGE VÉHICULES ===
        function displayVehiclesStatus() {
            const container = document.getElementById('vehicles-status');
            
            // Forcer le rechargement des données
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

        // === GESTION SELECT VÉHICULES ===
        function populateVehicleSelect() {
            const selects = ['vehicule', 'vehicule-mobile'];
            
            // Forcer le rechargement des données
            vehicles = dataManager.getVehicles();
            const availableVehicles = vehicles.filter(v => v.status === 'available');
            
            console.log('🚗 Véhicules disponibles:', availableVehicles.length);
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (!select) return;
                
                // Vider le select
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

        // === MOBILE MODAL ===
        function openMobileModal() {
            const modal = document.getElementById('mobile-modal');
            const backdrop = document.getElementById('modal-backdrop');
            
            // Mettre à jour les véhicules disponibles
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
            
            // Réinitialiser le formulaire mobile
            document.getElementById('form-reservation-mobile').reset();
            setMinDate();
        }

        function selectVehicleOnMobile(vehicleId) {
            if (window.innerWidth <= 767) {
                const vehicle = vehicles.find(v => v.id === vehicleId);
                if (vehicle && vehicle.status === 'available') {
                    openMobileModal();
                    setTimeout(() => {
                        document.getElementById('vehicule-mobile').value = vehicleId;
                    }, 100);
                }
            }
        }

        // === CONFIRMATION RÉSERVATION ===
        function showLoadingState(formId, loading = true) {
            const form = document.getElementById(formId);
            const button = form.querySelector('button[type="submit"]');
            const buttonText = button.querySelector('.btn-text');
            const loadingSpinner = button.querySelector('.loading');
            
            if (loading) {
                button.disabled = true;
                buttonText.style.display = 'none';
                loadingSpinner.style.display = 'inline-block';
            } else {
                button.disabled = false;
                buttonText.style.display = 'inline-flex';
                loadingSpinner.style.display = 'none';
            }
        }

        function confirmReservation(event, isMobile = false) {
            event.preventDefault();
            
            const prefix = isMobile ? '-mobile' : '';
            const formId = isMobile ? 'form-reservation-mobile' : 'form-reservation';
            
            // Afficher l'état de chargement
            showLoadingState(formId, true);
            
            const nom = document.getElementById(`nom${prefix}`).value.trim();
            const date = document.getElementById(`date${prefix}`).value;
            const heureDepart = document.getElementById(`heure-depart${prefix}`).value;
            const heureArrivee = document.getElementById(`heure-arrivee${prefix}`).value;
            const vehiculeId = parseInt(document.getElementById(`vehicule${prefix}`).value);
            
            // Validation
            if (!nom || !date || !heureDepart || !heureArrivee || !vehiculeId) {
                showLoadingState(formId, false);
                showMessage('⚠️ Veuillez remplir tous les champs', 'error');
                return;
            }
            
            // Validation des heures
            if (heureDepart >= heureArrivee) {
                showLoadingState(formId, false);
                showMessage('⚠️ L\'heure d\'arrivée doit être postérieure à l\'heure de départ', 'error');
                return;
            }
            
            // Trouver le véhicule
            const vehicle = vehicles.find(v => v.id === vehiculeId);
            if (!vehicle) {
                showLoadingState(formId, false);
                showMessage('❌ Véhicule non trouvé', 'error');
                return;
            }
            
            // Vérifier disponibilité
            if (vehicle.status !== 'available') {
                showLoadingState(formId, false);
                showMessage('❌ Ce véhicule n\'est plus disponible', 'error');
                refreshData();
                return;
            }
            
            // Simulation d'insertion en base de données
            setTimeout(() => {
                try {
                    // Générer ID unique
                    const reservationId = `RES-2025-${String(Date.now()).slice(-6)}`;
                    
                    // Créer réservation
                    const reservation = {
                        id: reservationId,
                        vehicleId: vehiculeId,
                        conducteur: nom,
                        date: formatDate(date),
                        horaire: `${heureDepart}-${heureArrivee}`,
                        dateCreation: new Date().toISOString(),
                        status: 'active'
                    };
                    
                    // Ajouter via le gestionnaire de données
                    dataManager.addReservation(reservation);
                    
                    // Recharger les données
                    vehicles = dataManager.getVehicles();
                    
                    // Message de confirmation
                    showMessage(`
                        <strong>✅ Réservation confirmée et synchronisée!</strong><br><br>
                        <strong>🆔 ID:</strong> ${reservationId}<br>
                        <strong>🚐 Véhicule:</strong> ${vehicle.type} ${vehicle.name}<br>
                        <strong>👤 Conducteur:</strong> ${nom}<br>
                        <strong>📅 Date:</strong> ${reservation.date}<br>
                        <strong>🕐 Horaire:</strong> ${reservation.horaire}<br>
                        <em>📡 Véhicule maintenant INDISPONIBLE</em>
                    `, 'confirmation');
                    
                    // Réinitialiser formulaire
                    document.getElementById(formId).reset();
                    setMinDate();
                    
                    // Fermer modal si mobile
                    if (isMobile) {
                        setTimeout(() => closeMobileModal(), 1000);
                    }
                    
                    // Mettre à jour l'affichage - CRITIQUE!
                    refreshData();
                    
                    console.log('🎉 Réservation créée avec succès:', reservationId);
                    
                } catch (error) {
                    console.error('Erreur lors de la réservation:', error);
                    showMessage('❌ Erreur lors de la réservation. Veuillez réessayer.', 'error');
                } finally {
                    showLoadingState(formId, false);
                }
            }, 1000); // Simulation délai réseau
        }

        // === RAFRAÎCHISSEMENT DES DONNÉES ===
        function refreshData() {
            console.log('🔄 Rafraîchissement des données...');
            
            // Recharger depuis le gestionnaire
            vehicles = dataManager.getVehicles();
            
            // Mettre à jour tous les affichages
            displayVehiclesStatus();
            populateVehicleSelect();
            
            console.log('✅ Données rafraîchies');
        }

        // === GESTION RÉSERVATIONS ===
        function modifierReservation() {
            const reservationId = document.getElementById('reservation-id').value.trim();
            if (!reservationId) {
                showMessage('⚠️ Veuillez entrer un identifiant de réservation', 'error');
                return;
            }
            
            const vehicle = vehicles.find(v => v.reservationId === reservationId);
            if (!vehicle) {
                showMessage('❌ Réservation non trouvée', 'error');
                return;
            }
            
            // Pré-remplir le formulaire
            document.getElementById('nom').value = vehicle.reservedBy;
            const dateParts = vehicle.reservationDate.split('/');
            const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
            document.getElementById('date').value = formattedDate;
            document.getElementById('heure-depart').value = vehicle.reservationTime.split('-')[0];
            document.getElementById('heure-arrivee').value = vehicle.reservationTime.split('-')[1];
            
            // Temporairement rendre le véhicule disponible dans le select
            const select = document.getElementById('vehicule');
            const option = document.createElement('option');
            option.value = vehicle.id;
            option.textContent = `${vehicle.type} ${vehicle.name} - ${vehicle.immatriculation} (En modification)`;
            select.appendChild(option);
            select.value = vehicle.id;
            
            showMessage(`✏️ Réservation ${reservationId} chargée pour modification`, 'confirmation');
            
            // Scroll vers le formulaire
            document.getElementById('form-reservation').scrollIntoView({ behavior: 'smooth' });
        }

        function annulerReservation() {
            const reservationId = document.getElementById('reservation-id').value.trim();
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
                const success = dataManager.cancelReservation(reservationId);
                
                if (success) {
                    vehicles = dataManager.getVehicles();
                    
                    showMessage(`✅ Réservation ${reservationId} annulée avec succès<br><em>📡 Véhicule maintenant DISPONIBLE</em>`, 'confirmation');
                    
                    refreshData();
                    
                    document.getElementById('reservation-id').value = '';
                    
                    console.log('🔄 Réservation annulée - Véhicule libéré');
                } else {
                    showMessage('❌ Erreur lors de l\'annulation', 'error');
                }
            }
        }

        function rechercherReservation() {
            const searchTerm = document.getElementById('search-reservation').value.toLowerCase().trim();
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
                showMessage(`<strong>🔍 Réservations trouvées:</strong><br><br>${resultText}`, 'confirmation');
            }
        }

        // === FONCTIONS UTILITAIRES ===
        function goToHomePage() {
            if (confirm('Êtes-vous sûr de vouloir retourner à l\'accueil?')) {
                // Simuler navigation
                showMessage('🏠 Redirection vers l\'accueil...', 'confirmation');
            }
        }

        function exportToMissions() {
            const data = dataManager.getData();
            const exportData = {
                vehicles: data.vehicles,
                reservations: data.reservations,
                lastSync: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `drivego-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showMessage('📁 Données exportées avec succès !', 'confirmation');
        }

        // === INITIALISATION ===
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚗 DriveGo - Initialisation...');
            
            // Charger les données
            vehicles = dataManager.getVehicles();
            
            // Initialiser l'affichage
            displayVehiclesStatus();
            populateVehicleSelect();
            setMinDate();
            
            // Event listeners pour les formulaires
            document.getElementById('form-reservation').addEventListener('submit', (e) => confirmReservation(e, false));
            document.getElementById('form-reservation-mobile').addEventListener('submit', (e) => confirmReservation(e, true));
            
            // Listener pour les changements de données
            dataManager.addListener((event, data) => {
                if (event === 'dataChanged') {
                    console.log('🔄 Données mises à jour:', data.vehicles.length, 'véhicules');
                    vehicles = data.vehicles;
                    displayVehiclesStatus();
                    populateVehicleSelect();
                }
            });
            
            // Listener global pour synchronisation inter-onglets
            window.addEventListener('drivegoDataUpdate', (event) => {
                if (event.detail.type === 'dataChanged') {
                    console.log('🌐 Synchronisation inter-onglets');
                    vehicles = event.detail.data.vehicles;
                    displayVehiclesStatus();
                    populateVehicleSelect();
                }
            });
            
            // Gestion clavier pour modal
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeMobileModal();
                }
            });
            
            // Animation d'entrée
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 100);
            
            console.log('✅ DriveGo - Système initialisé avec succès');
        });

        // Style d'entrée
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';

        // === GESTION AUTO-REFRESH ===
        // Rafraîchir les données toutes les 30 secondes (optionnel)
        setInterval(() => {
            console.log('🔄 Auto-refresh des données');
            refreshData();
        }, 30000);

        // === DEBUG CONSOLE ===
        window.DriveGoDebug = {
            showVehicles: () => console.table(vehicles),
            showData: () => console.log(dataManager.getData()),
            refreshNow: () => refreshData(),
            exportData: () => exportToMissions()
        };

        console.log('🔧 Debug disponible: window.DriveGoDebug');