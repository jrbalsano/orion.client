/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global __dirname console module require*/
var connect = require('connect');
var statik = connect['static'];
var http = require('http');
var socketio = require('socket.io');
var path = require('path');
var url = require('url');
var AppContext = require('./lib/node_apps').AppContext;
var appSocket = require('./lib/node_app_socket');
var orionFile = require('./lib/file');
var orionNode = require('./lib/node');
var orionWorkspace = require('./lib/workspace');
var orionNodeStatic = require('./lib/orionode_static');
var orionStatic = require('./lib/orion_static');
var term = require('term.js');
var pty = require('pty.js');

var LIBS = path.normalize(path.join(__dirname, 'lib/'));
var NODE_MODULES = path.normalize(path.join(__dirname, 'node_modules/'));
var ORION_CLIENT = path.normalize(path.join(__dirname, '../../'));

function handleError(err) {
	throw err;
}

function noop(req, res, next) { next(); }

function auth(options) {
	var pwd = options.password || (options.configParams && options.configParams.pwd) || null;
	if (typeof pwd === 'string' && pwd.length > 0) {
		return connect.basicAuth(function(user, password) {
			return password === pwd;
		});
	}
	return noop;
}

function logger(options) {
	return options.log ? connect.logger('tiny') : noop;
}

function startServer(options) {
	options = options || {};
	var workspaceDir = options.workspaceDir, configParams = options.configParams;
	try {
		var appContext = new AppContext({fileRoot: '/file', workspaceDir: workspaceDir, configParams: configParams});

    

		// HTTP server
		var app = connect()
      .use(term.middleware())
			.use(logger(options))
			.use(connect.urlencoded())
			.use(auth(options))
			.use(connect.compress())
			// static code
			.use(orionNodeStatic(path.normalize(path.join(LIBS, 'orionode.client/')), {
				socketIORoot: path.resolve(NODE_MODULES, 'socket.io-client/')
			}))
			.use(orionStatic({
				orionClientRoot: ORION_CLIENT,
				dev: options.dev
			}))
			// API handlers
			.use(orionFile({
				root: '/file',
				workspaceDir: workspaceDir
			}))
			.use(orionWorkspace({
				root: '/workspace',
				fileRoot: '/file',
				workspaceDir: workspaceDir
			}))
			.use(orionNode({
				appContext: appContext,
				root: '/node'
			}))
			.listen(options.port);
		// Socket server
		//var io = socketio.listen(app, { 'log level': 1 });

    // Terminal Socket
    var termio = socketio.listen(app, { 'log level': 1 });

    termio.sockets.on('connection', function(sock) {

      var buff = [];
      // Open Terminal Connection
      var terminal = pty.fork(process.env.SHELL || 'sh', [], {
        name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
        ? 'xterm-256color'
        : 'xterm',
               cols: 80,
               rows: 24,
               cwd: process.env.HOME
      });

      terminal.on('data', function(data) {
        return !sock
        ? buff.push(data)
        : sock.emit('data', data);
      });

      console.log(''
        + 'Created shell h pty master/slave'
        + ' pair (master: %d, pid: %d)',
        terminal.fd, terminal.pid);

      // Set up communication paths
      sock.on('data', function(data) {
        terminal.write(data);
      });

      sock.on('disconnect', function() {
        terminal.kill()
        termsocket = null;
      });

      while (buff.length) {
        sock.emit('data', buff.shift());
      }
    });


	  //appSocket.install({io: io, appContext: appContext});
		appSocket.install({io: termio, appContext: appContext});
		app.on('error', handleError);
		return app;
	} catch (e) {
		handleError(e);
	}
}

module.exports = startServer;
