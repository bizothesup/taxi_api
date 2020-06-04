var express = require('express');
var router = express.Router();
var moment = require('moment'); // require
const bcrypt = require('bcrypt');
var asyncLib = require('async');
var dateTime = require('node-datetime');
var dt = dateTime.create();
var formatted = dt.format('Y-m-d H:M:S');
var salt =10;

var API_Key =1234;

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.post('/register',function (req,res,next) {
    if(req.body.key == API_Key){
            moment.locale('fr');
      var firstname      =req.body.firstname;
      var lastname       =req.body.lastname;
      var phone          =req.body.phone;
      var password       =req.body.password;
      var email          =req.body.email;
      var login_type     =req.body.login_type;
      var tonotify       =req.body.tonotify;
      var account_type   =req.body.account_type;
      var date_heure     =formatted;
      var mdp;
      //verifier si le compte type est client

      if(account_type == "client"){
            req.getConnection(function (error,con) {
               con.query('select * from user_app where phone=?',[phone],function (err,rows,field) {
                   if(err){
                       res.status(500);
                       res.send(JSON.stringify({success:false,message:err.message}))
                   }else {
                       if(rows.length >0){
                           if(login_type != phone && rows['login_type']==login_type){
                               var user = rows[0].reduce(mdp);
                               res.send(JSON.stringify({success:false,message:"Social Login",etat:1,user: user}))
                           }else{
                               res.send(JSON.stringify({success:false,message:"Phone existe Déjà .......",etat:2}))
                           }
                       }else {
                           mdp= bcrypt.hashSync(password, 10);

                           console.log(mdp);
                           con.query('insert into user_app(nom,prenom,email,phone,mdp,statut,login_type,tonotify,creer) ' +
                               'values (?,?,?,?,?,?,?,?,?)',[lastname,firstname,email,phone,mdp,'yes',login_type,tonotify,date_heure],
                               function (err,rows,field) {
                                   if(err){
                                       res.status(500);
                                       res.send(JSON.stringify({success:false,message:err.message}))
                                   }else{
                                       if(rows.affectedRows > 0){
                                           res.send(JSON.stringify({success:true,message:"Success",etat:1,user:rows[0]}))
                                       }else {
                                           res.send(JSON.stringify({success:false,message:"Vide"}))
                                       }
                                   }
                               });
                       }
                   }
               })
            })
      }else{
            //Conducteur
          req.getConnection(function (error,con) {
              con.query('select * from conducteur where phone=?',[phone],function (err,rows,field) {
                  if(err){
                      res.status(500);
                      res.send(JSON.stringify({success:false,message:err.message}))
                  }else {
                      if(rows.length >0){
                          if(login_type != 'phone' && rows['login_type']==login_type){
                              var user = rows[0].reduce(mdp);
                              res.send(JSON.stringify({success:false,message:"Social Login",etat:1,user: user}))
                          }else{
                              res.send(JSON.stringify({success:false,message:"Phone existe Déjà .......",etat:2}))
                          }
                      }else {
                          mdp= bcrypt.hashSync(password, 10);

                           con.query('insert into conducteur(online,nom,prenom,phone,mdp,statut,login_type,tonotify,creer,statut_licence,statut_nic,statut_vehicule,email) ' +
                              'values (?,?,?,?,?,?,?,?,?,?,?,?,?)',['yes',lastname,firstname,phone,mdp,'no',login_type,tonotify,date_heure,'no','no','no',email],
                              function (err,rows,field) {
                                  if(err){
                                      res.status(500);
                                      res.send(JSON.stringify({success:false,message:err.message}))
                                  }else{
                                      if(rows.affectedRows > 0){

                                          con.query('select * from conducteur where id=?',[rows.insertId],function (err,rows,field) {

                                              if(err){
                                                  res.status(500);
                                                  res.send(JSON.stringify({success:false,message:err.message}))
                                              }else{
                                                  if(rows.length > 0){
                                                      res.send(JSON.stringify({success:true,message:"Success",etat:1,user:rows[0]}))
                                                  }
                                              }

                                          });

                                      }else {
                                          res.send(JSON.stringify({success:false,message:"Vide"}))
                                      }
                                  }
                              });
                      }
                  }
              })
          })
      }
    }else{
      res.send(JSON.stringify({success:false,message:"Wrong API KEY"}))
    }
});

router.post('/login',function (req,res,next) {
    if(req.body.key == API_Key) {
        var phone = req.body.phone;
        var password = req.body.password;

        req.getConnection(function (error,con) {
            asyncLib.waterfall([
                function(done){
                    con.query('select * from user_app where phone=?',[phone],function (err,rows,field) {
                        if(err){
                            res.status(500);
                            res.send(JSON.stringify({success:false,etat:0}));
                        }else {
                            if(rows.length > 0){
                                done(null,phone)
                            }
                        }
                    })
                },
                function(phone,done){
                    con.query("select * from user_app where phone=? and statut='yes'",[phone],function (err,rows,field) {
                        var user=null;
                        if(err){
                            res.status(500);
                            res.send(JSON.stringify({success:false,message:err.message,etat:3}))
                        }else {
                            if(rows.length > 0){
                                user =rows[0];
                                done(null,user)
                            }
                        }
                    })
                },
                function(user, done){
                    if(user){
                        if(bcrypt.compare(password, user.mdp)){
                            done(null,user)
                        }else {
                            res.send(JSON.stringify({success: false, message: "Mot de Passe Incorrect"}))
                        }
                    }
                },
                function(user, done){
                    if(user){
                        user['user_cat'] = 'client';
                        user['online'] = '';
                        var id_user = user.id;

                        con.query("select * from currency where statut='yes' limit 1",function (err,rows,field) {
                            if (rows.length > 0){
                                user['currency']=rows[0].symbole;
                                done(null,user)
                            }
                        });
                    }
                },
                function(user, done){
                    if(user){
                        con.query("select * from country where statut='yes' limit 1",function (err,rows,field) {
                            if (rows.length > 0){
                                user['country']=rows[0].code;
                                done(user)
                            }
                        })
                    }
                }
            ],function (user) {
                if (user){
                    res.send(JSON.stringify({status: 200,success:true,message:"success",etat:1,user:user}));
                } else {
                    res.send(JSON.stringify({success:false,etat:2}));
                }
            });
        })

    }else{
        res.send(JSON.stringify(({success:false,message:"Wrong API KEY"})));
    }

});

router.post('/conducteur',function (req,res,next) {
    if(req.body.key == API_Key) {
        var phone = req.body.phone;
        var password = req.body.password;
        var user;
        req.getConnection(function (error,con) {
            asyncLib.waterfall([
                function(done){
                    con.query('select * from conducteur where phone=?',[phone],function (err,rows,field) {
                        if(err){
                            res.status(500);
                            res.send(JSON.stringify({success:false,etat:0}));
                        }else {
                            if(rows.length > 0){
                                user=rows[0];
                                done(null,user);
                            }else{
                                res.send(JSON.stringify({success:false,etat:0}));
                            }
                        }
                    })
                },
                function (user,done) {
                    con.query("select * from conducteur where phone=? and statut='yes'",[user.phone],function (err,rows,field) {
                        if(err){
                            res.status(500);
                            res.send(JSON.stringify({success:false,message:err.message,etat:3}))
                        }else {
                            if(rows.length > 0){
                                user =rows[0];
                                done(null,user)
                            }else{
                                res.send(JSON.stringify({success:false,etat:3}));
                            }
                        }
                    });
                },function(user, done){
                    if(user){
                        if(bcrypt.compare(password, user.mdp)){
                            done(null,user)
                        }else {
                            res.send(JSON.stringify({success: false, message: "Mot de Passe Incorrect"}))
                        }
                    }
                },function(user, done){
                    if(user){
                        user['user_cat'] = 'conducteur';
                        user['online'] = '';
                        var id_user = user.id;

                        con.query("select * from currency where statut='yes' limit 1",function (err,rows,field) {
                            if (rows.length > 0){
                                user['currency']=rows[0].symbole;
                                done(null,user)
                            }else {
                                res.send(JSON.stringify({success:false,message:"monnaie not found"}))
                            }
                        });
                    }
                },function(user, done){
                    if(user){
                        con.query("select * from country where statut='yes' limit 1",function (err,rows,field) {
                            if (rows.length > 0){
                                user['country']=rows[0].code;
                                done(null,user)
                            }else {
                                res.send(JSON.stringify({success:false,message:"Pays not found"}))
                            }
                        })
                    }
                },
                function(user, done){
                    if(user){
                        con.query("select * from vehicule where statut='yes' AND id_conducteur=?",[user.id],function (err,rows,field) {
                            if (rows.length > 0){
                                user['brand'] = rows[0].brand;
                                user['model'] = rows[0].model;
                                user['color'] = rows[0].color;
                                user['numberplate'] = rows[0].numberplate;

                                done(user)
                            }else {
                                res.send(JSON.stringify({success:false,message:"Voiture not found"}))
                            }
                        })
                    }
                }
            ],function (user) {
                if (user){
                    res.send(JSON.stringify({status: 200,success:true,message:"success",etat:1,user:user}));
                } else {
                    res.send(JSON.stringify({success:false,etat:2}));
                }
            });
        })

    }else{
        res.send(JSON.stringify(({success:false,message:"Wrong API KEY"})));
    }

});

module.exports = router;
