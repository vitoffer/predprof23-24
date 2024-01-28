from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import os



app = Flask(__name__)
app.secret_key = '92347_а114!'
DB_FILE = 'data.db'
UPLOAD_FOLDER = 'static/prizes'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def create_table():
    with sqlite3.connect(DB_FILE) as connect:
        cursor = connect.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admins (
            username TEXT,
            password TEXT
            );''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
            username TEXT UNIQUE,
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
            CREATE TABLE IF NOT EXISTS remain_shots (
            username TEXT,
            board_id INTEGER,
            remaining_shots INTEGER
            );''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shots (
            id INTEGER,
            board_id INTEGER,
            username TEXT,
            coords TEXT
            );''')
        connect.commit()


# from views.loginpage import *
from urls.urls import *
from urls.api import *
from views import *



if __name__ == '__main__':
    create_table()
    app.run(debug=True)
