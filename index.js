var API_HOST = 'localhost';
var API_PORT = 8080;

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
var proxy = httpProxy.createProxyServer({
  target: {
    host: API_HOST,
    port: API_PORT
  }
});

var proxyServer = http.createServer(function (req, res) {
  proxy.web(req, res);
});

proxyServer.on('upgrade', function (req, socket, head) {
  proxy.ws(req, socket, head);
});

app.use('/', proxyServer);

var server = http.createServer(app);
server.listen(8081);
