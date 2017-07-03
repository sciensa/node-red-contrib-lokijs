import chai from 'chai';
import nock from 'nock';
import path from 'path';
import sinonChai from 'sinon-chai';

global.expect = chai.expect;
chai.use(sinonChai);
process.env.NODE_RED_HOME = process.env.NODE_RED_HOME || path.resolve(`${__dirname}/../../node_modules/node-red`);

// eslint-disable-next-line
const helper = require(path.join(process.env.NODE_RED_HOME, 'test', 'nodes', 'helper.js'));

try {
  helper.nock = helper.nock || nock;
} catch (er) {
  helper.nock = null;
}
module.exports = helper;
