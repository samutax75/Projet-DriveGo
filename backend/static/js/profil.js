 let isEditMode = false;
        let originalData = {};
        let currentAvatarData = null;

        // Données utilisateur
    // const userData = {
    //     firstName: "{{ user.prenom|e }}",
    //     lastName: "{{ user.nom|e }}",
    //     email: "{{ user.email|e }}",
    //     phone: "{{ user.telephone|default('')|e }}",
    //     password: "",
    //     licenseNumber: "{{ user.permis|default('')|e }}",
    //     address: "{{ user.adresse|default('')|e }}"
    // };

        function initializeProfile() {
            // Charger les données utilisateur
            Object.keys(userData).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = userData[key];
                }
            });
            
            updateDisplayName();
        }

        function handleAvatarUpload(event) {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limite
                    showStatus('La taille de l\'image ne doit pas dépasser 5MB', 'error');
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    showStatus('Veuillez sélectionner un fichier image valide', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    currentAvatarData = e.target.result;
                    const avatar = document.getElementById('avatar');
                    avatar.innerHTML = `<img src="${currentAvatarData}" alt="Photo de profil">
                                      <button class="avatar-upload" onclick="document.getElementById('avatarInput').click()">📷</button>
                                      <input type="file" id="avatarInput" accept="image/*" onchange="handleAvatarUpload(event)">`;
                    showStatus('Photo de profil mise à jour !', 'success');
                };
                reader.readAsDataURL(file);
            }
        }

        function updateDisplayName() {
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            document.getElementById('displayName').textContent = `${firstName} ${lastName}`;
        }

        function toggleEditMode() {
            isEditMode = !isEditMode;
            const form = document.getElementById('profileForm');
            const inputs = form.querySelectorAll('.form-input');
            const editButtons = document.querySelectorAll('.edit-mode');
            const viewButton = document.getElementById('editBtn');
            const passwordHint = document.getElementById('passwordHint');
            const passwordStrength = document.getElementById('passwordStrength');

            if (isEditMode) {
                // Sauvegarder les données originales
                originalData = {};
                inputs.forEach(input => {
                    originalData[input.id] = input.value;
                    input.removeAttribute('readonly');
                });

                // Ajouter l'événement pour vérifier la force du mot de passe
                document.getElementById('password').addEventListener('input', checkPasswordStrength);
                passwordHint.classList.add('show');
                passwordStrength.classList.add('show');

                form.classList.remove('view-mode');
                editButtons.forEach(btn => btn.style.display = 'inline-block');
                viewButton.style.display = 'none';

                showStatus('Mode édition activé', 'success');
            } else {
                // Mode lecture
                inputs.forEach(input => {
                    input.setAttribute('readonly', true);
                });

                // Retirer l'événement et cacher les indicateurs de mot de passe
                document.getElementById('password').removeEventListener('input', checkPasswordStrength);
                passwordHint.classList.remove('show');
                passwordStrength.classList.remove('show');

                form.classList.add('view-mode');
                editButtons.forEach(btn => btn.style.display = 'none');
                viewButton.style.display = 'inline-block';
            }
        }

        function checkPasswordStrength() {
            const password = document.getElementById('password').value;
            const strengthIndicator = document.getElementById('passwordStrength');
            let strength = 0;

            // Critères de force du mot de passe
            if (password.length >= 8) strength++;
            if (/[a-z]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;

            // Mettre à jour l'indicateur visuel
            strengthIndicator.className = 'password-strength show';
            if (strength <= 2) {
                strengthIndicator.classList.add('weak');
            } else if (strength <= 3) {
                strengthIndicator.classList.add('medium');
            } else {
                strengthIndicator.classList.add('strong');
            }
        }

        function changePassword() {
            if (!isEditMode) {
                showStatus('Activez le mode édition pour changer votre mot de passe', 'error');
                return;
            }
            
            const newPassword = prompt('Entrez votre nouveau mot de passe:');
            if (newPassword && newPassword.length >= 8) {
                document.getElementById('password').value = newPassword;
                checkPasswordStrength();
                showStatus('Mot de passe mis à jour. N\'oubliez pas d\'enregistrer !', 'success');
            } else if (newPassword) {
                showStatus('Le mot de passe doit contenir au moins 8 caractères', 'error');
            }
        }

        function enable2FA() {
            showStatus('Configuration de l\'authentification à deux facteurs...', 'success');
            // Simulation - ouvrir un modal de configuration 2FA
        }

        function downloadData() {
            showStatus('Préparation du téléchargement de vos données...', 'success');
            // Simulation - générer et télécharger un fichier JSON des données utilisateur
            setTimeout(() => {
                const dataStr = JSON.stringify(userData, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'mes-donnees-drivego.json';
                link.click();
                URL.revokeObjectURL(url);
            }, 2000);
        }

        function saveProfile() {
            const form = document.getElementById('profileForm');
            
            // Validation des données
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;

            if (!firstName || !lastName) {
                showStatus('Le prénom et le nom sont obligatoires', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showStatus('Veuillez entrer un email valide', 'error');
                return;
            }

            if (!isValidPhone(phone)) {
                showStatus('Veuillez entrer un numéro de téléphone valide', 'error');
                return;
            }

            if (password.length < 8) {
                showStatus('Le mot de passe doit contenir au moins 8 caractères', 'error');
                return;
            }

            // Simulation de sauvegarde
            setTimeout(() => {
                // Mettre à jour les données utilisateur
                Object.keys(userData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        userData[key] = element.value;
                    }
                });

                updateDisplayName();
                toggleEditMode();
                showStatus('Profil mis à jour avec succès !', 'success');
            }, 1000);

            showStatus('Enregistrement en cours...', 'success');
        }

        function cancelEdit() {
            // Restaurer les données originales
            Object.keys(originalData).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = originalData[key];
                }
            });

            // Restaurer l'avatar si nécessaire
            if (currentAvatarData) {
                const avatar = document.getElementById('avatar');
                avatar.innerHTML = `👤<button class="avatar-upload" onclick="document.getElementById('avatarInput').click()">📷</button>
                                  <input type="file" id="avatarInput" accept="image/*" onchange="handleAvatarUpload(event)">`;
                currentAvatarData = null;
            }

            toggleEditMode();
            showStatus('Modifications annulées', 'error');
        }

        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const toggleButton = document.querySelector('.password-toggle');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleButton.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleButton.textContent = '👁️';
            }
        }

        function showStatus(message, type) {
            const statusElement = document.getElementById('statusMessage');
            statusElement.textContent = message;
            statusElement.className = `status-message status-${type}`;
            statusElement.style.display = 'block';

            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }

        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function isValidPhone(phone) {
            const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
            const cleanPhone = phone.replace(/\s/g, '');
            return phoneRegex.test(cleanPhone) || phone.includes('+33 6');
        }

        // Initialisation au chargement de la page
        document.addEventListener('DOMContentLoaded', function() {
            initializeProfile();
            
            // Ajouter des animations d'entrée
            const formGroups = document.querySelectorAll('.form-group');
            formGroups.forEach((group, index) => {
                setTimeout(() => {
                    group.style.opacity = '0';
                    group.style.transform = 'translateY(20px)';
                    group.style.transition = 'all 0.5s ease';
                    
                    setTimeout(() => {
                        group.style.opacity = '1';
                        group.style.transform = 'translateY(0)';
                    }, 50);
                }, index * 100);
            });
        });

        // Gestion des touches clavier
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && isEditMode) {
                cancelEdit();
            }
            if (event.ctrlKey && event.key === 's' && isEditMode) {
                event.preventDefault();
                saveProfile();
            }
        });

        // Mise à jour du nom affiché en temps réel
        document.addEventListener('input', function(event) {
            if (event.target.id === 'firstName' || event.target.id === 'lastName') {
                updateDisplayName();
            }
        });



        // gérer l'image 

        function handleAvatarUpload(event) {
    const file = event.target.files[0];
    const avatar = document.getElementById('avatar');
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Créer un élément img
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = "Photo de profil";
            
            // Vider le contenu actuel et ajouter l'image
            avatar.innerHTML = '';
            avatar.appendChild(img);
            
            // Ajouter la classe pour masquer le gradient
            avatar.classList.add('has-image');
            
            // Remettre le bouton upload
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'avatar-upload';
            uploadBtn.onclick = () => document.getElementById('avatarInput').click();
            uploadBtn.innerHTML = '📷';
            avatar.appendChild(uploadBtn);
        };
        
        reader.readAsDataURL(file);
    }
}