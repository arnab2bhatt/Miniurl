const bcrypt = require('bcryptjs');

// In-memory user store
let users = {};

// Helper function to add a new user
function addUser(username, password) {
    if (users[username]) {
        return false;  // Username already exists
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[username] = { password: hashedPassword };
    return true;
}

// Helper function to validate user credentials
function validateUser(username, password) {
    const user = users[username];
    if (!user) return false;
    return bcrypt.compareSync(password, user.password);
}

module.exports = { addUser, validateUser, users };
