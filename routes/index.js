var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname,'../views/index.html'));
});

module.exports = router;


/* ALEX TESTING PURPOSES */
router.get('/alexTests', function(req, res){
  res.sendFile(path.join(__dirname, '../views/ALEX_TESTING.html'));

});

 