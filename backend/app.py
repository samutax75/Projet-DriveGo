# app.py - Application Flask DriveGO Simplifiée
# ============================================================================
# RÉORGANISATION CLAIRE ET STRUCTURÉE - VERSION SIMPLIFIÉE
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
import platform
import sys
import io
import shutil
from werkzeug.utils import secure_filename
import os
import json
import uuid


app = Flask(__name__)

# ============================================================================
# 🔧 CONFIGURATION ET INITIALISATION
# ============================================================================

# Configuration pour la production
app.secret_key = os.environ.get('SECRET_KEY', 'fallback-secret-key-change-in-production')

# # Configuration pour les uploads
# UPLOAD_FOLDER = 'static/uploads/mission_photos'
# ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# # Créer le dossier uploads s'il n'existe pas
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

UPLOAD_FOLDER = 'uploads/missions'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
    
    # Migration de la table missions
    migrate_missions_table(cursor)

    # Créer un utilisateur par défaut si aucun n'existe
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        default_password = generate_password_hash('password123')
        cursor.execute('''
            INSERT INTO users (email, password_hash, nom, prenom, telephone, role)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('user@drivego.com', default_password, 'Utilisateur', 'Test', '', 'client'))

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
    """Recrée la table missions avec les bonnes colonnes"""
    
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
                carburant_depart TEXT DEFAULT "",
                carburant_arrivee TEXT DEFAULT "",
                plein_effectue BOOLEAN DEFAULT 0,
                photos TEXT DEFAULT "",
                creneau TEXT DEFAULT 'journee',
                conducteur2 TEXT DEFAULT '',
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

        # Colonnes obligatoires
        required_columns = [
            ("date_mission", "DATE NOT NULL DEFAULT ''"),
            ("heure_debut", "TEXT DEFAULT ''"),
            ("heure_fin", "TEXT DEFAULT ''"),
            ("motif", "TEXT DEFAULT ''"),
            ("destination", "TEXT DEFAULT ''"),
            ("nb_passagers", "INTEGER DEFAULT 1"),
            ("km_depart", "INTEGER DEFAULT 0"),
            ("km_arrivee", "INTEGER DEFAULT 0"),
            ("carburant_depart", "TEXT DEFAULT ''"),
            ("carburant_arrivee", "TEXT DEFAULT ''"),
            ("plein_effectue", "BOOLEAN DEFAULT 0"),
            ("photos", "TEXT DEFAULT ''"),
            ("creneau", "TEXT DEFAULT 'journee'"),
            ("conducteur2", "TEXT DEFAULT ''"),
            ("statut", "TEXT DEFAULT 'active'"),
            ("notes", "TEXT DEFAULT ''")
        ]

        # Ajouter les colonnes manquantes
        for col_name, col_def in required_columns:
            if col_name not in existing_columns:
                cursor.execute(f"ALTER TABLE missions ADD COLUMN {col_name} {col_def}")

# Initialiser la base au lancement
init_db()


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ============================================================================
# 🛠️ FONCTIONS UTILITAIRES
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
            return 'Éducateur'
    else:
        return fonction_base


# ============================================================================
# 🌐 ROUTES PUBLIQUES
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
        session['password_reset_email'] = email.lower().strip()
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
        
        # Vérifier si c'est une réinitialisation
        is_reset = session.get('password_reset_email') is not None
        reset_email = session.get('password_reset_email')

        errors = {}

        if is_reset:
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
            # Changement de mot de passe normal
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

        # Validation commune
        if new_password != confirm_password:
            errors['confirm_password'] = "Les mots de passe ne correspondent pas"

        if len(new_password) < 8:
            errors['new_password'] = "Le mot de passe doit contenir au moins 8 caractères"

        # Validation complexité
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
                for field, error in errors.items():
                    flash(error, "error")
                return render_template("change_password.html")

        # Procéder au changement
        try:
            hashed_password = generate_password_hash(new_password)
            
            conn = sqlite3.connect('drivego.db')
            cursor = conn.cursor()
            
            if is_reset:
                cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (hashed_password, reset_email))
                session.pop('password_reset_email', None)
            else:
                user_id = session.get('user_id')
                cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed_password, user_id))
            
            conn.commit()
            conn.close()
            
            if is_ajax:
                return jsonify({
                    'success': True,
                    'message': 'Mot de passe modifié avec succès !'
                }), 200
            else:
                flash("Mot de passe changé avec succès", "success")
                return redirect(url_for("connexion"))
            
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
        import uuid
        
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
# 🔐 ROUTES D'AUTHENTIFICATION
# ============================================================================

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
        return redirect(url_for('profil'))
    return "Utilisateur non trouvé", 404

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

        return jsonify({
            'success': True,
            'message': 'Connexion réussie',
            'user': {
                'nom': user[3],
                'prenom': user[4],
                'role': user[5],
                'profile_picture': user[6] if user[6] else ''
            },
            'redirect': url_for('index')
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


# ============================================================================
# 🚗 ROUTES VÉHICULES
# ============================================================================

@app.route('/gestion_vehicules')
@login_required
def gestion_vehicules():
    """Page de gestion des véhicules"""
    return render_template('gestion_vehicules.html')

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


# ============================================================================
# 🚀 ROUTES MISSIONS
# ==========================================================================

@app.route('/api/missions/<int:mission_id>/complete', methods=['PUT'])
def complete_mission(mission_id):
    """Terminer une mission avec support des photos prises"""
    try:
        # Vérifier l'authentification
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        user_id = session['user_id']
        
        # Récupérer la mission depuis la base de données
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, user_id, vehicule_id, statut, km_depart 
            FROM missions 
            WHERE id = ?
        """, (mission_id,))
        
        mission = cursor.fetchone()
        
        if not mission:
            conn.close()
            return jsonify({'success': False, 'message': 'Mission introuvable'}), 404
        
        # Vérifications de sécurité
        if mission[1] != user_id:
            conn.close()
            return jsonify({'success': False, 'message': 'Accès refusé'}), 403
        
        if mission[3] != 'active':
            conn.close()
            return jsonify({'success': False, 'message': 'Mission déjà terminée'}), 400
        
        # Récupérer les données du formulaire
        heure_fin = request.form.get('heure_fin', '').strip()
        km_arrivee_str = request.form.get('km_arrivee', '').strip()
        carburant_arrivee = request.form.get('carburant_arrivee', '').strip()
        plein_effectue = request.form.get('plein_effectue', '0') == '1'
        notes = request.form.get('notes', '').strip()
        
        # Validation des données obligatoires
        if not heure_fin:
            conn.close()
            return jsonify({'success': False, 'message': 'Heure de fin requise'}), 400
        
        if not km_arrivee_str or not km_arrivee_str.isdigit():
            conn.close()
            return jsonify({'success': False, 'message': 'Kilométrage d\'arrivée invalide'}), 400
        
        if not carburant_arrivee:
            conn.close()
            return jsonify({'success': False, 'message': 'Niveau de carburant requis'}), 400
        
        km_arrivee = int(km_arrivee_str)
        km_depart = mission[4]
        
        # Validation du kilométrage
        if km_arrivee < km_depart:
            conn.close()
            return jsonify({
                'success': False, 
                'message': f'Le kilométrage d\'arrivée ({km_arrivee}) ne peut pas être inférieur au départ ({km_depart})'
            }), 400
        
        # Traitement des photos capturées
        uploaded_photos = []
        photos = request.files.getlist('photos[]')  # Récupérer les photos depuis FormData
        
        if photos:
            # Créer le dossier s'il n'existe pas
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            
            for i, photo in enumerate(photos):
                if photo and photo.filename != '' and allowed_file(photo.filename):
                    # Générer un nom unique
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    unique_id = str(uuid.uuid4())[:8]
                    extension = photo.filename.rsplit('.', 1)[1].lower()
                    filename = f"mission_{mission_id}_{timestamp}_{unique_id}.{extension}"
                    
                    try:
                        # Sauvegarder le fichier
                        filepath = os.path.join(UPLOAD_FOLDER, filename)
                        photo.save(filepath)
                        
                        # Ajouter les métadonnées de la photo
                        uploaded_photos.append({
                            'filename': filename,
                            'original_name': photo.filename,
                            'upload_date': datetime.now().isoformat(),
                            'url': f"/api/photos/{filename}"
                        })
                        
                        print(f"Photo {i+1} sauvegardée: {filename}")
                        
                    except Exception as e:
                        print(f"Erreur sauvegarde photo {i+1}: {e}")
        
        # Convertir les photos en JSON pour la base
        photos_json = json.dumps(uploaded_photos) if uploaded_photos else ''
        
        # Mettre à jour la mission dans la base de données
        try:
            update_query = """
                UPDATE missions 
                SET heure_fin = ?, 
                    km_arrivee = ?, 
                    carburant_arrivee = ?, 
                    plein_effectue = ?, 
                    notes = ?, 
                    photos = ?,
                    statut = 'completed',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """
            update_params = [heure_fin, km_arrivee, carburant_arrivee, plein_effectue, notes, photos_json, mission_id]
            
            cursor.execute(update_query, update_params)
            
            # Libérer le véhicule
            vehicule_id = mission[2]
            cursor.execute("""
                UPDATE vehicules 
                SET statut = 'actif' 
                WHERE id = ?
            """, (vehicule_id,))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True, 
                'message': 'Mission terminée avec succès',
                'data': {
                    'mission_id': mission_id,
                    'distance_parcourue': km_arrivee - km_depart,
                    'photos_count': len(uploaded_photos)
                }
            }), 200
            
        except sqlite3.Error as e:
            conn.rollback()
            conn.close()
            print(f"Erreur base de données: {e}")
            return jsonify({'success': False, 'message': f'Erreur lors de la mise à jour: {str(e)}'}), 500
        
    except Exception as e:
        print(f"Erreur serveur dans complete_mission: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Erreur serveur interne'}), 500

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
        
        # Marquer le véhicule comme en mission
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

@app.route('/api/user/<int:user_id>/missions', methods=['GET'])
def api_get_user_missions(user_id):
    """Récupérer les missions d'un utilisateur spécifique"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
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
        """, (user_id,))
        
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
                u.nom as user_name, u.prenom as user_prenom,
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
                'user_prenom': mission[12],
                'vehicule_nom': mission[13],
                'vehicule_immatriculation': mission[14]
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
    """Annuler une mission"""
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
            SET statut = 'actif'
            WHERE id = ?
        ''', (mission[1],))
        
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

@app.route('/api/debug/missions/<int:mission_id>', methods=['GET'])
def debug_mission(mission_id):
    """Route de debug pour vérifier l'état d'une mission"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Non authentifié'}), 401
    
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM missions WHERE id = ?", (mission_id,))
        mission = cursor.fetchone()
        
        if mission:
            cursor.execute("PRAGMA table_info(missions)")
            columns = [col[1] for col in cursor.fetchall()]
            mission_dict = dict(zip(columns, mission))
            
            conn.close()
            return jsonify({'success': True, 'mission': mission_dict})
        else:
            conn.close()
            return jsonify({'success': False, 'message': 'Mission introuvable'})
            
    except Exception as e:
        print(f"Erreur debug: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================================================
# 🚀 LANCEMENT DE L'APPLICATION
# ============================================================================

if __name__ == '__main__':
    with app.app_context():
        print("=" * 70)
        print("🚗 DRIVEGO - APPLICATION FLASK SIMPLIFIÉE")
        print("=" * 70)
        print("📊 RÉSUMÉ DES ROUTES DISPONIBLES:")
        print("=" * 70)
        
        routes_by_category = {
            '🌐 Routes publiques': [],
            '🔐 Authentification': [],
            '🚗 Véhicules': [],
            '🚀 Missions': [],
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
            elif 'mission' in endpoint:
                routes_by_category['🚀 Missions'].append(f"  {endpoint}: {route} [{methods}]")
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