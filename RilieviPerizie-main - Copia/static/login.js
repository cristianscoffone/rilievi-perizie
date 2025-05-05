'use strict';

$(document).ready(function () {
    $("#loginForm").on("submit", async function (event) {
        event.preventDefault();

        const nome = $("#nome").val();
        const cognome = $("#cognome").val();
        const password = $("#password").val();

        if (!nome || !cognome || !password) {
            $("#errorMessage").text("Tutti i campi sono obbligatori.");
            return;
        }

        const username = `${nome.toLowerCase()}.${cognome.toLowerCase()}`;

        try {
            console.log("Invio richiesta di login...");
            let response = await inviaRichiesta("POST", "/api/login", { username, password });
            console.log("Risposta ricevuta:", response);

            if (response.status === 200) {
                if (response.data.token) {
                    localStorage.setItem("authToken", response.data.token);
                    console.log("Token salvato:", response.data.token);
                }

                if (response.data.redirect) {
                    window.location.href = response.data.redirect;
                } else {
                    console.error("Nessun redirect specificato nella risposta.");
                }
            } else {
                console.error("Errore dal server:", response.err);
                $("#errorMessage").text("Errore: " + response.err);
            }
        } catch (err) {
            console.error("Errore durante il login:", err);
            $("#errorMessage").text("Credenziali non valide o errore di connessione. Riprova.");
        }
    });
});