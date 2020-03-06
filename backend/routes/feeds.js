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

router.post('/send', (req, res, next) => {
	let username = req.query.username;
	let image = req.query.image;
	let id = new ObjectID(image);

	let content = req.body.content;

	let data = {
		feeds : content
	}

	db.collection('images').findOneAndUpdate({"_id": id, "username": username}, {$set: data}, {upsert: false}, (err, result) => {
		if (err) {
			res.status(400)
			res.send({error: 1, message: err})
		}
		res.send({error: 0, message: "ok"})
	})
})


module.exports = router;