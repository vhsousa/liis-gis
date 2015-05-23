angular.module('app').controller('GraphController', ['$scope', 'DataFactory', '$routeParams', function($scope, DataFactory, $routeParams) {

	var network = $routeParams.network;
	var node = $routeParams.nodeid;
	var parameter = $routeParams.parameter;
	$scope.parameter = capitalize(parameter);

	var history_series = [];
	var history_labels = [];
	$scope.options = true;
	$scope.nextRight = false;
	$scope.nextLeft = true;


	$scope.plotLeft = function () {
		console.log("Ploting to left");
		$scope.nextRight = true;
		$scope.nextLeft = false;
	};

	$scope.plotRight = function () {
		console.log("Ploting to right");
		$scope.nextLeft = true;
		$scope.nextRight = false;
	};

	DataFactory.getFullHistory(network, node, 3600).then(function (response) {
		response.forEach(function (entry) {

			var value = parseFloat(entry.data[node][parameter]);

			if(isNaN(value)){
				if(history_series.length >0)
					history_series.push(history_series[history_series.length-1]);
				else
					history_series.push(0);
			}else {
				history_series.push(value);
			}
			history_labels.push(entry.data[node]['timestamp']);

		});

		history_series.push(history_series[history_series.length-1]);
		history_labels.push("Now");

		new Chartist.Line('.ct-chart', {
			labels: history_labels,
			series: [
				{
					name: $scope.parameter,
					data: history_series
				}
			]
		},
		{ low: 0,
			showArea: true,
			axisX: {
				labelInterpolationFnc: function skipLabels(value, index) {
					if(index % 24  === 0 || value=="Now"){
						return value;
					}else{
						return null
					}
				}
			}
		});
	});

	function capitalize(s)
	{
		return s[0].toUpperCase() + s.slice(1);
	}


}]);