var express = require('express');
var app = express();
var path = require('path');

app.use(require('cors')());

app.use(express.static(__dirname + '/public'));
app.set('views', path.normalize(__dirname )+'/server/views');
app.set('view engine', 'jade');


app.use('/', require('./server/routes/index'));
app.use('/partials', require('./server/routes/partials'));
app.use('/api', require('./server/routes/data'));


var server = app.listen(3000, "0.0.0.0", function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);

});

