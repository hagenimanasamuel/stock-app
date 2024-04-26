require("dotenv").config();
const express = require('express');
const app = express();
const path = require('path');
const mysql = require("mysql2");
const multer = require('multer');
const PORT = process.env.PORT;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const urlDB = `mysql://${process.env.MYSQLUSER}:${process.env.MYSQL_ROOT_PASSWORD}@${process.env.RAILWAY_TCP_PROXY_DOMAIN}:${process.env.RAILWAY_TCP_PROXY_PORT}/${process.env.MYSQL_DATABASE}`

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    database: process.env.DB_DBNAME,
    password: process.env.DB_PASSWORD
});

connection.connect((err) => {
    if (err) throw err;
    console.log("Connected to the server successfully");

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image VARCHAR(255),
            date DATE
        )
    `;
    connection.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log("Items table created successfully");
    });
});

app.get('/', (req, res) => {
    const sql = "SELECT * FROM items";
    connection.query(sql, (err, items) => {
        if (err) throw err;
        res.render('index', { items });
    });
});

app.get('/upload', (req, res) => {
    res.render('upload');
});

app.post('/upload', upload.single('image'), (req, res) => {
    const { name, description, date } = req.body;
    const image = req.file.filename;

    const sql = "INSERT INTO items (name, description, image, date) VALUES (?, ?, ?, ?)";
    connection.query(sql, [name, description, image, date], (err, result) => {
        if (err) throw err;
        console.log("Data inserted successfully");
        res.redirect('/');
    });
});

app.post('/edit/:id', upload.single('image'), (req, res) => {
    const { name, description, date } = req.body;
    const image = req.file ? req.file.filename : '';
    const id = req.params.id;

    let sql = "UPDATE items SET name = ?, description = ?, image = ?, date = ? WHERE id = ?";
    let values = [name, description, image, date, id];
    if (!image) {
        sql = "UPDATE items SET name = ?, description = ?, date = ? WHERE id = ?";
        values = [name, description, date, id];
    }
    connection.query(sql, values, (err, result) => {
        if (err) throw err;
        console.log("Data updated successfully");
        res.redirect('/');
    });
});

app.post('/delete/:id', (req, res) => {
    const id = req.params.id;

    const sql = "DELETE FROM items WHERE id = ?";
    connection.query(sql, [id], (err, result) => {
        if (err) throw err;
        console.log("Data deleted successfully");
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});


