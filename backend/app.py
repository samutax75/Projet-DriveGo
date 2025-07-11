from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import re
import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Changez cette clé en production

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


def gestion_vehicules():
    """Page de gestion des véhicules"""
    return render_template('gestion_vehicules.html')

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


@app.route('/logout')
def logout():
    """Déconnexion de l'utilisateur"""
    session.clear()
    flash('Vous avez été déconnecté')
    return redirect(url_for('index'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
