/* Fichier : script.js (CHEF D'ORCHESTRE - VERSION MODULAIRE) */

// 1. IMPORTS (On récupère nos outils)
import { auth } from './js/config.js'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import * as Utils from './js/utils.js';
import * as PDF from './js/pdf_admin.js';
import * as Clients from './js/client_manager.js';
import * as Stock from './js/stock_manager.js';

// 2. EXPOSITION GLOBALE (Pour que vos boutons onclick="..." fonctionnent)
// On "accroche" les fonctions importées à la fenêtre du navigateur
window.genererPouvoir = PDF.genererPouvoir;
window.genererDeclaration = PDF.genererDeclaration;
window.genererDemandeInhumation = PDF.genererDemandeInhumation;
window.genererDemandeCremation = PDF.genererDemandeCremation;
window.genererDemandeRapatriement = PDF.genererDemandeRapatriement;
window.genererDemandeFermetureMairie = PDF.genererDemandeFermetureMairie;
window.genererDemandeOuverture = PDF.genererDemandeOuverture;
window.genererFermeture = PDF.genererFermeture;
window.genererTransport = PDF.genererTransport;

window.ouvrirDossier = ouvrirDossier; // Fonction UI définie plus bas
window.supprimerDossier = Clients.supprimerDossier;
window.sauvegarderDossier = Clients.sauvegarderDossier;

window.ajouterArticle = Stock.ajouterArticle;
window.supprimerArticle = Stock.supprimerArticle;
window.mouvementStock = Stock.mouvementStock;

// 3. GESTION DE L'AUTHENTIFICATION
const loginScreen = document.getElementById('login-screen');
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('app-loader');

onAuthStateChanged(auth, (user) => {
    if (user) {
        // CONNECTÉ
        if(loginScreen) loginScreen.classList.add('hidden');
        if(mainContent) mainContent.classList.remove('hidden');
        if(loader) loader.style.display = 'none';
        
        // On charge les données
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
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('password-input').value;
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

window.resetPassword = async function() {
    const email = prompt("Votre email pour la réinitialisation :");
    if(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Email envoyé ! Vérifiez vos spams.");
        } catch(e) { alert("Erreur : " + e.message); }
    }
};

// 4. GESTION DE L'INTERFACE (UI)
window.showSection = function(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    
    // Afficher la bonne
    const target = document.getElementById(sectionId);
    if(target) target.classList.remove('hidden');
    
    // Activer le menu
    const btn = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if(btn) btn.classList.add('active');
};

// Ouvrir un dossier existant ou nouveau
function ouvrirDossier(id = null) {
    document.getElementById('current_dossier_id').value = id || "";
    
    // Reset formulaire
    document.querySelectorAll('#form-dossier input, #form-dossier select').forEach(i => i.value = "");
    
    // Dates par défaut
    if(!id) {
        document.getElementById('dateSignature').valueAsDate = new Date();
    }

    // Si modification, on remplit les champs (Logique simplifiée pour l'exemple)
    // Idéalement, il faudrait récupérer le doc précis ici via Clients.getDoc...
    // Pour l'instant, l'utilisateur va cliquer sur "Modifier" et ça ouvrira la section vide
    // Amélioration future : Pré-remplir les champs.
    
    window.showSection('admin');
}

// Menu Mobile
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if(window.innerWidth < 768) {
        sidebar.classList.toggle('mobile-open');
        overlay.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none';
    } else {
        sidebar.classList.toggle('collapsed');
    }
};