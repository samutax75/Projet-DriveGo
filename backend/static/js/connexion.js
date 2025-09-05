 // Configuration Google Sign-In
        window.onload = function () {
            google.accounts.id.initialize({
                client_id: "VOTRE_CLIENT_ID_GOOGLE.apps.googleusercontent.com", // REMPLACEZ PAR VOTRE CLIENT ID
                callback: handleCredentialResponse
            });
        }

        // Fonction appelée après la connexion Google
        function handleCredentialResponse(response) {
            console.log("Encoded JWT ID token: " + response.credential);
            
            // Décoder le token JWT pour obtenir les informations utilisateur
            const responsePayload = decodeJwtResponse(response.credential);
            
            console.log("ID: " + responsePayload.sub);
            console.log('Full Name: ' + responsePayload.name);
            console.log('Given Name: ' + responsePayload.given_name);
            console.log('Family Name: ' + responsePayload.family_name);
            console.log("Image URL: " + responsePayload.picture);
            console.log("Email: " + responsePayload.email);

            // Afficher le message de succès
            showSuccessMessage('Connexion Google réussie ! Redirection en cours...');
            
            // Ici vous pouvez envoyer les données à votre serveur
            // Pour cet exemple, on simule une redirection après 2 secondes
            setTimeout(() => {
                // window.location.href = '/dashboard'; // Redirection vers votre page d'accueil
                alert('Redirection vers le dashboard...');
            }, 2000);
        }

        // Fonction pour décoder le token JWT
        function decodeJwtResponse(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        }

        // Gestion du clic sur le bouton Google personnalisé
        
        window.onload = function () {
    google.accounts.id.initialize({
        client_id: "VOTRE_CLIENT_ID_GOOGLE.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    // Rendre le bouton Google réel sur ton bouton
    google.accounts.id.renderButton(
        document.getElementById('googleSignInBtn'),
        {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "signin_with"
        }
    );

    // Optionnel : activer le One Tap
    google.accounts.id.prompt();
};


        // Connexion classique par formulaire
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('submitBtn');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const submitText = document.getElementById('submitText');
            
            // Afficher le spinner de chargement
            loadingSpinner.style.display = 'block';
            submitText.textContent = 'Connexion...';
            submitBtn.disabled = true;
            
            // Simuler la vérification (remplacez par votre logique)
            setTimeout(() => {
                if (email === 'demo@drivego.com' && password === 'demo123') {
                    showSuccessMessage('Connexion réussie ! Redirection en cours...');
                    setTimeout(() => {
                        // window.location.href = '/dashboard';
                        alert('Redirection vers le dashboard...');
                    }, 2000);
                } else {
                    showErrorMessage('Email ou mot de passe incorrect');
                }
                
                // Cacher le spinner
                loadingSpinner.style.display = 'none';
                submitText.textContent = 'Se connecter';
                submitBtn.disabled = false;
            }, 1500);
        });

        // Toggle password visibility
        document.getElementById('passwordToggle').addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.textContent = type === 'password' ? '👀' : '🙈';
        });

        // Fonctions utilitaires
        function showErrorMessage(message) {
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            successDiv.style.display = 'none';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }

        function showSuccessMessage(message) {
            const successDiv = document.getElementById('successMessage');
            const errorDiv = document.getElementById('errorMessage');
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            errorDiv.style.display = 'none';
        }