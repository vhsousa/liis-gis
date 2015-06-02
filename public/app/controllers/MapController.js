angular.module('app').controller('MapController', ['$scope', '$interval', 'leafletData','MapsFactory', 'blockUI', 'DataFactory', function($scope, $interval, leafletData, MapsFactory, blockUI, DataFactory) {

	$scope.map = {
		zoomAnimation: false,
		fadeAnimation: false,
		center: {
			lat: 40.1862435,
			lng: -8.4157729,
			zoom: 17
		},
		markers: {},
		layers: {
			baselayers: {
				googleHybrid: {
					name: 'Google Hybrid',
					layerType: 'HYBRID',
					type: 'google'
				},
				googleRoadmap: {
					name: 'Google Streets',
					layerType: 'ROADMAP',
					type: 'google'
				},
				googleTerrain: {
					name: 'Google Terrain',
					layerType: 'TERRAIN',
					type: 'google'
				}
			}
		}
	};

	var nodes_positions = {
		"101":{
			lat: 40.18707001445873,
			lng: -8.417635560035706
		},
		"102":{
			lat: 40.18553730681936,
			lng: -8.415586352348328
		},
		"103":{
			lat: 40.186774950439215,
			lng: -8.414899706840515
		},
		"default":{
			lat: 40.1862435,
			lng: -8.4157729
		}
	};


	$scope.network_name = 'liis_wsn01';
	var popup="";
	var units = {};

	var imageBounds = [[40.18707001445873, -8.417635560035706], [40.18553730681936, -8.414899706840515]];
	$scope.geop_options = true;
	$scope.heatmap = {};
	$scope.heatmap.layers = [];
	$scope.l1_v = 20;
	$scope.l2_v = 50;
	$scope.l3_v = 80;

	$scope.opacity_control = function (layer) {
		leafletData.getMap('map').then(function(map) {
			var input = $("#op_"+layer);
			map.removeLayer($scope.heatmap.layers[layer].layer);
			$scope.heatmap.layers[layer].layer = L.imageOverlay($scope.heatmap.layers[layer].url, imageBounds, {opacity: parseInt(input.val())/100});
			map.addLayer($scope.heatmap.layers[layer].layer);
		});
	};

	$scope.nextDayHide = true;
	$scope.previousDayHide = false;

	$scope.nextDay = function () {
		$scope.heatmap.date = getNextDay($scope.heatmap.date);

		leafletData.getMap('map').then(function(map) {
			eraseMap(map);
			addLayers($scope.heatmap.date, map);
		});

		$scope.nextDayHide = $scope.heatmap.date >= getPreviousDay(getToday());
	};

	$scope.previousDay = function () {

		$scope.heatmap.date = getPreviousDay($scope.heatmap.date);

		leafletData.getMap('map').then(function(map) {
			eraseMap(map);
			addLayers($scope.heatmap.date, map);

			$scope.nextDayHide = false;
		});
	};



	$scope.layer_control = function (e) {
		blockUI.start();

		leafletData.getMap('map').then(function(map) {
			if (e.target.checked) {
				map.addLayer($scope.heatmap.layers[e.target.value].layer);
			} else {
				map.removeLayer($scope.heatmap.layers[e.target.value].layer);
			}
		});
		blockUI.stop();
	};

	$scope.heatmapLabelHide = true;

	$scope.geop_process = function () {

		var checked = $('#geop_check').is(':checked');

		leafletData.getMap('map').then(function(map) {
			if(checked){
				$scope.geop_options = false;
				if($scope.heatmap.layers.length>0){
					$scope.heatmap.layers.forEach(function (entry) {
						map.addLayer(entry.layer);
					});
				}else{
					$scope.heatmap.date = getPreviousDay(getToday());
					addLayers($scope.heatmap.date, map);
				}

				$('#map').attr('style','width: 600px; height: 480px; position: relative;');
				$scope.heatmapLabelHide = false;
			}else{

				$('#map').attr('style','width: 680px; height: 480px; position: relative;');
				$scope.heatmapLabelHide = true;
				$scope.heatmap.layers.forEach(function (entry) {
					map.removeLayer(entry.layer);
				});
				$scope.geop_options = true;
			}
		});

	};

	leafletData.getMap('map').then(function(map) {
		L.control.scale().addTo(map);
		MapsFactory.getInfo($scope.network_name).then(function (response) {
			response.general = angular.fromJson(response.general);
			$scope.network_info = response;
			$scope.sensors = response.units;

			response.ids.forEach(function (entry) {
				var marker;
				var latlng = nodes_positions[entry];

				if(latlng){
					marker = new L.Marker(new L.LatLng(latlng.lat, latlng.lng));
				}else{
					marker = new L.Marker(new L.LatLng(generateEntropy(nodes_positions.default.lat),generateEntropy(nodes_positions.default.lng)))
				}

				marker.setIcon(L.AwesomeMarkers.icon({
					icon: 'wifi',
					markerColor: "blue",
					prefix: 'fa'
				}));

				marker.on('popupopen', function (e) {
					$scope.refreshData(e.popup);
				});

				marker.on('popupclose', function (e) {
					$scope.stopRefreshData();
				});

				units = response.units;
				marker._id = entry;
				MapsFactory.getSensorData($scope.network_name,entry).then(function (response) {
					popup = createStringForPopup(entry,response);
					marker.bindPopup(popup);
					marker.addTo(map);
				});


			});
		});
	});


	function generateEntropy(v){
		return v+(Math.random() * (0.000100 - 0.000900) + 0.000900)
	}

	var refresher;
	var preset_keys = ["temperature", "humidity", "par", "timestamp"];
	$scope.refreshData = function (popup){
		refresher = $interval(function () {
			MapsFactory.getSensorData($scope.network_name,popup._source._id).then(function (response) {
				popup.setContent(createStringForPopup(popup._source._id,response));
			});

		},5000);
	};
	
	$scope.stopRefreshData = function () {
		if (angular.isDefined(refresher)) {
			$interval.cancel(refresher);
			refresher = undefined;
		}
	};

	$scope.$on('$destroy', function () {
		$interval.cancel(refresher);
	});

	function createStringForPopup(id, data){
		var rum = "<b>Id: </b>"+id+"<br>";
		for(var key in data) {
				if(preset_keys.indexOf(key)>=0){

					if(units[key]){
						rum += "<b><a href='/graph/"+$scope.network_name+"/"+id+"/"+key+"/'>" + capitalize(key) + "</a>: </b>" + data[key] + " "+units[key]+"<br>";
					}else{
						rum += "<b>" + capitalize(key) + ": </b>" + data[key] + "<br>";
					}
				}

		}
		return rum;
	}

	function capitalize(s)
	{
		return s[0].toUpperCase() + s.slice(1);
	}

	function getPreviousDay(date){
		var dd = date.getDate();
		var mm = date.getMonth(); //January is 0!
		var yyyy = date.getFullYear();


		return new Date(new Date(yyyy,mm,dd) - 1000*60*60*24)
	}

	getNextDay(getToday());
	function getNextDay(date){
		return new Date(date.getTime() + 24*60*60*1000);
	}

	function getToday(){
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; //January is 0!
		var yyyy = today.getFullYear();

		return new Date(yyyy, mm, dd);
	}

	function addLayer(layer, hour, date){
		var dd = date.getDate();
		var mm = date.getMonth();
		var yyyy = date.getFullYear();
		leafletData.getMap('map').then(function(map) {
			DataFactory.getHeatmap($scope.network_name, hour, dd, mm, yyyy).then(function (response) {
				$scope.heatmap.layers[layer].url = 'http://' + response;
				$scope.heatmap.layers[layer].hour = hour;
				map.removeLayer($scope.heatmap.layers[layer].layer);
				$scope.heatmap.layers[layer].layer = L.imageOverlay($scope.heatmap.layers[layer].url, imageBounds, {opacity: parseInt($("#op_" + layer).val()) / 100});

				var lc = $("#active_"+layer);
				if(lc.is(':checked')){
					map.addLayer($scope.heatmap.layers[layer].layer);
				}
			});
		});

	}

	function addLayers(date, map){
		var dd = date.getDate();
		var mm = date.getMonth();
		var yyyy = date.getFullYear();
		blockUI.start();
		DataFactory.getHeatmap($scope.network_name, 8, dd, mm, yyyy).then(function(response){
			$scope.heatmap.layers[0] = {};
			$scope.heatmap.layers[0].url = 'http://'+response;
			$scope.heatmap.layers[0].hour = 8;
			$scope.heatmap.layers[0].previousHourHide = false;
			$scope.heatmap.layers[0].nextHourHide = false;
			$scope.heatmap.layers[0].hourRange = {min:0, max: 10};
			DataFactory.getHeatmap($scope.network_name, 14, dd, mm, yyyy).then(function(response){
				$scope.heatmap.layers[1] = {};
				$scope.heatmap.layers[1].url= 'http://'+response;
				$scope.heatmap.layers[1].hour = 14;
				$scope.heatmap.layers[1].previousHourHide = false;
				$scope.heatmap.layers[1].nextHourHide = false;
				$scope.heatmap.layers[1].hourRange = {min:10, max: 18};
				DataFactory.getHeatmap($scope.network_name, 20, dd, mm, yyyy).then(function(response){
					var i = 0;
					$scope.heatmap.layers[2] = {};
					$scope.heatmap.layers[2].url = 'http://'+response;
					$scope.heatmap.layers[2].hour = 20;
					$scope.heatmap.layers[2].previousHourHide = false;
					$scope.heatmap.layers[2].nextHourHide = false;
					$scope.heatmap.layers[2].hourRange = {min:18, max: 24};
					heatmapLabels();
					$scope.heatmap.layers.forEach(function (entry) {
						var layer = L.imageOverlay(entry.url, imageBounds, {opacity:parseInt($("#op_"+i).val())/100});
						$scope.heatmap.layers[i].layer = layer;

						var lc = $("#active_"+i);
						if(lc.is(':checked')) {
							map.addLayer(layer);
						}
						++i;
					});
					blockUI.stop();
				});
			});
		});
	}


	function eraseMap(map){
		$scope.heatmap.layers.forEach(function (entry) {
			map.removeLayer(entry.layer);
		});

	}

	function heatmapLabels(){

		var c = document.getElementById("labelCanvas");
		var ctx = c.getContext('2d');
		ctx.font = "bold 12px Arial";
		ctx.textAlign = 'center';
		ctx. textBaseline = 'middle';
		ctx.fillStyle = 'black';  // a color name or by using rgb/rgba/hex values
		ctx.fillText('34ºC', 20, 10); // text and position
		ctx.fillText('32ºC', 20, 50); // text and position
		ctx.fillText('30ºC', 20, 100); // text and position
		ctx.fillText('28ºC', 20, 150); // text and position
		ctx.fillText('26ºC', 20, 200); // text and position
		ctx.fillText('24ºC', 20, 250); // text and position
		ctx.fillText('22ºC', 20, 300); // text and position
		ctx.fillText('20ºC', 20, 350); // text and position
		ctx.fillText('18ºC', 20, 400); // text and position
		ctx.fillText('16ºC', 20, 450); // text and position
	}

	$scope.nextHour = function(layer){
		$scope.heatmap.layers[layer].hour+=1;
		$scope.heatmap.layers[layer].nextHourHide = $scope.heatmap.layers[layer].hour >= $scope.heatmap.layers[layer].hourRange.max-1;
		$scope.heatmap.layers[layer].previousHourHide = false;
		addLayer(layer,$scope.heatmap.layers[layer].hour, $scope.heatmap.date)
	};

	$scope.previousHour = function(layer){
		$scope.heatmap.layers[layer].hour -= 1;
		$scope.heatmap.layers[layer].previousHourHide = $scope.heatmap.layers[layer].hour <= $scope.heatmap.layers[layer].hourRange.min
		$scope.heatmap.layers[layer].nextHourHide = false;
		addLayer(layer,$scope.heatmap.layers[layer].hour, $scope.heatmap.date)

	};

}]);