'use strict';
$(document).ready(function () {
    getUtenti();
    async function getUtenti(){
        let response = await inviaRichiesta("GET", "/api/utenti");
        if(response.status==200){
            console.log(response.data);
            for(let utente of response.data){

            }
        }
        else
            alert("Errore: " + response.err);
        
    }
});