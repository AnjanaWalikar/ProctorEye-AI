# Login Troubleshooting Guide

## Fixes Applied

I've made the following improvements to fix the login functionality:

### Backend Changes:
1. **Added OPTIONS method to CORS** - Allows preflight requests for cross-origin requests
2. **Improved error handling in login controller** - Better error catching and logging
3. **Enhanced logging** - More detailed console logs to help debug issues

### Frontend Changes:
1. **Better error message extraction** - More robust error handling to show meaningful messages
2. **Improved error logging** - Detailed console logs for debugging

## Steps to Test Login

### 1. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows - Start MongoDB service
net start MongoDB

# Or if you're using MongoDB Compass, just ensure the service is running
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd e:\Test\AI-Proctored-System-main
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Start the Application
```bash
# Run both backend and frontend together
npm run dev
```

This will start:
- Backend on http://localhost:5000
- Frontend on http://localhost:3000

### 4. Create a Test User (First Time Only)

If you don't have a user registered yet:

1. Go to http://localhost:3000
2. Click "Create an account"
3. Fill in the registration form with:
   - Name: Test User
   - Email: test@example.com
   - Password: test123 (minimum 6 characters)
   - Role: student or teacher
4. Click Register

### 5. Test Login

1. Go to http://localhost:3000
2. Enter your email and password
3. Click "Sign In"

## Common Issues & Solutions

### Issue 1: "Cannot connect to server"
**Solution**: 
- Make sure the backend server is running (check terminal for "server is running on http://localhost:5000")
- Check if MongoDB is running

### Issue 2: "Invalid email or password"
**Solution**:
- Make sure you registered the user first
- Check that you're using the correct email and password
- Password must be at least 6 characters

### Issue 3: "Network Error" or CORS errors
**Solution**:
- Clear your browser cache and cookies
- Make sure both frontend and backend are running
- Check browser console (F12) for specific error messages

### Issue 4: Page doesn't redirect after login
**Solution**:
- Check browser console for errors
- Verify that the response includes user data
- Check if userInfo is being stored in localStorage

## Debugging Tips

### Check Browser Console (F12)
Look for these console logs during login:
- "Attempting login with: {email}"
- "Calling login mutation..."
- "Login response: {data}"
- Or error messages if login fails

### Check Backend Terminal
Look for these logs:
- "Login attempt received: {email}"
- "User found: Yes/No"
- "Password match: Yes/No"

### Check Network Tab (F12 > Network)
1. Filter by "XHR" requests
2. Look for POST request to `/api/users/auth`
3. Check:
   - Request payload (email and password)
   - Response status (should be 200 for success)
   - Response body (should contain user data)

## Verify Environment Variables

### Backend (.env file)
```
PORT=5000
NODE_ENV=development
MONGO_URL=mongodb://localhost:27017/proctoreyai
JWT_SECRET=your_jwt_secret_key_here
```

### Frontend (.env file)
```
REACT_APP_BACKEND_URL=http://localhost:5000
NODE_ENV=development
```

## Manual API Test

You can test the login API directly using tools like Postman or curl:

```bash
curl -X POST http://localhost:5000/api/users/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -c cookies.txt -v
```

Expected response (200 OK):
```json
{
  "_id": "...",
  "name": "Test User",
  "email": "test@example.com",
  "role": "student",
  "message": "User Successfully login with role: student"
}
```

## Still Having Issues?

If login still doesn't work after trying these steps:

1. **Check MongoDB Connection**:
   - Open MongoDB Compass
   - Connect to: mongodb://localhost:27017
   - Verify the "proctoreyai" database exists

2. **Clear Browser Data**:
   - Clear cookies and cache
   - Try incognito/private mode

3. **Check Ports**:
   - Make sure port 5000 and 3000 are not being used by other applications
   - You can change ports in the .env files

4. **Reinstall Dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Check for Error Messages**:
   - Share the exact error message you're seeing
   - Check both browser console and backend terminal logs
