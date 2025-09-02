 // ========================================
        // PLANNING VEHICULE - VERSION DYNAMIQUE
        // ========================================

        let currentView = 'week';
        let currentDate = new Date();
        let reservations = [
            {
                id: 1,
                title: "🚌 Transport personnel",
                start: new Date("2025-09-03T09:00:00"),
                end: new Date("2025-09-03T12:00:00"),
                type: "transport-personnel",
                notes: "Transport équipe vers chantier Nord"
            },
            {
                id: 2,
                title: "📦 Livraison",
                start: new Date("2025-09-04T14:00:00"),
                end: new Date("2025-09-04T16:00:00"),
                type: "livraison",
                notes: "Livraison matériel bureau"
            },
            {
                id: 3,
                title: "🔧 Maintenance",
                start: new Date("2025-09-05T08:00:00"),
                end: new Date("2025-09-05T10:00:00"),
                type: "maintenance",
                notes: "Révision trimestrielle"
            },
            {
                id: 4,
                title: "🎓 Formation conduite",
                start: new Date("2025-09-06T10:00:00"),
                end: new Date("2025-09-06T15:00:00"),
                type: "formation",
                notes: "Formation nouveaux conducteurs"
            },
            {
                id: 5,
                title: "🚌 Transport délégation",
                start: new Date("2025-09-09T14:00:00"),
                end: new Date("2025-09-09T17:00:00"),
                type: "transport-personnel",
                notes: "Visite partenaires"
            }
        ];

        // Initialisation au chargement de la page
        document.addEventListener('DOMContentLoaded', function() {
            console.log("🌐 Initializing dynamic planning system...");
            initializeCalendar();
        });

        function initializeCalendar() {
            console.log("📅 Building dynamic calendar...");
            renderCalendar();
            updateCurrentPeriodDisplay();
        }

        function renderCalendar() {
            const calendarEl = document.getElementById('calendar');
            calendarEl.innerHTML = '';

            if (currentView === 'week') {
                renderWeekView(calendarEl);
            } else if (currentView === 'day') {
                renderDayView(calendarEl);
            } else if (currentView === 'month') {
                renderMonthView(calendarEl);
            }
        }

        function renderWeekView(container) {
            const grid = document.createElement('div');
            grid.className = 'calendar-grid week-view';

            // Obtenir le début de la semaine
            const startOfWeek = getStartOfWeek(currentDate);
            const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            
            // En-tête vide pour la colonne des heures
            const emptyHeader = document.createElement('div');
            emptyHeader.className = 'calendar-header';
            grid.appendChild(emptyHeader);

            // En-têtes des jours
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                
                const header = document.createElement('div');
                header.className = 'calendar-header';
                header.innerHTML = `
                    <div>${days[i]}</div>
                    <div style="font-size: 0.9rem; font-weight: normal;">${date.getDate()}/${date.getMonth() + 1}</div>
                `;
                grid.appendChild(header);
            }

            // Créneaux horaires (8h-18h)
            for (let hour = 8; hour < 18; hour++) {
                // Colonne des heures
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = `${hour}:00`;
                grid.appendChild(timeSlot);

                // Cellules pour chaque jour
                for (let day = 0; day < 7; day++) {
                    const cellDate = new Date(startOfWeek);
                    cellDate.setDate(startOfWeek.getDate() + day);
                    cellDate.setHours(hour, 0, 0, 0);

                    const cell = document.createElement('div');
                    cell.className = 'calendar-cell';
                    cell.dataset.datetime = cellDate.toISOString();

                    // Marquer les cellules passées
                    const now = new Date();
                    if (cellDate < now) {
                        cell.classList.add('past');
                    }

                    // Marquer aujourd'hui
                    const today = new Date();
                    if (cellDate.toDateString() === today.toDateString()) {
                        cell.classList.add('today');
                    }

                    // Ajouter gestionnaire de clic
                    if (!cell.classList.contains('past')) {
                        cell.addEventListener('click', () => openReservationModal(cellDate.toISOString().split('T')[0], hour));
                    }

                    // Ajouter les événements qui correspondent à cette cellule
                    const events = getEventsForDateTime(cellDate);
                    events.forEach(event => {
                        const eventEl = createEventElement(event);
                        cell.appendChild(eventEl);
                    });

                    grid.appendChild(cell);
                }
            }

            container.appendChild(grid);
        }

        function renderDayView(container) {
            const grid = document.createElement('div');
            grid.className = 'calendar-grid day-view';

            const dayName = currentDate.toLocaleDateString('fr-FR', { weekday: 'long' });
            const dayDate = currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

            // En-tête vide + en-tête du jour
            const emptyHeader = document.createElement('div');
            emptyHeader.className = 'calendar-header';
            grid.appendChild(emptyHeader);

            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header';
            dayHeader.innerHTML = `<div>${dayName}</div><div style="font-size: 0.9rem; font-weight: normal;">${dayDate}</div>`;
            grid.appendChild(dayHeader);

            // Créneaux horaires
            for (let hour = 8; hour < 18; hour++) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = `${hour}:00`;
                grid.appendChild(timeSlot);

                const cellDate = new Date(currentDate);
                cellDate.setHours(hour, 0, 0, 0);

                const cell = document.createElement('div');
                cell.className = 'calendar-cell';
                cell.dataset.datetime = cellDate.toISOString();

                const now = new Date();
                if (cellDate < now) {
                    cell.classList.add('past');
                }

                if (cellDate.toDateString() === now.toDateString()) {
                    cell.classList.add('today');
                }

                if (!cell.classList.contains('past')) {
                    cell.addEventListener('click', () => openReservationModal(cellDate.toISOString().split('T')[0], hour));
                }

                const events = getEventsForDateTime(cellDate);
                events.forEach(event => {
                    const eventEl = createEventElement(event);
                    cell.appendChild(eventEl);
                });

                grid.appendChild(cell);
            }

            container.appendChild(grid);
        }

        function renderMonthView(container) {
            const monthDiv = document.createElement('div');
            monthDiv.style.cssText = 'display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; background: #e5e7eb; border-radius: 10px; overflow: hidden;';

            const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            
            // En-têtes des jours
            days.forEach(day => {
                const header = document.createElement('div');
                header.className = 'calendar-header';
                header.textContent = day;
                monthDiv.appendChild(header);
            });

            // Obtenir le premier jour du mois et ajuster pour commencer lundi
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const startDate = new Date(firstDay);
            const dayOfWeek = (firstDay.getDay() + 6) % 7; // Convertir dimanche=0 en lundi=0
            startDate.setDate(firstDay.getDate() - dayOfWeek);

            // Générer 42 jours (6 semaines)
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);

                const cell = document.createElement('div');
                cell.style.cssText = `
                    background: white; 
                    min-height: 80px; 
                    padding: 8px; 
                    position: relative;
                    cursor: pointer;
                    transition: background 0.2s ease;
                `;

                // Griser les jours du mois précédent/suivant
                if (date.getMonth() !== currentDate.getMonth()) {
                    cell.style.background = '#f9fafb';
                    cell.style.color = '#9ca3af';
                }

                // Marquer aujourd'hui
                const today = new Date();
                if (date.toDateString() === today.toDateString()) {
                    cell.style.background = '#fef3c7';
                }

                cell.innerHTML = `<div style="font-weight: 600; margin-bottom: 5px;">${date.getDate()}</div>`;

                // Ajouter les événements du jour
                const dayEvents = getEventsForDate(date);
                dayEvents.forEach(event => {
                    const eventEl = document.createElement('div');
                    eventEl.style.cssText = `
                        background: ${getEventColor(event.type)};
                        color: white;
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-size: 0.7rem;
                        margin-bottom: 2px;
                        cursor: pointer;
                        display: block;
                        overflow: hidden;
                    `;
                    eventEl.innerHTML = `
                        <div style="font-weight: 600;">${event.title}</div>
                        <div style="opacity: 0.8;">👤 ${event.conducteur}</div>
                    `;
                    eventEl.onclick = (e) => {
                        e.stopPropagation();
                        showEventDetails(event);
                    };
                    cell.appendChild(eventEl);
                });

                cell.addEventListener('click', () => {
                    if (date >= today && date.getMonth() === currentDate.getMonth()) {
                        openReservationModal(date.toISOString().split('T')[0]);
                    }
                });

                monthDiv.appendChild(cell);
            }

            container.appendChild(monthDiv);
        }

        function getEventsForDateTime(datetime) {
            return reservations.filter(event => {
                const eventHour = event.start.getHours();
                const cellHour = datetime.getHours();
                return event.start.toDateString() === datetime.toDateString() && 
                       eventHour <= cellHour && 
                       event.end.getHours() > cellHour;
            });
        }

        function getEventsForDate(date) {
            return reservations.filter(event => 
                event.start.toDateString() === date.toDateString()
            );
        }

        function createEventElement(event) {
            const eventEl = document.createElement('div');
            eventEl.className = 'event-block';
            eventEl.style.background = getEventColor(event.type);
            eventEl.style.top = '2px';
            eventEl.style.height = 'calc(100% - 4px)';
            eventEl.innerHTML = `
                <div style="font-weight: 600;">${event.title}</div>
                <div style="font-size: 0.7rem; opacity: 0.9;">👤 ${event.conducteur}</div>
            `;
            
            eventEl.addEventListener('click', (e) => {
                e.stopPropagation();
                showEventDetails(event);
            });

            return eventEl;
        }

        function getEventColor(type) {
            const colors = {
                'transport-personnel': '#10b981',
                'livraison': '#f59e0b',
                'maintenance': '#ef4444',
                'formation': '#3b82f6',
                'autre': '#8b5cf6'
            };
            return colors[type] || '#6b7280';
        }

        function getEventTitle(type) {
            const titles = {
                'transport-personnel': '🚌 Transport personnel',
                'livraison': '📦 Livraison',
                'maintenance': '🔧 Maintenance',
                'formation': '🎓 Formation',
                'autre': '✏️ Autre'
            };
            return titles[type] || '📋 Mission';
        }

        // === NAVIGATION ===
        function setView(view) {
            currentView = view;
            
            // Mettre à jour les boutons actifs
            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(view + 'Btn').classList.add('active');
            
            renderCalendar();
            showNotification(`Vue ${view === 'week' ? 'semaine' : view === 'day' ? 'jour' : 'mois'} activée`, 'info');
        }

        function previousPeriod() {
            if (currentView === 'week') {
                currentDate.setDate(currentDate.getDate() - 7);
            } else if (currentView === 'day') {
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (currentView === 'month') {
                currentDate.setMonth(currentDate.getMonth() - 1);
            }
            
            renderCalendar();
            updateCurrentPeriodDisplay();
        }

        function nextPeriod() {
            if (currentView === 'week') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (currentView === 'day') {
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (currentView === 'month') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            
            renderCalendar();
            updateCurrentPeriodDisplay();
        }

        function goToToday() {
            currentDate = new Date();
            renderCalendar();
            updateCurrentPeriodDisplay();
            showNotification('Retour à aujourd\'hui', 'info');
        }

        function getStartOfWeek(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = 1
            return new Date(d.setDate(diff));
        }

        function updateCurrentPeriodDisplay() {
            const display = document.getElementById('currentPeriod');
            
            if (currentView === 'week') {
                const startOfWeek = getStartOfWeek(currentDate);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                display.textContent = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1} ${endOfWeek.getFullYear()}`;
            } else if (currentView === 'day') {
                display.textContent = currentDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            } else if (currentView === 'month') {
                display.textContent = currentDate.toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric'
                });
            }
        }

        // === MODAL DE RÉSERVATION ===
        function openReservationModal(dateStr, hour = 9) {
            console.log("📝 Opening reservation modal for:", dateStr);
            
            const modal = document.getElementById('reservationModal');
            const dateInput = document.getElementById('reservationDate');
            const heureDebut = document.getElementById('heureDebut');
            const heureFin = document.getElementById('heureFin');

            // Remplir les champs
            dateInput.value = dateStr;
            heureDebut.value = `${hour.toString().padStart(2, '0')}:00`;
            heureFin.value = `${Math.min(18, hour + 2).toString().padStart(2, '0')}:00`;

            modal.style.display = 'flex';
        }

        function addNewReservation() {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            openReservationModal(tomorrow.toISOString().split('T')[0]);
        }

        function closeReservationModal() {
            const modal = document.getElementById('reservationModal');
            modal.style.display = 'none';
            document.getElementById('reservationForm').reset();
        }

        function submitReservation(event) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const data = {
                date: formData.get('date_reservation'),
                heureDebut: formData.get('heure_debut'),
                heureFin: formData.get('heure_fin'),
                motif: formData.get('motif'),
                conducteur: formData.get('conducteur'),
                notes: formData.get('notes')
            };

            // Validation
            if (data.heureDebut >= data.heureFin) {
                showNotification('L\'heure de fin doit être après l\'heure de début', 'error');
                return;
            }

            // Vérifier les conflits
            const startDateTime = new Date(`${data.date}T${data.heureDebut}`);
            const endDateTime = new Date(`${data.date}T${data.heureFin}`);
            
            const hasConflict = reservations.some(existing => {
                return (startDateTime < existing.end && endDateTime > existing.start);
            });

            if (hasConflict) {
                showNotification('Conflit avec une réservation existante', 'error');
                return;
            }

            // Créer la nouvelle réservation
            const newReservation = {
                id: Date.now(),
                title: getEventTitle(data.motif),
                start: startDateTime,
                end: endDateTime,
                type: data.motif,
                conducteur: data.conducteur,
                notes: data.notes
            };

            reservations.push(newReservation);
            
            closeReservationModal();
            renderCalendar();
            
            showNotification(`Réservation confirmée pour ${data.conducteur} !`, 'success');
            console.log("✅ New reservation added:", newReservation);
        }

        function showEventDetails(event) {
            const message = `
${event.title}

👤 Conducteur: ${event.conducteur}
📅 Date: ${event.start.toLocaleDateString('fr-FR')}
🕐 Horaire: ${event.start.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})} - ${event.end.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}
📝 Notes: ${event.notes || 'Aucune note'}

Voulez-vous supprimer cette réservation ?
            `.trim();
            
            if (confirm(message)) {
                deleteReservation(event.id);
            }
        }

        function deleteReservation(id) {
            const index = reservations.findIndex(r => r.id === id);
            if (index > -1) {
                reservations.splice(index, 1);
                renderCalendar();
                showNotification('Réservation supprimée', 'success');
            }
        }



        // === FONCTIONS UTILITAIRES ===
        function showNotification(message, type = 'info') {
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(n => n.remove());

            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        }

        function refreshCalendar() {
            console.log("🔄 Refreshing calendar...");
            renderCalendar();
            showNotification('Planning actualisé', 'success');
        }

        function goBack() {
            console.log("⬅️ Going back to vehicles list");
            showNotification('Retour à la liste des véhicules...', 'info');
        }

        // === ÉVÉNEMENTS ===
        // Fermer le modal en cliquant à l'extérieur
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('reservationModal');
            if (e.target === modal) {
                closeReservationModal();
            }
        });

        // Fermer le modal avec Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeReservationModal();
            }
        });

        // Validation des heures en temps réel
        document.getElementById('heureDebut').addEventListener('change', function() {
            const heureFin = document.getElementById('heureFin');
            if (this.value && heureFin.value && this.value >= heureFin.value) {
                const [hours, minutes] = this.value.split(':');
                const newEndHour = Math.min(18, parseInt(hours) + 2);
                heureFin.value = `${newEndHour.toString().padStart(2,'0')}:${minutes}`;
            }
        });



        

        console.log("✅ Dynamic planning system initialized successfully!");