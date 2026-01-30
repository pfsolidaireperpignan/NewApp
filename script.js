/* script.js (RACINE) */

// 1. IMPORTS DEPUIS LE DOSSIER JS/
import { auth } from './js/config.js'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import * as Utils from './js/utils.js';
import * as PDF from './js/pdf_admin.js';
import * as Clients from './js/client_manager.js';
import * as Stock from './js/stock_manager.js';

// 2. EXPOSITION GLOBALE DES FONCTIONS
// PDF
window.genererPouvoir = PDF.genererPouvoir;
window.genererDeclaration = PDF.genererDeclaration;
window.genererDemandeInhumation = PDF.genererDemandeInhumation;
window.genererDemandeCremation = PDF.genererDemandeCremation;
window.genererDemandeRapatriement = PDF.genererDemandeRapatriement;
window.genererDemandeFermetureMairie = PDF.genererDemandeFermetureMairie;
window.genererDemandeOuverture = PDF.genererDemandeOuverture;
window.genererFermeture = PDF.genererFermeture;
window.genererTransport = PDF.genererTransport;

// CLIENTS
window.ouvrirDossier = ouvrirDossier;
window.supprimerDossier = Clients.supprimerDossier;
window.sauvegarderDossier = Clients.sauvegarderDossier;
window.chargerBaseClients = Clients.chargerBaseClients; 
window.chargerDossier = Clients.chargerDossier;

// STOCKS
window.ajouterArticleStock = Stock.ajouterArticle;
window.supprimerArticle = Stock.supprimerArticle;
window.mouvementStock = Stock.mouvementStock;
window.chargerStock = Stock.chargerStock; 
window.updateStock = Stock.mouvementStock; 

// UI
window.openAjoutStock = function() {
    document.getElementById('form-stock').classList.remove('hidden');
    document.getElementById('st_nom').value = "";
    document.getElementById('st_qte').value = "1";
};

// 3. AUTHENTIFICATION
const loginScreen = document.getElementById('login-screen');
const appLoader = document.getElementById('app-loader');

onAuthStateChanged(auth, (user) => {
    if (user) {
        if(loginScreen) loginScreen.classList.add('hidden');
        if(appLoader) appLoader.style.display = 'none';
        Utils.chargerLogoBase64();
        Clients.chargerBaseClients();
        Stock.chargerStock();
        
        // Date Heure
        setInterval(() => {
            const now = new Date();
            const elTime = document.getElementById('header-time');
            const elDate = document.getElementById('header-date');
            if(elTime) elTime.innerText = now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            if(elDate) elDate.innerText = now.toLocaleDateString('fr-FR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
        }, 1000);
    } else {
        if(loginScreen) loginScreen.classList.remove('hidden');
        if(appLoader) appLoader.style.display = 'none';
    }
});

window.loginFirebase = async function() {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
    } catch (e) { alert("Erreur connexion : " + e.message); }
};

window.logoutFirebase = async function() {
    if(confirm("Se déconnecter ?")) { await signOut(auth); window.location.reload(); }
};

// 4. NAVIGATION
window.showSection = function(sectionId) {
    ['home', 'admin', 'base', 'stock'].forEach(id => {
        const el = document.getElementById('view-' + id);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById('view-' + sectionId);
    if(target) target.classList.remove('hidden');
    
    if(sectionId === 'base') Clients.chargerBaseClients();
    if(sectionId === 'stock') Stock.chargerStock();
};

window.switchAdminTab = function(tabName) {
    document.getElementById('tab-content-identite').classList.add('hidden');
    document.getElementById('tab-content-technique').classList.add('hidden');
    document.getElementById('tab-btn-identite').classList.remove('active');
    document.getElementById('tab-btn-technique').classList.remove('active');
    document.getElementById('tab-content-' + tabName).classList.remove('hidden');
    document.getElementById('tab-btn-' + tabName).classList.add('active');
};

// 5. LOGIQUE FORMULAIRE ADMIN
window.toggleSections = function() {
    const type = document.getElementById('prestation').value;
    document.querySelectorAll('.specific-block').forEach(el => el.classList.add('hidden')); 
    document.getElementById('btn_inhumation').classList.add('hidden');
    document.getElementById('btn_cremation').classList.add('hidden');
    document.getElementById('btn_rapatriement').classList.add('hidden');
    
    if(type === 'Inhumation') {
        document.getElementById('bloc_inhumation').classList.remove('hidden');
        document.getElementById('btn_inhumation').classList.remove('hidden');
    }
    if(type === 'Crémation') {
        document.getElementById('bloc_cremation').classList.remove('hidden');
        document.getElementById('btn_cremation').classList.remove('hidden');
    }
    if(type === 'Rapatriement') {
        document.getElementById('bloc_rapatriement').classList.remove('hidden');
        document.getElementById('btn_rapatriement').classList.remove('hidden');
    }
};

window.togglePolice = function() {
    const val = document.getElementById('type_presence_select').value;
    document.getElementById('police_fields').classList.toggle('hidden', val !== 'police');
    document.getElementById('famille_fields').classList.toggle('hidden', val === 'police');
};

window.toggleVol2 = function() {
    const chk = document.getElementById('check_vol2');
    if(chk) document.getElementById('bloc_vol2').classList.toggle('hidden', !chk.checked);
};

window.viderFormulaire = function() {
    if(confirm("Tout effacer ?")) ouvrirDossier(null);
};

function ouvrirDossier(id = null) {
    document.getElementById('dossier_id').value = id || "";
    if(!id) {
        document.querySelectorAll('#view-admin input').forEach(i => i.value = "");
        document.getElementById('prestation').selectedIndex = 0;
        window.toggleSections();
    }
    window.showSection('admin');
}

// 6. MENU MOBILE (FONCTION CORRIGÉE)
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if(sidebar) {
        sidebar.classList.toggle('mobile-open');
        if(overlay) overlay.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none';
    }
};
