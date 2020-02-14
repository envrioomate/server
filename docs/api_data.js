define({ "api": [
  {
    "type": "post",
    "url": "/api/auth/complete-challenge",
    "title": "Complete Badge",
    "name": "Complete_Challenge",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "id",
            "optional": false,
            "field": "Complete",
            "description": "<p>the challenge with this id</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "The",
            "description": "<p>users group with updated score</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "get",
    "url": "/api/auth/completed-badges",
    "title": "Completed Challenges",
    "name": "Completed_Challenges",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "The",
            "description": "<p>completed badges</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "post",
    "url": "/api/auth/follow-wg",
    "title": "Follow WG",
    "name": "Follow_WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "id",
            "optional": false,
            "field": "id",
            "description": "<p>Follow the group with this id</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "group",
            "description": "<p>The group the user is now following</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "get",
    "url": "/api/auth/followed-wgs",
    "title": "Followed WGs",
    "name": "Followed_WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "groups",
            "description": "<p>Groups the users group is following</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "get",
    "url": "/api/auth/current-challenge",
    "title": "Followed WG",
    "name": "Followed_WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "challenge",
            "description": "<p>gets the current challenge</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "post",
    "url": "/api/auth/join-wg",
    "title": "Join WG",
    "name": "Join_WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "group",
            "description": "<p>The current users new Team</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "description": "<p>Lets users join a group they have the invite link of.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "inviteId",
            "description": "<p>Join group with this invite link</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "post",
    "url": "/api/auth/leave-wg",
    "title": "Leave WG",
    "name": "Leave_WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": ""
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "description": "<p>Removes a user from a group.</p>",
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "post",
    "url": "/api/auth/new-wg",
    "title": "New WG",
    "name": "New_WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "group",
            "description": "<p>The current users newly created group</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "description": "<p>Lets users who are currently not in a group create a new one.</p>",
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "get",
    "url": "/api/auth/profile",
    "title": "Get Profile",
    "name": "Profile",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "user",
            "description": "<p>The currently logged in users data</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "description": "<p>Gets the user data of the logged in user. Authorization via bearer token</p>",
    "examples": [
      {
        "title": "Example usage of bearer token:",
        "content": "GET http://enviroommate.org:3000/api/profile\nAccept: application/json\nCache-Control: no-cache\nContent-Type: application/json\nAuthorization: Bearer eyJhbGciOiJIUzI1NiJ9.Mw.s8smHWCZOUQBxQY-U5Ds2HhsjpNcRY08p_OfNGmimi4\n\nres: {\"id\":3,\"userName\":\"1@test.com\",\"screenName\":\"test\",\"dateCreated\":\"2018-05-25T20:28:11.000Z\",\"emailConfirmed\":false,\"isBanned\":false,\"group\":\"\"}",
        "type": "curl"
      }
    ],
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "get",
    "url": "/api/auth/score",
    "title": "Score",
    "name": "Score",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "The",
            "description": "<p>score of the group</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "get",
    "url": "/api/auth/search-wg",
    "title": "Search Wg",
    "name": "Search_WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "groups",
            "description": "<p>Groups matching the query</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "query",
            "description": "<p>The search query</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "description": "<p>Finds other groups to follow them</p>",
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "post",
    "url": "/api/auth/unfollow-wg",
    "title": "Unfollow WG",
    "name": "Unfollow_WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The unfollowed groups id</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "post",
    "url": "/api/auth/update-wg",
    "title": "Update WG",
    "name": "Update_WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "group",
            "description": "<p>The current users updated group</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "description": "<p>Lets users change the display name of their group.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "newName",
            "description": "<p>Sets the groups name</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "get",
    "url": "/api/auth/wg",
    "title": "Get WG",
    "name": "WG",
    "group": "ClientAPI",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "Authorization",
            "optional": false,
            "field": "Bearer",
            "description": "<p>token  The jwt token</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "group",
            "description": "<p>The current users group</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/controller/ApiController.ts",
    "groupTitle": "ClientAPI"
  },
  {
    "type": "post",
    "url": "/api/login",
    "title": "Login",
    "name": "Login",
    "group": "Client_Login",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "token",
            "description": "<p>the Bearer Token</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "POST http://enviroommate.org:3000/api/login\nAccept: application/json\nCache-Control: no-cache\nContent-Type: application/json\n\n{\"username\" : \"1@test.com\", \"password\":\"test\"}\n\nres: {\"id\":3,\"token\":\"eyJhbGciOiJIUzI1NiJ9.Mw.s8smHWCZOUQBxQY-U5Ds2HhsjpNcRY08p_OfNGmimi4\"}",
        "type": "json"
      }
    ],
    "version": "0.0.0",
    "filename": "src/controller/ApiLandingController.ts",
    "groupTitle": "Client_Login"
  },
  {
    "type": "post",
    "url": "/api/register",
    "title": "Register",
    "name": "Register",
    "group": "Client_Login",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "token",
            "description": "<p>the Bearer Token</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The error</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "POST http://enviroommate.org:3000/api/login\nAccept: application/json\nCache-Control: no-cache\nContent-Type: application/json\n\n{\"username\" : \"1@test.com\", \"password\":\"test\"}\n\nres: {\"id\":3,\"token\":\"eyJhbGciOiJIUzI1NiJ9.Mw.s8smHWCZOUQBxQY-U5Ds2HhsjpNcRY08p_OfNGmimi4\"}",
        "type": "json"
      }
    ],
    "version": "0.0.0",
    "filename": "src/controller/ApiLandingController.ts",
    "groupTitle": "Client_Login"
  }
] });
