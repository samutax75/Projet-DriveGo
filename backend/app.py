from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import re
import datetime
import os
from decimal import Decimal

app = Flask(__name__)
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

    # Table des véhicules (adaptée à vos données réelles)
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

    # Insérer vos véhicules réels
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

def validate_email(email):
    """Valide le format de l'email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valide la force du mot de passe"""
    if len(password) < 6:
        return False, "Le mot de passe doit contenir au moins 6 caractères"
    return True, "Mot de passe valide"

# ================= ROUTES PRINCIPALES =================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/vehicles')
def vehicles_page():
    """Page de gestion des véhicules"""
    return render_template('fiches_vehicules.html')

@app.route('/reservation')
def reservation():
    """Page de réservation"""
    return render_template('reservation.html')

@app.route('/inscription')
def inscription():
    return render_template('inscription.html')

@app.route('/connexion')
def connexion():
    return render_template('connexion.html')

@app.route('/gestion_vehicules')
def gestion_vehicules():
    """Page de gestion des véhicules (admin)"""
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('Accès non autorisé')
        return redirect(url_for('connexion'))
    return render_template('gestion_vehicules.html')

@app.route('/gestion_utilisateurs')
def gestion_utilisateurs():
    """Page de gestion des utilisateurs (admin)"""
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('Accès non autorisé')
        return redirect(url_for('connexion'))
    return render_template('gestion_utilisateurs.html')

@app.route('/support')
def support():
    """Page de support"""
    return render_template('support.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('connexion'))
    return render_template('dashboard.html')

@app.route('/admin')
def admin():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash('Accès non autorisé')
        return redirect(url_for('connexion'))
    return render_template('admin.html')

# ================= API UTILISATEURS =================

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

        # Recherche de l'utilisateur
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, email, password_hash, nom, prenom, role 
            FROM users WHERE email = ?
        ''', (email,))
        user = cursor.fetchone()
        conn.close()

        if not user or not check_password_hash(user[2], password):
            return jsonify({
                'success': False,
                'message': 'Email ou mot de passe incorrect'
            }), 401

        # Connexion réussie
        session['user_id'] = user[0]
        session['email'] = user[1]
        session['nom'] = user[3]
        session['prenom'] = user[4]
        session['role'] = user[5]

        # Redirection selon le rôle
        if user[5] == 'admin':
            redirect_url = url_for('admin')
        else:
            redirect_url = url_for('dashboard')

        return jsonify({
            'success': True,
            'message': 'Connexion réussie',
            'user': {
                'nom': user[3],
                'prenom': user[4],
                'role': user[5]
            },
            'redirect': redirect_url
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la connexion'
        }), 500

@app.route('/api/users', methods=['GET'])
def api_get_users():
    """API pour récupérer la liste des utilisateurs (admin uniquement)"""
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
    
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

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def api_delete_user(user_id):
    """API pour supprimer un utilisateur (admin uniquement)"""
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
    
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

@app.route('/api/users', methods=['POST'])
def api_create_user():
    """API pour créer un utilisateur (admin uniquement)"""
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
    
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

# ================= API VÉHICULES =================

@app.route('/api/vehicules', methods=['GET'])
def api_get_vehicules():
    """API pour récupérer la liste des véhicules"""
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
def api_create_vehicule():
    """API pour créer un véhicule (admin uniquement)"""
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
    
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
def api_update_vehicule(vehicule_id):
    """API pour modifier un véhicule (admin uniquement)"""
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
    
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
def api_delete_vehicule(vehicule_id):
    """API pour supprimer un véhicule (admin uniquement)"""
    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Accès non autorisé'}), 403
    
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

@app.route('/logout')
def logout():
    """Déconnexion de l'utilisateur"""
    session.clear()
    flash('Vous avez été déconnecté')
    return redirect(url_for('index'))

# Route de santé pour vérifier que l'app fonctionne
@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)