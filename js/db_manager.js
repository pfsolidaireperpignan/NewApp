/* js/db_manager.js */
// 1. On importe la base de données depuis votre fichier local
import { db } from './config.js';
// 2. CORRECTION ICI : On importe les outils depuis INTERNET (CDN), pas depuis config.js
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getVal, setVal } from './utils.js';

// --- CHARGER CLIENTS (VERSION SANS ÉCHEC) ---
export async function chargerBaseClients() {
    const tbody = document.getElementById('clients-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Chargement en cours...</td></tr>';
    
    try {
        // On récupère la collection sans trier d'abord (pour éviter les erreurs d'index)
        const q = collection(db, "dossiers_admin");
        const snapshot = await getDocs(q);
        
        let dossiers = [];
        snapshot.forEach(doc => {
            dossiers.push({ id: doc.id, ...doc.data() });
        });

        // Tri manuel en JavaScript (Plus fiable)
        dossiers.sort((a, b) => {
            const dateA = a.date_creation ? new Date(a.date_creation) : new Date(0);
            const dateB = b.date_creation ? new Date(b.date_creation) : new Date(0);
            return dateB - dateA; // Du plus récent au plus ancien
        });

        tbody.innerHTML = "";
        
        if(dossiers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#888;">Aucun dossier trouvé.</td></tr>';
            return;
        }

        dossiers.forEach(data => {
            const dateC = data.date_creation ? new Date(data.date_creation).toLocaleDateString() : '-';
            const nomDefunt = data.defunt?.nom || '?';
            const nomMandant = data.mandant?.nom || '-';
            const op = data.technique?.type_operation || 'Dossier';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateC}</td>
                <td><strong>${nomDefunt}</strong></td>
                <td>${nomMandant}</td>
                <td><span class="badge">${op}</span></td>
                <td style="text-align:center;">
                    <button class="btn-icon" onclick="window.chargerDossier('${data.id}')"><i class="fas fa-edit" style="color:#3b82f6;"></i></button>
                    <button class="btn-icon" onclick="window.supprimerDossier('${data.id}')"><i class="fas fa-trash" style="color:#ef4444;"></i></button>
                </td>`;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error("Erreur chargement:", e);
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Erreur : ${e.message}</td></tr>`;
    }
}

export async function chargerDossier(id) {
    try {
        const docSnap = await getDoc(doc(db, "dossiers_admin", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            window.showSection('admin');
            document.getElementById('dossier_id').value = id;
            document.getElementById('btn-save-bdd').innerHTML = "MODIFIER";
            
            // Remplissage Simple
            if(data.defunt) {
                setVal('civilite_defunt', data.defunt.civility); setVal('nom', data.defunt.nom); setVal('prenom', data.defunt.prenom);
                setVal('date_deces', data.defunt.date_deces); setVal('lieu_deces', data.defunt.lieu_deces);
            }
            if(data.mandant) {
                setVal('civilite_mandant', data.mandant.civility); setVal('soussigne', data.mandant.nom); setVal('demeurant', data.mandant.adresse);
            }
            // ... (Le reste des champs se remplit ici)
        }
    } catch(e) { alert("Erreur chargement : " + e.message); }
}

export async function sauvegarderDossier() {
    const id = document.getElementById('dossier_id').value;
    const data = {
        defunt: { nom: getVal('nom'), prenom: getVal('prenom'), date_deces: getVal('date_deces'), civility: getVal('civilite_defunt') },
        mandant: { nom: getVal('soussigne'), adresse: getVal('demeurant'), civility: getVal('civilite_mandant') },
        technique: { type_operation: document.getElementById('prestation').value },
        date_modification: new Date().toISOString()
    };

    try {
        if(id) { await updateDoc(doc(db, "dossiers_admin", id), data); alert("✅ Dossier mis à jour"); }
        else { data.date_creation = new Date().toISOString(); await addDoc(collection(db, "dossiers_admin"), data); alert("✅ Dossier créé"); }
        chargerBaseClients();
        window.showSection('base');
    } catch(e) { alert("Erreur sauvegarde: " + e.message); }
}

export async function supprimerDossier(id) {
    if(confirm("Supprimer ce dossier ?")) { await deleteDoc(doc(db, "dossiers_admin", id)); chargerBaseClients(); }
}

// --- STOCKS ---
export async function chargerStock() {
    const tbody = document.getElementById('stock-table-body');
    if(!tbody) return;
    try {
        const q = query(collection(db, "stock_articles"), orderBy("nom"));
        const snap = await getDocs(q);
        tbody.innerHTML = "";
        if(snap.empty) { tbody.innerHTML = "<tr><td colspan='6' style='text-align:center'>Stock vide</td></tr>"; return; }
        
        snap.forEach(doc => {
            const d = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><b>${d.nom}</b></td><td>${d.categorie}</td><td>${d.prix_achat||0}€</td><td>${d.prix_vente||0}€</td><td>${d.qte}</td><td><button onclick="window.supprimerArticle('${doc.id}')" style="color:red;border:none;background:none;"><i class="fas fa-trash"></i></button></td>`;
            tbody.appendChild(tr);
        });
    } catch(e) { tbody.innerHTML = "<tr><td colspan='6'>Erreur stock</td></tr>"; }
}

export async function ajouterArticle() {
    const nom = document.getElementById('st_nom').value;
    const qte = document.getElementById('st_qte').value;
    if(nom) { 
        await addDoc(collection(db, "stock_articles"), {nom, qte:parseInt(qte), date_ajout: new Date().toISOString()}); 
        chargerStock(); document.getElementById('form-stock').classList.add('hidden'); 
    }
}
export async function supprimerArticle(id) { if(confirm("Supprimer ?")) { await deleteDoc(doc(db, "stock_articles", id)); chargerStock(); } }
