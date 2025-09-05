// ====== NAVIGATION ENTRE SECTIONS ======
function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Désactiver tous les onglets
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Afficher la section sélectionnée
    document.getElementById(sectionId).classList.add('active');
    
    // Activer l'onglet correspondant
    event.target.classList.add('active');
}

// ====== GESTION DES MODALS ======
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// ====== NOTIFICATIONS ======
function showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.admin-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 10000;
        font-weight: 500;
        transition: all 0.3s ease;
        ${type === 'success' ? 
            'background: rgba(16, 185, 129, 0.9); color: white; border-color: rgba(16, 185, 129, 0.3);' :
            'background: rgba(239, 68, 68, 0.9); color: white; border-color: rgba(239, 68, 68, 0.3);'}
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ====== GESTION DES INVITATIONS ======
function sendInvitation(event) {
    event.preventDefault();
    const email = document.getElementById('inviteEmail').value;
    const messageDiv = document.getElementById('inviteMessage');
    
    if (!email) {
        messageDiv.className = 'error';
        messageDiv.textContent = '❌ Veuillez saisir une adresse email valide';
        return;
    }

    // Simulation d'envoi (remplacez par votre appel API)
    fetch('/admin/send-invitation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageDiv.className = 'success';
            messageDiv.textContent = `✅ Invitation envoyée avec succès à ${email}`;
            document.getElementById('inviteEmail').value = '';
            showNotification(`Invitation envoyée à ${email}`);
        } else {
            throw new Error(data.message || 'Erreur lors de l\'envoi');
        }
    })
    .catch(error => {
        messageDiv.className = 'error';
        messageDiv.textContent = '❌ Erreur lors de l\'envoi de l\'invitation';
        showNotification('Erreur lors de l\'envoi de l\'invitation', 'error');
    });

    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 5000);
}

// ====== GESTION DES RÉSERVATIONS ======
function confirmReservation(reservationId) {
    if (confirm('Confirmer cette réservation ?')) {
        fetch(`/admin/reservations/${reservationId}/confirm`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Réservation confirmée avec succès');
                location.reload(); // Recharger pour voir les changements
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showNotification('Erreur lors de la confirmation', 'error');
        });
    }
}

function cancelReservation(reservationId) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
        fetch(`/admin/reservations/${reservationId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Réservation annulée');
                location.reload();
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showNotification('Erreur lors de l\'annulation', 'error');
        });
    }
}

function editReservation(reservationId) {
    // Récupérer les données de la réservation
    fetch(`/admin/reservations/${reservationId}`)
    .then(response => response.json())
    .then(reservation => {
        createEditReservationModal(reservation);
    })
    .catch(error => {
        showNotification('Erreur lors du chargement', 'error');
    });
}

function createEditReservationModal(reservation) {
    // Supprimer le modal s'il existe déjà
    const existingModal = document.getElementById('editReservationModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editReservationModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeEditModal()">&times;</span>
            <h2 style="color: #f8fafc; margin-bottom: 25px; font-size: 1.8rem;">✏️ Modifier la réservation #${reservation.id}</h2>
            <form id="editReservationForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editStartDate">Date de début</label>
                        <input type="date" id="editStartDate" value="${reservation.start_date || reservation.startDate}" required>
                    </div>
                    <div class="form-group">
                        <label for="editEndDate">Date de fin</label>
                        <input type="date" id="editEndDate" value="${reservation.end_date || reservation.endDate}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="editReservationStatus">Statut</label>
                    <select id="editReservationStatus" required>
                        <option value="pending" ${reservation.status === 'pending' ? 'selected' : ''}>En attente</option>
                        <option value="confirmed" ${reservation.status === 'confirmed' ? 'selected' : ''}>Confirmée</option>
                        <option value="cancelled" ${reservation.status === 'cancelled' ? 'selected' : ''}>Annulée</option>
                        <option value="completed" ${reservation.status === 'completed' ? 'selected' : ''}>Terminée</option>
                    </select>
                </div>
                <div style="text-align: right; margin-top: 30px;">
                    <button type="button" class="btn btn-danger" onclick="closeEditModal()">Annuler</button>
                    <button type="submit" class="btn btn-success">💾 Sauvegarder</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gestionnaire du formulaire
    document.getElementById('editReservationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const updatedData = {
            start_date: document.getElementById('editStartDate').value,
            end_date: document.getElementById('editEndDate').value,
            status: document.getElementById('editReservationStatus').value
        };
        
        fetch(`/admin/reservations/${reservation.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Réservation modifiée avec succès');
                closeEditModal();
                location.reload();
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showNotification('Erreur lors de la modification', 'error');
        });
    });
}

function closeEditModal() {
    const modal = document.getElementById('editReservationModal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = 'auto';
}

// ====== GESTION DES VÉHICULES ======
let currentVehicleId = null; // Variable pour l'édition

function editVehicle(vehicleId) {
    currentVehicleId = vehicleId;
    
    // Récupérer les données du véhicule
    fetch(`/admin/vehicles/${vehicleId}`)
    .then(response => response.json())
    .then(vehicle => {
        // Pré-remplir le formulaire
        document.getElementById('vehicleBrand').value = vehicle.brand || vehicle.marque;
        document.getElementById('vehicleModel').value = vehicle.model || vehicle.modele;
        document.getElementById('vehicleYear').value = vehicle.year || vehicle.annee;
        document.getElementById('vehiclePlate').value = vehicle.plate || vehicle.immatriculation;
        document.getElementById('vehicleKm').value = vehicle.km || vehicle.kilometrage;
        document.getElementById('vehicleControl').value = vehicle.control_date || vehicle.controle_technique;
        document.getElementById('vehicleStatus').value = vehicle.status || vehicle.statut;
        
        // Changer le titre du modal
        document.querySelector('#addVehicleModal h2').textContent = '✏️ Modifier le véhicule';
        
        showModal('addVehicleModal');
    })
    .catch(error => {
        showNotification('Erreur lors du chargement du véhicule', 'error');
    });
}

function deleteVehicle(vehicleId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
        fetch(`/admin/vehicles/${vehicleId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Véhicule supprimé avec succès');
                location.reload();
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showNotification('Erreur lors de la suppression', 'error');
        });
    }
}

// ====== GESTION DES UTILISATEURS ======
let currentUserId = null; // Variable pour l'édition

function editUser(userId) {
    currentUserId = userId;
    
    // Récupérer les données de l'utilisateur
    fetch(`/admin/users/${userId}`)
    .then(response => response.json())
    .then(user => {
        // Pré-remplir le formulaire
        document.getElementById('userName').value = user.name || user.nom;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone || user.telephone;
        document.getElementById('userStatus').value = user.status || user.statut;
        
        // Changer le titre du modal
        document.querySelector('#addUserModal h2').textContent = '✏️ Modifier l\'utilisateur';
        
        showModal('addUserModal');
    })
    .catch(error => {
        showNotification('Erreur lors du chargement de l\'utilisateur', 'error');
    });
}

function suspendUser(userId) {
    if (confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur ?')) {
        fetch(`/admin/users/${userId}/suspend`, {
            method: 'PUT'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Utilisateur suspendu');
                location.reload();
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showNotification('Erreur lors de la suspension', 'error');
        });
    }
}

function activateUser(userId) {
    fetch(`/admin/users/${userId}/activate`, {
        method: 'PUT'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Utilisateur réactivé');
            location.reload();
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        showNotification('Erreur lors de la réactivation', 'error');
    });
}

// ====== GESTION DES FORMULAIRES ======
document.addEventListener('DOMContentLoaded', function() {
    // Formulaire véhicules
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const vehicleData = {
                brand: document.getElementById('vehicleBrand').value,
                model: document.getElementById('vehicleModel').value,
                year: document.getElementById('vehicleYear').value,
                plate: document.getElementById('vehiclePlate').value,
                km: document.getElementById('vehicleKm').value,
                control_date: document.getElementById('vehicleControl').value,
                status: document.getElementById('vehicleStatus').value
            };
            
            const url = currentVehicleId ? 
                `/admin/vehicles/${currentVehicleId}` : 
                '/admin/vehicles';
            const method = currentVehicleId ? 'PUT' : 'POST';
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(vehicleData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const message = currentVehicleId ? 'Véhicule modifié avec succès' : 'Véhicule ajouté avec succès';
                    showNotification(message);
                    closeModal('addVehicleModal');
                    
                    // Réinitialiser
                    currentVehicleId = null;
                    document.querySelector('#addVehicleModal h2').textContent = '🚗 Ajouter un véhicule';
                    
                    location.reload();
                } else {
                    throw new Error(data.message);
                }
            })
            .catch(error => {
                showNotification('Erreur lors de l\'opération', 'error');
            });
        });
    }
    
    // Formulaire utilisateurs
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userData = {
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value,
                status: document.getElementById('userStatus').value
            };
            
            const url = currentUserId ? 
                `/admin/users/${currentUserId}` : 
                '/admin/users';
            const method = currentUserId ? 'PUT' : 'POST';
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const message = currentUserId ? 'Utilisateur modifié avec succès' : 'Utilisateur ajouté avec succès';
                    showNotification(message);
                    closeModal('addUserModal');
                    
                    // Réinitialiser
                    currentUserId = null;
                    document.querySelector('#addUserModal h2').textContent = '👥 Ajouter un utilisateur';
                    
                    location.reload();
                } else {
                    throw new Error(data.message);
                }
            })
            .catch(error => {
                showNotification('Erreur lors de l\'opération', 'error');
            });
        });
    }
});

// ====== FONCTIONS DE FILTRAGE ======
function filterReservations() {
    const searchValue = document.getElementById('searchReservation').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const rows = document.querySelectorAll('#reservationsTableBody tr');
    
    rows.forEach(row => {
        const userName = row.cells[1].textContent.toLowerCase();
        const status = row.querySelector('.status').textContent.toLowerCase();
        
        const matchesSearch = userName.includes(searchValue);
        const matchesStatus = !statusFilter || status.includes(statusFilter);
        
        if (matchesSearch && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ====== FERMETURE DES MODALS ======
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        const modalId = event.target.id;
        if (modalId === 'editReservationModal') {
            closeEditModal();
        } else {
            closeModal(modalId);
            
            // Réinitialiser les variables d'édition
            if (modalId === 'addVehicleModal') {
                currentVehicleId = null;
                document.querySelector('#addVehicleModal h2').textContent = '🚗 Ajouter un véhicule';
            } else if (modalId === 'addUserModal') {
                currentUserId = null;
                document.querySelector('#addUserModal h2').textContent = '👥 Ajouter un utilisateur';
            }
        }
    }
}

// ====== FONCTIONS D'EXPORT (VOTRE CODE EXISTANT) ======
function showExportStatus(statusElementId, message, isSuccess = true) {
    const statusElement = document.getElementById(statusElementId);
    if (statusElement) {
        statusElement.className = `export-status ${isSuccess ? 'success' : 'error'}`;
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
}

function downloadCSV(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getCleanText(element) {
    return element.textContent.trim().replace(/\s+/g, ' ');
}

// Export functions (votre code existant pour les exports CSV/PDF)
function exportDashboardCSV() {
    const data = [
        ['Métrique', 'Valeur'],
        ['Réservations totales', document.getElementById('totalReservations').textContent],
        ['Véhicules disponibles', document.getElementById('totalVehicles').textContent],
        ['Utilisateurs actifs', document.getElementById('totalUsers').textContent],
        ['Réservations en attente', document.getElementById('pendingReservations').textContent]
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const filename = `dashboard_drivego_${new Date().toISOString().split('T')[0]}.csv`;
    
    downloadCSV(filename, csvContent);
    showExportStatus('dashboardExportStatus', 'Dashboard exporté en CSV avec succès !');
}

function exportDashboardPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('DriveGo - Tableau de Bord', 20, 30);
    
    doc.setFontSize(12);
    const date = new Date().toLocaleDateString('fr-FR');
    doc.text(`Généré le : ${date}`, 20, 45);

    const dashboardData = [
        ['Métrique', 'Valeur'],
        ['Réservations totales', document.getElementById('totalReservations').textContent],
        ['Véhicules disponibles', document.getElementById('totalVehicles').textContent],
        ['Utilisateurs actifs', document.getElementById('totalUsers').textContent],
        ['Réservations en attente', document.getElementById('pendingReservations').textContent]
    ];

    doc.autoTable({
        head: [dashboardData[0]],
        body: dashboardData.slice(1),
        startY: 60,
        styles: { fontSize: 12 },
        headStyles: { fillColor: [102, 126, 234] }
    });

    doc.save(`dashboard_drivego_${new Date().toISOString().split('T')[0]}.pdf`);
    showExportStatus('dashboardExportStatus', 'Dashboard exporté en PDF avec succès !');
}

// Ajoutez ici vos autres fonctions d'export existantes...

// ====== INITIALISATION ======
document.addEventListener('DOMContentLoaded', function() {
    // Animation progressive des éléments au chargement
    setTimeout(() => {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = `slideInUp 0.6s ease-out both`;
            }, index * 100);
        });
    }, 500);
});