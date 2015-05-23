var express = require('express');
var router = express.Router();
var restler = require('restler');
var deferred = require('deferred');

router.get('/history/:network/:node/:samplingrate', function(req, res) {
	fetch("http://hydra.dei.uc.pt/supervision/api/v2/fetch/database/"+req.params.network+"/from/2015-05-21/?samplingrate="+req.params.samplingrate+"&deviceid="+req.params.node).done(function (response) {
		res.json(response);
	});

});

function fetch(url){
	var defer = deferred();
	restler.get(url)
		.on('success', function (result) {
			result = result.replace(/\"tsr\"}/g, "\"tsr\":\"null\"}");
			defer.resolve(JSON.parse(result));
		}).on('fail', function (response) {
			console.log('Failed to fetch data');
			defer.resolve(null);
		}).on('error', function (response) {
			console.log('Error in fetch data');
			defer.resolve(null);
	});

	return defer.promise;
}


module.exports = router;
