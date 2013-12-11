/**
* Mongoose and Entity init
*/
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    nconf = require("nconf");

nconf.argv()
.env()
.file({ file: 'conf/db.json' });

var DB_URI = nconf.get('MONGOLAB_URI');
console.log(DB_URI);
mongoose.connect(DB_URI, function(err, res) {
	if(err) {
		console.log('Error connecting to DB.' + err);
	} else {
		console.log('Connected to DB');
	}
});

var Entities = {};
Entities['user'] = mongoose.model('users',
{
	id: Schema.Types.ObjectId,
	first_name: String,
	last_name: String,
	email: String,
	password: String,
	facebook_id: String,
	photo: String,
	groups: [{ type: Schema.Types.ObjectId, ref: 'groups' }],
	subscriptions: {
		tags: [{ type: Schema.Types.ObjectId, ref: 'tags' }],
		users: [{ type: Schema.Types.ObjectId, ref: 'users' }]
	}
});

Entities['user'].schema.virtual('display_title').get(function () {
	return this.first_name + ' ' + this.last_name;
});

Entities['post'] = mongoose.model('posts',
{
	id: Schema.ObjectId,
	parent_id: { type: Schema.Types.ObjectId, ref: 'posts'},
	body: String,
	user: { type: Schema.Types.ObjectId, ref: 'users' },
	comments: [{ 
		user: { type: Schema.Types.ObjectId, ref: 'users' },
		body: String,
		create_date: Date,
		mod_date: Date
	}],
	create_date: Date,
	mod_date: Date,
	is_deleted: Boolean,
	tags: { type: Schema.Types.ObjectId, ref: 'tags' }

});

Entities['group'] = mongoose.model('groups',
{
	id: Schema.ObjectId,
	title: String,
	create_date: Date,
	tags: [{ type: Schema.ObjectId, ref: 'tags' }],
	//users: {type: Schema.ObjectId, reg: 'User' }
})

Entities['tag'] = mongoose.model('tags', {
	id: Schema.ObjectId,
	title: String,
	code: String
});

module.exports = Entities;