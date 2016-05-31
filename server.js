var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

var salt = "$2a$12$Fg0j.x19986i9LEeOIcuTu";
var hash = crypto.createHash('sha256').update('$2a$12$Fg0j.x19986i9LEeOIcuTuVpjJ4EQnB3qUv989tgpZuJ5YiO0KFTm', 'utf8').digest("hex");

app.post('/register', function(req, res){
    salt = req.body.salt;
    hash = crypto.createHash('sha256').update(req.body.hash, 'utf8').digest("hex");
    res.send(200);
});

app.get('/getSalt', function(req, res){
    res.json({"salt": salt});
});

app.post('/login', function(req, res){
    var usersHash = crypto.createHash('sha256').update(req.body.hash, 'utf8').digest("hex");
    res.json({success: (hash == usersHash)})
});


app.listen(3000);
