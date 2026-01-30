/* js/app.js - VERSION FINALE AVEC HORLOGE */
import { auth, db, collection, addDoc, getDocs, getDoc, query, orderBy, onAuthStateChanged, signInWithEmailAndPassword, signOut, deleteDoc, updateDoc, doc, sendPasswordResetEmail } from "./config.js";

// Variable Globale pour la GED
window.current_pieces_jointes = []; 

// ==========================================================================
// 1. INITIALISATION & NAVIGATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    chargerLogoBase64(); 
    const loader = document.getElementById('app-loader');
    
    onAuthStateChanged(auth, (user) => {
        if(loader) loader.style.display = 'none';
        if (user) {
            document.getElementById('login-screen').classList.add('hidden');
            
            // --- LANCEMENT DES DONNÉES ---
            window.chargerBaseClients(); 
            chargerClientsFacturation(); 
            window.chargerStock(); 
            
            // --- CORRECTION : LANCEMENT DE L'HORLOGE ---
            lancerHorloge(); 
            
        } else {
            document.getElementById('login-screen').classList.remove('hidden');
        }
    });

    // Gestion Boutons Login
    if(document.getElementById('btn-login')) {
        document.getElementById('btn-login').addEventListener('click', async () => {
            try { await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value); } 
            catch(e) { alert("Erreur : " + e.message); }
        });
    }

    // Gestion Mot de passe oublié
    if(document.getElementById('btn-forgot')) {
        document.getElementById('btn-forgot').addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            if(!email) return alert("⚠️ Veuillez d'abord écrire votre EMAIL dans la case 'Email'.");
            if(confirm("Envoyer un lien de réinitialisation à : " + email + " ?")) {
                try { await sendPasswordResetEmail(auth, email); alert("📧 Email envoyé !"); } 
                catch(e) { alert("Erreur : " + e.message); }
            }
        });
    }
    
    // Gestion Boutons Import/Save
    if(document.getElementById('btn-import')) document.getElementById('btn-import').addEventListener('click', importerClient);
    if(document.getElementById('btn-save-bdd')) document.getElementById('btn-save-bdd').addEventListener('click', sauvegarderEnBase);
    
    // Recherche
    const searchInput = document.getElementById('search-client');
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('#clients-table-body tr').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
            });
        });
    }
});

// ==========================================================================
// 2. FONCTION HORLOGE (LA CORRECTION EST ICI)
// ==========================================================================
function lancerHorloge() {
    const update = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
        const dateString = now.toLocaleDateString('fr-FR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
        
        const elTime = document.getElementById('header-time');
        const elDate = document.getElementById('header-date');
        
        if(elTime) elTime.innerText = timeString;
        if(elDate) elDate.innerText = dateString;
    };
    // Mise à jour immédiate puis toutes les secondes
    update();
    setInterval(update, 1000);
}

// ==========================================================================
// 3. LOGIQUE INTERFACE
// ==========================================================================
window.showSection = function(id) {
    ['home', 'base', 'admin', 'stock'].forEach(v => {
        const el = document.getElementById('view-' + v);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById('view-' + id);
    if(target) target.classList.remove('hidden');
    
    if(id === 'base') window.chargerBaseClients();
    if(id === 'stock') window.chargerStock();
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
    document.querySelectorAll('.specific-block').forEach(el => el.classList.add('hidden'));
    document.getElementById('btn_inhumation').classList.add('hidden');
    document.getElementById('btn_cremation').classList.add('hidden');
    document.getElementById('btn_rapatriement').classList.add('hidden');

    if(type === 'Inhumation') {
        document.getElementById('bloc_inhumation').classList.remove('hidden');
        document.getElementById('btn_inhumation').classList.remove('hidden');
    } else if(type === 'Crémation') {
        document.getElementById('bloc_cremation').classList.remove('hidden');
        document.getElementById('btn_cremation').classList.remove('hidden');
    } else if(type === 'Rapatriement') {
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
    const bloc = document.getElementById('bloc_vol2');
    if (chk && bloc) {
        if(chk.checked) bloc.classList.remove('hidden');
        else bloc.classList.add('hidden');
    }
};

window.copierMandant = function() {
    const chk = document.getElementById('copy_mandant');
    if(chk && chk.checked) {
        const civ = document.getElementById('civilite_mandant').value;
        document.getElementById('f_nom_prenom').value = civ + " " + document.getElementById('soussigne').value;
        document.getElementById('f_lien').value = document.getElementById('lien').value;
    }
};

window.viderFormulaire = function() {
    if(confirm("Vider le formulaire pour un NOUVEAU dossier ?")) {
        document.getElementById('dossier_id').value = ""; 
        document.querySelectorAll('#view-admin input').forEach(i => i.value = '');
        document.getElementById('prestation').selectedIndex = 0;
        document.getElementById('faita').value = "PERPIGNAN"; 
        document.getElementById('immatriculation').value = "DA-081-ZQ";
        document.getElementById('rap_immat').value = "DA-081-ZQ";
        if(document.getElementById('check_vol2')) document.getElementById('check_vol2').checked = false;
        if(document.getElementById('copy_mandant')) document.getElementById('copy_mandant').checked = false;
        
        window.current_pieces_jointes = [];
        if(window.afficherPiecesJointes) window.afficherPiecesJointes();

        window.toggleSections();
        document.getElementById('btn-save-bdd').innerHTML = '<i class="fas fa-save"></i> ENREGISTRER';
    }
};

// ==========================================================================
// 4. GESTION DES STOCKS
// ==========================================================================
window.openAjoutStock = function() {
    document.getElementById('form-stock').classList.remove('hidden');
    document.getElementById('st_nom').value = "";
    document.getElementById('st_qte').value = "1";
    document.getElementById('st_pa').value = "";
    document.getElementById('st_pv').value = "";
    document.getElementById('st_fourn').value = "";
};

window.ajouterArticleStock = async function() {
    const nom = document.getElementById('st_nom').value;
    const cat = document.getElementById('st_cat').value;
    const qte = parseInt(document.getElementById('st_qte').value) || 0;
    const pa = parseFloat(document.getElementById('st_pa').value) || 0;
    const pv = parseFloat(document.getElementById('st_pv').value) || 0;
    const fourn = document.getElementById('st_fourn').value;

    if(!nom) return alert("Le nom de l'article est obligatoire.");

    try {
        await addDoc(collection(db, "stock_articles"), {
            nom, categorie: cat, qte, prix_achat: pa, prix_vente: pv, fournisseur: fourn,
            date_ajout: new Date().toISOString()
        });
        alert("✅ Article ajouté !");
        document.getElementById('form-stock').classList.add('hidden');
        window.chargerStock();
    } catch(e) { alert("Erreur : " + e.message); }
};

window.chargerStock = async function() {
    const tbody = document.getElementById('stock-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';
    
    try {
        const q = query(collection(db, "stock_articles"), orderBy("nom"));
        const snap = await getDocs(q);
        tbody.innerHTML = '';
        
        if(snap.empty) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Aucun article en stock.</td></tr>'; return; }

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const alertClass = (data.qte < 3) ? 'stock-alert' : 'stock-ok';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${data.nom}</strong><br><small style="color:#64748b;">${data.fournisseur || ''}</small></td>
                <td>${data.categorie}</td>
                <td>${data.prix_achat ? data.prix_achat.toFixed(2) : '0.00'} €</td>
                <td><strong>${data.prix_vente ? data.prix_vente.toFixed(2) : '0.00'} €</strong></td>
                <td style="white-space:nowrap;">
                    <button class="btn-icon" style="background:#fee2e2; color:#ef4444; border-color:#fca5a5; padding:2px 8px; margin-right:5px;" onclick="window.updateStock('${docSnap.id}', -1)" title="Sortie Stock (-1)">-</button>
                    <span class="badge ${alertClass}" style="font-size:1rem; padding:5px 12px;">${data.qte}</span>
                    <button class="btn-icon" style="background:#dcfce7; color:#16a34a; border-color:#86efac; padding:2px 8px; margin-left:5px;" onclick="window.updateStock('${docSnap.id}', 1)" title="Entrée Stock (+1)">+</button>
                </td>
                <td style="text-align:center;">
                    <button class="btn-icon" onclick="window.supprimerArticle('${docSnap.id}')" title="Supprimer la référence"><i class="fas fa-trash" style="color:red;"></i></button>
                </td>`;
            tbody.appendChild(tr);
        });
    } catch(e) { console.error(e); }
};

window.updateStock = async function(id, delta) {
    try {
        const docRef = doc(db, "stock_articles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const currentQte = docSnap.data().qte || 0;
            const newQte = currentQte + delta;
            if (newQte < 0) { alert("Impossible : Le stock ne peut pas être négatif."); return; }
            await updateDoc(docRef, { qte: newQte });
            window.chargerStock();
        }
    } catch(e) { alert("Erreur mise à jour stock : " + e.message); }
};

window.supprimerArticle = async function(id) {
    if(confirm("Supprimer cet article du stock ?")) {
        try { await deleteDoc(doc(db, "stock_articles", id)); window.chargerStock(); } catch(e) { alert("Erreur : " + e.message); }
    }
};

// ==========================================================================
// 5. DONNÉES DOSSIERS (AVEC FIXE CHARGEMENT RAPIDE)
// ==========================================================================
window.chargerBaseClients = async function() {
    const tbody = document.getElementById('clients-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Chargement...</td></tr>';
    
    try {
        // FIXE CHARGEMENT : On enlève le tri serveur orderBy qui peut bloquer
        const snap = await getDocs(collection(db, "dossiers_admin"));
        
        if(snap.empty) { 
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Aucun dossier.</td></tr>'; 
            return; 
        }

        // Tri local JS (Plus rapide et fiable)
        let dossiers = [];
        snap.forEach(doc => { dossiers.push({ id: doc.id, ...doc.data() }); });
        dossiers.sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0));

        tbody.innerHTML = '';
        dossiers.forEach(data => {
            const op = data.technique ? (data.technique.type_operation || "Inhumation") : "Inhumation";
            const nomD = (data.defunt?.civility || "") + " " + (data.defunt?.nom || '?');
            const nomM = (data.mandant?.civility || "") + " " + (data.mandant?.nom || '-');
            const dateC = data.date_creation ? new Date(data.date_creation).toLocaleDateString() : "-";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateC}</td>
                <td><strong>${nomD}</strong></td>
                <td>${nomM}</td>
                <td><span class="badge" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;">${op}</span></td>
                <td style="text-align:center; display:flex; justify-content:center; gap:5px;">
                    <button class="btn-icon" onclick="window.chargerDossier('${data.id}')" title="Modifier"><i class="fas fa-edit" style="color:#3b82f6;"></i></button>
                    <button class="btn-icon" onclick="window.goToFacturation('${data.defunt?.nom || ''}')" title="Voir Factures"><i class="fas fa-file-invoice-dollar" style="color:#10b981;"></i></button>
                    <button class="btn-icon" onclick="window.supprimerDossier('${data.id}')" style="margin-left:5px;"><i class="fas fa-trash" style="color:#ef4444;"></i></button>
                </td>`;
            tbody.appendChild(tr);
        });
    } catch(e) { console.error(e); }
};

// ... (Fonctions utilitaires getVal, setVal, importerClient, etc.)
function getVal(id) { return document.getElementById(id) ? document.getElementById(id).value : ""; }
function setVal(id, val) { const el = document.getElementById(id); if(el) el.value = val || ""; }

let clientsCache = [];
async function chargerClientsFacturation() {
    const select = document.getElementById('select-import-client');
    if(!select) return;
    try {
        const q = query(collection(db, "factures_v2"), orderBy("date_creation", "desc"));
        const snap = await getDocs(q);
        select.innerHTML = '<option value="">-- Choisir un client facturé --</option>';
        clientsCache = [];
        snap.forEach(doc => {
            const data = doc.data();
            if(data.client) {
                const opt = document.createElement('option');
                opt.value = doc.id; 
                const civC = data.client.civility || "";
                const nomClient = data.client.nom || "Inconnu";
                const nomDefunt = (data.defunt && data.defunt.nom) ? data.defunt.nom : "Inconnu";
                opt.textContent = `${civC} ${nomClient} (Défunt: ${nomDefunt})`;
                select.appendChild(opt);
                clientsCache.push({ id: doc.id, data: data });
            }
        });
    } catch (e) { console.error(e); }
}

function importerClient() {
    const id = document.getElementById('select-import-client').value;
    const dossier = clientsCache.find(c => c.id === id);
    if(dossier) {
        const d = dossier.data;
        if(d.client) {
            if(document.getElementById('soussigne')) document.getElementById('soussigne').value = d.client.nom || '';
            if(document.getElementById('demeurant')) document.getElementById('demeurant').value = d.client.adresse || '';
            if(document.getElementById('civilite_mandant')) document.getElementById('civilite_mandant').value = d.client.civility || "M.";
        }
        if(d.defunt) {
            if(document.getElementById('nom')) document.getElementById('nom').value = d.defunt.nom || '';
            if(document.getElementById('civilite_defunt')) document.getElementById('civilite_defunt').value = d.defunt.civility || "M.";
        }
        alert("✅ Données importées.");
    }
}

async function sauvegarderEnBase() {
    const btn = document.getElementById('btn-save-bdd');
    const dossierId = document.getElementById('dossier_id').value;
    btn.innerHTML = '...';
    try {
        const dossierData = {
            defunt: { 
                civility: getVal('civilite_defunt'),
                nom: getVal('nom'), prenom: getVal('prenom'), nom_jeune_fille: getVal('nom_jeune_fille'),
                date_deces: getVal('date_deces'), lieu_deces: getVal('lieu_deces'), heure_deces: getVal('heure_deces'),
                date_naiss: getVal('date_naiss'), lieu_naiss: getVal('lieu_naiss'), nationalite: getVal('nationalite'),
                adresse: getVal('adresse_fr'), pere: getVal('pere'), mere: getVal('mere'),
                situation: getVal('matrimoniale'), conjoint: getVal('conjoint'), 
                profession: getVal('prof_type'), profession_libelle: getVal('profession_libelle') 
            },
            mandant: { 
                civility: getVal('civilite_mandant'),
                nom: getVal('soussigne'), lien: getVal('lien'), adresse: getVal('demeurant') 
            },
            pieces_jointes: window.current_pieces_jointes || [],
            technique: { 
                type_operation: document.getElementById('prestation').value,
                mise_biere: getVal('lieu_mise_biere'), date_fermeture: getVal('date_fermeture'),
                vehicule: getVal('immatriculation'), presence: document.getElementById('type_presence_select').value,
                police: { nom: getVal('p_nom_grade'), comm: getVal('p_commissariat') },
                famille: { temoin: getVal('f_nom_prenom'), lien: getVal('f_lien') },
                transport_avant: {
                    lieu_dep: getVal('av_lieu_depart'), lieu_arr: getVal('av_lieu_arrivee'),
                    date_dep: getVal('av_date_dep'), heure_dep: getVal('av_heure_dep'),
                    date_arr: getVal('av_date_arr'), heure_arr: getVal('av_heure_arr')
                },
                transport_apres: {
                    lieu_dep: getVal('ap_lieu_depart'), lieu_arr: getVal('ap_lieu_arrivee'),
                    date_dep: getVal('ap_date_dep'), heure_dep: getVal('ap_heure_dep'),
                    date_arr: getVal('ap_date_arr'), heure_arr: getVal('ap_heure_arr')
                },
                faita: getVal('faita'), dateSignature: getVal('dateSignature')
            },
            details_op: {
                cimetiere: getVal('cimetiere_nom'), concession: getVal('num_concession'), titulaire: getVal('titulaire_concession'),
                crematorium: getVal('crematorium_nom'), dest_cendres: getVal('destination_cendres'), type_sepulture: getVal('type_sepulture'),
                rapa_pays: getVal('rapa_pays'), rapa_ville: getVal('rapa_ville'), rapa_lta: getVal('rapa_lta'),
                vol1: getVal('vol1_num'), vol2: getVal('vol2_num'),
                rapa_route: { immat: getVal('rap_immat'), dep_date: getVal('rap_date_dep_route'), ville_dep: getVal('rap_ville_dep'), ville_arr: getVal('rap_ville_arr') },
                vol_details: { 
                    v1_dep: getVal('vol1_dep_aero'), v1_arr: getVal('vol1_arr_aero'), v1_dtime: getVal('vol1_dep_time'), v1_atime: getVal('vol1_arr_time'),
                    v2_dep: getVal('vol2_dep_aero'), v2_arr: getVal('vol2_arr_aero'), v2_dtime: getVal('vol2_dep_time'), v2_atime: getVal('vol2_arr_time')
                }
            },
            date_modification: new Date().toISOString()
        };

        if (dossierId) {
            await updateDoc(doc(db, "dossiers_admin", dossierId), dossierData);
            alert("✅ Dossier mis à jour !");
        } else {
            dossierData.date_creation = new Date().toISOString(); 
            await addDoc(collection(db, "dossiers_admin"), dossierData);
            alert("✅ Dossier créé !");
        }
        btn.innerHTML = 'OK';
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-save"></i> ENREGISTRER'; window.showSection('base'); }, 1000);
    } catch(e) { alert("Erreur: " + e.message); btn.innerHTML = '<i class="fas fa-save"></i> ENREGISTRER'; }
}

window.chargerDossier = async function(id) {
    try {
        const docRef = doc(db, "dossiers_admin", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            window.showSection('admin');
            document.getElementById('dossier_id').value = id;
            document.getElementById('btn-save-bdd').innerHTML = '<i class="fas fa-edit"></i> MODIFIER';

            if (data.pieces_jointes) { window.current_pieces_jointes = data.pieces_jointes; } 
            else { window.current_pieces_jointes = []; }
            if(window.afficherPiecesJointes) window.afficherPiecesJointes();

            if(data.defunt) {
                if(data.defunt.civility) document.getElementById('civilite_defunt').value = data.defunt.civility;
                setVal('nom', data.defunt.nom); setVal('prenom', data.defunt.prenom); setVal('nom_jeune_fille', data.defunt.nom_jeune_fille);
                setVal('date_deces', data.defunt.date_deces); setVal('lieu_deces', data.defunt.lieu_deces); setVal('heure_deces', data.defunt.heure_deces);
                setVal('date_naiss', data.defunt.date_naiss); setVal('lieu_naiss', data.defunt.lieu_naiss); setVal('nationalite', data.defunt.nationalite);
                setVal('adresse_fr', data.defunt.adresse); setVal('pere', data.defunt.pere); setVal('mere', data.defunt.mere);
                setVal('conjoint', data.defunt.conjoint);
                if(data.defunt.situation) document.getElementById('matrimoniale').value = data.defunt.situation;
                if(data.defunt.profession) document.getElementById('prof_type').value = data.defunt.profession;
                setVal('profession_libelle', data.defunt.profession_libelle); 
            }
            if(data.mandant) {
                if(data.mandant.civility) document.getElementById('civilite_mandant').value = data.mandant.civility;
                setVal('soussigne', data.mandant.nom); setVal('lien', data.mandant.lien); setVal('demeurant', data.mandant.adresse);
            }
            if(data.technique) {
                document.getElementById('prestation').value = data.technique.type_operation || "Inhumation";
                setVal('lieu_mise_biere', data.technique.mise_biere); setVal('date_fermeture', data.technique.date_fermeture);
                setVal('immatriculation', data.technique.vehicule); document.getElementById('type_presence_select').value = data.technique.presence || "famille";
                if(data.technique.police) { setVal('p_nom_grade', data.technique.police.nom); setVal('p_commissariat', data.technique.police.comm); }
                if(data.technique.famille) { setVal('f_nom_prenom', data.technique.famille.temoin); setVal('f_lien', data.technique.famille.lien); }
                
                if(data.technique.transport_avant) {
                    setVal('av_lieu_depart', data.technique.transport_avant.lieu_dep); setVal('av_lieu_arrivee', data.technique.transport_avant.lieu_arr);
                    setVal('av_date_dep', data.technique.transport_avant.date_dep); setVal('av_heure_dep', data.technique.transport_avant.heure_dep);
                    setVal('av_date_arr', data.technique.transport_avant.date_arr); setVal('av_heure_arr', data.technique.transport_avant.heure_arr);
                }
                if(data.technique.transport_apres) {
                    setVal('ap_lieu_depart', data.technique.transport_apres.lieu_dep); setVal('ap_lieu_arrivee', data.technique.transport_apres.lieu_arr);
                    setVal('ap_date_dep', data.technique.transport_apres.date_dep); setVal('ap_heure_dep', data.technique.transport_apres.heure_dep);
                    setVal('ap_date_arr', data.technique.transport_apres.date_arr); setVal('ap_heure_arr', data.technique.transport_apres.heure_arr);
                }
                setVal('faita', data.technique.faita); setVal('dateSignature', data.technique.dateSignature);
            }
            if(data.details_op) {
                setVal('cimetiere_nom', data.details_op.cimetiere); setVal('num_concession', data.details_op.concession); setVal('titulaire_concession', data.details_op.titulaire);
                setVal('crematorium_nom', data.details_op.crematorium); setVal('destination_cendres', data.details_op.dest_cendres); 
                if(data.details_op.type_sepulture) document.getElementById('type_sepulture').value = data.details_op.type_sepulture;
                
                setVal('rap_pays', data.details_op.rapa_pays); setVal('rap_ville', data.details_op.rapa_ville); setVal('rap_lta', data.details_op.rapa_lta);
                setVal('vol1_num', data.details_op.vol1); setVal('vol2_num', data.details_op.vol2);
                
                if(data.details_op.rapa_route) {
                    setVal('rap_immat', data.details_op.rapa_route.immat); setVal('rap_date_dep_route', data.details_op.rapa_route.dep_date);
                    setVal('rap_ville_dep', data.details_op.rapa_route.ville_dep); setVal('rap_ville_arr', data.details_op.rapa_route.ville_arr);
                }
                if(data.details_op.vol_details) {
                    setVal('vol1_dep_aero', data.details_op.vol_details.v1_dep); setVal('vol1_arr_aero', data.details_op.vol_details.v1_arr);
                    setVal('vol1_dep_time', data.details_op.vol_details.v1_dtime); setVal('vol1_arr_time', data.details_op.vol_details.v1_atime);
                    setVal('vol2_dep_aero', data.details_op.vol_details.v2_dep); setVal('vol2_arr_aero', data.details_op.vol_details.v2_arr);
                    setVal('vol2_dep_time', data.details_op.vol_details.v2_dtime); setVal('vol2_arr_time', data.details_op.vol_details.v2_atime);
                }
            }
            window.toggleSections(); window.togglePolice();
            if(document.getElementById('vol2_num').value) { document.getElementById('check_vol2').checked = true; window.toggleVol2(); }
        } else { alert("Dossier introuvable."); }
    } catch (e) { alert("Erreur Chargement : " + e.message); }
};

window.supprimerDossier = async function(id) {
    if(confirm("⚠️ Supprimer définitivement ?")) {
        try { await deleteDoc(doc(db, "dossiers_admin", id)); alert("🗑️ Dossier supprimé."); window.chargerBaseClients(); } 
        catch (e) { alert("Erreur : " + e.message); }
    }
};

window.goToFacturation = function(nomDefunt) {
    if(nomDefunt) {
        window.location.href = `facturation_v2.html?search=${encodeURIComponent(nomDefunt)}`;
    } else {
        window.location.href = `facturation_v2.html`;
    }
};

// --- LOGO SHARED ---
let logoBase64 = null;
function chargerLogoBase64() {
    const img = document.getElementById('logo-source');
    if (img && img.naturalWidth > 0) {
        const c = document.createElement("canvas"); c.width=img.naturalWidth; c.height=img.naturalHeight;
        c.getContext("2d").drawImage(img,0,0); try{logoBase64=c.toDataURL("image/png");}catch(e){}
    }
}

// GED
window.ajouterPieceJointe = function() {
    const input = document.getElementById('ged_input_file');
    const nameInput = document.getElementById('ged_file_name');
    if (input.files.length === 0) return alert("Choisissez un fichier !");
    if (!nameInput.value) return alert("Donnez un nom au document !");
    
    const file = input.files[0];
    if (file.size > 800 * 1024) return alert("⚠️ FICHIER TROP LOURD !\nMax 800 Ko.");

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64String = e.target.result;
        if (!window.current_pieces_jointes) window.current_pieces_jointes = [];
        
        window.current_pieces_jointes.push({
            nom: nameInput.value,
            type: file.type,
            data: base64String,
            date: new Date().toLocaleDateString()
        });

        input.value = "";
        nameInput.value = "";
        window.afficherPiecesJointes();
    };
    reader.readAsDataURL(file);
};

window.afficherPiecesJointes = function() {
    const container = document.getElementById('liste_pieces_jointes');
    if(!container) return;
    container.innerHTML = "";

    if (!window.current_pieces_jointes || window.current_pieces_jointes.length === 0) {
        container.innerHTML = '<div style="color:#94a3b8; font-style:italic;">Aucun document joint.</div>';
        return;
    }

    window.current_pieces_jointes.forEach((doc, index) => {
        const div = document.createElement('div');
        div.style = "background:white; padding:10px; border-radius:6px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;";
        let icon = doc.type.includes('pdf') ? '<i class="fas fa-file-pdf" style="color:red;"></i>' : '<i class="fas fa-file-image" style="color:blue;"></i>';
        div.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                ${icon} <strong>${doc.nom}</strong> <small>(${doc.date})</small>
            </div>
            <div>
                <button onclick="window.voirDocument(${index})" style="background:#3b82f6; color:white; border:none; padding:5px 10px; border-radius:4px; margin-right:5px; cursor:pointer;"><i class="fas fa-eye"></i></button>
                <button onclick="window.supprimerDocument(${index})" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
    });
};

window.voirDocument = function(index) {
    const doc = window.current_pieces_jointes[index];
    const win = window.open();
    win.document.write(`<iframe src="${doc.data}" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`);
};

window.supprimerDocument = function(index) {
    if(confirm("Supprimer ce document ?")) {
        window.current_pieces_jointes.splice(index, 1);
        window.afficherPiecesJointes();
    }
};
