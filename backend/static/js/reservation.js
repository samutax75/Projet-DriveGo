// Utilisateur connecté
        const currentUser = {
            id: 1,
            name: "Martin Dubois",
            email: "martin.dubois@company.com",
            department: "Direction",
            initials: "MD"
        };

        // Données des véhicules (issues de votre base de données)
        let vehicles = [
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
                type: "🚐",
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
                status: "reserved",
                reservedBy: "Sophie Martin",
                reservationDate: "08/07/2025",
                reservationTime: "09:00-17:00"
            },
            {
                id: 4,
                name: "TRAFIC ROUGE",
                type: "🚐",
                immatriculation: "CW-819-FR",
                dateImmatriculation: "26/06/2013",
                status: "maintenance"
            },
            {
                id: 5,
                name: "KANGOO",
                type: "🚗",
                immatriculation: "DS-429-PF",
                dateImmatriculation: "22/06/2015",
                status: "available"
            }
        ];

        // Réservations de l'utilisateur connecté
        let userReservations = [
            {
                id: "RES-2025-001",
                vehicleId: 1,
                userId: 1,
                date: "2025-08-30",
                startTime: "09:00",
                endTime: "17:00",
                destination: "Préfecture de Paris",
                purpose: "mission",
                notes: "Réunion importante avec les services préfectoraux",
                status: "confirmed",
                createdAt: "2025-08-27T10:30:00"
            },
            {
                id: "RES-2025-005",
                vehicleId: 2,
                userId: 1,
                date: "2025-09-02",
                startTime: "14:00",
                endTime: "18:00",
                destination: "Centre de formation",
                purpose: "formation",
                notes: "Formation sécurité routière",
                status: "confirmed",
                createdAt: "2025-08-26T15:45:00"
            }
        ];

        // Fonctions utilitaires
        function getStatusText(status) {
            switch(status) {
                case 'available': return 'Disponible';
                case 'reserved': return 'Réservé';
                case 'maintenance': return 'Maintenance';
                default: return status;
            }
        }

        function getPurposeText(purpose) {
            switch(purpose) {
                case 'mission': return 'Mission professionnelle';
                case 'formation': return 'Formation';
                case 'reunion': return 'Réunion externe';
                case 'transport': return 'Transport de matériel';
                case 'autre': return 'Autre';
                default: return purpose;
            }
        }

        function formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('fr-FR');
        }

        function showMessage(message, type) {
            let messageContainer = document.getElementById('global-message');
            if (!messageContainer) {
                messageContainer = document.createElement('div');
                messageContainer.id = 'global-message';
                messageContainer.style.cssText = `
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 3000;
                    max-width: 400px;
                `;
                document.body.appendChild(messageContainer);
            }
            
            messageContainer.innerHTML = `<div class="${type}" style="margin-bottom: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">${message}</div>`;
            
            setTimeout(() => {
                messageContainer.innerHTML = '';
            }, 4000);
        }

        function showModalMessage(message, type) {
            const messageDiv = document.getElementById('modal-message');
            messageDiv.innerHTML = `<div class="${type}">${message}</div>`;
        }

        function showEditModalMessage(message, type) {
            const messageDiv = document.getElementById('edit-modal-message');
            messageDiv.innerHTML = `<div class="${type}">${message}</div>`;
        }

        // Gestion des onglets
        function initTabs() {
            const tabs = document.querySelectorAll('.tab');
            const tabPanes = document.querySelectorAll('.tab-pane');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tabPanes.forEach(p => p.classList.remove('active'));

                    tab.classList.add('active');
                    const targetTab = tab.getAttribute('data-tab');
                    document.getElementById(targetTab + '-tab').classList.add('active');

                    if (targetTab === 'reservations') {
                        displayUserReservations();
                    }
                });
            });
        }

        // Affichage des véhicules
        function displayVehicles() {
            const container = document.getElementById('vehicles-grid');
            
            container.innerHTML = vehicles.map(vehicle => {
                const statusClass = `status-${vehicle.status}`;
                const statusText = getStatusText(vehicle.status);
                
                let actionButton = '';
                if (vehicle.status === 'available') {
                    actionButton = `<button class="btn btn-success" onclick="openReservationModal(${vehicle.id})">📝 Réserver</button>`;
                } else if (vehicle.status === 'reserved') {
                    actionButton = `<button class="btn" disabled>Indisponible</button>`;
                } else {
                    actionButton = `<button class="btn" disabled>Maintenance</button>`;
                }

                return `
                    <div class="vehicle-card ${vehicle.status}">
                        <div class="vehicle-header">
                            <div class="vehicle-name">${vehicle.type} ${vehicle.name}</div>
                            <div class="status-badge ${statusClass}">${statusText}</div>
                        </div>
                        <div class="vehicle-info">
                            <div><strong>🔢 Immatriculation:</strong> ${vehicle.immatriculation}</div>
                            <div><strong>📅 Mise en service:</strong> ${vehicle.dateImmatriculation}</div>
                            ${vehicle.reservedBy ? `<div style="margin-top: 10px; color: #856404;"><strong>👤 Réservé par:</strong> ${vehicle.reservedBy}</div>` : ''}
                        </div>
                        ${actionButton}
                    </div>
                `;
            }).join('');
        }

        // Affichage des réservations utilisateur
        function displayUserReservations() {
            const container = document.getElementById('reservations-list');
            
            if (userReservations.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📋</div>
                        <h3>Aucune réservation</h3>
                        <p>Vous n'avez pas encore de réservations en cours.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = userReservations.map(reservation => {
                const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
                const purposeText = getPurposeText(reservation.purpose);
                
                return `
                    <div class="reservation-item">
                        <div class="reservation-header">
                            <div class="reservation-main">
                                <div class="reservation-id">🎫 ${reservation.id}</div>
                                <div class="reservation-details">
                                    <div><strong>🚗 Véhicule:</strong> ${vehicle?.type} ${vehicle?.name} (${vehicle?.immatriculation})</div>
                                    <div><strong>📅 Date:</strong> ${formatDate(reservation.date)}</div>
                                    <div><strong>🕐 Horaire:</strong> ${reservation.startTime} - ${reservation.endTime}</div>
                                    <div><strong>📍 Destination:</strong> ${reservation.destination || 'Non spécifiée'}</div>
                                    <div><strong>💼 Motif:</strong> ${purposeText}</div>
                                    ${reservation.notes ? `<div><strong>📝 Notes:</strong> ${reservation.notes}</div>` : ''}
                                </div>
                            </div>
                            <div class="reservation-actions">
                                <button class="btn btn-warning" onclick="editReservation('${reservation.id}')" style="width: auto; padding: 8px 12px;">✏️</button>
                                <button class="btn btn-danger" onclick="cancelReservation('${reservation.id}')" style="width: auto; padding: 8px 12px;">🗑️</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Ouvrir modal de réservation
        function openReservationModal(vehicleId) {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (!vehicle || vehicle.status !== 'available') return;

            document.getElementById('vehicle-id').value = vehicleId;
            document.getElementById('vehicle-display').value = `${vehicle.type} ${vehicle.name} - ${vehicle.immatriculation}`;
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('reservation-date').min = today;
            
            document.getElementById('reservation-modal').classList.add('show');
        }

        // Fermer modals
        function closeModal() {
            document.getElementById('reservation-modal').classList.remove('show');
            document.getElementById('reservation-form').reset();
            document.getElementById('modal-message').innerHTML = '';
        }

        function closeEditModal() {
            document.getElementById('edit-modal').classList.remove('show');
            document.getElementById('edit-form').reset();
            document.getElementById('edit-modal-message').innerHTML = '';
        }

        // Confirmer une réservation
        function submitReservation(event) {
            event.preventDefault();
            
            const vehicleId = parseInt(document.getElementById('vehicle-id').value);
            const date = document.getElementById('reservation-date').value;
            const startTime = document.getElementById('start-time').value;
            const endTime = document.getElementById('end-time').value;
            const destination = document.getElementById('destination').value;
            const purpose = document.getElementById('purpose').value;
            const notes = document.getElementById('notes').value;
            
            if (!date || !startTime || !endTime || !purpose) {
                showModalMessage('Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }

            if (startTime >= endTime) {
                showModalMessage('L\'heure de fin doit être postérieure à l\'heure de début', 'error');
                return;
            }
            
            const reservationId = `RES-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
            const vehicle = vehicles.find(v => v.id === vehicleId);
            
            const newReservation = {
                id: reservationId,
                vehicleId: vehicleId,
                userId: currentUser.id,
                date: date,
                startTime: startTime,
                endTime: endTime,
                destination: destination || 'Non spécifiée',
                purpose: purpose,
                notes: notes,
                status: 'confirmed',
                createdAt: new Date().toISOString()
            };
            
            userReservations.unshift(newReservation);
            
            vehicle.status = 'reserved';
            vehicle.reservedBy = currentUser.name;
            vehicle.reservationDate = formatDate(date);
            vehicle.reservationTime = `${startTime}-${endTime}`;
            
            showModalMessage(`
                <strong>✅ Réservation confirmée!</strong><br>
                <strong>ID:</strong> ${reservationId}<br>
                <strong>Véhicule:</strong> ${vehicle.type} ${vehicle.name}<br>
                <strong>Date:</strong> ${formatDate(date)}<br>
                <strong>Horaire:</strong> ${startTime} - ${endTime}
            `, 'confirmation');
            
            displayVehicles();
            
            setTimeout(() => {
                closeModal();
            }, 3000);
        }

        // Modifier une réservation
        function editReservation(reservationId) {
            const reservation = userReservations.find(r => r.id === reservationId);
            if (!reservation) return;
            
            const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
            
            document.getElementById('edit-reservation-id').value = reservationId;
            document.getElementById('edit-vehicle-display').value = `${vehicle.type} ${vehicle.name} - ${vehicle.immatriculation}`;
            document.getElementById('edit-date').value = reservation.date;
            document.getElementById('edit-start-time').value = reservation.startTime;
            document.getElementById('edit-end-time').value = reservation.endTime;
            document.getElementById('edit-destination').value = reservation.destination;
            document.getElementById('edit-purpose').value = reservation.purpose;
            document.getElementById('edit-notes').value = reservation.notes;
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('edit-date').min = today;
            
            document.getElementById('edit-modal').classList.add('show');
        }

        // Sauvegarder modification
        function submitEditReservation(event) {
            event.preventDefault();
            
            const reservationId = document.getElementById('edit-reservation-id').value;
            const date = document.getElementById('edit-date').value;
            const startTime = document.getElementById('edit-start-time').value;
            const endTime = document.getElementById('edit-end-time').value;
            const destination = document.getElementById('edit-destination').value;
            const purpose = document.getElementById('edit-purpose').value;
            const notes = document.getElementById('edit-notes').value;
            
            if (!date || !startTime || !endTime || !purpose) {
                showEditModalMessage('Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }

            if (startTime >= endTime) {
                showEditModalMessage('L\'heure de fin doit être postérieure à l\'heure de début', 'error');
                return;
            }
            
            const reservationIndex = userReservations.findIndex(r => r.id === reservationId);
            if (reservationIndex !== -1) {
                userReservations[reservationIndex] = {
                    ...userReservations[reservationIndex],
                    date: date,
                    startTime: startTime,
                    endTime: endTime,
                    destination: destination || 'Non spécifiée',
                    purpose: purpose,
                    notes: notes
                };
                
                const vehicle = vehicles.find(v => v.id === userReservations[reservationIndex].vehicleId);
                if (vehicle && vehicle.status === 'reserved') {
                    vehicle.reservationDate = formatDate(date);
                    vehicle.reservationTime = `${startTime}-${endTime}`;
                }
                
                showEditModalMessage('✅ Réservation modifiée avec succès!', 'confirmation');
                
                displayVehicles();
                displayUserReservations();
                
                setTimeout(() => {
                    closeEditModal();
                }, 2000);
            }
        }

        // Annuler une réservation
        function cancelReservation(reservationId) {
            if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation?')) return;
            
            const reservationIndex = userReservations.findIndex(r => r.id === reservationId);
            if (reservationIndex === -1) return;
            
            const reservation = userReservations[reservationIndex];
            const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
            
            userReservations.splice(reservationIndex, 1);
            
            if (vehicle) {
                vehicle.status = 'available';
                delete vehicle.reservedBy;
                delete vehicle.reservationDate;
                delete vehicle.reservationTime;
            }
            
            displayVehicles();
            displayUserReservations();
            
            showMessage('✅ Réservation annulée avec succès', 'confirmation');
        }

        // Export des réservations
        function exportReservations(format) {
            if (userReservations.length === 0) {
                showMessage('Aucune réservation à exporter', 'error');
                return;
            }

            const data = userReservations.map(reservation => {
                const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
                return {
                    'ID Réservation': reservation.id,
                    'Véhicule': `${vehicle?.type} ${vehicle?.name}`,
                    'Immatriculation': vehicle?.immatriculation,
                    'Date': formatDate(reservation.date),
                    'Heure début': reservation.startTime,
                    'Heure fin': reservation.endTime,
                    'Destination': reservation.destination,
                    'Motif': getPurposeText(reservation.purpose),
                    'Notes': reservation.notes || '',
                    'Statut': 'Confirmée',
                    'Créé le': new Date(reservation.createdAt).toLocaleDateString('fr-FR')
                };
            });

            switch (format) {
                case 'csv':
                    exportToCSV(data, 'mes_reservations.csv');
                    break;
                case 'json':
                    exportToJSON(data, 'mes_reservations.json');
                    break;
                case 'pdf':
                    exportToPDF(data);
                    break;
            }
        }

        // Export CSV
        function exportToCSV(data, filename) {
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(';'),
                ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(';'))
            ].join('\n');
            
            downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
            showMessage('✅ Export CSV téléchargé avec succès', 'confirmation');
        }

        // Export JSON
        function exportToJSON(data, filename) {
            const jsonContent = JSON.stringify({
                exportDate: new Date().toISOString(),
                user: currentUser.name,
                reservations: data
            }, null, 2);
            downloadFile(jsonContent, filename, 'application/json');
            showMessage('✅ Export JSON téléchargé avec succès', 'confirmation');
        }

        // Export PDF (simulation textuelle)
        function exportToPDF(data) {
            const content = `RAPPORT DE RÉSERVATIONS - ${currentUser.name}
Date d'export: ${new Date().toLocaleDateString('fr-FR')}
Département: ${currentUser.department}

==================================================

${data.map((item, index) => `
${index + 1}. RÉSERVATION ${item['ID Réservation']}
   Véhicule: ${item['Véhicule']} (${item['Immatriculation']})
   Date: ${item['Date']} 
   Horaires: ${item['Heure début']} - ${item['Heure fin']}
   Destination: ${item['Destination']}
   Motif: ${item['Motif']}
   ${item['Notes'] ? 'Notes: ' + item['Notes'] : ''}
   Créé le: ${item['Créé le']}
   --------------------------------------------------
`).join('')}

RÉSUMÉ:
Nombre total de réservations: ${data.length}
Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
            
            downloadFile(content, 'mes_reservations.txt', 'text/plain');
            showMessage('✅ Export PDF (format texte) téléchargé avec succès', 'confirmation');
        }

        // Fonction utilitaire de téléchargement
        function downloadFile(content, filename, contentType) {
            const blob = new Blob([content], { type: contentType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        // Fermeture modal au clic extérieur
        window.addEventListener('click', function(event) {
            const reservationModal = document.getElementById('reservation-modal');
            const editModal = document.getElementById('edit-modal');
            
            if (event.target === reservationModal) {
                closeModal();
            }
            if (event.target === editModal) {
                closeEditModal();
            }
        });

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            initTabs();
            displayVehicles();
            displayUserReservations();
            
            document.getElementById('reservation-form').addEventListener('submit', submitReservation);
            document.getElementById('edit-form').addEventListener('submit', submitEditReservation);
        });