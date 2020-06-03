var express = require('express');
var router = express.Router();
var moment = require('moment'); // require

var API_Key =1234;

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.post('/register',function (req,res,next) {
    if(req.body.key == API_Key){

      var firstname      =req.body.firstname;
      var lastname       =req.body.lasttname;
      var phone          =req.body.phone;
      var password       =req.body.password;
      var login_type     =req.body.login_type;
      var tonotify       =req.body.tonotify;
      var account_type   =req.body.account_type;
      var date_heure     =moment.format(llll);

      //verifier si le compte type est client

      if(account_type == "client"){
         req.getConnection(function (error,conn) {
             conn.query()
         })
      }


    }
});

module.exports = router;
