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

        function getProgressWidth(dateStr) {
            if (!dateStr) return 20;
            const status = getStatusInfo(dateStr);
            if (status.class === 'good') return 100;
            if (status.class === 'caution') return 75;
            if (status.class === 'warning') return 50;
            return 25;
        }

        // Génération de la liste des véhicules
        function generateVehicleList() {
            const vehicleList = document.getElementById('vehicleList');
            vehicleList.innerHTML = '';

            vehicles.forEach(vehicle => {
                const status = getStatusInfo(vehicle.controle);
                
                const vehicleItem = document.createElement('div');
                vehicleItem.className = 'vehicle-item';
                vehicleItem.onclick = () => selectVehicle(vehicle);
                
                vehicleItem.innerHTML = `
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

        // Sélection d'un véhicule
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

            // Affichage des détails
            showVehicleDetails(vehicle);
        }

        // Affichage des détails du véhicule
        function showVehicleDetails(vehicle) {
            document.getElementById('noSelection').style.display = 'none';
            document.getElementById('vehicleDetails').style.display = 'block';

            const controleStatus = getStatusInfo(vehicle.controle);
            const validiteStatus = getStatusInfo(vehicle.finValidite);

            document.getElementById('vehicleDetails').innerHTML = `
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

                <div class="status-indicator">
                    <h4>📊 Statut Global</h4>
                    <div class="progress-container">
                        <div class="progress-label">Contrôle Technique</div>
                        <div class="progress-bar">
                            <div class="progress-fill ${controleStatus.class}" 
                                 style="width: ${getProgressWidth(vehicle.controle)}%"></div>
                        </div>
                        <div class="progress-status status ${controleStatus.class}">
                            ${vehicle.controle ? '✓' : '⚠'}
                        </div>
                    </div>
                </div>
            `;
        }

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            generateVehicleList();
        });




// Bouton de retour (croix) 
function goToHomePage() {
  window.location.href = "index.html";
}
