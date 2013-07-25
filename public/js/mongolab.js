angular.module('mongolab', ['ngResource']).
	factory('Post', function ($resource) {
		var Post = $resource('/services/post/:id', 
			{  },
			{ 
				update: { method: 'PUT' },
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
	factory('User', function ($resource) {
		var User = $resource('/services/user/:id',
		{ },
		{
			update: { method: 'PUT' },
			query: { method: 'GET', isArray: true }
		});
		User.prototype.update = function (cb) {
			return User.update({id: this._id.$oid},
				angular.extend({}, this, {_id: undefined}), cb);
		};

		User.prototype.destroy = function (cb) {
			return User.remove({id: this._id.$oid}, cb);
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