/* js/db_manager.js */
import { db } from './config.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getVal, setVal } from './utils.js';

// --- CLIENTS ---
export async function chargerBaseClients() {
    const tbody = document.getElementById('clients-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Chargement...</td></tr>';
    
    try {
        const q = collection(db, "dossiers_admin");
        const snapshot = await getDocs(q);
        
        let dossiers = [];
        snapshot.forEach(doc => dossiers.push({ id: doc.id, ...doc.data() }));
        // Tri manuel JS pour éviter les erreurs d'index Firebase
        dossiers.sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0));

        tbody.innerHTML = "";
        if(dossiers.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Aucun dossier.</td></tr>'; return; }

        dossiers.forEach(data => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.date_creation ? new Date(data.date_creation).toLocaleDateString() : '-'}</td>
                <td><strong>${data.defunt?.nom || '?'}</strong></td>
                <td>${data.mandant?.nom || '?'}</td>
                <td><span class="badge">${data.technique?.type_operation || 'Dossier'}</span></td>
                <td style="text-align:center;">
                    <button class="btn-icon" onclick="window.chargerDossier('${data.id}')"><i class="fas fa-edit" style="color:#3b82f6;"></i></button>
                    <button class="btn-icon" onclick="window.supprimerDossier('${data.id}')"><i class="fas fa-trash" style="color:#ef4444;"></i></button>
                </td>`;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); tbody.innerHTML = `<tr><td colspan="5" style="color:red">Erreur : ${e.message}</td></tr>`; }
}

export async function chargerDossier(id) {
    try {
        const docSnap = await getDoc(doc(db, "dossiers_admin", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            window.showSection('admin');
            document.getElementById('dossier_id').value = id;
            
            // Remplissage intelligent
            if(data.defunt) {
                setVal('civilite_defunt', data.defunt.civility); setVal('nom', data.defunt.nom); setVal('prenom', data.defunt.prenom);
                setVal('date_deces', data.defunt.date_deces); setVal('lieu_deces', data.defunt.lieu_deces);
            }
            if(data.mandant) {
                setVal('civilite_mandant', data.mandant.civility); setVal('soussigne', data.mandant.nom); setVal('demeurant', data.mandant.adresse);
            }
            // ... Ajoutez ici le reste du remplissage si nécessaire
            alert("Dossier chargé.");
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
        if(id) { await updateDoc(doc(db, "dossiers_admin", id), data); alert("Mise à jour OK"); }
        else { data.date_creation = new Date().toISOString(); await addDoc(collection(db, "dossiers_admin"), data); alert("Création OK"); }
        chargerBaseClients();
        window.showSection('base');
    } catch(e) { alert("Erreur sauvegarde: " + e.message); }
}

export async function supprimerDossier(id) {
    if(confirm("Supprimer ?")) { await deleteDoc(doc(db, "dossiers_admin", id)); chargerBaseClients(); }
}

// --- STOCKS ---
export async function chargerStock() {
    const tbody = document.getElementById('stock-table-body');
    if(!tbody) return;
    const q = query(collection(db, "stock_articles"), orderBy("nom"));
    const snap = await getDocs(q);
    tbody.innerHTML = "";
    snap.forEach(doc => {
        const d = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><b>${d.nom}</b></td><td>${d.categorie}</td><td>${d.qte}</td><td><button onclick="window.supprimerArticle('${doc.id}')" style="color:red;border:none;background:none;"><i class="fas fa-trash"></i></button></td>`;
        tbody.appendChild(tr);
    });
}
export async function ajouterArticle() {
    const nom = document.getElementById('st_nom').value;
    const cat = document.getElementById('st_cat').value;
    const qte = document.getElementById('st_qte').value;
    if(nom) { await addDoc(collection(db, "stock_articles"), {nom, categorie:cat, qte:parseInt(qte)}); chargerStock(); document.getElementById('form-stock').classList.add('hidden'); }
}
export async function supprimerArticle(id) { if(confirm("Supprimer ?")) { await deleteDoc(doc(db, "stock_articles", id)); chargerStock(); } }
