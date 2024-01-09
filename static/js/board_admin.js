let ID, NAME, SIZE, USERS;
document.addEventListener('DOMContentLoaded', () => {
    fetch('/board_admin')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
            ID = data['board'][0];
            NAME = data['board'][1];
            SIZE = data['board'][2];
            fillUsersList(data['users']);
            drawBoard(SIZE);
            drawShips(data['ships']);
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
})

function drawBoard(size) {
    const board = document.getElementById('board');
    for (let i = 0; i < size; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        for (let j = 0; j < size; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = 'cell-' + i + '-' + j;
            cell.textContent = 'X';
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function drawShips(ships) {
    for (ship of ships) {
        const cell = document.getElementById('cell-' + ship[2]);
        if (ship[3] == 1) {
            cell.style.color = 'red';
        }
        else {
            cell.style.color = 'green';
        }
    }
}

function fillUsersList(users) {
    console.log(users);
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.id = user[0];
        userDiv.textContent = user[0];
        document.getElementById('users').appendChild(userDiv);
    });
}
