'use strict';
const dirnm = '/home/ec2-user/dev/webapp/html';

var express = require('express');
var passport = require('passport');         // Basic認証
var bodyParser = require('body-parser');    // HTMLのformの入力を取得できるモジュール
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
//var cookieParser = require('cookie-parser');
var app = express();


//データベースモック。
var db={
    users:{
      records:[{
        id:"1",
        username:"user",
        password:"password",
        name:"Hibohiboo"
      }],
      findById(id, cb) {
        process.nextTick(() => {
          var idx = id - 1;
          var record=this.records[idx];
          if (record) {
            cb(null, record);
          } else {
            cb(new Error('User ' + id + ' does not exist'));
          }
        });
      },
      findByUsername(username, cb){
        process.nextTick(()=> {
          for (var i = 0, len = this.records.length; i < len; i++) {
            var record = this.records[i];
            if (record.username === username) {
              return cb(null, record);
            }
          }
          return cb(null, null);
        });
      }
    }
  }
  
// Basic認証
app.use(passport.initialize());
passport.use(new LocalStrategy(function(username, password, cb){
    //
    db.users.findByUsername(username, function(err, user) {
        if (err) { return cb(err); }
        if (!user) { return cb(null, false); }
        if (user.password != password) { return cb(null, false); }

        return cb(null, user);
      });
}))

// セッション
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie:{
        httpOnly: true,
        maxAge: 1000 * 60 * 10              // セッションの有効時間
    }
}));
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

// セッションの有効を確認する関数
function isAuthenticated(req, res, next){
    if (req.session.username != undefined) {  // 認証済
        console.log('認証済みのログイン');
        return next();
    }
    else {  // 認証されていない
        console.log('未認証のアクセス');
        res.redirect('/login');  // ログイン画面に遷移
    }
}

// /loginにGET要求された時の動作 
app.get('/login', function(req, res){
    res.sendFile(dirnm + '/login.html');
});

// urlencodedミドルウェアのセット
app.use(bodyParser.urlencoded({ extended: true }));

// /loginにPOST要求された時の動作
app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/error',  // 失敗したときの遷移先
    }),
    function(req, res){
        req.session.username = req.body.username;
        console.log(req.body);
        res.redirect('/main');
    }
);

// /mainにGET要求された時の動作 
app.get('/main', isAuthenticated, function(req, res){
    res.sendFile(dirnm + '/main.html');
});

// /mainにGET要求された時の動作 
app.get('/error', function(req, res){
    res.sendFile(dirnm + '/error.html');
});

// /imgファイルにGET要求された時の動作
app.get('/img', isAuthenticated, function(req, res){
    res.sendFile(dirnm + '/img/' + req.query.img);
});

app.use(express.static('../website'));
app.listen(8001, ()=> {
  console.log('Express Server 01');
});

