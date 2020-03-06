var express = require('express');
var router = express.Router();

function dateToString(dates) {
	var dates = new Date(dates)
	var dates = date.format(dates, 'YYYY-MM-DD HH:mm:ss')
	return dates
}

router.get('/login', (req, res, next) => {
	res.render('login', {title: "login"});
})

router.get('/register', (req, res, next) => {
	res.render('register', {title: "register"});
})

router.get('/', (req, res, next) => {
	if(!req.session.user) {
		res.redirect('/login');
	}
	let username = req.session.user;

	res.render('index', {username: username});
})

router.get('/image-details', (req, res, next) => {
	if(!req.session.user) {
		res.redirect('/login');
	}
	let username = req.session.user;
	let id = req.query.id;

	res.render('image-detail', {username: username, id: id});
})

router.get('/test', (req, res, next) => {
	res.render('test', {title: "login"});
})

module.exports = router;