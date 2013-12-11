var express = require('express'),
    port = process.env.PORT || 5000,
    app = module.exports = express(),
    crypto = require('crypto');

var nconf = require('nconf');
nconf.argv()
	.env();


var async = require("async");
var MongoStore = require("connect-mongo")(express);
var Entities = require('./entities.js');

/**
* App Config
*/
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// log
if (!module.parent) app.use(express.logger('dev'));

// body parser
app.use(express.bodyParser());

// serve static files
app.use(express.static(__dirname + '/public'));

// session support
app.use(express.cookieParser('some secret here'));
app.use(express.session({
	secret: 'test1234',
	maxAge: new Date(Date.now() + 3600000),
	store: new MongoStore({
		db: 'portal',
		host: 'localhost'
	})
}));

/**
*  Facebook init
*/
var Facebook = require('facebook-node-sdk');

app.use(Facebook.middleware({ appId: '217293819917', secret: '1699a6a5a690aa1fe197647fa0d27856' }));

/**
* Routing
*/
app.get('/fb-login', Facebook.loginRequired(), function (req, res) {
	req.facebook.api('/me', function (err, data) {
		// Lookup user with facebook id
		Entities.user.find({ facebook_id: data.id }, function (err, docs) {
			if(docs.length == 0)
			{
				// If it doesn't exist create new user. Make sure email is unique
				Entities.user.find({ email: data.email }, function (err, emailcheck) {
					if(emailcheck.length != 0)
					{
						console.log('A user already exists with this e-mail');
						// Throw error, user already exists
					} else {
						var user = new Entities.user({
							first_name: data.first_name,
							last_name: data.last_name,
							email: data.email,
							photo: 'http://graph.facebook.com/' + data.id + '/picture',
							_facebook_id: data.id
						})
						user.save(function (err) {
							if(err) {
								console.log("Error saving user");
							}
							req.session.user = user;
							res.redirect('/');
						})
					}

				})
			} else {
				req.session.user = docs[0];
				res.redirect('/');
			}
		});
	});
});

function requireUser(req, res) {
	if(req.session.user == undefined)
	{
		res.send(401);
		return false;
	}
	return true;
}

/**
 *  Public facing pages
 *  @todo add bcrypt hash comparison
 */
app.post('/login', function (req, res) {
	var hash = crypto.createHash('md5');
	var password = hash.update(req.body.password);
	console.log(password.digest('hex'));

	Entities.user.findOne({ email: req.body.email, password: password }, function (err, doc) {
		if(err)
		{
			res.send({ status: "FAIL" })
			return false;
		}
		req.session.user = doc;
		res.send('Logged in');		
	})
});

app.get('/:page', function (req, res) {
	res.redirect('/#/' + req.params.page);
});

app.get('/services/_other/getActiveUser', function(req, res) {
 	res.send(req.session.user);
 })

app.get('/services/profile', function(req, res) {
	res.send(req.session.user);
});

app.post('/services/comment', function(req, res) {
	Entities.post.findById(req.body.post, function (err, doc) {
		if(err) {
			res.send({ status: 'FAIL' });
			return;
		}

		doc.comments.push({
			user: req.session.user._id,
			body: req.body.comment,
			create_date: new Date()
		});
		console.log(doc);
		doc.save(function (err) {
			if(err) {
				res.send({ status: 'FAIL' });
			}
			res.send(doc);
		});
	});
});

app.post('/services/profile', function(req, res) {
	// Only update specific params
	Entities.user.findById(req.session.user._id, function (err, doc) {
		doc.first_name = req.body.first_name;
		doc.last_name  = req.body.last_name;
		doc.photo      = req.body.photo;

		if(req.body.password != '' && req.body.password != undefined)
		{
			var hash = crypto.createHash('md5');
			var password = hash.update(req.body.password);
			doc.password = password.digest('hex')
		}

		doc.save(function (err) {
			if(err) {
				console.log(err);
			}
			req.session.user = doc;
			res.send(doc);
		});
	});
});

app.get('/services/post', function(req, res) {
	// Require user session
	if(!requireUser(req, res)) {
		return false;
	}

	if(req.query.tags == undefined) {
		Entities['post'].find().sort('field -create_date').populate('user comments.user tags').exec(function (err, docs) {
			res.send(docs);
		})	
	} else {
		Entities['tag'].find({ "code": req.query.tags }).exec(function(err, tags) {
			Entities['post'].find({"tags": tags[0]._id }).sort('field -create_date').populate('user comments.user tags').exec(function (err, posts) {
				res.send(posts);
			})			
		})
	}
});
/**
 * @todo Check to make sure content is public
 */
app.get('/services/:type', function(req, res) {
	// Require user session
	if(!requireUser(req, res)) {
		return false;
	}
	
	var assoc_keys = [];

	for(key in Entities[req.params.type].schema.paths)
	{
		if(Entities[req.params.type].schema.paths[key].instance == 'ObjectID')
		{
			assoc_keys.push(key);
		}
	}

	for(key in Entities[req.params.type].schema.virtuals)
	{
		assoc_keys.push(Entities[req.params.type].schema.virtuals[key].path);
	}

	Entities[req.params.type].find(req.params.criteria).sort('field -create_date').execFind(function (err, docs) {
		res.send(docs);
	})
});

// Retrieve content
app.get('/services/:type/:id', function(req, res) {
	Entities[req.params.type].findById(req.params.id, function (err, doc) {
		res.send(doc);
	})
});


//Create/Update content type
app.post('/services/:type/:id?', function(req, res) {
	// Require user session
	if(!requireUser(req, res)) {
		return false;
	}

	/**
	 *  General check to make sure this class supports user generated content
	 */
	if(!Entities[req.params.type].schema.paths.hasOwnProperty('user'))
	{
		throw new Error('Permission denied');
	}

	if(req.params.id != undefined)
	{
		Entities[req.params.type].findById(req.params.id, function(err, doc) {
			if(err) {
				throw new Error(err);
			}
			if(doc == undefined)
			{
				throw new Error("Record undefined");
			}

			/**
			 * Unless this is an admin, object should belong to user via user_id
			 * @todo type should be an array or permission check
			 */	
			if(req.session.user.id != doc.user._id)
			{
				throw new Error('Permission would be denied');
			}

			for(key in req.body)
			{
				doc[key] = req.body[key];
			}

			if(Entities[req.params.type].schema.paths.hasOwnProperty('mod_date'))
			{
				doc.mod_date = new Date();
			}

			doc.save(function (err) {
				if(err) {
					console.log(err);
				}
				res.send(doc);
			});	
		});
	} else {
		var doc = new Entities[req.params.type]();
		var schema = Entities[req.params.type].schema;
		var tag = null;
		
		async.series([function (callback) {
			// Hacky preemptive caching
			console.log('hack');
			if(req.body.tags != undefined) {
				console.log('testing');
				Entities['tag'].find({ "code": req.body.tags }).exec(function(err, tags) {
					tag = tags[0];
					console.log('Inside first function');
					console.log(tag);
					callback(null);
				});					
			}
		},
		function (callback) {
			console.log('Inside second function');
			console.log(tag);
			for(key in req.body)
			{
				if(schema.paths[key].instance == 'ObjectID' && key != '_id')
				{
					if(key == 'tags') {
						if(tag != null) {
							doc[key] = tag;
						}
					} else {
						console.log('Unsupported assoc property')
					}
				} else {
					doc[key] = req.body[key];				
				}
			}
			
			if(Entities[req.params.type].schema.paths.hasOwnProperty('user'))
			{
				doc.user = req.session.user._id;
			}
					
			if(Entities[req.params.type].schema.paths.hasOwnProperty('create_date'))
			{
				doc.create_date = new Date();
			}
			console.log(doc);
			
			doc.save(function (err) {
				if(err) {
					console.log(err);
				}
				res.send(doc);
				callback(null);
			});
		}]);
	}
});


app.listen(3000);
