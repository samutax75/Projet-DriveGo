// Données de démonstration
        let reservations = [
            {
                id: 1,
                user: "Jean Dupont",
                email: "jean.dupont@email.com",
                vehicle: "Peugeot 308",
                startDate: "2025-07-15",
                endDate: "2025-07-20",
                status: "confirmed"
            },
            {
                id: 2,
                user: "Marie Martin",
                email: "marie.martin@email.com",
                vehicle: "Renault Clio",
                startDate: "2025-07-18",
                endDate: "2025-07-22",
                status: "pending"
            },
            {
                id: 3,
                user: "Pierre Durand",
                email: "pierre.durand@email.com",
                vehicle: "Citroën C3",
                startDate: "2025-07-10",
                endDate: "2025-07-12",
                status: "cancelled"
            }
        ];

        let vehicles = [
            {
                id: 1,
                brand: "Peugeot",
                model: "308",
                year: 2022,
                plate: "AB-123-CD",
                km: 15000,
                control: "2025-12-15",
                status: "available"
            },
            {
                id: 2,
                brand: "Renault",
                model: "Clio",
                year: 2021,
                plate: "EF-456-GH",
                km: 25000,
                control: "2025-10-20",
                status: "reserved"
            },
            {
                id: 3,
                brand: "Citroën",
                model: "C3",
                year: 2020,
                plate: "IJ-789-KL",
                km: 35000,
                control: "2025-08-30",
                status: "maintenance"
            }
        ];

        let users = [
            {
                id: 1,
                name: "Jean Dupont",
                email: "jean.dupont@email.com",
                phone: "0123456789",
                status: "active",
                registrationDate: "2025-01-15"
            },
            {
                id: 2,
                name: "Marie Martin",
                email: "marie.martin@email.com",
                phone: "0987654321",
                status: "active",
                registrationDate: "2025-02-20"
            },
            {
                id: 3,
                name: "Pierre Durand",
                email: "pierre.durand@email.com",
                phone: "0555123456",
                status: "inactive",
                registrationDate: "2025-03-10"
            }
        ];

        // Fonction pour afficher les sections
        function showSection(sectionId) {
            // Masquer toutes les sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Désactiver tous les onglets
            const tabs = document.querySelectorAll('.nav-tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Afficher la section sélectionnée
            document.getElementById(sectionId).classList.add('active');
            
            // Activer l'onglet correspondant
            event.target.classList.add('active');
            
            // Charger les données appropriées
            switch(sectionId) {
                case 'reservations':
                    loadReservations();
                    break;
                case 'vehicles':
                    loadVehicles();
                    break;
                case 'users':
                    loadUsers();
                    break;
            }
        }

        // Fonctions pour gérer les modals
        function showModal(modalId) {
            document.getElementById(modalId).style.display = 'block';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Charger les réservations
        function loadReservations() {
            const tbody = document.getElementById('reservationsTableBody');
            tbody.innerHTML = '';
            
            reservations.forEach(reservation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${reservation.id}</td>
                    <td>${reservation.user}<br><small>${reservation.email}</small></td>
                    <td>${reservation.vehicle}</td>
                    <td>${formatDate(reservation.startDate)}</td>
                    <td>${formatDate(reservation.endDate)}</td>
                    <td><span class="status ${reservation.status}">${getStatusLabel(reservation.status)}</span></td>
                    <td>
                        <button class="btn btn-warning" onclick="editReservation(${reservation.id})">Modifier</button>
                        <button class="btn btn-danger" onclick="cancelReservation(${reservation.id})">Annuler</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Charger les véhicules
        function loadVehicles() {
            const tbody = document.getElementById('vehiclesTableBody');
            tbody.innerHTML = '';
            
            vehicles.forEach(vehicle => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${vehicle.id}</td>
                    <td>${vehicle.brand}</td>
                    <td>${vehicle.model} (${vehicle.year})</td>
                    <td>${vehicle.plate}</td>
                    <td>${vehicle.km.toLocaleString()} km</td>
                    <td>${formatDate(vehicle.control)}</td>
                    <td><span class="status ${vehicle.status}">${getStatusLabel(vehicle.status)}</span></td>
                    <td>
                        <button class="btn btn-warning" onclick="editVehicle(${vehicle.id})">Modifier</button>
                        <button class="btn btn-danger" onclick="deleteVehicle(${vehicle.id})">Supprimer</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Charger les utilisateurs
        function loadUsers() {
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';
            
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td><span class="status ${user.status}">${getStatusLabel(user.status)}</span></td>
                    <td>${formatDate(user.registrationDate)}</td>
                    <td>
                        <button class="btn btn-warning" onclick="editUser(${user.id})">Modifier</button>
                        <button class="btn btn-danger" onclick="deleteUser(${user.id})">Supprimer</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Fonctions utilitaires
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        }

        function getStatusLabel(status) {
            const labels = {
                'confirmed': 'Confirmée',
                'pending': 'En attente',
                'cancelled': 'Annulée',
                'available': 'Disponible',
                'maintenance': 'Maintenance',
                'reserved': 'Réservé',
                'active': 'Actif',
                'inactive': 'Inactif'
            };
            return labels[status] || status;
        }

        // Fonctions de gestion des réservations
        function editReservation(id) {
            const reservation = reservations.find(r => r.id === id);
            if (reservation) {
                const newStatus = prompt('Nouveau statut (confirmed/pending/cancelled):', reservation.status);
                if (newStatus && ['confirmed', 'pending', 'cancelled'].includes(newStatus)) {
                    reservation.status = newStatus;
                    loadReservations();
                    updateStats();
                }
            }
        }

        function cancelReservation(id) {
            if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
                const reservation = reservations.find(r => r.id === id);
                if (reservation) {
                    reservation.status = 'cancelled';
                    loadReservations();
                    updateStats();
                }
            }
        }

        // Fonctions de gestion des véhicules
        function editVehicle(id) {
            const vehicle = vehicles.find(v => v.id === id);
            if (vehicle) {
                // Pré-remplir le formulaire avec les données du véhicule
                document.getElementById('vehicleBrand').value = vehicle.brand;
                document.getElementById('vehicleModel').value = vehicle.model;
                document.getElementById('vehicleYear').value = vehicle.year;
                document.getElementById('vehiclePlate').value = vehicle.plate;
                document.getElementById('vehicleKm').value = vehicle.km;
                document.getElementById('vehicleControl').value = vehicle.control;
                document.getElementById('vehicleStatus').value = vehicle.status;
                
                // Modifier le titre du modal
                document.querySelector('#addVehicleModal h2').textContent = 'Modifier le véhicule';
                
                // Stocker l'ID pour la modification
                document.getElementById('vehicleForm').dataset.editId = id;
                
                showModal('addVehicleModal');
            }
        }

        function deleteVehicle(id) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
                const index = vehicles.findIndex(v => v.id === id);
                if (index > -1) {
                    vehicles.splice(index, 1);
                    loadVehicles();
                    updateStats();
                }
            }
        }

        // Fonctions de gestion des utilisateurs
        function editUser(id) {
            const user = users.find(u => u.id === id);
            if (user) {
                // Pré-remplir le formulaire avec les données de l'utilisateur
                document.getElementById('userName').value = user.name;
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userPhone').value = user.phone;
                document.getElementById('userStatus').value = user.status;
                
                // Modifier le titre du modal
                document.querySelector('#addUserModal h2').textContent = 'Modifier l\'utilisateur';
                
                // Stocker l'ID pour la modification
                document.getElementById('userForm').dataset.editId = id;
                
                showModal('addUserModal');
            }
        }

        function deleteUser(id) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                const index = users.findIndex(u => u.id === id);
                if (index > -1) {
                    users.splice(index, 1);
                    loadUsers();
                    updateStats();
                }
            }
        }

        // Fonction de filtrage des réservations
        function filterReservations() {
            const searchTerm = document.getElementById('searchReservation').value.toLowerCase();
            const statusFilter = document.getElementById('filterStatus').value;
            
            const filteredReservations = reservations.filter(reservation => {
                const matchesSearch = reservation.user.toLowerCase().includes(searchTerm) || 
                                    reservation.email.toLowerCase().includes(searchTerm);
                const matchesStatus = !statusFilter || reservation.status === statusFilter;
                
                return matchesSearch && matchesStatus;
            });
            
            displayFilteredReservations(filteredReservations);
        }

        function displayFilteredReservations(filteredReservations) {
            const tbody = document.getElementById('reservationsTableBody');
            tbody.innerHTML = '';
            
            filteredReservations.forEach(reservation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${reservation.id}</td>
                    <td>${reservation.user}<br><small>${reservation.email}</small></td>
                    <td>${reservation.vehicle}</td>
                    <td>${formatDate(reservation.startDate)}</td>
                    <td>${formatDate(reservation.endDate)}</td>
                    <td><span class="status ${reservation.status}">${getStatusLabel(reservation.status)}</span></td>
                    <td>
                        <button class="btn btn-warning" onclick="editReservation(${reservation.id})">Modifier</button>
                        <button class="btn btn-danger" onclick="cancelReservation(${reservation.id})">Annuler</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Gestion des formulaires
        document.getElementById('vehicleForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const vehicleData = {
                brand: document.getElementById('vehicleBrand').value,
                model: document.getElementById('vehicleModel').value,
                year: parseInt(document.getElementById('vehicleYear').value),
                plate: document.getElementById('vehiclePlate').value,
                km: parseInt(document.getElementById('vehicleKm').value),
                control: document.getElementById('vehicleControl').value,
                status: document.getElementById('vehicleStatus').value
            };
            
            const editId = this.dataset.editId;
            
            if (editId) {
                // Modification
                const vehicle = vehicles.find(v => v.id === parseInt(editId));
                if (vehicle) {
                    Object.assign(vehicle, vehicleData);
                }
                delete this.dataset.editId;
                document.querySelector('#addVehicleModal h2').textContent = 'Ajouter un véhicule';
            } else {
                // Ajout
                vehicleData.id = Math.max(...vehicles.map(v => v.id)) + 1;
                vehicles.push(vehicleData);
            }
            
            loadVehicles();
            updateStats();
            closeModal('addVehicleModal');
            this.reset();
        });

        document.getElementById('userForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userData = {
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value,
                status: document.getElementById('userStatus').value,
                registrationDate: new Date().toISOString().split('T')[0]
            };
            
            const editId = this.dataset.editId;
            
            if (editId) {
                // Modification
                const user = users.find(u => u.id === parseInt(editId));
                if (user) {
                    Object.assign(user, userData);
                    // Conserver la date d'inscription originale
                    user.registrationDate = user.registrationDate;
                }
                delete this.dataset.editId;
                document.querySelector('#addUserModal h2').textContent = 'Ajouter un utilisateur';
            } else {
                // Ajout
                userData.id = Math.max(...users.map(u => u.id)) + 1;
                users.push(userData);
            }
            
            loadUsers();
            updateStats();
            closeModal('addUserModal');
            this.reset();
        });

        // Mise à jour des statistiques
        function updateStats() {
            document.getElementById('totalReservations').textContent = reservations.length;
            document.getElementById('totalVehicles').textContent = vehicles.filter(v => v.status === 'available').length;
            document.getElementById('totalUsers').textContent = users.filter(u => u.status === 'active').length;
            document.getElementById('pendingReservations').textContent = reservations.filter(r => r.status === 'pending').length;
        }

        // Fonction pour exporter les données en CSV
        function exportToCSV(data, filename) {
            const csvContent = "data:text/csv;charset=utf-8," 
                + Object.keys(data[0]).join(",") + "\n"
                + data.map(row => Object.values(row).join(",")).join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Ajout des boutons d'export
        function addExportButtons() {
            const sections = ['reservations', 'vehicles', 'users'];
            
            sections.forEach(section => {
                const sectionDiv = document.getElementById(section);
                const titleElement = sectionDiv.querySelector('.section-title');
                
                const exportBtn = document.createElement('button');
                exportBtn.className = 'btn btn-primary';
                exportBtn.style.float = 'right';
                exportBtn.style.marginTop = '-10px';
                exportBtn.innerHTML = '📥 Exporter CSV';
                
                exportBtn.onclick = function() {
                    let data, filename;
                    switch(section) {
                        case 'reservations':
                            data = reservations;
                            filename = 'reservations.csv';
                            break;
                        case 'vehicles':
                            data = vehicles;
                            filename = 'vehicules.csv';
                            break;
                        case 'users':
                            data = users;
                            filename = 'utilisateurs.csv';
                            break;
                    }
                    exportToCSV(data, filename);
                };
                
                titleElement.appendChild(exportBtn);
            });
        }

        // Fonctions de notification
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 2000;
                font-weight: 600;
                animation: slideInRight 0.3s ease-out;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => document.body.removeChild(notification), 300);
            }, 3000);
        }

        // Ajouter les styles d'animation pour les notifications
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        // Fonction pour gérer les raccourcis clavier
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        document.querySelector('button[onclick="showSection(\'dashboard\')"]').click();
                        break;
                    case '2':
                        e.preventDefault();
                        document.querySelector('button[onclick="showSection(\'reservations\')"]').click();
                        break;
                    case '3':
                        e.preventDefault();
                        document.querySelector('button[onclick="showSection(\'vehicles\')"]').click();
                        break;
                    case '4':
                        e.preventDefault();
                        document.querySelector('button[onclick="showSection(\'users\')"]').click();
                        break;
                }
            }
        });

        // Fonction pour vérifier les contrôles techniques expirés
        function checkTechnicalControls() {
            const today = new Date();
            const expiredVehicles = vehicles.filter(vehicle => {
                const controlDate = new Date(vehicle.control);
                const timeDiff = controlDate - today;
                const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                return daysDiff <= 30; // Alerte 30 jours avant expiration
            });
            
            if (expiredVehicles.length > 0) {
                showNotification(`⚠️ ${expiredVehicles.length} véhicule(s) ont un contrôle technique expirant bientôt!`, 'warning');
            }
        }

        // Fonction pour valider les plaques d'immatriculation françaises
        function validateFrenchPlate(plate) {
            const regex = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;
            return regex.test(plate);
        }

        // Améliorer la validation du formulaire véhicule
        document.getElementById('vehiclePlate').addEventListener('blur', function() {
            const plate = this.value.toUpperCase();
            if (plate && !validateFrenchPlate(plate)) {
                this.style.borderColor = '#e74c3c';
                showNotification('Format de plaque invalide. Utilisez: AB-123-CD', 'error');
            } else {
                this.style.borderColor = '#e0e0e0';
                this.value = plate;
            }
        });

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            loadReservations();
            loadVehicles();
            loadUsers();
            updateStats();
            addExportButtons();
            checkTechnicalControls();
            
            // Mise à jour automatique des statistiques toutes les minutes
            setInterval(updateStats, 60000);
        });

        // Fonction pour fermer les modals en cliquant à l'extérieur
        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        };

        // Fonction pour sauvegarder les données en local (simulation)
        function saveData() {
            const data = {
                reservations: reservations,
                vehicles: vehicles,
                users: users,
                lastUpdate: new Date().toISOString()
            };
            
            // En production, ici vous enverriez les données à votre API
            console.log('Données sauvegardées:', data);
            showNotification('Données sauvegardées avec succès!');
        }

        // Ajout d'un bouton de sauvegarde général
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-success';
        saveBtn.innerHTML = '💾 Sauvegarder';
        saveBtn.style.position = 'fixed';
        saveBtn.style.bottom = '20px';
        saveBtn.style.right = '20px';
        saveBtn.style.zIndex = '1000';
        saveBtn.onclick = saveData;
        document.body.appendChild(saveBtn);