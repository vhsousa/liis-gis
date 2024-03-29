var express = require('express');
var router = express.Router();
var restler = require('restler');
var deferred = require('deferred');

router.get('/history/:network/:node/:samplingrate', function(req, res) {
	fetch("http://hydra.dei.uc.pt/supervision/api/v2/fetch/database/"+req.params.network+"/from/2015-05-29%2000:00:00/?samplingrate="+req.params.samplingrate+"&deviceid="+req.params.node).done(function (response) {
		res.json(response);
	});
});

router.get('/heatmap/:network/:hour/:day/:month/:year', function (req, res) {
	fetch("http://hydra.dei.uc.pt/supervision/api/v2/fetch/database/"+req.params.network+"/between/"+req.params.year+"-"+req.params.month+"-"+req.params.day+"%20"+req.params.hour+":00:00/"+req.params.year+"-"+req.params.month+"-"+req.params.day+"%20"+req.params.hour+":30:00/?samplingrate=900&heatmap=temperature",req.params.node).done(function (response) {
		res.json(response);
	});
});

router.get('/recent/:network/:node', function(req,res){
	fetch("http://hydra.dei.uc.pt/supervision/api/v2/fetch/recent/"+req.params.network+"?deviceid="+req.params.node,req.params.node).done(function (response) {
		res.json(response);
	});
});



function fetch(url, node){
	var defer = deferred();
	restler.get(url)
		.on('success', function (result) {
			result = result.replace(/\"tsr\"}/g, "\"tsr\":\"null\"}");
			result = result.replace(/\bNaN\b/g, "null");
			result = JSON.parse(result);


			if (result == null || result =='null' || (node != null && (isNaN(result.data['temperature']) || result.data['temperature']=='nan'))) {
				console.log('Retrying fetch');
				console.log(result.data);
				this.retry(250);
				return;
			}

			defer.resolve(result);
		}).on('fail', function (response) {
			console.log('Failed to fetch data');
			defer.resolve(response);
		}).on('error', function (response) {
			console.log('Error in fetch data');
			defer.resolve(response);
	});

	return defer.promise;
}


module.exports = router;
