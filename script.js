/* Fichier : script.js (À LA RACINE DU PROJET) */

// 1. IMPORTS (On va chercher les outils dans le dossier js)
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
window.chargerBaseClients = Clients.chargerBaseClients; // Important pour le bouton "Actualiser"

// Fonctions Stock
window.ajouterArticle = Stock.ajouterArticle;
window.supprimerArticle = Stock.supprimerArticle;
window.mouvementStock = Stock.mouvementStock;
window.chargerStock = Stock.chargerStock; // Important pour le bouton "Stock"

// Outils UI
window.openAjoutStock = function() {
    document.getElementById('form-stock').classList.remove('hidden');
    // Reset champs
    document.getElementById('st_nom').value = "";
    document.getElementById('st_qte').value = "1";
};

// 3. GESTION DE L'AUTHENTIFICATION
const loginScreen = document.getElementById('login-screen');
const mainContent = document.querySelector('.main-content'); // Sélecteur corrigé
const loader = document.getElementById('app-loader');

onAuthStateChanged(auth, (user) => {
    if (user) {
        // CONNECTÉ
        if(loginScreen) loginScreen.classList.add('hidden');
        if(mainContent) mainContent.classList.remove('hidden');
        if(loader) loader.style.display = 'none';
        
        // Démarrage : On charge le logo et les listes
        Utils.chargerLogoBase64();
        Clients.chargerBaseClients();
        Stock.chargerStock();
        
    } else {
        // DÉCONNECTÉ
        if(loginScreen) loginScreen.classList.remove('hidden');
        if(mainContent) mainContent.classList.add('hidden');
        if(loader) loader.style.display = 'none';
    }
});

window.loginFirebase = async function() {
    const email = document.getElementById('login-email').value; // ID corrigé selon votre HTML
    const pass = document.getElementById('login-password').value; // ID corrigé selon votre HTML
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert("Erreur connexion : " + e.message);
    }
};

window.logoutFirebase = async function() {
    if(confirm("Se déconnecter ?")) {
        await signOut(auth);
        window.location.reload();
    }
};

// 4. NAVIGATION (Pour afficher/cacher les sections)
window.showSection = function(sectionId) {
    // 1. Cacher toutes les vues (IDs basés sur votre HTML)
    document.getElementById('view-home').classList.add('hidden');
    document.getElementById('view-admin').classList.add('hidden');
    document.getElementById('view-base').classList.add('hidden');
    document.getElementById('view-stock').classList.add('hidden');
    
    // 2. Afficher la cible
    const target = document.getElementById('view-' + sectionId);
    if(target) target.classList.remove('hidden');
    
    // 3. Actualiser les données si nécessaire
    if(sectionId === 'base') Clients.chargerBaseClients();
    if(sectionId === 'stock') Stock.chargerStock();
};

// Fonction pour ouvrir un dossier (Nouveau ou Existant)
function ouvrirDossier(id = null) {
    // Si ID fourni, on charge (Code simplifié, idéalement appel à Clients.getDoc)
    // Pour l'instant on ouvre juste le formulaire
    document.getElementById('dossier_id').value = id || ""; // ID corrigé selon votre HTML
    window.showSection('admin');
}

// Fonction pour les onglets Admin (Identité / Technique)
window.switchAdminTab = function(tabName) {
    document.getElementById('tab-content-identite').classList.add('hidden');
    document.getElementById('tab-content-technique').classList.add('hidden');
    document.getElementById('tab-btn-identite').classList.remove('active');
    document.getElementById('tab-btn-technique').classList.remove('active');
    
    document.getElementById('tab-content-' + tabName).classList.remove('hidden');
    document.getElementById('tab-btn-' + tabName).classList.add('active');
};

// Toggle des sections (Inhumation/Crémation)
window.toggleSections = function() {
    const type = document.getElementById('prestation').value;
    document.querySelectorAll('.specific-block').forEach(el => el.classList.add('hidden'));
    
    if(type === 'Inhumation') document.getElementById('bloc_inhumation').classList.remove('hidden');
    if(type === 'Crémation') document.getElementById('bloc_cremation').classList.remove('hidden');
    if(type === 'Rapatriement') document.getElementById('bloc_rapatriement').classList.remove('hidden');
};

// Toggle Police/Famille
window.togglePolice = function() {
    const val = document.getElementById('type_presence_select').value;
    document.getElementById('police_fields').classList.toggle('hidden', val !== 'police');
    document.getElementById('famille_fields').classList.toggle('hidden', val === 'police');
};

// Boutons du Menu Mobile
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    if(sidebar) sidebar.classList.toggle('mobile-open');
};
