// Variables globales
let currentUser = null;
let activeMission = null;
let availableDrivers = [];

// Fonction pour récupérer l'utilisateur connecté
async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/user/current', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
                currentUser = {
                    id: data.user.id,
                    nom: data.user.nom,
                    prenom: extractFirstName(data.user.nom),
                    email: data.user.email,
                    role: data.user.role
                };
                return true;
            }
        }
        throw new Error('Utilisateur non trouvé');
    } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
        return false;
    }
}

// Fonction pour extraire le prénom
function extractFirstName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1];
}

// Fonction pour récupérer la mission active
async function fetchActiveMission() {
    if (!currentUser) return false;
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/missions`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.missions) {
                const missions = data.missions.filter(m => m.statut === 'active');
                if (missions.length > 0) {
                    activeMission = missions[0]; // Première mission active
                    return true;
                }
            }
        }
        throw new Error('Aucune mission active trouvée');
    } catch (error) {
        console.error('Erreur récupération mission:', error);
        return false;
    }
}

// Fonction pour récupérer la liste des conducteurs
async function fetchAvailableDrivers() {
    try {
        const response = await fetch('/api/users', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.users) {
                // Filtrer pour exclure l'utilisateur actuel
                availableDrivers = data.users
                    .filter(user => user.id !== currentUser.id)
                    .map(user => ({
                        id: user.id,
                        nom: user.nom,
                        prenom: extractFirstName(user.nom)
                    }));
                return true;
            }
        }
        return true; // Continuer même si pas d'autres conducteurs
    } catch (error) {
        console.error('Erreur récupération conducteurs:', error);
        return true; // Continuer même en cas d'erreur
    }
}

// Fonction pour récupérer les informations du véhicule
async function fetchVehicleInfo(vehicleId) {
    try {
        const response = await fetch('/api/vehicules', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.vehicules) {
                const vehicle = data.vehicules.find(v => v.id === vehicleId);
                return vehicle || { nom: 'Véhicule inconnu', immatriculation: '' };
            }
        }
        return { nom: 'Véhicule inconnu', immatriculation: '' };
    } catch (error) {
        console.error('Erreur récupération véhicule:', error);
        return { nom: 'Véhicule inconnu', immatriculation: '' };
    }
}

// Afficher les informations
async function displayMissionInfo() {
    document.getElementById('currentDriver').textContent = currentUser.prenom;
    
    if (activeMission) {
        const vehicle = await fetchVehicleInfo(activeMission.vehicule_id);
        document.getElementById('currentVehicle').textContent = 
            `${vehicle.nom} (${vehicle.immatriculation || activeMission.vehicule_id})`;
        document.getElementById('currentDestination').textContent = activeMission.destination || '-';
        document.getElementById('currentDepartureTime').textContent = activeMission.heure_debut || '-';
    }
}

// Remplir la liste des conducteurs
function populateDriversList() {
    const select = document.getElementById('newDriver');
    select.innerHTML = '<option value="">-- Choisir un conducteur --</option>';
    
    availableDrivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.id;
        option.textContent = driver.prenom;
        select.appendChild(option);
    });

    // Option pour saisie manuelle
    const manualOption = document.createElement('option');
    manualOption.value = 'manual';
    manualOption.textContent = '✏️ Autre conducteur (saisie manuelle)';
    select.appendChild(manualOption);

    // Gérer la saisie manuelle
    select.addEventListener('change', function() {
        const existingInput = document.getElementById('manualDriverInput');
        if (existingInput) existingInput.remove();

        if (this.value === 'manual') {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'manualDriverInput';
            input.name = 'manualDriverName';
            input.placeholder = 'Nom du conducteur';
            input.style.cssText = 'margin-top: 10px; width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px;';
            input.required = true;
            this.parentNode.appendChild(input);
        }
    });
}

// Transférer le volant
async function transferVehicle(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newDriverId = formData.get('newDriver');
    const newDriverName = formData.get('manualDriverName');
    const notes = formData.get('transferNotes');

    if (!newDriverId) {
        showError('Veuillez sélectionner un nouveau conducteur');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Transfert en cours...';

    try {
        const transferData = {
            new_driver_id: newDriverId === 'manual' ? null : newDriverId,
            new_driver_name: newDriverName || null,
            notes: notes
        };

        const response = await fetch(`/api/missions/${activeMission.id}/transfer`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transferData)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showTransferSuccessOptions(data.transfer_time);
                return;
            }
        }

        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du transfert');
    } catch (error) {
        console.error('Erreur transfert:', error);
        showError(error.message || 'Erreur lors du transfert. Veuillez réessayer.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🔄 Transférer le volant';
    }
}

// Afficher les options après transfert réussi (sans le bouton terminer)
function showTransferSuccessOptions(transferTime) {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="transfer-success-container" style="text-align: center; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                        color: white; padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                <h2 style="margin: 0; font-size: 24px;">✅ Volant transféré avec succès !</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Transfert effectué à ${transferTime || 'maintenant'}</p>
            </div>
            
            <div class="options-container" style="display: grid; gap: 15px; max-width: 500px; margin: 0 auto;">
                <h3 style="color: #374151; margin-bottom: 20px;">Que souhaitez-vous faire maintenant ?</h3>
                
                <button onclick="resumeControlAndSync()" class="option-btn resume-btn" style="
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    padding: 15px 25px; border: none; border-radius: 12px; cursor: pointer;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white; font-weight: 500; font-size: 16px; transition: all 0.3s ease;">
                    🔄 Reprendre le contrôle
                </button>
                
                <button onclick="goToVehiclesAndSync()" class="option-btn vehicles-btn" style="
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    padding: 15px 25px; border: none; border-radius: 12px; cursor: pointer;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white; font-weight: 500; font-size: 16px; transition: all 0.3s ease;">
                    🚗 Retour à la gestion véhicules
                </button>
                
                <button onclick="refreshAndStay()" class="option-btn refresh-btn" style="
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    padding: 15px 25px; border: none; border-radius: 12px; cursor: pointer;
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    color: white; font-weight: 500; font-size: 16px; transition: all 0.3s ease;">
                    🔄 Actualiser les données
                </button>
                
                <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 10px;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        💡 <strong>Astuce :</strong> Le transfert a été synchronisé avec la page véhicules. 
                        Vous pouvez reprendre le contrôle à tout moment.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter les effets hover aux boutons
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
}

// Reprendre le contrôle avec synchronisation
async function resumeControlAndSync() {
    if (!activeMission) {
        showError('Mission introuvable');
        return;
    }
    
    try {
        const response = await fetch(`/api/missions/${activeMission.id}/resume`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        if (data.success) {
            // Informer que le contrôle a été repris et rediriger
            showSuccessMessage('Contrôle repris avec succès ! Redirection...');
            setTimeout(() => {
                window.location.href = '/gestion_vehicules';
            }, 1500);
        } else {
            showError(data.message || 'Erreur lors de la reprise de contrôle');
        }
    } catch (error) {
        console.error('Erreur reprise contrôle:', error);
        showError('Erreur lors de la reprise de contrôle');
    }
}

// Aller aux véhicules avec synchronisation
function goToVehiclesAndSync() {
    showSuccessMessage('Redirection vers la gestion véhicules...');
    setTimeout(() => {
        window.location.href = '/gestion_vehicules';
    }, 1000);
}

// Actualiser les données sans quitter la page
async function refreshAndStay() {
    try {
        showSuccessMessage('Actualisation des données...');
        
        // Recharger les données
        await fetchActiveMission();
        await displayMissionInfo();
        
        // Vérifier le statut de la mission
        const statusResponse = await fetch(`/api/missions/${activeMission.id}/status`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.success) {
                // Afficher les informations actualisées
                showMissionStatus(statusData);
            }
        }
        
    } catch (error) {
        console.error('Erreur actualisation:', error);
        showError('Erreur lors de l\'actualisation');
    }
}

// Afficher le statut actuel de la mission
function showMissionStatus(statusData) {
    const mainContent = document.getElementById('mainContent');
    
    const statusText = statusData.can_resume_control ? 
        `Mission actuellement transférée (${statusData.control_status})` : 
        'Mission sous votre contrôle';
    
    mainContent.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                        color: white; padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                <h2 style="margin: 0; font-size: 24px;">📊 Statut de la mission</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">${statusText}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h3>Informations de la mission</h3>
                <div style="text-align: left; max-width: 400px; margin: 0 auto;">
                    <p><strong>Véhicule :</strong> ${document.getElementById('currentVehicle').textContent}</p>
                    <p><strong>Destination :</strong> ${document.getElementById('currentDestination').textContent}</p>
                    <p><strong>Heure de début :</strong> ${document.getElementById('currentDepartureTime').textContent}</p>
                    <p><strong>Contrôle :</strong> ${statusData.control_status}</p>
                    ${statusData.transferred_to_name ? `<p><strong>Transféré à :</strong> ${statusData.transferred_to_name}</p>` : ''}
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <button onclick="window.location.href='/gestion_vehicules'" style="
                    padding: 12px 24px; background: #10b981; color: white; border: none; 
                    border-radius: 8px; cursor: pointer; margin: 0 10px;">
                    🚗 Retour aux véhicules
                </button>
                ${statusData.can_resume_control ? `
                <button onclick="resumeControlAndSync()" style="
                    padding: 12px 24px; background: #3b82f6; color: white; border: none; 
                    border-radius: 8px; cursor: pointer; margin: 0 10px;">
                    🔄 Reprendre le contrôle
                </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Fonction pour afficher un message de succès
function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Afficher une erreur
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorState').style.display = 'block';
    setTimeout(() => {
        document.getElementById('errorState').style.display = 'none';
    }, 5000);
}

// Initialisation
async function init() {
    try {
        const userLoaded = await fetchCurrentUser();
        if (!userLoaded) {
            showError('Impossible de charger les informations utilisateur');
            return;
        }

        const missionLoaded = await fetchActiveMission();
        if (!missionLoaded) {
            showError('Aucune mission active trouvée. Retournez à la page véhicules pour démarrer une mission.');
            return;
        }

        await fetchAvailableDrivers();
        await displayMissionInfo();
        populateDriversList();

        // Ajouter l'événement de soumission du formulaire
        document.getElementById('transferForm').addEventListener('submit', transferVehicle);

        // Masquer le loading et afficher le contenu
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';

    } catch (error) {
        console.error('Erreur initialisation:', error);
        showError('Erreur lors du chargement de la page');
    }
}

// Démarrer l'initialisation
document.addEventListener('DOMContentLoaded', init);