 // Gestion du formulaire de réservation
        document.getElementById("form-reservation").addEventListener("submit", function (e) {
            e.preventDefault();
            
            const nom = document.getElementById("nom").value;
            const date = document.getElementById("date").value;
            const heure = document.getElementById("heure").value;
            const vehicule = document.getElementById("vehicule");
            const vehiculeText = vehicule.options[vehicule.selectedIndex].text;
            const vehiculeStatus = vehicule.options[vehicule.selectedIndex].dataset.status;

            // Vérification de la disponibilité du véhicule
            if (vehiculeStatus === 'busy') {
                showToast('❌ Ce véhicule est actuellement occupé', 'error');
                return;
            }
            
            if (vehiculeStatus === 'maintenance') {
                showToast('⚠️ Ce véhicule est en maintenance', 'error');
                return;
            }

            // Génération d'un ID unique pour la réservation
            const reservationId = generateReservationId();
            
            // Affichage de la confirmation
            const confirmation = document.getElementById("confirmation");
            confirmation.innerHTML = `
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 2rem; border-radius: 15px; text-align: center;">
                    <h3 style="margin-bottom: 1rem;">✅ Réservation Confirmée !</h3>
                    <p><strong>ID de réservation :</strong> ${reservationId}</p>
                    <p><strong>Conducteur :</strong> ${nom}</p>
                    <p><strong>Véhicule :</strong> ${vehiculeText.replace(' (Disponible)', '')}</p>
                    <p><strong>Date :</strong> ${formatDate(date)}</p>
                    <p><strong>Heure :</strong> ${heure}</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.9;">
                        💡 Notez bien votre ID de réservation pour toute modification future
                    </p>
                </div>
            `;
            confirmation.style.display = 'block';
            
            // Toast de confirmation
            showToast('🎉 Réservation enregistrée avec succès !');
            
            // Reset du formulaire
            this.reset();
            
            // Scroll vers la confirmation
            confirmation.scrollIntoView({ behavior: 'smooth' });
        });

        function modifierReservation() {
            const id = document.getElementById("reservation-id").value.trim();
            if (id) {
                showToast(`🛠️ Redirection vers la modification de ${id}...`);
                // Ici vous pourriez rediriger vers une page de modification
                setTimeout(() => {
                    alert(`Fonctionnalité de modification pour ${id} à implémenter`);
                }, 1500);
            } else {
                showToast("⚠️ Veuillez entrer un ID de réservation", 'error');
            }
        }

        function annulerReservation() {
            const id = document.getElementById("reservation-id").value.trim();
            if (id) {
                if (confirm(`Êtes-vous sûr de vouloir annuler la réservation ${id} ?`)) {
                    showToast(`❌ Réservation ${id} annulée avec succès`);
                    document.getElementById("reservation-id").value = '';
                }
            } else {
                showToast("⚠️ Veuillez entrer un ID de réservation", 'error');
            }
        }

        function rechercherReservation() {
            const search = document.getElementById("search-reservation").value.trim();
            if (search) {
                showToast(`🔍 Recherche de "${search}" en cours...`);
                // Simulation d'une recherche
                setTimeout(() => {
                    alert(`Résultats de recherche pour "${search}" à implémenter`);
                }, 1500);
            } else {
                showToast("⚠️ Veuillez entrer un terme de recherche", 'error');
            }
        }

        function generateReservationId() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `RES-${year}${month}${day}-${random}`;
        }

        function formatDate(dateString) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        }

        function showToast(message, type = 'success') {
            // Supprimer les anciens toasts
            const existingToasts = document.querySelectorAll('.toast');
            existingToasts.forEach(toast => toast.remove());

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);

            // Animation d'entrée
            setTimeout(() => toast.classList.add('show'), 100);

            // Suppression automatique après 4 secondes
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        // Définir la date minimale à aujourd'hui
        document.addEventListener('DOMContentLoaded', function() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date').setAttribute('min', today);
        });

        // Animation d'apparition des cartes
        window.addEventListener('scroll', () => {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                const cardTop = card.getBoundingClientRect().top;
                const cardVisible = 150;
                
                if (cardTop < window.innerHeight - cardVisible) {
                    card.style.transform = 'translateY(0)';
                    card.style.opacity = '1';
                }
            });
        });