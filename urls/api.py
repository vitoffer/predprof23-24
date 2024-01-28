import sys

sys.path.append('../')

from app import app
from views.loginpage import login, register
from views.boards_list import get_admin_boards, create_board, del_board
from views.view_admin_board import admin_board, get_user_boards, add_user_on_board, change_user_shots, del_user_from_board, add_prize_on_board, del_prize_from_board, set_ship_on_board
from views.view_user_board import board_user, shoot

app.add_url_rule('/api/login', 'login', view_func=login, methods=['POST'])
app.add_url_rule('/api/register', 'register', view_func=register, methods=['POST'])

app.add_url_rule('/api/get_admin_boards', 'get_admin_boards', view_func=get_admin_boards, methods=['GET'])
app.add_url_rule('/api/create_board', 'create_board', view_func=create_board, methods=['POST'])
app.add_url_rule('/api/del_board', 'del_board', view_func=del_board, methods=['POST'])

app.add_url_rule('/api/get_user_boards', 'get_user_boards', view_func=get_user_boards, methods=['GET'])

app.add_url_rule('/api/board_admin', 'admin_board', view_func=admin_board, methods=['GET'])
app.add_url_rule('/api/add_user_on_board', 'add_user_on_board', view_func=add_user_on_board, methods=['POST'])
app.add_url_rule('/api/change_user_shots', 'change_user_shots', view_func=change_user_shots, methods=['POST'])
app.add_url_rule('/api/del_user_from_board', 'del_user_from_board', view_func=del_user_from_board, methods=['POST'])
app.add_url_rule('/api/add_prize_on_board', 'add_prize_on_board', view_func=add_prize_on_board, methods=['POST', 'GET'])
app.add_url_rule('/api/del_prize_from_board', 'del_prize_from_board', view_func=del_prize_from_board, methods=['POST'])
app.add_url_rule('/api/set_ship_on_board', 'set_ship_on_board', view_func=set_ship_on_board, methods=['POST'])

app.add_url_rule('/api/board_user', 'board_user', view_func=board_user, methods=['GET'])
app.add_url_rule('/api/shoot', 'shoot', view_func=shoot, methods=['POST', 'GET'])
