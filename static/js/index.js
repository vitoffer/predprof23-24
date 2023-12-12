document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    fetch('/login', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Login successful');
            } else {
                console.log('Login failed. ' + data.message);
            }
        });
});

document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    fetch('/register', {
        method: 'POST',
        body: formData
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

sessionStorage.setItem('role', 'user');

document.getElementById('admin_check').addEventListener('input', () => {
    sessionStorage.setItem('role', 'admin');
})
document.getElementById('user_check').addEventListener('input', () => {
    sessionStorage.setItem('role', 'user');
})
