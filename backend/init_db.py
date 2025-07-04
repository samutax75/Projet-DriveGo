import sqlite3

# Connexion à la base (elle sera créée si elle n'existe pas)
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Création de la table utilisateurs
cursor.execute('''
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)
''')

conn.commit()
conn.close()

print("✅ Base de données et table 'utilisateurs' créées avec succès.")
