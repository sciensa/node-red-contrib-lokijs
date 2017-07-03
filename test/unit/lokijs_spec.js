/* eslint-env mocha */
/* eslint strict: [2, "global"], no-unused-expressions: [0]*/

import sinon from 'sinon';
import helper from './helpers';
import node from '../../lokijs';

describe('lokijs node', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload().then(() => {
      helper.stopServer(done);
    });
  });

  const stub = {
    insert: () => 'TESTE',
  };

  const lokijsNode = {
    id: 'lokijs-node',
    type: 'lokijs-op',
    name: 'My lokijs Test',
    method: false,
    input: false,
    wires: [],
    config: {
      lokidb: {
        getCollection: () => stub,
      },
    },
  };

  const lokijsConfigNode = {
    id: 'lokijs-configNode',
    type: 'lokijs-config',
  };

  const flow = [
    lokijsNode,
    lokijsConfigNode,
  ];
  it('loads defaults currectly', (done) => {
    helper.load(node, flow, () => {
      const lokijs = helper.getNode('lokijs-node');
      expect(lokijs.name).to.equal('My lokijs Test');
      expect(lokijs.method).to.be.false;
      expect(lokijs.input).to.be.false;
      done();
    });
  });
  describe('save', () => {
    const message = {
      payload: {
        nome: 'xpto',
        correlationId: 'fa6bab2.39c6b58',
      },
    };
    let lokinodejs = null;

    beforeEach((done) => {
      helper.load(node, flow, () => {
        lokinodejs = helper.getNode('lokijs-node');
        done();
      });
    });

    it('sends the message back to the output', (done) => {
      lokinodejs.method = 'insert';
      lokinodejs.input = true;
      const send = sinon.spy(lokinodejs, 'send');


      lokinodejs.emit('input', message);
      expect(send).to.have.been.calledWith(message);

      done();
    });

    // describe('find', () => {
    //   before((done) => {
    //     lokijsNode.method = true;
    //     lokijsNode.input = true;
    //     done();
    //   });

    //   const message = {
    //     payload: {
    //       nome: 'xpto',
    //       correlationId: 'fa6bab2.39c6b58',
    //     },
    //   };

    //   it('sends the message back to the output', (done) => {
    //     helper.load(node, flow, () => {
    //       const lokinodejs = helper.getNode('lokijs-node');
    //       lokinodejs.method = 'find';
    //       lokinodejs.input = true;
    //       const send = sinon.spy(lokinodejs, 'send');
    //       lokinodejs.emit('input', message);

    //       expect(send).to.have.been.calledWith(message);

    //       done();
    //     });
    //   });
    // });
  });
});
