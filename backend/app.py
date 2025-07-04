from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/inscription')
def inscription():
    return render_template('inscription.html')


@app.route('/connexion')
def connexion():
    return render_template('connexion.html')

if __name__ == '__main__':
    app.run(debug=True)
