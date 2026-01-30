/* js/client_manager.js */
import { db } from './config.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getVal } from './utils.js';

// --- CHARGER LA LISTE ---
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
            const nomMandant = data.mandant ? data.mandant.nom : '?';
            const nomDefunt = data.defunt ? data.defunt.nom : '?';
            const dateDeces = data.defunt ? data.defunt.date_deces : '?';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(data.date_creation).toLocaleDateString()}</td>
                <td><strong>${nomDefunt}</strong> (${dateDeces})</td>
                <td>${nomMandant}</td>
                <td><span class="badge badge-regle">${data.type_obseques || 'Non défini'}</span></td>
                <td style="text-align:center;">
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
    const btn = document.getElementById('btn-save-bdd');
    if(btn) { btn.innerHTML = "Sauvegarde..."; btn.disabled = true; }

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
                profession_libelle: getVal("profession_libelle"),
                nationalite: getVal("nationalite")
            },
            type_obseques: getVal("prestation"),
            technique: {
                mise_biere: getVal("lieu_mise_biere"),
                date_fermeture: getVal("date_fermeture"),
                vehicule: getVal("immatriculation"),
                presence: document.getElementById('type_presence_select').value
            },
            details_op: {
                cimetiere: getVal("cimetiere_nom"),
                concession: getVal("num_concession"),
                titulaire: getVal("titulaire_concession"),
                crematorium: getVal("crematorium_nom"),
                dest_cendres: getVal("destination_cendres")
            },
            lastModified: new Date().toISOString(),
            dateSignature: getVal("dateSignature"),
            villeSignature: getVal("faita")
        };

        const id = document.getElementById('dossier_id').value;

        if (id) {
            await updateDoc(doc(db, "dossiers_admin", id), dossierData);
            alert("✅ Dossier mis à jour !");
        } else {
            dossierData.date_creation = new Date().toISOString();
            await addDoc(collection(db, "dossiers_admin"), dossierData);
            alert("✅ Nouveau dossier créé !");
        }
        
        window.showSection('base'); // Retour liste
        chargerBaseClients();

    } catch (e) {
        console.error(e);
        alert("Erreur sauvegarde : " + e.message);
    }
    
    if(btn) { btn.innerHTML = '<i class="fas fa-save"></i> ENREGISTRER'; btn.disabled = false; }
}

// --- SUPPRIMER ---
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