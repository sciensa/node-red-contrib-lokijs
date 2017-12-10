/* eslint-disable */

'use strict';

/* eslint-disable */

const Loki = require('lokijs');

module.exports = (RED) => {

  function loadCollection(lokidb, config) {
    let coll = lokidb.getCollection(config.collection);
    if (!coll) {
      coll = lokidb.addCollection(config.collection);
    }
    config.coll = coll;
  }

  function init(config) {
    const redsettings = RED.settings.lokijs || {};
    let lokidb;
    if (redsettings.persistData) {
      lokidb = new Loki(config.filename, {
        autoload: true,
        autoloadCallback : function(){
          loadCollection(lokidb, config);
          if (redsettings.callback){ redsettings.callback(config.coll) };
        },
        autosave: true,
        autosaveInterval: redsettings.autosaveInterval || 4000
      });
    }
    else {
      lokidb = new Loki(config.filename);
      loadCollection(lokidb, config);
    }
    return lokidb;
  }

  function lokijsConfig(n) {
    RED.nodes.createNode(this, n);
    this.filename = n.filename;
    this.collection = n.collection;
    this.lokidb = init(this);
  }
  RED.nodes.registerType('lokijs-config', lokijsConfig);

  function outputBeautifier(resultset) {
    resultset = resultset || {};
    // remove meta and $loki elements from payload
    if (resultset.length) {
      let rtn = [];
      resultset.forEach(function(v, i){
        let element = Object.assign({}, v);
        delete element.meta;
        delete element.$loki;
        rtn.push(element);
      });
      return rtn;
    }
    else {
      let rtn = Object.assign({}, resultset);
      delete rtn.meta;
      delete rtn.$loki;
      return rtn;
    }
  }

  function lokijsOp(n) {
    RED.nodes.createNode(this, n);
    this.config = RED.nodes.getNode(n.config);
    this.method = n.method;
    this.name = n.name;
    this.input = n.input;
    const node = this;

    const connect = (nd) => {

      nd.on('input', (msg) => {
        //const coll = nd.config.lokidb.getCollection(nd.config.collection);
        const coll = node.config.coll;
        let input = {};

        if (nd.input === 'true') {
          input = msg;
        } else if (this.input !== 'false' && typeof this.input !== 'undefined') {
          try {
            input = RED.util.getMessageProperty(msg, this.input);
          } catch (err) {
            input = {};
          }
        }

        let message = Object.assign({}, msg);
        if (nd.method === 'find') {
          message.payload = outputBeautifier(coll.find(input));
        } else if (nd.method === 'insert') {
          if (nd.input === 'true') {
            message = outputBeautifier(coll.insert(input));
          } else {
            message.payload = outputBeautifier(coll.insert(input));
          }
        } else if (nd.method === 'findandremove') {
          message.payload = outputBeautifier(coll.find(input));
          coll.chain().find(input).remove();
        }
        nd.send(message);
      });
    };
    if (node.config) {
      connect(node);
    } else {
      node.error(RED._('lokijs.errors.missingconfig'));
    }
  }
  RED.nodes.registerType('lokijs-op', lokijsOp);
};
