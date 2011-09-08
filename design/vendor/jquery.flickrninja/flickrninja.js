/* 
** Class to allow the easy fetching of flickr content client side
** $Id: flickrninja.js 1023 2009-07-13 08:00:29Z luke $
** Changelog
** 16/2/09: ported to jquery
*/

/******************************************
********* HOW TO USE FlickrNinja **********
******************************************/
/* 
** Quick and dirty, for pasting into toys:

$(function(){
	// setup flickr_ninja
	var fn = ninja.flickr_ninja.init('b4cb5f6367bc601ae4d192c4172360a1', '25759214@N03', 15);
	
	fn.setCallback(function(obj) { 
		console.log(obj.pix);
	})
	
	fn.getByUserNameAndTag('mando alvarez', ['35mm']);
});

*/

/* Proper explanation */
/* Step 1: Set us up the ninjabomb
** Example: var fn = ninja.flickr_ninja.init('b4cb5f6367bc601ae4d192c4172360a1', '25759214@N03', 15);
*/

// var fn = ninja.flickr_ninja.init('apiKey', 'userId', NUMBER_OF_PICTURES_YOU_WANT));

/* Step 2: Set up your response function.
**
** Do stuff here. 'this.pix' has all the pictures, with urls already embedded.
** You can access all the photos like this:
** - Title:									 this.pix[0].title
** - Flickr Page:						 this.pix[0].pageUrl
** - Medium, direct pic:			this.pix[0].photoUrl.m
** - Small, direct pic:			 this.pix[0].photoUrl.s
** - Thumbnail, direct pic:	 this.pix[0].photoUrl.t
** - Large, direct pic:			 this.pix[0].photoUrl.b
*/

// fn.setCallback(function() { 
// 	 console.log(this.pix);
// });

/* Step 3: Do a search: 
**
** Your options include:
** - getByUserId(userId)
** - getByTag([tag1, tag2])
** - getByUserName(username)
** - getByUserIdAndTag(userId, [tag1, tag2])
** - getByUserNameAndTag(username, [tag1, tag2])
*/

// fn.getByUserNameAndTag('willdayble', ['finland']);

/* Step 4: Profit! */
/* End FlickrNinja */


var flickr_ninja = {

	options: {
		'api_key':	'',
		'user_id':	'',
		'pix_limit': 10
	},

	/* constants */
	BASE_URL: 'http://www.flickr.com/services/',
	REQ_TYPE: 'rest',
	FORMAT:	 'json',
	
	/* class vars */
	defaultQueryParams: {
		'sort' : 'date-posted-desc'
	},
	pix: [],

	/* callback */
	cb: function() {},
	
	/* setup */
	init: function(api_key, user_id, pix_limit){
		
		$.extend(this.options, {'api_key': api_key, 'user_id': user_id, 'pix_limit': pix_limit});
		
		$.extend(this.defaultQueryParams, {
			'format':	 this.FORMAT,
			'api_key':	this.options.api_key,
			'user_id':	this.options.user_id,
			'per_page': this.options.pix_limit
			
		})

		return this;

	},
	
	getSet: function(set_id) {
		var params = {
			'method':	 'flickr.photosets.getPhotos'
		};

		this.doFlickrRequest($.extend({}, params, this.defaultQueryParams, {'photoset_id': set_id}));
	},
	
	/* gogooggo */
	getAll: function() {

		var params = {
			'method':	 'flickr.photos.search'
		};

		this.doFlickrRequest($.extend({}, params, this.defaultQueryParams));
	},
	
	getByText: function(search) {
		var params = {
			'method':	 'flickr.photos.search',
			'text': 		search
		};

		var overriden = $.extend({}, this.defaultQueryParams);
		delete overriden['user_id'];

		this.doFlickrRequest($.extend({}, params, overriden));
	},
	
	getByUserId: function(user_id) {
		var params = {
			'method':	 'flickr.photos.search'
		};

		this.doFlickrRequest($.extend({}, params, this.defaultQueryParams, {'user_id': user_id}));
	},
	
	getByTag: function(tagArray, matchMode) {

		if (matchMode === undefined) { 
			matchMode = 'any'; 
		}
		
		var tags = tagArray.join(',');
		
		var params = {
			'method':	 'flickr.photos.search',
			'tags':		 tags,
			'tag_mode': matchMode
		};

		this.doFlickrRequest($.extend({}, params, this.defaultQueryParams));
		
	},
	
	/* get by userID and by tags
	** @param userId string giving the flickr userid (ie 12345678@N01)
	** @param tagArray array of tags to match on
	** @param matchMode optional string either 'all' or 'any', related to the tags to match. Default: 'any'
	*/
	getByUserIdAndTag: function(userId, tagArray, matchMode) {

		if (matchMode === undefined) { 
			matchMode = 'any'; 
		}
		
		var tags = tagArray.join(',');
		
		var params = {
			'user_id':	userId,
			'method':	 'flickr.photos.search',
			'tags':		 tags,
			'tag_mode': matchMode
		};

		this.doFlickrRequest($.extend({}, params, this.defaultQueryParams));
		
	},
	
	getByUserName: function(username) {

		var params = {
			'method': 'flickr.people.findByUsername',
			'username': username
		};
		
		this.doFlickrRequestCB($.extend({}, this.defaultQueryParams, params), this.getByUserNameCB);
	},

	/* callback for getByUsername */
	getByUserNameCB: function(data) {

		if (data.stat == "fail"){
			// something broke!, maybe we couldn't find the username?
			this.log("Uh oh, you broke it. Flickr says: " + data.message);
			return;
		}

		if (data.stat != "ok"){
			// something i don't know about broke, byebye....
			return;
		}

		this.getByUserId(data.user.nsid);
	},
	
	/* get by username and by tags
	** @param username string giving the username
	** @param tagArray array of tags to match on
	** @param matchMode optional string either 'all' or 'any', related to the tags to match. Default: 'any'
	*/
	getByUserNameAndTag: function(username, tagArray, matchMode) {

		var params = {
			'method': 'flickr.people.findByUsername',
			'username': username
		};
		
		this.doFlickrRequestCB($.extend({}, this.defaultQueryParams, params), function(data) {
			this.getByUserNameAndTagCB(data, tagArray, matchMode)
		});
		
	},
	
	/* callback for getByUsername */
	getByUserNameAndTagCB: function(data, tagArray, matchMode) {
		if (data.stat == "fail"){
			// something broke!, maybe we couldn't find the username?
			// console.log("Uh oh, you broke it. Flickr says: " + data.message);
			return;
		}

		if (data.stat != "ok"){
			// something i don't know about broke, byebye....
			return;
		}
		
		if (matchMode === undefined) { 
			matchMode = 'any'; 
		}
		
		var tags = tagArray.join(',');
		
		var params = {
			'user_id':	data.user.nsid,
			'method':		'flickr.photos.search',
			'tags':			tags,
			'tag_mode': matchMode
		};

		this.doFlickrRequest($.extend({}, this.defaultQueryParams, params));

	},
	
	getPhotoInfo: function(photo_id, callback)
	{
		var params = $.extend({}, this.defaultQueryParams, { 'method': 'flickr.photos.getInfo', 'photo_id': photo_id });
		
		$.ajax({
			url: this.BASE_URL + this.REQ_TYPE + '/',
			dataType: 'jsonp',
			jsonp: 'jsoncallback',
			context: this,
			data: params,
			success: callback
		});
		
	},
	
	doFlickrRequestCB: function(dest_data, cb)
	{
		$.ajax({
			url: this.BASE_URL + this.REQ_TYPE + '/',
			dataType: 'jsonp',
			jsonp: 'jsoncallback',
			context: this,
			data: dest_data,
			success: cb
			
		});
	},
	
	doFlickrRequest: function(reqData) {
		// just simplifies simple flickr calls, so that we don't have to specify the same callback fn all the time.
		this.doFlickrRequestCB(reqData, this.respondToPhotos);
	},

	setCallback: function(cb) {
		this.cb = cb;
		return this;
	},

	respondToPhotos: function(data, JSONPInstance) {

		if (data.stat != "ok"){
			// something i don't know about broke, byebye....
			console.log("Flickr wasn't happy with that request...");
			console.log(data);
			return;
		}

		if (data.photos != undefined)
		{
			this.pix = data.photos.photo;
		} else if (data.photoset != undefined)
		{
			this.pix = data.photoset.photo;
		} else {
			console.log("Uh oh, i couldn't parse flickr's response");
			return;
		}
		
		$(this.pix).each(function(index, item) {
			// http://www.flickr.com/services/api/misc.urls.html has the urls
			item.photoUrl = {};
			item.photoUrl.s = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_s.jpg';
			item.photoUrl.t = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_t.jpg';
			item.photoUrl.m = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_m.jpg';
			item.photoUrl.d = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '.jpg'; // d for dash in api
			item.photoUrl.b = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_b.jpg';
			item.pageUrl = 'http://www.flickr.com/photos/' + item.owner + '/' + item.id;
		});

		/* run the callback, if we can */
		try{
			this.cb.call([], this);
		} catch(err) {
			// oh well, at least we tried.
		}
	}
	
}

// extend the squareweave ninja class
if (ninja === undefined)
{
	var ninja = { flickr_ninja: flickr_ninja };
} else {
	$.extend(ninja, {flickr_ninja: flickr_ninja});
}
