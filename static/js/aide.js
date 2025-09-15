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
    
    // Validate form before sending
    const requiredFields = e.target.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showStatusMessage('❌ Veuillez remplir tous les champs obligatoires correctement.', 'error');
        return;
    }
    
    // Disable button and show loading
    submitBtn.disabled = true;
    btnText.innerHTML = '<div class="spinner"></div> Envoi en cours...';
    statusMessage.style.display = 'none';
    
    // Get form data
    const formData = new FormData(e.target);
    
    // Send form data to Flask backend
    fetch('/contact', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatusMessage(data.message, 'success');
            // Reset form
            e.target.reset();
            resetFieldStyles();
        } else {
            showStatusMessage(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showStatusMessage('❌ Une erreur est survenue lors de l\'envoi. Veuillez réessayer plus tard.', 'error');
    })
    .finally(() => {
        // Re-enable button
        submitBtn.disabled = false;
        btnText.innerHTML = 'Envoyer le message';
    });
});

function showStatusMessage(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.innerHTML = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    statusMessage.style.opacity = '0';
    
    // Smooth fade in
    setTimeout(() => {
        statusMessage.style.transition = 'opacity 0.3s ease';
        statusMessage.style.opacity = '1';
    }, 10);
    
    // Hide message after 8 seconds with fade out
    setTimeout(() => {
        statusMessage.style.opacity = '0';
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 300);
    }, 8000);
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

    // Phone validation (optional)
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        if (!phoneRegex.test(value)) {
            field.classList.add('invalid');
            field.classList.remove('valid');
            return false;
        }
    }

    // Message length validation
    if (field.name === 'message') {
        if (value.length < 10) {
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

// Add CSS for spinner animation
if (!document.querySelector('#spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.textContent = `
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .status-message {
            transition: opacity 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}