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
from google.oauth2 import id_token
from google.auth.transport import requests
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Mail, Message
from dotenv import load_dotenv
import string
import pdfkit
import logging
from flask import make_response
# Ajoutez ces imports en haut de votre fichier app.py (après les autres imports)
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from flask import send_file

load_dotenv()
app = Flask(__name__)

# ============================================================================
# 🔧 CONFIGURATION ET INITIALISATION
# ============================================================================

# Configuration pour la production
app.secret_key = os.environ.get('SECRET_KEY', 'fallback-secret-key-change-in-production')

# Configuration Flask-Mail (à ajouter après app.secret_key)
# Configuration qui marche PARTOUT (local ET production)
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_USERNAME')



# Initialiser Flask-Mail
mail = Mail(app)

# Générateur de token sécurisé
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

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


# Ajouter dans la configuration
VEHICLE_UPLOAD_FOLDER = 'static/uploads/vehicules'
ALLOWED_VEHICLE_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

# Créer les dossiers
os.makedirs(f"{VEHICLE_UPLOAD_FOLDER}/carte_grise", exist_ok=True)
os.makedirs(f"{VEHICLE_UPLOAD_FOLDER}/assurance", exist_ok=True)
os.makedirs(f"{VEHICLE_UPLOAD_FOLDER}/controle_technique", exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

import sqlite3
import os

DATABASE = 'drivego.db'

def init_db():
    """Initialise la base de données avec les tables nécessaires"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
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
        statut TEXT DEFAULT 'actif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
    # table d'invitation
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invitations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            message TEXT,
            invited_by INTEGER,
            expires_at TIMESTAMP,
            status TEXT DEFAULT 'pending',
            used_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invited_by) REFERENCES users (id)
        )
    ''')

    # Table des véhicules étendue avec toutes les nouvelles colonnes
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Carte Grise
            carte_grise_numero TEXT DEFAULT '',
            carte_grise_date_emission TEXT DEFAULT '',
            carte_grise_titulaire TEXT DEFAULT '',
            carte_grise_fichier TEXT DEFAULT '',
            
            -- Assurance
            assurance_compagnie TEXT DEFAULT '',
            assurance_numero_contrat TEXT DEFAULT '',
            assurance_date_debut TEXT DEFAULT '',
            assurance_date_expiration TEXT DEFAULT '',
            assurance_type_couverture TEXT DEFAULT '',
            assurance_montant_prime REAL DEFAULT 0,
            assurance_fichier TEXT DEFAULT '',
            
            -- Contrôle Technique
            ct_date_prochain_controle TEXT DEFAULT '',
            ct_photo TEXT DEFAULT ''
        )
    ''')
    
    # Table des maintenances
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS maintenances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicule_id INTEGER NOT NULL,
            type_maintenance TEXT NOT NULL,
            statut TEXT DEFAULT 'planifiee',
            priorite TEXT DEFAULT 'normale',
            date_debut DATETIME,
            date_fin DATETIME,
            garage TEXT,
            commentaires TEXT,
            cout REAL DEFAULT 0,
            facture_fichier TEXT DEFAULT '',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicule_id) REFERENCES vehicules (id),
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    ''')
    
    # Table des tokens d'invitation
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invitation_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            invited_by INTEGER NOT NULL,
            message TEXT DEFAULT '',
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invited_by) REFERENCES users (id)
        )
    ''')
    
    # Migration pour les tables existantes
    migrate_users_table(cursor)  # NOUVELLE MIGRATION
    migrate_vehicules_table(cursor)
    migrate_missions_table(cursor)
    migrate_maintenance_table(cursor)

    # Insérer les véhicules réels si vide (avec toutes les nouvelles données)
    cursor.execute('SELECT COUNT(*) FROM vehicules')
    if cursor.fetchone()[0] == 0:
        vehicules_reels = [
            (1, "TRAFIC BLANC", "FV-088-JJ", "26/11/2020", "29/10/2024", "28/10/2026", "30/09/2026", "4985080", 1, "actif", "",
             # Carte Grise
             "123456789", "26/11/2020", "Fondation Perce-Neige", "",
             # Assurance  
             "AXA Assurances", "POL789456", "01/01/2024", "31/12/2024", "Tous risques", 0, "",
             # Contrôle Technique
             "28/10/2026", ""),
             
            (2, "TRAFIC PMR", "GT-176-AF", "14/12/2023", "", "14/12/2027", "30/06/2029", "8954319", 1, "actif", "",
             # Carte Grise
             "987654321", "14/12/2023", "Fondation Perce-Neige", "",
             # Assurance
             "MAIF", "CON456789", "01/01/2024", "31/12/2024", "Tous risques + PMR", 0, "",
             # Contrôle Technique
             "14/12/2027", ""),
             
            (3, "TRAFIC VERT", "EJ-374-TT", "02/02/2017", "12/03/2025", "11/03/2027", "30/09/2026", "4985081", 1, "actif", "",
             # Carte Grise
             "456789123", "02/02/2017", "Fondation Perce-Neige", "",
             # Assurance
             "Groupama", "GRP123456", "01/01/2024", "31/12/2024", "Tiers étendu", 0, "",
             # Contrôle Technique
             "11/03/2027", ""),
             
            (4, "TRAFIC ROUGE", "CW-819-FR", "26/06/2013", "27/01/2025", "26/01/2027", "30/09/2026", "4985082", 1, "actif", "",
             # Carte Grise
             "321654987", "26/06/2013", "Fondation Perce-Neige", "",
             # Assurance
             "Allianz", "ALZ987654", "01/01/2024", "31/12/2024", "Tous risques", 0, "",
             # Contrôle Technique
             "26/01/2027", ""),
             
            (5, "KANGOO", "DS-429-PF", "22/06/2015", "29/01/2025", "28/01/2027", "30/09/2026", "4985084", 1, "actif", "",
             # Carte Grise
             "147258369", "22/06/2015", "Fondation Perce-Neige", "",
             # Assurance
             "MACIF", "MAC654321", "01/01/2024", "31/12/2024", "Tiers étendu", 0, "",
             # Contrôle Technique
             "28/01/2027", "")
        ]
        
        cursor.executemany('''
            INSERT INTO vehicules (
                id, nom, immatriculation, date_immatriculation, controle, prochain_controle, 
                fin_validite, numero_carte, disponible, statut, notes,
                carte_grise_numero, carte_grise_date_emission, carte_grise_titulaire, carte_grise_fichier,
                assurance_compagnie, assurance_numero_contrat, assurance_date_debut, assurance_date_expiration, 
                assurance_type_couverture, assurance_montant_prime, assurance_fichier,
                ct_date_prochain_controle, ct_photo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', vehicules_reels)

    conn.commit()
    conn.close()

def migrate_users_table(cursor):
    """Migration pour ajouter la colonne statut à la table users"""
    
    # Vérifier les colonnes existantes
    cursor.execute("PRAGMA table_info(users)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    
    # Colonne à ajouter si manquante
    if 'statut' not in existing_columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN statut TEXT DEFAULT 'actif'")
            print("Colonne 'statut' ajoutée à la table users")
        except Exception as e:
            print(f"Erreur lors de l'ajout de la colonne statut: {e}")

def migrate_vehicules_table(cursor):
    """Migration pour ajouter les nouvelles colonnes à la table vehicules existante"""
    
    # Vérifier les colonnes existantes
    cursor.execute("PRAGMA table_info(vehicules)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    
    # Colonnes à ajouter si manquantes
    new_columns = [
        # Statut pour maintenance (si pas déjà présent)
        ("statut", "TEXT DEFAULT 'actif'"),
        
        # Carte Grise
        ("carte_grise_numero", "TEXT DEFAULT ''"),
        ("carte_grise_date_emission", "TEXT DEFAULT ''"),
        ("carte_grise_titulaire", "TEXT DEFAULT ''"),
        ("carte_grise_fichier", "TEXT DEFAULT ''"),
        
        # Assurance
        ("assurance_compagnie", "TEXT DEFAULT ''"),
        ("assurance_numero_contrat", "TEXT DEFAULT ''"),
        ("assurance_date_debut", "TEXT DEFAULT ''"),
        ("assurance_date_expiration", "TEXT DEFAULT ''"),
        ("assurance_type_couverture", "TEXT DEFAULT ''"),
        ("assurance_montant_prime", "REAL DEFAULT 0"),
        ("assurance_fichier", "TEXT DEFAULT ''"),
        
        # Contrôle Technique
        ("ct_date_prochain_controle", "TEXT DEFAULT ''"),
        ("ct_photo", "TEXT DEFAULT ''")
    ]
    
    # Ajouter seulement les colonnes manquantes
    for col_name, col_def in new_columns:
        if col_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE vehicules ADD COLUMN {col_name} {col_def}")
                print(f"Colonne {col_name} ajoutée à la table vehicules")
            except Exception as e:
                print(f"Erreur lors de l'ajout de la colonne {col_name}: {e}")

def migrate_maintenance_table(cursor):
    """Migration pour créer/mettre à jour la table maintenances"""
    
    # Vérifier si la table maintenances existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='maintenances'")
    table_exists = cursor.fetchone()

    if not table_exists:
        # Créer la table maintenances
        cursor.execute('''
            CREATE TABLE maintenances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicule_id INTEGER NOT NULL,
                type_maintenance TEXT NOT NULL,
                statut TEXT DEFAULT 'planifiee',
                priorite TEXT DEFAULT 'normale',
                date_debut DATETIME,
                date_fin DATETIME,
                garage TEXT,
                commentaires TEXT,
                cout REAL DEFAULT 0,
                facture_fichier TEXT DEFAULT '',
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicule_id) REFERENCES vehicules (id),
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        ''')
        print("Table maintenances créée")
        
        # Insérer quelques données d'exemple
        sample_maintenances = [
            (1, 'controle_technique', 'terminee', 'normale', '2024-10-29 09:00:00', '2024-10-29 11:00:00', 'Garage Renault', 'Contrôle technique OK', 75.0, '', 1),
            (3, 'controle_technique', 'planifiee', 'haute', '2025-03-12 08:00:00', None, 'Auto Sécurité', 'Contrôle technique à renouveler', 0, '', 1),
            (4, 'controle_technique', 'planifiee', 'urgente', '2025-01-27 08:30:00', None, 'Contrôle Tech Plus', 'Contrôle technique urgent', 0, '', 1)
        ]
        
        cursor.executemany('''
            INSERT INTO maintenances (
                vehicule_id, type_maintenance, statut, priorite, date_debut, date_fin, 
                garage, commentaires, cout, facture_fichier, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_maintenances)
        
        print("Données d'exemple ajoutées à la table maintenances")
    else:
        print("Table maintenances existe déjà")

def migrate_missions_table(cursor):
    """Migration de la table missions avec les bonnes colonnes"""
    
    # Vérifier si la table missions existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='missions'")
    table_exists = cursor.fetchone()

    if not table_exists:
        # Créer la table missions avec toutes les colonnes
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
                control_status TEXT DEFAULT 'manual',
                transferred_to_user_id INTEGER DEFAULT NULL,
                transferred_to_name TEXT DEFAULT NULL,
                transfer_notes TEXT DEFAULT NULL,
                transferred_at TIMESTAMP DEFAULT NULL,
                transferred_at_time TEXT DEFAULT NULL,
                can_be_ended BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicule_id) REFERENCES vehicules (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        print("Table missions créée")
    else:
        # La table existe - vérifier et ajouter les colonnes manquantes
        cursor.execute("PRAGMA table_info(missions)")
        existing_columns = [col[1] for col in cursor.fetchall()]

        # Colonnes à ajouter si manquantes
        transfer_columns = [
            ("control_status", "TEXT DEFAULT 'manual'"),
            ("transferred_to_user_id", "INTEGER DEFAULT NULL"),
            ("transferred_to_name", "TEXT DEFAULT NULL"),
            ("transfer_notes", "TEXT DEFAULT NULL"),
            ("transferred_at", "TIMESTAMP DEFAULT NULL"),
            ("transferred_at_time", "TEXT DEFAULT NULL"),
            ("can_be_ended", "BOOLEAN DEFAULT 1")
        ]
        
        # Ajouter seulement les colonnes manquantes
        for col_name, col_def in transfer_columns:
            if col_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE missions ADD COLUMN {col_name} {col_def}")
                    print(f"Colonne {col_name} ajoutée")
                except Exception as e:
                    print(f"Erreur ajout colonne {col_name}: {e}")

# Configuration pour les uploads de véhicules
VEHICLE_UPLOAD_FOLDER = 'static/uploads/vehicules'
ALLOWED_VEHICLE_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

def create_upload_directories():
    """Créer les dossiers d'upload nécessaires"""
    directories = [
        f"{VEHICLE_UPLOAD_FOLDER}/carte_grise",
        f"{VEHICLE_UPLOAD_FOLDER}/assurance", 
        f"{VEHICLE_UPLOAD_FOLDER}/controle_technique",
        f"{VEHICLE_UPLOAD_FOLDER}/maintenances"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"Dossier créé: {directory}")

# Initialiser au démarrage
create_upload_directories()
init_db()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_VEHICLE_EXTENSIONS


# ============================================================================
# Route passer volant 
# ============================================================================

@app.route('/passer_volant')
def passer_volant():
    """Page passer_volant"""
    return render_template('passer_volant.html')


@app.route('/api/missions/<int:mission_id>/transfer', methods=['PUT'])
def transfer_mission(mission_id):
    """Transférer le contrôle d'une mission à un autre conducteur"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        user_id = session['user_id']
        data = request.get_json()
        
        # Récupérer la mission
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, user_id, statut, control_status 
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
        
        if mission[2] != 'active':
            conn.close()
            return jsonify({'success': False, 'message': 'Mission déjà terminée'}), 400
        
        # Récupérer les données de transfert
        new_driver_id = data.get('new_driver_id')
        new_driver_name = data.get('new_driver_name')
        notes = data.get('notes', '')
        transfer_time = data.get('transfer_time')
        
        print(f"DEBUG transfert - Données reçues:")
        print(f"  - new_driver_id: {new_driver_id}")
        print(f"  - new_driver_name: {new_driver_name}")
        print(f"  - transfer_time: {transfer_time}")
        
        # CORRECTION : Récupérer le nom si un ID utilisateur est fourni
        if new_driver_id and new_driver_id != 'manual':
            try:
                cursor.execute("""
                    SELECT nom, prenom FROM users WHERE id = ?
                """, (new_driver_id,))
                user_data = cursor.fetchone()
                
                if user_data:
                    # Format: "Prenom Nom"
                    new_driver_name = f"{user_data[1]} {user_data[0]}"
                    print(f"  - Nom récupéré depuis la base: {new_driver_name}")
                else:
                    print(f"  - Utilisateur avec ID {new_driver_id} non trouvé")
                    conn.close()
                    return jsonify({'success': False, 'message': 'Utilisateur non trouvé'}), 404
                    
            except Exception as e:
                print(f"Erreur récupération utilisateur: {e}")
                conn.close()
                return jsonify({'success': False, 'message': 'Erreur lors de la récupération de l\'utilisateur'}), 500
        
        # Validation finale
        if not new_driver_name:
            conn.close()
            return jsonify({'success': False, 'message': 'Nom du nouveau conducteur requis'}), 400
        
        # Gestion de l'heure de transfert
        if not transfer_time:
            from datetime import datetime
            transfer_time = datetime.now().strftime('%H:%M')
            print(f"  - Heure par défaut utilisée: {transfer_time}")
        
        # Vérifier que ce n'est pas un auto-transfert
        cursor.execute("SELECT nom, prenom FROM users WHERE id = ?", (user_id,))
        current_user_data = cursor.fetchone()
        if current_user_data:
            current_user_name = f"{current_user_data[1]} {current_user_data[0]}"
            if new_driver_name.strip().lower() == current_user_name.strip().lower():
                conn.close()
                return jsonify({'success': False, 'message': 'Impossible de transférer à soi-même'}), 400
        
        print(f"  - Transfert validé vers: {new_driver_name}")
        
        # Effectuer le transfert avec l'heure
        cursor.execute("""
            UPDATE missions 
            SET control_status = 'transferred',
                transferred_to_user_id = ?,
                transferred_to_name = ?,
                transfer_notes = ?,
                transferred_at = CURRENT_TIMESTAMP,
                transferred_at_time = ?,
                can_be_ended = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (new_driver_id, new_driver_name, notes, transfer_time, mission_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Contrôle transféré avec succès à {new_driver_name}',
            'transfer_time': transfer_time,
            'transferred_to': new_driver_name,
            'can_resume': True,
            'can_end_mission': True
        }), 200
        
    except Exception as e:
        print(f"Erreur transfert mission: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.close()
        return jsonify({'success': False, 'message': 'Erreur lors du transfert'}), 500


@app.route('/api/missions/<int:mission_id>/resume', methods=['PUT'])
def resume_mission_control(mission_id):
    """Reprendre le contrôle d'une mission transférée"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        user_id = session['user_id']
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que la mission appartient à l'utilisateur
        cursor.execute("""
            SELECT id, user_id, statut, control_status 
            FROM missions 
            WHERE id = ?
        """, (mission_id,))
        
        mission = cursor.fetchone()
        
        if not mission:
            conn.close()
            return jsonify({'success': False, 'message': 'Mission introuvable'}), 404
        
        if mission[1] != user_id:
            conn.close()
            return jsonify({'success': False, 'message': 'Accès refusé'}), 403
        
        if mission[2] != 'active':
            conn.close()
            return jsonify({'success': False, 'message': 'Mission déjà terminée'}), 400
        
        if mission[3] != 'transferred':
            conn.close()
            return jsonify({'success': False, 'message': 'Mission non transférée'}), 400
        
        # Reprendre le contrôle
        cursor.execute("""
            UPDATE missions 
            SET control_status = 'manual',
                transferred_to_user_id = NULL,
                transferred_to_name = NULL,
                transfer_notes = NULL,
                transferred_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (mission_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Contrôle repris avec succès'
        }), 200
        
    except Exception as e:
        print(f"Erreur reprise contrôle: {e}")
        return jsonify({'success': False, 'message': 'Erreur lors de la reprise'}), 500


@app.route('/api/missions/<int:mission_id>/status', methods=['GET'])
def get_mission_status(mission_id):
    """Récupérer le statut d'une mission"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, control_status, transferred_to_user_id, 
                   transferred_to_name, transfer_notes, transferred_at,
                   can_be_ended, statut
            FROM missions 
            WHERE id = ?
        """, (mission_id,))
        
        mission = cursor.fetchone()
        conn.close()
        
        if not mission:
            return jsonify({'success': False, 'message': 'Mission introuvable'}), 404
        
        return jsonify({
            'success': True,
            'mission_id': mission[0],
            'control_status': mission[1] or 'manual',
            'transferred_to_user_id': mission[2],
            'transferred_to_name': mission[3],
            'transfer_notes': mission[4],
            'transferred_at': mission[5],
            'can_end_mission': bool(mission[6]) if mission[6] is not None else True,
            'can_resume_control': (mission[1] == 'transferred'),
            'mission_status': mission[7]
        }), 200
        
    except Exception as e:
        print(f"Erreur récupération statut: {e}")
        return jsonify({'success': False, 'message': 'Erreur serveur'}), 500

# ============================================================================
def generate_reset_token(email):
    """Génère un token sécurisé pour reset password"""
    return serializer.dumps(email, salt='password-reset-salt')


def verify_reset_token(token, expiration=3600):
    """Vérifie le token (expire en 1h par défaut)"""
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=expiration)
        return email
    except:
        return None
    
def get_base_url():
    """Retourne l'URL de base selon l'environnement"""
    if os.environ.get('RENDER'):
        # Remplace par ton URL Render réelle
        return 'https://projet-drivego-21o9.onrender.com'
    return 'http://127.0.0.1:5000'    
    
    
def send_reset_email(email, token):
    """Envoie l'email de réinitialisation avec template HTML"""
    base_url = get_base_url()
    reset_url = f"{base_url}/reset_password/{token}"
    
    msg = Message(
        subject='DriveGo - Réinitialisation de votre mot de passe',
        recipients=[email],
        html=f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f4f4f4; }}
                .email-container {{ 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }}
                .email-content {{ 
                    background: white; 
                    padding: 40px; 
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    text-align: center;
                }}
                .logo {{ 
                    color: #667eea; 
                    font-size: 36px; 
                    font-weight: bold; 
                    margin-bottom: 5px;
                }}
                .subtitle {{ 
                    color: #666; 
                    font-size: 16px;
                    margin-bottom: 30px;
                }}
                .title {{
                    color: #333;
                    font-size: 24px;
                    margin-bottom: 20px;
                }}
                .message {{
                    color: #555;
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 30px;
                    text-align: left;
                }}
                .reset-btn {{ 
                    display: inline-block; 
                    background: linear-gradient(45deg, #667eea, #764ba2); 
                    color: white !important; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold;
                    font-size: 16px;
                    margin: 20px 0;
                    transition: transform 0.2s;
                }}
                .reset-btn:hover {{
                    transform: translateY(-2px);
                }}
                .link-text {{
                    word-break: break-all; 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 8px; 
                    font-family: monospace;
                    font-size: 14px;
                    margin: 15px 0;
                    border: 1px solid #e9ecef;
                }}
                .warning {{ 
                    background: #fff3cd; 
                    border: 1px solid #ffeaa7; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 25px 0; 
                    text-align: left;
                }}
                .warning strong {{
                    color: #856404;
                }}
                .warning ul {{
                    margin: 10px 0 0 20px;
                    color: #856404;
                }}
                .footer {{ 
                    margin-top: 30px; 
                    color: #666; 
                    font-size: 14px;
                    border-top: 1px solid #eee;
                    padding-top: 20px;
                }}
                .security-info {{
                    background: #e3f2fd;
                    border-left: 4px solid #2196f3;
                    padding: 15px;
                    margin: 20px 0;
                    text-align: left;
                    font-size: 14px;
                    color: #1565c0;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-content">
                    <div class="logo">🚗 DriveGo</div>
                    <div class="subtitle">Votre compagnon de conduite</div>
                    
                    <h1 class="title">Réinitialisation de mot de passe</h1>
                    
                    <div class="message">
                        <p><strong>Bonjour,</strong></p>
                        
                        <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte DriveGo.</p>
                        
                        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe sécurisé :</p>
                    </div>
                    
                    <a href="{reset_url}" class="reset-btn">
                        🔐 Réinitialiser mon mot de passe
                    </a>
                    
                    <div class="message">
                        <p><strong>Le bouton ne fonctionne pas ?</strong><br>
                        Copiez et collez ce lien dans votre navigateur :</p>
                    </div>
                    
                    <div class="link-text">{reset_url}</div>
                    
                    <div class="warning">
                        <strong>⚠️ Informations importantes :</strong>
                        <ul>
                            <li>Ce lien est valide pendant <strong>1 heure seulement</strong></li>
                            <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                            <li>Ne partagez jamais ce lien avec personne</li>
                            <li>Ce lien ne peut être utilisé qu'une seule fois</li>
                        </ul>
                    </div>
                    
                    <div class="security-info">
                        <strong>🛡️ Sécurité :</strong> Vos mots de passe sont chiffrés avec bcrypt et nos systèmes respectent les standards de sécurité les plus élevés.
                    </div>
                    
                    <div class="footer">
                        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                        <p><strong>Équipe DriveGo</strong><br>
                        Service de gestion de flotte</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        '''
    )
    mail.send(msg)
    
# ============================================================================
#  FONCTIONS PDF
# ============================================================================


@app.route("/api/missions/export-pdf", methods=["POST"])
def export_missions_to_pdf():
    try:
        print("=== DÉBUT GÉNÉRATION PDF ===")
        
        # Vérification session
        if "user_id" not in session:
            return jsonify({"error": "Non authentifié"}), 401
        
        user_id = session['user_id']
        user_prenom = session.get('prenom', 'Utilisateur')
        user_nom = session.get('nom', '')
        
        # Récupérer les paramètres de filtrage depuis la requête
        data = request.get_json() or {}
        filter_type = data.get('filter_type')  # 'all', 'week', 'month', 'custom'
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        print(f"Filtres: {filter_type}, {start_date}, {end_date}")
        
        # Connexion base de données
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier table missions
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='missions'")
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Table missions non trouvée"}), 404
        
        # Construire la requête SQL avec filtres
        base_query = """
            SELECT 
                m.id, m.date_mission, m.heure_debut, m.heure_fin,
                m.motif, m.destination, m.nb_passagers, 
                m.km_depart, m.km_arrivee, m.statut,
                m.carburant_depart, m.carburant_arrivee, 
                m.plein_effectue, m.notes, m.conducteur2,
                v.nom as vehicule_nom, v.immatriculation,
                m.control_status, m.transferred_to_name, m.transferred_at_time,
                m.transfer_notes
            FROM missions m
            LEFT JOIN vehicules v ON m.vehicule_id = v.id
            WHERE (m.user_id = ? OR m.transferred_to_user_id = ?)
        """
        
        params = [user_id, user_id]
        filter_description = "Toutes les missions"
        
        # Ajouter les filtres de date
        if filter_type == 'week':
            # Cette semaine
            base_query += " AND DATE(m.date_mission) >= DATE('now', 'weekday 0', '-7 days') AND DATE(m.date_mission) < DATE('now', 'weekday 0')"
            filter_description = "Cette semaine"
        elif filter_type == 'month':
            # Ce mois
            base_query += " AND DATE(m.date_mission) >= DATE('now', 'start of month') AND DATE(m.date_mission) < DATE('now', 'start of month', '+1 month')"
            filter_description = "Ce mois"
        elif filter_type == 'last_week':
            # Semaine dernière
            base_query += " AND DATE(m.date_mission) >= DATE('now', 'weekday 0', '-14 days') AND DATE(m.date_mission) < DATE('now', 'weekday 0', '-7 days')"
            filter_description = "Semaine dernière"
        elif filter_type == 'last_month':
            # Mois dernier
            base_query += " AND DATE(m.date_mission) >= DATE('now', 'start of month', '-1 month') AND DATE(m.date_mission) < DATE('now', 'start of month')"
            filter_description = "Mois dernier"
        elif filter_type == 'custom' and start_date and end_date:
            # Période personnalisée
            base_query += " AND DATE(m.date_mission) >= ? AND DATE(m.date_mission) <= ?"
            params.extend([start_date, end_date])
            filter_description = f"Du {start_date} au {end_date}"
        
        base_query += " ORDER BY m.created_at DESC"
        
        # Exécuter la requête
        cursor.execute(base_query, params)
        missions = cursor.fetchall()
        conn.close()
        
        print(f"Missions trouvées avec filtres: {len(missions)}")
        
        # Créer le PDF avec design professionnel
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # Couleurs du thème
        primary_blue = HexColor('#667eea')
        dark_blue = HexColor('#4c63d2')
        light_blue = HexColor('#e0e7ff')
        dark_gray = HexColor('#1f2937')
        medium_gray = HexColor('#6b7280')
        light_gray = HexColor('#f3f4f6')
        success_green = HexColor('#10b981')
        warning_orange = HexColor('#f59e0b')
        perce_neige_blue = HexColor('#2563eb')
        
        # === EN-TÊTE AVEC DÉGRADÉ ===
        # Arrière-plan dégradé
        for i in range(80):
            shade = 0.3 + (i / 80) * 0.5
            p.setFillColorRGB(0.15 * shade, 0.4 * shade, 0.9 * shade)
            p.rect(0, height - 80 + i, width, 1, fill=1, stroke=0)
        
        # === LOGO PERCE-NEIGE ===
        logo_x, logo_y = 70, height - 40
        p.setFillColor(HexColor('#ffffff'))
        p.circle(logo_x, logo_y, 20, fill=1, stroke=0)
        
        p.setStrokeColor(perce_neige_blue)
        p.setLineWidth(2)
        p.circle(logo_x, logo_y, 20, fill=0, stroke=1)
        
        # Fleur stylisée
        p.setFillColor(perce_neige_blue)
        for i in range(6):
            angle = i * 60
            import math
            petal_x = logo_x + 8 * math.cos(math.radians(angle))
            petal_y = logo_y + 8 * math.sin(math.radians(angle))
            p.circle(petal_x, petal_y, 3, fill=1, stroke=0)
        
        p.setFillColor(warning_orange)
        p.circle(logo_x, logo_y, 4, fill=1, stroke=0)
        
        p.setFillColor(HexColor('#ffffff'))
        p.setFont("Helvetica-Bold", 8)
        p.drawString(logo_x - 15, logo_y + 25, "FONDATION")
        p.drawString(logo_x - 18, logo_y - 32, "PERCE-NEIGE")
        
        # Titre principal
        p.setFillColor(HexColor('#ffffff'))
        p.setFont("Helvetica-Bold", 24)
        p.drawString(130, height - 45, "RAPPORT DE MISSIONS")
        
        p.setFont("Helvetica", 14)
        p.drawString(130, height - 65, "DriveGo - Gestion du Parc Automobile")
        
        # === SECTION INFORMATIONS UTILISATEUR ET FILTRES ===
        y_pos = height - 110
        
        # Encadré utilisateur
        p.setFillColor(light_gray)
        p.roundRect(40, y_pos - 40, width - 80, 55, 8, fill=1, stroke=0)
        
        p.setFillColor(dark_gray)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(60, y_pos - 8, f"Conducteur: {user_prenom} {user_nom}")
        
        p.setFont("Helvetica", 10)
        p.drawString(60, y_pos - 22, f"Rapport généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}")
        
        # NOUVEAU: Affichage du filtre appliqué
        p.setFont("Helvetica-Bold", 10)
        p.setFillColor(primary_blue)
        p.drawString(60, y_pos - 36, f"Période: {filter_description}")
        
        # Date et heure à droite
        p.setFont("Helvetica", 10)
        p.setFillColor(medium_gray)
        p.drawRightString(width - 60, y_pos - 8, f"Date: {datetime.now().strftime('%d/%m/%Y')}")
        p.drawRightString(width - 60, y_pos - 22, f"Heure: {datetime.now().strftime('%H:%M')}")
        
        y_pos -= 85
        
        if len(missions) == 0:
            # Message "aucune mission" avec style
            p.setFillColor(light_blue)
            p.roundRect(40, y_pos - 80, width - 80, 100, 12, fill=1, stroke=0)
            
            p.setFillColor(primary_blue)
            p.setFont("Helvetica-Bold", 18)
            p.drawCentredString(width/2, y_pos - 30, "Aucune mission trouvée")
            
            p.setFont("Helvetica", 12)
            p.setFillColor(medium_gray)
            p.drawCentredString(width/2, y_pos - 50, f"Aucune mission pour la période: {filter_description}")
            
        else:
            # === SECTION STATISTIQUES ===
            missions_actives = len([m for m in missions if m[9] == 'active'])
            missions_terminees = len([m for m in missions if m[9] == 'completed'])
            missions_transferees = len([m for m in missions if m[17] == 'transferred'])
            
            # Titre section
            p.setFillColor(primary_blue)
            p.setFont("Helvetica-Bold", 16)
            p.drawString(40, y_pos, "📊 STATISTIQUES")
            
            # Ligne décorative
            p.setStrokeColor(primary_blue)
            p.setLineWidth(2)
            p.line(40, y_pos - 8, 200, y_pos - 8)
            
            y_pos -= 30
            
            # Cartes statistiques
            stats = [
                ("Total", len(missions), primary_blue),
                ("Actives", missions_actives, warning_orange),
                ("Terminées", missions_terminees, success_green),
                ("Transférées", missions_transferees, dark_blue)
            ]
            
            card_width = (width - 120) / 4
            for i, (label, value, color) in enumerate(stats):
                x = 40 + i * (card_width + 10)
                
                # Carte avec ombre
                p.setFillColorRGB(0.9, 0.9, 0.9)
                p.roundRect(x + 2, y_pos - 42, card_width, 40, 6, fill=1, stroke=0)
                
                # Carte principale
                p.setFillColor(HexColor('#ffffff'))
                p.setStrokeColor(color)
                p.setLineWidth(1)
                p.roundRect(x, y_pos - 40, card_width, 40, 6, fill=1, stroke=1)
                
                # Valeur
                p.setFillColor(color)
                p.setFont("Helvetica-Bold", 20)
                p.drawCentredString(x + card_width/2, y_pos - 18, str(value))
                
                # Label
                p.setFont("Helvetica", 10)
                p.setFillColor(medium_gray)
                p.drawCentredString(x + card_width/2, y_pos - 32, label)
            
            y_pos -= 80
            
            # === SECTION MISSIONS ===
            p.setFillColor(primary_blue)
            p.setFont("Helvetica-Bold", 16)
            p.drawString(40, y_pos, "🎯 DÉTAIL DES MISSIONS")
            
            p.setStrokeColor(primary_blue)
            p.setLineWidth(2)
            p.line(40, y_pos - 8, 250, y_pos - 8)
            
            y_pos -= 30
            
            for i, mission in enumerate(missions, 1):
                # Nouvelle page si nécessaire
                if y_pos < 140:
                    p.showPage()
                    y_pos = height - 50
                
                # === CARTE MISSION ===
                card_height = 130
                
                # Ombre de la carte
                p.setFillColorRGB(0.9, 0.9, 0.9)
                p.roundRect(42, y_pos - card_height - 2, width - 84, card_height, 8, fill=1, stroke=0)
                
                # Carte principale
                p.setFillColor(HexColor('#ffffff'))
                p.setStrokeColor(light_gray)
                p.setLineWidth(1)
                p.roundRect(40, y_pos - card_height, width - 80, card_height, 8, fill=1, stroke=1)
                
                # Bande colorée selon le statut
                if mission[9] == 'active':
                    status_color = warning_orange
                    status_text = "EN COURS"
                else:
                    status_color = success_green
                    status_text = "TERMINÉE"
                
                if mission[17] == 'transferred':
                    status_color = dark_blue
                    status_text += " (TRANSFÉRÉE)"
                
                p.setFillColor(status_color)
                p.roundRect(40, y_pos - 25, width - 80, 25, 8, fill=1, stroke=0)
                
                # Numéro et destination (en-tête)
                p.setFillColor(HexColor('#ffffff'))
                p.setFont("Helvetica-Bold", 14)
                p.drawString(55, y_pos - 18, f"Mission {i}: {mission[5]}")
                
                p.setFont("Helvetica-Bold", 10)
                p.drawRightString(width - 55, y_pos - 18, status_text)
                
                # Contenu de la mission
                content_y = y_pos - 45
                left_x = 55
                
                # Colonne gauche
                details_left = [
                    ("🚗 Véhicule:", f"{mission[15] or 'N/A'} ({mission[16] or 'N/A'})"),
                    ("📅 Date:", mission[1]),
                    ("🕐 Horaire:", f"{mission[2]}" + (f" - {mission[3]}" if mission[3] else "")),
                    ("🎯 Nature:", mission[4]),
                ]
                
                for label, value in details_left:
                    p.setFont("Helvetica-Bold", 9)
                    p.setFillColor(medium_gray)
                    p.drawString(left_x, content_y, label)
                    
                    p.setFont("Helvetica", 9)
                    p.setFillColor(dark_gray)
                    display_value = value[:30] + "..." if len(str(value)) > 30 else str(value)
                    p.drawString(left_x + 70, content_y, display_value)
                    content_y -= 16
                
                # Colonne droite
                content_y = y_pos - 45
                right_x = width/2 + 30
                
                details_right = [
                    ("👥 Passagers:", str(mission[6])),
                    ("🛣️ Km départ:", f"{mission[7]} km"),
                ]
                
                if mission[8]:
                    details_right.append(("🏁 Km arrivée:", f"{mission[8]} km"))
                
                if mission[7] and mission[8]:
                    distance = mission[8] - mission[7]
                    details_right.append(("📏 Distance:", f"{distance} km"))
                
                if mission[14]:
                    details_right.append(("👤 2ème conducteur:", mission[14]))
                
                if mission[17] == 'transferred' and mission[18]:
                    details_right.append(("🔄 Transféré à:", mission[18]))
                    if mission[19]:
                        details_right.append(("⏰ Transfert:", mission[19]))
                
                for label, value in details_right:
                    p.setFont("Helvetica-Bold", 9)
                    p.setFillColor(medium_gray)
                    p.drawString(right_x, content_y, label)
                    
                    p.setFont("Helvetica", 9)
                    p.setFillColor(dark_gray)
                    display_value = str(value)[:20] + "..." if len(str(value)) > 20 else str(value)
                    p.drawString(right_x + 70, content_y, display_value)
                    content_y -= 16
                
                # Notes en bas si présentes
                if mission[13]:
                    notes_y = y_pos - card_height + 25
                    
                    p.setFillColor(dark_gray)
                    p.setFont("Helvetica-Bold", 9)
                    p.drawString(55, notes_y, "📝 Notes:")
                    
                    p.setFont("Helvetica", 8)
                    notes_text = mission[13]
                    max_length = 90
                    
                    if len(notes_text) <= max_length:
                        p.drawString(55, notes_y - 12, notes_text)
                    else:
                        line1 = notes_text[:max_length]
                        if ' ' in line1:
                            cut_point = line1.rfind(' ')
                            line1 = notes_text[:cut_point]
                            line2 = notes_text[cut_point:].strip()
                        else:
                            line1 = notes_text[:max_length]
                            line2 = notes_text[max_length:]
                        
                        p.drawString(55, notes_y - 12, line1)
                        
                        if len(line2) > max_length:
                            line2 = line2[:max_length-3] + "..."
                        p.drawString(55, notes_y - 24, line2)
                
                y_pos -= card_height + 25
        
        # === PIED DE PAGE ===
        footer_y = 40
        
        p.setStrokeColor(primary_blue)
        p.setLineWidth(1)
        p.line(40, footer_y + 15, width - 40, footer_y + 15)
        
        p.setFillColor(medium_gray)
        p.setFont("Helvetica", 8)
        p.drawString(40, footer_y, "DriveGo - Fondation Perce-Neige")
        p.drawRightString(width - 40, footer_y, f"Document confidentiel - Page 1")
        
        p.showPage()
        p.save()
        buffer.seek(0)
        
        # Nom de fichier avec filtre
        filter_suffix = ""
        if filter_type and filter_type != 'all':
            filter_suffix = f"_{filter_type}"
        
        filename = f"rapport_missions_{user_prenom}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{filter_suffix}.pdf"
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype="application/pdf"
        )
        
    except Exception as e:
        print(f"ERREUR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
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
#  ROUTES aide 
# ============================================================================
@app.route('/aide')
def aide():
    """Page d'aide"""
    return render_template('aide.html')

@app.route('/contact', methods=['POST'])
def contact():
    try:
        # Récupérer les données du formulaire
        nom = request.form.get('nom')
        email = request.form.get('email')
        telephone = request.form.get('telephone', 'Non renseigné')
        sujet = request.form.get('sujet')
        message_content = request.form.get('message')
        
        # Validation des champs obligatoires
        if not all([nom, email, sujet, message_content]):
            return jsonify({
                'success': False, 
                'message': '❌ Tous les champs obligatoires doivent être remplis.'
            }), 400
        
        # Créer l'email pour vous (notification)
        msg_admin = Message(
            subject=f'🔔 Nouveau message de contact - {sujet}',
            recipients=['samirbenhammou94250@gmail.com'],  # Votre email
            html=f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <h2 style="margin: 0;">📧 Nouveau message de contact - DriveGo</h2>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                    <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h3 style="color: #495057; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Informations du contact</h3>
                        
                        <table style="width: 100%; margin: 20px 0;">
                            <tr style="background: #f8f9fa;">
                                <td style="padding: 12px; font-weight: bold; color: #495057; width: 120px;">👤 Nom :</td>
                                <td style="padding: 12px; color: #212529;">{nom}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; font-weight: bold; color: #495057;">📧 Email :</td>
                                <td style="padding: 12px; color: #212529;"><a href="mailto:{email}" style="color: #667eea; text-decoration: none;">{email}</a></td>
                            </tr>
                            <tr style="background: #f8f9fa;">
                                <td style="padding: 12px; font-weight: bold; color: #495057;">📱 Téléphone :</td>
                                <td style="padding: 12px; color: #212529;">{telephone}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; font-weight: bold; color: #495057;">🏷️ Sujet :</td>
                                <td style="padding: 12px; color: #212529;"><span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">{sujet.upper()}</span></td>
                            </tr>
                        </table>
                        
                        <h4 style="color: #495057; margin: 25px 0 15px 0;">💬 Message :</h4>
                        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; line-height: 1.6; color: #495057;">
                            {message_content.replace(chr(10), '<br>')}
                        </div>
                        
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="mailto:{email}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Répondre à {nom}</a>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 14px;">
                    <p>📅 Message reçu le {datetime.now().strftime('%d/%m/%Y à %H:%M')}</p>
                    <p>🌟 DriveGo - Système de contact automatisé</p>
                </div>
            </div>
            '''
        )
        
        # Créer l'email de confirmation pour l'utilisateur
        msg_user = Message(
            subject='✅ Confirmation de réception - DriveGo',
            recipients=[email],
            html=f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <h2 style="margin: 0;">✅ Message bien reçu !</h2>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                    <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h3 style="color: #495057;">Bonjour {nom},</h3>
                        
                        <p style="color: #495057; line-height: 1.6; margin: 20px 0;">
                            Nous avons bien reçu votre message concernant "<strong>{sujet}</strong>" et nous vous remercions de nous avoir contactés.
                        </p>
                        
                        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; margin: 20px 0;">
                            <h4 style="color: #007bff; margin-top: 0;">🎯 Votre demande :</h4>
                            <p style="color: #495057; margin: 10px 0; font-style: italic;">"{message_content[:100]}{'...' if len(message_content) > 100 else ''}"</p>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                            <h4 style="color: #856404; margin-top: 0;">⏱️ Délai de réponse :</h4>
                            <p style="color: #856404; margin: 10px 0;">Notre équipe vous répondra dans les <strong>24-48 heures</strong> ouvrables.</p>
                        </div>
                        
                        <p style="color: #495057; line-height: 1.6;">
                            En attendant, n'hésitez pas à consulter notre <a href="#" style="color: #007bff;">FAQ</a> qui pourrait répondre immédiatement à vos questions.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">Merci de votre confiance !</p>
                            <p style="color: #007bff; font-weight: bold; margin: 5px 0;">L'équipe DriveGo 🚗</p>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
                    <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
                    <p>© 2024 DriveGo - Tous droits réservés</p>
                </div>
            </div>
            '''
        )
        
        # Envoyer les emails
        mail.send(msg_admin)
        mail.send(msg_user)
        
        return jsonify({
            'success': True,
            'message': '🎉 Votre message a été envoyé avec succès ! Notre équipe vous répondra dans les plus brefs délais.'
        })
        
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email: {str(e)}")
        return jsonify({
            'success': False,
            'message': '❌ Une erreur est survenue lors de l\'envoi. Veuillez réessayer plus tard.'
        }), 500

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

@app.route('/fiches_vehicules')
def vehicles_page():
    """Page d'affichage des véhicules"""
    return render_template('fiches_vehicules.html')

@app.route('/support')
def support():
    """Page de support"""
    return render_template('support.html')

@app.route('/admin')
def admin_dashboard():
    """Page d'administration"""
    if 'user_id' not in session:
        return redirect(url_for('connexion'))
    
    return render_template('admin_dashboard.html')

@app.route("/change_password", methods=["GET", "POST"])
def change_password():
    """Page pour changer le mot de passe (normal ou reset)"""
    if request.method == "POST":
        # Vérifier si c'est une requête AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        current_password = request.form.get("current_password")
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")
        
        # Vérifier si c'est une réinitialisation depuis email
        is_reset = session.get('password_reset_email') is not None
        reset_email = session.get('password_reset_email')

        errors = {}

        if is_reset:
            # Mode réinitialisation depuis email
            if not reset_email:
                if is_ajax:
                    return jsonify({
                        'success': False,
                        'message': 'Session de réinitialisation expirée'
                    }), 400
                else:
                    flash("❌ Session de réinitialisation expirée", "error")
                    return redirect(url_for('mot_de_passe_oublie'))
        else:
            # Mode changement normal (utilisateur connecté)
            user_id = session.get('user_id')
            if not user_id:
                if is_ajax:
                    return jsonify({
                        'success': False,
                        'message': 'Vous devez être connecté'
                    }), 401
                else:
                    flash("❌ Vous devez être connecté", "error")
                    return redirect(url_for('connexion'))
            
            # Validation du mot de passe actuel
            if not current_password:
                errors['current_password'] = "Le mot de passe actuel est requis"
            else:
                conn = sqlite3.connect(DATABASE)
                cursor = conn.cursor()
                cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
                user_data = cursor.fetchone()
                conn.close()
                
                if not user_data or not check_password_hash(user_data[0], current_password):
                    errors['current_password'] = "Mot de passe actuel incorrect"

        # Validations communes
        if not new_password:
            errors['new_password'] = "Le nouveau mot de passe est requis"
        elif len(new_password) < 8:
            errors['new_password'] = "Le mot de passe doit contenir au moins 8 caractères"

        if new_password != confirm_password:
            errors['confirm_password'] = "Les mots de passe ne correspondent pas"

        # Validation de la complexité du mot de passe
        if new_password:
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
                return render_template("change_password.html", is_reset=is_reset)

        # Procéder au changement de mot de passe
        try:
            hashed_password = generate_password_hash(new_password)
            
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            if is_reset:
                # Mise à jour via email de reset
                cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (hashed_password, reset_email))
                # Nettoyer la session
                session.pop('password_reset_email', None)
                success_message = "✅ Votre mot de passe a été réinitialisé avec succès !"
            else:
                # Mise à jour normale
                user_id = session.get('user_id')
                cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed_password, user_id))
                success_message = "✅ Votre mot de passe a été modifié avec succès !"
            
            conn.commit()
            conn.close()
            
            if is_ajax:
                return jsonify({
                    'success': True,
                    'message': success_message
                }), 200
            else:
                flash(success_message, "success")
                if is_reset:
                    # Après un reset, rediriger vers la connexion
                    flash("🔐 Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.", "info")
                    return redirect(url_for("connexion"))
                else:
                    # Après un changement normal, retour au dashboard
                    return redirect(url_for("index"))
            
        except Exception as e:
            print(f"Erreur lors du changement de mot de passe: {e}")
            
            if is_ajax:
                return jsonify({
                    'success': False,
                    'message': 'Erreur lors de la mise à jour. Veuillez réessayer.'
                }), 500
            else:
                flash("❌ Erreur lors de la mise à jour. Veuillez réessayer.", "error")
                return render_template("change_password.html", is_reset=is_reset)

    # Requête GET - Afficher la page
    is_reset = session.get('password_reset_email') is not None
    return render_template("change_password.html", is_reset=is_reset)


@app.route("/mot_de_passe_oublie", methods=["GET", "POST"])
def mot_de_passe_oublie():
    """Page et traitement du mot de passe oublié"""
    if request.method == "POST":
        email = request.form.get("email", "").lower().strip()
        
        if not email:
            flash("Veuillez saisir une adresse email.", "error")
            return render_template("mot_de_passe_oublie.html")
        
        # Vérifier si l'utilisateur existe dans la base de données
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, nom, prenom FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            try:
                # Générer le token sécurisé
                token = generate_reset_token(email)
                
                # Envoyer l'email
                send_reset_email(email, token)
                
                flash("📧 Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte mail (et vos spams).", "success")
                
            except Exception as e:
                print(f"Erreur lors de l'envoi de l'email: {e}")
                flash("❌ Erreur lors de l'envoi de l'email. Veuillez réessayer dans quelques minutes.", "error")
        else:
            # Message identique pour éviter l'énumération des emails
            flash("📧 Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte mail (et vos spams).", "success")
    
    return render_template("mot_de_passe_oublie.html")

@app.route("/reset_password/<token>")
def reset_password(token):
    """Traite le lien de réinitialisation depuis l'email"""
    try:
        # Vérifier la validité du token
        email = verify_reset_token(token)
        
        if email is None:
            flash("❌ Le lien de réinitialisation est invalide ou a expiré. Veuillez faire une nouvelle demande.", "error")
            return redirect(url_for('mot_de_passe_oublie'))
        
        # Vérifier que l'utilisateur existe toujours
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            flash("❌ Utilisateur non trouvé. Veuillez contacter l'administrateur.", "error")
            return redirect(url_for('mot_de_passe_oublie'))
        
        # Stocker l'email en session pour la page change_password
        session['password_reset_email'] = email
        flash("✅ Lien valide ! Vous pouvez maintenant créer votre nouveau mot de passe.", "success")
        
        # Redirection vers change_password
        return redirect(url_for('change_password'))
        
    except Exception as e:
        print(f"Erreur dans reset_password: {e}")
        flash("❌ Erreur lors du traitement du lien. Veuillez réessayer.", "error")
        return redirect(url_for('mot_de_passe_oublie'))

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


@app.route('/api/support/incident', methods=['POST'])
def api_support_incident():
    """Traiter un signalement d'incident et envoyer par email"""
    try:
        # Récupérer les données JSON
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Aucune donnée reçue'
            }), 400
        
        # Validation des champs requis
        required_fields = ['nom', 'prenom', 'vehicule', 'priorite', 'type_incident', 'localisation', 'description', 'telephone']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return jsonify({
                'success': False,
                'message': f'Champs manquants: {", ".join(missing_fields)}'
            }), 400
        
        # Générer un numéro de ticket unique
        ticket_id = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        
        # Timestamp
        timestamp = datetime.now()
        
        # Préparer les données du signalement
        incident_data = {
            'ticket_id': ticket_id,
            'timestamp': timestamp.isoformat(),
            'conducteur': f"{data['prenom']} {data['nom']}",
            'vehicule': data['vehicule'],
            'priorite': data['priorite'],
            'type_incident': data['type_incident'],
            'localisation': data['localisation'],
            'description': data['description'],
            'telephone': data['telephone'],
            'email': data.get('email', ''),
            'user_agent': data.get('user_agent', ''),
            'current_url': data.get('current_url', '')
        }
        
        # Déterminer les destinataires selon la priorité
        priority_emails = {
            'critique': ['astreinte@fondation-perceneige.org', 'urgence@fondation-perceneige.org'],
            'elevee': ['technique@fondation-perceneige.org', 'flotte@fondation-perceneige.org'],
            'normale': ['technique@fondation-perceneige.org'],
            'faible': ['maintenance@fondation-perceneige.org']
        }
        
        # Email destinataires (remplacez par vos vraies adresses)
        recipients = priority_emails.get(data['priorite'], ['support@fondation-perceneige.org'])
        
        # Créer l'email de signalement
        subject = f"[DRIVEGO-{data['priorite'].upper()}] Incident #{ticket_id} - {data['vehicule']}"
        
        # Corps de l'email en HTML
        email_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .header {{ background: #e74c3c; color: white; padding: 20px; text-align: center; }}
        .urgent {{ background: #c0392b; }}
        .elevee {{ background: #f39c12; }}
        .normale {{ background: #3498db; }}
        .faible {{ background: #27ae60; }}
        .content {{ padding: 20px; }}
        .info-grid {{ display: grid; grid-template-columns: 200px 1fr; gap: 10px; margin: 10px 0; }}
        .label {{ font-weight: bold; background: #f8f9fa; padding: 8px; }}
        .value {{ padding: 8px; border-left: 3px solid #e74c3c; }}
        .description {{ background: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; }}
        .footer {{ background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }}
        .priority-critical {{ color: #c0392b; font-weight: bold; }}
        .priority-elevee {{ color: #f39c12; font-weight: bold; }}
        .priority-normale {{ color: #3498db; font-weight: bold; }}
        .priority-faible {{ color: #27ae60; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="header {data['priorite']}">
        <h1>🚨 SIGNALEMENT D'INCIDENT DRIVEGO</h1>
        <h2>Ticket #{ticket_id}</h2>
        <p>Priorité: <span class="priority-{data['priorite']}">{data['priorite'].upper()}</span></p>
    </div>
    
    <div class="content">
        <h3>Informations du signalement</h3>
        <div class="info-grid">
            <div class="label">Conducteur:</div>
            <div class="value">{incident_data['conducteur']}</div>
            
            <div class="label">Véhicule:</div>
            <div class="value">{data['vehicule']}</div>
            
            <div class="label">Type d'incident:</div>
            <div class="value">{data['type_incident']}</div>
            
            <div class="label">Localisation:</div>
            <div class="value">{data['localisation']}</div>
            
            <div class="label">Téléphone:</div>
            <div class="value"><a href="tel:{data['telephone']}">{data['telephone']}</a></div>
            
            <div class="label">Email:</div>
            <div class="value">{data.get('email', 'Non fourni')}</div>
            
            <div class="label">Date/Heure:</div>
            <div class="value">{timestamp.strftime('%d/%m/%Y à %H:%M:%S')}</div>
        </div>
        
        <h3>Description détaillée</h3>
        <div class="description">

        {data['description'].replace('\n', '<br>')}
        </div>
        
        {"<div style='background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0;'><strong>⚠️ URGENCE CRITIQUE:</strong> Contacter immédiatement le conducteur !</div>" if data['priorite'] == 'critique' else ""}
        
        <h3>Actions à entreprendre</h3>
        <ul>
            {"<li><strong>Contacter immédiatement le conducteur</strong></li>" if data['priorite'] in ['critique', 'elevee'] else ""}
            <li>Évaluer la situation et les risques</li>
            <li>Organiser l'assistance nécessaire</li>
            <li>Tenir informé le conducteur de l'avancement</li>
            <li>Clôturer le ticket une fois résolu</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>DriveGo - Système de gestion des incidents | Fondation Perce-Neige</p>
        <p>Ce signalement a été généré automatiquement le {timestamp.strftime('%d/%m/%Y à %H:%M:%S')}</p>
    </div>
</body>
</html>
        """
        
        try:
            # Créer et envoyer l'email principal
            msg = Message(
                subject=subject,
                recipients=recipients,
                html=email_body
            )
            
            mail.send(msg)
            
            # Si un email conducteur est fourni, envoyer une confirmation
            if data.get('email'):
                confirmation_subject = f"Confirmation - Signalement #{ticket_id} reçu"
                confirmation_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .header {{ background: #3498db; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; }}
        .ticket {{ background: #e8f4fd; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; }}
        .footer {{ background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ SIGNALEMENT REÇU</h1>
        <h2>DriveGo - Fondation Perce-Neige</h2>
    </div>
    
    <div class="content">
        <p>Bonjour {data['prenom']},</p>
        
        <p>Votre signalement d'incident a bien été reçu et transmis à notre équipe technique.</p>
        
        <div class="ticket">
            <strong>Numéro de ticket:</strong> #{ticket_id}<br>
            <strong>Véhicule:</strong> {data['vehicule']}<br>
            <strong>Priorité:</strong> {data['priorite'].capitalize()}<br>
            <strong>Date:</strong> {timestamp.strftime('%d/%m/%Y à %H:%M')}
        </div>
        
        {"<p><strong>⚠️ Votre signalement est marqué comme URGENT.</strong> Notre équipe d'astreinte va vous contacter très rapidement.</p>" if data['priorite'] in ['critique', 'elevee'] else "<p>Notre équipe va traiter votre demande dans les meilleurs délais.</p>"}
        
        <p>En cas d'urgence immédiate, n'hésitez pas à contacter directement l'astreinte au <strong>06 12 34 56 78</strong>.</p>
        
        <p>Merci de votre vigilance,<br>
        L'équipe DriveGo</p>
    </div>
    
    <div class="footer">
        <p>Fondation Perce-Neige - Service Technique</p>
        <p>Ne pas répondre à cet email automatique</p>
    </div>
</body>
</html>
                """
                
                confirmation_msg = Message(
                    subject=confirmation_subject,
                    recipients=[data['email']],
                    html=confirmation_body
                )
                
                mail.send(confirmation_msg)
        
        except Exception as email_error:
            print(f"Erreur envoi email: {email_error}")
            # Ne pas faire échouer la requête si l'email ne fonctionne pas
            return jsonify({
                'success': True,
                'message': 'Signalement reçu mais erreur d\'envoi email',
                'ticket_id': ticket_id,
                'priority': data['priorite'],
                'email_error': str(email_error)
            }), 200
        
        # Optionnel: Sauvegarder en base de données
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            # Créer la table incidents si elle n'existe pas
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS incidents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_id TEXT UNIQUE NOT NULL,
                    conducteur_nom TEXT NOT NULL,
                    conducteur_prenom TEXT NOT NULL,
                    vehicule TEXT NOT NULL,
                    priorite TEXT NOT NULL,
                    type_incident TEXT NOT NULL,
                    localisation TEXT NOT NULL,
                    description TEXT NOT NULL,
                    telephone TEXT NOT NULL,
                    email TEXT,
                    statut TEXT DEFAULT 'ouvert',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Insérer le signalement
            cursor.execute('''
                INSERT INTO incidents (
                    ticket_id, conducteur_nom, conducteur_prenom, vehicule,
                    priorite, type_incident, localisation, description,
                    telephone, email
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                ticket_id, data['nom'], data['prenom'], data['vehicule'],
                data['priorite'], data['type_incident'], data['localisation'],
                data['description'], data['telephone'], data.get('email', '')
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as db_error:
            print(f"Erreur sauvegarde DB: {db_error}")
            # Ne pas faire échouer la requête
        
        return jsonify({
            'success': True,
            'message': 'Signalement transmis avec succès',
            'ticket_id': ticket_id,
            'priority': data['priorite']
        }), 200
        
    except Exception as e:
        print(f"Erreur traitement signalement: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors du traitement du signalement'
        }), 500
# ============================================================================
# 🔐 ROUTES D'AUTHENTIFICATION
# ============================================================================

@app.route('/google-signin', methods=['POST'])
def google_signin():
    token = request.json.get('credential')

    try:
        # Vérifier le token Google
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            "586952928342-mmfucge3269sjkj0706mch5hmc0jpp8d.apps.googleusercontent.com"
        )

        email = idinfo['email']
        name = idinfo['name']
        picture = idinfo.get('picture', '')

        # Connexion à la DB
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()

        # Vérifier si l'utilisateur existe déjà
        cursor.execute("SELECT id, nom, prenom, role, profile_picture FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            # Extraire nom/prénom depuis le "name" Google
            prenom = name.split(' ')[0]
            nom = ' '.join(name.split(' ')[1:]) or "Utilisateur"

            # Créer un utilisateur par défaut (mot de passe vide car connexion via Google)
            cursor.execute('''
                INSERT INTO users (email, password_hash, nom, prenom, role, profile_picture)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (email, "", nom, prenom, "client", picture))
            conn.commit()

            # Récupérer l’utilisateur inséré
            cursor.execute("SELECT id, nom, prenom, role, profile_picture FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()

        conn.close()

        # user = (id, nom, prenom, role, profile_picture)
        user_id, nom, prenom, role, profile_picture = user

        # ⚡ Stocker les infos dans la session Flask
        session['user_id'] = user_id
        session['prenom'] = prenom
        session['nom'] = nom
        session['profile_picture_url'] = profile_picture
        session['role'] = role

        return jsonify({'success': True, 'user': {'email': email, 'name': name}})
    
    except ValueError:
        return jsonify({'success': False, 'error': 'Token invalide'}), 400


@app.route('/api/users', methods=['GET'])
def api_get_users():
    """Récupérer la liste des utilisateurs pour les transferts"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, nom, prenom, email 
            FROM users 
            WHERE id != ?
            ORDER BY prenom, nom
        """, (session['user_id'],))  # Exclure l'utilisateur connecté
        
        users = cursor.fetchall()
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user[0],
                'nom': f"{user[2]} {user[1]}",  # prenom nom
                'prenom': user[2],
                'email': user[3]
            })
        
        return jsonify({
            'success': True,
            'users': users_list
        }), 200
        
    except Exception as e:
        print(f"Erreur récupération utilisateurs: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des utilisateurs'
        }), 500

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


def generate_invitation_token():
    """Générer un token d'invitation sécurisé"""
    return secrets.token_urlsafe(32)

def send_invitation_email(email, token, message='', invited_by_name=''):
    """Envoyer l'email d'invitation"""
    try:
        # URL d'inscription avec token
        registration_url = f"http://localhost:5000/inscription?token={token}"
        
        # Template HTML de l'email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                .logo {{ font-size: 24px; font-weight: bold; margin-bottom: 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">DriveGo</div>
                    <h1>Invitation à rejoindre notre équipe</h1>
                    <p>Fondation Perce-Neige</p>
                </div>
                <div class="content">
                    <h2>Bonjour !</h2>
                    
                    <p><strong>{invited_by_name}</strong> vous invite à rejoindre DriveGo, notre système de gestion du parc automobile de la Fondation Perce-Neige.</p>
                    
                    {f'<div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;"><em>"{message}"</em></div>' if message else ''}
                    
                    <p>Avec DriveGo, vous pourrez :</p>
                    <ul>
                        <li>Créer et gérer vos missions de conduite</li>
                        <li>Consulter les informations des véhicules</li>
                        <li>Suivre vos activités de conduite</li>
                        <li>Accéder à l'application depuis n'importe quel appareil</li>
                    </ul>
                    
                    <p>Pour commencer, cliquez sur le bouton ci-dessous pour créer votre compte :</p>
                    
                    <div style="text-align: center;">
                        <a href="{registration_url}" class="button">Créer mon compte</a>
                    </div>
                    
                    <p><small>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                    <a href="{registration_url}">{registration_url}</a></small></p>
                    
                    <p><strong>Important :</strong> Cette invitation expire dans 48 heures.</p>
                </div>
                <div class="footer">
                    <p>Cet email a été envoyé par DriveGo - Fondation Perce-Neige<br>
                    Si vous avez reçu cet email par erreur, vous pouvez l'ignorer.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Créer et envoyer l'email
        msg = Message(
            subject='Invitation à rejoindre DriveGo - Fondation Perce-Neige',
            recipients=[email],
            html=html_content
        )
        
        mail.send(msg)
        return True
        
    except Exception as e:
        print(f"Erreur envoi email: {e}")
        return False

# ============================================================================
# ROUTES POUR LE SYSTÈME D'INVITATION
# ============================================================================

@app.route('/api/admin/send-invitation', methods=['POST'])
def api_admin_send_invitation():
    """Envoyer une invitation par email"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        data = request.get_json()
        email = data.get('email')
        message = data.get('message', '')
        
        if not email or '@' not in email:
            return jsonify({
                'success': False,
                'message': 'Adresse email invalide'
            }), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que l'email n'existe pas déjà
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Cette adresse email est déjà enregistrée'
            }), 400
        
        # Vérifier s'il y a déjà une invitation non utilisée
        cursor.execute('''
            SELECT id FROM invitation_tokens 
            WHERE email = ? AND used = 0 AND expires_at > datetime('now')
        ''', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Une invitation est déjà en cours pour cette adresse email'
            }), 400
        
        # Récupérer le nom de l'utilisateur qui invite
        cursor.execute('SELECT nom, prenom FROM users WHERE id = ?', (session['user_id'],))
        user = cursor.fetchone()
        invited_by_name = f"{user[1]} {user[0]}" if user else "L'équipe"
        
        # Générer le token
        token = generate_invitation_token()
        expires_at = datetime.now() + timedelta(hours=48)
        
        # Sauvegarder l'invitation
        cursor.execute('''
            INSERT INTO invitation_tokens (email, token, invited_by, message, expires_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (email, token, session['user_id'], message, expires_at))
        
        conn.commit()
        conn.close()
        
        # Envoyer l'email
        if send_invitation_email(email, token, message, invited_by_name):
            return jsonify({
                'success': True,
                'message': f'Invitation envoyée avec succès à {email}'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Erreur lors de l\'envoi de l\'email'
            }), 500
        
    except Exception as e:
        print(f"Erreur envoi invitation: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de l\'envoi de l\'invitation'
        }), 500

# ============================================================================
# MODIFICATION DE VOS ROUTES EXISTANTES
# ============================================================================

@app.route('/inscription')
def inscription():
    """Page d'inscription - modifiée pour gérer les tokens d'invitation"""
    if 'user_id' in session:
        return redirect(url_for('index'))
    
    # Récupérer le token d'invitation s'il existe
    token = request.args.get('token')
    email = ''
    readonly_email = False
    
    if token:
        # Vérifier le token d'invitation dans la table INVITATIONS (pas invitation_tokens)
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('''
            SELECT email, expires_at 
            FROM invitation_tokens
            WHERE token = ?
        ''', (token,))
        result = cursor.fetchone()
        conn.close()
        print("result:", result)
        if result:
            # Vérifier que l'invitation n'a pas expiré
            from datetime import datetime
            try:
                expires_at = datetime.fromisoformat(result['expires_at'])
                if datetime.now() <= expires_at:
                    email = result['email']
                    readonly_email = True
                else:
                    print("le lien a expirer")
                    flash('Lien d\'invitation expiré.', 'error')
                    return redirect(url_for('connexion'))
            except:
                # Si problème de format de date, accepter quand même
                email = result['email']
                readonly_email = True
        else:
            flash('Lien d\'invitation invalide ou expiré.', 'error')
            return redirect(url_for('connexion'))
    
    return render_template('inscription.html', email=email, token=token, readonly_email=readonly_email)

@app.route('/inscription', methods=['POST'])
def handle_inscription():
    """Gérer l'inscription avec support des invitations"""
    try:
        # Récupérer les données du formulaire
        email = request.form.get('email')
        password = request.form.get('password')
        nom = request.form.get('nom')
        prenom = request.form.get('prenom')
        telephone = request.form.get('telephone', '')
        fonction = request.form.get('fonction', 'Éducateur/trice')  # NOUVEAU
        token = request.form.get('token')
        
        # Validation basique
        if not all([email, password, nom, prenom, fonction]):
            flash('Tous les champs requis doivent être remplis', 'error')
            return redirect(url_for('inscription'))
        
        # Adapter le rôle selon le genre automatiquement détecté
        role_adapte = adapt_user_role(fonction, prenom)  # NOUVEAU
        
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            # ... vérifications existantes ...
            
            # Créer le nouvel utilisateur avec le rôle adapté
            password_hash = generate_password_hash(password)
            
            cursor.execute('''
                INSERT INTO users (email, password_hash, nom, prenom, telephone, role, statut)
                VALUES (?, ?, ?, ?, ?, ?, 'actif')
            ''', (email, password_hash, nom, prenom, telephone, role_adapte))  # MODIFIÉ
            
            conn.commit()
            
            flash('Compte créé avec succès! Vous pouvez maintenant vous connecter.', 'success')
            return redirect(url_for('connexion'))
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"Erreur inscription: {e}")
        flash('Erreur lors de la création du compte', 'error')
        return redirect(url_for('inscription'))

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
    """Terminer une mission avec conservation des données de transfert"""
    try:
        # Vérifier l'authentification
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        user_id = session['user_id']
        
        # Récupérer la mission depuis la base de données
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, user_id, vehicule_id, statut, km_depart, control_status, 
                   can_be_ended, transferred_to_name, transferred_at_time
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
        
        # Vérifier le statut de la mission
        if mission[3] != 'active':
            conn.close()
            return jsonify({'success': False, 'message': 'Mission déjà terminée'}), 400
        
        # Vérifier si la mission peut être terminée
        control_status = mission[5] or 'manual'
        can_be_ended = mission[6] if mission[6] is not None else True
        
        if not can_be_ended:
            conn.close()
            return jsonify({'success': False, 'message': 'Impossible de terminer cette mission'}), 400
        
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
        photos = request.files.getlist('photos[]')
        
        if photos:
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
        
        # CORRECTION PRINCIPALE : Conserver les données de transfert
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
            update_params = [
                heure_fin, km_arrivee, carburant_arrivee, 
                plein_effectue, notes, photos_json, mission_id
            ]
            
            cursor.execute(update_query, update_params)
            
            # Libérer le véhicule
            vehicule_id = mission[2]
            cursor.execute("""
                UPDATE vehicules 
                SET statut = 'actif' 
                WHERE id = ?
            """, (vehicule_id,))
            
            conn.commit()
            
            # Message de succès avec contexte de transfert
            success_message = 'Mission terminée avec succès'
            if control_status == 'transferred':
                transferred_to = mission[7] or 'un autre conducteur'
                success_message = f'Mission terminée avec succès (transférée à {transferred_to})'
            
            # Calculer les données pour la réponse
            distance_parcourue = km_arrivee - km_depart
            
            conn.close()
            
            return jsonify({
                'success': True, 
                'message': success_message,
                'data': {
                    'mission_id': mission_id,
                    'distance_parcourue': distance_parcourue,
                    'photos_count': len(uploaded_photos),
                    'was_transferred': control_status == 'transferred',
                    'transferred_to': mission[7] if control_status == 'transferred' else None,
                    'transfer_time': mission[8] if control_status == 'transferred' else None
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
    """Récupérer les missions d'un utilisateur spécifique avec support transfert et horaires"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                m.id, m.vehicule_id, m.user_id, m.date_mission, 
                m.heure_debut, m.heure_fin, m.motif, m.destination, 
                m.nb_passagers, m.km_depart, m.km_arrivee, m.notes, 
                m.statut, m.created_at, m.updated_at, m.creneau,
                m.conducteur2, m.carburant_depart, m.carburant_arrivee, 
                m.plein_effectue, m.photos,
                m.control_status, m.transferred_to_user_id, m.transferred_to_name,
                m.transfer_notes, m.transferred_at, m.transferred_at_time, m.can_be_ended,
                v.nom as vehicule_nom, v.immatriculation,
                u.nom as user_nom, u.prenom as user_prenom
            FROM missions m
            LEFT JOIN vehicules v ON m.vehicule_id = v.id
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.user_id = ? OR m.transferred_to_user_id = ?
            ORDER BY m.created_at DESC
        """, (user_id, user_id))
        
        missions = cursor.fetchall()
        conn.close()
        
        missions_list = []
        for mission in missions:
            # DEBUG : Afficher les valeurs pour comprendre les index
            print(f"DEBUG Mission {mission[0]}:")
            print(f"  - transferred_at (index 25): {mission[25]}")
            print(f"  - transferred_at_time (index 26): {mission[26]}")
            print(f"  - can_be_ended (index 27): {mission[27]}")
            
            # Déterminer qui est le conducteur actuel
            is_transferred = mission[21] == 'transferred' if mission[21] else False  # control_status
            
            # Nom complet de l'utilisateur original  
            user_nom = mission[29] if mission[29] else ""
            user_prenom = mission[30] if mission[30] else ""
            original_driver = f"{user_prenom} {user_nom}".strip()
            
            # Conducteur actuel (transféré ou original)
            if is_transferred and mission[23]:  # transferred_to_name
                current_driver = mission[23]
            else:
                current_driver = original_driver
            
            # Calculer les créneaux horaires si transfert - CORRECTION DES INDEX
            time_slots = []
            if is_transferred and mission[26] and mission[4] and mission[5]:  # CORRIGÉ: transferred_at_time = index 26
                transfer_time = mission[26]  # transferred_at_time (heure simple HH:MM)
                start_time = mission[4]      # heure_debut
                end_time = mission[5]        # heure_fin
                
                print(f"  - Calcul créneaux avec transfer_time: {transfer_time}")
                
                time_slots = [
                    {
                        'driver': original_driver,
                        'start': start_time,
                        'end': transfer_time,
                        'duration': calculate_duration(start_time, transfer_time)
                    },
                    {
                        'driver': mission[23],  # transferred_to_name
                        'start': transfer_time,
                        'end': end_time,
                        'duration': calculate_duration(transfer_time, end_time)
                    }
                ]
            
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
                'creneau': mission[15],
                'conducteur2': mission[16],
                'carburant_depart': mission[17],
                'carburant_arrivee': mission[18],
                'plein_effectue': mission[19],
                'photos': mission[20],
                # DONNÉES DE TRANSFERT - INDEX CORRIGÉS
                'control_status': mission[21] or 'manual',
                'transferred_to_user_id': mission[22],
                'transferred_to_name': mission[23],
                'transfer_notes': mission[24],
                'transferred_at': mission[25],          # timestamp complet
                'transferred_at_time': mission[26],     # heure simple HH:MM
                'can_be_ended': mission[27] if mission[27] is not None else True,
                'is_transferred': is_transferred,
                'conducteur_actuel': current_driver,
                'conducteur_original': original_driver,
                'time_slots': time_slots,
                'vehicule_nom': mission[28],            # CORRIGÉ: index 28
                'vehicule_immatriculation': mission[29]  # CORRIGÉ: index 29
            })
        
        return jsonify({
            'success': True,
            'missions': missions_list
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des missions utilisateur: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des missions utilisateur'
        }), 500


def calculate_duration(start_time, end_time):
    """Calcule la durée entre deux heures au format HH:MM"""
    try:
        from datetime import datetime, timedelta
        
        # Nettoyer les heures pour ne garder que HH:MM
        def clean_time(time_str):
            if not time_str:
                return None
            time_str = str(time_str)
            # Si c'est un timestamp, extraire l'heure
            if len(time_str) > 8:  # Plus long que "HH:MM:SS"
                try:
                    # Essayer de parser comme datetime
                    if 'T' in time_str or ' ' in time_str:
                        dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
                        return dt.strftime('%H:%M')
                except:
                    pass
                # Sinon prendre les 5 premiers caractères
                return time_str[:5] if len(time_str) >= 5 else time_str
            return time_str
        
        start_clean = clean_time(start_time)
        end_clean = clean_time(end_time)
        
        print(f"DEBUG calculate_duration: '{start_time}' -> '{start_clean}', '{end_time}' -> '{end_clean}'")
        
        if not start_clean or not end_clean:
            return "N/A"
        
        # Valider le format HH:MM
        if ':' not in start_clean or ':' not in end_clean:
            return "N/A"
            
        # Parser les heures
        start = datetime.strptime(start_clean, '%H:%M')
        end = datetime.strptime(end_clean, '%H:%M')
        
        # Gérer le cas où la fin est le jour suivant
        if end < start:
            end += timedelta(days=1)
        
        # Calculer la durée
        duration = end - start
        
        # Convertir en heures et minutes
        total_minutes = int(duration.total_seconds() / 60)
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        if hours > 0:
            return f"{hours}h{minutes:02d}"
        else:
            return f"{minutes}min"
            
    except Exception as e:
        print(f"Erreur calcul durée: {e}")
        return "N/A"

def calculate_duration(start_time, end_time):
    """Calcule la durée entre deux heures au format HH:MM"""
    try:
        from datetime import datetime, timedelta
        
        # Nettoyer les heures pour ne garder que HH:MM
        def clean_time(time_str):
            if not time_str:
                return None
            # Si c'est un timestamp, extraire l'heure
            if len(str(time_str)) > 5:
                try:
                    dt = datetime.fromisoformat(str(time_str).replace('Z', '+00:00'))
                    return dt.strftime('%H:%M')
                except:
                    return str(time_str)[:5]
            return str(time_str)
        
        start_clean = clean_time(start_time)
        end_clean = clean_time(end_time)
        
        if not start_clean or not end_clean:
            return "N/A"
        
        # Parser les heures
        start = datetime.strptime(start_clean, '%H:%M')
        end = datetime.strptime(end_clean, '%H:%M')
        
        # Gérer le cas où la fin est le jour suivant
        if end < start:
            end += timedelta(days=1)
        
        # Calculer la durée
        duration = end - start
        
        # Convertir en heures et minutes
        total_minutes = int(duration.total_seconds() / 60)
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        if hours > 0:
            return f"{hours}h{minutes:02d}"
        else:
            return f"{minutes}min"
            
    except Exception as e:
        print(f"Erreur calcul durée: {e}")
        return "N/A"

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
# ROUTES API VÉHICULES - fiches vehicules
# ============================================================================

@app.route('/api/vehicules/<int:vehicule_id>/complete', methods=['GET'])
def api_get_vehicule_complete(vehicule_id):
    """Récupérer toutes les informations d'un véhicule (général + carte grise + assurance + CT)"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                id, nom, immatriculation, date_immatriculation, controle, 
                prochain_controle, fin_validite, numero_carte, disponible, 
                statut, notes, created_at,
                carte_grise_numero, carte_grise_date_emission, carte_grise_titulaire, carte_grise_fichier,
                assurance_compagnie, assurance_numero_contrat, assurance_date_debut, assurance_date_expiration,
                assurance_type_couverture, assurance_montant_prime, assurance_fichier,
                ct_date_prochain_controle, ct_photo
            FROM vehicules 
            WHERE id = ?
        ''', (vehicule_id,))
        
        vehicule = cursor.fetchone()
        conn.close()
        
        if not vehicule:
            return jsonify({'success': False, 'message': 'Véhicule introuvable'}), 404
        
        vehicule_data = {
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
            'created_at': vehicule[11],
            
            # Carte Grise
            'carteGrise': {
                'numero': vehicule[12] or '',
                'dateEmission': vehicule[13] or '',
                'titulaire': vehicule[14] or '',
                'fichier': vehicule[15] or None
            },
            
            # Assurance
            'assurance': {
                'compagnie': vehicule[16] or '',
                'numeroContrat': vehicule[17] or '',
                'dateDebut': vehicule[18] or '',
                'dateExpiration': vehicule[19] or '',
                'typeCouverture': vehicule[20] or '',
                'montantPrime': vehicule[21] or 0,
                'fichier': vehicule[22] or None
            },
            
            # Contrôle Technique
            'controleTechnique': {
                'dateProchainControle': vehicule[23] or '',
                'photoUrl': vehicule[24] or None
            }
        }
        
        return jsonify({
            'success': True,
            'vehicule': vehicule_data
        }), 200
        
    except Exception as e:
        print(f"Erreur récupération véhicule complet: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des données'
        }), 500

@app.route('/api/vehicules/<int:vehicule_id>/assurance', methods=['PUT'])
def api_update_vehicule_assurance(vehicule_id):
    """Mettre à jour les informations d'assurance d'un véhicule"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        data = request.get_json()
        
        # Validation des données
        required_fields = ['compagnie', 'numeroContrat', 'dateDebut', 'dateExpiration', 'typeCouverture']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT id FROM vehicules WHERE id = ?', (vehicule_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Véhicule introuvable'}), 404
        
        # Mettre à jour les informations d'assurance (sans montantPrime)
        cursor.execute('''
            UPDATE vehicules 
            SET assurance_compagnie = ?,
                assurance_numero_contrat = ?,
                assurance_date_debut = ?,
                assurance_date_expiration = ?,
                assurance_type_couverture = ?
            WHERE id = ?
        ''', (
            data['compagnie'],
            data['numeroContrat'],
            data['dateDebut'],
            data['dateExpiration'],
            data['typeCouverture'],
            vehicule_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Assurance mise à jour avec succès'
        }), 200
        
    except Exception as e:
        print(f"Erreur mise à jour assurance: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la mise à jour'
        }), 500
@app.route('/api/vehicules/<int:vehicule_id>/controle-technique', methods=['PUT'])
def api_update_vehicule_controle_technique(vehicule_id):
    """Mettre à jour les informations de contrôle technique"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        # Récupérer les données du formulaire
        date_prochain_controle = request.form.get('dateProchainControle')
        
        if not date_prochain_controle:
            return jsonify({
                'success': False,
                'message': 'La date du prochain contrôle est requise'
            }), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT id FROM vehicules WHERE id = ?', (vehicule_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Véhicule introuvable'}), 404
        
        # Gestion de l'upload de photo
        photo_path = None
        if 'photo' in request.files:
            photo = request.files['photo']
            if photo and photo.filename != '' and allowed_file_vehicle(photo.filename):
                # Générer un nom unique
                filename = f"ct_{vehicule_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{photo.filename.rsplit('.', 1)[1].lower()}"
                photo_path = os.path.join(VEHICLE_UPLOAD_FOLDER, 'controle_technique', filename)
                
                # Sauvegarder le fichier
                os.makedirs(os.path.dirname(photo_path), exist_ok=True)
                photo.save(photo_path)
                
                # Chemin relatif pour la base de données
                photo_path = f"/static/uploads/vehicules/controle_technique/{filename}"
        
        # Mettre à jour en base
        if photo_path:
            cursor.execute('''
                UPDATE vehicules 
                SET ct_date_prochain_controle = ?, ct_photo = ?
                WHERE id = ?
            ''', (date_prochain_controle, photo_path, vehicule_id))
        else:
            cursor.execute('''
                UPDATE vehicules 
                SET ct_date_prochain_controle = ?
                WHERE id = ?
            ''', (date_prochain_controle, vehicule_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Contrôle technique mis à jour avec succès',
            'photo_url': photo_path
        }), 200
        
    except Exception as e:
        print(f"Erreur mise à jour contrôle technique: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la mise à jour'
        }), 500

@app.route('/api/vehicules/<int:vehicule_id>/documents', methods=['POST'])
def api_upload_vehicule_document(vehicule_id):
    """Upload de documents pour un véhicule (carte grise ou assurance)"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        if 'document' not in request.files:
            return jsonify({'success': False, 'message': 'Aucun fichier fourni'}), 400
        
        document = request.files['document']
        document_type = request.form.get('type')  # 'carte_grise' ou 'assurance'
        
        if document.filename == '':
            return jsonify({'success': False, 'message': 'Aucun fichier sélectionné'}), 400
        
        if document_type not in ['carte_grise', 'assurance']:
            return jsonify({'success': False, 'message': 'Type de document invalide'}), 400
        
        if not allowed_file_vehicle(document.filename):
            return jsonify({'success': False, 'message': 'Type de fichier non autorisé'}), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT id FROM vehicules WHERE id = ?', (vehicule_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Véhicule introuvable'}), 404
        
        # Générer un nom de fichier unique
        filename = f"{document_type}_{vehicule_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{document.filename.rsplit('.', 1)[1].lower()}"
        file_path = os.path.join(VEHICLE_UPLOAD_FOLDER, document_type, filename)
        
        # Sauvegarder le fichier
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        document.save(file_path)
        
        # Chemin relatif pour la base de données
        relative_path = f"/static/uploads/vehicules/{document_type}/{filename}"
        
        # Mettre à jour la base de données
        if document_type == 'carte_grise':
            cursor.execute('UPDATE vehicules SET carte_grise_fichier = ? WHERE id = ?', (relative_path, vehicule_id))
        elif document_type == 'assurance':
            cursor.execute('UPDATE vehicules SET assurance_fichier = ? WHERE id = ?', (relative_path, vehicule_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Document uploadé avec succès',
            'file_url': relative_path
        }), 200
        
    except Exception as e:
        print(f"Erreur upload document: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de l\'upload'
        }), 500

@app.route('/api/vehicules/complete', methods=['GET'])
def api_get_all_vehicules_complete():
    """Récupérer tous les véhicules avec toutes leurs informations pour le JavaScript"""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                id, nom, immatriculation, date_immatriculation, controle, 
                prochain_controle, fin_validite, numero_carte, disponible, 
                statut, notes, created_at,
                carte_grise_numero, carte_grise_date_emission, carte_grise_titulaire, carte_grise_fichier,
                assurance_compagnie, assurance_numero_contrat, assurance_date_debut, assurance_date_expiration,
                assurance_type_couverture, assurance_montant_prime, assurance_fichier,
                ct_date_prochain_controle, ct_photo
            FROM vehicules 
            ORDER BY nom
        ''')
        
        vehicules = cursor.fetchall()
        conn.close()
        
        vehicules_list = []
        for vehicule in vehicules:
            vehicule_data = {
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
                'created_at': vehicule[11],
                
                # Carte Grise
                'carteGrise': {
                    'numero': vehicule[12] or '',
                    'dateEmission': vehicule[13] or '',
                    'titulaire': vehicule[14] or '',
                    'fichier': vehicule[15] or None
                },
                
                # Assurance
                'assurance': {
                    'compagnie': vehicule[16] or '',
                    'numeroContrat': vehicule[17] or '',
                    'dateDebut': vehicule[18] or '',
                    'dateExpiration': vehicule[19] or '',
                    'typeCouverture': vehicule[20] or '',
                    'montantPrime': vehicule[21] or 0,
                    'fichier': vehicule[22] or None
                },
                
                # Contrôle Technique
                'controleTechnique': {
                    'dateProchainControle': vehicule[23] or '',
                    'photoUrl': vehicule[24] or None
                }
            }
            vehicules_list.append(vehicule_data)
        
        return jsonify({
            'success': True,
            'vehicules': vehicules_list
        }), 200
        
    except Exception as e:
        print(f"Erreur récupération véhicules complets: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des véhicules'
        }), 500

@app.route('/api/vehicules/<int:vehicule_id>/carte-grise', methods=['PUT'])
def api_update_vehicule_carte_grise(vehicule_id):
    """Mettre à jour les informations de carte grise d'un véhicule"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        data = request.get_json()
        
        # Validation des données
        required_fields = ['numero', 'dateEmission', 'titulaire']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT id FROM vehicules WHERE id = ?', (vehicule_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Véhicule introuvable'}), 404
        
        # Mettre à jour les informations de carte grise
        cursor.execute('''
            UPDATE vehicules 
            SET carte_grise_numero = ?,
                carte_grise_date_emission = ?,
                carte_grise_titulaire = ?
            WHERE id = ?
        ''', (
            data['numero'],
            data['dateEmission'],
            data['titulaire'],
            vehicule_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Carte grise mise à jour avec succès'
        }), 200
        
    except Exception as e:
        print(f"Erreur mise à jour carte grise: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la mise à jour'
        }), 500
# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

def allowed_file_vehicle(filename):
    """Vérifier si le type de fichier est autorisé pour les véhicules"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_VEHICLE_EXTENSIONS

@app.route('/api/documents/vehicules/<path:filename>')
def serve_vehicle_document(filename):
    """Servir les documents de véhicules de manière sécurisée"""
    try:
        # Sécurité : vérifier que le chemin ne contient pas de traversée
        if '..' in filename or filename.startswith('/'):
            return jsonify({'error': 'Chemin non autorisé'}), 403
        
        file_path = os.path.join(VEHICLE_UPLOAD_FOLDER, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Fichier introuvable'}), 404
        
        return send_file(file_path)
        
    except Exception as e:
        print(f"Erreur service document: {e}")
        return jsonify({'error': 'Erreur serveur'}), 500

# ============================================================================
# ROUTES API ADMINISTRATION
# ============================================================================

@app.route('/api/admin/dashboard/stats', methods=['GET'])
def api_admin_dashboard_stats():
    """Récupérer les statistiques du dashboard admin"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        # Vérifier que l'utilisateur est admin (vous pouvez ajouter cette vérification)
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Compter les véhicules par statut
        cursor.execute('SELECT COUNT(*) FROM vehicules WHERE statut = "actif"')
        total_vehicles = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM vehicules WHERE disponible = 1 AND statut = "actif"')
        available_vehicles = cursor.fetchone()[0]
        
        # Compter les utilisateurs actifs
        cursor.execute('SELECT COUNT(*) FROM users WHERE role = "client"')
        total_users = cursor.fetchone()[0]
        
        # Compter les alertes (contrôles techniques à renouveler dans les 30 jours)
        cursor.execute('''
            SELECT COUNT(*) FROM vehicules 
            WHERE ct_date_prochain_controle != "" 
            AND DATE(ct_date_prochain_controle) <= DATE('now', '+30 days')
            AND DATE(ct_date_prochain_controle) >= DATE('now')
        ''')
        alerts_count = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'totalVehicles': total_vehicles,
                'availableVehicles': available_vehicles,
                'totalUsers': total_users,
                'alertsCount': alerts_count
            }
        }), 200
        
    except Exception as e:
        print(f"Erreur stats dashboard: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des statistiques'
        }), 500

@app.route('/api/admin/vehicles', methods=['GET'])
def api_admin_get_vehicles():
    """Récupérer tous les véhicules pour l'admin"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                id, nom, immatriculation, date_immatriculation, 
                statut, disponible, numero_carte, controle, prochain_controle,
                carte_grise_numero, carte_grise_date_emission, carte_grise_titulaire,
                assurance_compagnie, assurance_date_expiration,
                ct_date_prochain_controle
            FROM vehicules 
            ORDER BY nom
        ''')
        
        vehicles = cursor.fetchall()
        conn.close()
        
        vehicles_list = []
        for vehicle in vehicles:
            vehicle_data = {
                'id': vehicle[0],
                'nom': vehicle[1],
                'immatriculation': vehicle[2],
                'dateImmatriculation': vehicle[3],
                'statut': vehicle[4] or 'actif',
                'disponible': bool(vehicle[5]),
                'numeroCarte': vehicle[6],
                'controle': vehicle[7],
                'prochainControle': vehicle[8],
                'carteGrise': {
                    'numero': vehicle[9],
                    'dateEmission': vehicle[10],
                    'titulaire': vehicle[11]
                },
                'assurance': {
                    'compagnie': vehicle[12],
                    'dateExpiration': vehicle[13]
                },
                'controleTechnique': {
                    'dateProchainControle': vehicle[14]
                }
            }
            vehicles_list.append(vehicle_data)
        
        return jsonify({
            'success': True,
            'vehicles': vehicles_list
        }), 200
        
    except Exception as e:
        print(f"Erreur récupération véhicules admin: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des véhicules'
        }), 500

@app.route('/api/admin/vehicles', methods=['POST'])
def api_admin_add_vehicle():
    """Ajouter un nouveau véhicule"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        data = request.get_json()
        
        # Validation des données
        required_fields = ['nom', 'immatriculation', 'dateImmatriculation']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que l'immatriculation n'existe pas déjà
        cursor.execute('SELECT id FROM vehicules WHERE immatriculation = ?', (data['immatriculation'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Cette immatriculation existe déjà'
            }), 400
        
        # Insérer le nouveau véhicule
        cursor.execute('''
            INSERT INTO vehicules (
                nom, immatriculation, date_immatriculation, statut, disponible,
                carte_grise_numero, carte_grise_date_emission, carte_grise_titulaire
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['nom'],
            data['immatriculation'],
            data['dateImmatriculation'],
            'actif',
            1,
            data.get('numeroCarteGrise', ''),
            data.get('dateEmission', data['dateImmatriculation']),
            data.get('titulaire', 'Fondation Perce-Neige')
        ))
        
        vehicle_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Véhicule ajouté avec succès',
            'vehicle_id': vehicle_id
        }), 201
        
    except Exception as e:
        print(f"Erreur ajout véhicule: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de l\'ajout du véhicule'
        }), 500

@app.route('/api/admin/vehicles/<int:vehicle_id>', methods=['PUT'])
def api_admin_update_vehicle(vehicle_id):
    """Modifier un véhicule"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        data = request.get_json()
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT id FROM vehicules WHERE id = ?', (vehicle_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Véhicule introuvable'}), 404
        
        # Mettre à jour le véhicule
        cursor.execute('''
            UPDATE vehicules 
            SET nom = ?, immatriculation = ?, date_immatriculation = ?,
                carte_grise_numero = ?, carte_grise_date_emission = ?, carte_grise_titulaire = ?
            WHERE id = ?
        ''', (
            data.get('nom'),
            data.get('immatriculation'),
            data.get('dateImmatriculation'),
            data.get('numeroCarteGrise', ''),
            data.get('dateEmission', ''),
            data.get('titulaire', 'Fondation Perce-Neige'),
            vehicle_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Véhicule mis à jour avec succès'
        }), 200
        
    except Exception as e:
        print(f"Erreur modification véhicule: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la modification'
        }), 500

@app.route('/api/admin/vehicles/<int:vehicle_id>', methods=['DELETE'])
def api_admin_delete_vehicle(vehicle_id):
    """Supprimer un véhicule"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT nom FROM vehicules WHERE id = ?', (vehicle_id,))
        vehicle = cursor.fetchone()
        if not vehicle:
            conn.close()
            return jsonify({'success': False, 'message': 'Véhicule introuvable'}), 404
        
        # Vérifier qu'il n'y a pas de missions actives
        cursor.execute('SELECT COUNT(*) FROM missions WHERE vehicule_id = ? AND statut = "active"', (vehicle_id,))
        active_missions = cursor.fetchone()[0]
        
        if active_missions > 0:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Impossible de supprimer un véhicule avec des missions actives'
            }), 400
        
        # Supprimer le véhicule
        cursor.execute('DELETE FROM vehicules WHERE id = ?', (vehicle_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Véhicule "{vehicle[0]}" supprimé avec succès'
        }), 200
        
    except Exception as e:
        print(f"Erreur suppression véhicule: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la suppression'
        }), 500

@app.route('/api/admin/users', methods=['GET'])
def api_admin_get_users():
    """Récupérer tous les utilisateurs pour l'admin"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                id, email, nom, prenom, telephone, role, created_at
            FROM users 
            WHERE role = "client"
            ORDER BY nom, prenom
        ''')
        
        users = cursor.fetchall()
        conn.close()
        
        users_list = []
        for user in users:
            user_data = {
                'id': user[0],
                'email': user[1],
                'nom': user[2],
                'prenom': user[3],
                'telephone': user[4],
                'role': user[5],
                'statut': 'actif',  # Vous pouvez ajouter un champ statut à votre table users
                'created_at': user[6]
            }
            users_list.append(user_data)
        
        return jsonify({
            'success': True,
            'users': users_list
        }), 200
        
    except Exception as e:
        print(f"Erreur récupération utilisateurs admin: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des utilisateurs'
        }), 500

@app.route('/api/admin/users', methods=['POST'])
def api_admin_add_user():
    """Ajouter un nouveau conducteur"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        data = request.get_json()
        
        # Validation des données
        required_fields = ['prenom', 'nom', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400
        
        # Validation de l'email
        if not '@' in data['email']:
            return jsonify({
                'success': False,
                'message': 'Format d\'email invalide'
            }), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que l'email n'existe pas déjà
        cursor.execute('SELECT id FROM users WHERE email = ?', (data['email'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Cette adresse email existe déjà'
            }), 400
        
        # Générer un mot de passe temporaire
        import secrets
        import string
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        password_hash = generate_password_hash(temp_password)
        
        # Insérer le nouvel utilisateur
        cursor.execute('''
            INSERT INTO users (email, password_hash, nom, prenom, telephone, role)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['email'],
            password_hash,
            data['nom'],
            data['prenom'],
            data.get('telephone', ''),
            'client'
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # TODO: Envoyer un email avec le mot de passe temporaire
        # send_welcome_email(data['email'], temp_password)
        
        return jsonify({
            'success': True,
            'message': 'Conducteur ajouté avec succès',
            'user_id': user_id,
            'temp_password': temp_password  # À supprimer en production
        }), 201
        
    except Exception as e:
        print(f"Erreur ajout utilisateur: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de l\'ajout du conducteur'
        }), 500

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
def api_admin_update_user(user_id):
    """Modifier un utilisateur"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        data = request.get_json()
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que l'utilisateur existe
        cursor.execute('SELECT id FROM users WHERE id = ? AND role = "client"', (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Utilisateur introuvable'}), 404
        
        # Mettre à jour l'utilisateur
        cursor.execute('''
            UPDATE users 
            SET nom = ?, prenom = ?, email = ?, telephone = ?
            WHERE id = ?
        ''', (
            data.get('nom'),
            data.get('prenom'),
            data.get('email'),
            data.get('telephone', ''),
            user_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Conducteur mis à jour avec succès'
        }), 200
        
    except Exception as e:
        print(f"Erreur modification utilisateur: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la modification'
        }), 500

@app.route('/api/admin/users/<int:user_id>/suspend', methods=['PUT'])
def api_admin_suspend_user(user_id):
    """Suspendre un utilisateur"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que l'utilisateur existe
        cursor.execute('SELECT nom, prenom FROM users WHERE id = ? AND role = "client"', (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({'success': False, 'message': 'Utilisateur introuvable'}), 404
        
        # TODO: Ajouter un champ statut à la table users et l'utiliser ici
        # Pour l'instant, on peut utiliser un commentaire dans le champ notes ou créer une table séparée
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Utilisateur {user[0]} {user[1]} suspendu'
        }), 200
        
    except Exception as e:
        print(f"Erreur suspension utilisateur: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la suspension'
        }), 500

@app.route('/api/admin/users/<int:user_id>/activate', methods=['PUT'])
def api_admin_activate_user(user_id):
    """Réactiver un utilisateur"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que l'utilisateur existe
        cursor.execute('SELECT nom, prenom FROM users WHERE id = ? AND role = "client"', (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({'success': False, 'message': 'Utilisateur introuvable'}), 404
        
        # TODO: Réactiver l'utilisateur
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Utilisateur {user[0]} {user[1]} réactivé'
        }), 200
        
    except Exception as e:
        print(f"Erreur réactivation utilisateur: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la réactivation'
        }), 500


# ============================================================================
# ROUTES API Maintenance ADMINISTRATION
# ============================================================================

@app.route('/api/admin/vehicles/<int:vehicle_id>/maintenance', methods=['PUT'])
def api_admin_vehicle_maintenance(vehicle_id):
    """Changer le statut de maintenance d'un véhicule"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        data = request.get_json()
        action = data.get('action')  # 'start' ou 'end'
        new_status = data.get('statut')  # 'maintenance' ou 'actif'
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT nom, statut FROM vehicules WHERE id = ?', (vehicle_id,))
        vehicle = cursor.fetchone()
        if not vehicle:
            conn.close()
            return jsonify({'success': False, 'message': 'Véhicule introuvable'}), 404
        
        vehicle_name, current_status = vehicle
        
        if action == 'start':
            # Passer le véhicule en maintenance
            cursor.execute('UPDATE vehicules SET statut = ? WHERE id = ?', ('maintenance', vehicle_id))
            
            # Créer un enregistrement de maintenance
            cursor.execute('''
                INSERT INTO maintenances (
                    vehicule_id, type_maintenance, statut, date_debut, 
                    commentaires, created_by
                ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                vehicle_id,
                data.get('type_maintenance', 'maintenance_programmee'),
                'en_cours',
                data.get('date_debut'),
                data.get('commentaires', ''),
                session['user_id']
            ))
            
            message = f'Véhicule {vehicle_name} mis en maintenance'
            
        elif action == 'end':
            # Remettre le véhicule en service
            cursor.execute('UPDATE vehicules SET statut = ? WHERE id = ?', ('actif', vehicle_id))
            
            # Terminer la maintenance en cours
            cursor.execute('''
                UPDATE maintenances 
                SET statut = 'terminee', date_fin = ? 
                WHERE vehicule_id = ? AND statut = 'en_cours'
            ''', (data.get('date_fin'), vehicle_id))
            
            message = f'Maintenance de {vehicle_name} terminée'
        
        else:
            conn.close()
            return jsonify({'success': False, 'message': 'Action invalide'}), 400
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': message
        }), 200
        
    except Exception as e:
        print(f"Erreur gestion maintenance véhicule: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la gestion de la maintenance'
        }), 500

@app.route('/api/admin/maintenances', methods=['GET'])
def api_admin_get_maintenances():
    """Récupérer toutes les maintenances"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Récupérer les maintenances avec les infos véhicules
        cursor.execute('''
            SELECT 
                m.id, m.vehicule_id, m.type_maintenance, m.statut, m.priorite,
                m.date_debut, m.date_fin, m.garage, m.commentaires, m.cout,
                m.created_at,
                v.nom as vehicule_nom, v.immatriculation as vehicule_immatriculation
            FROM maintenances m
            JOIN vehicules v ON m.vehicule_id = v.id
            ORDER BY m.date_debut DESC, m.created_at DESC
        ''')
        
        maintenances = cursor.fetchall()
        
        # Calculer les statistiques
        cursor.execute('''
            SELECT 
                COUNT(CASE WHEN m.statut = 'en_cours' THEN 1 END) as en_cours,
                COUNT(CASE WHEN m.type_maintenance = 'controle_technique' 
                      AND m.statut = 'planifiee' 
                      AND DATE(m.date_debut) <= DATE('now', '+30 days') THEN 1 END) as controles_techniques,
                COUNT(CASE WHEN v.assurance_date_expiration != '' 
                      AND DATE(v.assurance_date_expiration) <= DATE('now', '+30 days') THEN 1 END) as assurances_expirees
            FROM maintenances m
            JOIN vehicules v ON m.vehicule_id = v.id
        ''')
        stats_row = cursor.fetchone()
        
        conn.close()
        
        maintenances_list = []
        for maintenance in maintenances:
            maintenance_data = {
                'id': maintenance[0],
                'vehicule_id': maintenance[1],
                'type_maintenance': maintenance[2],
                'statut': maintenance[3],
                'priorite': maintenance[4],
                'date_debut': maintenance[5],
                'date_fin': maintenance[6],
                'garage': maintenance[7],
                'commentaires': maintenance[8],
                'cout': maintenance[9],
                'created_at': maintenance[10],
                'vehicule_nom': maintenance[11],
                'vehicule_immatriculation': maintenance[12]
            }
            maintenances_list.append(maintenance_data)
        
        stats = {
            'en_cours': stats_row[0] if stats_row else 0,
            'controles_techniques': stats_row[1] if stats_row else 0,
            'assurances_expirees': stats_row[2] if stats_row else 0
        }
        
        return jsonify({
            'success': True,
            'maintenances': maintenances_list,
            'stats': stats
        }), 200
        
    except Exception as e:
        print(f"Erreur récupération maintenances: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des maintenances'
        }), 500

@app.route('/api/admin/maintenances', methods=['POST'])
def api_admin_add_maintenance():
    """Programmer une nouvelle maintenance"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        data = request.get_json()
        
        # Validation des données
        required_fields = ['vehicule_id', 'type_maintenance', 'date_debut']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Le champ {field} est requis'
                }), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que le véhicule existe
        cursor.execute('SELECT nom, statut FROM vehicules WHERE id = ?', (data['vehicule_id'],))
        vehicle = cursor.fetchone()
        if not vehicle:
            conn.close()
            return jsonify({'success': False, 'message': 'Véhicule introuvable'}), 404
        
        vehicle_name, vehicle_status = vehicle
        
        # Déterminer le statut initial de la maintenance
        maintenance_status = 'planifiee'
        if data.get('bloquer_immediatement'):
            maintenance_status = 'en_cours'
            # Mettre le véhicule en maintenance immédiatement
            cursor.execute('UPDATE vehicules SET statut = ? WHERE id = ?', ('maintenance', data['vehicule_id']))
        
        # Insérer la maintenance
        cursor.execute('''
            INSERT INTO maintenances (
                vehicule_id, type_maintenance, statut, priorite, date_debut, 
                date_fin, garage, commentaires, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['vehicule_id'],
            data['type_maintenance'],
            maintenance_status,
            data.get('priorite', 'normale'),
            data['date_debut'],
            data.get('date_fin'),
            data.get('garage'),
            data.get('commentaires'),
            session['user_id']
        ))
        
        maintenance_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        action_msg = "et véhicule bloqué" if data.get('bloquer_immediatement') else ""
        
        return jsonify({
            'success': True,
            'message': f'Maintenance programmée avec succès pour {vehicle_name} {action_msg}',
            'maintenance_id': maintenance_id
        }), 201
        
    except Exception as e:
        print(f"Erreur programmation maintenance: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la programmation de la maintenance'
        }), 500

@app.route('/api/admin/maintenances/<int:maintenance_id>/start', methods=['PUT'])
def api_admin_start_maintenance(maintenance_id):
    """Démarrer une maintenance planifiée"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que la maintenance existe et est planifiée
        cursor.execute('''
            SELECT m.vehicule_id, m.statut, v.nom
            FROM maintenances m
            JOIN vehicules v ON m.vehicule_id = v.id
            WHERE m.id = ? AND m.statut = 'planifiee'
        ''', (maintenance_id,))
        
        maintenance = cursor.fetchone()
        if not maintenance:
            conn.close()
            return jsonify({
                'success': False, 
                'message': 'Maintenance introuvable ou déjà démarrée'
            }), 404
        
        vehicule_id, status, vehicle_name = maintenance
        
        # Démarrer la maintenance
        from datetime import datetime
        cursor.execute('''
            UPDATE maintenances 
            SET statut = 'en_cours', date_debut = ?
            WHERE id = ?
        ''', (datetime.now().isoformat(), maintenance_id))
        
        # Mettre le véhicule en maintenance
        cursor.execute('UPDATE vehicules SET statut = ? WHERE id = ?', ('maintenance', vehicule_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Maintenance de {vehicle_name} démarrée'
        }), 200
        
    except Exception as e:
        print(f"Erreur démarrage maintenance: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors du démarrage de la maintenance'
        }), 500

@app.route('/api/admin/maintenances/<int:maintenance_id>/complete', methods=['PUT'])
def api_admin_complete_maintenance(maintenance_id):
    """Terminer une maintenance en cours"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que la maintenance existe et est en cours
        cursor.execute('''
            SELECT m.vehicule_id, m.statut, v.nom
            FROM maintenances m
            JOIN vehicules v ON m.vehicule_id = v.id
            WHERE m.id = ? AND m.statut = 'en_cours'
        ''', (maintenance_id,))
        
        maintenance = cursor.fetchone()
        if not maintenance:
            conn.close()
            return jsonify({
                'success': False, 
                'message': 'Maintenance introuvable ou pas en cours'
            }), 404
        
        vehicule_id, status, vehicle_name = maintenance
        
        # Terminer la maintenance
        from datetime import datetime
        cursor.execute('''
            UPDATE maintenances 
            SET statut = 'terminee', date_fin = ?
            WHERE id = ?
        ''', (datetime.now().isoformat(), maintenance_id))
        
        # Remettre le véhicule en service
        cursor.execute('UPDATE vehicules SET statut = ? WHERE id = ?', ('actif', vehicule_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Maintenance de {vehicle_name} terminée'
        }), 200
        
    except Exception as e:
        print(f"Erreur finalisation maintenance: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la finalisation de la maintenance'
        }), 500

@app.route('/api/admin/maintenances/<int:maintenance_id>', methods=['DELETE'])
def api_admin_delete_maintenance(maintenance_id):
    """Supprimer une maintenance"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Vérifier que la maintenance existe et n'est pas en cours
        cursor.execute('''
            SELECT m.vehicule_id, m.statut, v.nom
            FROM maintenances m
            JOIN vehicules v ON m.vehicule_id = v.id
            WHERE m.id = ?
        ''', (maintenance_id,))
        
        maintenance = cursor.fetchone()
        if not maintenance:
            conn.close()
            return jsonify({'success': False, 'message': 'Maintenance introuvable'}), 404
        
        vehicule_id, status, vehicle_name = maintenance
        
        if status == 'en_cours':
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Impossible de supprimer une maintenance en cours'
            }), 400
        
        # Supprimer la maintenance
        cursor.execute('DELETE FROM maintenances WHERE id = ?', (maintenance_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Maintenance supprimée avec succès'
        }), 200
        
    except Exception as e:
        print(f"Erreur suppression maintenance: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la suppression'
        }), 500

# Mise à jour de la route des alertes pour inclure les maintenances
@app.route('/api/admin/alerts', methods=['GET'])
def api_admin_get_alerts():
    """Récupérer les alertes pour le dashboard admin"""
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Non authentifié'}), 401
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        alerts = []
        
        # Alertes contrôles techniques
        cursor.execute('''
            SELECT nom, immatriculation, ct_date_prochain_controle
            FROM vehicules 
            WHERE ct_date_prochain_controle != "" 
            AND DATE(ct_date_prochain_controle) <= DATE('now', '+30 days')
            AND DATE(ct_date_prochain_controle) >= DATE('now')
            ORDER BY DATE(ct_date_prochain_controle)
        ''')
        
        ct_alerts = cursor.fetchall()
        for vehicle in ct_alerts:
            urgency = 'urgent' if cursor.execute(
                'SELECT DATE(?) <= DATE("now", "+7 days")', 
                (vehicle[2],)
            ).fetchone()[0] else 'warning'
            
            alerts.append({
                'type': urgency,
                'title': 'Contrôle technique à renouveler',
                'description': f'{vehicle[0]} ({vehicle[1]}) - Échéance : {vehicle[2]}',
                'vehicle_plate': vehicle[1]
            })
        
        # Alertes maintenances urgentes
        cursor.execute('''
            SELECT v.nom, v.immatriculation, m.type_maintenance, m.date_debut
            FROM maintenances m
            JOIN vehicules v ON m.vehicule_id = v.id
            WHERE m.statut = 'planifiee' 
            AND m.priorite = 'urgente'
            AND DATE(m.date_debut) <= DATE('now', '+7 days')
            ORDER BY DATE(m.date_debut)
        ''')
        
        maintenance_alerts = cursor.fetchall()
        for maintenance in maintenance_alerts:
            alerts.append({
                'type': 'urgent',
                'title': 'Maintenance urgente programmée',
                'description': f'{maintenance[0]} ({maintenance[1]}) - {maintenance[2]} le {maintenance[3]}',
                'vehicle_plate': maintenance[1]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'alerts': alerts
        }), 200
        
    except Exception as e:
        print(f"Erreur récupération alertes: {e}")
        return jsonify({
            'success': False,
            'message': 'Erreur lors de la récupération des alertes'
        }), 500

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
    
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)