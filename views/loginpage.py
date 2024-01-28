import os
import sys
from flask import request, jsonify, session, render_template, redirect, url_for
import sqlite3

sys.path.append('../../')

from app import DB_FILE, app

# @app.route('/')
def index():
    return render_template('index.html')

# @app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    session['role'] = data.get('role')

    connection = sqlite3.connect(DB_FILE)
    cursor = connection.cursor()

    if session['role'] == 'user':
        user = cursor.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

        if user is None:
            return jsonify({'success': False, 'message': 'Неверный логин или пароль'})
        if user[1] == password:
            session['username'] = user[0]
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Неверный логин или пароль'})
    if session['role'] == 'admin':
        user = cursor.execute("SELECT * FROM admins WHERE username = ?", (username,)).fetchone()
        if user is None:
            return jsonify({'success': False, 'message': 'Неверный логин или пароль'})
        if user[1] == password:
            session['username'] = user[0]
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Неверный логин или пароль'})

    connection.commit()
    cursor.close()
    connection.close()


# @app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data['username']
        password = data['password']
        session['role'] = data['role']

        connection = sqlite3.connect(DB_FILE)
        cursor = connection.cursor()

        if session['role'] == 'user':
            if username not in [i[0] for i in cursor.execute("SELECT username FROM users").fetchall()]:
                cursor.execute("INSERT INTO users (username, password, prizes) VALUES (?, ?, ?)", (username, password, None))
            else:
                return jsonify({'success': False, 'message': 'Пользователь уже существует'})

        else:
            if username not in [i[0] for i in cursor.execute("SELECT username FROM admins").fetchall()]:
                cursor.execute("INSERT INTO admins (username, password) VALUES (?, ?)", (username, password))
            else:
                return jsonify({'success': False, 'message': 'Пользователь уже существует'})
        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
