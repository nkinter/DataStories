var express = require('express');
var dynode = require('dynode');
var expressJoi = require('express-joi');
var router = express.Router();
var crypto = require('crypto');
var Joi = expressJoi.Joi;

/* GET users listing. */
router.get('/', function(req, res, next) {
  dynode.listTables(function(err, result) {
    console.log("this is my return: " + result.TableNames[0]);
    res.render('users', {table: result});
  });
});

router.get('/register', function(req, res, next) {
    res.render('register');
});

router.post('/register/submit', function(req, res, next) {
    if (req.body.password1!==req.body.password2) {
        res.send("Passwords not the same. Try Again");
    } else {

        var genRandomString = function(length){
            return crypto.randomBytes(Math.ceil(length/2))
                .toString('hex') /** convert to hexadecimal format */
                .slice(0,length);   /** return required number of characters */
        };

        var sha512 = function(password, salt){
            var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
            hash.update(password);
            var value = hash.digest('hex');
            return {
                salt:salt,
                passwordHash:value
            };
        };

        function saltHashPassword(userpassword) {
            var salt = genRandomString(16); /** Gives us salt of length 16 */
            var passwordData = sha512(userpassword, salt);
            console.log('UserPassword = '+userpassword);
            console.log('Passwordhash = '+passwordData.passwordHash);
            console.log('nSalt = '+passwordData.salt);
            return [passwordData.passwordHash, passwordData.salt];
        }

        var hashedPassword = saltHashPassword(req.body.password1);

        var newUser = {
            user_id:req.body.username,
            email:req.body.email,
            password:hashedPassword[0],
            salt:hashedPassword[1]
        };

        var opts = {AttributesToGet: ["user_id"], ConsistentRead : true};
        dynode.getItem("ve_users", req.body.username, opts, function(err, result) {
            if (err) {
                console.log(err);
                res.render('register', {message: "Error adding user."});
            }
            console.log(req.body.username);
            console.log(result);
            if (result!==null){
                res.render('register', {message: "Username already exists. Please try again."});
            } else {
                dynode.putItem("ve_users", newUser, function(err, result) {
                    if (err) res.render('register', {message: "Error adding user - " + err.toString()});
                    console.log(result);
                    req.session.user = {username: newUser.user_id, email: newUser.email};
                    res.render('protectedpage', {message: "You have a session", username: req.session.user.username});
                });
            }
        });
    }
});

router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login' });
});

router.post('/login/auth', function(req, res, next) {
    if(!req.body.username || !req.body.password){
        res.render('login', {message: "Please enter both email and password"});
    } else {

        var opts = {AttributesToGet: ["salt","password", "user_id", "email"], ConsistentRead : true};
        dynode.getItem("ve_users", req.body.username, opts, function(err, result) {
            if (err) {
                res.render('login', {message: "Invalid credentials!"});
            }
            else {
                console.log(req.body.username);
                console.log(result);
                if (result===null){
                    res.render('login', {message: "Invalid credentials!"});
                } else {
                    var hash = crypto.createHmac('sha512', result["salt"]);
                    hash.update(req.body.password);
                    if (hash.digest('hex')===result["password"]){
                        console.log('Success');
                        req.session.user = {username: result["user_id"], email: result["email"]};
                        res.render('protectedpage', {message: "You have a session", username: req.session.user.username});
                    } else {
                        res.render('login', {message: "Invalid credentials!"});
                    }
                }
            }
        });
    }
});

router.get('/logout', function(req, res, next){
    req.session.destroy(function(err) {
        res.render('index',{title: "Visual Essays", message: "You have successfully logged out"})
    })
});


module.exports = router;
