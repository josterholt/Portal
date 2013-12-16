angular.module('GamePortal', ['mongolab', 'ngRoute', 'GamePortal.services', 'GamePortal.controllers']).
config(function($routeProvider, $httpProvider) {
	$routeProvider.
	when('/home/list', 
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
		redirectTo: '/home/list' 
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
.directive('statusList', ['Feed', 'Post', '$http', '$routeParams', function (Feed, sPost, $http, $routeParams) {
	return {
		templateUrl: 'partials/status/list.html',
		transclude: true,
		link: function ($scope, elements, attrs) 
		{
			$scope.posts = Feed.posts;
			$scope.$watch(function() {
				return Feed.posts;
			},
			function(newVal, oldVal) {
				$scope.posts = newVal;
			})
			
			$scope.savecomment = function (frm) {
				$http.post('/services/comment', { post: frm.elements["body"].getAttribute("post"), comment: frm.elements["body"].value })
					.then(function () {
						Feed.reload();
						$scope.posts = Feed.posts;
					});
				frm.elements['body'].value = '';
			}
		}
	};
}])
.directive('onKeyup', function () {
	return function (scope, elm, attrs) {
		var keyupFn = scope.$eval(attrs.onKeyup);
		var shift_down = false;

		elm.bind('keyup', function (evt) {
			// Submit on enter (13) unless shift is held
			if(13 == evt.which && shift_down == false)
			{
				scope.$apply(function () {
					keyupFn.call(scope, $(elm).parents('form')[0]);
				})
			} else if (evt.which == 16) {
				shift_down = false;
			}
		});

		elm.bind('keydown', function (evt) {
			// Flag shift (16) as down
			if(16 == evt.which)
			{
				shift_down = true;
			}
		});
	}
})
.directive('postWidget', function (Post, Feed, $http, $routeParams) {
	return {
		restrict: 'A',
		link: function ($scope, elements, attrs) {
			var shift_down = false;
	
			elements.bind('keyup', function (evt) {
				// Submit on enter (13) unless shift is held
				if(13 == evt.which && shift_down == false)
				{
					$scope.$apply(function () {
						$scope.savePost(elements[0]);
					})
				} else if (evt.which == 16) {
					shift_down = false;
				}
			});
	
			elements.bind('keydown', function (evt) {
				// Flag shift (16) as down
				if(16 == evt.which)
				{
					shift_down = true;
				}
			});
	
			$scope.savePost = function (frm) {
				var post = {
					body: frm.elements["body"].value 
				}
				if($routeParams.topic !== undefined )
				{
					post['tags'] = $routeParams.topic;
				}
				$http.post('/services/post', post);
				
				var criteria = { };
				if($routeParams.topic !== undefined )
				{
					criteria['tags'] = $routeParams.topic;
				}
				$("[name=body]").val("");
				Feed.reload();
				$scope.posts = Feed.posts;
			}
		}
	}
})