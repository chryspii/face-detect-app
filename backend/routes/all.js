const express = require('express');
const router = express.Router();

router.get('/login', (req, res, next) => {
	res.render('app/login', {title: "login"});
})

module.exports = router;