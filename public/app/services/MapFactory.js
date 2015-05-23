angular.module('app').factory('MapsFactory', ['$http', '$q', function ($http, $q) {

	return{
		getInfo: function (network) {
			var defer = $q.defer();
			$http.get('http://hydra.dei.uc.pt/supervision/api/v2/info/'+network+'/').success(function(response){
				if(response.success){
					defer.resolve(response.data);
				}else{
					defer.reject('Error Fetching');
				}
			});
			return defer.promise;
		},

		getSensorData: function(network, nodeid){
			var defer = $q.defer();
			$http.get('http://hydra.dei.uc.pt/supervision/api/v2/fetch/recent/'+network+'/?deviceid='+nodeid).success(function(response){
				if(response.success){
					defer.resolve(response.data);
				}else{
					defer.reject('Error Fetching');
				}
			});
			return defer.promise;

		}


	}

}]);