<?php
/**
* {
*    action: String
*    parameters: {}
*    data: [
*		{ 
*           __type: String
*		}
*    ]
* }
*
* Automation:
* Create date, mod date, pub date auto-populated
*
*/

/**
*  Post actions
*/
// Posts
{
    action: 'POST',
    data: {
    	__type: 'POST',
    	body: 'Body Text',
    	// user_id: (populated)
    	// create_date: (populated)
    }

}

// Comments
{
    action: 'POST',
    data: {
    	__type: 'COMMENT',
    	parent_id: 1234,
    	body: 'Comment Text'
    	// user_id: (populated)
    	// create_date: (populated)
    }

}

// Vote (Up/Down)
{
	action: 'POST',
	data: {
		__type: 'VOTE',
		parent_id: 1234,
		// user_id
		value: 1
	}
}

// Abuse report
{
	action: 'POST',
	data: {
		__type: 'TICKET',
		parent_id: 1234, // Post, Comment, User
		// user_id,
		title: 'Title',
		category: 'Abuse Type',
		body: 'Abuse report'
	}
}

/**
*  Channel/page/event actions
*/
// Follow
{
	action: 'POST',
	data: {
		__type: 'FOLLOW',
		parent_id: 1234, // Any type
		user_id: 1234
	}
}