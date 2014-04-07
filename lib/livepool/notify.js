var liveapp = require('../webui/liveapp'),
    config = require('./config'),
    url = require('url'),
    mime = require('mime'),
    path = require('path'),
    fs = require('graceful-fs'),
    _ = require('underscore');

var socket, sid;
var queue = [];

var ticker = setInterval(function() {
    if (queue.length) {
        socket = liveapp.socket;
        // 合并提高性能
        if (socket) {
            var rsReq = {
                type: 'req',
                rows: []
            };
            var rsRes = {
                type: 'res',
                rows: []
            };
            _.each(queue, function(item) {
                if (item.type == 'req') {
                    rsReq.rows = rsReq.rows.concat(item.rows);
                } else {
                    var obj = _.find(rsReq.rows, function(row) {
                        item.rows[0].id == row.id;
                    });
                    if (obj) {
                        obj.result = row.result;
                        obj.body = row.body;
                        obj.contentType = row.contentType;
                        obj.caching = row.caching;
                        obj.resHeaders = row.resHeaders;
                    } else {
                        rsRes.rows = rsRes.rows.concat(item.rows);
                    }
                }
            });
            var rs = [rsReq, rsRes];
            // console.log(rs);
            socket.emit('proxy', rs);
            // socket.emit('proxy', queue);
            queue = [];
        }
    }
}, 2500);

exports.request = function(id, req, res) {
    socket = liveapp.socket;
    if (socket) {
        var urlObject = url.parse(req.url);
        sid = socket.id + '_' + id;
        queue.push({
            type: 'req',
            rows: [{
                id: sid,
                idx: id,
                result: '-',
                protocol: urlObject.protocol.replace(':', '').toUpperCase(),
                host: req.headers.host,
                url: req.url,
                path: urlObject.path,
                pathname: urlObject.pathname,
                reqHeaders: req.headers
            }]
        });

        // fs.writeFile(config.global.tempDir + id + '_c.txt', req.headers, 'binary', function (err) {
        //     if (err) throw err;
        // });
    }
};

exports.response = function(id, req, res, body) {
    socket = liveapp.socket;
    if (socket) {
        var urlObject = url.parse(req.url);
        var expires = res.getHeader('expires');
        sid = socket.id + '_' + id;
        queue.push({
            type: 'res',
            rows: [{
                id: sid,
                result: res.statusCode,
                body: res.getHeader('content-length') || body.length || 0,
                caching: (res.getHeader('cache-control') || '') + (expires ? '; expires:' + res.getHeader('expires') : ''),
                contentType: res.getHeader('content-type') || mime.lookup(urlObject.pathname),
                resHeaders: res._headers
            }]
        });

        var headerPath = path.join(config.global.tempDir, socket.id, id + '_s.txt');
        fs.writeFile(headerPath, res._header, 'binary', function(err) {
            if (err) throw err;
        });

        var bodyPath = path.join(config.global.tempDir, socket.id, id + '_b.txt');
        fs.writeFile(bodyPath, body, 'binary', function(err) {
            if (err) throw err;
        });
    }
};
