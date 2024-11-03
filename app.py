# app.py
from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///game.db'
db = SQLAlchemy(app)

# Define a player model to save progress
class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    money = db.Column(db.Integer, default=0)

@app.route('/click', methods=['POST'])
def click():
    player = Player.query.first()  # For single-player, get the first player
    player.money += 1
    db.session.commit()
    return jsonify(money=player.money)

@app.route("/")
def main():
    return render_template("main.html")

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
