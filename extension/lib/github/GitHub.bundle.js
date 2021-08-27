// project page: https://github.com/github-tools/github
// script: https://unpkg.com/github-api@3.4.0/dist/GitHub.bundle.js

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.GitHub = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    /**
     * A Gist can retrieve and modify gists.
     */
    var Gist = function (_Requestable) {
      _inherits(Gist, _Requestable);
    
      /**
       * Create a Gist.
       * @param {string} id - the id of the gist (not required when creating a gist)
       * @param {Requestable.auth} [auth] - information required to authenticate to Github
       * @param {string} [apiBase=https://api.github.com] - the base Github API URL
       */
      function Gist(id, auth, apiBase) {
        _classCallCheck(this, Gist);
    
        var _this = _possibleConstructorReturn(this, (Gist.__proto__ || Object.getPrototypeOf(Gist)).call(this, auth, apiBase));
    
        _this.__id = id;
        return _this;
      }
    
      /**
       * Fetch a gist.
       * @see https://developer.github.com/v3/gists/#get-a-single-gist
       * @param {Requestable.callback} [cb] - will receive the gist
       * @return {Promise} - the Promise for the http request
       */
    
    
      _createClass(Gist, [{
        key: 'read',
        value: function read(cb) {
          return this._request('GET', '/gists/' + this.__id, null, cb);
        }
    
        /**
         * Create a new gist.
         * @see https://developer.github.com/v3/gists/#create-a-gist
         * @param {Object} gist - the data for the new gist
         * @param {Requestable.callback} [cb] - will receive the new gist upon creation
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'create',
        value: function create(gist, cb) {
          var _this2 = this;
    
          return this._request('POST', '/gists', gist, cb).then(function (response) {
            _this2.__id = response.data.id;
            return response;
          });
        }
    
        /**
         * Delete a gist.
         * @see https://developer.github.com/v3/gists/#delete-a-gist
         * @param {Requestable.callback} [cb] - will receive true if the request succeeds
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'delete',
        value: function _delete(cb) {
          return this._request('DELETE', '/gists/' + this.__id, null, cb);
        }
    
        /**
         * Fork a gist.
         * @see https://developer.github.com/v3/gists/#fork-a-gist
         * @param {Requestable.callback} [cb] - the function that will receive the gist
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'fork',
        value: function fork(cb) {
          return this._request('POST', '/gists/' + this.__id + '/forks', null, cb);
        }
    
        /**
         * Update a gist.
         * @see https://developer.github.com/v3/gists/#edit-a-gist
         * @param {Object} gist - the new data for the gist
         * @param {Requestable.callback} [cb] - the function that receives the API result
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'update',
        value: function update(gist, cb) {
          return this._request('PATCH', '/gists/' + this.__id, gist, cb);
        }
    
        /**
         * Star a gist.
         * @see https://developer.github.com/v3/gists/#star-a-gist
         * @param {Requestable.callback} [cb] - will receive true if the request is successful
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'star',
        value: function star(cb) {
          return this._request('PUT', '/gists/' + this.__id + '/star', null, cb);
        }
    
        /**
         * Unstar a gist.
         * @see https://developer.github.com/v3/gists/#unstar-a-gist
         * @param {Requestable.callback} [cb] - will receive true if the request is successful
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'unstar',
        value: function unstar(cb) {
          return this._request('DELETE', '/gists/' + this.__id + '/star', null, cb);
        }
    
        /**
         * Check if a gist is starred by the user.
         * @see https://developer.github.com/v3/gists/#check-if-a-gist-is-starred
         * @param {Requestable.callback} [cb] - will receive true if the gist is starred and false if the gist is not starred
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'isStarred',
        value: function isStarred(cb) {
          return this._request204or404('/gists/' + this.__id + '/star', null, cb);
        }
    
        /**
         * List the gist's commits
         * @see https://developer.github.com/v3/gists/#list-gist-commits
         * @param {Requestable.callback} [cb] - will receive the array of commits
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'listCommits',
        value: function listCommits(cb) {
          return this._requestAllPages('/gists/' + this.__id + '/commits', null, cb);
        }
    
        /**
         * Fetch one of the gist's revision.
         * @see https://developer.github.com/v3/gists/#get-a-specific-revision-of-a-gist
         * @param {string} revision - the id of the revision
         * @param {Requestable.callback} [cb] - will receive the revision
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'getRevision',
        value: function getRevision(revision, cb) {
          return this._request('GET', '/gists/' + this.__id + '/' + revision, null, cb);
        }
    
        /**
         * List the gist's comments
         * @see https://developer.github.com/v3/gists/comments/#list-comments-on-a-gist
         * @param {Requestable.callback} [cb] - will receive the array of comments
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listComments',
        value: function listComments(cb) {
          return this._requestAllPages('/gists/' + this.__id + '/comments', null, cb);
        }
    
        /**
         * Fetch one of the gist's comments
         * @see https://developer.github.com/v3/gists/comments/#get-a-single-comment
         * @param {number} comment - the id of the comment
         * @param {Requestable.callback} [cb] - will receive the comment
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'getComment',
        value: function getComment(comment, cb) {
          return this._request('GET', '/gists/' + this.__id + '/comments/' + comment, null, cb);
        }
    
        /**
         * Comment on a gist
         * @see https://developer.github.com/v3/gists/comments/#create-a-comment
         * @param {string} comment - the comment to add
         * @param {Requestable.callback} [cb] - the function that receives the API result
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'createComment',
        value: function createComment(comment, cb) {
          return this._request('POST', '/gists/' + this.__id + '/comments', { body: comment }, cb);
        }
    
        /**
         * Edit a comment on the gist
         * @see https://developer.github.com/v3/gists/comments/#edit-a-comment
         * @param {number} comment - the id of the comment
         * @param {string} body - the new comment
         * @param {Requestable.callback} [cb] - will receive the modified comment
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'editComment',
        value: function editComment(comment, body, cb) {
          return this._request('PATCH', '/gists/' + this.__id + '/comments/' + comment, { body: body }, cb);
        }
    
        /**
         * Delete a comment on the gist.
         * @see https://developer.github.com/v3/gists/comments/#delete-a-comment
         * @param {number} comment - the id of the comment
         * @param {Requestable.callback} [cb] - will receive true if the request succeeds
         * @return {Promise} - the Promise for the http request
         */
    
      }, {
        key: 'deleteComment',
        value: function deleteComment(comment, cb) {
          return this._request('DELETE', '/gists/' + this.__id + '/comments/' + comment, null, cb);
        }
      }]);
    
      return Gist;
    }(_Requestable3.default);
    
    module.exports = Gist;
    
    },{"./Requestable":9}],2:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */
    /* eslint valid-jsdoc: ["error", {"requireReturnDescription": false}] */
    
    var _Gist = require('./Gist');
    
    var _Gist2 = _interopRequireDefault(_Gist);
    
    var _User = require('./User');
    
    var _User2 = _interopRequireDefault(_User);
    
    var _Issue = require('./Issue');
    
    var _Issue2 = _interopRequireDefault(_Issue);
    
    var _Search = require('./Search');
    
    var _Search2 = _interopRequireDefault(_Search);
    
    var _RateLimit = require('./RateLimit');
    
    var _RateLimit2 = _interopRequireDefault(_RateLimit);
    
    var _Repository = require('./Repository');
    
    var _Repository2 = _interopRequireDefault(_Repository);
    
    var _Organization = require('./Organization');
    
    var _Organization2 = _interopRequireDefault(_Organization);
    
    var _Team = require('./Team');
    
    var _Team2 = _interopRequireDefault(_Team);
    
    var _Markdown = require('./Markdown');
    
    var _Markdown2 = _interopRequireDefault(_Markdown);
    
    var _Project = require('./Project');
    
    var _Project2 = _interopRequireDefault(_Project);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    /**
     * GitHub encapsulates the functionality to create various API wrapper objects.
     */
    var GitHub = function () {
      /**
       * Create a new GitHub.
       * @param {Requestable.auth} [auth] - the credentials to authenticate to Github. If auth is
       *                                  not provided requests will be made unauthenticated
       * @param {string} [apiBase=https://api.github.com] - the base Github API URL
       */
      function GitHub(auth) {
        var apiBase = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'https://api.github.com';
    
        _classCallCheck(this, GitHub);
    
        this.__apiBase = apiBase;
        this.__auth = auth || {};
      }
    
      /**
       * Create a new Gist wrapper
       * @param {string} [id] - the id for the gist, leave undefined when creating a new gist
       * @return {Gist}
       */
    
    
      _createClass(GitHub, [{
        key: 'getGist',
        value: function getGist(id) {
          return new _Gist2.default(id, this.__auth, this.__apiBase);
        }
    
        /**
         * Create a new User wrapper
         * @param {string} [user] - the name of the user to get information about
         *                        leave undefined for the authenticated user
         * @return {User}
         */
    
      }, {
        key: 'getUser',
        value: function getUser(user) {
          return new _User2.default(user, this.__auth, this.__apiBase);
        }
    
        /**
         * Create a new Organization wrapper
         * @param {string} organization - the name of the organization
         * @return {Organization}
         */
    
      }, {
        key: 'getOrganization',
        value: function getOrganization(organization) {
          return new _Organization2.default(organization, this.__auth, this.__apiBase);
        }
    
        /**
         * create a new Team wrapper
         * @param {string} teamId - the name of the team
         * @return {team}
         */
    
      }, {
        key: 'getTeam',
        value: function getTeam(teamId) {
          return new _Team2.default(teamId, this.__auth, this.__apiBase);
        }
    
        /**
         * Create a new Repository wrapper
         * @param {string} user - the user who owns the repository
         * @param {string} repo - the name of the repository
         * @return {Repository}
         */
    
      }, {
        key: 'getRepo',
        value: function getRepo(user, repo) {
          return new _Repository2.default(this._getFullName(user, repo), this.__auth, this.__apiBase);
        }
    
        /**
         * Create a new Issue wrapper
         * @param {string} user - the user who owns the repository
         * @param {string} repo - the name of the repository
         * @return {Issue}
         */
    
      }, {
        key: 'getIssues',
        value: function getIssues(user, repo) {
          return new _Issue2.default(this._getFullName(user, repo), this.__auth, this.__apiBase);
        }
    
        /**
         * Create a new Search wrapper
         * @param {string} query - the query to search for
         * @return {Search}
         */
    
      }, {
        key: 'search',
        value: function search(query) {
          return new _Search2.default(query, this.__auth, this.__apiBase);
        }
    
        /**
         * Create a new RateLimit wrapper
         * @return {RateLimit}
         */
    
      }, {
        key: 'getRateLimit',
        value: function getRateLimit() {
          return new _RateLimit2.default(this.__auth, this.__apiBase);
        }
    
        /**
         * Create a new Markdown wrapper
         * @return {Markdown}
         */
    
      }, {
        key: 'getMarkdown',
        value: function getMarkdown() {
          return new _Markdown2.default(this.__auth, this.__apiBase);
        }
    
        /**
         * Create a new Project wrapper
         * @param {string} id - the id of the project
         * @return {Project}
         */
    
      }, {
        key: 'getProject',
        value: function getProject(id) {
          return new _Project2.default(id, this.__auth, this.__apiBase);
        }
    
        /**
         * Computes the full repository name
         * @param {string} user - the username (or the full name)
         * @param {string} repo - the repository name, must not be passed if `user` is the full name
         * @return {string} the repository's full name
         */
    
      }, {
        key: '_getFullName',
        value: function _getFullName(user, repo) {
          var fullname = user;
    
          if (repo) {
            fullname = user + '/' + repo;
          }
    
          return fullname;
        }
      }]);
    
      return GitHub;
    }();
    
    module.exports = GitHub;
    
    },{"./Gist":1,"./Issue":3,"./Markdown":4,"./Organization":5,"./Project":6,"./RateLimit":7,"./Repository":8,"./Search":10,"./Team":11,"./User":12}],3:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    /**
     * Issue wraps the functionality to get issues for repositories
     */
    var Issue = function (_Requestable) {
      _inherits(Issue, _Requestable);
    
      /**
       * Create a new Issue
       * @param {string} repository - the full name of the repository (`:user/:repo`) to get issues for
       * @param {Requestable.auth} [auth] - information required to authenticate to Github
       * @param {string} [apiBase=https://api.github.com] - the base Github API URL
       */
      function Issue(repository, auth, apiBase) {
        _classCallCheck(this, Issue);
    
        var _this = _possibleConstructorReturn(this, (Issue.__proto__ || Object.getPrototypeOf(Issue)).call(this, auth, apiBase));
    
        _this.__repository = repository;
        return _this;
      }
    
      /**
       * Create a new issue
       * @see https://developer.github.com/v3/issues/#create-an-issue
       * @param {Object} issueData - the issue to create
       * @param {Requestable.callback} [cb] - will receive the created issue
       * @return {Promise} - the promise for the http request
       */
    
    
      _createClass(Issue, [{
        key: 'createIssue',
        value: function createIssue(issueData, cb) {
          return this._request('POST', '/repos/' + this.__repository + '/issues', issueData, cb);
        }
    
        /**
         * List the issues for the repository
         * @see https://developer.github.com/v3/issues/#list-issues-for-a-repository
         * @param {Object} options - filtering options
         * @param {Requestable.callback} [cb] - will receive the array of issues
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listIssues',
        value: function listIssues(options, cb) {
          return this._requestAllPages('/repos/' + this.__repository + '/issues', options, cb);
        }
    
        /**
         * List the events for an issue
         * @see https://developer.github.com/v3/issues/events/#list-events-for-an-issue
         * @param {number} issue - the issue to get events for
         * @param {Requestable.callback} [cb] - will receive the list of events
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listIssueEvents',
        value: function listIssueEvents(issue, cb) {
          return this._request('GET', '/repos/' + this.__repository + '/issues/' + issue + '/events', null, cb);
        }
    
        /**
         * List comments on an issue
         * @see https://developer.github.com/v3/issues/comments/#list-comments-on-an-issue
         * @param {number} issue - the id of the issue to get comments from
         * @param {Requestable.callback} [cb] - will receive the comments
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listIssueComments',
        value: function listIssueComments(issue, cb) {
          return this._request('GET', '/repos/' + this.__repository + '/issues/' + issue + '/comments', null, cb);
        }
    
        /**
         * Get a single comment on an issue
         * @see https://developer.github.com/v3/issues/comments/#get-a-single-comment
         * @param {number} id - the comment id to get
         * @param {Requestable.callback} [cb] - will receive the comment
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'getIssueComment',
        value: function getIssueComment(id, cb) {
          return this._request('GET', '/repos/' + this.__repository + '/issues/comments/' + id, null, cb);
        }
    
        /**
         * Comment on an issue
         * @see https://developer.github.com/v3/issues/comments/#create-a-comment
         * @param {number} issue - the id of the issue to comment on
         * @param {string} comment - the comment to add
         * @param {Requestable.callback} [cb] - will receive the created comment
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'createIssueComment',
        value: function createIssueComment(issue, comment, cb) {
          return this._request('POST', '/repos/' + this.__repository + '/issues/' + issue + '/comments', { body: comment }, cb);
        }
    
        /**
         * Edit a comment on an issue
         * @see https://developer.github.com/v3/issues/comments/#edit-a-comment
         * @param {number} id - the comment id to edit
         * @param {string} comment - the comment to edit
         * @param {Requestable.callback} [cb] - will receive the edited comment
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'editIssueComment',
        value: function editIssueComment(id, comment, cb) {
          return this._request('PATCH', '/repos/' + this.__repository + '/issues/comments/' + id, { body: comment }, cb);
        }
    
        /**
         * Delete a comment on an issue
         * @see https://developer.github.com/v3/issues/comments/#delete-a-comment
         * @param {number} id - the comment id to delete
         * @param {Requestable.callback} [cb] - will receive true if the request is successful
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'deleteIssueComment',
        value: function deleteIssueComment(id, cb) {
          return this._request('DELETE', '/repos/' + this.__repository + '/issues/comments/' + id, null, cb);
        }
    
        /**
         * Edit an issue
         * @see https://developer.github.com/v3/issues/#edit-an-issue
         * @param {number} issue - the issue number to edit
         * @param {Object} issueData - the new issue data
         * @param {Requestable.callback} [cb] - will receive the modified issue
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'editIssue',
        value: function editIssue(issue, issueData, cb) {
          return this._request('PATCH', '/repos/' + this.__repository + '/issues/' + issue, issueData, cb);
        }
    
        /**
         * Get a particular issue
         * @see https://developer.github.com/v3/issues/#get-a-single-issue
         * @param {number} issue - the issue number to fetch
         * @param {Requestable.callback} [cb] - will receive the issue
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'getIssue',
        value: function getIssue(issue, cb) {
          return this._request('GET', '/repos/' + this.__repository + '/issues/' + issue, null, cb);
        }
    
        /**
         * List the milestones for the repository
         * @see https://developer.github.com/v3/issues/milestones/#list-milestones-for-a-repository
         * @param {Object} options - filtering options
         * @param {Requestable.callback} [cb] - will receive the array of milestones
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listMilestones',
        value: function listMilestones(options, cb) {
          return this._request('GET', '/repos/' + this.__repository + '/milestones', options, cb);
        }
    
        /**
         * Get a milestone
         * @see https://developer.github.com/v3/issues/milestones/#get-a-single-milestone
         * @param {string} milestone - the id of the milestone to fetch
         * @param {Requestable.callback} [cb] - will receive the milestone
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'getMilestone',
        value: function getMilestone(milestone, cb) {
          return this._request('GET', '/repos/' + this.__repository + '/milestones/' + milestone, null, cb);
        }
    
        /**
         * Create a new milestone
         * @see https://developer.github.com/v3/issues/milestones/#create-a-milestone
         * @param {Object} milestoneData - the milestone definition
         * @param {Requestable.callback} [cb] - will receive the milestone
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'createMilestone',
        value: function createMilestone(milestoneData, cb) {
          return this._request('POST', '/repos/' + this.__repository + '/milestones', milestoneData, cb);
        }
    
        /**
         * Edit a milestone
         * @see https://developer.github.com/v3/issues/milestones/#update-a-milestone
         * @param {string} milestone - the id of the milestone to edit
         * @param {Object} milestoneData - the updates to make to the milestone
         * @param {Requestable.callback} [cb] - will receive the updated milestone
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'editMilestone',
        value: function editMilestone(milestone, milestoneData, cb) {
          return this._request('PATCH', '/repos/' + this.__repository + '/milestones/' + milestone, milestoneData, cb);
        }
    
        /**
         * Delete a milestone (this is distinct from closing a milestone)
         * @see https://developer.github.com/v3/issues/milestones/#delete-a-milestone
         * @param {string} milestone - the id of the milestone to delete
         * @param {Requestable.callback} [cb] - will receive the status
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'deleteMilestone',
        value: function deleteMilestone(milestone, cb) {
          return this._request('DELETE', '/repos/' + this.__repository + '/milestones/' + milestone, null, cb);
        }
    
        /**
         * Create a new label
         * @see https://developer.github.com/v3/issues/labels/#create-a-label
         * @param {Object} labelData - the label definition
         * @param {Requestable.callback} [cb] - will receive the object representing the label
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'createLabel',
        value: function createLabel(labelData, cb) {
          return this._request('POST', '/repos/' + this.__repository + '/labels', labelData, cb);
        }
    
        /**
         * List the labels for the repository
         * @see https://developer.github.com/v3/issues/labels/#list-all-labels-for-this-repository
         * @param {Object} options - filtering options
         * @param {Requestable.callback} [cb] - will receive the array of labels
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listLabels',
        value: function listLabels(options, cb) {
          return this._request('GET', '/repos/' + this.__repository + '/labels', options, cb);
        }
    
        /**
         * Get a label
         * @see https://developer.github.com/v3/issues/labels/#get-a-single-label
         * @param {string} label - the name of the label to fetch
         * @param {Requestable.callback} [cb] - will receive the label
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'getLabel',
        value: function getLabel(label, cb) {
          return this._request('GET', '/repos/' + this.__repository + '/labels/' + label, null, cb);
        }
    
        /**
         * Edit a label
         * @see https://developer.github.com/v3/issues/labels/#update-a-label
         * @param {string} label - the name of the label to edit
         * @param {Object} labelData - the updates to make to the label
         * @param {Requestable.callback} [cb] - will receive the updated label
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'editLabel',
        value: function editLabel(label, labelData, cb) {
          return this._request('PATCH', '/repos/' + this.__repository + '/labels/' + label, labelData, cb);
        }
    
        /**
         * Delete a label
         * @see https://developer.github.com/v3/issues/labels/#delete-a-label
         * @param {string} label - the name of the label to delete
         * @param {Requestable.callback} [cb] - will receive the status
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'deleteLabel',
        value: function deleteLabel(label, cb) {
          return this._request('DELETE', '/repos/' + this.__repository + '/labels/' + label, null, cb);
        }
      }]);
    
      return Issue;
    }(_Requestable3.default);
    
    module.exports = Issue;
    
    },{"./Requestable":9}],4:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    /**
     * Renders html from Markdown text
     */
    var Markdown = function (_Requestable) {
      _inherits(Markdown, _Requestable);
    
      /**
       * construct a Markdown
       * @param {Requestable.auth} auth - the credentials to authenticate to GitHub
       * @param {string} [apiBase] - the base Github API URL
       * @return {Promise} - the promise for the http request
       */
      function Markdown(auth, apiBase) {
        _classCallCheck(this, Markdown);
    
        return _possibleConstructorReturn(this, (Markdown.__proto__ || Object.getPrototypeOf(Markdown)).call(this, auth, apiBase));
      }
    
      /**
       * Render html from Markdown text.
       * @see https://developer.github.com/v3/markdown/#render-an-arbitrary-markdown-document
       * @param {Object} options - conversion options
       * @param {string} [options.text] - the markdown text to convert
       * @param {string} [options.mode=markdown] - can be either `markdown` or `gfm`
       * @param {string} [options.context] - repository name if mode is gfm
       * @param {Requestable.callback} [cb] - will receive the converted html
       * @return {Promise} - the promise for the http request
       */
    
    
      _createClass(Markdown, [{
        key: 'render',
        value: function render(options, cb) {
          return this._request('POST', '/markdown', options, cb, true);
        }
      }]);
    
      return Markdown;
    }(_Requestable3.default);
    
    module.exports = Markdown;
    
    },{"./Requestable":9}],5:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    /**
     * Organization encapsulates the functionality to create repositories in organizations
     */
    var Organization = function (_Requestable) {
      _inherits(Organization, _Requestable);
    
      /**
       * Create a new Organization
       * @param {string} organization - the name of the organization
       * @param {Requestable.auth} [auth] - information required to authenticate to Github
       * @param {string} [apiBase=https://api.github.com] - the base Github API URL
       */
      function Organization(organization, auth, apiBase) {
        _classCallCheck(this, Organization);
    
        var _this = _possibleConstructorReturn(this, (Organization.__proto__ || Object.getPrototypeOf(Organization)).call(this, auth, apiBase));
    
        _this.__name = organization;
        return _this;
      }
    
      /**
       * Create a repository in an organization
       * @see https://developer.github.com/v3/repos/#create
       * @param {Object} options - the repository definition
       * @param {Requestable.callback} [cb] - will receive the created repository
       * @return {Promise} - the promise for the http request
       */
    
    
      _createClass(Organization, [{
        key: 'createRepo',
        value: function createRepo(options, cb) {
          return this._request('POST', '/orgs/' + this.__name + '/repos', options, cb);
        }
    
        /**
         * List the repositories in an organization
         * @see https://developer.github.com/v3/repos/#list-organization-repositories
         * @param {Requestable.callback} [cb] - will receive the list of repositories
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'getRepos',
        value: function getRepos(cb) {
          var requestOptions = this._getOptionsWithDefaults({ direction: 'desc' });
    
          return this._requestAllPages('/orgs/' + this.__name + '/repos', requestOptions, cb);
        }
    
        /**
         * Query if the user is a member or not
         * @param {string} username - the user in question
         * @param {Requestable.callback} [cb] - will receive true if the user is a member
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'isMember',
        value: function isMember(username, cb) {
          return this._request204or404('/orgs/' + this.__name + '/members/' + username, null, cb);
        }
    
        /**
         * List the users who are members of the company
         * @see https://developer.github.com/v3/orgs/members/#members-list
         * @param {object} options - filtering options
         * @param {string} [options.filter=all] - can be either `2fa_disabled` or `all`
         * @param {string} [options.role=all] - can be one of: `all`, `admin`, or `member`
         * @param {Requestable.callback} [cb] - will receive the list of users
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listMembers',
        value: function listMembers(options, cb) {
          return this._request('GET', '/orgs/' + this.__name + '/members', options, cb);
        }
    
        /**
         * List the Teams in the Organization
         * @see https://developer.github.com/v3/orgs/teams/#list-teams
         * @param {Requestable.callback} [cb] - will receive the list of teams
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'getTeams',
        value: function getTeams(cb) {
          return this._requestAllPages('/orgs/' + this.__name + '/teams', undefined, cb);
        }
    
        /**
         * Create a team
         * @see https://developer.github.com/v3/orgs/teams/#create-team
         * @param {object} options - Team creation parameters
         * @param {string} options.name - The name of the team
         * @param {string} [options.description] - Team description
         * @param {string} [options.repo_names] - Repos to add the team to
         * @param {string} [options.privacy=secret] - The level of privacy the team should have. Can be either one
         * of: `secret`, or `closed`
         * @param {Requestable.callback} [cb] - will receive the created team
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'createTeam',
        value: function createTeam(options, cb) {
          return this._request('POST', '/orgs/' + this.__name + '/teams', options, cb);
        }
    
        /**
         * Get information about all projects
         * @see https://developer.github.com/v3/projects/#list-organization-projects
         * @param {Requestable.callback} [cb] - will receive the list of projects
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listProjects',
        value: function listProjects(cb) {
          return this._requestAllPages('/orgs/' + this.__name + '/projects', { AcceptHeader: 'inertia-preview' }, cb);
        }
    
        /**
         * Create a new project
         * @see https://developer.github.com/v3/repos/projects/#create-a-project
         * @param {Object} options - the description of the project
         * @param {Requestable.callback} cb - will receive the newly created project
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'createProject',
        value: function createProject(options, cb) {
          options = options || {};
          options.AcceptHeader = 'inertia-preview';
          return this._request('POST', '/orgs/' + this.__name + '/projects', options, cb);
        }
      }]);
    
      return Organization;
    }(_Requestable3.default);
    
    module.exports = Organization;
    
    },{"./Requestable":9}],6:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    /**
     * Project encapsulates the functionality to create, query, and modify cards and columns.
     */
    var Project = function (_Requestable) {
       _inherits(Project, _Requestable);
    
       /**
        * Create a Project.
        * @param {string} id - the id of the project
        * @param {Requestable.auth} [auth] - information required to authenticate to Github
        * @param {string} [apiBase=https://api.github.com] - the base Github API URL
        */
       function Project(id, auth, apiBase) {
          _classCallCheck(this, Project);
    
          var _this = _possibleConstructorReturn(this, (Project.__proto__ || Object.getPrototypeOf(Project)).call(this, auth, apiBase, 'inertia-preview'));
    
          _this.__id = id;
          return _this;
       }
    
       /**
        * Get information about a project
        * @see https://developer.github.com/v3/projects/#get-a-project
        * @param {Requestable.callback} cb - will receive the project information
        * @return {Promise} - the promise for the http request
        */
    
    
       _createClass(Project, [{
          key: 'getProject',
          value: function getProject(cb) {
             return this._request('GET', '/projects/' + this.__id, null, cb);
          }
    
          /**
           * Edit a project
           * @see https://developer.github.com/v3/projects/#update-a-project
           * @param {Object} options - the description of the project
           * @param {Requestable.callback} cb - will receive the modified project
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'updateProject',
          value: function updateProject(options, cb) {
             return this._request('PATCH', '/projects/' + this.__id, options, cb);
          }
    
          /**
           * Delete a project
           * @see https://developer.github.com/v3/projects/#delete-a-project
           * @param {Requestable.callback} cb - will receive true if the operation is successful
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'deleteProject',
          value: function deleteProject(cb) {
             return this._request('DELETE', '/projects/' + this.__id, null, cb);
          }
    
          /**
           * Get information about all columns of a project
           * @see https://developer.github.com/v3/projects/columns/#list-project-columns
           * @param {Requestable.callback} [cb] - will receive the list of columns
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listProjectColumns',
          value: function listProjectColumns(cb) {
             return this._requestAllPages('/projects/' + this.__id + '/columns', null, cb);
          }
    
          /**
           * Get information about a column
           * @see https://developer.github.com/v3/projects/columns/#get-a-project-column
           * @param {string} colId - the id of the column
           * @param {Requestable.callback} cb - will receive the column information
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getProjectColumn',
          value: function getProjectColumn(colId, cb) {
             return this._request('GET', '/projects/columns/' + colId, null, cb);
          }
    
          /**
           * Create a new column
           * @see https://developer.github.com/v3/projects/columns/#create-a-project-column
           * @param {Object} options - the description of the column
           * @param {Requestable.callback} cb - will receive the newly created column
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createProjectColumn',
          value: function createProjectColumn(options, cb) {
             return this._request('POST', '/projects/' + this.__id + '/columns', options, cb);
          }
    
          /**
           * Edit a column
           * @see https://developer.github.com/v3/projects/columns/#update-a-project-column
           * @param {string} colId - the column id
           * @param {Object} options - the description of the column
           * @param {Requestable.callback} cb - will receive the modified column
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'updateProjectColumn',
          value: function updateProjectColumn(colId, options, cb) {
             return this._request('PATCH', '/projects/columns/' + colId, options, cb);
          }
    
          /**
           * Delete a column
           * @see https://developer.github.com/v3/projects/columns/#delete-a-project-column
           * @param {string} colId - the column to be deleted
           * @param {Requestable.callback} cb - will receive true if the operation is successful
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'deleteProjectColumn',
          value: function deleteProjectColumn(colId, cb) {
             return this._request('DELETE', '/projects/columns/' + colId, null, cb);
          }
    
          /**
           * Move a column
           * @see https://developer.github.com/v3/projects/columns/#move-a-project-column
           * @param {string} colId - the column to be moved
           * @param {string} position - can be one of first, last, or after:<column-id>,
           * where <column-id> is the id value of a column in the same project.
           * @param {Requestable.callback} cb - will receive true if the operation is successful
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'moveProjectColumn',
          value: function moveProjectColumn(colId, position, cb) {
             return this._request('POST', '/projects/columns/' + colId + '/moves', { position: position }, cb);
          }
    
          /**
           * Get information about all cards of a project
           * @see https://developer.github.com/v3/projects/cards/#list-project-cards
           * @param {Requestable.callback} [cb] - will receive the list of cards
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listProjectCards',
          value: function listProjectCards(cb) {
             var _this2 = this;
    
             return this.listProjectColumns().then(function (_ref) {
                var data = _ref.data;
    
                return Promise.all(data.map(function (column) {
                   return _this2._requestAllPages('/projects/columns/' + column.id + '/cards', null);
                }));
             }).then(function (cardsInColumns) {
                var cards = cardsInColumns.reduce(function (prev, _ref2) {
                   var data = _ref2.data;
    
                   prev.push.apply(prev, _toConsumableArray(data));
                   return prev;
                }, []);
                if (cb) {
                   cb(null, cards);
                }
                return cards;
             }).catch(function (err) {
                if (cb) {
                   cb(err);
                   return;
                }
                throw err;
             });
          }
    
          /**
          * Get information about all cards of a column
          * @see https://developer.github.com/v3/projects/cards/#list-project-cards
          * @param {string} colId - the id of the column
          * @param {Requestable.callback} [cb] - will receive the list of cards
          * @return {Promise} - the promise for the http request
          */
    
       }, {
          key: 'listColumnCards',
          value: function listColumnCards(colId, cb) {
             return this._requestAllPages('/projects/columns/' + colId + '/cards', null, cb);
          }
    
          /**
          * Get information about a card
          * @see https://developer.github.com/v3/projects/cards/#get-a-project-card
          * @param {string} cardId - the id of the card
          * @param {Requestable.callback} cb - will receive the card information
          * @return {Promise} - the promise for the http request
          */
    
       }, {
          key: 'getProjectCard',
          value: function getProjectCard(cardId, cb) {
             return this._request('GET', '/projects/columns/cards/' + cardId, null, cb);
          }
    
          /**
          * Create a new card
          * @see https://developer.github.com/v3/projects/cards/#create-a-project-card
          * @param {string} colId - the column id
          * @param {Object} options - the description of the card
          * @param {Requestable.callback} cb - will receive the newly created card
          * @return {Promise} - the promise for the http request
          */
    
       }, {
          key: 'createProjectCard',
          value: function createProjectCard(colId, options, cb) {
             return this._request('POST', '/projects/columns/' + colId + '/cards', options, cb);
          }
    
          /**
          * Edit a card
          * @see https://developer.github.com/v3/projects/cards/#update-a-project-card
          * @param {string} cardId - the card id
          * @param {Object} options - the description of the card
          * @param {Requestable.callback} cb - will receive the modified card
          * @return {Promise} - the promise for the http request
          */
    
       }, {
          key: 'updateProjectCard',
          value: function updateProjectCard(cardId, options, cb) {
             return this._request('PATCH', '/projects/columns/cards/' + cardId, options, cb);
          }
    
          /**
          * Delete a card
          * @see https://developer.github.com/v3/projects/cards/#delete-a-project-card
          * @param {string} cardId - the card to be deleted
          * @param {Requestable.callback} cb - will receive true if the operation is successful
          * @return {Promise} - the promise for the http request
          */
    
       }, {
          key: 'deleteProjectCard',
          value: function deleteProjectCard(cardId, cb) {
             return this._request('DELETE', '/projects/columns/cards/' + cardId, null, cb);
          }
    
          /**
          * Move a card
          * @see https://developer.github.com/v3/projects/cards/#move-a-project-card
          * @param {string} cardId - the card to be moved
          * @param {string} position - can be one of top, bottom, or after:<card-id>,
          * where <card-id> is the id value of a card in the same project.
          * @param {string} colId - the id value of a column in the same project.
          * @param {Requestable.callback} cb - will receive true if the operation is successful
          * @return {Promise} - the promise for the http request
          */
    
       }, {
          key: 'moveProjectCard',
          value: function moveProjectCard(cardId, position, colId, cb) {
             return this._request('POST', '/projects/columns/cards/' + cardId + '/moves', { position: position, column_id: colId }, // eslint-disable-line camelcase
             cb);
          }
       }]);
    
       return Project;
    }(_Requestable3.default);
    
    module.exports = Project;
    
    },{"./Requestable":9}],7:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    /**
     * RateLimit allows users to query their rate-limit status
     */
    var RateLimit = function (_Requestable) {
      _inherits(RateLimit, _Requestable);
    
      /**
       * construct a RateLimit
       * @param {Requestable.auth} auth - the credentials to authenticate to GitHub
       * @param {string} [apiBase] - the base Github API URL
       * @return {Promise} - the promise for the http request
       */
      function RateLimit(auth, apiBase) {
        _classCallCheck(this, RateLimit);
    
        return _possibleConstructorReturn(this, (RateLimit.__proto__ || Object.getPrototypeOf(RateLimit)).call(this, auth, apiBase));
      }
    
      /**
       * Query the current rate limit
       * @see https://developer.github.com/v3/rate_limit/
       * @param {Requestable.callback} [cb] - will receive the rate-limit data
       * @return {Promise} - the promise for the http request
       */
    
    
      _createClass(RateLimit, [{
        key: 'getRateLimit',
        value: function getRateLimit(cb) {
          return this._request('GET', '/rate_limit', null, cb);
        }
      }]);
    
      return RateLimit;
    }(_Requestable3.default);
    
    module.exports = RateLimit;
    
    },{"./Requestable":9}],8:[function(require,module,exports){
    (function (Buffer){(function (){
    'use strict';
    
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    var _utf = require('utf8');
    
    var _utf2 = _interopRequireDefault(_utf);
    
    var _jsBase = require('js-base64');
    
    var _debug = require('debug');
    
    var _debug2 = _interopRequireDefault(_debug);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    var log = (0, _debug2.default)('github:repository');
    
    /**
     * Repository encapsulates the functionality to create, query, and modify files.
     */
    
    var Repository = function (_Requestable) {
       _inherits(Repository, _Requestable);
    
       /**
        * Create a Repository.
        * @param {string} fullname - the full name of the repository
        * @param {Requestable.auth} [auth] - information required to authenticate to Github
        * @param {string} [apiBase=https://api.github.com] - the base Github API URL
        */
       function Repository(fullname, auth, apiBase) {
          _classCallCheck(this, Repository);
    
          var _this = _possibleConstructorReturn(this, (Repository.__proto__ || Object.getPrototypeOf(Repository)).call(this, auth, apiBase));
    
          _this.__fullname = fullname;
          _this.__currentTree = {
             branch: null,
             sha: null
          };
          return _this;
       }
    
       /**
        * Get a reference
        * @see https://developer.github.com/v3/git/refs/#get-a-reference
        * @param {string} ref - the reference to get
        * @param {Requestable.callback} [cb] - will receive the reference's refSpec or a list of refSpecs that match `ref`
        * @return {Promise} - the promise for the http request
        */
    
    
       _createClass(Repository, [{
          key: 'getRef',
          value: function getRef(ref, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/git/refs/' + ref, null, cb);
          }
    
          /**
           * Create a reference
           * @see https://developer.github.com/v3/git/refs/#create-a-reference
           * @param {Object} options - the object describing the ref
           * @param {Requestable.callback} [cb] - will receive the ref
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createRef',
          value: function createRef(options, cb) {
             return this._request('POST', '/repos/' + this.__fullname + '/git/refs', options, cb);
          }
    
          /**
           * Delete a reference
           * @see https://developer.github.com/v3/git/refs/#delete-a-reference
           * @param {string} ref - the name of the ref to delte
           * @param {Requestable.callback} [cb] - will receive true if the request is successful
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'deleteRef',
          value: function deleteRef(ref, cb) {
             return this._request('DELETE', '/repos/' + this.__fullname + '/git/refs/' + ref, null, cb);
          }
    
          /**
           * Delete a repository
           * @see https://developer.github.com/v3/repos/#delete-a-repository
           * @param {Requestable.callback} [cb] - will receive true if the request is successful
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'deleteRepo',
          value: function deleteRepo(cb) {
             return this._request('DELETE', '/repos/' + this.__fullname, null, cb);
          }
    
          /**
           * List the tags on a repository
           * @see https://developer.github.com/v3/repos/#list-tags
           * @param {Requestable.callback} [cb] - will receive the tag data
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listTags',
          value: function listTags(cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/tags', null, cb);
          }
    
          /**
           * List the open pull requests on the repository
           * @see https://developer.github.com/v3/pulls/#list-pull-requests
           * @param {Object} options - options to filter the search
           * @param {Requestable.callback} [cb] - will receive the list of PRs
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listPullRequests',
          value: function listPullRequests(options, cb) {
             options = options || {};
             return this._request('GET', '/repos/' + this.__fullname + '/pulls', options, cb);
          }
    
          /**
           * Get information about a specific pull request
           * @see https://developer.github.com/v3/pulls/#get-a-single-pull-request
           * @param {number} number - the PR you wish to fetch
           * @param {Requestable.callback} [cb] - will receive the PR from the API
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getPullRequest',
          value: function getPullRequest(number, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/pulls/' + number, null, cb);
          }
    
          /**
           * List the files of a specific pull request
           * @see https://developer.github.com/v3/pulls/#list-pull-requests-files
           * @param {number|string} number - the PR you wish to fetch
           * @param {Requestable.callback} [cb] - will receive the list of files from the API
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listPullRequestFiles',
          value: function listPullRequestFiles(number, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/pulls/' + number + '/files', null, cb);
          }
    
          /**
           * Compare two branches/commits/repositories
           * @see https://developer.github.com/v3/repos/commits/#compare-two-commits
           * @param {string} base - the base commit
           * @param {string} head - the head commit
           * @param {Requestable.callback} cb - will receive the comparison
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'compareBranches',
          value: function compareBranches(base, head, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/compare/' + base + '...' + head, null, cb);
          }
    
          /**
           * List all the branches for the repository
           * @see https://developer.github.com/v3/repos/#list-branches
           * @param {Requestable.callback} cb - will receive the list of branches
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listBranches',
          value: function listBranches(cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/branches', null, cb);
          }
    
          /**
           * Get a raw blob from the repository
           * @see https://developer.github.com/v3/git/blobs/#get-a-blob
           * @param {string} sha - the sha of the blob to fetch
           * @param {Requestable.callback} cb - will receive the blob from the API
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getBlob',
          value: function getBlob(sha, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/git/blobs/' + sha, null, cb, 'raw');
          }
    
          /**
           * Get a single branch
           * @see https://developer.github.com/v3/repos/branches/#get-branch
           * @param {string} branch - the name of the branch to fetch
           * @param {Requestable.callback} cb - will receive the branch from the API
           * @returns {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getBranch',
          value: function getBranch(branch, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/branches/' + branch, null, cb);
          }
    
          /**
           * Get a commit from the repository
           * @see https://developer.github.com/v3/repos/commits/#get-a-single-commit
           * @param {string} sha - the sha for the commit to fetch
           * @param {Requestable.callback} cb - will receive the commit data
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getCommit',
          value: function getCommit(sha, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/git/commits/' + sha, null, cb);
          }
    
          /**
           * List the commits on a repository, optionally filtering by path, author or time range
           * @see https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
           * @param {Object} [options] - the filtering options for commits
           * @param {string} [options.sha] - the SHA or branch to start from
           * @param {string} [options.path] - the path to search on
           * @param {string} [options.author] - the commit author
           * @param {(Date|string)} [options.since] - only commits after this date will be returned
           * @param {(Date|string)} [options.until] - only commits before this date will be returned
           * @param {Requestable.callback} cb - will receive the list of commits found matching the criteria
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listCommits',
          value: function listCommits(options, cb) {
             options = options || {};
             if (typeof options === 'function') {
                cb = options;
                options = {};
             }
             options.since = this._dateToISO(options.since);
             options.until = this._dateToISO(options.until);
    
             return this._request('GET', '/repos/' + this.__fullname + '/commits', options, cb);
          }
    
          /**
           * List the commits on a pull request
           * @see https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
           * @param {number|string} number - the number of the pull request to list the commits
           * @param {Object} [options] - the filtering options for commits
           * @param {Requestable.callback} [cb] - will receive the commits information
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listCommitsOnPR',
          value: function listCommitsOnPR(number, options, cb) {
             options = options || {};
             if (typeof options === 'function') {
                cb = options;
                options = {};
             }
             return this._request('GET', '/repos/' + this.__fullname + '/pulls/' + number + '/commits', options, cb);
          }
    
          /**
           * Gets a single commit information for a repository
           * @see https://developer.github.com/v3/repos/commits/#get-a-single-commit
           * @param {string} ref - the reference for the commit-ish
           * @param {Requestable.callback} cb - will receive the commit information
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getSingleCommit',
          value: function getSingleCommit(ref, cb) {
             ref = ref || '';
             return this._request('GET', '/repos/' + this.__fullname + '/commits/' + ref, null, cb);
          }
    
          /**
           * Get tha sha for a particular object in the repository. This is a convenience function
           * @see https://developer.github.com/v3/repos/contents/#get-contents
           * @param {string} [branch] - the branch to look in, or the repository's default branch if omitted
           * @param {string} path - the path of the file or directory
           * @param {Requestable.callback} cb - will receive a description of the requested object, including a `SHA` property
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getSha',
          value: function getSha(branch, path, cb) {
             branch = branch ? '?ref=' + branch : '';
             return this._request('GET', '/repos/' + this.__fullname + '/contents/' + path + branch, null, cb);
          }
    
          /**
           * List the commit statuses for a particular sha, branch, or tag
           * @see https://developer.github.com/v3/repos/statuses/#list-statuses-for-a-specific-ref
           * @param {string} sha - the sha, branch, or tag to get statuses for
           * @param {Requestable.callback} cb - will receive the list of statuses
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listStatuses',
          value: function listStatuses(sha, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/commits/' + sha + '/statuses', null, cb);
          }
    
          /**
           * Get the combined view of commit statuses for a particular sha, branch, or tag
           * @see https://developer.github.com/v3/repos/statuses/#get-the-combined-status-for-a-specific-ref
           * @param {string} sha - the sha, branch, or tag to get the combined status for
           * @param {Requestable.callback} cb - will receive the combined status
           * @returns {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getCombinedStatus',
          value: function getCombinedStatus(sha, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/commits/' + sha + '/status', null, cb);
          }
    
          /**
           * Get a description of a git tree
           * @see https://developer.github.com/v3/git/trees/#get-a-tree
           * @param {string} treeSHA - the SHA of the tree to fetch
           * @param {Requestable.callback} cb - will receive the callback data
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getTree',
          value: function getTree(treeSHA, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/git/trees/' + treeSHA, null, cb);
          }
    
          /**
           * Create a blob
           * @see https://developer.github.com/v3/git/blobs/#create-a-blob
           * @param {(string|Buffer|Blob)} content - the content to add to the repository
           * @param {Requestable.callback} cb - will receive the details of the created blob
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createBlob',
          value: function createBlob(content, cb) {
             var postBody = this._getContentObject(content);
    
             log('sending content', postBody);
             return this._request('POST', '/repos/' + this.__fullname + '/git/blobs', postBody, cb);
          }
    
          /**
           * Get the object that represents the provided content
           * @param {string|Buffer|Blob} content - the content to send to the server
           * @return {Object} the representation of `content` for the GitHub API
           */
    
       }, {
          key: '_getContentObject',
          value: function _getContentObject(content) {
             if (typeof content === 'string') {
                log('contet is a string');
                return {
                   content: _utf2.default.encode(content),
                   encoding: 'utf-8'
                };
             } else if (typeof Buffer !== 'undefined' && content instanceof Buffer) {
                log('We appear to be in Node');
                return {
                   content: content.toString('base64'),
                   encoding: 'base64'
                };
             } else if (typeof Blob !== 'undefined' && content instanceof Blob) {
                log('We appear to be in the browser');
                return {
                   content: _jsBase.Base64.encode(content),
                   encoding: 'base64'
                };
             } else {
                // eslint-disable-line
                log('Not sure what this content is: ' + (typeof content === 'undefined' ? 'undefined' : _typeof(content)) + ', ' + JSON.stringify(content));
                throw new Error('Unknown content passed to postBlob. Must be string or Buffer (node) or Blob (web)');
             }
          }
    
          /**
           * Update a tree in Git
           * @see https://developer.github.com/v3/git/trees/#create-a-tree
           * @param {string} baseTreeSHA - the SHA of the tree to update
           * @param {string} path - the path for the new file
           * @param {string} blobSHA - the SHA for the blob to put at `path`
           * @param {Requestable.callback} cb - will receive the new tree that is created
           * @return {Promise} - the promise for the http request
           * @deprecated use {@link Repository#createTree} instead
           */
    
       }, {
          key: 'updateTree',
          value: function updateTree(baseTreeSHA, path, blobSHA, cb) {
             var newTree = {
                base_tree: baseTreeSHA, // eslint-disable-line
                tree: [{
                   path: path,
                   sha: blobSHA,
                   mode: '100644',
                   type: 'blob'
                }]
             };
    
             return this._request('POST', '/repos/' + this.__fullname + '/git/trees', newTree, cb);
          }
    
          /**
           * Create a new tree in git
           * @see https://developer.github.com/v3/git/trees/#create-a-tree
           * @param {Object} tree - the tree to create
           * @param {string} baseSHA - the root sha of the tree
           * @param {Requestable.callback} cb - will receive the new tree that is created
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createTree',
          value: function createTree(tree, baseSHA, cb) {
             return this._request('POST', '/repos/' + this.__fullname + '/git/trees', {
                tree: tree,
                base_tree: baseSHA // eslint-disable-line camelcase
             }, cb);
          }
    
          /**
           * Add a commit to the repository
           * @see https://developer.github.com/v3/git/commits/#create-a-commit
           * @param {string} parent - the SHA of the parent commit
           * @param {string} tree - the SHA of the tree for this commit
           * @param {string} message - the commit message
           * @param {Object} [options] - commit options
           * @param {Object} [options.author] - the author of the commit
           * @param {Object} [options.commiter] - the committer
           * @param {Requestable.callback} cb - will receive the commit that is created
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'commit',
          value: function commit(parent, tree, message, options, cb) {
             var _this2 = this;
    
             if (typeof options === 'function') {
                cb = options;
                options = {};
             }
    
             var data = {
                message: message,
                tree: tree,
                parents: [parent]
             };
    
             data = Object.assign({}, options, data);
    
             return this._request('POST', '/repos/' + this.__fullname + '/git/commits', data, cb).then(function (response) {
                _this2.__currentTree.sha = response.data.sha; // Update latest commit
                return response;
             });
          }
    
          /**
           * Update a ref
           * @see https://developer.github.com/v3/git/refs/#update-a-reference
           * @param {string} ref - the ref to update
           * @param {string} commitSHA - the SHA to point the reference to
           * @param {boolean} force - indicates whether to force or ensure a fast-forward update
           * @param {Requestable.callback} cb - will receive the updated ref back
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'updateHead',
          value: function updateHead(ref, commitSHA, force, cb) {
             return this._request('PATCH', '/repos/' + this.__fullname + '/git/refs/' + ref, {
                sha: commitSHA,
                force: force
             }, cb);
          }
    
          /**
           * Update commit status
           * @see https://developer.github.com/v3/repos/statuses/
           * @param {string} commitSHA - the SHA of the commit that should be updated
           * @param {object} options - Commit status parameters
           * @param {string} options.state - The state of the status. Can be one of: pending, success, error, or failure.
           * @param {string} [options.target_url] - The target URL to associate with this status.
           * @param {string} [options.description] - A short description of the status.
           * @param {string} [options.context] - A string label to differentiate this status among CI systems.
           * @param {Requestable.callback} cb - will receive the updated commit back
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'updateStatus',
          value: function updateStatus(commitSHA, options, cb) {
             return this._request('POST', '/repos/' + this.__fullname + '/statuses/' + commitSHA, options, cb);
          }
    
          /**
           * Update repository information
           * @see https://developer.github.com/v3/repos/#edit
           * @param {object} options - New parameters that will be set to the repository
           * @param {string} options.name - Name of the repository
           * @param {string} [options.description] - A short description of the repository
           * @param {string} [options.homepage] - A URL with more information about the repository
           * @param {boolean} [options.private] - Either true to make the repository private, or false to make it public.
           * @param {boolean} [options.has_issues] - Either true to enable issues for this repository, false to disable them.
           * @param {boolean} [options.has_wiki] - Either true to enable the wiki for this repository, false to disable it.
           * @param {boolean} [options.has_downloads] - Either true to enable downloads, false to disable them.
           * @param {string} [options.default_branch] - Updates the default branch for this repository.
           * @param {Requestable.callback} cb - will receive the updated repository back
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'updateRepository',
          value: function updateRepository(options, cb) {
             return this._request('PATCH', '/repos/' + this.__fullname, options, cb);
          }
    
          /**
            * Get information about the repository
            * @see https://developer.github.com/v3/repos/#get
            * @param {Requestable.callback} cb - will receive the information about the repository
            * @return {Promise} - the promise for the http request
            */
    
       }, {
          key: 'getDetails',
          value: function getDetails(cb) {
             return this._request('GET', '/repos/' + this.__fullname, null, cb);
          }
    
          /**
           * List the contributors to the repository
           * @see https://developer.github.com/v3/repos/#list-contributors
           * @param {Requestable.callback} cb - will receive the list of contributors
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getContributors',
          value: function getContributors(cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/contributors', null, cb);
          }
    
          /**
           * List the contributor stats to the repository
           * @see https://developer.github.com/v3/repos/#list-contributors
           * @param {Requestable.callback} cb - will receive the list of contributors
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getContributorStats',
          value: function getContributorStats(cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/stats/contributors', null, cb);
          }
    
          /**
           * List the users who are collaborators on the repository. The currently authenticated user must have
           * push access to use this method
           * @see https://developer.github.com/v3/repos/collaborators/#list-collaborators
           * @param {Requestable.callback} cb - will receive the list of collaborators
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getCollaborators',
          value: function getCollaborators(cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/collaborators', null, cb);
          }
    
          /**
           * Check if a user is a collaborator on the repository
           * @see https://developer.github.com/v3/repos/collaborators/#check-if-a-user-is-a-collaborator
           * @param {string} username - the user to check
           * @param {Requestable.callback} cb - will receive true if the user is a collaborator and false if they are not
           * @return {Promise} - the promise for the http request {Boolean} [description]
           */
    
       }, {
          key: 'isCollaborator',
          value: function isCollaborator(username, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/collaborators/' + username, null, cb);
          }
    
          /**
           * Get the contents of a repository
           * @see https://developer.github.com/v3/repos/contents/#get-contents
           * @param {string} ref - the ref to check
           * @param {string} path - the path containing the content to fetch
           * @param {boolean} raw - `true` if the results should be returned raw instead of GitHub's normalized format
           * @param {Requestable.callback} cb - will receive the fetched data
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getContents',
          value: function getContents(ref, path, raw, cb) {
             path = path ? '' + encodeURI(path) : '';
             return this._request('GET', '/repos/' + this.__fullname + '/contents/' + path, {
                ref: ref
             }, cb, raw);
          }
    
          /**
           * Get the README of a repository
           * @see https://developer.github.com/v3/repos/contents/#get-the-readme
           * @param {string} ref - the ref to check
           * @param {boolean} raw - `true` if the results should be returned raw instead of GitHub's normalized format
           * @param {Requestable.callback} cb - will receive the fetched data
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getReadme',
          value: function getReadme(ref, raw, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/readme', {
                ref: ref
             }, cb, raw);
          }
    
          /**
           * Fork a repository
           * @see https://developer.github.com/v3/repos/forks/#create-a-fork
           * @param {Requestable.callback} cb - will receive the information about the newly created fork
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'fork',
          value: function fork(cb) {
             return this._request('POST', '/repos/' + this.__fullname + '/forks', null, cb);
          }
    
          /**
           * Fork a repository to an organization
           * @see https://developer.github.com/v3/repos/forks/#create-a-fork
           * @param {String} org - organization where you'd like to create the fork.
           * @param {Requestable.callback} cb - will receive the information about the newly created fork
           * @return {Promise} - the promise for the http request
           *
           */
    
       }, {
          key: 'forkToOrg',
          value: function forkToOrg(org, cb) {
             return this._request('POST', '/repos/' + this.__fullname + '/forks?organization=' + org, null, cb);
          }
    
          /**
           * List a repository's forks
           * @see https://developer.github.com/v3/repos/forks/#list-forks
           * @param {Requestable.callback} cb - will receive the list of repositories forked from this one
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listForks',
          value: function listForks(cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/forks', null, cb);
          }
    
          /**
           * Create a new branch from an existing branch.
           * @param {string} [oldBranch=master] - the name of the existing branch
           * @param {string} newBranch - the name of the new branch
           * @param {Requestable.callback} cb - will receive the commit data for the head of the new branch
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createBranch',
          value: function createBranch(oldBranch, newBranch, cb) {
             var _this3 = this;
    
             if (typeof newBranch === 'function') {
                cb = newBranch;
                newBranch = oldBranch;
                oldBranch = 'master';
             }
    
             return this.getRef('heads/' + oldBranch).then(function (response) {
                var sha = response.data.object.sha;
                return _this3.createRef({
                   sha: sha,
                   ref: 'refs/heads/' + newBranch
                }, cb);
             });
          }
    
          /**
           * Create a new pull request
           * @see https://developer.github.com/v3/pulls/#create-a-pull-request
           * @param {Object} options - the pull request description
           * @param {Requestable.callback} cb - will receive the new pull request
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createPullRequest',
          value: function createPullRequest(options, cb) {
             return this._request('POST', '/repos/' + this.__fullname + '/pulls', options, cb);
          }
    
          /**
           * Update a pull request
           * @see https://developer.github.com/v3/pulls/#update-a-pull-request
           * @param {number|string} number - the number of the pull request to update
           * @param {Object} options - the pull request description
           * @param {Requestable.callback} [cb] - will receive the pull request information
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'updatePullRequest',
          value: function updatePullRequest(number, options, cb) {
             return this._request('PATCH', '/repos/' + this.__fullname + '/pulls/' + number, options, cb);
          }
    
          /**
           * List the hooks for the repository
           * @see https://developer.github.com/v3/repos/hooks/#list-hooks
           * @param {Requestable.callback} cb - will receive the list of hooks
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listHooks',
          value: function listHooks(cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/hooks', null, cb);
          }
    
          /**
           * Get a hook for the repository
           * @see https://developer.github.com/v3/repos/hooks/#get-single-hook
           * @param {number} id - the id of the webook
           * @param {Requestable.callback} cb - will receive the details of the webook
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getHook',
          value: function getHook(id, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/hooks/' + id, null, cb);
          }
    
          /**
           * Add a new hook to the repository
           * @see https://developer.github.com/v3/repos/hooks/#create-a-hook
           * @param {Object} options - the configuration describing the new hook
           * @param {Requestable.callback} cb - will receive the new webhook
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createHook',
          value: function createHook(options, cb) {
             return this._request('POST', '/repos/' + this.__fullname + '/hooks', options, cb);
          }
    
          /**
           * Edit an existing webhook
           * @see https://developer.github.com/v3/repos/hooks/#edit-a-hook
           * @param {number} id - the id of the webhook
           * @param {Object} options - the new description of the webhook
           * @param {Requestable.callback} cb - will receive the updated webhook
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'updateHook',
          value: function updateHook(id, options, cb) {
             return this._request('PATCH', '/repos/' + this.__fullname + '/hooks/' + id, options, cb);
          }
    
          /**
           * Delete a webhook
           * @see https://developer.github.com/v3/repos/hooks/#delete-a-hook
           * @param {number} id - the id of the webhook to be deleted
           * @param {Requestable.callback} cb - will receive true if the call is successful
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'deleteHook',
          value: function deleteHook(id, cb) {
             return this._request('DELETE', '/repos/' + this.__fullname + '/hooks/' + id, null, cb);
          }
    
          /**
           * List the deploy keys for the repository
           * @see https://developer.github.com/v3/repos/keys/#list-deploy-keys
           * @param {Requestable.callback} cb - will receive the list of deploy keys
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listKeys',
          value: function listKeys(cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/keys', null, cb);
          }
    
          /**
           * Get a deploy key for the repository
           * @see https://developer.github.com/v3/repos/keys/#get-a-deploy-key
           * @param {number} id - the id of the deploy key
           * @param {Requestable.callback} cb - will receive the details of the deploy key
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getKey',
          value: function getKey(id, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/keys/' + id, null, cb);
          }
    
          /**
           * Add a new deploy key to the repository
           * @see https://developer.github.com/v3/repos/keys/#add-a-new-deploy-key
           * @param {Object} options - the configuration describing the new deploy key
           * @param {Requestable.callback} cb - will receive the new deploy key
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createKey',
          value: function createKey(options, cb) {
             return this._request('POST', '/repos/' + this.__fullname + '/keys', options, cb);
          }
    
          /**
           * Delete a deploy key
           * @see https://developer.github.com/v3/repos/keys/#remove-a-deploy-key
           * @param {number} id - the id of the deploy key to be deleted
           * @param {Requestable.callback} cb - will receive true if the call is successful
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'deleteKey',
          value: function deleteKey(id, cb) {
             return this._request('DELETE', '/repos/' + this.__fullname + '/keys/' + id, null, cb);
          }
    
          /**
           * Delete a file from a branch
           * @see https://developer.github.com/v3/repos/contents/#delete-a-file
           * @param {string} branch - the branch to delete from, or the default branch if not specified
           * @param {string} path - the path of the file to remove
           * @param {Requestable.callback} cb - will receive the commit in which the delete occurred
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'deleteFile',
          value: function deleteFile(branch, path, cb) {
             var _this4 = this;
    
             return this.getSha(branch, path).then(function (response) {
                var deleteCommit = {
                   message: 'Delete the file at \'' + path + '\'',
                   sha: response.data.sha,
                   branch: branch
                };
                return _this4._request('DELETE', '/repos/' + _this4.__fullname + '/contents/' + path, deleteCommit, cb);
             });
          }
    
          /**
           * Change all references in a repo from oldPath to new_path
           * @param {string} branch - the branch to carry out the reference change, or the default branch if not specified
           * @param {string} oldPath - original path
           * @param {string} newPath - new reference path
           * @param {Requestable.callback} cb - will receive the commit in which the move occurred
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'move',
          value: function move(branch, oldPath, newPath, cb) {
             var _this5 = this;
    
             var oldSha = void 0;
             return this.getRef('heads/' + branch).then(function (_ref) {
                var object = _ref.data.object;
                return _this5.getTree(object.sha + '?recursive=true');
             }).then(function (_ref2) {
                var _ref2$data = _ref2.data,
                    tree = _ref2$data.tree,
                    sha = _ref2$data.sha;
    
                oldSha = sha;
                var newTree = tree.map(function (ref) {
                   if (ref.path === oldPath) {
                      ref.path = newPath;
                   }
                   if (ref.type === 'tree') {
                      delete ref.sha;
                   }
                   return ref;
                });
                return _this5.createTree(newTree);
             }).then(function (_ref3) {
                var tree = _ref3.data;
                return _this5.commit(oldSha, tree.sha, 'Renamed \'' + oldPath + '\' to \'' + newPath + '\'');
             }).then(function (_ref4) {
                var commit = _ref4.data;
                return _this5.updateHead('heads/' + branch, commit.sha, true, cb);
             });
          }
    
          /**
           * Write a file to the repository
           * @see https://developer.github.com/v3/repos/contents/#update-a-file
           * @param {string} branch - the name of the branch
           * @param {string} path - the path for the file
           * @param {string} content - the contents of the file
           * @param {string} message - the commit message
           * @param {Object} [options] - commit options
           * @param {Object} [options.author] - the author of the commit
           * @param {Object} [options.commiter] - the committer
           * @param {boolean} [options.encode] - true if the content should be base64 encoded
           * @param {Requestable.callback} cb - will receive the new commit
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'writeFile',
          value: function writeFile(branch, path, content, message, options, cb) {
             var _this6 = this;
    
             options = options || {};
             if (typeof options === 'function') {
                cb = options;
                options = {};
             }
             var filePath = path ? encodeURI(path) : '';
             var shouldEncode = options.encode !== false;
             var commit = {
                branch: branch,
                message: message,
                author: options.author,
                committer: options.committer,
                content: shouldEncode ? _jsBase.Base64.encode(content) : content
             };
    
             return this.getSha(branch, filePath).then(function (response) {
                commit.sha = response.data.sha;
                return _this6._request('PUT', '/repos/' + _this6.__fullname + '/contents/' + filePath, commit, cb);
             }, function () {
                return _this6._request('PUT', '/repos/' + _this6.__fullname + '/contents/' + filePath, commit, cb);
             });
          }
    
          /**
           * Check if a repository is starred by you
           * @see https://developer.github.com/v3/activity/starring/#check-if-you-are-starring-a-repository
           * @param {Requestable.callback} cb - will receive true if the repository is starred and false if the repository
           *                                  is not starred
           * @return {Promise} - the promise for the http request {Boolean} [description]
           */
    
       }, {
          key: 'isStarred',
          value: function isStarred(cb) {
             return this._request204or404('/user/starred/' + this.__fullname, null, cb);
          }
    
          /**
           * Star a repository
           * @see https://developer.github.com/v3/activity/starring/#star-a-repository
           * @param {Requestable.callback} cb - will receive true if the repository is starred
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'star',
          value: function star(cb) {
             return this._request('PUT', '/user/starred/' + this.__fullname, null, cb);
          }
    
          /**
           * Unstar a repository
           * @see https://developer.github.com/v3/activity/starring/#unstar-a-repository
           * @param {Requestable.callback} cb - will receive true if the repository is unstarred
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'unstar',
          value: function unstar(cb) {
             return this._request('DELETE', '/user/starred/' + this.__fullname, null, cb);
          }
    
          /**
           * Create a new release
           * @see https://developer.github.com/v3/repos/releases/#create-a-release
           * @param {Object} options - the description of the release
           * @param {Requestable.callback} cb - will receive the newly created release
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createRelease',
          value: function createRelease(options, cb) {
             return this._request('POST', '/repos/' + this.__fullname + '/releases', options, cb);
          }
    
          /**
           * Edit a release
           * @see https://developer.github.com/v3/repos/releases/#edit-a-release
           * @param {string} id - the id of the release
           * @param {Object} options - the description of the release
           * @param {Requestable.callback} cb - will receive the modified release
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'updateRelease',
          value: function updateRelease(id, options, cb) {
             return this._request('PATCH', '/repos/' + this.__fullname + '/releases/' + id, options, cb);
          }
    
          /**
           * Get information about all releases
           * @see https://developer.github.com/v3/repos/releases/#list-releases-for-a-repository
           * @param {Requestable.callback} cb - will receive the release information
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listReleases',
          value: function listReleases(cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/releases', null, cb);
          }
    
          /**
           * Get information about a release
           * @see https://developer.github.com/v3/repos/releases/#get-a-single-release
           * @param {string} id - the id of the release
           * @param {Requestable.callback} cb - will receive the release information
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getRelease',
          value: function getRelease(id, cb) {
             return this._request('GET', '/repos/' + this.__fullname + '/releases/' + id, null, cb);
          }
    
          /**
           * Delete a release
           * @see https://developer.github.com/v3/repos/releases/#delete-a-release
           * @param {string} id - the release to be deleted
           * @param {Requestable.callback} cb - will receive true if the operation is successful
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'deleteRelease',
          value: function deleteRelease(id, cb) {
             return this._request('DELETE', '/repos/' + this.__fullname + '/releases/' + id, null, cb);
          }
    
          /**
           * Merge a pull request
           * @see https://developer.github.com/v3/pulls/#merge-a-pull-request-merge-button
           * @param {number|string} number - the number of the pull request to merge
           * @param {Object} options - the merge options for the pull request
           * @param {Requestable.callback} [cb] - will receive the merge information if the operation is successful
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'mergePullRequest',
          value: function mergePullRequest(number, options, cb) {
             return this._request('PUT', '/repos/' + this.__fullname + '/pulls/' + number + '/merge', options, cb);
          }
    
          /**
           * Get information about all projects
           * @see https://developer.github.com/v3/projects/#list-repository-projects
           * @param {Requestable.callback} [cb] - will receive the list of projects
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listProjects',
          value: function listProjects(cb) {
             return this._requestAllPages('/repos/' + this.__fullname + '/projects', { AcceptHeader: 'inertia-preview' }, cb);
          }
    
          /**
           * Create a new project
           * @see https://developer.github.com/v3/projects/#create-a-repository-project
           * @param {Object} options - the description of the project
           * @param {Requestable.callback} cb - will receive the newly created project
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createProject',
          value: function createProject(options, cb) {
             options = options || {};
             options.AcceptHeader = 'inertia-preview';
             return this._request('POST', '/repos/' + this.__fullname + '/projects', options, cb);
          }
       }]);
    
       return Repository;
    }(_Requestable3.default);
    
    module.exports = Repository;
    
    }).call(this)}).call(this,require("buffer").Buffer)
    
    },{"./Requestable":9,"buffer":41,"debug":42,"js-base64":46,"utf8":49}],9:[function(require,module,exports){
    'use strict';
    
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _axios = require('axios');
    
    var _axios2 = _interopRequireDefault(_axios);
    
    var _debug = require('debug');
    
    var _debug2 = _interopRequireDefault(_debug);
    
    var _jsBase = require('js-base64');
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    var log = (0, _debug2.default)('github:request');
    
    /**
     * The error structure returned when a network call fails
     */
    
    var ResponseError = function (_Error) {
       _inherits(ResponseError, _Error);
    
       /**
        * Construct a new ResponseError
        * @param {string} message - an message to return instead of the the default error message
        * @param {string} path - the requested path
        * @param {Object} response - the object returned by Axios
        */
       function ResponseError(message, path, response) {
          _classCallCheck(this, ResponseError);
    
          var _this = _possibleConstructorReturn(this, (ResponseError.__proto__ || Object.getPrototypeOf(ResponseError)).call(this, message));
    
          _this.path = path;
          _this.request = response.config;
          _this.response = (response || {}).response || response;
          _this.status = response.status;
          return _this;
       }
    
       return ResponseError;
    }(Error);
    
    /**
     * Requestable wraps the logic for making http requests to the API
     */
    
    
    var Requestable = function () {
       /**
        * Either a username and password or an oauth token for Github
        * @typedef {Object} Requestable.auth
        * @prop {string} [username] - the Github username
        * @prop {string} [password] - the user's password
        * @prop {token} [token] - an OAuth token
        */
       /**
        * Initialize the http internals.
        * @param {Requestable.auth} [auth] - the credentials to authenticate to Github. If auth is
        *                                  not provided request will be made unauthenticated
        * @param {string} [apiBase=https://api.github.com] - the base Github API URL
        * @param {string} [AcceptHeader=v3] - the accept header for the requests
        */
       function Requestable(auth, apiBase, AcceptHeader) {
          _classCallCheck(this, Requestable);
    
          this.__apiBase = apiBase || 'https://api.github.com';
          this.__auth = {
             token: auth.token,
             username: auth.username,
             password: auth.password
          };
          this.__AcceptHeader = AcceptHeader || 'v3';
    
          if (auth.token) {
             this.__authorizationHeader = 'token ' + auth.token;
          } else if (auth.username && auth.password) {
             this.__authorizationHeader = 'Basic ' + _jsBase.Base64.encode(auth.username + ':' + auth.password);
          }
       }
    
       /**
        * Compute the URL to use to make a request.
        * @private
        * @param {string} path - either a URL relative to the API base or an absolute URL
        * @return {string} - the URL to use
        */
    
    
       _createClass(Requestable, [{
          key: '__getURL',
          value: function __getURL(path) {
             var url = path;
    
             if (path.indexOf('//') === -1) {
                url = this.__apiBase + path;
             }
    
             var newCacheBuster = 'timestamp=' + new Date().getTime();
             return url.replace(/(timestamp=\d+)/, newCacheBuster);
          }
    
          /**
           * Compute the headers required for an API request.
           * @private
           * @param {boolean} raw - if the request should be treated as JSON or as a raw request
           * @param {string} AcceptHeader - the accept header for the request
           * @return {Object} - the headers to use in the request
           */
    
       }, {
          key: '__getRequestHeaders',
          value: function __getRequestHeaders(raw, AcceptHeader) {
             var headers = {
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept': 'application/vnd.github.' + (AcceptHeader || this.__AcceptHeader)
             };
    
             if (raw) {
                headers.Accept += '.raw';
             }
             headers.Accept += '+json';
    
             if (this.__authorizationHeader) {
                headers.Authorization = this.__authorizationHeader;
             }
    
             return headers;
          }
    
          /**
           * Sets the default options for API requests
           * @protected
           * @param {Object} [requestOptions={}] - the current options for the request
           * @return {Object} - the options to pass to the request
           */
    
       }, {
          key: '_getOptionsWithDefaults',
          value: function _getOptionsWithDefaults() {
             var requestOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    
             if (!(requestOptions.visibility || requestOptions.affiliation)) {
                requestOptions.type = requestOptions.type || 'all';
             }
             requestOptions.sort = requestOptions.sort || 'updated';
             requestOptions.per_page = requestOptions.per_page || '100'; // eslint-disable-line
    
             return requestOptions;
          }
    
          /**
           * if a `Date` is passed to this function it will be converted to an ISO string
           * @param {*} date - the object to attempt to coerce into an ISO date string
           * @return {string} - the ISO representation of `date` or whatever was passed in if it was not a date
           */
    
       }, {
          key: '_dateToISO',
          value: function _dateToISO(date) {
             if (date && date instanceof Date) {
                date = date.toISOString();
             }
    
             return date;
          }
    
          /**
           * A function that receives the result of the API request.
           * @callback Requestable.callback
           * @param {Requestable.Error} error - the error returned by the API or `null`
           * @param {(Object|true)} result - the data returned by the API or `true` if the API returns `204 No Content`
           * @param {Object} request - the raw {@linkcode https://github.com/mzabriskie/axios#response-schema Response}
           */
          /**
           * Make a request.
           * @param {string} method - the method for the request (GET, PUT, POST, DELETE)
           * @param {string} path - the path for the request
           * @param {*} [data] - the data to send to the server. For HTTP methods that don't have a body the data
           *                   will be sent as query parameters
           * @param {Requestable.callback} [cb] - the callback for the request
           * @param {boolean} [raw=false] - if the request should be sent as raw. If this is a falsy value then the
           *                              request will be made as JSON
           * @return {Promise} - the Promise for the http request
           */
    
       }, {
          key: '_request',
          value: function _request(method, path, data, cb, raw) {
             var url = this.__getURL(path);
    
             var AcceptHeader = (data || {}).AcceptHeader;
             if (AcceptHeader) {
                delete data.AcceptHeader;
             }
             var headers = this.__getRequestHeaders(raw, AcceptHeader);
    
             var queryParams = {};
    
             var shouldUseDataAsParams = data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && methodHasNoBody(method);
             if (shouldUseDataAsParams) {
                queryParams = data;
                data = undefined;
             }
    
             var config = {
                url: url,
                method: method,
                headers: headers,
                params: queryParams,
                data: data,
                responseType: raw ? 'text' : 'json'
             };
    
             log(config.method + ' to ' + config.url);
             var requestPromise = (0, _axios2.default)(config).catch(callbackErrorOrThrow(cb, path));
    
             if (cb) {
                requestPromise.then(function (response) {
                   if (response.data && Object.keys(response.data).length > 0) {
                      // When data has results
                      cb(null, response.data, response);
                   } else if (config.method !== 'GET' && Object.keys(response.data).length < 1) {
                      // True when successful submit a request and receive a empty object
                      cb(null, response.status < 300, response);
                   } else {
                      cb(null, response.data, response);
                   }
                });
             }
    
             return requestPromise;
          }
    
          /**
           * Make a request to an endpoint the returns 204 when true and 404 when false
           * @param {string} path - the path to request
           * @param {Object} data - any query parameters for the request
           * @param {Requestable.callback} cb - the callback that will receive `true` or `false`
           * @param {method} [method=GET] - HTTP Method to use
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: '_request204or404',
          value: function _request204or404(path, data, cb) {
             var method = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'GET';
    
             return this._request(method, path, data).then(function success(response) {
                if (cb) {
                   cb(null, true, response);
                }
                return true;
             }, function failure(response) {
                if (response.response.status === 404) {
                   if (cb) {
                      cb(null, false, response);
                   }
                   return false;
                }
    
                if (cb) {
                   cb(response);
                }
                throw response;
             });
          }
    
          /**
           * Make a request and fetch all the available data. Github will paginate responses so for queries
           * that might span multiple pages this method is preferred to {@link Requestable#request}
           * @param {string} path - the path to request
           * @param {Object} options - the query parameters to include
           * @param {Requestable.callback} [cb] - the function to receive the data. The returned data will always be an array.
           * @param {Object[]} results - the partial results. This argument is intended for internal use only.
           * @return {Promise} - a promise which will resolve when all pages have been fetched
           * @deprecated This will be folded into {@link Requestable#_request} in the 2.0 release.
           */
    
       }, {
          key: '_requestAllPages',
          value: function _requestAllPages(path, options, cb, results) {
             var _this2 = this;
    
             results = results || [];
    
             return this._request('GET', path, options).then(function (response) {
                var _results;
    
                var thisGroup = void 0;
                if (response.data instanceof Array) {
                   thisGroup = response.data;
                } else if (response.data.items instanceof Array) {
                   thisGroup = response.data.items;
                } else {
                   var message = 'cannot figure out how to append ' + response.data + ' to the result set';
                   throw new ResponseError(message, path, response);
                }
                (_results = results).push.apply(_results, _toConsumableArray(thisGroup));
    
                var nextUrl = getNextPage(response.headers.link);
                if (nextUrl) {
                   if (!options) {
                      options = {};
                   }
                   options.page = parseInt(nextUrl.match(/([&\?]page=[0-9]*)/g).shift().split('=').pop());
                   if (!(options && typeof options.page !== 'number')) {
                      log('getting next page: ' + nextUrl);
                      return _this2._requestAllPages(nextUrl, options, cb, results);
                   }
                }
    
                if (cb) {
                   cb(null, results, response);
                }
    
                response.data = results;
                return response;
             }).catch(callbackErrorOrThrow(cb, path));
          }
       }]);
    
       return Requestable;
    }();
    
    module.exports = Requestable;
    
    // ////////////////////////// //
    //  Private helper functions  //
    // ////////////////////////// //
    var METHODS_WITH_NO_BODY = ['GET', 'HEAD', 'DELETE'];
    function methodHasNoBody(method) {
       return METHODS_WITH_NO_BODY.indexOf(method) !== -1;
    }
    
    function getNextPage() {
       var linksHeader = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    
       var links = linksHeader.split(/\s*,\s*/); // splits and strips the urls
       return links.reduce(function (nextUrl, link) {
          if (link.search(/rel="next"/) !== -1) {
             return (link.match(/<(.*)>/) || [])[1];
          }
    
          return nextUrl;
       }, undefined);
    }
    
    function callbackErrorOrThrow(cb, path) {
       return function handler(object) {
          var error = void 0;
          if (object.hasOwnProperty('config')) {
             var _object$response = object.response,
                 status = _object$response.status,
                 statusText = _object$response.statusText,
                 _object$config = object.config,
                 method = _object$config.method,
                 url = _object$config.url;
    
             var message = status + ' error making request ' + method + ' ' + url + ': "' + statusText + '"';
             error = new ResponseError(message, path, object);
             log(message + ' ' + JSON.stringify(object.data));
          } else {
             error = object;
          }
          if (cb) {
             log('going to error callback');
             cb(error);
          } else {
             log('throwing error');
             throw error;
          }
       };
    }
    
    },{"axios":13,"debug":42,"js-base64":46}],10:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    var _debug = require('debug');
    
    var _debug2 = _interopRequireDefault(_debug);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    var log = (0, _debug2.default)('github:search');
    
    /**
     * Wrap the Search API
     */
    
    var Search = function (_Requestable) {
      _inherits(Search, _Requestable);
    
      /**
       * Create a Search
       * @param {Object} defaults - defaults for the search
       * @param {Requestable.auth} [auth] - information required to authenticate to Github
       * @param {string} [apiBase=https://api.github.com] - the base Github API URL
       */
      function Search(defaults, auth, apiBase) {
        _classCallCheck(this, Search);
    
        var _this = _possibleConstructorReturn(this, (Search.__proto__ || Object.getPrototypeOf(Search)).call(this, auth, apiBase));
    
        _this.__defaults = _this._getOptionsWithDefaults(defaults);
        return _this;
      }
    
      /**
       * Available search options
       * @see https://developer.github.com/v3/search/#parameters
       * @typedef {Object} Search.Params
       * @param {string} q - the query to make
       * @param {string} sort - the sort field, one of `stars`, `forks`, or `updated`.
       *                      Default is [best match](https://developer.github.com/v3/search/#ranking-search-results)
       * @param {string} order - the ordering, either `asc` or `desc`
       */
      /**
       * Perform a search on the GitHub API
       * @private
       * @param {string} path - the scope of the search
       * @param {Search.Params} [withOptions] - additional parameters for the search
       * @param {Requestable.callback} [cb] - will receive the results of the search
       * @return {Promise} - the promise for the http request
       */
    
    
      _createClass(Search, [{
        key: '_search',
        value: function _search(path) {
          var _this2 = this;
    
          var withOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
    
          var requestOptions = {};
          Object.keys(this.__defaults).forEach(function (prop) {
            requestOptions[prop] = _this2.__defaults[prop];
          });
          Object.keys(withOptions).forEach(function (prop) {
            requestOptions[prop] = withOptions[prop];
          });
    
          log('searching ' + path + ' with options:', requestOptions);
          return this._requestAllPages('/search/' + path, requestOptions, cb);
        }
    
        /**
         * Search for repositories
         * @see https://developer.github.com/v3/search/#search-repositories
         * @param {Search.Params} [options] - additional parameters for the search
         * @param {Requestable.callback} [cb] - will receive the results of the search
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'forRepositories',
        value: function forRepositories(options, cb) {
          return this._search('repositories', options, cb);
        }
    
        /**
         * Search for code
         * @see https://developer.github.com/v3/search/#search-code
         * @param {Search.Params} [options] - additional parameters for the search
         * @param {Requestable.callback} [cb] - will receive the results of the search
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'forCode',
        value: function forCode(options, cb) {
          return this._search('code', options, cb);
        }
    
        /**
         * Search for issues
         * @see https://developer.github.com/v3/search/#search-issues
         * @param {Search.Params} [options] - additional parameters for the search
         * @param {Requestable.callback} [cb] - will receive the results of the search
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'forIssues',
        value: function forIssues(options, cb) {
          return this._search('issues', options, cb);
        }
    
        /**
         * Search for users
         * @see https://developer.github.com/v3/search/#search-users
         * @param {Search.Params} [options] - additional parameters for the search
         * @param {Requestable.callback} [cb] - will receive the results of the search
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'forUsers',
        value: function forUsers(options, cb) {
          return this._search('users', options, cb);
        }
      }]);
    
      return Search;
    }(_Requestable3.default);
    
    module.exports = Search;
    
    },{"./Requestable":9,"debug":42}],11:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    var _debug = require('debug');
    
    var _debug2 = _interopRequireDefault(_debug);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2016 Matt Smith (Development Seed)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    var log = (0, _debug2.default)('github:team');
    
    /**
     * A Team allows scoping of API requests to a particular Github Organization Team.
     */
    
    var Team = function (_Requestable) {
      _inherits(Team, _Requestable);
    
      /**
       * Create a Team.
       * @param {string} [teamId] - the id for the team
       * @param {Requestable.auth} [auth] - information required to authenticate to Github
       * @param {string} [apiBase=https://api.github.com] - the base Github API URL
       */
      function Team(teamId, auth, apiBase) {
        _classCallCheck(this, Team);
    
        var _this = _possibleConstructorReturn(this, (Team.__proto__ || Object.getPrototypeOf(Team)).call(this, auth, apiBase));
    
        _this.__teamId = teamId;
        return _this;
      }
    
      /**
       * Get Team information
       * @see https://developer.github.com/v3/orgs/teams/#get-team
       * @param {Requestable.callback} [cb] - will receive the team
       * @return {Promise} - the promise for the http request
       */
    
    
      _createClass(Team, [{
        key: 'getTeam',
        value: function getTeam(cb) {
          log('Fetching Team ' + this.__teamId);
          return this._request('Get', '/teams/' + this.__teamId, undefined, cb);
        }
    
        /**
         * List the Team's repositories
         * @see https://developer.github.com/v3/orgs/teams/#list-team-repos
         * @param {Requestable.callback} [cb] - will receive the list of repositories
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listRepos',
        value: function listRepos(cb) {
          log('Fetching repositories for Team ' + this.__teamId);
          return this._requestAllPages('/teams/' + this.__teamId + '/repos', undefined, cb);
        }
    
        /**
         * Edit Team information
         * @see https://developer.github.com/v3/orgs/teams/#edit-team
         * @param {object} options - Parameters for team edit
         * @param {string} options.name - The name of the team
         * @param {string} [options.description] - Team description
         * @param {string} [options.repo_names] - Repos to add the team to
         * @param {string} [options.privacy=secret] - The level of privacy the team should have. Can be either one
         * of: `secret`, or `closed`
         * @param {Requestable.callback} [cb] - will receive the updated team
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'editTeam',
        value: function editTeam(options, cb) {
          log('Editing Team ' + this.__teamId);
          return this._request('PATCH', '/teams/' + this.__teamId, options, cb);
        }
    
        /**
         * List the users who are members of the Team
         * @see https://developer.github.com/v3/orgs/teams/#list-team-members
         * @param {object} options - Parameters for listing team users
         * @param {string} [options.role=all] - can be one of: `all`, `maintainer`, or `member`
         * @param {Requestable.callback} [cb] - will receive the list of users
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'listMembers',
        value: function listMembers(options, cb) {
          log('Getting members of Team ' + this.__teamId);
          return this._requestAllPages('/teams/' + this.__teamId + '/members', options, cb);
        }
    
        /**
         * Get Team membership status for a user
         * @see https://developer.github.com/v3/orgs/teams/#get-team-membership
         * @param {string} username - can be one of: `all`, `maintainer`, or `member`
         * @param {Requestable.callback} [cb] - will receive the membership status of a user
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'getMembership',
        value: function getMembership(username, cb) {
          log('Getting membership of user ' + username + ' in Team ' + this.__teamId);
          return this._request('GET', '/teams/' + this.__teamId + '/memberships/' + username, undefined, cb);
        }
    
        /**
         * Add a member to the Team
         * @see https://developer.github.com/v3/orgs/teams/#add-team-membership
         * @param {string} username - can be one of: `all`, `maintainer`, or `member`
         * @param {object} options - Parameters for adding a team member
         * @param {string} [options.role=member] - The role that this user should have in the team. Can be one
         * of: `member`, or `maintainer`
         * @param {Requestable.callback} [cb] - will receive the membership status of added user
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'addMembership',
        value: function addMembership(username, options, cb) {
          log('Adding user ' + username + ' to Team ' + this.__teamId);
          return this._request('PUT', '/teams/' + this.__teamId + '/memberships/' + username, options, cb);
        }
    
        /**
         * Get repo management status for team
         * @see https://developer.github.com/v3/orgs/teams/#remove-team-membership
         * @param {string} owner - Organization name
         * @param {string} repo - Repo name
         * @param {Requestable.callback} [cb] - will receive the membership status of added user
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'isManagedRepo',
        value: function isManagedRepo(owner, repo, cb) {
          log('Getting repo management by Team ' + this.__teamId + ' for repo ' + owner + '/' + repo);
          return this._request204or404('/teams/' + this.__teamId + '/repos/' + owner + '/' + repo, undefined, cb);
        }
    
        /**
         * Add or Update repo management status for team
         * @see https://developer.github.com/v3/orgs/teams/#add-or-update-team-repository
         * @param {string} owner - Organization name
         * @param {string} repo - Repo name
         * @param {object} options - Parameters for adding or updating repo management for the team
         * @param {string} [options.permission] - The permission to grant the team on this repository. Can be one
         * of: `pull`, `push`, or `admin`
         * @param {Requestable.callback} [cb] - will receive the membership status of added user
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'manageRepo',
        value: function manageRepo(owner, repo, options, cb) {
          log('Adding or Updating repo management by Team ' + this.__teamId + ' for repo ' + owner + '/' + repo);
          return this._request204or404('/teams/' + this.__teamId + '/repos/' + owner + '/' + repo, options, cb, 'PUT');
        }
    
        /**
         * Remove repo management status for team
         * @see https://developer.github.com/v3/orgs/teams/#remove-team-repository
         * @param {string} owner - Organization name
         * @param {string} repo - Repo name
         * @param {Requestable.callback} [cb] - will receive the membership status of added user
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'unmanageRepo',
        value: function unmanageRepo(owner, repo, cb) {
          log('Remove repo management by Team ' + this.__teamId + ' for repo ' + owner + '/' + repo);
          return this._request204or404('/teams/' + this.__teamId + '/repos/' + owner + '/' + repo, undefined, cb, 'DELETE');
        }
    
        /**
         * Delete Team
         * @see https://developer.github.com/v3/orgs/teams/#delete-team
         * @param {Requestable.callback} [cb] - will receive the list of repositories
         * @return {Promise} - the promise for the http request
         */
    
      }, {
        key: 'deleteTeam',
        value: function deleteTeam(cb) {
          log('Deleting Team ' + this.__teamId);
          return this._request204or404('/teams/' + this.__teamId, undefined, cb, 'DELETE');
        }
      }]);
    
      return Team;
    }(_Requestable3.default);
    
    module.exports = Team;
    
    },{"./Requestable":9,"debug":42}],12:[function(require,module,exports){
    'use strict';
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Requestable2 = require('./Requestable');
    
    var _Requestable3 = _interopRequireDefault(_Requestable2);
    
    var _debug = require('debug');
    
    var _debug2 = _interopRequireDefault(_debug);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */
    
    var log = (0, _debug2.default)('github:user');
    
    /**
     * A User allows scoping of API requests to a particular Github user.
     */
    
    var User = function (_Requestable) {
       _inherits(User, _Requestable);
    
       /**
        * Create a User.
        * @param {string} [username] - the user to use for user-scoped queries
        * @param {Requestable.auth} [auth] - information required to authenticate to Github
        * @param {string} [apiBase=https://api.github.com] - the base Github API URL
        */
       function User(username, auth, apiBase) {
          _classCallCheck(this, User);
    
          var _this = _possibleConstructorReturn(this, (User.__proto__ || Object.getPrototypeOf(User)).call(this, auth, apiBase));
    
          _this.__user = username;
          return _this;
       }
    
       /**
        * Get the url for the request. (dependent on if we're requesting for the authenticated user or not)
        * @private
        * @param {string} endpoint - the endpoint being requested
        * @return {string} - the resolved endpoint
        */
    
    
       _createClass(User, [{
          key: '__getScopedUrl',
          value: function __getScopedUrl(endpoint) {
             if (this.__user) {
                return endpoint ? '/users/' + this.__user + '/' + endpoint : '/users/' + this.__user;
             } else {
                // eslint-disable-line
                switch (endpoint) {
                   case '':
                      return '/user';
    
                   case 'notifications':
                   case 'gists':
                      return '/' + endpoint;
    
                   default:
                      return '/user/' + endpoint;
                }
             }
          }
    
          /**
           * List the user's repositories
           * @see https://developer.github.com/v3/repos/#list-user-repositories
           * @param {Object} [options={}] - any options to refine the search
           * @param {Requestable.callback} [cb] - will receive the list of repositories
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listRepos',
          value: function listRepos(options, cb) {
             if (typeof options === 'function') {
                cb = options;
                options = {};
             }
    
             options = this._getOptionsWithDefaults(options);
    
             log('Fetching repositories with options: ' + JSON.stringify(options));
             return this._requestAllPages(this.__getScopedUrl('repos'), options, cb);
          }
    
          /**
           * List the orgs that the user belongs to
           * @see https://developer.github.com/v3/orgs/#list-user-organizations
           * @param {Requestable.callback} [cb] - will receive the list of organizations
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listOrgs',
          value: function listOrgs(cb) {
             return this._request('GET', this.__getScopedUrl('orgs'), null, cb);
          }
    
          /**
           * List followers of a user
           * @see https://developer.github.com/v3/users/followers/#list-followers-of-a-user
           * @param {Requestable.callback} [cb] - will receive the list of followers
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listFollowers',
          value: function listFollowers(cb) {
             return this._request('GET', this.__getScopedUrl('followers'), null, cb);
          }
    
          /**
           * List users followed by another user
           * @see https://developer.github.com/v3/users/followers/#list-users-followed-by-another-user
           * @param {Requestable.callback} [cb] - will receive the list of who a user is following
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listFollowing',
          value: function listFollowing(cb) {
             return this._request('GET', this.__getScopedUrl('following'), null, cb);
          }
    
          /**
           * List the user's gists
           * @see https://developer.github.com/v3/gists/#list-a-users-gists
           * @param {Requestable.callback} [cb] - will receive the list of gists
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listGists',
          value: function listGists(cb) {
             return this._request('GET', this.__getScopedUrl('gists'), null, cb);
          }
    
          /**
           * List the user's notifications
           * @see https://developer.github.com/v3/activity/notifications/#list-your-notifications
           * @param {Object} [options={}] - any options to refine the search
           * @param {Requestable.callback} [cb] - will receive the list of repositories
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listNotifications',
          value: function listNotifications(options, cb) {
             options = options || {};
             if (typeof options === 'function') {
                cb = options;
                options = {};
             }
    
             options.since = this._dateToISO(options.since);
             options.before = this._dateToISO(options.before);
    
             return this._request('GET', this.__getScopedUrl('notifications'), options, cb);
          }
    
          /**
           * Show the user's profile
           * @see https://developer.github.com/v3/users/#get-a-single-user
           * @param {Requestable.callback} [cb] - will receive the user's information
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getProfile',
          value: function getProfile(cb) {
             return this._request('GET', this.__getScopedUrl(''), null, cb);
          }
    
          /**
           * Gets the list of starred repositories for the user
           * @see https://developer.github.com/v3/activity/starring/#list-repositories-being-starred
           * @param {Requestable.callback} [cb] - will receive the list of starred repositories
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listStarredRepos',
          value: function listStarredRepos(cb) {
             var requestOptions = this._getOptionsWithDefaults();
             return this._requestAllPages(this.__getScopedUrl('starred'), requestOptions, cb);
          }
    
          /**
           * Gets the list of starred gists for the user
           * @see https://developer.github.com/v3/gists/#list-starred-gists
           * @param {Object} [options={}] - any options to refine the search
           * @param {Requestable.callback} [cb] - will receive the list of gists
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'listStarredGists',
          value: function listStarredGists(options, cb) {
             options = options || {};
             if (typeof options === 'function') {
                cb = options;
                options = {};
             }
             options.since = this._dateToISO(options.since);
             return this._request('GET', '/gists/starred', options, cb);
          }
    
          /**
           * List email addresses for a user
           * @see https://developer.github.com/v3/users/emails/#list-email-addresses-for-a-user
           * @param {Requestable.callback} [cb] - will receive the list of emails
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'getEmails',
          value: function getEmails(cb) {
             return this._request('GET', '/user/emails', null, cb);
          }
    
          /**
           * Have the authenticated user follow this user
           * @see https://developer.github.com/v3/users/followers/#follow-a-user
           * @param {string} username - the user to follow
           * @param {Requestable.callback} [cb] - will receive true if the request succeeds
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'follow',
          value: function follow(username, cb) {
             return this._request('PUT', '/user/following/' + username, null, cb);
          }
    
          /**
           * Have the currently authenticated user unfollow this user
           * @see https://developer.github.com/v3/users/followers/#follow-a-user
           * @param {string} username - the user to unfollow
           * @param {Requestable.callback} [cb] - receives true if the request succeeds
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'unfollow',
          value: function unfollow(username, cb) {
             return this._request('DELETE', '/user/following/' + username, null, cb);
          }
    
          /**
           * Create a new repository for the currently authenticated user
           * @see https://developer.github.com/v3/repos/#create
           * @param {object} options - the repository definition
           * @param {Requestable.callback} [cb] - will receive the API response
           * @return {Promise} - the promise for the http request
           */
    
       }, {
          key: 'createRepo',
          value: function createRepo(options, cb) {
             return this._request('POST', '/user/repos', options, cb);
          }
       }]);
    
       return User;
    }(_Requestable3.default);
    
    module.exports = User;
    
    },{"./Requestable":9,"debug":42}],13:[function(require,module,exports){
    module.exports = require('./lib/axios');
    },{"./lib/axios":15}],14:[function(require,module,exports){
    'use strict';
    
    var utils = require('./../utils');
    var settle = require('./../core/settle');
    var cookies = require('./../helpers/cookies');
    var buildURL = require('./../helpers/buildURL');
    var buildFullPath = require('../core/buildFullPath');
    var parseHeaders = require('./../helpers/parseHeaders');
    var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
    var createError = require('../core/createError');
    
    module.exports = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;
    
        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }
    
        var request = new XMLHttpRequest();
    
        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }
    
        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);
    
        // Set the request timeout in MS
        request.timeout = config.timeout;
    
        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }
    
          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }
    
          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };
    
          settle(resolve, reject, response);
    
          // Clean up request
          request = null;
        };
    
        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }
    
          reject(createError('Request aborted', config, 'ECONNABORTED', request));
    
          // Clean up request
          request = null;
        };
    
        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));
    
          // Clean up request
          request = null;
        };
    
        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));
    
          // Clean up request
          request = null;
        };
    
        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;
    
          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }
    
        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }
    
        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }
    
        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }
    
        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }
    
        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }
    
        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }
    
            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }
    
        if (!requestData) {
          requestData = null;
        }
    
        // Send the request
        request.send(requestData);
      });
    };
    
    },{"../core/buildFullPath":21,"../core/createError":22,"./../core/settle":26,"./../helpers/buildURL":30,"./../helpers/cookies":32,"./../helpers/isURLSameOrigin":35,"./../helpers/parseHeaders":37,"./../utils":39}],15:[function(require,module,exports){
    'use strict';
    
    var utils = require('./utils');
    var bind = require('./helpers/bind');
    var Axios = require('./core/Axios');
    var mergeConfig = require('./core/mergeConfig');
    var defaults = require('./defaults');
    
    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios(defaultConfig);
      var instance = bind(Axios.prototype.request, context);
    
      // Copy axios.prototype to instance
      utils.extend(instance, Axios.prototype, context);
    
      // Copy context to instance
      utils.extend(instance, context);
    
      return instance;
    }
    
    // Create the default instance to be exported
    var axios = createInstance(defaults);
    
    // Expose Axios class to allow class inheritance
    axios.Axios = Axios;
    
    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };
    
    // Expose Cancel & CancelToken
    axios.Cancel = require('./cancel/Cancel');
    axios.CancelToken = require('./cancel/CancelToken');
    axios.isCancel = require('./cancel/isCancel');
    
    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = require('./helpers/spread');
    
    // Expose isAxiosError
    axios.isAxiosError = require('./helpers/isAxiosError');
    
    module.exports = axios;
    
    // Allow use of default import syntax in TypeScript
    module.exports.default = axios;
    
    },{"./cancel/Cancel":16,"./cancel/CancelToken":17,"./cancel/isCancel":18,"./core/Axios":19,"./core/mergeConfig":25,"./defaults":28,"./helpers/bind":29,"./helpers/isAxiosError":34,"./helpers/spread":38,"./utils":39}],16:[function(require,module,exports){
    'use strict';
    
    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }
    
    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };
    
    Cancel.prototype.__CANCEL__ = true;
    
    module.exports = Cancel;
    
    },{}],17:[function(require,module,exports){
    'use strict';
    
    var Cancel = require('./Cancel');
    
    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }
    
      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });
    
      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }
    
        token.reason = new Cancel(message);
        resolvePromise(token.reason);
      });
    }
    
    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };
    
    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };
    
    module.exports = CancelToken;
    
    },{"./Cancel":16}],18:[function(require,module,exports){
    'use strict';
    
    module.exports = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };
    
    },{}],19:[function(require,module,exports){
    'use strict';
    
    var utils = require('./../utils');
    var buildURL = require('../helpers/buildURL');
    var InterceptorManager = require('./InterceptorManager');
    var dispatchRequest = require('./dispatchRequest');
    var mergeConfig = require('./mergeConfig');
    
    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
      };
    }
    
    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }
    
      config = mergeConfig(this.defaults, config);
    
      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }
    
      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);
    
      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });
    
      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });
    
      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }
    
      return promise;
    };
    
    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };
    
    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });
    
    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });
    
    module.exports = Axios;
    
    },{"../helpers/buildURL":30,"./../utils":39,"./InterceptorManager":20,"./dispatchRequest":23,"./mergeConfig":25}],20:[function(require,module,exports){
    'use strict';
    
    var utils = require('./../utils');
    
    function InterceptorManager() {
      this.handlers = [];
    }
    
    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };
    
    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };
    
    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };
    
    module.exports = InterceptorManager;
    
    },{"./../utils":39}],21:[function(require,module,exports){
    'use strict';
    
    var isAbsoluteURL = require('../helpers/isAbsoluteURL');
    var combineURLs = require('../helpers/combineURLs');
    
    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    module.exports = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };
    
    },{"../helpers/combineURLs":31,"../helpers/isAbsoluteURL":33}],22:[function(require,module,exports){
    'use strict';
    
    var enhanceError = require('./enhanceError');
    
    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    module.exports = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };
    
    },{"./enhanceError":24}],23:[function(require,module,exports){
    'use strict';
    
    var utils = require('./../utils');
    var transformData = require('./transformData');
    var isCancel = require('../cancel/isCancel');
    var defaults = require('../defaults');
    
    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }
    
    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    module.exports = function dispatchRequest(config) {
      throwIfCancellationRequested(config);
    
      // Ensure headers exist
      config.headers = config.headers || {};
    
      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );
    
      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );
    
      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );
    
      var adapter = config.adapter || defaults.adapter;
    
      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);
    
        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );
    
        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);
    
          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }
    
        return Promise.reject(reason);
      });
    };
    
    },{"../cancel/isCancel":18,"../defaults":28,"./../utils":39,"./transformData":27}],24:[function(require,module,exports){
    'use strict';
    
    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    module.exports = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }
    
      error.request = request;
      error.response = response;
      error.isAxiosError = true;
    
      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };
    
    },{}],25:[function(require,module,exports){
    'use strict';
    
    var utils = require('../utils');
    
    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    module.exports = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};
    
      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];
    
      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }
    
      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }
    
      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });
    
      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);
    
      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });
    
      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });
    
      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);
    
      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });
    
      utils.forEach(otherKeys, mergeDeepProperties);
    
      return config;
    };
    
    },{"../utils":39}],26:[function(require,module,exports){
    'use strict';
    
    var createError = require('./createError');
    
    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    module.exports = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };
    
    },{"./createError":22}],27:[function(require,module,exports){
    'use strict';
    
    var utils = require('./../utils');
    
    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    module.exports = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });
    
      return data;
    };
    
    },{"./../utils":39}],28:[function(require,module,exports){
    (function (process){(function (){
    'use strict';
    
    var utils = require('./utils');
    var normalizeHeaderName = require('./helpers/normalizeHeaderName');
    
    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }
    
    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = require('./adapters/xhr');
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = require('./adapters/http');
      }
      return adapter;
    }
    
    var defaults = {
      adapter: getDefaultAdapter(),
    
      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],
    
      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],
    
      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,
    
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',
    
      maxContentLength: -1,
      maxBodyLength: -1,
    
      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };
    
    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };
    
    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });
    
    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });
    
    module.exports = defaults;
    
    }).call(this)}).call(this,require('_process'))
    
    },{"./adapters/http":14,"./adapters/xhr":14,"./helpers/normalizeHeaderName":36,"./utils":39,"_process":48}],29:[function(require,module,exports){
    'use strict';
    
    module.exports = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };
    
    },{}],30:[function(require,module,exports){
    'use strict';
    
    var utils = require('./../utils');
    
    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }
    
    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    module.exports = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }
    
      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];
    
        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }
    
          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }
    
          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });
    
        serializedParams = parts.join('&');
      }
    
      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }
    
        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }
    
      return url;
    };
    
    },{"./../utils":39}],31:[function(require,module,exports){
    'use strict';
    
    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    module.exports = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };
    
    },{}],32:[function(require,module,exports){
    'use strict';
    
    var utils = require('./../utils');
    
    module.exports = (
      utils.isStandardBrowserEnv() ?
    
      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));
    
              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }
    
              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }
    
              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }
    
              if (secure === true) {
                cookie.push('secure');
              }
    
              document.cookie = cookie.join('; ');
            },
    
            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },
    
            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :
    
      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );
    
    },{"./../utils":39}],33:[function(require,module,exports){
    'use strict';
    
    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    module.exports = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };
    
    },{}],34:[function(require,module,exports){
    'use strict';
    
    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    module.exports = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };
    
    },{}],35:[function(require,module,exports){
    'use strict';
    
    var utils = require('./../utils');
    
    module.exports = (
      utils.isStandardBrowserEnv() ?
    
      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;
    
          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;
    
            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }
    
            urlParsingNode.setAttribute('href', href);
    
            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }
    
          originURL = resolveURL(window.location.href);
    
          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :
    
      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );
    
    },{"./../utils":39}],36:[function(require,module,exports){
    'use strict';
    
    var utils = require('../utils');
    
    module.exports = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };
    
    },{"../utils":39}],37:[function(require,module,exports){
    'use strict';
    
    var utils = require('./../utils');
    
    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];
    
    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    module.exports = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;
    
      if (!headers) { return parsed; }
    
      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));
    
        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });
    
      return parsed;
    };
    
    },{"./../utils":39}],38:[function(require,module,exports){
    'use strict';
    
    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    module.exports = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };
    
    },{}],39:[function(require,module,exports){
    'use strict';
    
    var bind = require('./helpers/bind');
    
    /*global toString:true*/
    
    // utils is a library of generic helper functions non-specific to axios
    
    var toString = Object.prototype.toString;
    
    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }
    
    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }
    
    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }
    
    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }
    
    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }
    
    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }
    
    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }
    
    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }
    
    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }
    
    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }
    
      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }
    
    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }
    
    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }
    
    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }
    
    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }
    
    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }
    
    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }
    
    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }
    
    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }
    
    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }
    
      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }
    
      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }
    
    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }
    
      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }
    
    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }
    
    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }
    
    module.exports = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };
    
    },{"./helpers/bind":29}],40:[function(require,module,exports){
    'use strict'
    
    exports.byteLength = byteLength
    exports.toByteArray = toByteArray
    exports.fromByteArray = fromByteArray
    
    var lookup = []
    var revLookup = []
    var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array
    
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i]
      revLookup[code.charCodeAt(i)] = i
    }
    
    // Support decoding URL-safe base64 strings, as Node.js does.
    // See: https://en.wikipedia.org/wiki/Base64#URL_applications
    revLookup['-'.charCodeAt(0)] = 62
    revLookup['_'.charCodeAt(0)] = 63
    
    function getLens (b64) {
      var len = b64.length
    
      if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }
    
      // Trim off extra bytes after placeholder bytes are found
      // See: https://github.com/beatgammit/base64-js/issues/42
      var validLen = b64.indexOf('=')
      if (validLen === -1) validLen = len
    
      var placeHoldersLen = validLen === len
        ? 0
        : 4 - (validLen % 4)
    
      return [validLen, placeHoldersLen]
    }
    
    // base64 is 4/3 + up to two characters of the original data
    function byteLength (b64) {
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }
    
    function _byteLength (b64, validLen, placeHoldersLen) {
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }
    
    function toByteArray (b64) {
      var tmp
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]
    
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))
    
      var curByte = 0
    
      // if there are placeholders, only get up to the last complete 4 chars
      var len = placeHoldersLen > 0
        ? validLen - 4
        : validLen
    
      var i
      for (i = 0; i < len; i += 4) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 18) |
          (revLookup[b64.charCodeAt(i + 1)] << 12) |
          (revLookup[b64.charCodeAt(i + 2)] << 6) |
          revLookup[b64.charCodeAt(i + 3)]
        arr[curByte++] = (tmp >> 16) & 0xFF
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }
    
      if (placeHoldersLen === 2) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 2) |
          (revLookup[b64.charCodeAt(i + 1)] >> 4)
        arr[curByte++] = tmp & 0xFF
      }
    
      if (placeHoldersLen === 1) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 10) |
          (revLookup[b64.charCodeAt(i + 1)] << 4) |
          (revLookup[b64.charCodeAt(i + 2)] >> 2)
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }
    
      return arr
    }
    
    function tripletToBase64 (num) {
      return lookup[num >> 18 & 0x3F] +
        lookup[num >> 12 & 0x3F] +
        lookup[num >> 6 & 0x3F] +
        lookup[num & 0x3F]
    }
    
    function encodeChunk (uint8, start, end) {
      var tmp
      var output = []
      for (var i = start; i < end; i += 3) {
        tmp =
          ((uint8[i] << 16) & 0xFF0000) +
          ((uint8[i + 1] << 8) & 0xFF00) +
          (uint8[i + 2] & 0xFF)
        output.push(tripletToBase64(tmp))
      }
      return output.join('')
    }
    
    function fromByteArray (uint8) {
      var tmp
      var len = uint8.length
      var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
      var parts = []
      var maxChunkLength = 16383 // must be multiple of 3
    
      // go through the array every three bytes, we'll deal with trailing stuff later
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
      }
    
      // pad the end with zeros, but make sure to not forget the extra bytes
      if (extraBytes === 1) {
        tmp = uint8[len - 1]
        parts.push(
          lookup[tmp >> 2] +
          lookup[(tmp << 4) & 0x3F] +
          '=='
        )
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1]
        parts.push(
          lookup[tmp >> 10] +
          lookup[(tmp >> 4) & 0x3F] +
          lookup[(tmp << 2) & 0x3F] +
          '='
        )
      }
    
      return parts.join('')
    }
    
    },{}],41:[function(require,module,exports){
    (function (global,Buffer){(function (){
    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <http://feross.org>
     * @license  MIT
     */
    /* eslint-disable no-proto */
    
    'use strict'
    
    var base64 = require('base64-js')
    var ieee754 = require('ieee754')
    var isArray = require('isarray')
    
    exports.Buffer = Buffer
    exports.SlowBuffer = SlowBuffer
    exports.INSPECT_MAX_BYTES = 50
    
    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Use Object implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * Due to various browser bugs, sometimes the Object implementation will be used even
     * when the browser supports typed arrays.
     *
     * Note:
     *
     *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
     *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
     *
     *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
     *
     *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
     *     incorrect length in some situations.
    
     * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
     * get the Object implementation, which is slower but behaves correctly.
     */
    Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
      ? global.TYPED_ARRAY_SUPPORT
      : typedArraySupport()
    
    /*
     * Export kMaxLength after typed array support is determined.
     */
    exports.kMaxLength = kMaxLength()
    
    function typedArraySupport () {
      try {
        var arr = new Uint8Array(1)
        arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
        return arr.foo() === 42 && // typed array instances can be augmented
            typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
            arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
      } catch (e) {
        return false
      }
    }
    
    function kMaxLength () {
      return Buffer.TYPED_ARRAY_SUPPORT
        ? 0x7fffffff
        : 0x3fffffff
    }
    
    function createBuffer (that, length) {
      if (kMaxLength() < length) {
        throw new RangeError('Invalid typed array length')
      }
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        // Return an augmented `Uint8Array` instance, for best performance
        that = new Uint8Array(length)
        that.__proto__ = Buffer.prototype
      } else {
        // Fallback: Return an object instance of the Buffer class
        if (that === null) {
          that = new Buffer(length)
        }
        that.length = length
      }
    
      return that
    }
    
    /**
     * The Buffer constructor returns instances of `Uint8Array` that have their
     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
     * returns a single octet.
     *
     * The `Uint8Array` prototype remains unmodified.
     */
    
    function Buffer (arg, encodingOrOffset, length) {
      if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
        return new Buffer(arg, encodingOrOffset, length)
      }
    
      // Common case.
      if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
          throw new Error(
            'If encoding is specified then the first argument must be a string'
          )
        }
        return allocUnsafe(this, arg)
      }
      return from(this, arg, encodingOrOffset, length)
    }
    
    Buffer.poolSize = 8192 // not used by this implementation
    
    // TODO: Legacy, not needed anymore. Remove in next major version.
    Buffer._augment = function (arr) {
      arr.__proto__ = Buffer.prototype
      return arr
    }
    
    function from (that, value, encodingOrOffset, length) {
      if (typeof value === 'number') {
        throw new TypeError('"value" argument must not be a number')
      }
    
      if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
        return fromArrayBuffer(that, value, encodingOrOffset, length)
      }
    
      if (typeof value === 'string') {
        return fromString(that, value, encodingOrOffset)
      }
    
      return fromObject(that, value)
    }
    
    /**
     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
     * if value is a number.
     * Buffer.from(str[, encoding])
     * Buffer.from(array)
     * Buffer.from(buffer)
     * Buffer.from(arrayBuffer[, byteOffset[, length]])
     **/
    Buffer.from = function (value, encodingOrOffset, length) {
      return from(null, value, encodingOrOffset, length)
    }
    
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      Buffer.prototype.__proto__ = Uint8Array.prototype
      Buffer.__proto__ = Uint8Array
      if (typeof Symbol !== 'undefined' && Symbol.species &&
          Buffer[Symbol.species] === Buffer) {
        // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
        Object.defineProperty(Buffer, Symbol.species, {
          value: null,
          configurable: true
        })
      }
    }
    
    function assertSize (size) {
      if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be a number')
      } else if (size < 0) {
        throw new RangeError('"size" argument must not be negative')
      }
    }
    
    function alloc (that, size, fill, encoding) {
      assertSize(size)
      if (size <= 0) {
        return createBuffer(that, size)
      }
      if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpretted as a start offset.
        return typeof encoding === 'string'
          ? createBuffer(that, size).fill(fill, encoding)
          : createBuffer(that, size).fill(fill)
      }
      return createBuffer(that, size)
    }
    
    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer.alloc = function (size, fill, encoding) {
      return alloc(null, size, fill, encoding)
    }
    
    function allocUnsafe (that, size) {
      assertSize(size)
      that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
      if (!Buffer.TYPED_ARRAY_SUPPORT) {
        for (var i = 0; i < size; ++i) {
          that[i] = 0
        }
      }
      return that
    }
    
    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer.allocUnsafe = function (size) {
      return allocUnsafe(null, size)
    }
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer.allocUnsafeSlow = function (size) {
      return allocUnsafe(null, size)
    }
    
    function fromString (that, string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8'
      }
    
      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('"encoding" must be a valid string encoding')
      }
    
      var length = byteLength(string, encoding) | 0
      that = createBuffer(that, length)
    
      var actual = that.write(string, encoding)
    
      if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        that = that.slice(0, actual)
      }
    
      return that
    }
    
    function fromArrayLike (that, array) {
      var length = array.length < 0 ? 0 : checked(array.length) | 0
      that = createBuffer(that, length)
      for (var i = 0; i < length; i += 1) {
        that[i] = array[i] & 255
      }
      return that
    }
    
    function fromArrayBuffer (that, array, byteOffset, length) {
      array.byteLength // this throws if `array` is not a valid ArrayBuffer
    
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('\'offset\' is out of bounds')
      }
    
      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('\'length\' is out of bounds')
      }
    
      if (byteOffset === undefined && length === undefined) {
        array = new Uint8Array(array)
      } else if (length === undefined) {
        array = new Uint8Array(array, byteOffset)
      } else {
        array = new Uint8Array(array, byteOffset, length)
      }
    
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        // Return an augmented `Uint8Array` instance, for best performance
        that = array
        that.__proto__ = Buffer.prototype
      } else {
        // Fallback: Return an object instance of the Buffer class
        that = fromArrayLike(that, array)
      }
      return that
    }
    
    function fromObject (that, obj) {
      if (Buffer.isBuffer(obj)) {
        var len = checked(obj.length) | 0
        that = createBuffer(that, len)
    
        if (that.length === 0) {
          return that
        }
    
        obj.copy(that, 0, 0, len)
        return that
      }
    
      if (obj) {
        if ((typeof ArrayBuffer !== 'undefined' &&
            obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
          if (typeof obj.length !== 'number' || isnan(obj.length)) {
            return createBuffer(that, 0)
          }
          return fromArrayLike(that, obj)
        }
    
        if (obj.type === 'Buffer' && isArray(obj.data)) {
          return fromArrayLike(that, obj.data)
        }
      }
    
      throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
    }
    
    function checked (length) {
      // Note: cannot use `length < kMaxLength()` here because that fails when
      // length is NaN (which is otherwise coerced to zero.)
      if (length >= kMaxLength()) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                             'size: 0x' + kMaxLength().toString(16) + ' bytes')
      }
      return length | 0
    }
    
    function SlowBuffer (length) {
      if (+length != length) { // eslint-disable-line eqeqeq
        length = 0
      }
      return Buffer.alloc(+length)
    }
    
    Buffer.isBuffer = function isBuffer (b) {
      return !!(b != null && b._isBuffer)
    }
    
    Buffer.compare = function compare (a, b) {
      if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        throw new TypeError('Arguments must be Buffers')
      }
    
      if (a === b) return 0
    
      var x = a.length
      var y = b.length
    
      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i]
          y = b[i]
          break
        }
      }
    
      if (x < y) return -1
      if (y < x) return 1
      return 0
    }
    
    Buffer.isEncoding = function isEncoding (encoding) {
      switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return true
        default:
          return false
      }
    }
    
    Buffer.concat = function concat (list, length) {
      if (!isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }
    
      if (list.length === 0) {
        return Buffer.alloc(0)
      }
    
      var i
      if (length === undefined) {
        length = 0
        for (i = 0; i < list.length; ++i) {
          length += list[i].length
        }
      }
    
      var buffer = Buffer.allocUnsafe(length)
      var pos = 0
      for (i = 0; i < list.length; ++i) {
        var buf = list[i]
        if (!Buffer.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers')
        }
        buf.copy(buffer, pos)
        pos += buf.length
      }
      return buffer
    }
    
    function byteLength (string, encoding) {
      if (Buffer.isBuffer(string)) {
        return string.length
      }
      if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
          (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
        return string.byteLength
      }
      if (typeof string !== 'string') {
        string = '' + string
      }
    
      var len = string.length
      if (len === 0) return 0
    
      // Use a for loop to avoid recursion
      var loweredCase = false
      for (;;) {
        switch (encoding) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return len
          case 'utf8':
          case 'utf-8':
          case undefined:
            return utf8ToBytes(string).length
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return len * 2
          case 'hex':
            return len >>> 1
          case 'base64':
            return base64ToBytes(string).length
          default:
            if (loweredCase) return utf8ToBytes(string).length // assume utf8
            encoding = ('' + encoding).toLowerCase()
            loweredCase = true
        }
      }
    }
    Buffer.byteLength = byteLength
    
    function slowToString (encoding, start, end) {
      var loweredCase = false
    
      // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
      // property of a typed array.
    
      // This behaves neither like String nor Uint8Array in that we set start/end
      // to their upper/lower bounds if the value passed is out of range.
      // undefined is handled specially as per ECMA-262 6th Edition,
      // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
      if (start === undefined || start < 0) {
        start = 0
      }
      // Return early if start > this.length. Done here to prevent potential uint32
      // coercion fail below.
      if (start > this.length) {
        return ''
      }
    
      if (end === undefined || end > this.length) {
        end = this.length
      }
    
      if (end <= 0) {
        return ''
      }
    
      // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
      end >>>= 0
      start >>>= 0
    
      if (end <= start) {
        return ''
      }
    
      if (!encoding) encoding = 'utf8'
    
      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end)
    
          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end)
    
          case 'ascii':
            return asciiSlice(this, start, end)
    
          case 'latin1':
          case 'binary':
            return latin1Slice(this, start, end)
    
          case 'base64':
            return base64Slice(this, start, end)
    
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end)
    
          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = (encoding + '').toLowerCase()
            loweredCase = true
        }
      }
    }
    
    // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
    // Buffer instances.
    Buffer.prototype._isBuffer = true
    
    function swap (b, n, m) {
      var i = b[n]
      b[n] = b[m]
      b[m] = i
    }
    
    Buffer.prototype.swap16 = function swap16 () {
      var len = this.length
      if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits')
      }
      for (var i = 0; i < len; i += 2) {
        swap(this, i, i + 1)
      }
      return this
    }
    
    Buffer.prototype.swap32 = function swap32 () {
      var len = this.length
      if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits')
      }
      for (var i = 0; i < len; i += 4) {
        swap(this, i, i + 3)
        swap(this, i + 1, i + 2)
      }
      return this
    }
    
    Buffer.prototype.swap64 = function swap64 () {
      var len = this.length
      if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits')
      }
      for (var i = 0; i < len; i += 8) {
        swap(this, i, i + 7)
        swap(this, i + 1, i + 6)
        swap(this, i + 2, i + 5)
        swap(this, i + 3, i + 4)
      }
      return this
    }
    
    Buffer.prototype.toString = function toString () {
      var length = this.length | 0
      if (length === 0) return ''
      if (arguments.length === 0) return utf8Slice(this, 0, length)
      return slowToString.apply(this, arguments)
    }
    
    Buffer.prototype.equals = function equals (b) {
      if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
      if (this === b) return true
      return Buffer.compare(this, b) === 0
    }
    
    Buffer.prototype.inspect = function inspect () {
      var str = ''
      var max = exports.INSPECT_MAX_BYTES
      if (this.length > 0) {
        str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
        if (this.length > max) str += ' ... '
      }
      return '<Buffer ' + str + '>'
    }
    
    Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
      if (!Buffer.isBuffer(target)) {
        throw new TypeError('Argument must be a Buffer')
      }
    
      if (start === undefined) {
        start = 0
      }
      if (end === undefined) {
        end = target ? target.length : 0
      }
      if (thisStart === undefined) {
        thisStart = 0
      }
      if (thisEnd === undefined) {
        thisEnd = this.length
      }
    
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index')
      }
    
      if (thisStart >= thisEnd && start >= end) {
        return 0
      }
      if (thisStart >= thisEnd) {
        return -1
      }
      if (start >= end) {
        return 1
      }
    
      start >>>= 0
      end >>>= 0
      thisStart >>>= 0
      thisEnd >>>= 0
    
      if (this === target) return 0
    
      var x = thisEnd - thisStart
      var y = end - start
      var len = Math.min(x, y)
    
      var thisCopy = this.slice(thisStart, thisEnd)
      var targetCopy = target.slice(start, end)
    
      for (var i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i]
          y = targetCopy[i]
          break
        }
      }
    
      if (x < y) return -1
      if (y < x) return 1
      return 0
    }
    
    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
    //
    // Arguments:
    // - buffer - a Buffer to search
    // - val - a string, Buffer, or number
    // - byteOffset - an index into `buffer`; will be clamped to an int32
    // - encoding - an optional encoding, relevant is val is a string
    // - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
      // Empty buffer means no match
      if (buffer.length === 0) return -1
    
      // Normalize byteOffset
      if (typeof byteOffset === 'string') {
        encoding = byteOffset
        byteOffset = 0
      } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff
      } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000
      }
      byteOffset = +byteOffset  // Coerce to Number.
      if (isNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : (buffer.length - 1)
      }
    
      // Normalize byteOffset: negative offsets start from the end of the buffer
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset
      if (byteOffset >= buffer.length) {
        if (dir) return -1
        else byteOffset = buffer.length - 1
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0
        else return -1
      }
    
      // Normalize val
      if (typeof val === 'string') {
        val = Buffer.from(val, encoding)
      }
    
      // Finally, search either indexOf (if dir is true) or lastIndexOf
      if (Buffer.isBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
          return -1
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
      } else if (typeof val === 'number') {
        val = val & 0xFF // Search for a byte value [0-255]
        if (Buffer.TYPED_ARRAY_SUPPORT &&
            typeof Uint8Array.prototype.indexOf === 'function') {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
          }
        }
        return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
      }
    
      throw new TypeError('val must be string, number or Buffer')
    }
    
    function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
      var indexSize = 1
      var arrLength = arr.length
      var valLength = val.length
    
      if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase()
        if (encoding === 'ucs2' || encoding === 'ucs-2' ||
            encoding === 'utf16le' || encoding === 'utf-16le') {
          if (arr.length < 2 || val.length < 2) {
            return -1
          }
          indexSize = 2
          arrLength /= 2
          valLength /= 2
          byteOffset /= 2
        }
      }
    
      function read (buf, i) {
        if (indexSize === 1) {
          return buf[i]
        } else {
          return buf.readUInt16BE(i * indexSize)
        }
      }
    
      var i
      if (dir) {
        var foundIndex = -1
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
          } else {
            if (foundIndex !== -1) i -= i - foundIndex
            foundIndex = -1
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
        for (i = byteOffset; i >= 0; i--) {
          var found = true
          for (var j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false
              break
            }
          }
          if (found) return i
        }
      }
    
      return -1
    }
    
    Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1
    }
    
    Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
    }
    
    Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
    }
    
    function hexWrite (buf, string, offset, length) {
      offset = Number(offset) || 0
      var remaining = buf.length - offset
      if (!length) {
        length = remaining
      } else {
        length = Number(length)
        if (length > remaining) {
          length = remaining
        }
      }
    
      // must be an even number of digits
      var strLen = string.length
      if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')
    
      if (length > strLen / 2) {
        length = strLen / 2
      }
      for (var i = 0; i < length; ++i) {
        var parsed = parseInt(string.substr(i * 2, 2), 16)
        if (isNaN(parsed)) return i
        buf[offset + i] = parsed
      }
      return i
    }
    
    function utf8Write (buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
    }
    
    function asciiWrite (buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length)
    }
    
    function latin1Write (buf, string, offset, length) {
      return asciiWrite(buf, string, offset, length)
    }
    
    function base64Write (buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length)
    }
    
    function ucs2Write (buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
    }
    
    Buffer.prototype.write = function write (string, offset, length, encoding) {
      // Buffer#write(string)
      if (offset === undefined) {
        encoding = 'utf8'
        length = this.length
        offset = 0
      // Buffer#write(string, encoding)
      } else if (length === undefined && typeof offset === 'string') {
        encoding = offset
        length = this.length
        offset = 0
      // Buffer#write(string, offset[, length][, encoding])
      } else if (isFinite(offset)) {
        offset = offset | 0
        if (isFinite(length)) {
          length = length | 0
          if (encoding === undefined) encoding = 'utf8'
        } else {
          encoding = length
          length = undefined
        }
      // legacy write(string, encoding, offset, length) - remove in v0.13
      } else {
        throw new Error(
          'Buffer.write(string, encoding, offset[, length]) is no longer supported'
        )
      }
    
      var remaining = this.length - offset
      if (length === undefined || length > remaining) length = remaining
    
      if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds')
      }
    
      if (!encoding) encoding = 'utf8'
    
      var loweredCase = false
      for (;;) {
        switch (encoding) {
          case 'hex':
            return hexWrite(this, string, offset, length)
    
          case 'utf8':
          case 'utf-8':
            return utf8Write(this, string, offset, length)
    
          case 'ascii':
            return asciiWrite(this, string, offset, length)
    
          case 'latin1':
          case 'binary':
            return latin1Write(this, string, offset, length)
    
          case 'base64':
            // Warning: maxLength not taken into account in base64Write
            return base64Write(this, string, offset, length)
    
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return ucs2Write(this, string, offset, length)
    
          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = ('' + encoding).toLowerCase()
            loweredCase = true
        }
      }
    }
    
    Buffer.prototype.toJSON = function toJSON () {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      }
    }
    
    function base64Slice (buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf)
      } else {
        return base64.fromByteArray(buf.slice(start, end))
      }
    }
    
    function utf8Slice (buf, start, end) {
      end = Math.min(buf.length, end)
      var res = []
    
      var i = start
      while (i < end) {
        var firstByte = buf[i]
        var codePoint = null
        var bytesPerSequence = (firstByte > 0xEF) ? 4
          : (firstByte > 0xDF) ? 3
          : (firstByte > 0xBF) ? 2
          : 1
    
        if (i + bytesPerSequence <= end) {
          var secondByte, thirdByte, fourthByte, tempCodePoint
    
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 0x80) {
                codePoint = firstByte
              }
              break
            case 2:
              secondByte = buf[i + 1]
              if ((secondByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                if (tempCodePoint > 0x7F) {
                  codePoint = tempCodePoint
                }
              }
              break
            case 3:
              secondByte = buf[i + 1]
              thirdByte = buf[i + 2]
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                  codePoint = tempCodePoint
                }
              }
              break
            case 4:
              secondByte = buf[i + 1]
              thirdByte = buf[i + 2]
              fourthByte = buf[i + 3]
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                  codePoint = tempCodePoint
                }
              }
          }
        }
    
        if (codePoint === null) {
          // we did not generate a valid codePoint so insert a
          // replacement char (U+FFFD) and advance only 1 byte
          codePoint = 0xFFFD
          bytesPerSequence = 1
        } else if (codePoint > 0xFFFF) {
          // encode to utf16 (surrogate pair dance)
          codePoint -= 0x10000
          res.push(codePoint >>> 10 & 0x3FF | 0xD800)
          codePoint = 0xDC00 | codePoint & 0x3FF
        }
    
        res.push(codePoint)
        i += bytesPerSequence
      }
    
      return decodeCodePointsArray(res)
    }
    
    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
    // the lowest limit is Chrome, with 0x10000 args.
    // We go 1 magnitude less, for safety
    var MAX_ARGUMENTS_LENGTH = 0x1000
    
    function decodeCodePointsArray (codePoints) {
      var len = codePoints.length
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
      }
    
      // Decode in chunks to avoid "call stack size exceeded".
      var res = ''
      var i = 0
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        )
      }
      return res
    }
    
    function asciiSlice (buf, start, end) {
      var ret = ''
      end = Math.min(buf.length, end)
    
      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7F)
      }
      return ret
    }
    
    function latin1Slice (buf, start, end) {
      var ret = ''
      end = Math.min(buf.length, end)
    
      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i])
      }
      return ret
    }
    
    function hexSlice (buf, start, end) {
      var len = buf.length
    
      if (!start || start < 0) start = 0
      if (!end || end < 0 || end > len) end = len
    
      var out = ''
      for (var i = start; i < end; ++i) {
        out += toHex(buf[i])
      }
      return out
    }
    
    function utf16leSlice (buf, start, end) {
      var bytes = buf.slice(start, end)
      var res = ''
      for (var i = 0; i < bytes.length; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
      }
      return res
    }
    
    Buffer.prototype.slice = function slice (start, end) {
      var len = this.length
      start = ~~start
      end = end === undefined ? len : ~~end
    
      if (start < 0) {
        start += len
        if (start < 0) start = 0
      } else if (start > len) {
        start = len
      }
    
      if (end < 0) {
        end += len
        if (end < 0) end = 0
      } else if (end > len) {
        end = len
      }
    
      if (end < start) end = start
    
      var newBuf
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        newBuf = this.subarray(start, end)
        newBuf.__proto__ = Buffer.prototype
      } else {
        var sliceLen = end - start
        newBuf = new Buffer(sliceLen, undefined)
        for (var i = 0; i < sliceLen; ++i) {
          newBuf[i] = this[i + start]
        }
      }
    
      return newBuf
    }
    
    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset (offset, ext, length) {
      if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
      if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
    }
    
    Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
      offset = offset | 0
      byteLength = byteLength | 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)
    
      var val = this[offset]
      var mul = 1
      var i = 0
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
      }
    
      return val
    }
    
    Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
      offset = offset | 0
      byteLength = byteLength | 0
      if (!noAssert) {
        checkOffset(offset, byteLength, this.length)
      }
    
      var val = this[offset + --byteLength]
      var mul = 1
      while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul
      }
    
      return val
    }
    
    Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 1, this.length)
      return this[offset]
    }
    
    Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length)
      return this[offset] | (this[offset + 1] << 8)
    }
    
    Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length)
      return (this[offset] << 8) | this[offset + 1]
    }
    
    Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length)
    
      return ((this[offset]) |
          (this[offset + 1] << 8) |
          (this[offset + 2] << 16)) +
          (this[offset + 3] * 0x1000000)
    }
    
    Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length)
    
      return (this[offset] * 0x1000000) +
        ((this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        this[offset + 3])
    }
    
    Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
      offset = offset | 0
      byteLength = byteLength | 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)
    
      var val = this[offset]
      var mul = 1
      var i = 0
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul
      }
      mul *= 0x80
    
      if (val >= mul) val -= Math.pow(2, 8 * byteLength)
    
      return val
    }
    
    Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
      offset = offset | 0
      byteLength = byteLength | 0
      if (!noAssert) checkOffset(offset, byteLength, this.length)
    
      var i = byteLength
      var mul = 1
      var val = this[offset + --i]
      while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul
      }
      mul *= 0x80
    
      if (val >= mul) val -= Math.pow(2, 8 * byteLength)
    
      return val
    }
    
    Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 1, this.length)
      if (!(this[offset] & 0x80)) return (this[offset])
      return ((0xff - this[offset] + 1) * -1)
    }
    
    Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length)
      var val = this[offset] | (this[offset + 1] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }
    
    Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length)
      var val = this[offset + 1] | (this[offset] << 8)
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    }
    
    Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length)
    
      return (this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24)
    }
    
    Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length)
    
      return (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        (this[offset + 3])
    }
    
    Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, true, 23, 4)
    }
    
    Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length)
      return ieee754.read(this, offset, false, 23, 4)
    }
    
    Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, true, 52, 8)
    }
    
    Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 8, this.length)
      return ieee754.read(this, offset, false, 52, 8)
    }
    
    function checkInt (buf, value, offset, ext, max, min) {
      if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
    }
    
    Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset | 0
      byteLength = byteLength | 0
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1
        checkInt(this, value, offset, byteLength, maxBytes, 0)
      }
    
      var mul = 1
      var i = 0
      this[offset] = value & 0xFF
      while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
      }
    
      return offset + byteLength
    }
    
    Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset | 0
      byteLength = byteLength | 0
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1
        checkInt(this, value, offset, byteLength, maxBytes, 0)
      }
    
      var i = byteLength - 1
      var mul = 1
      this[offset + i] = value & 0xFF
      while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF
      }
    
      return offset + byteLength
    }
    
    Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
      if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
      this[offset] = (value & 0xff)
      return offset + 1
    }
    
    function objectWriteUInt16 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffff + value + 1
      for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
        buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
          (littleEndian ? i : 1 - i) * 8
      }
    }
    
    Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff)
        this[offset + 1] = (value >>> 8)
      } else {
        objectWriteUInt16(this, value, offset, true)
      }
      return offset + 2
    }
    
    Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8)
        this[offset + 1] = (value & 0xff)
      } else {
        objectWriteUInt16(this, value, offset, false)
      }
      return offset + 2
    }
    
    function objectWriteUInt32 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffffffff + value + 1
      for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
        buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
      }
    }
    
    Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset + 3] = (value >>> 24)
        this[offset + 2] = (value >>> 16)
        this[offset + 1] = (value >>> 8)
        this[offset] = (value & 0xff)
      } else {
        objectWriteUInt32(this, value, offset, true)
      }
      return offset + 4
    }
    
    Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24)
        this[offset + 1] = (value >>> 16)
        this[offset + 2] = (value >>> 8)
        this[offset + 3] = (value & 0xff)
      } else {
        objectWriteUInt32(this, value, offset, false)
      }
      return offset + 4
    }
    
    Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1)
    
        checkInt(this, value, offset, byteLength, limit - 1, -limit)
      }
    
      var i = 0
      var mul = 1
      var sub = 0
      this[offset] = value & 0xFF
      while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
      }
    
      return offset + byteLength
    }
    
    Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1)
    
        checkInt(this, value, offset, byteLength, limit - 1, -limit)
      }
    
      var i = byteLength - 1
      var mul = 1
      var sub = 0
      this[offset + i] = value & 0xFF
      while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
      }
    
      return offset + byteLength
    }
    
    Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
      if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
      if (value < 0) value = 0xff + value + 1
      this[offset] = (value & 0xff)
      return offset + 1
    }
    
    Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff)
        this[offset + 1] = (value >>> 8)
      } else {
        objectWriteUInt16(this, value, offset, true)
      }
      return offset + 2
    }
    
    Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8)
        this[offset + 1] = (value & 0xff)
      } else {
        objectWriteUInt16(this, value, offset, false)
      }
      return offset + 2
    }
    
    Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff)
        this[offset + 1] = (value >>> 8)
        this[offset + 2] = (value >>> 16)
        this[offset + 3] = (value >>> 24)
      } else {
        objectWriteUInt32(this, value, offset, true)
      }
      return offset + 4
    }
    
    Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
      value = +value
      offset = offset | 0
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
      if (value < 0) value = 0xffffffff + value + 1
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24)
        this[offset + 1] = (value >>> 16)
        this[offset + 2] = (value >>> 8)
        this[offset + 3] = (value & 0xff)
      } else {
        objectWriteUInt32(this, value, offset, false)
      }
      return offset + 4
    }
    
    function checkIEEE754 (buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
      if (offset < 0) throw new RangeError('Index out of range')
    }
    
    function writeFloat (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4)
      return offset + 4
    }
    
    Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert)
    }
    
    Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert)
    }
    
    function writeDouble (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8)
      return offset + 8
    }
    
    Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert)
    }
    
    Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert)
    }
    
    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function copy (target, targetStart, start, end) {
      if (!start) start = 0
      if (!end && end !== 0) end = this.length
      if (targetStart >= target.length) targetStart = target.length
      if (!targetStart) targetStart = 0
      if (end > 0 && end < start) end = start
    
      // Copy 0 bytes; we're done
      if (end === start) return 0
      if (target.length === 0 || this.length === 0) return 0
    
      // Fatal error conditions
      if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds')
      }
      if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
      if (end < 0) throw new RangeError('sourceEnd out of bounds')
    
      // Are we oob?
      if (end > this.length) end = this.length
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start
      }
    
      var len = end - start
      var i
    
      if (this === target && start < targetStart && targetStart < end) {
        // descending copy from end
        for (i = len - 1; i >= 0; --i) {
          target[i + targetStart] = this[i + start]
        }
      } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
        // ascending copy from start
        for (i = 0; i < len; ++i) {
          target[i + targetStart] = this[i + start]
        }
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, start + len),
          targetStart
        )
      }
    
      return len
    }
    
    // Usage:
    //    buffer.fill(number[, offset[, end]])
    //    buffer.fill(buffer[, offset[, end]])
    //    buffer.fill(string[, offset[, end]][, encoding])
    Buffer.prototype.fill = function fill (val, start, end, encoding) {
      // Handle string cases:
      if (typeof val === 'string') {
        if (typeof start === 'string') {
          encoding = start
          start = 0
          end = this.length
        } else if (typeof end === 'string') {
          encoding = end
          end = this.length
        }
        if (val.length === 1) {
          var code = val.charCodeAt(0)
          if (code < 256) {
            val = code
          }
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
          throw new TypeError('encoding must be a string')
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding)
        }
      } else if (typeof val === 'number') {
        val = val & 255
      }
    
      // Invalid ranges are not set to a default, so can range check early.
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index')
      }
    
      if (end <= start) {
        return this
      }
    
      start = start >>> 0
      end = end === undefined ? this.length : end >>> 0
    
      if (!val) val = 0
    
      var i
      if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
          this[i] = val
        }
      } else {
        var bytes = Buffer.isBuffer(val)
          ? val
          : utf8ToBytes(new Buffer(val, encoding).toString())
        var len = bytes.length
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len]
        }
      }
    
      return this
    }
    
    // HELPER FUNCTIONS
    // ================
    
    var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g
    
    function base64clean (str) {
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = stringtrim(str).replace(INVALID_BASE64_RE, '')
      // Node converts strings with length < 2 to ''
      if (str.length < 2) return ''
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '='
      }
      return str
    }
    
    function stringtrim (str) {
      if (str.trim) return str.trim()
      return str.replace(/^\s+|\s+$/g, '')
    }
    
    function toHex (n) {
      if (n < 16) return '0' + n.toString(16)
      return n.toString(16)
    }
    
    function utf8ToBytes (string, units) {
      units = units || Infinity
      var codePoint
      var length = string.length
      var leadSurrogate = null
      var bytes = []
    
      for (var i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i)
    
        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              continue
            }
    
            // valid lead
            leadSurrogate = codePoint
    
            continue
          }
    
          // 2 leads in a row
          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
            leadSurrogate = codePoint
            continue
          }
    
          // valid surrogate pair
          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        }
    
        leadSurrogate = null
    
        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break
          bytes.push(codePoint)
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break
          bytes.push(
            codePoint >> 0x6 | 0xC0,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break
          bytes.push(
            codePoint >> 0xC | 0xE0,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break
          bytes.push(
            codePoint >> 0x12 | 0xF0,
            codePoint >> 0xC & 0x3F | 0x80,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          )
        } else {
          throw new Error('Invalid code point')
        }
      }
    
      return bytes
    }
    
    function asciiToBytes (str) {
      var byteArray = []
      for (var i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF)
      }
      return byteArray
    }
    
    function utf16leToBytes (str, units) {
      var c, hi, lo
      var byteArray = []
      for (var i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break
    
        c = str.charCodeAt(i)
        hi = c >> 8
        lo = c % 256
        byteArray.push(lo)
        byteArray.push(hi)
      }
    
      return byteArray
    }
    
    function base64ToBytes (str) {
      return base64.toByteArray(base64clean(str))
    }
    
    function blitBuffer (src, dst, offset, length) {
      for (var i = 0; i < length; ++i) {
        if ((i + offset >= dst.length) || (i >= src.length)) break
        dst[i + offset] = src[i]
      }
      return i
    }
    
    function isnan (val) {
      return val !== val // eslint-disable-line no-self-compare
    }
    
    }).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
    
    },{"base64-js":40,"buffer":41,"ieee754":44,"isarray":45}],42:[function(require,module,exports){
    (function (process){(function (){
    /**
     * This is the web browser implementation of `debug()`.
     *
     * Expose `debug()` as the module.
     */
    
    exports = module.exports = require('./debug');
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = 'undefined' != typeof chrome
                   && 'undefined' != typeof chrome.storage
                      ? chrome.storage.local
                      : localstorage();
    
    /**
     * Colors.
     */
    
    exports.colors = [
      'lightseagreen',
      'forestgreen',
      'goldenrod',
      'dodgerblue',
      'darkorchid',
      'crimson'
    ];
    
    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */
    
    function useColors() {
      // NB: In an Electron preload script, document will be defined but not fully
      // initialized. Since we know we're in Chrome, we'll just detect this case
      // explicitly
      if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        return true;
      }
    
      // is webkit? http://stackoverflow.com/a/16459606/376773
      // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
      return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
        // is firebug? http://stackoverflow.com/a/398120/376773
        (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
        // is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
        // double check webkit in userAgent just in case we are in a worker
        (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }
    
    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */
    
    exports.formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return '[UnexpectedJSONParseError]: ' + err.message;
      }
    };
    
    
    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */
    
    function formatArgs(args) {
      var useColors = this.useColors;
    
      args[0] = (useColors ? '%c' : '')
        + this.namespace
        + (useColors ? ' %c' : ' ')
        + args[0]
        + (useColors ? '%c ' : ' ')
        + '+' + exports.humanize(this.diff);
    
      if (!useColors) return;
    
      var c = 'color: ' + this.color;
      args.splice(1, 0, c, 'color: inherit')
    
      // the final "%c" is somewhat tricky, because there could be other
      // arguments passed either before or after the %c, so we need to
      // figure out the correct index to insert the CSS into
      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if ('%%' === match) return;
        index++;
        if ('%c' === match) {
          // we only are interested in the *last* %c
          // (the user may have provided their own)
          lastC = index;
        }
      });
    
      args.splice(lastC, 0, c);
    }
    
    /**
     * Invokes `console.log()` when available.
     * No-op when `console.log` is not a "function".
     *
     * @api public
     */
    
    function log() {
      // this hackery is required for IE8/9, where
      // the `console.log` function doesn't have 'apply'
      return 'object' === typeof console
        && console.log
        && Function.prototype.apply.call(console.log, console, arguments);
    }
    
    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    
    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports.storage.removeItem('debug');
        } else {
          exports.storage.debug = namespaces;
        }
      } catch(e) {}
    }
    
    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    
    function load() {
      var r;
      try {
        r = exports.storage.debug;
      } catch(e) {}
    
      // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
      if (!r && typeof process !== 'undefined' && 'env' in process) {
        r = process.env.DEBUG;
      }
    
      return r;
    }
    
    /**
     * Enable namespaces listed in `localStorage.debug` initially.
     */
    
    exports.enable(load());
    
    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */
    
    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {}
    }
    
    }).call(this)}).call(this,require('_process'))
    
    },{"./debug":43,"_process":48}],43:[function(require,module,exports){
    
    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     *
     * Expose `debug()` as the module.
     */
    
    exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
    exports.coerce = coerce;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = require('ms');
    
    /**
     * The currently active debug mode names, and names to skip.
     */
    
    exports.names = [];
    exports.skips = [];
    
    /**
     * Map of special "%n" handling functions, for the debug "format" argument.
     *
     * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
     */
    
    exports.formatters = {};
    
    /**
     * Previous log timestamp.
     */
    
    var prevTime;
    
    /**
     * Select a color.
     * @param {String} namespace
     * @return {Number}
     * @api private
     */
    
    function selectColor(namespace) {
      var hash = 0, i;
    
      for (i in namespace) {
        hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
    
      return exports.colors[Math.abs(hash) % exports.colors.length];
    }
    
    /**
     * Create a debugger with the given `namespace`.
     *
     * @param {String} namespace
     * @return {Function}
     * @api public
     */
    
    function createDebug(namespace) {
    
      function debug() {
        // disabled?
        if (!debug.enabled) return;
    
        var self = debug;
    
        // set `diff` timestamp
        var curr = +new Date();
        var ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
    
        // turn the `arguments` into a proper Array
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
    
        args[0] = exports.coerce(args[0]);
    
        if ('string' !== typeof args[0]) {
          // anything else let's inspect with %O
          args.unshift('%O');
        }
    
        // apply any `formatters` transformations
        var index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
          // if we encounter an escaped % then don't increase the array index
          if (match === '%%') return match;
          index++;
          var formatter = exports.formatters[format];
          if ('function' === typeof formatter) {
            var val = args[index];
            match = formatter.call(self, val);
    
            // now we need to remove `args[index]` since it's inlined in the `format`
            args.splice(index, 1);
            index--;
          }
          return match;
        });
    
        // apply env-specific formatting (colors, etc.)
        exports.formatArgs.call(self, args);
    
        var logFn = debug.log || exports.log || console.log.bind(console);
        logFn.apply(self, args);
      }
    
      debug.namespace = namespace;
      debug.enabled = exports.enabled(namespace);
      debug.useColors = exports.useColors();
      debug.color = selectColor(namespace);
    
      // env-specific initialization logic for debug instances
      if ('function' === typeof exports.init) {
        exports.init(debug);
      }
    
      return debug;
    }
    
    /**
     * Enables a debug mode by namespaces. This can include modes
     * separated by a colon and wildcards.
     *
     * @param {String} namespaces
     * @api public
     */
    
    function enable(namespaces) {
      exports.save(namespaces);
    
      exports.names = [];
      exports.skips = [];
    
      var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
      var len = split.length;
    
      for (var i = 0; i < len; i++) {
        if (!split[i]) continue; // ignore empty strings
        namespaces = split[i].replace(/\*/g, '.*?');
        if (namespaces[0] === '-') {
          exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
        } else {
          exports.names.push(new RegExp('^' + namespaces + '$'));
        }
      }
    }
    
    /**
     * Disable debug output.
     *
     * @api public
     */
    
    function disable() {
      exports.enable('');
    }
    
    /**
     * Returns true if the given mode name is enabled, false otherwise.
     *
     * @param {String} name
     * @return {Boolean}
     * @api public
     */
    
    function enabled(name) {
      var i, len;
      for (i = 0, len = exports.skips.length; i < len; i++) {
        if (exports.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports.names.length; i < len; i++) {
        if (exports.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }
    
    /**
     * Coerce `val`.
     *
     * @param {Mixed} val
     * @return {Mixed}
     * @api private
     */
    
    function coerce(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
    
    },{"ms":47}],44:[function(require,module,exports){
    /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
    exports.read = function (buffer, offset, isLE, mLen, nBytes) {
      var e, m
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var nBits = -7
      var i = isLE ? (nBytes - 1) : 0
      var d = isLE ? -1 : 1
      var s = buffer[offset + i]
    
      i += d
    
      e = s & ((1 << (-nBits)) - 1)
      s >>= (-nBits)
      nBits += eLen
      for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}
    
      m = e & ((1 << (-nBits)) - 1)
      e >>= (-nBits)
      nBits += mLen
      for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}
    
      if (e === 0) {
        e = 1 - eBias
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen)
        e = e - eBias
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    }
    
    exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c
      var eLen = (nBytes * 8) - mLen - 1
      var eMax = (1 << eLen) - 1
      var eBias = eMax >> 1
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
      var i = isLE ? 0 : (nBytes - 1)
      var d = isLE ? 1 : -1
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0
    
      value = Math.abs(value)
    
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0
        e = eMax
      } else {
        e = Math.floor(Math.log(value) / Math.LN2)
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--
          c *= 2
        }
        if (e + eBias >= 1) {
          value += rt / c
        } else {
          value += rt * Math.pow(2, 1 - eBias)
        }
        if (value * c >= 2) {
          e++
          c /= 2
        }
    
        if (e + eBias >= eMax) {
          m = 0
          e = eMax
        } else if (e + eBias >= 1) {
          m = ((value * c) - 1) * Math.pow(2, mLen)
          e = e + eBias
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
          e = 0
        }
      }
    
      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
    
      e = (e << mLen) | m
      eLen += mLen
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
    
      buffer[offset + i - d] |= s * 128
    }
    
    },{}],45:[function(require,module,exports){
    var toString = {}.toString;
    
    module.exports = Array.isArray || function (arr) {
      return toString.call(arr) == '[object Array]';
    };
    
    },{}],46:[function(require,module,exports){
    (function (global){(function (){
    /*
     *  base64.js
     *
     *  Licensed under the BSD 3-Clause License.
     *    http://opensource.org/licenses/BSD-3-Clause
     *
     *  References:
     *    http://en.wikipedia.org/wiki/Base64
     */
    ;(function (global, factory) {
        typeof exports === 'object' && typeof module !== 'undefined'
            ? module.exports = factory(global)
            : typeof define === 'function' && define.amd
            ? define(factory) : factory(global)
    }((
        typeof self !== 'undefined' ? self
            : typeof window !== 'undefined' ? window
            : typeof global !== 'undefined' ? global
    : this
    ), function(global) {
        'use strict';
        // existing version for noConflict()
        global = global || {};
        var _Base64 = global.Base64;
        var version = "2.6.4";
        // constants
        var b64chars
            = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        var b64tab = function(bin) {
            var t = {};
            for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
            return t;
        }(b64chars);
        var fromCharCode = String.fromCharCode;
        // encoder stuff
        var cb_utob = function(c) {
            if (c.length < 2) {
                var cc = c.charCodeAt(0);
                return cc < 0x80 ? c
                    : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                                    + fromCharCode(0x80 | (cc & 0x3f)))
                    : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                        + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                        + fromCharCode(0x80 | ( cc         & 0x3f)));
            } else {
                var cc = 0x10000
                    + (c.charCodeAt(0) - 0xD800) * 0x400
                    + (c.charCodeAt(1) - 0xDC00);
                return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                        + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                        + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                        + fromCharCode(0x80 | ( cc         & 0x3f)));
            }
        };
        var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
        var utob = function(u) {
            return u.replace(re_utob, cb_utob);
        };
        var cb_encode = function(ccc) {
            var padlen = [0, 2, 1][ccc.length % 3],
            ord = ccc.charCodeAt(0) << 16
                | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
                | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
            chars = [
                b64chars.charAt( ord >>> 18),
                b64chars.charAt((ord >>> 12) & 63),
                padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
                padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
            ];
            return chars.join('');
        };
        var btoa = global.btoa && typeof global.btoa == 'function'
            ? function(b){ return global.btoa(b) } : function(b) {
            if (b.match(/[^\x00-\xFF]/)) throw new RangeError(
                'The string contains invalid characters.'
            );
            return b.replace(/[\s\S]{1,3}/g, cb_encode);
        };
        var _encode = function(u) {
            return btoa(utob(String(u)));
        };
        var mkUriSafe = function (b64) {
            return b64.replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
        };
        var encode = function(u, urisafe) {
            return urisafe ? mkUriSafe(_encode(u)) : _encode(u);
        };
        var encodeURI = function(u) { return encode(u, true) };
        var fromUint8Array;
        if (global.Uint8Array) fromUint8Array = function(a, urisafe) {
            // return btoa(fromCharCode.apply(null, a));
            var b64 = '';
            for (var i = 0, l = a.length; i < l; i += 3) {
                var a0 = a[i], a1 = a[i+1], a2 = a[i+2];
                var ord = a0 << 16 | a1 << 8 | a2;
                b64 +=    b64chars.charAt( ord >>> 18)
                    +     b64chars.charAt((ord >>> 12) & 63)
                    + ( typeof a1 != 'undefined'
                        ? b64chars.charAt((ord >>>  6) & 63) : '=')
                    + ( typeof a2 != 'undefined'
                        ? b64chars.charAt( ord         & 63) : '=');
            }
            return urisafe ? mkUriSafe(b64) : b64;
        };
        // decoder stuff
        var re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
        var cb_btou = function(cccc) {
            switch(cccc.length) {
            case 4:
                var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                    |    ((0x3f & cccc.charCodeAt(1)) << 12)
                    |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                    |     (0x3f & cccc.charCodeAt(3)),
                offset = cp - 0x10000;
                return (fromCharCode((offset  >>> 10) + 0xD800)
                        + fromCharCode((offset & 0x3FF) + 0xDC00));
            case 3:
                return fromCharCode(
                    ((0x0f & cccc.charCodeAt(0)) << 12)
                        | ((0x3f & cccc.charCodeAt(1)) << 6)
                        |  (0x3f & cccc.charCodeAt(2))
                );
            default:
                return  fromCharCode(
                    ((0x1f & cccc.charCodeAt(0)) << 6)
                        |  (0x3f & cccc.charCodeAt(1))
                );
            }
        };
        var btou = function(b) {
            return b.replace(re_btou, cb_btou);
        };
        var cb_decode = function(cccc) {
            var len = cccc.length,
            padlen = len % 4,
            n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
                | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
                | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
                | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
            chars = [
                fromCharCode( n >>> 16),
                fromCharCode((n >>>  8) & 0xff),
                fromCharCode( n         & 0xff)
            ];
            chars.length -= [0, 0, 2, 1][padlen];
            return chars.join('');
        };
        var _atob = global.atob && typeof global.atob == 'function'
            ? function(a){ return global.atob(a) } : function(a){
            return a.replace(/\S{1,4}/g, cb_decode);
        };
        var atob = function(a) {
            return _atob(String(a).replace(/[^A-Za-z0-9\+\/]/g, ''));
        };
        var _decode = function(a) { return btou(_atob(a)) };
        var _fromURI = function(a) {
            return String(a).replace(/[-_]/g, function(m0) {
                return m0 == '-' ? '+' : '/'
            }).replace(/[^A-Za-z0-9\+\/]/g, '');
        };
        var decode = function(a){
            return _decode(_fromURI(a));
        };
        var toUint8Array;
        if (global.Uint8Array) toUint8Array = function(a) {
            return Uint8Array.from(atob(_fromURI(a)), function(c) {
                return c.charCodeAt(0);
            });
        };
        var noConflict = function() {
            var Base64 = global.Base64;
            global.Base64 = _Base64;
            return Base64;
        };
        // export Base64
        global.Base64 = {
            VERSION: version,
            atob: atob,
            btoa: btoa,
            fromBase64: decode,
            toBase64: encode,
            utob: utob,
            encode: encode,
            encodeURI: encodeURI,
            btou: btou,
            decode: decode,
            noConflict: noConflict,
            fromUint8Array: fromUint8Array,
            toUint8Array: toUint8Array
        };
        // if ES5 is available, make Base64.extendString() available
        if (typeof Object.defineProperty === 'function') {
            var noEnum = function(v){
                return {value:v,enumerable:false,writable:true,configurable:true};
            };
            global.Base64.extendString = function () {
                Object.defineProperty(
                    String.prototype, 'fromBase64', noEnum(function () {
                        return decode(this)
                    }));
                Object.defineProperty(
                    String.prototype, 'toBase64', noEnum(function (urisafe) {
                        return encode(this, urisafe)
                    }));
                Object.defineProperty(
                    String.prototype, 'toBase64URI', noEnum(function () {
                        return encode(this, true)
                    }));
            };
        }
        //
        // export Base64 to the namespace
        //
        if (global['Meteor']) { // Meteor.js
            Base64 = global.Base64;
        }
        // module.exports and AMD are mutually exclusive.
        // module.exports has precedence.
        if (typeof module !== 'undefined' && module.exports) {
            module.exports.Base64 = global.Base64;
        }
        else if (typeof define === 'function' && define.amd) {
            // AMD. Register as an anonymous module.
            define([], function(){ return global.Base64 });
        }
        // that's it!
        return {Base64: global.Base64}
    }));
    
    }).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    
    },{}],47:[function(require,module,exports){
    /**
     * Helpers.
     */
    
    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var y = d * 365.25;
    
    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */
    
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse(val);
      } else if (type === 'number' && isNaN(val) === false) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };
    
    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */
    
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y;
        case 'days':
        case 'day':
        case 'd':
          return n * d;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }
    
    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */
    
    function fmtShort(ms) {
      if (ms >= d) {
        return Math.round(ms / d) + 'd';
      }
      if (ms >= h) {
        return Math.round(ms / h) + 'h';
      }
      if (ms >= m) {
        return Math.round(ms / m) + 'm';
      }
      if (ms >= s) {
        return Math.round(ms / s) + 's';
      }
      return ms + 'ms';
    }
    
    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */
    
    function fmtLong(ms) {
      return plural(ms, d, 'day') ||
        plural(ms, h, 'hour') ||
        plural(ms, m, 'minute') ||
        plural(ms, s, 'second') ||
        ms + ' ms';
    }
    
    /**
     * Pluralization helper.
     */
    
    function plural(ms, n, name) {
      if (ms < n) {
        return;
      }
      if (ms < n * 1.5) {
        return Math.floor(ms / n) + ' ' + name;
      }
      return Math.ceil(ms / n) + ' ' + name + 's';
    }
    
    },{}],48:[function(require,module,exports){
    // shim for using process in browser
    var process = module.exports = {};
    
    // cached from whatever global is present so that test runners that stub it
    // don't break things.  But we need to wrap it in a try catch in case it is
    // wrapped in strict mode code which doesn't define any globals.  It's inside a
    // function because try/catches deoptimize in certain engines.
    
    var cachedSetTimeout;
    var cachedClearTimeout;
    
    function defaultSetTimout() {
        throw new Error('setTimeout has not been defined');
    }
    function defaultClearTimeout () {
        throw new Error('clearTimeout has not been defined');
    }
    (function () {
        try {
            if (typeof setTimeout === 'function') {
                cachedSetTimeout = setTimeout;
            } else {
                cachedSetTimeout = defaultSetTimout;
            }
        } catch (e) {
            cachedSetTimeout = defaultSetTimout;
        }
        try {
            if (typeof clearTimeout === 'function') {
                cachedClearTimeout = clearTimeout;
            } else {
                cachedClearTimeout = defaultClearTimeout;
            }
        } catch (e) {
            cachedClearTimeout = defaultClearTimeout;
        }
    } ())
    function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
            //normal enviroments in sane situations
            return setTimeout(fun, 0);
        }
        // if setTimeout wasn't available but was latter defined
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedSetTimeout(fun, 0);
        } catch(e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                return cachedSetTimeout.call(null, fun, 0);
            } catch(e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                return cachedSetTimeout.call(this, fun, 0);
            }
        }
    
    
    }
    function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
            //normal enviroments in sane situations
            return clearTimeout(marker);
        }
        // if clearTimeout wasn't available but was latter defined
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedClearTimeout(marker);
        } catch (e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                return cachedClearTimeout.call(null, marker);
            } catch (e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                return cachedClearTimeout.call(this, marker);
            }
        }
    
    
    
    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;
    
    function cleanUpNextTick() {
        if (!draining || !currentQueue) {
            return;
        }
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = -1;
        }
        if (queue.length) {
            drainQueue();
        }
    }
    
    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;
    
        var len = queue.length;
        while(len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = -1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
    }
    
    process.nextTick = function (fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
        }
    };
    
    // v8 likes predictible objects
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function () {
        this.fun.apply(null, this.array);
    };
    process.title = 'browser';
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = ''; // empty string to avoid regexp issues
    process.versions = {};
    
    function noop() {}
    
    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;
    process.prependListener = noop;
    process.prependOnceListener = noop;
    
    process.listeners = function (name) { return [] }
    
    process.binding = function (name) {
        throw new Error('process.binding is not supported');
    };
    
    process.cwd = function () { return '/' };
    process.chdir = function (dir) {
        throw new Error('process.chdir is not supported');
    };
    process.umask = function() { return 0; };
    
    },{}],49:[function(require,module,exports){
    (function (global){(function (){
    /*! https://mths.be/utf8js v2.1.2 by @mathias */
    ;(function(root) {
    
        // Detect free variables `exports`
        var freeExports = typeof exports == 'object' && exports;
    
        // Detect free variable `module`
        var freeModule = typeof module == 'object' && module &&
            module.exports == freeExports && module;
    
        // Detect free variable `global`, from Node.js or Browserified code,
        // and use it as `root`
        var freeGlobal = typeof global == 'object' && global;
        if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
            root = freeGlobal;
        }
    
        /*--------------------------------------------------------------------------*/
    
        var stringFromCharCode = String.fromCharCode;
    
        // Taken from https://mths.be/punycode
        function ucs2decode(string) {
            var output = [];
            var counter = 0;
            var length = string.length;
            var value;
            var extra;
            while (counter < length) {
                value = string.charCodeAt(counter++);
                if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                    // high surrogate, and there is a next character
                    extra = string.charCodeAt(counter++);
                    if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                    } else {
                        // unmatched surrogate; only append this code unit, in case the next
                        // code unit is the high surrogate of a surrogate pair
                        output.push(value);
                        counter--;
                    }
                } else {
                    output.push(value);
                }
            }
            return output;
        }
    
        // Taken from https://mths.be/punycode
        function ucs2encode(array) {
            var length = array.length;
            var index = -1;
            var value;
            var output = '';
            while (++index < length) {
                value = array[index];
                if (value > 0xFFFF) {
                    value -= 0x10000;
                    output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
                    value = 0xDC00 | value & 0x3FF;
                }
                output += stringFromCharCode(value);
            }
            return output;
        }
    
        function checkScalarValue(codePoint) {
            if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
                throw Error(
                    'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
                    ' is not a scalar value'
                );
            }
        }
        /*--------------------------------------------------------------------------*/
    
        function createByte(codePoint, shift) {
            return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
        }
    
        function encodeCodePoint(codePoint) {
            if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
                return stringFromCharCode(codePoint);
            }
            var symbol = '';
            if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
                symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
            }
            else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
                checkScalarValue(codePoint);
                symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
                symbol += createByte(codePoint, 6);
            }
            else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
                symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
                symbol += createByte(codePoint, 12);
                symbol += createByte(codePoint, 6);
            }
            symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
            return symbol;
        }
    
        function utf8encode(string) {
            var codePoints = ucs2decode(string);
            var length = codePoints.length;
            var index = -1;
            var codePoint;
            var byteString = '';
            while (++index < length) {
                codePoint = codePoints[index];
                byteString += encodeCodePoint(codePoint);
            }
            return byteString;
        }
    
        /*--------------------------------------------------------------------------*/
    
        function readContinuationByte() {
            if (byteIndex >= byteCount) {
                throw Error('Invalid byte index');
            }
    
            var continuationByte = byteArray[byteIndex] & 0xFF;
            byteIndex++;
    
            if ((continuationByte & 0xC0) == 0x80) {
                return continuationByte & 0x3F;
            }
    
            // If we end up here, it’s not a continuation byte
            throw Error('Invalid continuation byte');
        }
    
        function decodeSymbol() {
            var byte1;
            var byte2;
            var byte3;
            var byte4;
            var codePoint;
    
            if (byteIndex > byteCount) {
                throw Error('Invalid byte index');
            }
    
            if (byteIndex == byteCount) {
                return false;
            }
    
            // Read first byte
            byte1 = byteArray[byteIndex] & 0xFF;
            byteIndex++;
    
            // 1-byte sequence (no continuation bytes)
            if ((byte1 & 0x80) == 0) {
                return byte1;
            }
    
            // 2-byte sequence
            if ((byte1 & 0xE0) == 0xC0) {
                byte2 = readContinuationByte();
                codePoint = ((byte1 & 0x1F) << 6) | byte2;
                if (codePoint >= 0x80) {
                    return codePoint;
                } else {
                    throw Error('Invalid continuation byte');
                }
            }
    
            // 3-byte sequence (may include unpaired surrogates)
            if ((byte1 & 0xF0) == 0xE0) {
                byte2 = readContinuationByte();
                byte3 = readContinuationByte();
                codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
                if (codePoint >= 0x0800) {
                    checkScalarValue(codePoint);
                    return codePoint;
                } else {
                    throw Error('Invalid continuation byte');
                }
            }
    
            // 4-byte sequence
            if ((byte1 & 0xF8) == 0xF0) {
                byte2 = readContinuationByte();
                byte3 = readContinuationByte();
                byte4 = readContinuationByte();
                codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
                    (byte3 << 0x06) | byte4;
                if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
                    return codePoint;
                }
            }
    
            throw Error('Invalid UTF-8 detected');
        }
    
        var byteArray;
        var byteCount;
        var byteIndex;
        function utf8decode(byteString) {
            byteArray = ucs2decode(byteString);
            byteCount = byteArray.length;
            byteIndex = 0;
            var codePoints = [];
            var tmp;
            while ((tmp = decodeSymbol()) !== false) {
                codePoints.push(tmp);
            }
            return ucs2encode(codePoints);
        }
    
        /*--------------------------------------------------------------------------*/
    
        var utf8 = {
            'version': '2.1.2',
            'encode': utf8encode,
            'decode': utf8decode
        };
    
        // Some AMD build optimizers, like r.js, check for specific condition patterns
        // like the following:
        if (
            typeof define == 'function' &&
            typeof define.amd == 'object' &&
            define.amd
        ) {
            define(function() {
                return utf8;
            });
        }	else if (freeExports && !freeExports.nodeType) {
            if (freeModule) { // in Node.js or RingoJS v0.8.0+
                freeModule.exports = utf8;
            } else { // in Narwhal or RingoJS v0.7.0-
                var object = {};
                var hasOwnProperty = object.hasOwnProperty;
                for (var key in utf8) {
                    hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
                }
            }
        } else { // in Rhino or a web browser
            root.utf8 = utf8;
        }
    
    }(this));
    
    }).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    
    },{}]},{},[2])(2)
    });
    
    //# sourceMappingURL=GitHub.bundle.js.map
    