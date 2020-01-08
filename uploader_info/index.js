const express = require('express')
const path = require('path')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 5000

const app = express();
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

app.get('/', (req, res) => {
  res.render('pages/index', { data: ""})
});

app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  res.json({
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  });
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))