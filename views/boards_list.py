import os
import sys
from flask import request, jsonify, session, render_template, redirect, url_for
import sqlite3

sys.path.append('../../')

from app import DB_FILE, app



# @app.route('/boards')
def boards():
    if 'username' in session:
        role = session['role']
        if role == 'admin':
            return render_template('boards_admin.html')
        elif role == 'user':
            return render_template('boards_user.html')
        else:
            return redirect(url_for('index'))
    else:
        return redirect(url_for('index'))


# @app.route('/api/get_admin_boards', methods=['GET'])
def get_admin_boards():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        boards = cursor.execute('SELECT * FROM boards').fetchall()
        return jsonify(boards)

# @app.route('/api/create_board', methods=['POST'])
def create_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('''INSERT INTO boards (id, name, size, users) VALUES (?, ?, ?, ?)''', (data['id'], data['name'], data['size'], None))
        return jsonify({'success': True})


# @app.route('/api/del_board', methods=['POST'])
def del_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('''DELETE FROM boards WHERE id = ?''', data['id'])
        cursor.execute('''DELETE FROM remain_shots WHERE board_id = ?''', data['id'])
        prizes_ids = cursor.execute('''SELECT id FROM prizes WHERE board_id = ?''', data['id']).fetchall()
        for prize_id in prizes_ids:
            cursor.execute('''DELETE FROM ships WHERE prize_id = ?''', (prize_id[0],))
        cursor.execute('''DELETE FROM prizes WHERE board_id = ?''', data['id'])
        cursor.execute('''DELETE FROM shots WHERE board_id = ?''', data['id'])
        return jsonify({'success': True})
