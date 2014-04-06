var path = require('path');
var localFileResponder = require('./local');

function templateResponder(tpl, req, res) {
    var _handler = {
        filepath: path.join(__dirname, 'livepool/lib/template', tpl)
    };
    localFileResponder(_handler, req, res, {});
};

module.exports = templateResponder;
