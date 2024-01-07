document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('admin_check').checked ? 'admin' : 'user';

    fetch('/login', {
        method: 'POST',
        body: JSON.stringify({
            username: username,
            password: password,
            role: role,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Login successful');
                window.location.href = '/boards';
            } else {
                console.log('Login failed. ' + data.message);
            }
        });
});

document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const role = document.getElementById('admin_check').checked ? 'admin' : 'user';

    fetch('/register', {
        method: 'POST',
        body: JSON.stringify({
            username: newUsername,
            password: newPassword,
            role: role,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Registration successful');
            } else {
                console.log('Registration failed. ' + data.message);
            }
        });
});
