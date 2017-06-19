module.exports = function (RED) {
    "use strict";
    var loki = require("lokijs");

    function init(config) {
        config.lokidb = new loki(config.filename);
        var coll = config.lokidb.getCollection(config.collection);
        if (!coll) {
            coll = config.lokidb.addCollection(config.collection);
        }
    }

    function lokijsConfig(n) {
        RED.nodes.createNode(this, n);
        this.filename = n.filename;
        this.collection = n.collection;
        init(this);
    }
    RED.nodes.registerType("lokijs-config", lokijsConfig);

    function lokijsOp(n) {
        RED.nodes.createNode(this, n);
        this.config = RED.nodes.getNode(n.config);
        this.method = n.method;
        this.name = n.name;
        this.input = n.input;
        var node = this;

        var connect = function (node) {
            var coll = node.config.lokidb.getCollection(node.config.collection);

            node.on('input', function (msg) {
                var input = {};

                if (node.input === "true") {
                    input = msg
                } else if (this.input !== "false" && typeof this.input !== "undefined") {
                    try {
                        input = RED.util.getMessageProperty(msg, this.input);
                    } catch (err) {
                        input = {};
                    }
                }

                if (node.method === "find") {
                    msg.payload = coll.find(input);
                    delete msg.payload.meta;
                    delete msg.payload.$loki;
                    node.send(msg);
                } else if (node.method === "insert") {
                    if (node.input === "true") {
                        msg = coll.insert(input);
                        delete msg.meta;
                        delete msg.$loki;
                    } else {
                        msg.payload = coll.insert(input);
                        delete msg.payload.meta;
                        delete msg.payload.$loki;
                    }
                    node.send(msg);
                }
            });
        };
        if (node.config) {
            connect(node)
        } else {
            node.error(RED._("lokijs.errors.missingconfig"));
        }
    }
    RED.nodes.registerType("lokijs-op", lokijsOp);
};
