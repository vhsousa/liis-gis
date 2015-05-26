angular.module('app').controller('MapController', ['$scope', '$interval', 'leafletData','MapsFactory', 'blockUI', function($scope, $interval, leafletData, MapsFactory, blockUI) {

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

	var imageUrl = 'http://i.imgur.com/C7SvSGs.png';
	var imageBounds = [[40.18707001445873, -8.417635560035706], [40.18553730681936, -8.415586352348328]];
	$scope.geop_options = true;
	$scope.layers = [];
	$scope.l1_v = 20;
	$scope.l2_v = 50;
	$scope.l3_v = 80;

	$scope.opacity_control = function (layer) {
		leafletData.getMap('map').then(function(map) {
			var input = $("#op_"+layer);
			layer -=1;
			map.removeLayer($scope.layers[layer]);
			$scope.layers[layer] = L.imageOverlay(imageUrl, imageBounds, {opacity: parseInt(input.val())/100});
			map.addLayer($scope.layers[layer]);
		});
	};

	$scope.layer_control = function (e) {
		blockUI.start();

		if(e.target.checked){
			leafletData.getMap('map').then(function(map) {
				map.addLayer($scope.layers[e.target.value-1]);
			});
		}else{
			leafletData.getMap('map').then(function(map) {
				map.removeLayer($scope.layers[e.target.value-1]);
			});
		}

		blockUI.stop();
	};

	$scope.geop_process = function () {
		blockUI.start();

		var checked = $('#geop_check').is(':checked');

		if(checked){
			$scope.geop_options = false;
			leafletData.getMap('map').then(function(map) {
				if($scope.layers.length>0){
					$scope.layers.forEach(function (entry) {
						map.addLayer(entry);
					});
				}else{
					console.log('Creating layers');
					$scope.layers.push(L.imageOverlay(imageUrl, imageBounds, {opacity:parseInt($("#op_1").val())/100}));

					$scope.layers.forEach(function (entry) {
						map.addLayer(entry);
					});
				}
			});
		}else{
			leafletData.getMap('map').then(function(map) {
				$scope.layers.forEach(function (entry) {
					map.removeLayer(entry);
				});
			});
			$scope.geop_options = true;
		}

		blockUI.stop();
	};

	leafletData.getMap('map').then(function(map) {

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

}]);