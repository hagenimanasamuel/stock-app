require("dotenv").config();
const express = require('express');
const app = express();
const path = require('path');
const mysql = require("mysql2");
const multer = require('multer');
const PORT = process.env.PORT;

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    database: process.env.DB_DBNAME,
    password: process.env.DB_PASSWORD
});

connection.connect((err) => {
    if (err) throw err;
    console.log("Connected to the database successfully");

    // Create items table if not exists
    const createItemsTableQuery = `
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image VARCHAR(255),
            date DATE
        )
    `;
    connection.query(createItemsTableQuery, (err, result) => {
        if (err) throw err;
        console.log("Items table created successfully");
    });

    // Create users table if not exists
    const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image VARCHAR(255),
            occupation VARCHAR(255)
        )
    `;
    connection.query(createUsersTableQuery, (err, result) => {
        if (err) throw err;
        console.log("Users table created successfully");
    });
});

// Set up views and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Route to render the home page with uploaded items
app.get('/', (req, res) => {
    const sql = "SELECT * FROM items";
    connection.query(sql, (err, items) => {
        if (err) throw err;
        res.render('index', { items });
    });
});

// Route to render the form for adding a new user
app.get('/adduser', (req, res) => {
    res.render('addUser');
});

// Route to handle adding a new user
app.post('/adduser', upload.single('image'), (req, res) => {
    const { name, description, occupation } = req.body;
    const image = req.file.filename;

    const sql = "INSERT INTO users (name, description, image, occupation) VALUES (?, ?, ?, ?)";
    connection.query(sql, [name, description, image, occupation], (err, result) => {
        if (err) throw err;
        console.log("User added successfully");
        res.redirect('/users');
    });
});

// Fetch user data from the database
app.get('/users', (req, res) => {
    const sql = "SELECT * FROM users";
    connection.query(sql, (err, users) => {
        if (err) throw err;
        res.render('user', { users });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
