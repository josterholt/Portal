angular.module('GamePortal', ['mongolab']).
config(function($routeProvider, $httpProvider) {
	$routeProvider.
	when('/home/list', 
	{
		controller: HomeCtrl,
		templateUrl: 'partials/index.html'
	}).
	when('/login', 
	{
		controller: LoginCtrl,
		templateUrl: 'partials/login.html'
	}).
	when('/admin',
	{
		controller: AdminHomeCtrl,
		templateUrl: 'partials/admin/index.html'
	}).
	/*
	when('/admin/:type',
	{
		controller: AdminUserListCtrl,
		templateUrl: 'partials/admin/list.html'
	}).
	when('/admin/:type/:id',
	{
		controller: AdminUserDetailCtrl,
		templateUrl: 'partials/admin/detail.html'
	}).
	*/
	when('/profile', 
	{
		controller: ProfileCtrl,
		templateUrl: 'partials/profile.html'
	}).
	when('/admin/user',
	{
		controller: AdminUserListCtrl,
		templateUrl: 'partials/admin/user/list.html'
	}).
	when('/admin/user/:id',
	{
		controller: AdminUserDetailCtrl,
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

	/*
	var interceptor2 = ['$rootScope', '$q', function (scope, $q) {
		function success(response) {
			console.debug(response);
			return response;
		}

		function error(response) {
			return response;
		}

		return function(promise) {
			return promise.then(success, error);
		}
	}];
	$httpProvider.responseInterceptors.push(interceptor2);
	*/
})
.run(['$rootScope', '$http', '$location', function(scope, $http, $location) {
	scope.requests401 = [];

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
	 	$http.get('services/ping').success(function () {
	 		scope.$broadcast('event:loginConfirmed');
	 	});
	 }
	 ping();
}])
.factory('Session', function () {
	var Session = {
		id: 1234,
		data: {}
	}
	return Session;
})
.directive('statusList', function (Post, $http) {
	return {
		restrict: 'A',
		scope: {
			title: '@'
		},
		templateUrl: 'partials/status/list.html',
		transclude: true,
		link: function ($scope, element, attrs) 
		{
			$scope.posts = Post.query(function () {
				console.debug("Foo");
			});
			$scope.savecomment = function (frm) {
				$http.post('/services/comment', { post: frm.elements["body"].getAttribute("post"), comment: frm.elements["body"].value })
			}
		}
	};
})
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
.run(function (Profile) {});

function HomeCtrl($scope, $routeParams) {

}

function ProfileCtrl($scope, $routeParams, Profile ) {
	var profile = Profile.get();
	$scope.record =  profile
	
	$scope.save = function () {
		profile.$update(function (obj, res) {
			console.debug(res);
		});
	}
}

function LoginCtrl($scope, $routeParams) {

}

function AdminHomeCtrl($scope, $routeParams) {

}

function AdminUserListCtrl($scope, $routeParams, User) {
	$scope.records = User.query();
}

function AdminUserDetailCtrl($scope, $routeParams, User) {
	
	$scope.record = User.get({ id: $routeParams.id });

	$scope.save = function () {
		console.debug("testing");
	}

	$scope.debug = function () {
		console.debug($scope.record);
	}
}