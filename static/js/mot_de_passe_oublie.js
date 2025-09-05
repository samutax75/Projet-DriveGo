document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault(); // Empêche le submit immédiat

    const btn = document.querySelector('.submit-btn');
    btn.innerHTML = '✉️ Envoi en cours...';
    btn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';

    // Simulation d'envoi
    setTimeout(() => {
        btn.innerHTML = '✅ Email envoyé avec succès !';

        // Laisser le message visible 2 secondes avant de soumettre le formulaire
        setTimeout(() => {
            this.submit(); // Lance le submit réel
        }, 2000);

    }, 2000); // 2 secondes pour "Envoi en cours..."
});
