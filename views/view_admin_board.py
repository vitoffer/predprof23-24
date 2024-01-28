import os
import sys
from flask import request, jsonify, session, render_template, redirect, url_for
import sqlite3

sys.path.append('../../')

from app import DB_FILE, app

# @app.route('/api/board_admin', methods=['GET'])
def admin_board():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        board_id = session['board_id']
        board = cursor.execute('SELECT * FROM boards WHERE id = ?', (board_id,)).fetchone()
        board_name = board[1]
        board_size = board[2]
        users = list(filter(lambda user: ',' + str(user[0]) + ',' in ',' + board[3] + ',' if board[3] is not None else False, cursor.execute('SELECT * FROM users').fetchall()))
        remain_shots = cursor.execute('SELECT * FROM remain_shots WHERE board_id = ?', (board_id,)).fetchall()

        prizes = cursor.execute('SELECT * FROM prizes WHERE board_id = ?', (board_id,)).fetchall()
        prizes_ship_ids = list(map(lambda x: x[0], prizes))

        ships = list(filter(lambda ship: ship[0] in prizes_ship_ids, cursor.execute('SELECT * FROM ships').fetchall()))
        shots = cursor.execute('SELECT * FROM shots WHERE board_id = ?', (board_id,)).fetchall()
        return jsonify({'id': board_id, 'name': board_name, 'size': board_size, 'users': users, 'remain_shots': remain_shots, 'prizes': prizes, 'ships': ships, 'shots': shots})

# @app.route('/api/get_user_boards', methods=['GET'])
def get_user_boards():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        boards = cursor.execute('SELECT * FROM boards').fetchall()
        boards = list(filter(lambda board: board[3] is not None and ',' + str(session['username']) + ',' in ',' + board[3] + ',', boards))
        return jsonify(boards)


# @app.route('/api/add_user_on_board', methods=['POST'])
def add_user_on_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()

        board_id = data['boardId']
        username = data['userName']
        shots = data['shots']
        prev_board_users = cursor.execute('SELECT users FROM boards WHERE id = ?', (board_id,)).fetchone()[0]
        if prev_board_users is None:
            cursor.execute('UPDATE boards SET users = ? WHERE id = ?', (username, board_id))
        else:
            cursor.execute('UPDATE boards SET users = ? WHERE id = ?', (prev_board_users + ',' + username, board_id))
        cursor.execute('INSERT INTO remain_shots (username, board_id, remaining_shots) VALUES (?, ?, ?)', (username, board_id, shots))
        return jsonify({'success': True})

# @app.route('/api/change_user_shots', methods=['POST'])
def change_user_shots():
    data = request.get_json()

    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        board_id = data['boardId']
        username = data['userName']
        shots = data['shots']
        prevShots = cursor.execute('SELECT remaining_shots FROM remain_shots WHERE username = ? AND board_id = ?', (username, board_id)).fetchone()[0]
        cursor.execute('UPDATE remain_shots SET remaining_shots = ? WHERE username = ? AND board_id = ?', (str(int(prevShots) + int(shots)), username, board_id))
        return jsonify({'success': True})

# @app.route('/api/del_user_from_board', methods=['POST'])
def del_user_from_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        board_id = data['boardId']
        username = data['userName']
        prev_board_users = ',' + cursor.execute('SELECT users FROM boards WHERE id = ?', (board_id,)).fetchone()[0] + ','

        new_board_users = prev_board_users.replace(',' + username + ',', ',')[1:-1]
        if len(new_board_users) == 0:
            new_board_users = None
        elif new_board_users[0] == ',':
            new_board_users = new_board_users[1:]
        elif new_board_users[-1] == ',':
            new_board_users = new_board_users[:-1]
        cursor.execute('UPDATE boards SET users = ? WHERE id = ?', (new_board_users, board_id))
        cursor.execute('DELETE FROM remain_shots WHERE username = ? AND board_id = ?', (username, board_id))
        cursor.execute('DELETE FROM shots WHERE username = ? AND board_id = ?', (username, board_id))
        prev_user_prizes = cursor.execute('SELECT prizes FROM users WHERE username = ?', (username,)).fetchone()[0]
        if prev_user_prizes is not None:
            prev_user_prizes = prev_user_prizes.split(',')
            prizes_on_board = list(map(lambda x: str(x[0]), cursor.execute('SELECT id FROM prizes WHERE board_id = ?', (board_id,)).fetchall()))
            prizes = list(filter(lambda x: x not in prizes_on_board, prev_user_prizes))
            if len(prizes) == 0:
                cursor.execute('UPDATE users SET prizes = ? WHERE username = ?', (None, username))
            else:
                cursor.execute('UPDATE users SET prizes = ? WHERE username = ?', (','.join(prizes), username))
        return jsonify({'success': True})


# @app.route('/api/add_prize_on_board', methods=['POST', 'GET'])
def add_prize_on_board():
    data = request.form
    file = request.files['file']
    filename = file.filename

    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        prev_prize_id = cursor.execute('SELECT MAX(id) FROM prizes').fetchone()[0]
        if prev_prize_id is None:
            new_id = 0
        else:
            new_id = prev_prize_id + 1
        cursor.execute('INSERT INTO prizes (id, name, descr, img, board_id) VALUES (?, ?, ?, ?, ?)', (new_id, data['newPrizeName'], data['newPrizeDesc'], filename, data['boardId']))
        cursor.execute('INSERT INTO ships (prize_id, coords, was_shot) VALUES (?, ?, ?)', (new_id, None, 0))
        return jsonify({'success': True, 'id': new_id})

# @app.route('/api/del_prize_from_board', methods=['POST'])
def del_prize_from_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('DELETE FROM prizes WHERE id = ?', (data['prizeId'],))
        cursor.execute('DELETE FROM ships WHERE prize_id = ?', (data['prizeId'],))
        users = cursor.execute('SELECT * FROM users').fetchall()
        for user in users:
            if user[2] is not None:
                prizes_ids = cursor.execute('SELECT prizes FROM users WHERE username = ?', (user[0],)).fetchone()[0]
                prizes_ids = list(filter(lambda x: str(x) != str(data['prizeId']), prizes_ids.split(',')))
                if len(prizes_ids) == 0:
                    cursor.execute('UPDATE users SET prizes = ? WHERE username = ?', (None, user[0]))
                else:
                    cursor.execute('UPDATE users SET prizes = ? WHERE username = ?', (','.join(prizes_ids), user[0]))
        return jsonify({'success': True})

# @app.route('/api/set_ship_on_board', methods=['POST'])
def set_ship_on_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('UPDATE ships SET coords = ? WHERE prize_id = ?', (data['coords'], data['prizeId']))
        return jsonify({'success': True})
