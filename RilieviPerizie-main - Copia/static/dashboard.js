'use strict';

// Funzioni di utilità globale
function formatIndirizzo(coordinate) {
    if (!coordinate) return "Indirizzo non disponibile";
    
    // Se abbiamo l'indirizzo come stringa, usalo
    if (coordinate.indirizzo) return coordinate.indirizzo;
    
    // Altrimenti mostra le coordinate
    const lat = coordinate.latitudine ? coordinate.latitudine.toFixed(5) : "N/A";
    const lng = coordinate.longitudine ? coordinate.longitudine.toFixed(5) : "N/A";
    return `Lat: ${lat}, Lng: ${lng}`;
}

function limitText(text, length) {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
}

// Funzione per popolare il modal con i dettagli completi della perizia
function populateSurveyModal(perizia) {
    const { codice_perizia, data, coordinate, descrizione, fotografie } = perizia;
    const dateFormatted = new Date(data || Date.now()).toLocaleDateString();
    
    // Costruisci il contenuto HTML
    let content = `
        <div class="survey-detail">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h2 class="mb-3">Perizia: ${codice_perizia}</h2>
                    <p class="text-muted mb-1"><strong>Data:</strong> ${dateFormatted}</p>
                    <p class="text-muted mb-3"><strong>Indirizzo:</strong> ${formatIndirizzo(coordinate)}</p>
                </div>
                <div class="col-md-6">
                    <div id="detailMap" style="height: 200px; border-radius: 8px;"></div>
                </div>
            </div>
            
            <div class="mb-4">
                <h5>Descrizione:</h5>
                <textarea id="detailDescrizione" class="form-control" rows="4">${descrizione || ''}</textarea>
            </div>
            
            <h5>Fotografie (${fotografie ? fotografie.length : 0}):</h5>
            <div class="row photo-gallery g-3 mb-3">`;
    
    if (fotografie && fotografie.length > 0) {
        fotografie.forEach((foto, index) => {
            content += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <a href="${foto.url}" class="photo-link">
                            <img src="${foto.url}" alt="Foto ${index + 1}" class="card-img-top" style="height: 180px; object-fit: cover;">
                        </a>
                        <div class="card-body">
                            <textarea id="detailCommento-${index}" class="form-control" rows="3">${foto.commento || ''}</textarea>
                        </div>
                    </div>
                </div>`;
        });
    } else {
        content += `<div class="col-12"><p class="text-muted text-center py-4">Nessuna fotografia disponibile</p></div>`;
    }
    
    content += `
            </div>
            <input type="hidden" id="detailCodicePerizia" value="${codice_perizia}">
            <input type="hidden" id="detailFotografie" value='${JSON.stringify(fotografie || [])}'>
        </div>`;
    
    // Imposta il contenuto nel modal
    $("#surveyDetailContent").html(content);
    
    // Inizializza mappa se ci sono coordinate
    setTimeout(() => {
        if (coordinate && coordinate.latitudine && coordinate.longitudine) {
            const detailMap = new maplibregl.Map({
                container: 'detailMap',
                style: {
                    version: 8,
                    sources: {
                        osm: {
                            type: "raster",
                            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                            tileSize: 256,
                            maxzoom: 19
                        }
                    },
                    layers: [
                        {
                            id: "osm",
                            type: "raster",
                            source: "osm"
                        }
                    ]
                },
                center: [coordinate.longitudine, coordinate.latitudine],
                zoom: 14
            });
            
            detailMap.on('load', function() {
                new maplibregl.Marker()
                    .setLngLat([coordinate.longitudine, coordinate.latitudine])
                    .addTo(detailMap);
            });
        }
    }, 300);
    
    // Aggiungi effetto lightbox alle immagini
    $(".photo-link").on("click", function(e) {
        e.preventDefault();
        const imgUrl = $(this).attr("href");
        
        $("body").append(`
            <div class="lightbox-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); z-index: 1100; display: flex; align-items: center; justify-content: center;">
                <img src="${imgUrl}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
                <button class="btn btn-light position-absolute" style="top: 20px; right: 20px;">Chiudi</button>
            </div>
        `);
        
        $(".lightbox-overlay button, .lightbox-overlay").on("click", function() {
            $(".lightbox-overlay").remove();
        });
    });
}

// Funzione per creare il contenuto del popup con stile migliorato
function createPopupContent(perizia) {
    const { codice_perizia, descrizione, fotografie, data } = perizia;
    const dataFormattata = data ? new Date(data).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Data non disponibile';

   
let content = `
    <div class="marker-popup">
        <!-- Header con sfondo sfumato -->
        <div class="popup-header" style="background: linear-gradient(135deg, #3a8ffe 0%, #1d6ad8 100%); color: white; border-radius: 8px 8px 0 0; padding: 15px; margin: -15px -15px 15px -15px;">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-1 fw-bold">
                    <i class="fas fa-clipboard-check me-2"></i>${codice_perizia}
                </h5>
                <span class="badge bg-light text-dark rounded-pill">
                    <i class="far fa-calendar-alt me-1"></i>${dataFormattata}
                </span>
            </div>
        </div>
        
        <!-- Corpo con stile migliorato -->
        <div class="popup-body">
            <!-- Sezione descrizione -->
            <div class="form-group mb-3">
                <label for="descrizione" class="form-label fw-bold small d-flex align-items-center">
                    <i class="fas fa-file-alt me-2 text-primary"></i>Descrizione:
                </label>
                <div class="input-group">
                    <textarea id="descrizione" class="form-control form-control-sm border-primary-subtle" 
                      rows="3" style="font-size: 14px; border-radius: 8px;">${descrizione || ''}</textarea>
                </div>
            </div>
            
            <!-- Sezione fotografie -->
            <div class="card border-0 bg-light mb-3" style="border-radius: 8px;">
                <div class="card-header bg-transparent border-0 py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold small">
                            <i class="fas fa-images text-success me-2"></i>Fotografie (${fotografie ? fotografie.length : 0})
                        </span>
                        <a href="#" class="view-all-photos text-primary small" data-id="${codice_perizia}">
                            <i class="fas fa-expand-alt me-1"></i>Vedi tutte
                        </a>
                    </div>
                </div>
`;

    if (fotografie && fotografie.length > 0) {
        content += `<div class="photo-gallery row g-2 mb-3">`;
        
        // Mostra solo le prime 2 immagini nel popup
        const visiblePhotos = fotografie.slice(0, 2);
        const remainingCount = fotografie.length - 2;
        
        visiblePhotos.forEach((foto, index) => {
            content += `
            <div class="col-6">
                <div class="photo-thumbnail">
                    <img src="${foto.url}" alt="Foto ${index + 1}" class="img-thumbnail popup-img" 
                         onclick="showLightbox('${foto.url}', ${index})"/>
                    <div class="form-floating mt-1">
                        <textarea id="commento-${index}" class="form-control form-control-sm" rows="2" 
                                  style="height: 60px; font-size: 12px;">${foto.commento || ''}</textarea>
                        <label for="commento-${index}" style="font-size: 11px;">Commento</label>
                    </div>
                </div>
            </div>`;
        });
        
        if (remainingCount > 0) {
            content += `
            <div class="col-12 text-center mt-1">
                <span class="text-muted small">+ altre ${remainingCount} foto</span>
            </div>`;
        }
        
        content += `</div>`;
    } else {
        content += `<p class="text-center text-muted my-3"><i class="fas fa-image me-1"></i> Nessuna fotografia disponibile</p>`;
    }

    content += `
            <div class="d-grid">
                <button id="salvaModifiche" class="btn btn-primary btn-sm" 
                    data-codice="${codice_perizia}" 
                    data-fotografie='${JSON.stringify(fotografie || [])}'>
                    <i class="fas fa-save me-1"></i> Salva Modifiche
                </button>
            </div>
        </div>
    </div>
    `;

    return content;
}

// Funzione per la lightbox deve essere definita a livello globale
function showLightbox(imageUrl, index) {
    $("body").append(`
        <div class="lightbox-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div class="lightbox-header" style="position: absolute; top: 0; left: 0; right: 0; padding: 15px; display: flex; justify-content: space-between; color: white;">
                <span>Foto ${index + 1}</span>
                <button class="btn btn-sm btn-outline-light close-lightbox">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <img src="${imageUrl}" style="max-width: 90%; max-height: 80vh; object-fit: contain;">
        </div>
    `);
    
    $(".close-lightbox, .lightbox-overlay").on("click", function() {
        $(".lightbox-overlay").remove();
    });
}

// Document ready
$(document).ready(function () {
    $('head').append(`
        <style>
            .marker-popup {
                min-width: 280px;
                max-width: 320px;
            }
            
            .popup-header {
                border-bottom: 1px solid #e9ecef;
                padding-bottom: 8px;
                margin-bottom: 12px;
            }
            
            .popup-body {
                padding: 0 4px;
            }
            
            .popup-img {
                width: 100%;
                height: 80px;
                object-fit: cover;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .popup-img:hover {
                transform: scale(1.05);
            }
            
            .maplibregl-popup-content {
                padding: 15px !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            }
            
            .maplibregl-popup-close-button {
                font-size: 18px !important;
                color: #6c757d !important;
                top: 8px !important;
                right: 8px !important;
            }
            
            .photo-gallery {
                max-height: 200px;
                overflow-y: auto;
            }
            
            .view-all-photos {
                text-decoration: none;
                cursor: pointer;
            }
        </style>
    `);

    let map;
    getUtenti();

    // Logout
    $("#logout").on("click", function () {
        localStorage.removeItem("token");
        window.location.href = "/index.html";
    });

    // Sezione Cambia Password
    $("#changePasswordForm").on("submit", async function (e) {
        e.preventDefault();

        const currentPassword = $("#currentPassword").val();
        const newPassword = $("#newPassword").val();
        const confirmPassword = $("#confirmPassword").val();

        if (newPassword !== confirmPassword) {
            alert("La nuova password e la conferma non coincidono.");
            return;
        }

        try {
            const response = await inviaRichiesta("POST", "/api/cambia-password", {
                currentPassword,
                nuovaPassword: newPassword,
            });

            if (response.status === 200) {
                alert(response.data.message || "Password aggiornata con successo.");
                $("#changePasswordForm")[0].reset();
            } else {
                alert(response.err || "Errore durante l'aggiornamento della password.");
            }
        } catch (err) {
            console.error("Errore durante il cambio della password:", err);
            alert("Errore durante la richiesta.");
        }
    });

    // Funzione per ottenere le coordinate di un indirizzo
    async function getCoordinates(uriAddress) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${uriAddress}`;

        const httpResponse = await inviaRichiesta("GET", url);

        if (httpResponse.data.length > 0) {
            return {
                lat: parseFloat(httpResponse.data[0].lat),
                lng: parseFloat(httpResponse.data[0].lon),
            };
        } else {
            throw new Error("Indirizzo non trovato");
        }
    }

    // Inizializzazione della mappa con MapLibre
    async function initializeMap() {
        const address = "Via San Michele 68, Fossano, Italia";
        const uriAddress = encodeURIComponent(address);

        const coords = await getCoordinates(uriAddress).catch((error) => {
            console.error(error);
        });

        if (!coords) {
            alert("Impossibile ottenere le coordinate per l'indirizzo specificato.");
            return;
        }

        console.log("Coordinate:", coords);
        const lat = coords.lat;
        const lng = coords.lng;
        const zoom = 15.95;

        const style = {
            version: 8,
            sources: {
                osm: {
                    type: "raster",
                    tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                    tileSize: 256,
                    maxzoom: 19,
                    minzoom: 11,
                },
            },
            layers: [
                {
                    id: "osm",
                    type: "raster",
                    source: "osm",
                },
            ],
        };

        const mapOptions = {
            container: "map",
            style: style,
            center: [lng, lat],
            zoom: zoom,
        };

        map = new maplibregl.Map(mapOptions);
        map.addControl(new maplibregl.NavigationControl());
        const scaleOptions = { maxWidth: 80, unit: "metric" };
        map.addControl(new maplibregl.ScaleControl(scaleOptions));

        const sedeCentraleMarker = new maplibregl.Marker({ color: "red" })
            .setLngLat([lng, lat])
            .setPopup(new maplibregl.Popup().setHTML("<h4>Sede Centrale</h4>"))
            .addTo(map);

        loadMarkers(map);
    }

    // Funzione per caricare i marker delle perizie
    async function loadMarkers(map) {
        try {
            const response = await inviaRichiesta("GET", "/api/getPerizie");
            console.log("Risposta API:", response);

            const perizie = response.data;

            if (!Array.isArray(perizie)) {
                console.error("La risposta non è un array:", perizie);
                alert("Errore: La risposta del server non è valida.");
                return;
            }

            if (window.markers) {
                window.markers.forEach((marker) => marker.remove());
            }
            window.markers = [];

            perizie.forEach((perizia) => {
                const { latitudine, longitudine } = perizia.coordinate;

                const marker = new maplibregl.Marker()
                    .setLngLat([longitudine, latitudine])
                    .setPopup(new maplibregl.Popup().setHTML(createPopupContent(perizia)))
                    .addTo(map);

                window.markers.push(marker);
            });
        } catch (err) {
            console.error("Errore durante il caricamento delle perizie:", err);
            alert("Errore durante il caricamento delle perizie.");
        }
    }
    // Funzione per creare il contenuto del popup
function createPopupContent(perizia) {
    const { codice_perizia, descrizione, fotografie } = perizia;

    let content = `
    <div class="p-2">
        <h4 class="border-bottom pb-2 text-primary">
            <i class="fas fa-clipboard-check me-2"></i>Perizia: ${codice_perizia}
        </h4>
        
        <div class="mb-3">
            <label for="descrizione" class="form-label fw-bold">
                <i class="fas fa-edit me-1 text-secondary"></i>Modifica descrizione:
            </label>
            <textarea id="descrizione" class="form-control form-control-sm" rows="4" 
                style="width: 100%; border-radius: 6px; border-color: #dee2e6;">${descrizione}</textarea>
        </div>
        
        <h5 class="mt-4 mb-2">
            <i class="fas fa-images me-1 text-secondary"></i>Fotografie:
        </h5>
        <div class="list-group">
`;

    fotografie.forEach((foto, index) => {
        content += `
        <li>
            <img src="${foto.url}" alt="Foto" style="width: 100px; height: auto;" />
            <textarea id="commento-${index}" style="width: 100%; margin-top: 5px;">${foto.commento}</textarea>
        </li>
        `;
    });

    content += `
        </ul>
        <button id="salvaModifiche" 
            data-codice="${codice_perizia}" 
            data-fotografie='${JSON.stringify(fotografie)}'>
            Salva Modifiche
        </button>
    </div>
    `;

    return content;
}
    $(document).on("click", "#salvaModifiche", async function () {
        const codicePerizia = $(this).data("codice");
        const fotografie = $(this).data("fotografie");
        const nuovaDescrizione = $("#descrizione").val();
        const nuoviCommenti = [];

        $("textarea[id^='commento-']").each(function () {
            nuoviCommenti.push($(this).val());
        });

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                alert("Sessione scaduta. Effettua nuovamente il login.");
                window.location.href = "/index.html";
                return;
            }

            const response = await inviaRichiesta("PUT", `/api/updatePerizia/${codicePerizia}`, {
                descrizione: nuovaDescrizione,
                fotografie: nuoviCommenti.map((commento, index) => ({
                    url: fotografie[index].url,
                    commento: commento,
                })),
            }, {
                Authorization: `Bearer ${token}`,
            });

            if (response.status === 200) {
                alert("Modifiche salvate con successo!");

                loadMarkers(map);
            } else {
                alert("Errore durante il salvataggio delle modifiche.");
            }
        } catch (err) {
            console.error("Errore durante il salvataggio delle modifiche:", err);
            alert("Errore durante il salvataggio delle modifiche. Riprova.");
        }
    });

    initializeMap();

    // Gestione del form "Crea Utente"
    $("#createUserForm").on("submit", async function (event) {
        event.preventDefault();

        const nome = $("#nome").val();
        const cognome = $("#cognome").val();
        const email = $("#email").val();
        const telefono = $("#telefono").val();
        const ruolo = $("#ruolo").val();

        if (!nome || !cognome || !email || !telefono || !ruolo) {
            alert("Tutti i campi sono obbligatori.");
            return;
        }

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                alert("Sessione scaduta. Effettua nuovamente il login.");
                window.location.href = "/index.html";
                return;
            }

            let response = await inviaRichiesta("POST", "/api/createUser", {
                nome,
                cognome,
                email,
                telefono,
                ruolo,
            }, {
                Authorization: `Bearer ${token}`,
            });

            if (response.status === 201) {
                alert("Utente creato con successo!");
                $("#createUserForm")[0].reset();
            } else if (response.status === 409) {
                alert("Errore: Utente già esistente.");
            } else {
                alert("Errore: " + response.err);
            }
        } catch (err) {
            console.error("Errore durante la creazione dell'utente:", err);
            alert("Errore durante la creazione dell'utente. Riprova.");
        }
    });

    // Caricamento degli utenti nel filtro
    async function getUtenti() {
        try {
            const response = await inviaRichiesta("GET", "/api/getUtenti");
            console.log("Utenti caricati:", response);
            
            const userFilter = $("#userFilter");
            userFilter.empty();
            userFilter.append(new Option("Tutti", "ALL"));

            response.data.forEach((utente) => {
                if (/Admin/i.test(utente.nome)) {
                    console.log("Utente escluso dal filtro:", utente);
                    return;
                }

                userFilter.append(new Option(`${utente.nome} ${utente.cognome}`, utente._id));
            });

            userFilter.on("change", async function () {
                let selectedUserId = $(this).val(); 
                console.log("Utente selezionato:", selectedUserId);

                if (!selectedUserId || selectedUserId === "ALL") {
                    selectedUserId = "ALL"; 
                }

                selectedUserId = selectedUserId.trim();

                try {
                    const perizieResponse = await inviaRichiesta("GET", `/api/getPerizie?userId=${selectedUserId}`);
                    console.log("Perizie caricate:", perizieResponse);

                    if (perizieResponse.data) {
                        updateMarkers(perizieResponse.data);
                    } else {
                        console.warn("Nessuna perizia trovata.");
                        updateMarkers([]);
                    }
                } catch (err) {
                    console.error("Errore durante il caricamento delle perizie:", err);
                    alert("Errore durante il caricamento delle perizie.");
                }
            });
        } catch (err) {
            console.error("Errore durante il caricamento degli utenti:", err);
            alert("Errore durante il caricamento degli utenti.");
        }
    }

    // Funzione per aggiornare i marker sulla mappa
    function updateMarkers(perizie) {
        if (window.markers) {
            window.markers.forEach((marker) => marker.remove());
        }
        window.markers = [];

        perizie.forEach((perizia) => {
            const { coordinate } = perizia;

            if (!coordinate || !coordinate.latitudine || !coordinate.longitudine) {
                console.warn("Perizia con coordinate non valide:", perizia);
                return; 
            }

            const marker = new maplibregl.Marker()
                .setLngLat([coordinate.longitudine, coordinate.latitudine])
                .setPopup(new maplibregl.Popup().setHTML(createPopupContent(perizia)))
                .addTo(map);

            window.markers.push(marker);
        });
    }

    // Gestione visualizzazione tabella rilievi
    $("#showSurveyList").on("click", function(e) {
        e.preventDefault();
        
        // Aggiorna classe attiva nel menu
        $(".nav-item").removeClass("active");
        $(this).addClass("active");
        
        // Nascondi mappa, mostra tabella
        $(".map-section").hide();
        $("#surveysTableSection").show();
        
        // Carica dati
        loadSurveyTable();
    });

    // Torna alla visualizzazione mappa quando si clicca su panoramica
    $(".nav-item:first").on("click", function(e) {
        e.preventDefault();
        
        // Aggiorna classe attiva nel menu
        $(".nav-item").removeClass("active");
        $(this).addClass("active");
        
        // Mostra mappa, nascondi tabella
        $("#surveysTableSection").hide();
        $(".map-section:first").show();
    });

    // Funzione per caricare i dati nella tabella
    async function loadSurveyTable(userId = "ALL") {
        try {
            const response = await inviaRichiesta("GET", `/api/getPerizie?userId=${userId}`);
            const perizie = response.data;
            const tableBody = $("#surveysTableBody");
            tableBody.empty();
            
            if (!Array.isArray(perizie) || perizie.length === 0) {
                $("#noSurveysMessage").show();
                return;
            }
            
            $("#noSurveysMessage").hide();
            
            perizie.forEach(perizia => {
                const row = `
                    <tr>
                        <td>${perizia.codice_perizia}</td>
                        <td>${new Date(perizia.data || Date.now()).toLocaleDateString()}</td>
                        <td>${formatIndirizzo(perizia.coordinate)}</td>
                        <td>${limitText(perizia.descrizione || "Nessuna descrizione", 50)}</td>
                        <td>${perizia.fotografie ? perizia.fotografie.length : 0} foto</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-survey" data-id="${perizia.codice_perizia}">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tableBody.append(row);
            });
            
            // Popola il filtro utenti nella tabella
            if ($("#tableSurveyFilter option").length <= 1) {
                $("#userFilter option").each(function() {
                    const value = $(this).val();
                    const text = $(this).text();
                    
                    if ($("#tableSurveyFilter option[value='" + value + "']").length === 0) {
                        $("#tableSurveyFilter").append(new Option(text, value));
                    }
                });
            }
        } catch (err) {
            console.error("Errore durante il caricamento delle perizie:", err);
            $("#noSurveysMessage").show();
        }
    }

    // Helper per formattare l'indirizzo dalle coordinate
    function limitText(text, length) {
        if (!text) return "";
        return text.length > length ? text.substring(0, length) + "..." : text;
    }

    // Event listener per la vista dettaglio
    $(document).on("click", ".view-survey", async function() {
        const periziaId = $(this).data("id");
        
        try {
            // Ottieni dettagli della perizia specifica
            const response = await inviaRichiesta("GET", "/api/getPerizie");
            
            // Trova la perizia corrispondente
            const perizia = response.data.find(p => p.codice_perizia === periziaId);
            
            if (perizia) {
                // Popola il modale con i dati
                populateSurveyModal(perizia);
                
                // Mostra il modale
                const surveyModal = new bootstrap.Modal(document.getElementById('surveyDetailModal'));
                surveyModal.show();
            } else {
                alert("Dettagli della perizia non trovati");
            }
        } catch (err) {
            console.error("Errore durante il caricamento dei dettagli della perizia:", err);
            alert("Errore durante il caricamento dei dettagli della perizia.");
        }
    });

    // Aggiorna il filtro della tabella
    $("#tableSurveyFilter").on("change", function() {
        const selectedUserId = $(this).val();
        loadSurveyTable(selectedUserId);
    });

    // Funzione di ricerca nella tabella
    $("#searchSurveys").on("keyup", function() {
        const value = $(this).val().toLowerCase();
        $("#surveysTableBody tr").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
        
        // Mostra messaggio se non ci sono risultati visibili
        if ($("#surveysTableBody tr:visible").length === 0) {
            $("#noSurveysMessage").show();
        } else {
            $("#noSurveysMessage").hide();
        }
    });

    // Gestione visualizzazione tabella utenti
    $("#showUsersList").on("click", function(e) {
        e.preventDefault();
        
        // Aggiorna classe attiva nel menu
        $(".nav-item").removeClass("active");
        $(this).addClass("active");
        
        // Nascondi altre sezioni, mostra tabella utenti
        $(".map-section").hide();
        $("#surveysTableSection").hide();
        $("#usersTableSection").show();
        
        // Carica dati utenti
        loadUsersTable();
    });

    // Funzione per caricare dati nella tabella utenti
    async function loadUsersTable(roleFilter = "ALL") {
        try {
            const response = await inviaRichiesta("GET", "/api/getUtenti");
            console.log("Utenti caricati:", response);
            
            const utenti = response.data;
            const tableBody = $("#usersTableBody");
            tableBody.empty();
            
            if (!Array.isArray(utenti) || utenti.length === 0) {
                $("#noUsersMessage").show();
                return;
            }
            
            $("#noUsersMessage").hide();
            
            let filteredUsers = utenti;
            if (roleFilter !== "ALL") {
                filteredUsers = utenti.filter(user => user.ruolo === roleFilter);
            }
            
            // Modifica la funzione loadUsersTable nel dashboard.js
// Dalla riga che genera la colonna "Azioni"
filteredUsers.forEach(utente => {
    const row = `
        <tr>
            <td><strong>${utente.nome || ''}</strong></td>
            <td>${utente.cognome || ''}</td>
            <td>${utente.email || ''}</td>
            <td>${utente.telefono || ''}</td>
            <td>
                <span class="badge bg-${utente.ruolo === 'ADMIN' ? 'danger' : 'primary'} rounded-pill">
                    ${utente.ruolo === 'ADMIN' ? 'Amministratore' : 'Operatore'}
                </span>
            </td>
            <td>
                <div class="d-flex justify-content-center align-items-center">
                    <button class="btn-action me-2 edit-user" 
                            data-id="${utente._id}" 
                            data-bs-toggle="tooltip" 
                            title="Modifica utente">
                        <i class="fas fa-user-edit"></i>
                    </button>
                    <button class="btn-action delete-user" 
                            data-id="${utente._id}"
                            data-nome="${utente.nome}"
                            data-cognome="${utente.cognome}"
                            data-bs-toggle="tooltip" 
                            title="Elimina utente">
                        <i class="fas fa-user-minus"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    tableBody.append(row);
});
        } catch (err) {
            console.error("Errore durante il caricamento degli utenti:", err);
            $("#noUsersMessage").show();
        }
    }

    // Filtro per ruolo
    $("#userRoleFilter").on("change", function() {
        const selectedRole = $(this).val();
        loadUsersTable(selectedRole);
    });

    // Ricerca utenti
    $("#searchUsers").on("keyup", function() {
        const value = $(this).val().toLowerCase();
        $("#usersTableBody tr").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
        
        if ($("#usersTableBody tr:visible").length === 0) {
            $("#noUsersMessage").show();
        } else {
            $("#noUsersMessage").hide();
        }
    });

    // Gestione modifica utente
    $(document).on("click", ".edit-user", async function() {
        const userId = $(this).data("id");
        
        try {
            const response = await inviaRichiesta("GET", `/api/users/${userId}`);
            const utente = response.data;
            
            if (utente) {
                // Popola form modifica
                $("#editUserId").val(utente._id);
                $("#editNome").val(utente.nome || '');
                $("#editCognome").val(utente.cognome || '');
                $("#editEmail").val(utente.email || '');
                $("#editTelefono").val(utente.telefono || '');
                $("#editRuolo").val(utente.ruolo || 'USER');
                
                // Mostra modal
                const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
                editUserModal.show();
            }
        } catch (err) {
            console.error("Errore durante il recupero dei dati dell'utente:", err);
            alert("Errore durante il recupero dei dati dell'utente.");
        }
    });

    // Salva modifiche utente
    $("#saveUserChanges").on("click", async function() {
        const userId = $("#editUserId").val();
        const userData = {
            nome: $("#editNome").val().trim(),
            cognome: $("#editCognome").val().trim(),
            email: $("#editEmail").val().trim(),
            telefono: $("#editTelefono").val().trim(),
            ruolo: $("#editRuolo").val()
        };
        
        // Aggiungi validazione
        if (!userData.nome || !userData.cognome || !userData.email || !userData.telefono) {
            alert("Tutti i campi sono obbligatori.");
            return;
        }
        
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                alert("Sessione scaduta. Effettua nuovamente il login.");
                window.location.href = "/index.html";
                return;
            }
            
            const response = await inviaRichiesta("PUT", `/api/users/${userId}`, userData, {
                Authorization: `Bearer ${token}`
            });
            
            if (response.status === 200) {
                alert("Utente aggiornato con successo!");
                
                // Chiudi modal e ricarica tabella
                bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
                loadUsersTable($("#userRoleFilter").val());
            } else {
                alert("Errore durante l'aggiornamento dell'utente.");
            }
        } catch (err) {
            console.error("Errore durante l'aggiornamento dell'utente:", err);
            alert("Errore durante l'aggiornamento dell'utente.");
        }
    });

    // Gestione cancellazione utente
    $(document).on("click", ".delete-user", async function() {
        const userId = $(this).data("id");
        const nome = $(this).data("nome");
        const cognome = $(this).data("cognome");
        
        // Miglioramento del messaggio di conferma
        if (!confirm(`Sei sicuro di voler eliminare l'utente ${nome} ${cognome}? Questa azione non può essere annullata.`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                alert("Sessione scaduta. Effettua nuovamente il login.");
                window.location.href = "/index.html";
                return;
            }
            
            // Mostra indicatore di caricamento
            $(this).html('<i class="fas fa-spinner fa-spin"></i>').attr('disabled', true);
            
            const response = await inviaRichiesta("DELETE", `/api/users/${userId}`, {}, {
                Authorization: `Bearer ${token}`
            });
            
            if (response.status === 200) {
                // Animazione di scomparsa della riga
                $(this).closest('tr').fadeOut(400, function() {
                    $(this).remove();
                    loadUsersTable($("#userRoleFilter").val());
                    alert("Utente eliminato con successo!");
                });
            } else {
                // alert("Errore durante l'eliminazione dell'utente.");
                $(this).html('<i class="fas fa-user-minus"></i>').attr('disabled', false);
            }
        } catch (err) {
            // console.error("Errore durante l'eliminazione dell'utente:", err);
            // alert("Errore durante l'eliminazione dell'utente.");
            $(this).html('<i class="fas fa-user-minus"></i>').attr('disabled', false);
        }
    });

    // Esportazione contatti
    $("#exportUsersBtn").on("click", function() {
        // Prepara dati CSV
        let csvContent = "Nome,Cognome,Email,Telefono,Ruolo\n";
        
        $("#usersTableBody tr:visible").each(function() {
            const columns = $(this).find("td");
            const nome = $(columns[1]).text();
            const cognome = $(columns[2]).text();
            const email = $(columns[3]).text();
            const telefono = $(columns[4]).text();
            const ruolo = $(columns[5]).text().trim();
            
            csvContent += `${nome},${cognome},${email},${telefono},${ruolo}\n`;
        });
        
        // Crea link di download
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "utenti_perizie_pro.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    // Salva le modifiche dalla modal dettaglio
$("#saveDetailChanges").on("click", async function() {
    const codicePerizia = $("#detailCodicePerizia").val();
    const fotografie = JSON.parse($("#detailFotografie").val());
    const nuovaDescrizione = $("#detailDescrizione").val();
    const nuoviCommenti = [];
    
    // Raccogli tutti i commenti dalle textarea
    $("textarea[id^='detailCommento-']").each(function(index) {
        nuoviCommenti.push({
            url: fotografie[index].url,
            commento: $(this).val()
        });
    });
    
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("Sessione scaduta. Effettua nuovamente il login.");
            window.location.href = "/index.html";
            return;
        }
        
        const response = await inviaRichiesta("PUT", `/api/updatePerizia/${codicePerizia}`, {
            descrizione: nuovaDescrizione,
            fotografie: nuoviCommenti
        }, {
            Authorization: `Bearer ${token}`,
        });
        
        if (response.status === 200) {
            alert("Modifiche salvate con successo!");
            
            // Chiudi il modale
            bootstrap.Modal.getInstance(document.getElementById('surveyDetailModal')).hide();
            
            // Ricarica i dati
            if ($("#surveysTableSection").is(":visible")) {
                loadSurveyTable($("#tableSurveyFilter").val() || "ALL");
            } else {
                loadMarkers(map);
            }
        } else {
            alert("Errore durante il salvataggio delle modifiche.");
        }
    } catch (err) {
        console.error("Errore durante il salvataggio delle modifiche:", err);
        alert("Errore durante il salvataggio delle modifiche. Riprova.");
    }
});

// Inizializza i tooltip di Bootstrap
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl);
});
});

// Gestore eventi a livello globale

// Funzione per mostrare toast
function showToast(message) {
    $("#toastMessage").text(message);
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();
}

// Rimuovi i gestori esistenti per evitare duplicati
$(document).off("click", ".edit-user");
$(document).off("click", ".delete-user");

// Aggiungi nuovi gestori di eventi
$(document).on("click", ".edit-user", async function() {
    const userId = $(this).data("id");
    console.log("Modifica utente:", userId);
    
    try {
        const response = await inviaRichiesta("GET", `/api/users/${userId}`);
        console.log("Dati utente:", response);
        const utente = response.data;
        
        if (utente) {
            // Popola form modifica
            $("#editUserId").val(utente._id);
            $("#editNome").val(utente.nome || '');
            $("#editCognome").val(utente.cognome || '');
            $("#editEmail").val(utente.email || '');
            $("#editTelefono").val(utente.telefono || '');
            $("#editRuolo").val(utente.ruolo || 'USER');
            
            // Mostra modal
            const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
            editUserModal.show();
        }
    } catch (err) {
        console.error("Errore durante il recupero dei dati dell'utente:", err);
        alert("Errore durante il recupero dei dati dell'utente.");
    }
});

$(document).on("click", ".delete-user", async function() {
    const userId = $(this).data("id");
    const nome = $(this).data("nome");
    const cognome = $(this).data("cognome");
    console.log("Elimina utente:", userId, nome, cognome);
    
    // Miglioramento del messaggio di conferma
    if (!confirm(`Sei sicuro di voler eliminare l'utente ${nome} ${cognome}? Questa azione non può essere annullata.`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("Sessione scaduta. Effettua nuovamente il login.");
            window.location.href = "/index.html";
            return;
        }
        
        // Mostra indicatore di caricamento
        $(this).html('<i class="fas fa-spinner fa-spin"></i>').attr('disabled', true);
        
        const response = await inviaRichiesta("DELETE", `/api/users/${userId}`, {}, {
            Authorization: `Bearer ${token}`
        });
        
        if (response.status === 200) {
            // Animazione di scomparsa della riga
            $(this).closest('tr').fadeOut(400, function() {
                $(this).remove();
                loadUsersTable($("#userRoleFilter").val() || "ALL");
                alert("Utente eliminato con successo!");
            });
        } else {
            alert("Errore durante l'eliminazione dell'utente.");
            $(this).html('<i class="fas fa-user-minus"></i>').attr('disabled', false);
        }
    } catch (err) {
        console.error("Errore durante l'eliminazione dell'utente:", err);
        alert("Errore durante l'eliminazione dell'utente.");
        $(this).html('<i class="fas fa-user-minus"></i>').attr('disabled', false);
    }
});


$(document).on("click", "#salvaModifiche", async function() {
    const btn = $(this);
    const originalText = btn.html();
    
    // Mostra indicatore di caricamento
    btn.html('<i class="fas fa-spinner fa-spin me-1"></i> Salvataggio...').prop('disabled', true);
    
    const codicePerizia = $(this).data("codice");
    const fotografie = $(this).data("fotografie");
    const nuovaDescrizione = $("#descrizione").val();
    const nuoviFotografie = [];

    // Raccogli solo i commenti visibili nel popup
    $("textarea[id^='commento-']").each(function(index) {
        if (index < fotografie.length) {
            nuoviFotografie.push({
                url: fotografie[index].url,
                commento: $(this).val()
            });
        }
    });
    
    // Aggiungi le foto rimanenti senza modificare i commenti
    if (fotografie.length > 2) {
        for (let i = 2; i < fotografie.length; i++) {
            nuoviFotografie.push(fotografie[i]);
        }
    }

    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("Sessione scaduta. Effettua nuovamente il login.");
            window.location.href = "/index.html";
            return;
        }

        const response = await inviaRichiesta("PUT", `/api/updatePerizia/${codicePerizia}`, {
            descrizione: nuovaDescrizione,
            fotografie: nuoviFotografie
        }, {
            Authorization: `Bearer ${token}`,
        });

        if (response.status === 200) {
            // Mostra messaggio di successo
            btn.removeClass('btn-primary').addClass('btn-success');
            btn.html('<i class="fas fa-check me-1"></i> Salvato');
            
            // Torna allo stato originale dopo 2 secondi
            setTimeout(() => {
                btn.html(originalText).removeClass('btn-success').addClass('btn-primary').prop('disabled', false);
            }, 2000);
            
            // Ricarica i marker
            loadMarkers(map);
        } else {
            btn.removeClass('btn-primary').addClass('btn-danger');
            btn.html('<i class="fas fa-exclamation-circle me-1"></i> Errore');
            
            setTimeout(() => {
                btn.html(originalText).removeClass('btn-danger').addClass('btn-primary').prop('disabled', false);
            }, 2000);
        }
    } catch (err) {
        console.error("Errore durante il salvataggio delle modifiche:", err);
        btn.removeClass('btn-primary').addClass('btn-danger');
        btn.html('<i class="fas fa-exclamation-circle me-1"></i> Errore');
        
        setTimeout(() => {
            btn.html(originalText).removeClass('btn-danger').addClass('btn-primary').prop('disabled', false);
        }, 2000);
    }
});

    initializeMap();

    // Gestione del form "Crea Utente"
    $("#createUserForm").on("submit", async function (event) {
        event.preventDefault();

        const nome = $("#nome").val();
        const cognome = $("#cognome").val();
        const email = $("#email").val();
        const telefono = $("#telefono").val();
        const ruolo = $("#ruolo").val();

        if (!nome || !cognome || !email || !telefono || !ruolo) {
            alert("Tutti i campi sono obbligatori.");
            return;
        }

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                alert("Sessione scaduta. Effettua nuovamente il login.");
                window.location.href = "/index.html";
                return;
            }

            let response = await inviaRichiesta("POST", "/api/createUser", {
                nome,
                cognome,
                email,
                telefono,
                ruolo,
            }, {
                Authorization: `Bearer ${token}`,
            });

            if (response.status === 201) {
                alert("Utente creato con successo!");
                $("#createUserForm")[0].reset();
            } else if (response.status === 409) {
                alert("Errore: Utente già esistente.");
            } else {
                alert("Errore: " + response.err);
            }
        } catch (err) {
            console.error("Errore durante la creazione dell'utente:", err);
            alert("Errore durante la creazione dell'utente. Riprova.");
        }
    });

    // Caricamento degli utenti nel filtro
    async function getUtenti() {
        try {
            const response = await inviaRichiesta("GET", "/api/getUtenti");
            console.log("Utenti caricati:", response);
            
            const userFilter = $("#userFilter");
            userFilter.empty();
            userFilter.append(new Option("Tutti", "ALL"));

            response.data.forEach((utente) => {
                if (/Admin/i.test(utente.nome)) {
                    console.log("Utente escluso dal filtro:", utente);
                    return;
                }

                userFilter.append(new Option(`${utente.nome} ${utente.cognome}`, utente._id));
            });

            userFilter.on("change", async function () {
                let selectedUserId = $(this).val(); 
                console.log("Utente selezionato:", selectedUserId);

                if (!selectedUserId || selectedUserId === "ALL") {
                    selectedUserId = "ALL"; 
                }

                selectedUserId = selectedUserId.trim();

                try {
                    const perizieResponse = await inviaRichiesta("GET", `/api/getPerizie?userId=${selectedUserId}`);
                    console.log("Perizie caricate:", perizieResponse);

                    if (perizieResponse.data) {
                        updateMarkers(perizieResponse.data);
                    } else {
                        console.warn("Nessuna perizia trovata.");
                        updateMarkers([]);
                    }
                } catch (err) {
                    console.error("Errore durante il caricamento delle perizie:", err);
                    alert("Errore durante il caricamento delle perizie.");
                }
            });
        } catch (err) {
            console.error("Errore durante il caricamento degli utenti:", err);
            alert("Errore durante il caricamento degli utenti.");
        }
    }

    // Funzione per aggiornare i marker sulla mappa
    function updateMarkers(perizie) {
        if (window.markers) {
            window.markers.forEach((marker) => marker.remove());
        }
        window.markers = [];

        perizie.forEach((perizia) => {
            const { coordinate } = perizia;

            if (!coordinate || !coordinate.latitudine || !coordinate.longitudine) {
                console.warn("Perizia con coordinate non valide:", perizia);
                return; 
            }

            const marker = new maplibregl.Marker()
                .setLngLat([coordinate.longitudine, coordinate.latitudine])
                .setPopup(new maplibregl.Popup().setHTML(createPopupContent(perizia)))
                .addTo(map);

            window.markers.push(marker);
        });
    }

    // Gestione visualizzazione tabella rilievi
    $("#showSurveyList").on("click", function(e) {
        e.preventDefault();
        
        // Aggiorna classe attiva nel menu
        $(".nav-item").removeClass("active");
        $(this).addClass("active");
        
        // Nascondi mappa, mostra tabella
        $(".map-section").hide();
        $("#surveysTableSection").show();
        
        // Carica dati
        loadSurveyTable();
    });

    // Torna alla visualizzazione mappa quando si clicca su panoramica
    $(".nav-item:first").on("click", function(e) {
        e.preventDefault();
        
        // Aggiorna classe attiva nel menu
        $(".nav-item").removeClass("active");
        $(this).addClass("active");
        
        // Mostra mappa, nascondi tabella
        $("#surveysTableSection").hide();
        $(".map-section:first").show();
    });

    // Funzione per caricare i dati nella tabella
    async function loadSurveyTable(userId = "ALL") {
        try {
            const response = await inviaRichiesta("GET", `/api/getPerizie?userId=${userId}`);
            const perizie = response.data;
            const tableBody = $("#surveysTableBody");
            tableBody.empty();
            
            if (!Array.isArray(perizie) || perizie.length === 0) {
                $("#noSurveysMessage").show();
                return;
            }
            
            $("#noSurveysMessage").hide();
            
            perizie.forEach(perizia => {
                const row = `
                    <tr>
                        <td>${perizia.codice_perizia}</td>
                        <td>${new Date(perizia.data || Date.now()).toLocaleDateString()}</td>
                        <td>${formatIndirizzo(perizia.coordinate)}</td>
                        <td>${limitText(perizia.descrizione || "Nessuna descrizione", 50)}</td>
                        <td>${perizia.fotografie ? perizia.fotografie.length : 0} foto</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-survey" data-id="${perizia.codice_perizia}">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tableBody.append(row);
            });
            
            // Popola il filtro utenti nella tabella
            if ($("#tableSurveyFilter option").length <= 1) {
                $("#userFilter option").each(function() {
                    const value = $(this).val();
                    const text = $(this).text();
                    
                    if ($("#tableSurveyFilter option[value='" + value + "']").length === 0) {
                        $("#tableSurveyFilter").append(new Option(text, value));
                    }
                });
            }
        } catch (err) {
            console.error("Errore durante il caricamento delle perizie:", err);
            $("#noSurveysMessage").show();
        }
    }

    // Helper per formattare l'indirizzo dalle coordinate
    function limitText(text, length) {
        if (!text) return "";
        return text.length > length ? text.substring(0, length) + "..." : text;
    }

    // Event listener per la vista dettaglio
    $(document).on("click", ".view-survey", async function() {
        const periziaId = $(this).data("id");
        
        try {
            // Ottieni dettagli della perizia specifica
            const response = await inviaRichiesta("GET", "/api/getPerizie");
            
            // Trova la perizia corrispondente
            const perizia = response.data.find(p => p.codice_perizia === periziaId);
            
            if (perizia) {
                // Popola il modale con i dati
                populateSurveyModal(perizia);
                
                // Mostra il modale
                const surveyModal = new bootstrap.Modal(document.getElementById('surveyDetailModal'));
                surveyModal.show();
            } else {
                alert("Dettagli della perizia non trovati");
            }
        } catch (err) {
            console.error("Errore durante il caricamento dei dettagli della perizia:", err);
            alert("Errore durante il caricamento dei dettagli della perizia.");
        }
    });

    // Aggiorna il filtro della tabella
    $("#tableSurveyFilter").on("change", function() {
        const selectedUserId = $(this).val();
        loadSurveyTable(selectedUserId);
    });

    // Funzione di ricerca nella tabella
    $("#searchSurveys").on("keyup", function() {
        const value = $(this).val().toLowerCase();
        $("#surveysTableBody tr").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
        
        // Mostra messaggio se non ci sono risultati visibili
        if ($("#surveysTableBody tr:visible").length === 0) {
            $("#noSurveysMessage").show();
        } else {
            $("#noSurveysMessage").hide();
        }
    });

    // Gestione visualizzazione tabella utenti
    $("#showUsersList").on("click", function(e) {
        e.preventDefault();
        
        // Aggiorna classe attiva nel menu
        $(".nav-item").removeClass("active");
        $(this).addClass("active");
        
        // Nascondi altre sezioni, mostra tabella utenti
        $(".map-section").hide();
        $("#surveysTableSection").hide();
        $("#usersTableSection").show();
        
        // Carica dati utenti
        loadUsersTable();
    });

    // Funzione per caricare dati nella tabella utenti
    async function loadUsersTable(roleFilter = "ALL") {
        try {
            const response = await inviaRichiesta("GET", "/api/getUtenti");
            console.log("Utenti caricati:", response);
            
            const utenti = response.data;
            const tableBody = $("#usersTableBody");
            tableBody.empty();
            
            if (!Array.isArray(utenti) || utenti.length === 0) {
                $("#noUsersMessage").show();
                return;
            }
            
            $("#noUsersMessage").hide();
            
            let filteredUsers = utenti;
            if (roleFilter !== "ALL") {
                filteredUsers = utenti.filter(user => user.ruolo === roleFilter);
            }
            
            // Modifica la funzione loadUsersTable nel dashboard.js
// Dalla riga che genera la colonna "Azioni"
filteredUsers.forEach(utente => {
    const row = `
        <tr>
            <td><strong>${utente.nome || ''}</strong></td>
            <td>${utente.cognome || ''}</td>
            <td>${utente.email || ''}</td>
            <td>${utente.telefono || ''}</td>
            <td>
                <span class="badge bg-${utente.ruolo === 'ADMIN' ? 'danger' : 'primary'} rounded-pill">
                    ${utente.ruolo === 'ADMIN' ? 'Amministratore' : 'Operatore'}
                </span>
            </td>
            <td>
                <div class="d-flex justify-content-center align-items-center">
                    <button class="btn-action me-2 edit-user" 
                            data-id="${utente._id}" 
                            data-bs-toggle="tooltip" 
                            title="Modifica utente">
                        <i class="fas fa-user-edit"></i>
                    </button>
                    <button class="btn-action delete-user" 
                            data-id="${utente._id}"
                            data-nome="${utente.nome}"
                            data-cognome="${utente.cognome}"
                            data-bs-toggle="tooltip" 
                            title="Elimina utente">
                        <i class="fas fa-user-minus"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    tableBody.append(row);
});
        } catch (err) {
            console.error("Errore durante il caricamento degli utenti:", err);
            $("#noUsersMessage").show();
        }
    }

    // Filtro per ruolo
    $("#userRoleFilter").on("change", function() {
        const selectedRole = $(this).val();
        loadUsersTable(selectedRole);
    });

    // Ricerca utenti
    $("#searchUsers").on("keyup", function() {
        const value = $(this).val().toLowerCase();
        $("#usersTableBody tr").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
        
        if ($("#usersTableBody tr:visible").length === 0) {
            $("#noUsersMessage").show();
        } else {
            $("#noUsersMessage").hide();
        }
    });

    // Gestione modifica utente
    $(document).on("click", ".edit-user", async function() {
        const userId = $(this).data("id");
        
        try {
            const response = await inviaRichiesta("GET", `/api/users/${userId}`);
            const utente = response.data;
            
            if (utente) {
                // Popola form modifica
                $("#editUserId").val(utente._id);
                $("#editNome").val(utente.nome || '');
                $("#editCognome").val(utente.cognome || '');
                $("#editEmail").val(utente.email || '');
                $("#editTelefono").val(utente.telefono || '');
                $("#editRuolo").val(utente.ruolo || 'USER');
                
                // Mostra modal
                const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
                editUserModal.show();
            }
        } catch (err) {
            console.error("Errore durante il recupero dei dati dell'utente:", err);
            alert("Errore durante il recupero dei dati dell'utente.");
        }
    });

    // Salva modifiche utente
    $("#saveUserChanges").on("click", async function() {
        const userId = $("#editUserId").val();
        const userData = {
            nome: $("#editNome").val().trim(),
            cognome: $("#editCognome").val().trim(),
            email: $("#editEmail").val().trim(),
            telefono: $("#editTelefono").val().trim(),
            ruolo: $("#editRuolo").val()
        };
        
        // Aggiungi validazione
        if (!userData.nome || !userData.cognome || !userData.email || !userData.telefono) {
            alert("Tutti i campi sono obbligatori.");
            return;
        }
        
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                alert("Sessione scaduta. Effettua nuovamente il login.");
                window.location.href = "/index.html";
                return;
            }
            
            const response = await inviaRichiesta("PUT", `/api/users/${userId}`, userData, {
                Authorization: `Bearer ${token}`
            });
            
            if (response.status === 200) {
                alert("Utente aggiornato con successo!");
                
                // Chiudi modal e ricarica tabella
                bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
                loadUsersTable($("#userRoleFilter").val());
            } else {
                alert("Errore durante l'aggiornamento dell'utente.");
            }
        } catch (err) {
            console.error("Errore durante l'aggiornamento dell'utente:", err);
            alert("Errore durante l'aggiornamento dell'utente.");
        }
    });

    // Gestione cancellazione utente
    $(document).on("click", ".delete-user", async function() {
        const userId = $(this).data("id");
        const nome = $(this).data("nome");
        const cognome = $(this).data("cognome");
        
        // Miglioramento del messaggio di conferma
        if (!confirm(`Sei sicuro di voler eliminare l'utente ${nome} ${cognome}? Questa azione non può essere annullata.`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                alert("Sessione scaduta. Effettua nuovamente il login.");
                window.location.href = "/index.html";
                return;
            }
            
            // Mostra indicatore di caricamento
            $(this).html('<i class="fas fa-spinner fa-spin"></i>').attr('disabled', true);
            
            const response = await inviaRichiesta("DELETE", `/api/users/${userId}`, {}, {
                Authorization: `Bearer ${token}`
            });
            
            if (response.status === 200) {
                // Animazione di scomparsa della riga
                $(this).closest('tr').fadeOut(400, function() {
                    $(this).remove();
                    loadUsersTable($("#userRoleFilter").val());
                    alert("Utente eliminato con successo!");
                });
            } else {
                // alert("Errore durante l'eliminazione dell'utente.");
                $(this).html('<i class="fas fa-user-minus"></i>').attr('disabled', false);
            }
        } catch (err) {
            // console.error("Errore durante l'eliminazione dell'utente:", err);
            // alert("Errore durante l'eliminazione dell'utente.");
            $(this).html('<i class="fas fa-user-minus"></i>').attr('disabled', false);
        }
    });

    // Esportazione contatti
    $("#exportUsersBtn").on("click", function() {
        // Prepara dati CSV
        let csvContent = "Nome,Cognome,Email,Telefono,Ruolo\n";
        
        $("#usersTableBody tr:visible").each(function() {
            const columns = $(this).find("td");
            const nome = $(columns[1]).text();
            const cognome = $(columns[2]).text();
            const email = $(columns[3]).text();
            const telefono = $(columns[4]).text();
            const ruolo = $(columns[5]).text().trim();
            
            csvContent += `${nome},${cognome},${email},${telefono},${ruolo}\n`;
        });
        
        // Crea link di download
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "utenti_perizie_pro.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    // Salva le modifiche dalla modal dettaglio
$("#saveDetailChanges").on("click", async function() {
    const codicePerizia = $("#detailCodicePerizia").val();
    const fotografie = JSON.parse($("#detailFotografie").val());
    const nuovaDescrizione = $("#detailDescrizione").val();
    const nuoviCommenti = [];
    
    // Raccogli tutti i commenti dalle textarea
    $("textarea[id^='detailCommento-']").each(function(index) {
        nuoviCommenti.push({
            url: fotografie[index].url,
            commento: $(this).val()
        });
    });
    
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("Sessione scaduta. Effettua nuovamente il login.");
            window.location.href = "/index.html";
            return;
        }
        
        const response = await inviaRichiesta("PUT", `/api/updatePerizia/${codicePerizia}`, {
            descrizione: nuovaDescrizione,
            fotografie: nuoviCommenti
        }, {
            Authorization: `Bearer ${token}`,
        });
        
        if (response.status === 200) {
            alert("Modifiche salvate con successo!");
            
            // Chiudi il modale
            bootstrap.Modal.getInstance(document.getElementById('surveyDetailModal')).hide();
            
            // Ricarica i dati
            if ($("#surveysTableSection").is(":visible")) {
                loadSurveyTable($("#tableSurveyFilter").val() || "ALL");
            } else {
                loadMarkers(map);
            }
        } else {
            alert("Errore durante il salvataggio delle modifiche.");
        }
    } catch (err) {
        console.error("Errore durante il salvataggio delle modifiche:", err);
        alert("Errore durante il salvataggio delle modifiche. Riprova.");
    }
});

// Inizializza i tooltip di Bootstrap
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl);
});


// Gestore eventi a livello globale

// Funzione per mostrare toast
function showToast(message) {
    $("#toastMessage").text(message);
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();
}

// Rimuovi i gestori esistenti per evitare duplicati
$(document).off("click", ".edit-user");
$(document).off("click", ".delete-user");

// Aggiungi nuovi gestori di eventi
$(document).on("click", ".edit-user", async function() {
    const userId = $(this).data("id");
    console.log("Modifica utente:", userId);
    
    try {
        const response = await inviaRichiesta("GET", `/api/users/${userId}`);
        console.log("Dati utente:", response);
        const utente = response.data;
        
        if (utente) {
            // Popola form modifica
            $("#editUserId").val(utente._id);
            $("#editNome").val(utente.nome || '');
            $("#editCognome").val(utente.cognome || '');
            $("#editEmail").val(utente.email || '');
            $("#editTelefono").val(utente.telefono || '');
            $("#editRuolo").val(utente.ruolo || 'USER');
            
            // Mostra modal
            const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
            editUserModal.show();
        }
    } catch (err) {
        console.error("Errore durante il recupero dei dati dell'utente:", err);
        alert("Errore durante il recupero dei dati dell'utente.");
    }
});

$(document).on("click", ".delete-user", async function() {
    const userId = $(this).data("id");
    const nome = $(this).data("nome");
    const cognome = $(this).data("cognome");
    console.log("Elimina utente:", userId, nome, cognome);
    
    // Miglioramento del messaggio di conferma
    if (!confirm(`Sei sicuro di voler eliminare l'utente ${nome} ${cognome}? Questa azione non può essere annullata.`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("Sessione scaduta. Effettua nuovamente il login.");
            window.location.href = "/index.html";
            return;
        }
        
        // Mostra indicatore di caricamento
        $(this).html('<i class="fas fa-spinner fa-spin"></i>').attr('disabled', true);
        
        const response = await inviaRichiesta("DELETE", `/api/users/${userId}`, {}, {
            Authorization: `Bearer ${token}`
        });
        
        if (response.status === 200) {
            // Animazione di scomparsa della riga
            $(this).closest('tr').fadeOut(400, function() {
                $(this).remove();
                loadUsersTable($("#userRoleFilter").val() || "ALL");
                alert("Utente eliminato con successo!");
            });
        } else {
            alert("Errore durante l'eliminazione dell'utente.");
            $(this).html('<i class="fas fa-user-minus"></i>').attr('disabled', false);
        }
    } catch (err) {
        console.error("Errore durante l'eliminazione dell'utente:", err);
        alert("Errore durante l'eliminazione dell'utente.");
        $(this).html('<i class="fas fa-user-minus"></i>').attr('disabled', false);
    }
});

