 // Données initiales
        const initialVehicles = [
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

        // Variables globales
        let vehicles = [...initialVehicles];
        let selectedVehicle = null;
        let missions = [];
        let activeMissions = {};
        let reservations = {
            2: {
                reservedBy: "Marie Dubois",
                reservationDate: "25/07/2025",
                reservationTime: "14:30-16:00",
                reservationId: "RES-2025-001"
            }
        };
        let missionTimers = {};
        let isMobile = window.innerWidth <= 1200;
        
        // NOUVELLES VARIABLES POUR LES RESTRICTIONS
        let currentUser = null;
        let userActiveMission = null; // Mission active de l'utilisateur connecté

        // Utilitaires
        function formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `fixed top-20 right-5 px-6 py-4 rounded-xl text-white font-medium shadow-lg z-50 transition-all duration-500 transform ${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 
                type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
            } animate-slideInRight`;
            
            setTimeout(() => {
                notification.className += ' translate-x-full';
            }, 4000);
        }

        // NOUVELLE FONCTION - Connexion utilisateur
        function loginUser(event) {
            event.preventDefault();
            const userName = document.getElementById('userName').value.trim();
            
            if (userName) {
                currentUser = userName;
                document.getElementById('currentUser').textContent = currentUser;
                document.getElementById('userLoginModal').classList.remove('show');
                showNotification(`👋 Bienvenue ${currentUser}`, 'success');
                updateUI();
            }
        }

        // NOUVELLE FONCTION - Vérifier si l'utilisateur peut démarrer une mission
        function canStartMission() {
            // Un utilisateur ne peut avoir qu'une seule mission active à la fois
            return userActiveMission === null;
        }

        // NOUVELLE FONCTION - Vérifier si l'utilisateur peut gérer une mission
        function canManageMission(mission) {
            // Un utilisateur ne peut gérer que ses propres missions
            return mission.nom === currentUser;
        }

        // NOUVELLE FONCTION - Vérifier si un véhicule peut être sélectionné
        function canSelectVehicle(vehicleId) {
            const isInMission = activeMissions[vehicleId];
            const isReserved = reservations[vehicleId];
            
            // Si le véhicule est libre, il peut être sélectionné
            if (!isInMission && !isReserved) {
                return true;
            }
            
            // Si le véhicule est en mission, seul le conducteur peut le gérer
            if (isInMission) {
                return isInMission.nom === currentUser;
            }
            
            // Si le véhicule est réservé, seul celui qui l'a réservé peut le gérer
            if (isReserved) {
                return isReserved.reservedBy === currentUser;
            }
            
            return false;
        }

        // Initialisation des particules
        function initParticles() {
            const particlesContainer = document.getElementById('particles');
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'absolute w-2 h-2 bg-white/20 rounded-full animate-float';
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                particle.style.animationDelay = `${Math.random() * 5}s`;
                particle.style.animationDuration = `${3 + Math.random() * 4}s`;
                particlesContainer.appendChild(particle);
            }
        }

        // Mise à jour de l'horloge
        function updateClock() {
            const clock = document.getElementById('clock');
            clock.textContent = new Date().toLocaleTimeString();
        }

        // Mise à jour des timers
        function updateTimers() {
            Object.keys(activeMissions).forEach(vehicleId => {
                const mission = activeMissions[vehicleId];
                const elapsed = Math.floor((new Date() - mission.startTime) / 1000);
                missionTimers[vehicleId] = elapsed;
            });
            renderVehicles();
        }

        // Mise à jour des statistiques
        function updateStatistics() {
            const activeCount = Object.keys(activeMissions).length;
            const reservedCount = Object.keys(reservations).length;
            const availableCount = vehicles.length - activeCount - reservedCount;
            const completedCount = missions.filter(m => m.status === 'completed').length;

            const statisticsHtml = `
                <div class="bg-green-500 text-white p-4 rounded-xl text-center transform hover:scale-105 transition-all duration-300">
                    <div class="text-2xl font-bold">${availableCount}</div>
                    <div class="text-sm opacity-90">Disponibles</div>
                </div>
                <div class="bg-amber-500 text-white p-4 rounded-xl text-center transform hover:scale-105 transition-all duration-300">
                    <div class="text-2xl font-bold ${activeCount > 0 ? 'animate-pulse' : ''}">${activeCount}</div>
                    <div class="text-sm opacity-90">En mission</div>
                </div>
                <div class="bg-blue-500 text-white p-4 rounded-xl text-center transform hover:scale-105 transition-all duration-300">
                    <div class="text-2xl font-bold">${reservedCount}</div>
                    <div class="text-sm opacity-90">Réservés</div>
                </div>
                <div class="bg-gray-500 text-white p-4 rounded-xl text-center transform hover:scale-105 transition-all duration-300">
                    <div class="text-2xl font-bold">${completedCount}</div>
                    <div class="text-sm opacity-90">Terminées</div>
                </div>
            `;
            
            document.getElementById('statistics').innerHTML = statisticsHtml;
            document.getElementById('missionCount').textContent = missions.length;
        }

        // Rendu des véhicules - MODIFIÉ POUR LES RESTRICTIONS
        function renderVehicles() {
            const container = document.getElementById('vehiclesList');
            container.innerHTML = '';

            vehicles.forEach(vehicle => {
                const isInMission = activeMissions[vehicle.id];
                const isReserved = reservations[vehicle.id];
                const canSelect = canSelectVehicle(vehicle.id);
                
                let statusClass = 'bg-green-500';
                let statusText = '✅ Disponible';
                let vehicleClass = 'bg-gradient-to-br from-slate-50 to-slate-200';
                let pulseClass = '';

                if (isInMission) {
                    statusClass = 'bg-amber-500';
                    statusText = '🚗 En mission';
                    vehicleClass = 'bg-gradient-to-br from-amber-100 to-amber-200';
                    pulseClass = 'animate-pulse';
                    
                    // Si ce n'est pas la mission de l'utilisateur connecté
                    if (isInMission.nom !== currentUser) {
                        statusText = '🔒 Occupé';
                        statusClass = 'bg-red-500';
                    }
                } else if (isReserved) {
                    statusClass = 'bg-blue-500';
                    statusText = '📅 Réservé';
                    vehicleClass = 'bg-gradient-to-br from-blue-100 to-blue-200';
                    
                    // Si ce n'est pas la réservation de l'utilisateur connecté
                    if (isReserved.reservedBy !== currentUser) {
                        statusText = '🔒 Réservé';
                        statusClass = 'bg-red-500';
                    }
                }

                const timer = missionTimers[vehicle.id];
                const isSelected = selectedVehicle?.id === vehicle.id;

                // Appliquer les classes de restriction si nécessaire
                const restrictionClass = !canSelect ? 'restricted-vehicle' : '';
                const clickHandler = canSelect ? `onclick="selectVehicle(${vehicle.id})"` : `onclick="showRestrictedMessage(${vehicle.id})"`;

                const vehicleHtml = `
                    <div id="vehicle-${vehicle.id}" 
                         class="p-5 rounded-2xl ${vehicleClass} border-2 ${isSelected ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-purple-600 text-white transform translate-x-3 shadow-2xl' : 'border-transparent hover:border-indigo-400'} cursor-pointer transition-all duration-500 hover:transform hover:translate-x-2 hover:shadow-xl relative overflow-hidden ${pulseClass} ${restrictionClass}"
                         ${clickHandler}>
                        <div class="absolute inset-0 opacity-0 hover:opacity-100 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] hover:translate-x-[100%] transition-all duration-1000"></div>
                        
                        <div class="flex justify-between items-center relative z-10">
                            <div>
                                <div class="font-semibold text-lg mb-1 flex items-center gap-2">
                                    ${vehicle.nom}
                                    ${isInMission && isInMission.nom === currentUser ? '<span class="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-bounce">MA MISSION</span>' : ''}
                                    ${!canSelect ? '<span class="text-xs bg-gray-500 text-white px-2 py-1 rounded-full">🔒</span>' : ''}
                                </div>
                                <div class="text-sm opacity-80">${vehicle.immatriculation}</div>
                                ${isInMission && isInMission.nom ? `<div class="text-sm mt-1 opacity-90">👤 ${isInMission.nom === currentUser ? 'Vous' : isInMission.nom}</div>` : ''}
                                ${isReserved ? `<div class="text-sm mt-1 opacity-90">👤 ${isReserved.reservedBy === currentUser ? 'Vous' : isReserved.reservedBy}</div>` : ''}
                                ${timer !== undefined && canSelect ? `<div class="text-sm mt-2 font-mono font-bold">⏱️ ${formatTime(timer)}</div>` : ''}
                                ${isMobile && canSelect && !isInMission && !isReserved ? '<div class="text-xs mt-2 opacity-70 animate-pulse">Tap pour mission</div>' : ''}
                            </div>
                            <div class="${statusClass} px-3 py-2 rounded-full text-xs font-medium text-white transition-all duration-300 hover:scale-110">
                                ${statusText}
                            </div>
                        </div>
                        ${isInMission && canSelect ? '<div class="absolute top-3 right-3 text-2xl opacity-80 animate-spin">🎯</div>' : ''}
                        ${isReserved && canSelect ? '<div class="absolute top-3 right-3 text-2xl opacity-80 animate-bounce">📅</div>' : ''}
                        ${!canSelect ? '<div class="absolute top-3 right-3 text-2xl opacity-60">🔒</div>' : ''}
                    </div>
                `;
                
                container.innerHTML += vehicleHtml;
            });
        }

        // NOUVELLE FONCTION - Afficher message de restriction
        function showRestrictedMessage(vehicleId) {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            const isInMission = activeMissions[vehicleId];
            const isReserved = reservations[vehicleId];
            
            let message = '';
            if (isInMission) {
                message = `🔒 Ce véhicule est utilisé par ${isInMission.nom}. Vous ne pouvez pas gérer les missions d'autres utilisateurs.`;
            } else if (isReserved) {
                message = `🔒 Ce véhicule est réservé par ${isReserved.reservedBy}. Vous ne pouvez pas modifier les réservations d'autres utilisateurs.`;
            } else if (!canStartMission()) {
                message = `⚠️ Vous avez déjà une mission en cours. Terminez votre mission actuelle avant d'en démarrer une nouvelle.`;
            }
            
            showNotification(message, 'warning');
            
            // Animation shake pour le véhicule
            const vehicleElement = document.getElementById(`vehicle-${vehicleId}`);
            if (vehicleElement) {
                vehicleElement.classList.add('shake');
                setTimeout(() => vehicleElement.classList.remove('shake'), 500);
            }
        }

        // Sélection d'un véhicule - MODIFIÉ
        function selectVehicle(vehicleId) {
            if (!canSelectVehicle(vehicleId)) {
                showRestrictedMessage(vehicleId);
                return;
            }
            
            selectedVehicle = vehicles.find(v => v.id === vehicleId);
            if (isMobile) {
                openVehicleModal();
            } else {
                renderVehicleDetails();
            }
            renderVehicles();
        }

        // Rendu des détails du véhicule
        function renderVehicleDetails() {
            const container = isMobile ? 
                document.getElementById('vehicleModalContent') : 
                document.getElementById('vehicleDetails');

            if (!selectedVehicle) {
                container.innerHTML = `
                    <div class="text-center py-16 text-gray-500">
                        <div class="mb-6 animate-bounce">
                            <div class="text-6xl mx-auto opacity-50">🚗</div>
                        </div>
                        <p class="text-lg">Sélectionnez un véhicule<br />pour commencer une mission</p>
                        <div class="mt-4 text-sm opacity-70">
                            💡 Cliquez sur un véhicule disponible dans la liste
                        </div>
                        ${userActiveMission ? `<div class="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg"><strong>⚠️ Attention:</strong> Vous avez déjà une mission en cours</div>` : ''}
                    </div>
                `;
                return;
            }

            const isInMission = activeMissions[selectedVehicle.id];
            const isReserved = reservations[selectedVehicle.id];

            let content = `
                <div class="animate-fadeIn">
                    <div class="text-center mb-8 pb-6 border-b-2 border-gray-200">
                        <h3 class="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                            ${selectedVehicle.nom}
                            ${isInMission && isInMission.nom === currentUser ? '<span class="text-lg animate-spin">🚗</span>' : ''}
                            ${isReserved && isReserved.reservedBy === currentUser ? '<span class="text-lg animate-bounce">📅</span>' : ''}
                        </h3>
                        <p class="text-gray-600 text-lg">${selectedVehicle.immatriculation}</p>
                        <div class="mt-2 text-sm text-gray-500">
                            Carte: ${selectedVehicle.numeroCarte}
                        </div>
                    </div>
            `;

            if (isInMission && isInMission.nom === currentUser) {
                content += renderActiveMission(isInMission, selectedVehicle);
            } else if (isReserved && isReserved.reservedBy === currentUser) {
                content += renderActiveReservation(isReserved, selectedVehicle.id);
            } else if (!isInMission && !isReserved) {
                // Véhicule disponible
                if (canStartMission()) {
                    content += `
                        <div class="space-y-4">
                            <div class="text-center mb-6">
                                <div class="text-green-500 text-4xl mb-2">✅</div>
                                <p class="text-green-600 font-medium">Véhicule disponible</p>
                            </div>
                            ${renderMissionForm(selectedVehicle)}
                            <div class="text-center">
                                <button onclick="createReservation(${selectedVehicle.id})" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg">
                                    📅 Réserver ce véhicule
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    content += `
                        <div class="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
                            <div class="text-amber-500 text-4xl mb-4">⚠️</div>
                            <h4 class="text-lg font-semibold text-amber-800 mb-2">Mission en cours</h4>
                            <p class="text-amber-700 mb-4">Vous avez déjà une mission active. Terminez votre mission actuelle avant d'en démarrer une nouvelle.</p>
                            <button onclick="findUserActiveMission()" class="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl transition-all duration-300">
                                🔍 Voir ma mission active
                            </button>
                        </div>
                    `;
                }
            } else {
                // Véhicule occupé par un autre utilisateur
                content += `
                    <div class="bg-red-50 border border-red-200 p-6 rounded-2xl text-center">
                        <div class="text-red-500 text-4xl mb-4">🔒</div>
                        <h4 class="text-lg font-semibold text-red-800 mb-2">Accès restreint</h4>
                        <p class="text-red-700 mb-4">
                            ${isInMission ? 
                                `Ce véhicule est actuellement utilisé par ${isInMission.nom}.` : 
                                `Ce véhicule est réservé par ${isReserved.reservedBy}.`
                            }
                        </p>
                        <p class="text-sm text-red-600">Vous ne pouvez gérer que vos propres missions et réservations.</p>
                    </div>
                `;
            }

            content += '</div>';
            container.innerHTML = content;
        }

        // NOUVELLE FONCTION - Trouver la mission active de l'utilisateur
        function findUserActiveMission() {
            const userMissionVehicleId = Object.keys(activeMissions).find(vehicleId => 
                activeMissions[vehicleId].nom === currentUser
            );
            
            if (userMissionVehicleId) {
                selectVehicle(parseInt(userMissionVehicleId));
                showNotification('🎯 Voici votre mission active', 'info');
            }
        }

        // Formulaire de mission - MODIFIÉ
        function renderMissionForm(vehicle) {
            if (!canStartMission()) {
                return `
                    <div class="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
                        <div class="text-amber-500 text-4xl mb-4">⚠️</div>
                        <p class="text-amber-700">Vous avez déjà une mission en cours</p>
                    </div>
                `;
            }

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const timeStr = today.toTimeString().slice(0, 5);

            return `
                <div class="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl border border-sky-200 animate-fadeIn">
                    <h4 class="text-xl font-semibold text-cyan-800 mb-6 text-center flex items-center justify-center gap-2">
                        🚀 Nouvelle Mission
                        <span class="text-sm bg-cyan-200 text-cyan-800 px-2 py-1 rounded-full animate-pulse">LIVE</span>
                    </h4>
                    <form onsubmit="startMission(event, ${vehicle.id})" class="space-y-5">
                        <div class="grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-5">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">👤 Nom du conducteur</label>
                                <input type="text" name="nom" required value="${currentUser}" readonly class="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600" />
                                <p class="text-xs text-gray-500 mt-1">📝 Votre nom est automatiquement renseigné</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">📅 Date de mission</label>
                                <input type="date" name="missionDate" required value="${todayStr}" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg" />
                            </div>
                        </div>

                        <div class="grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-5">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">🕐 Heure de départ</label>
                                <input type="time" name="departureTime" required value="${timeStr}" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">👥 Nombre de passagers</label>
                                <input type="number" name="passengers" required placeholder="2" min="0" max="8" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">📋 Nature de la mission</label>
                            <select name="missionNature" required onchange="toggleAutreInput(this)" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg">
                                <option value="">Sélectionner le type de mission</option>
                                <option value="transport-personnel">🚌 Transport de personnel</option>
                                <option value="livraison">📦 Livraison</option>
                                <option value="maintenance">🔧 Maintenance</option>
                                <option value="urgence">🚨 Mission d'urgence</option>
                                <option value="formation">🎓 Formation/Conduite</option>
                                <option value="autre">✏️ Autre</option>
                            </select>
                        </div>

                        <div id="autreInput" class="hidden animate-slideDown">
                            <label class="block text-sm font-medium text-gray-700 mb-2">✏️ Si autre, précisez</label>
                            <input type="text" name="autreText" placeholder="Décrivez la mission" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg" />
                        </div>

                        <div class="grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-5">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">📍 Destination</label>
                                <input type="text" name="destination" required placeholder="Ex: Centre-ville, Aéroport..." class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">🛣️ Kilométrage de départ</label>
                                <input type="number" name="kmDepart" required placeholder="Ex: 45230" min="0" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg" />
                            </div>
                        </div>

                        <button type="submit" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2">
                            ▶️ Démarrer la mission
                            <span class="animate-pulse">🚀</span>
                        </button>
                    </form>
                </div>
            `;
        }

        // Mission active
        function renderActiveMission(mission, vehicle) {
            const timeStr = new Date().toTimeString().slice(0, 5);
            const timer = missionTimers[vehicle.id] || 0;

            return `
                <div class="bg-gradient-to-br from-amber-50 to-yellow-50 p-8 rounded-2xl border border-amber-200 animate-fadeIn">
                    <h4 class="text-xl font-semibold text-amber-800 mb-6 text-center flex items-center justify-center gap-2">
                        🎯 Votre Mission en cours
                        <span class="text-sm bg-red-500 text-white px-2 py-1 rounded-full animate-bounce">EN DIRECT</span>
                    </h4>
                    
                    <div class="text-center mb-8">
                        <div class="text-4xl font-mono font-bold text-amber-900 bg-white/70 rounded-2xl p-4 inline-block">
                            ⏱️ ${formatTime(timer)}
                        </div>
                        <p class="text-sm text-amber-700 mt-2">Durée de la mission</p>
                    </div>
                    
                    <div class="grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-8">
                        <div class="bg-white/70 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Conducteur</div>
                            <div class="font-semibold text-gray-900">👤 ${mission.nom} (Vous)</div>
                        </div>
                        <div class="bg-white/70 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Date</div>
                            <div class="font-semibold text-gray-900">${mission.missionDate}</div>
                        </div>
                        <div class="bg-white/70 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Heure de départ</div>
                            <div class="font-semibold text-gray-900">${mission.departureTime}</div>
                        </div>
                        <div class="bg-white/70 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Nature</div>
                            <div class="font-semibold text-gray-900">${mission.missionNature}</div>
                        </div>
                        <div class="bg-white/70 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Destination</div>
                            <div class="font-semibold text-gray-900">${mission.destination}</div>
                        </div>
                        <div class="bg-white/70 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Passagers</div>
                            <div class="font-semibold text-gray-900">${mission.passengers}</div>
                        </div>
                        <div class="bg-white/70 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Km départ</div>
                            <div class="font-semibold text-gray-900">${mission.kmDepart} km</div>
                        </div>
                    </div>

                    <div class="bg-white/70 p-6 rounded-xl">
                        <h4 class="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                            🏁 Terminer la mission
                            <span class="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Prêt</span>
                        </h4>
                        <form onsubmit="endMission(event, ${vehicle.id})" class="space-y-5">
                            <div class="grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-5">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">🕐 Heure d'arrivée</label>
                                    <input type="time" name="arrivalTime" required value="${timeStr}" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">🛣️ Kilométrage d'arrivée</label>
                                    <input type="number" name="kmArrivee" required placeholder="Ex: 45280" min="${mission.kmDepart}" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg" />
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">📝 Notes / Observations (optionnel)</label>
                                <textarea name="notes" rows="3" placeholder="Remarques, incidents, observations..." class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-all duration-300 focus:shadow-lg resize-none"></textarea>
                            </div>

                            <button type="submit" class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2">
                                ⏹️ Terminer la mission
                                <span class="animate-pulse">🏁</span>
                            </button>
                        </form>
                    </div>
                </div>
            `;
        }

        // Réservation active
        function renderActiveReservation(reservation, vehicleId) {
            return `
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200 animate-fadeIn">
                    <h4 class="text-xl font-semibold text-blue-800 mb-6 text-center flex items-center justify-center gap-2">
                        📅 Votre Réservation
                        <span class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full animate-pulse">RÉSERVÉ</span>
                    </h4>
                    
                    <div class="grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-8">
                        <div class="bg-white/80 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Réservé par</div>
                            <div class="font-semibold text-gray-900">👤 ${reservation.reservedBy} (Vous)</div>
                        </div>
                        <div class="bg-white/80 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Date</div>
                            <div class="font-semibold text-gray-900">${reservation.reservationDate}</div>
                        </div>
                        <div class="bg-white/80 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">Horaire</div>
                            <div class="font-semibold text-gray-900">${reservation.reservationTime}</div>
                        </div>
                        <div class="bg-white/80 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                            <div class="text-sm text-gray-600 mb-1">ID Réservation</div>
                            <div class="font-semibold text-gray-900">${reservation.reservationId}</div>
                        </div>
                    </div>

                    <div class="flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 justify-center">
                        <button onclick="cancelReservation(${vehicleId})" class="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-6 rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2">
                            ❌ Annuler la réservation
                        </button>
                        <button onclick="startMissionFromReservation(${vehicleId})" class="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 ${!canStartMission() ? 'opacity-50 cursor-not-allowed' : ''}" ${!canStartMission() ? 'onclick="showNotification(\'⚠️ Terminez votre mission actuelle avant d\\\'en démarrer une nouvelle\', \'warning\')" title="Mission déjà active"' : ''}>
                            🚀 Commencer la mission
                        </button>
                    </div>
                </div>
            `;
        }

        // Rendu des missions - MODIFIÉ POUR FILTRER
        function renderMissions() {
            const container = document.getElementById('missionsList');
            const modalContainer = document.getElementById('missionsModalContent');
            
            // Filtrer pour n'afficher que les missions de l'utilisateur connecté
            const userMissions = missions.filter(mission => mission.nom === currentUser);
            
            if (userMissions.length === 0) {
                const emptyContent = `
                    <div class="text-center text-gray-500 py-16">
                        <div class="text-6xl mb-4 opacity-50">📄</div>
                        <p class="text-lg">🔍 Aucune mission enregistrée</p>
                        <p class="text-sm opacity-70 mt-2">Vos missions apparaîtront ici une fois démarrées</p>
                    </div>
                `;
                container.innerHTML = emptyContent;
                modalContainer.innerHTML = emptyContent;
                return;
            }

            const sortedMissions = userMissions
                .sort((a, b) => b.startTime - a.startTime);

            // Pour desktop - limite à 10
            const desktopMissions = sortedMissions.slice(0, 10);
            container.innerHTML = desktopMissions.map(mission => renderMissionItem(mission)).join('');
            
            // Pour modal - toutes les missions de l'utilisateur
            modalContainer.innerHTML = sortedMissions.map(mission => renderMissionItem(mission)).join('');
        }

        function renderMissionItem(mission) {
            const isActive = mission.status === 'active';
            
            return `
                <div class="mission-item p-5 rounded-2xl border-l-4 transition-all duration-500 hover:transform hover:translate-x-2 hover:shadow-xl cursor-pointer ${
                    isActive 
                        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-l-amber-500' 
                        : 'bg-gradient-to-br from-slate-50 to-gray-50 border-l-green-500'
                }" onclick="toggleMissionDetails(this)">
                    <div class="flex justify-between items-center mb-4">
                        <div class="font-semibold text-lg text-gray-900 flex items-center gap-2">
                            📍 ${mission.destination}
                            ${isActive ? '<span class="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-bounce">LIVE</span>' : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="px-3 py-1 rounded-full text-sm font-medium ${
                                isActive ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'
                            }">
                                ${isActive ? '🟡 En cours' : '✅ Terminée'}
                            </div>
                            <span class="toggle-icon">➕</span>
                        </div>
                    </div>

                    <div class="mission-summary grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2 text-sm text-gray-600 opacity-70">
                        <div class="flex items-center gap-2">🚗 ${mission.vehicleName}</div>
                        <div class="flex items-center gap-2">👤 Vous</div>
                        <div class="flex items-center gap-2">📅 ${new Date(mission.missionDate).toLocaleDateString('fr-FR')}</div>
                        <div class="flex items-center gap-2">📋 ${mission.missionNature}</div>
                        <div class="flex items-center gap-2">👥 ${mission.passengers} passagers</div>
                        <div class="flex items-center gap-2">🕐 ${mission.departureTime}${mission.arrivalTime ? ` - ${mission.arrivalTime}` : ''}</div>
                    </div>
                    
                    <div class="mission-details hidden space-y-2 mt-4 animate-slideDown">
                        <div class="flex items-center gap-2">🛣️ Départ: ${mission.kmDepart} km</div>
                        ${mission.kmArrivee ? `<div class="flex items-center gap-2">🏁 Arrivée: ${mission.kmArrivee} km</div>` : ''}
                        ${mission.distanceParcourue ? `<div class="flex items-center gap-2">📏 Distance: ${mission.distanceParcourue} km</div>` : ''}
                        ${mission.notes ? `<div class="flex items-start gap-2">📝 ${mission.notes}</div>` : ''}
                        ${isActive && missionTimers[mission.vehicleId] ? `<div class="flex items-center gap-2 font-mono font-bold text-amber-600">⏱️ Durée: ${formatTime(missionTimers[mission.vehicleId])}</div>` : ''}
                    </div>
                </div>
            `;
        }

        // Toggle des détails de mission
        function toggleMissionDetails(element) {
            const details = element.querySelector('.mission-details');
            const summary = element.querySelector('.mission-summary');
            const icon = element.querySelector('.toggle-icon');
            
            if (details.classList.contains('hidden')) {
                details.classList.remove('hidden');
                summary.classList.remove('opacity-70');
                summary.classList.add('opacity-100');
                icon.textContent = '➖';
            } else {
                details.classList.add('hidden');
                summary.classList.add('opacity-70');
                summary.classList.remove('opacity-100');
                icon.textContent = '➕';
            }
        }

        // Toggle input "autre"
        function toggleAutreInput(select) {
            const autreInput = document.getElementById('autreInput');
            if (select.value === 'autre') {
                autreInput.classList.remove('hidden');
            } else {
                autreInput.classList.add('hidden');
            }
        }

        // Démarrer une mission - MODIFIÉ AVEC RESTRICTIONS
        function startMission(event, vehicleId) {
            event.preventDefault();
            
            // Vérifier si l'utilisateur peut démarrer une mission
            if (!canStartMission()) {
                showNotification('⚠️ Vous avez déjà une mission en cours. Terminez votre mission actuelle avant d\'en démarrer une nouvelle.', 'warning');
                return;
            }
            
            const formData = new FormData(event.target);
            
            let missionNature = formData.get('missionNature');
            const autreText = formData.get('autreText');
            
            if (missionNature === 'autre' && autreText) {
                missionNature = autreText;
            }

            const mission = {
                id: Date.now(),
                vehicleId: vehicleId,
                vehicleName: vehicles.find(v => v.id === vehicleId).nom,
                nom: currentUser, // Utiliser le nom de l'utilisateur connecté
                missionDate: formData.get('missionDate'),
                departureTime: formData.get('departureTime'),
                missionNature: missionNature,
                destination: formData.get('destination'),
                passengers: parseInt(formData.get('passengers')),
                kmDepart: parseInt(formData.get('kmDepart')),
                status: 'active',
                startTime: new Date()
            };

            activeMissions[vehicleId] = mission;
            missions.push(mission);
            userActiveMission = mission; // Marquer que l'utilisateur a une mission active
            
            showNotification('🚀 Mission démarrée avec succès', 'success');
            
            // Animation pour le démarrage
            const vehicleElement = document.getElementById(`vehicle-${vehicleId}`);
            if (vehicleElement) {
                vehicleElement.classList.add('animate-pulse');
                setTimeout(() => vehicleElement.classList.remove('animate-pulse'), 2000);
            }

            updateUI();
        }

        // Terminer une mission - MODIFIÉ
        function endMission(event, vehicleId) {
            event.preventDefault();
            
            const mission = activeMissions[vehicleId];
            
            // Vérifier que c'est bien la mission de l'utilisateur
            if (!mission || !canManageMission(mission)) {
                showNotification('🔒 Vous ne pouvez terminer que vos propres missions', 'error');
                return;
            }
            
            const formData = new FormData(event.target);
            const kmArrivee = parseInt(formData.get('kmArrivee'));
            const distanceParcourue = kmArrivee - mission.kmDepart;

            const updatedMission = {
                ...mission,
                status: 'completed',
                arrivalTime: formData.get('arrivalTime'),
                kmArrivee: kmArrivee,
                distanceParcourue: distanceParcourue,
                notes: formData.get('notes'),
                endTime: new Date()
            };

            missions = missions.map(m => m.id === mission.id ? updatedMission : m);
            delete activeMissions[vehicleId];
            delete missionTimers[vehicleId];
            userActiveMission = null; // Libérer l'utilisateur

            showNotification(`🏁 Mission terminée ! Distance: ${distanceParcourue} km`, 'success');
            updateUI();
        }

        // Créer une réservation - MODIFIÉ
        function createReservation(vehicleId) {
            // Vérifier si l'utilisateur a déjà une mission active
            if (!canStartMission()) {
                showNotification('⚠️ Vous avez déjà une mission en cours. Terminez votre mission actuelle avant de faire une réservation.', 'warning');
                return;
            }
            
            const reservationDate = prompt('Date de réservation (DD/MM/YYYY) :');
            const reservationTime = prompt('Horaire (HH:MM-HH:MM) :');
            
            if (reservationDate && reservationTime) {
                const newReservation = {
                    reservedBy: currentUser, // Utiliser le nom de l'utilisateur connecté
                    reservationDate,
                    reservationTime,
                    reservationId: `RES-${Date.now()}`
                };
                
                reservations[vehicleId] = newReservation;
                showNotification('📅 Réservation créée avec succès', 'success');
                updateUI();
            }
        }

        // Annuler une réservation - MODIFIÉ
        function cancelReservation(vehicleId) {
            const reservation = reservations[vehicleId];
            
            // Vérifier que c'est la réservation de l'utilisateur
            if (!reservation || reservation.reservedBy !== currentUser) {
                showNotification('🔒 Vous ne pouvez annuler que vos propres réservations', 'error');
                return;
            }
            
            if (confirm(`Annuler votre réservation ${reservation.reservationId}?`)) {
                delete reservations[vehicleId];
                showNotification('✅ Réservation annulée avec succès', 'success');
                updateUI();
            }
        }

        // Commencer une mission depuis une réservation - MODIFIÉ
        function startMissionFromReservation(vehicleId) {
            // Vérifier si l'utilisateur peut démarrer une mission
            if (!canStartMission()) {
                showNotification('⚠️ Vous avez déjà une mission en cours. Terminez votre mission actuelle avant d\'en démarrer une nouvelle.', 'warning');
                return;
            }
            
            const reservation = reservations[vehicleId];
            
            // Vérifier que c'est la réservation de l'utilisateur
            if (!reservation || reservation.reservedBy !== currentUser) {
                showNotification('🔒 Vous ne pouvez démarrer une mission que depuis vos propres réservations', 'error');
                return;
            }
            
            delete reservations[vehicleId];

            const mission = {
                id: Date.now(),
                vehicleId: vehicleId,
                vehicleName: vehicles.find(v => v.id === vehicleId).nom,
                nom: currentUser, // Utiliser le nom de l'utilisateur connecté
                missionDate: reservation.reservationDate.split('/').reverse().join('-'),
                departureTime: reservation.reservationTime.split('-')[0],
                missionNature: 'Mission planifiée',
                destination: 'À définir',
                passengers: 1,
                kmDepart: 0,
                status: 'active',
                startTime: new Date()
            };

            activeMissions[vehicleId] = mission;
            missions.push(mission);
            userActiveMission = mission; // Marquer que l'utilisateur a une mission active
            
            showNotification('🚀 Mission démarrée depuis la réservation', 'success');
            updateUI();
        }

        // Actions rapides - MODIFIÉES
        function quickReservation() {
            if (!canStartMission()) {
                showNotification('⚠️ Vous avez déjà une mission en cours. Terminez votre mission actuelle avant de faire une réservation.', 'warning');
                return;
            }
            
            const availableVehicles = vehicles.filter(v => !activeMissions[v.id] && !reservations[v.id]);
            if (availableVehicles.length > 0) {
                const randomVehicle = availableVehicles[Math.floor(Math.random() * availableVehicles.length)];
                createReservation(randomVehicle.id);
            } else {
                showNotification('❌ Aucun véhicule disponible', 'error');
            }
        }

        function showMissionStatus() {
            // Afficher seulement le statut des missions de l'utilisateur
            const userActiveMissions = Object.values(activeMissions).filter(m => m.nom === currentUser);
            if (userActiveMissions.length > 0) {
                showNotification(`🚗 Vous avez ${userActiveMissions.length} mission en cours`, 'info');
            } else {
                showNotification('✅ Vous n\'avez aucune mission active', 'info');
            }
        }

        function showTotalDistance() {
            // Calculer seulement la distance des missions de l'utilisateur
            const userMissions = missions.filter(m => m.nom === currentUser);
            const totalDistance = userMissions
                .filter(m => m.distanceParcourue)
                .reduce((sum, m) => sum + m.distanceParcourue, 0);
            showNotification(`🛣️ Votre distance totale: ${totalDistance} km`, 'info');
        }

        // NOUVELLE FONCTION - Mettre à jour la mission active de l'utilisateur
        function updateUserActiveMission() {
            // Trouver la mission active de l'utilisateur connecté
            userActiveMission = Object.values(activeMissions).find(mission => mission.nom === currentUser) || null;
        }

        // Gestion des modals
        function openVehicleModal() {
            if (selectedVehicle) {
                document.getElementById('vehicleModalTitle').textContent = `${selectedVehicle.nom} - ${selectedVehicle.immatriculation}`;
                renderVehicleDetails();
                document.getElementById('vehicleModal').classList.add('show');
            }
        }

        function closeVehicleModal() {
            document.getElementById('vehicleModal').classList.remove('show');
        }

        function openMissionsModal() {
            document.getElementById('missionsModal').classList.add('show');
        }

        function closeMissionsModal() {
            document.getElementById('missionsModal').classList.remove('show');
        }

        // Mise à jour de l'UI - MODIFIÉ
        function updateUI() {
            updateUserActiveMission(); // Mettre à jour la mission active de l'utilisateur
            updateStatistics();
            renderVehicles();
            renderVehicleDetails();
            renderMissions();
        }

        // Gestion du responsive
        function checkMobile() {
            const wasMobile = isMobile;
            isMobile = window.innerWidth <= 1200;
            
            if (wasMobile !== isMobile) {
                updateUI();
            }
        }

        // Event listeners
        document.getElementById('showMissionsModalBtn').addEventListener('click', openMissionsModal);
        window.addEventListener('resize', checkMobile);

        // Fermeture des modals en cliquant à l'extérieur
        document.getElementById('vehicleModal').addEventListener('click', function(e) {
            if (e.target === this) closeVehicleModal();
        });

        document.getElementById('missionsModal').addEventListener('click', function(e) {
            if (e.target === this) closeMissionsModal();
        });

        // Fermeture du modal de connexion avec Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (document.getElementById('userLoginModal').classList.contains('show')) {
                    // Ne pas permettre de fermer le modal de connexion sans se connecter
                    return;
                }
                closeVehicleModal();
                closeMissionsModal();
            }
        });

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            initParticles();
            
            // Vérifier si un utilisateur est déjà connecté (simulation)
            const savedUser = sessionStorage.getItem('currentUser');
            if (savedUser) {
                currentUser = savedUser;
                document.getElementById('currentUser').textContent = currentUser;
                document.getElementById('userLoginModal').classList.remove('show');
                updateUI();
            }
            
            // Timers
            setInterval(updateClock, 1000);
            setInterval(updateTimers, 1000);
            
            // Initial clock update
            updateClock();
        });

        // NOUVELLE FONCTION - Sauvegarder l'utilisateur connecté
        function saveCurrentUser() {
            if (currentUser) {
                sessionStorage.setItem('currentUser', currentUser);
            }
        }

        // Modifier la fonction de connexion pour sauvegarder
        function loginUser(event) {
            event.preventDefault();
            const userName = document.getElementById('userName').value.trim();
            
            if (userName.length < 2) {
                showNotification('❌ Le nom doit contenir au moins 2 caractères', 'error');
                return;
            }
            
            currentUser = userName;
            document.getElementById('currentUser').textContent = currentUser;
            document.getElementById('userLoginModal').classList.remove('show');
            saveCurrentUser(); // Sauvegarder l'utilisateur
            
            showNotification(`👋 Bienvenue ${currentUser}`, 'success');
            updateUI();
        }





        function ensureTextVisibility(element) {
    if (element) {
        element.style.opacity = '1';
        element.style.visibility = 'visible';
        
        const children = element.querySelectorAll('*');
        children.forEach(child => {
            child.style.opacity = '1';
            child.style.visibility = 'visible';
        });
    }
}
        
        






        