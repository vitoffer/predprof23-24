document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/get_user_boards')
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
    newBoard.setAttribute('onclick', "viewBoard(this.id)");
    document.getElementById('boards').appendChild(newBoard);
}

function viewBoard(id) {
    window.location.href = '/board/' + id;
}
