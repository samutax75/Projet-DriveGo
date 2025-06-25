 
document.getElementById("form-reservation").addEventListener("submit", function(e) {
  e.preventDefault();
  const vehicule = document.getElementById("vehicule").value;
  const date = document.getElementById("date").value;
  const heure = document.getElementById("heure").value;

  console.log(`Réservation enregistrée : ${vehicule}, ${date} à ${heure}`);
  alert("Réservation effectuée !");
});

function modifierReservation() {
  const id = document.getElementById("reservation-id").value;
  if (id) {
    alert(`Fonction de modification pour la réservation ${id}`);
    console.log("Modifier réservation", id);
  } else {
    alert("Veuillez entrer un ID de réservation");
  }
}

function annulerReservation() {
  const id = document.getElementById("reservation-id").value;
  if (id) {
    alert(`Réservation ${id} annulée.`);
    console.log("Annuler réservation", id);
  } else {
    alert("Veuillez entrer un ID de réservation");
  }
}


document.getElementById("form-reservation").addEventListener("submit", function(e) {
  e.preventDefault();
  const vehicule = document.getElementById("vehicule").value;
  const date = document.getElementById("date").value;
  const heure = document.getElementById("heure").value;

  console.log(`Réservation enregistrée : ${vehicule}, ${date} à ${heure}`);
  alert("Réservation effectuée !");
});

function modifierReservation() {
  const id = document.getElementById("reservation-id").value;
  if (id) {
    alert(`Fonction de modification pour la réservation ${id}`);
    console.log("Modifier réservation", id);
  } else {
    alert("Veuillez entrer un ID de réservation");
  }
}

function annulerReservation() {
  const id = document.getElementById("reservation-id").value;
  if (id) {
    alert(`Réservation ${id} annulée.`);
    console.log("Annuler réservation", id);
  } else {
    alert("Veuillez entrer un ID de réservation");
  }
}


// Section Aide

document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.querySelector('.contact-form form');

  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault(); // Empêche le rechargement de la page
      alert("📨 Votre message a bien été envoyé au support DriveGo !");
      contactForm.reset(); // Réinitialise le formulaire après envoi
    });
  }
});

