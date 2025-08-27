// Base de données simulée
        const DATABASE = {
            users: [
                { id: 1, nom: "Jean Dupont", email: "jean.dupont@drivego.fr", role: "chauffeur" },
                { id: 2, nom: "Marie Martin", email: "marie.martin@drivego.fr", role: "chauffeur" },
                { id: 3, nom: "Pierre Dubois", email: "pierre.dubois@drivego.fr", role: "chauffeur" },
                { id: 4, nom: "Sophie Leroy", email: "sophie.leroy@drivego.fr", role: "chauffeur" },
                { id: 5, nom: "Thomas Bernard", email: "thomas.bernard@drivego.fr", role: "chauffeur" }
            ],
            
            vehicles: [
                {
                    id: 1,
                    nom: "TRAFIC BLANC",
                    immatriculation: "FV-088-JJ",
                    dateImmatriculation: "26/11/2020",
                    controle: "29/10/2024",
                    prochainControle: "28/10/2026",
                    finValidite: "30/09/2026",
                    numeroCarte: "4985080"
                },
                {
                    id: 2,
                    nom: "TRAFIC PMR",
                    immatriculation: "GT-176-AF",
                    dateImmatriculation: "14/12/2023",
                    controle: "",
                    prochainControle: "14/12/2027",
                    finValidite: "30/06/2029",
                    numeroCarte: "8954319"
                },
                {
                    id: 3,
                    nom: "TRAFIC VERT",
                    immatriculation: "EJ-374-TT",
                    dateImmatriculation: "02/02/2017",
                    controle: "12/03/2025",
                    prochainControle: "11/03/2027",
                    finValidite: "30/09/2026",
                    numeroCarte: "4985081"
                },
                {
                    id: 4,
                    nom: "TRAFIC ROUGE",
                    immatriculation: "CW-819-FR",
                    dateImmatriculation: "26/06/2013",
                    controle: "27/01/2025",
                    prochainControle: "26/01/2027",
                    finValidite: "30/09/2026",
                    numeroCarte: "4985082"
                },
                {
                    id: 5,
                    nom: "KANGOO",
                    immatriculation: "DS-429-PF",
                    dateImmatriculation: "22/06/2015",
                    controle: "29/01/2025",
                    prochainControle: "28/01/2027",
                    finValidite: "30/09/2026",
                    numeroCarte: "4985084"
                }
            ],

            reservations: [
                {
                    id: 1,
                    vehicleId: 2,
                    userId: 1, // Jean Dupont
                    date: "2025-08-25",
                    timeSlot: "14:30-16:00",
                    purpose: "Formation conduite",
                    status: "active"
                },
                {
                    id: 2,
                    vehicleId: 3,
                    userId: 3, // Pierre Dubois  
                    date: "2025-08-26",
                    timeSlot: "09:00-12:00",
                    purpose: "Mission transport",
                    status: "active"
                }
            ],

            missions: [
                {
                    id: 1,
                    vehicleId: 1,
                    userId: 1, // Jean Dupont
                    nom: "Jean Dupont",
                    vehicleName: "TRAFIC BLANC",
                    missionDate: "2025-08-24",
                    departureTime: "10:30",
                    arrivalTime: "12:15",
                    missionNature: "Transport de personnel",
                    destination: "Aéroport Nice",
                    passengers: 4,
                    kmDepart: 45230,
                    kmArrivee: 45285,
                    distanceParcourue: 55,
                    status: "completed",
                    startTime: new Date('2025-08-24T10:30:00'),
                    endTime: new Date('2025-08-24T12:15:00'),
                    notes: "Mission réussie, passagers à l'heure"
                }
            ],

            activeMissions: [
                // Exemple: Jean Dupont a une mission active sur le véhicule 4
                {
                    vehicleId: 4,
                    userId: 1, // Jean Dupont
                    id: Date.now(),
                    vehicleName: "TRAFIC ROUGE",
                    nom: "Jean Dupont",
                    missionDate: "2025-08-24",
                    departureTime: "14:30",
                    missionNature: "Livraison urgente",
                    destination: "Centre Commercial Polygone",
                    passengers: 1,
                    kmDepart: 45100,
                    status: "active",
                    startTime: new Date()
                }
            ]
        };

        // Utilisateur connecté (simulé)
        let currentUser = DATABASE.users[0]; // Jean Dupont par défaut
        let selectedVehicle = null;

        // Fonctions utilitaires
        function getUserById(userId) {
            return DATABASE.users.find(u => u.id === userId);
        }

        function getVehicleById(vehicleId) {
            return DATABASE.vehicles.find(v => v.id === vehicleId);
        }

        function hasActiveUserMission() {
            return DATABASE.activeMissions.some(mission => mission.userId === currentUser.id);
        }

        function getUserActiveMission() {
            return DATABASE.activeMissions.find(mission => mission.userId === currentUser.id);
        }

        function canUserAccessVehicle(vehicle) {
            // L'utilisateur peut accéder au véhicule si:
            // 1. Il a une mission active dessus
            const userActiveMission = DATABASE.activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicle.id);
            if (userActiveMission) return { canAccess: true, reason: 'my-mission' };

            // 2. Il a une réservation dessus
            const userReservation = DATABASE.reservations.find(r => r.userId === currentUser.id && r.vehicleId === vehicle.id && r.status === 'active');
            if (userReservation) return { canAccess: true, reason: 'my-reservation' };

            // 3. Le véhicule est libre ET l'utilisateur n'a pas d'autre mission active
            const vehicleOccupied = DATABASE.activeMissions.some(m => m.vehicleId === vehicle.id) || 
                                  DATABASE.reservations.some(r => r.vehicleId === vehicle.id && r.status === 'active');
            
            if (!vehicleOccupied && !hasActiveUserMission()) {
                return { canAccess: true, reason: 'available' };
            }

            // 4. Sinon, accès refusé
            return { canAccess: false, reason: 'occupied' };
        }

        function getVehicleStatus(vehicle) {
            const access = canUserAccessVehicle(vehicle);
            
            if (access.reason === 'my-mission') {
                const mission = DATABASE.activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicle.id);
                return {
                    status: 'my-mission',
                    text: '🎯 Ma mission',
                    user: currentUser.nom,
                    canSelect: true
                };
            }
            
            if (access.reason === 'my-reservation') {
                const reservation = DATABASE.reservations.find(r => r.userId === currentUser.id && r.vehicleId === vehicle.id);
                return {
                    status: 'my-reservation',
                    text: '📅 Ma réservation',
                    user: currentUser.nom,
                    canSelect: true
                };
            }
            
            if (access.reason === 'available') {
                return {
                    status: 'available',
                    text: '✅ Disponible',
                    user: null,
                    canSelect: true
                };
            }
            
            // Véhicule occupé par quelqu'un d'autre
            const otherMission = DATABASE.activeMissions.find(m => m.vehicleId === vehicle.id);
            const otherReservation = DATABASE.reservations.find(r => r.vehicleId === vehicle.id && r.status === 'active');
            
            if (otherMission) {
                const otherUser = getUserById(otherMission.userId);
                return {
                    status: 'occupied',
                    text: '🚗 En mission',
                    user: otherUser ? otherUser.nom : 'Utilisateur inconnu',
                    canSelect: false
                };
            }
            
            if (otherReservation) {
                const otherUser = getUserById(otherReservation.userId);
                return {
                    status: 'occupied',
                    text: '📅 Réservé',
                    user: otherUser ? otherUser.nom : 'Utilisateur inconnu',
                    canSelect: false
                };
            }
            
            return {
                status: 'occupied',
                text: '❌ Indisponible',
                user: null,
                canSelect: false
            };
        }

        // Mise à jour des informations utilisateur
        function updateUserInfo() {
            const userInfo = document.getElementById('userInfo');
            userInfo.textContent = `👤 ${currentUser.nom}`;
        }

        // Génération de la liste des véhicules
        function generateVehicleList() {
            const vehicleList = document.getElementById('vehicleList');
            vehicleList.innerHTML = '';

            DATABASE.vehicles.forEach(vehicle => {
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
                    const isCurrentUser = vehicleStatus.user === currentUser.nom;
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

        // Sélection d'un véhicule
        function selectVehicle(vehicle) {
            const access = canUserAccessVehicle(vehicle);
            if (!access.canAccess) {
                showNotification('❌ Vous ne pouvez pas accéder à ce véhicule', 'error');
                return;
            }

            selectedVehicle = vehicle;

            const vehicleItems = document.querySelectorAll('.vehicle-item:not(.disabled)');
            vehicleItems.forEach(item => item.classList.remove('selected'));

            const currentIndex = DATABASE.vehicles.findIndex(v => v.id === vehicle.id);
            const currentItem = document.querySelectorAll('.vehicle-item')[currentIndex];
            if (currentItem && !currentItem.classList.contains('disabled')) {
                currentItem.classList.add('selected');
            }

            // Sur mobile, ouvrir la modal
            if (window.innerWidth <= 1200) {
                openMobileModal(vehicle);
            } else {
                // Sur desktop, afficher dans le panneau
                showVehicleDetails(vehicle);
            }
        }

        function openMobileModal(vehicle) {
            const modal = document.getElementById('mobileModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modalTitle.textContent = `🎯 ${vehicle.nom}`;
            modalBody.innerHTML = generateVehicleDetailsHTML(vehicle);
            
            // Ajouter le bouton pour voir les missions sur mobile
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
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        function openMissionsModal() {
            const modal = document.getElementById('missionsModal');
            const missionsList = document.getElementById('modalMissionsList');
            
            // Synchroniser avec la liste des missions de l'utilisateur
            missionsList.innerHTML = generateUserMissionsList();
            
            modal.style.display = 'block';
        }

        function closeMissionsModal() {
            const modal = document.getElementById('missionsModal');
            modal.style.display = 'none';
        }

        function generateVehicleDetailsHTML(vehicle) {
            const access = canUserAccessVehicle(vehicle);
            
            if (!access.canAccess) {
                return `
                    <div class="access-denied">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <h4>🚫 Accès non autorisé</h4>
                        <p>Ce véhicule est utilisé par un autre utilisateur ou vous avez déjà une mission active.</p>
                    </div>
                `;
            }

            const userActiveMission = DATABASE.activeMissions.find(m => m.userId === currentUser.id && m.vehicleId === vehicle.id);
            const userReservation = DATABASE.reservations.find(r => r.userId === currentUser.id && r.vehicleId === vehicle.id && r.status === 'active');

            let missionControlHTML = '';

            if (userActiveMission) {
                // Utilisateur a une mission active sur ce véhicule
                missionControlHTML = `
                    <div class="mission-active">
                        <h4>🎯 Mission en cours</h4>
                        <div class="mission-info">
                            <div class="mission-info-item">
                                <div class="mission-info-label">Conducteur</div>
                                <div class="mission-info-value">👤 ${userActiveMission.nom}</div>
                            </div>
                            <div class="mission-info-item">
                                <div class="mission-info-label">Date</div>
                                <div class="mission-info-value">${new Date(userActiveMission.missionDate).toLocaleDateString('fr-FR')}</div>
                            </div>
                            <div class="mission-info-item">
                                <div class="mission-info-label">Heure de départ</div>
                                <div class="mission-info-value">${userActiveMission.departureTime}</div>
                            </div>
                            <div class="mission-info-item">
                                <div class="mission-info-label">Nature</div>
                                <div class="mission-info-value">${userActiveMission.missionNature}</div>
                            </div>
                            <div class="mission-info-item">
                                <div class="mission-info-label">Destination</div>
                                <div class="mission-info-value">${userActiveMission.destination}</div>
                            </div>
                            <div class="mission-info-item">
                                <div class="mission-info-label">Passagers</div>
                                <div class="mission-info-value">${userActiveMission.passengers}</div>
                            </div>
                            <div class="mission-info-item">
                                <div class="mission-info-label">Km départ</div>
                                <div class="mission-info-value">${userActiveMission.kmDepart} km</div>
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
                                               placeholder="Ex: 45280" min="${userActiveMission.kmDepart}" required>
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
            } else if (userReservation) {
                // Utilisateur a une réservation sur ce véhicule
                missionControlHTML = `
                    <div class="reservation-active">
                        <h4>📅 Ma réservation</h4>
                        <div class="reservation-info">
                            <div class="reservation-info-item">
                                <div class="mission-info-label">Réservé par</div>
                                <div class="mission-info-value">👤 Vous</div>
                            </div>
                            <div class="reservation-info-item">
                                <div class="mission-info-label">Date</div>
                                <div class="mission-info-value">${new Date(userReservation.date).toLocaleDateString('fr-FR')}</div>
                            </div>
                            <div class="reservation-info-item">
                                <div class="mission-info-label">Horaire</div>
                                <div class="mission-info-value">${userReservation.timeSlot}</div>
                            </div>
                            <div class="reservation-info-item">
                                <div class="mission-info-label">Objectif</div>
                                <div class="mission-info-value">${userReservation.purpose}</div>
                            </div>
                        </div>
                        
                        <div class="reservation-actions">
                            <button onclick="cancelMyReservation(${vehicle.id})" class="btn btn-warning">
                                ❌ Annuler ma réservation
                            </button>
                            <button onclick="startMissionFromReservation(${vehicle.id})" class="btn btn-success">
                                🚀 Commencer la mission
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Véhicule disponible pour une nouvelle mission
                missionControlHTML = `
                    <div class="mission-control">
                        <h4>🚀 Nouvelle Mission</h4>
                        <form onsubmit="startMission(event, ${vehicle.id})">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="nom">👤 Nom du conducteur</label>
                                    <input type="text" id="nom" name="nom" value="${currentUser.nom}" readonly 
                                           style="background-color: #f3f4f6; opacity: 0.8;">
                                </div>
                                
                                <div class="form-group">
                                    <label for="missionDate">📅 Date de mission</label>
                                    <input type="date" id="missionDate" name="missionDate" 
                                           value="${new Date().toISOString().split('T')[0]}" required>
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
                                           placeholder="2" min="0" max="8" required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="missionNature">📋 Nature de la mission</label>
                                <select id="missionNature" name="missionNature" required onchange="checkAutre(this)">
                                    <option value="">Sélectionner le type de mission</option>
                                    <option value="transport-personnel">🚌 Transport de personnel</option>
                                    <option value="livraison">📦 Livraison</option>
                                    <option value="maintenance">🔧 Maintenance</option>
                                    <option value="urgence">🚨 Mission d'urgence</option>
                                    <option value="formation">🎓 Formation/Conduite</option>
                                    <option value="autre">✏️ Autre</option>
                                </select>
                            </div>
                            
                            <div class="form-group hidden" id="autreGroup">
                                <label for="autreText">✏️ Précisez la mission</label>
                                <input type="text" id="autreText" name="autreText" placeholder="Décrivez la mission">
                            </div>
                            
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
                            
                            <button type="submit" class="btn btn-primary">
                                ▶️ Démarrer la mission
                            </button>
                        </form>
                    </div>
                `;
            }

            return `
                <div class="vehicle-header-detail">
                    <h3>${vehicle.nom}</h3>
                    <p>${vehicle.immatriculation}</p>
                </div>

                ${missionControlHTML}
            `;
        }

        // Fonction pour gérer la sélection "Autre" dans nature de mission
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

        // Affichage des détails du véhicule
        function showVehicleDetails(vehicle) {
            document.getElementById('noSelection').style.display = 'none';
            document.getElementById('vehicleDetails').style.display = 'block';
            document.getElementById('vehicleDetails').innerHTML = generateVehicleDetailsHTML(vehicle);
        }

        // Annuler ma réservation
        function cancelMyReservation(vehicleId) {
            const reservation = DATABASE.reservations.find(r => r.userId === currentUser.id && r.vehicleId === vehicleId && r.status === 'active');
            if (reservation) {
                if (confirm('Êtes-vous sûr de vouloir annuler votre réservation ?')) {
                    reservation.status = 'cancelled';

                    generateVehicleList();
                    if (selectedVehicle && selectedVehicle.id === vehicleId) {
                        if (window.innerWidth <= 1200) {
                            openMobileModal(selectedVehicle);
                        } else {
                            showVehicleDetails(selectedVehicle);
                        }
                    }

                    showNotification('✅ Réservation annulée avec succès', 'success');
                }
            }
        }

        // Commencer une mission depuis une réservation
        function startMissionFromReservation(vehicleId) {
            const reservation = DATABASE.reservations.find(r => r.userId === currentUser.id && r.vehicleId === vehicleId && r.status === 'active');
            if (reservation) {
                reservation.status = 'completed';

                const mission = {
                    id: Date.now(),
                    vehicleId: vehicleId,
                    userId: currentUser.id,
                    vehicleName: getVehicleById(vehicleId).nom,
                    nom: currentUser.nom,
                    missionDate: reservation.date,
                    departureTime: new Date().toTimeString().slice(0, 5),
                    missionNature: reservation.purpose,
                    destination: 'À définir',
                    passengers: 1,
                    kmDepart: 0,
                    status: 'active',
                    startTime: new Date()
                };

                DATABASE.activeMissions.push(mission);
                DATABASE.missions.push(mission);

                generateVehicleList();
                if (window.innerWidth <= 1200) {
                    openMobileModal(selectedVehicle);
                } else {
                    showVehicleDetails(selectedVehicle);
                }
                updateMissionsList();

                showNotification('🚀 Mission démarrée depuis votre réservation', 'success');
            }
        }

        // Démarrer une mission
        function startMission(event, vehicleId) {
            event.preventDefault();

            // Vérifier si l'utilisateur a déjà une mission active
            if (hasActiveUserMission()) {
                showNotification('❌ Vous avez déjà une mission active', 'error');
                return;
            }

            const formData = new FormData(event.target);
            const nom = currentUser.nom; // Toujours l'utilisateur connecté
            const missionDate = formData.get('missionDate');
            const departureTime = formData.get('departureTime');
            let missionNature = formData.get('missionNature');
            const autreText = formData.get('autreText');
            const destination = formData.get('destination');
            const passengers = parseInt(formData.get('passengers'));
            const kmDepart = parseInt(formData.get('kmDepart'));

            if (missionNature === 'autre' && autreText) {
                missionNature = autreText;
            }

            const mission = {
                id: Date.now(),
                vehicleId: vehicleId,
                userId: currentUser.id,
                vehicleName: getVehicleById(vehicleId).nom,
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

            DATABASE.activeMissions.push(mission);
            DATABASE.missions.push(mission);

            generateVehicleList();
            if (window.innerWidth <= 1200) {
                openMobileModal(selectedVehicle);
            } else {
                showVehicleDetails(selectedVehicle);
            }
            updateMissionsList();

            showNotification('🚀 Mission démarrée avec succès', 'success');
        }

        // Terminer une mission avec détails
        function endMissionWithDetails(event, vehicleId) {
            event.preventDefault();

            const formData = new FormData(event.target);
            const arrivalTime = formData.get('arrivalTime');
            const kmArrivee = parseInt(formData.get('kmArrivee'));
            const notes = formData.get('notes');

            const missionIndex = DATABASE.activeMissions.findIndex(m => m.userId === currentUser.id && m.vehicleId === vehicleId);
            if (missionIndex !== -1) {
                const mission = DATABASE.activeMissions[missionIndex];
                const distanceParcourue = kmArrivee - mission.kmDepart;

                // Mettre à jour la mission dans la base de données
                const dbMissionIndex = DATABASE.missions.findIndex(m => m.id === mission.id);
                if (dbMissionIndex !== -1) {
                    DATABASE.missions[dbMissionIndex].status = 'completed';
                    DATABASE.missions[dbMissionIndex].arrivalTime = arrivalTime;
                    DATABASE.missions[dbMissionIndex].kmArrivee = kmArrivee;
                    DATABASE.missions[dbMissionIndex].distanceParcourue = distanceParcourue;
                    DATABASE.missions[dbMissionIndex].notes = notes;
                    DATABASE.missions[dbMissionIndex].endTime = new Date();
                }

                // Retirer de la liste des missions actives
                DATABASE.activeMissions.splice(missionIndex, 1);

                generateVehicleList();
                if (selectedVehicle && selectedVehicle.id === vehicleId) {
                    if (window.innerWidth <= 1200) {
                        openMobileModal(selectedVehicle);
                    } else {
                        showVehicleDetails(selectedVehicle);
                    }
                }
                updateMissionsList();

                showNotification(`🏁 Mission terminée ! Distance: ${distanceParcourue} km`, 'success');
            }
        }

        // Générer la liste des missions de l'utilisateur
        function generateUserMissionsList() {
            const userMissions = DATABASE.missions.filter(m => m.userId === currentUser.id);

            if (userMissions.length === 0) {
                return `
                    <p style="text-align: center; color: #6b7280; padding: 40px;">
                        🔍 Aucune mission enregistrée
                    </p>
                `;
            }

            const sortedMissions = [...userMissions].sort((a, b) => b.startTime - a.startTime);

            return sortedMissions.map(mission => `
                <div class="mission-item ${mission.status}">
                    <div class="mission-header">
                        <div class="mission-destination">📍 ${mission.destination}</div>
                        <div class="mission-status ${mission.status}">
                            ${mission.status === 'active' ? '🟡 En cours' : '✅ Terminée'}
                        </div>
                    </div>
                    <div class="mission-details">
                        <div>🚗 ${mission.vehicleName}</div>
                        <div>👤 ${mission.nom}</div>
                        <div>📅 ${new Date(mission.missionDate).toLocaleDateString('fr-FR')}</div>
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

        // Mettre à jour la liste des missions
        function updateMissionsList() {
            const missionsList = document.getElementById('missionsList');
            missionsList.innerHTML = generateUserMissionsList();
        }

        // Système de notifications
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

        // Bouton retour
        function goToHomePage() {
            if (confirm('Êtes-vous sûr de vouloir quitter la gestion des véhicules ?')) {
                window.location.href = "index.html"; 
            }
        }

        // Simulation de changement d'utilisateur (pour tests)
        function switchUser(userId) {
            const user = getUserById(userId);
            if (user) {
                currentUser = user;
                updateUserInfo();
                generateVehicleList();
                updateMissionsList();
                
                // Réinitialiser la sélection
                selectedVehicle = null;
                document.getElementById('noSelection').style.display = 'block';
                document.getElementById('vehicleDetails').style.display = 'none';
                
                showNotification(`👤 Connecté en tant que ${user.nom}`, 'info');
            }
        }

        // Gestion du redimensionnement
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1200) {
                closeMobileModal();
                closeMissionsModal();
                if (selectedVehicle) {
                    showVehicleDetails(selectedVehicle);
                }
            }
        });

        // Fermeture des modals en cliquant à l'extérieur
        document.getElementById('mobileModal').addEventListener('click', (e) => {
            if (e.target.id === 'mobileModal') {
                closeMobileModal();
            }
        });

        document.getElementById('missionsModal').addEventListener('click', (e) => {
            if (e.target.id === 'missionsModal') {
                closeMissionsModal();
            }
        });

        // Initialisation
        document.addEventListener('DOMContentLoaded', function () {
            updateUserInfo();
            generateVehicleList();
            updateMissionsList();

            const noSelection = document.getElementById('noSelection');
            if (noSelection) noSelection.style.display = 'block';

            const details = document.getElementById('vehicleDetails');
            if (details) details.style.display = 'none';

            console.log('🚗 DriveGo - Système de gestion dynamique initialisé');
            console.log(`👤 Utilisateur connecté: ${currentUser.nom}`);
            console.log(`🎯 Missions actives utilisateur: ${hasActiveUserMission() ? 'Oui' : 'Non'}`);

            // Boutons de test pour changer d'utilisateur (à supprimer en production)
            if (window.location.search.includes('debug=true')) {
                const debugPanel = document.createElement('div');
                debugPanel.style.cssText = `
                    position: fixed; 
                    bottom: 20px; 
                    left: 20px; 
                    background: rgba(0,0,0,0.8); 
                    color: white; 
                    padding: 15px; 
                    border-radius: 10px; 
                    font-size: 0.8rem;
                    z-index: 1000;
                `;
                debugPanel.innerHTML = `
                    <div style="margin-bottom: 10px; font-weight: bold;">🔧 Panel Debug</div>
                    <button onclick="switchUser(1)" style="margin: 2px; padding: 5px 10px; font-size: 0.7rem;">Jean Dupont</button>
                    <button onclick="switchUser(2)" style="margin: 2px; padding: 5px 10px; font-size: 0.7rem;">Marie Martin</button>
                    <button onclick="switchUser(3)" style="margin: 2px; padding: 5px 10px; font-size: 0.7rem;">Pierre Dubois</button>
                    <button onclick="switchUser(4)" style="margin: 2px; padding: 5px 10px; font-size: 0.7rem;">Sophie Leroy</button>
                `;
                document.body.appendChild(debugPanel);
            }
        });

        // Fonction utilitaire pour obtenir le nom de l'option de mission
        function getMissionNatureName(value) {
            const options = {
                'transport-personnel': '🚌 Transport de personnel',
                'livraison': '📦 Livraison',
                'maintenance': '🔧 Maintenance',
                'urgence': '🚨 Mission d\'urgence',
                'formation': '🎓 Formation/Conduite'
            };
            return options[value] || value;
        }

        // Exposer les fonctions globalement pour les événements
        window.selectVehicle = selectVehicle;
        window.checkAutre = checkAutre;
        window.startMission = startMission;
        window.endMissionWithDetails = endMissionWithDetails;
        window.cancelMyReservation = cancelMyReservation;
        window.startMissionFromReservation = startMissionFromReservation;
        window.openMobileModal = openMobileModal;
        window.closeMobileModal = closeMobileModal;
        window.openMissionsModal = openMissionsModal;
        window.closeMissionsModal = closeMissionsModal;
        window.goToHomePage = goToHomePage;
        window.switchUser = switchUser;

        function goToHomePage() {
    window.location.href = "/";  // renvoie vers la racine (index.html ou route Flask index)
}
