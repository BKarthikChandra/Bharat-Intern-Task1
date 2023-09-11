const express = require('express');
const app = express();
const mysql = require('mysql2');
const session = require("express-session");
const multer = require('multer');
const path = require('path');
const connection = mysql.createConnection({
     host : "localhost",
     user : "root",
     password: "root",
     database: "task1"
});
// Parse JSON data in the request body
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// ... Your additional code and routes go here ...
app.use(express.urlencoded({ extended: true }));

// Set up session middleware
app.use(session({
  secret: 'fkw45lrk2oP3RG3240QFPO34H6U894R',
  resave: false,
  saveUninitialized: true,
}));

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/'); // Save uploaded files to the 'uploads' directory
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Rename files with a timestamp
    }
  });
  const upload = multer({ storage });


  
app.get("/",(req,res)=>{
    res.render("index.ejs");
});

app.post("/", (req, res) => {
    const { username, password } = req.body;
    
    // Correct the typo in the SQL query ("passwprd" -> "password")
    connection.query("SELECT * FROM user WHERE username = ? AND password = ?", [username, password], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).send('Internal server error');
        return;
      }
  
      if (results.length === 1) {
        // User is logged in successfully
        req.session.username = username;
        req.session.loggedIn = true;
        res.render("page1.ejs",{username});
       
      } else {
        // Incorrect username or password
        res.send('Incorrect username or password');
      }
    });
  });
  
app.get("/signup",(req,res)=>{
    res.render("signup.ejs");
});


app.post('/signup', (req, res) => {
    const { username, password } = req.body;
  
    // Insert data into the 'data' table
    const query = 'INSERT INTO user (username, password) VALUES (?, ?)';
    connection.query(query, [username, password], (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).json({ error: 'Failed to insert data' });
        return;
      }
  
      // Data inserted successfully
      console.log('Data inserted:', result);
      res.redirect("/signup");
    });
  });

//upload route 
   app.get("/upload",(req,res)=>{
    res.render("upload.ejs",{username : req.session.username});
   });
   
    // Define a route for handling form submission
app.post('/upload', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'text', maxCount: 1 }, { name: 'video', maxCount: 1 }]), (req, res) => {
    console.log("loaded");
    const username = req.session.username;
    const { text } = req.body;
  const image = req.files['photo'] ? req.files['photo'][0].filename : null;
  const video = req.files['video'] ? req.files['video'][0].filename : null;
  console.log(image);
  // Insert the data into the database
  const sql = 'INSERT INTO content (username,text, image, video) VALUES (?,?, ?, ?)';
  connection.query(sql, [username,text, image, video], (err, result) => {
    if (err) {
      throw err;
    }
    console.log('Data inserted into the database');
    res.redirect('/upload');
  });
});

app.get('/profile', (req, res) => {
    
    const query = 'SELECT username, text, image, video FROM content where username = ?'; 
    
    // Execute the SQL query
    connection.query(query,[req.session.username],(err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length === 0) {
            res.status(404).send('Content not found');
            return;
        }

        const result = results; 
        console.log(result);
       
        
        res.render('profile.ejs', {result, username : req.session.username});
    });
});


app.get('/post', (req, res) => {
  
  const query = 'SELECT username, text, image, video FROM content'; // Change the WHERE clause as needed
  
  
  connection.query(query, (err, results) => {
      if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
          return;
      }

      if (results.length === 0) {
          res.status(404).send('Content not found');
          return;
      }

      const result = results;
      console.log(result);
    
      res.render('post.ejs', {result, username : req.session.username});
  });
});


 // Logout route
     app.get('/logout', (req, res) => {
    
       req.session.destroy((err) => {
       if (err) {
        console.error('Error destroying session:', err);
       }
    
          res.redirect('/');
    });
  });



app.listen(3000,()=>{
    console.log("Server opened at 3000");
});