require("dotenv").config();
const fs = require('fs');
const formData = require("express-form-data");
const exec = require('child_process').execFile;
const mkdirp = require('mkdirp')
const cors = require("cors");
const helmet = require("helmet");
const allRoutes = require("./routes");
const errorHandler = require("./src/middlewares/error");
const express = require('express');
const app = express();
const models = require("./src/models");

// /**Comment when docker the image */
// //create new folder data/db in window disk (disk C)
// mkdirp.sync('/data/db');
// //start db server
// exec('./node_modules/storage/mongod.exe', function (err, data) {
//   // console.log(err);
// });

//Setup Parse server
const ParseServer = require('parse-server').ParseServer;
const config = {
  cloud: './cloud/main.js',
  databaseURI: process.env.DATABASE_URI || 'mongodb://localhost:27017',
  appId: process.env.APP_ID || 'APPLICATION_ID',
  masterKey: process.env.MASTER_KEY || 'MASTER_KEY',
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
  allowClientClassCreation: true,
  liveQuery: {
    classNames: ['_Installation']
  }
};
const api = new ParseServer(config);
app.use("/parse", api);

app.use(helmet());
app.get('/', function (req, res) {
  res.status(200).send('Welcome to Augmenteed');
});
app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

//Set cors config
const corsConfig = {
  origin: true,
  credentials: true,
};
app.use(cors(corsConfig));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// parse data with connect-multiparty.
app.use(formData.parse({}));
// delete from the request all empty files (size == 0)
app.use(formData.format());
// union the body and the files
app.use(formData.union());
app.use("/api/", allRoutes);
app.use(errorHandler);

if (process.env.NODE_ENV != "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const https_options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
let httpServer = require('https').createServer(https_options, app);

const port = process.env.PORT || 1337;
httpServer.listen(port, function () {
  console.log('server is running on port ' + port + '.');
  //initial schemas (classes - data models)
  setTimeout(function () {
    models.initialDBSchema();
    console.log('Server was setup completely.');
  }, 3000);
});
ParseServer.createLiveQueryServer(httpServer);

module.exports = app

