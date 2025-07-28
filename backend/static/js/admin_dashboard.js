 // Navigation entre sections
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

        // Gestion des modals
        function showModal(modalId) {
            document.getElementById(modalId).style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // Fermer modal en cliquant à côté
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }

        // Gestion des invitations
        function sendInvitation(event) {
            event.preventDefault();
            const email = document.getElementById('inviteEmail').value;
            const messageDiv = document.getElementById('inviteMessage');
            
            if (email) {
                // Simulation d'envoi d'invitation
                messageDiv.className = 'success';
                messageDiv.textContent = `✅ Invitation envoyée avec succès à ${email}`;
                document.getElementById('inviteEmail').value = '';
                
                setTimeout(() => {
                    messageDiv.textContent = '';
                    messageDiv.className = '';
                }, 5000);
            } else {
                messageDiv.className = 'error';
                messageDiv.textContent = '❌ Veuillez saisir une adresse email valide';
            }
        }

        // Filtrage des réservations
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

        // Gestion des formulaires
        document.getElementById('vehicleForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulation d'ajout de véhicule
            const brand = document.getElementById('vehicleBrand').value;
            const model = document.getElementById('vehicleModel').value;
            
            alert(`✅ Véhicule ${brand} ${model} ajouté avec succès !`);
            closeModal('addVehicleModal');
            
            // Reset form
            this.reset();
        });

        document.getElementById('userForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulation d'ajout d'utilisateur
            const name = document.getElementById('userName').value;
            const email = document.getElementById('userEmail').value;
            
            alert(`✅ Utilisateur ${name} (${email}) ajouté avec succès !`);
            closeModal('addUserModal');
            
            // Reset form
            this.reset();
        });

        // Animations au chargement
        document.addEventListener('DOMContentLoaded', function() {
            // Animation progressive des stat cards
            const statCards = document.querySelectorAll('.stat-card');
            statCards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.animation = `slideInUp 0.6s ease-out ${index * 0.1}s both`;
                }, 500);
            });
        });

        // Effet de survol avancé pour les boutons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px) scale(1.05)';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Mise à jour en temps réel des statistiques (simulation)
        function updateStats() {
            const stats = [
                { id: 'totalReservations', min: 10, max: 50 },
                { id: 'totalVehicles', min: 5, max: 20 },
                { id: 'totalUsers', min: 20, max: 100 },
                { id: 'pendingReservations', min: 0, max: 10 }
            ];
            
            stats.forEach(stat => {
                const element = document.getElementById(stat.id);
                const currentValue = parseInt(element.textContent);
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, ou 1
                const newValue = Math.max(stat.min, Math.min(stat.max, currentValue + change));
                
                if (newValue !== currentValue) {
                    element.style.transform = 'scale(1.1)';
                    element.textContent = newValue;
                    
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                    }, 200);
                }
            });
        }

        // Mise à jour des stats toutes les 30 secondes (pour la démo)
        setInterval(updateStats, 30000);

        // Ajout d'effets visuels sur les interactions
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn')) {
                // Effet ripple
                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.3);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;
                
                const rect = e.target.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                
                e.target.style.position = 'relative';
                e.target.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            }
        });

        // Ajout de l'animation ripple en CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);





          // Fonctions existantes (à garder depuis votre fichier JS original)
        function showSection(sectionName) {
            const sections = document.querySelectorAll('.content-section');
            const tabs = document.querySelectorAll('.nav-tab');
            
            sections.forEach(section => section.classList.remove('active'));
            tabs.forEach(tab => tab.classList.remove('active'));
            
            document.getElementById(sectionName).classList.add('active');
            event.target.classList.add('active');
        }

        function showModal(modalId) {
            document.getElementById(modalId).style.display = 'block';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        function sendInvitation(event) {
            event.preventDefault();
            const email = document.getElementById('inviteEmail').value;
            const messageDiv = document.getElementById('inviteMessage');
            messageDiv.innerHTML = `<div style="color: #48bb78; margin-top: 10px;">✅ Invitation envoyée à ${email}</div>`;
            document.getElementById('inviteEmail').value = '';
        }

        function filterReservations() {
            // Logique de filtrage des réservations
            console.log('Filtrage des réservations...');
        }

        // Fonction utilitaire pour afficher le statut d'export
        function showExportStatus(statusElementId, message, isSuccess = true) {
            const statusElement = document.getElementById(statusElementId);
            statusElement.className = `export-status ${isSuccess ? 'success' : 'error'}`;
            statusElement.textContent = message;
            statusElement.style.display = 'block';
            
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }

        // Fonction utilitaire pour télécharger un fichier CSV
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

        // Fonction utilitaire pour extraire le texte d'une cellule (sans HTML)
        function getCleanText(element) {
            return element.textContent.trim().replace(/\s+/g, ' ');
        }

        // Export Dashboard CSV
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

        // Export Dashboard PDF
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

        // Export Réservations CSV
        function exportReservationsCSV() {
            const table = document.getElementById('reservationsTable');
            const rows = table.querySelectorAll('tbody tr');
            
            const data = [['ID', 'Utilisateur', 'Email', 'Véhicule', 'Plaque', 'Date début', 'Date fin', 'Statut']];
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const userCell = cells[1].textContent.split('\n');
                const vehicleCell = cells[2].textContent.split('\n');
                
                data.push([
                    getCleanText(cells[0]),
                    userCell[0].trim(),
                    userCell[1] ? userCell[1].trim() : '',
                    vehicleCell[0].trim(),
                    vehicleCell[1] ? vehicleCell[1].trim() : '',
                    getCleanText(cells[3]),
                    getCleanText(cells[4]),
                    getCleanText(cells[5])
                ]);
            });

            const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            const filename = `reservations_drivego_${new Date().toISOString().split('T')[0]}.csv`;
            
            downloadCSV(filename, csvContent);
            showExportStatus('reservationsExportStatus', 'Réservations exportées en CSV avec succès !');
        }

        // Export Réservations PDF
        function exportReservationsPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l'); // Paysage pour plus d'espace

            doc.setFontSize(18);
            doc.text('DriveGo - Liste des Réservations', 20, 20);
            
            doc.setFontSize(10);
            const date = new Date().toLocaleDateString('fr-FR');
            doc.text(`Généré le : ${date}`, 20, 30);

            const table = document.getElementById('reservationsTable');
            const rows = table.querySelectorAll('tbody tr');
            
            const tableData = [];
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const userCell = cells[1].textContent.split('\n');
                const vehicleCell = cells[2].textContent.split('\n');
                
                tableData.push([
                    getCleanText(cells[0]),
                    userCell[0].trim(),
                    userCell[1] ? userCell[1].trim() : '',
                    vehicleCell[0].trim(),
                    vehicleCell[1] ? vehicleCell[1].trim() : '',
                    getCleanText(cells[3]),
                    getCleanText(cells[4]),
                    getCleanText(cells[5])
                ]);
            });

            doc.autoTable({
                head: [['ID', 'Utilisateur', 'Email', 'Véhicule', 'Plaque', 'Début', 'Fin', 'Statut']],
                body: tableData,
                startY: 40,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [102, 126, 234] },
                columnStyles: {
                    2: { cellWidth: 40 },
                    3: { cellWidth: 30 },
                    4: { cellWidth: 25 }
                }
            });

            doc.save(`reservations_drivego_${new Date().toISOString().split('T')[0]}.pdf`);
            showExportStatus('reservationsExportStatus', 'Réservations exportées en PDF avec succès !');
        }

        // Export Véhicules CSV
        function exportVehiclesCSV() {
            const table = document.getElementById('vehiclesTable');
            const rows = table.querySelectorAll('tbody tr');
            
            const data = [['ID', 'Marque', 'Modèle', 'Immatriculation', 'Kilométrage', 'Contrôle technique', 'Statut']];
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                data.push([
                    getCleanText(cells[0]),
                    getCleanText(cells[1]),
                    getCleanText(cells[2]),
                    getCleanText(cells[3]),
                    getCleanText(cells[4]),
                    getCleanText(cells[5]),
                    getCleanText(cells[6])
                ]);
            });

            const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            const filename = `vehicules_drivego_${new Date().toISOString().split('T')[0]}.csv`;
            
            downloadCSV(filename, csvContent);
            showExportStatus('vehiclesExportStatus', 'Véhicules exportés en CSV avec succès !');
        }

        // Export Véhicules PDF
        function exportVehiclesPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l'); // Paysage pour plus d'espace

            doc.setFontSize(18);
            doc.text('DriveGo - Liste des Véhicules', 20, 20);
            
            doc.setFontSize(10);
            const date = new Date().toLocaleDateString('fr-FR');
            doc.text(`Généré le : ${date}`, 20, 30);

            const table = document.getElementById('vehiclesTable');
            const rows = table.querySelectorAll('tbody tr');
            
            const tableData = [];
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                tableData.push([
                    getCleanText(cells[0]),
                    getCleanText(cells[1]),
                    getCleanText(cells[2]),
                    getCleanText(cells[3]),
                    getCleanText(cells[4]),
                    getCleanText(cells[5]),
                    getCleanText(cells[6])
                ]);
            });

            doc.autoTable({
                head: [['ID', 'Marque', 'Modèle', 'Immatriculation', 'Kilométrage', 'Contrôle technique', 'Statut']],
                body: tableData,
                startY: 40,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [102, 126, 234] },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 35 },
                    6: { cellWidth: 25 }
                }
            });

            doc.save(`vehicules_drivego_${new Date().toISOString().split('T')[0]}.pdf`);
            showExportStatus('vehiclesExportStatus', 'Véhicules exportés en PDF avec succès !');
        }

        // Export Utilisateurs CSV
        function exportUsersCSV() {
            const table = document.getElementById('usersTable');
            const rows = table.querySelectorAll('tbody tr');
            
            const data = [['ID', 'Nom', 'Email', 'Téléphone', 'Statut', 'Date inscription']];
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                data.push([
                    getCleanText(cells[0]),
                    getCleanText(cells[1]),
                    getCleanText(cells[2]),
                    getCleanText(cells[3]),
                    getCleanText(cells[4]),
                    getCleanText(cells[5])
                ]);
            });

            const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            const filename = `utilisateurs_drivego_${new Date().toISOString().split('T')[0]}.csv`;
            
            downloadCSV(filename, csvContent);
            showExportStatus('usersExportStatus', 'Utilisateurs exportés en CSV avec succès !');
        }

        // Export Utilisateurs PDF
        function exportUsersPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l'); // Paysage pour plus d'espace

            doc.setFontSize(18);
            doc.text('DriveGo - Liste des Utilisateurs', 20, 20);
            
            doc.setFontSize(10);
            const date = new Date().toLocaleDateString('fr-FR');
            doc.text(`Généré le : ${date}`, 20, 30);

            const table = document.getElementById('usersTable');
            const rows = table.querySelectorAll('tbody tr');
            
            const tableData = [];
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                tableData.push([
                    getCleanText(cells[0]),
                    getCleanText(cells[1]),
                    getCleanText(cells[2]),
                    getCleanText(cells[3]),
                    getCleanText(cells[4]),
                    getCleanText(cells[5])
                ]);
            });

            doc.autoTable({
                head: [['ID', 'Nom', 'Email', 'Téléphone', 'Statut', 'Date inscription']],
                body: tableData,
                startY: 40,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [102, 126, 234] },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 60 },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 35 }
                }
            });

            doc.save(`utilisateurs_drivego_${new Date().toISOString().split('T')[0]}.pdf`);
            showExportStatus('usersExportStatus', 'Utilisateurs exportés en PDF avec succès !');
        }

        // Export complet de toutes les données en PDF
        function exportAllDataPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Page de couverture
            doc.setFontSize(24);
            doc.text('DriveGo', 105, 50, { align: 'center' });
            doc.setFontSize(18);
            doc.text('Rapport Complet', 105, 70, { align: 'center' });
            
            doc.setFontSize(12);
            const date = new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            doc.text(`Généré le ${date}`, 105, 90, { align: 'center' });

            // Statistiques du dashboard
            doc.addPage();
            doc.setFontSize(16);
            doc.text('📊 Statistiques Générales', 20, 30);

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
                startY: 40,
                styles: { fontSize: 12 },
                headStyles: { fillColor: [102, 126, 234] }
            });

            // Sauvegarde
            doc.save(`rapport_complet_drivego_${new Date().toISOString().split('T')[0]}.pdf`);
            
            // Afficher message de succès sur tous les éléments de statut
            ['dashboardExportStatus', 'reservationsExportStatus', 'vehiclesExportStatus', 'usersExportStatus'].forEach(statusId => {
                showExportStatus(statusId, 'Rapport complet exporté en PDF avec succès !');
            });
        }

        // Fermer les modals en cliquant en dehors
        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Gestion des formulaires
        document.getElementById('vehicleForm').addEventListener('submit', function(e) {
            e.preventDefault();
            // Logique d'ajout de véhicule
            closeModal('addVehicleModal');
            alert('Véhicule ajouté avec succès !');
        });

        document.getElementById('userForm').addEventListener('submit', function(e) {
            e.preventDefault();
            // Logique d'ajout d'utilisateur
            closeModal('addUserModal');
            alert('Utilisateur ajouté avec succès !');
        });