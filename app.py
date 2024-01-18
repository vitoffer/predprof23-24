from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = '92347_а114!'
DB_FILE = 'data.db'
UPLOAD_FOLDER = 'static/prizes'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/')
def index():
    create_table()
    return render_template('index.html')


@app.route('/api/login', methods=['POST'])
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
            return jsonify({'success': False, 'message': 'Invalid credentials'})
        if user[1] == password:
            session['username'] = user[0]
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
    if session['role'] == 'admin':
        user = cursor.execute("SELECT * FROM admins WHERE username = ?", (username,)).fetchone()
        if user is None:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
        if user[1] == password:
            session['username'] = user[0]
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})

    connection.commit()
    cursor.close()
    connection.close()


@app.route('/api/register', methods=['POST'])
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
                return jsonify({'success': False, 'message': 'User already exists'})

        else:
            if username not in [i[0] for i in cursor.execute("SELECT username FROM admins").fetchall()]:
                cursor.execute("INSERT INTO admins (username, password) VALUES (?, ?)", (username, password))
            else:
                return jsonify({'success': False, 'message': 'User already exists'})
        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# @app.route('/logout')
# def logout():
#     session.pop('user_id', None)
#     return redirect(url_for('home'))


@app.route('/boards')
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


@app.route('/api/get_admin_boards', methods=['GET'])
def get_admin_boards():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        boards = cursor.execute('SELECT * FROM boards').fetchall()
        return jsonify(boards)

@app.route('/api/create_board', methods=['POST'])
def create_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('''INSERT INTO boards (id, name, size, users) VALUES (?, ?, ?, ?)''', (data['id'], data['name'], data['size'], None))
        return jsonify({'success': True})


@app.route('/api/del_board', methods=['POST'])
def del_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('''DELETE FROM boards WHERE id=?''', data['id'])
        return jsonify({'success': True})


@app.route('/board/<board_id>')
def board(board_id):
    if 'username' in session and 'role' in session:
        role = session['role']
        session['board_id'] = board_id
        if role == 'admin':
            return render_template('board_admin.html', title=board_id)
        elif role == 'user':
            return render_template('board_user.html', title=board_id)
    else:
        return redirect(url_for('index'))


@app.route('/api/board_admin', methods=['GET'])
def admin_board():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        board_id = session['board_id']
        board = cursor.execute('SELECT * FROM boards WHERE id = ?', (board_id,)).fetchone()
        board_name = board[1]
        board_size = board[2]
        users = list(filter(lambda user: ',' + str(user[0]) + ',' in ',' + board[3] + ',' if board[3] is not None else False, cursor.execute('SELECT * FROM users').fetchall()))
        shots = cursor.execute('SELECT * FROM shots WHERE board_id = ?', (board_id,)).fetchall()

        prizes = cursor.execute('SELECT * FROM prizes WHERE board_id = ?', (board_id,)).fetchall()
        prizes_ship_ids = list(map(lambda x: x[0], prizes))

        ships = list(filter(lambda ship: ship[0] in prizes_ship_ids, cursor.execute('SELECT * FROM ships').fetchall()))

        return jsonify({'id': board_id, 'name': board_name, 'size': board_size, 'users': users, 'shots': shots, 'prizes': prizes, 'ships': ships})

@app.route('/api/get_user_boards', methods=['GET'])
def get_user_boards():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        boards = cursor.execute('SELECT * FROM boards').fetchall()
        boards = list(filter(lambda board: board[3] is not None and str(session['user_id']) in board[3], boards))
        return jsonify(boards)


@app.route('/api/add_user_on_board', methods=['POST'])
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
        cursor.execute('INSERT INTO shots (username, board_id, remaining_shots) VALUES (?, ?, ?)', (username, board_id, shots))
        return jsonify({'success': True})

@app.route('/api/change_user_shots', methods=['POST'])
def change_user_shots():
    data = request.get_json()

    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        board_id = data['boardId']
        username = data['userName']
        shots = data['shots']
        prevShots = cursor.execute('SELECT remaining_shots FROM shots WHERE username = ? AND board_id = ?', (username, board_id)).fetchone()[0]
        cursor.execute('UPDATE shots SET remaining_shots = ? WHERE username = ? AND board_id = ?', (str(int(prevShots) + int(shots)), username, board_id))
        return jsonify({'success': True})

@app.route('/api/del_user_from_board', methods=['POST'])
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
        cursor.execute('DELETE FROM shots WHERE username = ? AND board_id = ?', (username, board_id))
        return jsonify({'success': True})


@app.route('/api/add_prize_on_board', methods=['POST'])
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

@app.route('/api/del_prize_from_board', methods=['POST'])
def del_prize_from_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('DELETE FROM prizes WHERE id = ?', (data['prizeId'],))
        cursor.execute('DELETE FROM ships WHERE prize_id = ?', (data['prizeId'],))
        users = cursor.execute('SELECT * FROM users').fetchall()
        for user in users:
            if user[2] is not None and ',' + str(data['prizeId']) + ',' in ',' + user[2] + ',':
                cursor.execute('UPDATE users SET prizes = ? WHERE username = ?', (user[2].replace(',' + str(data['prizeId']) + ',', ','), user[0]))
        return jsonify({'success': True})

def create_table():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admins (
            id INTEGER,
            username TEXT,
            password TEXT
            );''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
            id INTEGER,
            username TEXT,
            password TEXT,
            prizes TEXT
            );''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS boards (
            id INTEGER,
            name TEXT,
            size INTEGER,
            users TEXT
            );''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS prizes (
            id INTEGER,
            name TEXT,
            descr TEXT,
            img TEXT,
            board_id INTEGER
            );''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ships (
            prize_id INTEGER,
            coords TEXT,
            was_shot INTEGER
            );''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shots (
            id INTEGER,
            user_id INTEGER,
            board_id INTEGER,
            remaining_shots INTEGER
            );''')
        connect.commit()


if __name__ == '__main__':
    app.run(debug=True)
