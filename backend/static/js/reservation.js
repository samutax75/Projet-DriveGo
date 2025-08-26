// === SYSTÈME DE SYNCHRONISATION GLOBALE ===
        
        // Gestionnaire de données partagées
        class DriveGoDataManager {
            constructor() {
                this.storageKey = 'drivego_data';
                this.listeners = [];
                this.initializeData();
            }
            
            // Initialiser les données par défaut
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
                            status: "reserved",
                            reservedBy: "Sophie Martin",
                            reservationDate: "08/07/2025",
                            reservationTime: "09:00-17:00",
                            reservationId: "RES-2025-002"
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
                            type: "🏎️🏁",
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
                
                // Charger les données existantes ou utiliser les données par défaut
                const stored = this.getData();
                if (!stored || !stored.vehicles) {
                    this.saveData(defaultData);
                }
            }
            
            // Récupérer toutes les données
            getData() {
                try {
                    const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
                    return data;
                } catch (e) {
                    console.warn('Erreur de lecture des données:', e);
                    return {};
                }
            }
            
            // Sauvegarder toutes les données
            saveData(data) {
                try {
                    data.lastUpdate = new Date().toISOString();
                    localStorage.setItem(this.storageKey, JSON.stringify(data));
                    this.notifyListeners('dataChanged', data);
                    
                    // Émettre un événement global pour synchroniser les autres pages
                    window.dispatchEvent(new CustomEvent('drivegoDataUpdate', { 
                        detail: { type: 'dataChanged', data: data } 
                    }));
                } catch (e) {
                    console.error('Erreur de sauvegarde:', e);
                }
            }
            
            // Récupérer les véhicules
            getVehicles() {
                const data = this.getData();
                return data.vehicles || [];
            }
            
            // Mettre à jour un véhicule
            updateVehicle(vehicleId, updates) {
                const data = this.getData();
                const vehicleIndex = data.vehicles.findIndex(v => v.id === vehicleId);
                
                console.log('🔍 Recherche véhicule ID:', vehicleId);
                console.log('📍 Index trouvé:', vehicleIndex);
                
                if (vehicleIndex !== -1) {
                    const oldVehicle = { ...data.vehicles[vehicleIndex] };
                    data.vehicles[vehicleIndex] = { ...data.vehicles[vehicleIndex], ...updates };
                    
                    console.log('📝 Mise à jour véhicule:');
                    console.log('   Avant:', oldVehicle.name, '-', oldVehicle.status);
                    console.log('   Après:', data.vehicles[vehicleIndex].name, '-', data.vehicles[vehicleIndex].status);
                    
                    this.saveData(data);
                    return data.vehicles[vehicleIndex];
                }
                
                console.log('❌ Véhicule non trouvé pour ID:', vehicleId);
                return null;
            }
            
            // Ajouter une réservation
            addReservation(reservation) {
                const data = this.getData();
                if (!data.reservations) data.reservations = [];
                data.reservations.push(reservation);
                
                // Mettre à jour le statut du véhicule
                const success = this.updateVehicle(reservation.vehicleId, {
                    status: 'reserved',
                    reservedBy: reservation.conducteur,
                    reservationDate: reservation.date,
                    reservationTime: reservation.horaire,
                    reservationId: reservation.id
                });
                
                console.log('🔄 Véhicule mis à jour:', success ? 'Succès' : 'Échec');
                console.log('📊 Nouveau statut véhicule ID', reservation.vehicleId, ':', success ? 'reserved' : 'erreur');
                
                this.saveData(data);
                return reservation;
            }
            
            // Annuler une réservation
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
            
            // Ajouter un listener pour les changements
            addListener(callback) {
                this.listeners.push(callback);
            }
            
            // Notifier les listeners
            notifyListeners(event, data) {
                this.listeners.forEach(listener => listener(event, data));
            }
        }
        
        // Instance globale du gestionnaire de données
        const dataManager = new DriveGoDataManager();
        
        // Rendre le gestionnaire accessible globalement
        window.DriveGoData = dataManager;
        
        // Récupérer les véhicules depuis le gestionnaire
        let vehicles = dataManager.getVehicles();


        // Fonction pour obtenir le texte du statut
        function getStatusText(status) {
            switch(status) {
                case 'available': return 'Disponible';
                case 'reserved': return 'Réservé';
                case 'maintenance': return 'Maintenance';
                default: return status;
            }
        }

        // Fonction pour afficher l'état des véhicules
        function displayVehiclesStatus() {
            const container = document.getElementById('vehicles-status');
            
            // Forcer le rechargement des données depuis le gestionnaire
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
                    <div class="vehicle-item">
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
            
            console.log('📊 Affichage mis à jour:', vehicles.map(v => `${v.name}: ${v.status}`));
        }

        // Fonction pour remplir le select des véhicules
        function populateVehicleSelect() {
            const select = document.getElementById('vehicule');
            
            // Forcer le rechargement des données depuis le gestionnaire
            vehicles = dataManager.getVehicles();
            
            // Vider d'abord le select (sauf l'option par défaut)
            select.innerHTML = '<option value="">-- Sélectionner un véhicule --</option>';
            
            // Filtrer uniquement les véhicules disponibles
            const availableVehicles = vehicles.filter(v => v.status === 'available');
            
            console.log('🚗 Véhicules totaux:', vehicles.length);
            console.log('✅ Véhicules disponibles:', availableVehicles.length);
            console.log('📊 Status par véhicule:', vehicles.map(v => `${v.name}: ${v.status}`));
            
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
        }

        // Fonction pour confirmer une réservation
        function confirmReservation(event) {
            event.preventDefault();
            
            const nom = document.getElementById('nom').value;
            const date = document.getElementById('date').value;
            const heureDepart = document.getElementById('heure-depart').value;
            const heureArrivee = document.getElementById('heure-arrivee').value;
            const vehiculeId = parseInt(document.getElementById('vehicule').value);
            
            if (!nom || !date || !heureDepart || !heureArrivee || !vehiculeId) {
                showMessage('⚠️ Veuillez remplir tous les champs', 'error');
                return;
            }
            
            // Trouver le véhicule
            const vehicle = vehicles.find(v => v.id === vehiculeId);
            if (!vehicle) {
                showMessage('❌ Véhicule non trouvé', 'error');
                return;
            }
            
            // Vérifier que le véhicule est encore disponible
            if (vehicle.status !== 'available') {
                showMessage('❌ Ce véhicule n\'est plus disponible', 'error');
                updateVehicleSelect(); // Mettre à jour la liste
                return;
            }
            
            // Générer un ID de réservation unique
            const reservationId = `RES-2025-${String(Date.now()).slice(-6)}`;
            
            // Créer l'objet réservation
            const reservation = {
                id: reservationId,
                vehicleId: vehiculeId,
                conducteur: nom,
                date: formatDate(date),
                horaire: `${heureDepart}-${heureArrivee}`,
                dateCreation: new Date().toISOString(),
                status: 'active'
            };
            
            // Ajouter la réservation via le gestionnaire de données
            dataManager.addReservation(reservation);
            
            // Recharger les véhicules depuis le gestionnaire
            vehicles = dataManager.getVehicles();
            
            // Afficher la confirmation
            showMessage(`
                <strong>✅ Réservation confirmée et synchronisée!</strong><br><br>
                <strong>🆔 ID:</strong> ${reservationId}<br>
                <strong>🚐 Véhicule:</strong> ${vehicle.type} ${vehicle.name}<br>
                <strong>👤 Conducteur:</strong> ${nom}<br>
                <strong>📅 Date:</strong> ${reservation.date}<br>
                <strong>🕐 Horaire:</strong> ${reservation.horaire}<br>
                <em>📡 Véhicule maintenant INDISPONIBLE pour réservation</em>
            `, 'confirmation');
            
            // Réinitialiser le formulaire
            document.getElementById('form-reservation').reset();
            setMinDate();
            
            // Mettre à jour l'affichage - IMPORTANT!
            displayVehiclesStatus();
            populateVehicleSelect(); // Utiliser directement la fonction au lieu d'updateVehicleSelect
            
            console.log('🔄 Véhicule réservé - Liste mise à jour');
        }

        // Fonction pour mettre à jour le select des véhicules
        function updateVehicleSelect() {
            const select = document.getElementById('vehicule');
            select.innerHTML = '<option value="">-- Sélectionner un véhicule --</option>';
            populateVehicleSelect();
        }

        // Fonction pour formater la date
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        }

        // Fonction pour afficher un message
        function showMessage(message, type) {
            const confirmationDiv = document.getElementById('confirmation');
            confirmationDiv.innerHTML = `<div class="${type}">${message}</div>`;
            
            // Faire défiler vers le message
            confirmationDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Faire disparaître le message après 7 secondes
            setTimeout(() => {
                confirmationDiv.innerHTML = '';
            }, 7000);
        }

        // Fonction pour modifier une réservation
        function modifierReservation() {
            const reservationId = document.getElementById('reservation-id').value;
            if (!reservationId) {
                showMessage('⚠️ Veuillez entrer un identifiant de réservation', 'error');
                return;
            }
            
            const vehicle = vehicles.find(v => v.reservationId === reservationId);
            if (!vehicle) {
                showMessage('❌ Réservation non trouvée', 'error');
                return;
            }
            
            // Libérer temporairement le véhicule pour la modification
            const tempStatus = vehicle.status;
            vehicle.status = 'available';
            updateVehicleSelect();
            
            // Pré-remplir le formulaire avec les données existantes
            document.getElementById('nom').value = vehicle.reservedBy;
            const dateParts = vehicle.reservationDate.split('/');
            const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
            document.getElementById('date').value = formattedDate;
            document.getElementById('heure-depart').value = vehicle.reservationTime.split('-')[0];
            document.getElementById('heure-arrivee').value = vehicle.reservationTime.split('-')[1];
            document.getElementById('vehicule').value = vehicle.id;
            
            // Restaurer le statut
            vehicle.status = tempStatus;
            
            showMessage(`✏️ Réservation ${reservationId} chargée pour modification`, 'confirmation');
            
            // Faire défiler vers le formulaire
            document.getElementById('form-reservation').scrollIntoView({ behavior: 'smooth' });
        }

        // Fonction pour annuler une réservation
        function annulerReservation() {
            const reservationId = document.getElementById('reservation-id').value;
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
                // Annuler via le gestionnaire de données
                const success = dataManager.cancelReservation(reservationId);
                
                if (success) {
                    // Recharger les véhicules
                    vehicles = dataManager.getVehicles();
                    
                    showMessage(`✅ Réservation ${reservationId} annulée avec succès<br><em>📡 Véhicule maintenant DISPONIBLE pour réservation</em>`, 'confirmation');
                    
                    // Mettre à jour l'affichage
                    displayVehiclesStatus();
                    populateVehicleSelect(); // Le véhicule redevient disponible
                    
                    // Vider le champ ID
                    document.getElementById('reservation-id').value = '';
                    
                    console.log('🔄 Réservation annulée - Véhicule redevenu disponible');
                } else {
                    showMessage('❌ Erreur lors de l\'annulation', 'error');
                }
            }
        }

        // Fonction pour rechercher une réservation
        function rechercherReservation() {
            const searchTerm = document.getElementById('search-reservation').value.toLowerCase();
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

        // Fonction pour retourner à l'accueil
        function goToHomePage() {
            if (confirm('Êtes-vous sûr de vouloir retourner à l\'accueil?')) {
                window.location.href = 'index.html';
            }
        }

        // Définir la date minimum à aujourd'hui
        function setMinDate() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date').min = today;
            document.getElementById('date').value = today;
        }

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            // Charger les données depuis le gestionnaire
            vehicles = dataManager.getVehicles();
            
            displayVehiclesStatus();
            populateVehicleSelect();
            setMinDate();
            
            // Écouter la soumission du formulaire
            document.getElementById('form-reservation').addEventListener('submit', confirmReservation);
            
            // Écouter les changements de données pour synchronisation
            dataManager.addListener((event, data) => {
                if (event === 'dataChanged') {
                    console.log('🔄 Données mises à jour:', data.vehicles.length, 'véhicules');
                    vehicles = data.vehicles;
                    displayVehiclesStatus();
                    populateVehicleSelect(); // Mise à jour de la liste des véhicules disponibles
                }
            });
            
            // Écouter les événements globaux de synchronisation
            window.addEventListener('drivegoDataUpdate', (event) => {
                if (event.detail.type === 'dataChanged') {
                    console.log('🌐 Événement global reçu - Mise à jour des données');
                    vehicles = event.detail.data.vehicles;
                    displayVehiclesStatus();
                    populateVehicleSelect(); // Mise à jour de la liste des véhicules disponibles
                }
            });
            
            // Animation d'entrée
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 100);
        });

        // Style d'entrée
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        // === FONCTIONS D'EXPORT POUR DÉPART MISSIONS ===
        
        // Fonction pour exporter les données vers "Départ missions"
        function exportToMissions() {
            const data = dataManager.getData();
            const exportData = {
                vehicles: data.vehicles,
                reservations: data.reservations,
                lastSync: new Date().toISOString()
            };
            
            // Créer un lien de téléchargement
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
        
        // Ajouter un bouton d'export (optionnel)
        function addExportButton() {
            const header = document.querySelector('.header nav');
            const exportBtn = document.createElement('button');
            exportBtn.className = 'btn btn-secondary';
            exportBtn.innerHTML = '📤 Exporter';
            exportBtn.onclick = exportToMissions;
            exportBtn.style.marginLeft = '20px';
            header.appendChild(exportBtn);
        }

        // Le système filtre automatiquement les véhicules disponibles
const availableVehicles = vehicles.filter(v => v.status === 'available');
        
        // Console log pour debug
        console.log('🚗 DriveGo - Système de réservation avec synchronisation initialisé');
        console.log('📡 Gestionnaire de données disponible:', window.DriveGoData);