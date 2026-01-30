import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './config.js';
import * as Utils from './utils.js';
import * as PDF from './pdf_admin.js';
import * as DB from './db_manager.js';

// 1. EXPOSER LES FONCTIONS (Pour que les boutons HTML marchent)
window.genererPouvoir = PDF.genererPouvoir;
// Ajoutez ici les autres fonctions PDF si nécessaire

window.chargerBaseClients = DB.chargerBaseClients;
window.chargerDossier = DB.chargerDossier;
window.sauvegarderDossier = DB.sauvegarderDossier;
window.supprimerDossier = DB.supprimerDossier;
window.chargerStock = DB.chargerStock;
window.ajouterArticleStock = DB.ajouterArticle;
window.supprimerArticle = DB.supprimerArticle;

// 2. INTERFACE
window.showSection = function(id) {
    // Cache tout sauf le menu
    const views = ['home', 'admin', 'base', 'stock'];
    views.forEach(v => {
        const el = document.getElementById('view-' + v);
        if(el) el.classList.add('hidden');
    });
    
    // Affiche le bon
    const target = document.getElementById('view-' + id);
    if(target) target.classList.remove('hidden');

    // Charge les données si besoin
    if(id === 'base') DB.chargerBaseClients();
    if(id === 'stock') DB.chargerStock();
};

window.toggleSidebar = function() {
    const sb = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if(window.innerWidth < 768) {
        sb.classList.toggle('mobile-open');
        if(overlay) overlay.style.display = sb.classList.contains('mobile-open') ? 'block' : 'none';
    } else {
        sb.classList.toggle('collapsed');
    }
};

window.openAjoutStock = function() { document.getElementById('form-stock').classList.remove('hidden'); };
window.switchAdminTab = function(tab) {
    document.getElementById('tab-content-identite').classList.add('hidden');
    document.getElementById('tab-content-technique').classList.add('hidden');
    document.getElementById('tab-btn-identite').classList.remove('active');
    document.getElementById('tab-btn-technique').classList.remove('active');
    
    document.getElementById('tab-content-' + tab).classList.remove('hidden');
    document.getElementById('tab-btn-' + tab).classList.add('active');
};

// 3. AUTH
window.loginFirebase = async function() {
    try { await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value); } 
    catch(e) { alert("Erreur login: " + e.message); }
};
window.logoutFirebase = async function() { await signOut(auth); window.location.reload(); };

// 4. DÉMARRAGE
onAuthStateChanged(auth, (user) => {
    const loader = document.getElementById('app-loader');
    if(loader) loader.style.display = 'none';
    
    if(user) {
        document.getElementById('login-screen').classList.add('hidden');
        Utils.chargerLogoBase64();
        DB.chargerBaseClients();
        
        // Date
        setInterval(() => {
            const now = new Date();
            if(document.getElementById('header-time')) document.getElementById('header-time').innerText = now.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
            if(document.getElementById('header-date')) document.getElementById('header-date').innerText = now.toLocaleDateString('fr-FR', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
        }, 1000);
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
    }

});
