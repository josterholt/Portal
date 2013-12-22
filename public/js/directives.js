angular.module('GamePortal.directives', [])
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