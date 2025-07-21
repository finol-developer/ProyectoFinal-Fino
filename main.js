let nombreLugares = [];
let eleccionUsuarios = JSON.parse(localStorage.getItem("rankingBares")) || [];
let barSeleccionado = null;

const barSelectionDiv = document.getElementById("barSelection");
const formularioDiv = document.getElementById("formulario");
const nombreBarH3 = document.getElementById("nombreBar");
const votacionForm = document.getElementById("votacionForm");
const rankingDiv = document.getElementById("ranking");
const fotoBarDiv = document.getElementById("fotoBar");
const registroUsuarioDiv = document.getElementById("registroUsuario");
const registroForm = document.getElementById("registroForm");
const cerrarSesionBtn = document.getElementById("cerrarSesion");
const modoToggle = document.getElementById("modoToggle");

const URL = "data.json";

let usuarioRegistrado = JSON.parse(localStorage.getItem("usuarioRegistrado")) || null;

function actualizarEstadoRegistro() {
  if (usuarioRegistrado) {
    registroUsuarioDiv.classList.add("hidden");
    formularioDiv.classList.remove("hidden");
    cerrarSesionBtn.style.display = "block";
  } else {
    registroUsuarioDiv.classList.remove("hidden");
    formularioDiv.classList.add("hidden");
    cerrarSesionBtn.style.display = "none";
  }
}

registroForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombreUsuario").value.trim();
  const email = document.getElementById("emailUsuario").value.trim();

  if (!nombre || !email) {
    Swal.fire('Error', 'Por favor completa todos los campos', 'error');
    return;
  }

  usuarioRegistrado = { nombre, email };
  localStorage.setItem("usuarioRegistrado", JSON.stringify(usuarioRegistrado));
  Swal.fire('¡Registro exitoso!', '', 'success');
  actualizarEstadoRegistro();
});

cerrarSesionBtn.addEventListener("click", () => {
  Swal.fire({
    title: "¿Cerrar sesión?",
    text: "Se eliminará el usuario registrado y deberás registrarte de nuevo.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, cerrar sesión",
    cancelButtonText: "Cancelar"
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("usuarioRegistrado");
      usuarioRegistrado = null;
      actualizarEstadoRegistro();
      Swal.fire("Sesión cerrada", "Puedes registrarte de nuevo", "info");
    }
  });
});

function obtenerProductos() {
  fetch(URL)
    .then(response => response.json())
    .then(data => {
      nombreLugares = data;
      mostrarCardsDeBares();
      mostrarRanking();
      inicializarMapa();
      if (nombreLugares.length > 0) seleccionarBar(0);
      actualizarEstadoRegistro();
    })
    .catch(error => {
      Swal.fire('Error', 'No se pudieron cargar los bares.', 'error');
      console.error("Error al obtener productos:", error);
    });
}

function mostrarCardsDeBares(lista = nombreLugares) {
  const contenedor = document.getElementById("contenedorCardsBares");
  contenedor.innerHTML = "";

  lista.forEach((bar, index) => {
    const card = document.createElement("div");
    card.className = "card-bar";

    card.innerHTML = `
      <h4>${bar.nombre}</h4>
      
      <button onclick="seleccionarBar(${index})">Votar</button>
    `;

    contenedor.appendChild(card);
  });
}

function seleccionarBar(index) {
  barSeleccionado = nombreLugares[index];
  nombreBarH3.textContent = `Votando por: ${barSeleccionado.nombre}`;
  if (usuarioRegistrado) formularioDiv.classList.remove("hidden");
  mostrarFotoBar(barSeleccionado.nombre);
}

votacionForm.addEventListener("submit", function (e) {
  e.preventDefault();

  if (!usuarioRegistrado) {
    Swal.fire('Error', 'Debes registrarte antes de votar', 'error');
    return;
  }

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
        usuario: usuarioRegistrado
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

  rankingDiv.innerHTML = "<h3>Resultados del Ranking</h3><ol>";

  ordenados.forEach((bar) => {
    const infoCompleta = nombreLugares.find(
      lugar => lugar.nombre.trim().toLowerCase() === bar.nombre.trim().toLowerCase()
    );

    const descripcion = infoCompleta?.descripcion || "Sin descripción";
    const direccion = infoCompleta?.direccion || "Sin dirección";
    const categoria = infoCompleta?.categoria || "Sin categoría";

    rankingDiv.innerHTML += `
      <li>
        <strong>${bar.nombre}</strong><br>
        <em>${descripcion}</em><br>
        <small><strong>Dirección:</strong> ${direccion}</small><br>
        <small><strong>Categoría:</strong> ${categoria}</small><br>
        <strong>Puntaje total:</strong> ${calcularPuntajeTotal(bar.puntajes)}
      </li>
    `;
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
        fotoBarDiv.innerHTML = `<img src="${fotoUrl}" alt="Imagen de ${nombreBar}" style="max-width:100%; border-radius:8px;">`;
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
      nombreBarH3.textContent = `Votando por: ${lugar.nombre}`;
      if (usuarioRegistrado) formularioDiv.classList.remove("hidden");
      marcador.bindPopup(`<strong>${lugar.nombre}</strong>`).openPopup();
    });
  });
}

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
