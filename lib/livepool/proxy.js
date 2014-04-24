var util = require('./util');
var config = require('./config');
var exec = require('child_process').exec;
var path = require('path');

exports.setProxy = function setProxy(port, done) {
    if (process.platform == 'win32') {
        var dir = path.join(process.cwd(), 'lib/tools');
        var cmd = 'proxysetting_win.bat on ' + config.global.http;
        var refresh = 'refreshproxy.exe';
        util.chdir(dir, function() {
            exec(cmd, function(err) {
                if (err) {
                    throw err;
                }
                exec(refresh, function(err) {
                    if (typeof done == 'function') done();
                });
            });
        });
    } else if (process.platform == 'mac' || process.platform == 'darwin') {
        var dir = path.join(process.cwd(), 'lib/tools');
        var cmd = 'sh proxysetting_mac.sh on ' + config.global.http;
        util.chdir(dir, function() {
            exec(cmd, function(err) {
                if (err) {
                    throw err;
                }
                if (typeof done == 'function') done();
            });
        });
    } else if (process.platform == 'linux') {
        var proxy = 'export HTTP_PROXY=http://127.0.0.1:' + port;
        exec(proxy, function(error) {
            if (error) throw error;
            if (typeof done == 'function') done();
        });
    }
}

exports.initProxy = function initProxy(done) {
    if (process.platform == 'win32') {
        var dir = path.join(process.cwd(), 'lib/tools');
        var cmd = 'proxysetting_win.bat off';
        var refresh = 'refreshproxy.exe';
        exec(cmd, function(err) {
            if (err) {
                throw err;
            }
            exec(refresh, function(err) {
                if (typeof done == 'function') done();
            });
        });
    } else if (process.platform == 'mac' || process.platform == 'darwin') {
        var dir = path.join(process.cwd(), 'lib/tools');
        var cmd = 'sh proxysetting_mac.sh off';
        util.chdir(dir, function() {
            exec(cmd, function(err) {
                if (err) {
                    throw err;
                }
                if (typeof done == 'function') done();
            });
        });
    } else if (process.platform == 'linux') {
        var proxy = 'export HTTP_PROXY=""';
        exec(proxy, function(error) {
            if (error) throw error;
            if (typeof done == 'function') done();
        });
    }
}
