/* Fichier : script.js (CHEF D'ORCHESTRE - VERSION MODULAIRE) */

// 1. IMPORTS (On récupère nos outils)
import { auth } from './js/config.js'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import * as Utils from './js/utils.js';
import * as PDF from './js/pdf_admin.js';
import * as Clients from './js/client_manager.js';
import * as Stock from './js/stock_manager.js';

// 2. BRANCHEMENT (C'est ici qu'on réactive les boutons !)
window.genererPouvoir = PDF.genererPouvoir;
window.genererDeclaration = PDF.genererDeclaration;
window.genererDemandeInhumation = PDF.genererDemandeInhumation;
window.genererDemandeCremation = PDF.genererDemandeCremation;
window.genererDemandeRapatriement = PDF.genererDemandeRapatriement;
window.genererDemandeFermetureMairie = PDF.genererDemandeFermetureMairie;
window.genererDemandeOuverture = PDF.genererDemandeOuverture;
window.genererFermeture = PDF.genererFermeture;
window.genererTransport = PDF.genererTransport;

// Fonctions Clients
window.ouvrirDossier = ouvrirDossier;
window.supprimerDossier = Clients.supprimerDossier;
window.sauvegarderDossier = Clients.sauvegarderDossier;
window.chargerBaseClients = Clients.chargerBaseClients; 

// Fonctions Stock
window.ajouterArticle = Stock.ajouterArticle;
window.supprimerArticle = Stock.supprimerArticle;
window.mouvementStock = Stock.mouvementStock;
window.chargerStock = Stock.chargerStock; 
window.ajouterArticleStock = Stock.ajouterArticle; // Alias pour compatibilité

// Outils UI (Fonctions d'affichage)
window.openAjoutStock = function() {
    document.getElementById('form-stock').classList.remove('hidden');
    document.getElementById('st_nom').value = "";
    document.getElementById('st_qte').value = "1";
};

// 3. GESTION DE L'AUTHENTIFICATION & NAVIGATION
const loginScreen = document.getElementById('login-screen');
const appLoader = document.getElementById('app-loader');

onAuthStateChanged(auth, (user) => {
    if (user) {
        // CONNECTÉ
        if(loginScreen) loginScreen.classList.add('hidden');
        if(appLoader) appLoader.style.display = 'none';
        
        // On charge les données
        Utils.chargerLogoBase64();
        Clients.chargerBaseClients();
        Stock.chargerStock();
        
        // Gestion de l'heure
        setInterval(() => {
            const now = new Date();
            const elTime = document.getElementById('header-time');
            const elDate = document.getElementById('header-date');
            if(elTime) elTime.innerText = now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            if(elDate) elDate.innerText = now.toLocaleDateString('fr-FR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
        }, 1000);

    } else {
        // DÉCONNECTÉ
        if(loginScreen) loginScreen.classList.remove('hidden');
        if(appLoader) appLoader.style.display = 'none';
    }
});

// Connexion / Déconnexion
window.loginFirebase = async function() {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
    } catch (e) { alert("Erreur connexion : " + e.message); }
};

window.logoutFirebase = async function() {
    if(confirm("Se déconnecter ?")) { await signOut(auth); window.location.reload(); }
};

// 4. NAVIGATION (Afficher Accueil, Admin, Stock...)
window.showSection = function(sectionId) {
    // Cacher toutes les vues
    ['home', 'admin', 'base', 'stock'].forEach(id => {
        const el = document.getElementById('view-' + id);
        if(el) el.classList.add('hidden');
    });
    
    // Afficher la cible
    const target = document.getElementById('view-' + sectionId);
    if(target) target.classList.remove('hidden');
    
    // Recharger les données si besoin
    if(sectionId === 'base') Clients.chargerBaseClients();
    if(sectionId === 'stock') Stock.chargerStock();
};

// Fonction Ouvrir Dossier (Nouveau ou Existant)
function ouvrirDossier(id = null) {
    document.getElementById('dossier_id').value = id || "";
    // Si ID vide = Nouveau dossier (reset champs)
    if(!id) {
        document.querySelectorAll('#view-admin input').forEach(i => i.value = "");
        document.getElementById('prestation').selectedIndex = 0;
        document.getElementById('faita').value = "PERPIGNAN";
        document.getElementById('dateSignature').valueAsDate = new Date();
    }
    // Note : Pour l'édition d'un dossier existant, il faudrait ajouter ici l'appel à Clients.chargerDossier(id)
    // Pour l'instant, cela ouvre juste le formulaire.
    window.showSection('admin');
}

// Fonction Onglets Admin
window.switchAdminTab = function(tabName) {
    document.getElementById('tab-content-identite').classList.add('hidden');
    document.getElementById('tab-content-technique').classList.add('hidden');
    document.getElementById('tab-btn-identite').classList.remove('active');
    document.getElementById('tab-btn-technique').classList.remove('active');
    
    document.getElementById('tab-content-' + tabName).classList.remove('hidden');
    document.getElementById('tab-btn-' + tabName).classList.add('active');
};

// Toggle Sections (Inhumation/Crémation...)
window.toggleSections = function() {
    const type = document.getElementById('prestation').value;
    document.querySelectorAll('.specific-block').forEach(el => el.classList.add('hidden'));
    
    if(type === 'Inhumation') document.getElementById('bloc_inhumation').classList.remove('hidden');
    if(type === 'Crémation') document.getElementById('bloc_cremation').classList.remove('hidden');
    if(type === 'Rapatriement') document.getElementById('bloc_rapatriement').classList.remove('hidden');
};

// Toggle Police
window.togglePolice = function() {
    const val = document.getElementById('type_presence_select').value;
    document.getElementById('police_fields').classList.toggle('hidden', val !== 'police');
    document.getElementById('famille_fields').classList.toggle('hidden', val === 'police');
};

// Menu Mobile
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    if(sidebar) sidebar.classList.toggle('mobile-open');
};
