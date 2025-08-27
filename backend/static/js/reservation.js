// === CODE CORRIGÉ POUR LA PAGE RÉSERVATION ===
// Remplacez ENTIÈREMENT votre fichier reservation.js par ce code

let dataManager = null;
let vehicles = [];

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DriveGo Réservation - Initialisation...');
    
    try {
        // Initialiser le système unifié
        dataManager = await initDriveGoSystem();
        
        // Écouter les changements de données
        dataManager.addListener((event, data) => {
            if (event === 'dataChanged') {
                vehicles = data.vehicles;
                displayVehiclesStatus();
                populateVehicleSelect();
                console.log('Données mises à jour - Véhicules:', vehicles.length);
            }
        });
        
        // Récupérer les données initiales
        vehicles = dataManager.getVehicles();
        
        // Initialiser l'affichage
        displayVehiclesStatus();
        populateVehicleSelect();
        setMinDate();
        
        // Pré-remplir les champs utilisateur après un délai
        setTimeout(fillUserDataInForms, 500);
        
        // Event listeners
        const form = document.getElementById('form-reservation');
        const formMobile = document.getElementById('form-reservation-mobile');
        
        if (form) form.addEventListener('submit', (e) => confirmReservation(e, false));
        if (formMobile) formMobile.addEventListener('submit', (e) => confirmReservation(e, true));
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeMobileModal();
        });
        
        console.log('DriveGo Réservation initialisé avec', vehicles.length, 'véhicules');
        
    } catch (error) {
        console.error('Erreur initialisation:', error);
        showMessage('Erreur de connexion - Mode dégradé', 'error');
    }
});

// === AFFICHAGE DES VÉHICULES ===
function displayVehiclesStatus() {
    const container = document.getElementById('vehicles-status');
    if (!container) return;
    
    if (!vehicles || vehicles.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px;">Chargement...</div>';
        return;
    }
    
    container.innerHTML = vehicles.map(vehicle => {
        const statusClass = `status-${vehicle.status}`;
        let statusText = getStatusText(vehicle.status);
        
        let additionalInfo = '';
        if (vehicle.status === 'reserved' && vehicle.reservedBy) {
            additionalInfo = `
                <div class="reserved-by">
                    <strong>Réservé par:</strong> ${vehicle.reservedBy}<br>
                    <strong>Date:</strong> ${vehicle.reservationDate}<br>
                    <strong>Horaire:</strong> ${vehicle.reservationTime}<br>
                    <strong>ID:</strong> ${vehicle.reservationId}
                </div>
            `;
        } else if (vehicle.status === 'mission' && vehicle.missionBy) {
            additionalInfo = `
                <div class="mission-info">
                    <strong>Mission par:</strong> ${vehicle.missionBy}<br>
                    <strong>Destination:</strong> ${vehicle.missionInfo?.destination || 'N/A'}<br>
                    <strong>Départ:</strong> ${vehicle.missionInfo?.departureTime || 'N/A'}
                </div>
            `;
        }
        
        return `
            <div class="vehicle-item" onclick="selectVehicleOnMobile(${vehicle.id})">
                <div class="vehicle-header">
                    <div class="vehicle-name">${vehicle.type} ${vehicle.name}</div>
                    <div class="status-badge ${statusClass}">${statusText}</div>
                </div>
                <div class="vehicle-info">
                    <strong>Immatriculation:</strong> ${vehicle.immatriculation}
                </div>
                ${additionalInfo}
            </div>
        `;
    }).join('');
}

function populateVehicleSelect() {
    const selects = ['vehicule', 'vehicule-mobile'];
    const availableVehicles = vehicles.filter(v => v.status === 'available');
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Sélectionner un véhicule --</option>';
        
        if (availableVehicles.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'Aucun véhicule disponible';
            option.disabled = true;
            select.appendChild(option);
        } else {
            availableVehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.type} ${vehicle.name} - ${vehicle.immatriculation}`;
                select.appendChild(option);
            });
        }
    });
}

function getStatusText(status) {
    switch(status) {
        case 'available': return 'Disponible';
        case 'reserved': return 'Réservé';
        case 'mission': return 'En mission';
        case 'maintenance': return 'Maintenance';
        default: return status;
    }
}

// === GESTION DES RÉSERVATIONS ===
async function confirmReservation(event, isMobile = false) {
    event.preventDefault();
    
    const prefix = isMobile ? '-mobile' : '';
    const formId = isMobile ? 'form-reservation-mobile' : 'form-reservation';
    
    showLoadingState(formId, true);
    
    const nom = document.getElementById(`nom${prefix}`)?.value.trim();
    const date = document.getElementById(`date${prefix}`)?.value;
    const heureDepart = document.getElementById(`heure-depart${prefix}`)?.value;
    const heureArrivee = document.getElementById(`heure-arrivee${prefix}`)?.value;
    const vehiculeId = parseInt(document.getElementById(`vehicule${prefix}`)?.value);
    
    // Validation
    if (!nom || !date || !heureDepart || !heureArrivee || !vehiculeId) {
        showLoadingState(formId, false);
        showMessage('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (heureDepart >= heureArrivee) {
        showLoadingState(formId, false);
        showMessage('L\'heure d\'arrivée doit être postérieure à l\'heure de départ', 'error');
        return;
    }
    
    const vehicle = vehicles.find(v => v.id === vehiculeId);
    if (!vehicle || vehicle.status !== 'available') {
        showLoadingState(formId, false);
        showMessage('Ce véhicule n\'est plus disponible', 'error');
        return;
    }
    
    try {
        // Format correct pour le serveur Flask
        const reservationData = {
            vehicule_id: vehiculeId,
            date_debut: `${date} ${heureDepart}:00`,
            date_fin: `${date} ${heureArrivee}:00`,
            notes: `Conducteur: ${nom}`
        };
        
        console.log('Création réservation:', reservationData);
        
        // Appel direct à l'API au lieu d'utiliser dataManager
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservationData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            const reservationId = `RES-${Date.now()}`;
            
            showMessage(`
                <strong>Réservation confirmée!</strong><br><br>
                <strong>ID:</strong> ${reservationId}<br>
                <strong>Véhicule:</strong> ${vehicle.type} ${vehicle.name}<br>
                <strong>Conducteur:</strong> ${nom}<br>
                <strong>Date:</strong> ${formatDate(date)}<br>
                <strong>Horaire:</strong> ${heureDepart}-${heureArrivee}
            `, 'success');
            
            // Réinitialiser le formulaire
            const form = document.getElementById(formId);
            if (form) form.reset();
            setMinDate();
            setTimeout(fillUserDataInForms, 100);
            
            // Recharger les données pour mettre à jour l'affichage
            if (dataManager) {
                setTimeout(() => dataManager.loadAllData(), 1000);
            }
            
            if (isMobile) {
                setTimeout(() => closeMobileModal(), 2000);
            }
        } else {
            showMessage(result.message || 'Erreur lors de la création de la réservation', 'error');
        }
        
    } catch (error) {
        console.error('Erreur réservation:', error);
        showMessage('Erreur lors de la réservation', 'error');
    } finally {
        showLoadingState(formId, false);
    }
}

async function annulerReservation() {
    const reservationId = document.getElementById('reservation-id')?.value.trim();
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
        try {
            const success = await dataManager.cancelReservation(reservationId);
            
            if (success) {
                showMessage(`Réservation ${reservationId} annulée avec succès`, 'success');
                document.getElementById('reservation-id').value = '';
            } else {
                showMessage('Erreur lors de l\'annulation', 'error');
            }
        } catch (error) {
            console.error('Erreur annulation:', error);
            showMessage('Erreur lors de l\'annulation', 'error');
        }
    }
}

function rechercherReservation() {
    const searchTerm = document.getElementById('search-reservation')?.value.toLowerCase().trim();
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
            `<strong>${v.reservationId}:</strong> ${v.reservedBy} - ${v.type} ${v.name} (${v.reservationDate} • ${v.reservationTime})`
        ).join('<br><br>');
        showMessage(`<strong>Réservations trouvées:</strong><br><br>${resultText}`, 'success');
    }
}

function modifierReservation() {
    const reservationId = document.getElementById('reservation-id')?.value.trim();
    if (!reservationId) {
        showMessage('Veuillez entrer un identifiant de réservation', 'error');
        return;
    }
    
    showMessage('Fonction de modification en cours de développement', 'error');
}

function exportToMissions() {
    showMessage('Fonction d\'export en cours de développement', 'error');
}

// === FONCTIONS UTILITAIRES ===
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function showMessage(message, type) {
    const confirmationDiv = document.getElementById('confirmation');
    if (!confirmationDiv) return;
    
    const typeClass = type === 'success' ? 'confirmation' : type;
    confirmationDiv.innerHTML = `<div class="${typeClass}">${message}</div>`;
    
    confirmationDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
        confirmationDiv.innerHTML = '';
    }, 7000);
}

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = ['date', 'date-mobile'];
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.min = today;
            if (!input.value) {
                input.value = today;
            }
        }
    });
}

function showLoadingState(formId, loading = true) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.btn-text');
    const loadingSpinner = button.querySelector('.loading');
    
    if (loading) {
        button.disabled = true;
        if (buttonText) buttonText.style.display = 'none';
        if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
    } else {
        button.disabled = false;
        if (buttonText) buttonText.style.display = 'inline-flex';
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

function fillUserDataInForms() {
    if (dataManager && dataManager.data.currentUser) {
        const userName = dataManager.data.currentUser.prenom + ' ' + dataManager.data.currentUser.nom;
        
        const nomInputs = ['nom', 'nom-mobile'];
        nomInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input && !input.value) {
                input.value = userName;
            }
        });
    }
}

// === GESTION MOBILE ===
function openMobileModal() {
    const modal = document.getElementById('mobile-modal');
    const backdrop = document.getElementById('modal-backdrop');
    
    populateVehicleSelect();
    setMinDate();
    
    modal.classList.add('show');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    setTimeout(fillUserDataInForms, 100);
}

function closeMobileModal() {
    const modal = document.getElementById('mobile-modal');
    const backdrop = document.getElementById('modal-backdrop');
    
    modal.classList.remove('show');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
    
    const form = document.getElementById('form-reservation-mobile');
    if (form) form.reset();
    setMinDate();
}

function selectVehicleOnMobile(vehicleId) {
    if (window.innerWidth <= 767) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle && vehicle.status === 'available') {
            openMobileModal();
            setTimeout(() => {
                const select = document.getElementById('vehicule-mobile');
                if (select) select.value = vehicleId;
            }, 100);
        }
    }
}

function refreshData() {
    console.log('Rafraîchissement des données...');
    if (dataManager) {
        dataManager.loadAllData();
    }
}

function goBack() {
    window.location.href = "/";
}