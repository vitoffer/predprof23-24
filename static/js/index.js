document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    if (document.getElementById('admin_check').checked) {
        fetch('/set_role', {
            method: 'POST',
            body: JSON.stringify({ role: 'admin' }),
        })
    }
    else {
        fetch('/set_role', {
            method: 'POST',
            body: JSON.stringify({ role: 'user' }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    const formData = new FormData(event.target);

    fetch('/login', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Login successful');
                window.location.href = '/lists';
            } else {
                console.log('Login failed. ' + data.message);
            }
        });
});

document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // if (document.getElementById('admin_check').checked) {
    //     fetch('/set_role', {
    //         method: 'POST',
    //         body: JSON.stringify({ role: 'admin' }),
    //     })
    // }
    // else {
    //     fetch('/set_role', {
    //         method: 'POST',
    //         body: JSON.stringify({ role: 'user' }),
    //     })
    // }

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
