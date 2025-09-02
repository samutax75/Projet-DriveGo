# app.py - Application Flask DriveGO 
# ============================================================================
# RÉORGANISATION CLAIRE ET STRUCTURÉE
# ============================================================================

from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import re
from datetime import datetime, timedelta
import os
from decimal import Decimal
import secrets
import urllib.parse
from functools import wraps
import jinja2
from flask import send_from_directory
from flask import send_file
import tempfile
import pdfkit
import platform
import sys
import io
import shutil


app = Flask(__name__)

# ============================================================================
# 🔧 CONFIGURATION ET INITIALISATION
# ============================================================================

# Configuration pour la production
app.secret_key = os.environ.get('SECRET_KEY', 'fallback-secret-key-change-in-production')
# Configuration de la base de données avec migration
from werkzeug.security import generate_password_hash
if sys.platform.startswith("win"):
    # Chemin Windows
    wkhtmltopdf_path = r"C:\Users\LENOVO\wkhtmltopdf\bin\wkhtmltopdf.exe"
else:
    # Chemin Linux (Render)
    wkhtmltopdf_path = "/usr/bin/wkhtmltopdf"

# Créer la configuration pdfkit
config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)
DATABASE = 'drivego.db'

def init_db():
    """Initialise la base de données avec les tables nécessaires"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Table des utilisateurs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            telephone TEXT,
            role TEXT DEFAULT 'client',
            profile_picture TEXT DEFAULT "",
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table pour gérer les tokens d'invitation
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invitation_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            used BOOLEAN DEFAULT 0,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    ''')

    # Table des véhicules
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehicules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            immatriculation TEXT UNIQUE NOT NULL,
            date_immatriculation TEXT NOT NULL,
            controle TEXT,
            prochain_controle TEXT,
            fin_validite TEXT,
            numero_carte TEXT,
            disponible BOOLEAN DEFAULT 1,
            statut TEXT DEFAULT 'actif',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
   # Table des réservations (version complète)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        vehicule_id INTEGER NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        heure_debut TEXT NOT NULL DEFAULT '09:00',
        heure_fin TEXT NOT NULL DEFAULT '17:00',
        motif TEXT NOT NULL DEFAULT 'autre',
        statut TEXT DEFAULT 'en_attente',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (vehicule_id) REFERENCES vehicules (id)
    )
''')

    # Migration de la table missions
    migrate_missions_table(cursor)

    # Créer un utilisateur admin par défaut si aucun n'existe
    cursor.execute('SELECT COUNT(*) FROM users WHERE role = "admin"')
    if cursor.fetchone()[0] == 0:
        admin_password = generate_password_hash('admin123')  # ⚠️ changez ce mot de passe
        cursor.execute('''
            INSERT INTO users (email, password_hash, nom, prenom, telephone, role)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('admin@drivego.com', admin_password, 'Admin', 'DriveGo', '', 'admin'))

    # Insérer les véhicules réels si vide
    cursor.execute('SELECT COUNT(*) FROM vehicules')
    if cursor.fetchone()[0] == 0:
        vehicules_reels = [
            (1, "TRAFIC BLANC", "FV-088-JJ", "26/11/2020", "29/10/2024", "28/10/2026", "30/09/2026", "4985080", 1, "actif", ""),
            (2, "TRAFIC PMR", "GT-176-AF", "14/12/2023", "", "14/12/2027", "30/06/2029", "8954319", 1, "actif", ""),
            (3, "TRAFIC VERT", "EJ-374-TT", "02/02/2017", "12/03/2025", "11/03/2027", "30/09/2026", "4985081", 1, "actif", ""),
            (4, "TRAFIC ROUGE", "CW-819-FR", "26/06/2013", "27/01/2025", "26/01/2027", "30/09/2026", "4985082", 1, "actif", ""),
            (5, "KANGOO", "DS-429-PF", "22/06/2015", "29/01/2025", "28/01/2027", "30/09/2026", "4985084", 1, "actif", "")
        ]
        
        cursor.executemany('''
            INSERT INTO vehicules (id, nom, immatriculation, date_immatriculation, controle, prochain_controle, fin_validite, numero_carte, disponible, statut, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', vehicules_reels)

    conn.commit()
    conn.close()


def migrate_missions_table(cursor):
    """Recrée la table missions avec les bonnes colonnes (migration sans perte de données)
       et ajoute les colonnes obligatoires pour le PDF si elles manquent"""
    
    # Vérifier si la table missions existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='missions'")
    table_exists = cursor.fetchone()

    if not table_exists:
        # Créer directement la table missions si elle n'existe pas
        cursor.execute('''
            CREATE TABLE missions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicule_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                date_mission DATE NOT NULL,
                heure_debut TEXT DEFAULT "",
                heure_fin TEXT,
                motif TEXT NOT NULL DEFAULT "",
                destination TEXT NOT NULL DEFAULT "",
                nb_passagers INTEGER DEFAULT 1,
                km_depart INTEGER NOT NULL,
                km_arrivee INTEGER,
                notes TEXT,
                statut TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicule_id) REFERENCES vehicules (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
    else:
        # Vérifier les colonnes existantes dans missions
        cursor.execute("PRAGMA table_info(missions)")
        existing_columns = [col[1] for col in cursor.fetchall()]

        # Colonnes obligatoires pour le PDF
        required_columns = [
            "date_mission", "heure_debut", "heure_fin", "motif", "destination",
            "nb_passagers", "km_depart", "km_arrivee", "statut", "notes"
        ]

        # Ajouter les colonnes manquantes sans perte de données
        missing_columns = [c for c in required_columns if c not in existing_columns]
        if missing_columns:
            print(f"⚠️ Migration : ajout colonnes manquantes {missing_columns}")
            for col in missing_columns:
                col_type = "INTEGER" if "nb_passagers" in col or "km" in col else "TEXT"
                default = "DEFAULT 0" if col_type == "INTEGER" else "DEFAULT ''"
                cursor.execute(f"ALTER TABLE missions ADD COLUMN {col} {col_type} {default}")

        # Vérifier si certaines colonnes essentielles manquent pour reconstruire la table
        if "heure_debut" not in existing_columns or "heure_fin" not in existing_columns or "motif" not in existing_columns:
            print("⚠️ Migration : reconstruction de la table missions")

            # Renommer l'ancienne table
            cursor.execute("ALTER TABLE missions RENAME TO missions_old")

            # Recréer missions avec la bonne structure
            cursor.execute('''
                CREATE TABLE missions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    vehicule_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    date_mission DATE NOT NULL,
                    heure_debut TEXT DEFAULT "",
                    heure_fin TEXT,
                    motif TEXT NOT NULL DEFAULT "",
                    destination TEXT NOT NULL DEFAULT "",
                    nb_passagers INTEGER DEFAULT 1,
                    km_depart INTEGER NOT NULL,
                    km_arrivee INTEGER,
                    notes TEXT,
                    statut TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (vehicule_id) REFERENCES vehicules (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')

            # Récupérer colonnes existantes dans missions_old
            cursor.execute("PRAGMA table_info(missions_old)")
            old_columns = [col[1] for col in cursor.fetchall()]

            # Colonnes à conserver
            common_columns = [c for c in [
                "id", "vehicule_id", "user_id", "date_mission",
                "motif", "destination", "nb_passagers",
                "km_depart", "km_arrivee", "notes",
                "statut", "created_at", "updated_at"
            ] if c in old_columns]

            # Construire dynamiquement la requête INSERT
            col_list = ", ".join(common_columns)
            select_list = ", ".join(common_columns)

            cursor.execute(f'''
                INSERT INTO missions ({col_list})
                SELECT {select_list} FROM missions_old
            ''')

            # Supprimer l’ancienne table
            cursor.execute("DROP TABLE missions_old")

# Initialiser la base au lancement
init_db()


# ============================================================================
# Route PDF
# ============================================================================

# def get_pdfkit_config():
#     """Retourne la config pdfkit adaptée à l'environnement"""
#     if platform.system() == "Windows":
#         # Chemins possibles sur Windows
#         possible_paths = [
#             r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe",  # Installation standard 64-bit
#             r"C:\Program Files (x86)\wkhtmltopdf\bin\wkhtmltopdf.exe",  # Installation 32-bit
#             r"C:\Users\LENOVO\wkhtmltopdf\bin\wkhtmltopdf.exe",  # Votre chemin actuel
#             shutil.which("wkhtmltopdf"),  # Dans le PATH système
#         ]
        
#         for path in possible_paths:
#             if path and os.path.exists(path):
#                 print(f"✅ wkhtmltopdf trouvé à : {path}")
#                 return pdfkit.configuration(wkhtmltopdf=path)
        
#         # Aucun chemin trouvé
#         print("❌ wkhtmltopdf non trouvé sur Windows!")
#         print("Chemins vérifiés :")
#         for path in possible_paths:
#             if path:
#                 print(f"  - {path} {'✅' if os.path.exists(path) else '❌'}")
#         print("Installez wkhtmltopdf depuis : https://wkhtmltopdf.org/downloads.html")
#         return None
        
#     else:
#         # Linux (Render, etc.)
#         linux_paths = [
#             "/usr/bin/wkhtmltopdf",
#             "/usr/local/bin/wkhtmltopdf",
#             shutil.which("wkhtmltopdf"),
#         ]
        
#         for path in linux_paths:
#             if path and os.path.exists(path):
#                 print(f"✅ wkhtmltopdf trouvé à : {path}")
#                 return pdfkit.configuration(wkhtmltopdf=path)
        
#         print("❌ wkhtmltopdf non trouvé sur Linux!")
#         return None

# def generate_missions_html(missions, user):
#     rows = ""
#     for m in missions:
#         rows += f"""
#         <tr>
#             <td>{m['date_mission']}</td>
#             <td>{m['heure_debut']}</td>
#             <td>{m['heure_fin']}</td>
#             <td>{m['motif']}</td>
#             <td>{m['destination']}</td>
#             <td>{m['nb_passagers']}</td>
#             <td>{m['vehicule_nom']} ({m['immatriculation']})</td>
#             <td>{m['km_depart']}</td>
#             <td>{m['km_arrivee']}</td>
#             <td>{m['statut']}</td>
#         </tr>
#         """
#     html = f"""
#     <html>
#     <head>
#         <meta charset="utf-8">
#         <style>
#             table {{ width: 100%; border-collapse: collapse; }}
#             th, td {{ border: 1px solid #000; padding: 5px; text-align: left; }}
#             th {{ background-color: #f2f2f2; }}
#         </style>
#     </head>
#     <body>
#         <h2>Missions de {user['nom']} ({user['email']})</h2>
#         <table>
#             <thead>
#                 <tr>
#                     <th>Date</th>
#                     <th>Début</th>
#                     <th>Fin</th>
#                     <th>Motif</th>
#                     <th>Destination</th>
#                     <th>Nb Passagers</th>
#                     <th>Véhicule</th>
#                     <th>Km Départ</th>
#                     <th>Km Arrivée</th>
#                     <th>Statut</th>
#                 </tr>
#             </thead>
#             <tbody>
#                 {rows}
#             </tbody>
#         </table>
#     </body>
#     </html>
#     """
#     return html


# # Route unifiée pour GET et POST
# @app.route('/api/missions/export-pdf', methods=['GET', 'POST'])
# def export_missions_pdf():
#     try:
#         # Vérifier l'authentification
#         if 'user_id' not in session:
#             if request.method == 'GET':
#                 return "Non authentifié", 401
#             else:
#                 return jsonify({'success': False, 'error': 'Non authentifié'}), 401

#         user_id = session['user_id']

#         # Pour GET : vérifier que c'est bien l'utilisateur demandé (sécurité)
#         if request.method == 'GET':
#             requested_user_id = request.args.get('userId')
#             if requested_user_id and str(user_id) != str(requested_user_id):
#                 return "Accès non autorisé", 403

#         # --- Connexion DB ---
#         conn = sqlite3.connect(DATABASE)
#         conn.row_factory = sqlite3.Row
#         cursor = conn.cursor()

#         # --- Migration pour s'assurer que toutes les colonnes PDF existent ---
#         migrate_missions_table(cursor)

#         # --- Récupérer missions ---
#         cursor.execute("""
#             SELECT 
#                 m.id, m.date_mission, m.heure_debut, m.heure_fin,
#                 m.motif, m.destination, m.nb_passagers, 
#                 m.km_depart, m.km_arrivee, m.statut, m.notes,
#                 v.nom as vehicule_nom, v.immatriculation,
#                 u.nom as user_nom, u.email as user_email
#             FROM missions m
#             JOIN vehicules v ON m.vehicule_id = v.id
#             JOIN users u ON m.user_id = u.id
#             WHERE m.user_id = ?
#             ORDER BY m.created_at DESC
#         """, (user_id,))
#         missions = cursor.fetchall()

#         cursor.execute("SELECT nom, email FROM users WHERE id = ?", (user_id,))
#         user = cursor.fetchone()

#         conn.close()

#         # Vérifier si missions et user existent
#         if not missions:
#             if request.method == 'GET':
#                 return "Aucune mission à exporter", 400
#             else:
#                 return jsonify({'success': False, 'error': 'Aucune mission à exporter'}), 400
        
#         if not user:
#             if request.method == 'GET':
#                 return "Utilisateur introuvable", 400
#             else:
#                 return jsonify({'success': False, 'error': 'Utilisateur introuvable'}), 400

#         # --- Générer HTML ---
#         if request.method == 'POST':
#             # Pour POST : utiliser le HTML envoyé par le client (si fourni)
#             data = request.get_json()
#             html_content = data.get('html_content') if data else None
#             if not html_content:
#                 html_content = generate_missions_html(missions, user)
#         else:
#             # Pour GET : toujours générer le HTML côté serveur
#             html_content = generate_missions_html(missions, user)

#         # --- Générer PDF en mémoire ---
#         wkhtmltopdf_path = r"C:\Users\LENOVO\wkhtmltopdf\bin\wkhtmltopdf.exe"
#         config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)

#         import io
#         pdf_bytes = pdfkit.from_string(html_content, False, configuration=config)
#         pdf_stream = io.BytesIO(pdf_bytes)

#         # --- Nom du fichier sécurisé ---
#         safe_username = "".join(c for c in user['nom'] if c.isalnum() or c in (' ', '-', '_')).strip()
#         filename = f'missions_{safe_username}_{datetime.now().strftime("%Y%m%d")}.pdf'

#         # --- Retourner le PDF ---
#         return send_file(
#             pdf_stream,
#             as_attachment=True,
#             download_name=filename,
#             mimetype='application/pdf'
#         )

#     except Exception as e:
#         print(f"Erreur export PDF ({request.method}) : {e}")
#         if request.method == 'GET':
#             return f"Erreur serveur: {str(e)}", 500
#         else:
#             return jsonify({'success': False, 'error': f'Erreur serveur: {str(e)}'}), 500




# ============================================================================
# 🛠️ FONCTIONS UTILITAIRES (8 fonctions)
# ============================================================================

def validate_email(email):
    """Valide le format de l'email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valide la force du mot de passe"""
    if len(password) < 6:
        return False, "Le mot de passe doit contenir au moins 6 caractères"
    return True, "Mot de passe valide"

def login_required(f):
    """Décorateur pour vérifier l'authentification"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('connexion'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Décorateur pour vérifier les droits admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
        return f(*args, **kwargs)
    return decorated_function

def get_user_profile_picture(user_id):
    """Récupère la photo de profil d'un utilisateur depuis la base de données"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT profile_picture FROM users WHERE id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result and result[0] else ''

def detect_gender(prenom):
    """Fonction simple pour détecter le genre par la terminaison du prénom"""
    if not prenom:
        return None
    
    prenom_lower = prenom.lower()
    
    # Terminaisons typiquement féminines
    if prenom_lower.endswith(('a', 'e', 'ia', 'ine', 'elle', 'ette')):
        return 'feminin'
    # Terminaisons typiquement masculines ou neutres
    else:
        return 'masculin'

def adapt_user_role(fonction_base, prenom):
    """Adapte le rôle selon le genre automatiquement détecté"""
    if 'éducateur' in fonction_base.lower():
        genre = detect_gender(prenom)
        if genre == 'feminin':
            return 'Éducatrice'
        else:
            return 'Éducateur'  # Par défaut masculin
    else:
        return fonction_base  # Garde l'original pour autres rôles

def validate_dates(date_debut, date_fin):
    """Valide les dates de réservation"""
    try:
        debut = datetime.strptime(date_debut, '%Y-%m-%d').date()
        fin = datetime.strptime(date_fin, '%Y-%m-%d').date()
        
        if debut <= datetime.now().date():
            return False, 'La date de début doit être dans le futur'
        
        if fin <= debut:
            return False, 'La date de fin doit être après la date de début'
            
        return True, 'Dates valides'
    except ValueError:
        return False, 'Format de date invalide (YYYY-MM-DD attendu)'


# ============================================================================
# 🌐 ROUTES PUBLIQUES (10 routes)
# ============================================================================

@app.route('/')
def index():
    """Page d'accueil"""
    user_logged_in = 'user_id' in session
    user_name = f"{session.get('prenom', '')} {session.get('nom', '')}" if user_logged_in else ''
    
    # Adaptation du rôle selon le genre automatiquement détecté
    user_role = ''
    if user_logged_in:
        fonction_base = session.get('fonction', 'Éducateur/trice')
        prenom = session.get('prenom', '')
        user_role = adapt_user_role(fonction_base, prenom)
    
    # Récupération de la photo de profil
    user_profile_picture = session.get('profile_picture_url', '') if user_logged_in else ''

    return render_template('index.html', 
        user_logged_in=user_logged_in, 
        user_name=user_name.strip(),
        user_role=user_role,
        user_profile_picture=user_profile_picture
    )

@app.route('/aide')
def aide():
    """Page d'aide"""
    return render_template('aide.html')

@app.route('/fiches_vehicules')
def vehicles_page():
    """Page d'affichage des véhicules"""
    return render_template('fiches_vehicules.html')

@app.route('/support')
def support():
    """Page de support"""
    return render_template('support.html')

@app.route("/mot_de_passe_oublie", methods=["GET", "POST"])
def mot_de_passe_oublie():
    if request.method == "POST":
        email = request.form.get("email")

        # Vérifications éventuelles ici (ex: si l'email existe en base)

        # On sauvegarde l’email dans la session
        session['password_reset_email'] = email.lower().strip()

        # Puis on redirige vers la page pour changer le mot de passe
        return redirect(url_for('change_password'))

    return render_template("mot_de_passe_oublie.html")


@app.route("/change_password", methods=["GET", "POST"])
def change_password():
    """Page pour changer le mot de passe"""
    if request.method == "POST":
        # Vérifier si c'est une requête AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        current_password = request.form.get("current_password")
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")
        
        # Vérifier si c'est une réinitialisation (depuis mot de passe oublié)
        # Dans ce cas, on devrait avoir un token ou un email dans la session
        is_reset = session.get('password_reset_email') is not None
        reset_email = session.get('password_reset_email')

        # Dictionnaire pour stocker les erreurs
        errors = {}

        # Validation différente selon le contexte
        if is_reset:
            # Cas : Réinitialisation de mot de passe (pas besoin de l'ancien mot de passe)
            print(f"DEBUG - Password reset for email: {reset_email}")
            
            if not reset_email:
                if is_ajax:
                    return jsonify({
                        'success': False,
                        'message': 'Session de réinitialisation expirée'
                    }), 400
                else:
                    flash("Session de réinitialisation expirée", "error")
                    return redirect(url_for('mot_de_passe_oublie'))
        else:
            # Cas : Changement de mot de passe normal (utilisateur connecté)
            user_id = session.get('user_id')
            if not user_id:
                if is_ajax:
                    return jsonify({
                        'success': False,
                        'message': 'Vous devez être connecté'
                    }), 401
                else:
                    return redirect(url_for('connexion'))
            
            # Validation du mot de passe actuel
            if not current_password:
                errors['current_password'] = "Le mot de passe actuel est requis"
            else:
                conn = sqlite3.connect('drivego.db')
                cursor = conn.cursor()
                cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
                user_data = cursor.fetchone()
                conn.close()
                
                if not user_data or not check_password_hash(user_data[0], current_password):
                    errors['current_password'] = "Mot de passe actuel incorrect"

        # Validation commune : correspondance des mots de passe
        if new_password != confirm_password:
            errors['confirm_password'] = "Les mots de passe ne correspondent pas"

        # Validation commune : longueur minimale
        if len(new_password) < 8:
            errors['new_password'] = "Le mot de passe doit contenir au moins 8 caractères"

        # Validation commune : le nouveau mot de passe doit être différent de l'ancien
        if not is_reset and current_password and new_password and current_password == new_password:
            errors['new_password'] = "Le nouveau mot de passe doit être différent de l'ancien"

        # Validation commune : complexité du mot de passe
        password_errors = []
        
        if not re.search(r'[A-Z]', new_password):
            password_errors.append("au moins une lettre majuscule")
        
        if not re.search(r'[a-z]', new_password):
            password_errors.append("au moins une lettre minuscule")
        
        if not re.search(r'\d', new_password):
            password_errors.append("au moins un chiffre")
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\?]', new_password):
            password_errors.append("au moins un caractère spécial")

        if password_errors:
            error_msg = f"Le mot de passe doit contenir : {', '.join(password_errors)}"
            errors['new_password'] = error_msg

        # S'il y a des erreurs
        if errors:
            if is_ajax:
                return jsonify({
                    'success': False,
                    'message': 'Erreurs de validation',
                    'errors': errors
                }), 400
            else:
                # Pour les requêtes non-AJAX (fallback)
                for field, error in errors.items():
                    flash(error, "error")
                return render_template("change_password.html")

        # Si pas d'erreurs, procéder au changement
        try:
            # Hash du nouveau mot de passe
            hashed_password = generate_password_hash(new_password)
            
            conn = sqlite3.connect('drivego.db')
            cursor = conn.cursor()
            
            if is_reset:
                # Mise à jour par email (réinitialisation)
                cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (hashed_password, reset_email))
                user_affected = cursor.rowcount
                print(f"DEBUG - Password reset completed for {reset_email}, rows affected: {user_affected}")
                
                # Nettoyer la session de réinitialisation
                session.pop('password_reset_email', None)
                
            else:
                # Mise à jour par user_id (changement normal)
                user_id = session.get('user_id')
                cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed_password, user_id))
                user_affected = cursor.rowcount
                print(f"DEBUG - Password changed for user ID: {user_id}, rows affected: {user_affected}")
            
            conn.commit()
            conn.close()
            
            if user_affected > 0:
                if is_ajax:
                    return jsonify({
                        'success': True,
                        'message': 'Mot de passe modifié avec succès !'
                    }), 200
                else:
                    flash("Mot de passe changé avec succès ✅", "success")
                    return redirect(url_for("connexion"))  # Redirection vers connexion après reset
            else:
                raise Exception("Aucune ligne mise à jour")
            
        except Exception as e:
            print(f"Erreur lors du changement de mot de passe: {e}")
            
            if is_ajax:
                return jsonify({
                    'success': False,
                    'message': 'Erreur lors de la mise à jour. Veuillez réessayer.'
                }), 500
            else:
                flash("Erreur lors de la mise à jour. Veuillez réessayer.", "error")
                return render_template("change_password.html")

    # GET request
    # Vérifier si c'est une réinitialisation ou un changement normal
    is_reset = session.get('password_reset_email') is not None
    return render_template("change_password.html", is_reset=is_reset)


@app.route('/profil', methods=['GET', 'POST'])
@login_required
def profil():
    """Page de profil utilisateur"""
    if 'user_id' not in session:
        return redirect(url_for('connexion'))

    user_id = session['user_id']
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    if request.method == 'POST':
        nom = request.form['nom'].strip()
        prenom = request.form['prenom'].strip()
        email = request.form['email'].strip().lower()
        password = request.form['password']

        # Mise à jour sans le mot de passe
        if password == '':
            cursor.execute('''
                UPDATE users SET nom = ?, prenom = ?, email = ? WHERE id = ?
            ''', (nom, prenom, email, user_id))
        else:
            password_hash = generate_password_hash(password)
            cursor.execute('''
                UPDATE users SET nom = ?, prenom = ?, email = ?, password_hash = ? WHERE id = ?
            ''', (nom, prenom, email, password_hash, user_id))

        conn.commit()

        # Mise à jour de la session
        session['nom'] = nom
        session['prenom'] = prenom
        session['email'] = email

        flash("Profil mis à jour avec succès", "success")
        return redirect(url_for('profil'))

    # Requête utilisateur pour pré-remplir le formulaire
    cursor.execute("SELECT nom, prenom, email FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        flash("Utilisateur introuvable", "error")
        return redirect(url_for('index'))
    utilisateur = {
        'nom': user[0],
        'prenom': user[1],
        'email': user[2]
    }

    return render_template('profil.html', user=utilisateur)

@app.route('/upload-profile-picture', methods=['POST'])
@login_required
def upload_profile_picture():
    """Upload de photo de profil"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Non connecté'}), 401
    
    if 'profile_picture' not in request.files:
        return jsonify({'success': False, 'error': 'Aucun fichier sélectionné'}), 400
    
    file = request.files['profile_picture']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Aucun fichier sélectionné'}), 400
    
    # Vérification du type de fichier
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
        return jsonify({'success': False, 'error': 'Type de fichier non autorisé'}), 400
    
    try:
        # Créer le dossier uploads s'il n'existe pas
        import uuid
        from werkzeug.utils import secure_filename
        
        upload_folder = 'static/uploads/profile_pictures'
        os.makedirs(upload_folder, exist_ok=True)
        
        # Générer un nom de fichier unique
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{session['user_id']}_{uuid.uuid4().hex[:8]}.{file_extension}"
        file_path = os.path.join(upload_folder, unique_filename)
        
        # Sauvegarder le fichier
        file.save(file_path)
        
        # URL relative pour l'affichage
        image_url = f"/static/uploads/profile_pictures/{unique_filename}"
        
        # Mettre à jour la session
        session['profile_picture_url'] = image_url
        
        # Sauvegarde en base de données
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET profile_picture = ? WHERE id = ?", 
                       (image_url, session['user_id']))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'image_url': image_url,
            'message': 'Photo de profil mise à jour avec succès'
        })
        
    except Exception as e:
        print(f"Erreur upload: {e}")
        return jsonify({'success': False, 'error': 'Erreur lors de la sauvegarde'}), 500

@app.route('/delete-profile-picture', methods=['DELETE'])
@login_required
def delete_profile_picture():
    """Suppression de photo de profil"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Non connecté'}), 401
    
    try:
        # Supprimer de la base de données
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET profile_picture = '' WHERE id = ?", 
                       (session['user_id'],))
        conn.commit()
        conn.close()
        
        # Mettre à jour la session
        session['profile_picture_url'] = ''
        
        return jsonify({'success': True, 'message': 'Photo supprimée'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'Erreur serveur'}), 500

@app.route('/logout')
def logout():
    """Déconnexion de l'utilisateur"""
    session.clear()
    flash('Vous avez été déconnecté', 'info')
    return redirect(url_for('index'))

# ============================================================================
# 🔐 ROUTES D'AUTHENTIFICATION (4 API + 3 pages)
# ============================================================================

# --- PAGES D'AUTHENTIFICATION ---

@app.route('/api/user/current', methods=['GET'])
@login_required
def api_get_current_user():
    """Récupère les informations de l'utilisateur connecté"""
    try:
        user_id = session.get('user_id')
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, email, nom, prenom, role FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'error': 'Utilisateur non trouvé'}), 404
        
        conn.close()
        
        return jsonify({
            'success': True, 
            'user': {
                'id': user[0],
                'email': user[1],
                'nom': f"{user[2]} {user[3]}",
                'role': user[4]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
@app.route('/connexion')
def connexion():
    """Page de connexion"""
    return render_template('connexion.html')

@app.route('/inscription')
def inscription():
    """Page d'inscription"""
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('inscription.html')

@app.route('/login/<int:user_id>')
def login(user_id):
    """Simule une connexion d'utilisateur pour debug"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('SELECT id, role FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()

    if user:
        session['user_id'] = user[0]
        session['role'] = user[1]
        return redirect(url_for('profil'))  # ou vers /reservation pour tester
    return "Utilisateur non trouvé", 404

# --- API D'AUTHENTIFICATION ---
@app.route('/api/login', methods=['POST'])
def api_login():
    """API pour la connexion des utilisateurs"""
    try:
        data = request.get_json()

        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email et mot de passe requis'
            }), 400

        email = data['email'].lower().strip()
        password = data['password']

        # Recherche de l'utilisateur avec profile_picture
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, email, password_hash, nom, prenom, role, profile_picture 
            FROM users WHERE email = ?
        ''', (email,))
        user = cursor.fetchone()
        conn.close()

        if not user or not check_password_hash(user[2], password):
            return jsonify({
                'success': False,
                'message': 'Email ou mot de passe incorrect'
            }), 401

        # Connexion réussie - Mise à jour de la session
        session['user_id'] = user[0]
        session['email'] = user[1]
        session['nom'] = user[3]
        session['prenom'] = user[4]
        session['role'] = user[5]
        session['profile_picture_url'] = user[6] if user[6] else ''

        # Redirection selon le rôle
        if user[5] == 'admin':
            redirect_url = url_for('dashboard')
        else:
            redirect_url = url_for('index')

        return jsonify({
            'success': True,
            'message': 'Connexion réussie',
            'user': {
                'nom': user[3],
                'prenom': user[4],
                'role': user[5],
                'profile_picture': user[6] if user[6] else ''
            },
            'redirect': redirect_url
        }), 200

    except Exception as e:
        print(f"Erreur connexion: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la connexion'
        }), 500

@app.route('/api/register', methods=['POST'])
def api_register():
    """API pour l'inscription des utilisateurs"""
    try:
        data = request.get_json()
        token = data.get('token', '')

        # Validation des données
        required_fields = ['email', 'password', 'nom', 'prenom']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400

        email = data['email'].lower().strip()
        password = data['password']
        nom = data['nom'].strip()
        prenom = data['prenom'].strip()
        telephone = data.get('telephone', '').strip()

        # Si un token est fourni, le valider
        if token:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            cursor.execute('''
                SELECT email, expires_at, used FROM invitation_tokens 
                WHERE token = ?
            ''', (token,))
            
            token_data = cursor.fetchone()
            
            if not token_data:
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'Token d\'invitation invalide'
                }), 400
            
            token_email, expires_at, used = token_data
            
            # Vérifications du token
            if used:
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'Ce lien d\'invitation a déjà été utilisé'
                }), 400
            
            if datetime.now() > datetime.fromisoformat(expires_at):
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'Ce lien d\'invitation a expiré'
                }), 400
            
            # Vérifier que l'email correspond au token
            if email != token_email:
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'L\'email ne correspond pas au lien d\'invitation'
                }), 400
            
            conn.close()

        # Validation de l'email
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Format d\'email invalide'
            }), 400

        # Validation du mot de passe
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': message
            }), 400

        # Vérification que l'email n'existe pas déjà
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Cette adresse email est déjà utilisée'
            }), 409

        # Création du compte
        password_hash = generate_password_hash(password)
        cursor.execute('''
            INSERT INTO users (email, password_hash, nom, prenom, telephone, role)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (email, password_hash, nom, prenom, telephone, 'client'))

        # Si un token était utilisé, le marquer comme utilisé
        if token:
            cursor.execute('''
                UPDATE invitation_tokens SET used = 1 WHERE token = ?
            ''', (token,))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Compte créé avec succès',
            'redirect': url_for('connexion')
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la création du compte'
        }), 500

@app.route('/api/validate-token', methods=['POST'])
def validate_token():
    """Valider un token d'invitation"""
    try:
        data = request.get_json()
        token = data.get('token', '')
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token requis'
            }), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT email, expires_at, used FROM invitation_tokens 
            WHERE token = ?
        ''', (token,))
        
        token_data = cursor.fetchone()
        conn.close()
        
        if not token_data:
            return jsonify({
                'success': False,
                'message': 'Token invalide'
            }), 404
        
        email, expires_at, used = token_data
        
        # Vérifier si le token a déjà été utilisé
        if used:
            return jsonify({
                'success': False,
                'message': 'Ce lien d\'invitation a déjà été utilisé'
            }), 410
        
        # Vérifier si le token a expiré
        if datetime.now() > datetime.fromisoformat(expires_at):
            return jsonify({
                'success': False,
                'message': 'Ce lien d\'invitation a expiré'
            }), 410
        
        return jsonify({
            'success': True,
            'email': email,
            'message': 'Token valide'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la validation du token'
        }), 500


# ============================================================================
# ROUTES MISSION
# ============================================================================
# Routes API supplémentaires pour la gestion des missions

@app.route('/api/missions', methods=['POST'])
def api_create_mission():
    """Créer une nouvelle mission"""
    try:
        if 'user_id' not in session:
            return jsonify({
                'success': False,
                'error': 'Utilisateur non connecté'
            }), 401
        
        data = request.get_json()
        user_id = session['user_id']
        
        # Validation des données requises
        required_fields = ['vehicule_id', 'date_mission', 'heure_debut', 'motif', 'destination', 'nb_passagers', 'km_depart']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400
        
        # Vérifier que le véhicule est disponible
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT disponible, statut FROM vehicules WHERE id = ?
        ''', (data['vehicule_id'],))
        
        vehicule = cursor.fetchone()
        if not vehicule or not vehicule[0]:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Véhicule non disponible'
            }), 400
        
        # Vérifier qu'il n'y a pas déjà une mission active pour ce véhicule
        cursor.execute('''
            SELECT COUNT(*) FROM missions 
            WHERE vehicule_id = ? AND statut = 'active'
        ''', (data['vehicule_id'],))
        
        if cursor.fetchone()[0] > 0:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Une mission est déjà active sur ce véhicule'
            }), 400
        
        # Vérifier que l'utilisateur n'a pas déjà une mission active
        cursor.execute('''
            SELECT COUNT(*) FROM missions 
            WHERE user_id = ? AND statut = 'active'
        ''', (user_id,))
        
        if cursor.fetchone()[0] > 0:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Vous avez déjà une mission active'
            }), 400
        
        # Créer la mission
        cursor.execute('''
            INSERT INTO missions 
            (vehicule_id, user_id, date_mission, heure_debut, motif, destination, 
             nb_passagers, km_depart, notes, statut, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
        ''', (
            data['vehicule_id'], user_id, data['date_mission'],
            data['heure_debut'], data['motif'], data['destination'],
            data['nb_passagers'], data['km_depart'], data.get('notes', '')
        ))
        
        mission_id = cursor.lastrowid
        
        # Marquer le véhicule comme occupé (optionnel, selon votre logique métier)
        cursor.execute('''
            UPDATE vehicules 
            SET statut = 'En mission'
            WHERE id = ?
        ''', (data['vehicule_id'],))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Mission créée avec succès',
            'mission_id': mission_id
        }), 201
        
    except Exception as e:
        print(f"Erreur lors de la création de la mission: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la création de la mission'
        }), 500


@app.route('/api/missions/<int:mission_id>/complete', methods=['PUT'])
def api_complete_mission(mission_id):
    """Terminer une mission"""
    try:
        if 'user_id' not in session:
            return jsonify({
                'success': False,
                'error': 'Utilisateur non connecté'
            }), 401
        
        data = request.get_json()
        user_id = session['user_id']
        
        # Validation des données requises
        required_fields = ['heure_fin', 'km_arrivee']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400
        
        # Vérifier que la mission appartient à l'utilisateur et est active
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, vehicule_id, km_depart FROM missions 
            WHERE id = ? AND statut = 'active'
        ''', (mission_id,))
        
        mission = cursor.fetchone()
        if not mission:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Mission introuvable ou déjà terminée'
            }), 404
        
        if mission[0] != user_id:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Accès non autorisé'
            }), 403
        
        # Validation du kilométrage
        if data['km_arrivee'] < mission[2]:  # km_depart
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Le kilométrage d\'arrivée doit être supérieur au kilométrage de départ'
            }), 400
        
        # Mettre à jour la mission
        cursor.execute('''
            UPDATE missions 
            SET heure_fin = ?, km_arrivee = ?, notes = ?, statut = 'completed', updated_at = datetime('now')
            WHERE id = ?
        ''', (
            data['heure_fin'], data['km_arrivee'], 
            data.get('notes', ''), mission_id
        ))
        
        # Libérer le véhicule
        cursor.execute('''
            UPDATE vehicules 
            SET statut = 'Disponible'
            WHERE id = ?
        ''', (mission[1],))  # vehicule_id
        
        conn.commit()
        conn.close()
        
        distance_parcourue = data['km_arrivee'] - mission[2]
        
        return jsonify({
            'success': True,
            'message': 'Mission terminée avec succès',
            'distance_parcourue': distance_parcourue
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la finalisation de la mission: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la finalisation de la mission'
        }), 500


@app.route('/api/user/<int:user_id>/missions', methods=['GET'])
def api_get_user_missions(user_id):
    """Récupérer les missions d'un utilisateur spécifique"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                m.id, m.vehicule_id, m.user_id, m.date_mission, 
                m.heure_debut, m.heure_fin, m.motif, m.destination, 
                m.nb_passagers, m.km_depart, m.km_arrivee, m.notes, 
                m.statut, m.created_at, m.updated_at,
                v.nom as vehicule_nom, v.immatriculation
            FROM missions m
            LEFT JOIN vehicules v ON m.vehicule_id = v.id
            WHERE m.user_id = ?
            ORDER BY m.created_at DESC
        ''', (user_id,))
        
        missions = cursor.fetchall()
        conn.close()
        
        missions_list = []
        for mission in missions:
            missions_list.append({
                'id': mission[0],
                'vehicule_id': mission[1],
                'user_id': mission[2],
                'date_mission': mission[3],
                'heure_debut': mission[4],
                'heure_fin': mission[5],
                'motif': mission[6],
                'destination': mission[7],
                'nb_passagers': mission[8],
                'km_depart': mission[9],
                'km_arrivee': mission[10],
                'notes': mission[11],
                'statut': mission[12],
                'created_at': mission[13],
                'updated_at': mission[14],
                'vehicule_nom': mission[15],
                'vehicule_immatriculation': mission[16]
            })
        
        return jsonify({
            'success': True,
            'missions': missions_list
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des missions utilisateur: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des missions utilisateur'
        }), 500


@app.route('/api/missions/active', methods=['GET'])
def api_get_active_missions():
    """Récupérer toutes les missions actives"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                m.id, m.vehicule_id, m.user_id, m.date_mission, 
                m.heure_debut, m.motif, m.destination, m.nb_passagers, 
                m.km_depart, m.notes, m.created_at,
                u.nom as user_name,
                v.nom as vehicule_nom, v.immatriculation
            FROM missions m
            JOIN users u ON m.user_id = u.id
            JOIN vehicules v ON m.vehicule_id = v.id
            WHERE m.statut = 'active'
            ORDER BY m.created_at DESC
        ''', ())
        
        missions = cursor.fetchall()
        conn.close()
        
        missions_list = []
        for mission in missions:
            missions_list.append({
                'id': mission[0],
                'vehicule_id': mission[1],
                'user_id': mission[2],
                'date_mission': mission[3],
                'heure_debut': mission[4],
                'motif': mission[5],
                'destination': mission[6],
                'nb_passagers': mission[7],
                'km_depart': mission[8],
                'notes': mission[9],
                'created_at': mission[10],
                'user_name': mission[11],
                'vehicule_nom': mission[12],
                'vehicule_immatriculation': mission[13]
            })
        
        return jsonify({
            'success': True,
            'missions': missions_list
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des missions actives: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des missions actives'
        }), 500


@app.route('/api/missions/<int:mission_id>', methods=['DELETE'])
def api_cancel_mission(mission_id):
    """Annuler une mission (seulement si elle n'a pas encore commencé)"""
    try:
        if 'user_id' not in session:
            return jsonify({
                'success': False,
                'error': 'Utilisateur non connecté'
            }), 401
        
        user_id = session['user_id']
        
        # Vérifier que la mission appartient à l'utilisateur
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, vehicule_id, statut FROM missions 
            WHERE id = ?
        ''', (mission_id,))
        
        mission = cursor.fetchone()
        if not mission:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Mission introuvable'
            }), 404
        
        if mission[0] != user_id:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Accès non autorisé'
            }), 403
        
        if mission[2] != 'active':
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Mission déjà terminée ou annulée'
            }), 400
        
        # Annuler la mission
        cursor.execute('''
            UPDATE missions 
            SET statut = 'cancelled', updated_at = datetime('now')
            WHERE id = ?
        ''', (mission_id,))
        
        # Libérer le véhicule
        cursor.execute('''
            UPDATE vehicules 
            SET statut = 'Disponible'
            WHERE id = ?
        ''', (mission[1],))  # vehicule_id
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Mission annulée avec succès'
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de l'annulation de la mission: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de l\'annulation'
        }), 500


# Script pour créer la table missions si elle n'existe pas
def create_missions_table():
    """Créer la table missions si elle n'existe pas"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS missions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicule_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                date_mission DATE NOT NULL,
                heure_debut TIME NOT NULL,
                heure_fin TIME,
                motif TEXT NOT NULL,
                destination TEXT NOT NULL,
                nb_passagers INTEGER DEFAULT 1,
                km_depart INTEGER NOT NULL,
                km_arrivee INTEGER,
                notes TEXT,
                statut TEXT DEFAULT 'active' CHECK (statut IN ('active', 'completed', 'cancelled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicule_id) REFERENCES vehicules (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("Table missions créée ou vérifiée avec succès")
        
    except Exception as e:
        print(f"Erreur lors de la création de la table missions: {e}")


# ============================================================================
# 🚗 ROUTES VÉHICULES (4 API + 1 page)
# ============================================================================

# --- PAGE VÉHICULES ---

@app.route('/gestion_vehicules')
@login_required
def gestion_vehicules():
    """Page de gestion des véhicules"""
    return render_template('gestion_vehicules.html')

# --- API VÉHICULES ---
@app.route('/api/vehicules', methods=['GET'])
def api_get_vehicules():
    """Récupérer la liste des véhicules"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, nom, immatriculation, date_immatriculation, controle, 
                   prochain_controle, fin_validite, numero_carte, disponible, 
                   statut, notes, created_at
            FROM vehicules ORDER BY nom
        ''')
        vehicules = cursor.fetchall()
        conn.close()

        vehicules_list = []
        for vehicule in vehicules:
            vehicules_list.append({
                'id': vehicule[0],
                'nom': vehicule[1],
                'immatriculation': vehicule[2],
                'dateImmatriculation': vehicule[3],
                'controle': vehicule[4],
                'prochainControle': vehicule[5],
                'finValidite': vehicule[6],
                'numeroCarte': vehicule[7],
                'disponible': bool(vehicule[8]),
                'statut': vehicule[9],
                'notes': vehicule[10],
                'created_at': vehicule[11]
            })

        return jsonify({
            'success': True,
            'vehicules': vehicules_list
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des véhicules'
        }), 500

@app.route('/api/vehicules', methods=['POST'])
@admin_required
def api_create_vehicule():
    """Créer un véhicule (admin uniquement)"""
    try:
        data = request.get_json()
        # Validation des données
        required_fields = ['nom', 'immatriculation', 'dateImmatriculation', 'prochainControle', 'finValidite']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400

        # Vérification que l'immatriculation n'existe pas déjà
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM vehicules WHERE immatriculation = ?', (data['immatriculation'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Cette immatriculation existe déjà'
            }), 409

        # Création du véhicule
        cursor.execute('''
            INSERT INTO vehicules (nom, immatriculation, date_immatriculation, controle, prochain_controle, fin_validite, numero_carte, disponible, statut, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['nom'].strip(),
            data['immatriculation'].strip(),
            data['dateImmatriculation'].strip(),
            data.get('controle', '').strip(),
            data['prochainControle'].strip(),
            data['finValidite'].strip(),
            data.get('numeroCarte', '').strip(),
            bool(data.get('disponible', True)),
            data.get('statut', 'actif').strip(),
            data.get('notes', '').strip()
        ))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Véhicule créé avec succès'
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la création du véhicule'
        }), 500

@app.route('/api/vehicules/<int:vehicule_id>', methods=['PUT'])
@admin_required
def api_update_vehicule(vehicule_id):
    """Modifier un véhicule (admin uniquement)"""
    try:
        data = request.get_json()

        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT id FROM vehicules WHERE id = ?', (vehicule_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Véhicule non trouvé'
            }), 404

        # Construire la requête de mise à jour dynamiquement
        update_fields = []
        update_values = []
        
        allowed_fields = ['nom', 'immatriculation', 'date_immatriculation', 'controle', 'prochain_controle', 'fin_validite', 'numero_carte', 'disponible', 'statut', 'notes']
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f'{field} = ?')
                if field == 'disponible':
                    update_values.append(bool(data[field]))
                else:
                    update_values.append(data[field])

        if not update_fields:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Aucun champ à mettre à jour'
            }), 400

        update_values.append(vehicule_id)
        query = f"UPDATE vehicules SET {', '.join(update_fields)} WHERE id = ?"
        
        cursor.execute(query, update_values)
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Véhicule mis à jour avec succès'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la mise à jour du véhicule'
        }), 500

@app.route('/api/vehicules/<int:vehicule_id>', methods=['DELETE'])
@admin_required
def api_delete_vehicule(vehicule_id):
    """Supprimer un véhicule (admin uniquement)"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT id FROM vehicules WHERE id = ?', (vehicule_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Véhicule non trouvé'
            }), 404

        # Supprimer le véhicule
        cursor.execute('DELETE FROM vehicules WHERE id = ?', (vehicule_id,))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Véhicule supprimé avec succès'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la suppression du véhicule'
        }), 500

# ============================================================================
# 📅 ROUTES RÉSERVATIONS (4 API + 1 page)
# ============================================================================

# --- PAGE RÉSERVATIONS ---
@app.route('/reservation')
@login_required
def reservation():
    """Page de réservation"""
    return render_template('reservation.html')

# --- API RÉSERVATIONS ---
@app.route('/api/reservations/active', methods=['GET'])
@login_required
def api_get_active_reservations():
    """Récupérer les réservations actives de l'utilisateur connecté"""
    try:
        user_id = session['user_id']
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('''
            SELECT r.id, r.vehicule_id, v.nom AS vehicule_nom, v.immatriculation,
                   r.date_debut, r.date_fin, r.notes, r.statut
            FROM reservations r
            JOIN vehicules v ON r.vehicule_id = v.id
            WHERE r.user_id = ? AND r.statut = 'active'
            ORDER BY r.date_debut ASC
        ''', (user_id,))

        reservations = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify(reservations), 200
    except Exception as e:
        print("ERREUR /api/reservations/active:", e)
        return jsonify({"error": "Impossible de récupérer les réservations"}), 500

@app.route('/api/reservations/<int:reservation_id>/cancel', methods=['PUT'])
@login_required
def api_cancel_reservation(reservation_id):
    """Annule une réservation"""
    try:
        user_id = session.get('user_id')
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que la réservation appartient à l'utilisateur
        cursor.execute('SELECT id FROM reservations WHERE id = ? AND user_id = ?', 
                      (reservation_id, user_id))
        if not cursor.fetchone():
            return jsonify({'success': False, 'error': 'Réservation non trouvée'}), 404
        
        # Annuler la réservation
        cursor.execute('UPDATE reservations SET statut = "annulee" WHERE id = ?', 
                      (reservation_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reservations', methods=['GET'])
@login_required
def api_get_reservations():
    """Récupérer les réservations (toutes pour admin, utilisateur connecté pour client)"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        if session.get('role') == 'admin':
            # Admin voit toutes les réservations
            cursor.execute('''
                SELECT r.id, r.user_id, r.vehicule_id, r.date_debut, r.date_fin, 
                       r.statut, r.notes, r.created_at,
                       u.nom, u.prenom, u.email,
                       v.nom as vehicule_nom, v.immatriculation
                FROM reservations r
                JOIN users u ON r.user_id = u.id
                JOIN vehicules v ON r.vehicule_id = v.id
                ORDER BY r.created_at DESC
            ''')
        else:
            # Client voit seulement ses réservations
            cursor.execute('''
                SELECT r.id, r.user_id, r.vehicule_id, r.date_debut, r.date_fin, 
                       r.statut, r.notes, r.created_at,
                       u.nom, u.prenom, u.email,
                       v.nom as vehicule_nom, v.immatriculation
                FROM reservations r
                JOIN users u ON r.user_id = u.id
                JOIN vehicules v ON r.vehicule_id = v.id
                WHERE r.user_id = ?
                ORDER BY r.created_at DESC
            ''', (session['user_id'],))
        
        reservations = cursor.fetchall()
        conn.close()

        reservations_list = []
        for reservation in reservations:
            reservations_list.append({
                'id': reservation[0],
                'user_id': reservation[1],
                'vehicule_id': reservation[2],
                'date_debut': reservation[3],
                'date_fin': reservation[4],
                'statut': reservation[5],
                'notes': reservation[6],
                'created_at': reservation[7],
                'user_nom': reservation[8],
                'user_prenom': reservation[9],
                'user_email': reservation[10],
                'vehicule_nom': reservation[11],
                'vehicule_immatriculation': reservation[12]
            })

        return jsonify({
            'success': True,
            'reservations': reservations_list
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des réservations'
        }), 500

# @app.route('/api/reservations', methods=['POST'])
# def create_reservation():
#     """Créer une réservation"""
#     try:
#         # Récupérer les vraies données de la requête
#         data = request.get_json()
        
#         user_id = session.get('user_id')
#         if not user_id:
#             return jsonify({'success': False, 'message': 'Utilisateur non connecté'}), 401

#         vehicule_id = data.get('vehicule_id')
#         date_debut = data.get('date_debut')
#         date_fin = data.get('date_fin')
#         notes = data.get('notes', '')

#         if not all([vehicule_id, date_debut, date_fin]):
#             return jsonify({'success': False, 'message': 'Données manquantes'}), 400

#         conn = sqlite3.connect(DATABASE)
#         cursor = conn.cursor()

#         # Vérifier que le véhicule existe et est disponible
#         cursor.execute("SELECT disponible, nom FROM vehicules WHERE id=?", (vehicule_id,))
#         vehicule = cursor.fetchone()
        
#         if not vehicule:
#             conn.close()
#             return jsonify({'success': False, 'message': 'Véhicule non trouvé'}), 404
            
#         if vehicule[0] == 0:
#             conn.close()
#             return jsonify({'success': False, 'message': 'Véhicule non disponible'}), 400

#         # Vérifier les conflits de réservation pour les mêmes dates
#         cursor.execute('''
#             SELECT id FROM reservations 
#             WHERE vehicule_id = ? 
#             AND statut NOT IN ('annule', 'terminee')
#             AND ((date_debut <= ? AND date_fin >= ?) 
#                  OR (date_debut <= ? AND date_fin >= ?)
#                  OR (date_debut >= ? AND date_fin <= ?))
#         ''', (vehicule_id, date_debut, date_debut, date_fin, date_fin, date_debut, date_fin))
        
#         conflicting_reservation = cursor.fetchone()
#         if conflicting_reservation:
#             conn.close()
#             return jsonify({'success': False, 'message': 'Véhicule déjà réservé pour cette période'}), 400

#         # Créer la réservation
#         cursor.execute('''
#             INSERT INTO reservations (user_id, vehicule_id, date_debut, date_fin, notes, statut)
#             VALUES (?, ?, ?, ?, ?, ?)
#         ''', (user_id, vehicule_id, date_debut, date_fin, notes, 'confirmee'))

#         reservation_id = cursor.lastrowid

#         # Marquer le véhicule comme indisponible
#         cursor.execute('UPDATE vehicules SET disponible = 0 WHERE id = ?', (vehicule_id,))

#         conn.commit()
#         conn.close()

#         print(f"Réservation créée avec succès: ID={reservation_id}, Véhicule={vehicule_id}, User={user_id}")

#         return jsonify({
#             'success': True, 
#             'message': 'Réservation créée avec succès',
#             'reservation_id': reservation_id
#         })

#     except Exception as e:
#         print(f"Erreur lors de la création de la réservation: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({'success': False, 'message': 'Erreur serveur'}), 500
    
@app.route('/api/user/<int:user_id>/reservations', methods=['GET'])
@login_required
def api_get_user_reservations(user_id):
    """Récupérer toutes les réservations d'un utilisateur"""
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('''
            SELECT r.id, r.vehicule_id, v.nom AS vehicule_nom, v.immatriculation,
                   r.date_debut, r.date_fin, r.notes, r.statut
            FROM reservations r
            JOIN vehicules v ON r.vehicule_id = v.id
            WHERE r.user_id = ?
            ORDER BY r.date_debut DESC
        ''', (user_id,))

        reservations = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify(reservations), 200

    except Exception as e:
        print(f"ERREUR /api/user/{user_id}/reservations:", e)
        return jsonify({"error": "Impossible de récupérer les réservations de l'utilisateur"}), 500

@app.route('/api/reservations/<int:reservation_id>', methods=['PUT'])
@login_required
def api_update_reservation(reservation_id):
    """Modifier une réservation"""
    try:
        data = request.get_json()

        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que la réservation existe
        if session.get('role') == 'admin':
            cursor.execute('SELECT user_id, statut FROM reservations WHERE id = ?', (reservation_id,))
        else:
            cursor.execute('SELECT user_id, statut FROM reservations WHERE id = ? AND user_id = ?', 
                         (reservation_id, session['user_id']))
        
        reservation = cursor.fetchone()
        if not reservation:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Réservation non trouvée ou accès non autorisé'
            }), 404

        # Construire la requête de mise à jour
        update_fields = []
        update_values = []
        
        # Champs modifiables selon le rôle
        if session.get('role') == 'admin':
            allowed_fields = ['date_debut', 'date_fin', 'statut', 'notes']
        else:
            # Les clients ne peuvent modifier que leurs propres réservations et seulement certains champs
            allowed_fields = ['notes']
            if reservation[1] == 'en_attente':  # Seulement si en attente
                allowed_fields.extend(['date_debut', 'date_fin'])
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f'{field} = ?')
                update_values.append(data[field])

        if not update_fields:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Aucun champ à mettre à jour'
            }), 400

        update_values.append(reservation_id)
        query = f"UPDATE reservations SET {', '.join(update_fields)} WHERE id = ?"
        
        cursor.execute(query, update_values)
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Réservation mise à jour avec succès'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la mise à jour de la réservation'
        }), 500

@app.route('/api/reservations/<int:reservation_id>', methods=['DELETE'])
@login_required
def api_delete_reservation(reservation_id):
    """Supprimer/Annuler une réservation"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que la réservation existe et les droits
        if session.get('role') == 'admin':
            cursor.execute('SELECT id FROM reservations WHERE id = ?', (reservation_id,))
        else:
            cursor.execute('SELECT id FROM reservations WHERE id = ? AND user_id = ?', 
                         (reservation_id, session['user_id']))
        
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Réservation non trouvée ou accès non autorisé'
            }), 404

        # Plutôt que de supprimer, marquer comme annulée
        cursor.execute('UPDATE reservations SET statut = ? WHERE id = ?', 
                      ('annule', reservation_id))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Réservation annulée avec succès'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de l\'annulation de la réservation'
        }), 500

# ============================================================================
# 👑 ROUTES ADMIN (6 API + 1 page)
# ============================================================================

# --- PAGE ADMIN ---
@app.route('/dashboard')
@login_required
def dashboard():
    """Tableau de bord administrateur"""
    if session.get('role') != 'admin':
        flash('Accès non autorisé', 'error')
        return redirect(url_for('index'))
    return render_template('admin_dashboard.html')

# --- API GESTION DES INVITATIONS ---
@app.route('/api/generate-invitation', methods=['POST'])
@admin_required
def generate_invitation():
    """Générer un lien d'invitation (admin uniquement)"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        
        if not email or not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Email valide requis'
            }), 400
        
        # Vérifier que l'utilisateur n'existe pas déjà
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Un utilisateur avec cet email existe déjà'
            }), 409
        
        # Générer un token unique
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=7)  # Expire dans 7 jours
        
        # Sauvegarder le token
        cursor.execute('''
            INSERT INTO invitation_tokens (token, email, created_by, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (token, email, session['user_id'], expires_at))
        
        conn.commit()
        conn.close()
        
        # Générer le lien d'invitation
        base_url = request.url_root.rstrip('/')
        invitation_link = f"{base_url}/inscription?token={token}"
        
        return jsonify({
            'success': True,
            'message': 'Lien d\'invitation généré avec succès',
            'invitation_link': invitation_link,
            'email': email,
            'expires_at': expires_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la génération du lien'
        }), 500

# --- API GESTION DES UTILISATEURS ---
@app.route('/api/users', methods=['GET'])
@admin_required
def api_get_users():
    """Récupérer la liste des utilisateurs (admin uniquement)"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, email, nom, prenom, telephone, role, created_at 
            FROM users ORDER BY created_at DESC
        ''')
        users = cursor.fetchall()
        conn.close()

        users_list = []
        for user in users:
            users_list.append({
                'id': user[0],
                'email': user[1],
                'nom': user[2],
                'prenom': user[3],
                'telephone': user[4],
                'role': user[5],
                'created_at': user[6]
            })

        return jsonify({
            'success': True,
            'users': users_list
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des utilisateurs'
        }), 500

@app.route('/api/users', methods=['POST'])
@admin_required
def api_create_user():
    """Créer un utilisateur (admin uniquement)"""
    try:
        data = request.get_json()

        # Validation des données
        required_fields = ['email', 'password', 'nom', 'prenom', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400

        email = data['email'].lower().strip()
        password = data['password']
        nom = data['nom'].strip()
        prenom = data['prenom'].strip()
        telephone = data.get('telephone', '').strip()
        role = data['role']

        # Validation de l'email
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Format d\'email invalide'
            }), 400

        # Validation du mot de passe
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': message
            }), 400

        # Validation du rôle
        if role not in ['client', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Rôle invalide'
            }), 400

        # Vérification que l'email n'existe pas déjà
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Cette adresse email est déjà utilisée'
            }), 409

        # Création du compte
        password_hash = generate_password_hash(password)
        cursor.execute('''
            INSERT INTO users (email, password_hash, nom, prenom, telephone, role)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (email, password_hash, nom, prenom, telephone, role))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Utilisateur créé avec succès'
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la création de l\'utilisateur'
        }), 500

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@admin_required
def api_delete_user(user_id):
    """Supprimer un utilisateur (admin uniquement)"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que l'utilisateur existe
        cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Utilisateur non trouvé'
            }), 404

        # Empêcher la suppression de son propre compte
        if user_id == session['user_id']:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Vous ne pouvez pas supprimer votre propre compte'
            }), 400

        # Supprimer l'utilisateur
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Utilisateur supprimé avec succès'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la suppression de l\'utilisateur'
        }), 500

# --- API STATISTIQUES ET TABLEAU DE BORD ---
@app.route('/api/dashboard/stats', methods=['GET'])
@admin_required
def api_dashboard_stats():
    """Récupérer les statistiques pour le tableau de bord admin"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Statistiques générales
        stats = {}
        
        # Nombre total d'utilisateurs
        cursor.execute('SELECT COUNT(*) FROM users')
        stats['total_users'] = cursor.fetchone()[0]
        
        # Nombre total de véhicules
        cursor.execute('SELECT COUNT(*) FROM vehicules')
        stats['total_vehicules'] = cursor.fetchone()[0]
        
        # Nombre de véhicules disponibles
        cursor.execute('SELECT COUNT(*) FROM vehicules WHERE disponible = 1')
        stats['vehicules_disponibles'] = cursor.fetchone()[0]
        
        # Nombre total de réservations
        cursor.execute('SELECT COUNT(*) FROM reservations')
        stats['total_reservations'] = cursor.fetchone()[0]
        
        # Réservations en attente
        cursor.execute('SELECT COUNT(*) FROM reservations WHERE statut = "en_attente"')
        stats['reservations_en_attente'] = cursor.fetchone()[0]
        
        # Réservations actives (en cours)
        today = datetime.now().date()
        cursor.execute('SELECT COUNT(*) FROM reservations WHERE statut = "confirme" AND date_debut <= ? AND date_fin >= ?', 
                      (today, today))
        stats['reservations_actives'] = cursor.fetchone()[0]
        
        # Réservations ce mois
        first_day_month = today.replace(day=1)
        cursor.execute('SELECT COUNT(*) FROM reservations WHERE created_at >= ?', 
                      (first_day_month,))
        stats['reservations_ce_mois'] = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des statistiques'
        }), 500

@app.route('/api/dashboard/recent-activities', methods=['GET'])
@admin_required
def api_recent_activities():
    """Récupérer les activités récentes pour le tableau de bord"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Réservations récentes (dernières 10)
        cursor.execute('''
            SELECT r.id, r.date_debut, r.date_fin, r.statut, r.created_at,
                   u.nom, u.prenom, v.nom as vehicule_nom
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN vehicules v ON r.vehicule_id = v.id
            ORDER BY r.created_at DESC
            LIMIT 10
        ''')
        
        recent_reservations = []
        for row in cursor.fetchall():
            recent_reservations.append({
                'id': row[0],
                'date_debut': row[1],
                'date_fin': row[2],
                'statut': row[3],
                'created_at': row[4],
                'user_nom': row[5],
                'user_prenom': row[6],
                'vehicule_nom': row[7]
            })
        
        # Nouveaux utilisateurs (derniers 5)
        cursor.execute('''
            SELECT id, nom, prenom, email, role, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        ''')
        
        recent_users = []
        for row in cursor.fetchall():
            recent_users.append({
                'id': row[0],
                'nom': row[1],
                'prenom': row[2],
                'email': row[3],
                'role': row[4],
                'created_at': row[5]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'recent_reservations': recent_reservations,
            'recent_users': recent_users
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des activités récentes'
        }), 500

# ============================================================================
# 🚀 LANCEMENT DE L'APPLICATION
# ============================================================================

if __name__ == '__main__':
    with app.app_context():
        print("=" * 70)
        print("🚗 DRIVEGO - APPLICATION FLASK DÉMARRÉE")
        print("=" * 70)
        print("📊 RÉSUMÉ DES ROUTES DISPONIBLES:")
        print("=" * 70)
        
        routes_by_category = {
            '🌐 Routes publiques': [],
            '🔐 Authentification': [],
            '🚗 Véhicules': [],
            '📅 Réservations': [],
            '👑 Administration': [],
            '🛠️ Utilitaires': []
        }
        
        for rule in app.url_map.iter_rules():
            endpoint = rule.endpoint
            route = rule.rule
            methods = ', '.join(rule.methods - {'HEAD', 'OPTIONS'})
            
            if endpoint in ['index', 'aide', 'vehicles_page', 'support', 'mot_de_passe_oublie', 'change_password', 'profil', 'upload_profile_picture', 'delete_profile_picture', 'logout']:
                routes_by_category['🌐 Routes publiques'].append(f"  {endpoint}: {route} [{methods}]")
            elif 'login' in endpoint or 'register' in endpoint or 'connexion' in endpoint or 'inscription' in endpoint or 'token' in endpoint:
                routes_by_category['🔐 Authentification'].append(f"  {endpoint}: {route} [{methods}]")
            elif 'vehicule' in endpoint or 'gestion_vehicules' in endpoint:
                routes_by_category['🚗 Véhicules'].append(f"  {endpoint}: {route} [{methods}]")
            elif 'reservation' in endpoint:
                routes_by_category['📅 Réservations'].append(f"  {endpoint}: {route} [{methods}]")
            elif 'admin' in endpoint or 'dashboard' in endpoint or 'users' in endpoint or 'invitation' in endpoint or 'stats' in endpoint or 'activities' in endpoint:
                routes_by_category['👑 Administration'].append(f"  {endpoint}: {route} [{methods}]")
            else:
                routes_by_category['🛠️ Utilitaires'].append(f"  {endpoint}: {route} [{methods}]")
        
        for category, routes in routes_by_category.items():
            if routes:
                print(f"\n{category} ({len(routes)}):")
                for route in routes:
                    print(route)
        
        print("\n" + "=" * 70)
        print("🚀 Serveur prêt sur http://localhost:5000")
        print("=" * 70)
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)







