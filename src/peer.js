// Copyright 2014 Flávio Ribeiro <flavio@bem.tv>.
// All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var BaseObject = require('base_object');
var Storage = require('./storage');


class Peer extends BaseObject {
  initialize(params) {
    this.storage = Storage.getInstance()
    this.ident = params.ident
    this.swarm = params.swarm
    this.dataChannel = params.dataChannel
    this.dataChannel.on("data", (data) => this.messageReceived(data))
  }

 send(command, resource, content='') {
    var message = this.mountMessage(command, resource, content)
    this.dataChannel.send(message)
  }

  messageReceived(data) {
    this.processMessage(data)
  }

  processMessage(data) {
    var [command, resource, content] = data.split("$")
    if (command === 'interested') {
      if (this.storage.contain(resource)) {
        this.send("contain", resource)
      } else {
        this.send("choke", resource)
      }
    } else if (command === "contain") {
      this.swarm.addSatisfyCandidate(this.ident, resource)
    } else if (command === 'request') {
      this.send('satisfy', resource, this.storage.getItem(resource))
      this.swarm.chunksSent += 1
    } else if (command === 'choke') {
      this.swarm.chokeReceived(resource)
    } else if (command === 'satisfy') {
      this.swarm.resourceReceived(this.ident, resource, content)
//    } else if (this.storage.keys.length > 0) {
//      var res = resource.split("/")[6]
//      var first = this.storage.keys[0].split("_")[3]
//      var lastChunk = this.storage.keys[this.storage.keys.length-1].split("_")[3]
//      console.log("discarted: ", command, res, first, lastChunk)
    }
  }

  mountMessage(command, resource, content) {
    var msg = command + "$" + resource + "$"
    if (content) {
      msg = msg + content
    }
    return msg
  }
}

module.exports = Peer
