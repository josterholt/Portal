 var express = require('express');
var port = process.env.PORT || 5000;
var app = module.exports = express();

var async = require("async");

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
app.use(express.session());

/**
*  Facebook init
*/
var Facebook = require('facebook-node-sdk');
app.use(Facebook.middleware({ appId: process.env.FACEBOOK_APPID, secret: process.env.FACEBOOK_SECRET }));

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
app.get('/login', function (req, res) {
	Entities.user.findOne({ email: req.body.email, password: enc_pass }, function (err, doc) {
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
		//doc._facebook_id      = req.params._facebook_id;
		doc.photo      = req.body.photo;

		doc.save(function (err) {
			if(err) {
				console.log(err);
			}
			req.session.user = doc;
			res.send(doc);
		});
	});
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

	Entities[req.params.type].find().sort('field -create_date').execFind(function (err, docs) {
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
		for(key in req.body)
		{
			doc[key] = req.body[key];
		}
		
		if(Entities[req.params.type].schema.paths.hasOwnProperty('user'))
		{
			doc.user = req.session.user._id;
		}
		
		if(Entities[req.params.type].schema.paths.hasOwnProperty('create_date'))
		{
			doc.create_date = new Date();
		}

		doc.save(function (err) {
			if(err) {
				console.log(err);
			}
			res.send(doc);
		});	
	}
});


app.listen(3000);
