/* js/client_manager.js - VERSION ROBUSTE (Sans tri bloquant) */
import { db } from './config.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getVal } from './utils.js';

// --- CHARGER LA LISTE (Mode Sans Échec) ---
export async function chargerBaseClients() {
    const tbody = document.getElementById('clients-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Chargement en cours...</td></tr>';
    
    try {
        // 1. On essaie de récupérer TOUS les documents sans tri (pour éviter les erreurs d'index)
        const q = collection(db, "dossiers_admin");
        const querySnapshot = await getDocs(q);
        
        tbody.innerHTML = "";
        
        if(querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">La base de données "dossiers_admin" est vide.</td></tr>';
            return;
        }

        // 2. On convertit en liste pour trier manuellement en JavaScript (plus sûr)
        let dossiers = [];
        querySnapshot.forEach(doc => {
            dossiers.push({ id: doc.id, ...doc.data() });
        });

        // Tri du plus récent au plus ancien (basé sur la date de création ou modification)
        dossiers.sort((a, b) => {
            const dateA = new Date(a.date_creation || a.date_modification || 0);
            const dateB = new Date(b.date_creation || b.date_modification || 0);
            return dateB - dateA;
        });

        // 3. Affichage
        dossiers.forEach((data) => {
            const dateC = data.date_creation ? new Date(data.date_creation).toLocaleDateString() : "-";
            const nomDefunt = data.defunt ? (data.defunt.nom || 'Inconnu') : 'Inconnu';
            const nomMandant = data.mandant ? (data.mandant.nom || '-') : '-';
            const operation = data.technique ? (data.technique.type_operation || 'Inhumation') : 'Dossier';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateC}</td>
                <td><strong>${nomDefunt}</strong></td>
                <td>${nomMandant}</td>
                <td><span class="badge">${operation}</span></td>
                <td style="text-align:center; display:flex; justify-content:center; gap:5px;">
                    <button class="btn-icon" onclick="window.chargerDossier('${data.id}')" title="Modifier"><i class="fas fa-edit" style="color:#3b82f6;"></i></button>
                    <button class="btn-icon" onclick="window.supprimerDossier('${data.id}')" style="margin-left:5px;"><i class="fas fa-trash" style="color:#ef4444;"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error("Erreur critique chargement:", e);
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">ERREUR: ${e.message}<br>Vérifiez la console (F12)</td></tr>`;
    }
}

// --- CHARGER UN DOSSIER (Pour modification) ---
export async function chargerDossier(id) {
    // Cette fonction est déjà importée/gérée dans script.js via window.chargerDossier
    // Mais on peut la laisser ici pour la propreté si besoin de logique spécifique
}

// --- SAUVEGARDER ---
export async function sauvegarderDossier() {
    const btn = document.getElementById('btn-save-bdd');
    if(btn) { btn.innerHTML = "Sauvegarde..."; btn.disabled = true; }

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
                rapa_pays: getVal('rap_pays'), rapa_ville: getVal('rap_ville'), rapa_lta: getVal('rap_lta'),
                vol1: getVal('vol1_num'), vol2: getVal('vol2_num'),
                rapa_route: { immat: getVal('rap_immat'), dep_date: getVal('rap_date_dep_route'), ville_dep: getVal('rap_ville_dep'), ville_arr: getVal('rap_ville_arr') },
                vol_details: { 
                    v1_dep: getVal('vol1_dep_aero'), v1_arr: getVal('vol1_arr_aero'), v1_dtime: getVal('vol1_dep_time'), v1_atime: getVal('vol1_arr_time'),
                    v2_dep: getVal('vol2_dep_aero'), v2_arr: getVal('vol2_arr_aero'), v2_dtime: getVal('vol2_dep_time'), v2_atime: getVal('vol2_arr_time')
                }
            },
            date_modification: new Date().toISOString()
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
        
        if(window.chargerBaseClients) window.chargerBaseClients();
        if(window.showSection) window.showSection('base');

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
