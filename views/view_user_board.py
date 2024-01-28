import os
import sys
from flask import request, jsonify, session, render_template, redirect, url_for
import sqlite3

sys.path.append('../../')

from app import DB_FILE, app


# @app.route('/board/<board_id>')
def board(board_id):
    if 'username' in session and 'role' in session:
        role = session['role']
        session['board_id'] = board_id
        with sqlite3.connect(DB_FILE) as connect:
            cursor = connect.cursor()
            board_name = cursor.execute('SELECT name FROM boards WHERE id = ?', (board_id,)).fetchone()[0]
        if role == 'admin':
            return render_template('board_admin.html', name=board_name)
        elif role == 'user':
            return render_template('board_user.html', name=board_name)
    else:
        return redirect(url_for('index'))

# @app.route('/api/board_user', methods=['GET'])
def board_user():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        board_id = session['board_id']
        username = session['username']
        board = cursor.execute('SELECT * FROM boards WHERE id = ?', (board_id,)).fetchone()
        board_size = board[2]
        remain_shots = cursor.execute('SELECT * FROM remain_shots WHERE board_id = ? AND username = ?', (board_id, session['username'])).fetchone()[2]

        prizes_ids = cursor.execute('SELECT prizes FROM users WHERE username = ?', (session['username'],)).fetchone()[0]
        if prizes_ids is not None:
            prizes_ids = prizes_ids.split(',')
            prizes_ids = cursor.execute('SELECT id FROM prizes WHERE id IN (' + ', '.join(prizes_ids) + ') AND board_id = ?', (board_id,)).fetchall()
            prizes_ids = [str(prize_id[0]) for prize_id in prizes_ids]
            prizes = cursor.execute('SELECT * FROM prizes WHERE id IN (' + ', '.join(prizes_ids) + ')').fetchall()
            ships = cursor.execute('SELECT * FROM ships WHERE prize_id IN (' + ', '.join(prizes_ids) + ')').fetchall()

        else:
            ships = []
            prizes = []


        shots = cursor.execute('SELECT * FROM shots WHERE board_id = ?', (board_id)).fetchall()

        return jsonify({'username': username, 'id': board_id, 'size': board_size, 'remain_shots': remain_shots, 'prizes': prizes, 'shots': shots, 'ships': ships})


# @app.route('/api/shoot', methods=['POST', 'GET'])
def shoot():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        prev_shot_id = cursor.execute('SELECT MAX(id) FROM shots').fetchone()[0]
        if prev_shot_id is None:
            shot_id = 0
        else:
            shot_id = prev_shot_id + 1
        cursor.execute('INSERT INTO shots (id, board_id, username, coords) VALUES (?, ?, ?, ?)', (shot_id, session['board_id'], session['username'], data['coords']))
        prev_remain_shots = cursor.execute('SELECT remaining_shots FROM remain_shots WHERE board_id = ? AND username = ?', (session['board_id'], session['username'])).fetchone()[0]
        remain_shots = int(prev_remain_shots) - 1
        cursor.execute('UPDATE remain_shots SET remaining_shots = ? WHERE board_id = ? AND username = ?', (str(remain_shots), session['board_id'], session['username']))
        prizes_ids = cursor.execute('SELECT id FROM prizes WHERE board_id = ?', (session['board_id'],)).fetchall()
        prizes_ids = list(map(lambda prize_id: str(prize_id[0]), prizes_ids))
        ships = cursor.execute('SELECT * FROM ships WHERE prize_id IN (' + ', '.join(prizes_ids) + ')').fetchall()
        prize_id = None
        prize = None
        for ship in ships:
            if ship[1] == data['coords']:
                cursor.execute('UPDATE ships SET was_shot = ? WHERE prize_id = ?', (1, ship[0]))
                prize_id = ship[0]
                break

        if prize_id is not None:
            prev_user_prizes = cursor.execute('SELECT prizes FROM users WHERE username = ?', (session['username'],)).fetchone()[0]
            if prev_user_prizes is None:
                cursor.execute('UPDATE users SET prizes = ? WHERE username = ?', (str(prize_id), session['username']))
            else:
                cursor.execute('UPDATE users SET prizes = ? WHERE username = ?', (prev_user_prizes + ',' + str(prize_id), session['username']))
            prize = cursor.execute('SELECT * FROM prizes WHERE id = ?', (prize_id,)).fetchone()
        return jsonify({'status': 'success', 'prize': prize, 'shot_id': shot_id})
