var express = require('express');
var router = express.Router();
var restler = require('restler');
var deferred = require('deferred');

router.get('/history/:network/:node/:samplingrate', function(req, res) {
	fetch("http://hydra.dei.uc.pt/supervision/api/v2/fetch/database/"+req.params.network+"/from/2015-05-20/?samplingrate="+req.params.samplingrate+"&deviceid="+req.params.node).done(function (response) {
		res.json(response);
	});
});

router.get('/heatmap/:network/:hour/:day/:month/:year', function (req, res) {
	fetch("http://hydra.dei.uc.pt/supervision/api/v2/fetch/database/"+req.params.network+"/between/"+req.params.year+"-"+req.params.month+"-"+req.params.day+"%20"+req.params.hour+":00:00/"+req.params.year+"-"+req.params.month+"-"+req.params.day+"%20"+req.params.hour+":30:00/?samplingrate=900&heatmap=temperature").done(function (response) {
		res.json(response);
	});
});

router.get('/recent/:network/:node', function(req,res){
	fetch("http://hydra.dei.uc.pt/supervision/api/v2/fetch/recent/"+req.params.network+"?deviceid="+req.params.node).done(function (response) {
		if(isNaN(response.data['temperature']) || response.data['temperature']=='nan'){
			this.retry(250);
			return;
		}
		res.json(response);
	});
});


function fetch(url){
	var defer = deferred();
	restler.get(url)
		.on('success', function (result) {
			result = result.replace(/\"tsr\"}/g, "\"tsr\":\"null\"}");
			result = result.replace(/\bNaN\b/g, "null");
			result = JSON.parse(result);

			if (result == null || result =='null') {
				this.retry(250);
				return;
			}

			defer.resolve(result);
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
