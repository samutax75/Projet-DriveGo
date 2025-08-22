// Animation d'envoi du formulaire
        document.querySelector('form').addEventListener('submit', function(e) {
            const btn = document.querySelector('.submit-btn');
            const container = document.querySelector('.container');
            
            btn.innerHTML = '✉️ Envoi en cours...';
            btn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            container.classList.add('success-animation');
            
            // Simulation d'envoi (à remplacer par votre logique)
            setTimeout(() => {
                btn.innerHTML = '✅ Email envoyé !';
            }, 2000);
        });

        // Animation au focus des inputs
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.style.transform = 'scale(1.02)';
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.style.transform = 'scale(1)';
            });
        });

        document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault(); // Empêche le submit direct

    const btn = document.querySelector('.submit-btn');
    btn.innerHTML = '✉️ Envoi en cours...';
    btn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';

    // Simule l'envoi et laisse le message visible avant redirection
    setTimeout(() => {
        this.submit(); // Lance le submit réel après 2 secondes
    }, 2000);
});
