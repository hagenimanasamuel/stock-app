const express = require('express');
const app = express();
const path = require('path');
const mysql = require("mysql2");
const multer = require('multer');

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Upload files to the public/uploads directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Use unique filename
    }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection setup
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "stock_management",
    password: "1253"
});

connection.connect((err) => {
    if (err) throw err;
    console.log("Connected to the server successfully");
});

// Route to render the home page with uploaded items
app.get('/', (req, res) => {
    // Fetch items from the database
    const sql = "SELECT * FROM items";
    connection.query(sql, (err, items) => {
        if (err) throw err;
        res.render('index', { items }); // Pass items to the index.ejs template
    });
});

// Route to render the upload form
app.get('/upload', (req, res) => {
    res.render('upload');
});

// Route to handle form submission for uploading product
app.post('/upload', upload.single('image'), (req, res) => {
    const { name, description, date } = req.body;
    const image = req.file.filename; // Multer stores uploaded file details in req.file

    // Insert the form data into the database
    const sql = "INSERT INTO items (name, description, image, date) VALUES (?, ?, ?, ?)";
    connection.query(sql, [name, description, image, date], (err, result) => {
        if (err) throw err;
        console.log("Data inserted successfully");
        res.redirect('/'); // Redirect to home page after successful upload
    });
});

// Route to handle form submission for editing product
app.post('/edit/:id', upload.single('image'), (req, res) => {
    const { name, description, date } = req.body;
    const image = req.file ? req.file.filename : ''; // Check if a new image is uploaded
    const id = req.params.id;

    // Update the product data in the database
    let sql = "UPDATE items SET name = ?, description = ?, image = ?, date = ? WHERE id = ?";
    let values = [name, description, image, date, id];
    if (!image) {
        // If no new image is uploaded, don't update the image column in the database
        sql = "UPDATE items SET name = ?, description = ?, date = ? WHERE id = ?";
        values = [name, description, date, id];
    }
    connection.query(sql, values, (err, result) => {
        if (err) throw err;
        console.log("Data updated successfully");
        res.redirect('/'); // Redirect to home page after successful edit
    });
});

// Route to handle form submission for deleting product
app.post('/delete/:id', (req, res) => {
    const id = req.params.id;

    // Delete the product data from the database
    const sql = "DELETE FROM items WHERE id = ?";
    connection.query(sql, [id], (err, result) => {
        if (err) throw err;
        console.log("Data deleted successfully");
        res.redirect('/'); // Redirect to home page after successful delete
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});
