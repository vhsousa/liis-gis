/**
 * Created by vhsousa on 22/05/15.
 *http://hydra.dei.uc.pt/supervision/api/v2/fetch/database/liis_wsn01/until/2015-05-22/?samplingrate=3600
 */


angular.module('app').factory('DataFactory', ['$http', '$q', function ($http, $q) {

	return {
		getFullHistory: function (network, node, samplingrate) {
			var defer = $q.defer();
			$http.get("/api/history/"+network+"/"+node+"/"+samplingrate)
				.success(function (response) {
					if(response.success){
						defer.resolve(response.data);
					}else{
						defer.reject(response.message);
					}
				});
			return defer.promise;
		}
	}

}]);