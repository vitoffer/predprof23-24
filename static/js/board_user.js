let boardID, username, SIZE, REMAIN_SHOTS, PRIZES, SHOTS, MYSHIPS, OTHERSHIPS;
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/board_user')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            boardID = data['id'];
            SIZE = data['size'];
            username = data['username'];
            REMAIN_SHOTS = data['remain_shots'];
            if (data['prizes'] != null) {
                PRIZES = Array.from(data['prizes'], prize => ({
                    id: prize[0],
                    name: prize[1],
                    desc: prize[2],
                    img: prize[3],
                }));
                SHIPS = Array.from(data['ships'], ship => ({
                    prize_id: ship[0],
                    coords: ship[1],
                }))
            }
            else {
                PRIZES = [];
                MYSHIPS = [];
            }

            SHOTS = Array.from(data['shots'], shot => ({
                id: shot[0],
                coords: shot[3],
            }))
            document.getElementById('remainShots').textContent = 'Мои выстрелы: ' + REMAIN_SHOTS;
            fillPrizesList();
            drawBoard();
            drawShots();
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
            cell.setAttribute('onclick', "shoot(this.id)");
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function drawShots() {
    for (let shot of SHOTS) {
        const cell = document.getElementById('cell-' + shot.coords);
        cell.textContent = '*';
        cell.style.color = 'black';
    }
}

function drawShips() {
    for (let ship of SHIPS) {
        const cell = document.getElementById('cell-' + ship.coords);
        cell.textContent = 'X';
        cell.style.color = 'red';
    }
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
    prizeImg.src = `static/prizes/${prize.img}`;
    prizeDiv.appendChild(prizeImg);
    document.getElementById('prizes').appendChild(prizeDiv);
}

function shoot(cellId) {
    cellId = cellId.slice(5);
    prevShots = SHOTS.map(shot => shot.coords);
    if (REMAIN_SHOTS <= 0) {
        alert('Вы превысили количество выстрелов!');
    } else if (prevShots.includes(cellId)) {
        alert('Вы уже стреляли в эту клетку!');
    } else {
        fetch('/api/shoot', {
            method: 'POST',
            body: JSON.stringify({
                coords: cellId,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data['status'] == 'success') {
                    REMAIN_SHOTS--;
                    document.getElementById('remainShots').textContent = 'Мои выстрелы: ' + REMAIN_SHOTS;
                    SHOTS.push({
                        id: data['shot_id'],
                        coords: cellId,
                    });


                    if (data['prize'] != null) {
                        alert('Попадание!');
                        prizeId = data['prize'][0];
                        prizeName = data['prize'][1];
                        prizeDesc = data['prize'][2];
                        prizeImg = data['prize'][3];
                        addPrizeToList({ id: prizeId, name: prizeName, desc: prizeDesc, img: prizeImg });
                        const cell = document.getElementById('cell-' + cellId);
                        cell.textContent = 'X';
                        cell.style.color = 'red';
                        SHIPS.push({
                            prize_id: prizeId,
                            coords: cellId,
                        })
                    } else {
                        alert('Мимо!');
                    }

                    drawShots();
                    drawShips();
                }
            })
    }
}
