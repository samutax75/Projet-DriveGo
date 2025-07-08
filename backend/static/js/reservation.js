 // Données des véhicules avec informations de réservation
        const vehicles = [
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
                type: "🚐",
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
                type: "🚗",
                immatriculation: "DS-429-PF",
                dateImmatriculation: "22/06/2015",
                controletech: "29/01/2025",
                prochainControle: "28/01/2027",
                finValidite: "30/09/2026",
                carteStationnement: "4985084",
                status: "available"
            }
        ];

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
            container.innerHTML = vehicles.map(vehicle => {
                const statusClass = `status-${vehicle.status}`;
                const statusText = getStatusText(vehicle.status);
                
                let reservationInfo = '';
                if (vehicle.status === 'reserved' && vehicle.reservedBy) {
                    reservationInfo = `
                        <div class="reserved-by">
                            <strong>👤 Réservé par:</strong> ${vehicle.reservedBy}<br>
                            <strong>📅 Date:</strong> ${vehicle.reservationDate}<br>
                            <strong>🕐 Horaire:</strong> ${vehicle.reservationTime}
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
                            <strong>Immatriculation:</strong> ${vehicle.immatriculation}
                        </div>
                        ${reservationInfo}
                    </div>
                `;
            }).join('');
        }

        // Fonction pour remplir le select des véhicules
        function populateVehicleSelect() {
            const select = document.getElementById('vehicule');
            const availableVehicles = vehicles.filter(v => v.status === 'available');
            
            availableVehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.type} ${vehicle.name} - ${vehicle.immatriculation}`;
                select.appendChild(option);
            });
        }

        // Fonction pour confirmer une réservation
        function confirmReservation(event) {
            event.preventDefault();
            
            const nom = document.getElementById('nom').value;
            const date = document.getElementById('date').value;
            const heureDepart = document.getElementById('heure-depart').value;
            const heureArrivee = document.getElementById('heure-arrivee').value;
            const vehiculeId = document.getElementById('vehicule').value;
            
            if (!nom || !date || !heureDepart || !heureArrivee || !vehiculeId) {
                showMessage('Veuillez remplir tous les champs', 'error');
                return;
            }
            
            // Trouver le véhicule
            const vehicle = vehicles.find(v => v.id == vehiculeId);
            if (!vehicle) {
                showMessage('Véhicule non trouvé', 'error');
                return;
            }
            
            // Générer un ID de réservation
            const reservationId = `RES-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
            
            // Mettre à jour le véhicule
            vehicle.status = 'reserved';
            vehicle.reservedBy = nom;
            vehicle.reservationDate = formatDate(date);
            vehicle.reservationTime = `${heureDepart}-${heureArrivee}`;
            vehicle.reservationId = reservationId;
            
            // Afficher la confirmation
            showMessage(`
                <strong>✅ Réservation confirmée!</strong><br>
                <strong>ID:</strong> ${reservationId}<br>
                <strong>Véhicule:</strong> ${vehicle.type} ${vehicle.name}<br>
                <strong>Conducteur:</strong> ${nom}<br>
                <strong>Date:</strong> ${vehicle.reservationDate}<br>
                <strong>Horaire:</strong> ${vehicle.reservationTime}
            `, 'confirmation');
            
            // Réinitialiser le formulaire
            document.getElementById('form-reservation').reset();
            
            // Mettre à jour l'affichage
            displayVehiclesStatus();
            updateVehicleSelect();
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
            
            // Faire disparaître le message après 5 secondes
            setTimeout(() => {
                confirmationDiv.innerHTML = '';
            }, 5000);
        }

        // Fonction pour modifier une réservation
        function modifierReservation() {
            const reservationId = document.getElementById('reservation-id').value;
            if (!reservationId) {
                showMessage('Veuillez entrer un identifiant de réservation', 'error');
                return;
            }
            
            const vehicle = vehicles.find(v => v.reservationId === reservationId);
            if (!vehicle) {
                showMessage('Réservation non trouvée', 'error');
                return;
            }
            
            // Pré-remplir le formulaire avec les données existantes
            document.getElementById('nom').value = vehicle.reservedBy;
            document.getElementById('date').value = new Date(vehicle.reservationDate.split('/').reverse().join('-')).toISOString().split('T')[0];
            document.getElementById('heure-depart').value = vehicle.reservationTime.split('-')[0];
            document.getElementById('heure-arrivee').value = vehicle.reservationTime.split('-')[1];
            document.getElementById('vehicule').value = vehicle.id;
            
            showMessage(`Réservation ${reservationId} chargée pour modification`, 'confirmation');
        }

        // Fonction pour annuler une réservation
        function annulerReservation() {
            const reservationId = document.getElementById('reservation-id').value;
            if (!reservationId) {
                showMessage('Veuillez entrer un identifiant de réservation', 'error');
                return;
            }
            
            const vehicle = vehicles.find(v => v.reservationId === reservationId);
            if (!vehicle) {
                showMessage('Réservation non trouvée', 'error');
                return;
            }
            
            if (confirm(`Êtes-vous sûr de vouloir annuler la réservation ${reservationId} pour ${vehicle.reservedBy}?`)) {
                // Annuler la réservation
                vehicle.status = 'available';
                delete vehicle.reservedBy;
                delete vehicle.reservationDate;
                delete vehicle.reservationTime;
                delete vehicle.reservationId;
                
                showMessage(`Réservation ${reservationId} annulée avec succès`, 'confirmation');
                
                // Mettre à jour l'affichage
                displayVehiclesStatus();
                updateVehicleSelect();
                
                // Vider le champ ID
                document.getElementById('reservation-id').value = '';
            }
        }

        // Fonction pour rechercher une réservation
        function rechercherReservation() {
            const searchTerm = document.getElementById('search-reservation').value.toLowerCase();
            if (!searchTerm) {
                showMessage('Veuillez entrer un terme de recherche', 'error');
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
                showMessage('Aucune réservation trouvée', 'error');
            } else {
                const resultText = results.map(v => 
                    `${v.reservationId}: ${v.reservedBy} - ${v.type} ${v.name} (${v.reservationDate})`
                ).join('<br>');
                showMessage(`<strong>Réservations trouvées:</strong><br>${resultText}`, 'confirmation');
            }
        }

        // Fonction pour retourner à l'accueil
        function goToHomePage() {
            window.location.href = 'index.html';
        }

        // Définir la date minimum à aujourd'hui
        function setMinDate() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date').min = today;
        }

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            displayVehiclesStatus();
            populateVehicleSelect();
            setMinDate();
            
            // Écouter la soumission du formulaire
            document.getElementById('form-reservation').addEventListener('submit', confirmReservation);
        });