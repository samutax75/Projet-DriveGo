// Données des véhicules avec informations étendues pour carte grise
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
            marque: "Renault",
            modele: "Trafic",
            numeroImmatriculation: "FV-088-JJ",
            dateImmatriculation: "26/11/2020",
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
        },
        controleTechnique: {
            dateProchainControle: "28/10/2026",
            photoUrl: null
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
            marque: "Renault",
            modele: "Trafic PMR",
            numeroImmatriculation: "GT-176-AF",
            dateImmatriculation: "14/12/2023",
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
        },
        controleTechnique: {
            dateProchainControle: "14/12/2027",
            photoUrl: null
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
            marque: "Renault",
            modele: "Trafic",
            numeroImmatriculation: "EJ-374-TT",
            dateImmatriculation: "02/02/2017",
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
        },
        controleTechnique: {
            dateProchainControle: "11/03/2027",
            photoUrl: null
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
            marque: "Renault",
            modele: "Trafic",
            numeroImmatriculation: "CW-819-FR",
            dateImmatriculation: "26/06/2013",
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
        },
        controleTechnique: {
            dateProchainControle: "26/01/2027",
            photoUrl: null
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
            marque: "Renault",
            modele: "Kangoo",
            numeroImmatriculation: "DS-429-PF",
            dateImmatriculation: "22/06/2015",
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
        },
        controleTechnique: {
            dateProchainControle: "28/01/2027",
            photoUrl: null
        }
    }
];

// Variables globales
let selectedVehicle = null;
let currentUploadType = null;
let currentVehicleId = null;
let ctPhotoFile = null;
let ctPhotoUrl = null;

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

function getControleTechniqueStatus(dateProchainControle) {
    if (!dateProchainControle) {
        return { class: 'unknown', text: 'Non renseigné' };
    }
    
    const today = new Date();
    const prochainControle = parseDate(dateProchainControle);
    const diffTime = prochainControle - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return { class: 'ct-expire', text: `Expiré depuis ${Math.abs(diffDays)} jours` };
    } else if (diffDays <= 30) {
        return { class: 'ct-proche', text: `Expire dans ${diffDays} jours` };
    } else {
        return { class: 'ct-valide', text: `Valide (${diffDays} jours)` };
    }
}

function getMultipleStatuses(vehicle) {
    return {
        controle: getStatusInfo(vehicle.controle),
        assurance: vehicle.assurance ? getStatusInfo(vehicle.assurance.dateExpiration) : { class: 'unknown', text: 'Non renseigné' },
        carteGrise: { class: 'good', text: 'Valide' },
        controleTechnique: getControleTechniqueStatus(vehicle.controleTechnique?.dateProchainControle)
    };
}

function getMostUrgentStatus(vehicle) {
    const controleStatus = getStatusInfo(vehicle.controle);
    return controleStatus;
}

// Génération de la liste des véhicules
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

    // Sur mobile, ouvrir la modal
    if (window.innerWidth <= 1024) {
        openMobileModal(vehicle);
    } else {
        // Sur desktop, afficher dans le panneau de droite
        showVehicleDetails(vehicle);
    }
}

// Modal mobile
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

// Navigation entre sections
function showSection(sectionName) {
    // Masquer tous les contenus d'onglets
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Retirer la classe active de tous les boutons desktop
    const navButtons = document.querySelectorAll('#navButtons .nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Afficher le contenu de l'onglet sélectionné
    const selectedContent = document.getElementById(sectionName.replace('-', '_'));
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Activer le bouton correspondant
    const selectedButton = document.querySelector(`#navButtons [data-section="${sectionName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
        
        // Animation de feedback tactile
        selectedButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            selectedButton.style.transform = '';
        }, 100);
    }
}

function showMobileSection(sectionName) {
    // Retirer la classe active de tous les boutons mobile
    const mobileNavButtons = document.querySelectorAll('#mobileNavButtons .nav-btn');
    mobileNavButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activer le bouton correspondant
    const selectedButton = document.querySelector(`#mobileNavButtons [data-section="${sectionName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
        
        // Animation de feedback tactile
        selectedButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            selectedButton.style.transform = '';
        }, 100);
    }
    
    // Gérer le contenu mobile
    showSection(sectionName);
}

// Génération du HTML des détails du véhicule
function generateVehicleDetailsHTML(vehicle) {
    const statuses = getMultipleStatuses(vehicle);

    return `
        <div class="vehicle-header-detail">
            <h3>${vehicle.nom}</h3>
            <p>${vehicle.immatriculation}</p>
        </div>

        <!-- Navigation moderne -->
        <div class="nav-buttons">
            <button class="nav-btn general active" onclick="showTab('general')" data-section="general">
                <span>🔧</span>
                Général
            </button>
            <button class="nav-btn carte-grise" onclick="showTab('carte_grise')" data-section="carte_grise">
                <span>📄</span>
                Carte Grise
            </button>
            <button class="nav-btn assurance" onclick="showTab('assurance')" data-section="assurance">
                <span>🛡️</span>
                Assurance
            </button>
            <button class="nav-btn controle-technique" onclick="showTab('controle_technique')" data-section="controle_technique">
                <span>🔍</span>
                CT
            </button>
        </div>

        <div class="tabs-container">
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
                            <div class="detail-label">🏷️ Marque</div>
                            <div class="detail-value">${vehicle.carteGrise ? vehicle.carteGrise.marque : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">🚗 Modèle</div>
                            <div class="detail-value">${vehicle.carteGrise ? vehicle.carteGrise.modele : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">📄 Numéro d'immatriculation</div>
                            <div class="detail-value">${vehicle.carteGrise ? vehicle.carteGrise.numeroImmatriculation : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">📅 Date d'immatriculation</div>
                            <div class="detail-value">${vehicle.carteGrise ? vehicle.carteGrise.dateImmatriculation : 'Non renseigné'}</div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">📋 Numéro de carte grise</div>
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
                        <button onclick="editCarteGrise(${vehicle.id})" class="upload-btn">
                            ✏️ Modifier les informations
                        </button>
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

            <div id="controle_technique" class="tab-content">
                <div class="document-section">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">📅 Date du prochain contrôle</div>
                            <div class="detail-value status ${statuses.controleTechnique.class}">
                                ${vehicle.controleTechnique?.dateProchainControle || 'Non renseigné'}
                            </div>
                            <div class="detail-status status ${statuses.controleTechnique.class}">
                                ${statuses.controleTechnique.text}
                            </div>
                        </div>

                        <div class="detail-item">
                            <div class="detail-label">📷 Photo du contrôle</div>
                            <div class="detail-value">
                                ${vehicle.controleTechnique?.photoUrl ? 'Photo disponible' : 'Aucune photo'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="upload-section">
                        <button onclick="openEditControleTechniqueModal(${vehicle.id})" class="upload-btn">
                            ✏️ Modifier le contrôle technique
                        </button>
                        ${vehicle.controleTechnique?.photoUrl ? `
                            <button onclick="viewControleTechniquePhoto(${vehicle.id})" class="upload-btn secondary">
                                👁️ Voir la photo
                            </button>
                        ` : ''}
                        <div class="file-info">
                            ${vehicle.controleTechnique?.photoUrl ? 'Photo du contrôle technique disponible' : 'Aucune photo ajoutée'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour les onglets (compatible avec l'ancien système)
function showTab(tabName) {
    // Masquer tous les onglets
    const tabs = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Afficher l'onglet sélectionné
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function showVehicleDetails(vehicle) {
    document.getElementById('noSelection').style.display = 'none';
    document.getElementById('vehicleDetails').style.display = 'block';
    document.getElementById('vehicleDetails').innerHTML = generateVehicleDetailsHTML(vehicle);
}

function toggleNavButtons(show) {
    const navButtons = document.getElementById('navButtons');
    if (navButtons) {
        navButtons.style.display = show ? 'flex' : 'none';
    }
}

// Gestion des documents
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

// ===============================
// GESTION DE LA CARTE GRISE
// ===============================

function editCarteGrise(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    document.getElementById('vehicleIdCG').value = vehicleId;
    
    if (vehicle.carteGrise) {
        document.getElementById('marque').value = vehicle.carteGrise.marque || '';
        document.getElementById('modele').value = vehicle.carteGrise.modele || '';
        document.getElementById('numeroImmatriculation').value = vehicle.carteGrise.numeroImmatriculation || '';
        document.getElementById('dateImmatriculationCG').value = formatDateForInput(vehicle.carteGrise.dateImmatriculation) || '';
        document.getElementById('numeroCarteGrise').value = vehicle.carteGrise.numero || '';
        document.getElementById('dateEmission').value = formatDateForInput(vehicle.carteGrise.dateEmission) || '';
        document.getElementById('titulaire').value = vehicle.carteGrise.titulaire || '';
    } else {
        document.getElementById('carteGriseForm').reset();
        document.getElementById('vehicleIdCG').value = vehicleId;
    }

    document.getElementById('editCarteGriseModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeEditCarteGriseModal() {
    document.getElementById('editCarteGriseModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function saveCarteGrise(event) {
    event.preventDefault();
    
    const vehicleId = parseInt(document.getElementById('vehicleIdCG').value);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) return;

    const carteGriseData = {
        marque: document.getElementById('marque').value,
        modele: document.getElementById('modele').value,
        numeroImmatriculation: document.getElementById('numeroImmatriculation').value,
        dateImmatriculation: formatDateFromInput(document.getElementById('dateImmatriculationCG').value),
        numero: document.getElementById('numeroCarteGrise').value,
        dateEmission: formatDateFromInput(document.getElementById('dateEmission').value),
        titulaire: document.getElementById('titulaire').value,
        dateExpiration: "",
        fichier: vehicle.carteGrise ? vehicle.carteGrise.fichier : null
    };

    // Mise à jour des données principales du véhicule
    vehicle.carteGrise = carteGriseData;
    vehicle.immatriculation = carteGriseData.numeroImmatriculation;
    vehicle.dateImmatriculation = carteGriseData.dateImmatriculation;
    
    // Mise à jour du nom du véhicule si modèle change
    if (carteGriseData.marque && carteGriseData.modele) {
        // Garder la couleur/nom existant mais utiliser le nouveau modèle si nécessaire
        const currentName = vehicle.nom;
        const colorMatch = currentName.match(/(BLANC|VERT|ROUGE|PMR|KANGOO)/);
        if (colorMatch && carteGriseData.modele.toUpperCase() !== 'KANGOO') {
            vehicle.nom = `${carteGriseData.modele.toUpperCase()} ${colorMatch[1]}`;
        } else if (carteGriseData.modele.toUpperCase() === 'KANGOO') {
            vehicle.nom = 'KANGOO';
        }
    }

    generateVehicleList();
    
    if (selectedVehicle && selectedVehicle.id === vehicleId) {
        selectedVehicle = vehicle;
        if (window.innerWidth <= 1024) {
            openMobileModal(vehicle);
        } else {
            showVehicleDetails(vehicle);
        }
    }

    closeEditCarteGriseModal();
    alert(`Informations de carte grise mises à jour pour ${vehicle.nom}!`);
}

// Gestion de l'assurance
function editAssurance(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    document.getElementById('vehicleId').value = vehicleId;
    
    if (vehicle.assurance) {
        document.getElementById('compagnie').value = vehicle.assurance.compagnie;
        document.getElementById('numeroContrat').value = vehicle.assurance.numeroContrat;
        document.getElementById('dateDebut').value = formatDateForInput(vehicle.assurance.dateDebut);
        document.getElementById('dateExpiration').value = formatDateForInput(vehicle.assurance.dateExpiration);
        document.getElementById('typeCouverture').value = vehicle.assurance.typeCouverture;
        
    } else {
        document.getElementById('assuranceForm').reset();
        document.getElementById('vehicleId').value = vehicleId;
    }

    document.getElementById('editModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
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

    const compagnie = document.getElementById('compagnie').value === 'autre' ? 
        document.getElementById('compagnieAutre').value : 
        document.getElementById('compagnie').value;
    
    const assuranceData = {
        compagnie: compagnie,
        numeroContrat: document.getElementById('numeroContrat').value,
        dateDebut: formatDateFromInput(document.getElementById('dateDebut').value),
        dateExpiration: formatDateFromInput(document.getElementById('dateExpiration').value),
        typeCouverture: document.getElementById('typeCouverture').value,
        fichier: vehicle.assurance ? vehicle.assurance.fichier : null
    };

    const dateDebut = new Date(document.getElementById('dateDebut').value);
    const dateExpiration = new Date(document.getElementById('dateExpiration').value);
    
    if (dateExpiration <= dateDebut) {
        alert('La date d\'expiration doit être postérieure à la date de début.');
        return;
    }

    vehicle.assurance = assuranceData;

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
    alert(`Informations d'assurance mises à jour pour ${vehicle.nom}!`);
}

// ===============================
// GESTION DU CONTRÔLE TECHNIQUE
// ===============================

function openEditControleTechniqueModal(vehicleId) {
    const modal = document.getElementById('editControleTechniqueModal');
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    document.getElementById('vehicleIdCT').value = vehicleId;
    
    // Charger les données existantes
    if (vehicle.controleTechnique) {
        document.getElementById('dateProchainControle').value = 
            formatDateForInput(vehicle.controleTechnique.dateProchainControle);
        
        if (vehicle.controleTechnique.photoUrl) {
            ctPhotoUrl = vehicle.controleTechnique.photoUrl;
            document.getElementById('ctPhotoInfo').textContent = 'Photo existante';
            document.getElementById('ctPhotoInfo').classList.add('has-file');
        }
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeEditControleTechniqueModal() {
    document.getElementById('editControleTechniqueModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    resetControleTechniqueForm();
}

function selectControleTechniquePhoto() {
    document.getElementById('ctFileInput').click();
}

function viewControleTechniquePhoto() {
    if (ctPhotoUrl || ctPhotoFile) {
        const preview = document.getElementById('ctPhotoPreview');
        const img = document.getElementById('ctPhotoImg');
        
        if (ctPhotoFile) {
            img.src = URL.createObjectURL(ctPhotoFile);
        } else if (ctPhotoUrl) {
            img.src = ctPhotoUrl;
        }
        
        preview.style.display = 'block';
    } else {
        alert('Aucune photo sélectionnée');
    }
}

function resetControleTechniqueForm() {
    document.getElementById('controleTechniqueForm').reset();
    ctPhotoFile = null;
    ctPhotoUrl = null;
    document.getElementById('ctPhotoInfo').textContent = 'Aucune photo sélectionnée';
    document.getElementById('ctPhotoInfo').classList.remove('has-file');
    document.getElementById('ctPhotoPreview').style.display = 'none';
}

function saveControleTechnique(event) {
    event.preventDefault();
    
    const vehicleId = parseInt(document.getElementById('vehicleIdCT').value);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) return;

    const dateProchainControle = formatDateFromInput(document.getElementById('dateProchainControle').value);
    
    // Mise à jour des données
    if (!vehicle.controleTechnique) {
        vehicle.controleTechnique = {};
    }
    
    vehicle.controleTechnique.dateProchainControle = dateProchainControle;
    
    // Gestion de la photo
    if (ctPhotoFile) {
        const photoFileName = `ct_${vehicleId}_${ctPhotoFile.name}`;
        vehicle.controleTechnique.photoUrl = photoFileName;
        console.log('Photo à sauvegarder:', photoFileName);
    }

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

    closeEditControleTechniqueModal();
    alert(`Contrôle technique mis à jour pour ${vehicle.nom}!`);
}

// Navigation et utilitaires
function goToHomePage() {
    window.location.href = '/';
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

// ===============================
// GESTIONNAIRES D'ÉVÉNEMENTS
// ===============================

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation
    generateVehicleList();
    
    // Gestionnaire de fichier pour les documents généraux
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    
    // Gestionnaire de fichier pour les photos CT
    document.getElementById('ctFileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validation
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert('Type de fichier non autorisé. Utilisez JPG, PNG ou PDF.');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier est trop volumineux. Taille maximum : 5MB');
                return;
            }

            ctPhotoFile = file;
            const fileInfo = document.getElementById('ctPhotoInfo');
            fileInfo.textContent = `Photo sélectionnée: ${file.name}`;
            fileInfo.classList.add('has-file');
            
            // Afficher automatiquement la prévisualisation
            viewControleTechniquePhoto();
        }
    });
    
    // Gestionnaire du formulaire d'assurance
    document.getElementById('assuranceForm').addEventListener('submit', saveAssurance);
    
    // Gestionnaire du formulaire de contrôle technique
    document.getElementById('controleTechniqueForm').addEventListener('submit', saveControleTechnique);
    
    // Gestionnaire du formulaire de carte grise
    document.getElementById('carteGriseForm').addEventListener('submit', saveCarteGrise);
    
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
    
    // Fermeture des modals en cliquant à l'extérieur
    document.getElementById('mobileModal').addEventListener('click', (e) => {
        if (e.target.id === 'mobileModal') {
            closeMobileModal();
        }
    });
    
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') {
            closeEditModal();
        }
    });
    
    document.getElementById('editControleTechniqueModal').addEventListener('click', (e) => {
        if (e.target.id === 'editControleTechniqueModal') {
            closeEditControleTechniqueModal();
        }
    });
    
    document.getElementById('editCarteGriseModal').addEventListener('click', (e) => {
        if (e.target.id === 'editCarteGriseModal') {
            closeEditCarteGriseModal();
        }
    });
    
    // Amélioration des boutons de navigation avec effets
    document.addEventListener('click', function(e) {
        if (e.target.closest('.nav-btn')) {
            const btn = e.target.closest('.nav-btn');
            
            // Effet ripple
            const ripple = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
                z-index: 1;
            `;
            
            btn.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        }
    });
    
    // Ajouter les styles pour l'animation de ripple
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            from {
                transform: scale(0);
                opacity: 1;
            }
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .nav-btn {
            position: relative;
            overflow: hidden;
        }
    `;
    
    document.head.appendChild(rippleStyle);
});


