const express = require('express')
const path = require('path')
var fs = require('fs');
require('dotenv').config();
const validator = require('validator')

const PORT = process.env.PORT || 5000
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bodyParser = require('body-parser');

const app = express();
mongoose.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com', '*'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
      // console.log(origin);
      res.set({
        "Access-Control-Allow-Origin" : origin,
        "Access-Control-Allow-Methods" : "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers" : "Origin, X-Requested-With, Content-Type, Accept"
      });

      if ('OPTIONS' === req.method) {
        //respond with 200
        res.send(200);
      }
    }
    next();
  });
}

var rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

app.use(bodyParser.json({ verify: rawBodySaver }));
app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(bodyParser.raw({ verify: rawBodySaver, type: function () { return true } }));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, maxlength: 20, unique: true }
});
const User = mongoose.model('GymUsers', userSchema);

const logSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});
const Log = mongoose.model('GymLog', logSchema);

app.post("/api/exercise/new-user", (req, res, next) => {
  const newUser = new User({username: req.body.username});

  newUser.save((err, data) => {
    if (err) {
      if (err.code === 11000) {
        return res.json({
          status: 400,
          message: 'username already taken'
        });
      }

      if (err.errors &&
        err.errors.username &&
        err.errors.username['$isValidatorError'] &&
        err.errors.username.kind == 'maxlength') {
        return res.json({
          status: 400,
          message: 'username too long'
        });
      }

      return next(err);
    }

    res.json({
      username: data.username,
      _id: data._id
    });
  });
});

app.post("/api/exercise/add", (req, res, next) => {
  User.findById(req.body.userId, 'username', { lean: true }, function (err, user) {
    if (err) {
      if (err.name == 'CastError' &&
          err.kind == 'ObjectId' &&
          err.path == '_id') {
        return res.json({
          status: 400,
          message: 'unknown _id'
        });
      }

      console.log('Error finding user _id:\n', err);
      return next(err);
    }
    
    if (!user) return res.json({
      status: 400,
      message: 'unknown _id'
    });

    const entry = {
      userId: req.body.userId,
      description: req.body.description,
      duration: req.body.duration
    };

    if (req.body.date) entry.date = req.body.date;
    const exercise = new Log(entry);

    exercise.save(function (err, exercise) {
      if (err) return next(err);
      res.json({
        username: user.username,
        _id: user._id,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      });
    });
  });
});

app.get("/api/exercise/log", function (req, res, next) {

  if (!req.query.userId) return res.json({
    status: 400,
    message: 'unknown userId'
  });

  User.findById(req.query.userId, 'username', {lean: true}, function (error, user) {
    if (error) {
      if (error.name == 'CastError' &&
          error.kind == 'ObjectId' &&
          error.path == '_id') {
        return res.json({
          status: 400,
          message: 'unknown userId'
        });
      }

      console.log('Error finding user _id:\n', error);
      return next(error);
    }

    if (!user) return res.json({
      status: 400,
      message: 'unknown userId'
    });

    const msg = {
      _id: user._id,
      username: user.username
    };

    const filter = {userId: req.query.userId};

    if (req.query.from) {
      const from = new Date(req.query.from);
      if (!isNaN(from.valueOf())) {
        filter.date = {'$gt': from};
        msg.from = from.toDateString();
      }
    }

    if (req.query.to) {
      const to = new Date(req.query.to);
      if (!isNaN(to.valueOf())) {
        if (!filter.date) filter.date = {};
        filter.date['$lt'] = to;
        msg.to = to.toDateString();
      }
    }

    const fields = 'description duration date';
    const options = {sort: {date: -1}};
    const query = Log.find(filter, fields, options).lean();

    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      if (limit) query.limit(limit);
    }

    query.exec(function(error, posts) {
      if (error) return next(error);

      for (let post of posts) {
        delete post._id;
        post.date = post.date.toDateString();
      }

      msg.count = posts.length;
      msg.log = posts;
      res.json(msg);
    });
  });
});

app.get('/', (req, res) => {
  res.render('pages/index', { data: ""})
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))