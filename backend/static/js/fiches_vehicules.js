 // Données des véhicules
        const vehicles = [
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
        ];

        let selectedVehicle = null;
        const isMobile = window.innerWidth <= 1024;

        // Fonctions utilitaires
        function parseDate(dateStr) {
            if (!dateStr) return null;
            const parts = dateStr.split('/');
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }

        function getStatusInfo(dateStr) {
            if (!dateStr) return { class: 'unknown', text: 'Non renseigné' };
            
            const today = new Date();
            const checkDate = parseDate(dateStr);
            const diffTime = checkDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) return { class: 'expired', text: `Expiré depuis ${Math.abs(diffDays)} jours` };
            if (diffDays < 30) return { class: 'warning', text: `Expire dans ${diffDays} jours` };
            if (diffDays < 90) return { class: 'caution', text: `Expire dans ${diffDays} jours` };
            return { class: 'good', text: `${diffDays} jours restants` };
        }

        function generateVehicleList() {
            const vehicleList = document.getElementById('vehicleList');
            vehicleList.innerHTML = '';

            vehicles.forEach(vehicle => {
                const status = getStatusInfo(vehicle.controle);
                
                const vehicleItem = document.createElement('div');
                vehicleItem.className = 'vehicle-item';
                vehicleItem.onclick = () => selectVehicle(vehicle);
                
                vehicleItem.innerHTML = `
                    <div class="mobile-indicator">Tap pour détails</div>
                    <div class="vehicle-header">
                        <div>
                            <div class="vehicle-name">${vehicle.nom}</div>
                            <div class="vehicle-plate">${vehicle.immatriculation}</div>
                        </div>
                        <div class="status ${status.class}">
                            ${status.text}
                        </div>
                    </div>
                `;
                
                vehicleList.appendChild(vehicleItem);
            });
        }

        function selectVehicle(vehicle) {
            selectedVehicle = vehicle;
            
            // Mise à jour de l'affichage de la liste
            const vehicleItems = document.querySelectorAll('.vehicle-item');
            vehicleItems.forEach((item, index) => {
                if (index === vehicle.id - 1) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });

            // Sur mobile, ouvrir la modal
            if (window.innerWidth <= 1024) {
                openMobileModal(vehicle);
            } else {
                // Sur desktop, afficher dans le panneau de droite
                showVehicleDetails(vehicle);
            }
        }

        function openMobileModal(vehicle) {
            const modal = document.getElementById('mobileModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modalTitle.textContent = vehicle.nom;
            modalBody.innerHTML = generateVehicleDetailsHTML(vehicle);
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        function closeMobileModal() {
            const modal = document.getElementById('mobileModal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        function generateVehicleDetailsHTML(vehicle) {
            const controleStatus = getStatusInfo(vehicle.controle);
            const validiteStatus = getStatusInfo(vehicle.finValidite);

            return `
                <div class="vehicle-header-detail">
                    <h3>${vehicle.nom}</h3>
                    <p>${vehicle.immatriculation}</p>
                </div>

                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">📅 Date d'Immatriculation</div>
                        <div class="detail-value">${vehicle.dateImmatriculation}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">🔧 Contrôle Technique</div>
                        <div class="detail-value status ${controleStatus.class}">
                            ${vehicle.controle || 'Non renseigné'}
                        </div>
                        <div class="detail-status status ${controleStatus.class}">
                            ${controleStatus.text}
                        </div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">📅 Prochain Contrôle</div>
                        <div class="detail-value">${vehicle.prochainControle}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">⏰ Fin de Validité</div>
                        <div class="detail-value status ${validiteStatus.class}">
                            ${vehicle.finValidite}
                        </div>
                        <div class="detail-status status ${validiteStatus.class}">
                            ${validiteStatus.text}
                        </div>
                    </div>
                </div>

                <div class="card-number">
                    <h4>💳 Numéro de Carte</h4>
                    <div class="card-number-value">${vehicle.numeroCarte}</div>
                </div>
            `;
        }

        function showVehicleDetails(vehicle) {
            document.getElementById('noSelection').style.display = 'none';
            document.getElementById('vehicleDetails').style.display = 'block';
            document.getElementById('vehicleDetails').innerHTML = generateVehicleDetailsHTML(vehicle);
        }

        function goToHomePage() {
            // Remplacez par votre URL d'accueil
            window.location.href = "index.html";
        }

        // Gestion du redimensionnement
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) {
                closeMobileModal();
                if (selectedVehicle) {
                    showVehicleDetails(selectedVehicle);
                }
            }
        });

        // Fermeture du modal en cliquant à l'extérieur
        document.getElementById('mobileModal').addEventListener('click', (e) => {
            if (e.target.id === 'mobileModal') {
                closeMobileModal();
            }
        });

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            generateVehicleList();
        });