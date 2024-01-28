import sys

sys.path.append('../')

from app import app
from views.loginpage import index
from views.boards_list import boards
from views.view_user_board import board

app.add_url_rule('/', 'index', view_func=index, methods=['GET'])

app.add_url_rule('/boards', 'boards', view_func=boards, methods=['GET'])

app.add_url_rule('/board/<board_id>', 'board', view_func=board, methods=['GET'])
