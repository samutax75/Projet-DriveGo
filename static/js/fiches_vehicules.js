// Données des véhicules (vos données originales + nouvelles données)
const vehicles = [
    {
        id: 1,
        nom: "TRAFIC BLANC",
        immatriculation: "FV-088-JJ",
        dateImmatriculation: "26/11/2020",
        controle: "29/10/2024",
        prochainControle: "28/10/2026",
        finValidite: "30/09/2026",
        numeroCarte: "4985080",
        carteGrise: {
            numero: "123456789",
            dateEmission: "26/11/2020",
            dateExpiration: "",
            titulaire: "Fondation Perce-Neige",
            fichier: null
        },
        assurance: {
            compagnie: "AXA Assurances",
            numeroContrat: "POL789456",
            dateDebut: "01/01/2024",
            dateExpiration: "31/12/2024",
            typeCouverture: "Tous risques",
            montantPrime: 1250.00,
            fichier: null
        }
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
        carteGrise: {
            numero: "987654321",
            dateEmission: "14/12/2023",
            dateExpiration: "",
            titulaire: "Fondation Perce-Neige",
            fichier: null
        },
        assurance: {
            compagnie: "MAIF",
            numeroContrat: "CON456789",
            dateDebut: "01/01/2024",
            dateExpiration: "31/12/2024",
            typeCouverture: "Tous risques + PMR",
            montantPrime: 1450.00,
            fichier: null
        }
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
        carteGrise: {
            numero: "456789123",
            dateEmission: "02/02/2017",
            dateExpiration: "",
            titulaire: "Fondation Perce-Neige",
            fichier: null
        },
        assurance: {
            compagnie: "Groupama",
            numeroContrat: "GRP123456",
            dateDebut: "01/01/2024",
            dateExpiration: "31/12/2024",
            typeCouverture: "Tiers étendu",
            montantPrime: 980.00,
            fichier: null
        }
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
        carteGrise: {
            numero: "321654987",
            dateEmission: "26/06/2013",
            dateExpiration: "",
            titulaire: "Fondation Perce-Neige",
            fichier: null
        },
        assurance: {
            compagnie: "Allianz",
            numeroContrat: "ALZ987654",
            dateDebut: "01/01/2024",
            dateExpiration: "31/12/2024",
            typeCouverture: "Tous risques",
            montantPrime: 1180.00,
            fichier: null
        }
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
        carteGrise: {
            numero: "147258369",
            dateEmission: "22/06/2015",
            dateExpiration: "",
            titulaire: "Fondation Perce-Neige",
            fichier: null
        },
        assurance: {
            compagnie: "MACIF",
            numeroContrat: "MAC654321",
            dateDebut: "01/01/2024",
            dateExpiration: "31/12/2024",
            typeCouverture: "Tiers étendu",
            montantPrime: 850.00,
            fichier: null
        }
    }
];

let selectedVehicle = null;
let currentUploadType = null;
let currentVehicleId = null;

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

function getMultipleStatuses(vehicle) {
    return {
        controle: getStatusInfo(vehicle.controle),
        assurance: vehicle.assurance ? getStatusInfo(vehicle.assurance.dateExpiration) : { class: 'unknown', text: 'Non renseigné' },
        carteGrise: { class: 'good', text: 'Valide' }
    };
}

function getMostUrgentStatus(vehicle) {
    const controleStatus = getStatusInfo(vehicle.controle);
    return controleStatus;
}

function generateVehicleList() {
    const vehicleList = document.getElementById('vehicleList');
    vehicleList.innerHTML = '';

    vehicles.forEach(vehicle => {
        const mainStatus = getMostUrgentStatus(vehicle);
        
        const vehicleItem = document.createElement('div');
        vehicleItem.className = 'vehicle-item';
        vehicleItem.onclick = () => selectVehicle(vehicle);
        
        vehicleItem.innerHTML = `
            <div class="mobile-indicator">➡️ Détails</div>
            <div class="vehicle-header">
                <div>
                    <div class="vehicle-name">${vehicle.nom}</div>
                    <div class="vehicle-plate">${vehicle.immatriculation}</div>
                </div>
                <div class="vehicle-status-summary">
                    <div class="status ${mainStatus.class}">
                        ${mainStatus.text}
                    </div>
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

function showTab(tabName) {
    // Masquer tous les onglets
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Afficher l'onglet sélectionné
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function generateVehicleDetailsHTML(vehicle) {
    const statuses = getMultipleStatuses(vehicle);

    return `
        <div class="vehicle-header-detail">
            <h3>${vehicle.nom}</h3>
            <p>${vehicle.immatriculation}</p>
        </div>

        <div class="tabs-container">
            <div class="tabs">
                <button class="tab active" onclick="showTab('general')">🔧 Général</button>
                <button class="tab" onclick="showTab('carte_grise')">📄 Carte Grise</button>
                <button class="tab" onclick="showTab('assurance')">🛡️ Assurance</button>
            </div>

            <div id="general" class="tab-content active">
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">📅 Date d'Immatriculation</div>
                        <div class="detail-value">${vehicle.dateImmatriculation}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">🔧 Contrôle Technique</div>
                        <div class="detail-value status ${statuses.controle.class}">
                            ${vehicle.controle || 'Non renseigné'}
                        </div>
                        <div class="detail-status status ${statuses.controle.class}">
                            ${statuses.controle.text}
                        </div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">📅 Prochain Contrôle</div>
                        <div class="detail-value">${vehicle.prochainControle}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">⏰ Fin de Validité</div>
                        <div class="detail-value">${vehicle.finValidite}</div>
                    </div>
                </div>

                <div class="card-number">
                    <h4>💳 Numéro de Carte</h4>
                    <div class="card-number-value">${vehicle.numeroCarte}</div>
                </div>
            </div>

            <div id="carte_grise" class="tab-content">
                <div class="document-section">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">📄 Numéro d'immatriculation</div>
                            <div class="detail-value">${vehicle.carteGrise ? vehicle.carteGrise.numero : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">📅 Date d'émission</div>
                            <div class="detail-value">${vehicle.carteGrise ? vehicle.carteGrise.dateEmission : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">👤 Titulaire</div>
                            <div class="detail-value">${vehicle.carteGrise ? vehicle.carteGrise.titulaire : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">⏰ Statut</div>
                            <div class="detail-value status ${statuses.carteGrise.class}">
                                ${statuses.carteGrise.text}
                            </div>
                        </div>
                    </div>
                    
                    <div class="upload-section">
                        <button onclick="uploadDocument(${vehicle.id}, 'carte_grise')" class="upload-btn">
                            📎 ${vehicle.carteGrise && vehicle.carteGrise.fichier ? 'Modifier' : 'Ajouter'} le document
                        </button>
                        ${vehicle.carteGrise && vehicle.carteGrise.fichier ? `
                            <button onclick="viewDocument(${vehicle.id}, 'carte_grise')" class="upload-btn secondary">
                                👁️ Voir le document
                            </button>
                        ` : ''}
                        <div class="file-info">
                            ${vehicle.carteGrise && vehicle.carteGrise.fichier ? `Document: ${vehicle.carteGrise.fichier}` : 'Aucun document ajouté'}
                        </div>
                    </div>
                </div>
            </div>

            <div id="assurance" class="tab-content">
                <div class="document-section">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">🏢 Compagnie</div>
                            <div class="detail-value">${vehicle.assurance ? vehicle.assurance.compagnie : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">📋 Numéro de contrat</div>
                            <div class="detail-value">${vehicle.assurance ? vehicle.assurance.numeroContrat : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">📅 Date de début</div>
                            <div class="detail-value">${vehicle.assurance ? vehicle.assurance.dateDebut : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">⏰ Date d'expiration</div>
                            <div class="detail-value status ${statuses.assurance.class}">
                                ${vehicle.assurance ? vehicle.assurance.dateExpiration : 'Non renseigné'}
                            </div>
                            <div class="detail-status status ${statuses.assurance.class}">
                                ${statuses.assurance.text}
                            </div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">🛡️ Type de couverture</div>
                            <div class="detail-value">${vehicle.assurance ? vehicle.assurance.typeCouverture : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">💰 Prime annuelle</div>
                            <div class="detail-value">${vehicle.assurance ? vehicle.assurance.montantPrime + '€' : 'Non renseigné'}</div>
                        </div>
                    </div>
                    
                    <div class="upload-section">
                        <button onclick="editAssurance(${vehicle.id})" class="upload-btn">
                            ✏️ Modifier les informations
                        </button>
                        <button onclick="uploadDocument(${vehicle.id}, 'assurance')" class="upload-btn">
                            📎 ${vehicle.assurance && vehicle.assurance.fichier ? 'Modifier' : 'Ajouter'} le document
                        </button>
                        ${vehicle.assurance && vehicle.assurance.fichier ? `
                            <button onclick="viewDocument(${vehicle.id}, 'assurance')" class="upload-btn secondary">
                                👁️ Voir le document
                            </button>
                        ` : ''}
                        <div class="file-info">
                            ${vehicle.assurance && vehicle.assurance.fichier ? `Document: ${vehicle.assurance.fichier}` : 'Aucun document ajouté'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showVehicleDetails(vehicle) {
    document.getElementById('noSelection').style.display = 'none';
    document.getElementById('vehicleDetails').style.display = 'block';
    document.getElementById('vehicleDetails').innerHTML = generateVehicleDetailsHTML(vehicle);
}

function uploadDocument(vehicleId, docType) {
    currentVehicleId = vehicleId;
    currentUploadType = docType;
    
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
}

function viewDocument(vehicleId, docType) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    let fileName = '';
    
    if (docType === 'carte_grise' && vehicle.carteGrise && vehicle.carteGrise.fichier) {
        fileName = vehicle.carteGrise.fichier;
    } else if (docType === 'assurance' && vehicle.assurance && vehicle.assurance.fichier) {
        fileName = vehicle.assurance.fichier;
    }
    
    if (fileName) {
        alert(`Ouverture du document: ${fileName}\n\nEn production, ceci ouvrirait le document dans un nouvel onglet.`);
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validation du fichier
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        alert('Type de fichier non autorisé. Utilisez PDF, JPG ou PNG.');
        return;
    }

    // Limitation de taille (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximum : 5MB');
        return;
    }

    // Simulation de l'upload
    const fileName = `${currentUploadType}_${currentVehicleId}_${file.name}`;
    
    // Mise à jour des données
    const vehicle = vehicles.find(v => v.id === currentVehicleId);
    if (currentUploadType === 'carte_grise') {
        vehicle.carteGrise.fichier = fileName;
    } else if (currentUploadType === 'assurance') {
        vehicle.assurance.fichier = fileName;
    }

    // Actualiser l'affichage
    if (selectedVehicle && selectedVehicle.id === currentVehicleId) {
        if (window.innerWidth <= 1024) {
            openMobileModal(vehicle);
        } else {
            showVehicleDetails(vehicle);
        }
    }

    alert(`Document "${file.name}" uploadé avec succès!`);
    
    // Réinitialiser
    event.target.value = '';
    currentVehicleId = null;
    currentUploadType = null;
}

function editAssurance(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Pré-remplir le formulaire
    document.getElementById('vehicleId').value = vehicleId;
    
    if (vehicle.assurance) {
        document.getElementById('compagnie').value = vehicle.assurance.compagnie;
        document.getElementById('numeroContrat').value = vehicle.assurance.numeroContrat;
        document.getElementById('dateDebut').value = formatDateForInput(vehicle.assurance.dateDebut);
        document.getElementById('dateExpiration').value = formatDateForInput(vehicle.assurance.dateExpiration);
        document.getElementById('typeCouverture').value = vehicle.assurance.typeCouverture;
        document.getElementById('montantPrime').value = vehicle.assurance.montantPrime;
    } else {
        // Réinitialiser le formulaire pour un nouveau véhicule
        document.getElementById('assuranceForm').reset();
        document.getElementById('vehicleId').value = vehicleId;
    }

    // Afficher le modal
    document.getElementById('editModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Réinitialiser le champ "autre compagnie"
    document.getElementById('compagnieAutre').style.display = 'none';
    document.getElementById('compagnieAutre').value = '';
}

function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

function formatDateFromInput(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function saveAssurance(event) {
    event.preventDefault();
    
    const vehicleId = parseInt(document.getElementById('vehicleId').value);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) return;

    // Récupérer les données du formulaire
    const compagnie = document.getElementById('compagnie').value === 'autre' ? 
        document.getElementById('compagnieAutre').value : 
        document.getElementById('compagnie').value;
    
    const assuranceData = {
        compagnie: compagnie,
        numeroContrat: document.getElementById('numeroContrat').value,
        dateDebut: formatDateFromInput(document.getElementById('dateDebut').value),
        dateExpiration: formatDateFromInput(document.getElementById('dateExpiration').value),
        typeCouverture: document.getElementById('typeCouverture').value,
        montantPrime: parseFloat(document.getElementById('montantPrime').value) || 0,
        fichier: vehicle.assurance ? vehicle.assurance.fichier : null
    };

    // Validation des dates
    const dateDebut = new Date(document.getElementById('dateDebut').value);
    const dateExpiration = new Date(document.getElementById('dateExpiration').value);
    
    if (dateExpiration <= dateDebut) {
        alert('La date d\'expiration doit être postérieure à la date de début.');
        return;
    }

    // Mettre à jour les données
    vehicle.assurance = assuranceData;

    // Actualiser l'affichage
    generateVehicleList();
    
    if (selectedVehicle && selectedVehicle.id === vehicleId) {
        selectedVehicle = vehicle;
        if (window.innerWidth <= 1024) {
            openMobileModal(vehicle);
        } else {
            showVehicleDetails(vehicle);
        }
    }

    closeEditModal();
    
    // Message de confirmation
    alert(`Informations d'assurance mises à jour pour ${vehicle.nom}!`);
}

function goToHomePage() {
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

// Gestionnaire de fichier
document.getElementById('fileInput').addEventListener('change', handleFileUpload);

// Gestionnaire du formulaire d'assurance
document.getElementById('assuranceForm').addEventListener('submit', saveAssurance);

// Gestionnaire pour le champ "autre compagnie"
document.getElementById('compagnie').addEventListener('change', function() {
    const autreField = document.getElementById('compagnieAutre');
    if (this.value === 'autre') {
        autreField.style.display = 'block';
        autreField.required = true;
    } else {
        autreField.style.display = 'none';
        autreField.required = false;
        autreField.value = '';
    }
});

// Fermeture du modal en cliquant à l'extérieur
document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    generateVehicleList();
});



function goToHomePage() {
    window.location.href = '/';
}