var express = require("express");
var router = express.Router();
var moment = require("moment"); // require
const bcrypt = require("bcrypt");
var multer = require("multer");
var asyncLib = require("async");
var dateTime = require("node-datetime");
var microtime = require("microtime");
var dt = dateTime.create();
var formatted = dt.format("Y-m-d H:M:S");
var salt = 10;

var API_Key = 1234;

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/register", function (req, res, next) {
  if (req.body.key == API_Key) {
    moment.locale("fr");
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var phone = req.body.phone;
    var email = req.body.email;
    var login_type = req.body.login_type;
    var tonotify = req.body.tonotify;
    var account_type = req.body.account_type;
    var date_heure = formatted;
    
    //verifier si le compte type est client

    if (account_type == "client") {
        req.getConnection(function (err,con) {
              con.query("select * from user_app where phone=?",[phone],function ( err,rows,field){
                if (err) {
                  res.status(500);
                  res.send(JSON.stringify({ success: false, message: err.message }));
                }else{
                  if(rows.length >0){
                    res.send(
                      JSON.stringify({
                        success: false,
                        message: "Phone existe Déjà .......",
                        etat: 2,
                      })
                    );
                  }
                  else{
                    con.query(
                      "insert into user_app(nom,prenom,email,phone,statut,login_type,tonotify,creer) " +
                        "values (?,?,?,?,?,?,?,?)",
                      [lastname,firstname,email,phone,"yes",login_type,tonotify,date_heure,],
                      function (err, rows, field) {
                        if (err) {
                          res.status(500);
                          res.send(JSON.stringify({ success: false, message: err.message }));
                        } else {
                          if (rows.affectedRows > 0) {
                            res.send(JSON.stringify({success: true,message: "Success",etat: 1,user: rows[0],}));
                          } 
                          else {
                            res.send(JSON.stringify({ success: false, message: "Vide" }));
                          }
                        }
                      });
                  }
                }
              });
            
  
        })
    } else {

    }
  } else {
    res.send(JSON.stringify({ success: false, message: "Wrong API KEY" }));
  }
});

router.post("/login", function (req, res, next) {
  if (req.body.key == API_Key) {
    var phone = req.body.phone;

    req.getConnection(function (error, con) {
      asyncLib.waterfall(
        [
          function (done) {
            con.query(
              "select * from user_app where phone=?",
              [phone],
              function (err, rows, field) {
                if (err) {
                  res.status(500);
                  res.send(JSON.stringify({ success: false, etat: 0 }));
                } else {
                  if (rows.length > 0) {
                    done(null, phone);
                  }else {
                      res.send(JSON.stringify({ success: false,message:"Phone not found", etat: 2 }));
                  }
                }
              }
            );
          },
          function (phone, done) {
            con.query(
              "select * from user_app where phone=? and statut='yes'",
              [phone],
              function (err, rows, field) {
                var user = null;
                if (err) {
                  res.status(500);
                  res.send(
                    JSON.stringify({
                      success: false,
                      message: err.message,
                      etat: 0,
                    })
                  );
                } else {
                  if (rows.length > 0) {
                    user = rows[0];
                    done(null, user);
                  }else{
                    res.send(JSON.stringify({ success: false,message:"Compte non Active", etat: 2 }));
                  }
                }
              }
            );
          },
          function (user, done) {
            if (user) {
              user["user_cat"] = "client";
              user["online"] = "";
              var id_user = user.id;

              con.query(
                "select * from currency where statut='yes' limit 1",
                function (err, rows, field) {
                  if (rows.length > 0) {
                    user["currency"] = rows[0].symbole;
                    done(null, user);
                  }else{
                    done(null, user);
                  }
                }
              );
            }
          },
          function (user, done) {
            if (user) {
              con.query(
                "select * from country where statut='yes' limit 1",
                function (err, rows, field) {
                  if (rows.length > 0) {
                    user["country"] = rows[0].code;
                    done(user);
                  }else{
                    done(null, user);
                  }
                }
              );
            }
          },
        ],
        function (user) {
          if (user) {
            res.send(
              JSON.stringify({
                status: 200,
                success: true,
                message: "success",
                etat: 1,
                user: user,
              })
            );
          } else {
            res.send(JSON.stringify({ success: false, etat: 2 }));
          }
        }
      );
    });
  } else {
    res.send(JSON.stringify({ success: false, message: "Wrong API KEY" }));
  }
});

router.post("/conducteur", function (req, res, next) {
  if (req.body.key == API_Key) {
    var phone = req.body.phone;
    var password = req.body.password;
    var user;
    req.getConnection(function (error, con) {
      asyncLib.waterfall(
        [
          function (done) {
            con.query(
              "select * from conducteur where phone=?",
              [phone],
              function (err, rows, field) {
                if (err) {
                  res.status(500);
                  res.send(JSON.stringify({ success: false, etat: 0 }));
                } else {
                  if (rows.length > 0) {
                    user = rows[0];
                    done(null, user);
                  } else {
                    res.send(JSON.stringify({ success: false, etat: 0 }));
                  }
                }
              }
            );
          },
          function (user, done) {
            con.query(
              "select * from conducteur where phone=? and statut='yes'",
              [user.phone],
              function (err, rows, field) {
                if (err) {
                  res.status(500);
                  res.send(
                    JSON.stringify({
                      success: false,
                      message: err.message,
                      etat: 3,
                    })
                  );
                } else {
                  if (rows.length > 0) {
                    user = rows[0];
                    done(null, user);
                  } else {
                    res.send(JSON.stringify({ success: false, etat: 3 }));
                  }
                }
              }
            );
          },
          function (user, done) {
            if (user) {
              if (bcrypt.compare(password, user.mdp)) {
                done(null, user);
              } else {
                res.send(
                  JSON.stringify({
                    success: false,
                    message: "Mot de Passe Incorrect",
                  })
                );
              }
            }
          },
          function (user, done) {
            if (user) {
              user["user_cat"] = "conducteur";
              user["online"] = "";
              var id_user = user.id;

              con.query(
                "select * from currency where statut='yes' limit 1",
                function (err, rows, field) {
                  if (rows.length > 0) {
                    user["currency"] = rows[0].symbole;
                    done(null, user);
                  } else {
                    res.send(
                      JSON.stringify({
                        success: false,
                        message: "monnaie not found",
                      })
                    );
                  }
                }
              );
            }
          },
          function (user, done) {
            if (user) {
              con.query(
                "select * from country where statut='yes' limit 1",
                function (err, rows, field) {
                  if (rows.length > 0) {
                    user["country"] = rows[0].code;
                    done(null, user);
                  } else {
                    res.send(
                      JSON.stringify({
                        success: false,
                        message: "Pays not found",
                      })
                    );
                  }
                }
              );
            }
          },
          function (user, done) {
            if (user) {
              con.query(
                "select * from vehicule where statut='yes' AND id_conducteur=?",
                [user.id],
                function (err, rows, field) {
                  if (rows.length > 0) {
                    user["brand"] = rows[0].brand;
                    user["model"] = rows[0].model;
                    user["color"] = rows[0].color;
                    user["numberplate"] = rows[0].numberplate;

                    done(user);
                  } else {
                    res.send(
                      JSON.stringify({
                        success: false,
                        message: "Voiture not found",
                      })
                    );
                  }
                }
              );
            }
          },
        ],
        function (user) {
          if (user) {
            res.send(
              JSON.stringify({
                status: 200,
                success: true,
                message: "success",
                etat: 1,
                user: user,
              })
            );
          } else {
            res.send(JSON.stringify({ success: false, etat: 2 }));
          }
        }
      );
    });
  } else {
    res.send(JSON.stringify({ success: false, message: "Wrong API KEY" }));
  }
});

router.post("uploadImage", function (req, res, next) {});

router.post("/majprofile", function (req, res, next) {
  if (req.body.key == API_Key) {
    moment.locale("fr");
    var user_id = req.body.user_id;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var phone = req.body.phone;
    var email = req.body.email;
    var account_type = req.body.account_type;
    var date_heure = formatted;
    var mdp;

    if (account_type === "client") {
      req.getConnection(function (error, con) {
        con.query(
          "update user_app set nom=?,prenom=?,phone=?,email=?,modifier=? where id=?",
          [lastname, firstname, phone, email, date_heure, user_id],
          function (err, rows, field) {
            if (rows.affectedRows > 0) {
              res.send(
                JSON.stringify({ success: true, etat: 1, message: "Success" })
              );
            } else {
              res.send(JSON.stringify({ error: err }));
            }
          }
        );
      });
    } else {
      req.getConnection(function (error, con) {
        con.query(
          "update conducteur set nom=?,prenom=?,phone=?,email=?,modifier=? where id=?",
          [lastname, firstname, phone, email, date_heure, user_id],
          function (err, rows, field) {
            if (rows.affectedRows > 0) {
              res.send(
                JSON.stringify({ success: true, etat: 1, message: "Success" })
              );
            } else {
              res.send(JSON.stringify({ error: err }));
            }
          }
        );
      });
    }
  } else {
    res.send(JSON.stringify({ success: false, message: "Wrong API KEY" }));
  }
});

router;

module.exports = router;
