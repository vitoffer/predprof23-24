let ID, NAME, SIZE, USERS, SHOTS, PRIZES, SHIPS;
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/board_admin')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            ID = data['id'];
            NAME = data['name'];
            SIZE = data['size'];
            USERS = Array.from(data['users'], user => ({
                name: user[0],
                prizes: user[2] && user[2].split(','),
            }));
            SHOTS = Array.from(data['shots'], shot => ({
                user_name: shot[0],
                remained: shot[2],
            }));
            PRIZES = Array.from(data['prizes'], prize => ({
                id: prize[0],
                name: prize[1],
                desc: prize[2],
                img: prize[3],
                ship_id: prize[5],
            }));
            SHIPS = Array.from(data['ships'], ship => ({
                id: ship[0],
                coords: ship[1].split('-'),
                was_shot: ship[2] == '1' ? true : false,
            }));
            console.log('id: ' + ID);
            console.log('name: ' + NAME);
            console.log('size: ' + SIZE);
            console.log('users:');
            console.log(USERS);
            console.log('shots:');
            console.log(SHOTS);
            console.log('prizes:');
            console.log(PRIZES);
            console.log('ships:');
            console.log(SHIPS);
            fillUsersList();
            fillPrizesList();
            fillShipsList();
            drawBoard(SIZE);
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

function fillUsersList() {
    USERS.forEach(user => {
        addUserToList(user);
    });
}

function addUserToList(user, newUser = false, userShots = 0) {
    const userDiv = document.createElement('div');
    userDiv.id = 'user' + newUser ? user : user.name;
    const userName = document.createElement('span');
    userName.textContent = newUser ? user : user.name + ':';
    userDiv.appendChild(userName);
    const minusShots = document.createElement('button');
    minusShots.classList.add('minusShots');
    minusShots.textContent = '-';
    userDiv.appendChild(minusShots);
    const shots = document.createElement('span');
    shots.classList.add('shots');
    if (newUser) {
        shots.textContent = userShots + ' выстрелов';
    } else {
        shots.textContent = SHOTS.filter(shot => shot.user_name == user.name)[0].remained + ' выстрелов';
    }
    userDiv.appendChild(shots);
    const plusShots = document.createElement('button');
    plusShots.classList.add('plusShots');
    plusShots.textContent = '+';
    userDiv.appendChild(plusShots);
    const delUser = document.createElement('button');
    delUser.classList.add('delUser');
    delUser.textContent = 'del';
    userDiv.appendChild(delUser);
    document.getElementById('users').appendChild(userDiv);
}

function fillPrizesList() {
    PRIZES.forEach(prize => {
        const prizeDiv = document.createElement('div');
        prizeDiv.id = 'prize' + prize.id;
        const prizeName = document.createElement('span');
        prizeName.textContent = prize.name + ':';
        prizeDiv.appendChild(prizeName);
        const prizeDesc = document.createElement('p');
        prizeDesc.textContent = prize.desc;
        prizeDiv.appendChild(prizeDesc);
        const prizeImg = document.createElement('img');
        prizeImg.style.maxWidth = '80px';
        prizeImg.style.maxHeight = '80px';
        prizeImg.src = '/static/prizes/' + prize.img;
        prizeDiv.appendChild(prizeImg);
        const delPrize = document.createElement('button');
        delPrize.classList.add('delPrize');
        delPrize.textContent = 'del';
        prizeDiv.appendChild(delPrize);
        prizeDiv.style.cursor = 'pointer';
        document.getElementById('prizes').appendChild(prizeDiv);
    })
}

function fillShipsList() {
    SHIPS.forEach(ship => {
        const shipDiv = document.createElement('div');
        shipDiv.id = 'ship' + ship.id;
        const shipForPrize = document.createElement('p');
        shipForPrize.classList.add('ship-prize');
        shipForPrize.textContent = 'Корабль за приз ' + PRIZES.filter(prize => prize.ship_id == String(ship.id))[0].name;
        shipDiv.appendChild(shipForPrize);

        //coords
        shipDiv.style.cursor = 'pointer';
        document.getElementById('ships').appendChild(shipDiv);
    })
}

document.querySelectorAll('minusShots').forEach(button => {
    button.addEventListener('click', () => {
        const user = button.parentElement.id.slice(4);
        fetch('/api/change_user_shots', {
            method: 'POST',
            body: JSON.stringify({
                boardId: ID,
                userName: user,
                shots: -1,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        SHOTS
        button.parentElement.querySelector('.shots').textContent = SHOTS.filter(shot => shot.user_name == user)[0].remained + ' выстрелов';
    })
})


document.getElementById('addUser').addEventListener('click', () => {
    document.getElementById('addUserForm').style.display = 'block';
})

document.getElementById('addPrize').addEventListener('click', () => {
    document.getElementById('addPrizeForm').style.display = 'block';
})

document.getElementById('addUserForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('newUserName').value;
    const shots = document.getElementById('newUserShots').value;
    fetch('/api/add_user_on_board', {
        method: 'POST',
        body: JSON.stringify({
            boardId: ID,
            userName: username,
            shots: shots,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    addUserToList(username, newUser = true, userShots = shots);
    document.getElementById('addUserForm').style.display = 'none';
})

document.getElementById('addPrizeForm').addEventListener('submit', (event) => {
    event.preventDefault();
})
