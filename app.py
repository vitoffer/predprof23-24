from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import os

app = Flask(__name__)
app.secret_key = '12345678'


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    connection = sqlite3.connect('./data/data.db')
    cursor = connection.cursor()

    if session.get('role') == 'user':
        user = cursor.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if user is None:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
        if user[2] == password:
            session['user_id'] = user[0]
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
    if session.get('role') == 'admin':
        user = cursor.execute("SELECT * FROM admins WHERE username = ?", (username,)).fetchone()
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
        username = request.form['newUsername']
        password = request.form['newPassword']


        connection = sqlite3.connect('./data/data.db')
        cursor = connection.cursor()

        if session.get('role') == 'user':
            if username not in [i[0] for i in cursor.execute("SELECT username FROM users").fetchall()]:
                id = cursor.execute("SELECT * FROM users").fetchall()
                if len(id) == 0:
                    id = 0
                else:
                    id = id[-1][0] + 1
                cursor.execute("INSERT INTO users (id, username, password) VALUES (?, ?, ?)", (id, username, password))

        else:
            if username not in [i[0] for i in cursor.execute("SELECT username FROM admins").fetchall()]:
                id = cursor.execute("SELECT * FROM users").fetchall()
                if len(id) == 0:
                    id = 0
                else:
                    id = id[-1][0] + 1
                cursor.execute("INSERT INTO admins (id, username, password) VALUES (?, ?, ?)", (id, username, password))
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

@app.route('/set_role', methods=['POST'])
def set_role():
    session['role'] = request.get_json()['role']
    return jsonify({'success': True})

@app.route('/lists')
def lists():
    role = session['role']
    if role == 'admin':
        return render_template('lists_admin.html')
    elif role == 'user':
        return render_template('lists_user.html')
    else:
        return redirect(url_for('index'))



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
