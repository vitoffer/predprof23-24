let ID, NAME, SIZE, USERS, REMAIN_SHOTS, PRIZES, SHIPS, selectedShip, SHOTS, usedShips = [];
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
            REMAIN_SHOTS = Array.from(data['remain_shots'], shot => ({
                user_name: shot[0],
                remained: shot[2],
            }));
            PRIZES = Array.from(data['prizes'], prize => ({
                id: prize[0],
                name: prize[1],
                desc: prize[2],
                img: prize[3],
            }));
            SHIPS = Array.from(data['ships'], ship => ({
                prize_id: ship[0],
                coords: ship[1],
                was_shot: ship[2] == '1' ? true : false,
            }));
            SHOTS = Array.from(data['shots'], shot => ({
                id: shot[0],
                user_name: shot[2],
                coords: shot[3],
            }))
            // console.log('id: ' + ID);
            // console.log('name: ' + NAME);
            // console.log('size: ' + SIZE);
            // console.log('users:');
            // console.log(USERS);
            // console.log('shots:');
            // console.log(SHOTS);
            // console.log('prizes:');
            // console.log(PRIZES);
            // console.log('ships:');
            // console.log(SHIPS);
            fillUsersList();
            fillPrizesList();
            fillShipsList();
            drawBoard();
            drawShips();
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
});

function drawBoard() {
    const board = document.getElementById('board');
    for (let i = 0; i < SIZE; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        for (let j = 0; j < SIZE; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = 'cell-' + i + '-' + j;
            cell.setAttribute('onclick', "setShip(this.id)");
            if (SIZE > 20) {
                cell.style.width = '25px';
            }
            else if (SIZE > 10) {
                cell.style.width = '35px';
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }

}

function drawShips() {
    for (let ship of SHIPS) {
        if (ship.coords == null || typeof ship.coords == 'undefined') {
            const indexShip = usedShips.indexOf(ship.prize_id);
            usedShips.splice(indexShip, 1);
            continue;
        }
        else {
            const cell = document.getElementById('cell-' + ship.coords);
            if (ship.was_shot) {
                cell.textContent = 'X';
                cell.style.color = 'red';
            }
            else {
                cell.textContent = 'X';
                cell.style.color = 'black';
            }
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

    userDiv.id = newUser ? 'user' + user : 'user' + user.name;
    userDiv.classList.add("userClass");
    const userName = document.createElement('span');
    userName.textContent = newUser ? user + ':' : user.name + ':';
    userDiv.appendChild(userName);
    const minusShots = document.createElement('button');
    minusShots.classList.add('minusShots');
    minusShots.textContent = '-';
    minusShots.setAttribute('onclick', 'minusShots(this)');
    userDiv.appendChild(minusShots);
    const shots = document.createElement('span');
    shots.classList.add('shots');
    if (newUser) {
        shots.textContent = userShots + ' выстрелов';
    } else {
        const index = REMAIN_SHOTS.findIndex((shot => shot.user_name == user.name));
        shots.textContent = REMAIN_SHOTS[index].remained + ' выстрелов';
    }
    userDiv.appendChild(shots);
    const plusShots = document.createElement('button');
    plusShots.classList.add('plusShots');
    plusShots.textContent = '+';
    plusShots.setAttribute('onclick', 'plusShots(this)');
    userDiv.appendChild(plusShots);
    const delUser = document.createElement('button');
    delUser.classList.add('delUser');
    delUser.textContent = 'del';
    delUser.setAttribute('onclick', 'delUser(this)');
    userDiv.appendChild(delUser);
    if (newUser) {
        REMAIN_SHOTS.push({ user_name: user, remained: userShots });
    }
    document.getElementById('users').appendChild(userDiv);
}

function fillPrizesList() {
    PRIZES.forEach(prize => {
        addPrizeToList(prize);
    });
}

function addPrizeToList(prize) {
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
    delPrize.setAttribute('onclick', 'delPrize(this)');
    prizeDiv.appendChild(delPrize);
    prizeDiv.style.cursor = 'pointer';
    document.getElementById('prizes').appendChild(prizeDiv);
}

function delPrize(button) {
    const prizeDiv = button.parentElement;

    const prizeId = prizeDiv.id.slice(5);

    const shipCell = document.getElementById('cell-' + SHIPS.filter(ship => ship.prize_id == prizeId)[0].coords);
    if (shipCell != null) {
        shipCell.textContent = '';
        shipCell.style.color = 'black';
    }
    fetch('/api/del_prize_from_board', {
        method: 'POST',
        body: JSON.stringify({
            prizeId: prizeId,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Prize deleted');
                USERS = USERS.filter(prize => prize.id != prizeId);
                delShip(prizeId)
                prizeDiv.remove();
            } else {
                console.log('Prize not deleted. ' + data.message);
            }
        })
    selectedShip = null;
}

function fillShipsList() {
    SHIPS.forEach(ship => {
        addShipToList(ship.prize_id, PRIZES.filter(prize => prize.id == ship.prize_id)[0].name);
    })
}

function minusShots(button) {
    const user = button.parentElement;
    const userName = user.id.slice(4);
    fetch('/api/change_user_shots', {
        method: 'POST',
        body: JSON.stringify({
            boardId: ID,
            userName: userName,
            shots: -1,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Shots minused');
                const userShot = REMAIN_SHOTS.findIndex((shot => shot.user_name == userName));
                REMAIN_SHOTS[userShot].remained--;
                button.parentElement.querySelector('.shots').textContent = REMAIN_SHOTS[userShot].remained + ' выстрелов';
            } else {
                console.log('Shots not added. ' + data.message);
            }
        })
    selectedShip = null;
}

function plusShots(button) {
    const user = button.parentElement;
    const userName = user.id.slice(4);
    fetch('/api/change_user_shots', {
        method: 'POST',
        body: JSON.stringify({
            boardId: ID,
            userName: userName,
            shots: 1,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Shots added');
                const userShot = REMAIN_SHOTS.findIndex((shot => shot.user_name == userName));
                REMAIN_SHOTS[userShot].remained++;
                button.parentElement.querySelector('.shots').textContent = REMAIN_SHOTS[userShot].remained + ' выстрелов';
            } else {
                console.log('Shots not added. ' + data.message);
            }
        })
    selectedShip = null;
}

function delUser(button) {
    const user = button.parentElement;
    const userName = user.id.slice(4);
    fetch('/api/del_user_from_board', {
        method: 'POST',
        body: JSON.stringify({
            boardId: ID,
            userName: userName,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('User deleted');
                USERS = USERS.filter(user => user.name != userName);
                REMAIN_SHOTS = REMAIN_SHOTS.filter(shot => shot.user_name != userName);
                user.remove();
            } else {
                console.log('User not deleted. ' + data.message);
            }
        })
    selectedShip = null;
}


document.getElementById('addUser').addEventListener('click', () => {
    document.getElementById('addUserForm').style.display = 'block';
    selectedShip = null;
})

document.getElementById('addPrize').addEventListener('click', () => {
    document.getElementById('addPrizeForm').style.display = 'block';
    selectedShip = null;
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
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('User added');
                addUserToList(username, newUser = true, userShots = shots);
                document.getElementById('addUserForm').style.display = 'none';
            } else {
                console.log('User not added. ' + data.message);
            }
        })
    selectedShip = null;
})

document.getElementById('addPrizeForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(document.getElementById('addPrizeForm'));
    const files = document.getElementById('newPrizeImg')
    formData.append('boardId', ID);
    formData.append('file', files.files[0]);
    fetch('/api/add_prize_on_board', {
        method: 'POST',
        body: formData,
        files: files.files[0],
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Prize added');
                PRIZES.push({ id: data.id, name: formData.get('newPrizeName'), desc: formData.get('newPrizeDesc'), img: files.files[0].name });
                addPrizeToList(PRIZES[PRIZES.length - 1]);
                addShipToList(PRIZES[PRIZES.length - 1].id, PRIZES[PRIZES.length - 1].name, true);

                const indexShip = usedShips.indexOf(PRIZES[PRIZES.length - 1].id);
                usedShips.splice(indexShip, 1);
                document.getElementById('addPrizeForm').style.display = 'none';
            } else {
                console.log('Prize not added. ' + data.message);
            }
        })
    selectedShip = null;
})

function addShipToList(prizeId, prizeName, newShip = false) {

    const shipDiv = document.createElement('div');
    shipDiv.id = 'ship' + prizeId;
    const shipForPrize = document.createElement('p');
    shipForPrize.classList.add('ship-prize');
    shipForPrize.textContent = 'Корабль за приз ' + prizeName;
    shipDiv.appendChild(shipForPrize);
    shipDiv.style.cursor = 'pointer';

    shipDiv.addEventListener('click', () => {
        selectedShip = prizeId;
    })
    if (!newShip) {
        usedShips.push(prizeId);
    }
    document.getElementById('ships').appendChild(shipDiv);
}

function delShip(prizeId) {
    const shipDiv = document.getElementById('ship' + prizeId);
    SHIPS = SHIPS.filter(ship => ship.prize_id != prizeId);
    shipDiv.remove();
}

function setShip(cellId) {
    if (selectedShip != null) {
        const cell = document.getElementById(cellId);
        if (usedShips.includes(selectedShip)) {
            alert('Этот корабль уже на поле')
            selectedShip = null;
        } else if (cell.textContent == 'X') {
            alert('На этой клетке уже есть корабль!')
            selectedShip = null;
        } else {
            cell.textContent = 'X';
            cell.style.color = 'black';
            usedShips.push(selectedShip);
            const prizeId = selectedShip;
            selectedShip = null;
            SHIPS.push({
                prize_id: prizeId,
                coords: cellId.slice(5),
                was_shot: false,
            })
            fetch('/api/set_ship_on_board', {
                method: 'POST',
                body: JSON.stringify({
                    prizeId: prizeId,
                    coords: cellId.slice(5),
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        }

    }
}
