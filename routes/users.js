var express = require('express');
var dynode = require('dynode');
var expressJoi = require('express-joi');
var router = express.Router();
var Joi = expressJoi.Joi;

/* GET users listing. */
router.get('/', function(req, res, next) {
  dynode.listTables(console.log);
  res.send('respond with a resource');
});

module.exports = router;
