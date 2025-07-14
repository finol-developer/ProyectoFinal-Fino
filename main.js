let nombreLugares = [];
let eleccionUsuarios = JSON.parse(localStorage.getItem("rankingBares")) || [];
let barSeleccionado = null;

const barSelectionDiv = document.getElementById("barSelection");
const formularioDiv = document.getElementById("formulario");
const nombreBarH2 = document.getElementById("nombreBar");
const votacionForm = document.getElementById("votacionForm");
const rankingDiv = document.getElementById("ranking");
const fotoBarDiv = document.getElementById("fotoBar");

const URL = "data.json";

function obtenerProductos() {
  fetch(URL)
    .then(response => response.json())
    .then(data => {
      nombreLugares = data;
      mostrarBotones();
      mostrarRanking();
      inicializarMapa();
      if (nombreLugares.length > 0) {
        seleccionarBar(0);
      }
    })
    .catch(error => {
      Swal.fire('Error', 'No se pudieron cargar los bares.', 'error');
      console.error("Error al obtener productos:", error);
    });
}

function mostrarBotones() {
  barSelectionDiv.innerHTML = "";
  nombreLugares.forEach((nombre, index) => {
    const btn = document.createElement("button");
    btn.textContent = nombre.nombre;
    btn.onclick = () => seleccionarBar(index);
    barSelectionDiv.appendChild(btn);
  });
}

function seleccionarBar(index) {
  barSeleccionado = nombreLugares[index];
  nombreBarH2.textContent = `Votando por: ${barSeleccionado.nombre}`;
  formularioDiv.classList.remove("hidden");
  mostrarFotoBar(barSeleccionado.nombre);
}

votacionForm.addEventListener("submit", function (e) {
  e.preventDefault();

  Swal.fire({
    title: '¿Enviar votación?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, enviar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      const datos = new FormData(votacionForm);
      const puntajes = [
        parseInt(datos.get("atencion")),
        parseInt(datos.get("rapidez")),
        parseInt(datos.get("tragos")),
        parseInt(datos.get("comida")),
        parseInt(datos.get("precios")),
        parseInt(datos.get("limpieza")),
      ];

      const bar = {
        nombre: barSeleccionado.nombre,
        puntajes,
      };

      eleccionUsuarios.push(bar);
      localStorage.setItem("rankingBares", JSON.stringify(eleccionUsuarios));

      votacionForm.reset();
      formularioDiv.classList.add("hidden");
      mostrarRanking();

      Swal.fire('¡Gracias!', 'Tu votación ha sido guardada.', 'success');
    }
  });
});

function calcularPuntajeTotal(puntajes) {
  return puntajes.reduce((a, b) => a + b, 0);
}

function mostrarRanking() {
  const ordenados = [...eleccionUsuarios].sort(
    (a, b) => calcularPuntajeTotal(b.puntajes) - calcularPuntajeTotal(a.puntajes)
  );

  rankingDiv.innerHTML = "<h2>Resultados del Ranking</h2><ol>";
  ordenados.forEach((bar) => {
    rankingDiv.innerHTML += `<li>${bar.nombre} - Puntaje Total: ${calcularPuntajeTotal(bar.puntajes)}</li>`;
  });
  rankingDiv.innerHTML += "</ol>";
}

function mostrarFotoBar(nombreBar) {
  const apiKey = "spbqzUastUwwArh-0bVAHx1pTGBI7qaINKtwhPZwQWY";
  const query = `${nombreBar} bar Valencia`;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${apiKey}&per_page=1`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const fotoUrl = data.results?.[0]?.urls?.regular;
      if (fotoUrl) {
        fotoBarDiv.innerHTML = `<img src="${fotoUrl}" alt="Imagen relacionada a ${nombreBar}" style="max-width:100%; border-radius:8px;">`;
      } else {
        fotoBarDiv.innerHTML = "<p>No se encontró imagen relacionada.</p>";
      }
    })
    .catch(error => {
      console.error("Error al buscar imagen:", error);
      fotoBarDiv.innerHTML = "<p>Error al cargar la imagen.</p>";
    });
}

function inicializarMapa() {
  const mapa = L.map("ubicaciondelugares").setView([39.4702, -0.3768], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
  }).addTo(mapa);

  nombreLugares.forEach((lugar) => {
    const marcador = L.marker([lugar.lat, lugar.lng]).addTo(mapa);
    marcador.on("click", () => {
      barSeleccionado = lugar;
      mostrarFotoBar(lugar.nombre);
      nombreBarH2.textContent = `Votando por: ${lugar.nombre}`;
      formularioDiv.classList.remove("hidden");
      marcador.bindPopup(`<strong>${lugar.nombre}</strong>`).openPopup();
    });
  });
}

const modoToggle = document.getElementById("modoToggle");

if (localStorage.getItem("modo") === "oscuro") {
  document.body.classList.add("dark-mode");
  modoToggle.textContent = "Cambiar a Modo Claro";
}

modoToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const modoActual = document.body.classList.contains("dark-mode") ? "oscuro" : "claro";
  localStorage.setItem("modo", modoActual);
  modoToggle.textContent = modoActual === "oscuro" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro";
});

obtenerProductos();