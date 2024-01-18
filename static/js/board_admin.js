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
            }));
            SHIPS = Array.from(data['ships'], ship => ({
                prize_id: ship[0],
                coords: ship[1].split('-'),
                was_shot: ship[2] == '1' ? true : false,
            }));
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
            drawBoard(SIZE);
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
});

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
    for (let ship of ships) {
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

    userDiv.id = newUser ? 'user' + user : 'user' + user.name;
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
        const index = SHOTS.findIndex((shot => shot.user_name == user.name));
        shots.textContent = SHOTS[index].remained + ' выстрелов';
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
        SHOTS.push({ user_name: user, remained: userShots });
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
                const userShot = SHOTS.findIndex((shot => shot.user_name == userName));
                SHOTS[userShot].remained--;
                button.parentElement.querySelector('.shots').textContent = SHOTS[userShot].remained + ' выстрелов';
            } else {
                console.log('Shots not added. ' + data.message);
            }
        })

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
                const userShot = SHOTS.findIndex((shot => shot.user_name == userName));
                SHOTS[userShot].remained++;
                button.parentElement.querySelector('.shots').textContent = SHOTS[userShot].remained + ' выстрелов';
            } else {
                console.log('Shots not added. ' + data.message);
            }
        })
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
                SHOTS = SHOTS.filter(shot => shot.user_name != userName);
                user.remove();
            } else {
                console.log('User not deleted. ' + data.message);
            }
        })

}


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
                addShipToList(PRIZES[PRIZES.length - 1].id, PRIZES[PRIZES.length - 1].name);
                document.getElementById('addPrizeForm').style.display = 'none';
            } else {
                console.log('Prize not added. ' + data.message);
            }
        })

})

function addShipToList(prizeId, prizeName) {
    const shipDiv = document.createElement('div');
    shipDiv.id = 'ship' + prizeId;
    const shipForPrize = document.createElement('p');
    shipForPrize.classList.add('ship-prize');
    shipForPrize.textContent = 'Корабль за приз ' + prizeName;
    shipDiv.appendChild(shipForPrize);
    shipDiv.style.cursor = 'pointer';
    document.getElementById('ships').appendChild(shipDiv);
}

function delShip(prizeId) {
    const shipDiv = document.getElementById('ship' + prizeId);
    SHIPS = SHIPS.filter(ship => ship.prize_id != prizeId);
    shipDiv.remove();
}
