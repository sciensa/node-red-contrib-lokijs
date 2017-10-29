/* eslint-disable */

'use strict';

/* eslint-disable */

const Loki = require('lokijs');

module.exports = (RED) => {
  function init(config) {
    const lokidb = new Loki(config.filename, {
      autoload: true,
      autoloadCallback : function(){
        let coll = lokidb.getCollection(config.collection);
        if (!coll) {
          coll = lokidb.addCollection(config.collection);
        }
		config.coll = coll;
	  },
      autosave: true, 
      autosaveInterval: RED.settings.lokijsAutosaveInterval || 4000;
    });
    return lokidb;
  }

  function lokijsConfig(n) {
    RED.nodes.createNode(this, n);
    this.filename = n.filename;
    this.collection = n.collection;
    this.lokidb = init(this);
  }
  RED.nodes.registerType('lokijs-config', lokijsConfig);

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
          message.payload = coll.find(input);
        } else if (nd.method === 'insert') {
          if (nd.input === 'true') {
            message = Object.assign({}, coll.insert(input));
          } else {
            message.payload = coll.insert(input);
          }
        } else if (nd.method === 'findandremove') {
          message.payload = coll.find(input);
          coll.chain().find(input).remove();
        }
        // remove meta and $loki elements from payload
        delete message.payload.meta;
        delete message.payload.$loki;
        delete message.meta;
        delete message.$loki;
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
