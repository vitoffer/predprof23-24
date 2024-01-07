document.addEventListener('DOMContentLoaded', () => {
    let id, name, size, users;
    fetch('/board_admin')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            drawBoard(data[0][2])
            id = data[0][0];
            name = data[0][1];
            size = data[0][2];
            users = data[0][3];
            console.log(id, name, size, users)
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
})

function drawBoard(size) {

}
