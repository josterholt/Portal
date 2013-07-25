/**
* Mongoose and Entity init
*/
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/portal', function(err, res) {
	if(err) {
		console.log('Error connecting to DB.' + err);
	} else {
		console.log('Connected to DB');
	}
});

var Entities = {};
Entities['post'] = mongoose.model('posts',
{
	id: mongoose.Schema.ObjectId,
	parent_id: { type: mongoose.Schema.ObjectId, ref: 'posts'},
	body: String,
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
	comments: [{ 
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
		body: String,
		create_date: Date,
		mod_date: Date
	}],
	create_date: Date,
	mod_date: Date,
	is_deleted: Boolean,
	tags: { type: mongoose.Schema.ObjectId, ref: 'tags' }

});


Entities['user'] = mongoose.model('users',
{
	id: mongoose.Schema.ObjectId,
	first_name: String,
	last_name: String,
	email: String,
	facebook_id: String,
	photo: String,
	groups: [{ type: mongoose.Schema.ObjectId, ref: 'groups' }],
	subscriptions: {
		tags: [{ type: mongoose.Schema.ObjectId, ref: 'tags' }],
		users: [{ type: mongoose.Schema.ObjectId, ref: 'users' }]
	}
});
Entities['user'].schema.virtual('display_title').get(function () {
	return this.first_name + ' ' + this.last_name;
});

Entities['group'] = mongoose.model('groups',
{
	id: mongoose.Schema.ObjectId,
	title: String,
	create_date: Date,
	tags: [{ type: mongoose.Schema.ObjectId, ref: 'tags' }],
	//users: {type: Schema.ObjectId, reg: 'User' }
})

Entities['tag'] = mongoose.model('tags', {
	id: mongoose.Schema.ObjectId,
	title: String,
	code: String
});

module.exports = Entities;