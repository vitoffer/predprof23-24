from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os

app = Flask(__name__)
app.secret_key = '12345678'

admins = [
    {'id': 1, 'username': 'admin', 'password': generate_password_hash('admin_password')}
]

users = [
    {'id': 2, 'username': 'user', 'password': generate_password_hash('user_password')}
]


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    connection = sqlite3.connect('./data/data.db')
    cursor = connection.cursor()

    connection.commit()
    cursor.close()
    connection.close()

    if session.get('role') == 'admin':
        user = next((user for user in admins if user['username'] == username), None)
    else:
        user = next((user for user in users if user['username'] == username), None)

    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'})


@app.route('/register', methods=['POST'])
def register():
    try:
        username = request.form['newUsername']
        password = request.form['newPassword']

        if ((session.get('role') == 'admin' and any(user['username'] == username for user in admins)) or
                (session.get('role') == 'user' and any(user['username'] == username for user in users))):
            return jsonify({'success': False, 'message': 'Username already exists'})

        new_user = {
            'id': len(users if session.get('role') == 'user' else admins) + 1,
            'username': username,
            'password': generate_password_hash(password)
        }

        if session.get('role') == 'user':
            users.append(new_user)
        else:
            admins.append(new_user)
        session['user_id'] = new_user['id']

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('home'))


if __name__ == '__main__':
    app.run(debug=True)

    if not os.path.isfile('./data/data.db'):
        os.mkdir('./data')
        os.path.join('./data', 'data.db')
        sqlite_connection = sqlite3.connect('./data/data.db')
        cur = sqlite_connection.cursor()
        cur.execute('''
        CREATE TABLE admins (
        id       INTEGER,
        username TEXT,
        password TEXT
        );''')
        cur.execute('''
        CREATE TABLE users (
        id       INTEGER,
        username TEXT,
        password TEXT
        );''')
        sqlite_connection.commit()
        cur.close()
        sqlite_connection.close()
