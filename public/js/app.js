angular.module('GamePortal', ['mongolab', 'ngRoute', 'GamePortal.services', 'GamePortal.controllers', 'GamePortal.directives']).
config(function($routeProvider, $httpProvider, $sceDelegateProvider) {
	$sceDelegateProvider.resourceUrlWhitelist([
	      'self',
	      'http://www.youtube.com/**'
      ]);

	$routeProvider.
	when('/', 
	{
		controller: 'HomeCtrl',
		templateUrl: 'partials/index.html'
	}).
	when('/login', 
	{
		controller: 'LoginCtrl',
		templateUrl: 'partials/login.html'
	}).
	when('/admin',
	{
		controller: 'AdminHomeCtrl',
		templateUrl: 'partials/admin/index.html'
	}).
	when('/topic/:topic',
	{
		controller: 'TopicCtrl',
		templateUrl: 'partials/index.html'
	}).
	when('/profile', 
	{
		controller: 'ProfileCtrl',
		templateUrl: 'partials/profile.html'
	}).
	when('/admin/user',
	{
		controller: 'AdminUserListCtrl',
		templateUrl: 'partials/admin/user/list.html'
	}).
	when('/admin/user/:id',
	{
		controller: 'AdminUserDetailCtrl',
		templateUrl: 'partials/admin/user/detail.html'
	}).
	otherwise({
		redirectTo: '/' 
	});

	// Interceptor
	var interceptor = ['$rootScope', '$q', function(scope, $q) {
		function success(response) {
			return response;
		}

		function error(response) {
			var status = response.status;

			if(status == 401) {
				var deferred = $q.defer();
				var req = {
					config: response.config,
					deferred: deferred
				}
				//console.debug('Login required');
				scope.requests401.push(req);
				scope.$broadcast('event:loginRequired');
				return deferred.promise;
			}

			return $q.reject(response);
		}

		return function(promise) {
			return promise.then(success, error);
		}
	}];
	$httpProvider.responseInterceptors.push(interceptor);
})
.run(['$rootScope', '$http', '$location', function(scope, $http, $location) {
	scope.requests401 = [];
	
	// Breeze config (should be added as a service)
	breeze.config.initializeAdapterInstance("modelLibrary", "backingStore", true);
	breeze.NamingConvention.camelCase.setAsDefault();
	var manager = new breeze.EntityManager("/services");
	manager.dataService.hasServerMetadata = false;

	
	// Login modal added to root scope
	scope.openMessageBox = function () {
		$("#login-modal").modal({ show: true });
	}

	/**
	 * Login Required
	 */
	 scope.$on('event:loginRequired', function () {
		scope.openMessageBox();
	 });

	/**
	 *  Login Confirmed
	 */
	scope.$on('event:loginConfirmed', function () {
		var i, requests = scope.requests401;
		for(i = 0; i < requests.length; i++) {
			retry(requests[i]);
		}
		scope.requests401 = [];

		function retry(req) {
			$http(req.config).then(function(response) {
				req.deferred.resolve(response);
			});
		}
	});

	/**
	 *  Login request
	 */
	 scope.$on('event:loginRequest', function(event, user, pass) {
	 	var data = $.param();
	 	var config = {};

	 	$http.post('/services/user/login', data, config).success(function (data) {
	 		if(data == 'SUCCESS')
	 		{
	 			scope.$broadcast('event:loginConfirmed');
	 		}
	 	});

	 });

	 /**
	  * Listener to logout user. Force login page.
	  */
	 scope.$on('event:logoutRequest', function () {
	 	$http.put('/services/user/logout', {}).success(function () {
	 		ping();
	 	});
	 });

	 /*
	  * Checks to see if user is logged in
	  */
	 function ping() {
		 /*
	 	$http.get('services/ping').success(function () {
	 		scope.$broadcast('event:loginConfirmed');
	 	});
	 	*/
	 }
	 ping();
}])