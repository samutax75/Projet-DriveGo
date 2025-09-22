// Variables globales
let vehicles = []; // Maintenant chargé via API
let selectedVehicle = null;
let currentUploadType = null;
let currentVehicleId = null;
let ctPhotoFile = null;
let ctPhotoUrl = null;

// ===============================
// FONCTIONS API
// ===============================

async function loadVehicles() {
    
    try {
        const response = await fetch('/api/vehicules/complete');
        const data = await response.json();
        
        if (data.success) {
            vehicles = data.vehicules;
            generateVehicleList();
            console.log('Véhicules chargés:', vehicles.length);
        } else {
            console.error('Erreur chargement véhicules:', data.message);
            alert('Erreur lors du chargement des véhicules');
        }
    } catch (error) {
        console.error('Erreur API:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function saveAssuranceToAPI(vehicleId, assuranceData) {
    
    try {
        const response = await fetch(`/api/vehicules/${vehicleId}/assurance`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assuranceData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Recharger les données
            await loadVehicles();
            
            // Rafraîchir l'affichage si le véhicule sélectionné
            if (selectedVehicle && selectedVehicle.id === vehicleId) {
                const updatedVehicle = vehicles.find(v => v.id === vehicleId);
                selectedVehicle = updatedVehicle;
                
                if (window.innerWidth <= 1024) {
                    openMobileModal(updatedVehicle);
                } else {
                    showVehicleDetails(updatedVehicle);
                }
            }
            
            return true;
        } else {
            alert('Erreur: ' + data.message);
            return false;
        }
    } catch (error) {
        console.error('Erreur API assurance:', error);
        alert('Erreur de connexion au serveur');
        return false;
    }
}

async function saveCarteGriseToAPI(vehicleId, carteGriseData) {
    
    try {
        const response = await fetch(`/api/vehicules/${vehicleId}/carte-grise`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(carteGriseData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Recharger les données
            await loadVehicles();
            
            // Rafraîchir l'affichage
            if (selectedVehicle && selectedVehicle.id === vehicleId) {
                const updatedVehicle = vehicles.find(v => v.id === vehicleId);
                selectedVehicle = updatedVehicle;
                
                if (window.innerWidth <= 1024) {
                    openMobileModal(updatedVehicle);
                } else {
                    showVehicleDetails(updatedVehicle);
                }
            }
            
            return true;
        } else {
            alert('Erreur: ' + data.message);
            return false;
        }
    } catch (error) {
        console.error('Erreur API carte grise:', error);
        alert('Erreur de connexion au serveur');
        return false;
    }
}

async function saveControleTechniqueToAPI(vehicleId, formData) {
    
    try {
        const response = await fetch(`/api/vehicules/${vehicleId}/controle-technique`, {
            method: 'PUT',
            body: formData // FormData pour gérer l'upload de fichier
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Recharger les données
            await loadVehicles();
            
            // Rafraîchir l'affichage
            if (selectedVehicle && selectedVehicle.id === vehicleId) {
                const updatedVehicle = vehicles.find(v => v.id === vehicleId);
                selectedVehicle = updatedVehicle;
                
                if (window.innerWidth <= 1024) {
                    openMobileModal(updatedVehicle);
                } else {
                    showVehicleDetails(updatedVehicle);
                }
            }
            
            return true;
        } else {
            alert('Erreur: ' + data.message);
            return false;
        }
    } catch (error) {
        console.error('Erreur API contrôle technique:', error);
        alert('Erreur de connexion au serveur');
        return false;
    }
}

async function uploadDocumentToAPI(vehicleId, docType, file) {
    
    try {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', docType);
        
        const response = await fetch(`/api/vehicules/${vehicleId}/documents`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Recharger les données
            await loadVehicles();
            
            // Rafraîchir l'affichage
            if (selectedVehicle && selectedVehicle.id === vehicleId) {
                const updatedVehicle = vehicles.find(v => v.id === vehicleId);
                selectedVehicle = updatedVehicle;
                
                if (window.innerWidth <= 1024) {
                    openMobileModal(updatedVehicle);
                } else {
                    showVehicleDetails(updatedVehicle);
                }
            }
            
            return true;
        } else {
            alert('Erreur: ' + data.message);
            return false;
        }
    } catch (error) {
        console.error('Erreur API upload:', error);
        alert('Erreur de connexion au serveur');
        return false;
    }
}

// ===============================
// FONCTIONS UTILITAIRES (gardées identiques)
// ===============================

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

// ===============================
// GÉNÉRATION DE L'INTERFACE
// ===============================

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

function generateVehicleDetailsHTML(vehicle) {
    const statuses = getMultipleStatuses(vehicle);

    return `
        
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
                        ${vehicle.carteGrise && vehicle.carteGrise.fichier ? `
                            <button onclick="viewDocument('${vehicle.carteGrise.fichier}')" class="upload-btn secondary">
                                👁️ Voir le document
                            </button>
                        ` : ''}
                        <div class="file-info">
                            ${vehicle.carteGrise && vehicle.carteGrise.fichier ? `Document de carte grise disponible` : 'Aucun document de carte grise'}
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
                        ${vehicle.assurance && vehicle.assurance.fichier ? `
                            <button onclick="viewDocument('${vehicle.assurance.fichier}')" class="upload-btn secondary">
                                👁️ Voir le document
                            </button>
                        ` : ''}
                        <div class="file-info">
                            ${vehicle.assurance && vehicle.assurance.fichier ? `Document d'assurance disponible` : 'Aucun document d\'assurance'}
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
                        ${vehicle.controleTechnique?.photoUrl ? `
                            <button onclick="viewDocument('${vehicle.controleTechnique.photoUrl}')" class="upload-btn secondary">
                                👁️ Voir la photo
                            </button>
                        ` : ''}
                        <div class="file-info">
                            ${vehicle.controleTechnique?.photoUrl ? 'Photo du contrôle technique disponible' : 'Aucune photo de contrôle technique'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===============================
// GESTION DE L'INTERFACE
// ===============================

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
    const tabs = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function showVehicleDetails(vehicle) {
    document.getElementById('noSelection').style.display = 'none';
    document.getElementById('vehicleDetails').style.display = 'block';
    document.getElementById('vehicleDetails').innerHTML = generateVehicleDetailsHTML(vehicle);
}

// ===============================
// GESTION DES DOCUMENTS
// ===============================

function uploadDocument(vehicleId, docType) {
    currentVehicleId = vehicleId;
    currentUploadType = docType;
    
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
}

async function handleFileUpload(event) {
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

    // Upload via API
    const success = await uploadDocumentToAPI(currentVehicleId, currentUploadType, file);
    
    if (success) {
        alert(`Document "${file.name}" uploadé avec succès!`);
    }
    
    // Réinitialiser
    event.target.value = '';
    currentVehicleId = null;
    currentUploadType = null;
}

function viewDocument(filePath) {
    if (filePath) {
        window.open(filePath, '_blank');
    }
}

// ===============================
// GESTION DE L'ASSURANCE
// ===============================

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
        document.getElementById('montantPrime').value = vehicle.assurance.montantPrime;
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

async function saveAssurance(event) {
    event.preventDefault();
    
    const vehicleId = parseInt(document.getElementById('vehicleId').value);
    
    const compagnie = document.getElementById('compagnie').value === 'autre' ? 
        document.getElementById('compagnieAutre').value : 
        document.getElementById('compagnie').value;
    
    const assuranceData = {
        compagnie: compagnie,
        numeroContrat: document.getElementById('numeroContrat').value,
        dateDebut: formatDateFromInput(document.getElementById('dateDebut').value),
        dateExpiration: formatDateFromInput(document.getElementById('dateExpiration').value),
        typeCouverture: document.getElementById('typeCouverture').value,
        montantPrime: parseFloat(document.getElementById('montantPrime').value) || 0
    };

    const dateDebut = new Date(document.getElementById('dateDebut').value);
    const dateExpiration = new Date(document.getElementById('dateExpiration').value);
    
    if (dateExpiration <= dateDebut) {
        alert('La date d\'expiration doit être postérieure à la date de début.');
        return;
    }

    const success = await saveAssuranceToAPI(vehicleId, assuranceData);
    
    if (success) {
        closeEditModal();
        const vehicleName = vehicles.find(v => v.id === vehicleId)?.nom || 'le véhicule';
        alert(`Informations d'assurance mises à jour pour ${vehicleName}!`);
    }
}

// ===============================
// GESTION DE LA CARTE GRISE
// ===============================

function editCarteGrise(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    document.getElementById('vehicleIdCG').value = vehicleId;
    
    if (vehicle.carteGrise) {
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

async function saveCarteGrise(event) {
    event.preventDefault();
    
    const vehicleId = parseInt(document.getElementById('vehicleIdCG').value);
    
    const carteGriseData = {
        numero: document.getElementById('numeroCarteGrise').value,
        dateEmission: formatDateFromInput(document.getElementById('dateEmission').value),
        titulaire: document.getElementById('titulaire').value
    };

    const success = await saveCarteGriseToAPI(vehicleId, carteGriseData);
    
    if (success) {
        closeEditCarteGriseModal();
        const vehicleName = vehicles.find(v => v.id === vehicleId)?.nom || 'le véhicule';
        alert(`Informations de carte grise mises à jour pour ${vehicleName}!`);
    }
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

async function saveControleTechnique(event) {
    event.preventDefault();
    
    const vehicleId = parseInt(document.getElementById('vehicleIdCT').value);
    const dateProchainControle = formatDateFromInput(document.getElementById('dateProchainControle').value);
    
    // Préparer FormData pour l'API
    const formData = new FormData();
    formData.append('dateProchainControle', dateProchainControle);
    
    if (ctPhotoFile) {
        formData.append('photo', ctPhotoFile);
    }

    const success = await saveControleTechniqueToAPI(vehicleId, formData);
    
    if (success) {
        closeEditControleTechniqueModal();
        const vehicleName = vehicles.find(v => v.id === vehicleId)?.nom || 'le véhicule';
        alert(`Contrôle technique mis à jour pour ${vehicleName}!`);
    }
}

// ===============================
// NAVIGATION ET UTILITAIRES
// ===============================

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

document.addEventListener('DOMContentLoaded', async function() {
    // Chargement initial des données depuis l'API
    await loadVehicles();
    
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


