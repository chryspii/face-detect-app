var express = require('express');
var router = express.Router();

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;
var md5 = require('md5');

// insert mongodb uri
var dbUrl = 'mongodb://'
let db

MongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
	if (err) console.log('Unable to connect to the Server', err)
	db = client.db('drhuang')
})

router.post('/register', (req, res, next) => {
	let username = req.body.username;

	db.collection('users').findOne({"username": username}, (err, result) => {
		if(err) {
			res.status(400);
			res.send({error: 1, message: err});
		}

		if(result) {
			res.send({error: 2, message: "Sorry, Username have benn used!"});
		} else {
			var data = {
				name 	  : req.body.name,
				username  : req.body.username,
				password  : md5(md5(req.body.password)),
				create_at : new Date(),
				update_at : null,
			};

			db.collection('users').insertOne(data, (err, result) => {
				if (err) {
					res.status(400);
					res.send({error: 1, message: err});
				}
				res.send({error: 0, message: "Register Successful, Please login"});
			});
		}
	});
})

router.post('/login', (req, res, next) => {
	let username = req.body.username;
	let password = md5(md5(req.body.password));

	db.collection('users').findOne({"username": username, "password": password}, (err, result) => {
		if(err) {
			res.status(400);
			res.send({error: 1, message: err});
		}

		if(result) {
			req.session.user = username;
			res.send({error: 0, message: "Succeed"});
		} else {
			res.send({error: 2, message: "Failed"});
		}
	});
})

router.get('/logout', (req, res, next) => {
	req.session.destroy();
	res.send({error: 0, message: "Succeed"});
})

router.get('/views', (req, res, next) => {
	db.collection('users').find({"username": { $ne: "admin" }}).toArray((err, result) => {
		if(err) {
			res.status(400);
			res.send({error: 1, message: err});
		}

		res.send(result);
	});
})

module.exports = router;
