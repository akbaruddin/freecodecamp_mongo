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

const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

const autoincSchema = new Schema({
  _idNumber: String,
  seq: Number
});

const autoId = mongoose.model("lastlink", autoincSchema);

const URL_CONVERSION = mongoose.model("URLconversion", urlSchema);
// create first time;
// autoId.create({'_idNumber': "userid", "seq": 0});

async function getNextSequence(id, done) {
  await autoId.updateOne({"_idNumber": id},{ $inc: { seq: 1} }, {
    new: true
  });

  let doc;
  await autoId.findOne({"_idNumber": id}, function(err, newSeq) {
    if (err) return console.log(err);
    // console.log(newSeq)
    done(null, newSeq);
  })
  return doc;
}

app.post("/api/shorturl/new", async (req, res) => {
  if (!validator.isURL(req.body.url)) {
    res.json({"error":"invalid URL"});
  } else {
    await getNextSequence("userid", function(err, data) {
      URL_CONVERSION.create({ original_url: req.body.url, short_url: data.seq });
      res.json({ original_url: req.body.url, short_url: data.seq })
    })
  }
})


app.get('/api/shorturl/:param', async (req, res) => {
  console.log(req.params.param);
  if (!Object.keys(req.params).length) {
    res.render('pages/index', { data: ""})
  }

  await URL_CONVERSION.findOne({ short_url : Number(req.params.param)}, function(err, newSeq) {
    if (err) return res.render('pages/index', { data: "err" });

    console.log(newSeq)
    res.render('pages/index', { data: newSeq.original_url, fetch: true })
  })
})



app.listen(PORT, () => console.log(`Listening on ${ PORT }`))