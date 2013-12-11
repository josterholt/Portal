'use strict';

angular.module('GamePortal.services', []).
  value('version', '0.1').
  factory('Feed', ['$routeParams', 'Post', function ($routeParams, Post) {
	  var feedInstance = {
			  topic: null,
			  posts: [],
			  loadPosts: function (topic) {
				  if(topic == undefined) {
					  this.topic = null;
				  } else {
					  this.topic = topic;			  
				  }
				  this.reload();
			  },
			  reload: function() {
				  if(this.topic == null) {
					  this.posts = Post.query();
				  } else {
					  this.posts = Post.query({ tags: this.topic })					  
				  }				  
			  }
	  }
	  return feedInstance;
  }]);