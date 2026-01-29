/* Fichier : js/client_manager.js */
// On importe "db" depuis votre config locale, MAIS les outils (collection, query...) depuis Internet (CDN)
import { db } from './config.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getVal } from './utils.js';

// --- CHARGER LA LISTE DES CLIENTS ---
export async function chargerBaseClients() {
    const tbody = document.getElementById('clients-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';
    
    try {
        const q = query(collection(db, "dossiers_admin"), orderBy("lastModified", "desc")); 
        const querySnapshot = await getDocs(q);
        
        tbody.innerHTML = "";
        
        if(querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Aucun dossier trouvé.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${data.mandant ? data.mandant.nom : '?'}</strong></td>
                <td>${data.defunt ? data.defunt.nom : '?'}</td>
                <td>${data.defunt ? data.defunt.date_deces : '?'}</td>
                <td><span class="badge badge-regle">${data.type_obseques || 'Non défini'}</span></td>
                <td>${new Date(data.date_creation).toLocaleDateString()}</td>
                <td>
                    <button class="btn-icon" onclick="window.ouvrirDossier('${docSnap.id}')" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" style="color:red;" onclick="window.supprimerDossier('${docSnap.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        console.error("Erreur chargement clients:", e);
        tbody.innerHTML = `<tr><td colspan="6" style="color:red">Erreur : ${e.message}</td></tr>`;
    }
}

// --- SAUVEGARDER UN DOSSIER ---
export async function sauvegarderDossier() {
    const btn = document.getElementById('btn-save-dossier'); // Note: Vérifiez que votre bouton a bien cet ID dans le HTML, sinon utilisez 'btn-save-bdd'
    const actualBtn = btn || document.getElementById('btn-save-bdd'); // Fallback
    
    if(actualBtn) {
        actualBtn.innerHTML = "Sauvegarde..."; 
        actualBtn.disabled = true;
    }

    try {
        const dossierData = {
            mandant: {
                civility: getVal("civilite_mandant"),
                nom: getVal("soussigne"),
                adresse: getVal("demeurant"),
                lien: getVal("lien")
            },
            defunt: {
                civility: getVal("civilite_defunt"),
                nom: getVal("nom"),
                prenom: getVal("prenom"),
                nom_jeune_fille: getVal("nom_jeune_fille"),
                date_naiss: getVal("date_naiss"),
                lieu_naiss: getVal("lieu_naiss"),
                date_deces: getVal("date_deces"),
                lieu_deces: getVal("lieu_deces"),
                adresse: getVal("adresse_fr"),
                pere: getVal("pere"),
                mere: getVal("mere"),
                situation: getVal("matrimoniale"),
                conjoint: getVal("conjoint"),
                profession: getVal("prof_type"),
                nationalite: getVal("nationalite")
            },
            type_obseques: getVal("prestation"),
            date_mise_biere: getVal("date_fermeture"),
            lieu_mise_biere: getVal("lieu_mise_biere"),
            cimetiere: getVal("cimetiere_nom"),
            
            lastModified: new Date().toISOString(),
            dateSignature: getVal("dateSignature"),
            villeSignature: getVal("faita")
        };

        const id = document.getElementById('dossier_id').value; // ID du champ caché dans votre HTML

        if (id) {
            await updateDoc(doc(db, "dossiers_admin", id), dossierData);
            alert("✅ Dossier mis à jour !");
        } else {
            dossierData.date_creation = new Date().toISOString();
            await addDoc(collection(db, "dossiers_admin"), dossierData);
            alert("✅ Nouveau dossier créé !");
        }
        
        window.showSection('base');
        chargerBaseClients();

    } catch (e) {
        console.error(e);
        alert("Erreur sauvegarde : " + e.message);
    }
    
    if(actualBtn) {
        actualBtn.innerHTML = '<i class="fas fa-save"></i> ENREGISTRER'; 
        actualBtn.disabled = false;
    }
}

export async function supprimerDossier(id) {
    if(confirm("ATTENTION : Cette suppression est définitive.\nConfirmer ?")) {
        try {
            await deleteDoc(doc(db, "dossiers_admin", id));
            chargerBaseClients();
        } catch (e) {
            alert("Erreur suppression : " + e.message);
        }
    }
}
