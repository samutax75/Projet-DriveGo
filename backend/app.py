# app.py - Application Flask DriveGO 

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



app = Flask(__name__)

# ============================================================================
# CONFIGURATION ET INITIALISATION
# ============================================================================

# Configuration pour la production
app.secret_key = os.environ.get('SECRET_KEY', 'fallback-secret-key-change-in-production')

# Configuration de la base de données
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    
    # Vérifier si la colonne profile_picture existe déjà (pour migration)
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    if 'profile_picture' not in columns:
        cursor.execute('ALTER TABLE users ADD COLUMN profile_picture TEXT DEFAULT ""')
    
    
    
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

    # Table des réservations
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            vehicule_id INTEGER NOT NULL,
            date_debut DATE NOT NULL,
            date_fin DATE NOT NULL,
            statut TEXT DEFAULT 'en_attente',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (vehicule_id) REFERENCES vehicules (id)
        )
    ''')

    # Créer un utilisateur admin par défaut si aucun n'existe
    cursor.execute('SELECT COUNT(*) FROM users WHERE role = "admin"')
    if cursor.fetchone()[0] == 0:
        admin_password = generate_password_hash('admin123')  # Changez ce mot de passe !
        cursor.execute('''
            INSERT INTO users (email, password_hash, nom, prenom, telephone, role)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('admin@drivego.com', admin_password, 'Admin', 'DriveGo', '', 'admin'))

    # Insérer les véhicules réels
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

# ============================================================================
# FONCTIONS UTILITAIRES ET DÉCORATEURS
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

# Initialiser la base de données au démarrage
init_db()

# ============================================================================
# ROUTES PRINCIPALES (TEMPLATES)
# ============================================================================
@app.route('/')
def index():
    user_logged_in = 'user_id' in session
    user_name = f"{session.get('prenom', '')} {session.get('nom', '')}" if user_logged_in else ''
    
    # Adaptation du rôle selon le genre automatiquement détecté
    user_role = ''
    if user_logged_in:
        fonction_base = session.get('fonction', 'Éducateur/trice')
        prenom = session.get('prenom', '')
        
        # Fonction simple pour détecter le genre par la terminaison du prénom
        def detect_gender(prenom):
            if not prenom:
                return None
            
            prenom_lower = prenom.lower()
            
            # Terminaisons typiquement féminines
            if prenom_lower.endswith(('a', 'e', 'ia', 'ine', 'elle', 'ette')):
                return 'feminin'
            # Terminaisons typiquement masculines ou neutres
            else:
                return 'masculin'
        
        # Détecter le genre et adapter le rôle
        if 'éducateur' in fonction_base.lower():
            genre = detect_gender(prenom)
            if genre == 'feminin':
                user_role = 'Éducatrice'
            else:
                user_role = 'Éducateur'  # Par défaut masculin
        else:
            user_role = fonction_base  # Garde l'original pour autres rôles
    
    # Récupération de la photo de profil
    user_profile_picture = session.get('profile_picture_url', '') if user_logged_in else ''
    
    print("SESSION:", dict(session))  # DEBUG
    print(f"RÔLE: {user_role}")  # DEBUG
    print(f"PHOTO PROFIL: {user_profile_picture}")  # DEBUG

    return render_template('index.html', 
        user_logged_in=user_logged_in, 
        user_name=user_name.strip(),
        user_role=user_role,
        user_profile_picture=user_profile_picture  # ← Ajout de la photo de profil
    )

# Route pour l'upload de photo de profil (à ajouter dans votre app.py)
@app.route('/upload-profile-picture', methods=['POST'])
def upload_profile_picture():
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
        import os
        upload_folder = 'static/uploads/profile_pictures'
        os.makedirs(upload_folder, exist_ok=True)
        
        # Générer un nom de fichier unique
        import uuid
        from werkzeug.utils import secure_filename
        
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{session['user_id']}_{uuid.uuid4().hex[:8]}.{file_extension}"
        file_path = os.path.join(upload_folder, unique_filename)
        
        # Sauvegarder le fichier
        file.save(file_path)
        
        # URL relative pour l'affichage
        image_url = f"/static/uploads/profile_pictures/{unique_filename}"
        
        # Mettre à jour la session
        session['profile_picture_url'] = image_url
        
        # 📸 SAUVEGARDE EN BASE DE DONNÉES
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


# Fonction pour récupérer la photo de profil lors de la connexion
def get_user_profile_picture(user_id):
    """Récupère la photo de profil d'un utilisateur depuis la base de données"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT profile_picture FROM users WHERE id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result and result[0] else ''


# Page pour saisir email
@app.route('/mot_de_passe_oublie', methods=['GET', 'POST'])
def mot_de_passe_oublie():
    if request.method == 'POST':
        email = request.form['email']
        flash(f"Email {email} reçu. Vous pouvez maintenant changer votre mot de passe.", "info")
        return redirect(url_for('change_password'))  # redirige vers change_password
    return render_template('mot_de_passe_oublie.html')

# Page pour changer le mot de passe
@app.route("/change_password", methods=["GET", "POST"])
def change_password():
    if request.method == "POST":
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")

        if new_password != confirm_password:
            flash("Les mots de passe ne correspondent pas", "error")
            return render_template("change_password.html")

        if len(new_password) < 8:
            flash("Le mot de passe doit contenir au moins 8 caractères", "error")
            return render_template("change_password.html")

        # Ici : enregistrer le mot de passe hashé dans la DB
        flash("Mot de passe changé avec succès ✅", "success")
        return redirect(url_for("mot_de_passe_oublie"))

    return render_template("change_password.html")


@app.route('/aide')
def aide():
    return render_template('aide.html')


@app.route('/fiches_vehicules')
def vehicles_page():
    """Page d'affichage des véhicules"""
    return render_template('fiches_vehicules.html')

@app.route('/reservation')
@login_required
def reservation():
    """Page de réservation"""
    return render_template('reservation.html')

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

@app.route('/gestion_vehicules')
@login_required
def gestion_vehicules():
    """Page de gestion des véhicules"""
    return render_template('gestion_vehicules.html')

@app.route('/support')
def support():
    """Page de support"""
    return render_template('support.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """Tableau de bord administrateur"""
    if session.get('role') != 'admin':
        flash('Accès non autorisé', 'error')
        return redirect(url_for('index'))
    return render_template('admin_dashboard.html')

@app.route('/logout')
def logout():
    """Déconnexion de l'utilisateur"""
    session.clear()
    flash('Vous avez été déconnecté', 'info')
    return redirect(url_for('index'))


@app.route('/profil', methods=['GET', 'POST'])
def profil():
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
        session['nom'] = prenom
        session['prenom'] = nom
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



# ============================================================================
# API AUTHENTIFICATION
# ============================================================================

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

        # Recherche de l'utilisateur - AJOUT de profile_picture
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
        # 📸 AJOUT de la photo de profil dans la session
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
                'profile_picture': user[6] if user[6] else ''  # 📸 AJOUT dans la réponse
            },
            'redirect': redirect_url
        }), 200

    except Exception as e:
        print(f"Erreur connexion: {e}")  # Debug
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la connexion'
        }), 500



@app.route('/delete-profile-picture', methods=['DELETE'])
def delete_profile_picture():
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

# ============================================================================
# API GESTION DES INVITATIONS (ADMIN)
# ============================================================================

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
# API GESTION DES UTILISATEURS (ADMIN)
# ============================================================================

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

@app.route('/login/<int:user_id>')
def login(user_id):
    # Simule une connexion d'utilisateur : on stocke l'id en session
    if user_id in init_db:
        session['user_id'] = user_id
        return redirect(url_for('profil'))
    return "Utilisateur non trouvé", 404
# ============================================================================
# API GESTION DES VÉHICULES
# ============================================================================

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
# API GESTION DES RÉSERVATIONS
# ============================================================================

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

@app.route('/api/reservations', methods=['POST'])
@login_required
def api_create_reservation():
    """Créer une réservation"""
    try:
        data = request.get_json()

        # Validation des données
        required_fields = ['vehicule_id', 'date_debut', 'date_fin']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400

        vehicule_id = data['vehicule_id']
        date_debut = data['date_debut']
        date_fin = data['date_fin']
        notes = data.get('notes', '').strip()

        # Validation des dates
        try:
            debut = datetime.strptime(date_debut, '%Y-%m-%d').date()
            fin = datetime.strptime(date_fin, '%Y-%m-%d').date()
            
            if debut <= datetime.now().date():
                return jsonify({
                    'success': False,
                    'message': 'La date de début doit être dans le futur'
                }), 400
            
            if fin <= debut:
                return jsonify({
                    'success': False,
                    'message': 'La date de fin doit être après la date de début'
                }), 400
                
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Format de date invalide (YYYY-MM-DD attendu)'
            }), 400

        # Vérifier que le véhicule existe et est disponible
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT disponible FROM vehicules WHERE id = ?', (vehicule_id,))
        vehicule = cursor.fetchone()
        
        if not vehicule:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Véhicule non trouvé'
            }), 404
        
        if not vehicule[0]:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Ce véhicule n\'est pas disponible'
            }), 400

        # Vérifier les conflits de réservation
        cursor.execute('''
            SELECT id FROM reservations 
            WHERE vehicule_id = ? 
            AND statut != 'annule'
            AND (
                (date_debut <= ? AND date_fin >= ?) OR
                (date_debut <= ? AND date_fin >= ?) OR
                (date_debut >= ? AND date_fin <= ?)
            )
        ''', (vehicule_id, date_debut, date_debut, date_fin, date_fin, date_debut, date_fin))
        
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Ce véhicule est déjà réservé sur cette période'
            }), 409

        # Créer la réservation
        cursor.execute('''
            INSERT INTO reservations (user_id, vehicule_id, date_debut, date_fin, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (session['user_id'], vehicule_id, date_debut, date_fin, notes))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Réservation créée avec succès'
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la création de la réservation'
        }), 500

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
# API STATISTIQUES ET TABLEAU DE BORD
# ============================================================================

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
# LANCEMENT DE L'APPLICATION
# ============================================================================

# if __name__ == '__main__':
#     port = int(os.environ.get('PORT', 5000))
#     app.run(host='0.0.0.0', port=port, debug=False)
    
    
if __name__ == '__main__':
    with app.app_context():
        print("=" * 50)
        print("ROUTES DISPONIBLES:")
        print("=" * 50)
        for rule in app.url_map.iter_rules():
            print(f"  {rule.endpoint}: {rule.rule}")
        print("=" * 50)
    
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)