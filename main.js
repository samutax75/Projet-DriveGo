document.addEventListener("DOMContentLoaded", function () {
  const vehiculeSelect = document.getElementById("vehicule-select");
  const champsInfos = document.getElementById("champs-infos");
  const dateInput = document.querySelector('input[name="date"]');
  const departInput = document.querySelector('input[name="depart"]');
  const arriveeInput = document.querySelector('input[name="arrivee"]');
  const form = document.getElementById("form-vehicule");

  // 🟢 Pré-remplir la date d’aujourd’hui
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;

  // 🟢 Heure de départ = actuelle +1h
  const now = new Date();
  now.setHours(now.getHours() + 1);
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  departInput.value = `${hours}:${minutes}`;

  // 🟢 Heure d’arrivée = +2h
  const arriveeTime = new Date(now.getTime());
  arriveeTime.setHours(arriveeTime.getHours() + 1);
  const hoursArr = String(arriveeTime.getHours()).padStart(2, "0");
  const minutesArr = String(arriveeTime.getMinutes()).padStart(2, "0");
  arriveeInput.value = `${hoursArr}:${minutesArr}`;

  // 🔁 Afficher les champs si véhicule déjà sélectionné
  if (vehiculeSelect.value !== "") {
    champsInfos.style.display = "block";
    chargerDepuisLocalStorage();
  }

  // 🟡 Affichage conditionnel des champs
  vehiculeSelect.addEventListener("change", function () {
    if (this.value !== "") {
      champsInfos.style.display = "block";
      chargerDepuisLocalStorage();
    } else {
      champsInfos.style.display = "none";
    }
  });

  // 💾 Sauvegarde automatique
  form.addEventListener("input", function () {
    const data = new FormData(form);
    const values = {};
    data.forEach((val, key) => {
      values[key] = val;
    });
    localStorage.setItem("vehiculeInfos", JSON.stringify(values));
  });

  // 🔄 Chargement auto
  function chargerDepuisLocalStorage() {
    const sauvegarde = localStorage.getItem("vehiculeInfos");
    if (sauvegarde) {
      const data = JSON.parse(sauvegarde);
      Object.keys(data).forEach((key) => {
        const input = form.elements[key];
        if (input) {
          input.value = data[key];
        }
      });
    }
  }

  // ✅ Message de confirmation
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    alert("✅ Formulaire enregistré avec succès !");
    localStorage.removeItem("vehiculeInfos");
    form.reset();
    champsInfos.style.display = "none";
  });
});




//  Le champ calculé automatiquement "Distance parcourue"

document.addEventListener("DOMContentLoaded", () => {
  const vehiculeSelect = document.getElementById("vehicule-select");
  const formDetails = document.getElementById("form-details");

  vehiculeSelect.addEventListener("change", () => {
    formDetails.style.display = vehiculeSelect.value ? "block" : "none";
  });

  const kmDepart = document.getElementById("km-depart");
  const kmArrivee = document.getElementById("km-arrivee");
  const kmParcourus = document.getElementById("km-parcourus");

  function calculerDistance() {
    const depart = parseFloat(kmDepart.value);
    const arrivee = parseFloat(kmArrivee.value);

    if (!isNaN(depart) && !isNaN(arrivee) && arrivee >= depart) {
      kmParcourus.value = arrivee - depart;
    } else {
      kmParcourus.value = "";
    }
  }

  kmDepart.addEventListener("input", calculerDistance);
  kmArrivee.addEventListener("input", calculerDistance);
});



