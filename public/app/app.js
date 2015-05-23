angular.module('app', ['ngResource', 'ngRoute', 'leaflet-directive']);

angular.module('app').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

	$routeProvider
		.when('/', {
			templateUrl: '/partials/HomeView',
			controller: 'MainController'
		})
		.when('/graph/:network/:nodeid/:parameter/', {
			templateUrl: '/partials/GraphView',
			controller: 'GraphController'
		})
		.otherwise({
			redirectTo: '/'
		});

	$locationProvider.html5Mode({
		enabled: true,
		requireBase: false
	});

}]);
