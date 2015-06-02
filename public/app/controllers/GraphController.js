angular.module('app').controller('GraphController', ['$scope', '$interval', 'DataFactory', '$routeParams', 'blockUI', function($scope,$interval, DataFactory, $routeParams, blockUI) {
	blockUI.start();
	var network = $routeParams.network;
	var node = $routeParams.nodeid;
	var parameter = $routeParams.parameter;


	$scope.parameter = capitalize(parameter);

	var history_series = [];
	var history_labels = [];

	var series = [];
	var series_index = 0;

	$scope.toPlot = {};



	$scope.plotLeft = function () {
		$interval.cancel($scope.interval);
		++series_index;
		var date = series[series_index].name.toString().split(" ");
		$scope.splitTitle = date[1]+" "+date[2]+" "+date[3];
		$scope.nextLeft = series_index<series.length-1;
		$scope.nextRight = series_index > 0;

		if(series[series_index].name.toString() =="Now"){
			$scope.options = false;
			plot(series[series_index].labels, series[series_index].name, series[series_index].data, true);
		}
		else{
			$scope.options = true;
			plot(series[series_index].labels, series[series_index].name, series[series_index].data, false);
		}
	};

	$scope.plotRight = function () {
		$interval.cancel($scope.interval);
		--series_index;
		if(series[series_index].name.toString() !="Now"){
			var date = series[series_index].name.toString().split(" ");
			$scope.splitTitle = date[1]+" "+date[2]+" "+date[3];
		}else{
			$scope.splitTitle = "Realtime";
		}
		$scope.nextLeft = series_index>=0;
		$scope.nextRight = series_index>0;


		if(series[series_index].name.toString() =="Now"){
			$scope.options = false;
			plot(series[series_index].labels, series[series_index].name, series[series_index].data, true);
		}
		else{
			$scope.options = true;
			plot(series[series_index].labels, series[series_index].name, series[series_index].data, false);
		}

	};



	DataFactory.getFullHistory(network, node, 3600).then(function (response) {
		var lastTimestamp;
		var numOfDays = 0;
		var sample_series = [];
		var sample_labels = [];

		response.forEach(function (entry) {


			var bits = entry.data[node]['timestamp'].split(/\D/);

			var timestamp = new Date(bits[0], --bits[1], bits[2], bits[3], bits[4], bits[5]);


			if(lastTimestamp==null || dateDiffInDays(lastTimestamp, timestamp)>=1){
				if(lastTimestamp!=null){
					//FIXME: Copy the last elements if there are more then 20 values. Otherwise, remove the number of elements that are left
					if(sample_labels.length>=20 && sample_labels.length<24){
						var samples = sample_series.slice(sample_series.length-(24-sample_series.length));
						//console.log('Copying samples', lastTimestamp, sample_labels.length, samples.length);
						history_series.push(samples);
						sample_series.push(samples);
						var label = sample_labels[(sample_labels.length-(24-sample_labels.length))-1];
						while(sample_labels.length<24){
							history_labels.push(new Date(label.getTime()+1000));
							sample_labels.push(new Date(label.getTime()+1000));
							label = sample_labels[(sample_labels.length-(24-sample_labels.length))-1];
						}
					}else if(sample_series.length<20){
						//console.log('Over sample', lastTimestamp, sample_series.length, history_series.length);
						history_series = history_series.slice(0, history_series.length-sample_series.length);
						//console.log('After resample', history_series.length);
						history_labels = history_labels.slice(0, history_labels.length-sample_labels.length);
						sample_series = [];
						sample_labels = [];
					}

					if(sample_labels.length>=24){
						++numOfDays;
						//console.log(lastTimestamp, sample_labels.length);
						series.unshift({name:lastTimestamp, data:sample_series, labels:sample_labels});
					}

					sample_series = [];
					sample_labels = [];
				}
				lastTimestamp = timestamp;

			}

			var value = parseFloat(entry.data[node][parameter]);
			if(isNaN(value)){
				if(history_series.length > 0){
					history_series.push(history_series[history_series.length-1]);
					sample_series.push(history_series[history_series.length-1]);
				}else{
					history_series.push(0);
					sample_series.push(0);
				}
			}else {
				history_series.push(value);
				sample_series.push(value);
			}
			history_labels.push(timestamp);
			sample_labels.push(timestamp);

		});

		//console.log(history_series.length, history_labels.length, numOfDays);

		series.unshift({name:"Now", data:history_series.slice((numOfDays*24)+1), labels:history_labels.slice((numOfDays*24)+1)});
		history_labels[history_labels.length-1] = "<b>Now</b>";

		new Chartist.Line('#ct-chart-timeline', {
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
					try {
						if(value == "<b>Now</b>")
							return value;

						if (value!= null && index % 24 == 0) {
							var date = value.toString().split(" ");

							return "<b>"+date[1]+" "+date[2]+" "+date[3]+"</b>";
						}else{
							return ""
						}

					} catch (ex) {
						console.log(ex);
						return ""
					}
				}
			}
		});

		$scope.splitTitle = "Realtime";
		$scope.options = false;
		$scope.nextRight = false;
		$scope.nextLeft = true;

		plot(series[0].labels, series[0].name, series[0].data, true);
	});




	function capitalize(s)
	{
		return s[0].toUpperCase() + s.slice(1);
	}

	var _MS_PER_DAY = 1000 * 60 * 60 * 24;

	function dateDiffInDays(a, b) {
		// Discard the time and time-zone information.
		var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
		var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

		return Math.floor((utc2 - utc1) / _MS_PER_DAY);
	}
	$scope.realTimeData = [];
	$scope.realTimeLabels = [];
	function plot(labels, name, data, realtime){

		if(realtime){
			var difference = 0;
			$scope.realTimeData = [];
			$scope.realTimeLabels = [];
			plotRealTime(labels.concat($scope.realTimeLabels),data.concat($scope.realTimeData));
			$scope.interval = $interval(function () {
				DataFactory.getRecent(network,node).then(function(response){
					var threshold = $("#threshold").val();
					//console.log(response);
					$scope.realTimeData.push(response[parameter]);
					$scope.realTimeLabels.push(response['timestamp']);

					var len = labels.concat($scope.realTimeLabels).length;
					if(len>threshold){
						difference = len - threshold;
					}

					plotRealTime(labels.concat($scope.realTimeLabels).slice(difference, len),data.concat($scope.realTimeData).slice(difference, len))
				});
			},5000);

			$scope.$on('$destroy', function () {
				$interval.cancel($scope.interval);
			});

		}else{

			new Chartist.Line('#ct-chart-split', {
					labels: labels,
					series: [
						{
							name: name,
							data: data
						}
					]
				},
				{ low: 0,
					showArea: true,
					axisX: {
						labelInterpolationFnc: function skipLabels(value, index) {
							var date = value.toString().split(" ");
							if (index % 24 === 0){
								try {
									if(value == "<b>Now</b>")
										return value;

									if (value!= null && index % 24 == 0) {
										return "<b>"+date[1]+" "+date[2]+" "+date[3]+"</b>";
									}else{
										return ""
									}

								} catch (ex) {
									console.log(ex);
									return ""
								}
							}else{
								return date[4];
							}
						}
					}
				});
		}

	}

	blockUI.stop();

	function plotRealTime(labels, data){
		new Chartist.Line('#ct-chart-split', {
				labels: labels,
				series: [
					{
						name: name,
						data: data
					}
				]
			},
			{ low: 0,
				showArea: true,
				axisX: {
					labelInterpolationFnc: function skipLabels(value, index) {
						var date = value.toString().split(" ");

						if(index==0 && date.length>3){
							return "<b>"+date[1]+" "+date[2]+" "+date[3]+"</b>";
						}else if(date.length==3){
							return date[1]
						}

						if(index>data.length){
							return value.toString().split(" ")[1]
						}

						return date[4];
					}
				}
			});
	}
}]);