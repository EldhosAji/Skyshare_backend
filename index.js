const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const postRoute = require('./routes/post')
var bodyParser = require('body-parser')
const server = require('http').createServer(app);
let { PythonShell } = require('python-shell')
app.use(bodyParser.urlencoded({ extended: false }))
    // parse application/json
app.use(bodyParser.json())

app.use(cors());
app.options('*', cors());
//env
require('dotenv').config()
const uri = process.env.ATLAS_URI;

//connecting mongo
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("database connect")
})

//middleware


//register
app.use('/api/user', authRoutes)
app.use('/api/post', postRoute)
app.use('/', (req, res) => {
    console.log(req.body.name)
    res.send(req.body.name)
})

app.use('api/compile', (req, res) => {
    console.log("hellow");
    let code = req.body.code;
    console.log("t1")
    console.log(code)
    console.log("t2");
    PythonShell.runString(code, null, function(err, results) {
        const result = String(results);
        console.log(result)
        if (err) {
            res.send(JSON.stringify({ 'log': String(err) }))
        }
        res.send(JSON.stringify({ 'log': result }))
    });
})

app.use('/onAir', function(req, res) { res.sendFile(__dirname + '/client.html'); });

app.use('/stream', (req, res) => {
        console.log(req.body)

    })
    //created server
app.listen(8080, () => {
    console.log("Server loaded \n POST:8080")
})