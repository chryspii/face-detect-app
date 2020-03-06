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

function dateToString(dates) {
	var dates = new Date(dates)
	var dates = date.format(dates, 'YYYY-MM-DD HH:mm:ss')
	return dates
}

// send mail
router.post('/send-user', (req, res, next) => {
	let username = req.body.username;
	let content = req.body.content;

	var data = {
		recipient	: username,
		sender 		: 'user',
		content 	: content,
		create_at 	: new Date()
	}

	db.collection('mails').insertOne(data, (err, result) => {
		if (err) {
			res.status(400);
			res.send({error: 1, message: err});
		}
		res.send({error: 0, message: "Ok"});
	});
})

router.post('/send-admin', (req, res, next) => {
	let username = req.body.username;
	let content = req.body.content;

	var data = {
		recipient	: username,
		sender 		: 'doctor',
		content 	: content,
		create_at 	: new Date()
	}

	db.collection('mails').insertOne(data, (err, result) => {
		if (err) {
			res.status(400);
			res.send({error: 1, message: err});
		}
		res.send({error: 0, message: "Ok"});
	});
})

router.get('/views', (req, res, next) => {
	let username = req.query.username;

	db.collection('mails').find({"recipient": username}).sort({"create_at": 1}).toArray((err, result) => {
		if(err) {
			res.status(400);
			res.send({error: 1, message: err});
		}

		res.send({error: 0, result: result})
	});
})

module.exports = router;