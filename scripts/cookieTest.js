const url = 'http://127.0.0.1:5000/api/users';
const user = { name: 'Test User', email: 'testuser@example.com', password: 'password123', role: 'student' };

(async () => {
  try {
    const register = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const regText = await register.text();
    console.log('REGISTER', register.status, regText);
  } catch (e) {
    console.error('Register failed', e);
  }

  try {
    const login = await fetch('http://127.0.0.1:5000/api/users/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
      redirect: 'manual',
    });
    console.log('LOGIN status', login.status);
    console.log('Set-Cookie header:', login.headers.get('set-cookie'));
    const body = await login.text();
    console.log('LOGIN body', body);
  } catch (e) {
    console.error('Login failed', e);
  }
})();
