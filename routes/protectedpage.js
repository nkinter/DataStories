var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.session.user){
        console.log(req.session.user);
        res.render('protectedpage', {username: req.session.user.username})
    } else {
        var err = new Error("Not logged in!");
        console.log(err);
        res.render('login', {message: "Please login to access this page."});
    }
});

module.exports = router;