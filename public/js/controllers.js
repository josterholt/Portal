'user strict';

angular.module('GamePortal.controllers', [])
.controller('PortalCtrl', ['$scope', '$routeParams', 'Topic', function ($scope, $routeParams, Topic) {
	$scope.topics = Topic.query();
}])
.controller('HomeCtrl', ['$scope', '$routeParams', 'Feed', function($scope, $routeParams, Feed) {
	Feed.loadPosts();
	$scope.posts = Feed.posts;
}])
.controller('TopicCtrl', ['$scope', '$routeParams', 'Feed', function TopicCtrl($scope, $routeParams, Feed) {
	Feed.loadPosts($routeParams.topic);
	$scope.posts = Feed.posts;

}]);

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
	
	 var user = User.get({ id: $routeParams.id });
	 $scope.record = user;

	$scope.save = function () {
		user.password = CryptoJS.MD5(user.password);
		console.debug(user.password);
		user.update(function (obj, res) {
			console.debug(res);
		});
	}

	$scope.debug = function () {
		console.debug($scope.record);
	}
}