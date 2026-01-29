/* Fichier : js/client_manager.js */
import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from './config.js';
import { getVal } from './utils.js';

// --- CHARGER LA LISTE DES CLIENTS ---
export async function chargerBaseClients() {
    const tbody = document.getElementById('clients-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chargement...</td></tr>';
    
    try {
        // On récupère les 50 derniers dossiers modifiés
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

// --- SAUVEGARDER UN DOSSIER (Création ou Mise à jour) ---
export async function sauvegarderDossier() {
    const btn = document.getElementById('btn-save-dossier');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Sauvegarde..."; btn.disabled = true;

    try {
        // 1. Récupération des données du formulaire (via getVal de utils.js)
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
            // Données techniques
            type_obseques: getVal("prestation"),
            date_mise_biere: getVal("date_fermeture"),
            lieu_mise_biere: getVal("lieu_mise_biere"),
            cimetiere: getVal("cimetiere_nom"),
            
            // Métadonnées
            lastModified: new Date().toISOString(),
            dateSignature: getVal("dateSignature"),
            villeSignature: getVal("faita")
        };

        const id = document.getElementById('current_dossier_id').value;

        if (id) {
            // Mise à jour
            await updateDoc(doc(db, "dossiers_admin", id), dossierData);
            alert("✅ Dossier mis à jour !");
        } else {
            // Création
            dossierData.date_creation = new Date().toISOString();
            await addDoc(collection(db, "dossiers_admin"), dossierData);
            alert("✅ Nouveau dossier créé !");
        }
        
        // Retour à la liste
        window.showSection('base');
        chargerBaseClients();

    } catch (e) {
        console.error(e);
        alert("Erreur sauvegarde : " + e.message);
    }
    
    btn.innerHTML = originalText; btn.disabled = false;
}

// --- SUPPRIMER UN DOSSIER ---
export async function supprimerDossier(id) {
    if(confirm("ATTENTION : Cette suppression est définitive.\nConfirmer ?")) {
        try {
            await deleteDoc(doc(db, "dossiers_admin", id));
            chargerBaseClients(); // Rafraichir la liste
        } catch (e) {
            alert("Erreur suppression : " + e.message);
        }
    }
}