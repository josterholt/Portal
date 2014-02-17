var express = require('express'),
    port = process.env.PORT || 5000,
    app = module.exports = express(),
    crypto = require('crypto');

var nconf = require('nconf');
nconf.argv()
	.env()
	.file({ file: 'conf/app.json' });;

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

console.log(nconf.get('MONGOLAB_URI'));
app.use(express.session({
	secret: 'test1234',
	maxAge: new Date(Date.now() + 3600000),
	store: new MongoStore({
		url: nconf.get('MONGOLAB_URI'),
		auto_reconnect: true
	})
}));

/**
*  Facebook init
*/
//var Facebook = require('facebook-node-sdk');
//app.use(Facebook.middleware({ appId: '217293819917', secret: '1699a6a5a690aa1fe197647fa0d27856' }));

var passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy;
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
	done(null, user);
})
passport.deserializeUser(function(obj, done) {
	done(null, obj);
})
passport.use(new FacebookStrategy({
	clientID: '217293819917',
	clientSecret: '1699a6a5a690aa1fe197647fa0d27856',
	callbackURL: '/fb-callback'
},
function(accessToken, refreshToken, data, done) {
	console.log('Callback function');
	console.log(data);

	console.log("********")
	console.log("Email: " + data.email);
	console.log("********")
	Entities.user.find({ facebook_id: data.id }, function (err, docs) {
		console.log('User search 1 complete...');
		console.log('Records found: ' + docs.length);

		if(docs.length == 0)
		{
			// If it doesn't exist create new user. Make sure email is unique
			console.log('User search 2...');
			if(data.email == undefined) {
				var user = new Entities.user({
					first_name: data.first_name,
					last_name: data.last_name,
					email: null,
					photo: 'http://graph.facebook.com/' + data.id + '/picture',
					_facebook_id: data.id
				})

				console.log('Saving user...');
				user.save(function (err) {
					if(err) {
						console.log("Error saving user");
					}
					console.log('User Saved');
					done(null, user);
				})

			} else {
				Entities.user.find({ email: data.email }, function (err, emailcheck) {
					console.log('User search 2 complete...');
					if(emailcheck.length != 0)
					{
						console.log('A user already exists with this e-mail');
						// Throw error, user already exists
						done({ msg: "User Exists" });
					} else {
						console.log('Creating new user...');
						var user = new Entities.user({
							first_name: data.first_name,
							last_name: data.last_name,
							email: data.email,
							photo: 'http://graph.facebook.com/' + data.id + '/picture',
							_facebook_id: data.id
						})

						console.log('Saving user...');
						user.save(function (err) {
							if(err) {
								console.log("Error saving user");
							}
							console.log('User Saved');
							done(null, user);
						})
					}

				})
			}
		} else {
			console.log('User found');
			done(null, docs[0])
		}
	});
}))


/**
* Routing
*/
app.get('/fb-login', passport.authenticate('facebook'));

app.get('/fb-callback', passport.authenticate('facebook', { failureRedirect: '/' }),
 function (req, res) {
	console.log('callback');
	console.log(req.user);
	req.session.user = req.user;
	res.redirect('/');
})

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

app.get('/services/process-media', function (req, res) {
	var http = require("http");
	var url_parts = req.query.url.replace("http://", "").split("/");
	var host = url_parts.shift();
	var path = url_parts.join("/");

	var options = {
		method: 'GET',
		hostname: host,
		port: 80,
		path: "/" + path
	}

	var httpreq = http.get(req.query.url, function (httpres) {
		switch(httpres.headers['content-type']) {
			case 'image/jpeg':
			case 'image/png':
			case 'image/jpg':
			case 'image/gif':
				res.setHeader('Content-Type', httpres.headers['content-type']);
				//res.send(httpres)
				break;
			// case 'video':
			// break;
			default:
				res.send(404);
				return;
				break;
		}
		httpres.pipe(res);

/*		httpres.on("data", function(chunk) {
			res.write(chunk);
		})
		httpres.on("end", function () {
			res.end();
		})*/
	}).on('error', function (e) {
		console.log(e);
		res.send(404);
	})
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
			create_date: new Date(),
			mod_date: new Date()
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

	var max_records = 10,
		offset      = 0;
	
	if(req.query.offset != undefined) {
		offset = req.query.offset;
	}
	
	if(req.query.tags == undefined) {
		Entities['post'].find()
			.sort('field -create_date')
			.populate('user comments.user tags')
			.skip(offset)
			.limit(max_records)
			.exec(function (err, docs) {
				res.send(docs);
			})	
	} else {
		Entities['tag'].find({ "code": req.query.tags }).exec(function(err, tags) {
			Entities['post'].find({"tags": tags[0]._id })
				.sort('field -create_date')
				.populate('user comments.user tags')
				.skip(offset)
				.limit(max_records)
				.exec(function (err, posts) {
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
	
	console.log('Getting ' + req.params.type);
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
			if(req.body.tags == undefined) {
				callback(null);
			} else {
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

console.log("Listing to " + nconf.get("PORT"));
app.listen(nconf.get("PORT"));
