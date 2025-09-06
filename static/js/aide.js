// Create floating particles
        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            const particleCount = 50;

            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 20 + 's';
                particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
                particlesContainer.appendChild(particle);
            }
        }

        // Contact Form Handler
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('.submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const statusMessage = document.getElementById('statusMessage');
            
            // Disable button and show loading
            submitBtn.disabled = true;
            btnText.innerHTML = '<div class="spinner"></div> Envoi en cours...';
            
            // Get form data
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // Simulate form submission
            setTimeout(() => {
                try {
                    // Here you would normally send data to your backend
                    console.log('Form data:', data);
                    
                    // Show success message
                    showStatusMessage('🎉 Votre message a été envoyé avec succès ! Notre équipe vous répondra dans les plus brefs délais.', 'success');
                    
                    // Reset form
                    e.target.reset();
                    resetFieldStyles();
                    
                } catch (error) {
                    showStatusMessage('❌ Une erreur est survenue lors de l\'envoi. Veuillez réessayer plus tard.', 'error');
                } finally {
                    // Re-enable button
                    submitBtn.disabled = false;
                    btnText.innerHTML = 'Envoyer le message';
                }
            }, 2000);
        });

        function showStatusMessage(message, type) {
            const statusMessage = document.getElementById('statusMessage');
            statusMessage.innerHTML = message;
            statusMessage.className = `status-message ${type}`;
            statusMessage.style.display = 'block';
            
            // Hide message after 6 seconds
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 6000);
        }

        function resetFieldStyles() {
            document.querySelectorAll('input, select, textarea').forEach(field => {
                field.classList.remove('valid', 'invalid');
            });
        }

        // Enhanced form validation
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
            field.addEventListener('blur', function() {
                validateField(this);
            });

            field.addEventListener('input', function() {
                if (this.classList.contains('invalid')) {
                    validateField(this);
                }
            });
        });

        function validateField(field) {
            const value = field.value.trim();
            
            if (!value) {
                field.classList.add('invalid');
                field.classList.remove('valid');
                return false;
            }

            // Email validation
            if (field.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    field.classList.add('invalid');
                    field.classList.remove('valid');
                    return false;
                }
            }

            field.classList.add('valid');
            field.classList.remove('invalid');
            return true;
        }

        // Initialize particles when page loads
        document.addEventListener('DOMContentLoaded', function() {
            createParticles();
        });

        // Smooth scroll for internal links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });






           