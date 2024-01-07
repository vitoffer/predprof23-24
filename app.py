from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import os

app = Flask(__name__)
app.secret_key = '92347_а114!'
DB_FILE = 'data.db'


@app.route('/')
def index():
    create_table()
    return render_template('index.html')


@app.route('/login', methods=['POST'])
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
        if user[2] == password:
            session['user_id'] = user[0]
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
    if session['role'] == 'admin':
        user = cursor.execute("SELECT * FROM admins WHERE username = ?", (username,)).fetchone()
        if user is None:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
        if user[2] == password:
            session['user_id'] = user[0]
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})

    connection.commit()
    cursor.close()
    connection.close()


@app.route('/register', methods=['POST'])
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
                user_id = cursor.execute("SELECT * FROM users").fetchall()
                if len(user_id) == 0:
                    user_id = 0
                else:
                    user_id = user_id[-1][0] + 1
                cursor.execute("INSERT INTO users (id, username, password) VALUES (?, ?, ?)", (user_id, username, password))

        else:
            if username not in [i[0] for i in cursor.execute("SELECT username FROM admins").fetchall()]:
                user_id = cursor.execute("SELECT * FROM users").fetchall()
                if len(user_id) == 0:
                    user_id = 0
                else:
                    user_id = user_id[-1][0] + 1
                cursor.execute("INSERT INTO admins (id, username, password) VALUES (?, ?, ?)", (user_id, username, password))
        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('home'))


@app.route('/boards')
def boards():
    if 'user_id' in session:
        role = session['role']
        if role == 'admin':
            return render_template('boards_admin.html')
        elif role == 'user':
            return render_template('boards_user.html')
        else:
            return redirect(url_for('index'))
    else:
        return redirect(url_for('index'))


@app.route('/get_admin_boards', methods=['GET'])
def get_admin_boards():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        boards = cursor.execute('SELECT * FROM boards').fetchall()
        return jsonify(boards)

@app.route('/create_board', methods=['POST'])
def create_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('''INSERT INTO boards (id, name, size, users) VALUES (?, ?, ?, ?)''', (data['id'], data['name'], data['size'], None))
        return jsonify({'success': True})


@app.route('/del_board', methods=['POST'])
def del_board():
    data = request.get_json()
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('''DELETE FROM boards WHERE id=?''', data['id'])
        return jsonify({'success': True})


@app.route('/board/<board_id>')
def board(board_id):
    if 'user_id' in session and 'role' in session:
        role = session['role']
        session['board_id'] = board_id
        if role == 'admin':
            return render_template('board_admin.html', board_id=board_id)
        elif role == 'user':
            return render_template('board_user.html', board_id=board_id)
    else:
        return redirect(url_for('index'))


@app.route('/board_admin', methods=['GET'])
def admin_board():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        board = cursor.execute('SELECT * FROM boards WHERE id = ?', (session['board_id'],)).fetchall()
        return jsonify(board)

@app.route('/get_user_boards', methods=['GET'])
def get_user_boards():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        boards = cursor.execute('SELECT * FROM boards').fetchall()
        boards = list(filter(lambda board: board[3] is not None and str(session['user_id']) in board[3], boards))
        return jsonify(boards)


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
            password TEXT
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
            img TEXT,
            board_id TEXT,
            ship_id INTEGER
            );''')
        connect.commit()


if __name__ == '__main__':
    app.run(debug=True)
