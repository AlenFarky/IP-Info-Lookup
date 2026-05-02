const search = document.querySelector(".input-container span");
const loader = document.querySelector("#loader");

const form = document.querySelector("form");
const locationContainer = document.querySelector(".location-container");
const inputField = document.querySelector(".input-container input");

const ipP = document.getElementById("ipP");
const ispP = document.getElementById("ispP");
const countryP = document.getElementById("countryP");
const localP = document.getElementById("localP");
const mapPlaceholder = document.getElementById("mapPlaceholder");
const mapElement = document.getElementById("map");

// ======================
// MAP
// ======================
const map = L.map("map", {
  minZoom: 2,
  maxZoom: 18,
  maxBounds: L.latLngBounds([-90, -180], [90, 180]),
  maxBoundsViscosity: 1.0
}).setView([0, 0], 2);

let marker;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

map.on("drag", () => {
  map.setView(map.getCenter());
});

// ======================
// ALERT
// ======================
function showAlert(title, text, icon) {
  return Swal.fire({
    icon,
    title,
    text,
    showConfirmButton: false,
    timer: 2400,
  });
}

// ======================
// COUNTRY FLAG
// ======================
function getCountryName(code) {
  return countryNames[code] || code;
}

function displayCountryFlag(code, name) {
  if (!code) return name;
  return `<span class="flag-icon flag-icon-${code.toLowerCase()}"></span> ${name}`;
}

// ======================
// CAPTCHA CONTROL
// ======================
const submitButton = form.querySelector("button[type='submit']");

submitButton.classList.add("disabled");
submitButton.setAttribute("disabled", true);

window.turnstileCallback = function () {
  submitButton.classList.remove("disabled");
  submitButton.removeAttribute("disabled");
};

// ======================
// HANDLER
// ======================
async function handler(e) {
  e.preventDefault();

  submitButton.classList.add("disabled");
  submitButton.setAttribute("disabled", true);
  loader.classList.add("active");

  const formData = new FormData(form);
  const captchaToken = formData.get("cf-turnstile-response");
  const query = inputField.value.trim();

  if (!captchaToken) {
    showAlert("Oops!", "Please complete CAPTCHA.", "error");
    resetUI();
    return;
  }

  try {
    const response = await fetch("https://captcha.farky.xyz/verify-ip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        "cf-turnstile-response": captchaToken
      })
    });

    const result = await response.json();

    // ALERT iz backenda
    if (result.alert) {
      showAlert(result.alert.title, result.alert.text, result.alert.icon);
    }

    // DATA
    if (result.data) {
      ipP.innerText = result.data.ip || "N/A";
      ispP.innerText = result.data.isp || "N/A";

      if (result.data.country) {
        const name = getCountryName(result.data.country);
        countryP.innerHTML = displayCountryFlag(result.data.country, name);
      } else {
        countryP.innerText = "N/A";
      }

      if (result.data.city && result.data.region) {
        localP.innerText = `${result.data.city}, ${result.data.region}`;
      } else {
        localP.innerText = "N/A";
      }

      locationContainer.classList.add("active");

      if (result.data.lat && result.data.lng) {
        if (mapPlaceholder) {
          mapPlaceholder.classList.add("hidden");
        }

        if (mapElement) {
          mapElement.classList.remove("map-hidden");
          mapElement.classList.add("map-visible");
        }

        setTimeout(() => {
          map.invalidateSize();
        }, 100);

        const coords = [result.data.lat, result.data.lng];

        map.setView(coords, 13);

        if (marker) map.removeLayer(marker);
        marker = L.marker(coords).addTo(map);
      }
    }

  } catch (err) {
    showAlert("Oops!", "Server error. Try again later.", "error");
  } finally {
    resetUI();
  }
}

// ======================
// RESET UI
// ======================
function resetUI() {
  if (typeof turnstile !== "undefined") {
    turnstile.reset();
  }

  loader.classList.remove("active");
  submitButton.classList.add("disabled");
  submitButton.setAttribute("disabled", true);
}

// ======================
// EVENTS
// ======================
search.addEventListener("click", handler);
form.addEventListener("submit", handler);
