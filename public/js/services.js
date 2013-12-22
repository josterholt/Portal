'use strict';

angular.module('GamePortal.services', []).
  value('version', '0.1').
  factory('Feed', ['$routeParams', 'Post', function ($routeParams, Post) {
	  var self;
	  var feedInstance = {
			  offset: 0,
			  limit: 10,
			  topic: null,
			  posts: [],
			  loading: false,
			  loadPosts: function (topic) {
				  if(topic == undefined) {
					  this.topic = null;
				  } else {
					  this.topic = topic;			  
				  }
				  this.reload();
			  },
			  loadMore: function () {
				  this.offset = this.offset + this.limit;
				  var self = this;
				  
				  if(this.loading == true) {
					  return;
				  }

				  this.getPosts().$promise.then(function (result) {
					  if(result.length == 0) {
						  return;
					  }
				  
					  for(var i in result) {
						  if(i.indexOf('$') == -1) {
							  self.posts.push(result[i]);							  
						  }
					  }
				  });
			  },
			  getPosts: function () {
				  var options = {
						  offset: this.offset,
						  limit: this.limit
				  };
				  if(this.topic != null) {
					  options['tags'] = this.topic;
				  }
				  this.loading = true;
				  var post = Post.query(options);
				  var self = this;
				  this.loading = true;
				  post.$promise.then(function () {
					  self.loading = false;
				  });
				  return post;
			  },
			  reload: function() {
				  if(this.topic == null) {
					  this.posts = this.getPosts();
				  } else {
					  this.posts = this.getPosts();					  
				  }				  
			  }
	  }
	  self = feedInstance;
	  return feedInstance;
  }]);