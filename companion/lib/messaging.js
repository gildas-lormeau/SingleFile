// https://github.com/andy-portmen/native-client/blob/master/messaging.js

//  MPL-2.0 License (https://github.com/andy-portmen/native-client/blob/master/COPYING)

// chrome-native-messaging module
//
// Defines three Transform streams:
//
// - Input - transform native messages to JavaScript objects
// - Output - transform JavaScript objects to native messages
// - Transform - transform message objects to reply objects
// - Debug - transform JavaScript objects to lines of JSON (for debugging, obviously)

const stream = require('stream');
const util = require('util');

function Input() {
  stream.Transform.call(this);

  // Transform bytes...
  this._writableState.objectMode = false;
  // ...into objects.
  this._readableState.objectMode = true;

  // Unparsed data.
  this.buf = Buffer.alloc(0);
  // Parsed length.
  this.len = null;
}

util.inherits(Input, stream.Transform);

Input.prototype._transform = function(chunk, encoding, done) {
  // Save this chunk.
  this.buf = Buffer.concat([this.buf, chunk]);

  const self = this;

  function parseBuf() {
    // Do we have a length yet?
    if (typeof self.len !== 'number') {
      // Nope. Do we have enough bytes for the length?
      if (self.buf.length >= 4) {
        // Yep. Parse the bytes.
        self.len = self.buf.readUInt32LE(0);
        // Remove the length bytes from the buffer.
        self.buf = self.buf.slice(4);
      }
    }

    // Do we have a length yet? (We may have just parsed it.)
    if (typeof self.len === 'number') {
      // Yep. Do we have enough bytes for the message?
      if (self.buf.length >= self.len) {
        // Yep. Slice off the bytes we need.
        const message = self.buf.slice(0, self.len);
        // Remove the bytes for the message from the buffer.
        self.buf = self.buf.slice(self.len);
        // Clear the length so we know we need to parse it again.
        self.len = null;
        // Parse the message bytes.
        const obj = JSON.parse(message.toString());
        // Enqueue it for reading.
        self.push(obj);
        // We could have more messages in the buffer so check again.
        parseBuf();
      }
    }
  }

  // Check for a parsable buffer (both length and message).
  parseBuf();

  // We're done.
  done();
};

function Output() {
  stream.Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = false;
}

util.inherits(Output, stream.Transform);

Output.prototype._transform = function(chunk, encoding, done) {
  const len = Buffer.alloc(4);
  const buf = Buffer.from(JSON.stringify(chunk), 'utf8');

  len.writeUInt32LE(buf.length, 0);

  this.push(len);
  this.push(buf);

  done();
};

function Transform(handler) {
  stream.Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = true;

  this.handler = handler;
}

util.inherits(Transform, stream.Transform);

Transform.prototype._transform = function(msg, encoding, done) {
  this.handler(msg, this.push.bind(this), done);
};

function Debug() {
  stream.Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = false;
}

util.inherits(Debug, stream.Transform);

Debug.prototype._transform = function(chunk, encoding, done) {
  this.push(JSON.stringify(chunk) + '\n');

  done();
};

exports.Input = Input;
exports.Output = Output;
exports.Transform = Transform;
exports.Debug = Debug;