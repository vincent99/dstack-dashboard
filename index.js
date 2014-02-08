var http = require('http');
var express = require('express');
var hbs = require('express-hbs');
var httpProxy = require('http-proxy');


var app = express();

// Use `.hbs` for extensions and find partials in `views/partials`.
app.engine('hbs', hbs.express3({
    //partialsDir: __dirname + '/partials'
    defaultLayout: __dirname + '/views/layout.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

// Static files
app.use(express.static(__dirname + '/public'));

// Index page
app.get('/', function(req, res, next) {
  res.render('index');
});

// API
var proxy = httpProxy.createProxyServer({});

var proxyServer = http.createServer(function (req, res) {
  var host = req.headers['x-api-host'] || 'localhost:8080';
  proxy.web(req, res, {target: 'http://'+host});
});

proxy.on('error', function(err) {
  console.log('Proxy Error:', err);
});

proxyServer.on('error', function(err) {
  console.log('Server Error: ', err);
});

app.use('/', proxyServer);

var server = http.createServer(app);
server.listen(8081);
