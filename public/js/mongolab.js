angular.module('mongolab', ['ngResource']).
	factory('Post', function ($resource) {
		var Post = $resource('/services/post/:id', 
			{ type: 'post' },
			{ 
				update: { method: 'POST' },
				query: {method: 'GET', isArray: true }

			}
		);

		Post.prototype.update = function (cb) {
			return Post.update({id: this._id.$oid},
				angular.extend({}, this, {_id: undefined}), cb);
		};

		Post.prototype.destroy = function (cb) {
			return Post.remove({id: this._id.$oid}, cb);
		};
		return Post;
	}).
	factory('Topic', function ($resource) {
		var Topic = $resource('/services/tag/:id',
			{ },
			{
				update: { method: 'POST' },
				query: {method: 'GET', isArray: true }
			}
		);
		
		Topic.prototype.update = function (cb) {
			return Post.update({id: this._id.$oid},
				angular.extend({}, this, {_id: undefined}), cb);
		};

		Topic.prototype.destroy = function (cb) {
			return Post.remove({id: this._id.$oid}, cb);
		};
		return Topic; 
	}).
	factory('User', function ($resource) {
		var User = $resource('/services/user/:id',
		{ id: '@id' },
		{
			update: { method: 'POST' },
			query: { method: 'GET', isArray: true }
		});
		User.prototype.update = function (cb) {
			console.debug(this);
			return User.update({id: this._id},
				angular.extend({}, this, {_id: undefined}), cb);
		};

		User.prototype.destroy = function (cb) {
			return User.remove({id: this._id}, cb);
		};
		return User;
	}).
	factory('Profile', function ($resource) {
		var Profile = $resource('/services/profile', 
			{  },
			{
				get: { method: 'GET' },
				update: { method: 'POST' }

			}
		);
		return Profile;
	});