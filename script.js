/* script.js - DOIT ÊTRE À LA RACINE DU SITE */

// 1. IMPORT DEPUIS LE DOSSIER JS
import { auth } from './js/config.js'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import * as Utils from './js/utils.js';
import * as PDF from './js/pdf_admin.js';
import * as Clients from './js/client_manager.js';
import * as Stock from './js/stock_manager.js';

// 2. EXPOSITION GLOBALE (Pour que les boutons HTML marchent)
window.genererPouvoir = PDF.genererPouvoir;
window.genererDeclaration = PDF.genererDeclaration;
window.genererDemandeInhumation = PDF.genererDemandeInhumation;
window.genererDemandeCremation = PDF.genererDemandeCremation;
window.genererDemandeRapatriement = PDF.genererDemandeRapatriement;
window.genererDemandeFermetureMairie = PDF.genererDemandeFermetureMairie;
window.genererDemandeOuverture = PDF.genererDemandeOuverture;
window.genererFermeture = PDF.genererFermeture;
window.genererTransport = PDF.genererTransport;

window.ouvrirDossier = ouvrirDossier;
window.supprimerDossier = Clients.supprimerDossier;
window.sauvegarderDossier = Clients.sauvegarderDossier;
window.chargerBaseClients = Clients.chargerBaseClients; 
window.chargerDossier = Clients.chargerDossier;

window.ajouterArticleStock = Stock.ajouterArticle;
window.supprimerArticle = Stock.supprimerArticle;
window.mouvementStock = Stock.mouvementStock;
window.chargerStock = Stock.chargerStock; 
window.updateStock = Stock.mouvementStock; // Alias pour compatibilité

// 3. FONCTIONS UI
window.openAjoutStock = function() {
    document.getElementById('form-stock').classList.remove('hidden');
    document.getElementById('st_nom').value = "";
    document.getElementById('st_qte').value = "1";
};

// Gestion Auth
const loginScreen = document.getElementById('login-screen');
const appLoader = document.getElementById('app-loader');

onAuthStateChanged(auth, (user) => {
    if (user) {
        if(loginScreen) loginScreen.classList.add('hidden');
        if(appLoader) appLoader.style.display = 'none';
        
        Utils.chargerLogoBase64();
        Clients.chargerBaseClients();
        Stock.chargerStock();
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

// Navigation
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

window.toggleSections = function() {
    const type = document.getElementById('prestation').value;
    document.querySelectorAll('.specific-block').forEach(el => el.classList.add('hidden')); // Si vous utilisez cette classe
    document.getElementById('btn_inhumation').classList.add('hidden');
    document.getElementById('btn_cremation').classList.add('hidden');
    document.getElementById('btn_rapatriement').classList.add('hidden');
    
    if(type === 'Inhumation') document.getElementById('btn_inhumation').classList.remove('hidden');
    if(type === 'Crémation') document.getElementById('btn_cremation').classList.remove('hidden');
    if(type === 'Rapatriement') document.getElementById('btn_rapatriement').classList.remove('hidden');
};

window.togglePolice = function() {
    const val = document.getElementById('type_presence_select').value;
    const police = document.getElementById('police_fields');
    const famille = document.getElementById('famille_fields');
    if(police) police.classList.toggle('hidden', val !== 'police');
    if(famille) famille.classList.toggle('hidden', val === 'police');
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

// LA FONCTION DU MENU MOBILE (CORRIGÉE)
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if(sidebar) {
        sidebar.classList.toggle('mobile-open');
        if(overlay) overlay.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none';
    }
};
