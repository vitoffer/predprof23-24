document.getElementById('addBoard').addEventListener('click', () => {
    document.getElementById('addBoardForm').style.display = 'block';
})

function createBoard(id1, name1, size1) {
    const newBoard = document.createElement('div');
    newBoard.classList.add('board');
    newBoard.id = id1;
    const name = document.createElement('h2');
    name.textContent = name1;
    newBoard.appendChild(name);
    const n = size1;
    const size = document.createElement('h2');
    size.textContent = n + 'x' + n;
    newBoard.appendChild(size);
    const btn = document.createElement('button');
    btn.classList.add('delBoard');
    btn.textContent = 'Delete';
    btn.setAttribute('onclick', 'delBoard(event, this)');
    newBoard.appendChild(btn);
    newBoard.setAttribute('onclick', "viewBoard(this.id)");
    document.getElementById('boards').appendChild(newBoard);
}

document.getElementById('addBoardForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const prevBoard = document.querySelectorAll('.board')[document.querySelectorAll('.board').length - 1];
    const id = +prevBoard.id + 1, name = document.getElementById('newBoardName').value, size = document.getElementById('newBoardSize').value;
    createBoard(String(id), name, size);
    fetch('/api/create_board', {
        method: 'POST',
        body: JSON.stringify({
            id: id,
            name: name,
            size: size,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    document.getElementById('addBoardForm').style.display = 'none';
})

function delBoard(event, button) {
    event.stopPropagation();
    const board = button.parentNode;
    fetch('/api/del_board', {
        method: 'POST',
        body: JSON.stringify({
            id: board.id,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    board.remove();

}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/get_admin_boards')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            data.forEach(element => {
                createBoard(element[0], element[1], element[2]);
            });
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
})

function viewBoard(id) {
    window.location.href = '/board/' + id;
}
