var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

const bodyParser = require("body-parser");
const cors = require("cors"); // addition we make

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

var fs = require("fs");

// MongoDB
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

app.post("/", function(req, res) {
  var body = "";
  req.on("data", data => {
    body += data;
    console.log(body);
    var body1 = JSON.parse(body);

    // Writing data into file
    fs.writeFile("file.txt", body, error => {
      if (error) {
        console.log(error);
      } else {
        console.log("file successfully writed");
      }
    });
    console.log("successfully posted", body);
    res.send(body);

    // Inserting data into database
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("DemoDB");
      var myobj = { name: body1.name, age: body1.age };
      dbo.collection("person").insertOne(myobj, function(err, res) {
        if (err) throw err;
        console.log("1 document is inserted");
        db.close();
      });
    });

    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("DemoDB");
      /*Return only the documents with the age 22:*/
      var query1 = { age : "22" };
      dbo.collection("person").find(query1).toArray(function(err, result) {
        if (err) throw err;
        var result1 = JSON.stringify(result);
        console.log(`List of persons with age equal to  ${query1.age} - ${result1}`);
        db.close();
      });

      var query2 = {name: /^s/};
      dbo.collection("person").find(query2).toArray(function(err, result2) {
        if (err) throw err;
        var result3 = JSON.stringify(result2);
        console.log(`List of persons with name starting with  ${query2.name} - ${result3}`);
        db.close();
      });
    });

  });
});

app.get("/display", (req, res) => {
  console.log("request", req);
  var data = "";
  var readableStream = fs.createReadStream("./file.txt", "utf8");
  var data = " ";
  readableStream.setEncoding("UTF8");
  readableStream.on("data", function(chunck) {
    data += chunck;
  });

  readableStream.on("end", function() {
    console.log(`Readable Stream --   ${data}`);
    res.send(data);
  }); 
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
