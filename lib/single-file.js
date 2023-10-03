(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singlefile = {}));
})(this, (function (exports) { 'use strict';

	const { Array: Array$1, Object: Object$1, String: String$1, Number: Number$1, BigInt, Math: Math$1, Date: Date$1, Map: Map$2, Set: Set$3, Response, URL: URL$2, Error: Error$1, Uint8Array: Uint8Array$1, Uint16Array, Uint32Array: Uint32Array$1, DataView: DataView$1, Blob: Blob$3, Promise: Promise$1, TextEncoder: TextEncoder$2, TextDecoder: TextDecoder$2, document: document$4, crypto: crypto$1, btoa, TransformStream, ReadableStream, WritableStream, CompressionStream, DecompressionStream, navigator, Worker } = globalThis;

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const MAX_32_BITS = 0xffffffff;
	const MAX_16_BITS = 0xffff;
	const COMPRESSION_METHOD_DEFLATE = 0x08;
	const COMPRESSION_METHOD_STORE = 0x00;
	const COMPRESSION_METHOD_AES = 0x63;

	const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
	const SPLIT_ZIP_FILE_SIGNATURE = 0x08074b50;
	const DATA_DESCRIPTOR_RECORD_SIGNATURE = SPLIT_ZIP_FILE_SIGNATURE;
	const CENTRAL_FILE_HEADER_SIGNATURE = 0x02014b50;
	const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;
	const ZIP64_END_OF_CENTRAL_DIR_SIGNATURE = 0x06064b50;
	const ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE = 0x07064b50;
	const END_OF_CENTRAL_DIR_LENGTH = 22;
	const ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH = 20;
	const ZIP64_END_OF_CENTRAL_DIR_LENGTH = 56;
	const ZIP64_END_OF_CENTRAL_DIR_TOTAL_LENGTH = END_OF_CENTRAL_DIR_LENGTH + ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH + ZIP64_END_OF_CENTRAL_DIR_LENGTH;

	const EXTRAFIELD_TYPE_ZIP64 = 0x0001;
	const EXTRAFIELD_TYPE_AES = 0x9901;
	const EXTRAFIELD_TYPE_NTFS = 0x000a;
	const EXTRAFIELD_TYPE_NTFS_TAG1 = 0x0001;
	const EXTRAFIELD_TYPE_EXTENDED_TIMESTAMP = 0x5455;
	const EXTRAFIELD_TYPE_UNICODE_PATH = 0x7075;
	const EXTRAFIELD_TYPE_UNICODE_COMMENT = 0x6375;
	const EXTRAFIELD_TYPE_USDZ = 0x1986;

	const BITFLAG_ENCRYPTED = 0x01;
	const BITFLAG_LEVEL = 0x06;
	const BITFLAG_DATA_DESCRIPTOR = 0x0008;
	const BITFLAG_LANG_ENCODING_FLAG = 0x0800;
	const FILE_ATTR_MSDOS_DIR_MASK = 0x10;

	const VERSION_DEFLATE = 0x14;
	const VERSION_ZIP64 = 0x2D;
	const VERSION_AES = 0x33;

	const DIRECTORY_SIGNATURE = "/";

	const MAX_DATE = new Date$1(2107, 11, 31);
	const MIN_DATE = new Date$1(1980, 0, 1);

	const UNDEFINED_VALUE = undefined;
	const UNDEFINED_TYPE$1 = "undefined";
	const FUNCTION_TYPE$1 = "function";

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	class StreamAdapter {

		constructor(Codec) {
			return class extends TransformStream {
				constructor(_format, options) {
					const codec = new Codec(options);
					super({
						transform(chunk, controller) {
							controller.enqueue(codec.append(chunk));
						},
						flush(controller) {
							const chunk = codec.flush();
							if (chunk) {
								controller.enqueue(chunk);
							}
						}
					});
				}
			};
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const MINIMUM_CHUNK_SIZE = 64;
	let maxWorkers = 2;
	try {
		if (typeof navigator != UNDEFINED_TYPE$1 && navigator.hardwareConcurrency) {
			maxWorkers = navigator.hardwareConcurrency;
		}
	} catch (_error) {
		// ignored
	}
	const DEFAULT_CONFIGURATION = {
		chunkSize: 512 * 1024,
		maxWorkers,
		terminateWorkerTimeout: 5000,
		useWebWorkers: true,
		useCompressionStream: true,
		workerScripts: UNDEFINED_VALUE,
		CompressionStreamNative: typeof CompressionStream != UNDEFINED_TYPE$1 && CompressionStream,
		DecompressionStreamNative: typeof DecompressionStream != UNDEFINED_TYPE$1 && DecompressionStream
	};

	const config = Object$1.assign({}, DEFAULT_CONFIGURATION);

	function getConfiguration() {
		return config;
	}

	function getChunkSize(config) {
		return Math$1.max(config.chunkSize, MINIMUM_CHUNK_SIZE);
	}

	function configure(configuration) {
		const {
			baseURL,
			chunkSize,
			maxWorkers,
			terminateWorkerTimeout,
			useCompressionStream,
			useWebWorkers,
			Deflate,
			Inflate,
			CompressionStream,
			DecompressionStream,
			workerScripts
		} = configuration;
		setIfDefined("baseURL", baseURL);
		setIfDefined("chunkSize", chunkSize);
		setIfDefined("maxWorkers", maxWorkers);
		setIfDefined("terminateWorkerTimeout", terminateWorkerTimeout);
		setIfDefined("useCompressionStream", useCompressionStream);
		setIfDefined("useWebWorkers", useWebWorkers);
		if (Deflate) {
			config.CompressionStream = new StreamAdapter(Deflate);
		}
		if (Inflate) {
			config.DecompressionStream = new StreamAdapter(Inflate);
		}
		setIfDefined("CompressionStream", CompressionStream);
		setIfDefined("DecompressionStream", DecompressionStream);
		if (workerScripts !== UNDEFINED_VALUE) {
			const { deflate, inflate } = workerScripts;
			if (deflate || inflate) {
				if (!config.workerScripts) {
					config.workerScripts = {};
				}
			}
			if (deflate) {
				if (!Array$1.isArray(deflate)) {
					throw new Error$1("workerScripts.deflate must be an array");
				}
				config.workerScripts.deflate = deflate;
			}
			if (inflate) {
				if (!Array$1.isArray(inflate)) {
					throw new Error$1("workerScripts.inflate must be an array");
				}
				config.workerScripts.inflate = inflate;
			}
		}
	}

	function setIfDefined(propertyName, propertyValue) {
		if (propertyValue !== UNDEFINED_VALUE) {
			config[propertyName] = propertyValue;
		}
	}

	function e(e){const t=()=>URL$2.createObjectURL(new Blob$3(['const{Array:e,Object:t,Number:n,Math:r,Error:s,Uint8Array:a,Uint16Array:i,Uint32Array:o,Int32Array:l,Map:c,DataView:h,Promise:f,TextEncoder:u,crypto:p,postMessage:d,TransformStream:g,ReadableStream:w,WritableStream:v,CompressionStream:y,DecompressionStream:b}=self;class m{constructor(e){return class extends g{constructor(t,n){const r=new e(n);super({transform(e,t){t.enqueue(r.append(e))},flush(e){const t=r.flush();t&&e.enqueue(t)}})}}}}const _=[];for(let e=0;256>e;e++){let t=e;for(let e=0;8>e;e++)1&t?t=t>>>1^3988292384:t>>>=1;_[e]=t}class k{constructor(e){this.crc=e||-1}append(e){let t=0|this.crc;for(let n=0,r=0|e.length;r>n;n++)t=t>>>8^_[255&(t^e[n])];this.crc=t}get(){return~this.crc}}class S extends g{constructor(){let e;const t=new k;super({transform(e,n){t.append(e),n.enqueue(e)},flush(){const n=new a(4);new h(n.buffer).setUint32(0,t.get()),e.value=n}}),e=this}}const z={concat(e,t){if(0===e.length||0===t.length)return e.concat(t);const n=e[e.length-1],r=z.getPartial(n);return 32===r?e.concat(t):z._shiftRight(t,r,0|n,e.slice(0,e.length-1))},bitLength(e){const t=e.length;if(0===t)return 0;const n=e[t-1];return 32*(t-1)+z.getPartial(n)},clamp(e,t){if(32*e.length<t)return e;const n=(e=e.slice(0,r.ceil(t/32))).length;return t&=31,n>0&&t&&(e[n-1]=z.partial(t,e[n-1]&2147483648>>t-1,1)),e},partial:(e,t,n)=>32===e?t:(n?0|t:t<<32-e)+1099511627776*e,getPartial:e=>r.round(e/1099511627776)||32,_shiftRight(e,t,n,r){for(void 0===r&&(r=[]);t>=32;t-=32)r.push(n),n=0;if(0===t)return r.concat(e);for(let s=0;s<e.length;s++)r.push(n|e[s]>>>t),n=e[s]<<32-t;const s=e.length?e[e.length-1]:0,a=z.getPartial(s);return r.push(z.partial(t+a&31,t+a>32?n:r.pop(),1)),r}},D={bytes:{fromBits(e){const t=z.bitLength(e)/8,n=new a(t);let r;for(let s=0;t>s;s++)0==(3&s)&&(r=e[s/4]),n[s]=r>>>24,r<<=8;return n},toBits(e){const t=[];let n,r=0;for(n=0;n<e.length;n++)r=r<<8|e[n],3==(3&n)&&(t.push(r),r=0);return 3&n&&t.push(z.partial(8*(3&n),r)),t}}},C=class{constructor(e){const t=this;t.blockSize=512,t._init=[1732584193,4023233417,2562383102,271733878,3285377520],t._key=[1518500249,1859775393,2400959708,3395469782],e?(t._h=e._h.slice(0),t._buffer=e._buffer.slice(0),t._length=e._length):t.reset()}reset(){const e=this;return e._h=e._init.slice(0),e._buffer=[],e._length=0,e}update(e){const t=this;"string"==typeof e&&(e=D.utf8String.toBits(e));const n=t._buffer=z.concat(t._buffer,e),r=t._length,a=t._length=r+z.bitLength(e);if(a>9007199254740991)throw new s("Cannot hash more than 2^53 - 1 bits");const i=new o(n);let l=0;for(let e=t.blockSize+r-(t.blockSize+r&t.blockSize-1);a>=e;e+=t.blockSize)t._block(i.subarray(16*l,16*(l+1))),l+=1;return n.splice(0,16*l),t}finalize(){const e=this;let t=e._buffer;const n=e._h;t=z.concat(t,[z.partial(1,1)]);for(let e=t.length+2;15&e;e++)t.push(0);for(t.push(r.floor(e._length/4294967296)),t.push(0|e._length);t.length;)e._block(t.splice(0,16));return e.reset(),n}_f(e,t,n,r){return e>19?e>39?e>59?e>79?void 0:t^n^r:t&n|t&r|n&r:t^n^r:t&n|~t&r}_S(e,t){return t<<e|t>>>32-e}_block(t){const n=this,s=n._h,a=e(80);for(let e=0;16>e;e++)a[e]=t[e];let i=s[0],o=s[1],l=s[2],c=s[3],h=s[4];for(let e=0;79>=e;e++){16>e||(a[e]=n._S(1,a[e-3]^a[e-8]^a[e-14]^a[e-16]));const t=n._S(5,i)+n._f(e,o,l,c)+h+a[e]+n._key[r.floor(e/20)]|0;h=c,c=l,l=n._S(30,o),o=i,i=t}s[0]=s[0]+i|0,s[1]=s[1]+o|0,s[2]=s[2]+l|0,s[3]=s[3]+c|0,s[4]=s[4]+h|0}},I={getRandomValues(e){const t=new o(e.buffer),n=e=>{let t=987654321;const n=4294967295;return()=>(t=36969*(65535&t)+(t>>16)&n,(((t<<16)+(e=18e3*(65535&e)+(e>>16)&n)&n)/4294967296+.5)*(r.random()>.5?1:-1))};for(let s,a=0;a<e.length;a+=4){const e=n(4294967296*(s||r.random()));s=987654071*e(),t[a/4]=4294967296*e()|0}return e}},x={importKey:e=>new x.hmacSha1(D.bytes.toBits(e)),pbkdf2(e,t,n,r){if(n=n||1e4,0>r||0>n)throw new s("invalid params to pbkdf2");const a=1+(r>>5)<<2;let i,o,l,c,f;const u=new ArrayBuffer(a),p=new h(u);let d=0;const g=z;for(t=D.bytes.toBits(t),f=1;(a||1)>d;f++){for(i=o=e.encrypt(g.concat(t,[f])),l=1;n>l;l++)for(o=e.encrypt(o),c=0;c<o.length;c++)i[c]^=o[c];for(l=0;(a||1)>d&&l<i.length;l++)p.setInt32(d,i[l]),d+=4}return u.slice(0,r/8)},hmacSha1:class{constructor(e){const t=this,n=t._hash=C,r=[[],[]];t._baseHash=[new n,new n];const s=t._baseHash[0].blockSize/32;e.length>s&&(e=(new n).update(e).finalize());for(let t=0;s>t;t++)r[0][t]=909522486^e[t],r[1][t]=1549556828^e[t];t._baseHash[0].update(r[0]),t._baseHash[1].update(r[1]),t._resultHash=new n(t._baseHash[0])}reset(){const e=this;e._resultHash=new e._hash(e._baseHash[0]),e._updated=!1}update(e){this._updated=!0,this._resultHash.update(e)}digest(){const e=this,t=e._resultHash.finalize(),n=new e._hash(e._baseHash[1]).update(t).finalize();return e.reset(),n}encrypt(e){if(this._updated)throw new s("encrypt on already updated hmac called!");return this.update(e),this.digest(e)}}},A=void 0!==p&&"function"==typeof p.getRandomValues,T="Invalid password",R="Invalid signature",H="zipjs-abort-check-password";function q(e){return A?p.getRandomValues(e):I.getRandomValues(e)}const B=16,K={name:"PBKDF2"},V=t.assign({hash:{name:"HMAC"}},K),P=t.assign({iterations:1e3,hash:{name:"SHA-1"}},K),E=["deriveBits"],U=[8,12,16],W=[16,24,32],M=10,N=[0,0,0,0],O="undefined",F="function",L=typeof p!=O,j=L&&p.subtle,G=L&&typeof j!=O,X=D.bytes,J=class{constructor(e){const t=this;t._tables=[[[],[],[],[],[]],[[],[],[],[],[]]],t._tables[0][0][0]||t._precompute();const n=t._tables[0][4],r=t._tables[1],a=e.length;let i,o,l,c=1;if(4!==a&&6!==a&&8!==a)throw new s("invalid aes key size");for(t._key=[o=e.slice(0),l=[]],i=a;4*a+28>i;i++){let e=o[i-1];(i%a==0||8===a&&i%a==4)&&(e=n[e>>>24]<<24^n[e>>16&255]<<16^n[e>>8&255]<<8^n[255&e],i%a==0&&(e=e<<8^e>>>24^c<<24,c=c<<1^283*(c>>7))),o[i]=o[i-a]^e}for(let e=0;i;e++,i--){const t=o[3&e?i:i-4];l[e]=4>=i||4>e?t:r[0][n[t>>>24]]^r[1][n[t>>16&255]]^r[2][n[t>>8&255]]^r[3][n[255&t]]}}encrypt(e){return this._crypt(e,0)}decrypt(e){return this._crypt(e,1)}_precompute(){const e=this._tables[0],t=this._tables[1],n=e[4],r=t[4],s=[],a=[];let i,o,l,c;for(let e=0;256>e;e++)a[(s[e]=e<<1^283*(e>>7))^e]=e;for(let h=i=0;!n[h];h^=o||1,i=a[i]||1){let a=i^i<<1^i<<2^i<<3^i<<4;a=a>>8^255&a^99,n[h]=a,r[a]=h,c=s[l=s[o=s[h]]];let f=16843009*c^65537*l^257*o^16843008*h,u=257*s[a]^16843008*a;for(let n=0;4>n;n++)e[n][h]=u=u<<24^u>>>8,t[n][a]=f=f<<24^f>>>8}for(let n=0;5>n;n++)e[n]=e[n].slice(0),t[n]=t[n].slice(0)}_crypt(e,t){if(4!==e.length)throw new s("invalid aes block size");const n=this._key[t],r=n.length/4-2,a=[0,0,0,0],i=this._tables[t],o=i[0],l=i[1],c=i[2],h=i[3],f=i[4];let u,p,d,g=e[0]^n[0],w=e[t?3:1]^n[1],v=e[2]^n[2],y=e[t?1:3]^n[3],b=4;for(let e=0;r>e;e++)u=o[g>>>24]^l[w>>16&255]^c[v>>8&255]^h[255&y]^n[b],p=o[w>>>24]^l[v>>16&255]^c[y>>8&255]^h[255&g]^n[b+1],d=o[v>>>24]^l[y>>16&255]^c[g>>8&255]^h[255&w]^n[b+2],y=o[y>>>24]^l[g>>16&255]^c[w>>8&255]^h[255&v]^n[b+3],b+=4,g=u,w=p,v=d;for(let e=0;4>e;e++)a[t?3&-e:e]=f[g>>>24]<<24^f[w>>16&255]<<16^f[v>>8&255]<<8^f[255&y]^n[b++],u=g,g=w,w=v,v=y,y=u;return a}},Q=class{constructor(e,t){this._prf=e,this._initIv=t,this._iv=t}reset(){this._iv=this._initIv}update(e){return this.calculate(this._prf,e,this._iv)}incWord(e){if(255==(e>>24&255)){let t=e>>16&255,n=e>>8&255,r=255&e;255===t?(t=0,255===n?(n=0,255===r?r=0:++r):++n):++t,e=0,e+=t<<16,e+=n<<8,e+=r}else e+=1<<24;return e}incCounter(e){0===(e[0]=this.incWord(e[0]))&&(e[1]=this.incWord(e[1]))}calculate(e,t,n){let r;if(!(r=t.length))return[];const s=z.bitLength(t);for(let s=0;r>s;s+=4){this.incCounter(n);const r=e.encrypt(n);t[s]^=r[0],t[s+1]^=r[1],t[s+2]^=r[2],t[s+3]^=r[3]}return z.clamp(t,s)}},Y=x.hmacSha1;let Z=L&&G&&typeof j.importKey==F,$=L&&G&&typeof j.deriveBits==F;class ee extends g{constructor({password:e,signed:n,encryptionStrength:r,checkPasswordOnly:i}){super({start(){t.assign(this,{ready:new f((e=>this.resolveReady=e)),password:e,signed:n,strength:r-1,pending:new a})},async transform(e,t){const n=this,{password:r,strength:o,resolveReady:l,ready:c}=n;r?(await(async(e,t,n,r)=>{const a=await re(e,t,n,ae(r,0,U[t])),i=ae(r,U[t]);if(a[0]!=i[0]||a[1]!=i[1])throw new s(T)})(n,o,r,ae(e,0,U[o]+2)),e=ae(e,U[o]+2),i?t.error(new s(H)):l()):await c;const h=new a(e.length-M-(e.length-M)%B);t.enqueue(ne(n,e,h,0,M,!0))},async flush(e){const{signed:t,ctr:n,hmac:r,pending:i,ready:o}=this;await o;const l=ae(i,0,i.length-M),c=ae(i,i.length-M);let h=new a;if(l.length){const e=oe(X,l);r.update(e);const t=n.update(e);h=ie(X,t)}if(t){const e=ae(ie(X,r.digest()),0,M);for(let t=0;M>t;t++)if(e[t]!=c[t])throw new s(R)}e.enqueue(h)}})}}class te extends g{constructor({password:e,encryptionStrength:n}){let r;super({start(){t.assign(this,{ready:new f((e=>this.resolveReady=e)),password:e,strength:n-1,pending:new a})},async transform(e,t){const n=this,{password:r,strength:s,resolveReady:i,ready:o}=n;let l=new a;r?(l=await(async(e,t,n)=>{const r=q(new a(U[t]));return se(r,await re(e,t,n,r))})(n,s,r),i()):await o;const c=new a(l.length+e.length-e.length%B);c.set(l,0),t.enqueue(ne(n,e,c,l.length,0))},async flush(e){const{ctr:t,hmac:n,pending:s,ready:i}=this;await i;let o=new a;if(s.length){const e=t.update(oe(X,s));n.update(e),o=ie(X,e)}r.signature=ie(X,n.digest()).slice(0,M),e.enqueue(se(o,r.signature))}}),r=this}}function ne(e,t,n,r,s,i){const{ctr:o,hmac:l,pending:c}=e,h=t.length-s;let f;for(c.length&&(t=se(c,t),n=((e,t)=>{if(t&&t>e.length){const n=e;(e=new a(t)).set(n,0)}return e})(n,h-h%B)),f=0;h-B>=f;f+=B){const e=oe(X,ae(t,f,f+B));i&&l.update(e);const s=o.update(e);i||l.update(s),n.set(ie(X,s),f+r)}return e.pending=ae(t,f),n}async function re(n,r,s,i){n.password=null;const o=(e=>{if(void 0===u){const t=new a((e=unescape(encodeURIComponent(e))).length);for(let n=0;n<t.length;n++)t[n]=e.charCodeAt(n);return t}return(new u).encode(e)})(s),l=await(async(e,t,n,r,s)=>{if(!Z)return x.importKey(t);try{return await j.importKey("raw",t,n,!1,s)}catch(e){return Z=!1,x.importKey(t)}})(0,o,V,0,E),c=await(async(e,t,n)=>{if(!$)return x.pbkdf2(t,e.salt,P.iterations,n);try{return await j.deriveBits(e,t,n)}catch(r){return $=!1,x.pbkdf2(t,e.salt,P.iterations,n)}})(t.assign({salt:i},P),l,8*(2*W[r]+2)),h=new a(c),f=oe(X,ae(h,0,W[r])),p=oe(X,ae(h,W[r],2*W[r])),d=ae(h,2*W[r]);return t.assign(n,{keys:{key:f,authentication:p,passwordVerification:d},ctr:new Q(new J(f),e.from(N)),hmac:new Y(p)}),d}function se(e,t){let n=e;return e.length+t.length&&(n=new a(e.length+t.length),n.set(e,0),n.set(t,e.length)),n}function ae(e,t,n){return e.subarray(t,n)}function ie(e,t){return e.fromBits(t)}function oe(e,t){return e.toBits(t)}class le extends g{constructor({password:e,passwordVerification:n,checkPasswordOnly:r}){super({start(){t.assign(this,{password:e,passwordVerification:n}),ue(this,e)},transform(e,t){const n=this;if(n.password){const t=he(n,e.subarray(0,12));if(n.password=null,t[11]!=n.passwordVerification)throw new s(T);e=e.subarray(12)}r?t.error(new s(H)):t.enqueue(he(n,e))}})}}class ce extends g{constructor({password:e,passwordVerification:n}){super({start(){t.assign(this,{password:e,passwordVerification:n}),ue(this,e)},transform(e,t){const n=this;let r,s;if(n.password){n.password=null;const t=q(new a(12));t[11]=n.passwordVerification,r=new a(e.length+t.length),r.set(fe(n,t),0),s=12}else r=new a(e.length),s=0;r.set(fe(n,e),s),t.enqueue(r)}})}}function he(e,t){const n=new a(t.length);for(let r=0;r<t.length;r++)n[r]=de(e)^t[r],pe(e,n[r]);return n}function fe(e,t){const n=new a(t.length);for(let r=0;r<t.length;r++)n[r]=de(e)^t[r],pe(e,t[r]);return n}function ue(e,n){const r=[305419896,591751049,878082192];t.assign(e,{keys:r,crcKey0:new k(r[0]),crcKey2:new k(r[2])});for(let t=0;t<n.length;t++)pe(e,n.charCodeAt(t))}function pe(e,t){let[n,s,a]=e.keys;e.crcKey0.append([t]),n=~e.crcKey0.get(),s=we(r.imul(we(s+ge(n)),134775813)+1),e.crcKey2.append([s>>>24]),a=~e.crcKey2.get(),e.keys=[n,s,a]}function de(e){const t=2|e.keys[2];return ge(r.imul(t,1^t)>>>8)}function ge(e){return 255&e}function we(e){return 4294967295&e}const ve="deflate-raw";class ye extends g{constructor(e,{chunkSize:t,CompressionStream:n,CompressionStreamNative:r}){super({});const{compressed:s,encrypted:a,useCompressionStream:i,zipCrypto:o,signed:l,level:c}=e,f=this;let u,p,d=me(super.readable);a&&!o||!l||(u=new S,d=Se(d,u)),s&&(d=ke(d,i,{level:c,chunkSize:t},r,n)),a&&(o?d=Se(d,new ce(e)):(p=new te(e),d=Se(d,p))),_e(f,d,(()=>{let e;a&&!o&&(e=p.signature),a&&!o||!l||(e=new h(u.value.buffer).getUint32(0)),f.signature=e}))}}class be extends g{constructor(e,{chunkSize:t,DecompressionStream:n,DecompressionStreamNative:r}){super({});const{zipCrypto:a,encrypted:i,signed:o,signature:l,compressed:c,useCompressionStream:f}=e;let u,p,d=me(super.readable);i&&(a?d=Se(d,new le(e)):(p=new ee(e),d=Se(d,p))),c&&(d=ke(d,f,{chunkSize:t},r,n)),i&&!a||!o||(u=new S,d=Se(d,u)),_e(this,d,(()=>{if((!i||a)&&o){const e=new h(u.value.buffer);if(l!=e.getUint32(0,!1))throw new s(R)}}))}}function me(e){return Se(e,new g({transform(e,t){e&&e.length&&t.enqueue(e)}}))}function _e(e,n,r){n=Se(n,new g({flush:r})),t.defineProperty(e,"readable",{get:()=>n})}function ke(e,t,n,r,s){try{e=Se(e,new(t&&r?r:s)(ve,n))}catch(r){if(!t)throw r;e=Se(e,new s(ve,n))}return e}function Se(e,t){return e.pipeThrough(t)}const ze="data";class De extends g{constructor(e,n){super({});const r=this,{codecType:s}=e;let a;s.startsWith("deflate")?a=ye:s.startsWith("inflate")&&(a=be);let i=0;const o=new a(e,n),l=super.readable,c=new g({transform(e,t){e&&e.length&&(i+=e.length,t.enqueue(e))},flush(){const{signature:e}=o;t.assign(r,{signature:e,size:i})}});t.defineProperty(r,"readable",{get:()=>l.pipeThrough(o).pipeThrough(c)})}}const Ce=new c,Ie=new c;let xe=0;async function Ae(e){try{const{options:t,scripts:r,config:s}=e;r&&r.length&&importScripts.apply(void 0,r),self.initCodec&&self.initCodec(),s.CompressionStreamNative=self.CompressionStream,s.DecompressionStreamNative=self.DecompressionStream,self.Deflate&&(s.CompressionStream=new m(self.Deflate)),self.Inflate&&(s.DecompressionStream=new m(self.Inflate));const a={highWaterMark:1,size:()=>s.chunkSize},i=e.readable||new w({async pull(e){const t=new f((e=>Ce.set(xe,e)));Te({type:"pull",messageId:xe}),xe=(xe+1)%n.MAX_SAFE_INTEGER;const{value:r,done:s}=await t;e.enqueue(r),s&&e.close()}},a),o=e.writable||new v({async write(e){let t;const r=new f((e=>t=e));Ie.set(xe,t),Te({type:ze,value:e,messageId:xe}),xe=(xe+1)%n.MAX_SAFE_INTEGER,await r}},a),l=new De(t,s);await i.pipeThrough(l).pipeTo(o,{preventClose:!0,preventAbort:!0});try{await o.getWriter().close()}catch(e){}const{signature:c,size:h}=l;Te({type:"close",result:{signature:c,size:h}})}catch(e){Re(e)}}function Te(e){let{value:t}=e;if(t)if(t.length)try{t=new a(t),e.value=t.buffer,d(e,[e.value])}catch(t){d(e)}else d(e);else d(e)}function Re(e=new s("Unknown error")){const{message:t,stack:n,code:r,name:a}=e;d({error:{message:t,stack:n,code:r,name:a}})}addEventListener("message",(({data:e})=>{const{type:t,messageId:n,value:r,done:s}=e;try{if("start"==t&&Ae(e),t==ze){const e=Ce.get(n);Ce.delete(n),e({value:new a(r),done:s})}if("ack"==t){const e=Ie.get(n);Ie.delete(n),e()}}catch(e){Re(e)}}));var He=a,qe=i,Be=l,Ke=new He([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Ve=new He([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Pe=new He([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Ee=(e,t)=>{for(var n=new qe(31),r=0;31>r;++r)n[r]=t+=1<<e[r-1];var s=new Be(n[30]);for(r=1;30>r;++r)for(var a=n[r];a<n[r+1];++a)s[a]=a-n[r]<<5|r;return{b:n,r:s}},Ue=Ee(Ke,2),We=Ue.b,Me=Ue.r;We[28]=258,Me[258]=28;for(var Ne=Ee(Ve,0),Oe=Ne.b,Fe=Ne.r,Le=new qe(32768),je=0;32768>je;++je){var Ge=(43690&je)>>1|(21845&je)<<1;Ge=(61680&(Ge=(52428&Ge)>>2|(13107&Ge)<<2))>>4|(3855&Ge)<<4,Le[je]=((65280&Ge)>>8|(255&Ge)<<8)>>1}var Xe=(e,t,n)=>{for(var r=e.length,s=0,a=new qe(t);r>s;++s)e[s]&&++a[e[s]-1];var i,o=new qe(t);for(s=1;t>s;++s)o[s]=o[s-1]+a[s-1]<<1;if(n){i=new qe(1<<t);var l=15-t;for(s=0;r>s;++s)if(e[s])for(var c=s<<4|e[s],h=t-e[s],f=o[e[s]-1]++<<h,u=f|(1<<h)-1;u>=f;++f)i[Le[f]>>l]=c}else for(i=new qe(r),s=0;r>s;++s)e[s]&&(i[s]=Le[o[e[s]-1]++]>>15-e[s]);return i},Je=new He(288);for(je=0;144>je;++je)Je[je]=8;for(je=144;256>je;++je)Je[je]=9;for(je=256;280>je;++je)Je[je]=7;for(je=280;288>je;++je)Je[je]=8;var Qe=new He(32);for(je=0;32>je;++je)Qe[je]=5;var Ye=Xe(Je,9,0),Ze=Xe(Je,9,1),$e=Xe(Qe,5,0),et=Xe(Qe,5,1),tt=e=>{for(var t=e[0],n=1;n<e.length;++n)e[n]>t&&(t=e[n]);return t},nt=(e,t,n)=>{var r=t/8|0;return(e[r]|e[r+1]<<8)>>(7&t)&n},rt=(e,t)=>{var n=t/8|0;return(e[n]|e[n+1]<<8|e[n+2]<<16)>>(7&t)},st=e=>(e+7)/8|0,at=(e,t,n)=>{(null==t||0>t)&&(t=0),(null==n||n>e.length)&&(n=e.length);var r=new He(n-t);return r.set(e.subarray(t,n)),r},it=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],ot=(e,t,n)=>{var r=new s(t||it[e]);if(r.code=e,s.captureStackTrace&&s.captureStackTrace(r,ot),!n)throw r;return r},lt=(e,t,n)=>{n<<=7&t;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8},ct=(e,t,n)=>{n<<=7&t;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8,e[r+2]|=n>>16},ht=(e,t)=>{for(var n=[],r=0;r<e.length;++r)e[r]&&n.push({s:r,f:e[r]});var s=n.length,a=n.slice();if(!s)return{t:vt,l:0};if(1==s){var i=new He(n[0].s+1);return i[n[0].s]=1,{t:i,l:1}}n.sort(((e,t)=>e.f-t.f)),n.push({s:-1,f:25001});var o=n[0],l=n[1],c=0,h=1,f=2;for(n[0]={s:-1,f:o.f+l.f,l:o,r:l};h!=s-1;)o=n[n[c].f<n[f].f?c++:f++],l=n[c!=h&&n[c].f<n[f].f?c++:f++],n[h++]={s:-1,f:o.f+l.f,l:o,r:l};var u=a[0].s;for(r=1;s>r;++r)a[r].s>u&&(u=a[r].s);var p=new qe(u+1),d=ft(n[h-1],p,0);if(d>t){r=0;var g=0,w=d-t,v=1<<w;for(a.sort(((e,t)=>p[t.s]-p[e.s]||e.f-t.f));s>r;++r){var y=a[r].s;if(p[y]<=t)break;g+=v-(1<<d-p[y]),p[y]=t}for(g>>=w;g>0;){var b=a[r].s;p[b]<t?g-=1<<t-p[b]++-1:++r}for(;r>=0&&g;--r){var m=a[r].s;p[m]==t&&(--p[m],++g)}d=t}return{t:new He(p),l:d}},ft=(e,t,n)=>-1==e.s?r.max(ft(e.l,t,n+1),ft(e.r,t,n+1)):t[e.s]=n,ut=e=>{for(var t=e.length;t&&!e[--t];);for(var n=new qe(++t),r=0,s=e[0],a=1,i=e=>{n[r++]=e},o=1;t>=o;++o)if(e[o]==s&&o!=t)++a;else{if(!s&&a>2){for(;a>138;a-=138)i(32754);a>2&&(i(a>10?a-11<<5|28690:a-3<<5|12305),a=0)}else if(a>3){for(i(s),--a;a>6;a-=6)i(8304);a>2&&(i(a-3<<5|8208),a=0)}for(;a--;)i(s);a=1,s=e[o]}return{c:n.subarray(0,r),n:t}},pt=(e,t)=>{for(var n=0,r=0;r<t.length;++r)n+=e[r]*t[r];return n},dt=(e,t,n)=>{var r=n.length,s=st(t+2);e[s]=255&r,e[s+1]=r>>8,e[s+2]=255^e[s],e[s+3]=255^e[s+1];for(var a=0;r>a;++a)e[s+a+4]=n[a];return 8*(s+4+r)},gt=(e,t,n,r,s,a,i,o,l,c,h)=>{lt(t,h++,n),++s[256];for(var f=ht(s,15),u=f.t,p=f.l,d=ht(a,15),g=d.t,w=d.l,v=ut(u),y=v.c,b=v.n,m=ut(g),_=m.c,k=m.n,S=new qe(19),z=0;z<y.length;++z)++S[31&y[z]];for(z=0;z<_.length;++z)++S[31&_[z]];for(var D=ht(S,7),C=D.t,I=D.l,x=19;x>4&&!C[Pe[x-1]];--x);var A,T,R,H,q=c+5<<3,B=pt(s,Je)+pt(a,Qe)+i,K=pt(s,u)+pt(a,g)+i+14+3*x+pt(S,C)+2*S[16]+3*S[17]+7*S[18];if(l>=0&&B>=q&&K>=q)return dt(t,h,e.subarray(l,l+c));if(lt(t,h,1+(B>K)),h+=2,B>K){A=Xe(u,p,0),T=u,R=Xe(g,w,0),H=g;var V=Xe(C,I,0);for(lt(t,h,b-257),lt(t,h+5,k-1),lt(t,h+10,x-4),h+=14,z=0;x>z;++z)lt(t,h+3*z,C[Pe[z]]);h+=3*x;for(var P=[y,_],E=0;2>E;++E){var U=P[E];for(z=0;z<U.length;++z){var W=31&U[z];lt(t,h,V[W]),h+=C[W],W>15&&(lt(t,h,U[z]>>5&127),h+=U[z]>>12)}}}else A=Ye,T=Je,R=$e,H=Qe;for(z=0;o>z;++z){var M=r[z];if(M>255){ct(t,h,A[257+(W=M>>18&31)]),h+=T[W+257],W>7&&(lt(t,h,M>>23&31),h+=Ke[W]);var N=31&M;ct(t,h,R[N]),h+=H[N],N>3&&(ct(t,h,M>>5&8191),h+=Ve[N])}else ct(t,h,A[M]),h+=T[M]}return ct(t,h,A[256]),h+T[256]},wt=new Be([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),vt=new He(0),yt=function(){function e(e,t){if("function"==typeof e&&(t=e,e={}),this.ondata=t,this.o=e||{},this.s={l:0,i:32768,w:32768,z:32768},this.b=new He(98304),this.o.dictionary){var n=this.o.dictionary.subarray(-32768);this.b.set(n,32768-n.length),this.s.i=32768-n.length}}return e.prototype.p=function(e,t){this.ondata(((e,t,n,s,a)=>{if(!a&&(a={l:1},t.dictionary)){var i=t.dictionary.subarray(-32768),o=new He(i.length+e.length);o.set(i),o.set(e,i.length),e=o,a.w=i.length}return((e,t,n,s,a,i)=>{var o=i.z||e.length,l=new He(0+o+5*(1+r.ceil(o/7e3))+0),c=l.subarray(0,l.length-0),h=i.l,f=7&(i.r||0);if(t){f&&(c[0]=i.r>>3);for(var u=wt[t-1],p=u>>13,d=8191&u,g=(1<<n)-1,w=i.p||new qe(32768),v=i.h||new qe(g+1),y=r.ceil(n/3),b=2*y,m=t=>(e[t]^e[t+1]<<y^e[t+2]<<b)&g,_=new Be(25e3),k=new qe(288),S=new qe(32),z=0,D=0,C=i.i||0,I=0,x=i.w||0,A=0;o>C+2;++C){var T=m(C),R=32767&C,H=v[T];if(w[R]=H,v[T]=R,C>=x){var q=o-C;if((z>7e3||I>24576)&&(q>423||!h)){f=gt(e,c,0,_,k,S,D,I,A,C-A,f),I=z=D=0,A=C;for(var B=0;286>B;++B)k[B]=0;for(B=0;30>B;++B)S[B]=0}var K=2,V=0,P=d,E=R-H&32767;if(q>2&&T==m(C-E))for(var U=r.min(p,q)-1,W=r.min(32767,C),M=r.min(258,q);W>=E&&--P&&R!=H;){if(e[C+K]==e[C+K-E]){for(var N=0;M>N&&e[C+N]==e[C+N-E];++N);if(N>K){if(K=N,V=E,N>U)break;var O=r.min(E,N-2),F=0;for(B=0;O>B;++B){var L=C-E+B&32767,j=L-w[L]&32767;j>F&&(F=j,H=L)}}}E+=(R=H)-(H=w[R])&32767}if(V){_[I++]=268435456|Me[K]<<18|Fe[V];var G=31&Me[K],X=31&Fe[V];D+=Ke[G]+Ve[X],++k[257+G],++S[X],x=C+K,++z}else _[I++]=e[C],++k[e[C]]}}for(C=r.max(C,x);o>C;++C)_[I++]=e[C],++k[e[C]];f=gt(e,c,h,_,k,S,D,I,A,C-A,f),h||(i.r=7&f|c[f/8|0]<<3,f-=7,i.h=v,i.p=w,i.i=C,i.w=x)}else{for(C=i.w||0;o+h>C;C+=65535){var J=C+65535;o>J||(c[f/8|0]=h,J=o),f=dt(c,f+1,e.subarray(C,J))}i.i=o}return at(l,0,0+st(f)+0)})(e,null==t.level?6:t.level,null==t.mem?r.ceil(1.5*r.max(8,r.min(13,r.log(e.length)))):12+t.mem,0,0,a)})(e,this.o,0,0,this.s),t)},e.prototype.push=function(e,t){this.ondata||ot(5),this.s.l&&ot(4);var n=e.length+this.s.z;if(n>this.b.length){if(n>2*this.b.length-32768){var r=new He(-32768&n);r.set(this.b.subarray(0,this.s.z)),this.b=r}var s=this.b.length-this.s.z;s&&(this.b.set(e.subarray(0,s),this.s.z),this.s.z=this.b.length,this.p(this.b,!1)),this.b.set(this.b.subarray(-32768)),this.b.set(e.subarray(s),32768),this.s.z=e.length-s+32768,this.s.i=32766,this.s.w=32768}else this.b.set(e,this.s.z),this.s.z+=e.length;this.s.l=1&t,(this.s.z>this.s.w+8191||t)&&(this.p(this.b,t||!1),this.s.w=this.s.i,this.s.i-=2)},e}(),bt=function(){function e(e,t){"function"==typeof e&&(t=e,e={}),this.ondata=t;var n=e&&e.dictionary&&e.dictionary.subarray(-32768);this.s={i:0,b:n?n.length:0},this.o=new He(32768),this.p=new He(0),n&&this.o.set(n)}return e.prototype.e=function(e){if(this.ondata||ot(5),this.d&&ot(4),this.p.length){if(e.length){var t=new He(this.p.length+e.length);t.set(this.p),t.set(e,this.p.length),this.p=t}}else this.p=e},e.prototype.c=function(e){this.s.i=+(this.d=e||!1);var t=this.s.b,n=((e,t,n)=>{var s=e.length;if(!s||t.f&&!t.l)return n||new He(0);var a=!n||2!=t.i,i=t.i;n||(n=new He(3*s));var o=e=>{var t=n.length;if(e>t){var s=new He(r.max(2*t,e));s.set(n),n=s}},l=t.f||0,c=t.p||0,h=t.b||0,f=t.l,u=t.d,p=t.m,d=t.n,g=8*s;do{if(!f){l=nt(e,c,1);var w=nt(e,c+1,3);if(c+=3,!w){var v=e[(x=st(c)+4)-4]|e[x-3]<<8,y=x+v;if(y>s){i&&ot(0);break}a&&o(h+v),n.set(e.subarray(x,y),h),t.b=h+=v,t.p=c=8*y,t.f=l;continue}if(1==w)f=Ze,u=et,p=9,d=5;else if(2==w){var b=nt(e,c,31)+257,m=nt(e,c+10,15)+4,_=b+nt(e,c+5,31)+1;c+=14;for(var k=new He(_),S=new He(19),z=0;m>z;++z)S[Pe[z]]=nt(e,c+3*z,7);c+=3*m;var D=tt(S),C=(1<<D)-1,I=Xe(S,D,1);for(z=0;_>z;){var x,A=I[nt(e,c,C)];if(c+=15&A,16>(x=A>>4))k[z++]=x;else{var T=0,R=0;for(16==x?(R=3+nt(e,c,3),c+=2,T=k[z-1]):17==x?(R=3+nt(e,c,7),c+=3):18==x&&(R=11+nt(e,c,127),c+=7);R--;)k[z++]=T}}var H=k.subarray(0,b),q=k.subarray(b);p=tt(H),d=tt(q),f=Xe(H,p,1),u=Xe(q,d,1)}else ot(1);if(c>g){i&&ot(0);break}}a&&o(h+131072);for(var B=(1<<p)-1,K=(1<<d)-1,V=c;;V=c){var P=(T=f[rt(e,c)&B])>>4;if((c+=15&T)>g){i&&ot(0);break}if(T||ot(2),256>P)n[h++]=P;else{if(256==P){V=c,f=null;break}var E=P-254;if(P>264){var U=Ke[z=P-257];E=nt(e,c,(1<<U)-1)+We[z],c+=U}var W=u[rt(e,c)&K],M=W>>4;if(W||ot(3),c+=15&W,q=Oe[M],M>3&&(U=Ve[M],q+=rt(e,c)&(1<<U)-1,c+=U),c>g){i&&ot(0);break}a&&o(h+131072);var N=h+E;if(q>h){var O=0-q,F=r.min(q,N);for(0>O+h&&ot(3);F>h;++h)n[h]=undefined[O+h]}for(;N>h;h+=4)n[h]=n[h-q],n[h+1]=n[h+1-q],n[h+2]=n[h+2-q],n[h+3]=n[h+3-q];h=N}}t.l=f,t.p=V,t.b=h,t.f=l,f&&(l=1,t.m=p,t.d=u,t.n=d)}while(!l);return h==n.length?n:at(n,0,h)})(this.p,this.s,this.o);this.ondata(at(n,t,this.s.b),this.d),this.o=at(n,this.s.b-32768),this.s.b=this.o.length,this.p=at(this.p,this.s.p/8|0),this.s.p&=7},e.prototype.push=function(e,t){this.e(e),this.c(t)},e}(),mt="undefined"!=typeof TextDecoder&&new TextDecoder;try{mt.decode(vt,{stream:!0})}catch(e){}function _t(e,n,r){return class{constructor(s){const i=this;var o,l;o=s,l="level",("function"==typeof t.hasOwn?t.hasOwn(o,l):o.hasOwnProperty(l))&&void 0===s.level&&delete s.level,i.codec=new e(t.assign({},n,s)),r(i.codec,(e=>{if(i.pendingData){const t=i.pendingData;i.pendingData=new a(t.length+e.length);const{pendingData:n}=i;n.set(t,0),n.set(e,t.length)}else i.pendingData=new a(e)}))}append(e){return this.codec.push(e),s(this)}flush(){return this.codec.push(new a,!0),s(this)}};function s(e){if(e.pendingData){const t=e.pendingData;return e.pendingData=null,t}return new a}}const{Deflate:kt,Inflate:St}=((e,t={},n)=>({Deflate:_t(e.Deflate,t.deflate,n),Inflate:_t(e.Inflate,t.inflate,n)}))({Deflate:yt,Inflate:bt},void 0,((e,t)=>e.ondata=t));self.initCodec=()=>{self.Deflate=kt,self.Inflate=St};\n'],{type:"text/javascript"}));e({workerScripts:{inflate:[t],deflate:[t]}});}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	function getMimeType() {
		return "application/octet-stream";
	}

	function initShimAsyncCodec(library, options = {}, registerDataHandler) {
		return {
			Deflate: createCodecClass(library.Deflate, options.deflate, registerDataHandler),
			Inflate: createCodecClass(library.Inflate, options.inflate, registerDataHandler)
		};
	}

	function objectHasOwn(object, propertyName) {
		// eslint-disable-next-line no-prototype-builtins
		return typeof Object$1.hasOwn === "function" ? Object$1.hasOwn(object, propertyName) : object.hasOwnProperty(propertyName);
	}

	function createCodecClass(constructor, constructorOptions, registerDataHandler) {
		return class {

			constructor(options) {
				const codecAdapter = this;
				const onData = data => {
					if (codecAdapter.pendingData) {
						const previousPendingData = codecAdapter.pendingData;
						codecAdapter.pendingData = new Uint8Array$1(previousPendingData.length + data.length);
						const { pendingData } = codecAdapter;
						pendingData.set(previousPendingData, 0);
						pendingData.set(data, previousPendingData.length);
					} else {
						codecAdapter.pendingData = new Uint8Array$1(data);
					}
				};
				if (objectHasOwn(options, "level") && options.level === undefined) {
					delete options.level;
				}
				codecAdapter.codec = new constructor(Object$1.assign({}, constructorOptions, options));
				registerDataHandler(codecAdapter.codec, onData);
			}
			append(data) {
				this.codec.push(data);
				return getResponse(this);
			}
			flush() {
				this.codec.push(new Uint8Array$1(), true);
				return getResponse(this);
			}
		};

		function getResponse(codec) {
			if (codec.pendingData) {
				const output = codec.pendingData;
				codec.pendingData = null;
				return output;
			} else {
				return new Uint8Array$1();
			}
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const table = [];
	for (let i = 0; i < 256; i++) {
		let t = i;
		for (let j = 0; j < 8; j++) {
			if (t & 1) {
				t = (t >>> 1) ^ 0xEDB88320;
			} else {
				t = t >>> 1;
			}
		}
		table[i] = t;
	}

	class Crc32 {

		constructor(crc) {
			this.crc = crc || -1;
		}

		append(data) {
			let crc = this.crc | 0;
			for (let offset = 0, length = data.length | 0; offset < length; offset++) {
				crc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xFF];
			}
			this.crc = crc;
		}

		get() {
			return ~this.crc;
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	class Crc32Stream extends TransformStream {

		constructor() {
			let stream;
			const crc32 = new Crc32();
			super({
				transform(chunk, controller) {
					crc32.append(chunk);
					controller.enqueue(chunk);
				},
				flush() {
					const value = new Uint8Array$1(4);
					const dataView = new DataView$1(value.buffer);
					dataView.setUint32(0, crc32.get());
					stream.value = value;
				}
			});
			stream = this;
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	function encodeText(value) {
		if (typeof TextEncoder$2 == "undefined") {
			value = unescape(encodeURIComponent(value));
			const result = new Uint8Array$1(value.length);
			for (let i = 0; i < result.length; i++) {
				result[i] = value.charCodeAt(i);
			}
			return result;
		} else {
			return new TextEncoder$2().encode(value);
		}
	}

	// Derived from https://github.com/xqdoo00o/jszip/blob/master/lib/sjcl.js and https://github.com/bitwiseshiftleft/sjcl

	// deno-lint-ignore-file no-this-alias

	/*
	 * SJCL is open. You can use, modify and redistribute it under a BSD
	 * license or under the GNU GPL, version 2.0.
	 */

	/** @fileOverview Javascript cryptography implementation.
	 *
	 * Crush to remove comments, shorten variable names and
	 * generally reduce transmission size.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/*jslint indent: 2, bitwise: false, nomen: false, plusplus: false, white: false, regexp: false */

	/** @fileOverview Arrays of bits, encoded as arrays of Numbers.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/**
	 * Arrays of bits, encoded as arrays of Numbers.
	 * @namespace
	 * @description
	 * <p>
	 * These objects are the currency accepted by SJCL's crypto functions.
	 * </p>
	 *
	 * <p>
	 * Most of our crypto primitives operate on arrays of 4-byte words internally,
	 * but many of them can take arguments that are not a multiple of 4 bytes.
	 * This library encodes arrays of bits (whose size need not be a multiple of 8
	 * bits) as arrays of 32-bit words.  The bits are packed, big-endian, into an
	 * array of words, 32 bits at a time.  Since the words are double-precision
	 * floating point numbers, they fit some extra data.  We use this (in a private,
	 * possibly-changing manner) to encode the number of bits actually  present
	 * in the last word of the array.
	 * </p>
	 *
	 * <p>
	 * Because bitwise ops clear this out-of-band data, these arrays can be passed
	 * to ciphers like AES which want arrays of words.
	 * </p>
	 */
	const bitArray = {
		/**
		 * Concatenate two bit arrays.
		 * @param {bitArray} a1 The first array.
		 * @param {bitArray} a2 The second array.
		 * @return {bitArray} The concatenation of a1 and a2.
		 */
		concat(a1, a2) {
			if (a1.length === 0 || a2.length === 0) {
				return a1.concat(a2);
			}

			const last = a1[a1.length - 1], shift = bitArray.getPartial(last);
			if (shift === 32) {
				return a1.concat(a2);
			} else {
				return bitArray._shiftRight(a2, shift, last | 0, a1.slice(0, a1.length - 1));
			}
		},

		/**
		 * Find the length of an array of bits.
		 * @param {bitArray} a The array.
		 * @return {Number} The length of a, in bits.
		 */
		bitLength(a) {
			const l = a.length;
			if (l === 0) {
				return 0;
			}
			const x = a[l - 1];
			return (l - 1) * 32 + bitArray.getPartial(x);
		},

		/**
		 * Truncate an array.
		 * @param {bitArray} a The array.
		 * @param {Number} len The length to truncate to, in bits.
		 * @return {bitArray} A new array, truncated to len bits.
		 */
		clamp(a, len) {
			if (a.length * 32 < len) {
				return a;
			}
			a = a.slice(0, Math$1.ceil(len / 32));
			const l = a.length;
			len = len & 31;
			if (l > 0 && len) {
				a[l - 1] = bitArray.partial(len, a[l - 1] & 0x80000000 >> (len - 1), 1);
			}
			return a;
		},

		/**
		 * Make a partial word for a bit array.
		 * @param {Number} len The number of bits in the word.
		 * @param {Number} x The bits.
		 * @param {Number} [_end=0] Pass 1 if x has already been shifted to the high side.
		 * @return {Number} The partial word.
		 */
		partial(len, x, _end) {
			if (len === 32) {
				return x;
			}
			return (_end ? x | 0 : x << (32 - len)) + len * 0x10000000000;
		},

		/**
		 * Get the number of bits used by a partial word.
		 * @param {Number} x The partial word.
		 * @return {Number} The number of bits used by the partial word.
		 */
		getPartial(x) {
			return Math$1.round(x / 0x10000000000) || 32;
		},

		/** Shift an array right.
		 * @param {bitArray} a The array to shift.
		 * @param {Number} shift The number of bits to shift.
		 * @param {Number} [carry=0] A byte to carry in
		 * @param {bitArray} [out=[]] An array to prepend to the output.
		 * @private
		 */
		_shiftRight(a, shift, carry, out) {
			if (out === undefined) {
				out = [];
			}

			for (; shift >= 32; shift -= 32) {
				out.push(carry);
				carry = 0;
			}
			if (shift === 0) {
				return out.concat(a);
			}

			for (let i = 0; i < a.length; i++) {
				out.push(carry | a[i] >>> shift);
				carry = a[i] << (32 - shift);
			}
			const last2 = a.length ? a[a.length - 1] : 0;
			const shift2 = bitArray.getPartial(last2);
			out.push(bitArray.partial(shift + shift2 & 31, (shift + shift2 > 32) ? carry : out.pop(), 1));
			return out;
		}
	};

	/** @fileOverview Bit array codec implementations.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/**
	 * Arrays of bytes
	 * @namespace
	 */
	const codec = {
		bytes: {
			/** Convert from a bitArray to an array of bytes. */
			fromBits(arr) {
				const bl = bitArray.bitLength(arr);
				const byteLength = bl / 8;
				const out = new Uint8Array$1(byteLength);
				let tmp;
				for (let i = 0; i < byteLength; i++) {
					if ((i & 3) === 0) {
						tmp = arr[i / 4];
					}
					out[i] = tmp >>> 24;
					tmp <<= 8;
				}
				return out;
			},
			/** Convert from an array of bytes to a bitArray. */
			toBits(bytes) {
				const out = [];
				let i;
				let tmp = 0;
				for (i = 0; i < bytes.length; i++) {
					tmp = tmp << 8 | bytes[i];
					if ((i & 3) === 3) {
						out.push(tmp);
						tmp = 0;
					}
				}
				if (i & 3) {
					out.push(bitArray.partial(8 * (i & 3), tmp));
				}
				return out;
			}
		}
	};

	const hash = {};

	/**
	 * Context for a SHA-1 operation in progress.
	 * @constructor
	 */
	hash.sha1 = class {
		constructor(hash) {
			const sha1 = this;
			/**
			 * The hash's block size, in bits.
			 * @constant
			 */
			sha1.blockSize = 512;
			/**
			 * The SHA-1 initialization vector.
			 * @private
			 */
			sha1._init = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
			/**
			 * The SHA-1 hash key.
			 * @private
			 */
			sha1._key = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6];
			if (hash) {
				sha1._h = hash._h.slice(0);
				sha1._buffer = hash._buffer.slice(0);
				sha1._length = hash._length;
			} else {
				sha1.reset();
			}
		}

		/**
		 * Reset the hash state.
		 * @return this
		 */
		reset() {
			const sha1 = this;
			sha1._h = sha1._init.slice(0);
			sha1._buffer = [];
			sha1._length = 0;
			return sha1;
		}

		/**
		 * Input several words to the hash.
		 * @param {bitArray|String} data the data to hash.
		 * @return this
		 */
		update(data) {
			const sha1 = this;
			if (typeof data === "string") {
				data = codec.utf8String.toBits(data);
			}
			const b = sha1._buffer = bitArray.concat(sha1._buffer, data);
			const ol = sha1._length;
			const nl = sha1._length = ol + bitArray.bitLength(data);
			if (nl > 9007199254740991) {
				throw new Error$1("Cannot hash more than 2^53 - 1 bits");
			}
			const c = new Uint32Array$1(b);
			let j = 0;
			for (let i = sha1.blockSize + ol - ((sha1.blockSize + ol) & (sha1.blockSize - 1)); i <= nl;
				i += sha1.blockSize) {
				sha1._block(c.subarray(16 * j, 16 * (j + 1)));
				j += 1;
			}
			b.splice(0, 16 * j);
			return sha1;
		}

		/**
		 * Complete hashing and output the hash value.
		 * @return {bitArray} The hash value, an array of 5 big-endian words. TODO
		 */
		finalize() {
			const sha1 = this;
			let b = sha1._buffer;
			const h = sha1._h;

			// Round out and push the buffer
			b = bitArray.concat(b, [bitArray.partial(1, 1)]);
			// Round out the buffer to a multiple of 16 words, less the 2 length words.
			for (let i = b.length + 2; i & 15; i++) {
				b.push(0);
			}

			// append the length
			b.push(Math$1.floor(sha1._length / 0x100000000));
			b.push(sha1._length | 0);

			while (b.length) {
				sha1._block(b.splice(0, 16));
			}

			sha1.reset();
			return h;
		}

		/**
		 * The SHA-1 logical functions f(0), f(1), ..., f(79).
		 * @private
		 */
		_f(t, b, c, d) {
			if (t <= 19) {
				return (b & c) | (~b & d);
			} else if (t <= 39) {
				return b ^ c ^ d;
			} else if (t <= 59) {
				return (b & c) | (b & d) | (c & d);
			} else if (t <= 79) {
				return b ^ c ^ d;
			}
		}

		/**
		 * Circular left-shift operator.
		 * @private
		 */
		_S(n, x) {
			return (x << n) | (x >>> 32 - n);
		}

		/**
		 * Perform one cycle of SHA-1.
		 * @param {Uint32Array|bitArray} words one block of words.
		 * @private
		 */
		_block(words) {
			const sha1 = this;
			const h = sha1._h;
			// When words is passed to _block, it has 16 elements. SHA1 _block
			// function extends words with new elements (at the end there are 80 elements). 
			// The problem is that if we use Uint32Array instead of Array, 
			// the length of Uint32Array cannot be changed. Thus, we replace words with a 
			// normal Array here.
			const w = Array$1(80); // do not use Uint32Array here as the instantiation is slower
			for (let j = 0; j < 16; j++) {
				w[j] = words[j];
			}

			let a = h[0];
			let b = h[1];
			let c = h[2];
			let d = h[3];
			let e = h[4];

			for (let t = 0; t <= 79; t++) {
				if (t >= 16) {
					w[t] = sha1._S(1, w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]);
				}
				const tmp = (sha1._S(5, a) + sha1._f(t, b, c, d) + e + w[t] +
					sha1._key[Math$1.floor(t / 20)]) | 0;
				e = d;
				d = c;
				c = sha1._S(30, b);
				b = a;
				a = tmp;
			}

			h[0] = (h[0] + a) | 0;
			h[1] = (h[1] + b) | 0;
			h[2] = (h[2] + c) | 0;
			h[3] = (h[3] + d) | 0;
			h[4] = (h[4] + e) | 0;
		}
	};

	/** @fileOverview Low-level AES implementation.
	 *
	 * This file contains a low-level implementation of AES, optimized for
	 * size and for efficiency on several browsers.  It is based on
	 * OpenSSL's aes_core.c, a public-domain implementation by Vincent
	 * Rijmen, Antoon Bosselaers and Paulo Barreto.
	 *
	 * An older version of this implementation is available in the public
	 * domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
	 * Stanford University 2008-2010 and BSD-licensed for liability
	 * reasons.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	const cipher = {};

	/**
	 * Schedule out an AES key for both encryption and decryption.  This
	 * is a low-level class.  Use a cipher mode to do bulk encryption.
	 *
	 * @constructor
	 * @param {Array} key The key as an array of 4, 6 or 8 words.
	 */
	cipher.aes = class {
		constructor(key) {
			/**
			 * The expanded S-box and inverse S-box tables.  These will be computed
			 * on the client so that we don't have to send them down the wire.
			 *
			 * There are two tables, _tables[0] is for encryption and
			 * _tables[1] is for decryption.
			 *
			 * The first 4 sub-tables are the expanded S-box with MixColumns.  The
			 * last (_tables[01][4]) is the S-box itself.
			 *
			 * @private
			 */
			const aes = this;
			aes._tables = [[[], [], [], [], []], [[], [], [], [], []]];

			if (!aes._tables[0][0][0]) {
				aes._precompute();
			}

			const sbox = aes._tables[0][4];
			const decTable = aes._tables[1];
			const keyLen = key.length;

			let i, encKey, decKey, rcon = 1;

			if (keyLen !== 4 && keyLen !== 6 && keyLen !== 8) {
				throw new Error$1("invalid aes key size");
			}

			aes._key = [encKey = key.slice(0), decKey = []];

			// schedule encryption keys
			for (i = keyLen; i < 4 * keyLen + 28; i++) {
				let tmp = encKey[i - 1];

				// apply sbox
				if (i % keyLen === 0 || (keyLen === 8 && i % keyLen === 4)) {
					tmp = sbox[tmp >>> 24] << 24 ^ sbox[tmp >> 16 & 255] << 16 ^ sbox[tmp >> 8 & 255] << 8 ^ sbox[tmp & 255];

					// shift rows and add rcon
					if (i % keyLen === 0) {
						tmp = tmp << 8 ^ tmp >>> 24 ^ rcon << 24;
						rcon = rcon << 1 ^ (rcon >> 7) * 283;
					}
				}

				encKey[i] = encKey[i - keyLen] ^ tmp;
			}

			// schedule decryption keys
			for (let j = 0; i; j++, i--) {
				const tmp = encKey[j & 3 ? i : i - 4];
				if (i <= 4 || j < 4) {
					decKey[j] = tmp;
				} else {
					decKey[j] = decTable[0][sbox[tmp >>> 24]] ^
						decTable[1][sbox[tmp >> 16 & 255]] ^
						decTable[2][sbox[tmp >> 8 & 255]] ^
						decTable[3][sbox[tmp & 255]];
				}
			}
		}
		// public
		/* Something like this might appear here eventually
		name: "AES",
		blockSize: 4,
		keySizes: [4,6,8],
		*/

		/**
		 * Encrypt an array of 4 big-endian words.
		 * @param {Array} data The plaintext.
		 * @return {Array} The ciphertext.
		 */
		encrypt(data) {
			return this._crypt(data, 0);
		}

		/**
		 * Decrypt an array of 4 big-endian words.
		 * @param {Array} data The ciphertext.
		 * @return {Array} The plaintext.
		 */
		decrypt(data) {
			return this._crypt(data, 1);
		}

		/**
		 * Expand the S-box tables.
		 *
		 * @private
		 */
		_precompute() {
			const encTable = this._tables[0];
			const decTable = this._tables[1];
			const sbox = encTable[4];
			const sboxInv = decTable[4];
			const d = [];
			const th = [];
			let xInv, x2, x4, x8;

			// Compute double and third tables
			for (let i = 0; i < 256; i++) {
				th[(d[i] = i << 1 ^ (i >> 7) * 283) ^ i] = i;
			}

			for (let x = xInv = 0; !sbox[x]; x ^= x2 || 1, xInv = th[xInv] || 1) {
				// Compute sbox
				let s = xInv ^ xInv << 1 ^ xInv << 2 ^ xInv << 3 ^ xInv << 4;
				s = s >> 8 ^ s & 255 ^ 99;
				sbox[x] = s;
				sboxInv[s] = x;

				// Compute MixColumns
				x8 = d[x4 = d[x2 = d[x]]];
				let tDec = x8 * 0x1010101 ^ x4 * 0x10001 ^ x2 * 0x101 ^ x * 0x1010100;
				let tEnc = d[s] * 0x101 ^ s * 0x1010100;

				for (let i = 0; i < 4; i++) {
					encTable[i][x] = tEnc = tEnc << 24 ^ tEnc >>> 8;
					decTable[i][s] = tDec = tDec << 24 ^ tDec >>> 8;
				}
			}

			// Compactify.  Considerable speedup on Firefox.
			for (let i = 0; i < 5; i++) {
				encTable[i] = encTable[i].slice(0);
				decTable[i] = decTable[i].slice(0);
			}
		}

		/**
		 * Encryption and decryption core.
		 * @param {Array} input Four words to be encrypted or decrypted.
		 * @param dir The direction, 0 for encrypt and 1 for decrypt.
		 * @return {Array} The four encrypted or decrypted words.
		 * @private
		 */
		_crypt(input, dir) {
			if (input.length !== 4) {
				throw new Error$1("invalid aes block size");
			}

			const key = this._key[dir];

			const nInnerRounds = key.length / 4 - 2;
			const out = [0, 0, 0, 0];
			const table = this._tables[dir];

			// load up the tables
			const t0 = table[0];
			const t1 = table[1];
			const t2 = table[2];
			const t3 = table[3];
			const sbox = table[4];

			// state variables a,b,c,d are loaded with pre-whitened data
			let a = input[0] ^ key[0];
			let b = input[dir ? 3 : 1] ^ key[1];
			let c = input[2] ^ key[2];
			let d = input[dir ? 1 : 3] ^ key[3];
			let kIndex = 4;
			let a2, b2, c2;

			// Inner rounds.  Cribbed from OpenSSL.
			for (let i = 0; i < nInnerRounds; i++) {
				a2 = t0[a >>> 24] ^ t1[b >> 16 & 255] ^ t2[c >> 8 & 255] ^ t3[d & 255] ^ key[kIndex];
				b2 = t0[b >>> 24] ^ t1[c >> 16 & 255] ^ t2[d >> 8 & 255] ^ t3[a & 255] ^ key[kIndex + 1];
				c2 = t0[c >>> 24] ^ t1[d >> 16 & 255] ^ t2[a >> 8 & 255] ^ t3[b & 255] ^ key[kIndex + 2];
				d = t0[d >>> 24] ^ t1[a >> 16 & 255] ^ t2[b >> 8 & 255] ^ t3[c & 255] ^ key[kIndex + 3];
				kIndex += 4;
				a = a2; b = b2; c = c2;
			}

			// Last round.
			for (let i = 0; i < 4; i++) {
				out[dir ? 3 & -i : i] =
					sbox[a >>> 24] << 24 ^
					sbox[b >> 16 & 255] << 16 ^
					sbox[c >> 8 & 255] << 8 ^
					sbox[d & 255] ^
					key[kIndex++];
				a2 = a; a = b; b = c; c = d; d = a2;
			}

			return out;
		}
	};

	/**
	 * Random values
	 * @namespace
	 */
	const random = {
		/** 
		 * Generate random words with pure js, cryptographically not as strong & safe as native implementation.
		 * @param {TypedArray} typedArray The array to fill.
		 * @return {TypedArray} The random values.
		 */
		getRandomValues(typedArray) {
			const words = new Uint32Array$1(typedArray.buffer);
			const r = (m_w) => {
				let m_z = 0x3ade68b1;
				const mask = 0xffffffff;
				return function () {
					m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
					m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
					const result = ((((m_z << 0x10) + m_w) & mask) / 0x100000000) + .5;
					return result * (Math$1.random() > .5 ? 1 : -1);
				};
			};
			for (let i = 0, rcache; i < typedArray.length; i += 4) {
				const _r = r((rcache || Math$1.random()) * 0x100000000);
				rcache = _r() * 0x3ade67b7;
				words[i / 4] = (_r() * 0x100000000) | 0;
			}
			return typedArray;
		}
	};

	/** @fileOverview CTR mode implementation.
	 *
	 * Special thanks to Roy Nicholson for pointing out a bug in our
	 * implementation.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/** Brian Gladman's CTR Mode.
	* @constructor
	* @param {Object} _prf The aes instance to generate key.
	* @param {bitArray} _iv The iv for ctr mode, it must be 128 bits.
	*/

	const mode = {};

	/**
	 * Brian Gladman's CTR Mode.
	 * @namespace
	 */
	mode.ctrGladman = class {
		constructor(prf, iv) {
			this._prf = prf;
			this._initIv = iv;
			this._iv = iv;
		}

		reset() {
			this._iv = this._initIv;
		}

		/** Input some data to calculate.
		 * @param {bitArray} data the data to process, it must be intergral multiple of 128 bits unless it's the last.
		 */
		update(data) {
			return this.calculate(this._prf, data, this._iv);
		}

		incWord(word) {
			if (((word >> 24) & 0xff) === 0xff) { //overflow
				let b1 = (word >> 16) & 0xff;
				let b2 = (word >> 8) & 0xff;
				let b3 = word & 0xff;

				if (b1 === 0xff) { // overflow b1   
					b1 = 0;
					if (b2 === 0xff) {
						b2 = 0;
						if (b3 === 0xff) {
							b3 = 0;
						} else {
							++b3;
						}
					} else {
						++b2;
					}
				} else {
					++b1;
				}

				word = 0;
				word += (b1 << 16);
				word += (b2 << 8);
				word += b3;
			} else {
				word += (0x01 << 24);
			}
			return word;
		}

		incCounter(counter) {
			if ((counter[0] = this.incWord(counter[0])) === 0) {
				// encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
				counter[1] = this.incWord(counter[1]);
			}
		}

		calculate(prf, data, iv) {
			let l;
			if (!(l = data.length)) {
				return [];
			}
			const bl = bitArray.bitLength(data);
			for (let i = 0; i < l; i += 4) {
				this.incCounter(iv);
				const e = prf.encrypt(iv);
				data[i] ^= e[0];
				data[i + 1] ^= e[1];
				data[i + 2] ^= e[2];
				data[i + 3] ^= e[3];
			}
			return bitArray.clamp(data, bl);
		}
	};

	const misc = {
		importKey(password) {
			return new misc.hmacSha1(codec.bytes.toBits(password));
		},
		pbkdf2(prf, salt, count, length) {
			count = count || 10000;
			if (length < 0 || count < 0) {
				throw new Error$1("invalid params to pbkdf2");
			}
			const byteLength = ((length >> 5) + 1) << 2;
			let u, ui, i, j, k;
			const arrayBuffer = new ArrayBuffer(byteLength);
			const out = new DataView$1(arrayBuffer);
			let outLength = 0;
			const b = bitArray;
			salt = codec.bytes.toBits(salt);
			for (k = 1; outLength < (byteLength || 1); k++) {
				u = ui = prf.encrypt(b.concat(salt, [k]));
				for (i = 1; i < count; i++) {
					ui = prf.encrypt(ui);
					for (j = 0; j < ui.length; j++) {
						u[j] ^= ui[j];
					}
				}
				for (i = 0; outLength < (byteLength || 1) && i < u.length; i++) {
					out.setInt32(outLength, u[i]);
					outLength += 4;
				}
			}
			return arrayBuffer.slice(0, length / 8);
		}
	};

	/** @fileOverview HMAC implementation.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/** HMAC with the specified hash function.
	 * @constructor
	 * @param {bitArray} key the key for HMAC.
	 * @param {Object} [Hash=hash.sha1] The hash function to use.
	 */
	misc.hmacSha1 = class {

		constructor(key) {
			const hmac = this;
			const Hash = hmac._hash = hash.sha1;
			const exKey = [[], []];
			hmac._baseHash = [new Hash(), new Hash()];
			const bs = hmac._baseHash[0].blockSize / 32;

			if (key.length > bs) {
				key = new Hash().update(key).finalize();
			}

			for (let i = 0; i < bs; i++) {
				exKey[0][i] = key[i] ^ 0x36363636;
				exKey[1][i] = key[i] ^ 0x5C5C5C5C;
			}

			hmac._baseHash[0].update(exKey[0]);
			hmac._baseHash[1].update(exKey[1]);
			hmac._resultHash = new Hash(hmac._baseHash[0]);
		}
		reset() {
			const hmac = this;
			hmac._resultHash = new hmac._hash(hmac._baseHash[0]);
			hmac._updated = false;
		}

		update(data) {
			const hmac = this;
			hmac._updated = true;
			hmac._resultHash.update(data);
		}

		digest() {
			const hmac = this;
			const w = hmac._resultHash.finalize();
			const result = new (hmac._hash)(hmac._baseHash[1]).update(w).finalize();

			hmac.reset();

			return result;
		}

		encrypt(data) {
			if (!this._updated) {
				this.update(data);
				return this.digest(data);
			} else {
				throw new Error$1("encrypt on already updated hmac called!");
			}
		}
	};

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const GET_RANDOM_VALUES_SUPPORTED = typeof crypto$1 != "undefined" && typeof crypto$1.getRandomValues == "function";

	const ERR_INVALID_PASSWORD = "Invalid password";
	const ERR_INVALID_SIGNATURE = "Invalid signature";
	const ERR_ABORT_CHECK_PASSWORD = "zipjs-abort-check-password";

	function getRandomValues(array) {
		if (GET_RANDOM_VALUES_SUPPORTED) {
			return crypto$1.getRandomValues(array);
		} else {
			return random.getRandomValues(array);
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const BLOCK_LENGTH = 16;
	const RAW_FORMAT = "raw";
	const PBKDF2_ALGORITHM = { name: "PBKDF2" };
	const HASH_ALGORITHM = { name: "HMAC" };
	const HASH_FUNCTION = "SHA-1";
	const BASE_KEY_ALGORITHM = Object$1.assign({ hash: HASH_ALGORITHM }, PBKDF2_ALGORITHM);
	const DERIVED_BITS_ALGORITHM = Object$1.assign({ iterations: 1000, hash: { name: HASH_FUNCTION } }, PBKDF2_ALGORITHM);
	const DERIVED_BITS_USAGE = ["deriveBits"];
	const SALT_LENGTH = [8, 12, 16];
	const KEY_LENGTH = [16, 24, 32];
	const SIGNATURE_LENGTH = 10;
	const COUNTER_DEFAULT_VALUE = [0, 0, 0, 0];
	const UNDEFINED_TYPE = "undefined";
	const FUNCTION_TYPE = "function";
	// deno-lint-ignore valid-typeof
	const CRYPTO_API_SUPPORTED = typeof crypto$1 != UNDEFINED_TYPE;
	const subtle = CRYPTO_API_SUPPORTED && crypto$1.subtle;
	const SUBTLE_API_SUPPORTED = CRYPTO_API_SUPPORTED && typeof subtle != UNDEFINED_TYPE;
	const codecBytes = codec.bytes;
	const Aes = cipher.aes;
	const CtrGladman = mode.ctrGladman;
	const HmacSha1 = misc.hmacSha1;

	let IMPORT_KEY_SUPPORTED = CRYPTO_API_SUPPORTED && SUBTLE_API_SUPPORTED && typeof subtle.importKey == FUNCTION_TYPE;
	let DERIVE_BITS_SUPPORTED = CRYPTO_API_SUPPORTED && SUBTLE_API_SUPPORTED && typeof subtle.deriveBits == FUNCTION_TYPE;

	class AESDecryptionStream extends TransformStream {

		constructor({ password, signed, encryptionStrength, checkPasswordOnly }) {
			super({
				start() {
					Object$1.assign(this, {
						ready: new Promise$1(resolve => this.resolveReady = resolve),
						password,
						signed,
						strength: encryptionStrength - 1,
						pending: new Uint8Array$1()
					});
				},
				async transform(chunk, controller) {
					const aesCrypto = this;
					const {
						password,
						strength,
						resolveReady,
						ready
					} = aesCrypto;
					if (password) {
						await createDecryptionKeys(aesCrypto, strength, password, subarray(chunk, 0, SALT_LENGTH[strength] + 2));
						chunk = subarray(chunk, SALT_LENGTH[strength] + 2);
						if (checkPasswordOnly) {
							controller.error(new Error$1(ERR_ABORT_CHECK_PASSWORD));
						} else {
							resolveReady();
						}
					} else {
						await ready;
					}
					const output = new Uint8Array$1(chunk.length - SIGNATURE_LENGTH - ((chunk.length - SIGNATURE_LENGTH) % BLOCK_LENGTH));
					controller.enqueue(append(aesCrypto, chunk, output, 0, SIGNATURE_LENGTH, true));
				},
				async flush(controller) {
					const {
						signed,
						ctr,
						hmac,
						pending,
						ready
					} = this;
					await ready;
					const chunkToDecrypt = subarray(pending, 0, pending.length - SIGNATURE_LENGTH);
					const originalSignature = subarray(pending, pending.length - SIGNATURE_LENGTH);
					let decryptedChunkArray = new Uint8Array$1();
					if (chunkToDecrypt.length) {
						const encryptedChunk = toBits(codecBytes, chunkToDecrypt);
						hmac.update(encryptedChunk);
						const decryptedChunk = ctr.update(encryptedChunk);
						decryptedChunkArray = fromBits(codecBytes, decryptedChunk);
					}
					if (signed) {
						const signature = subarray(fromBits(codecBytes, hmac.digest()), 0, SIGNATURE_LENGTH);
						for (let indexSignature = 0; indexSignature < SIGNATURE_LENGTH; indexSignature++) {
							if (signature[indexSignature] != originalSignature[indexSignature]) {
								throw new Error$1(ERR_INVALID_SIGNATURE);
							}
						}
					}
					controller.enqueue(decryptedChunkArray);
				}
			});
		}
	}

	class AESEncryptionStream extends TransformStream {

		constructor({ password, encryptionStrength }) {
			// deno-lint-ignore prefer-const
			let stream;
			super({
				start() {
					Object$1.assign(this, {
						ready: new Promise$1(resolve => this.resolveReady = resolve),
						password,
						strength: encryptionStrength - 1,
						pending: new Uint8Array$1()
					});
				},
				async transform(chunk, controller) {
					const aesCrypto = this;
					const {
						password,
						strength,
						resolveReady,
						ready
					} = aesCrypto;
					let preamble = new Uint8Array$1();
					if (password) {
						preamble = await createEncryptionKeys(aesCrypto, strength, password);
						resolveReady();
					} else {
						await ready;
					}
					const output = new Uint8Array$1(preamble.length + chunk.length - (chunk.length % BLOCK_LENGTH));
					output.set(preamble, 0);
					controller.enqueue(append(aesCrypto, chunk, output, preamble.length, 0));
				},
				async flush(controller) {
					const {
						ctr,
						hmac,
						pending,
						ready
					} = this;
					await ready;
					let encryptedChunkArray = new Uint8Array$1();
					if (pending.length) {
						const encryptedChunk = ctr.update(toBits(codecBytes, pending));
						hmac.update(encryptedChunk);
						encryptedChunkArray = fromBits(codecBytes, encryptedChunk);
					}
					stream.signature = fromBits(codecBytes, hmac.digest()).slice(0, SIGNATURE_LENGTH);
					controller.enqueue(concat(encryptedChunkArray, stream.signature));
				}
			});
			stream = this;
		}
	}

	function append(aesCrypto, input, output, paddingStart, paddingEnd, verifySignature) {
		const {
			ctr,
			hmac,
			pending
		} = aesCrypto;
		const inputLength = input.length - paddingEnd;
		if (pending.length) {
			input = concat(pending, input);
			output = expand(output, inputLength - (inputLength % BLOCK_LENGTH));
		}
		let offset;
		for (offset = 0; offset <= inputLength - BLOCK_LENGTH; offset += BLOCK_LENGTH) {
			const inputChunk = toBits(codecBytes, subarray(input, offset, offset + BLOCK_LENGTH));
			if (verifySignature) {
				hmac.update(inputChunk);
			}
			const outputChunk = ctr.update(inputChunk);
			if (!verifySignature) {
				hmac.update(outputChunk);
			}
			output.set(fromBits(codecBytes, outputChunk), offset + paddingStart);
		}
		aesCrypto.pending = subarray(input, offset);
		return output;
	}

	async function createDecryptionKeys(decrypt, strength, password, preamble) {
		const passwordVerificationKey = await createKeys$1(decrypt, strength, password, subarray(preamble, 0, SALT_LENGTH[strength]));
		const passwordVerification = subarray(preamble, SALT_LENGTH[strength]);
		if (passwordVerificationKey[0] != passwordVerification[0] || passwordVerificationKey[1] != passwordVerification[1]) {
			throw new Error$1(ERR_INVALID_PASSWORD);
		}
	}

	async function createEncryptionKeys(encrypt, strength, password) {
		const salt = getRandomValues(new Uint8Array$1(SALT_LENGTH[strength]));
		const passwordVerification = await createKeys$1(encrypt, strength, password, salt);
		return concat(salt, passwordVerification);
	}

	async function createKeys$1(aesCrypto, strength, password, salt) {
		aesCrypto.password = null;
		const encodedPassword = encodeText(password);
		const baseKey = await importKey(RAW_FORMAT, encodedPassword, BASE_KEY_ALGORITHM, false, DERIVED_BITS_USAGE);
		const derivedBits = await deriveBits(Object$1.assign({ salt }, DERIVED_BITS_ALGORITHM), baseKey, 8 * ((KEY_LENGTH[strength] * 2) + 2));
		const compositeKey = new Uint8Array$1(derivedBits);
		const key = toBits(codecBytes, subarray(compositeKey, 0, KEY_LENGTH[strength]));
		const authentication = toBits(codecBytes, subarray(compositeKey, KEY_LENGTH[strength], KEY_LENGTH[strength] * 2));
		const passwordVerification = subarray(compositeKey, KEY_LENGTH[strength] * 2);
		Object$1.assign(aesCrypto, {
			keys: {
				key,
				authentication,
				passwordVerification
			},
			ctr: new CtrGladman(new Aes(key), Array$1.from(COUNTER_DEFAULT_VALUE)),
			hmac: new HmacSha1(authentication)
		});
		return passwordVerification;
	}

	async function importKey(format, password, algorithm, extractable, keyUsages) {
		if (IMPORT_KEY_SUPPORTED) {
			try {
				return await subtle.importKey(format, password, algorithm, extractable, keyUsages);
			} catch (_error) {
				IMPORT_KEY_SUPPORTED = false;
				return misc.importKey(password);
			}
		} else {
			return misc.importKey(password);
		}
	}

	async function deriveBits(algorithm, baseKey, length) {
		if (DERIVE_BITS_SUPPORTED) {
			try {
				return await subtle.deriveBits(algorithm, baseKey, length);
			} catch (_error) {
				DERIVE_BITS_SUPPORTED = false;
				return misc.pbkdf2(baseKey, algorithm.salt, DERIVED_BITS_ALGORITHM.iterations, length);
			}
		} else {
			return misc.pbkdf2(baseKey, algorithm.salt, DERIVED_BITS_ALGORITHM.iterations, length);
		}
	}

	function concat(leftArray, rightArray) {
		let array = leftArray;
		if (leftArray.length + rightArray.length) {
			array = new Uint8Array$1(leftArray.length + rightArray.length);
			array.set(leftArray, 0);
			array.set(rightArray, leftArray.length);
		}
		return array;
	}

	function expand(inputArray, length) {
		if (length && length > inputArray.length) {
			const array = inputArray;
			inputArray = new Uint8Array$1(length);
			inputArray.set(array, 0);
		}
		return inputArray;
	}

	function subarray(array, begin, end) {
		return array.subarray(begin, end);
	}

	function fromBits(codecBytes, chunk) {
		return codecBytes.fromBits(chunk);
	}
	function toBits(codecBytes, chunk) {
		return codecBytes.toBits(chunk);
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const HEADER_LENGTH = 12;

	class ZipCryptoDecryptionStream extends TransformStream {

		constructor({ password, passwordVerification, checkPasswordOnly }) {
			super({
				start() {
					Object$1.assign(this, {
						password,
						passwordVerification
					});
					createKeys(this, password);
				},
				transform(chunk, controller) {
					const zipCrypto = this;
					if (zipCrypto.password) {
						const decryptedHeader = decrypt(zipCrypto, chunk.subarray(0, HEADER_LENGTH));
						zipCrypto.password = null;
						if (decryptedHeader[HEADER_LENGTH - 1] != zipCrypto.passwordVerification) {
							throw new Error$1(ERR_INVALID_PASSWORD);
						}
						chunk = chunk.subarray(HEADER_LENGTH);
					}
					if (checkPasswordOnly) {
						controller.error(new Error$1(ERR_ABORT_CHECK_PASSWORD));
					} else {
						controller.enqueue(decrypt(zipCrypto, chunk));
					}
				}
			});
		}
	}

	class ZipCryptoEncryptionStream extends TransformStream {

		constructor({ password, passwordVerification }) {
			super({
				start() {
					Object$1.assign(this, {
						password,
						passwordVerification
					});
					createKeys(this, password);
				},
				transform(chunk, controller) {
					const zipCrypto = this;
					let output;
					let offset;
					if (zipCrypto.password) {
						zipCrypto.password = null;
						const header = getRandomValues(new Uint8Array$1(HEADER_LENGTH));
						header[HEADER_LENGTH - 1] = zipCrypto.passwordVerification;
						output = new Uint8Array$1(chunk.length + header.length);
						output.set(encrypt(zipCrypto, header), 0);
						offset = HEADER_LENGTH;
					} else {
						output = new Uint8Array$1(chunk.length);
						offset = 0;
					}
					output.set(encrypt(zipCrypto, chunk), offset);
					controller.enqueue(output);
				}
			});
		}
	}

	function decrypt(target, input) {
		const output = new Uint8Array$1(input.length);
		for (let index = 0; index < input.length; index++) {
			output[index] = getByte(target) ^ input[index];
			updateKeys(target, output[index]);
		}
		return output;
	}

	function encrypt(target, input) {
		const output = new Uint8Array$1(input.length);
		for (let index = 0; index < input.length; index++) {
			output[index] = getByte(target) ^ input[index];
			updateKeys(target, input[index]);
		}
		return output;
	}

	function createKeys(target, password) {
		const keys = [0x12345678, 0x23456789, 0x34567890];
		Object$1.assign(target, {
			keys,
			crcKey0: new Crc32(keys[0]),
			crcKey2: new Crc32(keys[2]),
		});
		for (let index = 0; index < password.length; index++) {
			updateKeys(target, password.charCodeAt(index));
		}
	}

	function updateKeys(target, byte) {
		let [key0, key1, key2] = target.keys;
		target.crcKey0.append([byte]);
		key0 = ~target.crcKey0.get();
		key1 = getInt32(Math$1.imul(getInt32(key1 + getInt8(key0)), 134775813) + 1);
		target.crcKey2.append([key1 >>> 24]);
		key2 = ~target.crcKey2.get();
		target.keys = [key0, key1, key2];
	}

	function getByte(target) {
		const temp = target.keys[2] | 2;
		return getInt8(Math$1.imul(temp, (temp ^ 1)) >>> 8);
	}

	function getInt8(number) {
		return number & 0xFF;
	}

	function getInt32(number) {
		return number & 0xFFFFFFFF;
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const COMPRESSION_FORMAT = "deflate-raw";

	class DeflateStream extends TransformStream {

		constructor(options, { chunkSize, CompressionStream, CompressionStreamNative }) {
			super({});
			const { compressed, encrypted, useCompressionStream, zipCrypto, signed, level } = options;
			const stream = this;
			let crc32Stream, encryptionStream;
			let readable = filterEmptyChunks(super.readable);
			if ((!encrypted || zipCrypto) && signed) {
				crc32Stream = new Crc32Stream();
				readable = pipeThrough(readable, crc32Stream);
			}
			if (compressed) {
				readable = pipeThroughCommpressionStream(readable, useCompressionStream, { level, chunkSize }, CompressionStreamNative, CompressionStream);
			}
			if (encrypted) {
				if (zipCrypto) {
					readable = pipeThrough(readable, new ZipCryptoEncryptionStream(options));
				} else {
					encryptionStream = new AESEncryptionStream(options);
					readable = pipeThrough(readable, encryptionStream);
				}
			}
			setReadable(stream, readable, () => {
				let signature;
				if (encrypted && !zipCrypto) {
					signature = encryptionStream.signature;
				}
				if ((!encrypted || zipCrypto) && signed) {
					signature = new DataView$1(crc32Stream.value.buffer).getUint32(0);
				}
				stream.signature = signature;
			});
		}
	}

	class InflateStream extends TransformStream {

		constructor(options, { chunkSize, DecompressionStream, DecompressionStreamNative }) {
			super({});
			const { zipCrypto, encrypted, signed, signature, compressed, useCompressionStream } = options;
			let crc32Stream, decryptionStream;
			let readable = filterEmptyChunks(super.readable);
			if (encrypted) {
				if (zipCrypto) {
					readable = pipeThrough(readable, new ZipCryptoDecryptionStream(options));
				} else {
					decryptionStream = new AESDecryptionStream(options);
					readable = pipeThrough(readable, decryptionStream);
				}
			}
			if (compressed) {
				readable = pipeThroughCommpressionStream(readable, useCompressionStream, { chunkSize }, DecompressionStreamNative, DecompressionStream);
			}
			if ((!encrypted || zipCrypto) && signed) {
				crc32Stream = new Crc32Stream();
				readable = pipeThrough(readable, crc32Stream);
			}
			setReadable(this, readable, () => {
				if ((!encrypted || zipCrypto) && signed) {
					const dataViewSignature = new DataView$1(crc32Stream.value.buffer);
					if (signature != dataViewSignature.getUint32(0, false)) {
						throw new Error$1(ERR_INVALID_SIGNATURE);
					}
				}
			});
		}
	}

	function filterEmptyChunks(readable) {
		return pipeThrough(readable, new TransformStream({
			transform(chunk, controller) {
				if (chunk && chunk.length) {
					controller.enqueue(chunk);
				}
			}
		}));
	}

	function setReadable(stream, readable, flush) {
		readable = pipeThrough(readable, new TransformStream({ flush }));
		Object$1.defineProperty(stream, "readable", {
			get() {
				return readable;
			}
		});
	}

	function pipeThroughCommpressionStream(readable, useCompressionStream, options, CodecStreamNative, CodecStream) {
		try {
			const CompressionStream = useCompressionStream && CodecStreamNative ? CodecStreamNative : CodecStream;
			readable = pipeThrough(readable, new CompressionStream(COMPRESSION_FORMAT, options));
		} catch (error) {
			if (useCompressionStream) {
				readable = pipeThrough(readable, new CodecStream(COMPRESSION_FORMAT, options));
			} else {
				throw error;
			}
		}
		return readable;
	}

	function pipeThrough(readable, transformStream) {
		return readable.pipeThrough(transformStream);
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const MESSAGE_EVENT_TYPE = "message";
	const MESSAGE_START = "start";
	const MESSAGE_PULL = "pull";
	const MESSAGE_DATA = "data";
	const MESSAGE_ACK_DATA = "ack";
	const MESSAGE_CLOSE = "close";
	const CODEC_DEFLATE = "deflate";
	const CODEC_INFLATE = "inflate";

	class CodecStream extends TransformStream {

		constructor(options, config) {
			super({});
			const codec = this;
			const { codecType } = options;
			let Stream;
			if (codecType.startsWith(CODEC_DEFLATE)) {
				Stream = DeflateStream;
			} else if (codecType.startsWith(CODEC_INFLATE)) {
				Stream = InflateStream;
			}
			let size = 0;
			const stream = new Stream(options, config);
			const readable = super.readable;
			const transformStream = new TransformStream({
				transform(chunk, controller) {
					if (chunk && chunk.length) {
						size += chunk.length;
						controller.enqueue(chunk);
					}
				},
				flush() {
					const { signature } = stream;
					Object$1.assign(codec, {
						signature,
						size
					});
				}
			});
			Object$1.defineProperty(codec, "readable", {
				get() {
					return readable.pipeThrough(stream).pipeThrough(transformStream);
				}
			});
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	// deno-lint-ignore valid-typeof
	const WEB_WORKERS_SUPPORTED = typeof Worker != UNDEFINED_TYPE$1;

	class CodecWorker {

		constructor(workerData, { readable, writable }, { options, config, streamOptions, useWebWorkers, transferStreams, scripts }, onTaskFinished) {
			const { signal } = streamOptions;
			Object$1.assign(workerData, {
				busy: true,
				readable: readable.pipeThrough(new ProgressWatcherStream(readable, streamOptions, config), { signal }),
				writable,
				options: Object$1.assign({}, options),
				scripts,
				transferStreams,
				terminate() {
					const { worker, busy } = workerData;
					if (worker && !busy) {
						worker.terminate();
						workerData.interface = null;
					}
				},
				onTaskFinished() {
					workerData.busy = false;
					onTaskFinished(workerData);
				}
			});
			return (useWebWorkers && WEB_WORKERS_SUPPORTED ? createWebWorkerInterface : createWorkerInterface)(workerData, config);
		}
	}

	class ProgressWatcherStream extends TransformStream {

		constructor(readableSource, { onstart, onprogress, size, onend }, { chunkSize }) {
			let chunkOffset = 0;
			super({
				start() {
					if (onstart) {
						callHandler(onstart, size);
					}
				},
				async transform(chunk, controller) {
					chunkOffset += chunk.length;
					if (onprogress) {
						await callHandler(onprogress, chunkOffset, size);
					}
					controller.enqueue(chunk);
				},
				flush() {
					readableSource.size = chunkOffset;
					if (onend) {
						callHandler(onend, chunkOffset);
					}
				}
			}, { highWaterMark: 1, size: () => chunkSize });
		}
	}

	async function callHandler(handler, ...parameters) {
		try {
			await handler(...parameters);
		} catch (_error) {
			// ignored
		}
	}

	function createWorkerInterface(workerData, config) {
		return {
			run: () => runWorker$1(workerData, config)
		};
	}

	function createWebWorkerInterface(workerData, { baseURL, chunkSize }) {
		if (!workerData.interface) {
			Object$1.assign(workerData, {
				worker: getWebWorker(workerData.scripts[0], baseURL, workerData),
				interface: {
					run: () => runWebWorker(workerData, { chunkSize })
				}
			});
		}
		return workerData.interface;
	}

	async function runWorker$1({ options, readable, writable, onTaskFinished }, config) {
		const codecStream = new CodecStream(options, config);
		try {
			await readable.pipeThrough(codecStream).pipeTo(writable, { preventClose: true, preventAbort: true });
			const {
				signature,
				size
			} = codecStream;
			return {
				signature,
				size
			};
		} finally {
			onTaskFinished();
		}
	}

	async function runWebWorker(workerData, config) {
		let resolveResult, rejectResult;
		const result = new Promise$1((resolve, reject) => {
			resolveResult = resolve;
			rejectResult = reject;
		});
		Object$1.assign(workerData, {
			reader: null,
			writer: null,
			resolveResult,
			rejectResult,
			result
		});
		const { readable, options, scripts } = workerData;
		const { writable, closed } = watchClosedStream(workerData.writable);
		const streamsTransferred = sendMessage$1({
			type: MESSAGE_START,
			scripts: scripts.slice(1),
			options,
			config,
			readable,
			writable
		}, workerData);
		if (!streamsTransferred) {
			Object$1.assign(workerData, {
				reader: readable.getReader(),
				writer: writable.getWriter()
			});
		}
		const resultValue = await result;
		try {
			await writable.getWriter().close();
		} catch (_error) {
			// ignored
		}
		await closed;
		return resultValue;
	}

	function watchClosedStream(writableSource) {
		const writer = writableSource.getWriter();
		let resolveStreamClosed;
		const closed = new Promise$1(resolve => resolveStreamClosed = resolve);
		const writable = new WritableStream({
			async write(chunk) {
				await writer.ready;
				await writer.write(chunk);
			},
			close() {
				writer.releaseLock();
				resolveStreamClosed();
			},
			abort(reason) {
				return writer.abort(reason);
			}
		});
		return { writable, closed };
	}

	let classicWorkersSupported = true;
	let transferStreamsSupported = true;

	function getWebWorker(url, baseURL, workerData) {
		const workerOptions = { type: "module" };
		let scriptUrl, worker;
		// deno-lint-ignore valid-typeof
		if (typeof url == FUNCTION_TYPE$1) {
			url = url();
		}
		try {
			scriptUrl = new URL$2(url, baseURL);
		} catch (_error) {
			scriptUrl = url;
		}
		if (classicWorkersSupported) {
			try {
				worker = new Worker(scriptUrl);
			} catch (_error) {
				classicWorkersSupported = false;
				worker = new Worker(scriptUrl, workerOptions);
			}
		} else {
			worker = new Worker(scriptUrl, workerOptions);
		}
		worker.addEventListener(MESSAGE_EVENT_TYPE, event => onMessage(event, workerData));
		return worker;
	}

	function sendMessage$1(message, { worker, writer, onTaskFinished, transferStreams }) {
		try {
			let { value, readable, writable } = message;
			const transferables = [];
			if (value) {
				message.value = value.buffer;
				transferables.push(message.value);
			}
			if (transferStreams && transferStreamsSupported) {
				if (readable) {
					transferables.push(readable);
				}
				if (writable) {
					transferables.push(writable);
				}
			} else {
				message.readable = message.writable = null;
			}
			if (transferables.length) {
				try {
					worker.postMessage(message, transferables);
					return true;
				} catch (_error) {
					transferStreamsSupported = false;
					message.readable = message.writable = null;
					worker.postMessage(message);
				}
			} else {
				worker.postMessage(message);
			}
		} catch (error) {
			if (writer) {
				writer.releaseLock();
			}
			onTaskFinished();
			throw error;
		}
	}

	async function onMessage({ data }, workerData) {
		const { type, value, messageId, result, error } = data;
		const { reader, writer, resolveResult, rejectResult, onTaskFinished } = workerData;
		try {
			if (error) {
				const { message, stack, code, name } = error;
				const responseError = new Error$1(message);
				Object$1.assign(responseError, { stack, code, name });
				close(responseError);
			} else {
				if (type == MESSAGE_PULL) {
					const { value, done } = await reader.read();
					sendMessage$1({ type: MESSAGE_DATA, value, done, messageId }, workerData);
				}
				if (type == MESSAGE_DATA) {
					await writer.ready;
					await writer.write(new Uint8Array$1(value));
					sendMessage$1({ type: MESSAGE_ACK_DATA, messageId }, workerData);
				}
				if (type == MESSAGE_CLOSE) {
					close(null, result);
				}
			}
		} catch (error) {
			close(error);
		}

		function close(error, result) {
			if (error) {
				rejectResult(error);
			} else {
				resolveResult(result);
			}
			if (writer) {
				writer.releaseLock();
			}
			onTaskFinished();
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	let pool = [];
	const pendingRequests = [];

	let indexWorker = 0;

	async function runWorker(stream, workerOptions) {
		const { options, config } = workerOptions;
		const { transferStreams, useWebWorkers, useCompressionStream, codecType, compressed, signed, encrypted } = options;
		const { workerScripts, maxWorkers, terminateWorkerTimeout } = config;
		workerOptions.transferStreams = transferStreams || transferStreams === UNDEFINED_VALUE;
		const streamCopy = !compressed && !signed && !encrypted && !workerOptions.transferStreams;
		workerOptions.useWebWorkers = !streamCopy && (useWebWorkers || (useWebWorkers === UNDEFINED_VALUE && config.useWebWorkers));
		workerOptions.scripts = workerOptions.useWebWorkers && workerScripts ? workerScripts[codecType] : [];
		options.useCompressionStream = useCompressionStream || (useCompressionStream === UNDEFINED_VALUE && config.useCompressionStream);
		let worker;
		const workerData = pool.find(workerData => !workerData.busy);
		if (workerData) {
			clearTerminateTimeout(workerData);
			worker = new CodecWorker(workerData, stream, workerOptions, onTaskFinished);
		} else if (pool.length < maxWorkers) {
			const workerData = { indexWorker };
			indexWorker++;
			pool.push(workerData);
			worker = new CodecWorker(workerData, stream, workerOptions, onTaskFinished);
		} else {
			worker = await new Promise$1(resolve => pendingRequests.push({ resolve, stream, workerOptions }));
		}
		return worker.run();

		function onTaskFinished(workerData) {
			if (pendingRequests.length) {
				const [{ resolve, stream, workerOptions }] = pendingRequests.splice(0, 1);
				resolve(new CodecWorker(workerData, stream, workerOptions, onTaskFinished));
			} else if (workerData.worker) {
				clearTerminateTimeout(workerData);
				if (Number$1.isFinite(terminateWorkerTimeout) && terminateWorkerTimeout >= 0) {
					workerData.terminateTimeout = setTimeout(() => {
						pool = pool.filter(data => data != workerData);
						workerData.terminate();
					}, terminateWorkerTimeout);
				}
			} else {
				pool = pool.filter(data => data != workerData);
			}
		}
	}

	function clearTerminateTimeout(workerData) {
		const { terminateTimeout } = workerData;
		if (terminateTimeout) {
			clearTimeout(terminateTimeout);
			workerData.terminateTimeout = null;
		}
	}

	function terminateWorkers() {
		pool.forEach(workerData => {
			clearTerminateTimeout(workerData);
			workerData.terminate();
		});
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const ERR_HTTP_STATUS = "HTTP error ";
	const ERR_HTTP_RANGE = "HTTP Range not supported";
	const ERR_ITERATOR_COMPLETED_TOO_SOON = "Writer iterator completed too soon";

	const CONTENT_TYPE_TEXT_PLAIN = "text/plain";
	const HTTP_HEADER_CONTENT_LENGTH = "Content-Length";
	const HTTP_HEADER_CONTENT_RANGE = "Content-Range";
	const HTTP_HEADER_ACCEPT_RANGES = "Accept-Ranges";
	const HTTP_HEADER_RANGE = "Range";
	const HTTP_HEADER_CONTENT_TYPE = "Content-Type";
	const HTTP_METHOD_HEAD = "HEAD";
	const HTTP_METHOD_GET = "GET";
	const HTTP_RANGE_UNIT = "bytes";
	const DEFAULT_CHUNK_SIZE = 64 * 1024;

	const PROPERTY_NAME_WRITABLE = "writable";

	class Stream {

		constructor() {
			this.size = 0;
		}

		init() {
			this.initialized = true;
		}
	}

	class Reader extends Stream {

		get readable() {
			const reader = this;
			const { chunkSize = DEFAULT_CHUNK_SIZE } = reader;
			const readable = new ReadableStream({
				start() {
					this.chunkOffset = 0;
				},
				async pull(controller) {
					const { offset = 0, size, diskNumberStart } = readable;
					const { chunkOffset } = this;
					controller.enqueue(await readUint8Array(reader, offset + chunkOffset, Math$1.min(chunkSize, size - chunkOffset), diskNumberStart));
					if (chunkOffset + chunkSize > size) {
						controller.close();
					} else {
						this.chunkOffset += chunkSize;
					}
				}
			});
			return readable;
		}
	}

	class Writer extends Stream {

		constructor() {
			super();
			const writer = this;
			const writable = new WritableStream({
				write(chunk) {
					return writer.writeUint8Array(chunk);
				}
			});
			Object$1.defineProperty(writer, PROPERTY_NAME_WRITABLE, {
				get() {
					return writable;
				}
			});
		}

		writeUint8Array() {
			// abstract
		}
	}

	class Data64URIReader extends Reader {

		constructor(dataURI) {
			super();
			let dataEnd = dataURI.length;
			while (dataURI.charAt(dataEnd - 1) == "=") {
				dataEnd--;
			}
			const dataStart = dataURI.indexOf(",") + 1;
			Object$1.assign(this, {
				dataURI,
				dataStart,
				size: Math$1.floor((dataEnd - dataStart) * 0.75)
			});
		}

		readUint8Array(offset, length) {
			const {
				dataStart,
				dataURI
			} = this;
			const dataArray = new Uint8Array$1(length);
			const start = Math$1.floor(offset / 3) * 4;
			const bytes = atob(dataURI.substring(start + dataStart, Math$1.ceil((offset + length) / 3) * 4 + dataStart));
			const delta = offset - Math$1.floor(start / 4) * 3;
			for (let indexByte = delta; indexByte < delta + length; indexByte++) {
				dataArray[indexByte - delta] = bytes.charCodeAt(indexByte);
			}
			return dataArray;
		}
	}

	class Data64URIWriter extends Writer {

		constructor(contentType) {
			super();
			Object$1.assign(this, {
				data: "data:" + (contentType || "") + ";base64,",
				pending: []
			});
		}

		writeUint8Array(array) {
			const writer = this;
			let indexArray = 0;
			let dataString = writer.pending;
			const delta = writer.pending.length;
			writer.pending = "";
			for (indexArray = 0; indexArray < (Math$1.floor((delta + array.length) / 3) * 3) - delta; indexArray++) {
				dataString += String$1.fromCharCode(array[indexArray]);
			}
			for (; indexArray < array.length; indexArray++) {
				writer.pending += String$1.fromCharCode(array[indexArray]);
			}
			if (dataString.length > 2) {
				writer.data += btoa(dataString);
			} else {
				writer.pending = dataString;
			}
		}

		getData() {
			return this.data + btoa(this.pending);
		}
	}

	class BlobReader extends Reader {

		constructor(blob) {
			super();
			Object$1.assign(this, {
				blob,
				size: blob.size
			});
		}

		async readUint8Array(offset, length) {
			const reader = this;
			const offsetEnd = offset + length;
			const blob = offset || offsetEnd < reader.size ? reader.blob.slice(offset, offsetEnd) : reader.blob;
			let arrayBuffer = await blob.arrayBuffer();
			if (arrayBuffer.byteLength > length) {
				arrayBuffer = arrayBuffer.slice(offset, offsetEnd);
			}
			return new Uint8Array$1(arrayBuffer);
		}
	}

	class BlobWriter extends Stream {

		constructor(contentType) {
			super();
			const writer = this;
			const transformStream = new TransformStream();
			const headers = [];
			if (contentType) {
				headers.push([HTTP_HEADER_CONTENT_TYPE, contentType]);
			}
			Object$1.defineProperty(writer, PROPERTY_NAME_WRITABLE, {
				get() {
					return transformStream.writable;
				}
			});
			writer.blob = new Response(transformStream.readable, { headers }).blob();
		}

		getData() {
			return this.blob;
		}
	}

	class TextReader extends BlobReader {

		constructor(text) {
			super(new Blob$3([text], { type: CONTENT_TYPE_TEXT_PLAIN }));
		}
	}

	class TextWriter extends BlobWriter {

		constructor(encoding) {
			super(encoding);
			Object$1.assign(this, {
				encoding,
				utf8: !encoding || encoding.toLowerCase() == "utf-8"
			});
		}

		async getData() {
			const {
				encoding,
				utf8
			} = this;
			const blob = await super.getData();
			if (blob.text && utf8) {
				return blob.text();
			} else {
				const reader = new FileReader();
				return new Promise$1((resolve, reject) => {
					Object$1.assign(reader, {
						onload: ({ target }) => resolve(target.result),
						onerror: () => reject(reader.error)
					});
					reader.readAsText(blob, encoding);
				});
			}
		}
	}

	class FetchReader extends Reader {

		constructor(url, options) {
			super();
			createHtpReader(this, url, options);
		}

		async init() {
			await initHttpReader(this, sendFetchRequest, getFetchRequestData);
			super.init();
		}

		readUint8Array(index, length) {
			return readUint8ArrayHttpReader(this, index, length, sendFetchRequest, getFetchRequestData);
		}
	}

	class XHRReader extends Reader {

		constructor(url, options) {
			super();
			createHtpReader(this, url, options);
		}

		async init() {
			await initHttpReader(this, sendXMLHttpRequest, getXMLHttpRequestData);
			super.init();
		}

		readUint8Array(index, length) {
			return readUint8ArrayHttpReader(this, index, length, sendXMLHttpRequest, getXMLHttpRequestData);
		}
	}

	function createHtpReader(httpReader, url, options) {
		const {
			preventHeadRequest,
			useRangeHeader,
			forceRangeRequests
		} = options;
		options = Object$1.assign({}, options);
		delete options.preventHeadRequest;
		delete options.useRangeHeader;
		delete options.forceRangeRequests;
		delete options.useXHR;
		Object$1.assign(httpReader, {
			url,
			options,
			preventHeadRequest,
			useRangeHeader,
			forceRangeRequests
		});
	}

	async function initHttpReader(httpReader, sendRequest, getRequestData) {
		const {
			url,
			useRangeHeader,
			forceRangeRequests
		} = httpReader;
		if (isHttpFamily(url) && (useRangeHeader || forceRangeRequests)) {
			const { headers } = await sendRequest(HTTP_METHOD_GET, httpReader, getRangeHeaders(httpReader));
			if (!forceRangeRequests && headers.get(HTTP_HEADER_ACCEPT_RANGES) != HTTP_RANGE_UNIT) {
				throw new Error$1(ERR_HTTP_RANGE);
			} else {
				let contentSize;
				const contentRangeHeader = headers.get(HTTP_HEADER_CONTENT_RANGE);
				if (contentRangeHeader) {
					const splitHeader = contentRangeHeader.trim().split(/\s*\/\s*/);
					if (splitHeader.length) {
						const headerValue = splitHeader[1];
						if (headerValue && headerValue != "*") {
							contentSize = Number$1(headerValue);
						}
					}
				}
				if (contentSize === UNDEFINED_VALUE) {
					await getContentLength(httpReader, sendRequest, getRequestData);
				} else {
					httpReader.size = contentSize;
				}
			}
		} else {
			await getContentLength(httpReader, sendRequest, getRequestData);
		}
	}

	async function readUint8ArrayHttpReader(httpReader, index, length, sendRequest, getRequestData) {
		const {
			useRangeHeader,
			forceRangeRequests,
			options
		} = httpReader;
		if (useRangeHeader || forceRangeRequests) {
			const response = await sendRequest(HTTP_METHOD_GET, httpReader, getRangeHeaders(httpReader, index, length));
			if (response.status != 206) {
				throw new Error$1(ERR_HTTP_RANGE);
			}
			return new Uint8Array$1(await response.arrayBuffer());
		} else {
			const { data } = httpReader;
			if (!data) {
				await getRequestData(httpReader, options);
			}
			return new Uint8Array$1(httpReader.data.subarray(index, index + length));
		}
	}

	function getRangeHeaders(httpReader, index = 0, length = 1) {
		return Object$1.assign({}, getHeaders(httpReader), { [HTTP_HEADER_RANGE]: HTTP_RANGE_UNIT + "=" + index + "-" + (index + length - 1) });
	}

	function getHeaders({ options }) {
		const { headers } = options;
		if (headers) {
			if (Symbol.iterator in headers) {
				return Object$1.fromEntries(headers);
			} else {
				return headers;
			}
		}
	}

	async function getFetchRequestData(httpReader) {
		await getRequestData(httpReader, sendFetchRequest);
	}

	async function getXMLHttpRequestData(httpReader) {
		await getRequestData(httpReader, sendXMLHttpRequest);
	}

	async function getRequestData(httpReader, sendRequest) {
		const response = await sendRequest(HTTP_METHOD_GET, httpReader, getHeaders(httpReader));
		httpReader.data = new Uint8Array$1(await response.arrayBuffer());
		if (!httpReader.size) {
			httpReader.size = httpReader.data.length;
		}
	}

	async function getContentLength(httpReader, sendRequest, getRequestData) {
		if (httpReader.preventHeadRequest) {
			await getRequestData(httpReader, httpReader.options);
		} else {
			const response = await sendRequest(HTTP_METHOD_HEAD, httpReader, getHeaders(httpReader));
			const contentLength = response.headers.get(HTTP_HEADER_CONTENT_LENGTH);
			if (contentLength) {
				httpReader.size = Number$1(contentLength);
			} else {
				await getRequestData(httpReader, httpReader.options);
			}
		}
	}

	async function sendFetchRequest(method, { options, url }, headers) {
		const response = await fetch(url, Object$1.assign({}, options, { method, headers }));
		if (response.status < 400) {
			return response;
		} else {
			throw response.status == 416 ? new Error$1(ERR_HTTP_RANGE) : new Error$1(ERR_HTTP_STATUS + (response.statusText || response.status));
		}
	}

	function sendXMLHttpRequest(method, { url }, headers) {
		return new Promise$1((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.addEventListener("load", () => {
				if (request.status < 400) {
					const headers = [];
					request.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(header => {
						const splitHeader = header.trim().split(/\s*:\s*/);
						splitHeader[0] = splitHeader[0].trim().replace(/^[a-z]|-[a-z]/g, value => value.toUpperCase());
						headers.push(splitHeader);
					});
					resolve({
						status: request.status,
						arrayBuffer: () => request.response,
						headers: new Map$2(headers)
					});
				} else {
					reject(request.status == 416 ? new Error$1(ERR_HTTP_RANGE) : new Error$1(ERR_HTTP_STATUS + (request.statusText || request.status)));
				}
			}, false);
			request.addEventListener("error", event => reject(event.detail ? event.detail.error : new Error$1("Network error")), false);
			request.open(method, url);
			if (headers) {
				for (const entry of Object$1.entries(headers)) {
					request.setRequestHeader(entry[0], entry[1]);
				}
			}
			request.responseType = "arraybuffer";
			request.send();
		});
	}

	class HttpReader extends Reader {

		constructor(url, options = {}) {
			super();
			Object$1.assign(this, {
				url,
				reader: options.useXHR ? new XHRReader(url, options) : new FetchReader(url, options)
			});
		}

		set size(value) {
			// ignored
		}

		get size() {
			return this.reader.size;
		}

		async init() {
			await this.reader.init();
			super.init();
		}

		readUint8Array(index, length) {
			return this.reader.readUint8Array(index, length);
		}
	}

	class HttpRangeReader extends HttpReader {

		constructor(url, options = {}) {
			options.useRangeHeader = true;
			super(url, options);
		}
	}


	class Uint8ArrayReader extends Reader {

		constructor(array) {
			super();
			Object$1.assign(this, {
				array,
				size: array.length
			});
		}

		readUint8Array(index, length) {
			return this.array.slice(index, index + length);
		}
	}

	class Uint8ArrayWriter extends Writer {

		init(initSize = 0) {
			Object$1.assign(this, {
				offset: 0,
				array: new Uint8Array$1(initSize)
			});
			super.init();
		}

		writeUint8Array(array) {
			const writer = this;
			if (writer.offset + array.length > writer.array.length) {
				const previousArray = writer.array;
				writer.array = new Uint8Array$1(previousArray.length + array.length);
				writer.array.set(previousArray);
			}
			writer.array.set(array, writer.offset);
			writer.offset += array.length;
		}

		getData() {
			return this.array;
		}
	}

	class SplitDataReader extends Reader {

		constructor(readers) {
			super();
			this.readers = readers;
		}

		async init() {
			const reader = this;
			const { readers } = reader;
			reader.lastDiskNumber = 0;
			reader.lastDiskOffset = 0;
			await Promise$1.all(readers.map(async (diskReader, indexDiskReader) => {
				await diskReader.init();
				if (indexDiskReader != readers.length - 1) {
					reader.lastDiskOffset += diskReader.size;
				}
				reader.size += diskReader.size;
			}));
			super.init();
		}

		async readUint8Array(offset, length, diskNumber = 0) {
			const reader = this;
			const { readers } = this;
			let result;
			let currentDiskNumber = diskNumber;
			if (currentDiskNumber == -1) {
				currentDiskNumber = readers.length - 1;
			}
			let currentReaderOffset = offset;
			while (currentReaderOffset >= readers[currentDiskNumber].size) {
				currentReaderOffset -= readers[currentDiskNumber].size;
				currentDiskNumber++;
			}
			const currentReader = readers[currentDiskNumber];
			const currentReaderSize = currentReader.size;
			if (currentReaderOffset + length <= currentReaderSize) {
				result = await readUint8Array(currentReader, currentReaderOffset, length);
			} else {
				const chunkLength = currentReaderSize - currentReaderOffset;
				result = new Uint8Array$1(length);
				result.set(await readUint8Array(currentReader, currentReaderOffset, chunkLength));
				result.set(await reader.readUint8Array(offset + chunkLength, length - chunkLength, diskNumber), chunkLength);
			}
			reader.lastDiskNumber = Math$1.max(currentDiskNumber, reader.lastDiskNumber);
			return result;
		}
	}

	class SplitDataWriter extends Stream {

		constructor(writerGenerator, maxSize = 4294967295) {
			super();
			const zipWriter = this;
			Object$1.assign(zipWriter, {
				diskNumber: 0,
				diskOffset: 0,
				size: 0,
				maxSize,
				availableSize: maxSize
			});
			let diskSourceWriter, diskWritable, diskWriter;
			const writable = new WritableStream({
				async write(chunk) {
					const { availableSize } = zipWriter;
					if (!diskWriter) {
						const { value, done } = await writerGenerator.next();
						if (done && !value) {
							throw new Error$1(ERR_ITERATOR_COMPLETED_TOO_SOON);
						} else {
							diskSourceWriter = value;
							diskSourceWriter.size = 0;
							if (diskSourceWriter.maxSize) {
								zipWriter.maxSize = diskSourceWriter.maxSize;
							}
							zipWriter.availableSize = zipWriter.maxSize;
							await initStream(diskSourceWriter);
							diskWritable = value.writable;
							diskWriter = diskWritable.getWriter();
						}
						await this.write(chunk);
					} else if (chunk.length >= availableSize) {
						await writeChunk(chunk.slice(0, availableSize));
						await closeDisk();
						zipWriter.diskOffset += diskSourceWriter.size;
						zipWriter.diskNumber++;
						diskWriter = null;
						await this.write(chunk.slice(availableSize));
					} else {
						await writeChunk(chunk);
					}
				},
				async close() {
					await diskWriter.ready;
					await closeDisk();
				}
			});
			Object$1.defineProperty(zipWriter, PROPERTY_NAME_WRITABLE, {
				get() {
					return writable;
				}
			});

			async function writeChunk(chunk) {
				const chunkLength = chunk.length;
				if (chunkLength) {
					await diskWriter.ready;
					await diskWriter.write(chunk);
					diskSourceWriter.size += chunkLength;
					zipWriter.size += chunkLength;
					zipWriter.availableSize -= chunkLength;
				}
			}

			async function closeDisk() {
				diskWritable.size = diskSourceWriter.size;
				await diskWriter.close();
			}
		}
	}

	function isHttpFamily(url) {
		const { baseURL } = getConfiguration();
		const { protocol } = new URL$2(url, baseURL);
		return protocol == "http:" || protocol == "https:";
	}

	async function initStream(stream, initSize) {
		if (stream.init && !stream.initialized) {
			await stream.init(initSize);
		}
	}

	function initReader(reader) {
		if (Array$1.isArray(reader)) {
			reader = new SplitDataReader(reader);
		}
		if (reader instanceof ReadableStream) {
			reader = {
				readable: reader
			};
		}
		return reader;
	}

	function initWriter(writer) {
		if (writer.writable === UNDEFINED_VALUE && typeof writer.next == FUNCTION_TYPE$1) {
			writer = new SplitDataWriter(writer);
		}
		if (writer instanceof WritableStream) {
			writer = {
				writable: writer
			};
		}
		const { writable } = writer;
		if (writable.size === UNDEFINED_VALUE) {
			writable.size = 0;
		}
		const splitZipFile = writer instanceof SplitDataWriter;
		if (!splitZipFile) {
			Object$1.assign(writer, {
				diskNumber: 0,
				diskOffset: 0,
				availableSize: Infinity,
				maxSize: Infinity
			});
		}
		return writer;
	}

	function readUint8Array(reader, offset, size, diskNumber) {
		return reader.readUint8Array(offset, size, diskNumber);
	}

	const SplitZipReader = SplitDataReader;
	const SplitZipWriter = SplitDataWriter;

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	/* global TextDecoder */

	const CP437 = "\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ".split("");
	const VALID_CP437 = CP437.length == 256;

	function decodeCP437(stringValue) {
		if (VALID_CP437) {
			let result = "";
			for (let indexCharacter = 0; indexCharacter < stringValue.length; indexCharacter++) {
				result += CP437[stringValue[indexCharacter]];
			}
			return result;
		} else {
			return new TextDecoder$2().decode(stringValue);
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	function decodeText(value, encoding) {
		if (encoding && encoding.trim().toLowerCase() == "cp437") {
			return decodeCP437(value);
		} else {
			return new TextDecoder$2(encoding).decode(value);
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const PROPERTY_NAME_FILENAME = "filename";
	const PROPERTY_NAME_RAW_FILENAME = "rawFilename";
	const PROPERTY_NAME_COMMENT = "comment";
	const PROPERTY_NAME_RAW_COMMENT = "rawComment";
	const PROPERTY_NAME_UNCOMPPRESSED_SIZE = "uncompressedSize";
	const PROPERTY_NAME_COMPPRESSED_SIZE = "compressedSize";
	const PROPERTY_NAME_OFFSET = "offset";
	const PROPERTY_NAME_DISK_NUMBER_START = "diskNumberStart";
	const PROPERTY_NAME_LAST_MODIFICATION_DATE = "lastModDate";
	const PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE = "rawLastModDate";
	const PROPERTY_NAME_LAST_ACCESS_DATE = "lastAccessDate";
	const PROPERTY_NAME_RAW_LAST_ACCESS_DATE = "rawLastAccessDate";
	const PROPERTY_NAME_CREATION_DATE = "creationDate";
	const PROPERTY_NAME_RAW_CREATION_DATE = "rawCreationDate";
	const PROPERTY_NAME_INTERNAL_FILE_ATTRIBUTE = "internalFileAttribute";
	const PROPERTY_NAME_EXTERNAL_FILE_ATTRIBUTE = "externalFileAttribute";
	const PROPERTY_NAME_MS_DOS_COMPATIBLE = "msDosCompatible";
	const PROPERTY_NAME_ZIP64 = "zip64";

	const PROPERTY_NAMES = [
		PROPERTY_NAME_FILENAME, PROPERTY_NAME_RAW_FILENAME, PROPERTY_NAME_COMPPRESSED_SIZE, PROPERTY_NAME_UNCOMPPRESSED_SIZE,
		PROPERTY_NAME_LAST_MODIFICATION_DATE, PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE, PROPERTY_NAME_COMMENT, PROPERTY_NAME_RAW_COMMENT,
		PROPERTY_NAME_LAST_ACCESS_DATE, PROPERTY_NAME_CREATION_DATE, PROPERTY_NAME_OFFSET, PROPERTY_NAME_DISK_NUMBER_START,
		PROPERTY_NAME_DISK_NUMBER_START, PROPERTY_NAME_INTERNAL_FILE_ATTRIBUTE, PROPERTY_NAME_EXTERNAL_FILE_ATTRIBUTE,
		PROPERTY_NAME_MS_DOS_COMPATIBLE, PROPERTY_NAME_ZIP64,
		"directory", "bitFlag", "encrypted", "signature", "filenameUTF8", "commentUTF8", "compressionMethod", "version", "versionMadeBy",
		"extraField", "rawExtraField", "extraFieldZip64", "extraFieldUnicodePath", "extraFieldUnicodeComment", "extraFieldAES", "extraFieldNTFS",
		"extraFieldExtendedTimestamp"];

	class Entry {

		constructor(data) {
			PROPERTY_NAMES.forEach(name => this[name] = data[name]);
		}

	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const ERR_BAD_FORMAT = "File format is not recognized";
	const ERR_EOCDR_NOT_FOUND = "End of central directory not found";
	const ERR_EOCDR_ZIP64_NOT_FOUND = "End of Zip64 central directory not found";
	const ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND = "End of Zip64 central directory locator not found";
	const ERR_CENTRAL_DIRECTORY_NOT_FOUND = "Central directory header not found";
	const ERR_LOCAL_FILE_HEADER_NOT_FOUND = "Local file header not found";
	const ERR_EXTRAFIELD_ZIP64_NOT_FOUND = "Zip64 extra field not found";
	const ERR_ENCRYPTED = "File contains encrypted entry";
	const ERR_UNSUPPORTED_ENCRYPTION = "Encryption method not supported";
	const ERR_UNSUPPORTED_COMPRESSION = "Compression method not supported";
	const ERR_SPLIT_ZIP_FILE = "Split zip file";
	const CHARSET_UTF8 = "utf-8";
	const CHARSET_CP437 = "cp437";
	const ZIP64_PROPERTIES = [
		[PROPERTY_NAME_UNCOMPPRESSED_SIZE, MAX_32_BITS],
		[PROPERTY_NAME_COMPPRESSED_SIZE, MAX_32_BITS],
		[PROPERTY_NAME_OFFSET, MAX_32_BITS],
		[PROPERTY_NAME_DISK_NUMBER_START, MAX_16_BITS]
	];
	const ZIP64_EXTRACTION = {
		[MAX_16_BITS]: {
			getValue: getUint32,
			bytes: 4
		},
		[MAX_32_BITS]: {
			getValue: getBigUint64,
			bytes: 8
		}
	};

	class ZipReader {

		constructor(reader, options = {}) {
			Object$1.assign(this, {
				reader: initReader(reader),
				options,
				config: getConfiguration()
			});
		}

		async* getEntriesGenerator(options = {}) {
			const zipReader = this;
			let { reader } = zipReader;
			const { config } = zipReader;
			await initStream(reader);
			if (reader.size === UNDEFINED_VALUE || !reader.readUint8Array) {
				reader = new BlobReader(await new Response(reader.readable).blob());
				await initStream(reader);
			}
			if (reader.size < END_OF_CENTRAL_DIR_LENGTH) {
				throw new Error$1(ERR_BAD_FORMAT);
			}
			reader.chunkSize = getChunkSize(config);
			const endOfDirectoryInfo = await seekSignature(reader, END_OF_CENTRAL_DIR_SIGNATURE, reader.size, END_OF_CENTRAL_DIR_LENGTH, MAX_16_BITS * 16);
			if (!endOfDirectoryInfo) {
				const signatureArray = await readUint8Array(reader, 0, 4);
				const signatureView = getDataView$1(signatureArray);
				if (getUint32(signatureView) == SPLIT_ZIP_FILE_SIGNATURE) {
					throw new Error$1(ERR_SPLIT_ZIP_FILE);
				} else {
					throw new Error$1(ERR_EOCDR_NOT_FOUND);
				}
			}
			const endOfDirectoryView = getDataView$1(endOfDirectoryInfo);
			let directoryDataLength = getUint32(endOfDirectoryView, 12);
			let directoryDataOffset = getUint32(endOfDirectoryView, 16);
			const commentOffset = endOfDirectoryInfo.offset;
			const commentLength = getUint16(endOfDirectoryView, 20);
			const appendedDataOffset = commentOffset + END_OF_CENTRAL_DIR_LENGTH + commentLength;
			let lastDiskNumber = getUint16(endOfDirectoryView, 4);
			const expectedLastDiskNumber = reader.lastDiskNumber || 0;
			let diskNumber = getUint16(endOfDirectoryView, 6);
			let filesLength = getUint16(endOfDirectoryView, 8);
			let prependedDataLength = 0;
			let startOffset = 0;
			if (directoryDataOffset == MAX_32_BITS || directoryDataLength == MAX_32_BITS || filesLength == MAX_16_BITS || diskNumber == MAX_16_BITS) {
				const endOfDirectoryLocatorArray = await readUint8Array(reader, endOfDirectoryInfo.offset - ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH, ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH);
				const endOfDirectoryLocatorView = getDataView$1(endOfDirectoryLocatorArray);
				if (getUint32(endOfDirectoryLocatorView, 0) != ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE) {
					throw new Error$1(ERR_EOCDR_ZIP64_NOT_FOUND);
				}
				directoryDataOffset = getBigUint64(endOfDirectoryLocatorView, 8);
				let endOfDirectoryArray = await readUint8Array(reader, directoryDataOffset, ZIP64_END_OF_CENTRAL_DIR_LENGTH, -1);
				let endOfDirectoryView = getDataView$1(endOfDirectoryArray);
				const expectedDirectoryDataOffset = endOfDirectoryInfo.offset - ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH - ZIP64_END_OF_CENTRAL_DIR_LENGTH;
				if (getUint32(endOfDirectoryView, 0) != ZIP64_END_OF_CENTRAL_DIR_SIGNATURE && directoryDataOffset != expectedDirectoryDataOffset) {
					const originalDirectoryDataOffset = directoryDataOffset;
					directoryDataOffset = expectedDirectoryDataOffset;
					prependedDataLength = directoryDataOffset - originalDirectoryDataOffset;
					endOfDirectoryArray = await readUint8Array(reader, directoryDataOffset, ZIP64_END_OF_CENTRAL_DIR_LENGTH, -1);
					endOfDirectoryView = getDataView$1(endOfDirectoryArray);
				}
				if (getUint32(endOfDirectoryView, 0) != ZIP64_END_OF_CENTRAL_DIR_SIGNATURE) {
					throw new Error$1(ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND);
				}
				if (lastDiskNumber == MAX_16_BITS) {
					lastDiskNumber = getUint32(endOfDirectoryView, 16);
				}
				if (diskNumber == MAX_16_BITS) {
					diskNumber = getUint32(endOfDirectoryView, 20);
				}
				if (filesLength == MAX_16_BITS) {
					filesLength = getBigUint64(endOfDirectoryView, 32);
				}
				if (directoryDataLength == MAX_32_BITS) {
					directoryDataLength = getBigUint64(endOfDirectoryView, 40);
				}
				directoryDataOffset -= directoryDataLength;
			}
			if (expectedLastDiskNumber != lastDiskNumber) {
				throw new Error$1(ERR_SPLIT_ZIP_FILE);
			}
			if (directoryDataOffset < 0 || directoryDataOffset >= reader.size) {
				throw new Error$1(ERR_BAD_FORMAT);
			}
			let offset = 0;
			let directoryArray = await readUint8Array(reader, directoryDataOffset, directoryDataLength, diskNumber);
			let directoryView = getDataView$1(directoryArray);
			if (directoryDataLength) {
				const expectedDirectoryDataOffset = endOfDirectoryInfo.offset - directoryDataLength;
				if (getUint32(directoryView, offset) != CENTRAL_FILE_HEADER_SIGNATURE && directoryDataOffset != expectedDirectoryDataOffset) {
					const originalDirectoryDataOffset = directoryDataOffset;
					directoryDataOffset = expectedDirectoryDataOffset;
					prependedDataLength = directoryDataOffset - originalDirectoryDataOffset;
					directoryArray = await readUint8Array(reader, directoryDataOffset, directoryDataLength, diskNumber);
					directoryView = getDataView$1(directoryArray);
				}
			}
			const expectedDirectoryDataLength = endOfDirectoryInfo.offset - directoryDataOffset - (reader.lastDiskOffset || 0);
			if (directoryDataLength != expectedDirectoryDataLength && expectedDirectoryDataLength >= 0) {
				directoryDataLength = expectedDirectoryDataLength;
				directoryArray = await readUint8Array(reader, directoryDataOffset, directoryDataLength, diskNumber);
				directoryView = getDataView$1(directoryArray);
			}
			if (directoryDataOffset < 0 || directoryDataOffset >= reader.size) {
				throw new Error$1(ERR_BAD_FORMAT);
			}
			const filenameEncoding = getOptionValue$1(zipReader, options, "filenameEncoding");
			const commentEncoding = getOptionValue$1(zipReader, options, "commentEncoding");
			for (let indexFile = 0; indexFile < filesLength; indexFile++) {
				const fileEntry = new ZipEntry(reader, config, zipReader.options);
				if (getUint32(directoryView, offset) != CENTRAL_FILE_HEADER_SIGNATURE) {
					throw new Error$1(ERR_CENTRAL_DIRECTORY_NOT_FOUND);
				}
				readCommonHeader(fileEntry, directoryView, offset + 6);
				const languageEncodingFlag = Boolean(fileEntry.bitFlag.languageEncodingFlag);
				const filenameOffset = offset + 46;
				const extraFieldOffset = filenameOffset + fileEntry.filenameLength;
				const commentOffset = extraFieldOffset + fileEntry.extraFieldLength;
				const versionMadeBy = getUint16(directoryView, offset + 4);
				const msDosCompatible = (versionMadeBy & 0) == 0;
				const rawFilename = directoryArray.subarray(filenameOffset, extraFieldOffset);
				const commentLength = getUint16(directoryView, offset + 32);
				const endOffset = commentOffset + commentLength;
				const rawComment = directoryArray.subarray(commentOffset, endOffset);
				const filenameUTF8 = languageEncodingFlag;
				const commentUTF8 = languageEncodingFlag;
				const directory = msDosCompatible && ((getUint8(directoryView, offset + 38) & FILE_ATTR_MSDOS_DIR_MASK) == FILE_ATTR_MSDOS_DIR_MASK);
				const offsetFileEntry = getUint32(directoryView, offset + 42) + prependedDataLength;
				Object$1.assign(fileEntry, {
					versionMadeBy,
					msDosCompatible,
					compressedSize: 0,
					uncompressedSize: 0,
					commentLength,
					directory,
					offset: offsetFileEntry,
					diskNumberStart: getUint16(directoryView, offset + 34),
					internalFileAttribute: getUint16(directoryView, offset + 36),
					externalFileAttribute: getUint32(directoryView, offset + 38),
					rawFilename,
					filenameUTF8,
					commentUTF8,
					rawExtraField: directoryArray.subarray(extraFieldOffset, commentOffset)
				});
				const [filename, comment] = await Promise$1.all([
					decodeText(rawFilename, filenameUTF8 ? CHARSET_UTF8 : filenameEncoding || CHARSET_CP437),
					decodeText(rawComment, commentUTF8 ? CHARSET_UTF8 : commentEncoding || CHARSET_CP437)
				]);
				Object$1.assign(fileEntry, {
					rawComment,
					filename,
					comment,
					directory: directory || filename.endsWith(DIRECTORY_SIGNATURE)
				});
				startOffset = Math$1.max(offsetFileEntry, startOffset);
				await readCommonFooter(fileEntry, fileEntry, directoryView, offset + 6);
				const entry = new Entry(fileEntry);
				entry.getData = (writer, options) => fileEntry.getData(writer, entry, options);
				offset = endOffset;
				const { onprogress } = options;
				if (onprogress) {
					try {
						await onprogress(indexFile + 1, filesLength, new Entry(fileEntry));
					} catch (_error) {
						// ignored
					}
				}
				yield entry;
			}
			const extractPrependedData = getOptionValue$1(zipReader, options, "extractPrependedData");
			const extractAppendedData = getOptionValue$1(zipReader, options, "extractAppendedData");
			if (extractPrependedData) {
				zipReader.prependedData = startOffset > 0 ? await readUint8Array(reader, 0, startOffset) : new Uint8Array$1();
			}
			zipReader.comment = commentLength ? await readUint8Array(reader, commentOffset + END_OF_CENTRAL_DIR_LENGTH, commentLength) : new Uint8Array$1();
			if (extractAppendedData) {
				zipReader.appendedData = appendedDataOffset < reader.size ? await readUint8Array(reader, appendedDataOffset, reader.size - appendedDataOffset) : new Uint8Array$1();
			}
			return true;
		}

		async getEntries(options = {}) {
			const entries = [];
			for await (const entry of this.getEntriesGenerator(options)) {
				entries.push(entry);
			}
			return entries;
		}

		async close() {
		}
	}

	class ZipEntry {

		constructor(reader, config, options) {
			Object$1.assign(this, {
				reader,
				config,
				options
			});
		}

		async getData(writer, fileEntry, options = {}) {
			const zipEntry = this;
			const {
				reader,
				offset,
				diskNumberStart,
				extraFieldAES,
				compressionMethod,
				config,
				bitFlag,
				signature,
				rawLastModDate,
				uncompressedSize,
				compressedSize
			} = zipEntry;
			const localDirectory = fileEntry.localDirectory = {};
			const dataArray = await readUint8Array(reader, offset, 30, diskNumberStart);
			const dataView = getDataView$1(dataArray);
			let password = getOptionValue$1(zipEntry, options, "password");
			password = password && password.length && password;
			if (extraFieldAES) {
				if (extraFieldAES.originalCompressionMethod != COMPRESSION_METHOD_AES) {
					throw new Error$1(ERR_UNSUPPORTED_COMPRESSION);
				}
			}
			if (compressionMethod != COMPRESSION_METHOD_STORE && compressionMethod != COMPRESSION_METHOD_DEFLATE) {
				throw new Error$1(ERR_UNSUPPORTED_COMPRESSION);
			}
			if (getUint32(dataView, 0) != LOCAL_FILE_HEADER_SIGNATURE) {
				throw new Error$1(ERR_LOCAL_FILE_HEADER_NOT_FOUND);
			}
			readCommonHeader(localDirectory, dataView, 4);
			localDirectory.rawExtraField = localDirectory.extraFieldLength ?
				await readUint8Array(reader, offset + 30 + localDirectory.filenameLength, localDirectory.extraFieldLength, diskNumberStart) :
				new Uint8Array$1();
			await readCommonFooter(zipEntry, localDirectory, dataView, 4, true);
			Object$1.assign(fileEntry, {
				lastAccessDate: localDirectory.lastAccessDate,
				creationDate: localDirectory.creationDate
			});
			const encrypted = zipEntry.encrypted && localDirectory.encrypted;
			const zipCrypto = encrypted && !extraFieldAES;
			if (encrypted) {
				if (!zipCrypto && extraFieldAES.strength === UNDEFINED_VALUE) {
					throw new Error$1(ERR_UNSUPPORTED_ENCRYPTION);
				} else if (!password) {
					throw new Error$1(ERR_ENCRYPTED);
				}
			}
			const dataOffset = offset + 30 + localDirectory.filenameLength + localDirectory.extraFieldLength;
			const size = compressedSize;
			const readable = reader.readable;
			Object$1.assign(readable, {
				diskNumberStart,
				offset: dataOffset,
				size
			});
			const signal = getOptionValue$1(zipEntry, options, "signal");
			const checkPasswordOnly = getOptionValue$1(zipEntry, options, "checkPasswordOnly");
			if (checkPasswordOnly) {
				writer = new WritableStream();
			}
			writer = initWriter(writer);
			await initStream(writer, uncompressedSize);
			const { writable } = writer;
			const { onstart, onprogress, onend } = options;
			const workerOptions = {
				options: {
					codecType: CODEC_INFLATE,
					password,
					zipCrypto,
					encryptionStrength: extraFieldAES && extraFieldAES.strength,
					signed: getOptionValue$1(zipEntry, options, "checkSignature"),
					passwordVerification: zipCrypto && (bitFlag.dataDescriptor ? ((rawLastModDate >>> 8) & 0xFF) : ((signature >>> 24) & 0xFF)),
					signature,
					compressed: compressionMethod != 0,
					encrypted,
					useWebWorkers: getOptionValue$1(zipEntry, options, "useWebWorkers"),
					useCompressionStream: getOptionValue$1(zipEntry, options, "useCompressionStream"),
					transferStreams: getOptionValue$1(zipEntry, options, "transferStreams"),
					checkPasswordOnly
				},
				config,
				streamOptions: { signal, size, onstart, onprogress, onend }
			};
			let outputSize = 0;
			try {
				({ outputSize } = (await runWorker({ readable, writable }, workerOptions)));
			} catch (error) {
				if (!checkPasswordOnly || error.message != ERR_ABORT_CHECK_PASSWORD) {
					throw error;
				}
			} finally {
				const preventClose = getOptionValue$1(zipEntry, options, "preventClose");
				writable.size += outputSize;
				if (!preventClose && !writable.locked) {
					await writable.getWriter().close();
				}
			}
			return checkPasswordOnly ? undefined : writer.getData ? writer.getData() : writable;
		}
	}

	function readCommonHeader(directory, dataView, offset) {
		const rawBitFlag = directory.rawBitFlag = getUint16(dataView, offset + 2);
		const encrypted = (rawBitFlag & BITFLAG_ENCRYPTED) == BITFLAG_ENCRYPTED;
		const rawLastModDate = getUint32(dataView, offset + 6);
		Object$1.assign(directory, {
			encrypted,
			version: getUint16(dataView, offset),
			bitFlag: {
				level: (rawBitFlag & BITFLAG_LEVEL) >> 1,
				dataDescriptor: (rawBitFlag & BITFLAG_DATA_DESCRIPTOR) == BITFLAG_DATA_DESCRIPTOR,
				languageEncodingFlag: (rawBitFlag & BITFLAG_LANG_ENCODING_FLAG) == BITFLAG_LANG_ENCODING_FLAG
			},
			rawLastModDate,
			lastModDate: getDate(rawLastModDate),
			filenameLength: getUint16(dataView, offset + 22),
			extraFieldLength: getUint16(dataView, offset + 24)
		});
	}

	async function readCommonFooter(fileEntry, directory, dataView, offset, localDirectory) {
		const { rawExtraField } = directory;
		const extraField = directory.extraField = new Map$2();
		const rawExtraFieldView = getDataView$1(new Uint8Array$1(rawExtraField));
		let offsetExtraField = 0;
		try {
			while (offsetExtraField < rawExtraField.length) {
				const type = getUint16(rawExtraFieldView, offsetExtraField);
				const size = getUint16(rawExtraFieldView, offsetExtraField + 2);
				extraField.set(type, {
					type,
					data: rawExtraField.slice(offsetExtraField + 4, offsetExtraField + 4 + size)
				});
				offsetExtraField += 4 + size;
			}
		} catch (_error) {
			// ignored
		}
		const compressionMethod = getUint16(dataView, offset + 4);
		Object$1.assign(directory, {
			signature: getUint32(dataView, offset + 10),
			uncompressedSize: getUint32(dataView, offset + 18),
			compressedSize: getUint32(dataView, offset + 14)
		});
		const extraFieldZip64 = extraField.get(EXTRAFIELD_TYPE_ZIP64);
		if (extraFieldZip64) {
			readExtraFieldZip64(extraFieldZip64, directory);
			directory.extraFieldZip64 = extraFieldZip64;
		}
		const extraFieldUnicodePath = extraField.get(EXTRAFIELD_TYPE_UNICODE_PATH);
		if (extraFieldUnicodePath) {
			await readExtraFieldUnicode(extraFieldUnicodePath, PROPERTY_NAME_FILENAME, PROPERTY_NAME_RAW_FILENAME, directory, fileEntry);
			directory.extraFieldUnicodePath = extraFieldUnicodePath;
		}
		const extraFieldUnicodeComment = extraField.get(EXTRAFIELD_TYPE_UNICODE_COMMENT);
		if (extraFieldUnicodeComment) {
			await readExtraFieldUnicode(extraFieldUnicodeComment, PROPERTY_NAME_COMMENT, PROPERTY_NAME_RAW_COMMENT, directory, fileEntry);
			directory.extraFieldUnicodeComment = extraFieldUnicodeComment;
		}
		const extraFieldAES = extraField.get(EXTRAFIELD_TYPE_AES);
		if (extraFieldAES) {
			readExtraFieldAES(extraFieldAES, directory, compressionMethod);
			directory.extraFieldAES = extraFieldAES;
		} else {
			directory.compressionMethod = compressionMethod;
		}
		const extraFieldNTFS = extraField.get(EXTRAFIELD_TYPE_NTFS);
		if (extraFieldNTFS) {
			readExtraFieldNTFS(extraFieldNTFS, directory);
			directory.extraFieldNTFS = extraFieldNTFS;
		}
		const extraFieldExtendedTimestamp = extraField.get(EXTRAFIELD_TYPE_EXTENDED_TIMESTAMP);
		if (extraFieldExtendedTimestamp) {
			readExtraFieldExtendedTimestamp(extraFieldExtendedTimestamp, directory, localDirectory);
			directory.extraFieldExtendedTimestamp = extraFieldExtendedTimestamp;
		}
		const extraFieldUSDZ = extraField.get(EXTRAFIELD_TYPE_USDZ);
		if (extraFieldUSDZ) {
			directory.extraFieldUSDZ = extraFieldUSDZ;
		}
	}

	function readExtraFieldZip64(extraFieldZip64, directory) {
		directory.zip64 = true;
		const extraFieldView = getDataView$1(extraFieldZip64.data);
		const missingProperties = ZIP64_PROPERTIES.filter(([propertyName, max]) => directory[propertyName] == max);
		for (let indexMissingProperty = 0, offset = 0; indexMissingProperty < missingProperties.length; indexMissingProperty++) {
			const [propertyName, max] = missingProperties[indexMissingProperty];
			if (directory[propertyName] == max) {
				const extraction = ZIP64_EXTRACTION[max];
				directory[propertyName] = extraFieldZip64[propertyName] = extraction.getValue(extraFieldView, offset);
				offset += extraction.bytes;
			} else if (extraFieldZip64[propertyName]) {
				throw new Error$1(ERR_EXTRAFIELD_ZIP64_NOT_FOUND);
			}
		}
	}

	async function readExtraFieldUnicode(extraFieldUnicode, propertyName, rawPropertyName, directory, fileEntry) {
		const extraFieldView = getDataView$1(extraFieldUnicode.data);
		const crc32 = new Crc32();
		crc32.append(fileEntry[rawPropertyName]);
		const dataViewSignature = getDataView$1(new Uint8Array$1(4));
		dataViewSignature.setUint32(0, crc32.get(), true);
		const signature = getUint32(extraFieldView, 1);
		Object$1.assign(extraFieldUnicode, {
			version: getUint8(extraFieldView, 0),
			[propertyName]: decodeText(extraFieldUnicode.data.subarray(5)),
			valid: !fileEntry.bitFlag.languageEncodingFlag && signature == getUint32(dataViewSignature, 0)
		});
		if (extraFieldUnicode.valid) {
			directory[propertyName] = extraFieldUnicode[propertyName];
			directory[propertyName + "UTF8"] = true;
		}
	}

	function readExtraFieldAES(extraFieldAES, directory, compressionMethod) {
		const extraFieldView = getDataView$1(extraFieldAES.data);
		const strength = getUint8(extraFieldView, 4);
		Object$1.assign(extraFieldAES, {
			vendorVersion: getUint8(extraFieldView, 0),
			vendorId: getUint8(extraFieldView, 2),
			strength,
			originalCompressionMethod: compressionMethod,
			compressionMethod: getUint16(extraFieldView, 5)
		});
		directory.compressionMethod = extraFieldAES.compressionMethod;
	}

	function readExtraFieldNTFS(extraFieldNTFS, directory) {
		const extraFieldView = getDataView$1(extraFieldNTFS.data);
		let offsetExtraField = 4;
		let tag1Data;
		try {
			while (offsetExtraField < extraFieldNTFS.data.length && !tag1Data) {
				const tagValue = getUint16(extraFieldView, offsetExtraField);
				const attributeSize = getUint16(extraFieldView, offsetExtraField + 2);
				if (tagValue == EXTRAFIELD_TYPE_NTFS_TAG1) {
					tag1Data = extraFieldNTFS.data.slice(offsetExtraField + 4, offsetExtraField + 4 + attributeSize);
				}
				offsetExtraField += 4 + attributeSize;
			}
		} catch (_error) {
			// ignored
		}
		try {
			if (tag1Data && tag1Data.length == 24) {
				const tag1View = getDataView$1(tag1Data);
				const rawLastModDate = tag1View.getBigUint64(0, true);
				const rawLastAccessDate = tag1View.getBigUint64(8, true);
				const rawCreationDate = tag1View.getBigUint64(16, true);
				Object$1.assign(extraFieldNTFS, {
					rawLastModDate,
					rawLastAccessDate,
					rawCreationDate
				});
				const lastModDate = getDateNTFS(rawLastModDate);
				const lastAccessDate = getDateNTFS(rawLastAccessDate);
				const creationDate = getDateNTFS(rawCreationDate);
				const extraFieldData = { lastModDate, lastAccessDate, creationDate };
				Object$1.assign(extraFieldNTFS, extraFieldData);
				Object$1.assign(directory, extraFieldData);
			}
		} catch (_error) {
			// ignored
		}
	}

	function readExtraFieldExtendedTimestamp(extraFieldExtendedTimestamp, directory, localDirectory) {
		const extraFieldView = getDataView$1(extraFieldExtendedTimestamp.data);
		const flags = getUint8(extraFieldView, 0);
		const timeProperties = [];
		const timeRawProperties = [];
		if (localDirectory) {
			if ((flags & 0x1) == 0x1) {
				timeProperties.push(PROPERTY_NAME_LAST_MODIFICATION_DATE);
				timeRawProperties.push(PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE);
			}
			if ((flags & 0x2) == 0x2) {
				timeProperties.push(PROPERTY_NAME_LAST_ACCESS_DATE);
				timeRawProperties.push(PROPERTY_NAME_RAW_LAST_ACCESS_DATE);
			}
			if ((flags & 0x4) == 0x4) {
				timeProperties.push(PROPERTY_NAME_CREATION_DATE);
				timeRawProperties.push(PROPERTY_NAME_RAW_CREATION_DATE);
			}
		} else if (extraFieldExtendedTimestamp.data.length >= 5) {
			timeProperties.push(PROPERTY_NAME_LAST_MODIFICATION_DATE);
			timeRawProperties.push(PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE);
		}
		let offset = 1;
		timeProperties.forEach((propertyName, indexProperty) => {
			if (extraFieldExtendedTimestamp.data.length >= offset + 4) {
				const time = getUint32(extraFieldView, offset);
				directory[propertyName] = extraFieldExtendedTimestamp[propertyName] = new Date$1(time * 1000);
				const rawPropertyName = timeRawProperties[indexProperty];
				extraFieldExtendedTimestamp[rawPropertyName] = time;
			}
			offset += 4;
		});
	}

	async function seekSignature(reader, signature, startOffset, minimumBytes, maximumLength) {
		const signatureArray = new Uint8Array$1(4);
		const signatureView = getDataView$1(signatureArray);
		setUint32$1(signatureView, 0, signature);
		const maximumBytes = minimumBytes + maximumLength;
		return (await seek(minimumBytes)) || await seek(Math$1.min(maximumBytes, startOffset));

		async function seek(length) {
			const offset = startOffset - length;
			const bytes = await readUint8Array(reader, offset, length);
			for (let indexByte = bytes.length - minimumBytes; indexByte >= 0; indexByte--) {
				if (bytes[indexByte] == signatureArray[0] && bytes[indexByte + 1] == signatureArray[1] &&
					bytes[indexByte + 2] == signatureArray[2] && bytes[indexByte + 3] == signatureArray[3]) {
					return {
						offset: offset + indexByte,
						buffer: bytes.slice(indexByte, indexByte + minimumBytes).buffer
					};
				}
			}
		}
	}

	function getOptionValue$1(zipReader, options, name) {
		return options[name] === UNDEFINED_VALUE ? zipReader.options[name] : options[name];
	}

	function getDate(timeRaw) {
		const date = (timeRaw & 0xffff0000) >> 16, time = timeRaw & 0x0000ffff;
		try {
			return new Date$1(1980 + ((date & 0xFE00) >> 9), ((date & 0x01E0) >> 5) - 1, date & 0x001F, (time & 0xF800) >> 11, (time & 0x07E0) >> 5, (time & 0x001F) * 2, 0);
		} catch (_error) {
			// ignored
		}
	}

	function getDateNTFS(timeRaw) {
		return new Date$1((Number$1((timeRaw / BigInt(10000)) - BigInt(11644473600000))));
	}

	function getUint8(view, offset) {
		return view.getUint8(offset);
	}

	function getUint16(view, offset) {
		return view.getUint16(offset, true);
	}

	function getUint32(view, offset) {
		return view.getUint32(offset, true);
	}

	function getBigUint64(view, offset) {
		return Number$1(view.getBigUint64(offset, true));
	}

	function setUint32$1(view, offset, value) {
		view.setUint32(offset, value, true);
	}

	function getDataView$1(array) {
		return new DataView$1(array.buffer);
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const ERR_DUPLICATED_NAME = "File already exists";
	const ERR_INVALID_COMMENT = "Zip file comment exceeds 64KB";
	const ERR_INVALID_ENTRY_COMMENT = "File entry comment exceeds 64KB";
	const ERR_INVALID_ENTRY_NAME = "File entry name exceeds 64KB";
	const ERR_INVALID_VERSION = "Version exceeds 65535";
	const ERR_INVALID_ENCRYPTION_STRENGTH = "The strength must equal 1, 2, or 3";
	const ERR_INVALID_EXTRAFIELD_TYPE = "Extra field type exceeds 65535";
	const ERR_INVALID_EXTRAFIELD_DATA = "Extra field data exceeds 64KB";
	const ERR_UNSUPPORTED_FORMAT = "Zip64 is not supported (make sure 'keepOrder' is set to 'true')";

	const EXTRAFIELD_DATA_AES = new Uint8Array$1([0x07, 0x00, 0x02, 0x00, 0x41, 0x45, 0x03, 0x00, 0x00]);

	let workers = 0;
	const pendingEntries = [];

	class ZipWriter {

		constructor(writer, options = {}) {
			writer = initWriter(writer);
			Object$1.assign(this, {
				writer,
				addSplitZipSignature: writer instanceof SplitDataWriter,
				options,
				config: getConfiguration(),
				files: new Map$2(),
				filenames: new Set$3(),
				offset: writer.writable.size,
				pendingEntriesSize: 0,
				pendingAddFileCalls: new Set$3(),
				bufferedWrites: 0
			});
		}

		async add(name = "", reader, options = {}) {
			const zipWriter = this;
			const {
				pendingAddFileCalls,
				config
			} = zipWriter;
			if (workers < config.maxWorkers) {
				workers++;
			} else {
				await new Promise$1(resolve => pendingEntries.push(resolve));
			}
			let promiseAddFile;
			try {
				name = name.trim();
				if (zipWriter.filenames.has(name)) {
					throw new Error$1(ERR_DUPLICATED_NAME);
				}
				zipWriter.filenames.add(name);
				promiseAddFile = addFile$1(zipWriter, name, reader, options);
				pendingAddFileCalls.add(promiseAddFile);
				return await promiseAddFile;
			} catch (error) {
				zipWriter.filenames.delete(name);
				throw error;
			} finally {
				pendingAddFileCalls.delete(promiseAddFile);
				const pendingEntry = pendingEntries.shift();
				if (pendingEntry) {
					pendingEntry();
				} else {
					workers--;
				}
			}
		}

		async close(comment = new Uint8Array$1(), options = {}) {
			const zipWriter = this;
			const { pendingAddFileCalls, writer } = this;
			const { writable } = writer;
			while (pendingAddFileCalls.size) {
				await Promise$1.all(Array$1.from(pendingAddFileCalls));
			}
			await closeFile(this, comment, options);
			const preventClose = getOptionValue(zipWriter, options, "preventClose");
			if (!preventClose) {
				await writable.getWriter().close();
			}
			return writer.getData ? writer.getData() : writable;
		}
	}

	async function addFile$1(zipWriter, name, reader, options) {
		name = name.trim();
		if (options.directory && (!name.endsWith(DIRECTORY_SIGNATURE))) {
			name += DIRECTORY_SIGNATURE;
		} else {
			options.directory = name.endsWith(DIRECTORY_SIGNATURE);
		}
		const rawFilename = encodeText(name);
		if (getLength(rawFilename) > MAX_16_BITS) {
			throw new Error$1(ERR_INVALID_ENTRY_NAME);
		}
		const comment = options.comment || "";
		const rawComment = encodeText(comment);
		if (getLength(rawComment) > MAX_16_BITS) {
			throw new Error$1(ERR_INVALID_ENTRY_COMMENT);
		}
		const version = getOptionValue(zipWriter, options, "version", VERSION_DEFLATE);
		if (version > MAX_16_BITS) {
			throw new Error$1(ERR_INVALID_VERSION);
		}
		const versionMadeBy = getOptionValue(zipWriter, options, "versionMadeBy", 20);
		if (versionMadeBy > MAX_16_BITS) {
			throw new Error$1(ERR_INVALID_VERSION);
		}
		const lastModDate = getOptionValue(zipWriter, options, PROPERTY_NAME_LAST_MODIFICATION_DATE, new Date$1());
		const lastAccessDate = getOptionValue(zipWriter, options, PROPERTY_NAME_LAST_ACCESS_DATE);
		const creationDate = getOptionValue(zipWriter, options, PROPERTY_NAME_CREATION_DATE);
		const msDosCompatible = getOptionValue(zipWriter, options, PROPERTY_NAME_MS_DOS_COMPATIBLE, true);
		const internalFileAttribute = getOptionValue(zipWriter, options, PROPERTY_NAME_INTERNAL_FILE_ATTRIBUTE, 0);
		const externalFileAttribute = getOptionValue(zipWriter, options, PROPERTY_NAME_EXTERNAL_FILE_ATTRIBUTE, 0);
		const password = getOptionValue(zipWriter, options, "password");
		const encryptionStrength = getOptionValue(zipWriter, options, "encryptionStrength", 3);
		const zipCrypto = getOptionValue(zipWriter, options, "zipCrypto");
		const extendedTimestamp = getOptionValue(zipWriter, options, "extendedTimestamp", true);
		const keepOrder = getOptionValue(zipWriter, options, "keepOrder", true);
		const level = getOptionValue(zipWriter, options, "level");
		const useWebWorkers = getOptionValue(zipWriter, options, "useWebWorkers");
		const bufferedWrite = getOptionValue(zipWriter, options, "bufferedWrite");
		const dataDescriptorSignature = getOptionValue(zipWriter, options, "dataDescriptorSignature", false);
		const signal = getOptionValue(zipWriter, options, "signal");
		const useCompressionStream = getOptionValue(zipWriter, options, "useCompressionStream");
		let dataDescriptor = getOptionValue(zipWriter, options, "dataDescriptor", true);
		let zip64 = getOptionValue(zipWriter, options, PROPERTY_NAME_ZIP64);
		if (password !== UNDEFINED_VALUE && encryptionStrength !== UNDEFINED_VALUE && (encryptionStrength < 1 || encryptionStrength > 3)) {
			throw new Error$1(ERR_INVALID_ENCRYPTION_STRENGTH);
		}
		let rawExtraField = new Uint8Array$1();
		const { extraField } = options;
		if (extraField) {
			let extraFieldSize = 0;
			let offset = 0;
			extraField.forEach(data => extraFieldSize += 4 + getLength(data));
			rawExtraField = new Uint8Array$1(extraFieldSize);
			extraField.forEach((data, type) => {
				if (type > MAX_16_BITS) {
					throw new Error$1(ERR_INVALID_EXTRAFIELD_TYPE);
				}
				if (getLength(data) > MAX_16_BITS) {
					throw new Error$1(ERR_INVALID_EXTRAFIELD_DATA);
				}
				arraySet(rawExtraField, new Uint16Array([type]), offset);
				arraySet(rawExtraField, new Uint16Array([getLength(data)]), offset + 2);
				arraySet(rawExtraField, data, offset + 4);
				offset += 4 + getLength(data);
			});
		}
		let maximumCompressedSize = 0;
		let maximumEntrySize = 0;
		let uncompressedSize = 0;
		const zip64Enabled = zip64 === true;
		if (reader) {
			reader = initReader(reader);
			await initStream(reader);
			if (reader.size === UNDEFINED_VALUE) {
				dataDescriptor = true;
				if (zip64 || zip64 === UNDEFINED_VALUE) {
					zip64 = true;
					uncompressedSize = maximumCompressedSize = MAX_32_BITS;
				}
			} else {
				uncompressedSize = reader.size;
				maximumCompressedSize = getMaximumCompressedSize(uncompressedSize);
			}
		}
		const { diskOffset, diskNumber, maxSize } = zipWriter.writer;
		const zip64UncompressedSize = zip64Enabled || uncompressedSize >= MAX_32_BITS;
		const zip64CompressedSize = zip64Enabled || maximumCompressedSize >= MAX_32_BITS;
		const zip64Offset = zip64Enabled || zipWriter.offset + zipWriter.pendingEntriesSize - diskOffset >= MAX_32_BITS;
		const supportZip64SplitFile = getOptionValue(zipWriter, options, "supportZip64SplitFile", true);
		const zip64DiskNumberStart = (supportZip64SplitFile && zip64Enabled) || diskNumber + Math$1.ceil(zipWriter.pendingEntriesSize / maxSize) >= MAX_16_BITS;
		if (zip64Offset || zip64UncompressedSize || zip64CompressedSize || zip64DiskNumberStart) {
			if (zip64 === false || !keepOrder) {
				throw new Error$1(ERR_UNSUPPORTED_FORMAT);
			} else {
				zip64 = true;
			}
		}
		zip64 = zip64 || false;
		options = Object$1.assign({}, options, {
			rawFilename,
			rawComment,
			version,
			versionMadeBy,
			lastModDate,
			lastAccessDate,
			creationDate,
			rawExtraField,
			zip64,
			zip64UncompressedSize,
			zip64CompressedSize,
			zip64Offset,
			zip64DiskNumberStart,
			password,
			level,
			useWebWorkers,
			encryptionStrength,
			extendedTimestamp,
			zipCrypto,
			bufferedWrite,
			keepOrder,
			dataDescriptor,
			dataDescriptorSignature,
			signal,
			msDosCompatible,
			internalFileAttribute,
			externalFileAttribute,
			useCompressionStream
		});
		const headerInfo = getHeaderInfo(options);
		const dataDescriptorInfo = getDataDescriptorInfo(options);
		const metadataSize = getLength(headerInfo.localHeaderArray, dataDescriptorInfo.dataDescriptorArray);
		maximumEntrySize = metadataSize + maximumCompressedSize;
		if (zipWriter.options.usdz) {
			maximumEntrySize += maximumEntrySize + 64;
		}
		zipWriter.pendingEntriesSize += maximumEntrySize;
		let fileEntry;
		try {
			fileEntry = await getFileEntry(zipWriter, name, reader, { headerInfo, dataDescriptorInfo, metadataSize }, options);
		} finally {
			zipWriter.pendingEntriesSize -= maximumEntrySize;
		}
		Object$1.assign(fileEntry, { name, comment, extraField });
		return new Entry(fileEntry);
	}

	async function getFileEntry(zipWriter, name, reader, entryInfo, options) {
		const {
			files,
			writer
		} = zipWriter;
		const {
			keepOrder,
			dataDescriptor,
			signal
		} = options;
		const {
			headerInfo
		} = entryInfo;
		const { usdz } = zipWriter.options;
		const previousFileEntry = Array$1.from(files.values()).pop();
		let fileEntry = {};
		let bufferedWrite;
		let releaseLockWriter;
		let releaseLockCurrentFileEntry;
		let writingBufferedEntryData;
		let writingEntryData;
		let fileWriter;
		files.set(name, fileEntry);
		try {
			let lockPreviousFileEntry;
			if (keepOrder) {
				lockPreviousFileEntry = previousFileEntry && previousFileEntry.lock;
				requestLockCurrentFileEntry();
			}
			if ((options.bufferedWrite || zipWriter.writerLocked || (zipWriter.bufferedWrites && keepOrder) || !dataDescriptor) && !usdz) {
				fileWriter = new BlobWriter();
				fileWriter.writable.size = 0;
				bufferedWrite = true;
				zipWriter.bufferedWrites++;
				await initStream(writer);
			} else {
				fileWriter = writer;
				await requestLockWriter();
			}
			await initStream(fileWriter);
			const { writable } = writer;
			let { diskOffset } = writer;
			if (zipWriter.addSplitZipSignature) {
				delete zipWriter.addSplitZipSignature;
				const signatureArray = new Uint8Array$1(4);
				const signatureArrayView = getDataView(signatureArray);
				setUint32(signatureArrayView, 0, SPLIT_ZIP_FILE_SIGNATURE);
				await writeData$1(writable, signatureArray);
				zipWriter.offset += 4;
			}
			if (!bufferedWrite) {
				await lockPreviousFileEntry;
				await skipDiskIfNeeded(writable);
			}
			const { diskNumber } = writer;
			writingEntryData = true;
			fileEntry.diskNumberStart = diskNumber;
			if (usdz) {
				appendExtraFieldUSDZ(entryInfo, zipWriter.offset - diskOffset);
			}
			fileEntry = await createFileEntry(reader, fileWriter, fileEntry, entryInfo, zipWriter.config, options);
			writingEntryData = false;
			files.set(name, fileEntry);
			fileEntry.filename = name;
			if (bufferedWrite) {
				await fileWriter.writable.getWriter().close();
				let blob = await fileWriter.getData();
				await lockPreviousFileEntry;
				await requestLockWriter();
				writingBufferedEntryData = true;
				if (!dataDescriptor) {
					blob = await writeExtraHeaderInfo(fileEntry, blob, writable, options);
				}
				await skipDiskIfNeeded(writable);
				fileEntry.diskNumberStart = writer.diskNumber;
				diskOffset = writer.diskOffset;
				await blob.stream().pipeTo(writable, { preventClose: true, preventAbort: true, signal });
				writable.size += blob.size;
				writingBufferedEntryData = false;
			}
			fileEntry.offset = zipWriter.offset - diskOffset;
			if (fileEntry.zip64) {
				setZip64ExtraInfo(fileEntry, options);
			} else if (fileEntry.offset >= MAX_32_BITS) {
				throw new Error$1(ERR_UNSUPPORTED_FORMAT);
			}
			zipWriter.offset += fileEntry.length;
			return fileEntry;
		} catch (error) {
			if ((bufferedWrite && writingBufferedEntryData) || (!bufferedWrite && writingEntryData)) {
				zipWriter.hasCorruptedEntries = true;
				if (error) {
					try {
						error.corruptedEntry = true;
					} catch (_error) {
						// ignored
					}
				}
				if (bufferedWrite) {
					zipWriter.offset += fileWriter.writable.size;
				} else {
					zipWriter.offset = fileWriter.writable.size;
				}
			}
			files.delete(name);
			throw error;
		} finally {
			if (bufferedWrite) {
				zipWriter.bufferedWrites--;
			}
			if (releaseLockCurrentFileEntry) {
				releaseLockCurrentFileEntry();
			}
			if (releaseLockWriter) {
				releaseLockWriter();
			}
		}

		function requestLockCurrentFileEntry() {
			fileEntry.lock = new Promise$1(resolve => releaseLockCurrentFileEntry = resolve);
		}

		async function requestLockWriter() {
			zipWriter.writerLocked = true;
			const { lockWriter } = zipWriter;
			zipWriter.lockWriter = new Promise$1(resolve => releaseLockWriter = () => {
				zipWriter.writerLocked = false;
				resolve();
			});
			await lockWriter;
		}

		async function skipDiskIfNeeded(writable) {
			if (headerInfo.localHeaderArray.length > writer.availableSize) {
				writer.availableSize = 0;
				await writeData$1(writable, new Uint8Array$1());
			}
		}
	}

	async function createFileEntry(reader, writer, { diskNumberStart, lock }, entryInfo, config, options) {
		const {
			headerInfo,
			dataDescriptorInfo,
			metadataSize
		} = entryInfo;
		const {
			localHeaderArray,
			headerArray,
			lastModDate,
			rawLastModDate,
			encrypted,
			compressed,
			version,
			compressionMethod,
			rawExtraFieldExtendedTimestamp,
			extraFieldExtendedTimestampFlag,
			rawExtraFieldNTFS,
			rawExtraFieldAES
		} = headerInfo;
		const { dataDescriptorArray } = dataDescriptorInfo;
		const {
			rawFilename,
			lastAccessDate,
			creationDate,
			password,
			level,
			zip64,
			zip64UncompressedSize,
			zip64CompressedSize,
			zip64Offset,
			zip64DiskNumberStart,
			zipCrypto,
			dataDescriptor,
			directory,
			versionMadeBy,
			rawComment,
			rawExtraField,
			useWebWorkers,
			onstart,
			onprogress,
			onend,
			signal,
			encryptionStrength,
			extendedTimestamp,
			msDosCompatible,
			internalFileAttribute,
			externalFileAttribute,
			useCompressionStream
		} = options;
		const fileEntry = {
			lock,
			versionMadeBy,
			zip64,
			directory: Boolean(directory),
			filenameUTF8: true,
			rawFilename,
			commentUTF8: true,
			rawComment,
			rawExtraFieldExtendedTimestamp,
			rawExtraFieldNTFS,
			rawExtraFieldAES,
			rawExtraField,
			extendedTimestamp,
			msDosCompatible,
			internalFileAttribute,
			externalFileAttribute,
			diskNumberStart
		};
		let compressedSize = 0;
		let uncompressedSize = 0;
		let signature;
		const { writable } = writer;
		if (reader) {
			reader.chunkSize = getChunkSize(config);
			await writeData$1(writable, localHeaderArray);
			const readable = reader.readable;
			const size = readable.size = reader.size;
			const workerOptions = {
				options: {
					codecType: CODEC_DEFLATE,
					level,
					password,
					encryptionStrength,
					zipCrypto: encrypted && zipCrypto,
					passwordVerification: encrypted && zipCrypto && (rawLastModDate >> 8) & 0xFF,
					signed: true,
					compressed,
					encrypted,
					useWebWorkers,
					useCompressionStream,
					transferStreams: false
				},
				config,
				streamOptions: { signal, size, onstart, onprogress, onend }
			};
			const result = await runWorker({ readable, writable }, workerOptions);
			writable.size += result.size;
			signature = result.signature;
			uncompressedSize = reader.size = readable.size;
			compressedSize = result.size;
		} else {
			await writeData$1(writable, localHeaderArray);
		}
		let rawExtraFieldZip64;
		if (zip64) {
			let rawExtraFieldZip64Length = 4;
			if (zip64UncompressedSize) {
				rawExtraFieldZip64Length += 8;
			}
			if (zip64CompressedSize) {
				rawExtraFieldZip64Length += 8;
			}
			if (zip64Offset) {
				rawExtraFieldZip64Length += 8;
			}
			if (zip64DiskNumberStart) {
				rawExtraFieldZip64Length += 4;
			}
			rawExtraFieldZip64 = new Uint8Array$1(rawExtraFieldZip64Length);
		} else {
			rawExtraFieldZip64 = new Uint8Array$1();
		}
		setEntryInfo({
			signature,
			rawExtraFieldZip64,
			compressedSize,
			uncompressedSize,
			headerInfo,
			dataDescriptorInfo
		}, options);
		if (dataDescriptor) {
			await writeData$1(writable, dataDescriptorArray);
		}
		Object$1.assign(fileEntry, {
			uncompressedSize,
			compressedSize,
			lastModDate,
			rawLastModDate,
			creationDate,
			lastAccessDate,
			encrypted,
			length: metadataSize + compressedSize,
			compressionMethod,
			version,
			headerArray,
			signature,
			rawExtraFieldZip64,
			extraFieldExtendedTimestampFlag,
			zip64UncompressedSize,
			zip64CompressedSize,
			zip64Offset,
			zip64DiskNumberStart
		});
		return fileEntry;
	}

	function getHeaderInfo(options) {
		const {
			rawFilename,
			lastModDate,
			lastAccessDate,
			creationDate,
			password,
			level,
			zip64,
			zipCrypto,
			dataDescriptor,
			directory,
			rawExtraField,
			encryptionStrength,
			extendedTimestamp
		} = options;
		const compressed = level !== 0 && !directory;
		const encrypted = Boolean(password && getLength(password));
		let version = options.version;
		let rawExtraFieldAES;
		if (encrypted && !zipCrypto) {
			rawExtraFieldAES = new Uint8Array$1(getLength(EXTRAFIELD_DATA_AES) + 2);
			const extraFieldAESView = getDataView(rawExtraFieldAES);
			setUint16(extraFieldAESView, 0, EXTRAFIELD_TYPE_AES);
			arraySet(rawExtraFieldAES, EXTRAFIELD_DATA_AES, 2);
			setUint8(extraFieldAESView, 8, encryptionStrength);
		} else {
			rawExtraFieldAES = new Uint8Array$1();
		}
		let rawExtraFieldNTFS;
		let rawExtraFieldExtendedTimestamp;
		let extraFieldExtendedTimestampFlag;
		if (extendedTimestamp) {
			rawExtraFieldExtendedTimestamp = new Uint8Array$1(9 + (lastAccessDate ? 4 : 0) + (creationDate ? 4 : 0));
			const extraFieldExtendedTimestampView = getDataView(rawExtraFieldExtendedTimestamp);
			setUint16(extraFieldExtendedTimestampView, 0, EXTRAFIELD_TYPE_EXTENDED_TIMESTAMP);
			setUint16(extraFieldExtendedTimestampView, 2, getLength(rawExtraFieldExtendedTimestamp) - 4);
			extraFieldExtendedTimestampFlag = 0x1 + (lastAccessDate ? 0x2 : 0) + (creationDate ? 0x4 : 0);
			setUint8(extraFieldExtendedTimestampView, 4, extraFieldExtendedTimestampFlag);
			let offset = 5;
			setUint32(extraFieldExtendedTimestampView, offset, Math$1.floor(lastModDate.getTime() / 1000));
			offset += 4;
			if (lastAccessDate) {
				setUint32(extraFieldExtendedTimestampView, offset, Math$1.floor(lastAccessDate.getTime() / 1000));
				offset += 4;
			}
			if (creationDate) {
				setUint32(extraFieldExtendedTimestampView, offset, Math$1.floor(creationDate.getTime() / 1000));
			}
			try {
				rawExtraFieldNTFS = new Uint8Array$1(36);
				const extraFieldNTFSView = getDataView(rawExtraFieldNTFS);
				const lastModTimeNTFS = getTimeNTFS(lastModDate);
				setUint16(extraFieldNTFSView, 0, EXTRAFIELD_TYPE_NTFS);
				setUint16(extraFieldNTFSView, 2, 32);
				setUint16(extraFieldNTFSView, 8, EXTRAFIELD_TYPE_NTFS_TAG1);
				setUint16(extraFieldNTFSView, 10, 24);
				setBigUint64(extraFieldNTFSView, 12, lastModTimeNTFS);
				setBigUint64(extraFieldNTFSView, 20, getTimeNTFS(lastAccessDate) || lastModTimeNTFS);
				setBigUint64(extraFieldNTFSView, 28, getTimeNTFS(creationDate) || lastModTimeNTFS);
			} catch (_error) {
				rawExtraFieldNTFS = new Uint8Array$1();
			}
		} else {
			rawExtraFieldNTFS = rawExtraFieldExtendedTimestamp = new Uint8Array$1();
		}
		let bitFlag = BITFLAG_LANG_ENCODING_FLAG;
		if (dataDescriptor) {
			bitFlag = bitFlag | BITFLAG_DATA_DESCRIPTOR;
		}
		let compressionMethod = COMPRESSION_METHOD_STORE;
		if (compressed) {
			compressionMethod = COMPRESSION_METHOD_DEFLATE;
		}
		if (zip64) {
			version = version > VERSION_ZIP64 ? version : VERSION_ZIP64;
		}
		if (encrypted) {
			bitFlag = bitFlag | BITFLAG_ENCRYPTED;
			if (!zipCrypto) {
				version = version > VERSION_AES ? version : VERSION_AES;
				compressionMethod = COMPRESSION_METHOD_AES;
				if (compressed) {
					rawExtraFieldAES[9] = COMPRESSION_METHOD_DEFLATE;
				}
			}
		}
		const headerArray = new Uint8Array$1(26);
		const headerView = getDataView(headerArray);
		setUint16(headerView, 0, version);
		setUint16(headerView, 2, bitFlag);
		setUint16(headerView, 4, compressionMethod);
		const dateArray = new Uint32Array$1(1);
		const dateView = getDataView(dateArray);
		let lastModDateMsDos;
		if (lastModDate < MIN_DATE) {
			lastModDateMsDos = MIN_DATE;
		} else if (lastModDate > MAX_DATE) {
			lastModDateMsDos = MAX_DATE;
		} else {
			lastModDateMsDos = lastModDate;
		}
		setUint16(dateView, 0, (((lastModDateMsDos.getHours() << 6) | lastModDateMsDos.getMinutes()) << 5) | lastModDateMsDos.getSeconds() / 2);
		setUint16(dateView, 2, ((((lastModDateMsDos.getFullYear() - 1980) << 4) | (lastModDateMsDos.getMonth() + 1)) << 5) | lastModDateMsDos.getDate());
		const rawLastModDate = dateArray[0];
		setUint32(headerView, 6, rawLastModDate);
		setUint16(headerView, 22, getLength(rawFilename));
		const extraFieldLength = getLength(rawExtraFieldAES, rawExtraFieldExtendedTimestamp, rawExtraFieldNTFS, rawExtraField);
		setUint16(headerView, 24, extraFieldLength);
		const localHeaderArray = new Uint8Array$1(30 + getLength(rawFilename) + extraFieldLength);
		const localHeaderView = getDataView(localHeaderArray);
		setUint32(localHeaderView, 0, LOCAL_FILE_HEADER_SIGNATURE);
		arraySet(localHeaderArray, headerArray, 4);
		arraySet(localHeaderArray, rawFilename, 30);
		arraySet(localHeaderArray, rawExtraFieldAES, 30 + getLength(rawFilename));
		arraySet(localHeaderArray, rawExtraFieldExtendedTimestamp, 30 + getLength(rawFilename, rawExtraFieldAES));
		arraySet(localHeaderArray, rawExtraFieldNTFS, 30 + getLength(rawFilename, rawExtraFieldAES, rawExtraFieldExtendedTimestamp));
		arraySet(localHeaderArray, rawExtraField, 30 + getLength(rawFilename, rawExtraFieldAES, rawExtraFieldExtendedTimestamp, rawExtraFieldNTFS));
		return {
			localHeaderArray,
			headerArray,
			headerView,
			lastModDate,
			rawLastModDate,
			encrypted,
			compressed,
			version,
			compressionMethod,
			extraFieldExtendedTimestampFlag,
			rawExtraFieldExtendedTimestamp,
			rawExtraFieldNTFS,
			rawExtraFieldAES,
			extraFieldLength
		};
	}

	function appendExtraFieldUSDZ(entryInfo, zipWriterOffset) {
		const { headerInfo } = entryInfo;
		let { localHeaderArray, extraFieldLength } = headerInfo;
		let localHeaderArrayView = getDataView(localHeaderArray);
		let extraBytesLength = 64 - ((zipWriterOffset + localHeaderArray.length) % 64);
		if (extraBytesLength < 4) {
			extraBytesLength += 64;
		}
		const rawExtraFieldUSDZ = new Uint8Array$1(extraBytesLength);
		const extraFieldUSDZView = getDataView(rawExtraFieldUSDZ);
		setUint16(extraFieldUSDZView, 0, EXTRAFIELD_TYPE_USDZ);
		setUint16(extraFieldUSDZView, 2, extraBytesLength - 2);
		const previousLocalHeaderArray = localHeaderArray;
		headerInfo.localHeaderArray = localHeaderArray = new Uint8Array$1(previousLocalHeaderArray.length + extraBytesLength);
		arraySet(localHeaderArray, previousLocalHeaderArray);
		arraySet(localHeaderArray, rawExtraFieldUSDZ, previousLocalHeaderArray.length);
		localHeaderArrayView = getDataView(localHeaderArray);
		setUint16(localHeaderArrayView, 28, extraFieldLength + extraBytesLength);
		entryInfo.metadataSize += extraBytesLength;
	}

	function getDataDescriptorInfo(options) {
		const {
			zip64,
			dataDescriptor,
			dataDescriptorSignature
		} = options;
		let dataDescriptorArray = new Uint8Array$1();
		let dataDescriptorView, dataDescriptorOffset = 0;
		if (dataDescriptor) {
			dataDescriptorArray = new Uint8Array$1(zip64 ? (dataDescriptorSignature ? 24 : 20) : (dataDescriptorSignature ? 16 : 12));
			dataDescriptorView = getDataView(dataDescriptorArray);
			if (dataDescriptorSignature) {
				dataDescriptorOffset = 4;
				setUint32(dataDescriptorView, 0, DATA_DESCRIPTOR_RECORD_SIGNATURE);
			}
		}
		return {
			dataDescriptorArray,
			dataDescriptorView,
			dataDescriptorOffset
		};
	}

	function setEntryInfo(entryInfo, options) {
		const {
			signature,
			rawExtraFieldZip64,
			compressedSize,
			uncompressedSize,
			headerInfo,
			dataDescriptorInfo
		} = entryInfo;
		const {
			headerView,
			encrypted
		} = headerInfo;
		const {
			dataDescriptorView,
			dataDescriptorOffset
		} = dataDescriptorInfo;
		const {
			zip64,
			zip64UncompressedSize,
			zip64CompressedSize,
			zipCrypto,
			dataDescriptor
		} = options;
		if ((!encrypted || zipCrypto) && signature !== UNDEFINED_VALUE) {
			setUint32(headerView, 10, signature);
			if (dataDescriptor) {
				setUint32(dataDescriptorView, dataDescriptorOffset, signature);
			}
		}
		if (zip64) {
			const rawExtraFieldZip64View = getDataView(rawExtraFieldZip64);
			setUint16(rawExtraFieldZip64View, 0, EXTRAFIELD_TYPE_ZIP64);
			setUint16(rawExtraFieldZip64View, 2, rawExtraFieldZip64.length - 4);
			let rawExtraFieldZip64Offset = 4;
			if (zip64UncompressedSize) {
				setUint32(headerView, 18, MAX_32_BITS);
				setBigUint64(rawExtraFieldZip64View, rawExtraFieldZip64Offset, BigInt(uncompressedSize));
				rawExtraFieldZip64Offset += 8;
			}
			if (zip64CompressedSize) {
				setUint32(headerView, 14, MAX_32_BITS);
				setBigUint64(rawExtraFieldZip64View, rawExtraFieldZip64Offset, BigInt(compressedSize));
			}
			if (dataDescriptor) {
				setBigUint64(dataDescriptorView, dataDescriptorOffset + 4, BigInt(compressedSize));
				setBigUint64(dataDescriptorView, dataDescriptorOffset + 12, BigInt(uncompressedSize));
			}
		} else {
			setUint32(headerView, 14, compressedSize);
			setUint32(headerView, 18, uncompressedSize);
			if (dataDescriptor) {
				setUint32(dataDescriptorView, dataDescriptorOffset + 4, compressedSize);
				setUint32(dataDescriptorView, dataDescriptorOffset + 8, uncompressedSize);
			}
		}
	}

	async function writeExtraHeaderInfo(fileEntry, entryData, writable, { zipCrypto }) {
		let arrayBuffer;
		arrayBuffer = await entryData.slice(0, 26).arrayBuffer();
		if (arrayBuffer.byteLength != 26) {
			arrayBuffer = arrayBuffer.slice(0, 26);
		}
		const arrayBufferView = new DataView$1(arrayBuffer);
		if (!fileEntry.encrypted || zipCrypto) {
			setUint32(arrayBufferView, 14, fileEntry.signature);
		}
		if (fileEntry.zip64) {
			setUint32(arrayBufferView, 18, MAX_32_BITS);
			setUint32(arrayBufferView, 22, MAX_32_BITS);
		} else {
			setUint32(arrayBufferView, 18, fileEntry.compressedSize);
			setUint32(arrayBufferView, 22, fileEntry.uncompressedSize);
		}
		await writeData$1(writable, new Uint8Array$1(arrayBuffer));
		return entryData.slice(arrayBuffer.byteLength);
	}

	function setZip64ExtraInfo(fileEntry, options) {
		const { rawExtraFieldZip64, offset, diskNumberStart } = fileEntry;
		const { zip64UncompressedSize, zip64CompressedSize, zip64Offset, zip64DiskNumberStart } = options;
		const rawExtraFieldZip64View = getDataView(rawExtraFieldZip64);
		let rawExtraFieldZip64Offset = 4;
		if (zip64UncompressedSize) {
			rawExtraFieldZip64Offset += 8;
		}
		if (zip64CompressedSize) {
			rawExtraFieldZip64Offset += 8;
		}
		if (zip64Offset) {
			setBigUint64(rawExtraFieldZip64View, rawExtraFieldZip64Offset, BigInt(offset));
			rawExtraFieldZip64Offset += 8;
		}
		if (zip64DiskNumberStart) {
			setUint32(rawExtraFieldZip64View, rawExtraFieldZip64Offset, diskNumberStart);
		}
	}

	async function closeFile(zipWriter, comment, options) {
		const { files, writer } = zipWriter;
		const { diskOffset, writable } = writer;
		let { diskNumber } = writer;
		let offset = 0;
		let directoryDataLength = 0;
		let directoryOffset = zipWriter.offset - diskOffset;
		let filesLength = files.size;
		for (const [, fileEntry] of files) {
			const {
				rawFilename,
				rawExtraFieldZip64,
				rawExtraFieldAES,
				rawComment,
				rawExtraFieldNTFS,
				rawExtraField,
				extendedTimestamp,
				extraFieldExtendedTimestampFlag,
				lastModDate
			} = fileEntry;
			let rawExtraFieldTimestamp;
			if (extendedTimestamp) {
				rawExtraFieldTimestamp = new Uint8Array$1(9);
				const extraFieldExtendedTimestampView = getDataView(rawExtraFieldTimestamp);
				setUint16(extraFieldExtendedTimestampView, 0, EXTRAFIELD_TYPE_EXTENDED_TIMESTAMP);
				setUint16(extraFieldExtendedTimestampView, 2, 5);
				setUint8(extraFieldExtendedTimestampView, 4, extraFieldExtendedTimestampFlag);
				setUint32(extraFieldExtendedTimestampView, 5, Math$1.floor(lastModDate.getTime() / 1000));
			} else {
				rawExtraFieldTimestamp = new Uint8Array$1();
			}
			fileEntry.rawExtraFieldCDExtendedTimestamp = rawExtraFieldTimestamp;
			directoryDataLength += 46 +
				getLength(
					rawFilename,
					rawComment,
					rawExtraFieldZip64,
					rawExtraFieldAES,
					rawExtraFieldNTFS,
					rawExtraFieldTimestamp,
					rawExtraField);
		}
		const directoryArray = new Uint8Array$1(directoryDataLength);
		const directoryView = getDataView(directoryArray);
		await initStream(writer);
		let directoryDiskOffset = 0;
		for (const [indexFileEntry, fileEntry] of Array$1.from(files.values()).entries()) {
			const {
				offset: fileEntryOffset,
				rawFilename,
				rawExtraFieldZip64,
				rawExtraFieldAES,
				rawExtraFieldCDExtendedTimestamp,
				rawExtraFieldNTFS,
				rawExtraField,
				rawComment,
				versionMadeBy,
				headerArray,
				directory,
				zip64,
				zip64UncompressedSize,
				zip64CompressedSize,
				zip64DiskNumberStart,
				zip64Offset,
				msDosCompatible,
				internalFileAttribute,
				externalFileAttribute,
				diskNumberStart,
				uncompressedSize,
				compressedSize
			} = fileEntry;
			const extraFieldLength = getLength(rawExtraFieldZip64, rawExtraFieldAES, rawExtraFieldCDExtendedTimestamp, rawExtraFieldNTFS, rawExtraField);
			setUint32(directoryView, offset, CENTRAL_FILE_HEADER_SIGNATURE);
			setUint16(directoryView, offset + 4, versionMadeBy);
			const headerView = getDataView(headerArray);
			if (!zip64UncompressedSize) {
				setUint32(headerView, 18, uncompressedSize);
			}
			if (!zip64CompressedSize) {
				setUint32(headerView, 14, compressedSize);
			}
			arraySet(directoryArray, headerArray, offset + 6);
			setUint16(directoryView, offset + 30, extraFieldLength);
			setUint16(directoryView, offset + 32, getLength(rawComment));
			setUint16(directoryView, offset + 34, zip64 && zip64DiskNumberStart ? MAX_16_BITS : diskNumberStart);
			setUint16(directoryView, offset + 36, internalFileAttribute);
			if (externalFileAttribute) {
				setUint32(directoryView, offset + 38, externalFileAttribute);
			} else if (directory && msDosCompatible) {
				setUint8(directoryView, offset + 38, FILE_ATTR_MSDOS_DIR_MASK);
			}
			setUint32(directoryView, offset + 42, zip64 && zip64Offset ? MAX_32_BITS : fileEntryOffset);
			arraySet(directoryArray, rawFilename, offset + 46);
			arraySet(directoryArray, rawExtraFieldZip64, offset + 46 + getLength(rawFilename));
			arraySet(directoryArray, rawExtraFieldAES, offset + 46 + getLength(rawFilename, rawExtraFieldZip64));
			arraySet(directoryArray, rawExtraFieldCDExtendedTimestamp, offset + 46 + getLength(rawFilename, rawExtraFieldZip64, rawExtraFieldAES));
			arraySet(directoryArray, rawExtraFieldNTFS, offset + 46 + getLength(rawFilename, rawExtraFieldZip64, rawExtraFieldAES, rawExtraFieldCDExtendedTimestamp));
			arraySet(directoryArray, rawExtraField, offset + 46 + getLength(rawFilename, rawExtraFieldZip64, rawExtraFieldAES, rawExtraFieldCDExtendedTimestamp, rawExtraFieldNTFS));
			arraySet(directoryArray, rawComment, offset + 46 + getLength(rawFilename) + extraFieldLength);
			const directoryEntryLength = 46 + getLength(rawFilename, rawComment) + extraFieldLength;
			if (offset - directoryDiskOffset > writer.availableSize) {
				writer.availableSize = 0;
				await writeData$1(writable, directoryArray.slice(directoryDiskOffset, offset));
				directoryDiskOffset = offset;
			}
			offset += directoryEntryLength;
			if (options.onprogress) {
				try {
					await options.onprogress(indexFileEntry + 1, files.size, new Entry(fileEntry));
				} catch (_error) {
					// ignored
				}
			}
		}
		await writeData$1(writable, directoryDiskOffset ? directoryArray.slice(directoryDiskOffset) : directoryArray);
		let lastDiskNumber = writer.diskNumber;
		const { availableSize } = writer;
		if (availableSize < END_OF_CENTRAL_DIR_LENGTH) {
			lastDiskNumber++;
		}
		let zip64 = getOptionValue(zipWriter, options, "zip64");
		if (directoryOffset >= MAX_32_BITS || directoryDataLength >= MAX_32_BITS || filesLength >= MAX_16_BITS || lastDiskNumber >= MAX_16_BITS) {
			if (zip64 === false) {
				throw new Error$1(ERR_UNSUPPORTED_FORMAT);
			} else {
				zip64 = true;
			}
		}
		const endOfdirectoryArray = new Uint8Array$1(zip64 ? ZIP64_END_OF_CENTRAL_DIR_TOTAL_LENGTH : END_OF_CENTRAL_DIR_LENGTH);
		const endOfdirectoryView = getDataView(endOfdirectoryArray);
		offset = 0;
		if (zip64) {
			setUint32(endOfdirectoryView, 0, ZIP64_END_OF_CENTRAL_DIR_SIGNATURE);
			setBigUint64(endOfdirectoryView, 4, BigInt(44));
			setUint16(endOfdirectoryView, 12, 45);
			setUint16(endOfdirectoryView, 14, 45);
			setUint32(endOfdirectoryView, 16, lastDiskNumber);
			setUint32(endOfdirectoryView, 20, diskNumber);
			setBigUint64(endOfdirectoryView, 24, BigInt(filesLength));
			setBigUint64(endOfdirectoryView, 32, BigInt(filesLength));
			setBigUint64(endOfdirectoryView, 40, BigInt(directoryDataLength));
			setBigUint64(endOfdirectoryView, 48, BigInt(directoryOffset));
			setUint32(endOfdirectoryView, 56, ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE);
			setBigUint64(endOfdirectoryView, 64, BigInt(directoryOffset) + BigInt(directoryDataLength));
			setUint32(endOfdirectoryView, 72, lastDiskNumber + 1);
			const supportZip64SplitFile = getOptionValue(zipWriter, options, "supportZip64SplitFile", true);
			if (supportZip64SplitFile) {
				lastDiskNumber = MAX_16_BITS;
				diskNumber = MAX_16_BITS;
			}
			filesLength = MAX_16_BITS;
			directoryOffset = MAX_32_BITS;
			directoryDataLength = MAX_32_BITS;
			offset += ZIP64_END_OF_CENTRAL_DIR_LENGTH + ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH;
		}
		setUint32(endOfdirectoryView, offset, END_OF_CENTRAL_DIR_SIGNATURE);
		setUint16(endOfdirectoryView, offset + 4, lastDiskNumber);
		setUint16(endOfdirectoryView, offset + 6, diskNumber);
		setUint16(endOfdirectoryView, offset + 8, filesLength);
		setUint16(endOfdirectoryView, offset + 10, filesLength);
		setUint32(endOfdirectoryView, offset + 12, directoryDataLength);
		setUint32(endOfdirectoryView, offset + 16, directoryOffset);
		const commentLength = getLength(comment);
		if (commentLength) {
			if (commentLength <= MAX_16_BITS) {
				setUint16(endOfdirectoryView, offset + 20, commentLength);
			} else {
				throw new Error$1(ERR_INVALID_COMMENT);
			}
		}
		await writeData$1(writable, endOfdirectoryArray);
		if (commentLength) {
			await writeData$1(writable, comment);
		}
	}

	async function writeData$1(writable, array) {
		const streamWriter = writable.getWriter();
		await streamWriter.ready;
		writable.size += getLength(array);
		await streamWriter.write(array);
		streamWriter.releaseLock();
	}

	function getTimeNTFS(date) {
		if (date) {
			return ((BigInt(date.getTime()) + BigInt(11644473600000)) * BigInt(10000));
		}
	}

	function getOptionValue(zipWriter, options, name, defaultValue) {
		const result = options[name] === UNDEFINED_VALUE ? zipWriter.options[name] : options[name];
		return result === UNDEFINED_VALUE ? defaultValue : result;
	}

	function getMaximumCompressedSize(uncompressedSize) {
		return uncompressedSize + (5 * (Math$1.floor(uncompressedSize / 16383) + 1));
	}

	function setUint8(view, offset, value) {
		view.setUint8(offset, value);
	}

	function setUint16(view, offset, value) {
		view.setUint16(offset, value, true);
	}

	function setUint32(view, offset, value) {
		view.setUint32(offset, value, true);
	}

	function setBigUint64(view, offset, value) {
		view.setBigUint64(offset, value, true);
	}

	function arraySet(array, typedArray, offset) {
		array.set(typedArray, offset);
	}

	function getDataView(array) {
		return new DataView$1(array.buffer);
	}

	function getLength(...arrayLikes) {
		let result = 0;
		arrayLikes.forEach(arrayLike => arrayLike && (result += arrayLike.length));
		return result;
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	let baseURL;
	try {
		baseURL = (typeof document === 'undefined' && typeof location === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : typeof document === 'undefined' ? location.href : (document.currentScript && document.currentScript.src || new URL('single-file.js', document.baseURI).href));
	} catch (_error) {
		// ignored
	}
	configure({ baseURL });
	e(configure);

	var zip$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		BlobReader: BlobReader,
		BlobWriter: BlobWriter,
		Data64URIReader: Data64URIReader,
		Data64URIWriter: Data64URIWriter,
		ERR_BAD_FORMAT: ERR_BAD_FORMAT,
		ERR_CENTRAL_DIRECTORY_NOT_FOUND: ERR_CENTRAL_DIRECTORY_NOT_FOUND,
		ERR_DUPLICATED_NAME: ERR_DUPLICATED_NAME,
		ERR_ENCRYPTED: ERR_ENCRYPTED,
		ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND: ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND,
		ERR_EOCDR_NOT_FOUND: ERR_EOCDR_NOT_FOUND,
		ERR_EOCDR_ZIP64_NOT_FOUND: ERR_EOCDR_ZIP64_NOT_FOUND,
		ERR_EXTRAFIELD_ZIP64_NOT_FOUND: ERR_EXTRAFIELD_ZIP64_NOT_FOUND,
		ERR_HTTP_RANGE: ERR_HTTP_RANGE,
		ERR_INVALID_COMMENT: ERR_INVALID_COMMENT,
		ERR_INVALID_ENCRYPTION_STRENGTH: ERR_INVALID_ENCRYPTION_STRENGTH,
		ERR_INVALID_ENTRY_COMMENT: ERR_INVALID_ENTRY_COMMENT,
		ERR_INVALID_ENTRY_NAME: ERR_INVALID_ENTRY_NAME,
		ERR_INVALID_EXTRAFIELD_DATA: ERR_INVALID_EXTRAFIELD_DATA,
		ERR_INVALID_EXTRAFIELD_TYPE: ERR_INVALID_EXTRAFIELD_TYPE,
		ERR_INVALID_PASSWORD: ERR_INVALID_PASSWORD,
		ERR_INVALID_SIGNATURE: ERR_INVALID_SIGNATURE,
		ERR_INVALID_VERSION: ERR_INVALID_VERSION,
		ERR_ITERATOR_COMPLETED_TOO_SOON: ERR_ITERATOR_COMPLETED_TOO_SOON,
		ERR_LOCAL_FILE_HEADER_NOT_FOUND: ERR_LOCAL_FILE_HEADER_NOT_FOUND,
		ERR_SPLIT_ZIP_FILE: ERR_SPLIT_ZIP_FILE,
		ERR_UNSUPPORTED_COMPRESSION: ERR_UNSUPPORTED_COMPRESSION,
		ERR_UNSUPPORTED_ENCRYPTION: ERR_UNSUPPORTED_ENCRYPTION,
		ERR_UNSUPPORTED_FORMAT: ERR_UNSUPPORTED_FORMAT,
		HttpRangeReader: HttpRangeReader,
		HttpReader: HttpReader,
		Reader: Reader,
		SplitDataReader: SplitDataReader,
		SplitDataWriter: SplitDataWriter,
		SplitZipReader: SplitZipReader,
		SplitZipWriter: SplitZipWriter,
		TextReader: TextReader,
		TextWriter: TextWriter,
		Uint8ArrayReader: Uint8ArrayReader,
		Uint8ArrayWriter: Uint8ArrayWriter,
		Writer: Writer,
		ZipReader: ZipReader,
		ZipWriter: ZipWriter,
		configure: configure,
		getMimeType: getMimeType,
		initReader: initReader,
		initShimAsyncCodec: initShimAsyncCodec,
		initStream: initStream,
		initWriter: initWriter,
		readUint8Array: readUint8Array,
		terminateWorkers: terminateWorkers
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	async function extract(content, { password, prompt = () => { }, shadowRootScriptURL, zipOptions = { useWebWorkers: false }, noBlobURL } = {}) {
		const KNOWN_MIMETYPES = {
			"gif": "image/gif",
			"jpg": "image/jpeg",
			"png": "image/png",
			"tif": "image/tiff",
			"tiff": "image/tiff",
			"bmp": "image/bmp",
			"ico": "image/vnd.microsoft.icon",
			"webp": "image/webp",
			"svg": "image/svg+xml",
			"avi": "video/x-msvideo",
			"ogv": "video/ogg",
			"mp4": "video/mp4",
			"mpeg": "video/mpeg",
			"ts": "video/mp2t",
			"webm": "video/webm",
			"3gp": "video/3gpp",
			"3g2": "video/3gpp",
			"mp3": "audio/mpeg",
			"oga": "audio/ogg",
			"mid": "audio/midi",
			"midi": "audio/midi",
			"opus": "audio/opus",
			"wav": "audio/wav",
			"weba": "audio/webm"
		};
		if (Array.isArray(content)) {
			content = new Blob([new Uint8Array(content)]);
		}
		zip.configure(zipOptions);
		const blobReader = new zip.BlobReader(content);
		let resources = [];
		const zipReader = new zip.ZipReader(blobReader);
		const entries = await zipReader.getEntries();
		const options = { password };
		await Promise.all(entries.map(async entry => {
			let dataWriter, content, textContent, name, blob;
			if (!options.password && entry.encrypted) {
				options.password = prompt("Please enter the password to view the page");
			}
			name = entry.filename.match(/^([0-9_]+\/)?(.*)$/)[2];
			if (entry.filename.match(/index\.html$/) || entry.filename.match(/stylesheet_[0-9]+\.css/) || entry.filename.match(/scripts\/[0-9]+\.js/)) {
				dataWriter = new zip.TextWriter();
				textContent = await entry.getData(dataWriter, options);
			} else {
				const extension = entry.filename.match(/\.([^.]+)/);
				let mimeType;
				if (extension && extension[1] && KNOWN_MIMETYPES[extension[1]]) {
					mimeType = KNOWN_MIMETYPES[extension[1]];
				} else {
					mimeType = "application/octet-stream";
				}
				if (entry.filename.match(/frames\//) || noBlobURL) {
					content = await entry.getData(new zip.Data64URIWriter(mimeType), options);
				} else {
					blob = await entry.getData(new zip.BlobWriter(mimeType), options);
					content = URL.createObjectURL(blob);
				}
			}
			resources.push({ filename: entry.filename, name, url: entry.comment, content, blob, textContent, parentResources: [] });
		}));
		await zipReader.close();
		let docContent, origDocContent, url;
		resources = resources.sort((resourceLeft, resourceRight) => resourceRight.filename.length - resourceLeft.filename.length);
		const REGEXP_ESCAPE = /([{}()^$&.*?/+|[\\\\]|\]|-)/g;
		for (const resource of resources) {
			if (resource.textContent !== undefined) {
				let prefixPath = "";
				const prefixPathMatch = resource.filename.match(/(.*\/)[^/]+$/);
				if (prefixPathMatch && prefixPathMatch[1]) {
					prefixPath = prefixPathMatch[1];
				}
				if (resource.filename.match(/^([0-9_]+\/)?index\.html$/)) {
					origDocContent = resource.textContent;
				}
				const isScript = resource.filename.match(/scripts\/[0-9]+\.js/);
				if (!isScript) {
					resources.forEach(innerResource => {
						if (innerResource.filename.startsWith(prefixPath) && innerResource.filename != resource.filename) {
							const filename = innerResource.filename.substring(prefixPath.length);
							if (!filename.match(/manifest\.json$/)) {
								const searchRegExp = new RegExp(filename.replace(REGEXP_ESCAPE, "\\$1"), "g");
								const position = resource.textContent.search(searchRegExp);
								if (position != -1) {
									innerResource.parentResources.push(resource.filename);
									resource.textContent = resource.textContent.replace(searchRegExp, innerResource.content);
								}
							}
						}
					});
				}
				let mimeType;
				if (resource.filename.match(/stylesheet_[0-9]+\.css/)) {
					mimeType = "text/css";
				} else if (isScript) {
					mimeType = "text/javascript";
				} else if (resource.filename.match(/index\.html$/)) {
					mimeType = "text/html";
					if (shadowRootScriptURL) {
						resource.textContent = resource.textContent.replace(/<script data-template-shadow-root.*<\/script>/g, "<script data-template-shadow-root src=" + shadowRootScriptURL + "></" + "script>");
					}
				}
				if (resource.filename.match(/^([0-9_]+\/)?index\.html$/)) {
					docContent = resource.textContent;
					url = resource.url;
				} else {
					const reader = new FileReader();
					if (resource.textContent) {
						reader.readAsDataURL(new Blob([resource.textContent], { type: mimeType + ";charset=utf-8" }));
						resource.content = await new Promise((resolve, reject) => {
							reader.addEventListener("load", () => resolve(reader.result), false);
							reader.addEventListener("error", reject, false);
						});
					} else {
						resource.content = "data:text/plain,";
					}
				}
			}
		}
		return { docContent, origDocContent, resources, url };
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	async function display(document, docContent, { disableFramePointerEvents } = {}) {
		const DISABLED_NOSCRIPT_ATTRIBUTE_NAME = "data-single-filez-disabled-noscript";
		const doc = (new DOMParser()).parseFromString(docContent, "text/html");
		doc.querySelectorAll("noscript:not([" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "])").forEach(element => {
			element.setAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME, element.innerHTML);
			element.textContent = "";
		});
		if (doc.doctype) {
			if (document.doctype) {
				document.replaceChild(doc.doctype, document.doctype);
			} else {
				document.insertBefore(doc.doctype, document.documentElement);
			}
		} else if (document.doctype) {
			document.doctype.remove();
		}
		if (disableFramePointerEvents) {
			doc.querySelectorAll("iframe").forEach(element => {
				const pointerEvents = "pointer-events";
				element.style.setProperty("-sf-" + pointerEvents, element.style.getPropertyValue(pointerEvents), element.style.getPropertyPriority(pointerEvents));
				element.style.setProperty(pointerEvents, "none", "important");
			});
		}
		document.replaceChild(document.importNode(doc.documentElement, true), document.documentElement);
		document.documentElement.setAttribute("data-sfz", "");
		document.querySelectorAll("link[rel*=icon]").forEach(element => element.parentElement.replaceChild(element, element));
		document.open = document.write = document.close = () => { };
		for (let element of Array.from(document.querySelectorAll("script"))) {
			await new Promise(resolve => {
				const scriptElement = document.createElement("script");
				Array.from(element.attributes).forEach(attribute => scriptElement.setAttribute(attribute.name, attribute.value));
				const async = element.getAttribute("async") == "" || element.getAttribute("async") == "async";
				if (element.textContent) {
					scriptElement.textContent = element.textContent;
				} else if (!async) {
					scriptElement.addEventListener("load", resolve);
					scriptElement.addEventListener("error", () => resolve());
				}
				element.parentElement.replaceChild(scriptElement, element);
				if (element.textContent || async) {
					resolve();
				}
			});
		}
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const { Blob: Blob$2, fetch: fetch$2, TextEncoder: TextEncoder$1, DOMParser: DOMParser$2 } = globalThis;

	const NO_COMPRESSION_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf", ".woff2", ".mp4", ".mp3", ".ogg", ".webp", ".webm"];
	const SCRIPT_PATH = "/lib/single-file-zip.min.js";

	const browser$2 = globalThis.browser;

	async function process$9(pageData, options) {
		let script;
		if (options.zipScript) {
			script = options.zipScript;
		} else if (browser$2 && browser$2.runtime && browser$2.runtime.getURL) {
			configure({ workerScripts: { deflate: ["/lib/single-file-z-worker.js"] } });
			script = await (await fetch$2(browser$2.runtime.getURL(SCRIPT_PATH))).text();
		}
		const zipDataWriter = new Uint8ArrayWriter();
		zipDataWriter.init();
		if (options.selfExtractingArchive) {
			let pageContent = "";
			if (options.includeBOM && !options.extractDataFromPage) {
				pageContent += "\ufeff";
			}
			const charset = options.extractDataFromPage ? "windows-1252" : "utf-8";
			const pageDataTitle = pageData.title.replace(/</g, "&lt;").replace(/>/g, "&gt;") || "";
			const title = options.extractDataFromPage ? "" : pageDataTitle;
			pageContent += pageData.doctype + "<html data-sfz><meta charset=" + charset + "><title>" + title + "</title>";
			if (options.insertCanonicalLink) {
				pageContent += "<link rel=canonical href=\"" + options.url + "\">";
			}
			if (options.insertMetaNoIndex) {
				pageContent += "<meta name=robots content=noindex>";
			}
			if (pageData.viewport) {
				pageContent += "<meta name=\"viewport\" content=" + JSON.stringify(pageData.viewport) + ">";
			}
			pageContent += "<body hidden>";
			pageContent += "<div id='sfz-wait-message'>Please wait...</div>";
			pageContent += "<div id='sfz-error-message'><strong>Error</strong>: Cannot open the page from the filesystem.";
			pageContent += "<ul style='line-height:20px;'>";
			pageContent += "<li style='margin-bottom:10px'><strong>Chrome</strong>: Install <a href='https://chrome.google.com/webstore/detail/singlefile/mpiodijhokgodhhofbcjdecpffjipkle'>SingleFile</a> and enable the option \"Allow access to file URLs\" in the details page of the extension (chrome://extensions/?id=offkdfbbigofcgdokjemgjpdockaafjg).</li>";
			pageContent += "<li style='margin-bottom:10px'><strong>Microsoft Edge</strong>: Install <a href='https://microsoftedge.microsoft.com/addons/detail/singlefile/efnbkdcfmcmnhlkaijjjmhjjgladedno'>SingleFile</a> and enable the option \"Allow access to file URLs\" in the details page of the extension (edge://extensions/?id=gofneaifncimeglaecpnanbnmnpfjekk).</li>";
			pageContent += "<li><strong>Safari</strong>: Select \"Security > Disable Local File Restrictions\" in the \"Develop > Developer settings\" menu.</li></ul></div>";
			if (options.insertTextBody) {
				const doc = (new DOMParser$2()).parseFromString(pageData.content, "text/html");
				doc.body.querySelectorAll("style, script, noscript").forEach(element => element.remove());
				let textBody = "";
				if (options.extractDataFromPage) {
					textBody += pageDataTitle + "\n\n";
				}
				textBody += doc.body.innerText;
				doc.body.querySelectorAll("single-file-note").forEach(node => {
					const template = node.querySelector("template");
					if (template) {
						const docTemplate = (new DOMParser$2()).parseFromString(template.innerHTML, "text/html");
						textBody += "\n" + docTemplate.body.querySelector("textarea").value;
					}
				});
				textBody = textBody.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n +/g, "\n").replace(/\n\n\n+/g, "\n\n").trim();
				pageContent += "\n<main hidden>\n" + textBody + "\n</main>\n";
			}
			if (options.extractDataFromPageTags) {
				pageContent += options.extractDataFromPageTags[0];
			} else {
				pageContent += "<xmp>";
			}
			await writeData(zipDataWriter.writable, (new TextEncoder$1()).encode(pageContent));
		}
		const zipWriter = new ZipWriter(zipDataWriter, { bufferedWrite: true, keepOrder: false });
		let startOffset = zipDataWriter.offset;
		pageData.url = options.url;
		pageData.archiveTime = (new Date()).toISOString();
		await addPageResources(zipWriter, pageData, { password: options.password }, options.createRootDirectory ? String(Date.now()) + "_" + (options.tabId || 0) + "/" : "", options.url);
		const data = await zipWriter.close(null, { preventClose: true });
		if (options.selfExtractingArchive) {
			const insertionsCRLF = [];
			const substitutionsLF = [];
			if (options.extractDataFromPage) {
				if (!options.extractDataFromPageTags) {
					const textContent = new TextDecoder().decode(data);
					const matchEndTagXMP = textContent.match(/<\/\s*xmp>/i);
					if (matchEndTagXMP) {
						const matchEndTagComment = textContent.match(/-->/i);
						if (matchEndTagComment) {
							const matchTextAreaTagComment = textContent.match(/<\/\s*textarea>/i);
							if (matchTextAreaTagComment) {
								options.extractDataFromPage = false;
								return process$9(pageData, options);
							} else {
								options.extractDataFromPageTags = ["<textarea>", "</textarea>"];
								return process$9(pageData, options);
							}
						} else {
							options.extractDataFromPageTags = ["<!--", "-->"];
							return process$9(pageData, options);
						}
					}
				}
				for (let index = 0; index < data.length; index++) {
					if (data[index] == 13) {
						if (data[index + 1] == 10) {
							insertionsCRLF.push(index - startOffset);
						} else {
							substitutionsLF.push(index - startOffset);
						}
					}
				}
			}
			let pageContent = "";
			if (options.extractDataFromPageTags) {
				pageContent += options.extractDataFromPageTags[1];
			} else {
				pageContent += "</xmp>";
			}
			if (insertionsCRLF.length || substitutionsLF.length) {
				const extraData =
					await arrayToBase64(insertionsCRLF) + "," +
					await arrayToBase64(substitutionsLF) + "," +
					await arrayToBase64([startOffset]);
				pageContent += "<sfz-extra-data>" + extraData + "</sfz-extra-data>";
			}
			script += "document.currentScript.remove();globalThis.bootstrap=(()=>{let bootstrapStarted;return async content=>{if (bootstrapStarted) return bootstrapStarted;bootstrapStarted = (" +
				extract.toString().replace(/\n|\t/g, "") + ")(content,{prompt}).then(({docContent}) => " +
				display.toString().replace(/\n|\t/g, "") + "(document,docContent));return bootstrapStarted;}})();(" +
				getContent.toString().replace(/\n|\t/g, "") + ")().then(globalThis.bootstrap).catch(()=>{});";
			pageContent += "<script>" + script + "</script></body></html>";
			await writeData(zipDataWriter.writable, (new TextEncoder$1()).encode(pageContent));
		}
		await zipDataWriter.writable.close();
		return new Blob$2([zipDataWriter.getData()], { type: "application/octet-stream" });
	}

	async function arrayToBase64(data) {
		const fileReader = new FileReader();
		return await new Promise(resolve => {
			fileReader.onload = event => resolve(event.target.result.substring(37));
			fileReader.readAsDataURL(new Blob$2([new Uint32Array(data)], { type: "application/octet-stream" }));
		});
	}

	async function writeData(writable, array) {
		const streamWriter = writable.getWriter();
		await streamWriter.ready;
		writable.size = array.length;
		await streamWriter.write(array);
		streamWriter.releaseLock();
	}

	async function addPageResources(zipWriter, pageData, options, prefixName, url) {
		const resources = {};
		for (const resourceType of Object.keys(pageData.resources)) {
			for (const data of pageData.resources[resourceType]) {
				data.password = options.password;
				if (data.url && !data.url.startsWith("data:")) {
					resources[data.name] = data.url;
				}
			}
		}
		const jsonContent = JSON.stringify({
			originalUrl: pageData.url,
			title: pageData.title,
			archiveTime: pageData.archiveTime,
			indexFilename: "index.html",
			resources
		}, null, 2);
		await Promise.all([
			Promise.all([
				addFile(zipWriter, prefixName, { name: "index.html", extension: ".html", content: pageData.content, url, password: options.password }),
				addFile(zipWriter, prefixName, { name: "manifest.json", extension: ".json", content: jsonContent, password: options.password })
			]),
			Promise.all(Object.keys(pageData.resources).map(async resourceType =>
				Promise.all(pageData.resources[resourceType].map(data => {
					if (resourceType == "frames") {
						return addPageResources(zipWriter, data, options, prefixName + data.name, data.url);
					} else {
						return addFile(zipWriter, prefixName, data);
					}
				}))
			))
		]);
	}

	async function addFile(zipWriter, prefixName, data) {
		const dataReader = typeof data.content == "string" ? new TextReader(data.content) : new BlobReader(new Blob$2([new Uint8Array(data.content)]));
		const options = { comment: data.url && data.url.startsWith("data:") ? "data:" : data.url, password: data.password, bufferedWrite: true };
		if (NO_COMPRESSION_EXTENSIONS.includes(data.extension)) {
			options.level = 0;
		}
		await zipWriter.add(prefixName + data.name, dataReader, options);
	}

	async function getContent() {
		const { Blob, XMLHttpRequest, fetch, document, setTimeout, clearTimeout, stop } = globalThis;
		const characterMap = new Map([
			[65533, 0], [8364, 128], [8218, 130], [402, 131], [8222, 132], [8230, 133], [8224, 134], [8225, 135], [710, 136], [8240, 137],
			[352, 138], [8249, 139], [338, 140], [381, 142], [8216, 145], [8217, 146], [8220, 147], [8221, 148], [8226, 149], [8211, 150],
			[8212, 151], [732, 152], [8482, 153], [353, 154], [8250, 155], [339, 156], [382, 158], [376, 159]
		]);
		const xhr = new XMLHttpRequest();
		let displayTimeout;
		Array.from(document.documentElement.childNodes).forEach(node => {
			if (node != document.body && node != document.head) {
				node.remove();
			}
		});
		xhr.responseType = "blob";
		xhr.open("GET", "");
		return new Promise((resolve, reject) => {
			xhr.onerror = () => {
				extractPageData().then(resolve).catch(() => {
					displayTimeout = displayMessage("sfz-error-message");
					reject();
				});
			};
			xhr.send();
			xhr.onload = () => {
				displayTimeout = displayMessage("sfz-wait-message");
				stop();
				if (displayTimeout) {
					clearTimeout(displayTimeout);
				}
				resolve(xhr.response);
			};
		});

		function displayMessage(elementId) {
			return setTimeout(() => {
				if (document.getElementById(elementId)) {
					Array.from(document.body.childNodes).forEach(node => {
						if (node.id != elementId) {
							node.remove();
						}
					});
					document.body.hidden = false;
				}
			}, 1500);
		}

		async function extractPageData() {
			const zipDataElement = document.querySelector("sfz-extra-data");
			if (zipDataElement) {
				const dataNode = zipDataElement.previousSibling;
				const zipData = [];
				let { textContent } = dataNode;
				for (let index = 0; index < textContent.length; index++) {
					const charCode = textContent.charCodeAt(index);
					zipData.push(charCode > 255 ? characterMap.get(charCode) : charCode);
				}
				const [insertionsCRLFData, substitutionsLFData, startOffsetData] = zipDataElement.textContent.split(",");
				const insertionsCRLF = await base64ToUint32Array(insertionsCRLFData);
				const substitutionsLF = await base64ToUint32Array(substitutionsLFData);
				const [startOffset] = await base64ToUint32Array(startOffsetData);
				insertionsCRLF.forEach(index => zipData.splice(index, 1, 13, 10));
				substitutionsLF.forEach(index => zipData[index] = 13);
				return new Blob([new Uint8Array(startOffset), new Uint8Array(zipData)], { type: "application/octet-stream" });
			}
			throw new Error("Extra zip data data not found");
		}

		async function base64ToUint32Array(data) {
			return new Uint32Array(await (await fetch("data:application/octet-stream;base64," + data)).arrayBuffer());
		}
	}

	var compression = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process$9
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	/* global globalThis, window */

	const LOAD_DEFERRED_IMAGES_START_EVENT = "single-file-load-deferred-images-start";
	const LOAD_DEFERRED_IMAGES_END_EVENT = "single-file-load-deferred-images-end";
	const LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_START_EVENT = "single-file-load-deferred-images-keep-zoom-level-start";
	const LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_END_EVENT = "single-file-load-deferred-images-keep-zoom-level-end";
	const LOAD_DEFERRED_IMAGES_RESET_ZOOM_LEVEL_EVENT = "single-file-load-deferred-images-keep-zoom-level-reset";
	const LOAD_DEFERRED_IMAGES_RESET_EVENT = "single-file-load-deferred-images-reset";
	const BLOCK_COOKIES_START_EVENT = "single-file-block-cookies-start";
	const BLOCK_COOKIES_END_EVENT = "single-file-block-cookies-end";
	const DISPATCH_SCROLL_START_EVENT = "single-file-dispatch-scroll-event-start";
	const DISPATCH_SCROLL_END_EVENT = "single-file-dispatch-scroll-event-end";
	const BLOCK_STORAGE_START_EVENT = "single-file-block-storage-start";
	const BLOCK_STORAGE_END_EVENT = "single-file-block-storage-end";
	const LOAD_IMAGE_EVENT = "single-file-load-image";
	const IMAGE_LOADED_EVENT = "single-file-image-loaded";
	const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
	const DELETE_FONT_EVENT = "single-file-delete-font";
	const CLEAR_FONTS_EVENT = "single-file-clear-fonts";
	const FONT_FACE_PROPERTY_NAME = "_singleFile_fontFaces";

	const addEventListener$3 = (type, listener, options) => globalThis.addEventListener(type, listener, options);
	const dispatchEvent$1 = event => { try { globalThis.dispatchEvent(event); } catch (error) {  /* ignored */ } };
	const CustomEvent$1 = globalThis.CustomEvent;
	const document$3 = globalThis.document;
	const Document = globalThis.Document;
	const JSON$6 = globalThis.JSON;

	let fontFaces;
	if (window[FONT_FACE_PROPERTY_NAME]) {
		fontFaces = window[FONT_FACE_PROPERTY_NAME];
	} else {
		fontFaces = window[FONT_FACE_PROPERTY_NAME] = new Map();
	}

	if (document$3 instanceof Document) {
		addEventListener$3(NEW_FONT_FACE_EVENT, event => {
			const detail = event.detail;
			const key = Object.assign({}, detail);
			delete key.src;
			fontFaces.set(JSON$6.stringify(key), detail);
		});
		addEventListener$3(DELETE_FONT_EVENT, event => {
			const detail = event.detail;
			const key = Object.assign({}, detail);
			delete key.src;
			fontFaces.delete(JSON$6.stringify(key));
		});
		addEventListener$3(CLEAR_FONTS_EVENT, () => fontFaces = new Map());
	}

	function getFontsData$1() {
		return Array.from(fontFaces.values());
	}

	function loadDeferredImagesStart(options) {
		if (options.loadDeferredImagesBlockCookies) {
			dispatchEvent$1(new CustomEvent$1(BLOCK_COOKIES_START_EVENT));
		}
		if (options.loadDeferredImagesBlockStorage) {
			dispatchEvent$1(new CustomEvent$1(BLOCK_STORAGE_START_EVENT));
		}
		if (options.loadDeferredImagesDispatchScrollEvent) {
			dispatchEvent$1(new CustomEvent$1(DISPATCH_SCROLL_START_EVENT));
		}
		if (options.loadDeferredImagesKeepZoomLevel) {
			dispatchEvent$1(new CustomEvent$1(LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_START_EVENT));
		} else {
			dispatchEvent$1(new CustomEvent$1(LOAD_DEFERRED_IMAGES_START_EVENT));
		}
	}

	function loadDeferredImagesEnd(options) {
		if (options.loadDeferredImagesBlockCookies) {
			dispatchEvent$1(new CustomEvent$1(BLOCK_COOKIES_END_EVENT));
		}
		if (options.loadDeferredImagesBlockStorage) {
			dispatchEvent$1(new CustomEvent$1(BLOCK_STORAGE_END_EVENT));
		}
		if (options.loadDeferredImagesDispatchScrollEvent) {
			dispatchEvent$1(new CustomEvent$1(DISPATCH_SCROLL_END_EVENT));
		}
		if (options.loadDeferredImagesKeepZoomLevel) {
			dispatchEvent$1(new CustomEvent$1(LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_END_EVENT));
		} else {
			dispatchEvent$1(new CustomEvent$1(LOAD_DEFERRED_IMAGES_END_EVENT));
		}
	}

	function loadDeferredImagesResetZoomLevel(options) {
		if (options.loadDeferredImagesKeepZoomLevel) {
			dispatchEvent$1(new CustomEvent$1(LOAD_DEFERRED_IMAGES_RESET_ZOOM_LEVEL_EVENT));
		} else {
			dispatchEvent$1(new CustomEvent$1(LOAD_DEFERRED_IMAGES_RESET_EVENT));
		}
	}

	var contentHooksFrames = /*#__PURE__*/Object.freeze({
		__proto__: null,
		getFontsData: getFontsData$1,
		loadDeferredImagesStart: loadDeferredImagesStart,
		loadDeferredImagesEnd: loadDeferredImagesEnd,
		loadDeferredImagesResetZoomLevel: loadDeferredImagesResetZoomLevel,
		LOAD_IMAGE_EVENT: LOAD_IMAGE_EVENT,
		IMAGE_LOADED_EVENT: IMAGE_LOADED_EVENT
	});

	/*
	 * The MIT License (MIT)
	 *
	 * Author: Gildas Lormeau
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// derived from https://github.com/postcss/postcss-selector-parser/blob/master/src/util/unesc.js

	/*
	 * The MIT License (MIT)
	 * Copyright (c) Ben Briggs <beneb.info@gmail.com> (http://beneb.info)
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */

	const whitespace = "[\\x20\\t\\r\\n\\f]";
	const unescapeRegExp = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig");

	function process$8(str) {
		return str.replace(unescapeRegExp, (_, escaped, escapedWhitespace) => {
			const high = "0x" + escaped - 0x10000;

			// NaN means non-codepoint
			// Workaround erroneous numeric interpretation of +"0x"
			// eslint-disable-next-line no-self-compare
			return high !== high || escapedWhitespace
				? escaped
				: high < 0
					? // BMP codepoint
					String.fromCharCode(high + 0x10000)
					: // Supplemental Plane codepoint (surrogate pair)
					String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
		});
	}

	var cssUnescape = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process$8
	});

	const SINGLE_FILE_PREFIX = "single-file-";
	const COMMENT_HEADER = "Page saved with SingleFile";
	const SINGLE_FILE_SIGNATURE = "SingleFile";
	const WAIT_FOR_USERSCRIPT_PROPERTY_NAME = "_singleFile_waitForUserScript";
	const MESSAGE_PREFIX = "__frameTree__::";
	const NO_SCRIPT_PROPERTY_NAME = "singleFileDisabledNoscript";

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const INFOBAR_TAGNAME$1 = "single-file-infobar";
	const INFOBAR_STYLES = `
.infobar,
.infobar .infobar-icon,
.infobar .infobar-link-icon {
  min-inline-size: 28px;
  min-block-size: 28px;
  box-sizing: border-box;
}

.infobar,
.infobar .infobar-close-icon,
.infobar .infobar-link-icon {
  opacity: 0.7;
  transition: opacity 250ms;
}

.infobar:hover,
.infobar .infobar-close-icon:hover,
.infobar .infobar-link-icon:hover {
  opacity: 1;
}

.infobar,
.infobar-content {
  display: flex;
}

.infobar {
  position: fixed;
  top: 16px;
  right: 16px;
  margin-inline-start: 16px;
  margin-block-end: 16px;
  color: #2d2d2d;
  background-color: #737373;
  border: 2px solid;
  border-color: #eee;
  border-radius: 16px;
  z-index: 2147483647;
}

.infobar:valid, .infobar:not(:focus-within) .infobar-content {
  display: none;
}

.infobar:focus-within {
  background-color: #f9f9f9;
  border-color: #878787;
  border-radius: 8px;
  opacity: 1;
  transition-property: opacity, background-color, border-color, border-radius,
    color;
}

.infobar-content {
  align-items: center;
}

.infobar-content span {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 18px;
  word-break: break-word;
  white-space: pre-wrap;
  margin-inline: 4px;
  margin-block: 4px;
}

.infobar .infobar-icon,
.infobar .infobar-close-icon,
.infobar .infobar-link-icon {
  cursor: pointer;
  background-position: center;
  background-repeat: no-repeat;
}

.infobar .infobar-close-icon,
.infobar .infobar-link-icon {
  align-self: flex-start;
}

.infobar .infobar-icon {
  position: absolute;
  min-inline-size: 24px;
  min-block-size: 24px;
}

.infobar:focus-within .infobar-icon {
  z-index: -1;
  background-image: none;
}

.infobar .infobar-close-icon {
  min-inline-size: 22px;
  min-block-size: 22px;
}

.infobar .infobar-icon {
  background-color: transparent;
  background-size: 70%;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHADIRLMaOHwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAPUExURQAAAIqKioyNjY2OjvDw8L2y1DEAAAABdFJOUwBA5thmAAAAAWJLR0QB/wIt3gAAAGNJREFUSMdjYCAJsLi4OBCQx6/CBQwIGIDPCBcXAkYQUsACU+AwlBVQHg6Eg5pgZBGOboIJZugDFwRwoJECJCUOhJI1wZwzqmBUwagCuipgIqTABG9h7YIKaKGAURAFEF/6AQAO4HqSoDP8bgAAAABJRU5ErkJggg==);
}

.infobar .infobar-link-icon {
  background-size: 60%;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8H+DhhoQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJJJREFUOI3t070NRCEMA2CnYAOyDyPwpHj/Va7hJ3FzV7zy3ET5JIwoAF6Jk4wzAJAkzxAYG9YRTgB+24wBgKmfrGAKTcEfAY4KRlRoIeBTgKOCERVaCPgU4Khge2GqKOBTgKOCERVaAEC/4PNcnyoSWHpjqkhwKxbcig0Q6AorXYF/+A6eIYD1lVbwG/jdA6/kA2THRAURVubcAAAAAElFTkSuQmCC);
}

.infobar .infobar-close-icon {
  appearance: none;
  background-size: 80%;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8VC4EQ6QAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJtJREFUOI3NkrsBgCAMRLFwBPdxBArcfxXFkO8rbKWAAJfHJ9faf9vuYX/749T5NmShm3bEwbe2SxeuM4+2oxDL1cDoKtVUjRy+tH78Cv2CS+wIiQNC1AEhk4AQeUTMWUJMfUJMSEJMSEY8kIx4IONroaYAimNxsXp1PA7PxwfVL8QnowwoVC0lig07wDDVUjAdbAnjwtow/z/bDW7eI4M2KruJAAAAAElFTkSuQmCC);
}
`;

	function appendInfobar$1(doc, options, useShadowRoot) {
		if (!doc.querySelector(INFOBAR_TAGNAME$1)) {
			let infoData;
			if (options.infobarContent) {
				infoData = options.infobarContent.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
			} else if (options.saveDate) {
				infoData = options.saveDate;
			}
			infoData = infoData || "No info";
			const infobarElement = createElement(doc, INFOBAR_TAGNAME$1, doc.body);
			let infobarContainer;
			if (useShadowRoot) {
				infobarContainer = infobarElement.attachShadow({ mode: "open" });
			} else {
				const shadowRootTemplate = doc.createElement("template");
				shadowRootTemplate.setAttribute("shadowrootmode", "open");
				infobarElement.appendChild(shadowRootTemplate);
				infobarContainer = shadowRootTemplate;
			}
			const shadowRootContent = doc.createElement("div");
			const styleElement = doc.createElement("style");
			styleElement.textContent = INFOBAR_STYLES
				.replace(/ {2}/g, "")
				.replace(/\n/g, "")
				.replace(/: /g, ":")
				.replace(/, /g, ",");
			shadowRootContent.appendChild(styleElement);
			const infobarContent = doc.createElement("form");
			infobarContent.classList.add("infobar");
			shadowRootContent.appendChild(infobarContent);
			const iconElement = doc.createElement("span");
			iconElement.tabIndex = -1;
			iconElement.classList.add("infobar-icon");
			infobarContent.appendChild(iconElement);
			const contentElement = doc.createElement("span");
			contentElement.tabIndex = -1;
			contentElement.classList.add("infobar-content");
			const closeButtonElement = doc.createElement("input");
			closeButtonElement.type = "checkbox";
			closeButtonElement.required = true;
			closeButtonElement.classList.add("infobar-close-icon");
			closeButtonElement.title = "Close";
			contentElement.appendChild(closeButtonElement);
			const textElement = doc.createElement("span");
			textElement.textContent = infoData;
			contentElement.appendChild(textElement);
			const linkElement = doc.createElement("a");
			linkElement.classList.add("infobar-link-icon");
			linkElement.target = "_blank";
			linkElement.rel = "noopener noreferrer";
			linkElement.title = "Open source URL: " + options.saveUrl;
			linkElement.href = options.saveUrl;
			contentElement.appendChild(linkElement);
			infobarContent.appendChild(contentElement);
			if (useShadowRoot) {
				infobarContainer.appendChild(shadowRootContent);
			} else {
				const scriptElement = doc.createElement("script");
				let scriptContent = refreshInfobarInfo.toString();
				scriptContent += extractInfobarData.toString();
				scriptContent += "(" + initInfobar.toString() + ")(document)";
				scriptElement.textContent = scriptContent;
				shadowRootContent.appendChild(scriptElement);
				infobarContainer.innerHTML = shadowRootContent.outerHTML;
			}
			doc.body.appendChild(infobarElement);
		}
	}

	function extractInfobarData(doc) {
		const result = doc.evaluate("//comment()", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		let singleFileComment = result && result.singleNodeValue;
		if (singleFileComment && singleFileComment.nodeType == Node.COMMENT_NODE && singleFileComment.textContent.includes(SINGLE_FILE_SIGNATURE)) {
			const info = singleFileComment.textContent.split("\n");
			const [, , urlData, ...optionalData] = info;
			const urlMatch = urlData.match(/^ url: (.*) ?$/);
			const saveUrl = urlMatch && urlMatch[1];
			if (saveUrl) {
				let infobarContent, saveDate;
				if (optionalData.length) {
					saveDate = optionalData[0].split("saved date: ")[1];
					if (saveDate) {
						optionalData.shift();
					}
					if (optionalData.length > 1) {
						let content = optionalData[0].split("info: ")[1].trim();
						for (let indexLine = 1; indexLine < optionalData.length - 1; indexLine++) {
							content += "\n" + optionalData[indexLine].trim();
						}
						infobarContent = content.trim();
					}
				}
				return { saveUrl, infobarContent, saveDate };
			}
		}
	}

	function refreshInfobarInfo(doc, { saveUrl, infobarContent, saveDate }) {
		if (saveUrl) {
			const infobarElement = doc.querySelector("single-file-infobar");
			const shadowRootFragment = infobarElement.shadowRoot;
			const infobarContentElement = shadowRootFragment.querySelector(".infobar-content span");
			infobarContentElement.textContent = infobarContent || saveDate;
			const linkElement = shadowRootFragment.querySelector(".infobar-content .infobar-link-icon");
			linkElement.href = saveUrl;
			linkElement.title = "Open source URL: " + saveUrl;
		}
	}

	function initInfobar(doc) {
		const infoData = extractInfobarData(doc);
		if (infoData && infoData.saveUrl) {
			refreshInfobarInfo(doc, infoData);
		}
	}

	function createElement(doc, tagName, parentElement) {
		const element = doc.createElement(tagName);
		parentElement.appendChild(element);
		Array.from(getComputedStyle(element)).forEach(property => element.style.setProperty(property, "initial", "important"));
		return element;
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const ON_BEFORE_CAPTURE_EVENT_NAME = SINGLE_FILE_PREFIX + "on-before-capture";
	const ON_AFTER_CAPTURE_EVENT_NAME = SINGLE_FILE_PREFIX + "on-after-capture";
	const GET_ADOPTED_STYLESHEETS_REQUEST_EVENT = SINGLE_FILE_PREFIX + "request-get-adopted-stylesheets";
	const GET_ADOPTED_STYLESHEETS_RESPONSE_EVENT = SINGLE_FILE_PREFIX + "response-get-adopted-stylesheets";
	const UNREGISTER_GET_ADOPTED_STYLESHEETS_REQUEST_EVENT = SINGLE_FILE_PREFIX + "unregister-request-get-adopted-stylesheets";
	const ON_INIT_USERSCRIPT_EVENT = SINGLE_FILE_PREFIX + "user-script-init";
	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "removed-content";
	const HIDDEN_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "hidden-content";
	const KEPT_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "kept-content";
	const HIDDEN_FRAME_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "hidden-frame";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "preserved-space-element";
	const SHADOW_ROOT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "shadow-root-element";
	const WIN_ID_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "win-id";
	const IMAGE_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "image";
	const POSTER_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "poster";
	const VIDEO_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "video";
	const CANVAS_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "canvas";
	const STYLE_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "movable-style";
	const INPUT_VALUE_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "input-value";
	const LAZY_SRC_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "lazy-loaded-src";
	const STYLESHEET_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "stylesheet";
	const DISABLED_NOSCRIPT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "disabled-noscript";
	const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "selected-content";
	const INVALID_ELEMENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "invalid-element";
	const ASYNC_SCRIPT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "async-script";
	const FLOW_ELEMENTS_SELECTOR = "*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)";
	const KEPT_TAG_NAMES = ["NOSCRIPT", "DISABLED-NOSCRIPT", "META", "LINK", "STYLE", "TITLE", "TEMPLATE", "SOURCE", "OBJECT", "SCRIPT", "HEAD", "BODY"];
	const REGEXP_SIMPLE_QUOTES_STRING$3 = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING$3 = /^"(.*?)"$/;
	const FONT_WEIGHTS = {
		regular: "400",
		normal: "400",
		bold: "700",
		bolder: "700",
		lighter: "100"
	};
	const COMMENT_HEADER_LEGACY = "Archive processed by SingleFile";
	const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";
	const INFOBAR_TAGNAME = INFOBAR_TAGNAME$1;
	const EMPTY_RESOURCE$1 = "data:,";
	const addEventListener$2 = (type, listener, options) => globalThis.addEventListener(type, listener, options);
	const dispatchEvent = event => { try { globalThis.dispatchEvent(event); } catch (error) {  /* ignored */ } };
	const JSON$5 = globalThis.JSON;

	function initUserScriptHandler() {
		addEventListener$2(ON_INIT_USERSCRIPT_EVENT, () => globalThis[WAIT_FOR_USERSCRIPT_PROPERTY_NAME] = async eventPrefixName => {
			const event = new CustomEvent(eventPrefixName + "-request", { cancelable: true });
			const promiseResponse = new Promise(resolve => addEventListener$2(eventPrefixName + "-response", resolve));
			dispatchEvent(event);
			if (event.defaultPrevented) {
				await promiseResponse;
			}
		});
	}

	function initDoc(doc) {
		doc.querySelectorAll("meta[http-equiv=refresh]").forEach(element => {
			element.removeAttribute("http-equiv");
			element.setAttribute("disabled-http-equiv", "refresh");
		});
	}

	function preProcessDoc(doc, win, options) {
		doc.querySelectorAll("noscript:not([" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "])").forEach(element => {
			element.setAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME, element.textContent);
			element.textContent = "";
		});
		initDoc(doc);
		if (doc.head) {
			doc.head.querySelectorAll(FLOW_ELEMENTS_SELECTOR).forEach(element => element.hidden = true);
		}
		doc.querySelectorAll("svg foreignObject").forEach(element => {
			const flowElements = element.querySelectorAll("html > head > " + FLOW_ELEMENTS_SELECTOR + ", html > body > " + FLOW_ELEMENTS_SELECTOR);
			if (flowElements.length) {
				Array.from(element.childNodes).forEach(node => node.remove());
				flowElements.forEach(flowElement => element.appendChild(flowElement));
			}
		});
		const invalidElements = new Map();
		let elementsInfo;
		if (win && doc.documentElement) {
			doc.querySelectorAll("button button, a a").forEach(element => {
				const placeHolderElement = doc.createElement("template");
				placeHolderElement.setAttribute(INVALID_ELEMENT_ATTRIBUTE_NAME, "");
				placeHolderElement.content.appendChild(element.cloneNode(true));
				invalidElements.set(element, placeHolderElement);
				element.replaceWith(placeHolderElement);
			});
			elementsInfo = getElementsInfo(win, doc, doc.documentElement, options);
			if (options.moveStylesInHead) {
				doc.querySelectorAll("body style, body ~ style").forEach(element => {
					const computedStyle = getComputedStyle$1(win, element);
					if (computedStyle && testHiddenElement(element, computedStyle)) {
						element.setAttribute(STYLE_ATTRIBUTE_NAME, "");
						elementsInfo.markedElements.push(element);
					}
				});
			}
		} else {
			elementsInfo = {
				canvases: [],
				images: [],
				posters: [],
				videos: [],
				usedFonts: [],
				shadowRoots: [],
				markedElements: []
			};
		}
		return {
			canvases: elementsInfo.canvases,
			fonts: getFontsData(),
			stylesheets: getStylesheetsData(doc),
			images: elementsInfo.images,
			posters: elementsInfo.posters,
			videos: elementsInfo.videos,
			usedFonts: Array.from(elementsInfo.usedFonts.values()),
			shadowRoots: elementsInfo.shadowRoots,
			referrer: doc.referrer,
			markedElements: elementsInfo.markedElements,
			invalidElements,
			scrollPosition: { x: win.scrollX, y: win.scrollY },
			adoptedStyleSheets: getStylesheetsContent(doc.adoptedStyleSheets)
		};
	}

	function getElementsInfo(win, doc, element, options, data = { usedFonts: new Map(), canvases: [], images: [], posters: [], videos: [], shadowRoots: [], markedElements: [] }, ascendantHidden) {
		if (element.childNodes) {
			const elements = Array.from(element.childNodes).filter(node => (node instanceof win.HTMLElement) || (node instanceof win.SVGElement));
			elements.forEach(element => {
				let elementHidden, elementKept, computedStyle;
				if (!options.autoSaveExternalSave && (options.removeHiddenElements || options.removeUnusedFonts || options.compressHTML)) {
					computedStyle = getComputedStyle$1(win, element);
					if (element instanceof win.HTMLElement) {
						if (options.removeHiddenElements) {
							elementKept = ((ascendantHidden || element.closest("html > head")) && KEPT_TAG_NAMES.includes(element.tagName.toUpperCase())) || element.closest("details");
							if (!elementKept) {
								elementHidden = ascendantHidden || testHiddenElement(element, computedStyle);
								if (elementHidden) {
									element.setAttribute(HIDDEN_CONTENT_ATTRIBUTE_NAME, "");
									data.markedElements.push(element);
								}
							}
						}
					}
					if (!elementHidden) {
						if (options.compressHTML && computedStyle) {
							const whiteSpace = computedStyle.getPropertyValue("white-space");
							if (whiteSpace && whiteSpace.startsWith("pre")) {
								element.setAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, "");
								data.markedElements.push(element);
							}
						}
						if (options.removeUnusedFonts) {
							getUsedFont(computedStyle, options, data.usedFonts);
							getUsedFont(getComputedStyle$1(win, element, ":first-letter"), options, data.usedFonts);
							getUsedFont(getComputedStyle$1(win, element, ":before"), options, data.usedFonts);
							getUsedFont(getComputedStyle$1(win, element, ":after"), options, data.usedFonts);
						}
					}
				}
				getResourcesInfo(win, doc, element, options, data, elementHidden, computedStyle);
				const shadowRoot = !(element instanceof win.SVGElement) && getShadowRoot(element);
				if (shadowRoot && !element.classList.contains(SINGLE_FILE_UI_ELEMENT_CLASS)) {
					const shadowRootInfo = {};
					element.setAttribute(SHADOW_ROOT_ATTRIBUTE_NAME, data.shadowRoots.length);
					data.markedElements.push(element);
					data.shadowRoots.push(shadowRootInfo);
					try {
						if (shadowRoot.adoptedStyleSheets) {
							if (shadowRoot.adoptedStyleSheets.length) {
								shadowRootInfo.adoptedStyleSheets = getStylesheetsContent(shadowRoot.adoptedStyleSheets);
							} else if (shadowRoot.adoptedStyleSheets.length === undefined) {
								const listener = event => shadowRootInfo.adoptedStyleSheets = event.detail.adoptedStyleSheets;
								element.addEventListener(GET_ADOPTED_STYLESHEETS_RESPONSE_EVENT, listener);
								element.dispatchEvent(new CustomEvent(GET_ADOPTED_STYLESHEETS_REQUEST_EVENT, { bubbles: true }));
								element.removeEventListener(GET_ADOPTED_STYLESHEETS_RESPONSE_EVENT, listener);
							}
						}
					} catch (error) {
						// ignored
					}
					getElementsInfo(win, doc, shadowRoot, options, data, elementHidden);
					shadowRootInfo.content = shadowRoot.innerHTML;
					shadowRootInfo.mode = shadowRoot.mode;
					try {
						if (shadowRoot.adoptedStyleSheets && shadowRoot.adoptedStyleSheets.length === undefined) {
							element.dispatchEvent(new CustomEvent(UNREGISTER_GET_ADOPTED_STYLESHEETS_REQUEST_EVENT, { bubbles: true }));
						}
					} catch (error) {
						// ignored
					}
				}
				getElementsInfo(win, doc, element, options, data, elementHidden);
				if (!options.autoSaveExternalSave && options.removeHiddenElements && ascendantHidden) {
					if (elementKept || element.getAttribute(KEPT_CONTENT_ATTRIBUTE_NAME) == "") {
						if (element.parentElement) {
							element.parentElement.setAttribute(KEPT_CONTENT_ATTRIBUTE_NAME, "");
							data.markedElements.push(element.parentElement);
						}
					} else if (elementHidden) {
						element.setAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME, "");
						data.markedElements.push(element);
					}
				}
			});
		}
		return data;
	}

	function getStylesheetsContent(styleSheets) {
		return styleSheets ? Array.from(styleSheets).map(stylesheet => Array.from(stylesheet.cssRules).map(cssRule => cssRule.cssText).join("\n")) : [];
	}

	function getResourcesInfo(win, doc, element, options, data, elementHidden, computedStyle) {
		const tagName = element.tagName && element.tagName.toUpperCase();
		if (tagName == "CANVAS") {
			try {
				data.canvases.push({
					dataURI: element.toDataURL("image/png", ""),
					backgroundColor: computedStyle.getPropertyValue("background-color")
				});
				element.setAttribute(CANVAS_ATTRIBUTE_NAME, data.canvases.length - 1);
				data.markedElements.push(element);
			} catch (error) {
				// ignored
			}
		}
		if (tagName == "IMG") {
			const imageData = {
				currentSrc: elementHidden ?
					EMPTY_RESOURCE$1 :
					(options.loadDeferredImages && element.getAttribute(LAZY_SRC_ATTRIBUTE_NAME)) || element.currentSrc
			};
			data.images.push(imageData);
			element.setAttribute(IMAGE_ATTRIBUTE_NAME, data.images.length - 1);
			data.markedElements.push(element);
			element.removeAttribute(LAZY_SRC_ATTRIBUTE_NAME);
			computedStyle = computedStyle || getComputedStyle$1(win, element);
			if (computedStyle) {
				imageData.size = getSize(win, element, computedStyle);
				const boxShadow = computedStyle.getPropertyValue("box-shadow");
				const backgroundImage = computedStyle.getPropertyValue("background-image");
				if ((!boxShadow || boxShadow == "none") &&
					(!backgroundImage || backgroundImage == "none") &&
					(imageData.size.pxWidth > 1 || imageData.size.pxHeight > 1)) {
					imageData.replaceable = true;
					imageData.backgroundColor = computedStyle.getPropertyValue("background-color");
					imageData.objectFit = computedStyle.getPropertyValue("object-fit");
					imageData.boxSizing = computedStyle.getPropertyValue("box-sizing");
					imageData.objectPosition = computedStyle.getPropertyValue("object-position");
				}
			}
		}
		if (tagName == "VIDEO") {
			const src = element.currentSrc;
			if (src && !src.startsWith("blob:") && !src.startsWith("data:")) {
				const computedStyle = getComputedStyle$1(win, element.parentNode);
				data.videos.push({
					positionParent: computedStyle && computedStyle.getPropertyValue("position"),
					src,
					size: {
						pxWidth: element.clientWidth,
						pxHeight: element.clientHeight
					},
					currentTime: element.currentTime
				});
				element.setAttribute(VIDEO_ATTRIBUTE_NAME, data.videos.length - 1);
			}
			if (!element.getAttribute("poster")) {
				const canvasElement = doc.createElement("canvas");
				const context = canvasElement.getContext("2d");
				canvasElement.width = element.clientWidth;
				canvasElement.height = element.clientHeight;
				try {
					context.drawImage(element, 0, 0, canvasElement.width, canvasElement.height);
					data.posters.push(canvasElement.toDataURL("image/png", ""));
					element.setAttribute(POSTER_ATTRIBUTE_NAME, data.posters.length - 1);
					data.markedElements.push(element);
				} catch (error) {
					// ignored
				}
			}
		}
		if (tagName == "IFRAME") {
			if (elementHidden && options.removeHiddenElements) {
				element.setAttribute(HIDDEN_FRAME_ATTRIBUTE_NAME, "");
				data.markedElements.push(element);
			}
		}
		if (tagName == "INPUT") {
			if (element.type != "password") {
				element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.value);
				data.markedElements.push(element);
			}
			if (element.type == "radio" || element.type == "checkbox") {
				element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.checked);
				data.markedElements.push(element);
			}
		}
		if (tagName == "TEXTAREA") {
			element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.value);
			data.markedElements.push(element);
		}
		if (tagName == "SELECT") {
			element.querySelectorAll("option").forEach(option => {
				if (option.selected) {
					option.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, "");
					data.markedElements.push(option);
				}
			});
		}
		if (tagName == "SCRIPT") {
			if (element.async && element.getAttribute("async") != "" && element.getAttribute("async") != "async") {
				element.setAttribute(ASYNC_SCRIPT_ATTRIBUTE_NAME, "");
				data.markedElements.push(element);
			}
			element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>");
		}
	}

	function getUsedFont(computedStyle, options, usedFonts) {
		if (computedStyle) {
			const fontStyle = computedStyle.getPropertyValue("font-style") || "normal";
			computedStyle.getPropertyValue("font-family").split(",").forEach(fontFamilyName => {
				fontFamilyName = normalizeFontFamily(fontFamilyName);
				if (!options.loadedFonts || options.loadedFonts.find(font => normalizeFontFamily(font.family) == fontFamilyName && font.style == fontStyle)) {
					const fontWeight = getFontWeight(computedStyle.getPropertyValue("font-weight"));
					const fontVariant = computedStyle.getPropertyValue("font-variant") || "normal";
					const value = [fontFamilyName, fontWeight, fontStyle, fontVariant];
					usedFonts.set(JSON$5.stringify(value), [fontFamilyName, fontWeight, fontStyle, fontVariant]);
				}
			});
		}
	}

	function getShadowRoot(element) {
		const chrome = globalThis.chrome;
		if (element.openOrClosedShadowRoot) {
			return element.openOrClosedShadowRoot;
		} else if (chrome && chrome.dom && chrome.dom.openOrClosedShadowRoot) {
			try {
				return chrome.dom.openOrClosedShadowRoot(element);
			} catch (error) {
				return element.shadowRoot;
			}
		} else {
			return element.shadowRoot;
		}
	}

	function appendInfobar(doc, options, useShadowRoot) {
		return appendInfobar$1(doc, options, useShadowRoot);
	}

	function normalizeFontFamily(fontFamilyName = "") {
		return removeQuotes$1(process$8(fontFamilyName.trim())).toLowerCase();
	}

	function testHiddenElement(element, computedStyle) {
		let hidden = false;
		if (computedStyle) {
			const display = computedStyle.getPropertyValue("display");
			const opacity = computedStyle.getPropertyValue("opacity");
			const visibility = computedStyle.getPropertyValue("visibility");
			hidden = display == "none";
			if (!hidden && (opacity == "0" || visibility == "hidden") && element.getBoundingClientRect) {
				const boundingRect = element.getBoundingClientRect();
				hidden = !boundingRect.width && !boundingRect.height;
			}
		}
		return Boolean(hidden);
	}

	function postProcessDoc(doc, markedElements, invalidElements) {
		doc.querySelectorAll("[" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "]").forEach(element => {
			element.textContent = element.getAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
			element.removeAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
			if (doc.body.firstChild) {
				doc.body.insertBefore(element, doc.body.firstChild);
			} else {
				doc.body.appendChild(element);
			}
		});
		doc.querySelectorAll("meta[disabled-http-equiv]").forEach(element => {
			element.setAttribute("http-equiv", element.getAttribute("disabled-http-equiv"));
			element.removeAttribute("disabled-http-equiv");
		});
		if (doc.head) {
			doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.removeAttribute("hidden"));
		}
		if (!markedElements) {
			const singleFileAttributes = [REMOVED_CONTENT_ATTRIBUTE_NAME, HIDDEN_FRAME_ATTRIBUTE_NAME, HIDDEN_CONTENT_ATTRIBUTE_NAME, PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, IMAGE_ATTRIBUTE_NAME, POSTER_ATTRIBUTE_NAME, VIDEO_ATTRIBUTE_NAME, CANVAS_ATTRIBUTE_NAME, INPUT_VALUE_ATTRIBUTE_NAME, SHADOW_ROOT_ATTRIBUTE_NAME, STYLESHEET_ATTRIBUTE_NAME, ASYNC_SCRIPT_ATTRIBUTE_NAME];
			markedElements = doc.querySelectorAll(singleFileAttributes.map(name => "[" + name + "]").join(","));
		}
		markedElements.forEach(element => {
			element.removeAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME);
			element.removeAttribute(HIDDEN_CONTENT_ATTRIBUTE_NAME);
			element.removeAttribute(KEPT_CONTENT_ATTRIBUTE_NAME);
			element.removeAttribute(HIDDEN_FRAME_ATTRIBUTE_NAME);
			element.removeAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME);
			element.removeAttribute(IMAGE_ATTRIBUTE_NAME);
			element.removeAttribute(POSTER_ATTRIBUTE_NAME);
			element.removeAttribute(VIDEO_ATTRIBUTE_NAME);
			element.removeAttribute(CANVAS_ATTRIBUTE_NAME);
			element.removeAttribute(INPUT_VALUE_ATTRIBUTE_NAME);
			element.removeAttribute(SHADOW_ROOT_ATTRIBUTE_NAME);
			element.removeAttribute(STYLESHEET_ATTRIBUTE_NAME);
			element.removeAttribute(ASYNC_SCRIPT_ATTRIBUTE_NAME);
			element.removeAttribute(STYLE_ATTRIBUTE_NAME);
		});
		if (invalidElements) {
			invalidElements.forEach((placeholderElement, element) => placeholderElement.replaceWith(element));
		}
	}

	function getStylesheetsData(doc) {
		if (doc) {
			const contents = [];
			doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
				try {
					const tempStyleElement = doc.createElement("style");
					tempStyleElement.textContent = styleElement.textContent;
					doc.body.appendChild(tempStyleElement);
					const stylesheet = tempStyleElement.sheet;
					tempStyleElement.remove();
					if (!stylesheet || stylesheet.cssRules.length != styleElement.sheet.cssRules.length) {
						styleElement.setAttribute(STYLESHEET_ATTRIBUTE_NAME, styleIndex);
						contents[styleIndex] = Array.from(styleElement.sheet.cssRules).map(cssRule => cssRule.cssText).join("\n");
					}
				} catch (error) {
					// ignored
				}
			});
			return contents;
		}
	}

	function getSize(win, imageElement, computedStyle) {
		let pxWidth = imageElement.naturalWidth;
		let pxHeight = imageElement.naturalHeight;
		if (!pxWidth && !pxHeight) {
			const noStyleAttribute = imageElement.getAttribute("style") == null;
			computedStyle = computedStyle || getComputedStyle$1(win, imageElement);
			if (computedStyle) {
				let removeBorderWidth = false;
				if (computedStyle.getPropertyValue("box-sizing") == "content-box") {
					const boxSizingValue = imageElement.style.getPropertyValue("box-sizing");
					const boxSizingPriority = imageElement.style.getPropertyPriority("box-sizing");
					const clientWidth = imageElement.clientWidth;
					imageElement.style.setProperty("box-sizing", "border-box", "important");
					removeBorderWidth = imageElement.clientWidth != clientWidth;
					if (boxSizingValue) {
						imageElement.style.setProperty("box-sizing", boxSizingValue, boxSizingPriority);
					} else {
						imageElement.style.removeProperty("box-sizing");
					}
				}
				let paddingLeft, paddingRight, paddingTop, paddingBottom, borderLeft, borderRight, borderTop, borderBottom;
				paddingLeft = getWidth("padding-left", computedStyle);
				paddingRight = getWidth("padding-right", computedStyle);
				paddingTop = getWidth("padding-top", computedStyle);
				paddingBottom = getWidth("padding-bottom", computedStyle);
				if (removeBorderWidth) {
					borderLeft = getWidth("border-left-width", computedStyle);
					borderRight = getWidth("border-right-width", computedStyle);
					borderTop = getWidth("border-top-width", computedStyle);
					borderBottom = getWidth("border-bottom-width", computedStyle);
				} else {
					borderLeft = borderRight = borderTop = borderBottom = 0;
				}
				pxWidth = Math.max(0, imageElement.clientWidth - paddingLeft - paddingRight - borderLeft - borderRight);
				pxHeight = Math.max(0, imageElement.clientHeight - paddingTop - paddingBottom - borderTop - borderBottom);
				if (noStyleAttribute) {
					imageElement.removeAttribute("style");
				}
			}
		}
		return { pxWidth, pxHeight };
	}

	function getWidth(styleName, computedStyle) {
		if (computedStyle.getPropertyValue(styleName).endsWith("px")) {
			return parseFloat(computedStyle.getPropertyValue(styleName));
		}
	}

	function getFontsData() {
		return getFontsData$1();
	}

	function serialize$1(doc) {
		const docType = doc.doctype;
		let docTypeString = "";
		if (docType) {
			docTypeString = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeString += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId) {
					docTypeString += " \"" + docType.systemId + "\"";
				}
			} else if (docType.systemId) {
				docTypeString += " SYSTEM \"" + docType.systemId + "\"";
			} if (docType.internalSubset) {
				docTypeString += " [" + docType.internalSubset + "]";
			}
			docTypeString += "> ";
		}
		return docTypeString + doc.documentElement.outerHTML;
	}

	function removeQuotes$1(string) {
		if (string.match(REGEXP_SIMPLE_QUOTES_STRING$3)) {
			string = string.replace(REGEXP_SIMPLE_QUOTES_STRING$3, "$1");
		} else {
			string = string.replace(REGEXP_DOUBLE_QUOTES_STRING$3, "$1");
		}
		return string.trim();
	}

	function getFontWeight(weight) {
		return FONT_WEIGHTS[weight.toLowerCase().trim()] || weight;
	}

	function flatten(array) {
		return array.flat ? array.flat() : array.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
	}

	function getComputedStyle$1(win, element, pseudoElement) {
		try {
			return win.getComputedStyle(element, pseudoElement);
		} catch (error) {
			// ignored
		}
	}

	var helper$4 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		initUserScriptHandler: initUserScriptHandler,
		initDoc: initDoc,
		preProcessDoc: preProcessDoc,
		postProcessDoc: postProcessDoc,
		serialize: serialize$1,
		removeQuotes: removeQuotes$1,
		flatten: flatten,
		getFontWeight: getFontWeight,
		normalizeFontFamily: normalizeFontFamily,
		getShadowRoot: getShadowRoot,
		appendInfobar: appendInfobar,
		ON_BEFORE_CAPTURE_EVENT_NAME: ON_BEFORE_CAPTURE_EVENT_NAME,
		ON_AFTER_CAPTURE_EVENT_NAME: ON_AFTER_CAPTURE_EVENT_NAME,
		WIN_ID_ATTRIBUTE_NAME: WIN_ID_ATTRIBUTE_NAME,
		PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME: PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME,
		REMOVED_CONTENT_ATTRIBUTE_NAME: REMOVED_CONTENT_ATTRIBUTE_NAME,
		HIDDEN_CONTENT_ATTRIBUTE_NAME: HIDDEN_CONTENT_ATTRIBUTE_NAME,
		HIDDEN_FRAME_ATTRIBUTE_NAME: HIDDEN_FRAME_ATTRIBUTE_NAME,
		IMAGE_ATTRIBUTE_NAME: IMAGE_ATTRIBUTE_NAME,
		POSTER_ATTRIBUTE_NAME: POSTER_ATTRIBUTE_NAME,
		VIDEO_ATTRIBUTE_NAME: VIDEO_ATTRIBUTE_NAME,
		CANVAS_ATTRIBUTE_NAME: CANVAS_ATTRIBUTE_NAME,
		INPUT_VALUE_ATTRIBUTE_NAME: INPUT_VALUE_ATTRIBUTE_NAME,
		SHADOW_ROOT_ATTRIBUTE_NAME: SHADOW_ROOT_ATTRIBUTE_NAME,
		STYLE_ATTRIBUTE_NAME: STYLE_ATTRIBUTE_NAME,
		LAZY_SRC_ATTRIBUTE_NAME: LAZY_SRC_ATTRIBUTE_NAME,
		STYLESHEET_ATTRIBUTE_NAME: STYLESHEET_ATTRIBUTE_NAME,
		SELECTED_CONTENT_ATTRIBUTE_NAME: SELECTED_CONTENT_ATTRIBUTE_NAME,
		INVALID_ELEMENT_ATTRIBUTE_NAME: INVALID_ELEMENT_ATTRIBUTE_NAME,
		ASYNC_SCRIPT_ATTRIBUTE_NAME: ASYNC_SCRIPT_ATTRIBUTE_NAME,
		COMMENT_HEADER: COMMENT_HEADER,
		COMMENT_HEADER_LEGACY: COMMENT_HEADER_LEGACY,
		SINGLE_FILE_UI_ELEMENT_CLASS: SINGLE_FILE_UI_ELEMENT_CLASS,
		EMPTY_RESOURCE: EMPTY_RESOURCE$1,
		INFOBAR_TAGNAME: INFOBAR_TAGNAME,
		WAIT_FOR_USERSCRIPT_PROPERTY_NAME: WAIT_FOR_USERSCRIPT_PROPERTY_NAME,
		MESSAGE_PREFIX: MESSAGE_PREFIX,
		NO_SCRIPT_PROPERTY_NAME: NO_SCRIPT_PROPERTY_NAME
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */
	const helper$3 = {
		LAZY_SRC_ATTRIBUTE_NAME,
		SINGLE_FILE_UI_ELEMENT_CLASS
	};

	const MAX_IDLE_TIMEOUT_CALLS = 10;
	const ATTRIBUTES_MUTATION_TYPE = "attributes";

	const browser$1 = globalThis.browser;
	const document$2 = globalThis.document;
	const MutationObserver = globalThis.MutationObserver;
	const addEventListener$1 = (type, listener, options) => globalThis.addEventListener(type, listener, options);
	const removeEventListener = (type, listener, options) => globalThis.removeEventListener(type, listener, options);
	const timeouts = new Map();

	let idleTimeoutCalls;

	if (browser$1 && browser$1.runtime && browser$1.runtime.onMessage && browser$1.runtime.onMessage.addListener) {
		browser$1.runtime.onMessage.addListener(message => {
			if (message.method == "singlefile.lazyTimeout.onTimeout") {
				const timeoutData = timeouts.get(message.type);
				if (timeoutData) {
					timeouts.delete(message.type);
					try {
						timeoutData.callback();
					} catch (error) {
						clearRegularTimeout(message.type);
					}
				}
			}
		});
	}

	async function process$7(options) {
		if (document$2.documentElement) {
			timeouts.clear();
			const bodyHeight = document$2.body ? Math.max(document$2.body.scrollHeight, document$2.documentElement.scrollHeight) : document$2.documentElement.scrollHeight;
			const bodyWidth = document$2.body ? Math.max(document$2.body.scrollWidth, document$2.documentElement.scrollWidth) : document$2.documentElement.scrollWidth;
			if (bodyHeight > globalThis.innerHeight || bodyWidth > globalThis.innerWidth) {
				const maxScrollY = Math.max(bodyHeight - (globalThis.innerHeight * 1.5), 0);
				const maxScrollX = Math.max(bodyWidth - (globalThis.innerWidth * 1.5), 0);
				if (globalThis.scrollY < maxScrollY || globalThis.scrollX < maxScrollX) {
					return triggerLazyLoading(options);
				}
			}
		}
	}

	function resetZoomLevel(options) {
		loadDeferredImagesResetZoomLevel(options);
	}

	function triggerLazyLoading(options) {
		idleTimeoutCalls = 0;
		return new Promise(async resolve => { // eslint-disable-line  no-async-promise-executor
			let loadingImages;
			const pendingImages = new Set();
			const observer = new MutationObserver(async mutations => {
				mutations = mutations.filter(mutation => mutation.type == ATTRIBUTES_MUTATION_TYPE);
				if (mutations.length) {
					const updated = mutations.filter(mutation => {
						if (mutation.attributeName == "src") {
							mutation.target.setAttribute(helper$3.LAZY_SRC_ATTRIBUTE_NAME, mutation.target.src);
							mutation.target.addEventListener("load", onResourceLoad);
						}
						if (mutation.attributeName == "src" || mutation.attributeName == "srcset" ||
							(mutation.target.tagName && mutation.target.tagName.toUpperCase() == "SOURCE")) {
							return !mutation.target.classList || !mutation.target.classList.contains(helper$3.SINGLE_FILE_UI_ELEMENT_CLASS);
						}
					});
					if (updated.length) {
						loadingImages = true;
						await deferForceLazyLoadEnd(observer, options, cleanupAndResolve);
						if (!pendingImages.size) {
							await deferLazyLoadEnd(observer, options, cleanupAndResolve);
						}
					}
				}
			});
			await setIdleTimeout(options.loadDeferredImagesMaxIdleTime * 2);
			await deferForceLazyLoadEnd(observer, options, cleanupAndResolve);
			observer.observe(document$2, { subtree: true, childList: true, attributes: true });
			addEventListener$1(LOAD_IMAGE_EVENT, onImageLoadEvent);
			addEventListener$1(IMAGE_LOADED_EVENT, onImageLoadedEvent);
			loadDeferredImagesStart(options);

			async function setIdleTimeout(delay) {
				await setAsyncTimeout("idleTimeout", async () => {
					if (!loadingImages) {
						clearAsyncTimeout("loadTimeout");
						clearAsyncTimeout("maxTimeout");
						lazyLoadEnd(observer, options, cleanupAndResolve);
					} else if (idleTimeoutCalls < MAX_IDLE_TIMEOUT_CALLS) {
						idleTimeoutCalls++;
						clearAsyncTimeout("idleTimeout");
						await setIdleTimeout(Math.max(500, delay / 2));
					}
				}, delay, options.loadDeferredImagesNativeTimeout);
			}

			function onResourceLoad(event) {
				const element = event.target;
				element.removeAttribute(helper$3.LAZY_SRC_ATTRIBUTE_NAME);
				element.removeEventListener("load", onResourceLoad);
			}

			async function onImageLoadEvent(event) {
				loadingImages = true;
				await deferForceLazyLoadEnd(observer, options, cleanupAndResolve);
				await deferLazyLoadEnd(observer, options, cleanupAndResolve);
				if (event.detail) {
					pendingImages.add(event.detail);
				}
			}

			async function onImageLoadedEvent(event) {
				await deferForceLazyLoadEnd(observer, options, cleanupAndResolve);
				await deferLazyLoadEnd(observer, options, cleanupAndResolve);
				pendingImages.delete(event.detail);
				if (!pendingImages.size) {
					await deferLazyLoadEnd(observer, options, cleanupAndResolve);
				}
			}

			function cleanupAndResolve(value) {
				observer.disconnect();
				removeEventListener(LOAD_IMAGE_EVENT, onImageLoadEvent);
				removeEventListener(IMAGE_LOADED_EVENT, onImageLoadedEvent);
				resolve(value);
			}
		});
	}

	async function deferLazyLoadEnd(observer, options, resolve) {
		await setAsyncTimeout("loadTimeout", () => lazyLoadEnd(observer, options, resolve), options.loadDeferredImagesMaxIdleTime, options.loadDeferredImagesNativeTimeout);
	}

	async function deferForceLazyLoadEnd(observer, options, resolve) {
		await setAsyncTimeout("maxTimeout", async () => {
			await clearAsyncTimeout("loadTimeout");
			await lazyLoadEnd(observer, options, resolve);
		}, options.loadDeferredImagesMaxIdleTime * 10, options.loadDeferredImagesNativeTimeout);
	}

	async function lazyLoadEnd(observer, options, resolve) {
		await clearAsyncTimeout("idleTimeout");
		loadDeferredImagesEnd(options);
		await setAsyncTimeout("endTimeout", async () => {
			await clearAsyncTimeout("maxTimeout");
			resolve();
		}, options.loadDeferredImagesMaxIdleTime / 2, options.loadDeferredImagesNativeTimeout);
		observer.disconnect();
	}

	async function setAsyncTimeout(type, callback, delay, forceNativeTimeout) {
		if (browser$1 && browser$1.runtime && browser$1.runtime.sendMessage && !forceNativeTimeout) {
			if (!timeouts.get(type) || !timeouts.get(type).pending) {
				const timeoutData = { callback, pending: true };
				timeouts.set(type, timeoutData);
				try {
					await browser$1.runtime.sendMessage({ method: "singlefile.lazyTimeout.setTimeout", type, delay });
				} catch (error) {
					setRegularTimeout(type, callback, delay);
				}
				timeoutData.pending = false;
			}
		} else {
			setRegularTimeout(type, callback, delay);
		}
	}

	function setRegularTimeout(type, callback, delay) {
		const timeoutId = timeouts.get(type);
		if (timeoutId) {
			globalThis.clearTimeout(timeoutId);
		}
		timeouts.set(type, callback);
		globalThis.setTimeout(callback, delay);
	}

	async function clearAsyncTimeout(type) {
		if (browser$1 && browser$1.runtime && browser$1.runtime.sendMessage) {
			try {
				await browser$1.runtime.sendMessage({ method: "singlefile.lazyTimeout.clearTimeout", type });
			} catch (error) {
				clearRegularTimeout(type);
			}
		} else {
			clearRegularTimeout(type);
		}
	}

	function clearRegularTimeout(type) {
		const previousTimeoutId = timeouts.get(type);
		timeouts.delete(type);
		if (previousTimeoutId) {
			globalThis.clearTimeout(previousTimeoutId);
		}
	}

	var contentLazyLoader = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process$7,
		resetZoomLevel: resetZoomLevel
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const helper$2 = {
		ON_BEFORE_CAPTURE_EVENT_NAME,
		ON_AFTER_CAPTURE_EVENT_NAME,
		WIN_ID_ATTRIBUTE_NAME,
		WAIT_FOR_USERSCRIPT_PROPERTY_NAME,
		preProcessDoc,
		serialize: serialize$1,
		postProcessDoc,
		getShadowRoot
	};

	const FRAMES_CSS_SELECTOR = "iframe, frame, object[type=\"text/html\"][data]";
	const ALL_ELEMENTS_CSS_SELECTOR = "*";
	const INIT_REQUEST_MESSAGE = "singlefile.frameTree.initRequest";
	const ACK_INIT_REQUEST_MESSAGE = "singlefile.frameTree.ackInitRequest";
	const CLEANUP_REQUEST_MESSAGE = "singlefile.frameTree.cleanupRequest";
	const INIT_RESPONSE_MESSAGE = "singlefile.frameTree.initResponse";
	const TARGET_ORIGIN = "*";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 5000;
	const TIMEOUT_INIT_RESPONSE_MESSAGE = 10000;
	const TOP_WINDOW_ID = "0";
	const WINDOW_ID_SEPARATOR = ".";
	const TOP_WINDOW = globalThis.window == globalThis.top;

	const browser = globalThis.browser;
	const addEventListener = (type, listener, options) => globalThis.addEventListener(type, listener, options);
	const top = globalThis.top;
	const MessageChannel = globalThis.MessageChannel;
	const document$1 = globalThis.document;
	const JSON$4 = globalThis.JSON;

	let sessions = globalThis.sessions;
	if (!sessions) {
		sessions = globalThis.sessions = new Map();
	}
	let windowId;
	if (TOP_WINDOW) {
		windowId = TOP_WINDOW_ID;
		if (browser && browser.runtime && browser.runtime.onMessage && browser.runtime.onMessage.addListener) {
			browser.runtime.onMessage.addListener(message => {
				if (message.method == INIT_RESPONSE_MESSAGE) {
					initResponse(message);
					return Promise.resolve({});
				} else if (message.method == ACK_INIT_REQUEST_MESSAGE) {
					clearFrameTimeout("requestTimeouts", message.sessionId, message.windowId);
					createFrameResponseTimeout(message.sessionId, message.windowId);
					return Promise.resolve({});
				}
			});
		}
	}
	addEventListener("message", async event => {
		if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX)) {
			event.preventDefault();
			event.stopPropagation();
			const message = JSON$4.parse(event.data.substring(MESSAGE_PREFIX.length));
			if (message.method == INIT_REQUEST_MESSAGE) {
				if (event.source) {
					sendMessage(event.source, { method: ACK_INIT_REQUEST_MESSAGE, windowId: message.windowId, sessionId: message.sessionId });
				}
				if (!TOP_WINDOW) {
					globalThis.stop();
					if (message.options.loadDeferredImages) {
						process$7(message.options);
					}
					await initRequestAsync(message);
				}
			} else if (message.method == ACK_INIT_REQUEST_MESSAGE) {
				clearFrameTimeout("requestTimeouts", message.sessionId, message.windowId);
				createFrameResponseTimeout(message.sessionId, message.windowId);
			} else if (message.method == CLEANUP_REQUEST_MESSAGE) {
				cleanupRequest(message);
			} else if (message.method == INIT_RESPONSE_MESSAGE && sessions.get(message.sessionId)) {
				const port = event.ports[0];
				port.onmessage = event => initResponse(event.data);
			}
		}
	}, true);

	function getAsync(options) {
		const sessionId = getNewSessionId();
		options = JSON$4.parse(JSON$4.stringify(options));
		return new Promise(resolve => {
			sessions.set(sessionId, {
				frames: [],
				requestTimeouts: {},
				responseTimeouts: {},
				resolve: frames => {
					frames.sessionId = sessionId;
					resolve(frames);
				}
			});
			initRequestAsync({ windowId, sessionId, options });
		});
	}

	function getSync(options) {
		const sessionId = getNewSessionId();
		options = JSON$4.parse(JSON$4.stringify(options));
		sessions.set(sessionId, {
			frames: [],
			requestTimeouts: {},
			responseTimeouts: {}
		});
		initRequestSync({ windowId, sessionId, options });
		const frames = sessions.get(sessionId).frames;
		frames.sessionId = sessionId;
		return frames;
	}

	function cleanup(sessionId) {
		sessions.delete(sessionId);
		cleanupRequest({ windowId, sessionId, options: { sessionId } });
	}

	function getNewSessionId() {
		return globalThis.crypto.getRandomValues(new Uint32Array(32)).join("");
	}

	function initRequestSync(message) {
		const sessionId = message.sessionId;
		const waitForUserScript = globalThis[helper$2.WAIT_FOR_USERSCRIPT_PROPERTY_NAME];
		delete globalThis._singleFile_cleaningUp;
		if (!TOP_WINDOW) {
			windowId = globalThis.frameId = message.windowId;
		}
		processFrames(document$1, message.options, windowId, sessionId);
		if (!TOP_WINDOW) {
			if (message.options.userScriptEnabled && waitForUserScript) {
				waitForUserScript(helper$2.ON_BEFORE_CAPTURE_EVENT_NAME);
			}
			sendInitResponse({ frames: [getFrameData(document$1, globalThis, windowId, message.options, message.scrolling)], sessionId, requestedFrameId: document$1.documentElement.dataset.requestedFrameId && windowId });
			if (message.options.userScriptEnabled && waitForUserScript) {
				waitForUserScript(helper$2.ON_AFTER_CAPTURE_EVENT_NAME);
			}
			delete document$1.documentElement.dataset.requestedFrameId;
		}
	}

	async function initRequestAsync(message) {
		const sessionId = message.sessionId;
		const waitForUserScript = globalThis[helper$2.WAIT_FOR_USERSCRIPT_PROPERTY_NAME];
		delete globalThis._singleFile_cleaningUp;
		if (!TOP_WINDOW) {
			windowId = globalThis.frameId = message.windowId;
		}
		processFrames(document$1, message.options, windowId, sessionId);
		if (!TOP_WINDOW) {
			if (message.options.userScriptEnabled && waitForUserScript) {
				await waitForUserScript(helper$2.ON_BEFORE_CAPTURE_EVENT_NAME);
			}
			sendInitResponse({ frames: [getFrameData(document$1, globalThis, windowId, message.options, message.scrolling)], sessionId, requestedFrameId: document$1.documentElement.dataset.requestedFrameId && windowId });
			if (message.options.userScriptEnabled && waitForUserScript) {
				await waitForUserScript(helper$2.ON_AFTER_CAPTURE_EVENT_NAME);
			}
			delete document$1.documentElement.dataset.requestedFrameId;
		}
	}

	function cleanupRequest(message) {
		if (!globalThis._singleFile_cleaningUp) {
			globalThis._singleFile_cleaningUp = true;
			const sessionId = message.sessionId;
			cleanupFrames(getFrames(document$1), message.windowId, sessionId);
		}
	}

	function initResponse(message) {
		message.frames.forEach(frameData => clearFrameTimeout("responseTimeouts", message.sessionId, frameData.windowId));
		const windowData = sessions.get(message.sessionId);
		if (windowData) {
			if (message.requestedFrameId) {
				windowData.requestedFrameId = message.requestedFrameId;
			}
			message.frames.forEach(messageFrameData => {
				let frameData = windowData.frames.find(frameData => messageFrameData.windowId == frameData.windowId);
				if (!frameData) {
					frameData = { windowId: messageFrameData.windowId };
					windowData.frames.push(frameData);
				}
				if (!frameData.processed) {
					frameData.content = messageFrameData.content;
					frameData.baseURI = messageFrameData.baseURI;
					frameData.title = messageFrameData.title;
					frameData.url = messageFrameData.url;
					frameData.canvases = messageFrameData.canvases;
					frameData.fonts = messageFrameData.fonts;
					frameData.stylesheets = messageFrameData.stylesheets;
					frameData.images = messageFrameData.images;
					frameData.posters = messageFrameData.posters;
					frameData.videos = messageFrameData.videos;
					frameData.usedFonts = messageFrameData.usedFonts;
					frameData.shadowRoots = messageFrameData.shadowRoots;
					frameData.processed = messageFrameData.processed;
					frameData.scrollPosition = messageFrameData.scrollPosition;
					frameData.scrolling = messageFrameData.scrolling;
					frameData.adoptedStyleSheets = messageFrameData.adoptedStyleSheets;
				}
			});
			const remainingFrames = windowData.frames.filter(frameData => !frameData.processed).length;
			if (!remainingFrames) {
				windowData.frames = windowData.frames.sort((frame1, frame2) => frame2.windowId.split(WINDOW_ID_SEPARATOR).length - frame1.windowId.split(WINDOW_ID_SEPARATOR).length);
				if (windowData.resolve) {
					if (windowData.requestedFrameId) {
						windowData.frames.forEach(frameData => {
							if (frameData.windowId == windowData.requestedFrameId) {
								frameData.requestedFrame = true;
							}
						});
					}
					windowData.resolve(windowData.frames);
				}
			}
		}
	}
	function processFrames(doc, options, parentWindowId, sessionId) {
		const frameElements = getFrames(doc);
		processFramesAsync(doc, frameElements, options, parentWindowId, sessionId);
		if (frameElements.length) {
			processFramesSync(doc, frameElements, options, parentWindowId, sessionId);
		}
	}

	function processFramesAsync(doc, frameElements, options, parentWindowId, sessionId) {
		const frames = [];
		let requestTimeouts;
		if (sessions.get(sessionId)) {
			requestTimeouts = sessions.get(sessionId).requestTimeouts;
		} else {
			requestTimeouts = {};
			sessions.set(sessionId, { requestTimeouts });
		}
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			frameElement.setAttribute(helper$2.WIN_ID_ATTRIBUTE_NAME, windowId);
			frames.push({ windowId });
		});
		sendInitResponse({ frames, sessionId, requestedFrameId: doc.documentElement.dataset.requestedFrameId && parentWindowId });
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			try {
				sendMessage(frameElement.contentWindow, { method: INIT_REQUEST_MESSAGE, windowId, sessionId, options, scrolling: frameElement.scrolling });
			} catch (error) {
				// ignored
			}
			requestTimeouts[windowId] = globalThis.setTimeout(() => sendInitResponse({ frames: [{ windowId, processed: true }], sessionId }), TIMEOUT_INIT_REQUEST_MESSAGE);
		});
		delete doc.documentElement.dataset.requestedFrameId;
	}

	function processFramesSync(doc, frameElements, options, parentWindowId, sessionId) {
		const frames = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			let frameDoc;
			try {
				frameDoc = frameElement.contentDocument;
			} catch (error) {
				// ignored
			}
			if (frameDoc) {
				try {
					const frameWindow = frameElement.contentWindow;
					frameWindow.stop();
					clearFrameTimeout("requestTimeouts", sessionId, windowId);
					processFrames(frameDoc, options, windowId, sessionId);
					frames.push(getFrameData(frameDoc, frameWindow, windowId, options, frameElement.scrolling));
				} catch (error) {
					frames.push({ windowId, processed: true });
				}
			}
		});
		sendInitResponse({ frames, sessionId, requestedFrameId: doc.documentElement.dataset.requestedFrameId && parentWindowId });
		delete doc.documentElement.dataset.requestedFrameId;
	}

	function clearFrameTimeout(type, sessionId, windowId) {
		const session = sessions.get(sessionId);
		if (session && session[type]) {
			const timeout = session[type][windowId];
			if (timeout) {
				globalThis.clearTimeout(timeout);
				delete session[type][windowId];
			}
		}
	}

	function createFrameResponseTimeout(sessionId, windowId) {
		const session = sessions.get(sessionId);
		if (session && session.responseTimeouts) {
			session.responseTimeouts[windowId] = globalThis.setTimeout(() => sendInitResponse({ frames: [{ windowId: windowId, processed: true }], sessionId: sessionId }), TIMEOUT_INIT_RESPONSE_MESSAGE);
		}
	}

	function cleanupFrames(frameElements, parentWindowId, sessionId) {
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			frameElement.removeAttribute(helper$2.WIN_ID_ATTRIBUTE_NAME);
			try {
				sendMessage(frameElement.contentWindow, { method: CLEANUP_REQUEST_MESSAGE, windowId, sessionId });
			} catch (error) {
				// ignored
			}
		});
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			let frameDoc;
			try {
				frameDoc = frameElement.contentDocument;
			} catch (error) {
				// ignored
			}
			if (frameDoc) {
				try {
					cleanupFrames(getFrames(frameDoc), windowId, sessionId);
				} catch (error) {
					// ignored
				}
			}
		});
	}

	function sendInitResponse(message) {
		message.method = INIT_RESPONSE_MESSAGE;
		try {
			top.singlefile.processors.frameTree.initResponse(message);
		} catch (error) {
			sendMessage(top, message, true);
		}
	}

	function sendMessage(targetWindow, message, useChannel) {
		if (targetWindow == top && browser && browser.runtime && browser.runtime.sendMessage) {
			browser.runtime.sendMessage(message);
		} else {
			if (useChannel) {
				const channel = new MessageChannel();
				targetWindow.postMessage(MESSAGE_PREFIX + JSON$4.stringify({ method: message.method, sessionId: message.sessionId }), TARGET_ORIGIN, [channel.port2]);
				channel.port1.postMessage(message);
			} else {
				targetWindow.postMessage(MESSAGE_PREFIX + JSON$4.stringify(message), TARGET_ORIGIN);
			}
		}
	}

	function getFrameData(document, globalThis, windowId, options, scrolling) {
		const docData = helper$2.preProcessDoc(document, globalThis, options);
		const content = helper$2.serialize(document);
		helper$2.postProcessDoc(document, docData.markedElements, docData.invalidElements);
		const baseURI = document.baseURI.split("#")[0];
		return {
			windowId,
			content,
			baseURI,
			url: document.location.href,
			title: document.title,
			canvases: docData.canvases,
			fonts: docData.fonts,
			stylesheets: docData.stylesheets,
			images: docData.images,
			posters: docData.posters,
			videos: docData.videos,
			usedFonts: docData.usedFonts,
			shadowRoots: docData.shadowRoots,
			scrollPosition: docData.scrollPosition,
			scrolling,
			adoptedStyleSheets: docData.adoptedStyleSheets,
			processed: true
		};
	}

	function getFrames(document) {
		let frames = Array.from(document.querySelectorAll(FRAMES_CSS_SELECTOR));
		document.querySelectorAll(ALL_ELEMENTS_CSS_SELECTOR).forEach(element => {
			const shadowRoot = helper$2.getShadowRoot(element);
			if (shadowRoot) {
				frames = frames.concat(...shadowRoot.querySelectorAll(FRAMES_CSS_SELECTOR));
			}
		});
		return frames;
	}

	var contentFrameTree = /*#__PURE__*/Object.freeze({
		__proto__: null,
		getAsync: getAsync,
		getSync: getSync,
		cleanup: cleanup,
		initResponse: initResponse,
		TIMEOUT_INIT_REQUEST_MESSAGE: TIMEOUT_INIT_REQUEST_MESSAGE
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	var index$2 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		compression: compression,
		frameTree: contentFrameTree,
		hooksFrames: contentHooksFrames,
		lazy: contentLazyLoader
	});

	// dist/csstree.esm.js from https://github.com/csstree/csstree/tree/612cc5f2922b2304869497d165a0cc65257f7a8b

	/*
	 * Copyright (C) 2016-2022 by Roman Dvornov
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */

	var rs=Object.create;var tr=Object.defineProperty;var ns=Object.getOwnPropertyDescriptor;var os=Object.getOwnPropertyNames;var is=Object.getPrototypeOf,as=Object.prototype.hasOwnProperty;var Oe=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),b=(e,t)=>{for(var r in t)tr(e,r,{get:t[r],enumerable:!0});},ss=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of os(t))!as.call(e,o)&&o!==r&&tr(e,o,{get:()=>t[o],enumerable:!(n=ns(t,o))||n.enumerable});return e};var ls=(e,t,r)=>(r=e!=null?rs(is(e)):{},ss(t||!e||!e.__esModule?tr(r,"default",{value:e,enumerable:!0}):r,e));var Jo=Oe(ur=>{var Zo="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");ur.encode=function(e){if(0<=e&&e<Zo.length)return Zo[e];throw new TypeError("Must be between 0 and 63: "+e)};ur.decode=function(e){var t=65,r=90,n=97,o=122,i=48,s=57,u=43,c=47,a=26,l=52;return t<=e&&e<=r?e-t:n<=e&&e<=o?e-n+a:i<=e&&e<=s?e-i+l:e==u?62:e==c?63:-1};});var oi=Oe(hr=>{var ei=Jo(),pr=5,ti=1<<pr,ri=ti-1,ni=ti;function ks(e){return e<0?(-e<<1)+1:(e<<1)+0}function ws(e){var t=(e&1)===1,r=e>>1;return t?-r:r}hr.encode=function(t){var r="",n,o=ks(t);do n=o&ri,o>>>=pr,o>0&&(n|=ni),r+=ei.encode(n);while(o>0);return r};hr.decode=function(t,r,n){var o=t.length,i=0,s=0,u,c;do{if(r>=o)throw new Error("Expected more digits in base 64 VLQ value.");if(c=ei.decode(t.charCodeAt(r++)),c===-1)throw new Error("Invalid base64 digit: "+t.charAt(r-1));u=!!(c&ni),c&=ri,i=i+(c<<s),s+=pr;}while(u);n.value=ws(i),n.rest=r;};});var Et=Oe(K=>{function vs(e,t,r){if(t in e)return e[t];if(arguments.length===3)return r;throw new Error('"'+t+'" is a required argument.')}K.getArg=vs;var ii=/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/,Ss=/^data:.+\,.+$/;function nt(e){var t=e.match(ii);return t?{scheme:t[1],auth:t[2],host:t[3],port:t[4],path:t[5]}:null}K.urlParse=nt;function Ue(e){var t="";return e.scheme&&(t+=e.scheme+":"),t+="//",e.auth&&(t+=e.auth+"@"),e.host&&(t+=e.host),e.port&&(t+=":"+e.port),e.path&&(t+=e.path),t}K.urlGenerate=Ue;var Cs=32;function As(e){var t=[];return function(r){for(var n=0;n<t.length;n++)if(t[n].input===r){var o=t[0];return t[0]=t[n],t[n]=o,t[0].result}var i=e(r);return t.unshift({input:r,result:i}),t.length>Cs&&t.pop(),i}}var mr=As(function(t){var r=t,n=nt(t);if(n){if(!n.path)return t;r=n.path;}for(var o=K.isAbsolute(r),i=[],s=0,u=0;;)if(s=u,u=r.indexOf("/",s),u===-1){i.push(r.slice(s));break}else for(i.push(r.slice(s,u));u<r.length&&r[u]==="/";)u++;for(var c,a=0,u=i.length-1;u>=0;u--)c=i[u],c==="."?i.splice(u,1):c===".."?a++:a>0&&(c===""?(i.splice(u+1,a),a=0):(i.splice(u,2),a--));return r=i.join("/"),r===""&&(r=o?"/":"."),n?(n.path=r,Ue(n)):r});K.normalize=mr;function ai(e,t){e===""&&(e="."),t===""&&(t=".");var r=nt(t),n=nt(e);if(n&&(e=n.path||"/"),r&&!r.scheme)return n&&(r.scheme=n.scheme),Ue(r);if(r||t.match(Ss))return t;if(n&&!n.host&&!n.path)return n.host=t,Ue(n);var o=t.charAt(0)==="/"?t:mr(e.replace(/\/+$/,"")+"/"+t);return n?(n.path=o,Ue(n)):o}K.join=ai;K.isAbsolute=function(e){return e.charAt(0)==="/"||ii.test(e)};function Ts(e,t){e===""&&(e="."),e=e.replace(/\/$/,"");for(var r=0;t.indexOf(e+"/")!==0;){var n=e.lastIndexOf("/");if(n<0||(e=e.slice(0,n),e.match(/^([^\/]+:\/)?\/*$/)))return t;++r;}return Array(r+1).join("../")+t.substr(e.length+1)}K.relative=Ts;var si=function(){var e=Object.create(null);return !("__proto__"in e)}();function li(e){return e}function Es(e){return ci(e)?"$"+e:e}K.toSetString=si?li:Es;function Ls(e){return ci(e)?e.slice(1):e}K.fromSetString=si?li:Ls;function ci(e){if(!e)return !1;var t=e.length;if(t<9||e.charCodeAt(t-1)!==95||e.charCodeAt(t-2)!==95||e.charCodeAt(t-3)!==111||e.charCodeAt(t-4)!==116||e.charCodeAt(t-5)!==111||e.charCodeAt(t-6)!==114||e.charCodeAt(t-7)!==112||e.charCodeAt(t-8)!==95||e.charCodeAt(t-9)!==95)return !1;for(var r=t-10;r>=0;r--)if(e.charCodeAt(r)!==36)return !1;return !0}function Ps(e,t,r){var n=be(e.source,t.source);return n!==0||(n=e.originalLine-t.originalLine,n!==0)||(n=e.originalColumn-t.originalColumn,n!==0||r)||(n=e.generatedColumn-t.generatedColumn,n!==0)||(n=e.generatedLine-t.generatedLine,n!==0)?n:be(e.name,t.name)}K.compareByOriginalPositions=Ps;function Is(e,t,r){var n;return n=e.originalLine-t.originalLine,n!==0||(n=e.originalColumn-t.originalColumn,n!==0||r)||(n=e.generatedColumn-t.generatedColumn,n!==0)||(n=e.generatedLine-t.generatedLine,n!==0)?n:be(e.name,t.name)}K.compareByOriginalPositionsNoSource=Is;function Ds(e,t,r){var n=e.generatedLine-t.generatedLine;return n!==0||(n=e.generatedColumn-t.generatedColumn,n!==0||r)||(n=be(e.source,t.source),n!==0)||(n=e.originalLine-t.originalLine,n!==0)||(n=e.originalColumn-t.originalColumn,n!==0)?n:be(e.name,t.name)}K.compareByGeneratedPositionsDeflated=Ds;function Os(e,t,r){var n=e.generatedColumn-t.generatedColumn;return n!==0||r||(n=be(e.source,t.source),n!==0)||(n=e.originalLine-t.originalLine,n!==0)||(n=e.originalColumn-t.originalColumn,n!==0)?n:be(e.name,t.name)}K.compareByGeneratedPositionsDeflatedNoLine=Os;function be(e,t){return e===t?0:e===null?1:t===null?-1:e>t?1:-1}function Ns(e,t){var r=e.generatedLine-t.generatedLine;return r!==0||(r=e.generatedColumn-t.generatedColumn,r!==0)||(r=be(e.source,t.source),r!==0)||(r=e.originalLine-t.originalLine,r!==0)||(r=e.originalColumn-t.originalColumn,r!==0)?r:be(e.name,t.name)}K.compareByGeneratedPositionsInflated=Ns;function zs(e){return JSON.parse(e.replace(/^\)]}'[^\n]*\n/,""))}K.parseSourceMapInput=zs;function Ms(e,t,r){if(t=t||"",e&&(e[e.length-1]!=="/"&&t[0]!=="/"&&(e+="/"),t=e+t),r){var n=nt(r);if(!n)throw new Error("sourceMapURL could not be parsed");if(n.path){var o=n.path.lastIndexOf("/");o>=0&&(n.path=n.path.substring(0,o+1));}t=ai(Ue(n),t);}return mr(t)}K.computeSourceURL=Ms;});var pi=Oe(ui=>{var fr=Et(),dr=Object.prototype.hasOwnProperty,Le=typeof Map<"u";function xe(){this._array=[],this._set=Le?new Map:Object.create(null);}xe.fromArray=function(t,r){for(var n=new xe,o=0,i=t.length;o<i;o++)n.add(t[o],r);return n};xe.prototype.size=function(){return Le?this._set.size:Object.getOwnPropertyNames(this._set).length};xe.prototype.add=function(t,r){var n=Le?t:fr.toSetString(t),o=Le?this.has(t):dr.call(this._set,n),i=this._array.length;(!o||r)&&this._array.push(t),o||(Le?this._set.set(t,i):this._set[n]=i);};xe.prototype.has=function(t){if(Le)return this._set.has(t);var r=fr.toSetString(t);return dr.call(this._set,r)};xe.prototype.indexOf=function(t){if(Le){var r=this._set.get(t);if(r>=0)return r}else {var n=fr.toSetString(t);if(dr.call(this._set,n))return this._set[n]}throw new Error('"'+t+'" is not in the set.')};xe.prototype.at=function(t){if(t>=0&&t<this._array.length)return this._array[t];throw new Error("No element indexed by "+t)};xe.prototype.toArray=function(){return this._array.slice()};ui.ArraySet=xe;});var fi=Oe(mi=>{var hi=Et();function Rs(e,t){var r=e.generatedLine,n=t.generatedLine,o=e.generatedColumn,i=t.generatedColumn;return n>r||n==r&&i>=o||hi.compareByGeneratedPositionsInflated(e,t)<=0}function Lt(){this._array=[],this._sorted=!0,this._last={generatedLine:-1,generatedColumn:0};}Lt.prototype.unsortedForEach=function(t,r){this._array.forEach(t,r);};Lt.prototype.add=function(t){Rs(this._last,t)?(this._last=t,this._array.push(t)):(this._sorted=!1,this._array.push(t));};Lt.prototype.toArray=function(){return this._sorted||(this._array.sort(hi.compareByGeneratedPositionsInflated),this._sorted=!0),this._array};mi.MappingList=Lt;});var gi=Oe(di=>{var ot=oi(),q=Et(),Pt=pi().ArraySet,Fs=fi().MappingList;function oe(e){e||(e={}),this._file=q.getArg(e,"file",null),this._sourceRoot=q.getArg(e,"sourceRoot",null),this._skipValidation=q.getArg(e,"skipValidation",!1),this._sources=new Pt,this._names=new Pt,this._mappings=new Fs,this._sourcesContents=null;}oe.prototype._version=3;oe.fromSourceMap=function(t){var r=t.sourceRoot,n=new oe({file:t.file,sourceRoot:r});return t.eachMapping(function(o){var i={generated:{line:o.generatedLine,column:o.generatedColumn}};o.source!=null&&(i.source=o.source,r!=null&&(i.source=q.relative(r,i.source)),i.original={line:o.originalLine,column:o.originalColumn},o.name!=null&&(i.name=o.name)),n.addMapping(i);}),t.sources.forEach(function(o){var i=o;r!==null&&(i=q.relative(r,o)),n._sources.has(i)||n._sources.add(i);var s=t.sourceContentFor(o);s!=null&&n.setSourceContent(o,s);}),n};oe.prototype.addMapping=function(t){var r=q.getArg(t,"generated"),n=q.getArg(t,"original",null),o=q.getArg(t,"source",null),i=q.getArg(t,"name",null);this._skipValidation||this._validateMapping(r,n,o,i),o!=null&&(o=String(o),this._sources.has(o)||this._sources.add(o)),i!=null&&(i=String(i),this._names.has(i)||this._names.add(i)),this._mappings.add({generatedLine:r.line,generatedColumn:r.column,originalLine:n!=null&&n.line,originalColumn:n!=null&&n.column,source:o,name:i});};oe.prototype.setSourceContent=function(t,r){var n=t;this._sourceRoot!=null&&(n=q.relative(this._sourceRoot,n)),r!=null?(this._sourcesContents||(this._sourcesContents=Object.create(null)),this._sourcesContents[q.toSetString(n)]=r):this._sourcesContents&&(delete this._sourcesContents[q.toSetString(n)],Object.keys(this._sourcesContents).length===0&&(this._sourcesContents=null));};oe.prototype.applySourceMap=function(t,r,n){var o=r;if(r==null){if(t.file==null)throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);o=t.file;}var i=this._sourceRoot;i!=null&&(o=q.relative(i,o));var s=new Pt,u=new Pt;this._mappings.unsortedForEach(function(c){if(c.source===o&&c.originalLine!=null){var a=t.originalPositionFor({line:c.originalLine,column:c.originalColumn});a.source!=null&&(c.source=a.source,n!=null&&(c.source=q.join(n,c.source)),i!=null&&(c.source=q.relative(i,c.source)),c.originalLine=a.line,c.originalColumn=a.column,a.name!=null&&(c.name=a.name));}var l=c.source;l!=null&&!s.has(l)&&s.add(l);var p=c.name;p!=null&&!u.has(p)&&u.add(p);},this),this._sources=s,this._names=u,t.sources.forEach(function(c){var a=t.sourceContentFor(c);a!=null&&(n!=null&&(c=q.join(n,c)),i!=null&&(c=q.relative(i,c)),this.setSourceContent(c,a));},this);};oe.prototype._validateMapping=function(t,r,n,o){if(r&&typeof r.line!="number"&&typeof r.column!="number")throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");if(!(t&&"line"in t&&"column"in t&&t.line>0&&t.column>=0&&!r&&!n&&!o)){if(t&&"line"in t&&"column"in t&&r&&"line"in r&&"column"in r&&t.line>0&&t.column>=0&&r.line>0&&r.column>=0&&n)return;throw new Error("Invalid mapping: "+JSON.stringify({generated:t,source:n,original:r,name:o}))}};oe.prototype._serializeMappings=function(){for(var t=0,r=1,n=0,o=0,i=0,s=0,u="",c,a,l,p,m=this._mappings.toArray(),f=0,P=m.length;f<P;f++){if(a=m[f],c="",a.generatedLine!==r)for(t=0;a.generatedLine!==r;)c+=";",r++;else if(f>0){if(!q.compareByGeneratedPositionsInflated(a,m[f-1]))continue;c+=",";}c+=ot.encode(a.generatedColumn-t),t=a.generatedColumn,a.source!=null&&(p=this._sources.indexOf(a.source),c+=ot.encode(p-s),s=p,c+=ot.encode(a.originalLine-1-o),o=a.originalLine-1,c+=ot.encode(a.originalColumn-n),n=a.originalColumn,a.name!=null&&(l=this._names.indexOf(a.name),c+=ot.encode(l-i),i=l)),u+=c;}return u};oe.prototype._generateSourcesContent=function(t,r){return t.map(function(n){if(!this._sourcesContents)return null;r!=null&&(n=q.relative(r,n));var o=q.toSetString(n);return Object.prototype.hasOwnProperty.call(this._sourcesContents,o)?this._sourcesContents[o]:null},this)};oe.prototype.toJSON=function(){var t={version:this._version,sources:this._sources.toArray(),names:this._names.toArray(),mappings:this._serializeMappings()};return this._file!=null&&(t.file=this._file),this._sourceRoot!=null&&(t.sourceRoot=this._sourceRoot),this._sourcesContents&&(t.sourcesContent=this._generateSourcesContent(t.sources,t.sourceRoot)),t};oe.prototype.toString=function(){return JSON.stringify(this.toJSON())};di.SourceMapGenerator=oe;});var $e={};b($e,{AtKeyword:()=>I,BadString:()=>Ae,BadUrl:()=>Y,CDC:()=>j,CDO:()=>ue,Colon:()=>O,Comma:()=>G,Comment:()=>E,Delim:()=>g,Dimension:()=>y,EOF:()=>Xe,Function:()=>x,Hash:()=>v,Ident:()=>h,LeftCurlyBracket:()=>M,LeftParenthesis:()=>T,LeftSquareBracket:()=>U,Number:()=>d,Percentage:()=>A,RightCurlyBracket:()=>H,RightParenthesis:()=>w,RightSquareBracket:()=>V,Semicolon:()=>_,String:()=>W,Url:()=>F,WhiteSpace:()=>k});var Xe=0,h=1,x=2,I=3,v=4,W=5,Ae=6,F=7,Y=8,g=9,d=10,A=11,y=12,k=13,ue=14,j=15,O=16,_=17,G=18,U=19,V=20,T=21,w=22,M=23,H=24,E=25;function B(e){return e>=48&&e<=57}function ee(e){return B(e)||e>=65&&e<=70||e>=97&&e<=102}function yt(e){return e>=65&&e<=90}function cs(e){return e>=97&&e<=122}function us(e){return yt(e)||cs(e)}function ps(e){return e>=128}function xt(e){return us(e)||ps(e)||e===95}function Ne(e){return xt(e)||B(e)||e===45}function hs(e){return e>=0&&e<=8||e===11||e>=14&&e<=31||e===127}function Ze(e){return e===10||e===13||e===12}function pe(e){return Ze(e)||e===32||e===9}function $(e,t){return !(e!==92||Ze(t)||t===0)}function ze(e,t,r){return e===45?xt(t)||t===45||$(t,r):xt(e)?!0:e===92?$(e,t):!1}function kt(e,t,r){return e===43||e===45?B(t)?2:t===46&&B(r)?3:0:e===46?B(t)?2:0:B(e)?1:0}function wt(e){return e===65279||e===65534?1:0}var rr=new Array(128),ms=128,Je=130,nr=131,vt=132,or=133;for(let e=0;e<rr.length;e++)rr[e]=pe(e)&&Je||B(e)&&nr||xt(e)&&vt||hs(e)&&or||e||ms;function St(e){return e<128?rr[e]:vt}function Me(e,t){return t<e.length?e.charCodeAt(t):0}function Ct(e,t,r){return r===13&&Me(e,t+1)===10?2:1}function de(e,t,r){let n=e.charCodeAt(t);return yt(n)&&(n=n|32),n===r}function ge(e,t,r,n){if(r-t!==n.length||t<0||r>e.length)return !1;for(let o=t;o<r;o++){let i=n.charCodeAt(o-t),s=e.charCodeAt(o);if(yt(s)&&(s=s|32),s!==i)return !1}return !0}function Uo(e,t){for(;t>=0&&pe(e.charCodeAt(t));t--);return t+1}function et(e,t){for(;t<e.length&&pe(e.charCodeAt(t));t++);return t}function ir(e,t){for(;t<e.length&&B(e.charCodeAt(t));t++);return t}function se(e,t){if(t+=2,ee(Me(e,t-1))){for(let n=Math.min(e.length,t+5);t<n&&ee(Me(e,t));t++);let r=Me(e,t);pe(r)&&(t+=Ct(e,t,r));}return t}function tt(e,t){for(;t<e.length;t++){let r=e.charCodeAt(t);if(!Ne(r)){if($(r,Me(e,t+1))){t=se(e,t)-1;continue}break}}return t}function Te(e,t){let r=e.charCodeAt(t);if((r===43||r===45)&&(r=e.charCodeAt(t+=1)),B(r)&&(t=ir(e,t+1),r=e.charCodeAt(t)),r===46&&B(e.charCodeAt(t+1))&&(t+=2,t=ir(e,t)),de(e,t,101)){let n=0;r=e.charCodeAt(t+1),(r===45||r===43)&&(n=1,r=e.charCodeAt(t+2)),B(r)&&(t=ir(e,t+1+n+1));}return t}function At(e,t){for(;t<e.length;t++){let r=e.charCodeAt(t);if(r===41){t++;break}$(r,Me(e,t+1))&&(t=se(e,t));}return t}function Re(e){if(e.length===1&&!ee(e.charCodeAt(0)))return e[0];let t=parseInt(e,16);return (t===0||t>=55296&&t<=57343||t>1114111)&&(t=65533),String.fromCodePoint(t)}var Fe=["EOF-token","ident-token","function-token","at-keyword-token","hash-token","string-token","bad-string-token","url-token","bad-url-token","delim-token","number-token","percentage-token","dimension-token","whitespace-token","CDO-token","CDC-token","colon-token","semicolon-token","comma-token","[-token","]-token","(-token",")-token","{-token","}-token","comment-token"];function Be(e=null,t){return e===null||e.length<t?new Uint32Array(Math.max(t+1024,16384)):e}var jo=10,fs=12,qo=13;function Wo(e){let t=e.source,r=t.length,n=t.length>0?wt(t.charCodeAt(0)):0,o=Be(e.lines,r),i=Be(e.columns,r),s=e.startLine,u=e.startColumn;for(let c=n;c<r;c++){let a=t.charCodeAt(c);o[c]=s,i[c]=u++,(a===jo||a===qo||a===fs)&&(a===qo&&c+1<r&&t.charCodeAt(c+1)===jo&&(c++,o[c]=s,i[c]=u),s++,u=1);}o[r]=s,i[r]=u,e.lines=o,e.columns=i,e.computed=!0;}var Tt=class{constructor(){this.lines=null,this.columns=null,this.computed=!1;}setSource(t,r=0,n=1,o=1){this.source=t,this.startOffset=r,this.startLine=n,this.startColumn=o,this.computed=!1;}getLocation(t,r){return this.computed||Wo(this),{source:r,offset:this.startOffset+t,line:this.lines[t],column:this.columns[t]}}getLocationRange(t,r,n){return this.computed||Wo(this),{source:n,start:{offset:this.startOffset+t,line:this.lines[t],column:this.columns[t]},end:{offset:this.startOffset+r,line:this.lines[r],column:this.columns[r]}}}};var ne=16777215,we=24,ds=new Map([[2,22],[21,22],[19,20],[23,24]]),rt=class{constructor(t,r){this.setSource(t,r);}reset(){this.eof=!1,this.tokenIndex=-1,this.tokenType=0,this.tokenStart=this.firstCharOffset,this.tokenEnd=this.firstCharOffset;}setSource(t="",r=()=>{}){t=String(t||"");let n=t.length,o=Be(this.offsetAndType,t.length+1),i=Be(this.balance,t.length+1),s=0,u=0,c=0,a=-1;for(this.offsetAndType=null,this.balance=null,r(t,(l,p,m)=>{switch(l){default:i[s]=n;break;case u:{let f=c&ne;for(c=i[f],u=c>>we,i[s]=f,i[f++]=s;f<s;f++)i[f]===n&&(i[f]=s);break}case 21:case 2:case 19:case 23:i[s]=c,u=ds.get(l),c=u<<we|s;break}o[s++]=l<<we|m,a===-1&&(a=p);}),o[s]=0<<we|n,i[s]=n,i[n]=n;c!==0;){let l=c&ne;c=i[l],i[l]=n;}this.source=t,this.firstCharOffset=a===-1?0:a,this.tokenCount=s,this.offsetAndType=o,this.balance=i,this.reset(),this.next();}lookupType(t){return t+=this.tokenIndex,t<this.tokenCount?this.offsetAndType[t]>>we:0}lookupOffset(t){return t+=this.tokenIndex,t<this.tokenCount?this.offsetAndType[t-1]&ne:this.source.length}lookupValue(t,r){return t+=this.tokenIndex,t<this.tokenCount?ge(this.source,this.offsetAndType[t-1]&ne,this.offsetAndType[t]&ne,r):!1}getTokenStart(t){return t===this.tokenIndex?this.tokenStart:t>0?t<this.tokenCount?this.offsetAndType[t-1]&ne:this.offsetAndType[this.tokenCount]&ne:this.firstCharOffset}substrToCursor(t){return this.source.substring(t,this.tokenStart)}isBalanceEdge(t){return this.balance[this.tokenIndex]<t}isDelim(t,r){return r?this.lookupType(r)===9&&this.source.charCodeAt(this.lookupOffset(r))===t:this.tokenType===9&&this.source.charCodeAt(this.tokenStart)===t}skip(t){let r=this.tokenIndex+t;r<this.tokenCount?(this.tokenIndex=r,this.tokenStart=this.offsetAndType[r-1]&ne,r=this.offsetAndType[r],this.tokenType=r>>we,this.tokenEnd=r&ne):(this.tokenIndex=this.tokenCount,this.next());}next(){let t=this.tokenIndex+1;t<this.tokenCount?(this.tokenIndex=t,this.tokenStart=this.tokenEnd,t=this.offsetAndType[t],this.tokenType=t>>we,this.tokenEnd=t&ne):(this.eof=!0,this.tokenIndex=this.tokenCount,this.tokenType=0,this.tokenStart=this.tokenEnd=this.source.length);}skipSC(){for(;this.tokenType===13||this.tokenType===25;)this.next();}skipUntilBalanced(t,r){let n=t,o,i;e:for(;n<this.tokenCount;n++){if(o=this.balance[n],o<t)break e;switch(i=n>0?this.offsetAndType[n-1]&ne:this.firstCharOffset,r(this.source.charCodeAt(i))){case 1:break e;case 2:n++;break e;default:this.balance[o]===n&&(n=o);}}this.skip(n-this.tokenIndex);}forEachToken(t){for(let r=0,n=this.firstCharOffset;r<this.tokenCount;r++){let o=n,i=this.offsetAndType[r],s=i&ne,u=i>>we;n=s,t(u,o,s,r);}}dump(){let t=new Array(this.tokenCount);return this.forEachToken((r,n,o,i)=>{t[i]={idx:i,type:Fe[r],chunk:this.source.substring(n,o),balance:this.balance[i]};}),t}};function ve(e,t){function r(p){return p<u?e.charCodeAt(p):0}function n(){if(a=Te(e,a),ze(r(a),r(a+1),r(a+2))){l=12,a=tt(e,a);return}if(r(a)===37){l=11,a++;return}l=10;}function o(){let p=a;if(a=tt(e,a),ge(e,p,a,"url")&&r(a)===40){if(a=et(e,a+1),r(a)===34||r(a)===39){l=2,a=p+4;return}s();return}if(r(a)===40){l=2,a++;return}l=1;}function i(p){for(p||(p=r(a++)),l=5;a<e.length;a++){let m=e.charCodeAt(a);switch(St(m)){case p:a++;return;case Je:if(Ze(m)){a+=Ct(e,a,m),l=6;return}break;case 92:if(a===e.length-1)break;let f=r(a+1);Ze(f)?a+=Ct(e,a+1,f):$(m,f)&&(a=se(e,a)-1);break}}}function s(){for(l=7,a=et(e,a);a<e.length;a++){let p=e.charCodeAt(a);switch(St(p)){case 41:a++;return;case Je:if(a=et(e,a),r(a)===41||a>=e.length){a<e.length&&a++;return}a=At(e,a),l=8;return;case 34:case 39:case 40:case or:a=At(e,a),l=8;return;case 92:if($(p,r(a+1))){a=se(e,a)-1;break}a=At(e,a),l=8;return}}}e=String(e||"");let u=e.length,c=wt(r(0)),a=c,l;for(;a<u;){let p=e.charCodeAt(a);switch(St(p)){case Je:l=13,a=et(e,a+1);break;case 34:i();break;case 35:Ne(r(a+1))||$(r(a+1),r(a+2))?(l=4,a=tt(e,a+1)):(l=9,a++);break;case 39:i();break;case 40:l=21,a++;break;case 41:l=22,a++;break;case 43:kt(p,r(a+1),r(a+2))?n():(l=9,a++);break;case 44:l=18,a++;break;case 45:kt(p,r(a+1),r(a+2))?n():r(a+1)===45&&r(a+2)===62?(l=15,a=a+3):ze(p,r(a+1),r(a+2))?o():(l=9,a++);break;case 46:kt(p,r(a+1),r(a+2))?n():(l=9,a++);break;case 47:r(a+1)===42?(l=25,a=e.indexOf("*/",a+2),a=a===-1?e.length:a+2):(l=9,a++);break;case 58:l=16,a++;break;case 59:l=17,a++;break;case 60:r(a+1)===33&&r(a+2)===45&&r(a+3)===45?(l=14,a=a+4):(l=9,a++);break;case 64:ze(r(a+1),r(a+2),r(a+3))?(l=3,a=tt(e,a+1)):(l=9,a++);break;case 91:l=19,a++;break;case 92:$(p,r(a+1))?o():(l=9,a++);break;case 93:l=20,a++;break;case 123:l=23,a++;break;case 125:l=24,a++;break;case nr:n();break;case vt:o();break;default:l=9,a++;}t(l,c,c=a);}}var _e=null,D=class{static createItem(t){return {prev:null,next:null,data:t}}constructor(){this.head=null,this.tail=null,this.cursor=null;}createItem(t){return D.createItem(t)}allocateCursor(t,r){let n;return _e!==null?(n=_e,_e=_e.cursor,n.prev=t,n.next=r,n.cursor=this.cursor):n={prev:t,next:r,cursor:this.cursor},this.cursor=n,n}releaseCursor(){let{cursor:t}=this;this.cursor=t.cursor,t.prev=null,t.next=null,t.cursor=_e,_e=t;}updateCursors(t,r,n,o){let{cursor:i}=this;for(;i!==null;)i.prev===t&&(i.prev=r),i.next===n&&(i.next=o),i=i.cursor;}*[Symbol.iterator](){for(let t=this.head;t!==null;t=t.next)yield t.data;}get size(){let t=0;for(let r=this.head;r!==null;r=r.next)t++;return t}get isEmpty(){return this.head===null}get first(){return this.head&&this.head.data}get last(){return this.tail&&this.tail.data}fromArray(t){let r=null;this.head=null;for(let n of t){let o=D.createItem(n);r!==null?r.next=o:this.head=o,o.prev=r,r=o;}return this.tail=r,this}toArray(){return [...this]}toJSON(){return [...this]}forEach(t,r=this){let n=this.allocateCursor(null,this.head);for(;n.next!==null;){let o=n.next;n.next=o.next,t.call(r,o.data,o,this);}this.releaseCursor();}forEachRight(t,r=this){let n=this.allocateCursor(this.tail,null);for(;n.prev!==null;){let o=n.prev;n.prev=o.prev,t.call(r,o.data,o,this);}this.releaseCursor();}reduce(t,r,n=this){let o=this.allocateCursor(null,this.head),i=r,s;for(;o.next!==null;)s=o.next,o.next=s.next,i=t.call(n,i,s.data,s,this);return this.releaseCursor(),i}reduceRight(t,r,n=this){let o=this.allocateCursor(this.tail,null),i=r,s;for(;o.prev!==null;)s=o.prev,o.prev=s.prev,i=t.call(n,i,s.data,s,this);return this.releaseCursor(),i}some(t,r=this){for(let n=this.head;n!==null;n=n.next)if(t.call(r,n.data,n,this))return !0;return !1}map(t,r=this){let n=new D;for(let o=this.head;o!==null;o=o.next)n.appendData(t.call(r,o.data,o,this));return n}filter(t,r=this){let n=new D;for(let o=this.head;o!==null;o=o.next)t.call(r,o.data,o,this)&&n.appendData(o.data);return n}nextUntil(t,r,n=this){if(t===null)return;let o=this.allocateCursor(null,t);for(;o.next!==null;){let i=o.next;if(o.next=i.next,r.call(n,i.data,i,this))break}this.releaseCursor();}prevUntil(t,r,n=this){if(t===null)return;let o=this.allocateCursor(t,null);for(;o.prev!==null;){let i=o.prev;if(o.prev=i.prev,r.call(n,i.data,i,this))break}this.releaseCursor();}clear(){this.head=null,this.tail=null;}copy(){let t=new D;for(let r of this)t.appendData(r);return t}prepend(t){return this.updateCursors(null,t,this.head,t),this.head!==null?(this.head.prev=t,t.next=this.head):this.tail=t,this.head=t,this}prependData(t){return this.prepend(D.createItem(t))}append(t){return this.insert(t)}appendData(t){return this.insert(D.createItem(t))}insert(t,r=null){if(r!==null)if(this.updateCursors(r.prev,t,r,t),r.prev===null){if(this.head!==r)throw new Error("before doesn't belong to list");this.head=t,r.prev=t,t.next=r,this.updateCursors(null,t);}else r.prev.next=t,t.prev=r.prev,r.prev=t,t.next=r;else this.updateCursors(this.tail,t,null,t),this.tail!==null?(this.tail.next=t,t.prev=this.tail):this.head=t,this.tail=t;return this}insertData(t,r){return this.insert(D.createItem(t),r)}remove(t){if(this.updateCursors(t,t.prev,t,t.next),t.prev!==null)t.prev.next=t.next;else {if(this.head!==t)throw new Error("item doesn't belong to list");this.head=t.next;}if(t.next!==null)t.next.prev=t.prev;else {if(this.tail!==t)throw new Error("item doesn't belong to list");this.tail=t.prev;}return t.prev=null,t.next=null,t}push(t){this.insert(D.createItem(t));}pop(){return this.tail!==null?this.remove(this.tail):null}unshift(t){this.prepend(D.createItem(t));}shift(){return this.head!==null?this.remove(this.head):null}prependList(t){return this.insertList(t,this.head)}appendList(t){return this.insertList(t)}insertList(t,r){return t.head===null?this:(r!=null?(this.updateCursors(r.prev,t.tail,r,t.head),r.prev!==null?(r.prev.next=t.head,t.head.prev=r.prev):this.head=t.head,r.prev=t.tail,t.tail.next=r):(this.updateCursors(this.tail,t.tail,null,t.head),this.tail!==null?(this.tail.next=t.head,t.head.prev=this.tail):this.head=t.head,this.tail=t.tail),t.head=null,t.tail=null,this)}replace(t,r){"head"in r?this.insertList(r,t):this.insert(r,t),this.remove(t);}};function Ee(e,t){let r=Object.create(SyntaxError.prototype),n=new Error;return Object.assign(r,{name:e,message:t,get stack(){return (n.stack||"").replace(/^(.+\n){1,3}/,`${e}: ${t}
`)}})}var ar=100,Ho=60,Yo="    ";function Go({source:e,line:t,column:r},n){function o(l,p){return i.slice(l,p).map((m,f)=>String(l+f+1).padStart(c)+" |"+m).join(`
`)}let i=e.split(/\r\n?|\n|\f/),s=Math.max(1,t-n)-1,u=Math.min(t+n,i.length+1),c=Math.max(4,String(u).length)+1,a=0;r+=(Yo.length-1)*(i[t-1].substr(0,r-1).match(/\t/g)||[]).length,r>ar&&(a=r-Ho+3,r=Ho-2);for(let l=s;l<=u;l++)l>=0&&l<i.length&&(i[l]=i[l].replace(/\t/g,Yo),i[l]=(a>0&&i[l].length>a?"\u2026":"")+i[l].substr(a,ar-2)+(i[l].length>a+ar-1?"\u2026":""));return [o(s,t),new Array(r+c+2).join("-")+"^",o(t,u)].filter(Boolean).join(`
`)}function sr(e,t,r,n,o){return Object.assign(Ee("SyntaxError",e),{source:t,offset:r,line:n,column:o,sourceFragment(s){return Go({source:t,line:n,column:o},isNaN(s)?0:s)},get formattedMessage(){return `Parse error: ${e}
`+Go({source:t,line:n,column:o},2)}})}function Vo(e){let t=this.createList(),r=!1,n={recognizer:e};for(;!this.eof;){switch(this.tokenType){case 25:this.next();continue;case 13:r=!0,this.next();continue}let o=e.getNode.call(this,n);if(o===void 0)break;r&&(e.onWhiteSpace&&e.onWhiteSpace.call(this,o,t,n),r=!1),t.push(o);}return r&&e.onWhiteSpace&&e.onWhiteSpace.call(this,null,t,n),t}var Ko=()=>{},gs=33,bs=35,lr=59,Qo=123,Xo=0;function xs(e){return function(){return this[e]()}}function cr(e){let t=Object.create(null);for(let r in e){let n=e[r],o=n.parse||n;o&&(t[r]=o);}return t}function ys(e){let t={context:Object.create(null),scope:Object.assign(Object.create(null),e.scope),atrule:cr(e.atrule),pseudo:cr(e.pseudo),node:cr(e.node)};for(let r in e.parseContext)switch(typeof e.parseContext[r]){case"function":t.context[r]=e.parseContext[r];break;case"string":t.context[r]=xs(e.parseContext[r]);break}return {config:t,...t,...t.node}}function $o(e){let t="",r="<unknown>",n=!1,o=Ko,i=!1,s=new Tt,u=Object.assign(new rt,ys(e||{}),{parseAtrulePrelude:!0,parseRulePrelude:!0,parseValue:!0,parseCustomProperty:!1,readSequence:Vo,consumeUntilBalanceEnd:()=>0,consumeUntilLeftCurlyBracket(a){return a===Qo?1:0},consumeUntilLeftCurlyBracketOrSemicolon(a){return a===Qo||a===lr?1:0},consumeUntilExclamationMarkOrSemicolon(a){return a===gs||a===lr?1:0},consumeUntilSemicolonIncluded(a){return a===lr?2:0},createList(){return new D},createSingleNodeList(a){return new D().appendData(a)},getFirstListNode(a){return a&&a.first},getLastListNode(a){return a&&a.last},parseWithFallback(a,l){let p=this.tokenIndex;try{return a.call(this)}catch(m){if(i)throw m;let f=l.call(this,p);return i=!0,o(m,f),i=!1,f}},lookupNonWSType(a){let l;do if(l=this.lookupType(a++),l!==13)return l;while(l!==Xo);return Xo},charCodeAt(a){return a>=0&&a<t.length?t.charCodeAt(a):0},substring(a,l){return t.substring(a,l)},substrToCursor(a){return this.source.substring(a,this.tokenStart)},cmpChar(a,l){return de(t,a,l)},cmpStr(a,l,p){return ge(t,a,l,p)},consume(a){let l=this.tokenStart;return this.eat(a),this.substrToCursor(l)},consumeFunctionName(){let a=t.substring(this.tokenStart,this.tokenEnd-1);return this.eat(2),a},consumeNumber(a){let l=t.substring(this.tokenStart,Te(t,this.tokenStart));return this.eat(a),l},eat(a){if(this.tokenType!==a){let l=Fe[a].slice(0,-6).replace(/-/g," ").replace(/^./,f=>f.toUpperCase()),p=`${/[[\](){}]/.test(l)?`"${l}"`:l} is expected`,m=this.tokenStart;switch(a){case 1:this.tokenType===2||this.tokenType===7?(m=this.tokenEnd-1,p="Identifier is expected but function found"):p="Identifier is expected";break;case 4:this.isDelim(bs)&&(this.next(),m++,p="Name is expected");break;case 11:this.tokenType===10&&(m=this.tokenEnd,p="Percent sign is expected");break}this.error(p,m);}this.next();},eatIdent(a){(this.tokenType!==1||this.lookupValue(0,a)===!1)&&this.error(`Identifier "${a}" is expected`),this.next();},eatDelim(a){this.isDelim(a)||this.error(`Delim "${String.fromCharCode(a)}" is expected`),this.next();},getLocation(a,l){return n?s.getLocationRange(a,l,r):null},getLocationFromList(a){if(n){let l=this.getFirstListNode(a),p=this.getLastListNode(a);return s.getLocationRange(l!==null?l.loc.start.offset-s.startOffset:this.tokenStart,p!==null?p.loc.end.offset-s.startOffset:this.tokenStart,r)}return null},error(a,l){let p=typeof l<"u"&&l<t.length?s.getLocation(l):this.eof?s.getLocation(Uo(t,t.length-1)):s.getLocation(this.tokenStart);throw new sr(a||"Unexpected input",t,p.offset,p.line,p.column)}});return Object.assign(function(a,l){t=a,l=l||{},u.setSource(t,ve),s.setSource(t,l.offset,l.line,l.column),r=l.filename||"<unknown>",n=Boolean(l.positions),o=typeof l.onParseError=="function"?l.onParseError:Ko,i=!1,u.parseAtrulePrelude="parseAtrulePrelude"in l?Boolean(l.parseAtrulePrelude):!0,u.parseRulePrelude="parseRulePrelude"in l?Boolean(l.parseRulePrelude):!0,u.parseValue="parseValue"in l?Boolean(l.parseValue):!0,u.parseCustomProperty="parseCustomProperty"in l?Boolean(l.parseCustomProperty):!1;let{context:p="default",onComment:m}=l;if(!(p in u.context))throw new Error("Unknown context `"+p+"`");typeof m=="function"&&u.forEachToken((P,te,X)=>{if(P===25){let S=u.getLocation(te,X),R=ge(t,X-2,X,"*/")?t.slice(te+2,X-2):t.slice(te+2,X);m(R,S);}});let f=u.context[p].call(u,l);return u.eof||u.error(),f},{SyntaxError:sr,config:u.config})}var xi=ls(gi(),1),bi=new Set(["Atrule","Selector","Declaration"]);function yi(e){let t=new xi.SourceMapGenerator,r={line:1,column:0},n={line:0,column:0},o={line:1,column:0},i={generated:o},s=1,u=0,c=!1,a=e.node;e.node=function(m){if(m.loc&&m.loc.start&&bi.has(m.type)){let f=m.loc.start.line,P=m.loc.start.column-1;(n.line!==f||n.column!==P)&&(n.line=f,n.column=P,r.line=s,r.column=u,c&&(c=!1,(r.line!==o.line||r.column!==o.column)&&t.addMapping(i)),c=!0,t.addMapping({source:m.loc.source,original:n,generated:r}));}a.call(this,m),c&&bi.has(m.type)&&(o.line=s,o.column=u);};let l=e.emit;e.emit=function(m,f,P){for(let te=0;te<m.length;te++)m.charCodeAt(te)===10?(s++,u=0):u++;l(m,f,P);};let p=e.result;return e.result=function(){return c&&t.addMapping(i),{css:p(),map:t}},e}var It={};b(It,{safe:()=>br,spec:()=>js});var Bs=43,_s=45,gr=(e,t)=>{if(e===9&&(e=t),typeof e=="string"){let r=e.charCodeAt(0);return r>127?32768:r<<8}return e},ki=[[1,1],[1,2],[1,7],[1,8],[1,"-"],[1,10],[1,11],[1,12],[1,15],[1,21],[3,1],[3,2],[3,7],[3,8],[3,"-"],[3,10],[3,11],[3,12],[3,15],[4,1],[4,2],[4,7],[4,8],[4,"-"],[4,10],[4,11],[4,12],[4,15],[12,1],[12,2],[12,7],[12,8],[12,"-"],[12,10],[12,11],[12,12],[12,15],["#",1],["#",2],["#",7],["#",8],["#","-"],["#",10],["#",11],["#",12],["#",15],["-",1],["-",2],["-",7],["-",8],["-","-"],["-",10],["-",11],["-",12],["-",15],[10,1],[10,2],[10,7],[10,8],[10,10],[10,11],[10,12],[10,"%"],[10,15],["@",1],["@",2],["@",7],["@",8],["@","-"],["@",15],[".",10],[".",11],[".",12],["+",10],["+",11],["+",12],["/","*"]],Us=ki.concat([[1,4],[12,4],[4,4],[3,21],[3,5],[3,16],[11,11],[11,12],[11,2],[11,"-"],[22,1],[22,2],[22,11],[22,12],[22,4],[22,"-"]]);function wi(e){let t=new Set(e.map(([r,n])=>gr(r)<<16|gr(n)));return function(r,n,o){let i=gr(n,o),s=o.charCodeAt(0);return (s===_s&&n!==1&&n!==2&&n!==15||s===Bs?t.has(r<<16|s<<8):t.has(r<<16|i))&&this.emit(" ",13,!0),i}}var js=wi(ki),br=wi(Us);var qs=92;function Ws(e,t){if(typeof t=="function"){let r=null;e.children.forEach(n=>{r!==null&&t.call(this,r),this.node(n),r=n;});return}e.children.forEach(this.node,this);}function Hs(e){ve(e,(t,r,n)=>{this.token(t,e.slice(r,n));});}function vi(e){let t=new Map;for(let r in e.node){let n=e.node[r];typeof(n.generate||n)=="function"&&t.set(r,n.generate||n);}return function(r,n){let o="",i=0,s={node(c){if(t.has(c.type))t.get(c.type).call(u,c);else throw new Error("Unknown node type: "+c.type)},tokenBefore:br,token(c,a){i=this.tokenBefore(i,c,a),this.emit(a,c,!1),c===9&&a.charCodeAt(0)===qs&&this.emit(`
`,13,!0);},emit(c){o+=c;},result(){return o}};n&&(typeof n.decorator=="function"&&(s=n.decorator(s)),n.sourceMap&&(s=yi(s)),n.mode in It&&(s.tokenBefore=It[n.mode]));let u={node:c=>s.node(c),children:Ws,token:(c,a)=>s.token(c,a),tokenize:Hs};return s.node(r),s.result()}}function Si(e){return {fromPlainObject(t){return e(t,{enter(r){r.children&&!(r.children instanceof D)&&(r.children=new D().fromArray(r.children));}}),t},toPlainObject(t){return e(t,{leave(r){r.children&&r.children instanceof D&&(r.children=r.children.toArray());}}),t}}}var{hasOwnProperty:xr}=Object.prototype,it=function(){};function Ci(e){return typeof e=="function"?e:it}function Ai(e,t){return function(r,n,o){r.type===t&&e.call(this,r,n,o);}}function Ys(e,t){let r=t.structure,n=[];for(let o in r){if(xr.call(r,o)===!1)continue;let i=r[o],s={name:o,type:!1,nullable:!1};Array.isArray(i)||(i=[i]);for(let u of i)u===null?s.nullable=!0:typeof u=="string"?s.type="node":Array.isArray(u)&&(s.type="list");s.type&&n.push(s);}return n.length?{context:t.walkContext,fields:n}:null}function Gs(e){let t={};for(let r in e.node)if(xr.call(e.node,r)){let n=e.node[r];if(!n.structure)throw new Error("Missed `structure` field in `"+r+"` node type definition");t[r]=Ys(r,n);}return t}function Ti(e,t){let r=e.fields.slice(),n=e.context,o=typeof n=="string";return t&&r.reverse(),function(i,s,u,c){let a;o&&(a=s[n],s[n]=i);for(let l of r){let p=i[l.name];if(!l.nullable||p){if(l.type==="list"){if(t?p.reduceRight(c,!1):p.reduce(c,!1))return !0}else if(u(p))return !0}}o&&(s[n]=a);}}function Ei({StyleSheet:e,Atrule:t,Rule:r,Block:n,DeclarationList:o}){return {Atrule:{StyleSheet:e,Atrule:t,Rule:r,Block:n},Rule:{StyleSheet:e,Atrule:t,Rule:r,Block:n},Declaration:{StyleSheet:e,Atrule:t,Rule:r,Block:n,DeclarationList:o}}}function Li(e){let t=Gs(e),r={},n={},o=Symbol("break-walk"),i=Symbol("skip-node");for(let a in t)xr.call(t,a)&&t[a]!==null&&(r[a]=Ti(t[a],!1),n[a]=Ti(t[a],!0));let s=Ei(r),u=Ei(n),c=function(a,l){function p(S,R,ke){let z=m.call(X,S,R,ke);return z===o?!0:z===i?!1:!!(P.hasOwnProperty(S.type)&&P[S.type](S,X,p,te)||f.call(X,S,R,ke)===o)}let m=it,f=it,P=r,te=(S,R,ke,z)=>S||p(R,ke,z),X={break:o,skip:i,root:a,stylesheet:null,atrule:null,atrulePrelude:null,rule:null,selector:null,block:null,declaration:null,function:null};if(typeof l=="function")m=l;else if(l&&(m=Ci(l.enter),f=Ci(l.leave),l.reverse&&(P=n),l.visit)){if(s.hasOwnProperty(l.visit))P=l.reverse?u[l.visit]:s[l.visit];else if(!t.hasOwnProperty(l.visit))throw new Error("Bad value `"+l.visit+"` for `visit` option (should be: "+Object.keys(t).sort().join(", ")+")");m=Ai(m,l.visit),f=Ai(f,l.visit);}if(m===it&&f===it)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");p(a);};return c.break=o,c.skip=i,c.find=function(a,l){let p=null;return c(a,function(m,f,P){if(l.call(this,m,f,P))return p=m,o}),p},c.findLast=function(a,l){let p=null;return c(a,{reverse:!0,enter(m,f,P){if(l.call(this,m,f,P))return p=m,o}}),p},c.findAll=function(a,l){let p=[];return c(a,function(m,f,P){l.call(this,m,f,P)&&p.push(m);}),p},c}function Vs(e){return e}function Ks(e){let{min:t,max:r,comma:n}=e;return t===0&&r===0?n?"#?":"*":t===0&&r===1?"?":t===1&&r===0?n?"#":"+":t===1&&r===1?"":(n?"#":"")+(t===r?"{"+t+"}":"{"+t+","+(r!==0?r:"")+"}")}function Qs(e){switch(e.type){case"Range":return " ["+(e.min===null?"-\u221E":e.min)+","+(e.max===null?"\u221E":e.max)+"]";default:throw new Error("Unknown node type `"+e.type+"`")}}function Xs(e,t,r,n){let o=e.combinator===" "||n?e.combinator:" "+e.combinator+" ",i=e.terms.map(s=>yr(s,t,r,n)).join(o);return e.explicit||r?(n||i[0]===","?"[":"[ ")+i+(n?"]":" ]"):i}function yr(e,t,r,n){let o;switch(e.type){case"Group":o=Xs(e,t,r,n)+(e.disallowEmpty?"!":"");break;case"Multiplier":return yr(e.term,t,r,n)+t(Ks(e),e);case"Type":o="<"+e.name+(e.opts?t(Qs(e.opts),e.opts):"")+">";break;case"Property":o="<'"+e.name+"'>";break;case"Keyword":o=e.name;break;case"AtKeyword":o="@"+e.name;break;case"Function":o=e.name+"(";break;case"String":case"Token":o=e.value;break;case"Comma":o=",";break;default:throw new Error("Unknown node type `"+e.type+"`")}return t(o,e)}function Pe(e,t){let r=Vs,n=!1,o=!1;return typeof t=="function"?r=t:t&&(n=Boolean(t.forceBraces),o=Boolean(t.compact),typeof t.decorate=="function"&&(r=t.decorate)),yr(e,r,n,o)}var Pi={offset:0,line:1,column:1};function $s(e,t){let r=e.tokens,n=e.longestMatch,o=n<r.length&&r[n].node||null,i=o!==t?o:null,s=0,u=0,c=0,a="",l,p;for(let m=0;m<r.length;m++){let f=r[m].value;m===n&&(u=f.length,s=a.length),i!==null&&r[m].node===i&&(m<=n?c++:c=0),a+=f;}return n===r.length||c>1?(l=Dt(i||t,"end")||at(Pi,a),p=at(l)):(l=Dt(i,"start")||at(Dt(t,"start")||Pi,a.slice(0,s)),p=Dt(i,"end")||at(l,a.substr(s,u))),{css:a,mismatchOffset:s,mismatchLength:u,start:l,end:p}}function Dt(e,t){let r=e&&e.loc&&e.loc[t];return r?"line"in r?at(r):r:null}function at({offset:e,line:t,column:r},n){let o={offset:e,line:t,column:r};if(n){let i=n.split(/\n|\r\n?|\f/);o.offset+=n.length,o.line+=i.length-1,o.column=i.length===1?o.column+n.length:i.pop().length+1;}return o}var je=function(e,t){let r=Ee("SyntaxReferenceError",e+(t?" `"+t+"`":""));return r.reference=t,r},Ii=function(e,t,r,n){let o=Ee("SyntaxMatchError",e),{css:i,mismatchOffset:s,mismatchLength:u,start:c,end:a}=$s(n,r);return o.rawMessage=e,o.syntax=t?Pe(t):"<generic>",o.css=i,o.mismatchOffset=s,o.mismatchLength=u,o.message=e+`
  syntax: `+o.syntax+`
   value: `+(i||"<empty string>")+`
  --------`+new Array(o.mismatchOffset+1).join("-")+"^",Object.assign(o,c),o.loc={source:r&&r.loc&&r.loc.source||"<unknown>",start:c,end:a},o};var Ot=new Map,qe=new Map,Nt=45,zt=Zs,kr=Js,Ym=wr;function Mt(e,t){return t=t||0,e.length-t>=2&&e.charCodeAt(t)===Nt&&e.charCodeAt(t+1)===Nt}function wr(e,t){if(t=t||0,e.length-t>=3&&e.charCodeAt(t)===Nt&&e.charCodeAt(t+1)!==Nt){let r=e.indexOf("-",t+2);if(r!==-1)return e.substring(t,r+1)}return ""}function Zs(e){if(Ot.has(e))return Ot.get(e);let t=e.toLowerCase(),r=Ot.get(t);if(r===void 0){let n=Mt(t,0),o=n?"":wr(t,0);r=Object.freeze({basename:t.substr(o.length),name:t,prefix:o,vendor:o,custom:n});}return Ot.set(e,r),r}function Js(e){if(qe.has(e))return qe.get(e);let t=e,r=e[0];r==="/"?r=e[1]==="/"?"//":"/":r!=="_"&&r!=="*"&&r!=="$"&&r!=="#"&&r!=="+"&&r!=="&"&&(r="");let n=Mt(t,r.length);if(!n&&(t=t.toLowerCase(),qe.has(t))){let u=qe.get(t);return qe.set(e,u),u}let o=n?"":wr(t,r.length),i=t.substr(0,r.length+o.length),s=Object.freeze({basename:t.substr(i.length),name:t.substr(r.length),hack:r,vendor:o,prefix:i,custom:n});return qe.set(e,s),s}var Rt=["initial","inherit","unset","revert","revert-layer"];var lt=43,he=45,vr=110,We=!0,tl=!1;function Cr(e,t){return e!==null&&e.type===9&&e.value.charCodeAt(0)===t}function st(e,t,r){for(;e!==null&&(e.type===13||e.type===25);)e=r(++t);return t}function Se(e,t,r,n){if(!e)return 0;let o=e.value.charCodeAt(t);if(o===lt||o===he){if(r)return 0;t++;}for(;t<e.value.length;t++)if(!B(e.value.charCodeAt(t)))return 0;return n+1}function Sr(e,t,r){let n=!1,o=st(e,t,r);if(e=r(o),e===null)return t;if(e.type!==10)if(Cr(e,lt)||Cr(e,he)){if(n=!0,o=st(r(++o),o,r),e=r(o),e===null||e.type!==10)return 0}else return t;if(!n){let i=e.value.charCodeAt(0);if(i!==lt&&i!==he)return 0}return Se(e,n?0:1,n,o)}function Ar(e,t){let r=0;if(!e)return 0;if(e.type===10)return Se(e,0,tl,r);if(e.type===1&&e.value.charCodeAt(0)===he){if(!de(e.value,1,vr))return 0;switch(e.value.length){case 2:return Sr(t(++r),r,t);case 3:return e.value.charCodeAt(2)!==he?0:(r=st(t(++r),r,t),e=t(r),Se(e,0,We,r));default:return e.value.charCodeAt(2)!==he?0:Se(e,3,We,r)}}else if(e.type===1||Cr(e,lt)&&t(r+1).type===1){if(e.type!==1&&(e=t(++r)),e===null||!de(e.value,0,vr))return 0;switch(e.value.length){case 1:return Sr(t(++r),r,t);case 2:return e.value.charCodeAt(1)!==he?0:(r=st(t(++r),r,t),e=t(r),Se(e,0,We,r));default:return e.value.charCodeAt(1)!==he?0:Se(e,2,We,r)}}else if(e.type===12){let n=e.value.charCodeAt(0),o=n===lt||n===he?1:0,i=o;for(;i<e.value.length&&B(e.value.charCodeAt(i));i++);return i===o||!de(e.value,i,vr)?0:i+1===e.value.length?Sr(t(++r),r,t):e.value.charCodeAt(i+1)!==he?0:i+2===e.value.length?(r=st(t(++r),r,t),e=t(r),Se(e,0,We,r)):Se(e,i+2,We,r)}return 0}var rl=43,Di=45,Oi=63,nl=117;function Tr(e,t){return e!==null&&e.type===9&&e.value.charCodeAt(0)===t}function ol(e,t){return e.value.charCodeAt(0)===t}function ct(e,t,r){let n=0;for(let o=t;o<e.value.length;o++){let i=e.value.charCodeAt(o);if(i===Di&&r&&n!==0)return ct(e,t+n+1,!1),6;if(!ee(i)||++n>6)return 0}return n}function Ft(e,t,r){if(!e)return 0;for(;Tr(r(t),Oi);){if(++e>6)return 0;t++;}return t}function Er(e,t){let r=0;if(e===null||e.type!==1||!de(e.value,0,nl)||(e=t(++r),e===null))return 0;if(Tr(e,rl))return e=t(++r),e===null?0:e.type===1?Ft(ct(e,0,!0),++r,t):Tr(e,Oi)?Ft(1,++r,t):0;if(e.type===10){let n=ct(e,1,!0);return n===0?0:(e=t(++r),e===null?r:e.type===12||e.type===10?!ol(e,Di)||!ct(e,1,!1)?0:r+1:Ft(n,r,t))}return e.type===12?Ft(ct(e,1,!0),++r,t):0}var il=["calc(","-moz-calc(","-webkit-calc("],Lr=new Map([[2,22],[21,22],[19,20],[23,24]]);function le(e,t){return t<e.length?e.charCodeAt(t):0}function Ni(e,t){return ge(e,0,e.length,t)}function zi(e,t){for(let r=0;r<t.length;r++)if(Ni(e,t[r]))return !0;return !1}function Mi(e,t){return t!==e.length-2?!1:le(e,t)===92&&B(le(e,t+1))}function Bt(e,t,r){if(e&&e.type==="Range"){let n=Number(r!==void 0&&r!==t.length?t.substr(0,r):t);if(isNaN(n)||e.min!==null&&n<e.min&&typeof e.min!="string"||e.max!==null&&n>e.max&&typeof e.max!="string")return !0}return !1}function al(e,t){let r=0,n=[],o=0;e:do{switch(e.type){case 24:case 22:case 20:if(e.type!==r)break e;if(r=n.pop(),n.length===0){o++;break e}break;case 2:case 21:case 19:case 23:n.push(r),r=Lr.get(e.type);break}o++;}while(e=t(o));return o}function ie(e){return function(t,r,n){return t===null?0:t.type===2&&zi(t.value,il)?al(t,r):e(t,r,n)}}function N(e){return function(t){return t===null||t.type!==e?0:1}}function sl(e){if(e===null||e.type!==1)return 0;let t=e.value.toLowerCase();return zi(t,Rt)||Ni(t,"default")?0:1}function ll(e){return e===null||e.type!==1||le(e.value,0)!==45||le(e.value,1)!==45?0:1}function cl(e){if(e===null||e.type!==4)return 0;let t=e.value.length;if(t!==4&&t!==5&&t!==7&&t!==9)return 0;for(let r=1;r<t;r++)if(!ee(le(e.value,r)))return 0;return 1}function ul(e){return e===null||e.type!==4||!ze(le(e.value,1),le(e.value,2),le(e.value,3))?0:1}function pl(e,t){if(!e)return 0;let r=0,n=[],o=0;e:do{switch(e.type){case 6:case 8:break e;case 24:case 22:case 20:if(e.type!==r)break e;r=n.pop();break;case 17:if(r===0)break e;break;case 9:if(r===0&&e.value==="!")break e;break;case 2:case 21:case 19:case 23:n.push(r),r=Lr.get(e.type);break}o++;}while(e=t(o));return o}function hl(e,t){if(!e)return 0;let r=0,n=[],o=0;e:do{switch(e.type){case 6:case 8:break e;case 24:case 22:case 20:if(e.type!==r)break e;r=n.pop();break;case 2:case 21:case 19:case 23:n.push(r),r=Lr.get(e.type);break}o++;}while(e=t(o));return o}function ye(e){return e&&(e=new Set(e)),function(t,r,n){if(t===null||t.type!==12)return 0;let o=Te(t.value,0);if(e!==null){let i=t.value.indexOf("\\",o),s=i===-1||!Mi(t.value,i)?t.value.substr(o):t.value.substring(o,i);if(e.has(s.toLowerCase())===!1)return 0}return Bt(n,t.value,o)?0:1}}function ml(e,t,r){return e===null||e.type!==11||Bt(r,e.value,e.value.length-1)?0:1}function Ri(e){return typeof e!="function"&&(e=function(){return 0}),function(t,r,n){return t!==null&&t.type===10&&Number(t.value)===0?1:e(t,r,n)}}function fl(e,t,r){if(e===null)return 0;let n=Te(e.value,0);return !(n===e.value.length)&&!Mi(e.value,n)||Bt(r,e.value,n)?0:1}function dl(e,t,r){if(e===null||e.type!==10)return 0;let n=le(e.value,0)===43||le(e.value,0)===45?1:0;for(;n<e.value.length;n++)if(!B(le(e.value,n)))return 0;return Bt(r,e.value,n)?0:1}var gl={"ident-token":N(1),"function-token":N(2),"at-keyword-token":N(3),"hash-token":N(4),"string-token":N(5),"bad-string-token":N(6),"url-token":N(7),"bad-url-token":N(8),"delim-token":N(9),"number-token":N(10),"percentage-token":N(11),"dimension-token":N(12),"whitespace-token":N(13),"CDO-token":N(14),"CDC-token":N(15),"colon-token":N(16),"semicolon-token":N(17),"comma-token":N(18),"[-token":N(19),"]-token":N(20),"(-token":N(21),")-token":N(22),"{-token":N(23),"}-token":N(24)},bl={string:N(5),ident:N(1),percentage:ie(ml),zero:Ri(),number:ie(fl),integer:ie(dl),"custom-ident":sl,"custom-property-name":ll,"hex-color":cl,"id-selector":ul,"an-plus-b":Ar,urange:Er,"declaration-value":pl,"any-value":hl};function xl(e){let{angle:t,decibel:r,frequency:n,flex:o,length:i,resolution:s,semitones:u,time:c}=e||{};return {dimension:ie(ye(null)),angle:ie(ye(t)),decibel:ie(ye(r)),frequency:ie(ye(n)),flex:ie(ye(o)),length:ie(Ri(ye(i))),resolution:ie(ye(s)),semitones:ie(ye(u)),time:ie(ye(c))}}function Fi(e){return {...gl,...bl,...xl(e)}}var _t={};b(_t,{angle:()=>kl,decibel:()=>Al,flex:()=>Cl,frequency:()=>vl,length:()=>yl,resolution:()=>Sl,semitones:()=>Tl,time:()=>wl});var yl=["cm","mm","q","in","pt","pc","px","em","rem","ex","rex","cap","rcap","ch","rch","ic","ric","lh","rlh","vw","svw","lvw","dvw","vh","svh","lvh","dvh","vi","svi","lvi","dvi","vb","svb","lvb","dvb","vmin","svmin","lvmin","dvmin","vmax","svmax","lvmax","dvmax","cqw","cqh","cqi","cqb","cqmin","cqmax"],kl=["deg","grad","rad","turn"],wl=["s","ms"],vl=["hz","khz"],Sl=["dpi","dpcm","dppx","x"],Cl=["fr"],Al=["db"],Tl=["st"];var $i={};b($i,{SyntaxError:()=>Ut,generate:()=>Pe,parse:()=>Ge,walk:()=>Vt});function Ut(e,t,r){return Object.assign(Ee("SyntaxError",e),{input:t,offset:r,rawMessage:e,message:e+`
  `+t+`
--`+new Array((r||t.length)+1).join("-")+"^"})}var El=9,Ll=10,Pl=12,Il=13,Dl=32,jt=class{constructor(t){this.str=t,this.pos=0;}charCodeAt(t){return t<this.str.length?this.str.charCodeAt(t):0}charCode(){return this.charCodeAt(this.pos)}nextCharCode(){return this.charCodeAt(this.pos+1)}nextNonWsCode(t){return this.charCodeAt(this.findWsEnd(t))}findWsEnd(t){for(;t<this.str.length;t++){let r=this.str.charCodeAt(t);if(r!==Il&&r!==Ll&&r!==Pl&&r!==Dl&&r!==El)break}return t}substringToPos(t){return this.str.substring(this.pos,this.pos=t)}eat(t){this.charCode()!==t&&this.error("Expect `"+String.fromCharCode(t)+"`"),this.pos++;}peek(){return this.pos<this.str.length?this.str.charAt(this.pos++):""}error(t){throw new Ut(t,this.str,this.pos)}};var Ol=9,Nl=10,zl=12,Ml=13,Rl=32,Yi=33,Dr=35,Bi=38,qt=39,Gi=40,Fl=41,Vi=42,Or=43,Nr=44,_i=45,zr=60,Ki=62,Ir=63,Bl=64,Gt=91,Mr=93,Wt=123,Ui=124,ji=125,qi=8734,ut=new Uint8Array(128).map((e,t)=>/[a-zA-Z0-9\-]/.test(String.fromCharCode(t))?1:0),Wi={" ":1,"&&":2,"||":3,"|":4};function Ht(e){return e.substringToPos(e.findWsEnd(e.pos))}function He(e){let t=e.pos;for(;t<e.str.length;t++){let r=e.str.charCodeAt(t);if(r>=128||ut[r]===0)break}return e.pos===t&&e.error("Expect a keyword"),e.substringToPos(t)}function Yt(e){let t=e.pos;for(;t<e.str.length;t++){let r=e.str.charCodeAt(t);if(r<48||r>57)break}return e.pos===t&&e.error("Expect a number"),e.substringToPos(t)}function _l(e){let t=e.str.indexOf("'",e.pos+1);return t===-1&&(e.pos=e.str.length,e.error("Expect an apostrophe")),e.substringToPos(t+1)}function Hi(e){let t=null,r=null;return e.eat(Wt),t=Yt(e),e.charCode()===Nr?(e.pos++,e.charCode()!==ji&&(r=Yt(e))):r=t,e.eat(ji),{min:Number(t),max:r?Number(r):0}}function Ul(e){let t=null,r=!1;switch(e.charCode()){case Vi:e.pos++,t={min:0,max:0};break;case Or:e.pos++,t={min:1,max:0};break;case Ir:e.pos++,t={min:0,max:1};break;case Dr:e.pos++,r=!0,e.charCode()===Wt?t=Hi(e):e.charCode()===Ir?(e.pos++,t={min:0,max:0}):t={min:1,max:0};break;case Wt:t=Hi(e);break;default:return null}return {type:"Multiplier",comma:r,min:t.min,max:t.max,term:null}}function Ye(e,t){let r=Ul(e);return r!==null?(r.term=t,e.charCode()===Dr&&e.charCodeAt(e.pos-1)===Or?Ye(e,r):r):t}function Pr(e){let t=e.peek();return t===""?null:{type:"Token",value:t}}function jl(e){let t;return e.eat(zr),e.eat(qt),t=He(e),e.eat(qt),e.eat(Ki),Ye(e,{type:"Property",name:t})}function ql(e){let t=null,r=null,n=1;return e.eat(Gt),e.charCode()===_i&&(e.peek(),n=-1),n==-1&&e.charCode()===qi?e.peek():(t=n*Number(Yt(e)),ut[e.charCode()]!==0&&(t+=He(e))),Ht(e),e.eat(Nr),Ht(e),e.charCode()===qi?e.peek():(n=1,e.charCode()===_i&&(e.peek(),n=-1),r=n*Number(Yt(e)),ut[e.charCode()]!==0&&(r+=He(e))),e.eat(Mr),{type:"Range",min:t,max:r}}function Wl(e){let t,r=null;return e.eat(zr),t=He(e),e.charCode()===Gi&&e.nextCharCode()===Fl&&(e.pos+=2,t+="()"),e.charCodeAt(e.findWsEnd(e.pos))===Gt&&(Ht(e),r=ql(e)),e.eat(Ki),Ye(e,{type:"Type",name:t,opts:r})}function Hl(e){let t=He(e);return e.charCode()===Gi?(e.pos++,{type:"Function",name:t}):Ye(e,{type:"Keyword",name:t})}function Yl(e,t){function r(o,i){return {type:"Group",terms:o,combinator:i,disallowEmpty:!1,explicit:!1}}let n;for(t=Object.keys(t).sort((o,i)=>Wi[o]-Wi[i]);t.length>0;){n=t.shift();let o=0,i=0;for(;o<e.length;o++){let s=e[o];s.type==="Combinator"&&(s.value===n?(i===-1&&(i=o-1),e.splice(o,1),o--):(i!==-1&&o-i>1&&(e.splice(i,o-i,r(e.slice(i,o),n)),o=i+1),i=-1));}i!==-1&&t.length&&e.splice(i,o-i,r(e.slice(i,o),n));}return n}function Qi(e){let t=[],r={},n,o=null,i=e.pos;for(;n=Vl(e);)n.type!=="Spaces"&&(n.type==="Combinator"?((o===null||o.type==="Combinator")&&(e.pos=i,e.error("Unexpected combinator")),r[n.value]=!0):o!==null&&o.type!=="Combinator"&&(r[" "]=!0,t.push({type:"Combinator",value:" "})),t.push(n),o=n,i=e.pos);return o!==null&&o.type==="Combinator"&&(e.pos-=i,e.error("Unexpected combinator")),{type:"Group",terms:t,combinator:Yl(t,r)||" ",disallowEmpty:!1,explicit:!1}}function Gl(e){let t;return e.eat(Gt),t=Qi(e),e.eat(Mr),t.explicit=!0,e.charCode()===Yi&&(e.pos++,t.disallowEmpty=!0),t}function Vl(e){let t=e.charCode();if(t<128&&ut[t]===1)return Hl(e);switch(t){case Mr:break;case Gt:return Ye(e,Gl(e));case zr:return e.nextCharCode()===qt?jl(e):Wl(e);case Ui:return {type:"Combinator",value:e.substringToPos(e.pos+(e.nextCharCode()===Ui?2:1))};case Bi:return e.pos++,e.eat(Bi),{type:"Combinator",value:"&&"};case Nr:return e.pos++,{type:"Comma"};case qt:return Ye(e,{type:"String",value:_l(e)});case Rl:case Ol:case Nl:case Ml:case zl:return {type:"Spaces",value:Ht(e)};case Bl:return t=e.nextCharCode(),t<128&&ut[t]===1?(e.pos++,{type:"AtKeyword",name:He(e)}):Pr(e);case Vi:case Or:case Ir:case Dr:case Yi:break;case Wt:if(t=e.nextCharCode(),t<48||t>57)return Pr(e);break;default:return Pr(e)}}function Ge(e){let t=new jt(e),r=Qi(t);return t.pos!==e.length&&t.error("Unexpected input"),r.terms.length===1&&r.terms[0].type==="Group"?r.terms[0]:r}var pt=function(){};function Xi(e){return typeof e=="function"?e:pt}function Vt(e,t,r){function n(s){switch(o.call(r,s),s.type){case"Group":s.terms.forEach(n);break;case"Multiplier":n(s.term);break;case"Type":case"Property":case"Keyword":case"AtKeyword":case"Function":case"String":case"Token":case"Comma":break;default:throw new Error("Unknown type: "+s.type)}i.call(r,s);}let o=pt,i=pt;if(typeof t=="function"?o=t:t&&(o=Xi(t.enter),i=Xi(t.leave)),o===pt&&i===pt)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");n(e);}var Kl={decorator(e){let t=[],r=null;return {...e,node(n){let o=r;r=n,e.node.call(this,n),r=o;},emit(n,o,i){t.push({type:o,value:n,node:i?null:r});},result(){return t}}}};function Ql(e){let t=[];return ve(e,(r,n,o)=>t.push({type:r,value:e.slice(n,o),node:null})),t}function Zi(e,t){return typeof e=="string"?Ql(e):t.generate(e,Kl)}var C={type:"Match"},L={type:"Mismatch"},Kt={type:"DisallowEmpty"},Xl=40,$l=41;function Z(e,t,r){return t===C&&r===L||e===C&&t===C&&r===C?e:(e.type==="If"&&e.else===L&&t===C&&(t=e.then,e=e.match),{type:"If",match:e,then:t,else:r})}function ea(e){return e.length>2&&e.charCodeAt(e.length-2)===Xl&&e.charCodeAt(e.length-1)===$l}function Ji(e){return e.type==="Keyword"||e.type==="AtKeyword"||e.type==="Function"||e.type==="Type"&&ea(e.name)}function Rr(e,t,r){switch(e){case" ":{let n=C;for(let o=t.length-1;o>=0;o--){let i=t[o];n=Z(i,n,L);}return n}case"|":{let n=L,o=null;for(let i=t.length-1;i>=0;i--){let s=t[i];if(Ji(s)&&(o===null&&i>0&&Ji(t[i-1])&&(o=Object.create(null),n=Z({type:"Enum",map:o},C,n)),o!==null)){let u=(ea(s.name)?s.name.slice(0,-1):s.name).toLowerCase();if(!(u in o)){o[u]=s;continue}}o=null,n=Z(s,C,n);}return n}case"&&":{if(t.length>5)return {type:"MatchOnce",terms:t,all:!0};let n=L;for(let o=t.length-1;o>=0;o--){let i=t[o],s;t.length>1?s=Rr(e,t.filter(function(u){return u!==i}),!1):s=C,n=Z(i,s,n);}return n}case"||":{if(t.length>5)return {type:"MatchOnce",terms:t,all:!1};let n=r?C:L;for(let o=t.length-1;o>=0;o--){let i=t[o],s;t.length>1?s=Rr(e,t.filter(function(u){return u!==i}),!0):s=C,n=Z(i,s,n);}return n}}}function Zl(e){let t=C,r=Fr(e.term);if(e.max===0)r=Z(r,Kt,L),t=Z(r,null,L),t.then=Z(C,C,t),e.comma&&(t.then.else=Z({type:"Comma",syntax:e},t,L));else for(let n=e.min||1;n<=e.max;n++)e.comma&&t!==C&&(t=Z({type:"Comma",syntax:e},t,L)),t=Z(r,Z(C,C,t),L);if(e.min===0)t=Z(C,C,t);else for(let n=0;n<e.min-1;n++)e.comma&&t!==C&&(t=Z({type:"Comma",syntax:e},t,L)),t=Z(r,t,L);return t}function Fr(e){if(typeof e=="function")return {type:"Generic",fn:e};switch(e.type){case"Group":{let t=Rr(e.combinator,e.terms.map(Fr),!1);return e.disallowEmpty&&(t=Z(t,Kt,L)),t}case"Multiplier":return Zl(e);case"Type":case"Property":return {type:e.type,name:e.name,syntax:e};case"Keyword":return {type:e.type,name:e.name.toLowerCase(),syntax:e};case"AtKeyword":return {type:e.type,name:"@"+e.name.toLowerCase(),syntax:e};case"Function":return {type:e.type,name:e.name.toLowerCase()+"(",syntax:e};case"String":return e.value.length===3?{type:"Token",value:e.value.charAt(1),syntax:e}:{type:e.type,value:e.value.substr(1,e.value.length-2).replace(/\\'/g,"'"),syntax:e};case"Token":return {type:e.type,value:e.value,syntax:e};case"Comma":return {type:e.type,syntax:e};default:throw new Error("Unknown node type:",e.type)}}function Qt(e,t){return typeof e=="string"&&(e=Ge(e)),{type:"MatchGraph",match:Fr(e),syntax:t||null,source:e}}var {hasOwnProperty:ta}=Object.prototype,Jl=0,ec=1,_r=2,aa=3,ra="Match",tc="Mismatch",rc="Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)",na=15e3;function oc(e){let t=null,r=null,n=e;for(;n!==null;)r=n.prev,n.prev=t,t=n,n=r;return t}function Br(e,t){if(e.length!==t.length)return !1;for(let r=0;r<e.length;r++){let n=t.charCodeAt(r),o=e.charCodeAt(r);if(o>=65&&o<=90&&(o=o|32),o!==n)return !1}return !0}function ic(e){return e.type!==9?!1:e.value!=="?"}function oa(e){return e===null?!0:e.type===18||e.type===2||e.type===21||e.type===19||e.type===23||ic(e)}function ia(e){return e===null?!0:e.type===22||e.type===20||e.type===24||e.type===9&&e.value==="/"}function ac(e,t,r){function n(){do R++,S=R<e.length?e[R]:null;while(S!==null&&(S.type===13||S.type===25))}function o(ae){let fe=R+ae;return fe<e.length?e[fe]:null}function i(ae,fe){return {nextState:ae,matchStack:z,syntaxStack:p,thenStack:m,tokenIndex:R,prev:fe}}function s(ae){m={nextState:ae,matchStack:z,syntaxStack:p,prev:m};}function u(ae){f=i(ae,f);}function c(){z={type:ec,syntax:t.syntax,token:S,prev:z},n(),P=null,R>ke&&(ke=R);}function a(){p={syntax:t.syntax,opts:t.syntax.opts||p!==null&&p.opts||null,prev:p},z={type:_r,syntax:t.syntax,token:z.token,prev:z};}function l(){z.type===_r?z=z.prev:z={type:aa,syntax:p.syntax,token:z.token,prev:z},p=p.prev;}let p=null,m=null,f=null,P=null,te=0,X=null,S=null,R=-1,ke=0,z={type:Jl,syntax:null,token:null,prev:null};for(n();X===null&&++te<na;)switch(t.type){case"Match":if(m===null){if(S!==null&&(R!==e.length-1||S.value!=="\\0"&&S.value!=="\\9")){t=L;break}X=ra;break}if(t=m.nextState,t===Kt)if(m.matchStack===z){t=L;break}else t=C;for(;m.syntaxStack!==p;)l();m=m.prev;break;case"Mismatch":if(P!==null&&P!==!1)(f===null||R>f.tokenIndex)&&(f=P,P=!1);else if(f===null){X=tc;break}t=f.nextState,m=f.thenStack,p=f.syntaxStack,z=f.matchStack,R=f.tokenIndex,S=R<e.length?e[R]:null,f=f.prev;break;case"MatchGraph":t=t.match;break;case"If":t.else!==L&&u(t.else),t.then!==C&&s(t.then),t=t.match;break;case"MatchOnce":t={type:"MatchOnceBuffer",syntax:t,index:0,mask:0};break;case"MatchOnceBuffer":{let Q=t.syntax.terms;if(t.index===Q.length){if(t.mask===0||t.syntax.all){t=L;break}t=C;break}if(t.mask===(1<<Q.length)-1){t=C;break}for(;t.index<Q.length;t.index++){let J=1<<t.index;if((t.mask&J)===0){u(t),s({type:"AddMatchOnce",syntax:t.syntax,mask:t.mask|J}),t=Q[t.index++];break}}break}case"AddMatchOnce":t={type:"MatchOnceBuffer",syntax:t.syntax,index:0,mask:t.mask};break;case"Enum":if(S!==null){let Q=S.value.toLowerCase();if(Q.indexOf("\\")!==-1&&(Q=Q.replace(/\\[09].*$/,"")),ta.call(t.map,Q)){t=t.map[Q];break}}t=L;break;case"Generic":{let Q=p!==null?p.opts:null,J=R+Math.floor(t.fn(S,o,Q));if(!isNaN(J)&&J>R){for(;R<J;)c();t=C;}else t=L;break}case"Type":case"Property":{let Q=t.type==="Type"?"types":"properties",J=ta.call(r,Q)?r[Q][t.name]:null;if(!J||!J.match)throw new Error("Bad syntax reference: "+(t.type==="Type"?"<"+t.name+">":"<'"+t.name+"'>"));if(P!==!1&&S!==null&&t.type==="Type"&&(t.name==="custom-ident"&&S.type===1||t.name==="length"&&S.value==="0")){P===null&&(P=i(t,f)),t=L;break}a(),t=J.match;break}case"Keyword":{let Q=t.name;if(S!==null){let J=S.value;if(J.indexOf("\\")!==-1&&(J=J.replace(/\\[09].*$/,"")),Br(J,Q)){c(),t=C;break}}t=L;break}case"AtKeyword":case"Function":if(S!==null&&Br(S.value,t.name)){c(),t=C;break}t=L;break;case"Token":if(S!==null&&S.value===t.value){c(),t=C;break}t=L;break;case"Comma":S!==null&&S.type===18?oa(z.token)?t=L:(c(),t=ia(S)?L:C):t=oa(z.token)||ia(S)?C:L;break;case"String":let ae="",fe=R;for(;fe<e.length&&ae.length<t.value.length;fe++)ae+=e[fe].value;if(Br(ae,t.value)){for(;R<fe;)c();t=C;}else t=L;break;default:throw new Error("Unknown node type: "+t.type)}switch(X){case null:console.warn("[csstree-match] BREAK after "+na+" iterations"),X=rc,z=null;break;case ra:for(;p!==null;)l();break;default:z=null;}return {tokens:e,reason:X,iterations:te,match:z,longestMatch:ke}}function Ur(e,t,r){let n=ac(e,t,r||{});if(n.match===null)return n;let o=n.match,i=n.match={syntax:t.syntax||null,match:[]},s=[i];for(o=oc(o).prev;o!==null;){switch(o.type){case _r:i.match.push(i={syntax:o.syntax,match:[]}),s.push(i);break;case aa:s.pop(),i=s[s.length-1];break;default:i.match.push({syntax:o.syntax||null,token:o.token.value,node:o.token.node});}o=o.prev;}return n}var qr={};b(qr,{getTrace:()=>sa,isKeyword:()=>cc,isProperty:()=>lc,isType:()=>sc});function sa(e){function t(o){return o===null?!1:o.type==="Type"||o.type==="Property"||o.type==="Keyword"}function r(o){if(Array.isArray(o.match)){for(let i=0;i<o.match.length;i++)if(r(o.match[i]))return t(o.syntax)&&n.unshift(o.syntax),!0}else if(o.node===e)return n=t(o.syntax)?[o.syntax]:[],!0;return !1}let n=null;return this.matched!==null&&r(this.matched),n}function sc(e,t){return jr(this,e,r=>r.type==="Type"&&r.name===t)}function lc(e,t){return jr(this,e,r=>r.type==="Property"&&r.name===t)}function cc(e){return jr(this,e,t=>t.type==="Keyword")}function jr(e,t,r){let n=sa.call(e,t);return n===null?!1:n.some(r)}function la(e){return "node"in e?e.node:la(e.match[0])}function ca(e){return "node"in e?e.node:ca(e.match[e.match.length-1])}function Wr(e,t,r,n,o){function i(u){if(u.syntax!==null&&u.syntax.type===n&&u.syntax.name===o){let c=la(u),a=ca(u);e.syntax.walk(t,function(l,p,m){if(l===c){let f=new D;do{if(f.appendData(p.data),p.data===a)break;p=p.next;}while(p!==null);s.push({parent:m,nodes:f});}});}Array.isArray(u.match)&&u.match.forEach(i);}let s=[];return r.matched!==null&&i(r.matched),s}var{hasOwnProperty:ht}=Object.prototype;function Hr(e){return typeof e=="number"&&isFinite(e)&&Math.floor(e)===e&&e>=0}function ua(e){return Boolean(e)&&Hr(e.offset)&&Hr(e.line)&&Hr(e.column)}function uc(e,t){return function(n,o){if(!n||n.constructor!==Object)return o(n,"Type of node should be an Object");for(let i in n){let s=!0;if(ht.call(n,i)!==!1){if(i==="type")n.type!==e&&o(n,"Wrong node type `"+n.type+"`, expected `"+e+"`");else if(i==="loc"){if(n.loc===null)continue;if(n.loc&&n.loc.constructor===Object)if(typeof n.loc.source!="string")i+=".source";else if(!ua(n.loc.start))i+=".start";else if(!ua(n.loc.end))i+=".end";else continue;s=!1;}else if(t.hasOwnProperty(i)){s=!1;for(let u=0;!s&&u<t[i].length;u++){let c=t[i][u];switch(c){case String:s=typeof n[i]=="string";break;case Boolean:s=typeof n[i]=="boolean";break;case null:s=n[i]===null;break;default:typeof c=="string"?s=n[i]&&n[i].type===c:Array.isArray(c)&&(s=n[i]instanceof D);}}}else o(n,"Unknown field `"+i+"` for "+e+" node type");s||o(n,"Bad value for `"+e+"."+i+"`");}}for(let i in t)ht.call(t,i)&&ht.call(n,i)===!1&&o(n,"Field `"+e+"."+i+"` is missed");}}function pc(e,t){let r=t.structure,n={type:String,loc:!0},o={type:'"'+e+'"'};for(let i in r){if(ht.call(r,i)===!1)continue;let s=[],u=n[i]=Array.isArray(r[i])?r[i].slice():[r[i]];for(let c=0;c<u.length;c++){let a=u[c];if(a===String||a===Boolean)s.push(a.name);else if(a===null)s.push("null");else if(typeof a=="string")s.push("<"+a+">");else if(Array.isArray(a))s.push("List");else throw new Error("Wrong value `"+a+"` in `"+e+"."+i+"` structure definition")}o[i]=s.join(" | ");}return {docs:o,check:uc(e,n)}}function pa(e){let t={};if(e.node){for(let r in e.node)if(ht.call(e.node,r)){let n=e.node[r];if(n.structure)t[r]=pc(r,n);else throw new Error("Missed `structure` field in `"+r+"` node type definition")}}return t}var hc=Qt(Rt.join(" | "));function Yr(e,t,r){let n={};for(let o in e)e[o].syntax&&(n[o]=r?e[o].syntax:Pe(e[o].syntax,{compact:t}));return n}function mc(e,t,r){let n={};for(let[o,i]of Object.entries(e))n[o]={prelude:i.prelude&&(r?i.prelude.syntax:Pe(i.prelude.syntax,{compact:t})),descriptors:i.descriptors&&Yr(i.descriptors,t,r)};return n}function fc(e){for(let t=0;t<e.length;t++)if(e[t].value.toLowerCase()==="var(")return !0;return !1}function ce(e,t,r){return {matched:e,iterations:r,error:t,...qr}}function Ve(e,t,r,n){let o=Zi(r,e.syntax),i;return fc(o)?ce(null,new Error("Matching for a tree with var() is not supported")):(n&&(i=Ur(o,e.cssWideKeywordsSyntax,e)),(!n||!i.match)&&(i=Ur(o,t.match,e),!i.match)?ce(null,new Ii(i.reason,t.syntax,r,i),i.iterations):ce(i.match,null,i.iterations))}var Ke=class{constructor(t,r,n){if(this.cssWideKeywordsSyntax=hc,this.syntax=r,this.generic=!1,this.units={..._t},this.atrules=Object.create(null),this.properties=Object.create(null),this.types=Object.create(null),this.structure=n||pa(t),t){if(t.units)for(let o of Object.keys(_t))Array.isArray(t.units[o])&&(this.units[o]=t.units[o]);if(t.types)for(let o in t.types)this.addType_(o,t.types[o]);if(t.generic){this.generic=!0;for(let[o,i]of Object.entries(Fi(this.units)))this.addType_(o,i);}if(t.atrules)for(let o in t.atrules)this.addAtrule_(o,t.atrules[o]);if(t.properties)for(let o in t.properties)this.addProperty_(o,t.properties[o]);}}checkStructure(t){function r(i,s){o.push({node:i,message:s});}let n=this.structure,o=[];return this.syntax.walk(t,function(i){n.hasOwnProperty(i.type)?n[i.type].check(i,r):r(i,"Unknown node type `"+i.type+"`");}),o.length?o:!1}createDescriptor(t,r,n,o=null){let i={type:r,name:n},s={type:r,name:n,parent:o,serializable:typeof t=="string"||t&&typeof t.type=="string",syntax:null,match:null};return typeof t=="function"?s.match=Qt(t,i):(typeof t=="string"?Object.defineProperty(s,"syntax",{get(){return Object.defineProperty(s,"syntax",{value:Ge(t)}),s.syntax}}):s.syntax=t,Object.defineProperty(s,"match",{get(){return Object.defineProperty(s,"match",{value:Qt(s.syntax,i)}),s.match}})),s}addAtrule_(t,r){!r||(this.atrules[t]={type:"Atrule",name:t,prelude:r.prelude?this.createDescriptor(r.prelude,"AtrulePrelude",t):null,descriptors:r.descriptors?Object.keys(r.descriptors).reduce((n,o)=>(n[o]=this.createDescriptor(r.descriptors[o],"AtruleDescriptor",o,t),n),Object.create(null)):null});}addProperty_(t,r){!r||(this.properties[t]=this.createDescriptor(r,"Property",t));}addType_(t,r){!r||(this.types[t]=this.createDescriptor(r,"Type",t));}checkAtruleName(t){if(!this.getAtrule(t))return new je("Unknown at-rule","@"+t)}checkAtrulePrelude(t,r){let n=this.checkAtruleName(t);if(n)return n;let o=this.getAtrule(t);if(!o.prelude&&r)return new SyntaxError("At-rule `@"+t+"` should not contain a prelude");if(o.prelude&&!r&&!Ve(this,o.prelude,"",!1).matched)return new SyntaxError("At-rule `@"+t+"` should contain a prelude")}checkAtruleDescriptorName(t,r){let n=this.checkAtruleName(t);if(n)return n;let o=this.getAtrule(t),i=zt(r);if(!o.descriptors)return new SyntaxError("At-rule `@"+t+"` has no known descriptors");if(!o.descriptors[i.name]&&!o.descriptors[i.basename])return new je("Unknown at-rule descriptor",r)}checkPropertyName(t){if(!this.getProperty(t))return new je("Unknown property",t)}matchAtrulePrelude(t,r){let n=this.checkAtrulePrelude(t,r);if(n)return ce(null,n);let o=this.getAtrule(t);return o.prelude?Ve(this,o.prelude,r||"",!1):ce(null,null)}matchAtruleDescriptor(t,r,n){let o=this.checkAtruleDescriptorName(t,r);if(o)return ce(null,o);let i=this.getAtrule(t),s=zt(r);return Ve(this,i.descriptors[s.name]||i.descriptors[s.basename],n,!1)}matchDeclaration(t){return t.type!=="Declaration"?ce(null,new Error("Not a Declaration node")):this.matchProperty(t.property,t.value)}matchProperty(t,r){if(kr(t).custom)return ce(null,new Error("Lexer matching doesn't applicable for custom properties"));let n=this.checkPropertyName(t);return n?ce(null,n):Ve(this,this.getProperty(t),r,!0)}matchType(t,r){let n=this.getType(t);return n?Ve(this,n,r,!1):ce(null,new je("Unknown type",t))}match(t,r){return typeof t!="string"&&(!t||!t.type)?ce(null,new je("Bad syntax")):((typeof t=="string"||!t.match)&&(t=this.createDescriptor(t,"Type","anonymous")),Ve(this,t,r,!1))}findValueFragments(t,r,n,o){return Wr(this,r,this.matchProperty(t,r),n,o)}findDeclarationValueFragments(t,r,n){return Wr(this,t.value,this.matchDeclaration(t),r,n)}findAllFragments(t,r,n){let o=[];return this.syntax.walk(t,{visit:"Declaration",enter:i=>{o.push.apply(o,this.findDeclarationValueFragments(i,r,n));}}),o}getAtrule(t,r=!0){let n=zt(t);return (n.vendor&&r?this.atrules[n.name]||this.atrules[n.basename]:this.atrules[n.name])||null}getAtrulePrelude(t,r=!0){let n=this.getAtrule(t,r);return n&&n.prelude||null}getAtruleDescriptor(t,r){return this.atrules.hasOwnProperty(t)&&this.atrules.declarators&&this.atrules[t].declarators[r]||null}getProperty(t,r=!0){let n=kr(t);return (n.vendor&&r?this.properties[n.name]||this.properties[n.basename]:this.properties[n.name])||null}getType(t){return hasOwnProperty.call(this.types,t)?this.types[t]:null}validate(){function t(o,i,s,u){if(s.has(i))return s.get(i);s.set(i,!1),u.syntax!==null&&Vt(u.syntax,function(c){if(c.type!=="Type"&&c.type!=="Property")return;let a=c.type==="Type"?o.types:o.properties,l=c.type==="Type"?r:n;(!hasOwnProperty.call(a,c.name)||t(o,c.name,l,a[c.name]))&&s.set(i,!0);},this);}let r=new Map,n=new Map;for(let o in this.types)t(this,o,r,this.types[o]);for(let o in this.properties)t(this,o,n,this.properties[o]);return r=[...r.keys()].filter(o=>r.get(o)),n=[...n.keys()].filter(o=>n.get(o)),r.length||n.length?{types:r,properties:n}:null}dump(t,r){return {generic:this.generic,units:this.units,types:Yr(this.types,!r,t),properties:Yr(this.properties,!r,t),atrules:mc(this.atrules,!r,t)}}toString(){return JSON.stringify(this.dump())}};function Gr(e,t){return typeof t=="string"&&/^\s*\|/.test(t)?typeof e=="string"?e+t:t.replace(/^\s*\|\s*/,""):t||null}function ha(e,t){let r=Object.create(null);for(let[n,o]of Object.entries(e))if(o){r[n]={};for(let i of Object.keys(o))t.includes(i)&&(r[n][i]=o[i]);}return r}function mt(e,t){let r={...e};for(let[n,o]of Object.entries(t))switch(n){case"generic":r[n]=Boolean(o);break;case"units":r[n]={...e[n]};for(let[i,s]of Object.entries(o))r[n][i]=Array.isArray(s)?s:[];break;case"atrules":r[n]={...e[n]};for(let[i,s]of Object.entries(o)){let u=r[n][i]||{},c=r[n][i]={prelude:u.prelude||null,descriptors:{...u.descriptors}};if(!!s){c.prelude=s.prelude?Gr(c.prelude,s.prelude):c.prelude||null;for(let[a,l]of Object.entries(s.descriptors||{}))c.descriptors[a]=l?Gr(c.descriptors[a],l):null;Object.keys(c.descriptors).length||(c.descriptors=null);}}break;case"types":case"properties":r[n]={...e[n]};for(let[i,s]of Object.entries(o))r[n][i]=Gr(r[n][i],s);break;case"scope":r[n]={...e[n]};for(let[i,s]of Object.entries(o))r[n][i]={...r[n][i],...s};break;case"parseContext":r[n]={...e[n],...o};break;case"atrule":case"pseudo":r[n]={...e[n],...ha(o,["parse"])};break;case"node":r[n]={...e[n],...ha(o,["name","structure","parse","generate","walkContext"])};break}return r}function ma(e){let t=$o(e),r=Li(e),n=vi(e),{fromPlainObject:o,toPlainObject:i}=Si(r),s={lexer:null,createLexer:u=>new Ke(u,s,s.lexer.structure),tokenize:ve,parse:t,generate:n,walk:r,find:r.find,findLast:r.findLast,findAll:r.findAll,fromPlainObject:o,toPlainObject:i,fork(u){let c=mt({},e);return ma(typeof u=="function"?u(c,Object.assign):mt(c,u))}};return s.lexer=new Ke({generic:!0,units:e.units,types:e.types,atrules:e.atrules,properties:e.properties,node:e.node},s),s}var Vr=e=>ma(mt({},e));var fa={generic:!0,units:{angle:["deg","grad","rad","turn"],decibel:["db"],flex:["fr"],frequency:["hz","khz"],length:["cm","mm","q","in","pt","pc","px","em","rem","ex","rex","cap","rcap","ch","rch","ic","ric","lh","rlh","vw","svw","lvw","dvw","vh","svh","lvh","dvh","vi","svi","lvi","dvi","vb","svb","lvb","dvb","vmin","svmin","lvmin","dvmin","vmax","svmax","lvmax","dvmax","cqw","cqh","cqi","cqb","cqmin","cqmax"],resolution:["dpi","dpcm","dppx","x"],semitones:["st"],time:["s","ms"]},types:{"abs()":"abs( <calc-sum> )","absolute-size":"xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large","acos()":"acos( <calc-sum> )","alpha-value":"<number>|<percentage>","angle-percentage":"<angle>|<percentage>","angular-color-hint":"<angle-percentage>","angular-color-stop":"<color>&&<color-stop-angle>?","angular-color-stop-list":"[<angular-color-stop> [, <angular-color-hint>]?]# , <angular-color-stop>","animateable-feature":"scroll-position|contents|<custom-ident>","asin()":"asin( <calc-sum> )","atan()":"atan( <calc-sum> )","atan2()":"atan2( <calc-sum> , <calc-sum> )",attachment:"scroll|fixed|local","attr()":"attr( <attr-name> <type-or-unit>? [, <attr-fallback>]? )","attr-matcher":"['~'|'|'|'^'|'$'|'*']? '='","attr-modifier":"i|s","attribute-selector":"'[' <wq-name> ']'|'[' <wq-name> <attr-matcher> [<string-token>|<ident-token>] <attr-modifier>? ']'","auto-repeat":"repeat( [auto-fill|auto-fit] , [<line-names>? <fixed-size>]+ <line-names>? )","auto-track-list":"[<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>? <auto-repeat> [<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>?",axis:"block|inline|vertical|horizontal","baseline-position":"[first|last]? baseline","basic-shape":"<inset()>|<circle()>|<ellipse()>|<polygon()>|<path()>","bg-image":"none|<image>","bg-layer":"<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>","bg-position":"[[left|center|right|top|bottom|<length-percentage>]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]|[center|[left|right] <length-percentage>?]&&[center|[top|bottom] <length-percentage>?]]","bg-size":"[<length-percentage>|auto]{1,2}|cover|contain","blur()":"blur( <length> )","blend-mode":"normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity",box:"border-box|padding-box|content-box","brightness()":"brightness( <number-percentage> )","calc()":"calc( <calc-sum> )","calc-sum":"<calc-product> [['+'|'-'] <calc-product>]*","calc-product":"<calc-value> ['*' <calc-value>|'/' <number>]*","calc-value":"<number>|<dimension>|<percentage>|<calc-constant>|( <calc-sum> )","calc-constant":"e|pi|infinity|-infinity|NaN","cf-final-image":"<image>|<color>","cf-mixing-image":"<percentage>?&&<image>","circle()":"circle( [<shape-radius>]? [at <position>]? )","clamp()":"clamp( <calc-sum>#{3} )","class-selector":"'.' <ident-token>","clip-source":"<url>",color:"<rgb()>|<rgba()>|<hsl()>|<hsla()>|<hwb()>|<lab()>|<lch()>|<hex-color>|<named-color>|currentcolor|<deprecated-system-color>","color-stop":"<color-stop-length>|<color-stop-angle>","color-stop-angle":"<angle-percentage>{1,2}","color-stop-length":"<length-percentage>{1,2}","color-stop-list":"[<linear-color-stop> [, <linear-color-hint>]?]# , <linear-color-stop>",combinator:"'>'|'+'|'~'|['||']","common-lig-values":"[common-ligatures|no-common-ligatures]","compat-auto":"searchfield|textarea|push-button|slider-horizontal|checkbox|radio|square-button|menulist|listbox|meter|progress-bar|button","composite-style":"clear|copy|source-over|source-in|source-out|source-atop|destination-over|destination-in|destination-out|destination-atop|xor","compositing-operator":"add|subtract|intersect|exclude","compound-selector":"[<type-selector>? <subclass-selector>* [<pseudo-element-selector> <pseudo-class-selector>*]*]!","compound-selector-list":"<compound-selector>#","complex-selector":"<compound-selector> [<combinator>? <compound-selector>]*","complex-selector-list":"<complex-selector>#","conic-gradient()":"conic-gradient( [from <angle>]? [at <position>]? , <angular-color-stop-list> )","contextual-alt-values":"[contextual|no-contextual]","content-distribution":"space-between|space-around|space-evenly|stretch","content-list":"[<string>|contents|<image>|<counter>|<quote>|<target>|<leader()>|<attr()>]+","content-position":"center|start|end|flex-start|flex-end","content-replacement":"<image>","contrast()":"contrast( [<number-percentage>] )","cos()":"cos( <calc-sum> )",counter:"<counter()>|<counters()>","counter()":"counter( <counter-name> , <counter-style>? )","counter-name":"<custom-ident>","counter-style":"<counter-style-name>|symbols( )","counter-style-name":"<custom-ident>","counters()":"counters( <counter-name> , <string> , <counter-style>? )","cross-fade()":"cross-fade( <cf-mixing-image> , <cf-final-image>? )","cubic-bezier-timing-function":"ease|ease-in|ease-out|ease-in-out|cubic-bezier( <number [0,1]> , <number> , <number [0,1]> , <number> )","deprecated-system-color":"ActiveBorder|ActiveCaption|AppWorkspace|Background|ButtonFace|ButtonHighlight|ButtonShadow|ButtonText|CaptionText|GrayText|Highlight|HighlightText|InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|Menu|MenuText|Scrollbar|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|ThreeDShadow|Window|WindowFrame|WindowText","discretionary-lig-values":"[discretionary-ligatures|no-discretionary-ligatures]","display-box":"contents|none","display-inside":"flow|flow-root|table|flex|grid|ruby","display-internal":"table-row-group|table-header-group|table-footer-group|table-row|table-cell|table-column-group|table-column|table-caption|ruby-base|ruby-text|ruby-base-container|ruby-text-container","display-legacy":"inline-block|inline-list-item|inline-table|inline-flex|inline-grid","display-listitem":"<display-outside>?&&[flow|flow-root]?&&list-item","display-outside":"block|inline|run-in","drop-shadow()":"drop-shadow( <length>{2,3} <color>? )","east-asian-variant-values":"[jis78|jis83|jis90|jis04|simplified|traditional]","east-asian-width-values":"[full-width|proportional-width]","element()":"element( <custom-ident> , [first|start|last|first-except]? )|element( <id-selector> )","ellipse()":"ellipse( [<shape-radius>{2}]? [at <position>]? )","ending-shape":"circle|ellipse","env()":"env( <custom-ident> , <declaration-value>? )","exp()":"exp( <calc-sum> )","explicit-track-list":"[<line-names>? <track-size>]+ <line-names>?","family-name":"<string>|<custom-ident>+","feature-tag-value":"<string> [<integer>|on|off]?","feature-type":"@stylistic|@historical-forms|@styleset|@character-variant|@swash|@ornaments|@annotation","feature-value-block":"<feature-type> '{' <feature-value-declaration-list> '}'","feature-value-block-list":"<feature-value-block>+","feature-value-declaration":"<custom-ident> : <integer>+ ;","feature-value-declaration-list":"<feature-value-declaration>","feature-value-name":"<custom-ident>","fill-rule":"nonzero|evenodd","filter-function":"<blur()>|<brightness()>|<contrast()>|<drop-shadow()>|<grayscale()>|<hue-rotate()>|<invert()>|<opacity()>|<saturate()>|<sepia()>","filter-function-list":"[<filter-function>|<url>]+","final-bg-layer":"<'background-color'>||<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>","fixed-breadth":"<length-percentage>","fixed-repeat":"repeat( [<integer [1,\u221E]>] , [<line-names>? <fixed-size>]+ <line-names>? )","fixed-size":"<fixed-breadth>|minmax( <fixed-breadth> , <track-breadth> )|minmax( <inflexible-breadth> , <fixed-breadth> )","font-stretch-absolute":"normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded|<percentage>","font-variant-css21":"[normal|small-caps]","font-weight-absolute":"normal|bold|<number [1,1000]>","frequency-percentage":"<frequency>|<percentage>","general-enclosed":"[<function-token> <any-value> )]|( <ident> <any-value> )","generic-family":"serif|sans-serif|cursive|fantasy|monospace|-apple-system","generic-name":"serif|sans-serif|cursive|fantasy|monospace","geometry-box":"<shape-box>|fill-box|stroke-box|view-box",gradient:"<linear-gradient()>|<repeating-linear-gradient()>|<radial-gradient()>|<repeating-radial-gradient()>|<conic-gradient()>|<repeating-conic-gradient()>|<-legacy-gradient>","grayscale()":"grayscale( <number-percentage> )","grid-line":"auto|<custom-ident>|[<integer>&&<custom-ident>?]|[span&&[<integer>||<custom-ident>]]","historical-lig-values":"[historical-ligatures|no-historical-ligatures]","hsl()":"hsl( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsl( <hue> , <percentage> , <percentage> , <alpha-value>? )","hsla()":"hsla( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsla( <hue> , <percentage> , <percentage> , <alpha-value>? )",hue:"<number>|<angle>","hue-rotate()":"hue-rotate( <angle> )","hwb()":"hwb( [<hue>|none] [<percentage>|none] [<percentage>|none] [/ [<alpha-value>|none]]? )","hypot()":"hypot( <calc-sum># )",image:"<url>|<image()>|<image-set()>|<element()>|<paint()>|<cross-fade()>|<gradient>","image()":"image( <image-tags>? [<image-src>? , <color>?]! )","image-set()":"image-set( <image-set-option># )","image-set-option":"[<image>|<string>] [<resolution>||type( <string> )]","image-src":"<url>|<string>","image-tags":"ltr|rtl","inflexible-breadth":"<length-percentage>|min-content|max-content|auto","inset()":"inset( <length-percentage>{1,4} [round <'border-radius'>]? )","invert()":"invert( <number-percentage> )","keyframes-name":"<custom-ident>|<string>","keyframe-block":"<keyframe-selector># { <declaration-list> }","keyframe-block-list":"<keyframe-block>+","keyframe-selector":"from|to|<percentage>","lab()":"lab( [<percentage>|<number>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","layer()":"layer( <layer-name> )","layer-name":"<ident> ['.' <ident>]*","lch()":"lch( [<percentage>|<number>|none] [<percentage>|<number>|none] [<hue>|none] [/ [<alpha-value>|none]]? )","leader()":"leader( <leader-type> )","leader-type":"dotted|solid|space|<string>","length-percentage":"<length>|<percentage>","line-names":"'[' <custom-ident>* ']'","line-name-list":"[<line-names>|<name-repeat>]+","line-style":"none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset","line-width":"<length>|thin|medium|thick","linear-color-hint":"<length-percentage>","linear-color-stop":"<color> <color-stop-length>?","linear-gradient()":"linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )","log()":"log( <calc-sum> , <calc-sum>? )","mask-layer":"<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||<geometry-box>||[<geometry-box>|no-clip]||<compositing-operator>||<masking-mode>","mask-position":"[<length-percentage>|left|center|right] [<length-percentage>|top|center|bottom]?","mask-reference":"none|<image>|<mask-source>","mask-source":"<url>","masking-mode":"alpha|luminance|match-source","matrix()":"matrix( <number>#{6} )","matrix3d()":"matrix3d( <number>#{16} )","max()":"max( <calc-sum># )","media-and":"<media-in-parens> [and <media-in-parens>]+","media-condition":"<media-not>|<media-and>|<media-or>|<media-in-parens>","media-condition-without-or":"<media-not>|<media-and>|<media-in-parens>","media-feature":"( [<mf-plain>|<mf-boolean>|<mf-range>] )","media-in-parens":"( <media-condition> )|<media-feature>|<general-enclosed>","media-not":"not <media-in-parens>","media-or":"<media-in-parens> [or <media-in-parens>]+","media-query":"<media-condition>|[not|only]? <media-type> [and <media-condition-without-or>]?","media-query-list":"<media-query>#","media-type":"<ident>","mf-boolean":"<mf-name>","mf-name":"<ident>","mf-plain":"<mf-name> : <mf-value>","mf-range":"<mf-name> ['<'|'>']? '='? <mf-value>|<mf-value> ['<'|'>']? '='? <mf-name>|<mf-value> '<' '='? <mf-name> '<' '='? <mf-value>|<mf-value> '>' '='? <mf-name> '>' '='? <mf-value>","mf-value":"<number>|<dimension>|<ident>|<ratio>","min()":"min( <calc-sum># )","minmax()":"minmax( [<length-percentage>|min-content|max-content|auto] , [<length-percentage>|<flex>|min-content|max-content|auto] )","mod()":"mod( <calc-sum> , <calc-sum> )","name-repeat":"repeat( [<integer [1,\u221E]>|auto-fill] , <line-names>+ )","named-color":"transparent|aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen|<-non-standard-color>","namespace-prefix":"<ident>","ns-prefix":"[<ident-token>|'*']? '|'","number-percentage":"<number>|<percentage>","numeric-figure-values":"[lining-nums|oldstyle-nums]","numeric-fraction-values":"[diagonal-fractions|stacked-fractions]","numeric-spacing-values":"[proportional-nums|tabular-nums]",nth:"<an-plus-b>|even|odd","opacity()":"opacity( [<number-percentage>] )","overflow-position":"unsafe|safe","outline-radius":"<length>|<percentage>","page-body":"<declaration>? [; <page-body>]?|<page-margin-box> <page-body>","page-margin-box":"<page-margin-box-type> '{' <declaration-list> '}'","page-margin-box-type":"@top-left-corner|@top-left|@top-center|@top-right|@top-right-corner|@bottom-left-corner|@bottom-left|@bottom-center|@bottom-right|@bottom-right-corner|@left-top|@left-middle|@left-bottom|@right-top|@right-middle|@right-bottom","page-selector-list":"[<page-selector>#]?","page-selector":"<pseudo-page>+|<ident> <pseudo-page>*","page-size":"A5|A4|A3|B5|B4|JIS-B5|JIS-B4|letter|legal|ledger","path()":"path( [<fill-rule> ,]? <string> )","paint()":"paint( <ident> , <declaration-value>? )","perspective()":"perspective( [<length [0,\u221E]>|none] )","polygon()":"polygon( <fill-rule>? , [<length-percentage> <length-percentage>]# )",position:"[[left|center|right]||[top|center|bottom]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]?|[[left|right] <length-percentage>]&&[[top|bottom] <length-percentage>]]","pow()":"pow( <calc-sum> , <calc-sum> )","pseudo-class-selector":"':' <ident-token>|':' <function-token> <any-value> ')'","pseudo-element-selector":"':' <pseudo-class-selector>","pseudo-page":": [left|right|first|blank]",quote:"open-quote|close-quote|no-open-quote|no-close-quote","radial-gradient()":"radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )",ratio:"<number [0,\u221E]> [/ <number [0,\u221E]>]?","relative-selector":"<combinator>? <complex-selector>","relative-selector-list":"<relative-selector>#","relative-size":"larger|smaller","rem()":"rem( <calc-sum> , <calc-sum> )","repeat-style":"repeat-x|repeat-y|[repeat|space|round|no-repeat]{1,2}","repeating-conic-gradient()":"repeating-conic-gradient( [from <angle>]? [at <position>]? , <angular-color-stop-list> )","repeating-linear-gradient()":"repeating-linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )","repeating-radial-gradient()":"repeating-radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )","reversed-counter-name":"reversed( <counter-name> )","rgb()":"rgb( <percentage>{3} [/ <alpha-value>]? )|rgb( <number>{3} [/ <alpha-value>]? )|rgb( <percentage>#{3} , <alpha-value>? )|rgb( <number>#{3} , <alpha-value>? )","rgba()":"rgba( <percentage>{3} [/ <alpha-value>]? )|rgba( <number>{3} [/ <alpha-value>]? )|rgba( <percentage>#{3} , <alpha-value>? )|rgba( <number>#{3} , <alpha-value>? )","rotate()":"rotate( [<angle>|<zero>] )","rotate3d()":"rotate3d( <number> , <number> , <number> , [<angle>|<zero>] )","rotateX()":"rotateX( [<angle>|<zero>] )","rotateY()":"rotateY( [<angle>|<zero>] )","rotateZ()":"rotateZ( [<angle>|<zero>] )","round()":"round( <rounding-strategy>? , <calc-sum> , <calc-sum> )","rounding-strategy":"nearest|up|down|to-zero","saturate()":"saturate( <number-percentage> )","scale()":"scale( [<number>|<percentage>]#{1,2} )","scale3d()":"scale3d( [<number>|<percentage>]#{3} )","scaleX()":"scaleX( [<number>|<percentage>] )","scaleY()":"scaleY( [<number>|<percentage>] )","scaleZ()":"scaleZ( [<number>|<percentage>] )",scroller:"root|nearest","self-position":"center|start|end|self-start|self-end|flex-start|flex-end","shape-radius":"<length-percentage>|closest-side|farthest-side","sign()":"sign( <calc-sum> )","skew()":"skew( [<angle>|<zero>] , [<angle>|<zero>]? )","skewX()":"skewX( [<angle>|<zero>] )","skewY()":"skewY( [<angle>|<zero>] )","sepia()":"sepia( <number-percentage> )",shadow:"inset?&&<length>{2,4}&&<color>?","shadow-t":"[<length>{2,3}&&<color>?]",shape:"rect( <top> , <right> , <bottom> , <left> )|rect( <top> <right> <bottom> <left> )","shape-box":"<box>|margin-box","side-or-corner":"[left|right]||[top|bottom]","sin()":"sin( <calc-sum> )","single-animation":"<time>||<easing-function>||<time>||<single-animation-iteration-count>||<single-animation-direction>||<single-animation-fill-mode>||<single-animation-play-state>||[none|<keyframes-name>]","single-animation-direction":"normal|reverse|alternate|alternate-reverse","single-animation-fill-mode":"none|forwards|backwards|both","single-animation-iteration-count":"infinite|<number>","single-animation-play-state":"running|paused","single-animation-timeline":"auto|none|<timeline-name>|scroll( <axis>? <scroller>? )","single-transition":"[none|<single-transition-property>]||<time>||<easing-function>||<time>","single-transition-property":"all|<custom-ident>",size:"closest-side|farthest-side|closest-corner|farthest-corner|<length>|<length-percentage>{2}","sqrt()":"sqrt( <calc-sum> )","step-position":"jump-start|jump-end|jump-none|jump-both|start|end","step-timing-function":"step-start|step-end|steps( <integer> [, <step-position>]? )","subclass-selector":"<id-selector>|<class-selector>|<attribute-selector>|<pseudo-class-selector>","supports-condition":"not <supports-in-parens>|<supports-in-parens> [and <supports-in-parens>]*|<supports-in-parens> [or <supports-in-parens>]*","supports-in-parens":"( <supports-condition> )|<supports-feature>|<general-enclosed>","supports-feature":"<supports-decl>|<supports-selector-fn>","supports-decl":"( <declaration> )","supports-selector-fn":"selector( <complex-selector> )",symbol:"<string>|<image>|<custom-ident>","tan()":"tan( <calc-sum> )",target:"<target-counter()>|<target-counters()>|<target-text()>","target-counter()":"target-counter( [<string>|<url>] , <custom-ident> , <counter-style>? )","target-counters()":"target-counters( [<string>|<url>] , <custom-ident> , <string> , <counter-style>? )","target-text()":"target-text( [<string>|<url>] , [content|before|after|first-letter]? )","time-percentage":"<time>|<percentage>","timeline-name":"<custom-ident>|<string>","easing-function":"linear|<cubic-bezier-timing-function>|<step-timing-function>","track-breadth":"<length-percentage>|<flex>|min-content|max-content|auto","track-list":"[<line-names>? [<track-size>|<track-repeat>]]+ <line-names>?","track-repeat":"repeat( [<integer [1,\u221E]>] , [<line-names>? <track-size>]+ <line-names>? )","track-size":"<track-breadth>|minmax( <inflexible-breadth> , <track-breadth> )|fit-content( <length-percentage> )","transform-function":"<matrix()>|<translate()>|<translateX()>|<translateY()>|<scale()>|<scaleX()>|<scaleY()>|<rotate()>|<skew()>|<skewX()>|<skewY()>|<matrix3d()>|<translate3d()>|<translateZ()>|<scale3d()>|<scaleZ()>|<rotate3d()>|<rotateX()>|<rotateY()>|<rotateZ()>|<perspective()>","transform-list":"<transform-function>+","translate()":"translate( <length-percentage> , <length-percentage>? )","translate3d()":"translate3d( <length-percentage> , <length-percentage> , <length> )","translateX()":"translateX( <length-percentage> )","translateY()":"translateY( <length-percentage> )","translateZ()":"translateZ( <length> )","type-or-unit":"string|color|url|integer|number|length|angle|time|frequency|cap|ch|em|ex|ic|lh|rlh|rem|vb|vi|vw|vh|vmin|vmax|mm|Q|cm|in|pt|pc|px|deg|grad|rad|turn|ms|s|Hz|kHz|%","type-selector":"<wq-name>|<ns-prefix>? '*'","var()":"var( <custom-property-name> , <declaration-value>? )","viewport-length":"auto|<length-percentage>","visual-box":"content-box|padding-box|border-box","wq-name":"<ns-prefix>? <ident-token>","-legacy-gradient":"<-webkit-gradient()>|<-legacy-linear-gradient>|<-legacy-repeating-linear-gradient>|<-legacy-radial-gradient>|<-legacy-repeating-radial-gradient>","-legacy-linear-gradient":"-moz-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-repeating-linear-gradient":"-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-linear-gradient-arguments":"[<angle>|<side-or-corner>]? , <color-stop-list>","-legacy-radial-gradient":"-moz-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-repeating-radial-gradient":"-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-radial-gradient-arguments":"[<position> ,]? [[[<-legacy-radial-gradient-shape>||<-legacy-radial-gradient-size>]|[<length>|<percentage>]{2}] ,]? <color-stop-list>","-legacy-radial-gradient-size":"closest-side|closest-corner|farthest-side|farthest-corner|contain|cover","-legacy-radial-gradient-shape":"circle|ellipse","-non-standard-font":"-apple-system-body|-apple-system-headline|-apple-system-subheadline|-apple-system-caption1|-apple-system-caption2|-apple-system-footnote|-apple-system-short-body|-apple-system-short-headline|-apple-system-short-subheadline|-apple-system-short-caption1|-apple-system-short-footnote|-apple-system-tall-body","-non-standard-color":"-moz-ButtonDefault|-moz-ButtonHoverFace|-moz-ButtonHoverText|-moz-CellHighlight|-moz-CellHighlightText|-moz-Combobox|-moz-ComboboxText|-moz-Dialog|-moz-DialogText|-moz-dragtargetzone|-moz-EvenTreeRow|-moz-Field|-moz-FieldText|-moz-html-CellHighlight|-moz-html-CellHighlightText|-moz-mac-accentdarkestshadow|-moz-mac-accentdarkshadow|-moz-mac-accentface|-moz-mac-accentlightesthighlight|-moz-mac-accentlightshadow|-moz-mac-accentregularhighlight|-moz-mac-accentregularshadow|-moz-mac-chrome-active|-moz-mac-chrome-inactive|-moz-mac-focusring|-moz-mac-menuselect|-moz-mac-menushadow|-moz-mac-menutextselect|-moz-MenuHover|-moz-MenuHoverText|-moz-MenuBarText|-moz-MenuBarHoverText|-moz-nativehyperlinktext|-moz-OddTreeRow|-moz-win-communicationstext|-moz-win-mediatext|-moz-activehyperlinktext|-moz-default-background-color|-moz-default-color|-moz-hyperlinktext|-moz-visitedhyperlinktext|-webkit-activelink|-webkit-focus-ring-color|-webkit-link|-webkit-text","-non-standard-image-rendering":"optimize-contrast|-moz-crisp-edges|-o-crisp-edges|-webkit-optimize-contrast","-non-standard-overflow":"-moz-scrollbars-none|-moz-scrollbars-horizontal|-moz-scrollbars-vertical|-moz-hidden-unscrollable","-non-standard-width":"fill-available|min-intrinsic|intrinsic|-moz-available|-moz-fit-content|-moz-min-content|-moz-max-content|-webkit-min-content|-webkit-max-content","-webkit-gradient()":"-webkit-gradient( <-webkit-gradient-type> , <-webkit-gradient-point> [, <-webkit-gradient-point>|, <-webkit-gradient-radius> , <-webkit-gradient-point>] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )","-webkit-gradient-color-stop":"from( <color> )|color-stop( [<number-zero-one>|<percentage>] , <color> )|to( <color> )","-webkit-gradient-point":"[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]","-webkit-gradient-radius":"<length>|<percentage>","-webkit-gradient-type":"linear|radial","-webkit-mask-box-repeat":"repeat|stretch|round","-webkit-mask-clip-style":"border|border-box|padding|padding-box|content|content-box|text","-ms-filter-function-list":"<-ms-filter-function>+","-ms-filter-function":"<-ms-filter-function-progid>|<-ms-filter-function-legacy>","-ms-filter-function-progid":"'progid:' [<ident-token> '.']* [<ident-token>|<function-token> <any-value>? )]","-ms-filter-function-legacy":"<ident-token>|<function-token> <any-value>? )","-ms-filter":"<string>",age:"child|young|old","attr-name":"<wq-name>","attr-fallback":"<any-value>","bg-clip":"<box>|border|text",bottom:"<length>|auto","generic-voice":"[<age>? <gender> <integer>?]",gender:"male|female|neutral",left:"<length>|auto","mask-image":"<mask-reference>#",paint:"none|<color>|<url> [none|<color>]?|context-fill|context-stroke",right:"<length>|auto","single-animation-composition":"replace|add|accumulate","svg-length":"<percentage>|<length>|<number>","svg-writing-mode":"lr-tb|rl-tb|tb-rl|lr|rl|tb",top:"<length>|auto",x:"<number>",y:"<number>",declaration:"<ident-token> : <declaration-value>? ['!' important]?","declaration-list":"[<declaration>? ';']* <declaration>?",url:"url( <string> <url-modifier>* )|<url-token>","url-modifier":"<ident>|<function-token> <any-value> )","number-zero-one":"<number [0,1]>","number-one-or-greater":"<number [1,\u221E]>","-non-standard-display":"-ms-inline-flexbox|-ms-grid|-ms-inline-grid|-webkit-flex|-webkit-inline-flex|-webkit-box|-webkit-inline-box|-moz-inline-stack|-moz-box|-moz-inline-box"},properties:{"--*":"<declaration-value>","-ms-accelerator":"false|true","-ms-block-progression":"tb|rl|bt|lr","-ms-content-zoom-chaining":"none|chained","-ms-content-zooming":"none|zoom","-ms-content-zoom-limit":"<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>","-ms-content-zoom-limit-max":"<percentage>","-ms-content-zoom-limit-min":"<percentage>","-ms-content-zoom-snap":"<'-ms-content-zoom-snap-type'>||<'-ms-content-zoom-snap-points'>","-ms-content-zoom-snap-points":"snapInterval( <percentage> , <percentage> )|snapList( <percentage># )","-ms-content-zoom-snap-type":"none|proximity|mandatory","-ms-filter":"<string>","-ms-flow-from":"[none|<custom-ident>]#","-ms-flow-into":"[none|<custom-ident>]#","-ms-grid-columns":"none|<track-list>|<auto-track-list>","-ms-grid-rows":"none|<track-list>|<auto-track-list>","-ms-high-contrast-adjust":"auto|none","-ms-hyphenate-limit-chars":"auto|<integer>{1,3}","-ms-hyphenate-limit-lines":"no-limit|<integer>","-ms-hyphenate-limit-zone":"<percentage>|<length>","-ms-ime-align":"auto|after","-ms-overflow-style":"auto|none|scrollbar|-ms-autohiding-scrollbar","-ms-scrollbar-3dlight-color":"<color>","-ms-scrollbar-arrow-color":"<color>","-ms-scrollbar-base-color":"<color>","-ms-scrollbar-darkshadow-color":"<color>","-ms-scrollbar-face-color":"<color>","-ms-scrollbar-highlight-color":"<color>","-ms-scrollbar-shadow-color":"<color>","-ms-scrollbar-track-color":"<color>","-ms-scroll-chaining":"chained|none","-ms-scroll-limit":"<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>","-ms-scroll-limit-x-max":"auto|<length>","-ms-scroll-limit-x-min":"<length>","-ms-scroll-limit-y-max":"auto|<length>","-ms-scroll-limit-y-min":"<length>","-ms-scroll-rails":"none|railed","-ms-scroll-snap-points-x":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-points-y":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-type":"none|proximity|mandatory","-ms-scroll-snap-x":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>","-ms-scroll-snap-y":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>","-ms-scroll-translation":"none|vertical-to-horizontal","-ms-text-autospace":"none|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space","-ms-touch-select":"grippers|none","-ms-user-select":"none|element|text","-ms-wrap-flow":"auto|both|start|end|maximum|clear","-ms-wrap-margin":"<length>","-ms-wrap-through":"wrap|none","-moz-appearance":"none|button|button-arrow-down|button-arrow-next|button-arrow-previous|button-arrow-up|button-bevel|button-focus|caret|checkbox|checkbox-container|checkbox-label|checkmenuitem|dualbutton|groupbox|listbox|listitem|menuarrow|menubar|menucheckbox|menuimage|menuitem|menuitemtext|menulist|menulist-button|menulist-text|menulist-textfield|menupopup|menuradio|menuseparator|meterbar|meterchunk|progressbar|progressbar-vertical|progresschunk|progresschunk-vertical|radio|radio-container|radio-label|radiomenuitem|range|range-thumb|resizer|resizerpanel|scale-horizontal|scalethumbend|scalethumb-horizontal|scalethumbstart|scalethumbtick|scalethumb-vertical|scale-vertical|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|separator|sheet|spinner|spinner-downbutton|spinner-textfield|spinner-upbutton|splitter|statusbar|statusbarpanel|tab|tabpanel|tabpanels|tab-scroll-arrow-back|tab-scroll-arrow-forward|textfield|textfield-multiline|toolbar|toolbarbutton|toolbarbutton-dropdown|toolbargripper|toolbox|tooltip|treeheader|treeheadercell|treeheadersortarrow|treeitem|treeline|treetwisty|treetwistyopen|treeview|-moz-mac-unified-toolbar|-moz-win-borderless-glass|-moz-win-browsertabbar-toolbox|-moz-win-communicationstext|-moz-win-communications-toolbox|-moz-win-exclude-glass|-moz-win-glass|-moz-win-mediatext|-moz-win-media-toolbox|-moz-window-button-box|-moz-window-button-box-maximized|-moz-window-button-close|-moz-window-button-maximize|-moz-window-button-minimize|-moz-window-button-restore|-moz-window-frame-bottom|-moz-window-frame-left|-moz-window-frame-right|-moz-window-titlebar|-moz-window-titlebar-maximized","-moz-binding":"<url>|none","-moz-border-bottom-colors":"<color>+|none","-moz-border-left-colors":"<color>+|none","-moz-border-right-colors":"<color>+|none","-moz-border-top-colors":"<color>+|none","-moz-context-properties":"none|[fill|fill-opacity|stroke|stroke-opacity]#","-moz-float-edge":"border-box|content-box|margin-box|padding-box","-moz-force-broken-image-icon":"0|1","-moz-image-region":"<shape>|auto","-moz-orient":"inline|block|horizontal|vertical","-moz-outline-radius":"<outline-radius>{1,4} [/ <outline-radius>{1,4}]?","-moz-outline-radius-bottomleft":"<outline-radius>","-moz-outline-radius-bottomright":"<outline-radius>","-moz-outline-radius-topleft":"<outline-radius>","-moz-outline-radius-topright":"<outline-radius>","-moz-stack-sizing":"ignore|stretch-to-fit","-moz-text-blink":"none|blink","-moz-user-focus":"ignore|normal|select-after|select-before|select-menu|select-same|select-all|none","-moz-user-input":"auto|none|enabled|disabled","-moz-user-modify":"read-only|read-write|write-only","-moz-window-dragging":"drag|no-drag","-moz-window-shadow":"default|menu|tooltip|sheet|none","-webkit-appearance":"none|button|button-bevel|caps-lock-indicator|caret|checkbox|default-button|inner-spin-button|listbox|listitem|media-controls-background|media-controls-fullscreen-background|media-current-time-display|media-enter-fullscreen-button|media-exit-fullscreen-button|media-fullscreen-button|media-mute-button|media-overlay-play-button|media-play-button|media-seek-back-button|media-seek-forward-button|media-slider|media-sliderthumb|media-time-remaining-display|media-toggle-closed-captions-button|media-volume-slider|media-volume-slider-container|media-volume-sliderthumb|menulist|menulist-button|menulist-text|menulist-textfield|meter|progress-bar|progress-bar-value|push-button|radio|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbargripper-horizontal|scrollbargripper-vertical|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|searchfield-cancel-button|searchfield-decoration|searchfield-results-button|searchfield-results-decoration|slider-horizontal|slider-vertical|sliderthumb-horizontal|sliderthumb-vertical|square-button|textarea|textfield|-apple-pay-button","-webkit-border-before":"<'border-width'>||<'border-style'>||<color>","-webkit-border-before-color":"<color>","-webkit-border-before-style":"<'border-style'>","-webkit-border-before-width":"<'border-width'>","-webkit-box-reflect":"[above|below|right|left]? <length>? <image>?","-webkit-line-clamp":"none|<integer>","-webkit-mask":"[<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||[<box>|border|padding|content|text]||[<box>|border|padding|content]]#","-webkit-mask-attachment":"<attachment>#","-webkit-mask-clip":"[<box>|border|padding|content|text]#","-webkit-mask-composite":"<composite-style>#","-webkit-mask-image":"<mask-reference>#","-webkit-mask-origin":"[<box>|border|padding|content]#","-webkit-mask-position":"<position>#","-webkit-mask-position-x":"[<length-percentage>|left|center|right]#","-webkit-mask-position-y":"[<length-percentage>|top|center|bottom]#","-webkit-mask-repeat":"<repeat-style>#","-webkit-mask-repeat-x":"repeat|no-repeat|space|round","-webkit-mask-repeat-y":"repeat|no-repeat|space|round","-webkit-mask-size":"<bg-size>#","-webkit-overflow-scrolling":"auto|touch","-webkit-tap-highlight-color":"<color>","-webkit-text-fill-color":"<color>","-webkit-text-stroke":"<length>||<color>","-webkit-text-stroke-color":"<color>","-webkit-text-stroke-width":"<length>","-webkit-touch-callout":"default|none","-webkit-user-modify":"read-only|read-write|read-write-plaintext-only","accent-color":"auto|<color>","align-content":"normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>","align-items":"normal|stretch|<baseline-position>|[<overflow-position>? <self-position>]","align-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? <self-position>","align-tracks":"[normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>]#",all:"initial|inherit|unset|revert|revert-layer",animation:"<single-animation>#","animation-composition":"<single-animation-composition>#","animation-delay":"<time>#","animation-direction":"<single-animation-direction>#","animation-duration":"<time>#","animation-fill-mode":"<single-animation-fill-mode>#","animation-iteration-count":"<single-animation-iteration-count>#","animation-name":"[none|<keyframes-name>]#","animation-play-state":"<single-animation-play-state>#","animation-timing-function":"<easing-function>#","animation-timeline":"<single-animation-timeline>#",appearance:"none|auto|textfield|menulist-button|<compat-auto>","aspect-ratio":"auto|<ratio>",azimuth:"<angle>|[[left-side|far-left|left|center-left|center|center-right|right|far-right|right-side]||behind]|leftwards|rightwards","backdrop-filter":"none|<filter-function-list>","backface-visibility":"visible|hidden",background:"[<bg-layer> ,]* <final-bg-layer>","background-attachment":"<attachment>#","background-blend-mode":"<blend-mode>#","background-clip":"<bg-clip>#","background-color":"<color>","background-image":"<bg-image>#","background-origin":"<box>#","background-position":"<bg-position>#","background-position-x":"[center|[[left|right|x-start|x-end]? <length-percentage>?]!]#","background-position-y":"[center|[[top|bottom|y-start|y-end]? <length-percentage>?]!]#","background-repeat":"<repeat-style>#","background-size":"<bg-size>#","block-overflow":"clip|ellipsis|<string>","block-size":"<'width'>",border:"<line-width>||<line-style>||<color>","border-block":"<'border-top-width'>||<'border-top-style'>||<color>","border-block-color":"<'border-top-color'>{1,2}","border-block-style":"<'border-top-style'>","border-block-width":"<'border-top-width'>","border-block-end":"<'border-top-width'>||<'border-top-style'>||<color>","border-block-end-color":"<'border-top-color'>","border-block-end-style":"<'border-top-style'>","border-block-end-width":"<'border-top-width'>","border-block-start":"<'border-top-width'>||<'border-top-style'>||<color>","border-block-start-color":"<'border-top-color'>","border-block-start-style":"<'border-top-style'>","border-block-start-width":"<'border-top-width'>","border-bottom":"<line-width>||<line-style>||<color>","border-bottom-color":"<'border-top-color'>","border-bottom-left-radius":"<length-percentage>{1,2}","border-bottom-right-radius":"<length-percentage>{1,2}","border-bottom-style":"<line-style>","border-bottom-width":"<line-width>","border-collapse":"collapse|separate","border-color":"<color>{1,4}","border-end-end-radius":"<length-percentage>{1,2}","border-end-start-radius":"<length-percentage>{1,2}","border-image":"<'border-image-source'>||<'border-image-slice'> [/ <'border-image-width'>|/ <'border-image-width'>? / <'border-image-outset'>]?||<'border-image-repeat'>","border-image-outset":"[<length>|<number>]{1,4}","border-image-repeat":"[stretch|repeat|round|space]{1,2}","border-image-slice":"<number-percentage>{1,4}&&fill?","border-image-source":"none|<image>","border-image-width":"[<length-percentage>|<number>|auto]{1,4}","border-inline":"<'border-top-width'>||<'border-top-style'>||<color>","border-inline-end":"<'border-top-width'>||<'border-top-style'>||<color>","border-inline-color":"<'border-top-color'>{1,2}","border-inline-style":"<'border-top-style'>","border-inline-width":"<'border-top-width'>","border-inline-end-color":"<'border-top-color'>","border-inline-end-style":"<'border-top-style'>","border-inline-end-width":"<'border-top-width'>","border-inline-start":"<'border-top-width'>||<'border-top-style'>||<color>","border-inline-start-color":"<'border-top-color'>","border-inline-start-style":"<'border-top-style'>","border-inline-start-width":"<'border-top-width'>","border-left":"<line-width>||<line-style>||<color>","border-left-color":"<color>","border-left-style":"<line-style>","border-left-width":"<line-width>","border-radius":"<length-percentage>{1,4} [/ <length-percentage>{1,4}]?","border-right":"<line-width>||<line-style>||<color>","border-right-color":"<color>","border-right-style":"<line-style>","border-right-width":"<line-width>","border-spacing":"<length> <length>?","border-start-end-radius":"<length-percentage>{1,2}","border-start-start-radius":"<length-percentage>{1,2}","border-style":"<line-style>{1,4}","border-top":"<line-width>||<line-style>||<color>","border-top-color":"<color>","border-top-left-radius":"<length-percentage>{1,2}","border-top-right-radius":"<length-percentage>{1,2}","border-top-style":"<line-style>","border-top-width":"<line-width>","border-width":"<line-width>{1,4}",bottom:"<length>|<percentage>|auto","box-align":"start|center|end|baseline|stretch","box-decoration-break":"slice|clone","box-direction":"normal|reverse|inherit","box-flex":"<number>","box-flex-group":"<integer>","box-lines":"single|multiple","box-ordinal-group":"<integer>","box-orient":"horizontal|vertical|inline-axis|block-axis|inherit","box-pack":"start|center|end|justify","box-shadow":"none|<shadow>#","box-sizing":"content-box|border-box","break-after":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-before":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-inside":"auto|avoid|avoid-page|avoid-column|avoid-region","caption-side":"top|bottom|block-start|block-end|inline-start|inline-end",caret:"<'caret-color'>||<'caret-shape'>","caret-color":"auto|<color>","caret-shape":"auto|bar|block|underscore",clear:"none|left|right|both|inline-start|inline-end",clip:"<shape>|auto","clip-path":"<clip-source>|[<basic-shape>||<geometry-box>]|none",color:"<color>","print-color-adjust":"economy|exact","color-scheme":"normal|[light|dark|<custom-ident>]+&&only?","column-count":"<integer>|auto","column-fill":"auto|balance|balance-all","column-gap":"normal|<length-percentage>","column-rule":"<'column-rule-width'>||<'column-rule-style'>||<'column-rule-color'>","column-rule-color":"<color>","column-rule-style":"<'border-style'>","column-rule-width":"<'border-width'>","column-span":"none|all","column-width":"<length>|auto",columns:"<'column-width'>||<'column-count'>",contain:"none|strict|content|[[size||inline-size]||layout||style||paint]","contain-intrinsic-size":"[none|<length>|auto <length>]{1,2}","contain-intrinsic-block-size":"none|<length>|auto <length>","contain-intrinsic-height":"none|<length>|auto <length>","contain-intrinsic-inline-size":"none|<length>|auto <length>","contain-intrinsic-width":"none|<length>|auto <length>",content:"normal|none|[<content-replacement>|<content-list>] [/ [<string>|<counter>]+]?","content-visibility":"visible|auto|hidden","counter-increment":"[<counter-name> <integer>?]+|none","counter-reset":"[<counter-name> <integer>?|<reversed-counter-name> <integer>?]+|none","counter-set":"[<counter-name> <integer>?]+|none",cursor:"[[<url> [<x> <y>]? ,]* [auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|e-resize|n-resize|ne-resize|nw-resize|s-resize|se-resize|sw-resize|w-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|col-resize|row-resize|all-scroll|zoom-in|zoom-out|grab|grabbing|hand|-webkit-grab|-webkit-grabbing|-webkit-zoom-in|-webkit-zoom-out|-moz-grab|-moz-grabbing|-moz-zoom-in|-moz-zoom-out]]",direction:"ltr|rtl",display:"[<display-outside>||<display-inside>]|<display-listitem>|<display-internal>|<display-box>|<display-legacy>|<-non-standard-display>","empty-cells":"show|hide",filter:"none|<filter-function-list>|<-ms-filter-function-list>",flex:"none|[<'flex-grow'> <'flex-shrink'>?||<'flex-basis'>]","flex-basis":"content|<'width'>","flex-direction":"row|row-reverse|column|column-reverse","flex-flow":"<'flex-direction'>||<'flex-wrap'>","flex-grow":"<number>","flex-shrink":"<number>","flex-wrap":"nowrap|wrap|wrap-reverse",float:"left|right|none|inline-start|inline-end",font:"[[<'font-style'>||<font-variant-css21>||<'font-weight'>||<'font-stretch'>]? <'font-size'> [/ <'line-height'>]? <'font-family'>]|caption|icon|menu|message-box|small-caption|status-bar","font-family":"[<family-name>|<generic-family>]#","font-feature-settings":"normal|<feature-tag-value>#","font-kerning":"auto|normal|none","font-language-override":"normal|<string>","font-optical-sizing":"auto|none","font-variation-settings":"normal|[<string> <number>]#","font-size":"<absolute-size>|<relative-size>|<length-percentage>","font-size-adjust":"none|[ex-height|cap-height|ch-width|ic-width|ic-height]? [from-font|<number>]","font-smooth":"auto|never|always|<absolute-size>|<length>","font-stretch":"<font-stretch-absolute>","font-style":"normal|italic|oblique <angle>?","font-synthesis":"none|[weight||style||small-caps]","font-variant":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-alternates":"normal|[stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )]","font-variant-caps":"normal|small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps","font-variant-east-asian":"normal|[<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-ligatures":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>]","font-variant-numeric":"normal|[<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero]","font-variant-position":"normal|sub|super","font-weight":"<font-weight-absolute>|bolder|lighter","forced-color-adjust":"auto|none",gap:"<'row-gap'> <'column-gap'>?",grid:"<'grid-template'>|<'grid-template-rows'> / [auto-flow&&dense?] <'grid-auto-columns'>?|[auto-flow&&dense?] <'grid-auto-rows'>? / <'grid-template-columns'>","grid-area":"<grid-line> [/ <grid-line>]{0,3}","grid-auto-columns":"<track-size>+","grid-auto-flow":"[row|column]||dense","grid-auto-rows":"<track-size>+","grid-column":"<grid-line> [/ <grid-line>]?","grid-column-end":"<grid-line>","grid-column-gap":"<length-percentage>","grid-column-start":"<grid-line>","grid-gap":"<'grid-row-gap'> <'grid-column-gap'>?","grid-row":"<grid-line> [/ <grid-line>]?","grid-row-end":"<grid-line>","grid-row-gap":"<length-percentage>","grid-row-start":"<grid-line>","grid-template":"none|[<'grid-template-rows'> / <'grid-template-columns'>]|[<line-names>? <string> <track-size>? <line-names>?]+ [/ <explicit-track-list>]?","grid-template-areas":"none|<string>+","grid-template-columns":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","grid-template-rows":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","hanging-punctuation":"none|[first||[force-end|allow-end]||last]",height:"auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )","hyphenate-character":"auto|<string>",hyphens:"none|manual|auto","image-orientation":"from-image|<angle>|[<angle>? flip]","image-rendering":"auto|crisp-edges|pixelated|optimizeSpeed|optimizeQuality|<-non-standard-image-rendering>","image-resolution":"[from-image||<resolution>]&&snap?","ime-mode":"auto|normal|active|inactive|disabled","initial-letter":"normal|[<number> <integer>?]","initial-letter-align":"[auto|alphabetic|hanging|ideographic]","inline-size":"<'width'>","input-security":"auto|none",inset:"<'top'>{1,4}","inset-block":"<'top'>{1,2}","inset-block-end":"<'top'>","inset-block-start":"<'top'>","inset-inline":"<'top'>{1,2}","inset-inline-end":"<'top'>","inset-inline-start":"<'top'>",isolation:"auto|isolate","justify-content":"normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]","justify-items":"normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]|legacy|legacy&&[left|right|center]","justify-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]","justify-tracks":"[normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]]#",left:"<length>|<percentage>|auto","letter-spacing":"normal|<length-percentage>","line-break":"auto|loose|normal|strict|anywhere","line-clamp":"none|<integer>","line-height":"normal|<number>|<length>|<percentage>","line-height-step":"<length>","list-style":"<'list-style-type'>||<'list-style-position'>||<'list-style-image'>","list-style-image":"<image>|none","list-style-position":"inside|outside","list-style-type":"<counter-style>|<string>|none",margin:"[<length>|<percentage>|auto]{1,4}","margin-block":"<'margin-left'>{1,2}","margin-block-end":"<'margin-left'>","margin-block-start":"<'margin-left'>","margin-bottom":"<length>|<percentage>|auto","margin-inline":"<'margin-left'>{1,2}","margin-inline-end":"<'margin-left'>","margin-inline-start":"<'margin-left'>","margin-left":"<length>|<percentage>|auto","margin-right":"<length>|<percentage>|auto","margin-top":"<length>|<percentage>|auto","margin-trim":"none|in-flow|all",mask:"<mask-layer>#","mask-border":"<'mask-border-source'>||<'mask-border-slice'> [/ <'mask-border-width'>? [/ <'mask-border-outset'>]?]?||<'mask-border-repeat'>||<'mask-border-mode'>","mask-border-mode":"luminance|alpha","mask-border-outset":"[<length>|<number>]{1,4}","mask-border-repeat":"[stretch|repeat|round|space]{1,2}","mask-border-slice":"<number-percentage>{1,4} fill?","mask-border-source":"none|<image>","mask-border-width":"[<length-percentage>|<number>|auto]{1,4}","mask-clip":"[<geometry-box>|no-clip]#","mask-composite":"<compositing-operator>#","mask-image":"<mask-reference>#","mask-mode":"<masking-mode>#","mask-origin":"<geometry-box>#","mask-position":"<position>#","mask-repeat":"<repeat-style>#","mask-size":"<bg-size>#","mask-type":"luminance|alpha","masonry-auto-flow":"[pack|next]||[definite-first|ordered]","math-depth":"auto-add|add( <integer> )|<integer>","math-shift":"normal|compact","math-style":"normal|compact","max-block-size":"<'max-width'>","max-height":"none|<length-percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )","max-inline-size":"<'max-width'>","max-lines":"none|<integer>","max-width":"none|<length-percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )|<-non-standard-width>","min-block-size":"<'min-width'>","min-height":"auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )","min-inline-size":"<'min-width'>","min-width":"auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )|<-non-standard-width>","mix-blend-mode":"<blend-mode>|plus-lighter","object-fit":"fill|contain|cover|none|scale-down","object-position":"<position>",offset:"[<'offset-position'>? [<'offset-path'> [<'offset-distance'>||<'offset-rotate'>]?]?]! [/ <'offset-anchor'>]?","offset-anchor":"auto|<position>","offset-distance":"<length-percentage>","offset-path":"none|ray( [<angle>&&<size>&&contain?] )|<path()>|<url>|[<basic-shape>||<geometry-box>]","offset-position":"auto|<position>","offset-rotate":"[auto|reverse]||<angle>",opacity:"<alpha-value>",order:"<integer>",orphans:"<integer>",outline:"[<'outline-color'>||<'outline-style'>||<'outline-width'>]","outline-color":"<color>|invert","outline-offset":"<length>","outline-style":"auto|<'border-style'>","outline-width":"<line-width>",overflow:"[visible|hidden|clip|scroll|auto]{1,2}|<-non-standard-overflow>","overflow-anchor":"auto|none","overflow-block":"visible|hidden|clip|scroll|auto","overflow-clip-box":"padding-box|content-box","overflow-clip-margin":"<visual-box>||<length [0,\u221E]>","overflow-inline":"visible|hidden|clip|scroll|auto","overflow-wrap":"normal|break-word|anywhere","overflow-x":"visible|hidden|clip|scroll|auto","overflow-y":"visible|hidden|clip|scroll|auto","overscroll-behavior":"[contain|none|auto]{1,2}","overscroll-behavior-block":"contain|none|auto","overscroll-behavior-inline":"contain|none|auto","overscroll-behavior-x":"contain|none|auto","overscroll-behavior-y":"contain|none|auto",padding:"[<length>|<percentage>]{1,4}","padding-block":"<'padding-left'>{1,2}","padding-block-end":"<'padding-left'>","padding-block-start":"<'padding-left'>","padding-bottom":"<length>|<percentage>","padding-inline":"<'padding-left'>{1,2}","padding-inline-end":"<'padding-left'>","padding-inline-start":"<'padding-left'>","padding-left":"<length>|<percentage>","padding-right":"<length>|<percentage>","padding-top":"<length>|<percentage>","page-break-after":"auto|always|avoid|left|right|recto|verso","page-break-before":"auto|always|avoid|left|right|recto|verso","page-break-inside":"auto|avoid","paint-order":"normal|[fill||stroke||markers]",perspective:"none|<length>","perspective-origin":"<position>","place-content":"<'align-content'> <'justify-content'>?","place-items":"<'align-items'> <'justify-items'>?","place-self":"<'align-self'> <'justify-self'>?","pointer-events":"auto|none|visiblePainted|visibleFill|visibleStroke|visible|painted|fill|stroke|all|inherit",position:"static|relative|absolute|sticky|fixed|-webkit-sticky",quotes:"none|auto|[<string> <string>]+",resize:"none|both|horizontal|vertical|block|inline",right:"<length>|<percentage>|auto",rotate:"none|<angle>|[x|y|z|<number>{3}]&&<angle>","row-gap":"normal|<length-percentage>","ruby-align":"start|center|space-between|space-around","ruby-merge":"separate|collapse|auto","ruby-position":"[alternate||[over|under]]|inter-character",scale:"none|<number>{1,3}","scrollbar-color":"auto|<color>{2}","scrollbar-gutter":"auto|stable&&both-edges?","scrollbar-width":"auto|thin|none","scroll-behavior":"auto|smooth","scroll-margin":"<length>{1,4}","scroll-margin-block":"<length>{1,2}","scroll-margin-block-start":"<length>","scroll-margin-block-end":"<length>","scroll-margin-bottom":"<length>","scroll-margin-inline":"<length>{1,2}","scroll-margin-inline-start":"<length>","scroll-margin-inline-end":"<length>","scroll-margin-left":"<length>","scroll-margin-right":"<length>","scroll-margin-top":"<length>","scroll-padding":"[auto|<length-percentage>]{1,4}","scroll-padding-block":"[auto|<length-percentage>]{1,2}","scroll-padding-block-start":"auto|<length-percentage>","scroll-padding-block-end":"auto|<length-percentage>","scroll-padding-bottom":"auto|<length-percentage>","scroll-padding-inline":"[auto|<length-percentage>]{1,2}","scroll-padding-inline-start":"auto|<length-percentage>","scroll-padding-inline-end":"auto|<length-percentage>","scroll-padding-left":"auto|<length-percentage>","scroll-padding-right":"auto|<length-percentage>","scroll-padding-top":"auto|<length-percentage>","scroll-snap-align":"[none|start|end|center]{1,2}","scroll-snap-coordinate":"none|<position>#","scroll-snap-destination":"<position>","scroll-snap-points-x":"none|repeat( <length-percentage> )","scroll-snap-points-y":"none|repeat( <length-percentage> )","scroll-snap-stop":"normal|always","scroll-snap-type":"none|[x|y|block|inline|both] [mandatory|proximity]?","scroll-snap-type-x":"none|mandatory|proximity","scroll-snap-type-y":"none|mandatory|proximity","scroll-timeline":"[<'scroll-timeline-name'>||<'scroll-timeline-axis'>]#","scroll-timeline-axis":"[block|inline|vertical|horizontal]#","scroll-timeline-name":"none|<custom-ident>#","shape-image-threshold":"<alpha-value>","shape-margin":"<length-percentage>","shape-outside":"none|[<shape-box>||<basic-shape>]|<image>","tab-size":"<integer>|<length>","table-layout":"auto|fixed","text-align":"start|end|left|right|center|justify|match-parent","text-align-last":"auto|start|end|left|right|center|justify","text-combine-upright":"none|all|[digits <integer>?]","text-decoration":"<'text-decoration-line'>||<'text-decoration-style'>||<'text-decoration-color'>||<'text-decoration-thickness'>","text-decoration-color":"<color>","text-decoration-line":"none|[underline||overline||line-through||blink]|spelling-error|grammar-error","text-decoration-skip":"none|[objects||[spaces|[leading-spaces||trailing-spaces]]||edges||box-decoration]","text-decoration-skip-ink":"auto|all|none","text-decoration-style":"solid|double|dotted|dashed|wavy","text-decoration-thickness":"auto|from-font|<length>|<percentage>","text-emphasis":"<'text-emphasis-style'>||<'text-emphasis-color'>","text-emphasis-color":"<color>","text-emphasis-position":"[over|under]&&[right|left]","text-emphasis-style":"none|[[filled|open]||[dot|circle|double-circle|triangle|sesame]]|<string>","text-indent":"<length-percentage>&&hanging?&&each-line?","text-justify":"auto|inter-character|inter-word|none","text-orientation":"mixed|upright|sideways","text-overflow":"[clip|ellipsis|<string>]{1,2}","text-rendering":"auto|optimizeSpeed|optimizeLegibility|geometricPrecision","text-shadow":"none|<shadow-t>#","text-size-adjust":"none|auto|<percentage>","text-transform":"none|capitalize|uppercase|lowercase|full-width|full-size-kana","text-underline-offset":"auto|<length>|<percentage>","text-underline-position":"auto|from-font|[under||[left|right]]",top:"<length>|<percentage>|auto","touch-action":"auto|none|[[pan-x|pan-left|pan-right]||[pan-y|pan-up|pan-down]||pinch-zoom]|manipulation",transform:"none|<transform-list>","transform-box":"content-box|border-box|fill-box|stroke-box|view-box","transform-origin":"[<length-percentage>|left|center|right|top|bottom]|[[<length-percentage>|left|center|right]&&[<length-percentage>|top|center|bottom]] <length>?","transform-style":"flat|preserve-3d",transition:"<single-transition>#","transition-delay":"<time>#","transition-duration":"<time>#","transition-property":"none|<single-transition-property>#","transition-timing-function":"<easing-function>#",translate:"none|<length-percentage> [<length-percentage> <length>?]?","unicode-bidi":"normal|embed|isolate|bidi-override|isolate-override|plaintext|-moz-isolate|-moz-isolate-override|-moz-plaintext|-webkit-isolate|-webkit-isolate-override|-webkit-plaintext","user-select":"auto|text|none|contain|all","vertical-align":"baseline|sub|super|text-top|text-bottom|middle|top|bottom|<percentage>|<length>",visibility:"visible|hidden|collapse","white-space":"normal|pre|nowrap|pre-wrap|pre-line|break-spaces",widows:"<integer>",width:"auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )|fill|stretch|intrinsic|-moz-max-content|-webkit-max-content|-moz-fit-content|-webkit-fit-content","will-change":"auto|<animateable-feature>#","word-break":"normal|break-all|keep-all|break-word","word-spacing":"normal|<length>","word-wrap":"normal|break-word","writing-mode":"horizontal-tb|vertical-rl|vertical-lr|sideways-rl|sideways-lr|<svg-writing-mode>","z-index":"auto|<integer>",zoom:"normal|reset|<number>|<percentage>","-moz-background-clip":"padding|border","-moz-border-radius-bottomleft":"<'border-bottom-left-radius'>","-moz-border-radius-bottomright":"<'border-bottom-right-radius'>","-moz-border-radius-topleft":"<'border-top-left-radius'>","-moz-border-radius-topright":"<'border-bottom-right-radius'>","-moz-control-character-visibility":"visible|hidden","-moz-osx-font-smoothing":"auto|grayscale","-moz-user-select":"none|text|all|-moz-none","-ms-flex-align":"start|end|center|baseline|stretch","-ms-flex-item-align":"auto|start|end|center|baseline|stretch","-ms-flex-line-pack":"start|end|center|justify|distribute|stretch","-ms-flex-negative":"<'flex-shrink'>","-ms-flex-pack":"start|end|center|justify|distribute","-ms-flex-order":"<integer>","-ms-flex-positive":"<'flex-grow'>","-ms-flex-preferred-size":"<'flex-basis'>","-ms-interpolation-mode":"nearest-neighbor|bicubic","-ms-grid-column-align":"start|end|center|stretch","-ms-grid-row-align":"start|end|center|stretch","-ms-hyphenate-limit-last":"none|always|column|page|spread","-webkit-background-clip":"[<box>|border|padding|content|text]#","-webkit-column-break-after":"always|auto|avoid","-webkit-column-break-before":"always|auto|avoid","-webkit-column-break-inside":"always|auto|avoid","-webkit-font-smoothing":"auto|none|antialiased|subpixel-antialiased","-webkit-mask-box-image":"[<url>|<gradient>|none] [<length-percentage>{4} <-webkit-mask-box-repeat>{2}]?","-webkit-print-color-adjust":"economy|exact","-webkit-text-security":"none|circle|disc|square","-webkit-user-drag":"none|element|auto","-webkit-user-select":"auto|none|text|all","alignment-baseline":"auto|baseline|before-edge|text-before-edge|middle|central|after-edge|text-after-edge|ideographic|alphabetic|hanging|mathematical","baseline-shift":"baseline|sub|super|<svg-length>",behavior:"<url>+","clip-rule":"nonzero|evenodd",cue:"<'cue-before'> <'cue-after'>?","cue-after":"<url> <decibel>?|none","cue-before":"<url> <decibel>?|none","dominant-baseline":"auto|use-script|no-change|reset-size|ideographic|alphabetic|hanging|mathematical|central|middle|text-after-edge|text-before-edge",fill:"<paint>","fill-opacity":"<number-zero-one>","fill-rule":"nonzero|evenodd","glyph-orientation-horizontal":"<angle>","glyph-orientation-vertical":"<angle>",kerning:"auto|<svg-length>",marker:"none|<url>","marker-end":"none|<url>","marker-mid":"none|<url>","marker-start":"none|<url>",pause:"<'pause-before'> <'pause-after'>?","pause-after":"<time>|none|x-weak|weak|medium|strong|x-strong","pause-before":"<time>|none|x-weak|weak|medium|strong|x-strong",rest:"<'rest-before'> <'rest-after'>?","rest-after":"<time>|none|x-weak|weak|medium|strong|x-strong","rest-before":"<time>|none|x-weak|weak|medium|strong|x-strong","shape-rendering":"auto|optimizeSpeed|crispEdges|geometricPrecision",src:"[<url> [format( <string># )]?|local( <family-name> )]#",speak:"auto|none|normal","speak-as":"normal|spell-out||digits||[literal-punctuation|no-punctuation]",stroke:"<paint>","stroke-dasharray":"none|[<svg-length>+]#","stroke-dashoffset":"<svg-length>","stroke-linecap":"butt|round|square","stroke-linejoin":"miter|round|bevel","stroke-miterlimit":"<number-one-or-greater>","stroke-opacity":"<number-zero-one>","stroke-width":"<svg-length>","text-anchor":"start|middle|end","unicode-range":"<urange>#","voice-balance":"<number>|left|center|right|leftwards|rightwards","voice-duration":"auto|<time>","voice-family":"[[<family-name>|<generic-voice>] ,]* [<family-name>|<generic-voice>]|preserve","voice-pitch":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-range":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-rate":"[normal|x-slow|slow|medium|fast|x-fast]||<percentage>","voice-stress":"normal|strong|moderate|none|reduced","voice-volume":"silent|[[x-soft|soft|medium|loud|x-loud]||<decibel>]"},atrules:{charset:{prelude:"<string>",descriptors:null},"counter-style":{prelude:"<counter-style-name>",descriptors:{"additive-symbols":"[<integer>&&<symbol>]#",fallback:"<counter-style-name>",negative:"<symbol> <symbol>?",pad:"<integer>&&<symbol>",prefix:"<symbol>",range:"[[<integer>|infinite]{2}]#|auto","speak-as":"auto|bullets|numbers|words|spell-out|<counter-style-name>",suffix:"<symbol>",symbols:"<symbol>+",system:"cyclic|numeric|alphabetic|symbolic|additive|[fixed <integer>?]|[extends <counter-style-name>]"}},document:{prelude:"[<url>|url-prefix( <string> )|domain( <string> )|media-document( <string> )|regexp( <string> )]#",descriptors:null},"font-face":{prelude:null,descriptors:{"ascent-override":"normal|<percentage>","descent-override":"normal|<percentage>","font-display":"[auto|block|swap|fallback|optional]","font-family":"<family-name>","font-feature-settings":"normal|<feature-tag-value>#","font-variation-settings":"normal|[<string> <number>]#","font-stretch":"<font-stretch-absolute>{1,2}","font-style":"normal|italic|oblique <angle>{0,2}","font-weight":"<font-weight-absolute>{1,2}","font-variant":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]","line-gap-override":"normal|<percentage>","size-adjust":"<percentage>",src:"[<url> [format( <string># )]?|local( <family-name> )]#","unicode-range":"<urange>#"}},"font-feature-values":{prelude:"<family-name>#",descriptors:null},import:{prelude:"[<string>|<url>] [layer|layer( <layer-name> )]? [supports( [<supports-condition>|<declaration>] )]? <media-query-list>?",descriptors:null},keyframes:{prelude:"<keyframes-name>",descriptors:null},layer:{prelude:"[<layer-name>#|<layer-name>?]",descriptors:null},media:{prelude:"<media-query-list>",descriptors:null},namespace:{prelude:"<namespace-prefix>? [<string>|<url>]",descriptors:null},page:{prelude:"<page-selector-list>",descriptors:{bleed:"auto|<length>",marks:"none|[crop||cross]",size:"<length>{1,2}|auto|[<page-size>||[portrait|landscape]]"}},property:{prelude:"<custom-property-name>",descriptors:{syntax:"<string>",inherits:"true|false","initial-value":"<string>"}},"scroll-timeline":{prelude:"<timeline-name>",descriptors:null},supports:{prelude:"<supports-condition>",descriptors:null},viewport:{prelude:null,descriptors:{height:"<viewport-length>{1,2}","max-height":"<viewport-length>","max-width":"<viewport-length>","max-zoom":"auto|<number>|<percentage>","min-height":"<viewport-length>","min-width":"<viewport-length>","min-zoom":"auto|<number>|<percentage>",orientation:"auto|portrait|landscape","user-zoom":"zoom|fixed","viewport-fit":"auto|contain|cover",width:"<viewport-length>{1,2}",zoom:"auto|<number>|<percentage>"}},nest:{prelude:"<complex-selector-list>",descriptors:null}}};var gt={};b(gt,{AnPlusB:()=>Xr,Atrule:()=>Zr,AtrulePrelude:()=>en,AttributeSelector:()=>nn,Block:()=>an,Brackets:()=>ln,CDC:()=>un,CDO:()=>hn,ClassSelector:()=>fn,Combinator:()=>gn,Comment:()=>xn,Declaration:()=>kn,DeclarationList:()=>Sn,Dimension:()=>An,Function:()=>En,Hash:()=>Pn,IdSelector:()=>Nn,Identifier:()=>Dn,MediaFeature:()=>Mn,MediaQuery:()=>Fn,MediaQueryList:()=>_n,NestingSelector:()=>jn,Nth:()=>Wn,Number:()=>Yn,Operator:()=>Vn,Parentheses:()=>Qn,Percentage:()=>$n,PseudoClassSelector:()=>Jn,PseudoElementSelector:()=>to,Ratio:()=>no,Raw:()=>io,Rule:()=>so,Selector:()=>co,SelectorList:()=>po,String:()=>bo,StyleSheet:()=>yo,TypeSelector:()=>vo,UnicodeRange:()=>Ao,Url:()=>Do,Value:()=>No,WhiteSpace:()=>Mo});var Xr={};b(Xr,{generate:()=>xc,name:()=>gc,parse:()=>Qr,structure:()=>bc});var me=43,re=45,Xt=110,Ie=!0,dc=!1;function $t(e,t){let r=this.tokenStart+e,n=this.charCodeAt(r);for((n===me||n===re)&&(t&&this.error("Number sign is not allowed"),r++);r<this.tokenEnd;r++)B(this.charCodeAt(r))||this.error("Integer is expected",r);}function Qe(e){return $t.call(this,0,e)}function Ce(e,t){if(!this.cmpChar(this.tokenStart+e,t)){let r="";switch(t){case Xt:r="N is expected";break;case re:r="HyphenMinus is expected";break}this.error(r,this.tokenStart+e);}}function Kr(){let e=0,t=0,r=this.tokenType;for(;r===13||r===25;)r=this.lookupType(++e);if(r!==10)if(this.isDelim(me,e)||this.isDelim(re,e)){t=this.isDelim(me,e)?me:re;do r=this.lookupType(++e);while(r===13||r===25);r!==10&&(this.skip(e),Qe.call(this,Ie));}else return null;return e>0&&this.skip(e),t===0&&(r=this.charCodeAt(this.tokenStart),r!==me&&r!==re&&this.error("Number sign is expected")),Qe.call(this,t!==0),t===re?"-"+this.consume(10):this.consume(10)}var gc="AnPlusB",bc={a:[String,null],b:[String,null]};function Qr(){let e=this.tokenStart,t=null,r=null;if(this.tokenType===10)Qe.call(this,dc),r=this.consume(10);else if(this.tokenType===1&&this.cmpChar(this.tokenStart,re))switch(t="-1",Ce.call(this,1,Xt),this.tokenEnd-this.tokenStart){case 2:this.next(),r=Kr.call(this);break;case 3:Ce.call(this,2,re),this.next(),this.skipSC(),Qe.call(this,Ie),r="-"+this.consume(10);break;default:Ce.call(this,2,re),$t.call(this,3,Ie),this.next(),r=this.substrToCursor(e+2);}else if(this.tokenType===1||this.isDelim(me)&&this.lookupType(1)===1){let n=0;switch(t="1",this.isDelim(me)&&(n=1,this.next()),Ce.call(this,0,Xt),this.tokenEnd-this.tokenStart){case 1:this.next(),r=Kr.call(this);break;case 2:Ce.call(this,1,re),this.next(),this.skipSC(),Qe.call(this,Ie),r="-"+this.consume(10);break;default:Ce.call(this,1,re),$t.call(this,2,Ie),this.next(),r=this.substrToCursor(e+n+1);}}else if(this.tokenType===12){let n=this.charCodeAt(this.tokenStart),o=n===me||n===re,i=this.tokenStart+o;for(;i<this.tokenEnd&&B(this.charCodeAt(i));i++);i===this.tokenStart+o&&this.error("Integer is expected",this.tokenStart+o),Ce.call(this,i-this.tokenStart,Xt),t=this.substring(e,i),i+1===this.tokenEnd?(this.next(),r=Kr.call(this)):(Ce.call(this,i-this.tokenStart+1,re),i+2===this.tokenEnd?(this.next(),this.skipSC(),Qe.call(this,Ie),r="-"+this.consume(10)):($t.call(this,i-this.tokenStart+2,Ie),this.next(),r=this.substrToCursor(i+1)));}else this.error();return t!==null&&t.charCodeAt(0)===me&&(t=t.substr(1)),r!==null&&r.charCodeAt(0)===me&&(r=r.substr(1)),{type:"AnPlusB",loc:this.getLocation(e,this.tokenStart),a:t,b:r}}function xc(e){if(e.a){let t=e.a==="+1"&&"n"||e.a==="1"&&"n"||e.a==="-1"&&"-n"||e.a+"n";if(e.b){let r=e.b[0]==="-"||e.b[0]==="+"?e.b:"+"+e.b;this.tokenize(t+r);}else this.tokenize(t);}else this.tokenize(e.b);}var Zr={};b(Zr,{generate:()=>Sc,name:()=>kc,parse:()=>$r,structure:()=>vc,walkContext:()=>wc});function da(e){return this.Raw(e,this.consumeUntilLeftCurlyBracketOrSemicolon,!0)}function yc(){for(let e=1,t;t=this.lookupType(e);e++){if(t===24)return !0;if(t===23||t===3)return !1}return !1}var kc="Atrule",wc="atrule",vc={name:String,prelude:["AtrulePrelude","Raw",null],block:["Block",null]};function $r(e=!1){let t=this.tokenStart,r,n,o=null,i=null;switch(this.eat(3),r=this.substrToCursor(t+1),n=r.toLowerCase(),this.skipSC(),this.eof===!1&&this.tokenType!==23&&this.tokenType!==17&&(this.parseAtrulePrelude?o=this.parseWithFallback(this.AtrulePrelude.bind(this,r,e),da):o=da.call(this,this.tokenIndex),this.skipSC()),this.tokenType){case 17:this.next();break;case 23:hasOwnProperty.call(this.atrule,n)&&typeof this.atrule[n].block=="function"?i=this.atrule[n].block.call(this,e):i=this.Block(yc.call(this));break}return {type:"Atrule",loc:this.getLocation(t,this.tokenStart),name:r,prelude:o,block:i}}function Sc(e){this.token(3,"@"+e.name),e.prelude!==null&&this.node(e.prelude),e.block?this.node(e.block):this.token(17,";");}var en={};b(en,{generate:()=>Ec,name:()=>Cc,parse:()=>Jr,structure:()=>Tc,walkContext:()=>Ac});var Cc="AtrulePrelude",Ac="atrulePrelude",Tc={children:[[]]};function Jr(e){let t=null;return e!==null&&(e=e.toLowerCase()),this.skipSC(),hasOwnProperty.call(this.atrule,e)&&typeof this.atrule[e].prelude=="function"?t=this.atrule[e].prelude.call(this):t=this.readSequence(this.scope.AtrulePrelude),this.skipSC(),this.eof!==!0&&this.tokenType!==23&&this.tokenType!==17&&this.error("Semicolon or block is expected"),{type:"AtrulePrelude",loc:this.getLocationFromList(t),children:t}}function Ec(e){this.children(e);}var nn={};b(nn,{generate:()=>Mc,name:()=>Nc,parse:()=>rn,structure:()=>zc});var Lc=36,ga=42,Zt=61,Pc=94,tn=124,Ic=126;function Dc(){this.eof&&this.error("Unexpected end of input");let e=this.tokenStart,t=!1;return this.isDelim(ga)?(t=!0,this.next()):this.isDelim(tn)||this.eat(1),this.isDelim(tn)?this.charCodeAt(this.tokenStart+1)!==Zt?(this.next(),this.eat(1)):t&&this.error("Identifier is expected",this.tokenEnd):t&&this.error("Vertical line is expected"),{type:"Identifier",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e)}}function Oc(){let e=this.tokenStart,t=this.charCodeAt(e);return t!==Zt&&t!==Ic&&t!==Pc&&t!==Lc&&t!==ga&&t!==tn&&this.error("Attribute selector (=, ~=, ^=, $=, *=, |=) is expected"),this.next(),t!==Zt&&(this.isDelim(Zt)||this.error("Equal sign is expected"),this.next()),this.substrToCursor(e)}var Nc="AttributeSelector",zc={name:"Identifier",matcher:[String,null],value:["String","Identifier",null],flags:[String,null]};function rn(){let e=this.tokenStart,t,r=null,n=null,o=null;return this.eat(19),this.skipSC(),t=Dc.call(this),this.skipSC(),this.tokenType!==20&&(this.tokenType!==1&&(r=Oc.call(this),this.skipSC(),n=this.tokenType===5?this.String():this.Identifier(),this.skipSC()),this.tokenType===1&&(o=this.consume(1),this.skipSC())),this.eat(20),{type:"AttributeSelector",loc:this.getLocation(e,this.tokenStart),name:t,matcher:r,value:n,flags:o}}function Mc(e){this.token(9,"["),this.node(e.name),e.matcher!==null&&(this.tokenize(e.matcher),this.node(e.value)),e.flags!==null&&this.token(1,e.flags),this.token(9,"]");}var an={};b(an,{generate:()=>jc,name:()=>Bc,parse:()=>on,structure:()=>Uc,walkContext:()=>_c});var Rc=38;function ya(e){return this.Raw(e,null,!0)}function ba(){return this.parseWithFallback(this.Rule,ya)}function xa(e){return this.Raw(e,this.consumeUntilSemicolonIncluded,!0)}function Fc(){if(this.tokenType===17)return xa.call(this,this.tokenIndex);let e=this.parseWithFallback(this.Declaration,xa);return this.tokenType===17&&this.next(),e}var Bc="Block",_c="block",Uc={children:[["Atrule","Rule","Declaration"]]};function on(e){let t=e?Fc:ba,r=this.tokenStart,n=this.createList();this.eat(23);e:for(;!this.eof;)switch(this.tokenType){case 24:break e;case 13:case 25:this.next();break;case 3:n.push(this.parseWithFallback(this.Atrule.bind(this,e),ya));break;default:e&&this.isDelim(Rc)?n.push(ba.call(this)):n.push(t.call(this));}return this.eof||this.eat(24),{type:"Block",loc:this.getLocation(r,this.tokenStart),children:n}}function jc(e){this.token(23,"{"),this.children(e,t=>{t.type==="Declaration"&&this.token(17,";");}),this.token(24,"}");}var ln={};b(ln,{generate:()=>Hc,name:()=>qc,parse:()=>sn,structure:()=>Wc});var qc="Brackets",Wc={children:[[]]};function sn(e,t){let r=this.tokenStart,n=null;return this.eat(19),n=e.call(this,t),this.eof||this.eat(20),{type:"Brackets",loc:this.getLocation(r,this.tokenStart),children:n}}function Hc(e){this.token(9,"["),this.children(e),this.token(9,"]");}var un={};b(un,{generate:()=>Vc,name:()=>Yc,parse:()=>cn,structure:()=>Gc});var Yc="CDC",Gc=[];function cn(){let e=this.tokenStart;return this.eat(15),{type:"CDC",loc:this.getLocation(e,this.tokenStart)}}function Vc(){this.token(15,"-->");}var hn={};b(hn,{generate:()=>Xc,name:()=>Kc,parse:()=>pn,structure:()=>Qc});var Kc="CDO",Qc=[];function pn(){let e=this.tokenStart;return this.eat(14),{type:"CDO",loc:this.getLocation(e,this.tokenStart)}}function Xc(){this.token(14,"<!--");}var fn={};b(fn,{generate:()=>eu,name:()=>Zc,parse:()=>mn,structure:()=>Jc});var $c=46,Zc="ClassSelector",Jc={name:String};function mn(){return this.eatDelim($c),{type:"ClassSelector",loc:this.getLocation(this.tokenStart-1,this.tokenEnd),name:this.consume(1)}}function eu(e){this.token(9,"."),this.token(1,e.name);}var gn={};b(gn,{generate:()=>au,name:()=>ou,parse:()=>dn,structure:()=>iu});var tu=43,ka=47,ru=62,nu=126,ou="Combinator",iu={name:String};function dn(){let e=this.tokenStart,t;switch(this.tokenType){case 13:t=" ";break;case 9:switch(this.charCodeAt(this.tokenStart)){case ru:case tu:case nu:this.next();break;case ka:this.next(),this.eatIdent("deep"),this.eatDelim(ka);break;default:this.error("Combinator is expected");}t=this.substrToCursor(e);break}return {type:"Combinator",loc:this.getLocation(e,this.tokenStart),name:t}}function au(e){this.tokenize(e.name);}var xn={};b(xn,{generate:()=>pu,name:()=>cu,parse:()=>bn,structure:()=>uu});var su=42,lu=47,cu="Comment",uu={value:String};function bn(){let e=this.tokenStart,t=this.tokenEnd;return this.eat(25),t-e+2>=2&&this.charCodeAt(t-2)===su&&this.charCodeAt(t-1)===lu&&(t-=2),{type:"Comment",loc:this.getLocation(e,this.tokenStart),value:this.substring(e+2,t)}}function pu(e){this.token(25,"/*"+e.value+"*/");}var kn={};b(kn,{generate:()=>Su,name:()=>ku,parse:()=>yn,structure:()=>vu,walkContext:()=>wu});var va=33,hu=35,mu=36,fu=38,du=42,gu=43,wa=47;function bu(e){return this.Raw(e,this.consumeUntilExclamationMarkOrSemicolon,!0)}function xu(e){return this.Raw(e,this.consumeUntilExclamationMarkOrSemicolon,!1)}function yu(){let e=this.tokenIndex,t=this.Value();return t.type!=="Raw"&&this.eof===!1&&this.tokenType!==17&&this.isDelim(va)===!1&&this.isBalanceEdge(e)===!1&&this.error(),t}var ku="Declaration",wu="declaration",vu={important:[Boolean,String],property:String,value:["Value","Raw"]};function yn(){let e=this.tokenStart,t=this.tokenIndex,r=Cu.call(this),n=Mt(r),o=n?this.parseCustomProperty:this.parseValue,i=n?xu:bu,s=!1,u;this.skipSC(),this.eat(16);let c=this.tokenIndex;if(n||this.skipSC(),o?u=this.parseWithFallback(yu,i):u=i.call(this,this.tokenIndex),n&&u.type==="Value"&&u.children.isEmpty){for(let a=c-this.tokenIndex;a<=0;a++)if(this.lookupType(a)===13){u.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}}return this.isDelim(va)&&(s=Au.call(this),this.skipSC()),this.eof===!1&&this.tokenType!==17&&this.isBalanceEdge(t)===!1&&this.error(),{type:"Declaration",loc:this.getLocation(e,this.tokenStart),important:s,property:r,value:u}}function Su(e){this.token(1,e.property),this.token(16,":"),this.node(e.value),e.important&&(this.token(9,"!"),this.token(1,e.important===!0?"important":e.important));}function Cu(){let e=this.tokenStart;if(this.tokenType===9)switch(this.charCodeAt(this.tokenStart)){case du:case mu:case gu:case hu:case fu:this.next();break;case wa:this.next(),this.isDelim(wa)&&this.next();break}return this.tokenType===4?this.eat(4):this.eat(1),this.substrToCursor(e)}function Au(){this.eat(9),this.skipSC();let e=this.consume(1);return e==="important"?!0:e}var Sn={};b(Sn,{generate:()=>Pu,name:()=>Eu,parse:()=>vn,structure:()=>Lu});var Tu=38;function wn(e){return this.Raw(e,this.consumeUntilSemicolonIncluded,!0)}var Eu="DeclarationList",Lu={children:[["Declaration","Atrule","Rule"]]};function vn(){let e=this.createList();for(;!this.eof;)switch(this.tokenType){case 13:case 25:case 17:this.next();break;case 3:e.push(this.parseWithFallback(this.Atrule.bind(this,!0),wn));break;default:this.isDelim(Tu)?e.push(this.parseWithFallback(this.Rule,wn)):e.push(this.parseWithFallback(this.Declaration,wn));}return {type:"DeclarationList",loc:this.getLocationFromList(e),children:e}}function Pu(e){this.children(e,t=>{t.type==="Declaration"&&this.token(17,";");});}var An={};b(An,{generate:()=>Ou,name:()=>Iu,parse:()=>Cn,structure:()=>Du});var Iu="Dimension",Du={value:String,unit:String};function Cn(){let e=this.tokenStart,t=this.consumeNumber(12);return {type:"Dimension",loc:this.getLocation(e,this.tokenStart),value:t,unit:this.substring(e+t.length,this.tokenStart)}}function Ou(e){this.token(12,e.value+e.unit);}var En={};b(En,{generate:()=>Ru,name:()=>Nu,parse:()=>Tn,structure:()=>Mu,walkContext:()=>zu});var Nu="Function",zu="function",Mu={name:String,children:[[]]};function Tn(e,t){let r=this.tokenStart,n=this.consumeFunctionName(),o=n.toLowerCase(),i;return i=t.hasOwnProperty(o)?t[o].call(this,t):e.call(this,t),this.eof||this.eat(22),{type:"Function",loc:this.getLocation(r,this.tokenStart),name:n,children:i}}function Ru(e){this.token(2,e.name+"("),this.children(e),this.token(22,")");}var Pn={};b(Pn,{generate:()=>Uu,name:()=>Bu,parse:()=>Ln,structure:()=>_u,xxx:()=>Fu});var Fu="XXX",Bu="Hash",_u={value:String};function Ln(){let e=this.tokenStart;return this.eat(4),{type:"Hash",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e+1)}}function Uu(e){this.token(4,"#"+e.value);}var Dn={};b(Dn,{generate:()=>Wu,name:()=>ju,parse:()=>In,structure:()=>qu});var ju="Identifier",qu={name:String};function In(){return {type:"Identifier",loc:this.getLocation(this.tokenStart,this.tokenEnd),name:this.consume(1)}}function Wu(e){this.token(1,e.name);}var Nn={};b(Nn,{generate:()=>Gu,name:()=>Hu,parse:()=>On,structure:()=>Yu});var Hu="IdSelector",Yu={name:String};function On(){let e=this.tokenStart;return this.eat(4),{type:"IdSelector",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e+1)}}function Gu(e){this.token(9,"#"+e.name);}var Mn={};b(Mn,{generate:()=>Qu,name:()=>Vu,parse:()=>zn,structure:()=>Ku});var Vu="MediaFeature",Ku={name:String,value:["Identifier","Number","Dimension","Ratio",null]};function zn(){let e=this.tokenStart,t,r=null;if(this.eat(21),this.skipSC(),t=this.consume(1),this.skipSC(),this.tokenType!==22){switch(this.eat(16),this.skipSC(),this.tokenType){case 10:this.lookupNonWSType(1)===9?r=this.Ratio():r=this.Number();break;case 12:r=this.Dimension();break;case 1:r=this.Identifier();break;default:this.error("Number, dimension, ratio or identifier is expected");}this.skipSC();}return this.eat(22),{type:"MediaFeature",loc:this.getLocation(e,this.tokenStart),name:t,value:r}}function Qu(e){this.token(21,"("),this.token(1,e.name),e.value!==null&&(this.token(16,":"),this.node(e.value)),this.token(22,")");}var Fn={};b(Fn,{generate:()=>Zu,name:()=>Xu,parse:()=>Rn,structure:()=>$u});var Xu="MediaQuery",$u={children:[["Identifier","MediaFeature","WhiteSpace"]]};function Rn(){let e=this.createList(),t=null;this.skipSC();e:for(;!this.eof;){switch(this.tokenType){case 25:case 13:this.next();continue;case 1:t=this.Identifier();break;case 21:t=this.MediaFeature();break;default:break e}e.push(t);}return t===null&&this.error("Identifier or parenthesis is expected"),{type:"MediaQuery",loc:this.getLocationFromList(e),children:e}}function Zu(e){this.children(e);}var _n={};b(_n,{generate:()=>tp,name:()=>Ju,parse:()=>Bn,structure:()=>ep});var Ju="MediaQueryList",ep={children:[["MediaQuery"]]};function Bn(){let e=this.createList();for(this.skipSC();!this.eof&&(e.push(this.MediaQuery()),this.tokenType===18);)this.next();return {type:"MediaQueryList",loc:this.getLocationFromList(e),children:e}}function tp(e){this.children(e,()=>this.token(18,","));}var jn={};b(jn,{generate:()=>ip,name:()=>np,parse:()=>Un,structure:()=>op});var rp=38,np="NestingSelector",op={};function Un(){let e=this.tokenStart;return this.eatDelim(rp),{type:"NestingSelector",loc:this.getLocation(e,this.tokenStart)}}function ip(){this.token(9,"&");}var Wn={};b(Wn,{generate:()=>lp,name:()=>ap,parse:()=>qn,structure:()=>sp});var ap="Nth",sp={nth:["AnPlusB","Identifier"],selector:["SelectorList",null]};function qn(){this.skipSC();let e=this.tokenStart,t=e,r=null,n;return this.lookupValue(0,"odd")||this.lookupValue(0,"even")?n=this.Identifier():n=this.AnPlusB(),t=this.tokenStart,this.skipSC(),this.lookupValue(0,"of")&&(this.next(),r=this.SelectorList(),t=this.tokenStart),{type:"Nth",loc:this.getLocation(e,t),nth:n,selector:r}}function lp(e){this.node(e.nth),e.selector!==null&&(this.token(1,"of"),this.node(e.selector));}var Yn={};b(Yn,{generate:()=>pp,name:()=>cp,parse:()=>Hn,structure:()=>up});var cp="Number",up={value:String};function Hn(){return {type:"Number",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:this.consume(10)}}function pp(e){this.token(10,e.value);}var Vn={};b(Vn,{generate:()=>fp,name:()=>hp,parse:()=>Gn,structure:()=>mp});var hp="Operator",mp={value:String};function Gn(){let e=this.tokenStart;return this.next(),{type:"Operator",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e)}}function fp(e){this.tokenize(e.value);}var Qn={};b(Qn,{generate:()=>bp,name:()=>dp,parse:()=>Kn,structure:()=>gp});var dp="Parentheses",gp={children:[[]]};function Kn(e,t){let r=this.tokenStart,n=null;return this.eat(21),n=e.call(this,t),this.eof||this.eat(22),{type:"Parentheses",loc:this.getLocation(r,this.tokenStart),children:n}}function bp(e){this.token(21,"("),this.children(e),this.token(22,")");}var $n={};b($n,{generate:()=>kp,name:()=>xp,parse:()=>Xn,structure:()=>yp});var xp="Percentage",yp={value:String};function Xn(){return {type:"Percentage",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:this.consumeNumber(11)}}function kp(e){this.token(11,e.value+"%");}var Jn={};b(Jn,{generate:()=>Cp,name:()=>wp,parse:()=>Zn,structure:()=>Sp,walkContext:()=>vp});var wp="PseudoClassSelector",vp="function",Sp={name:String,children:[["Raw"],null]};function Zn(){let e=this.tokenStart,t=null,r,n;return this.eat(16),this.tokenType===2?(r=this.consumeFunctionName(),n=r.toLowerCase(),this.lookupNonWSType(0)==22?t=this.createList():hasOwnProperty.call(this.pseudo,n)?(this.skipSC(),t=this.pseudo[n].call(this),this.skipSC()):(t=this.createList(),t.push(this.Raw(this.tokenIndex,null,!1))),this.eat(22)):r=this.consume(1),{type:"PseudoClassSelector",loc:this.getLocation(e,this.tokenStart),name:r,children:t}}function Cp(e){this.token(16,":"),e.children===null?this.token(1,e.name):(this.token(2,e.name+"("),this.children(e),this.token(22,")"));}var to={};b(to,{generate:()=>Lp,name:()=>Ap,parse:()=>eo,structure:()=>Ep,walkContext:()=>Tp});var Ap="PseudoElementSelector",Tp="function",Ep={name:String,children:[["Raw"],null]};function eo(){let e=this.tokenStart,t=null,r,n;return this.eat(16),this.eat(16),this.tokenType===2?(r=this.consumeFunctionName(),n=r.toLowerCase(),this.lookupNonWSType(0)==22?t=this.createList():hasOwnProperty.call(this.pseudo,n)?(this.skipSC(),t=this.pseudo[n].call(this),this.skipSC()):(t=this.createList(),t.push(this.Raw(this.tokenIndex,null,!1))),this.eat(22)):r=this.consume(1),{type:"PseudoElementSelector",loc:this.getLocation(e,this.tokenStart),name:r,children:t}}function Lp(e){this.token(16,":"),this.token(16,":"),e.children===null?this.token(1,e.name):(this.token(2,e.name+"("),this.children(e),this.token(22,")"));}var no={};b(no,{generate:()=>Np,name:()=>Dp,parse:()=>ro,structure:()=>Op});var Pp=47,Ip=46;function Sa(){this.skipSC();let e=this.consume(10);for(let t=0;t<e.length;t++){let r=e.charCodeAt(t);!B(r)&&r!==Ip&&this.error("Unsigned number is expected",this.tokenStart-e.length+t);}return Number(e)===0&&this.error("Zero number is not allowed",this.tokenStart-e.length),e}var Dp="Ratio",Op={left:String,right:String};function ro(){let e=this.tokenStart,t=Sa.call(this),r;return this.skipSC(),this.eatDelim(Pp),r=Sa.call(this),{type:"Ratio",loc:this.getLocation(e,this.tokenStart),left:t,right:r}}function Np(e){this.token(10,e.left),this.token(9,"/"),this.token(10,e.right);}var io={};b(io,{generate:()=>Fp,name:()=>Mp,parse:()=>oo,structure:()=>Rp});function zp(){return this.tokenIndex>0&&this.lookupType(-1)===13?this.tokenIndex>1?this.getTokenStart(this.tokenIndex-1):this.firstCharOffset:this.tokenStart}var Mp="Raw",Rp={value:String};function oo(e,t,r){let n=this.getTokenStart(e),o;return this.skipUntilBalanced(e,t||this.consumeUntilBalanceEnd),r&&this.tokenStart>n?o=zp.call(this):o=this.tokenStart,{type:"Raw",loc:this.getLocation(n,o),value:this.substring(n,o)}}function Fp(e){this.tokenize(e.value);}var so={};b(so,{generate:()=>qp,name:()=>_p,parse:()=>ao,structure:()=>jp,walkContext:()=>Up});function Ca(e){return this.Raw(e,this.consumeUntilLeftCurlyBracket,!0)}function Bp(){let e=this.SelectorList();return e.type!=="Raw"&&this.eof===!1&&this.tokenType!==23&&this.error(),e}var _p="Rule",Up="rule",jp={prelude:["SelectorList","Raw"],block:["Block"]};function ao(){let e=this.tokenIndex,t=this.tokenStart,r,n;return this.parseRulePrelude?r=this.parseWithFallback(Bp,Ca):r=Ca.call(this,e),n=this.Block(!0),{type:"Rule",loc:this.getLocation(t,this.tokenStart),prelude:r,block:n}}function qp(e){this.node(e.prelude),this.node(e.block);}var co={};b(co,{generate:()=>Yp,name:()=>Wp,parse:()=>lo,structure:()=>Hp});var Wp="Selector",Hp={children:[["TypeSelector","IdSelector","ClassSelector","AttributeSelector","PseudoClassSelector","PseudoElementSelector","Combinator","WhiteSpace"]]};function lo(){let e=this.readSequence(this.scope.Selector);return this.getFirstListNode(e)===null&&this.error("Selector is expected"),{type:"Selector",loc:this.getLocationFromList(e),children:e}}function Yp(e){this.children(e);}var po={};b(po,{generate:()=>Qp,name:()=>Gp,parse:()=>uo,structure:()=>Kp,walkContext:()=>Vp});var Gp="SelectorList",Vp="selector",Kp={children:[["Selector","Raw"]]};function uo(){let e=this.createList();for(;!this.eof;){if(e.push(this.Selector()),this.tokenType===18){this.next();continue}break}return {type:"SelectorList",loc:this.getLocationFromList(e),children:e}}function Qp(e){this.children(e,()=>this.token(18,","));}var bo={};b(bo,{generate:()=>Zp,name:()=>Xp,parse:()=>go,structure:()=>$p});var fo={};b(fo,{decode:()=>ft,encode:()=>mo});var ho=92,Aa=34,Ta=39;function ft(e){let t=e.length,r=e.charCodeAt(0),n=r===Aa||r===Ta?1:0,o=n===1&&t>1&&e.charCodeAt(t-1)===r?t-2:t-1,i="";for(let s=n;s<=o;s++){let u=e.charCodeAt(s);if(u===ho){if(s===o){s!==t-1&&(i=e.substr(s+1));break}if(u=e.charCodeAt(++s),$(ho,u)){let c=s-1,a=se(e,c);s=a-1,i+=Re(e.substring(c+1,a));}else u===13&&e.charCodeAt(s+1)===10&&s++;}else i+=e[s];}return i}function mo(e,t){let r=t?"'":'"',n=t?Ta:Aa,o="",i=!1;for(let s=0;s<e.length;s++){let u=e.charCodeAt(s);if(u===0){o+="\uFFFD";continue}if(u<=31||u===127){o+="\\"+u.toString(16),i=!0;continue}u===n||u===ho?(o+="\\"+e.charAt(s),i=!1):(i&&(ee(u)||pe(u))&&(o+=" "),o+=e.charAt(s),i=!1);}return r+o+r}var Xp="String",$p={value:String};function go(){return {type:"String",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:ft(this.consume(5))}}function Zp(e){this.token(5,mo(e.value));}var yo={};b(yo,{generate:()=>nh,name:()=>eh,parse:()=>xo,structure:()=>rh,walkContext:()=>th});var Jp=33;function Ea(e){return this.Raw(e,null,!1)}var eh="StyleSheet",th="stylesheet",rh={children:[["Comment","CDO","CDC","Atrule","Rule","Raw"]]};function xo(){let e=this.tokenStart,t=this.createList(),r;for(;!this.eof;){switch(this.tokenType){case 13:this.next();continue;case 25:if(this.charCodeAt(this.tokenStart+2)!==Jp){this.next();continue}r=this.Comment();break;case 14:r=this.CDO();break;case 15:r=this.CDC();break;case 3:r=this.parseWithFallback(this.Atrule,Ea);break;default:r=this.parseWithFallback(this.Rule,Ea);}t.push(r);}return {type:"StyleSheet",loc:this.getLocation(e,this.tokenStart),children:t}}function nh(e){this.children(e);}var vo={};b(vo,{generate:()=>sh,name:()=>ih,parse:()=>wo,structure:()=>ah});var oh=42,La=124;function ko(){this.tokenType!==1&&this.isDelim(oh)===!1&&this.error("Identifier or asterisk is expected"),this.next();}var ih="TypeSelector",ah={name:String};function wo(){let e=this.tokenStart;return this.isDelim(La)?(this.next(),ko.call(this)):(ko.call(this),this.isDelim(La)&&(this.next(),ko.call(this))),{type:"TypeSelector",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e)}}function sh(e){this.tokenize(e.name);}var Ao={};b(Ao,{generate:()=>hh,name:()=>uh,parse:()=>Co,structure:()=>ph});var Pa=43,Ia=45,So=63;function dt(e,t){let r=0;for(let n=this.tokenStart+e;n<this.tokenEnd;n++){let o=this.charCodeAt(n);if(o===Ia&&t&&r!==0)return dt.call(this,e+r+1,!1),-1;ee(o)||this.error(t&&r!==0?"Hyphen minus"+(r<6?" or hex digit":"")+" is expected":r<6?"Hex digit is expected":"Unexpected input",n),++r>6&&this.error("Too many hex digits",n);}return this.next(),r}function Jt(e){let t=0;for(;this.isDelim(So);)++t>e&&this.error("Too many question marks"),this.next();}function lh(e){this.charCodeAt(this.tokenStart)!==e&&this.error((e===Pa?"Plus sign":"Hyphen minus")+" is expected");}function ch(){let e=0;switch(this.tokenType){case 10:if(e=dt.call(this,1,!0),this.isDelim(So)){Jt.call(this,6-e);break}if(this.tokenType===12||this.tokenType===10){lh.call(this,Ia),dt.call(this,1,!1);break}break;case 12:e=dt.call(this,1,!0),e>0&&Jt.call(this,6-e);break;default:if(this.eatDelim(Pa),this.tokenType===1){e=dt.call(this,0,!0),e>0&&Jt.call(this,6-e);break}if(this.isDelim(So)){this.next(),Jt.call(this,5);break}this.error("Hex digit or question mark is expected");}}var uh="UnicodeRange",ph={value:String};function Co(){let e=this.tokenStart;return this.eatIdent("u"),ch.call(this),{type:"UnicodeRange",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e)}}function hh(e){this.tokenize(e.value);}var Do={};b(Do,{generate:()=>yh,name:()=>bh,parse:()=>Io,structure:()=>xh});var Po={};b(Po,{decode:()=>Eo,encode:()=>Lo});var mh=32,To=92,fh=34,dh=39,gh=40,Da=41;function Eo(e){let t=e.length,r=4,n=e.charCodeAt(t-1)===Da?t-2:t-1,o="";for(;r<n&&pe(e.charCodeAt(r));)r++;for(;r<n&&pe(e.charCodeAt(n));)n--;for(let i=r;i<=n;i++){let s=e.charCodeAt(i);if(s===To){if(i===n){i!==t-1&&(o=e.substr(i+1));break}if(s=e.charCodeAt(++i),$(To,s)){let u=i-1,c=se(e,u);i=c-1,o+=Re(e.substring(u+1,c));}else s===13&&e.charCodeAt(i+1)===10&&i++;}else o+=e[i];}return o}function Lo(e){let t="",r=!1;for(let n=0;n<e.length;n++){let o=e.charCodeAt(n);if(o===0){t+="\uFFFD";continue}if(o<=31||o===127){t+="\\"+o.toString(16),r=!0;continue}o===mh||o===To||o===fh||o===dh||o===gh||o===Da?(t+="\\"+e.charAt(n),r=!1):(r&&ee(o)&&(t+=" "),t+=e.charAt(n),r=!1);}return "url("+t+")"}var bh="Url",xh={value:String};function Io(){let e=this.tokenStart,t;switch(this.tokenType){case 7:t=Eo(this.consume(7));break;case 2:this.cmpStr(this.tokenStart,this.tokenEnd,"url(")||this.error("Function name must be `url`"),this.eat(2),this.skipSC(),t=ft(this.consume(5)),this.skipSC(),this.eof||this.eat(22);break;default:this.error("Url or Function is expected");}return {type:"Url",loc:this.getLocation(e,this.tokenStart),value:t}}function yh(e){this.token(7,Lo(e.value));}var No={};b(No,{generate:()=>vh,name:()=>kh,parse:()=>Oo,structure:()=>wh});var kh="Value",wh={children:[[]]};function Oo(){let e=this.tokenStart,t=this.readSequence(this.scope.Value);return {type:"Value",loc:this.getLocation(e,this.tokenStart),children:t}}function vh(e){this.children(e);}var Mo={};b(Mo,{generate:()=>Th,name:()=>Ch,parse:()=>zo,structure:()=>Ah});var Sh=Object.freeze({type:"WhiteSpace",loc:null,value:" "}),Ch="WhiteSpace",Ah={value:String};function zo(){return this.eat(13),Sh}function Th(e){this.token(13,e.value);}var Oa={generic:!0,...fa,node:gt};var Ro={};b(Ro,{AtrulePrelude:()=>za,Selector:()=>Ra,Value:()=>Ua});var Eh=35,Lh=42,Na=43,Ph=45,Ih=47,Dh=117;function bt(e){switch(this.tokenType){case 4:return this.Hash();case 18:return this.Operator();case 21:return this.Parentheses(this.readSequence,e.recognizer);case 19:return this.Brackets(this.readSequence,e.recognizer);case 5:return this.String();case 12:return this.Dimension();case 11:return this.Percentage();case 10:return this.Number();case 2:return this.cmpStr(this.tokenStart,this.tokenEnd,"url(")?this.Url():this.Function(this.readSequence,e.recognizer);case 7:return this.Url();case 1:return this.cmpChar(this.tokenStart,Dh)&&this.cmpChar(this.tokenStart+1,Na)?this.UnicodeRange():this.Identifier();case 9:{let t=this.charCodeAt(this.tokenStart);if(t===Ih||t===Lh||t===Na||t===Ph)return this.Operator();t===Eh&&this.error("Hex or identifier is expected",this.tokenStart+1);break}}}var za={getNode:bt};var Oh=35,Nh=38,zh=42,Mh=43,Rh=47,Ma=46,Fh=62,Bh=124,_h=126;function Uh(e,t){t.last!==null&&t.last.type!=="Combinator"&&e!==null&&e.type!=="Combinator"&&t.push({type:"Combinator",loc:null,name:" "});}function jh(){switch(this.tokenType){case 19:return this.AttributeSelector();case 4:return this.IdSelector();case 16:return this.lookupType(1)===16?this.PseudoElementSelector():this.PseudoClassSelector();case 1:return this.TypeSelector();case 10:case 11:return this.Percentage();case 12:this.charCodeAt(this.tokenStart)===Ma&&this.error("Identifier is expected",this.tokenStart+1);break;case 9:{switch(this.charCodeAt(this.tokenStart)){case Mh:case Fh:case _h:case Rh:return this.Combinator();case Ma:return this.ClassSelector();case zh:case Bh:return this.TypeSelector();case Oh:return this.IdSelector();case Nh:return this.NestingSelector()}break}}}var Ra={onWhiteSpace:Uh,getNode:jh};function Fa(){return this.createSingleNodeList(this.Raw(this.tokenIndex,null,!1))}function Ba(){let e=this.createList();if(this.skipSC(),e.push(this.Identifier()),this.skipSC(),this.tokenType===18){e.push(this.Operator());let t=this.tokenIndex,r=this.parseCustomProperty?this.Value(null):this.Raw(this.tokenIndex,this.consumeUntilExclamationMarkOrSemicolon,!1);if(r.type==="Value"&&r.children.isEmpty){for(let n=t-this.tokenIndex;n<=0;n++)if(this.lookupType(n)===13){r.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}}e.push(r);}return e}function _a(e){return e!==null&&e.type==="Operator"&&(e.value[e.value.length-1]==="-"||e.value[e.value.length-1]==="+")}var Ua={getNode:bt,onWhiteSpace(e,t){_a(e)&&(e.value=" "+e.value),_a(t.last)&&(t.last.value+=" ");},expression:Fa,var:Ba};var ja={parse:{prelude:null,block(){return this.Block(!0)}}};var qa={parse:{prelude(){let e=this.createList();switch(this.skipSC(),this.tokenType){case 5:e.push(this.String());break;case 7:case 2:e.push(this.Url());break;default:this.error("String or url() is expected");}return (this.lookupNonWSType(0)===1||this.lookupNonWSType(0)===21)&&e.push(this.MediaQueryList()),e},block:null}};var Wa={parse:{prelude(){return this.createSingleNodeList(this.MediaQueryList())},block(e=!1){return this.Block(e)}}};var Ha={parse:{prelude(){return this.createSingleNodeList(this.SelectorList())},block(){return this.Block(!0)}}};var Ya={parse:{prelude(){return this.createSingleNodeList(this.SelectorList())},block(){return this.Block(!0)}}};function qh(){return this.createSingleNodeList(this.Raw(this.tokenIndex,null,!1))}function Wh(){return this.skipSC(),this.tokenType===1&&this.lookupNonWSType(1)===16?this.createSingleNodeList(this.Declaration()):Ga.call(this)}function Ga(){let e=this.createList(),t;this.skipSC();e:for(;!this.eof;){switch(this.tokenType){case 25:case 13:this.next();continue;case 2:t=this.Function(qh,this.scope.AtrulePrelude);break;case 1:t=this.Identifier();break;case 21:t=this.Parentheses(Wh,this.scope.AtrulePrelude);break;default:break e}e.push(t);}return e}var Va={parse:{prelude(){let e=Ga.call(this);return this.getFirstListNode(e)===null&&this.error("Condition is expected"),e},block(e=!1){return this.Block(e)}}};var Ka={"font-face":ja,import:qa,media:Wa,nest:Ha,page:Ya,supports:Va};var De={parse(){return this.createSingleNodeList(this.SelectorList())}},Fo={parse(){return this.createSingleNodeList(this.Selector())}},Qa={parse(){return this.createSingleNodeList(this.Identifier())}},er={parse(){return this.createSingleNodeList(this.Nth())}},Xa={dir:Qa,has:De,lang:Qa,matches:De,is:De,"-moz-any":De,"-webkit-any":De,where:De,not:De,"nth-child":er,"nth-last-child":er,"nth-last-of-type":er,"nth-of-type":er,slotted:Fo,host:Fo,"host-context":Fo};var Bo={};b(Bo,{AnPlusB:()=>Qr,Atrule:()=>$r,AtrulePrelude:()=>Jr,AttributeSelector:()=>rn,Block:()=>on,Brackets:()=>sn,CDC:()=>cn,CDO:()=>pn,ClassSelector:()=>mn,Combinator:()=>dn,Comment:()=>bn,Declaration:()=>yn,DeclarationList:()=>vn,Dimension:()=>Cn,Function:()=>Tn,Hash:()=>Ln,IdSelector:()=>On,Identifier:()=>In,MediaFeature:()=>zn,MediaQuery:()=>Rn,MediaQueryList:()=>Bn,NestingSelector:()=>Un,Nth:()=>qn,Number:()=>Hn,Operator:()=>Gn,Parentheses:()=>Kn,Percentage:()=>Xn,PseudoClassSelector:()=>Zn,PseudoElementSelector:()=>eo,Ratio:()=>ro,Raw:()=>oo,Rule:()=>ao,Selector:()=>lo,SelectorList:()=>uo,String:()=>go,StyleSheet:()=>xo,TypeSelector:()=>wo,UnicodeRange:()=>Co,Url:()=>Io,Value:()=>Oo,WhiteSpace:()=>zo});var $a={parseContext:{default:"StyleSheet",stylesheet:"StyleSheet",atrule:"Atrule",atrulePrelude(e){return this.AtrulePrelude(e.atrule?String(e.atrule):null)},mediaQueryList:"MediaQueryList",mediaQuery:"MediaQuery",rule:"Rule",selectorList:"SelectorList",selector:"Selector",block(){return this.Block(!0)},declarationList:"DeclarationList",declaration:"Declaration",value:"Value"},scope:Ro,atrule:Ka,pseudo:Xa,node:Bo};var Za={node:gt};var Ja=Vr({...Oa,...$a,...Za});var lb="2.3.1";function _o(e){let t={};for(let r in e){let n=e[r];n&&(Array.isArray(n)||n instanceof D?n=n.map(_o):n.constructor===Object&&(n=_o(n))),t[r]=n;}return t}var ts={};b(ts,{decode:()=>Hh,encode:()=>Yh});var es=92;function Hh(e){let t=e.length-1,r="";for(let n=0;n<e.length;n++){let o=e.charCodeAt(n);if(o===es){if(n===t)break;if(o=e.charCodeAt(++n),$(es,o)){let i=n-1,s=se(e,i);n=s-1,r+=Re(e.substring(i+1,s));}else o===13&&e.charCodeAt(n+1)===10&&n++;}else r+=e[n];}return r}function Yh(e){let t="";if(e.length===1&&e.charCodeAt(0)===45)return "\\-";for(let r=0;r<e.length;r++){let n=e.charCodeAt(r);if(n===0){t+="\uFFFD";continue}if(n<=31||n===127||n>=48&&n<=57&&(r===0||r===1&&e.charCodeAt(0)===45)){t+="\\"+n.toString(16)+" ";continue}Ne(n)?t+=e.charAt(r):t+="\\"+e.charAt(r);}return t}var{tokenize:fb,parse:db,generate:gb,lexer:bb,createLexer:xb,walk:yb,find:kb,findLast:wb,findAll:vb,toPlainObject:Sb,fromPlainObject:Cb,fork:Ab}=Ja;

	var cssTree$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		Lexer: Ke,
		List: D,
		TokenStream: rt,
		clone: _o,
		createLexer: xb,
		createSyntax: Vr,
		definitionSyntax: $i,
		find: kb,
		findAll: vb,
		findLast: wb,
		fork: Ab,
		fromPlainObject: Cb,
		generate: gb,
		ident: ts,
		isCustomProperty: Mt,
		keyword: zt,
		lexer: bb,
		parse: db,
		property: kr,
		string: fo,
		toPlainObject: Sb,
		tokenNames: Fe,
		tokenTypes: $e,
		tokenize: fb,
		url: Po,
		vendorPrefix: Ym,
		version: lb,
		walk: yb
	});

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */
	const REGEXP_SIMPLE_QUOTES_STRING$2 = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING$2 = /^"(.*?)"$/;

	const globalKeywords = [
		"inherit",
		"initial",
		"unset"
	];

	const systemFontKeywords = [
		"caption",
		"icon",
		"menu",
		"message-box",
		"small-caption",
		"status-bar"
	];

	const fontWeightKeywords = [
		"normal",
		"bold",
		"bolder",
		"lighter",
		"100",
		"200",
		"300",
		"400",
		"500",
		"600",
		"700",
		"800",
		"900"
	];

	const fontStyleKeywords = [
		"normal",
		"italic",
		"oblique"
	];

	const fontStretchKeywords = [
		"normal",
		"condensed",
		"semi-condensed",
		"extra-condensed",
		"ultra-condensed",
		"expanded",
		"semi-expanded",
		"extra-expanded",
		"ultra-expanded"
	];

	const errorPrefix = "[parse-css-font] ";

	function parse(value) {
		const stringValue = gb(value);
		if (systemFontKeywords.indexOf(stringValue) !== -1) {
			return { system: stringValue };
		}
		const tokens = value.children;

		const font = {
			lineHeight: "normal",
			stretch: "normal",
			style: "normal",
			variant: "normal",
			weight: "normal",
		};

		let isLocked = false;
		for (let tokenNode = tokens.head; tokenNode; tokenNode = tokenNode.next) {
			const token = gb(tokenNode.data);
			if (token === "normal" || globalKeywords.indexOf(token) !== -1) {
				["style", "variant", "weight", "stretch"].forEach((prop) => {
					font[prop] = token;
				});
				isLocked = true;
				continue;
			}

			if (fontWeightKeywords.indexOf(token) !== -1) {
				if (isLocked) {
					continue;
				}
				font.weight = token;
				continue;
			}

			if (fontStyleKeywords.indexOf(token) !== -1) {
				if (isLocked) {
					continue;
				}
				font.style = token;
				continue;
			}

			if (fontStretchKeywords.indexOf(token) !== -1) {
				if (isLocked) {
					continue;
				}
				font.stretch = token;
				continue;
			}

			if (tokenNode.data.type == "Dimension") {
				font.size = gb(tokenNode.data);
				tokenNode = tokenNode.next;
				if (tokenNode && tokenNode.data.type == "Operator" && tokenNode.data.value == "/" && tokenNode.next) {
					tokenNode = tokenNode.next;
					font.lineHeight = gb(tokenNode.data);
					tokenNode = tokenNode.next;
				} else if (tokens.head.data.type == "Operator" && tokens.head.data.value == "/" && tokens.head.next) {
					font.lineHeight = gb(tokens.head.next.data);
					tokenNode = tokens.head.next.next;
				}
				if (!tokenNode) {
					throw error("Missing required font-family.");
				}
				font.family = [];
				let familyName = "";
				while (tokenNode) {
					while (tokenNode && tokenNode.data.type == "Operator" && tokenNode.data.value == ",") {
						tokenNode = tokenNode.next;
					}
					if (tokenNode) {
						if (tokenNode.data.type == "Identifier") {
							while (tokenNode && tokenNode.data.type == "Identifier") {
								familyName += " " + gb(tokenNode.data);
								tokenNode = tokenNode.next;
							}
						} else {
							familyName = removeQuotes(gb(tokenNode.data));
							tokenNode = tokenNode.next;
						}
					}
					familyName = familyName.trim();
					if (familyName) {
						font.family.push(familyName);
						familyName = "";
					}
				}
				return font;
			}

			if (font.variant !== "normal") {
				throw error("Unknown or unsupported font token: " + font.variant);
			}

			if (isLocked) {
				continue;
			}
			font.variant = token;
		}

		throw error("Missing required font-size.");
	}

	function error(message) {
		return new Error(errorPrefix + message);
	}

	function removeQuotes(string) {
		if (string.match(REGEXP_SIMPLE_QUOTES_STRING$2)) {
			string = string.replace(REGEXP_SIMPLE_QUOTES_STRING$2, "$1");
		} else {
			string = string.replace(REGEXP_DOUBLE_QUOTES_STRING$2, "$1");
		}
		return string.trim();
	}

	var cssFontPropertyParser = /*#__PURE__*/Object.freeze({
		__proto__: null,
		parse: parse
	});

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// derived from https://github.com/dryoma/postcss-media-query-parser

	/*
	 * The MIT License (MIT)
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	*/

	/**
	 * Parses a media feature expression, e.g. `max-width: 10px`, `(color)`
	 *
	 * @param {string} string - the source expression string, can be inside parens
	 * @param {Number} index - the index of `string` in the overall input
	 *
	 * @return {Array} an array of Nodes, the first element being a media feature,
	 *    the second - its value (may be missing)
	 */

	function parseMediaFeature(string, index = 0) {
		const modesEntered = [{
			mode: "normal",
			character: null,
		}];
		const result = [];
		let lastModeIndex = 0, mediaFeature = "", colon = null, mediaFeatureValue = null, indexLocal = index;

		let stringNormalized = string;
		// Strip trailing parens (if any), and correct the starting index
		if (string[0] === "(" && string[string.length - 1] === ")") {
			stringNormalized = string.substring(1, string.length - 1);
			indexLocal++;
		}

		for (let i = 0; i < stringNormalized.length; i++) {
			const character = stringNormalized[i];

			// If entering/exiting a string
			if (character === "'" || character === "\"") {
				if (modesEntered[lastModeIndex].isCalculationEnabled === true) {
					modesEntered.push({
						mode: "string",
						isCalculationEnabled: false,
						character,
					});
					lastModeIndex++;
				} else if (modesEntered[lastModeIndex].mode === "string" &&
					modesEntered[lastModeIndex].character === character &&
					stringNormalized[i - 1] !== "\\"
				) {
					modesEntered.pop();
					lastModeIndex--;
				}
			}

			// If entering/exiting interpolation
			if (character === "{") {
				modesEntered.push({
					mode: "interpolation",
					isCalculationEnabled: true,
				});
				lastModeIndex++;
			} else if (character === "}") {
				modesEntered.pop();
				lastModeIndex--;
			}

			// If a : is met outside of a string, function call or interpolation, than
			// this : separates a media feature and a value
			if (modesEntered[lastModeIndex].mode === "normal" && character === ":") {
				const mediaFeatureValueStr = stringNormalized.substring(i + 1);
				mediaFeatureValue = {
					type: "value",
					before: /^(\s*)/.exec(mediaFeatureValueStr)[1],
					after: /(\s*)$/.exec(mediaFeatureValueStr)[1],
					value: mediaFeatureValueStr.trim(),
				};
				// +1 for the colon
				mediaFeatureValue.sourceIndex =
					mediaFeatureValue.before.length + i + 1 + indexLocal;
				colon = {
					type: "colon",
					sourceIndex: i + indexLocal,
					after: mediaFeatureValue.before,
					value: ":", // for consistency only
				};
				break;
			}

			mediaFeature += character;
		}

		// Forming a media feature node
		mediaFeature = {
			type: "media-feature",
			before: /^(\s*)/.exec(mediaFeature)[1],
			after: /(\s*)$/.exec(mediaFeature)[1],
			value: mediaFeature.trim(),
		};
		mediaFeature.sourceIndex = mediaFeature.before.length + indexLocal;
		result.push(mediaFeature);

		if (colon !== null) {
			colon.before = mediaFeature.after;
			result.push(colon);
		}

		if (mediaFeatureValue !== null) {
			result.push(mediaFeatureValue);
		}

		return result;
	}

	/**
	 * Parses a media query, e.g. `screen and (color)`, `only tv`
	 *
	 * @param {string} string - the source media query string
	 * @param {Number} index - the index of `string` in the overall input
	 *
	 * @return {Array} an array of Nodes and Containers
	 */

	function parseMediaQuery(string, index = 0) {
		const result = [];

		// How many times the parser entered parens/curly braces
		let localLevel = 0;
		// Has any keyword, media type, media feature expression or interpolation
		// ('element' hereafter) started
		let insideSomeValue = false, node;

		function resetNode() {
			return {
				before: "",
				after: "",
				value: "",
			};
		}

		node = resetNode();

		for (let i = 0; i < string.length; i++) {
			const character = string[i];
			// If not yet entered any element
			if (!insideSomeValue) {
				if (character.search(/\s/) !== -1) {
					// A whitespace
					// Don't form 'after' yet; will do it later
					node.before += character;
				} else {
					// Not a whitespace - entering an element
					// Expression start
					if (character === "(") {
						node.type = "media-feature-expression";
						localLevel++;
					}
					node.value = character;
					node.sourceIndex = index + i;
					insideSomeValue = true;
				}
			} else {
				// Already in the middle of some element
				node.value += character;

				// Here parens just increase localLevel and don't trigger a start of
				// a media feature expression (since they can't be nested)
				// Interpolation start
				if (character === "{" || character === "(") { localLevel++; }
				// Interpolation/function call/media feature expression end
				if (character === ")" || character === "}") { localLevel--; }
			}

			// If exited all parens/curlies and the next symbol
			if (insideSomeValue && localLevel === 0 &&
				(character === ")" || i === string.length - 1 ||
					string[i + 1].search(/\s/) !== -1)
			) {
				if (["not", "only", "and"].indexOf(node.value) !== -1) {
					node.type = "keyword";
				}
				// if it's an expression, parse its contents
				if (node.type === "media-feature-expression") {
					node.nodes = parseMediaFeature(node.value, node.sourceIndex);
				}
				result.push(Array.isArray(node.nodes) ?
					new Container(node) : new Node$1(node));
				node = resetNode();
				insideSomeValue = false;
			}
		}

		// Now process the result array - to specify undefined types of the nodes
		// and specify the `after` prop
		for (let i = 0; i < result.length; i++) {
			node = result[i];
			if (i > 0) { result[i - 1].after = node.before; }

			// Node types. Might not be set because contains interpolation/function
			// calls or fully consists of them
			if (node.type === undefined) {
				if (i > 0) {
					// only `and` can follow an expression
					if (result[i - 1].type === "media-feature-expression") {
						node.type = "keyword";
						continue;
					}
					// Anything after 'only|not' is a media type
					if (result[i - 1].value === "not" || result[i - 1].value === "only") {
						node.type = "media-type";
						continue;
					}
					// Anything after 'and' is an expression
					if (result[i - 1].value === "and") {
						node.type = "media-feature-expression";
						continue;
					}

					if (result[i - 1].type === "media-type") {
						// if it is the last element - it might be an expression
						// or 'and' depending on what is after it
						if (!result[i + 1]) {
							node.type = "media-feature-expression";
						} else {
							node.type = result[i + 1].type === "media-feature-expression" ?
								"keyword" : "media-feature-expression";
						}
					}
				}

				if (i === 0) {
					// `screen`, `fn( ... )`, `#{ ... }`. Not an expression, since then
					// its type would have been set by now
					if (!result[i + 1]) {
						node.type = "media-type";
						continue;
					}

					// `screen and` or `#{...} (max-width: 10px)`
					if (result[i + 1] &&
						(result[i + 1].type === "media-feature-expression" ||
							result[i + 1].type === "keyword")
					) {
						node.type = "media-type";
						continue;
					}
					if (result[i + 2]) {
						// `screen and (color) ...`
						if (result[i + 2].type === "media-feature-expression") {
							node.type = "media-type";
							result[i + 1].type = "keyword";
							continue;
						}
						// `only screen and ...`
						if (result[i + 2].type === "keyword") {
							node.type = "keyword";
							result[i + 1].type = "media-type";
							continue;
						}
					}
					if (result[i + 3]) {
						// `screen and (color) ...`
						if (result[i + 3].type === "media-feature-expression") {
							node.type = "keyword";
							result[i + 1].type = "media-type";
							result[i + 2].type = "keyword";
							continue;
						}
					}
				}
			}
		}
		return result;
	}

	/**
	 * Parses a media query list. Takes a possible `url()` at the start into
	 * account, and divides the list into media queries that are parsed separately
	 *
	 * @param {string} string - the source media query list string
	 *
	 * @return {Array} an array of Nodes/Containers
	 */

	function parseMediaList(string) {
		const result = [];
		let interimIndex = 0, levelLocal = 0;

		// Check for a `url(...)` part (if it is contents of an @import rule)
		const doesHaveUrl = /^(\s*)url\s*\(/.exec(string);
		if (doesHaveUrl !== null) {
			let i = doesHaveUrl[0].length;
			let parenthesesLv = 1;
			while (parenthesesLv > 0) {
				const character = string[i];
				if (character === "(") { parenthesesLv++; }
				if (character === ")") { parenthesesLv--; }
				i++;
			}
			result.unshift(new Node$1({
				type: "url",
				value: string.substring(0, i).trim(),
				sourceIndex: doesHaveUrl[1].length,
				before: doesHaveUrl[1],
				after: /^(\s*)/.exec(string.substring(i))[1],
			}));
			interimIndex = i;
		}

		// Start processing the media query list
		for (let i = interimIndex; i < string.length; i++) {
			const character = string[i];

			// Dividing the media query list into comma-separated media queries
			// Only count commas that are outside of any parens
			// (i.e., not part of function call params list, etc.)
			if (character === "(") { levelLocal++; }
			if (character === ")") { levelLocal--; }
			if (levelLocal === 0 && character === ",") {
				const mediaQueryString = string.substring(interimIndex, i);
				const spaceBefore = /^(\s*)/.exec(mediaQueryString)[1];
				result.push(new Container({
					type: "media-query",
					value: mediaQueryString.trim(),
					sourceIndex: interimIndex + spaceBefore.length,
					nodes: parseMediaQuery(mediaQueryString, interimIndex),
					before: spaceBefore,
					after: /(\s*)$/.exec(mediaQueryString)[1],
				}));
				interimIndex = i + 1;
			}
		}

		const mediaQueryString = string.substring(interimIndex);
		const spaceBefore = /^(\s*)/.exec(mediaQueryString)[1];
		result.push(new Container({
			type: "media-query",
			value: mediaQueryString.trim(),
			sourceIndex: interimIndex + spaceBefore.length,
			nodes: parseMediaQuery(mediaQueryString, interimIndex),
			before: spaceBefore,
			after: /(\s*)$/.exec(mediaQueryString)[1],
		}));

		return result;
	}

	function Container(opts) {
		this.constructor(opts);

		this.nodes = opts.nodes;

		if (this.after === undefined) {
			this.after = this.nodes.length > 0 ?
				this.nodes[this.nodes.length - 1].after : "";
		}

		if (this.before === undefined) {
			this.before = this.nodes.length > 0 ?
				this.nodes[0].before : "";
		}

		if (this.sourceIndex === undefined) {
			this.sourceIndex = this.before.length;
		}

		this.nodes.forEach(node => {
			node.parent = this; // eslint-disable-line no-param-reassign
		});
	}

	Container.prototype = Object.create(Node$1.prototype);
	Container.constructor = Node$1;

	/**
	 * Iterate over descendant nodes of the node
	 *
	 * @param {RegExp|string} filter - Optional. Only nodes with node.type that
	 *    satisfies the filter will be traversed over
	 * @param {function} cb - callback to call on each node. Takes these params:
	 *    node - the node being processed, i - it's index, nodes - the array
	 *    of all nodes
	 *    If false is returned, the iteration breaks
	 *
	 * @return (boolean) false, if the iteration was broken
	 */
	Container.prototype.walk = function walk(filter, cb) {
		const hasFilter = typeof filter === "string" || filter instanceof RegExp;
		const callback = hasFilter ? cb : filter;
		const filterReg = typeof filter === "string" ? new RegExp(filter) : filter;

		for (let i = 0; i < this.nodes.length; i++) {
			const node = this.nodes[i];
			const filtered = hasFilter ? filterReg.test(node.type) : true;
			if (filtered && callback && callback(node, i, this.nodes) === false) {
				return false;
			}
			if (node.nodes && node.walk(filter, cb) === false) { return false; }
		}
		return true;
	};

	/**
	 * Iterate over immediate children of the node
	 *
	 * @param {function} cb - callback to call on each node. Takes these params:
	 *    node - the node being processed, i - it's index, nodes - the array
	 *    of all nodes
	 *    If false is returned, the iteration breaks
	 *
	 * @return (boolean) false, if the iteration was broken
	 */
	Container.prototype.each = function each(cb = () => { }) {
		for (let i = 0; i < this.nodes.length; i++) {
			const node = this.nodes[i];
			if (cb(node, i, this.nodes) === false) { return false; }
		}
		return true;
	};

	/**
	 * A very generic node. Pretty much any element of a media query
	 */

	function Node$1(opts) {
		this.after = opts.after;
		this.before = opts.before;
		this.type = opts.type;
		this.value = opts.value;
		this.sourceIndex = opts.sourceIndex;
	}

	var cssMediaQueryParser = /*#__PURE__*/Object.freeze({
		__proto__: null,
		parseMediaList: parseMediaList
	});

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// derived from https://github.com/fmarcia/UglifyCSS

	/**
	 * UglifyCSS
	 * Port of YUI CSS Compressor to NodeJS
	 * Author: Franck Marcia - https://github.com/fmarcia
	 * MIT licenced
	 */

	/**
	 * cssmin.js
	 * Author: Stoyan Stefanov - http://phpied.com/
	 * This is a JavaScript port of the CSS minification tool
	 * distributed with YUICompressor, itself a port
	 * of the cssmin utility by Isaac Schlueter - http://foohack.com/
	 * Permission is hereby granted to use the JavaScript version under the same
	 * conditions as the YUICompressor (original YUICompressor note below).
	 */

	/**
	 * YUI Compressor
	 * http://developer.yahoo.com/yui/compressor/
	 * Author: Julien Lecomte - http://www.julienlecomte.net/
	 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
	 * The copyrights embodied in the content of this file are licensed
	 * by Yahoo! Inc. under the BSD (revised) open source license.
	 */

	/**
	 * @type {string} - placeholder prefix
	 */

	const ___PRESERVED_TOKEN_ = "___PRESERVED_TOKEN_";

	/**
	 * @typedef {object} options - UglifyCSS options
	 * @property {number} [maxLineLen=0] - Maximum line length of uglified CSS
	 * @property {boolean} [expandVars=false] - Expand variables
	 * @property {boolean} [uglyComments=false] - Removes newlines within preserved comments
	 * @property {boolean} [cuteComments=false] - Preserves newlines within and around preserved comments
	 * @property {boolean} [debug=false] - Prints full error stack on error
	 * @property {string} [output=''] - Output file name
	 */

	/**
	 * @type {options} - UglifyCSS options
	 */

	const defaultOptions = {
		maxLineLen: 0,
		expandVars: false,
		uglyComments: false,
		cuteComments: false,
		debug: false,
		output: ""
	};

	const REGEXP_DATA_URI = /url\(\s*(["']?)data:/g;
	const REGEXP_WHITE_SPACES = /\s+/g;
	const REGEXP_NEW_LINE = /\n/g;

	/**
	 * extractDataUrls replaces all data urls with tokens before we start
	 * compressing, to avoid performance issues running some of the subsequent
	 * regexes against large strings chunks.
	 *
	 * @param {string} css - CSS content
	 * @param {string[]} preservedTokens - Global array of tokens to preserve
	 *
	 * @return {string} Processed CSS
	 */

	function extractDataUrls(css, preservedTokens) {

		// Leave data urls alone to increase parse performance.
		const pattern = REGEXP_DATA_URI;
		const maxIndex = css.length - 1;
		const sb = [];

		let appendIndex = 0, match;

		// Since we need to account for non-base64 data urls, we need to handle
		// ' and ) being part of the data string. Hence switching to indexOf,
		// to determine whether or not we have matching string terminators and
		// handling sb appends directly, instead of using matcher.append* methods.

		while ((match = pattern.exec(css)) !== null) {

			const startIndex = match.index + 4;  // 'url('.length()
			let terminator = match[1];         // ', " or empty (not quoted)

			if (terminator.length === 0) {
				terminator = ")";
			}

			let foundTerminator = false, endIndex = pattern.lastIndex - 1;

			while (foundTerminator === false && endIndex + 1 <= maxIndex && endIndex != -1) {
				endIndex = css.indexOf(terminator, endIndex + 1);

				// endIndex == 0 doesn't really apply here
				if ((endIndex > 0) && (css.charAt(endIndex - 1) !== "\\")) {
					foundTerminator = true;
					if (")" != terminator) {
						endIndex = css.indexOf(")", endIndex);
					}
				}
			}

			// Enough searching, start moving stuff over to the buffer
			sb.push(css.substring(appendIndex, match.index));

			if (foundTerminator) {

				let token = css.substring(startIndex, endIndex);
				const parts = token.split(",");
				if (parts.length > 1 && parts[0].slice(-7) == ";base64") {
					token = token.replace(REGEXP_WHITE_SPACES, "");
				} else {
					token = token.replace(REGEXP_NEW_LINE, " ");
					token = token.replace(REGEXP_WHITE_SPACES, " ");
					token = token.replace(REGEXP_PRESERVE_HSLA1, "");
				}

				preservedTokens.push(token);

				const preserver = "url(" + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___)";
				sb.push(preserver);

				appendIndex = endIndex + 1;
			} else {
				// No end terminator found, re-add the whole match. Should we throw/warn here?
				sb.push(css.substring(match.index, pattern.lastIndex));
				appendIndex = pattern.lastIndex;
			}
		}

		sb.push(css.substring(appendIndex));

		return sb.join("");
	}

	const REGEXP_HEX_COLORS = /(=\s*?["']?)?#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])(\}|[^0-9a-f{][^{]*?\})/gi;

	/**
	 * compressHexColors compresses hex color values of the form #AABBCC to #ABC.
	 *
	 * DOES NOT compress CSS ID selectors which match the above pattern (which would
	 * break things), like #AddressForm { ... }
	 *
	 * DOES NOT compress IE filters, which have hex color values (which would break
	 * things), like chroma(color='#FFFFFF');
	 *
	 * DOES NOT compress invalid hex values, like background-color: #aabbccdd
	 *
	 * @param {string} css - CSS content
	 *
	 * @return {string} Processed CSS
	 */

	function compressHexColors(css) {

		// Look for hex colors inside { ... } (to avoid IDs) and which don't have a =, or a " in front of them (to avoid filters)

		const pattern = REGEXP_HEX_COLORS;
		const sb = [];

		let index = 0, match;

		while ((match = pattern.exec(css)) !== null) {

			sb.push(css.substring(index, match.index));

			const isFilter = match[1];

			if (isFilter) {
				// Restore, maintain case, otherwise filter will break
				sb.push(match[1] + "#" + (match[2] + match[3] + match[4] + match[5] + match[6] + match[7]));
			} else {
				if (match[2].toLowerCase() == match[3].toLowerCase() &&
					match[4].toLowerCase() == match[5].toLowerCase() &&
					match[6].toLowerCase() == match[7].toLowerCase()) {

					// Compress.
					sb.push("#" + (match[3] + match[5] + match[7]).toLowerCase());
				} else {
					// Non compressible color, restore but lower case.
					sb.push("#" + (match[2] + match[3] + match[4] + match[5] + match[6] + match[7]).toLowerCase());
				}
			}

			index = pattern.lastIndex = pattern.lastIndex - match[8].length;
		}

		sb.push(css.substring(index));

		return sb.join("");
	}

	const REGEXP_KEYFRAMES = /@[a-z0-9-_]*keyframes\s+[a-z0-9-_]+\s*{/gi;
	const REGEXP_WHITE_SPACE = /(^\s|\s$)/g;

	/** keyframes preserves 0 followed by unit in keyframes steps
	 *
	 * @param {string} content - CSS content
	 * @param {string[]} preservedTokens - Global array of tokens to preserve
	 *
	 * @return {string} Processed CSS
	 */

	function keyframes(content, preservedTokens) {

		const pattern = REGEXP_KEYFRAMES;

		let index = 0, buffer;

		const preserve = (part, i) => {
			part = part.replace(REGEXP_WHITE_SPACE, "");
			if (part.charAt(0) === "0") {
				preservedTokens.push(part);
				buffer[i] = ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___";
			}
		};

		while (true) { // eslint-disable-line no-constant-condition

			let level = 0;
			buffer = "";

			let startIndex = content.slice(index).search(pattern);
			if (startIndex < 0) {
				break;
			}

			index += startIndex;
			startIndex = index;

			const len = content.length;
			const buffers = [];

			for (; index < len; ++index) {

				const ch = content.charAt(index);

				if (ch === "{") {

					if (level === 0) {
						buffers.push(buffer.replace(REGEXP_WHITE_SPACE, ""));

					} else if (level === 1) {

						buffer = buffer.split(",");

						buffer.forEach(preserve);

						buffers.push(buffer.join(",").replace(REGEXP_WHITE_SPACE, ""));
					}

					buffer = "";
					level += 1;

				} else if (ch === "}") {

					if (level === 2) {
						buffers.push("{" + buffer.replace(REGEXP_WHITE_SPACE, "") + "}");
						buffer = "";

					} else if (level === 1) {
						content = content.slice(0, startIndex) +
							buffers.shift() + "{" +
							buffers.join("") +
							content.slice(index);
						break;
					}

					level -= 1;
				}

				if (level < 0) {
					break;

				} else if (ch !== "{" && ch !== "}") {
					buffer += ch;
				}
			}
		}

		return content;
	}

	/**
	 * collectComments collects all comment blocks and return new content with comment placeholders
	 *
	 * @param {string} content - CSS content
	 * @param {string[]} comments - Global array of extracted comments
	 *
	 * @return {string} Processed CSS
	 */

	function collectComments(content, comments) {

		const table = [];

		let from = 0, end;

		while (true) { // eslint-disable-line no-constant-condition

			const start = content.indexOf("/*", from);

			if (start > -1) {

				end = content.indexOf("*/", start + 2);

				if (end > -1) {
					comments.push(content.slice(start + 2, end));
					table.push(content.slice(from, start));
					table.push("/*___PRESERVE_CANDIDATE_COMMENT_" + (comments.length - 1) + "___*/");
					from = end + 2;

				} else {
					// unterminated comment
					end = -2;
					break;
				}

			} else {
				break;
			}
		}

		table.push(content.slice(end + 2));

		return table.join("");
	}

	/**
	 * processString uglifies a CSS string
	 *
	 * @param {string} content - CSS string
	 * @param {options} options - UglifyCSS options
	 *
	 * @return {string} Uglified result
	 */

	// const REGEXP_EMPTY_RULES = /[^};{/]+\{\}/g;
	const REGEXP_PRESERVE_STRING1 = /"([^\\"])*"/g;
	const REGEXP_PRESERVE_STRING1_BIS = /"(\\.)*"/g;
	const REGEXP_PRESERVE_STRING1_TER = /"(\\)*"/g;
	const REGEXP_PRESERVE_STRING2 = /'([^\\']|\\.|\\)*'/g;
	const REGEXP_MINIFY_ALPHA = /progid:DXImageTransform.Microsoft.Alpha\(Opacity=/gi;
	const REGEXP_PRESERVE_TOKEN1 = /\r\n/g;
	const REGEXP_PRESERVE_TOKEN2 = /[\r\n]/g;
	const REGEXP_VARIABLES = /@variables\s*\{\s*([^}]+)\s*\}/g;
	const REGEXP_VARIABLE = /\s*([a-z0-9-]+)\s*:\s*([^;}]+)\s*/gi;
	const REGEXP_VARIABLE_VALUE = /var\s*\(\s*([^)]+)\s*\)/g;
	const REGEXP_PRESERVE_CALC = /calc\(([^;}]*)\)/g;
	const REGEXP_TRIM = /(^\s*|\s*$)/g;
	const REGEXP_PRESERVE_CALC2 = /\( /g;
	const REGEXP_PRESERVE_CALC3 = / \)/g;
	const REGEXP_PRESERVE_MATRIX = /\s*filter:\s*progid:DXImageTransform.Microsoft.Matrix\(([^)]+)\);/g;
	const REGEXP_REMOVE_SPACES = /(^|\})(([^{:])+:)+([^{]*{)/g;
	const REGEXP_REMOVE_SPACES2 = /\s+([!{;:>+()\],])/g;
	const REGEXP_REMOVE_SPACES2_BIS = /([^\\])\s+([}])/g;
	const REGEXP_RESTORE_SPACE_IMPORTANT = /!important/g;
	const REGEXP_PSEUDOCLASSCOLON = /___PSEUDOCLASSCOLON___/g;
	const REGEXP_COLUMN = /:/g;
	const REGEXP_PRESERVE_ZERO_UNIT = /\s*(animation|animation-delay|animation-duration|transition|transition-delay|transition-duration):\s*([^;}]+)/gi;
	const REGEXP_PRESERVE_ZERO_UNIT1 = /(^|\D)0?\.?0(m?s)/gi;
	const REGEXP_PRESERVE_FLEX = /\s*(flex|flex-basis):\s*([^;}]+)/gi;
	const REGEXP_SPACES = /\s+/;
	const REGEXP_PRESERVE_HSLA = /(hsla?)\(([^)]+)\)/g;
	const REGEXP_PRESERVE_HSLA1 = /(^\s+|\s+$)/g;
	const REGEXP_RETAIN_SPACE_IE6 = /:first-(line|letter)(\{|,)/gi;
	const REGEXP_CHARSET = /^(.*)(@charset)( "[^"]*";)/gi;
	const REGEXP_REMOVE_SECOND_CHARSET = /^((\s*)(@charset)( [^;]+;\s*))+/gi;
	const REGEXP_LOWERCASE_DIRECTIVES = /@(font-face|import|(?:-(?:atsc|khtml|moz|ms|o|wap|webkit)-)?keyframe|media|page|namespace)/gi;
	const REGEXP_LOWERCASE_PSEUDO_ELEMENTS = /:(active|after|before|checked|disabled|empty|enabled|first-(?:child|of-type)|focus|hover|last-(?:child|of-type)|link|only-(?:child|of-type)|root|:selection|target|visited)/gi;
	const REGEXP_CHARSET2 = /^(.*)(@charset "[^"]*";)/g;
	const REGEXP_CHARSET3 = /^(\s*@charset [^;]+;\s*)+/g;
	const REGEXP_LOWERCASE_FUNCTIONS = /:(lang|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|(?:-(?:atsc|khtml|moz|ms|o|wap|webkit)-)?any)\(/gi;
	const REGEXP_LOWERCASE_FUNCTIONS2 = /([:,( ]\s*)(attr|color-stop|from|rgba|to|url|(?:-(?:atsc|khtml|moz|ms|o|wap|webkit)-)?(?:calc|max|min|(?:repeating-)?(?:linear|radial)-gradient)|-webkit-gradient)/gi;
	const REGEXP_NEWLINE1 = /\s*\/\*/g;
	const REGEXP_NEWLINE2 = /\*\/\s*/g;
	const REGEXP_RESTORE_SPACE1 = /\band\(/gi;
	const REGEXP_RESTORE_SPACE2 = /([^:])not\(/gi;
	const REGEXP_RESTORE_SPACE3 = /\bor\(/gi;
	const REGEXP_REMOVE_SPACES3 = /([!{}:;>+([,])\s+/g;
	const REGEXP_REMOVE_SEMI_COLUMNS = /;+\}/g;
	// const REGEXP_REPLACE_ZERO = /(^|[^.0-9\\])(?:0?\.)?0(?:ex|ch|r?em|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|g?rad|turn|ms|k?Hz|dpi|dpcm|dppx|%)(?![a-z0-9])/gi;
	const REGEXP_REPLACE_ZERO_DOT = /([0-9])\.0(ex|ch|r?em|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|g?rad|turn|m?s|k?Hz|dpi|dpcm|dppx|%| |;)/gi;
	const REGEXP_REPLACE_4_ZEROS = /:0 0 0 0(;|\})/g;
	const REGEXP_REPLACE_3_ZEROS = /:0 0 0(;|\})/g;
	// const REGEXP_REPLACE_2_ZEROS = /:0 0(;|\})/g;
	const REGEXP_REPLACE_1_ZERO = /(transform-origin|webkit-transform-origin|moz-transform-origin|o-transform-origin|ms-transform-origin|box-shadow):0(;|\})/gi;
	const REGEXP_REPLACE_ZERO_DOT_DECIMAL = /(:|\s)0+\.(\d+)/g;
	const REGEXP_REPLACE_RGB = /rgb\s*\(\s*([0-9,\s]+)\s*\)/gi;
	const REGEXP_REPLACE_BORDER_ZERO = /(border|border-top|border-right|border-bottom|border-left|outline|background):none(;|\})/gi;
	const REGEXP_REPLACE_IE_OPACITY = /progid:DXImageTransform\.Microsoft\.Alpha\(Opacity=/gi;
	const REGEXP_REPLACE_QUERY_FRACTION = /\(([-A-Za-z]+):([0-9]+)\/([0-9]+)\)/g;
	const REGEXP_QUERY_FRACTION = /___QUERY_FRACTION___/g;
	const REGEXP_REPLACE_SEMI_COLUMNS = /;;+/g;
	const REGEXP_REPLACE_HASH_COLOR = /(:|\s)(#f00)(;|})/g;
	const REGEXP_PRESERVED_NEWLINE = /___PRESERVED_NEWLINE___/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT1 = /(:|\s)(#000080)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT2 = /(:|\s)(#808080)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT3 = /(:|\s)(#808000)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT4 = /(:|\s)(#800080)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT5 = /(:|\s)(#c0c0c0)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT6 = /(:|\s)(#008080)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT7 = /(:|\s)(#ffa500)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT8 = /(:|\s)(#800000)(;|})/g;

	function processString(content = "", options = defaultOptions) {

		const comments = [];
		const preservedTokens = [];

		let pattern;

		const originalContent = content;
		content = extractDataUrls(content, preservedTokens);
		content = collectComments(content, comments);

		// preserve strings so their content doesn't get accidentally minified
		preserveString(REGEXP_PRESERVE_STRING1);
		preserveString(REGEXP_PRESERVE_STRING1_BIS);
		preserveString(REGEXP_PRESERVE_STRING1_TER);
		preserveString(REGEXP_PRESERVE_STRING2);

		function preserveString(pattern) {
			content = content.replace(pattern, token => {
				const quote = token.substring(0, 1);
				token = token.slice(1, -1);
				// maybe the string contains a comment-like substring or more? put'em back then
				if (token.indexOf("___PRESERVE_CANDIDATE_COMMENT_") >= 0) {
					for (let i = 0, len = comments.length; i < len; i += 1) {
						token = token.replace("___PRESERVE_CANDIDATE_COMMENT_" + i + "___", comments[i]);
					}
				}
				// minify alpha opacity in filter strings
				token = token.replace(REGEXP_MINIFY_ALPHA, "alpha(opacity=");
				preservedTokens.push(token);
				return quote + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___" + quote;
			});
		}

		// strings are safe, now wrestle the comments
		for (let i = 0, len = comments.length; i < len; i += 1) {

			const token = comments[i];
			const placeholder = "___PRESERVE_CANDIDATE_COMMENT_" + i + "___";

			// ! in the first position of the comment means preserve
			// so push to the preserved tokens keeping the !
			if (token.charAt(0) === "!") {
				if (options.cuteComments) {
					preservedTokens.push(token.substring(1).replace(REGEXP_PRESERVE_TOKEN1, "\n"));
				} else if (options.uglyComments) {
					preservedTokens.push(token.substring(1).replace(REGEXP_PRESERVE_TOKEN2, ""));
				} else {
					preservedTokens.push(token);
				}
				content = content.replace(placeholder, ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
				continue;
			}

			// \ in the last position looks like hack for Mac/IE5
			// shorten that to /*\*/ and the next one to /**/
			if (token.charAt(token.length - 1) === "\\") {
				preservedTokens.push("\\");
				content = content.replace(placeholder, ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
				i = i + 1; // attn: advancing the loop
				preservedTokens.push("");
				content = content.replace(
					"___PRESERVE_CANDIDATE_COMMENT_" + i + "___",
					___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___"
				);
				continue;
			}

			// keep empty comments after child selectors (IE7 hack)
			// e.g. html >/**/ body
			if (token.length === 0) {
				const startIndex = content.indexOf(placeholder);
				if (startIndex > 2) {
					if (content.charAt(startIndex - 3) === ">") {
						preservedTokens.push("");
						content = content.replace(placeholder, ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
					}
				}
			}

			// in all other cases kill the comment
			content = content.replace(`/*${placeholder}*/`, "");
		}

		// parse simple @variables blocks and remove them
		if (options.expandVars) {
			const vars = {};
			pattern = REGEXP_VARIABLES;
			content = content.replace(pattern, (_, f1) => {
				pattern = REGEXP_VARIABLE;
				f1.replace(pattern, (_, f1, f2) => {
					if (f1 && f2) {
						vars[f1] = f2;
					}
					return "";
				});
				return "";
			});

			// replace var(x) with the value of x
			pattern = REGEXP_VARIABLE_VALUE;
			content = content.replace(pattern, (_, f1) => {
				return vars[f1] || "none";
			});
		}

		// normalize all whitespace strings to single spaces. Easier to work with that way.
		content = content.replace(REGEXP_WHITE_SPACES, " ");

		// preserve formulas in calc() before removing spaces
		pattern = REGEXP_PRESERVE_CALC;
		content = content.replace(pattern, (_, f1) => {
			preservedTokens.push(
				"calc(" +
				f1.replace(REGEXP_TRIM, "")
					.replace(REGEXP_PRESERVE_CALC2, "(")
					.replace(REGEXP_PRESERVE_CALC3, ")") +
				")"
			);
			return ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___";
		});

		// preserve matrix
		pattern = REGEXP_PRESERVE_MATRIX;
		content = content.replace(pattern, (_, f1) => {
			preservedTokens.push(f1);
			return "filter:progid:DXImageTransform.Microsoft.Matrix(" + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___);";
		});

		// remove the spaces before the things that should not have spaces before them.
		// but, be careful not to turn 'p :link {...}' into 'p:link{...}'
		// swap out any pseudo-class colons with the token, and then swap back.
		try {
			pattern = REGEXP_REMOVE_SPACES;
			content = content.replace(pattern, token => token.replace(REGEXP_COLUMN, "___PSEUDOCLASSCOLON___"));
		} catch (_error) {
			// ignored
		}

		// remove spaces before the things that should not have spaces before them.
		content = content.replace(REGEXP_REMOVE_SPACES2, "$1");
		content = content.replace(REGEXP_REMOVE_SPACES2_BIS, "$1$2");

		// restore spaces for !important
		content = content.replace(REGEXP_RESTORE_SPACE_IMPORTANT, " !important");

		// bring back the colon
		content = content.replace(REGEXP_PSEUDOCLASSCOLON, ":");

		// preserve 0 followed by a time unit for properties using time units
		pattern = REGEXP_PRESERVE_ZERO_UNIT;
		content = content.replace(pattern, (_, f1, f2) => {

			f2 = f2.replace(REGEXP_PRESERVE_ZERO_UNIT1, (_, g1, g2) => {
				preservedTokens.push("0" + g2);
				return g1 + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___";
			});

			return f1 + ":" + f2;
		});

		// preserve unit for flex-basis within flex and flex-basis (ie10 bug)
		pattern = REGEXP_PRESERVE_FLEX;
		content = content.replace(pattern, (_, f1, f2) => {
			let f2b = f2.split(REGEXP_SPACES);
			preservedTokens.push(f2b.pop());
			f2b.push(___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
			f2b = f2b.join(" ");
			return `${f1}:${f2b}`;
		});

		// preserve 0% in hsl and hsla color definitions
		content = content.replace(REGEXP_PRESERVE_HSLA, (_, f1, f2) => {
			const f0 = [];
			f2.split(",").forEach(part => {
				part = part.replace(REGEXP_PRESERVE_HSLA1, "");
				if (part === "0%") {
					preservedTokens.push("0%");
					f0.push(___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
				} else {
					f0.push(part);
				}
			});
			return f1 + "(" + f0.join(",") + ")";
		});

		// preserve 0 followed by unit in keyframes steps (WIP)
		content = keyframes(content, preservedTokens);

		// retain space for special IE6 cases
		content = content.replace(REGEXP_RETAIN_SPACE_IE6, (_, f1, f2) => ":first-" + f1.toLowerCase() + " " + f2);

		// newlines before and after the end of a preserved comment
		if (options.cuteComments) {
			content = content.replace(REGEXP_NEWLINE1, "___PRESERVED_NEWLINE___/*");
			content = content.replace(REGEXP_NEWLINE2, "*/___PRESERVED_NEWLINE___");
			// no space after the end of a preserved comment
		} else {
			content = content.replace(REGEXP_NEWLINE2, "*/");
		}

		// If there are multiple @charset directives, push them to the top of the file.
		pattern = REGEXP_CHARSET;
		content = content.replace(pattern, (_, f1, f2, f3) => f2.toLowerCase() + f3 + f1);

		// When all @charset are at the top, remove the second and after (as they are completely ignored).
		pattern = REGEXP_REMOVE_SECOND_CHARSET;
		content = content.replace(pattern, (_, __, f2, f3, f4) => f2 + f3.toLowerCase() + f4);

		// lowercase some popular @directives (@charset is done right above)
		pattern = REGEXP_LOWERCASE_DIRECTIVES;
		content = content.replace(pattern, (_, f1) => "@" + f1.toLowerCase());

		// lowercase some more common pseudo-elements
		pattern = REGEXP_LOWERCASE_PSEUDO_ELEMENTS;
		content = content.replace(pattern, (_, f1) => ":" + f1.toLowerCase());

		// if there is a @charset, then only allow one, and push to the top of the file.
		content = content.replace(REGEXP_CHARSET2, "$2$1");
		content = content.replace(REGEXP_CHARSET3, "$1");

		// lowercase some more common functions
		pattern = REGEXP_LOWERCASE_FUNCTIONS;
		content = content.replace(pattern, (_, f1) => ":" + f1.toLowerCase() + "(");

		// lower case some common function that can be values
		// NOTE: rgb() isn't useful as we replace with #hex later, as well as and() is already done for us right after this
		pattern = REGEXP_LOWERCASE_FUNCTIONS2;
		content = content.replace(pattern, (_, f1, f2) => f1 + f2.toLowerCase());

		// put the space back in some cases, to support stuff like
		// @media screen and (-webkit-min-device-pixel-ratio:0){
		content = content.replace(REGEXP_RESTORE_SPACE1, "and (");
		content = content.replace(REGEXP_RESTORE_SPACE2, "$1not (");
		content = content.replace(REGEXP_RESTORE_SPACE3, "or (");

		// remove the spaces after the things that should not have spaces after them.
		content = content.replace(REGEXP_REMOVE_SPACES3, "$1");

		// remove unnecessary semicolons
		content = content.replace(REGEXP_REMOVE_SEMI_COLUMNS, "}");

		// replace 0(px,em,%) with 0.
		// content = content.replace(REGEXP_REPLACE_ZERO, "$10");

		// Replace x.0(px,em,%) with x(px,em,%).
		content = content.replace(REGEXP_REPLACE_ZERO_DOT, "$1$2");

		// replace 0 0 0 0; with 0.
		content = content.replace(REGEXP_REPLACE_4_ZEROS, ":0$1");
		content = content.replace(REGEXP_REPLACE_3_ZEROS, ":0$1");
		// content = content.replace(REGEXP_REPLACE_2_ZEROS, ":0$1");

		// replace background-position:0; with background-position:0 0;
		// same for transform-origin and box-shadow
		pattern = REGEXP_REPLACE_1_ZERO;
		content = content.replace(pattern, (_, f1, f2) => f1.toLowerCase() + ":0 0" + f2);

		// replace 0.6 to .6, but only when preceded by : or a white-space
		content = content.replace(REGEXP_REPLACE_ZERO_DOT_DECIMAL, "$1.$2");

		// shorten colors from rgb(51,102,153) to #336699
		// this makes it more likely that it'll get further compressed in the next step.
		pattern = REGEXP_REPLACE_RGB;
		content = content.replace(pattern, (_, f1) => {
			const rgbcolors = f1.split(",");
			let hexcolor = "#";
			for (let i = 0; i < rgbcolors.length; i += 1) {
				let val = parseInt(rgbcolors[i], 10);
				if (val < 16) {
					hexcolor += "0";
				}
				if (val > 255) {
					val = 255;
				}
				hexcolor += val.toString(16);
			}
			return hexcolor;
		});

		// Shorten colors from #AABBCC to #ABC.
		content = compressHexColors(content);

		// Replace #f00 -> red
		content = content.replace(REGEXP_REPLACE_HASH_COLOR, "$1red$3");

		// Replace other short color keywords
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT1, "$1navy$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT2, "$1gray$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT3, "$1olive$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT4, "$1purple$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT5, "$1silver$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT6, "$1teal$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT7, "$1orange$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT8, "$1maroon$3");

		// border: none -> border:0
		pattern = REGEXP_REPLACE_BORDER_ZERO;
		content = content.replace(pattern, (_, f1, f2) => f1.toLowerCase() + ":0" + f2);

		// shorter opacity IE filter
		content = content.replace(REGEXP_REPLACE_IE_OPACITY, "alpha(opacity=");

		// Find a fraction that is used for Opera's -o-device-pixel-ratio query
		// Add token to add the '\' back in later
		content = content.replace(REGEXP_REPLACE_QUERY_FRACTION, "($1:$2___QUERY_FRACTION___$3)");

		// remove empty rules.
		// content = content.replace(REGEXP_EMPTY_RULES, "");

		// Add '\' back to fix Opera -o-device-pixel-ratio query
		content = content.replace(REGEXP_QUERY_FRACTION, "/");

		// some source control tools don't like it when files containing lines longer
		// than, say 8000 characters, are checked in. The linebreak option is used in
		// that case to split long lines after a specific column.
		if (options.maxLineLen > 0) {
			const lines = [];
			let line = [];
			for (let i = 0, len = content.length; i < len; i += 1) {
				const ch = content.charAt(i);
				line.push(ch);
				if (ch === "}" && line.length > options.maxLineLen) {
					lines.push(line.join(""));
					line = [];
				}
			}
			if (line.length) {
				lines.push(line.join(""));
			}

			content = lines.join("\n");
		}

		// replace multiple semi-colons in a row by a single one
		// see SF bug #1980989
		content = content.replace(REGEXP_REPLACE_SEMI_COLUMNS, ";");

		// trim the final string (for any leading or trailing white spaces)
		content = content.replace(REGEXP_TRIM, "");

		if (preservedTokens.length > 1000) {
			return originalContent;
		}

		// restore preserved tokens
		for (let i = preservedTokens.length - 1; i >= 0; i--) {
			content = content.replace(___PRESERVED_TOKEN_ + i + "___", preservedTokens[i], "g");
		}

		// restore preserved newlines
		content = content.replace(REGEXP_PRESERVED_NEWLINE, "\n");

		// return
		return content;
	}

	var cssMinifier = /*#__PURE__*/Object.freeze({
		__proto__: null,
		defaultOptions: defaultOptions,
		processString: processString
	});

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// 1. Let input be the value passed to this algorithm.
	function process$6(input) {

		// UTILITY FUNCTIONS

		// Manual is faster than RegEx
		// http://bjorn.tipling.com/state-and-regular-expressions-in-javascript
		// http://jsperf.com/whitespace-character/5
		function isSpace(c) {
			return (c === "\u0020" || // space
				c === "\u0009" || // horizontal tab
				c === "\u000A" || // new line
				c === "\u000C" || // form feed
				c === "\u000D");  // carriage return
		}

		function collectCharacters(regEx) {
			let chars;
			const match = regEx.exec(input.substring(pos));
			if (match) {
				chars = match[0];
				pos += chars.length;
				return chars;
			}
		}

		const inputLength = input.length;

		// (Don"t use \s, to avoid matching non-breaking space)
		/* eslint-disable no-control-regex */
		const regexLeadingSpaces = /^[ \t\n\r\u000c]+/;
		const regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/;
		const regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/;
		const regexTrailingCommas = /[,]+$/;
		const regexNonNegativeInteger = /^\d+$/;
		/* eslint-enable no-control-regex */

		// ( Positive or negative or unsigned integers or decimals, without or without exponents.
		// Must include at least one digit.
		// According to spec tests any decimal point must be followed by a digit.
		// No leading plus sign is allowed.)
		// https://html.spec.whatwg.org/multipage/infrastructure.html#valid-floating-point-number
		const regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;

		let url, descriptors, currentDescriptor, state, c,
			// 2. Let position be a pointer into input, initially pointing at the start
			//    of the string.
			pos = 0;
		// 3. Let candidates be an initially empty source set.
		const candidates = [];

		// 4. Splitting loop: Collect a sequence of characters that are space
		//    characters or U+002C COMMA characters. If any U+002C COMMA characters
		//    were collected, that is a parse error.		
		while (true) { // eslint-disable-line no-constant-condition
			collectCharacters(regexLeadingCommasOrSpaces);

			// 5. If position is past the end of input, return candidates and abort these steps.
			if (pos >= inputLength) {
				return candidates; // (we"re done, this is the sole return path)
			}

			// 6. Collect a sequence of characters that are not space characters,
			//    and let that be url.
			url = collectCharacters(regexLeadingNotSpaces);

			// 7. Let descriptors be a new empty list.
			descriptors = [];

			// 8. If url ends with a U+002C COMMA character (,), follow these substeps:
			//		(1). Remove all trailing U+002C COMMA characters from url. If this removed
			//         more than one character, that is a parse error.
			if (url.slice(-1) === ",") {
				url = url.replace(regexTrailingCommas, "");
				// (Jump ahead to step 9 to skip tokenization and just push the candidate).
				parseDescriptors();

				//	Otherwise, follow these substeps:
			} else {
				tokenize();
			} // (close else of step 8)

			// 16. Return to the step labeled splitting loop.
		} // (Close of big while loop.)

		/**
		 * Tokenizes descriptor properties prior to parsing
		 * Returns undefined.
		 */
		function tokenize() {

			// 8.1. Descriptor tokeniser: Skip whitespace
			collectCharacters(regexLeadingSpaces);

			// 8.2. Let current descriptor be the empty string.
			currentDescriptor = "";

			// 8.3. Let state be in descriptor.
			state = "in descriptor";

			while (true) { // eslint-disable-line no-constant-condition

				// 8.4. Let c be the character at position.
				c = input.charAt(pos);

				//  Do the following depending on the value of state.
				//  For the purpose of this step, "EOF" is a special character representing
				//  that position is past the end of input.

				// In descriptor
				if (state === "in descriptor") {
					// Do the following, depending on the value of c:

					// Space character
					// If current descriptor is not empty, append current descriptor to
					// descriptors and let current descriptor be the empty string.
					// Set state to after descriptor.
					if (isSpace(c)) {
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
							currentDescriptor = "";
							state = "after descriptor";
						}

						// U+002C COMMA (,)
						// Advance position to the next character in input. If current descriptor
						// is not empty, append current descriptor to descriptors. Jump to the step
						// labeled descriptor parser.
					} else if (c === ",") {
						pos += 1;
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
						}
						parseDescriptors();
						return;

						// U+0028 LEFT PARENTHESIS (()
						// Append c to current descriptor. Set state to in parens.
					} else if (c === "\u0028") {
						currentDescriptor = currentDescriptor + c;
						state = "in parens";

						// EOF
						// If current descriptor is not empty, append current descriptor to
						// descriptors. Jump to the step labeled descriptor parser.
					} else if (c === "") {
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
						}
						parseDescriptors();
						return;

						// Anything else
						// Append c to current descriptor.
					} else {
						currentDescriptor = currentDescriptor + c;
					}
					// (end "in descriptor"

					// In parens
				} else if (state === "in parens") {

					// U+0029 RIGHT PARENTHESIS ())
					// Append c to current descriptor. Set state to in descriptor.
					if (c === ")") {
						currentDescriptor = currentDescriptor + c;
						state = "in descriptor";

						// EOF
						// Append current descriptor to descriptors. Jump to the step labeled
						// descriptor parser.
					} else if (c === "") {
						descriptors.push(currentDescriptor);
						parseDescriptors();
						return;

						// Anything else
						// Append c to current descriptor.
					} else {
						currentDescriptor = currentDescriptor + c;
					}

					// After descriptor
				} else if (state === "after descriptor") {

					// Do the following, depending on the value of c:
					// Space character: Stay in this state.
					if (isSpace(c)) ; else if (c === "") {
						parseDescriptors();
						return;

						// Anything else
						// Set state to in descriptor. Set position to the previous character in input.
					} else {
						state = "in descriptor";
						pos -= 1;

					}
				}

				// Advance position to the next character in input.
				pos += 1;

				// Repeat this step.
			} // (close while true loop)
		}

		/**
		 * Adds descriptor properties to a candidate, pushes to the candidates array
		 * @return undefined
		 */
		// Declared outside of the while loop so that it"s only created once.
		function parseDescriptors() {

			// 9. Descriptor parser: Let error be no.
			let pError = false,

				// 10. Let width be absent.
				// 11. Let density be absent.
				// 12. Let future-compat-h be absent. (We"re implementing it now as h)
				w, d, h, i,
				desc, lastChar, value, intVal, floatVal;
			const candidate = {};

			// 13. For each descriptor in descriptors, run the appropriate set of steps
			// from the following list:
			for (i = 0; i < descriptors.length; i++) {
				desc = descriptors[i];

				lastChar = desc[desc.length - 1];
				value = desc.substring(0, desc.length - 1);
				intVal = parseInt(value, 10);
				floatVal = parseFloat(value);

				// If the descriptor consists of a valid non-negative integer followed by
				// a U+0077 LATIN SMALL LETTER W character
				if (regexNonNegativeInteger.test(value) && (lastChar === "w")) {

					// If width and density are not both absent, then let error be yes.
					if (w || d) { pError = true; }

					// Apply the rules for parsing non-negative integers to the descriptor.
					// If the result is zero, let error be yes.
					// Otherwise, let width be the result.
					if (intVal === 0) { pError = true; } else { w = intVal; }

					// If the descriptor consists of a valid floating-point number followed by
					// a U+0078 LATIN SMALL LETTER X character
				} else if (regexFloatingPoint.test(value) && (lastChar === "x")) {

					// If width, density and future-compat-h are not all absent, then let error
					// be yes.
					if (w || d || h) { pError = true; }

					// Apply the rules for parsing floating-point number values to the descriptor.
					// If the result is less than zero, let error be yes. Otherwise, let density
					// be the result.
					if (floatVal < 0) { pError = true; } else { d = floatVal; }

					// If the descriptor consists of a valid non-negative integer followed by
					// a U+0068 LATIN SMALL LETTER H character
				} else if (regexNonNegativeInteger.test(value) && (lastChar === "h")) {

					// If height and density are not both absent, then let error be yes.
					if (h || d) { pError = true; }

					// Apply the rules for parsing non-negative integers to the descriptor.
					// If the result is zero, let error be yes. Otherwise, let future-compat-h
					// be the result.
					if (intVal === 0) { pError = true; } else { h = intVal; }

					// Anything else, Let error be yes.
				} else { pError = true; }
			} // (close step 13 for loop)

			// 15. If error is still no, then append a new image source to candidates whose
			// URL is url, associated with a width width if not absent and a pixel
			// density density if not absent. Otherwise, there is a parse error.
			if (!pError) {
				candidate.url = url;
				if (w) { candidate.w = w; }
				if (d) { candidate.d = d; }
				if (h) { candidate.h = h; }
				candidates.push(candidate);
			} else if (console && console.log) {  // eslint-disable-line no-console
				console.log("Invalid srcset descriptor found in \"" + input + "\" at \"" + desc + "\"."); // eslint-disable-line no-console
			}
		} // (close parseDescriptors fn)

	}

	var htmlSrcsetParser = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process$6
	});

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// derived from https://github.com/jsdom/whatwg-mimetype

	/* 
	 * Copyright © 2017–2018 Domenic Denicola <d@domenic.me>
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:

	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.

	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	let utils, parser, serializer, MIMEType;

	// lib/utils.js
	{
		utils = {};
		utils.removeLeadingAndTrailingHTTPWhitespace = string => {
			return string.replace(/^[ \t\n\r]+/, "").replace(/[ \t\n\r]+$/, "");
		};

		utils.removeTrailingHTTPWhitespace = string => {
			return string.replace(/[ \t\n\r]+$/, "");
		};

		utils.isHTTPWhitespaceChar = char => {
			return char === " " || char === "\t" || char === "\n" || char === "\r";
		};

		utils.solelyContainsHTTPTokenCodePoints = string => {
			return /^[-!#$%&'*+.^_`|~A-Za-z0-9]*$/.test(string);
		};

		utils.soleyContainsHTTPQuotedStringTokenCodePoints = string => {
			return /^[\t\u0020-\u007E\u0080-\u00FF]*$/.test(string);
		};

		utils.asciiLowercase = string => {
			return string.replace(/[A-Z]/g, l => l.toLowerCase());
		};

		// This variant only implements it with the extract-value flag set.
		utils.collectAnHTTPQuotedString = (input, position) => {
			let value = "";

			position++;

			// eslint-disable-next-line no-constant-condition
			while (true) {
				while (position < input.length && input[position] !== "\"" && input[position] !== "\\") {
					value += input[position];
					++position;
				}

				if (position >= input.length) {
					break;
				}

				const quoteOrBackslash = input[position];
				++position;

				if (quoteOrBackslash === "\\") {
					if (position >= input.length) {
						value += "\\";
						break;
					}

					value += input[position];
					++position;
				} else {
					break;
				}
			}

			return [value, position];
		};
	}

	// lib/serializer.js
	{
		const { solelyContainsHTTPTokenCodePoints } = utils;
		serializer = mimeType => {
			let serialization = `${mimeType.type}/${mimeType.subtype}`;

			if (mimeType.parameters.size === 0) {
				return serialization;
			}

			for (let [name, value] of mimeType.parameters) {
				serialization += ";";
				serialization += name;
				serialization += "=";

				if (!solelyContainsHTTPTokenCodePoints(value) || value.length === 0) {
					value = value.replace(/(["\\])/g, "\\$1");
					value = `"${value}"`;
				}

				serialization += value;
			}

			return serialization;
		};
	}

	// lib/parser.js
	{
		const {
			removeLeadingAndTrailingHTTPWhitespace,
			removeTrailingHTTPWhitespace,
			isHTTPWhitespaceChar,
			solelyContainsHTTPTokenCodePoints,
			soleyContainsHTTPQuotedStringTokenCodePoints,
			asciiLowercase,
			collectAnHTTPQuotedString
		} = utils;

		parser = input => {
			input = removeLeadingAndTrailingHTTPWhitespace(input);

			let position = 0;
			let type = "";
			while (position < input.length && input[position] !== "/") {
				type += input[position];
				++position;
			}

			if (type.length === 0 || !solelyContainsHTTPTokenCodePoints(type)) {
				return null;
			}

			if (position >= input.length) {
				return null;
			}

			// Skips past "/"
			++position;

			let subtype = "";
			while (position < input.length && input[position] !== ";") {
				subtype += input[position];
				++position;
			}

			subtype = removeTrailingHTTPWhitespace(subtype);

			if (subtype.length === 0 || !solelyContainsHTTPTokenCodePoints(subtype)) {
				return null;
			}

			const mimeType = {
				type: asciiLowercase(type),
				subtype: asciiLowercase(subtype),
				parameters: new Map()
			};

			while (position < input.length) {
				// Skip past ";"
				++position;

				while (isHTTPWhitespaceChar(input[position])) {
					++position;
				}

				let parameterName = "";
				while (position < input.length && input[position] !== ";" && input[position] !== "=") {
					parameterName += input[position];
					++position;
				}
				parameterName = asciiLowercase(parameterName);

				if (position < input.length) {
					if (input[position] === ";") {
						continue;
					}

					// Skip past "="
					++position;
				}

				let parameterValue = null;
				if (input[position] === "\"") {
					[parameterValue, position] = collectAnHTTPQuotedString(input, position);

					while (position < input.length && input[position] !== ";") {
						++position;
					}
				} else {
					parameterValue = "";
					while (position < input.length && input[position] !== ";") {
						parameterValue += input[position];
						++position;
					}

					parameterValue = removeTrailingHTTPWhitespace(parameterValue);

					if (parameterValue === "") {
						continue;
					}
				}

				if (parameterName.length > 0 &&
					solelyContainsHTTPTokenCodePoints(parameterName) &&
					soleyContainsHTTPQuotedStringTokenCodePoints(parameterValue) &&
					!mimeType.parameters.has(parameterName)) {
					mimeType.parameters.set(parameterName, parameterValue);
				}
			}

			return mimeType;
		};
	}

	// lib/mime-type.js
	{
		const parse = parser;
		const serialize = serializer;
		const {
			asciiLowercase,
			solelyContainsHTTPTokenCodePoints,
			soleyContainsHTTPQuotedStringTokenCodePoints
		} = utils;

		MIMEType = class MIMEType {
			constructor(string) {
				string = String(string);
				const result = parse(string);
				if (result === null) {
					throw new Error(`Could not parse MIME type string "${string}"`);
				}

				this._type = result.type;
				this._subtype = result.subtype;
				this._parameters = new MIMETypeParameters(result.parameters);
			}

			static parse(string) {
				try {
					return new this(string);
				} catch (e) {
					return null;
				}
			}

			get essence() {
				return `${this.type}/${this.subtype}`;
			}

			get type() {
				return this._type;
			}

			set type(value) {
				value = asciiLowercase(String(value));

				if (value.length === 0) {
					throw new Error("Invalid type: must be a non-empty string");
				}
				if (!solelyContainsHTTPTokenCodePoints(value)) {
					throw new Error(`Invalid type ${value}: must contain only HTTP token code points`);
				}

				this._type = value;
			}

			get subtype() {
				return this._subtype;
			}

			set subtype(value) {
				value = asciiLowercase(String(value));

				if (value.length === 0) {
					throw new Error("Invalid subtype: must be a non-empty string");
				}
				if (!solelyContainsHTTPTokenCodePoints(value)) {
					throw new Error(`Invalid subtype ${value}: must contain only HTTP token code points`);
				}

				this._subtype = value;
			}

			get parameters() {
				return this._parameters;
			}

			toString() {
				// The serialize function works on both "MIME type records" (i.e. the results of parse) and on this class, since
				// this class's interface is identical.
				return serialize(this);
			}

			isJavaScript({ allowParameters = false } = {}) {
				switch (this._type) {
					case "text": {
						switch (this._subtype) {
							case "ecmascript":
							case "javascript":
							case "javascript1.0":
							case "javascript1.1":
							case "javascript1.2":
							case "javascript1.3":
							case "javascript1.4":
							case "javascript1.5":
							case "jscript":
							case "livescript":
							case "x-ecmascript":
							case "x-javascript": {
								return allowParameters || this._parameters.size === 0;
							}
							default: {
								return false;
							}
						}
					}
					case "application": {
						switch (this._subtype) {
							case "ecmascript":
							case "javascript":
							case "x-ecmascript":
							case "x-javascript": {
								return allowParameters || this._parameters.size === 0;
							}
							default: {
								return false;
							}
						}
					}
					default: {
						return false;
					}
				}
			}
			isXML() {
				return (this._subtype === "xml" && (this._type === "text" || this._type === "application")) ||
					this._subtype.endsWith("+xml");
			}
			isHTML() {
				return this._subtype === "html" && this._type === "text";
			}
		};

		class MIMETypeParameters {
			constructor(map) {
				this._map = map;
			}

			get size() {
				return this._map.size;
			}

			get(name) {
				name = asciiLowercase(String(name));
				return this._map.get(name);
			}

			has(name) {
				name = asciiLowercase(String(name));
				return this._map.has(name);
			}

			set(name, value) {
				name = asciiLowercase(String(name));
				value = String(value);

				if (!solelyContainsHTTPTokenCodePoints(name)) {
					throw new Error(`Invalid MIME type parameter name "${name}": only HTTP token code points are valid.`);
				}
				if (!soleyContainsHTTPQuotedStringTokenCodePoints(value)) {
					throw new Error(`Invalid MIME type parameter value "${value}": only HTTP quoted-string token code points are valid.`);
				}

				return this._map.set(name, value);
			}

			clear() {
				this._map.clear();
			}

			delete(name) {
				name = asciiLowercase(String(name));
				return this._map.delete(name);
			}

			forEach(callbackFn, thisArg) {
				this._map.forEach(callbackFn, thisArg);
			}

			keys() {
				return this._map.keys();
			}

			values() {
				return this._map.values();
			}

			entries() {
				return this._map.entries();
			}

			[Symbol.iterator]() {
				return this._map[Symbol.iterator]();
			}
		}

	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	var index$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		zip: zip$1,
		fontPropertyParser: cssFontPropertyParser,
		mediaQueryParser: cssMediaQueryParser,
		cssMinifier: cssMinifier,
		cssUnescape: cssUnescape,
		srcsetParser: htmlSrcsetParser,
		get MIMEType () { return MIMEType; }
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const helper$1 = {
		normalizeFontFamily,
		flatten,
		getFontWeight,
		removeQuotes: removeQuotes$1
	};

	const REGEXP_COMMA = /\s*,\s*/;
	const REGEXP_DASH = /-/;
	const REGEXP_QUESTION_MARK = /\?/g;
	const REGEXP_STARTS_U_PLUS = /^U\+/i;
	const VALID_FONT_STYLES = [/^normal$/, /^italic$/, /^oblique$/, /^oblique\s+/];

	function process$5(doc, stylesheets, styles, options) {
		const stats = { rules: { processed: 0, discarded: 0 }, fonts: { processed: 0, discarded: 0 } };
		const fontsInfo = { declared: [], used: [] };
		const workStyleElement = doc.createElement("style");
		let docContent = "";
		doc.body.appendChild(workStyleElement);
		stylesheets.forEach(stylesheetInfo => {
			const cssRules = stylesheetInfo.stylesheet.children;
			if (cssRules) {
				stats.processed += cssRules.size;
				stats.discarded += cssRules.size;
				getFontsInfo(cssRules, fontsInfo);
				docContent = getRulesTextContent(doc, cssRules, workStyleElement, docContent);
			}
		});
		styles.forEach(declarations => {
			const fontFamilyNames = getFontFamilyNames(declarations);
			if (fontFamilyNames.length) {
				fontsInfo.used.push(fontFamilyNames);
			}
			docContent = getDeclarationsTextContent(declarations.children, workStyleElement, docContent);
		});
		workStyleElement.remove();
		docContent += doc.body.innerText;
		if (globalThis.getComputedStyle && options.doc) {
			fontsInfo.used = fontsInfo.used.map(fontNames => fontNames.map(familyName => {
				const matchedVar = familyName.match(/^var\((--.*)\)$/);
				if (matchedVar && matchedVar[1]) {
					const computedFamilyName = globalThis.getComputedStyle(options.doc.body).getPropertyValue(matchedVar[1]);
					return (computedFamilyName && computedFamilyName.split(",").map(name => helper$1.normalizeFontFamily(name))) || familyName;
				}
				return familyName;
			}));
			fontsInfo.used = fontsInfo.used.map(fontNames => helper$1.flatten(fontNames));
		}
		const variableFound = fontsInfo.used.find(fontNames => fontNames.find(fontName => fontName.match(/^var\(--/)));
		let unusedFonts, filteredUsedFonts;
		if (variableFound) {
			unusedFonts = [];
		} else {
			filteredUsedFonts = new Map();
			fontsInfo.used.forEach(fontNames => fontNames.forEach(familyName => {
				if (fontsInfo.declared.find(fontInfo => fontInfo.fontFamily == familyName)) {
					const optionalData = options.usedFonts && options.usedFonts.filter(fontInfo => fontInfo[0] == familyName);
					if (optionalData && optionalData.length) {
						filteredUsedFonts.set(familyName, optionalData);
					}
				}
			}));
			unusedFonts = fontsInfo.declared.filter(fontInfo => !filteredUsedFonts.has(fontInfo.fontFamily));
		}
		stylesheets.forEach(stylesheetInfo => {
			const cssRules = stylesheetInfo.stylesheet.children;
			if (cssRules) {
				filterUnusedFonts(cssRules, fontsInfo.declared, unusedFonts, filteredUsedFonts, docContent);
				stats.rules.discarded -= cssRules.size;
			}
		});
		return stats;
	}

	function getFontsInfo(cssRules, fontsInfo) {
		cssRules.forEach(ruleData => {
			if (ruleData.type == "Atrule" && (ruleData.name == "media" || ruleData.name == "supports") && ruleData.block && ruleData.block.children) {
				getFontsInfo(ruleData.block.children, fontsInfo);
			} else if (ruleData.type == "Rule") {
				const fontFamilyNames = getFontFamilyNames(ruleData.block);
				if (fontFamilyNames.length) {
					fontsInfo.used.push(fontFamilyNames);
				}
			} else {
				if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
					const fontFamily = helper$1.normalizeFontFamily(getDeclarationValue(ruleData.block.children, "font-family"));
					if (fontFamily) {
						const fontWeight = getDeclarationValue(ruleData.block.children, "font-weight") || "400";
						const fontStyle = getDeclarationValue(ruleData.block.children, "font-style") || "normal";
						const fontVariant = getDeclarationValue(ruleData.block.children, "font-variant") || "normal";
						fontWeight.split(",").forEach(weightValue =>
							fontsInfo.declared.push({ fontFamily, fontWeight: helper$1.getFontWeight(helper$1.removeQuotes(weightValue)), fontStyle, fontVariant }));
					}
				}
			}
		});
	}

	function filterUnusedFonts(cssRules, declaredFonts, unusedFonts, filteredUsedFonts, docContent) {
		const removedRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && (ruleData.name == "media" || ruleData.name == "supports") && ruleData.block && ruleData.block.children) {
				filterUnusedFonts(ruleData.block.children, declaredFonts, unusedFonts, filteredUsedFonts, docContent);
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
				const fontFamily = helper$1.normalizeFontFamily(getDeclarationValue(ruleData.block.children, "font-family"));
				if (fontFamily) {
					const unicodeRange = getDeclarationValue(ruleData.block.children, "unicode-range");
					if (unusedFonts.find(fontInfo => fontInfo.fontFamily == fontFamily) || !testUnicodeRange(docContent, unicodeRange) || !testUsedFont(ruleData, fontFamily, declaredFonts, filteredUsedFonts)) {
						removedRules.push(cssRule);
					}
				}
				const removedDeclarations = [];
				for (let declaration = ruleData.block.children.head; declaration; declaration = declaration.next) {
					if (declaration.data.property == "font-display") {
						removedDeclarations.push(declaration);
					}
				}
				if (removedDeclarations.length) {
					removedDeclarations.forEach(removedDeclaration => ruleData.block.children.remove(removedDeclaration));
				}
			}
		}
		removedRules.forEach(cssRule => cssRules.remove(cssRule));
	}

	function testUsedFont(ruleData, familyName, declaredFonts, filteredUsedFonts) {
		let test;
		const optionalUsedFonts = filteredUsedFonts && filteredUsedFonts.get(familyName);
		if (optionalUsedFonts && optionalUsedFonts.length) {
			let fontStyle = getDeclarationValue(ruleData.block.children, "font-style") || "normal";
			if (VALID_FONT_STYLES.find(rule => fontStyle.trim().match(rule))) {
				const fontWeight = helper$1.getFontWeight(getDeclarationValue(ruleData.block.children, "font-weight") || "400");
				const declaredFontsWeights = declaredFonts
					.filter(fontInfo => fontInfo.fontFamily == familyName && fontInfo.fontStyle == fontStyle)
					.map(fontInfo => fontInfo.fontWeight)
					.sort((weight1, weight2) => Number.parseInt(weight1, 10) - Number.parseInt(weight2, 10));
				let usedFontWeights = optionalUsedFonts.map(fontInfo => getUsedFontWeight(fontInfo, fontStyle, declaredFontsWeights));
				test = testFontweight(fontWeight, usedFontWeights);
				if (!test) {
					usedFontWeights = optionalUsedFonts.map(fontInfo => {
						fontInfo = Array.from(fontInfo);
						fontInfo[2] = "normal";
						return getUsedFontWeight(fontInfo, fontStyle, declaredFontsWeights);
					});
				}
				test = testFontweight(fontWeight, usedFontWeights);
			} else {
				test = true;
			}
		} else {
			test = true;
		}
		return test;
	}

	function testFontweight(fontWeight, usedFontWeights) {
		let test;
		for (const value of fontWeight.split(/[ ,]/)) {
			test = test || usedFontWeights.includes(helper$1.getFontWeight(helper$1.removeQuotes(value)));
		}
		return test;
	}

	function getDeclarationValue(declarations, propertyName) {
		let property;
		if (declarations) {
			property = declarations.filter(declaration => declaration.property == propertyName).tail;
		}
		if (property) {
			try {
				return helper$1.removeQuotes(gb(property.data.value)).toLowerCase();
			} catch (error) {
				// ignored
			}
		}
	}

	function getFontFamilyNames(declarations) {
		let fontFamilyName = declarations.children.filter(node => node.property == "font-family").tail;
		let fontFamilyNames = [];
		if (fontFamilyName) {
			if (fontFamilyName.data.value.children) {
				parseFamilyNames(fontFamilyName.data.value, fontFamilyNames);
			} else {
				fontFamilyName = gb(fontFamilyName.data.value);
				if (fontFamilyName) {
					fontFamilyNames.push(helper$1.normalizeFontFamily(fontFamilyName));
				}
			}
		}
		const font = declarations.children.filter(node => node.property == "font").tail;
		if (font && font.data && font.data.value) {
			try {
				const parsedFont = parse(font.data.value);
				parsedFont.family.forEach(familyName => fontFamilyNames.push(helper$1.normalizeFontFamily(familyName)));
			} catch (error) {
				// ignored				
			}
		}
		return fontFamilyNames;
	}

	function parseFamilyNames(fontFamilyNameTokenData, fontFamilyNames) {
		let nextToken = fontFamilyNameTokenData.children.head;
		while (nextToken) {
			if (nextToken.data.type == "Identifier") {
				let familyName = nextToken.data.name;
				let nextIdentifierToken = nextToken.next;
				while (nextIdentifierToken && nextIdentifierToken.data.type != "Operator" && nextIdentifierToken.data.value != ",") {
					familyName += " " + nextIdentifierToken.data.name;
					nextIdentifierToken = nextIdentifierToken.next;
				}
				fontFamilyNames.push(helper$1.normalizeFontFamily(familyName));
				nextToken = nextToken.next;
			} else if (nextToken.data.type == "Function" && nextToken.data.name == "var" && nextToken.data.children) {
				const varName = nextToken.data.children.head.data.name;
				fontFamilyNames.push(helper$1.normalizeFontFamily("var(" + varName + ")"));
				let nextValueToken = nextToken.data.children.head.next;
				while (nextValueToken && nextValueToken.data.type == "Operator" && nextValueToken.data.value == ",") {
					nextValueToken = nextValueToken.next;
				}
				const fallbackToken = nextValueToken;
				if (fallbackToken) {
					if (fallbackToken.data.children) {
						parseFamilyNames(fallbackToken.data, fontFamilyNames);
					} else {
						fontFamilyNames.push(helper$1.normalizeFontFamily(fallbackToken.data.value));
					}
				}
				nextToken = nextToken.next;
			} else if (nextToken.data.type == "String") {
				fontFamilyNames.push(helper$1.normalizeFontFamily(nextToken.data.value));
				nextToken = nextToken.next;
			} else if (nextToken.data.type == "Operator" && nextToken.data.value == ",") {
				nextToken = nextToken.next;
			}
		}
	}

	function getUsedFontWeight(fontInfo, fontStyle, fontWeights) {
		let foundWeight;
		fontWeights = fontWeights.map(weight => String(Number.parseInt(weight, 10)));
		if (fontInfo[2] == fontStyle) {
			let fontWeight = Number(fontInfo[1]);
			if (fontWeights.length > 1) {
				if (fontWeight >= 400 && fontWeight <= 500) {
					foundWeight = fontWeights.find(weight => weight >= fontWeight && weight <= 500);
					if (!foundWeight) {
						foundWeight = findDescendingFontWeight(fontWeight, fontWeights);
					}
					if (!foundWeight) {
						foundWeight = findAscendingFontWeight(fontWeight, fontWeights);
					}
				}
				if (fontWeight < 400) {
					foundWeight = fontWeights.slice().reverse().find(weight => weight <= fontWeight);
					if (!foundWeight) {
						foundWeight = findAscendingFontWeight(fontWeight, fontWeights);
					}
				}
				if (fontWeight > 500) {
					foundWeight = fontWeights.find(weight => weight >= fontWeight);
					if (!foundWeight) {
						foundWeight = findDescendingFontWeight(fontWeight, fontWeights);
					}
				}
			} else {
				foundWeight = fontWeights[0];
			}
		}
		return foundWeight;
	}

	function findDescendingFontWeight(fontWeight, fontWeights) {
		return fontWeights.slice().reverse().find(weight => weight < fontWeight);
	}

	function findAscendingFontWeight(fontWeight, fontWeights) {
		return fontWeights.find(weight => weight > fontWeight);
	}

	function getRulesTextContent(doc, cssRules, workStylesheet, content) {
		cssRules.forEach(ruleData => {
			if (ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				if (ruleData.type == "Atrule" && (ruleData.name == "media" || ruleData.name == "supports")) {
					content = getRulesTextContent(doc, ruleData.block.children, workStylesheet, content);
				} else if (ruleData.type == "Rule") {
					content = getDeclarationsTextContent(ruleData.block.children, workStylesheet, content);
				}
			}
		});
		return content;
	}

	function getDeclarationsTextContent(declarations, workStylesheet, content) {
		const contentText = getDeclarationUnescapedValue(declarations, "content", workStylesheet);
		const quotesText = getDeclarationUnescapedValue(declarations, "quotes", workStylesheet);
		if (!content.includes(contentText)) {
			content += contentText;
		}
		if (!content.includes(quotesText)) {
			content += quotesText;
		}
		return content;
	}

	function getDeclarationUnescapedValue(declarations, property, workStylesheet) {
		const rawValue = getDeclarationValue(declarations, property) || "";
		if (rawValue) {
			workStylesheet.textContent = "tmp { content:\"" + rawValue + "\"}";
			if (workStylesheet.sheet && workStylesheet.sheet.cssRules) {
				return helper$1.removeQuotes(workStylesheet.sheet.cssRules[0].style.getPropertyValue("content"));
			} else {
				return rawValue;
			}
		}
		return "";
	}

	function testUnicodeRange(docContent, unicodeRange) {
		if (unicodeRange) {
			const unicodeRanges = unicodeRange.split(REGEXP_COMMA);
			let invalid;
			const result = unicodeRanges.filter(rangeValue => {
				const range = rangeValue.split(REGEXP_DASH);
				let regExpString;
				if (range.length == 2) {
					range[0] = transformRange(range[0]);
					regExpString = "[" + range[0] + "-" + transformRange("U+" + range[1]) + "]";
				}
				if (range.length == 1) {
					if (range[0].includes("?")) {
						const firstRange = transformRange(range[0]);
						const secondRange = firstRange;
						regExpString = "[" + firstRange.replace(REGEXP_QUESTION_MARK, "0") + "-" + secondRange.replace(REGEXP_QUESTION_MARK, "F") + "]";
					} else if (range[0]) {
						regExpString = "[" + transformRange(range[0]) + "]";
					}
				}
				if (regExpString) {
					try {
						return (new RegExp(regExpString, "u")).test(docContent);
					} catch (error) {
						invalid = true;
						return false;
					}
				}
				return true;
			});
			return !invalid && (!unicodeRanges.length || result.length);
		}
		return true;
	}

	function transformRange(range) {
		range = range.replace(REGEXP_STARTS_U_PLUS, "");
		while (range.length < 6) {
			range = "0" + range;
		}
		return "\\u{" + range + "}";
	}

	var cssFontsMinifier = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process$5
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const MEDIA_ALL$3 = "all";
	const IGNORED_PSEUDO_ELEMENTS = ["after", "before", "first-letter", "first-line", "placeholder", "selection", "part", "marker"];
	const SINGLE_FILE_HIDDEN_CLASS_NAME = "sf-hidden";
	const DISPLAY_STYLE = "display";
	const REGEXP_VENDOR_IDENTIFIER = /-(ms|webkit|moz|o)-/;

	class MatchedRules {
		constructor(doc, stylesheets, styles) {
			this.doc = doc;
			this.mediaAllInfo = createMediaInfo(MEDIA_ALL$3);
			const matchedElementsCache = new Map();
			let sheetIndex = 0;
			const workStyleSheet = doc.createElement("style");
			doc.body.appendChild(workStyleSheet);
			const workStyleElement = doc.createElement("span");
			doc.body.appendChild(workStyleElement);
			stylesheets.forEach(stylesheetInfo => {
				if (!stylesheetInfo.scoped) {
					const cssRules = stylesheetInfo.stylesheet.children;
					if (cssRules) {
						if (stylesheetInfo.mediaText && stylesheetInfo.mediaText != MEDIA_ALL$3) {
							const mediaInfo = createMediaInfo(stylesheetInfo.mediaText);
							this.mediaAllInfo.medias.set("style-" + sheetIndex + "-" + stylesheetInfo.mediaText, mediaInfo);
							getMatchedElementsRules(doc, cssRules, mediaInfo, sheetIndex, styles, matchedElementsCache, workStyleSheet);
						} else {
							getMatchedElementsRules(doc, cssRules, this.mediaAllInfo, sheetIndex, styles, matchedElementsCache, workStyleSheet);
						}
					}
				}
				sheetIndex++;
			});
			sortRules(this.mediaAllInfo);
			computeCascade(this.mediaAllInfo, [], this.mediaAllInfo, workStyleSheet, workStyleElement);
			workStyleSheet.remove();
			workStyleElement.remove();
		}

		getMediaAllInfo() {
			return this.mediaAllInfo;
		}
	}

	function getMediaAllInfo(doc, stylesheets, styles) {
		return new MatchedRules(doc, stylesheets, styles).getMediaAllInfo();
	}

	function createMediaInfo(media) {
		const mediaInfo = { media: media, elements: new Map(), medias: new Map(), rules: new Map(), pseudoRules: new Map() };
		if (media == MEDIA_ALL$3) {
			mediaInfo.matchedStyles = new Map();
		}
		return mediaInfo;
	}

	function getMatchedElementsRules(doc, cssRules, mediaInfo, sheetIndex, styles, matchedElementsCache, workStylesheet) {
		let mediaIndex = 0;
		let ruleIndex = 0;
		cssRules.forEach(ruleData => {
			if (ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				if (ruleData.type == "Atrule" && ruleData.name == "media") {
					const mediaText = gb(ruleData.prelude);
					const ruleMediaInfo = createMediaInfo(mediaText);
					mediaInfo.medias.set("rule-" + sheetIndex + "-" + mediaIndex + "-" + mediaText, ruleMediaInfo);
					mediaIndex++;
					getMatchedElementsRules(doc, ruleData.block.children, ruleMediaInfo, sheetIndex, styles, matchedElementsCache, workStylesheet);
				} else if (ruleData.type == "Rule") {
					const selectors = ruleData.prelude.children.toArray();
					const selectorsText = ruleData.prelude.children.toArray().map(selector => gb(selector));
					const ruleInfo = { ruleData, mediaInfo, ruleIndex, sheetIndex, matchedSelectors: new Set(), declarations: new Set(), selectors, selectorsText };
					if (!invalidSelector(selectorsText.join(","), workStylesheet) || selectorsText.find(selectorText => selectorText.includes("|"))) {
						for (let selector = ruleData.prelude.children.head, selectorIndex = 0; selector; selector = selector.next, selectorIndex++) {
							const selectorText = selectorsText[selectorIndex];
							const selectorInfo = { selector, selectorText, ruleInfo };
							getMatchedElementsSelector(doc, selectorInfo, styles, matchedElementsCache);
						}
					}
					ruleIndex++;
				}
			}
		});
	}

	function invalidSelector(selectorText, workStylesheet) {
		workStylesheet.textContent = selectorText + "{}";
		return workStylesheet.sheet ? !workStylesheet.sheet.cssRules.length : workStylesheet.sheet;
	}

	function getMatchedElementsSelector(doc, selectorInfo, styles, matchedElementsCache) {
		const filteredSelectorText = getFilteredSelector(selectorInfo.selector, selectorInfo.selectorText);
		const selectorText = filteredSelectorText != selectorInfo.selectorText ? filteredSelectorText : selectorInfo.selectorText;
		const cachedMatchedElements = matchedElementsCache.get(selectorText);
		let matchedElements = cachedMatchedElements;
		if (!matchedElements) {
			try {
				matchedElements = doc.querySelectorAll(selectorText);
				if (selectorText != "." + SINGLE_FILE_HIDDEN_CLASS_NAME) {
					matchedElements = Array.from(doc.querySelectorAll(selectorText)).filter(matchedElement =>
						!matchedElement.classList.contains(SINGLE_FILE_HIDDEN_CLASS_NAME) &&
						(matchedElement.style.getPropertyValue(DISPLAY_STYLE) != "none" || matchedElement.style.getPropertyPriority("display") != "important")
					);
				}
			} catch (error) {
				// ignored				
			}
		}
		if (matchedElements) {
			if (!cachedMatchedElements) {
				matchedElementsCache.set(selectorText, matchedElements);
			}
			if (matchedElements.length) {
				if (filteredSelectorText == selectorInfo.selectorText) {
					matchedElements.forEach(element => addRule(element, selectorInfo, styles));
				} else {
					let pseudoSelectors = selectorInfo.ruleInfo.mediaInfo.pseudoRules.get(selectorInfo.ruleInfo.ruleData);
					if (!pseudoSelectors) {
						pseudoSelectors = new Set();
						selectorInfo.ruleInfo.mediaInfo.pseudoRules.set(selectorInfo.ruleInfo.ruleData, pseudoSelectors);
					}
					pseudoSelectors.add(selectorInfo.selectorText);
				}
			}
		}
	}

	function getFilteredSelector(selector, selectorText) {
		const removedSelectors = [];
		let namespaceFound;
		selector = { data: db(gb(selector.data), { context: "selector" }) };
		filterNamespace(selector);
		if (namespaceFound)	{
			selectorText = gb(selector.data).trim();
		}
		filterPseudoClasses(selector);
		if (removedSelectors.length) {
			removedSelectors.forEach(({ parentSelector, selector }) => {
				if (parentSelector.data.children.size == 0 || !selector.prev || selector.prev.data.type == "Combinator" || selector.prev.data.type == "WhiteSpace") {
					parentSelector.data.children.replace(selector, db("*", { context: "selector" }).children.head);
				} else {
					parentSelector.data.children.remove(selector);
				}
			});
			selectorText = gb(selector.data).trim();
		}
		return selectorText;

		function filterPseudoClasses(selector, parentSelector) {
			if (selector.data.children) {
				for (let childSelector = selector.data.children.head; childSelector; childSelector = childSelector.next) {
					filterPseudoClasses(childSelector, selector);
				}
			}
			if ((selector.data.type == "PseudoClassSelector") ||
				(selector.data.type == "PseudoElementSelector" && (testVendorPseudo(selector) || IGNORED_PSEUDO_ELEMENTS.includes(selector.data.name)))) {
				removedSelectors.push({ parentSelector, selector });
			}
		}

		function filterNamespace(selector) {
			if (selector.data.children) {
				for (let childSelector = selector.data.children.head; childSelector; childSelector = childSelector.next) {
					filterNamespace(childSelector);
				}
			}
			if (selector.data.type == "TypeSelector" && selector.data.name.includes("|")) {
				namespaceFound = true;
				selector.data.name = selector.data.name.substring(selector.data.name.lastIndexOf("|") + 1);
			}
		}

		function testVendorPseudo(selector) {
			const name = selector.data.name;
			return name.startsWith("-") || name.startsWith("\\-");
		}
	}

	function addRule(element, selectorInfo, styles) {
		const mediaInfo = selectorInfo.ruleInfo.mediaInfo;
		const elementStyle = styles.get(element);
		let elementInfo = mediaInfo.elements.get(element);
		if (!elementInfo) {
			elementInfo = [];
			if (elementStyle) {
				elementInfo.push({ styleInfo: { styleData: elementStyle, declarations: new Set() } });
			}
			mediaInfo.elements.set(element, elementInfo);
		}
		const specificity = computeSpecificity(selectorInfo.selector.data);
		specificity.ruleIndex = selectorInfo.ruleInfo.ruleIndex;
		specificity.sheetIndex = selectorInfo.ruleInfo.sheetIndex;
		selectorInfo.specificity = specificity;
		elementInfo.push(selectorInfo);
	}

	function computeCascade(mediaInfo, parentMediaInfo, mediaAllInfo, workStylesheet, workStyleElement) {
		mediaInfo.elements.forEach((elementInfo/*, element*/) =>
			getDeclarationsInfo(elementInfo, workStylesheet, workStyleElement/*, element*/).forEach((declarationsInfo, property) => {
				if (declarationsInfo.selectorInfo.ruleInfo || mediaInfo == mediaAllInfo) {
					let info;
					if (declarationsInfo.selectorInfo.ruleInfo) {
						info = declarationsInfo.selectorInfo.ruleInfo;
						const ruleData = info.ruleData;
						const ascendantMedia = [mediaInfo, ...parentMediaInfo].find(media => media.rules.get(ruleData)) || mediaInfo;
						ascendantMedia.rules.set(ruleData, info);
						if (ruleData) {
							info.matchedSelectors.add(declarationsInfo.selectorInfo.selectorText);
						}
					} else {
						info = declarationsInfo.selectorInfo.styleInfo;
						const styleData = info.styleData;
						const matchedStyleInfo = mediaAllInfo.matchedStyles.get(styleData);
						if (!matchedStyleInfo) {
							mediaAllInfo.matchedStyles.set(styleData, info);
						}
					}
					if (!info.declarations.has(property)) {
						info.declarations.add(property);
					}
				}
			}));
		delete mediaInfo.elements;
		mediaInfo.medias.forEach(childMediaInfo => computeCascade(childMediaInfo, [mediaInfo, ...parentMediaInfo], mediaAllInfo, workStylesheet, workStyleElement));
	}

	function getDeclarationsInfo(elementInfo, workStylesheet, workStyleElement/*, element*/) {
		const declarationsInfo = new Map();
		const processedProperties = new Set();
		elementInfo.forEach(selectorInfo => {
			let declarations;
			if (selectorInfo.styleInfo) {
				declarations = selectorInfo.styleInfo.styleData.children;
			} else {
				declarations = selectorInfo.ruleInfo.ruleData.block.children;
			}
			processDeclarations(declarationsInfo, declarations, selectorInfo, processedProperties, workStylesheet, workStyleElement);
		});
		return declarationsInfo;
	}

	function processDeclarations(declarationsInfo, declarations, selectorInfo, processedProperties, workStylesheet, workStyleElement) {
		for (let declaration = declarations.tail; declaration; declaration = declaration.prev) {
			const declarationData = declaration.data;
			const declarationText = gb(declarationData);
			if (declarationData.type == "Declaration" &&
				(declarationText.match(REGEXP_VENDOR_IDENTIFIER) || !processedProperties.has(declarationData.property) || declarationData.important) && !invalidDeclaration(declarationText, workStyleElement)) {
				const declarationInfo = declarationsInfo.get(declarationData);
				if (!declarationInfo || (declarationData.important && !declarationInfo.important)) {
					declarationsInfo.set(declarationData, { selectorInfo, important: declarationData.important });
					if (!declarationText.match(REGEXP_VENDOR_IDENTIFIER)) {
						processedProperties.add(declarationData.property);
					}
				}
			}
		}
	}

	function invalidDeclaration(declarationText, workStyleElement) {
		let invalidDeclaration;
		workStyleElement.style = declarationText;
		if (!workStyleElement.style.length) {
			if (!declarationText.match(REGEXP_VENDOR_IDENTIFIER)) {
				invalidDeclaration = true;
			}
		}
		return invalidDeclaration;
	}

	function sortRules(media) {
		media.elements.forEach(elementRules => elementRules.sort((ruleInfo1, ruleInfo2) =>
			ruleInfo1.styleInfo && !ruleInfo2.styleInfo ? -1 :
				!ruleInfo1.styleInfo && ruleInfo2.styleInfo ? 1 :
					compareSpecificity(ruleInfo1.specificity, ruleInfo2.specificity)));
		media.medias.forEach(sortRules);
	}

	function computeSpecificity(selector, specificity = { a: 0, b: 0, c: 0 }) {
		if (selector.type == "IdSelector") {
			specificity.a++;
		}
		if (selector.type == "ClassSelector" || selector.type == "AttributeSelector" || (selector.type == "PseudoClassSelector" && selector.name != "not")) {
			specificity.b++;
		}
		if ((selector.type == "TypeSelector" && selector.name != "*") || selector.type == "PseudoElementSelector") {
			specificity.c++;
		}
		if (selector.children) {
			selector.children.forEach(selector => computeSpecificity(selector, specificity));
		}
		return specificity;
	}

	function compareSpecificity(specificity1, specificity2) {
		if (specificity1.a > specificity2.a) {
			return -1;
		} else if (specificity1.a < specificity2.a) {
			return 1;
		} else if (specificity1.b > specificity2.b) {
			return -1;
		} else if (specificity1.b < specificity2.b) {
			return 1;
		} else if (specificity1.c > specificity2.c) {
			return -1;
		} else if (specificity1.c < specificity2.c) {
			return 1;
		} else if (specificity1.sheetIndex > specificity2.sheetIndex) {
			return -1;
		} else if (specificity1.sheetIndex < specificity2.sheetIndex) {
			return 1;
		} else if (specificity1.ruleIndex > specificity2.ruleIndex) {
			return -1;
		} else if (specificity1.ruleIndex < specificity2.ruleIndex) {
			return 1;
		} else {
			return -1;
		}
	}

	var cssMatchedRules = /*#__PURE__*/Object.freeze({
		__proto__: null,
		getMediaAllInfo: getMediaAllInfo
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const helper = {
		flatten
	};

	const MEDIA_ALL$2 = "all";
	const MEDIA_SCREEN = "screen";

	function process$4(stylesheets) {
		const stats = { processed: 0, discarded: 0 };
		stylesheets.forEach((stylesheetInfo, element) => {
			if (matchesMediaType(stylesheetInfo.mediaText || MEDIA_ALL$2, MEDIA_SCREEN) && stylesheetInfo.stylesheet.children) {
				const removedRules = processRules$1(stylesheetInfo.stylesheet.children, stats);
				removedRules.forEach(({ cssRules, cssRule }) => cssRules.remove(cssRule));
			} else {
				stylesheets.delete(element);
			}
		});
		return stats;
	}

	function processRules$1(cssRules, stats, removedRules = []) {
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				stats.processed++;
				if (matchesMediaType(gb(ruleData.prelude), MEDIA_SCREEN)) {
					processRules$1(ruleData.block.children, stats, removedRules);
				} else {
					removedRules.push({ cssRules, cssRule });
					stats.discarded++;
				}
			}
		}
		return removedRules;
	}

	function matchesMediaType(mediaText, mediaType) {
		const foundMediaTypes = helper.flatten(parseMediaList(mediaText).map(node => getMediaTypes(node, mediaType)));
		return foundMediaTypes.find(mediaTypeInfo => (!mediaTypeInfo.not && (mediaTypeInfo.value == mediaType || mediaTypeInfo.value == MEDIA_ALL$2))
			|| (mediaTypeInfo.not && (mediaTypeInfo.value == MEDIA_ALL$2 || mediaTypeInfo.value != mediaType)));
	}

	function getMediaTypes(parentNode, mediaType, mediaTypes = []) {
		parentNode.nodes.map((node, indexNode) => {
			if (node.type == "media-query") {
				return getMediaTypes(node, mediaType, mediaTypes);
			} else {
				if (node.type == "media-type") {
					const nodeMediaType = { not: Boolean(indexNode && parentNode.nodes[0].type == "keyword" && parentNode.nodes[0].value == "not"), value: node.value };
					if (!mediaTypes.find(mediaType => nodeMediaType.not == mediaType.not && nodeMediaType.value == mediaType.value)) {
						mediaTypes.push(nodeMediaType);
					}
				}
			}
		});
		if (!mediaTypes.length) {
			mediaTypes.push({ not: false, value: MEDIA_ALL$2 });
		}
		return mediaTypes;
	}

	var cssMediasAltMinifier = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process$4
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	function process$3(stylesheets, styles, mediaAllInfo) {
		const stats = { processed: 0, discarded: 0 };
		let sheetIndex = 0;
		stylesheets.forEach(stylesheetInfo => {
			if (!stylesheetInfo.scoped) {
				const cssRules = stylesheetInfo.stylesheet.children;
				if (cssRules) {
					stats.processed += cssRules.size;
					stats.discarded += cssRules.size;
					let mediaInfo;
					if (stylesheetInfo.mediaText && stylesheetInfo.mediaText != "all") {
						mediaInfo = mediaAllInfo.medias.get("style-" + sheetIndex + "-" + stylesheetInfo.mediaText);
					} else {
						mediaInfo = mediaAllInfo;
					}
					processRules(cssRules, sheetIndex, mediaInfo);
					stats.discarded -= cssRules.size;
				}
			}
			sheetIndex++;
		});
		styles.forEach(style => processStyleAttribute(style, mediaAllInfo));
		return stats;
	}

	function processRules(cssRules, sheetIndex, mediaInfo) {
		let mediaRuleIndex = 0;
		const removedCssRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				if (ruleData.type == "Atrule" && ruleData.name == "media") {
					const mediaText = gb(ruleData.prelude);
					processRules(ruleData.block.children, sheetIndex, mediaInfo.medias.get("rule-" + sheetIndex + "-" + mediaRuleIndex + "-" + mediaText));
					if (!ruleData.prelude.children.size || !ruleData.block.children.size) {
						removedCssRules.push(cssRule);
					}
					mediaRuleIndex++;
				} else if (ruleData.type == "Rule") {
					const ruleInfo = mediaInfo.rules.get(ruleData);
					const pseudoSelectors = mediaInfo.pseudoRules.get(ruleData);
					if (!ruleInfo && !pseudoSelectors) {
						removedCssRules.push(cssRule);
					} else if (ruleInfo) {
						processRuleInfo(ruleData, ruleInfo, pseudoSelectors);
						if (!ruleData.prelude.children.size || !ruleData.block.children.size) {
							removedCssRules.push(cssRule);
						}
					}
				}
			} else {
				if (!ruleData || ruleData.type == "Raw" || (ruleData.type == "Rule" && (!ruleData.prelude || ruleData.prelude.type == "Raw"))) {
					removedCssRules.push(cssRule);
				}
			}
		}
		removedCssRules.forEach(cssRule => cssRules.remove(cssRule));
	}

	function processRuleInfo(ruleData, ruleInfo, pseudoSelectors) {
		const removedDeclarations = [];
		const removedSelectors = [];
		let pseudoSelectorFound;
		for (let selector = ruleData.prelude.children.head; selector; selector = selector.next) {
			const selectorText = gb(selector.data);
			if (pseudoSelectors && pseudoSelectors.has(selectorText)) {
				pseudoSelectorFound = true;
			}
			if (!ruleInfo.matchedSelectors.has(selectorText) && (!pseudoSelectors || !pseudoSelectors.has(selectorText))) {
				removedSelectors.push(selector);
			}
		}
		if (!pseudoSelectorFound) {
			for (let declaration = ruleData.block.children.tail; declaration; declaration = declaration.prev) {
				if (!ruleInfo.declarations.has(declaration.data)) {
					removedDeclarations.push(declaration);
				}
			}
		}
		removedDeclarations.forEach(declaration => ruleData.block.children.remove(declaration));
		removedSelectors.forEach(selector => ruleData.prelude.children.remove(selector));
	}

	function processStyleAttribute(styleData, mediaAllInfo) {
		const removedDeclarations = [];
		const styleInfo = mediaAllInfo.matchedStyles.get(styleData);
		if (styleInfo) {
			let propertyFound;
			for (let declaration = styleData.children.head; declaration && !propertyFound; declaration = declaration.next) {
				if (!styleInfo.declarations.has(declaration.data)) {
					removedDeclarations.push(declaration);
				}
			}
			removedDeclarations.forEach(declaration => styleData.children.remove(declaration));
		}
	}

	var cssRulesMinifier = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process$3
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const EMPTY_RESOURCE = "data:,";

	function process$2(doc) {
		doc.querySelectorAll("picture").forEach(pictureElement => {
			const imgElement = pictureElement.querySelector("img");
			if (imgElement) {
				let { src, srcset } = getImgSrcData(imgElement);
				if (!src) {
					const data = getSourceSrcData(Array.from(pictureElement.querySelectorAll("source")).reverse());
					src = data.src;
					if (!srcset) {
						srcset = data.srcset;
					}
				}
				setSrc({ src, srcset }, imgElement, pictureElement);
			}
		});
		doc.querySelectorAll(":not(picture) > img[srcset]").forEach(imgElement => setSrc(getImgSrcData(imgElement), imgElement));
	}

	function getImgSrcData(imgElement) {
		let src = imgElement.getAttribute("src");
		if (src == EMPTY_RESOURCE) {
			src = null;
		}
		let srcset = getSourceSrc(imgElement.getAttribute("srcset"));
		if (srcset == EMPTY_RESOURCE) {
			srcset = null;
		}
		return { src, srcset };
	}

	function getSourceSrcData(sources) {
		let source = sources.find(source => source.src);
		let src = source && source.src;
		let srcset = source && source.srcset;
		if (!src) {
			source = sources.find(source => getSourceSrc(source.src));
			src = source && source.src;
			if (src == EMPTY_RESOURCE) {
				src = null;
			}
		}
		if (!srcset) {
			source = sources.find(source => getSourceSrc(source.srcset));
			srcset = source && source.srcset;
			if (srcset == EMPTY_RESOURCE) {
				srcset = null;
			}
		}
		return { src, srcset };
	}

	function setSrc(srcData, imgElement, pictureElement) {
		if (srcData.src) {
			imgElement.setAttribute("src", srcData.src);
			imgElement.setAttribute("srcset", "");
			imgElement.setAttribute("sizes", "");
		} else {
			imgElement.setAttribute("src", EMPTY_RESOURCE);
			if (srcData.srcset) {
				imgElement.setAttribute("srcset", srcData.srcset);
			} else {
				imgElement.setAttribute("srcset", "");
				imgElement.setAttribute("sizes", "");
			}
		}
		if (pictureElement) {
			pictureElement.querySelectorAll("source").forEach(sourceElement => sourceElement.remove());
		}
	}

	function getSourceSrc(sourceSrcSet) {
		if (sourceSrcSet) {
			try {
				const srcset = process$6(sourceSrcSet);
				if (srcset.length) {
					return (srcset.find(srcset => srcset.url)).url;
				}
			} catch (error) {
				// ignored
			}
		}
	}

	var htmlImagesAltMinifier = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process$2
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	// Derived from the work of Kirill Maltsev - https://github.com/posthtml/htmlnano

	// Source: https://github.com/kangax/html-minifier/issues/63
	const booleanAttributes = [
		"allowfullscreen",
		"async",
		"autofocus",
		"autoplay",
		"checked",
		"compact",
		"controls",
		"declare",
		"default",
		"defaultchecked",
		"defaultmuted",
		"defaultselected",
		"defer",
		"disabled",
		"enabled",
		"formnovalidate",
		"hidden",
		"indeterminate",
		"inert",
		"ismap",
		"itemscope",
		"loop",
		"multiple",
		"muted",
		"nohref",
		"noresize",
		"noshade",
		"novalidate",
		"nowrap",
		"open",
		"pauseonexit",
		"readonly",
		"required",
		"reversed",
		"scoped",
		"seamless",
		"selected",
		"sortable",
		"truespeed",
		"typemustmatch",
		"visible"
	];

	const noWhitespaceCollapseElements = ["SCRIPT", "STYLE", "PRE", "TEXTAREA"];

	// Source: https://www.w3.org/TR/html4/sgml/dtd.html#events (Generic Attributes)
	const safeToRemoveAttrs = [
		"id",
		"class",
		"style",
		"lang",
		"dir",
		"onclick",
		"ondblclick",
		"onmousedown",
		"onmouseup",
		"onmouseover",
		"onmousemove",
		"onmouseout",
		"onkeypress",
		"onkeydown",
		"onkeyup"
	];

	const redundantAttributes = {
		"FORM": {
			"method": "get"
		},
		"SCRIPT": {
			"language": "javascript",
			"type": "text/javascript",
			// Remove attribute if the function returns false
			"charset": node => {
				// The charset attribute only really makes sense on “external” SCRIPT elements:
				// http://perfectionkills.com/optimizing-html/#8_script_charset
				return !node.getAttribute("src");
			}
		},
		"STYLE": {
			"media": "all",
			"type": "text/css"
		},
		"LINK": {
			"media": "all"
		}
	};

	const REGEXP_WHITESPACE = /[ \t\f\r]+/g;
	const REGEXP_NEWLINE = /[\n]+/g;
	const REGEXP_ENDS_WHITESPACE = /^\s+$/;
	const NodeFilter_SHOW_ALL = 4294967295;
	const Node_ELEMENT_NODE$1 = 1;
	const Node_TEXT_NODE$1 = 3;
	const Node_COMMENT_NODE$1 = 8;

	const modules = [
		collapseBooleanAttributes,
		mergeTextNodes,
		collapseWhitespace,
		removeComments,
		removeEmptyAttributes,
		removeRedundantAttributes,
		compressJSONLD,
		node => mergeElements(node, "style", (node, previousSibling) => node.parentElement && getTagName$1(node.parentElement) == "HEAD" && node.media == previousSibling.media && node.title == previousSibling.title)
	];

	function process$1(doc, options) {
		removeEmptyInlineElements(doc);
		const nodesWalker = doc.createTreeWalker(doc.documentElement, NodeFilter_SHOW_ALL, null, false);
		let node = nodesWalker.nextNode();
		while (node) {
			const deletedNode = modules.find(module => module(node, options));
			const previousNode = node;
			node = nodesWalker.nextNode();
			if (deletedNode) {
				previousNode.remove();
			}
		}
	}

	function collapseBooleanAttributes(node) {
		if (node.nodeType == Node_ELEMENT_NODE$1) {
			Array.from(node.attributes).forEach(attribute => {
				if (booleanAttributes.includes(attribute.name)) {
					node.setAttribute(attribute.name, "");
				}
			});
		}
	}

	function mergeTextNodes(node) {
		if (node.nodeType == Node_TEXT_NODE$1) {
			if (node.previousSibling && node.previousSibling.nodeType == Node_TEXT_NODE$1) {
				node.textContent = node.previousSibling.textContent + node.textContent;
				node.previousSibling.remove();
			}
		}
	}

	function mergeElements(node, tagName, acceptMerge) {
		if (node.nodeType == Node_ELEMENT_NODE$1 && getTagName$1(node) == tagName.toUpperCase()) {
			let previousSibling = node.previousSibling;
			const previousSiblings = [];
			while (previousSibling && previousSibling.nodeType == Node_TEXT_NODE$1 && !previousSibling.textContent.trim()) {
				previousSiblings.push(previousSibling);
				previousSibling = previousSibling.previousSibling;
			}
			if (previousSibling && previousSibling.nodeType == Node_ELEMENT_NODE$1 && previousSibling.tagName == node.tagName && acceptMerge(node, previousSibling)) {
				node.textContent = previousSibling.textContent + node.textContent;
				previousSiblings.forEach(node => node.remove());
				previousSibling.remove();
			}
		}
	}

	function collapseWhitespace(node, options) {
		if (node.nodeType == Node_TEXT_NODE$1) {
			let element = node.parentElement;
			const spacePreserved = element.getAttribute(options.PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME) == "";
			if (!spacePreserved) {
				const textContent = node.textContent;
				let noWhitespace = noWhitespaceCollapse(element);
				while (noWhitespace) {
					element = element.parentElement;
					noWhitespace = element && noWhitespaceCollapse(element);
				}
				if ((!element || noWhitespace) && textContent.length > 1) {
					node.textContent = textContent.replace(REGEXP_WHITESPACE, getWhiteSpace(node)).replace(REGEXP_NEWLINE, "\n");
				}
			}
		}
	}

	function getWhiteSpace(node) {
		return node.parentElement && getTagName$1(node.parentElement) == "HEAD" ? "\n" : " ";
	}

	function noWhitespaceCollapse(element) {
		return element && !noWhitespaceCollapseElements.includes(getTagName$1(element));
	}

	function removeComments(node) {
		if (node.nodeType == Node_COMMENT_NODE$1 && getTagName$1(node.parentElement) != "HTML") {
			return !node.textContent.toLowerCase().trim().startsWith("[if");
		}
	}

	function removeEmptyAttributes(node) {
		if (node.nodeType == Node_ELEMENT_NODE$1) {
			Array.from(node.attributes).forEach(attribute => {
				if (safeToRemoveAttrs.includes(attribute.name.toLowerCase())) {
					const attributeValue = node.getAttribute(attribute.name);
					if (attributeValue == "" || (attributeValue || "").match(REGEXP_ENDS_WHITESPACE)) {
						node.removeAttribute(attribute.name);
					}
				}
			});
		}
	}

	function removeRedundantAttributes(node) {
		if (node.nodeType == Node_ELEMENT_NODE$1) {
			const tagRedundantAttributes = redundantAttributes[getTagName$1(node)];
			if (tagRedundantAttributes) {
				Object.keys(tagRedundantAttributes).forEach(redundantAttributeName => {
					const tagRedundantAttributeValue = tagRedundantAttributes[redundantAttributeName];
					if (typeof tagRedundantAttributeValue == "function" ? tagRedundantAttributeValue(node) : node.getAttribute(redundantAttributeName) == tagRedundantAttributeValue) {
						node.removeAttribute(redundantAttributeName);
					}
				});
			}
		}
	}

	function compressJSONLD(node) {
		if (node.nodeType == Node_ELEMENT_NODE$1 && getTagName$1(node) == "SCRIPT" && node.type == "application/ld+json" && node.textContent.trim()) {
			try {
				node.textContent = JSON.stringify(JSON.parse(node.textContent));
			} catch (error) {
				// ignored
			}
		}
	}

	function removeEmptyInlineElements(doc) {
		doc.querySelectorAll("style, script:not([src])").forEach(element => {
			if (!element.textContent.trim()) {
				element.remove();
			}
		});
	}

	function getTagName$1(element) {
		return  element.tagName && element.tagName.toUpperCase();
	}

	var htmlMinifier = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process$1
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const SELF_CLOSED_TAG_NAMES = ["AREA", "BASE", "BR", "COL", "COMMAND", "EMBED", "HR", "IMG", "INPUT", "KEYGEN", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"];

	const Node_ELEMENT_NODE = 1;
	const Node_TEXT_NODE = 3;
	const Node_COMMENT_NODE = 8;

	// see https://www.w3.org/TR/html5/syntax.html#optional-tags
	const OMITTED_START_TAGS = [
		{ tagName: "HEAD", accept: element => !element.childNodes.length || element.childNodes[0].nodeType == Node_ELEMENT_NODE },
		{ tagName: "BODY", accept: element => !element.childNodes.length }
	];
	const OMITTED_END_TAGS = [
		{ tagName: "HTML", accept: next => !next || next.nodeType != Node_COMMENT_NODE },
		{ tagName: "HEAD", accept: next => !next || (next.nodeType != Node_COMMENT_NODE && (next.nodeType != Node_TEXT_NODE || !startsWithSpaceChar(next.textContent))) },
		{ tagName: "BODY", accept: next => !next || next.nodeType != Node_COMMENT_NODE },
		{ tagName: "LI", accept: (next, element) => (!next && element.parentElement && (getTagName(element.parentElement) == "UL" || getTagName(element.parentElement) == "OL")) || (next && ["LI"].includes(getTagName(next))) },
		{ tagName: "DT", accept: next => !next || ["DT", "DD"].includes(getTagName(next)) },
		{ tagName: "P", accept: next => next && ["ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DETAILS", "DIV", "DL", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HR", "MAIN", "NAV", "OL", "P", "PRE", "SECTION", "TABLE", "UL"].includes(getTagName(next)) },
		{ tagName: "DD", accept: next => !next || ["DT", "DD"].includes(getTagName(next)) },
		{ tagName: "RT", accept: next => !next || ["RT", "RP"].includes(getTagName(next)) },
		{ tagName: "RP", accept: next => !next || ["RT", "RP"].includes(getTagName(next)) },
		{ tagName: "OPTGROUP", accept: next => !next || ["OPTGROUP"].includes(getTagName(next)) },
		{ tagName: "OPTION", accept: next => !next || ["OPTION", "OPTGROUP"].includes(getTagName(next)) },
		{ tagName: "COLGROUP", accept: next => !next || (next.nodeType != Node_COMMENT_NODE && (next.nodeType != Node_TEXT_NODE || !startsWithSpaceChar(next.textContent))) },
		{ tagName: "CAPTION", accept: next => !next || (next.nodeType != Node_COMMENT_NODE && (next.nodeType != Node_TEXT_NODE || !startsWithSpaceChar(next.textContent))) },
		{ tagName: "THEAD", accept: next => !next || ["TBODY", "TFOOT"].includes(getTagName(next)) },
		{ tagName: "TBODY", accept: next => !next || ["TBODY", "TFOOT"].includes(getTagName(next)) },
		{ tagName: "TFOOT", accept: next => !next },
		{ tagName: "TR", accept: next => !next || ["TR"].includes(getTagName(next)) },
		{ tagName: "TD", accept: next => !next || ["TD", "TH"].includes(getTagName(next)) },
		{ tagName: "TH", accept: next => !next || ["TD", "TH"].includes(getTagName(next)) }
	];
	const TEXT_NODE_TAGS = ["STYLE", "SCRIPT", "XMP", "IFRAME", "NOEMBED", "NOFRAMES", "PLAINTEXT", "NOSCRIPT"];

	function process(doc, compressHTML) {
		const docType = doc.doctype;
		let docTypeString = "";
		if (docType) {
			docTypeString = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeString += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId)
					docTypeString += " \"" + docType.systemId + "\"";
			} else if (docType.systemId)
				docTypeString += " SYSTEM \"" + docType.systemId + "\"";
			if (docType.internalSubset)
				docTypeString += " [" + docType.internalSubset + "]";
			docTypeString += "> ";
		}
		return docTypeString + serialize(doc.documentElement, compressHTML);
	}

	function serialize(node, compressHTML, isSVG) {
		if (node.nodeType == Node_TEXT_NODE) {
			return serializeTextNode(node);
		} else if (node.nodeType == Node_COMMENT_NODE) {
			return serializeCommentNode(node);
		} else if (node.nodeType == Node_ELEMENT_NODE) {
			return serializeElement(node, compressHTML, isSVG);
		}
	}

	function serializeTextNode(textNode) {
		const parentNode = textNode.parentNode;
		let parentTagName;
		if (parentNode && parentNode.nodeType == Node_ELEMENT_NODE) {
			parentTagName = getTagName(parentNode);
		}
		if (!parentTagName || TEXT_NODE_TAGS.includes(parentTagName)) {
			if (parentTagName == "SCRIPT" || parentTagName == "STYLE") {
				return textNode.textContent.replace(/<\//gi, "<\\/").replace(/\/>/gi, "\\/>");
			}
			return textNode.textContent;
		} else {
			return textNode.textContent.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
	}

	function serializeCommentNode(commentNode) {
		return "<!--" + commentNode.textContent + "-->";
	}

	function serializeElement(element, compressHTML, isSVG) {
		const tagName = getTagName(element);
		const omittedStartTag = compressHTML && OMITTED_START_TAGS.find(omittedStartTag => tagName == getTagName(omittedStartTag) && omittedStartTag.accept(element));
		let content = "";
		if (!omittedStartTag || element.attributes.length) {
			content = "<" + tagName.toLowerCase();
			Array.from(element.attributes).forEach(attribute => content += serializeAttribute(attribute, element, compressHTML));
			content += ">";
		}
		if (tagName == "TEMPLATE" && !element.childNodes.length) {
			content += element.innerHTML;
		} else {
			Array.from(element.childNodes).forEach(childNode => content += serialize(childNode, compressHTML, isSVG || tagName == "svg"));
		}
		const omittedEndTag = compressHTML && OMITTED_END_TAGS.find(omittedEndTag => tagName == getTagName(omittedEndTag) && omittedEndTag.accept(element.nextSibling, element));
		if (isSVG || (!omittedEndTag && !SELF_CLOSED_TAG_NAMES.includes(tagName))) {
			content += "</" + tagName.toLowerCase() + ">";
		}
		return content;
	}

	function serializeAttribute(attribute, element, compressHTML) {
		const name = attribute.name;
		let content = "";
		if (!name.match(/["'>/=]/)) {
			let value = attribute.value;
			if (compressHTML && name == "class") {
				value = Array.from(element.classList).map(className => className.trim()).join(" ");
			}
			let simpleQuotesValue;
			value = value.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;");
			if (value.includes("\"")) {
				if (value.includes("'") || !compressHTML) {
					value = value.replace(/"/g, "&quot;");
				} else {
					simpleQuotesValue = true;
				}
			}
			const invalidUnquotedValue = !compressHTML || value.match(/[ \t\n\f\r'"`=<>]/);
			content += " ";
			if (!attribute.namespace) {
				content += name;
			} else if (attribute.namespaceURI == "http://www.w3.org/XML/1998/namespace") {
				content += "xml:" + name;
			} else if (attribute.namespaceURI == "http://www.w3.org/2000/xmlns/") {
				if (name !== "xmlns") {
					content += "xmlns:";
				}
				content += name;
			} else if (attribute.namespaceURI == "http://www.w3.org/1999/xlink") {
				content += "xlink:" + name;
			} else {
				content += name;
			}
			if (value != "") {
				content += "=";
				if (invalidUnquotedValue) {
					content += simpleQuotesValue ? "'" : "\"";
				}
				content += value;
				if (invalidUnquotedValue) {
					content += simpleQuotesValue ? "'" : "\"";
				}
			}
		}
		return content;
	}

	function startsWithSpaceChar(textContent) {
		return Boolean(textContent.match(/^[ \t\n\f\r]/));
	}

	function getTagName(element) {
		return  element.tagName && element.tagName.toUpperCase();
	}

	var htmlSerializer = /*#__PURE__*/Object.freeze({
		__proto__: null,
		process: process
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 *
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or
	 *   modify it under the terms of the GNU Affero General Public License
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 *
	 *   The code in this file is distributed in the hope that it will be useful,
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
	 *   AGPL normally required by section 4, provided you include this license
	 *   notice and a URL through which recipients can access the Corresponding
	 *   Source.
	 */

	/* global Blob, FileReader, URL, URLSearchParams */

	// eslint-disable-next-line quotes
	const DEFAULT_REPLACED_CHARACTERS$1 = ["~", "+", "\\\\", "?", "%", "*", ":", "|", '"', "<", ">", "\x00-\x1f", "\x7F"];
	const DEFAULT_REPLACEMENT_CHARACTER$1 = "_";

	const EMOJI_NAMES = {
		"😀": "grinning-face",
		"😃": "grinning-face-with-big-eyes",
		"😄": "grinning-face-with-smiling-eyes",
		"😁": "beaming-face-with-smiling-eyes",
		"😆": "grinning-squinting-face",
		"😅": "grinning-face-with-sweat",
		"🤣": "rolling-on-the-floor-laughing",
		"😂": "face-with-tears-of-joy",
		"🙂": "slightly-smiling-face",
		"🙃": "upside-down-face",
		"🫠": "melting-face",
		"😉": "winking-face",
		"😊": "smiling-face-with-smiling-eyes",
		"😇": "smiling-face-with-halo",
		"🥰": "smiling-face-with-hearts",
		"😍": "smiling-face-with-heart-eyes",
		"🤩": "star-struck",
		"😘": "face-blowing-a-kiss",
		"😗": "kissing-face",
		"☺": "smiling-face",
		"😚": "kissing-face-with-closed-eyes",
		"😙": "kissing-face-with-smiling-eyes",
		"🥲": "smiling-face-with-tear",
		"😋": "face-savoring-food",
		"😛": "face-with-tongue",
		"😜": "winking-face-with-tongue",
		"🤪": "zany-face",
		"😝": "squinting-face-with-tongue",
		"🤑": "money-mouth-face",
		"🤗": "smiling-face-with-open-hands",
		"🤭": "face-with-hand-over-mouth",
		"🫢": "face-with-open-eyes-and-hand-over-mouth",
		"🫣": "face-with-peeking-eye",
		"🤫": "shushing-face",
		"🤔": "thinking-face",
		"🫡": "saluting-face",
		"🤐": "zipper-mouth-face",
		"🤨": "face-with-raised-eyebrow",
		"😐": "neutral-face",
		"😑": "expressionless-face",
		"😶": "face-without-mouth",
		"🫥": "dotted-line-face",
		"😶‍🌫️": "face-in-clouds",
		"😏": "smirking-face",
		"😒": "unamused-face",
		"🙄": "face-with-rolling-eyes",
		"😬": "grimacing-face",
		"😮‍💨": "face-exhaling",
		"🤥": "lying-face",
		"🫨": "⊛-shaking-face",
		"😌": "relieved-face",
		"😔": "pensive-face",
		"😪": "sleepy-face",
		"🤤": "drooling-face",
		"😴": "sleeping-face",
		"😷": "face-with-medical-mask",
		"🤒": "face-with-thermometer",
		"🤕": "face-with-head-bandage",
		"🤢": "nauseated-face",
		"🤮": "face-vomiting",
		"🤧": "sneezing-face",
		"🥵": "hot-face",
		"🥶": "cold-face",
		"🥴": "woozy-face",
		"😵": "face-with-crossed-out-eyes",
		"😵‍💫": "face-with-spiral-eyes",
		"🤯": "exploding-head",
		"🤠": "cowboy-hat-face",
		"🥳": "partying-face",
		"🥸": "disguised-face",
		"😎": "smiling-face-with-sunglasses",
		"🤓": "nerd-face",
		"🧐": "face-with-monocle",
		"😕": "confused-face",
		"🫤": "face-with-diagonal-mouth",
		"😟": "worried-face",
		"🙁": "slightly-frowning-face",
		"☹": "frowning-face",
		"😮": "face-with-open-mouth",
		"😯": "hushed-face",
		"😲": "astonished-face",
		"😳": "flushed-face",
		"🥺": "pleading-face",
		"🥹": "face-holding-back-tears",
		"😦": "frowning-face-with-open-mouth",
		"😧": "anguished-face",
		"😨": "fearful-face",
		"😰": "anxious-face-with-sweat",
		"😥": "sad-but-relieved-face",
		"😢": "crying-face",
		"😭": "loudly-crying-face",
		"😱": "face-screaming-in-fear",
		"😖": "confounded-face",
		"😣": "persevering-face",
		"😞": "disappointed-face",
		"😓": "downcast-face-with-sweat",
		"😩": "weary-face",
		"😫": "tired-face",
		"🥱": "yawning-face",
		"😤": "face-with-steam-from-nose",
		"😡": "enraged-face",
		"😠": "angry-face",
		"🤬": "face-with-symbols-on-mouth",
		"😈": "smiling-face-with-horns",
		"👿": "angry-face-with-horns",
		"💀": "skull",
		"☠": "skull-and-crossbones",
		"💩": "pile-of-poo",
		"🤡": "clown-face",
		"👹": "ogre",
		"👺": "goblin",
		"👻": "ghost",
		"👽": "alien",
		"👾": "alien-monster",
		"🤖": "robot",
		"😺": "grinning-cat",
		"😸": "grinning-cat-with-smiling-eyes",
		"😹": "cat-with-tears-of-joy",
		"😻": "smiling-cat-with-heart-eyes",
		"😼": "cat-with-wry-smile",
		"😽": "kissing-cat",
		"🙀": "weary-cat",
		"😿": "crying-cat",
		"😾": "pouting-cat",
		"🙈": "see-no-evil-monkey",
		"🙉": "hear-no-evil-monkey",
		"🙊": "speak-no-evil-monkey",
		"💌": "love-letter",
		"💘": "heart-with-arrow",
		"💝": "heart-with-ribbon",
		"💖": "sparkling-heart",
		"💗": "growing-heart",
		"💓": "beating-heart",
		"💞": "revolving-hearts",
		"💕": "two-hearts",
		"💟": "heart-decoration",
		"❣": "heart-exclamation",
		"💔": "broken-heart",
		"❤️‍🔥": "heart-on-fire",
		"❤️‍🩹": "mending-heart",
		"❤": "red-heart",
		"🩷": "⊛-pink-heart",
		"🧡": "orange-heart",
		"💛": "yellow-heart",
		"💚": "green-heart",
		"💙": "blue-heart",
		"🩵": "⊛-light-blue-heart",
		"💜": "purple-heart",
		"🤎": "brown-heart",
		"🖤": "black-heart",
		"🩶": "⊛-grey-heart",
		"🤍": "white-heart",
		"💋": "kiss-mark",
		"💯": "hundred-points",
		"💢": "anger-symbol",
		"💥": "collision",
		"💫": "dizzy",
		"💦": "sweat-droplets",
		"💨": "dashing-away",
		"🕳": "hole",
		"💬": "speech-balloon",
		"👁️‍🗨️": "eye-in-speech-bubble",
		"🗨": "left-speech-bubble",
		"🗯": "right-anger-bubble",
		"💭": "thought-balloon",
		"💤": "zzz",
		"👋": "waving-hand",
		"🤚": "raised-back-of-hand",
		"🖐": "hand-with-fingers-splayed",
		"✋": "raised-hand",
		"🖖": "vulcan-salute",
		"🫱": "rightwards-hand",
		"🫲": "leftwards-hand",
		"🫳": "palm-down-hand",
		"🫴": "palm-up-hand",
		"🫷": "⊛-leftwards-pushing-hand",
		"🫸": "⊛-rightwards-pushing-hand",
		"👌": "ok-hand",
		"🤌": "pinched-fingers",
		"🤏": "pinching-hand",
		"✌": "victory-hand",
		"🤞": "crossed-fingers",
		"🫰": "hand-with-index-finger-and-thumb-crossed",
		"🤟": "love-you-gesture",
		"🤘": "sign-of-the-horns",
		"🤙": "call-me-hand",
		"👈": "backhand-index-pointing-left",
		"👉": "backhand-index-pointing-right",
		"👆": "backhand-index-pointing-up",
		"🖕": "middle-finger",
		"👇": "backhand-index-pointing-down",
		"☝": "index-pointing-up",
		"🫵": "index-pointing-at-the-viewer",
		"👍": "thumbs-up",
		"👎": "thumbs-down",
		"✊": "raised-fist",
		"👊": "oncoming-fist",
		"🤛": "left-facing-fist",
		"🤜": "right-facing-fist",
		"👏": "clapping-hands",
		"🙌": "raising-hands",
		"🫶": "heart-hands",
		"👐": "open-hands",
		"🤲": "palms-up-together",
		"🤝": "handshake",
		"🙏": "folded-hands",
		"✍": "writing-hand",
		"💅": "nail-polish",
		"🤳": "selfie",
		"💪": "flexed-biceps",
		"🦾": "mechanical-arm",
		"🦿": "mechanical-leg",
		"🦵": "leg",
		"🦶": "foot",
		"👂": "ear",
		"🦻": "ear-with-hearing-aid",
		"👃": "nose",
		"🧠": "brain",
		"🫀": "anatomical-heart",
		"🫁": "lungs",
		"🦷": "tooth",
		"🦴": "bone",
		"👀": "eyes",
		"👁": "eye",
		"👅": "tongue",
		"👄": "mouth",
		"🫦": "biting-lip",
		"👶": "baby",
		"🧒": "child",
		"👦": "boy",
		"👧": "girl",
		"🧑": "person",
		"👱": "person-blond-hair",
		"👨": "man",
		"🧔": "person-beard",
		"🧔‍♂️": "man-beard",
		"🧔‍♀️": "woman-beard",
		"👨‍🦰": "man-red-hair",
		"👨‍🦱": "man-curly-hair",
		"👨‍🦳": "man-white-hair",
		"👨‍🦲": "man-bald",
		"👩": "woman",
		"👩‍🦰": "woman-red-hair",
		"🧑‍🦰": "person-red-hair",
		"👩‍🦱": "woman-curly-hair",
		"🧑‍🦱": "person-curly-hair",
		"👩‍🦳": "woman-white-hair",
		"🧑‍🦳": "person-white-hair",
		"👩‍🦲": "woman-bald",
		"🧑‍🦲": "person-bald",
		"👱‍♀️": "woman-blond-hair",
		"👱‍♂️": "man-blond-hair",
		"🧓": "older-person",
		"👴": "old-man",
		"👵": "old-woman",
		"🙍": "person-frowning",
		"🙍‍♂️": "man-frowning",
		"🙍‍♀️": "woman-frowning",
		"🙎": "person-pouting",
		"🙎‍♂️": "man-pouting",
		"🙎‍♀️": "woman-pouting",
		"🙅": "person-gesturing-no",
		"🙅‍♂️": "man-gesturing-no",
		"🙅‍♀️": "woman-gesturing-no",
		"🙆": "person-gesturing-ok",
		"🙆‍♂️": "man-gesturing-ok",
		"🙆‍♀️": "woman-gesturing-ok",
		"💁": "person-tipping-hand",
		"💁‍♂️": "man-tipping-hand",
		"💁‍♀️": "woman-tipping-hand",
		"🙋": "person-raising-hand",
		"🙋‍♂️": "man-raising-hand",
		"🙋‍♀️": "woman-raising-hand",
		"🧏": "deaf-person",
		"🧏‍♂️": "deaf-man",
		"🧏‍♀️": "deaf-woman",
		"🙇": "person-bowing",
		"🙇‍♂️": "man-bowing",
		"🙇‍♀️": "woman-bowing",
		"🤦": "person-facepalming",
		"🤦‍♂️": "man-facepalming",
		"🤦‍♀️": "woman-facepalming",
		"🤷": "person-shrugging",
		"🤷‍♂️": "man-shrugging",
		"🤷‍♀️": "woman-shrugging",
		"🧑‍⚕️": "health-worker",
		"👨‍⚕️": "man-health-worker",
		"👩‍⚕️": "woman-health-worker",
		"🧑‍🎓": "student",
		"👨‍🎓": "man-student",
		"👩‍🎓": "woman-student",
		"🧑‍🏫": "teacher",
		"👨‍🏫": "man-teacher",
		"👩‍🏫": "woman-teacher",
		"🧑‍⚖️": "judge",
		"👨‍⚖️": "man-judge",
		"👩‍⚖️": "woman-judge",
		"🧑‍🌾": "farmer",
		"👨‍🌾": "man-farmer",
		"👩‍🌾": "woman-farmer",
		"🧑‍🍳": "cook",
		"👨‍🍳": "man-cook",
		"👩‍🍳": "woman-cook",
		"🧑‍🔧": "mechanic",
		"👨‍🔧": "man-mechanic",
		"👩‍🔧": "woman-mechanic",
		"🧑‍🏭": "factory-worker",
		"👨‍🏭": "man-factory-worker",
		"👩‍🏭": "woman-factory-worker",
		"🧑‍💼": "office-worker",
		"👨‍💼": "man-office-worker",
		"👩‍💼": "woman-office-worker",
		"🧑‍🔬": "scientist",
		"👨‍🔬": "man-scientist",
		"👩‍🔬": "woman-scientist",
		"🧑‍💻": "technologist",
		"👨‍💻": "man-technologist",
		"👩‍💻": "woman-technologist",
		"🧑‍🎤": "singer",
		"👨‍🎤": "man-singer",
		"👩‍🎤": "woman-singer",
		"🧑‍🎨": "artist",
		"👨‍🎨": "man-artist",
		"👩‍🎨": "woman-artist",
		"🧑‍✈️": "pilot",
		"👨‍✈️": "man-pilot",
		"👩‍✈️": "woman-pilot",
		"🧑‍🚀": "astronaut",
		"👨‍🚀": "man-astronaut",
		"👩‍🚀": "woman-astronaut",
		"🧑‍🚒": "firefighter",
		"👨‍🚒": "man-firefighter",
		"👩‍🚒": "woman-firefighter",
		"👮": "police-officer",
		"👮‍♂️": "man-police-officer",
		"👮‍♀️": "woman-police-officer",
		"🕵": "detective",
		"🕵️‍♂️": "man-detective",
		"🕵️‍♀️": "woman-detective",
		"💂": "guard",
		"💂‍♂️": "man-guard",
		"💂‍♀️": "woman-guard",
		"🥷": "ninja",
		"👷": "construction-worker",
		"👷‍♂️": "man-construction-worker",
		"👷‍♀️": "woman-construction-worker",
		"🫅": "person-with-crown",
		"🤴": "prince",
		"👸": "princess",
		"👳": "person-wearing-turban",
		"👳‍♂️": "man-wearing-turban",
		"👳‍♀️": "woman-wearing-turban",
		"👲": "person-with-skullcap",
		"🧕": "woman-with-headscarf",
		"🤵": "person-in-tuxedo",
		"🤵‍♂️": "man-in-tuxedo",
		"🤵‍♀️": "woman-in-tuxedo",
		"👰": "person-with-veil",
		"👰‍♂️": "man-with-veil",
		"👰‍♀️": "woman-with-veil",
		"🤰": "pregnant-woman",
		"🫃": "pregnant-man",
		"🫄": "pregnant-person",
		"🤱": "breast-feeding",
		"👩‍🍼": "woman-feeding-baby",
		"👨‍🍼": "man-feeding-baby",
		"🧑‍🍼": "person-feeding-baby",
		"👼": "baby-angel",
		"🎅": "santa-claus",
		"🤶": "mrs-claus",
		"🧑‍🎄": "mx-claus",
		"🦸": "superhero",
		"🦸‍♂️": "man-superhero",
		"🦸‍♀️": "woman-superhero",
		"🦹": "supervillain",
		"🦹‍♂️": "man-supervillain",
		"🦹‍♀️": "woman-supervillain",
		"🧙": "mage",
		"🧙‍♂️": "man-mage",
		"🧙‍♀️": "woman-mage",
		"🧚": "fairy",
		"🧚‍♂️": "man-fairy",
		"🧚‍♀️": "woman-fairy",
		"🧛": "vampire",
		"🧛‍♂️": "man-vampire",
		"🧛‍♀️": "woman-vampire",
		"🧜": "merperson",
		"🧜‍♂️": "merman",
		"🧜‍♀️": "mermaid",
		"🧝": "elf",
		"🧝‍♂️": "man-elf",
		"🧝‍♀️": "woman-elf",
		"🧞": "genie",
		"🧞‍♂️": "man-genie",
		"🧞‍♀️": "woman-genie",
		"🧟": "zombie",
		"🧟‍♂️": "man-zombie",
		"🧟‍♀️": "woman-zombie",
		"🧌": "troll",
		"💆": "person-getting-massage",
		"💆‍♂️": "man-getting-massage",
		"💆‍♀️": "woman-getting-massage",
		"💇": "person-getting-haircut",
		"💇‍♂️": "man-getting-haircut",
		"💇‍♀️": "woman-getting-haircut",
		"🚶": "person-walking",
		"🚶‍♂️": "man-walking",
		"🚶‍♀️": "woman-walking",
		"🧍": "person-standing",
		"🧍‍♂️": "man-standing",
		"🧍‍♀️": "woman-standing",
		"🧎": "person-kneeling",
		"🧎‍♂️": "man-kneeling",
		"🧎‍♀️": "woman-kneeling",
		"🧑‍🦯": "person-with-white-cane",
		"👨‍🦯": "man-with-white-cane",
		"👩‍🦯": "woman-with-white-cane",
		"🧑‍🦼": "person-in-motorized-wheelchair",
		"👨‍🦼": "man-in-motorized-wheelchair",
		"👩‍🦼": "woman-in-motorized-wheelchair",
		"🧑‍🦽": "person-in-manual-wheelchair",
		"👨‍🦽": "man-in-manual-wheelchair",
		"👩‍🦽": "woman-in-manual-wheelchair",
		"🏃": "person-running",
		"🏃‍♂️": "man-running",
		"🏃‍♀️": "woman-running",
		"💃": "woman-dancing",
		"🕺": "man-dancing",
		"🕴": "person-in-suit-levitating",
		"👯": "people-with-bunny-ears",
		"👯‍♂️": "men-with-bunny-ears",
		"👯‍♀️": "women-with-bunny-ears",
		"🧖": "person-in-steamy-room",
		"🧖‍♂️": "man-in-steamy-room",
		"🧖‍♀️": "woman-in-steamy-room",
		"🧗": "person-climbing",
		"🧗‍♂️": "man-climbing",
		"🧗‍♀️": "woman-climbing",
		"🤺": "person-fencing",
		"🏇": "horse-racing",
		"⛷": "skier",
		"🏂": "snowboarder",
		"🏌": "person-golfing",
		"🏌️‍♂️": "man-golfing",
		"🏌️‍♀️": "woman-golfing",
		"🏄": "person-surfing",
		"🏄‍♂️": "man-surfing",
		"🏄‍♀️": "woman-surfing",
		"🚣": "person-rowing-boat",
		"🚣‍♂️": "man-rowing-boat",
		"🚣‍♀️": "woman-rowing-boat",
		"🏊": "person-swimming",
		"🏊‍♂️": "man-swimming",
		"🏊‍♀️": "woman-swimming",
		"⛹": "person-bouncing-ball",
		"⛹️‍♂️": "man-bouncing-ball",
		"⛹️‍♀️": "woman-bouncing-ball",
		"🏋": "person-lifting-weights",
		"🏋️‍♂️": "man-lifting-weights",
		"🏋️‍♀️": "woman-lifting-weights",
		"🚴": "person-biking",
		"🚴‍♂️": "man-biking",
		"🚴‍♀️": "woman-biking",
		"🚵": "person-mountain-biking",
		"🚵‍♂️": "man-mountain-biking",
		"🚵‍♀️": "woman-mountain-biking",
		"🤸": "person-cartwheeling",
		"🤸‍♂️": "man-cartwheeling",
		"🤸‍♀️": "woman-cartwheeling",
		"🤼": "people-wrestling",
		"🤼‍♂️": "men-wrestling",
		"🤼‍♀️": "women-wrestling",
		"🤽": "person-playing-water-polo",
		"🤽‍♂️": "man-playing-water-polo",
		"🤽‍♀️": "woman-playing-water-polo",
		"🤾": "person-playing-handball",
		"🤾‍♂️": "man-playing-handball",
		"🤾‍♀️": "woman-playing-handball",
		"🤹": "person-juggling",
		"🤹‍♂️": "man-juggling",
		"🤹‍♀️": "woman-juggling",
		"🧘": "person-in-lotus-position",
		"🧘‍♂️": "man-in-lotus-position",
		"🧘‍♀️": "woman-in-lotus-position",
		"🛀": "person-taking-bath",
		"🛌": "person-in-bed",
		"🧑‍🤝‍🧑": "people-holding-hands",
		"👭": "women-holding-hands",
		"👫": "woman-and-man-holding-hands",
		"👬": "men-holding-hands",
		"💏": "kiss",
		"👩‍❤️‍💋‍👨": "kiss-woman,-man",
		"👨‍❤️‍💋‍👨": "kiss-man,-man",
		"👩‍❤️‍💋‍👩": "kiss-woman,-woman",
		"💑": "couple-with-heart",
		"👩‍❤️‍👨": "couple-with-heart-woman,-man",
		"👨‍❤️‍👨": "couple-with-heart-man,-man",
		"👩‍❤️‍👩": "couple-with-heart-woman,-woman",
		"👪": "family",
		"👨‍👩‍👦": "family-man,-woman,-boy",
		"👨‍👩‍👧": "family-man,-woman,-girl",
		"👨‍👩‍👧‍👦": "family-man,-woman,-girl,-boy",
		"👨‍👩‍👦‍👦": "family-man,-woman,-boy,-boy",
		"👨‍👩‍👧‍👧": "family-man,-woman,-girl,-girl",
		"👨‍👨‍👦": "family-man,-man,-boy",
		"👨‍👨‍👧": "family-man,-man,-girl",
		"👨‍👨‍👧‍👦": "family-man,-man,-girl,-boy",
		"👨‍👨‍👦‍👦": "family-man,-man,-boy,-boy",
		"👨‍👨‍👧‍👧": "family-man,-man,-girl,-girl",
		"👩‍👩‍👦": "family-woman,-woman,-boy",
		"👩‍👩‍👧": "family-woman,-woman,-girl",
		"👩‍👩‍👧‍👦": "family-woman,-woman,-girl,-boy",
		"👩‍👩‍👦‍👦": "family-woman,-woman,-boy,-boy",
		"👩‍👩‍👧‍👧": "family-woman,-woman,-girl,-girl",
		"👨‍👦": "family-man,-boy",
		"👨‍👦‍👦": "family-man,-boy,-boy",
		"👨‍👧": "family-man,-girl",
		"👨‍👧‍👦": "family-man,-girl,-boy",
		"👨‍👧‍👧": "family-man,-girl,-girl",
		"👩‍👦": "family-woman,-boy",
		"👩‍👦‍👦": "family-woman,-boy,-boy",
		"👩‍👧": "family-woman,-girl",
		"👩‍👧‍👦": "family-woman,-girl,-boy",
		"👩‍👧‍👧": "family-woman,-girl,-girl",
		"🗣": "speaking-head",
		"👤": "bust-in-silhouette",
		"👥": "busts-in-silhouette",
		"🫂": "people-hugging",
		"👣": "footprints",
		"🦰": "red-hair",
		"🦱": "curly-hair",
		"🦳": "white-hair",
		"🦲": "bald",
		"🐵": "monkey-face",
		"🐒": "monkey",
		"🦍": "gorilla",
		"🦧": "orangutan",
		"🐶": "dog-face",
		"🐕": "dog",
		"🦮": "guide-dog",
		"🐕‍🦺": "service-dog",
		"🐩": "poodle",
		"🐺": "wolf",
		"🦊": "fox",
		"🦝": "raccoon",
		"🐱": "cat-face",
		"🐈": "cat",
		"🐈‍⬛": "black-cat",
		"🦁": "lion",
		"🐯": "tiger-face",
		"🐅": "tiger",
		"🐆": "leopard",
		"🐴": "horse-face",
		"🫎": "⊛-moose",
		"🫏": "⊛-donkey",
		"🐎": "horse",
		"🦄": "unicorn",
		"🦓": "zebra",
		"🦌": "deer",
		"🦬": "bison",
		"🐮": "cow-face",
		"🐂": "ox",
		"🐃": "water-buffalo",
		"🐄": "cow",
		"🐷": "pig-face",
		"🐖": "pig",
		"🐗": "boar",
		"🐽": "pig-nose",
		"🐏": "ram",
		"🐑": "ewe",
		"🐐": "goat",
		"🐪": "camel",
		"🐫": "two-hump-camel",
		"🦙": "llama",
		"🦒": "giraffe",
		"🐘": "elephant",
		"🦣": "mammoth",
		"🦏": "rhinoceros",
		"🦛": "hippopotamus",
		"🐭": "mouse-face",
		"🐁": "mouse",
		"🐀": "rat",
		"🐹": "hamster",
		"🐰": "rabbit-face",
		"🐇": "rabbit",
		"🐿": "chipmunk",
		"🦫": "beaver",
		"🦔": "hedgehog",
		"🦇": "bat",
		"🐻": "bear",
		"🐻‍❄️": "polar-bear",
		"🐨": "koala",
		"🐼": "panda",
		"🦥": "sloth",
		"🦦": "otter",
		"🦨": "skunk",
		"🦘": "kangaroo",
		"🦡": "badger",
		"🐾": "paw-prints",
		"🦃": "turkey",
		"🐔": "chicken",
		"🐓": "rooster",
		"🐣": "hatching-chick",
		"🐤": "baby-chick",
		"🐥": "front-facing-baby-chick",
		"🐦": "bird",
		"🐧": "penguin",
		"🕊": "dove",
		"🦅": "eagle",
		"🦆": "duck",
		"🦢": "swan",
		"🦉": "owl",
		"🦤": "dodo",
		"🪶": "feather",
		"🦩": "flamingo",
		"🦚": "peacock",
		"🦜": "parrot",
		"🪽": "⊛-wing",
		"🐦‍⬛": "⊛-black-bird",
		"🪿": "⊛-goose",
		"🐸": "frog",
		"🐊": "crocodile",
		"🐢": "turtle",
		"🦎": "lizard",
		"🐍": "snake",
		"🐲": "dragon-face",
		"🐉": "dragon",
		"🦕": "sauropod",
		"🦖": "t-rex",
		"🐳": "spouting-whale",
		"🐋": "whale",
		"🐬": "dolphin",
		"🦭": "seal",
		"🐟": "fish",
		"🐠": "tropical-fish",
		"🐡": "blowfish",
		"🦈": "shark",
		"🐙": "octopus",
		"🐚": "spiral-shell",
		"🪸": "coral",
		"🪼": "⊛-jellyfish",
		"🐌": "snail",
		"🦋": "butterfly",
		"🐛": "bug",
		"🐜": "ant",
		"🐝": "honeybee",
		"🪲": "beetle",
		"🐞": "lady-beetle",
		"🦗": "cricket",
		"🪳": "cockroach",
		"🕷": "spider",
		"🕸": "spider-web",
		"🦂": "scorpion",
		"🦟": "mosquito",
		"🪰": "fly",
		"🪱": "worm",
		"🦠": "microbe",
		"💐": "bouquet",
		"🌸": "cherry-blossom",
		"💮": "white-flower",
		"🪷": "lotus",
		"🏵": "rosette",
		"🌹": "rose",
		"🥀": "wilted-flower",
		"🌺": "hibiscus",
		"🌻": "sunflower",
		"🌼": "blossom",
		"🌷": "tulip",
		"🪻": "⊛-hyacinth",
		"🌱": "seedling",
		"🪴": "potted-plant",
		"🌲": "evergreen-tree",
		"🌳": "deciduous-tree",
		"🌴": "palm-tree",
		"🌵": "cactus",
		"🌾": "sheaf-of-rice",
		"🌿": "herb",
		"☘": "shamrock",
		"🍀": "four-leaf-clover",
		"🍁": "maple-leaf",
		"🍂": "fallen-leaf",
		"🍃": "leaf-fluttering-in-wind",
		"🪹": "empty-nest",
		"🪺": "nest-with-eggs",
		"🍄": "mushroom",
		"🍇": "grapes",
		"🍈": "melon",
		"🍉": "watermelon",
		"🍊": "tangerine",
		"🍋": "lemon",
		"🍌": "banana",
		"🍍": "pineapple",
		"🥭": "mango",
		"🍎": "red-apple",
		"🍏": "green-apple",
		"🍐": "pear",
		"🍑": "peach",
		"🍒": "cherries",
		"🍓": "strawberry",
		"🫐": "blueberries",
		"🥝": "kiwi-fruit",
		"🍅": "tomato",
		"🫒": "olive",
		"🥥": "coconut",
		"🥑": "avocado",
		"🍆": "eggplant",
		"🥔": "potato",
		"🥕": "carrot",
		"🌽": "ear-of-corn",
		"🌶": "hot-pepper",
		"🫑": "bell-pepper",
		"🥒": "cucumber",
		"🥬": "leafy-green",
		"🥦": "broccoli",
		"🧄": "garlic",
		"🧅": "onion",
		"🥜": "peanuts",
		"🫘": "beans",
		"🌰": "chestnut",
		"🫚": "⊛-ginger-root",
		"🫛": "⊛-pea-pod",
		"🍞": "bread",
		"🥐": "croissant",
		"🥖": "baguette-bread",
		"🫓": "flatbread",
		"🥨": "pretzel",
		"🥯": "bagel",
		"🥞": "pancakes",
		"🧇": "waffle",
		"🧀": "cheese-wedge",
		"🍖": "meat-on-bone",
		"🍗": "poultry-leg",
		"🥩": "cut-of-meat",
		"🥓": "bacon",
		"🍔": "hamburger",
		"🍟": "french-fries",
		"🍕": "pizza",
		"🌭": "hot-dog",
		"🥪": "sandwich",
		"🌮": "taco",
		"🌯": "burrito",
		"🫔": "tamale",
		"🥙": "stuffed-flatbread",
		"🧆": "falafel",
		"🥚": "egg",
		"🍳": "cooking",
		"🥘": "shallow-pan-of-food",
		"🍲": "pot-of-food",
		"🫕": "fondue",
		"🥣": "bowl-with-spoon",
		"🥗": "green-salad",
		"🍿": "popcorn",
		"🧈": "butter",
		"🧂": "salt",
		"🥫": "canned-food",
		"🍱": "bento-box",
		"🍘": "rice-cracker",
		"🍙": "rice-ball",
		"🍚": "cooked-rice",
		"🍛": "curry-rice",
		"🍜": "steaming-bowl",
		"🍝": "spaghetti",
		"🍠": "roasted-sweet-potato",
		"🍢": "oden",
		"🍣": "sushi",
		"🍤": "fried-shrimp",
		"🍥": "fish-cake-with-swirl",
		"🥮": "moon-cake",
		"🍡": "dango",
		"🥟": "dumpling",
		"🥠": "fortune-cookie",
		"🥡": "takeout-box",
		"🦀": "crab",
		"🦞": "lobster",
		"🦐": "shrimp",
		"🦑": "squid",
		"🦪": "oyster",
		"🍦": "soft-ice-cream",
		"🍧": "shaved-ice",
		"🍨": "ice-cream",
		"🍩": "doughnut",
		"🍪": "cookie",
		"🎂": "birthday-cake",
		"🍰": "shortcake",
		"🧁": "cupcake",
		"🥧": "pie",
		"🍫": "chocolate-bar",
		"🍬": "candy",
		"🍭": "lollipop",
		"🍮": "custard",
		"🍯": "honey-pot",
		"🍼": "baby-bottle",
		"🥛": "glass-of-milk",
		"☕": "hot-beverage",
		"🫖": "teapot",
		"🍵": "teacup-without-handle",
		"🍶": "sake",
		"🍾": "bottle-with-popping-cork",
		"🍷": "wine-glass",
		"🍸": "cocktail-glass",
		"🍹": "tropical-drink",
		"🍺": "beer-mug",
		"🍻": "clinking-beer-mugs",
		"🥂": "clinking-glasses",
		"🥃": "tumbler-glass",
		"🫗": "pouring-liquid",
		"🥤": "cup-with-straw",
		"🧋": "bubble-tea",
		"🧃": "beverage-box",
		"🧉": "mate",
		"🧊": "ice",
		"🥢": "chopsticks",
		"🍽": "fork-and-knife-with-plate",
		"🍴": "fork-and-knife",
		"🥄": "spoon",
		"🔪": "kitchen-knife",
		"🫙": "jar",
		"🏺": "amphora",
		"🌍": "globe-showing-europe-africa",
		"🌎": "globe-showing-americas",
		"🌏": "globe-showing-asia-australia",
		"🌐": "globe-with-meridians",
		"🗺": "world-map",
		"🗾": "map-of-japan",
		"🧭": "compass",
		"🏔": "snow-capped-mountain",
		"⛰": "mountain",
		"🌋": "volcano",
		"🗻": "mount-fuji",
		"🏕": "camping",
		"🏖": "beach-with-umbrella",
		"🏜": "desert",
		"🏝": "desert-island",
		"🏞": "national-park",
		"🏟": "stadium",
		"🏛": "classical-building",
		"🏗": "building-construction",
		"🧱": "brick",
		"🪨": "rock",
		"🪵": "wood",
		"🛖": "hut",
		"🏘": "houses",
		"🏚": "derelict-house",
		"🏠": "house",
		"🏡": "house-with-garden",
		"🏢": "office-building",
		"🏣": "japanese-post-office",
		"🏤": "post-office",
		"🏥": "hospital",
		"🏦": "bank",
		"🏨": "hotel",
		"🏩": "love-hotel",
		"🏪": "convenience-store",
		"🏫": "school",
		"🏬": "department-store",
		"🏭": "factory",
		"🏯": "japanese-castle",
		"🏰": "castle",
		"💒": "wedding",
		"🗼": "tokyo-tower",
		"🗽": "statue-of-liberty",
		"⛪": "church",
		"🕌": "mosque",
		"🛕": "hindu-temple",
		"🕍": "synagogue",
		"⛩": "shinto-shrine",
		"🕋": "kaaba",
		"⛲": "fountain",
		"⛺": "tent",
		"🌁": "foggy",
		"🌃": "night-with-stars",
		"🏙": "cityscape",
		"🌄": "sunrise-over-mountains",
		"🌅": "sunrise",
		"🌆": "cityscape-at-dusk",
		"🌇": "sunset",
		"🌉": "bridge-at-night",
		"♨": "hot-springs",
		"🎠": "carousel-horse",
		"🛝": "playground-slide",
		"🎡": "ferris-wheel",
		"🎢": "roller-coaster",
		"💈": "barber-pole",
		"🎪": "circus-tent",
		"🚂": "locomotive",
		"🚃": "railway-car",
		"🚄": "high-speed-train",
		"🚅": "bullet-train",
		"🚆": "train",
		"🚇": "metro",
		"🚈": "light-rail",
		"🚉": "station",
		"🚊": "tram",
		"🚝": "monorail",
		"🚞": "mountain-railway",
		"🚋": "tram-car",
		"🚌": "bus",
		"🚍": "oncoming-bus",
		"🚎": "trolleybus",
		"🚐": "minibus",
		"🚑": "ambulance",
		"🚒": "fire-engine",
		"🚓": "police-car",
		"🚔": "oncoming-police-car",
		"🚕": "taxi",
		"🚖": "oncoming-taxi",
		"🚗": "automobile",
		"🚘": "oncoming-automobile",
		"🚙": "sport-utility-vehicle",
		"🛻": "pickup-truck",
		"🚚": "delivery-truck",
		"🚛": "articulated-lorry",
		"🚜": "tractor",
		"🏎": "racing-car",
		"🏍": "motorcycle",
		"🛵": "motor-scooter",
		"🦽": "manual-wheelchair",
		"🦼": "motorized-wheelchair",
		"🛺": "auto-rickshaw",
		"🚲": "bicycle",
		"🛴": "kick-scooter",
		"🛹": "skateboard",
		"🛼": "roller-skate",
		"🚏": "bus-stop",
		"🛣": "motorway",
		"🛤": "railway-track",
		"🛢": "oil-drum",
		"⛽": "fuel-pump",
		"🛞": "wheel",
		"🚨": "police-car-light",
		"🚥": "horizontal-traffic-light",
		"🚦": "vertical-traffic-light",
		"🛑": "stop-sign",
		"🚧": "construction",
		"⚓": "anchor",
		"🛟": "ring-buoy",
		"⛵": "sailboat",
		"🛶": "canoe",
		"🚤": "speedboat",
		"🛳": "passenger-ship",
		"⛴": "ferry",
		"🛥": "motor-boat",
		"🚢": "ship",
		"✈": "airplane",
		"🛩": "small-airplane",
		"🛫": "airplane-departure",
		"🛬": "airplane-arrival",
		"🪂": "parachute",
		"💺": "seat",
		"🚁": "helicopter",
		"🚟": "suspension-railway",
		"🚠": "mountain-cableway",
		"🚡": "aerial-tramway",
		"🛰": "satellite",
		"🚀": "rocket",
		"🛸": "flying-saucer",
		"🛎": "bellhop-bell",
		"🧳": "luggage",
		"⌛": "hourglass-done",
		"⏳": "hourglass-not-done",
		"⌚": "watch",
		"⏰": "alarm-clock",
		"⏱": "stopwatch",
		"⏲": "timer-clock",
		"🕰": "mantelpiece-clock",
		"🕛": "twelve-o-clock",
		"🕧": "twelve-thirty",
		"🕐": "one-o-clock",
		"🕜": "one-thirty",
		"🕑": "two-o-clock",
		"🕝": "two-thirty",
		"🕒": "three-o-clock",
		"🕞": "three-thirty",
		"🕓": "four-o-clock",
		"🕟": "four-thirty",
		"🕔": "five-o-clock",
		"🕠": "five-thirty",
		"🕕": "six-o-clock",
		"🕡": "six-thirty",
		"🕖": "seven-o-clock",
		"🕢": "seven-thirty",
		"🕗": "eight-o-clock",
		"🕣": "eight-thirty",
		"🕘": "nine-o-clock",
		"🕤": "nine-thirty",
		"🕙": "ten-o-clock",
		"🕥": "ten-thirty",
		"🕚": "eleven-o-clock",
		"🕦": "eleven-thirty",
		"🌑": "new-moon",
		"🌒": "waxing-crescent-moon",
		"🌓": "first-quarter-moon",
		"🌔": "waxing-gibbous-moon",
		"🌕": "full-moon",
		"🌖": "waning-gibbous-moon",
		"🌗": "last-quarter-moon",
		"🌘": "waning-crescent-moon",
		"🌙": "crescent-moon",
		"🌚": "new-moon-face",
		"🌛": "first-quarter-moon-face",
		"🌜": "last-quarter-moon-face",
		"🌡": "thermometer",
		"☀": "sun",
		"🌝": "full-moon-face",
		"🌞": "sun-with-face",
		"🪐": "ringed-planet",
		"⭐": "star",
		"🌟": "glowing-star",
		"🌠": "shooting-star",
		"🌌": "milky-way",
		"☁": "cloud",
		"⛅": "sun-behind-cloud",
		"⛈": "cloud-with-lightning-and-rain",
		"🌤": "sun-behind-small-cloud",
		"🌥": "sun-behind-large-cloud",
		"🌦": "sun-behind-rain-cloud",
		"🌧": "cloud-with-rain",
		"🌨": "cloud-with-snow",
		"🌩": "cloud-with-lightning",
		"🌪": "tornado",
		"🌫": "fog",
		"🌬": "wind-face",
		"🌀": "cyclone",
		"🌈": "rainbow",
		"🌂": "closed-umbrella",
		"☂": "umbrella",
		"☔": "umbrella-with-rain-drops",
		"⛱": "umbrella-on-ground",
		"⚡": "high-voltage",
		"❄": "snowflake",
		"☃": "snowman",
		"⛄": "snowman-without-snow",
		"☄": "comet",
		"🔥": "fire",
		"💧": "droplet",
		"🌊": "water-wave",
		"🎃": "jack-o-lantern",
		"🎄": "christmas-tree",
		"🎆": "fireworks",
		"🎇": "sparkler",
		"🧨": "firecracker",
		"✨": "sparkles",
		"🎈": "balloon",
		"🎉": "party-popper",
		"🎊": "confetti-ball",
		"🎋": "tanabata-tree",
		"🎍": "pine-decoration",
		"🎎": "japanese-dolls",
		"🎏": "carp-streamer",
		"🎐": "wind-chime",
		"🎑": "moon-viewing-ceremony",
		"🧧": "red-envelope",
		"🎀": "ribbon",
		"🎁": "wrapped-gift",
		"🎗": "reminder-ribbon",
		"🎟": "admission-tickets",
		"🎫": "ticket",
		"🎖": "military-medal",
		"🏆": "trophy",
		"🏅": "sports-medal",
		"🥇": "1st-place-medal",
		"🥈": "2nd-place-medal",
		"🥉": "3rd-place-medal",
		"⚽": "soccer-ball",
		"⚾": "baseball",
		"🥎": "softball",
		"🏀": "basketball",
		"🏐": "volleyball",
		"🏈": "american-football",
		"🏉": "rugby-football",
		"🎾": "tennis",
		"🥏": "flying-disc",
		"🎳": "bowling",
		"🏏": "cricket-game",
		"🏑": "field-hockey",
		"🏒": "ice-hockey",
		"🥍": "lacrosse",
		"🏓": "ping-pong",
		"🏸": "badminton",
		"🥊": "boxing-glove",
		"🥋": "martial-arts-uniform",
		"🥅": "goal-net",
		"⛳": "flag-in-hole",
		"⛸": "ice-skate",
		"🎣": "fishing-pole",
		"🤿": "diving-mask",
		"🎽": "running-shirt",
		"🎿": "skis",
		"🛷": "sled",
		"🥌": "curling-stone",
		"🎯": "bullseye",
		"🪀": "yo-yo",
		"🪁": "kite",
		"🔫": "water-pistol",
		"🎱": "pool-8-ball",
		"🔮": "crystal-ball",
		"🪄": "magic-wand",
		"🎮": "video-game",
		"🕹": "joystick",
		"🎰": "slot-machine",
		"🎲": "game-die",
		"🧩": "puzzle-piece",
		"🧸": "teddy-bear",
		"🪅": "piñata",
		"🪩": "mirror-ball",
		"🪆": "nesting-dolls",
		"♠": "spade-suit",
		"♥": "heart-suit",
		"♦": "diamond-suit",
		"♣": "club-suit",
		"♟": "chess-pawn",
		"🃏": "joker",
		"🀄": "mahjong-red-dragon",
		"🎴": "flower-playing-cards",
		"🎭": "performing-arts",
		"🖼": "framed-picture",
		"🎨": "artist-palette",
		"🧵": "thread",
		"🪡": "sewing-needle",
		"🧶": "yarn",
		"🪢": "knot",
		"👓": "glasses",
		"🕶": "sunglasses",
		"🥽": "goggles",
		"🥼": "lab-coat",
		"🦺": "safety-vest",
		"👔": "necktie",
		"👕": "t-shirt",
		"👖": "jeans",
		"🧣": "scarf",
		"🧤": "gloves",
		"🧥": "coat",
		"🧦": "socks",
		"👗": "dress",
		"👘": "kimono",
		"🥻": "sari",
		"🩱": "one-piece-swimsuit",
		"🩲": "briefs",
		"🩳": "shorts",
		"👙": "bikini",
		"👚": "woman-s-clothes",
		"🪭": "⊛-folding-hand-fan",
		"👛": "purse",
		"👜": "handbag",
		"👝": "clutch-bag",
		"🛍": "shopping-bags",
		"🎒": "backpack",
		"🩴": "thong-sandal",
		"👞": "man-s-shoe",
		"👟": "running-shoe",
		"🥾": "hiking-boot",
		"🥿": "flat-shoe",
		"👠": "high-heeled-shoe",
		"👡": "woman-s-sandal",
		"🩰": "ballet-shoes",
		"👢": "woman-s-boot",
		"🪮": "⊛-hair-pick",
		"👑": "crown",
		"👒": "woman-s-hat",
		"🎩": "top-hat",
		"🎓": "graduation-cap",
		"🧢": "billed-cap",
		"🪖": "military-helmet",
		"⛑": "rescue-worker-s-helmet",
		"📿": "prayer-beads",
		"💄": "lipstick",
		"💍": "ring",
		"💎": "gem-stone",
		"🔇": "muted-speaker",
		"🔈": "speaker-low-volume",
		"🔉": "speaker-medium-volume",
		"🔊": "speaker-high-volume",
		"📢": "loudspeaker",
		"📣": "megaphone",
		"📯": "postal-horn",
		"🔔": "bell",
		"🔕": "bell-with-slash",
		"🎼": "musical-score",
		"🎵": "musical-note",
		"🎶": "musical-notes",
		"🎙": "studio-microphone",
		"🎚": "level-slider",
		"🎛": "control-knobs",
		"🎤": "microphone",
		"🎧": "headphone",
		"📻": "radio",
		"🎷": "saxophone",
		"🪗": "accordion",
		"🎸": "guitar",
		"🎹": "musical-keyboard",
		"🎺": "trumpet",
		"🎻": "violin",
		"🪕": "banjo",
		"🥁": "drum",
		"🪘": "long-drum",
		"🪇": "maracas",
		"🪈": "flute",
		"📱": "mobile-phone",
		"📲": "mobile-phone-with-arrow",
		"☎": "telephone",
		"📞": "telephone-receiver",
		"📟": "pager",
		"📠": "fax-machine",
		"🔋": "battery",
		"🪫": "low-battery",
		"🔌": "electric-plug",
		"💻": "laptop",
		"🖥": "desktop-computer",
		"🖨": "printer",
		"⌨": "keyboard",
		"🖱": "computer-mouse",
		"🖲": "trackball",
		"💽": "computer-disk",
		"💾": "floppy-disk",
		"💿": "optical-disk",
		"📀": "dvd",
		"🧮": "abacus",
		"🎥": "movie-camera",
		"🎞": "film-frames",
		"📽": "film-projector",
		"🎬": "clapper-board",
		"📺": "television",
		"📷": "camera",
		"📸": "camera-with-flash",
		"📹": "video-camera",
		"📼": "videocassette",
		"🔍": "magnifying-glass-tilted-left",
		"🔎": "magnifying-glass-tilted-right",
		"🕯": "candle",
		"💡": "light-bulb",
		"🔦": "flashlight",
		"🏮": "red-paper-lantern",
		"🪔": "diya-lamp",
		"📔": "notebook-with-decorative-cover",
		"📕": "closed-book",
		"📖": "open-book",
		"📗": "green-book",
		"📘": "blue-book",
		"📙": "orange-book",
		"📚": "books",
		"📓": "notebook",
		"📒": "ledger",
		"📃": "page-with-curl",
		"📜": "scroll",
		"📄": "page-facing-up",
		"📰": "newspaper",
		"🗞": "rolled-up-newspaper",
		"📑": "bookmark-tabs",
		"🔖": "bookmark",
		"🏷": "label",
		"💰": "money-bag",
		"🪙": "coin",
		"💴": "yen-banknote",
		"💵": "dollar-banknote",
		"💶": "euro-banknote",
		"💷": "pound-banknote",
		"💸": "money-with-wings",
		"💳": "credit-card",
		"🧾": "receipt",
		"💹": "chart-increasing-with-yen",
		"✉": "envelope",
		"📧": "e-mail",
		"📨": "incoming-envelope",
		"📩": "envelope-with-arrow",
		"📤": "outbox-tray",
		"📥": "inbox-tray",
		"📦": "package",
		"📫": "closed-mailbox-with-raised-flag",
		"📪": "closed-mailbox-with-lowered-flag",
		"📬": "open-mailbox-with-raised-flag",
		"📭": "open-mailbox-with-lowered-flag",
		"📮": "postbox",
		"🗳": "ballot-box-with-ballot",
		"✏": "pencil",
		"✒": "black-nib",
		"🖋": "fountain-pen",
		"🖊": "pen",
		"🖌": "paintbrush",
		"🖍": "crayon",
		"📝": "memo",
		"💼": "briefcase",
		"📁": "file-folder",
		"📂": "open-file-folder",
		"🗂": "card-index-dividers",
		"📅": "calendar",
		"📆": "tear-off-calendar",
		"🗒": "spiral-notepad",
		"🗓": "spiral-calendar",
		"📇": "card-index",
		"📈": "chart-increasing",
		"📉": "chart-decreasing",
		"📊": "bar-chart",
		"📋": "clipboard",
		"📌": "pushpin",
		"📍": "round-pushpin",
		"📎": "paperclip",
		"🖇": "linked-paperclips",
		"📏": "straight-ruler",
		"📐": "triangular-ruler",
		"✂": "scissors",
		"🗃": "card-file-box",
		"🗄": "file-cabinet",
		"🗑": "wastebasket",
		"🔒": "locked",
		"🔓": "unlocked",
		"🔏": "locked-with-pen",
		"🔐": "locked-with-key",
		"🔑": "key",
		"🗝": "old-key",
		"🔨": "hammer",
		"🪓": "axe",
		"⛏": "pick",
		"⚒": "hammer-and-pick",
		"🛠": "hammer-and-wrench",
		"🗡": "dagger",
		"⚔": "crossed-swords",
		"💣": "bomb",
		"🪃": "boomerang",
		"🏹": "bow-and-arrow",
		"🛡": "shield",
		"🪚": "carpentry-saw",
		"🔧": "wrench",
		"🪛": "screwdriver",
		"🔩": "nut-and-bolt",
		"⚙": "gear",
		"🗜": "clamp",
		"⚖": "balance-scale",
		"🦯": "white-cane",
		"🔗": "link",
		"⛓": "chains",
		"🪝": "hook",
		"🧰": "toolbox",
		"🧲": "magnet",
		"🪜": "ladder",
		"⚗": "alembic",
		"🧪": "test-tube",
		"🧫": "petri-dish",
		"🧬": "dna",
		"🔬": "microscope",
		"🔭": "telescope",
		"📡": "satellite-antenna",
		"💉": "syringe",
		"🩸": "drop-of-blood",
		"💊": "pill",
		"🩹": "adhesive-bandage",
		"🩼": "crutch",
		"🩺": "stethoscope",
		"🩻": "x-ray",
		"🚪": "door",
		"🛗": "elevator",
		"🪞": "mirror",
		"🪟": "window",
		"🛏": "bed",
		"🛋": "couch-and-lamp",
		"🪑": "chair",
		"🚽": "toilet",
		"🪠": "plunger",
		"🚿": "shower",
		"🛁": "bathtub",
		"🪤": "mouse-trap",
		"🪒": "razor",
		"🧴": "lotion-bottle",
		"🧷": "safety-pin",
		"🧹": "broom",
		"🧺": "basket",
		"🧻": "roll-of-paper",
		"🪣": "bucket",
		"🧼": "soap",
		"🫧": "bubbles",
		"🪥": "toothbrush",
		"🧽": "sponge",
		"🧯": "fire-extinguisher",
		"🛒": "shopping-cart",
		"🚬": "cigarette",
		"⚰": "coffin",
		"🪦": "headstone",
		"⚱": "funeral-urn",
		"🧿": "nazar-amulet",
		"🪬": "hamsa",
		"🗿": "moai",
		"🪧": "placard",
		"🪪": "identification-card",
		"🏧": "atm-sign",
		"🚮": "litter-in-bin-sign",
		"🚰": "potable-water",
		"♿": "wheelchair-symbol",
		"🚹": "men-s-room",
		"🚺": "women-s-room",
		"🚻": "restroom",
		"🚼": "baby-symbol",
		"🚾": "water-closet",
		"🛂": "passport-control",
		"🛃": "customs",
		"🛄": "baggage-claim",
		"🛅": "left-luggage",
		"⚠": "warning",
		"🚸": "children-crossing",
		"⛔": "no-entry",
		"🚫": "prohibited",
		"🚳": "no-bicycles",
		"🚭": "no-smoking",
		"🚯": "no-littering",
		"🚱": "non-potable-water",
		"🚷": "no-pedestrians",
		"📵": "no-mobile-phones",
		"🔞": "no-one-under-eighteen",
		"☢": "radioactive",
		"☣": "biohazard",
		"⬆": "up-arrow",
		"↗": "up-right-arrow",
		"➡": "right-arrow",
		"↘": "down-right-arrow",
		"⬇": "down-arrow",
		"↙": "down-left-arrow",
		"⬅": "left-arrow",
		"↖": "up-left-arrow",
		"↕": "up-down-arrow",
		"↔": "left-right-arrow",
		"↩": "right-arrow-curving-left",
		"↪": "left-arrow-curving-right",
		"⤴": "right-arrow-curving-up",
		"⤵": "right-arrow-curving-down",
		"🔃": "clockwise-vertical-arrows",
		"🔄": "counterclockwise-arrows-button",
		"🔙": "back-arrow",
		"🔚": "end-arrow",
		"🔛": "on!-arrow",
		"🔜": "soon-arrow",
		"🔝": "top-arrow",
		"🛐": "place-of-worship",
		"⚛": "atom-symbol",
		"🕉": "om",
		"✡": "star-of-david",
		"☸": "wheel-of-dharma",
		"☯": "yin-yang",
		"✝": "latin-cross",
		"☦": "orthodox-cross",
		"☪": "star-and-crescent",
		"☮": "peace-symbol",
		"🕎": "menorah",
		"🔯": "dotted-six-pointed-star",
		"🪯": "⊛-khanda",
		"♈": "aries",
		"♉": "taurus",
		"♊": "gemini",
		"♋": "cancer",
		"♌": "leo",
		"♍": "virgo",
		"♎": "libra",
		"♏": "scorpio",
		"♐": "sagittarius",
		"♑": "capricorn",
		"♒": "aquarius",
		"♓": "pisces",
		"⛎": "ophiuchus",
		"🔀": "shuffle-tracks-button",
		"🔁": "repeat-button",
		"🔂": "repeat-single-button",
		"▶": "play-button",
		"⏩": "fast-forward-button",
		"⏭": "next-track-button",
		"⏯": "play-or-pause-button",
		"◀": "reverse-button",
		"⏪": "fast-reverse-button",
		"⏮": "last-track-button",
		"🔼": "upwards-button",
		"⏫": "fast-up-button",
		"🔽": "downwards-button",
		"⏬": "fast-down-button",
		"⏸": "pause-button",
		"⏹": "stop-button",
		"⏺": "record-button",
		"⏏": "eject-button",
		"🎦": "cinema",
		"🔅": "dim-button",
		"🔆": "bright-button",
		"📶": "antenna-bars",
		"🛜": "⊛-wireless",
		"📳": "vibration-mode",
		"📴": "mobile-phone-off",
		"♀": "female-sign",
		"♂": "male-sign",
		"⚧": "transgender-symbol",
		"✖": "multiply",
		"➕": "plus",
		"➖": "minus",
		"➗": "divide",
		"🟰": "heavy-equals-sign",
		"♾": "infinity",
		"‼": "double-exclamation-mark",
		"⁉": "exclamation-question-mark",
		"❓": "red-question-mark",
		"❔": "white-question-mark",
		"❕": "white-exclamation-mark",
		"❗": "red-exclamation-mark",
		"〰": "wavy-dash",
		"💱": "currency-exchange",
		"💲": "heavy-dollar-sign",
		"⚕": "medical-symbol",
		"♻": "recycling-symbol",
		"⚜": "fleur-de-lis",
		"🔱": "trident-emblem",
		"📛": "name-badge",
		"🔰": "japanese-symbol-for-beginner",
		"⭕": "hollow-red-circle",
		"✅": "check-mark-button",
		"☑": "check-box-with-check",
		"✔": "check-mark",
		"❌": "cross-mark",
		"❎": "cross-mark-button",
		"➰": "curly-loop",
		"➿": "double-curly-loop",
		"〽": "part-alternation-mark",
		"✳": "eight-spoked-asterisk",
		"✴": "eight-pointed-star",
		"❇": "sparkle",
		"©": "copyright",
		"®": "registered",
		"™": "trade-mark",
		"#️⃣": "keycap-#",
		"*️⃣": "keycap-*",
		"0️⃣": "keycap-0",
		"1️⃣": "keycap-1",
		"2️⃣": "keycap-2",
		"3️⃣": "keycap-3",
		"4️⃣": "keycap-4",
		"5️⃣": "keycap-5",
		"6️⃣": "keycap-6",
		"7️⃣": "keycap-7",
		"8️⃣": "keycap-8",
		"9️⃣": "keycap-9",
		"🔟": "keycap-10",
		"🔠": "input-latin-uppercase",
		"🔡": "input-latin-lowercase",
		"🔢": "input-numbers",
		"🔣": "input-symbols",
		"🔤": "input-latin-letters",
		"🅰": "a-button-(blood-type)",
		"🆎": "ab-button-(blood-type)",
		"🅱": "b-button-(blood-type)",
		"🆑": "cl-button",
		"🆒": "cool-button",
		"🆓": "free-button",
		ℹ: "information",
		"🆔": "id-button",
		"Ⓜ": "circled-m",
		"🆕": "new-button",
		"🆖": "ng-button",
		"🅾": "o-button-(blood-type)",
		"🆗": "ok-button",
		"🅿": "p-button",
		"🆘": "sos-button",
		"🆙": "up!-button",
		"🆚": "vs-button",
		"🈁": "japanese-here-button",
		"🈂": "japanese-service-charge-button",
		"🈷": "japanese-monthly-amount-button",
		"🈶": "japanese-not-free-of-charge-button",
		"🈯": "japanese-reserved-button",
		"🉐": "japanese-bargain-button",
		"🈹": "japanese-discount-button",
		"🈚": "japanese-free-of-charge-button",
		"🈲": "japanese-prohibited-button",
		"🉑": "japanese-acceptable-button",
		"🈸": "japanese-application-button",
		"🈴": "japanese-passing-grade-button",
		"🈳": "japanese-vacancy-button",
		"㊗": "japanese-congratulations-button",
		"㊙": "japanese-secret-button",
		"🈺": "japanese-open-for-business-button",
		"🈵": "japanese-no-vacancy-button",
		"🔴": "red-circle",
		"🟠": "orange-circle",
		"🟡": "yellow-circle",
		"🟢": "green-circle",
		"🔵": "blue-circle",
		"🟣": "purple-circle",
		"🟤": "brown-circle",
		"⚫": "black-circle",
		"⚪": "white-circle",
		"🟥": "red-square",
		"🟧": "orange-square",
		"🟨": "yellow-square",
		"🟩": "green-square",
		"🟦": "blue-square",
		"🟪": "purple-square",
		"🟫": "brown-square",
		"⬛": "black-large-square",
		"⬜": "white-large-square",
		"◼": "black-medium-square",
		"◻": "white-medium-square",
		"◾": "black-medium-small-square",
		"◽": "white-medium-small-square",
		"▪": "black-small-square",
		"▫": "white-small-square",
		"🔶": "large-orange-diamond",
		"🔷": "large-blue-diamond",
		"🔸": "small-orange-diamond",
		"🔹": "small-blue-diamond",
		"🔺": "red-triangle-pointed-up",
		"🔻": "red-triangle-pointed-down",
		"💠": "diamond-with-a-dot",
		"🔘": "radio-button",
		"🔳": "white-square-button",
		"🔲": "black-square-button",
		"🏁": "chequered-flag",
		"🚩": "triangular-flag",
		"🎌": "crossed-flags",
		"🏴": "black-flag",
		"🏳": "white-flag",
		"🏳️‍🌈": "rainbow-flag",
		"🏳️‍⚧️": "transgender-flag",
		"🏴‍☠️": "pirate-flag",
		"🇦🇨": "flag-ascension-island",
		"🇦🇩": "flag-andorra",
		"🇦🇪": "flag-united-arab-emirates",
		"🇦🇫": "flag-afghanistan",
		"🇦🇬": "flag-antigua-and-barbuda",
		"🇦🇮": "flag-anguilla",
		"🇦🇱": "flag-albania",
		"🇦🇲": "flag-armenia",
		"🇦🇴": "flag-angola",
		"🇦🇶": "flag-antarctica",
		"🇦🇷": "flag-argentina",
		"🇦🇸": "flag-american-samoa",
		"🇦🇹": "flag-austria",
		"🇦🇺": "flag-australia",
		"🇦🇼": "flag-aruba",
		"🇦🇽": "flag-åland-islands",
		"🇦🇿": "flag-azerbaijan",
		"🇧🇦": "flag-bosnia-and-herzegovina",
		"🇧🇧": "flag-barbados",
		"🇧🇩": "flag-bangladesh",
		"🇧🇪": "flag-belgium",
		"🇧🇫": "flag-burkina-faso",
		"🇧🇬": "flag-bulgaria",
		"🇧🇭": "flag-bahrain",
		"🇧🇮": "flag-burundi",
		"🇧🇯": "flag-benin",
		"🇧🇱": "flag-st-barthelemy",
		"🇧🇲": "flag-bermuda",
		"🇧🇳": "flag-brunei",
		"🇧🇴": "flag-bolivia",
		"🇧🇶": "flag-caribbean-netherlands",
		"🇧🇷": "flag-brazil",
		"🇧🇸": "flag-bahamas",
		"🇧🇹": "flag-bhutan",
		"🇧🇻": "flag-bouvet-island",
		"🇧🇼": "flag-botswana",
		"🇧🇾": "flag-belarus",
		"🇧🇿": "flag-belize",
		"🇨🇦": "flag-canada",
		"🇨🇨": "flag-cocos-(keeling)-islands",
		"🇨🇩": "flag-congo---kinshasa",
		"🇨🇫": "flag-central-african-republic",
		"🇨🇬": "flag-congo---brazzaville",
		"🇨🇭": "flag-switzerland",
		"🇨🇮": "flag-côte-d-ivoire",
		"🇨🇰": "flag-cook-islands",
		"🇨🇱": "flag-chile",
		"🇨🇲": "flag-cameroon",
		"🇨🇳": "flag-china",
		"🇨🇴": "flag-colombia",
		"🇨🇵": "flag-clipperton-island",
		"🇨🇷": "flag-costa-rica",
		"🇨🇺": "flag-cuba",
		"🇨🇻": "flag-cape-verde",
		"🇨🇼": "flag-curaçao",
		"🇨🇽": "flag-christmas-island",
		"🇨🇾": "flag-cyprus",
		"🇨🇿": "flag-czechia",
		"🇩🇪": "flag-germany",
		"🇩🇬": "flag-diego-garcia",
		"🇩🇯": "flag-djibouti",
		"🇩🇰": "flag-denmark",
		"🇩🇲": "flag-dominica",
		"🇩🇴": "flag-dominican-republic",
		"🇩🇿": "flag-algeria",
		"🇪🇦": "flag-ceuta-and-melilla",
		"🇪🇨": "flag-ecuador",
		"🇪🇪": "flag-estonia",
		"🇪🇬": "flag-egypt",
		"🇪🇭": "flag-western-sahara",
		"🇪🇷": "flag-eritrea",
		"🇪🇸": "flag-spain",
		"🇪🇹": "flag-ethiopia",
		"🇪🇺": "flag-european-union",
		"🇫🇮": "flag-finland",
		"🇫🇯": "flag-fiji",
		"🇫🇰": "flag-falkland-islands",
		"🇫🇲": "flag-micronesia",
		"🇫🇴": "flag-faroe-islands",
		"🇫🇷": "flag-france",
		"🇬🇦": "flag-gabon",
		"🇬🇧": "flag-united-kingdom",
		"🇬🇩": "flag-grenada",
		"🇬🇪": "flag-georgia",
		"🇬🇫": "flag-french-guiana",
		"🇬🇬": "flag-guernsey",
		"🇬🇭": "flag-ghana",
		"🇬🇮": "flag-gibraltar",
		"🇬🇱": "flag-greenland",
		"🇬🇲": "flag-gambia",
		"🇬🇳": "flag-guinea",
		"🇬🇵": "flag-guadeloupe",
		"🇬🇶": "flag-equatorial-guinea",
		"🇬🇷": "flag-greece",
		"🇬🇸": "flag-south-georgia-and-south-sandwich-islands",
		"🇬🇹": "flag-guatemala",
		"🇬🇺": "flag-guam",
		"🇬🇼": "flag-guinea-bissau",
		"🇬🇾": "flag-guyana",
		"🇭🇰": "flag-hong-kong-sar-china",
		"🇭🇲": "flag-heard-and-mcdonald-islands",
		"🇭🇳": "flag-honduras",
		"🇭🇷": "flag-croatia",
		"🇭🇹": "flag-haiti",
		"🇭🇺": "flag-hungary",
		"🇮🇨": "flag-canary-islands",
		"🇮🇩": "flag-indonesia",
		"🇮🇪": "flag-ireland",
		"🇮🇱": "flag-israel",
		"🇮🇲": "flag-isle-of-man",
		"🇮🇳": "flag-india",
		"🇮🇴": "flag-british-indian-ocean-territory",
		"🇮🇶": "flag-iraq",
		"🇮🇷": "flag-iran",
		"🇮🇸": "flag-iceland",
		"🇮🇹": "flag-italy",
		"🇯🇪": "flag-jersey",
		"🇯🇲": "flag-jamaica",
		"🇯🇴": "flag-jordan",
		"🇯🇵": "flag-japan",
		"🇰🇪": "flag-kenya",
		"🇰🇬": "flag-kyrgyzstan",
		"🇰🇭": "flag-cambodia",
		"🇰🇮": "flag-kiribati",
		"🇰🇲": "flag-comoros",
		"🇰🇳": "flag-st-kitts-and-nevis",
		"🇰🇵": "flag-north-korea",
		"🇰🇷": "flag-south-korea",
		"🇰🇼": "flag-kuwait",
		"🇰🇾": "flag-cayman-islands",
		"🇰🇿": "flag-kazakhstan",
		"🇱🇦": "flag-laos",
		"🇱🇧": "flag-lebanon",
		"🇱🇨": "flag-st-lucia",
		"🇱🇮": "flag-liechtenstein",
		"🇱🇰": "flag-sri-lanka",
		"🇱🇷": "flag-liberia",
		"🇱🇸": "flag-lesotho",
		"🇱🇹": "flag-lithuania",
		"🇱🇺": "flag-luxembourg",
		"🇱🇻": "flag-latvia",
		"🇱🇾": "flag-libya",
		"🇲🇦": "flag-morocco",
		"🇲🇨": "flag-monaco",
		"🇲🇩": "flag-moldova",
		"🇲🇪": "flag-montenegro",
		"🇲🇫": "flag-st-martin",
		"🇲🇬": "flag-madagascar",
		"🇲🇭": "flag-marshall-islands",
		"🇲🇰": "flag-north-macedonia",
		"🇲🇱": "flag-mali",
		"🇲🇲": "flag-myanmar-(burma)",
		"🇲🇳": "flag-mongolia",
		"🇲🇴": "flag-macao-sar-china",
		"🇲🇵": "flag-northern-mariana-islands",
		"🇲🇶": "flag-martinique",
		"🇲🇷": "flag-mauritania",
		"🇲🇸": "flag-montserrat",
		"🇲🇹": "flag-malta",
		"🇲🇺": "flag-mauritius",
		"🇲🇻": "flag-maldives",
		"🇲🇼": "flag-malawi",
		"🇲🇽": "flag-mexico",
		"🇲🇾": "flag-malaysia",
		"🇲🇿": "flag-mozambique",
		"🇳🇦": "flag-namibia",
		"🇳🇨": "flag-new-caledonia",
		"🇳🇪": "flag-niger",
		"🇳🇫": "flag-norfolk-island",
		"🇳🇬": "flag-nigeria",
		"🇳🇮": "flag-nicaragua",
		"🇳🇱": "flag-netherlands",
		"🇳🇴": "flag-norway",
		"🇳🇵": "flag-nepal",
		"🇳🇷": "flag-nauru",
		"🇳🇺": "flag-niue",
		"🇳🇿": "flag-new-zealand",
		"🇴🇲": "flag-oman",
		"🇵🇦": "flag-panama",
		"🇵🇪": "flag-peru",
		"🇵🇫": "flag-french-polynesia",
		"🇵🇬": "flag-papua-new-guinea",
		"🇵🇭": "flag-philippines",
		"🇵🇰": "flag-pakistan",
		"🇵🇱": "flag-poland",
		"🇵🇲": "flag-st-pierre-and-miquelon",
		"🇵🇳": "flag-pitcairn-islands",
		"🇵🇷": "flag-puerto-rico",
		"🇵🇸": "flag-palestinian-territories",
		"🇵🇹": "flag-portugal",
		"🇵🇼": "flag-palau",
		"🇵🇾": "flag-paraguay",
		"🇶🇦": "flag-qatar",
		"🇷🇪": "flag-reunion",
		"🇷🇴": "flag-romania",
		"🇷🇸": "flag-serbia",
		"🇷🇺": "flag-russia",
		"🇷🇼": "flag-rwanda",
		"🇸🇦": "flag-saudi-arabia",
		"🇸🇧": "flag-solomon-islands",
		"🇸🇨": "flag-seychelles",
		"🇸🇩": "flag-sudan",
		"🇸🇪": "flag-sweden",
		"🇸🇬": "flag-singapore",
		"🇸🇭": "flag-st-helena",
		"🇸🇮": "flag-slovenia",
		"🇸🇯": "flag-svalbard-and-jan-mayen",
		"🇸🇰": "flag-slovakia",
		"🇸🇱": "flag-sierra-leone",
		"🇸🇲": "flag-san-marino",
		"🇸🇳": "flag-senegal",
		"🇸🇴": "flag-somalia",
		"🇸🇷": "flag-suriname",
		"🇸🇸": "flag-south-sudan",
		"🇸🇹": "flag-são-tome-and-príncipe",
		"🇸🇻": "flag-el-salvador",
		"🇸🇽": "flag-sint-maarten",
		"🇸🇾": "flag-syria",
		"🇸🇿": "flag-eswatini",
		"🇹🇦": "flag-tristan-da-cunha",
		"🇹🇨": "flag-turks-and-caicos-islands",
		"🇹🇩": "flag-chad",
		"🇹🇫": "flag-french-southern-territories",
		"🇹🇬": "flag-togo",
		"🇹🇭": "flag-thailand",
		"🇹🇯": "flag-tajikistan",
		"🇹🇰": "flag-tokelau",
		"🇹🇱": "flag-timor-leste",
		"🇹🇲": "flag-turkmenistan",
		"🇹🇳": "flag-tunisia",
		"🇹🇴": "flag-tonga",
		"🇹🇷": "flag-turkey",
		"🇹🇹": "flag-trinidad-and-tobago",
		"🇹🇻": "flag-tuvalu",
		"🇹🇼": "flag-taiwan",
		"🇹🇿": "flag-tanzania",
		"🇺🇦": "flag-ukraine",
		"🇺🇬": "flag-uganda",
		"🇺🇲": "flag-us-outlying-islands",
		"🇺🇳": "flag-united-nations",
		"🇺🇸": "flag-united-states",
		"🇺🇾": "flag-uruguay",
		"🇺🇿": "flag-uzbekistan",
		"🇻🇦": "flag-vatican-city",
		"🇻🇨": "flag-st-vincent-and-grenadines",
		"🇻🇪": "flag-venezuela",
		"🇻🇬": "flag-british-virgin-islands",
		"🇻🇮": "flag-us-virgin-islands",
		"🇻🇳": "flag-vietnam",
		"🇻🇺": "flag-vanuatu",
		"🇼🇫": "flag-wallis-and-futuna",
		"🇼🇸": "flag-samoa",
		"🇽🇰": "flag-kosovo",
		"🇾🇪": "flag-yemen",
		"🇾🇹": "flag-mayotte",
		"🇿🇦": "flag-south-africa",
		"🇿🇲": "flag-zambia",
		"🇿🇼": "flag-zimbabwe",
		"🏴󠁧󠁢󠁥󠁮󠁧󠁿": "flag-england",
		"🏴󠁧󠁢󠁳󠁣󠁴󠁿": "flag-scotland",
		"🏴󠁧󠁢󠁷󠁬󠁳󠁿": "flag-wales"
	};
	const EMOJIS = Object.keys(EMOJI_NAMES);

	async function formatFilename(content, options, util) {
		let filename = (await evalTemplate(options.filenameTemplate, options, util, content)) || "";
		if (options.replaceEmojisInFilename) {
			EMOJIS.forEach(emoji => (filename = filename.replaceAll(emoji, " _" + EMOJI_NAMES[emoji] + "_ ")));
		}
		const replacementCharacter = options.filenameReplacementCharacter;
		filename = getValidFilename(filename, options.filenameReplacedCharacters, replacementCharacter);
		if (!options.backgroundSave) {
			filename = filename.replace(/\//g, replacementCharacter);
		}
		if (!options.keepFilename && ((options.filenameMaxLengthUnit == "bytes" && util.getContentSize(filename) > options.filenameMaxLength) || filename.length > options.filenameMaxLength)) {
			const extensionMatch = filename.match(/(\.[^.]{3,4})$/);
			const extension = extensionMatch && extensionMatch[0] && extensionMatch[0].length > 1 ? extensionMatch[0] : "";
			filename = options.filenameMaxLengthUnit == "bytes" ? await truncateText(filename, options.filenameMaxLength - extension.length) : filename.substring(0, options.filenameMaxLength - extension.length);
			filename = filename + "…" + extension;
		}
		if (!filename) {
			filename = "Unnamed page";
		}
		return filename;
	}

	async function evalTemplate(template = "", options, util, content, dontReplaceSlash) {
		const url = new URL(options.saveUrl);
		template = await evalTemplateVariable(template, "page-title", () => options.title || "No title", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-heading", () => options.info.heading || "No heading", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-language", () => options.info.lang || "No language", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-description", () => options.info.description || "No description", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-author", () => options.info.author || "No author", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-creator", () => options.info.creator || "No creator", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-publisher", () => options.info.publisher || "No publisher", dontReplaceSlash, options.filenameReplacementCharacter);
		await evalDate(options.saveDate);
		await evalDate(options.visitDate, "visit-");
		template = await evalTemplateVariable(template, "url-hash", () => url.hash.substring(1) || "No hash", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-host", () => url.host.replace(/\/$/, "") || "No host", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-hostname", () => url.hostname.replace(/\/$/, "") || "No hostname", dontReplaceSlash, options.filenameReplacementCharacter);
		const urlHref = decode(url.href);
		template = await evalTemplateVariable(template, "url-href", () => urlHref || "No href", dontReplaceSlash === undefined ? true : dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-href-digest-sha-1", urlHref ? async () => util.digest("SHA-1", urlHref) : "No href", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-href-flat", () => decode(url.href) || "No href", false, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-referrer", () => decode(options.referrer) || "No referrer", dontReplaceSlash === undefined ? true : dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-referrer-flat", () => decode(options.referrer) || "No referrer", false, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-password", () => url.password || "No password", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-pathname", () => decode(url.pathname).replace(/^\//, "").replace(/\/$/, "") || "No pathname", dontReplaceSlash === undefined ? true : dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-pathname-flat", () => decode(url.pathname) || "No pathname", false, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-port", () => url.port || "No port", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-protocol", () => url.protocol || "No protocol", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-search", () => url.search.substring(1) || "No search", dontReplaceSlash, options.filenameReplacementCharacter);
		const params = Array.from(new URLSearchParams(url.search));
		for (const [name, value] of params) {
			template = await evalTemplateVariable(template, "url-search-" + name, () => value || "", dontReplaceSlash, options.filenameReplacementCharacter);
		}
		template = template.replace(/{\s*url-search-[^}\s]*\s*}/gi, "");
		template = await evalTemplateVariable(template, "url-username", () => url.username || "No username", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "tab-id", () => String(options.tabId || "No tab id"), dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "tab-index", () => String(options.tabIndex || "No tab index"), dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-last-segment", () => decode(getLastSegment(url, options.filenameReplacementCharacter)) || "No last segment", dontReplaceSlash, options.filenameReplacementCharacter);
		if (content) {
			template = await evalTemplateVariable(template, "digest-sha-256", async () => util.digest("SHA-256", content), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await evalTemplateVariable(template, "digest-sha-384", async () => util.digest("SHA-384", content), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await evalTemplateVariable(template, "digest-sha-512", async () => util.digest("SHA-512", content), dontReplaceSlash, options.filenameReplacementCharacter);
		}
		const bookmarkFolder = (options.bookmarkFolders && options.bookmarkFolders.join("/")) || "";
		template = await evalTemplateVariable(template, "bookmark-pathname", () => bookmarkFolder, dontReplaceSlash === undefined ? true : dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "bookmark-pathname-flat", () => bookmarkFolder, false, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "profile-name", () => options.profileName, dontReplaceSlash, options.filenameReplacementCharacter);
		return template.trim();

		function decode(value) {
			try {
				return decodeURI(value);
			} catch (error) {
				return value;
			}
		}

		async function evalDate(date, prefix = "") {
			if (date) {
				template = await evalTemplateVariable(template, prefix + "datetime-iso", () => date.toISOString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "date-iso", () => date.toISOString().split("T")[0], dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "time-iso", () => date.toISOString().split("T")[1].split("Z")[0], dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "date-locale", () => date.toLocaleDateString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "time-locale", () => date.toLocaleTimeString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "day-locale", () => String(date.getDate()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "month-locale", () => String(date.getMonth() + 1).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "year-locale", () => String(date.getFullYear()), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "datetime-locale", () => date.toLocaleString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "datetime-utc", () => date.toUTCString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "day-utc", () => String(date.getUTCDate()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "month-utc", () => String(date.getUTCMonth() + 1).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "year-utc", () => String(date.getUTCFullYear()), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "hours-locale", () => String(date.getHours()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "minutes-locale", () => String(date.getMinutes()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "seconds-locale", () => String(date.getSeconds()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "hours-utc", () => String(date.getUTCHours()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "minutes-utc", () => String(date.getUTCMinutes()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "seconds-utc", () => String(date.getUTCSeconds()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "time-ms", () => String(date.getTime()), dontReplaceSlash, options.filenameReplacementCharacter);
			}
		}

		async function evalTemplateVariable(template, variableName, valueGetter, dontReplaceSlash, replacementCharacter) {
			let maxLength, maxCharLength;
			if (template) {
				const regExpVariable = "{\\s*" + variableName.replace(/\W|_/g, "[$&]") + "\\s*}";
				let replaceRegExp = new RegExp(regExpVariable + "\\[\\d+(ch)?\\]", "g");
				if (template.match(replaceRegExp)) {
					const matchedLength = template.match(replaceRegExp)[0];
					if (matchedLength.match(/\[(\d+)\]$/)) {
						maxLength = Number(matchedLength.match(/\[(\d+)\]$/)[1]);
						if (isNaN(maxLength) || maxLength <= 0) {
							maxLength = null;
						}
					} else {
						maxCharLength = Number(matchedLength.match(/\[(\d+)ch\]$/)[1]);
						if (isNaN(maxCharLength) || maxCharLength <= 0) {
							maxCharLength = null;
						}
					}
				} else {
					replaceRegExp = new RegExp(regExpVariable, "g");
				}
				if (template.match(replaceRegExp)) {
					let value = await valueGetter();
					if (!dontReplaceSlash) {
						value = value.replace(/\/+/g, replacementCharacter);
					}
					if (maxLength) {
						value = await truncateText(value, maxLength);
					} else if (maxCharLength) {
						value = value.substring(0, maxCharLength);
					}
					return template.replace(replaceRegExp, value);
				}
			}
			return template;
		}
	}

	function getLastSegment(url, replacementCharacter) {
		let lastSegmentMatch = url.pathname.match(/\/([^/]+)$/),
			lastSegment = lastSegmentMatch && lastSegmentMatch[0];
		if (!lastSegment) {
			lastSegmentMatch = url.href.match(/([^/]+)\/?$/);
			lastSegment = lastSegmentMatch && lastSegmentMatch[0];
		}
		if (!lastSegment) {
			lastSegmentMatch = lastSegment.match(/(.*)\.[^.]+$/);
			lastSegment = lastSegmentMatch && lastSegmentMatch[0];
		}
		if (!lastSegment) {
			lastSegment = url.hostname.replace(/\/+/g, replacementCharacter).replace(/\/$/, "");
		}
		lastSegmentMatch = lastSegment.match(/(.*)\.[^.]+$/);
		if (lastSegmentMatch && lastSegmentMatch[1]) {
			lastSegment = lastSegmentMatch[1];
		}
		lastSegment = lastSegment.replace(/\/$/, "").replace(/^\//, "");
		return lastSegment;
	}

	function getValidFilename(filename, replacedCharacters = DEFAULT_REPLACED_CHARACTERS$1, replacementCharacter = DEFAULT_REPLACEMENT_CHARACTER$1) {
		replacedCharacters.forEach(replacedCharacter => (filename = filename.replace(new RegExp("[" + replacedCharacter + "]+", "g"), replacementCharacter)));
		filename = filename
			.replace(/\.\.\//g, "")
			.replace(/^\/+/, "")
			.replace(/\/+/g, "/")
			.replace(/\/$/, "")
			.replace(/\.$/, "")
			.replace(/\.\//g, "." + replacementCharacter)
			.replace(/\/\./g, "/" + replacementCharacter);
		return filename;
	}

	function truncateText(content, maxSize) {
		const blob = new Blob([content]);
		const reader = new FileReader();
		reader.readAsText(blob.slice(0, maxSize));
		return new Promise((resolve, reject) => {
			reader.addEventListener(
				"load",
				() => {
					if (content.startsWith(reader.result)) {
						resolve(reader.result);
					} else {
						truncateText(content, maxSize - 1)
							.then(resolve)
							.catch(reject);
					}
				},
				false
			);
			reader.addEventListener("error", reject, false);
		});
	}

	var templateFormatter = /*#__PURE__*/Object.freeze({
		__proto__: null,
		formatFilename: formatFilename,
		evalTemplate: evalTemplate
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	var index = /*#__PURE__*/Object.freeze({
		__proto__: null,
		fontsMinifier: cssFontsMinifier,
		matchedRules: cssMatchedRules,
		mediasAltMinifier: cssMediasAltMinifier,
		cssRulesMinifier: cssRulesMinifier,
		imagesAltMinifier: htmlImagesAltMinifier,
		htmlMinifier: htmlMinifier,
		serializer: htmlSerializer,
		templateFormatter: templateFormatter
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 *
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or
	 *   modify it under the terms of the GNU Affero General Public License
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 *
	 *   The code in this file is distributed in the hope that it will be useful,
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
	 *   AGPL normally required by section 4, provided you include this license
	 *   notice and a URL through which recipients can access the Corresponding
	 *   Source.
	 */

	const DATA_URI_PREFIX$1 = "data:";
	const ABOUT_BLANK_URI$3 = "about:blank";
	const REGEXP_URL_HASH = /(#.+?)$/;
	const BLOB_URI_PREFIX$1 = "blob:";
	const HTTP_URI_PREFIX$1 = /^https?:\/\//;
	const FILE_URI_PREFIX$1 = /^file:\/\//;
	const EMPTY_URL$1 = /^https?:\/\/+\s*$/;
	const NOT_EMPTY_URL$1 = /^(https?:\/\/|file:\/\/|blob:).+/;
	const PREFIX_DATA_URI_IMAGE_SVG$1 = "data:image/svg+xml";
	const UTF8_CHARSET$3 = "utf-8";

	let util$3, cssTree;

	function getProcessorHelperCommonClass(utilInstance, cssTreeInstance) {
		util$3 = utilInstance;
		cssTree = cssTreeInstance;
		return ProcessorHelperCommon;
	}

	class ProcessorHelperCommon {
		setBackgroundImage(element, url, style) {
			element.style.setProperty("background-blend-mode", "normal", "important");
			element.style.setProperty("background-clip", "content-box", "important");
			element.style.setProperty("background-position", style && style["background-position"] ? style["background-position"] : "center", "important");
			element.style.setProperty("background-color", style && style["background-color"] ? style["background-color"] : "transparent", "important");
			element.style.setProperty("background-image", url, "important");
			element.style.setProperty("background-size", style && style["background-size"] ? style["background-size"] : "100% 100%", "important");
			element.style.setProperty("background-origin", "content-box", "important");
			element.style.setProperty("background-repeat", "no-repeat", "important");
		}

		async getStylesheetContent(resourceURL, options) {
			const content = await util$3.getContent(resourceURL, {
				inline: options.inline,
				maxResourceSize: options.maxResourceSize,
				maxResourceSizeEnabled: options.maxResourceSizeEnabled,
				validateTextContentType: true,
				frameId: options.frameId,
				charset: options.charset,
				resourceReferrer: options.resourceReferrer,
				baseURI: options.baseURI,
				blockMixedContent: options.blockMixedContent,
				expectedType: "stylesheet",
				acceptHeaders: options.acceptHeaders,
				networkTimeout: options.networkTimeout
			});
			if (!(matchCharsetEquals(content.data, content.charset) || matchCharsetEquals(content.data, options.charset))) {
				options = Object.assign({}, options, { charset: getCharset(content.data) });
				return util$3.getContent(resourceURL, {
					inline: options.inline,
					maxResourceSize: options.maxResourceSize,
					maxResourceSizeEnabled: options.maxResourceSizeEnabled,
					validateTextContentType: true,
					frameId: options.frameId,
					charset: options.charset,
					resourceReferrer: options.resourceReferrer,
					baseURI: options.baseURI,
					blockMixedContent: options.blockMixedContent,
					expectedType: "stylesheet",
					acceptHeaders: options.acceptHeaders,
					networkTimeout: options.networkTimeout
				});
			} else {
				return content;
			}
		}

		processShortcutIcons(doc) {
			let shortcutIcon = findShortcutIcon(Array.from(doc.querySelectorAll("link[href][rel=\"shortcut icon\"]")));
			if (!shortcutIcon) {
				shortcutIcon = findShortcutIcon(Array.from(doc.querySelectorAll("link[href][rel=\"icon\"]")));
			}
			if (!shortcutIcon) {
				shortcutIcon = findShortcutIcon(Array.from(doc.querySelectorAll("link[href][rel*=\"icon\"]")));
				if (shortcutIcon) {
					shortcutIcon.rel = "shortcut icon";
				}
			}
			if (shortcutIcon) {
				doc.querySelectorAll("link[href][rel*=\"icon\"]").forEach(linkElement => {
					if (linkElement != shortcutIcon) {
						linkElement.remove();
					}
				});
			}
		}

		removeSingleLineCssComments(stylesheet) {
			if (stylesheet.children) {
				const removedRules = [];
				for (let cssRule = stylesheet.children.head; cssRule; cssRule = cssRule.next) {
					const ruleData = cssRule.data;
					if (ruleData.type == "Raw" && ruleData.value && ruleData.value.trim().startsWith("//")) {
						removedRules.push(cssRule);
					}
				}
				removedRules.forEach(cssRule => stylesheet.children.remove(cssRule));
			}
		}

		replacePseudoClassDefined(stylesheet) {
			const removedSelectors = [];
			if (stylesheet.children) {
				for (let cssRule = stylesheet.children.head; cssRule; cssRule = cssRule.next) {
					const ruleData = cssRule.data;
					if (ruleData.type == "Rule" && ruleData.prelude && ruleData.prelude.children) {
						for (let selector = ruleData.prelude.children.head; selector; selector = selector.next) {
							replacePseudoDefinedSelector(selector, ruleData.prelude);
						}
					}
				}
			}
			if (removedSelectors.length) {
				removedSelectors.forEach(({ parentSelector, selector }) => {
					if (parentSelector.data.children.size == 0 || !selector.prev || selector.prev.data.type == "Combinator" || selector.prev.data.type == "WhiteSpace") {
						parentSelector.data.children.replace(selector, cssTree.parse("*", { context: "selector" }).children.head);
					} else {
						parentSelector.data.children.remove(selector);
					}
				});
			}

			function replacePseudoDefinedSelector(selector, parentSelector) {
				if (selector.data.children) {
					for (let childSelector = selector.data.children.head; childSelector; childSelector = childSelector.next) {
						replacePseudoDefinedSelector(childSelector, selector);
					}
				}
				if (selector.data.type == "PseudoClassSelector" && selector.data.name == "defined") {
					removedSelectors.push({ parentSelector, selector });
				}
			}
		}

		resolveStylesheetURLs(stylesheet, baseURI, workStylesheet) {
			const urls = getUrlFunctions(stylesheet);
			urls.map(urlNode => {
				const originalResourceURL = urlNode.value;
				let resourceURL = normalizeURL$1(originalResourceURL);
				if (!testIgnoredPath$1(resourceURL)) {
					workStylesheet.textContent = "tmp { content:\"" + resourceURL + "\"}";
					if (workStylesheet.sheet && workStylesheet.sheet.cssRules) {
						resourceURL = util$3.removeQuotes(workStylesheet.sheet.cssRules[0].style.getPropertyValue("content"));
					}
					if (!testIgnoredPath$1(resourceURL)) {
						if (!resourceURL || testValidPath$1(resourceURL)) {
							let resolvedURL;
							if (!originalResourceURL.startsWith("#")) {
								try {
									resolvedURL = util$3.resolveURL(resourceURL, baseURI);
								} catch (error) {
									// ignored
								}
							}
							if (testValidURL$1(resolvedURL)) {
								urlNode.value = resolvedURL;
							}
						} else {
							urlNode.value = util$3.EMPTY_RESOURCE;
						}
					}
				}
			});
		}

		async processXLinks(resourceElements, doc, baseURI, options, batchRequest) {
			let attributeName = "xlink:href";
			await Promise.all(Array.from(resourceElements).map(async resourceElement => {
				let originalResourceURL = resourceElement.getAttribute(attributeName);
				if (originalResourceURL == null) {
					attributeName = "href";
					originalResourceURL = resourceElement.getAttribute(attributeName);
				}
				if (options.saveOriginalURLs && !isDataURL$1(originalResourceURL)) {
					resourceElement.setAttribute("data-sf-original-href", originalResourceURL);
				}
				let resourceURL = normalizeURL$1(originalResourceURL);
				if (!options.blockImages) {
					if (testValidPath$1(resourceURL) && !testIgnoredPath$1(resourceURL)) {
						resourceElement.setAttribute(attributeName, util$3.EMPTY_RESOURCE);
						try {
							resourceURL = util$3.resolveURL(resourceURL, baseURI);
						} catch (error) {
							// ignored
						}
						if (testValidURL$1(resourceURL)) {
							const hashMatch = originalResourceURL.match(REGEXP_URL_HASH);
							if (originalResourceURL.startsWith(baseURI + "#")) {
								resourceElement.setAttribute(attributeName, hashMatch[0]);
							} else {
								const response = await batchRequest.addURL(resourceURL, { expectedType: "image" });
								const svgDoc = util$3.parseSVGContent(response.content);
								if (hashMatch && hashMatch[0]) {
									let symbolElement;
									try {
										symbolElement = svgDoc.querySelector(hashMatch[0]);
									} catch (error) {
										// ignored
									}
									if (symbolElement) {
										resourceElement.setAttribute(attributeName, hashMatch[0]);
										resourceElement.parentElement.insertBefore(symbolElement, resourceElement.parentElement.firstChild);
									}
								} else {
									const content = await batchRequest.addURL(resourceURL, { expectedType: "image" });
									resourceElement.setAttribute(attributeName, PREFIX_DATA_URI_IMAGE_SVG$1 + "," + content);
								}
							}
						}
					} else if (resourceURL == options.url) {
						resourceElement.setAttribute(attributeName, originalResourceURL.substring(resourceURL.length));
					}
				} else {
					resourceElement.setAttribute(attributeName, util$3.EMPTY_RESOURCE);
				}
			}));
		}
	}

	function getUpdatedResourceContent(resourceURL, content, options) {
		if (options.rootDocument && options.updatedResources[resourceURL]) {
			options.updatedResources[resourceURL].retrieved = true;
			return options.updatedResources[resourceURL].content;
		} else {
			return content.data || "";
		}
	}

	function normalizeURL$1(url) {
		if (!url || url.startsWith(DATA_URI_PREFIX$1)) {
			return url;
		} else {
			return url.split("#")[0];
		}
	}

	function matchCharsetEquals(stylesheetContent = "", charset = UTF8_CHARSET$3) {
		const stylesheetCharset = getCharset(stylesheetContent);
		if (stylesheetCharset) {
			return stylesheetCharset == charset.toLowerCase();
		} else {
			return true;
		}
	}

	function getCharset(stylesheetContent = "") {
		const match = stylesheetContent.match(/^@charset\s+"([^"]*)";/i);
		if (match && match[1]) {
			return match[1].toLowerCase().trim();
		}
	}

	function getUrlFunctions(declarationList) {
		return cssTree.findAll(declarationList, node => node.type == "Url");
	}

	function getImportFunctions(declarationList) {
		return cssTree.findAll(declarationList, node => node.type == "Atrule" && node.name == "import");
	}

	function findShortcutIcon(shortcutIcons) {
		shortcutIcons = shortcutIcons.filter(linkElement => linkElement.href != util$3.EMPTY_RESOURCE);
		shortcutIcons.sort((linkElement1, linkElement2) => (parseInt(linkElement2.sizes, 10) || 16) - (parseInt(linkElement1.sizes, 10) || 16));
		return shortcutIcons[0];
	}

	function isDataURL$1(url) {
		return url && (url.startsWith(DATA_URI_PREFIX$1) || url.startsWith(BLOB_URI_PREFIX$1));
	}

	function replaceOriginalURLs(stylesheetContent) {
		return stylesheetContent.replace(/url\(-sf-url-original\\\(\\"(.*?)\\"\\\)\\ /g, "/* original URL: $1 */url(");
	}

	function testIgnoredPath$1(resourceURL) {
		return resourceURL && (resourceURL.startsWith(DATA_URI_PREFIX$1) || resourceURL == ABOUT_BLANK_URI$3);
	}

	function testValidPath$1(resourceURL) {
		return resourceURL && !resourceURL.match(EMPTY_URL$1);
	}

	function testValidURL$1(resourceURL) {
		return testValidPath$1(resourceURL) && (resourceURL.match(HTTP_URI_PREFIX$1) || resourceURL.match(FILE_URI_PREFIX$1) || resourceURL.startsWith(BLOB_URI_PREFIX$1)) && resourceURL.match(NOT_EMPTY_URL$1);
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 *
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or
	 *   modify it under the terms of the GNU Affero General Public License
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 *
	 *   The code in this file is distributed in the hope that it will be useful,
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
	 *   AGPL normally required by section 4, provided you include this license
	 *   notice and a URL through which recipients can access the Corresponding
	 *   Source.
	 */

	const JSON$3 = globalThis.JSON;
	const FontFace$1 = globalThis.FontFace;
	const Set$2 = globalThis.Set;
	const setTimeout$1 = globalThis.setTimeout;
	const clearTimeout$1 = globalThis.clearTimeout;
	const Image = globalThis.Image;

	const ABOUT_BLANK_URI$2 = "about:blank";
	const UTF8_CHARSET$2 = "utf-8";
	const PREFIX_DATA_URI_IMAGE_SVG = "data:image/svg+xml";
	const PREFIXES_FORBIDDEN_DATA_URI = ["data:text/"];
	const SCRIPT_TAG_FOUND = /<script/gi;
	const NOSCRIPT_TAG_FOUND = /<noscript/gi;
	const CANVAS_TAG_FOUND = /<canvas/gi;
	const SINGLE_FILE_VARIABLE_NAME_PREFIX$1 = "--sf-img-";
	const SINGLE_FILE_VARIABLE_MAX_SIZE = 512 * 1024;

	const REGEXP_URL_SIMPLE_QUOTES_FN$1 = /url\s*\(\s*'(.*?)'\s*\)/i;
	const REGEXP_URL_DOUBLE_QUOTES_FN$1 = /url\s*\(\s*"(.*?)"\s*\)/i;
	const REGEXP_URL_NO_QUOTES_FN$1 = /url\s*\(\s*(.*?)\s*\)/i;
	const REGEXP_URL_FUNCTION$1 = /(url|local|-sf-url-original)\(.*?\)\s*(,|$)/g;
	const REGEXP_SIMPLE_QUOTES_STRING$1 = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING$1 = /^"(.*?)"$/;
	const REGEXP_URL_FUNCTION_WOFF$1 = /^url\(\s*["']?data:font\/(woff2?)/;
	const REGEXP_URL_FUNCTION_WOFF_ALT$1 = /^url\(\s*["']?data:application\/x-font-(woff)/;
	const REGEXP_FONT_FORMAT$1 = /\.([^.?#]+)((\?|#).*?)?$/;
	const REGEXP_FONT_FORMAT_VALUE$1 = /format\((.*?)\)\s*,?$/;
	const REGEXP_FONT_SRC$1 = /(.*?)\s*,?$/;
	const EMPTY_URL_SOURCE$1 = /^url\(["']?data:[^,]*,?["']?\)/;
	const LOCAL_SOURCE$1 = "local(";
	const MEDIA_ALL$1 = "all";
	const FONT_STRETCHES$1 = {
		"ultra-condensed": "50%",
		"extra-condensed": "62.5%",
		"condensed": "75%",
		"semi-condensed": "87.5%",
		"normal": "100%",
		"semi-expanded": "112.5%",
		"expanded": "125%",
		"extra-expanded": "150%",
		"ultra-expanded": "200%"
	};
	const FONT_MAX_LOAD_DELAY$1 = 5000;

	let util$2;

	function getProcessorHelperClass$2(utilInstance) {
		util$2 = utilInstance;
		const ProcessorHelperCommon = getProcessorHelperCommonClass(util$2, cssTree$1);

		return class ProcessorHelper extends ProcessorHelperCommon {
			async processPageResources(doc, baseURI, options, resources, styles, batchRequest) {
				const processAttributeArgs = [
					["link[href][rel*=\"icon\"]", "href", false, true],
					["object[type=\"image/svg+xml\"], object[type=\"image/svg-xml\"], object[data*=\".svg\"]", "data"],
					["img[src], input[src][type=image]", "src", true],
					["embed[src*=\".svg\"]", "src"],
					["video[poster]", "poster"],
					["*[background]", "background"],
					["image", "xlink:href"],
					["image", "href"]
				];
				if (options.blockImages) {
					doc.querySelectorAll("svg").forEach(element => element.remove());
				}
				let resourcePromises = processAttributeArgs.map(([selector, attributeName, processDuplicates, removeElementIfMissing]) =>
					this.processAttribute(doc.querySelectorAll(selector), attributeName, baseURI, options, "image", resources, styles, batchRequest, processDuplicates, removeElementIfMissing)
				);
				resourcePromises = resourcePromises.concat([
					this.processXLinks(doc.querySelectorAll("use"), doc, baseURI, options, batchRequest),
					this.processSrcset(doc.querySelectorAll("img[srcset], source[srcset]"), baseURI, options, batchRequest)
				]);
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("object[data*=\".pdf\"]"), "data", baseURI, options, null, resources, styles, batchRequest));
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("embed[src*=\".pdf\"]"), "src", baseURI, options, null, resources, styles, batchRequest));
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("audio[src], audio > source[src]"), "src", baseURI, options, "audio", resources, styles, batchRequest));
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("video[src], video > source[src]"), "src", baseURI, options, "video", resources, styles, batchRequest));
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("model[src]"), "src", baseURI, options, null, resources, styles, batchRequest));
				await Promise.all(resourcePromises);
				if (options.saveFavicon) {
					this.processShortcutIcons(doc);
				}
			}

			async processLinkElement(element, stylesheetInfo, stylesheets, baseURI, options, workStyleElement) {
				if (element.tagName.toUpperCase() == "LINK" && element.charset) {
					options.charset = element.charset;
				}
				await this.processStylesheetElement(element, stylesheetInfo, stylesheets, baseURI, options, workStyleElement);
			}

			async processStylesheetElement(element, stylesheetInfo, stylesheets, baseURI, options, workStyleElement) {
				let stylesheet;
				stylesheets.set(element, stylesheetInfo);
				if (!options.blockStylesheets) {
					if (element.tagName.toUpperCase() == "LINK") {
						stylesheet = await this.resolveLinkStylesheetURLs(element.href, baseURI, options, workStyleElement);
					} else {
						stylesheet = db(element.textContent, { context: "stylesheet", parseCustomProperty: true });
						const importFound = await this.resolveImportURLs(stylesheet, baseURI, options, workStyleElement);
						if (importFound) {
							stylesheet = db(gb(stylesheet), { context: "stylesheet", parseCustomProperty: true });
						}
					}
				}
				if (stylesheet && stylesheet.children) {
					if (options.compressCSS) {
						this.removeSingleLineCssComments(stylesheet);
					}
					this.replacePseudoClassDefined(stylesheet);
					stylesheetInfo.stylesheet = stylesheet;
				} else {
					stylesheets.delete(element);
				}
			}

			replaceStylesheets(doc, stylesheets, resources, options) {
				doc.querySelectorAll("style").forEach(styleElement => {
					const stylesheetInfo = stylesheets.get(styleElement);
					if (stylesheetInfo) {
						stylesheets.delete(styleElement);
						styleElement.textContent = this.generateStylesheetContent(stylesheetInfo.stylesheet, options);
						if (stylesheetInfo.mediaText) {
							styleElement.media = stylesheetInfo.mediaText;
						}
					} else {
						styleElement.remove();
					}
				});
				doc.querySelectorAll("link[rel*=stylesheet]").forEach(linkElement => {
					const stylesheetInfo = stylesheets.get(linkElement);
					if (stylesheetInfo) {
						stylesheets.delete(linkElement);
						const styleElement = doc.createElement("style");
						if (stylesheetInfo.mediaText) {
							styleElement.media = stylesheetInfo.mediaText;
						}
						styleElement.textContent = this.generateStylesheetContent(stylesheetInfo.stylesheet, options);
						linkElement.parentElement.replaceChild(styleElement, linkElement);
					} else {
						linkElement.remove();
					}
				});
			}

			async resolveImportURLs(stylesheet, baseURI, options, workStylesheet, importedStyleSheets = new Set$2()) {
				let importFound;
				this.resolveStylesheetURLs(stylesheet, baseURI, workStylesheet);
				const imports = getImportFunctions(stylesheet);
				await Promise.all(imports.map(async node => {
					const urlNode = kb(node, node => node.type == "Url") || kb(node, node => node.type == "String");
					if (urlNode) {
						let resourceURL = normalizeURL$1(urlNode.value);
						if (!testIgnoredPath$1(resourceURL) && testValidPath$1(resourceURL)) {
							urlNode.value = util$2.EMPTY_RESOURCE;
							try {
								resourceURL = util$2.resolveURL(resourceURL, baseURI);
							} catch (error) {
								// ignored
							}
							if (testValidURL$1(resourceURL) && !importedStyleSheets.has(resourceURL)) {
								options.inline = true;
								const content = await this.getStylesheetContent(resourceURL, options);
								resourceURL = content.resourceURL;
								content.data = getUpdatedResourceContent(resourceURL, content, options);
								if (content.data && content.data.match(/^<!doctype /i)) {
									content.data = "";
								}
								const mediaQueryListNode = kb(node, node => node.type == "MediaQueryList");
								if (mediaQueryListNode) {
									content.data = this.wrapMediaQuery(content.data, gb(mediaQueryListNode));
								}

								content.data = content.data.replace(/:defined/gi, "*");

								const importedStylesheet = db(content.data, { context: "stylesheet", parseCustomProperty: true });
								const ancestorStyleSheets = new Set$2(importedStyleSheets);
								ancestorStyleSheets.add(resourceURL);
								await this.resolveImportURLs(importedStylesheet, resourceURL, options, workStylesheet, ancestorStyleSheets);
								for (let keyName of Object.keys(importedStylesheet)) {
									node[keyName] = importedStylesheet[keyName];
								}
								importFound = true;
							}
						}
					}
				}));
				return importFound;
			}

			async resolveLinkStylesheetURLs(resourceURL, baseURI, options, workStylesheet) {
				resourceURL = normalizeURL$1(resourceURL);
				if (resourceURL && resourceURL != baseURI && resourceURL != ABOUT_BLANK_URI$2) {
					const content = await util$2.getContent(resourceURL, {
						inline: true,
						maxResourceSize: options.maxResourceSize,
						maxResourceSizeEnabled: options.maxResourceSizeEnabled,
						charset: options.charset,
						frameId: options.frameId,
						resourceReferrer: options.resourceReferrer,
						validateTextContentType: true,
						baseURI: baseURI,
						blockMixedContent: options.blockMixedContent,
						expectedType: "stylesheet",
						acceptHeaders: options.acceptHeaders,
						networkTimeout: options.networkTimeout
					});
					if (!(matchCharsetEquals(content.data, content.charset) || matchCharsetEquals(content.data, options.charset))) {
						options = Object.assign({}, options, { charset: getCharset(content.data) });
						return this.resolveLinkStylesheetURLs(resourceURL, baseURI, options, workStylesheet);
					}
					resourceURL = content.resourceURL;
					content.data = getUpdatedResourceContent(content.resourceURL, content, options);
					if (content.data && content.data.match(/^<!doctype /i)) {
						content.data = "";
					}

					content.data = content.data.replace(/:defined/gi, "*");

					let stylesheet = db(content.data, { context: "stylesheet", parseCustomProperty: true });
					const importFound = await this.resolveImportURLs(stylesheet, resourceURL, options, workStylesheet);
					if (importFound) {
						stylesheet = db(gb(stylesheet), { context: "stylesheet", parseCustomProperty: true });
					}
					return stylesheet;
				}
			}

			async processFrame(frameElement, pageData) {
				let sandbox = "allow-popups allow-top-navigation allow-top-navigation-by-user-activation";
				if (pageData.content.match(NOSCRIPT_TAG_FOUND) || pageData.content.match(CANVAS_TAG_FOUND) || pageData.content.match(SCRIPT_TAG_FOUND)) {
					sandbox += " allow-scripts allow-same-origin";
				}
				frameElement.setAttribute("sandbox", sandbox);
				if (frameElement.tagName.toUpperCase() == "OBJECT") {
					frameElement.setAttribute("data", "data:text/html," + pageData.content);
				} else {
					if (frameElement.tagName.toUpperCase() == "FRAME") {
						frameElement.setAttribute("src", "data:text/html," + pageData.content.replace(/%/g, "%25").replace(/#/g, "%23"));
					} else {
						frameElement.setAttribute("srcdoc", pageData.content);
						frameElement.removeAttribute("src");
					}
				}
			}

			async processStylesheet(cssRules, baseURI, options, resources, batchRequest) {
				const promises = [];
				const removedRules = [];
				for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
					const ruleData = cssRule.data;
					if (ruleData.type == "Atrule" && ruleData.name == "charset") {
						removedRules.push(cssRule);
					} else if (ruleData.block && ruleData.block.children) {
						if (ruleData.type == "Rule") {
							promises.push(this.processStyle(ruleData, options, resources, batchRequest));
						} else if (ruleData.type == "Atrule" && (ruleData.name == "media" || ruleData.name == "supports")) {
							promises.push(this.processStylesheet(ruleData.block.children, baseURI, options, resources, batchRequest));
						} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
							promises.push(processFontFaceRule(ruleData));
						}
					}
				}
				removedRules.forEach(cssRule => cssRules.remove(cssRule));
				await Promise.all(promises);

				async function processFontFaceRule(ruleData) {
					const urls = getUrlFunctions(ruleData);
					await Promise.all(urls.map(async urlNode => {
						const originalResourceURL = urlNode.value;
						if (!options.blockFonts) {
							const resourceURL = normalizeURL$1(originalResourceURL);
							if (!testIgnoredPath$1(resourceURL) && testValidURL$1(resourceURL)) {
								let { content } = await batchRequest.addURL(resourceURL, { asBinary: true, expectedType: "font", baseURI, blockMixedContent: options.blockMixedContent });
								let resourceURLs = resources.fonts.get(urlNode);
								if (!resourceURLs) {
									resourceURLs = [];
									resources.fonts.set(urlNode, resourceURLs);
								}
								resourceURLs.push(resourceURL);
								if (!isDataURL$1(resourceURL) && options.saveOriginalURLs) {
									urlNode.value = "-sf-url-original(" + JSON$3.stringify(originalResourceURL) + ") " + content;
								} else {
									urlNode.value = content;
								}
							}
						} else {
							urlNode.value = util$2.EMPTY_RESOURCE;
						}
					}));
				}
			}

			async processStyle(ruleData, options, { cssVariables }, batchRequest) {
				const urls = getUrlFunctions(ruleData);
				await Promise.all(urls.map(async urlNode => {
					const originalResourceURL = urlNode.value;
					if (!options.blockImages) {
						const resourceURL = normalizeURL$1(originalResourceURL);
						if (!testIgnoredPath$1(resourceURL) && testValidURL$1(resourceURL)) {
							let { content, indexResource, duplicate } = await batchRequest.addURL(resourceURL, { asBinary: true, expectedType: "image", groupDuplicates: options.groupDuplicateImages });
							if (!originalResourceURL.startsWith("#")) {
								const maxSizeDuplicateImages = options.maxSizeDuplicateImages || SINGLE_FILE_VARIABLE_MAX_SIZE;
								if (duplicate && options.groupDuplicateImages && util$2.getContentSize(content) < maxSizeDuplicateImages) {
									const varNode = db("var(" + SINGLE_FILE_VARIABLE_NAME_PREFIX$1 + indexResource + ")", { context: "value" });
									for (let keyName of Object.keys(varNode.children.head.data)) {
										urlNode[keyName] = varNode.children.head.data[keyName];
									}
									cssVariables.set(indexResource, { content, url: originalResourceURL });
								} else {
									if (!isDataURL$1(resourceURL) && options.saveOriginalURLs) {
										urlNode.value = "-sf-url-original(" + JSON$3.stringify(originalResourceURL) + ") " + content;
									} else {
										urlNode.value = content;
									}
								}
							}
						}
					} else {
						urlNode.value = util$2.EMPTY_RESOURCE;
					}
				}));
			}

			async processAttribute(resourceElements, attributeName, baseURI, options, expectedType, { cssVariables }, styles, batchRequest, processDuplicates, removeElementIfMissing) {
				await Promise.all(Array.from(resourceElements).map(async resourceElement => {
					let resourceURL = resourceElement.getAttribute(attributeName);
					if (resourceURL != null) {
						resourceURL = normalizeURL$1(resourceURL);
						let originURL = resourceElement.dataset.singleFileOriginURL;
						if (options.saveOriginalURLs && !isDataURL$1(resourceURL)) {
							resourceElement.setAttribute("data-sf-original-" + attributeName, resourceURL);
						}
						delete resourceElement.dataset.singleFileOriginURL;
						if (!options["block" + expectedType.charAt(0).toUpperCase() + expectedType.substring(1) + "s"]) {
							if (!testIgnoredPath$1(resourceURL)) {
								setAttributeEmpty(resourceElement, attributeName, expectedType);
								if (testValidPath$1(resourceURL)) {
									try {
										resourceURL = util$2.resolveURL(resourceURL, baseURI);
									} catch (error) {
										// ignored
									}
									if (testValidURL$1(resourceURL)) {
										let { content, indexResource, duplicate } = await batchRequest.addURL(
											resourceURL,
											{ asBinary: true, expectedType, groupDuplicates: options.groupDuplicateImages && resourceElement.tagName.toUpperCase() == "IMG" && attributeName == "src" });
										if (originURL) {
											if (this.testEmptyResource(content)) {
												try {
													originURL = util$2.resolveURL(originURL, baseURI);
												} catch (error) {
													// ignored
												}
												try {
													resourceURL = originURL;
													content = (await util$2.getContent(resourceURL, {
														asBinary: true,
														inline: true,
														expectedType,
														maxResourceSize: options.maxResourceSize,
														maxResourceSizeEnabled: options.maxResourceSizeEnabled,
														frameId: options.windowId,
														resourceReferrer: options.resourceReferrer,
														acceptHeaders: options.acceptHeaders,
														networkTimeout: options.networkTimeout
													})).data;
												} catch (error) {
													// ignored
												}
											}
										}
										if (removeElementIfMissing && this.testEmptyResource(content)) {
											resourceElement.remove();
										} else if (!this.testEmptyResource(content)) {
											let forbiddenPrefixFound = PREFIXES_FORBIDDEN_DATA_URI.filter(prefixDataURI => content.startsWith(prefixDataURI)).length;
											if (expectedType == "image") {
												if (forbiddenPrefixFound && Image) {
													forbiddenPrefixFound = await new Promise((resolve) => {
														const image = new Image();
														const timeoutId = setTimeout$1(() => resolve(true), 100);
														image.src = content;
														image.onload = () => cleanupAndResolve();
														image.onerror = () => cleanupAndResolve(true);

														function cleanupAndResolve(value) {
															clearTimeout$1(timeoutId);
															resolve(value);
														}
													});
												}
												if (!forbiddenPrefixFound) {
													const isSVG = content.startsWith(PREFIX_DATA_URI_IMAGE_SVG);
													const maxSizeDuplicateImages = options.maxSizeDuplicateImages || SINGLE_FILE_VARIABLE_MAX_SIZE;
													if (processDuplicates && duplicate && !isSVG && util$2.getContentSize(content) < maxSizeDuplicateImages) {
														if (this.replaceImageSource(resourceElement, SINGLE_FILE_VARIABLE_NAME_PREFIX$1 + indexResource, options)) {
															cssVariables.set(indexResource, { content, url: originURL });
															const declarationList = db(resourceElement.getAttribute("style"), { context: "declarationList", parseCustomProperty: true });
															styles.set(resourceElement, declarationList);
														} else {
															resourceElement.setAttribute(attributeName, content);
														}
													} else {
														resourceElement.setAttribute(attributeName, content);
													}
												}
											} else {
												resourceElement.setAttribute(attributeName, content);
											}
										}
									}
								}
							}
						} else {
							setAttributeEmpty(resourceElement, attributeName, expectedType);
						}
					}
				}));

				function setAttributeEmpty(resourceElement, attributeName, expectedType) {
					if (expectedType == "video" || expectedType == "audio") {
						resourceElement.removeAttribute(attributeName);
					} else {
						resourceElement.setAttribute(attributeName, util$2.EMPTY_RESOURCE);
					}
				}
			}

			async processSrcset(resourceElements, baseURI, options, batchRequest) {
				await Promise.all(Array.from(resourceElements).map(async resourceElement => {
					const originSrcset = resourceElement.getAttribute("srcset");
					const srcset = util$2.parseSrcset(originSrcset);
					if (options.saveOriginalURLs && !isDataURL$1(originSrcset)) {
						resourceElement.setAttribute("data-sf-original-srcset", originSrcset);
					}
					if (!options.blockImages) {
						const srcsetValues = await Promise.all(srcset.map(async srcsetValue => {
							let resourceURL = normalizeURL$1(srcsetValue.url);
							if (!testIgnoredPath$1(resourceURL)) {
								if (testValidPath$1(resourceURL)) {
									try {
										resourceURL = util$2.resolveURL(resourceURL, baseURI);
									} catch (error) {
										// ignored
									}
									if (testValidURL$1(resourceURL)) {
										const { content } = await batchRequest.addURL(resourceURL, { asBinary: true, expectedType: "image" });
										const forbiddenPrefixFound = PREFIXES_FORBIDDEN_DATA_URI.filter(prefixDataURI => content.startsWith(prefixDataURI)).length;
										if (forbiddenPrefixFound) {
											return "";
										}
										return content + (srcsetValue.w ? " " + srcsetValue.w + "w" : srcsetValue.d ? " " + srcsetValue.d + "x" : "");
									} else {
										return "";
									}
								} else {
									return "";
								}
							} else {
								return resourceURL + (srcsetValue.w ? " " + srcsetValue.w + "w" : srcsetValue.d ? " " + srcsetValue.d + "x" : "");
							}
						}));
						resourceElement.setAttribute("srcset", srcsetValues.join(", "));
					} else {
						resourceElement.setAttribute("srcset", "");
					}
				}));
			}

			testEmptyResource(resource) {
				return resource == util$2.EMPTY_RESOURCE;
			}

			generateStylesheetContent(stylesheet, options) {
				let stylesheetContent = gb(stylesheet);
				if (options.compressCSS) {
					stylesheetContent = util$2.compressCSS(stylesheetContent);
				}
				if (options.saveOriginalURLs) {
					stylesheetContent = replaceOriginalURLs(stylesheetContent);
				}
				return stylesheetContent;
			}

			replaceImageSource(imgElement, variableName, options) {
				const attributeValue = imgElement.getAttribute(util$2.IMAGE_ATTRIBUTE_NAME);
				if (attributeValue) {
					const imageData = options.images[Number(imgElement.getAttribute(util$2.IMAGE_ATTRIBUTE_NAME))];
					if (imageData && imageData.replaceable) {
						imgElement.setAttribute("src", `${PREFIX_DATA_URI_IMAGE_SVG},<svg xmlns="http://www.w3.org/2000/svg" width="${imageData.size.pxWidth}" height="${imageData.size.pxHeight}"><rect fill-opacity="0"/></svg>`);
						const backgroundStyle = {};
						const backgroundSize = (imageData.objectFit == "content" || imageData.objectFit == "cover") && imageData.objectFit;
						if (backgroundSize) {
							backgroundStyle["background-size"] = imageData.objectFit;
						}
						if (imageData.objectPosition) {
							backgroundStyle["background-position"] = imageData.objectPosition;
						}
						if (imageData.backgroundColor) {
							backgroundStyle["background-color"] = imageData.backgroundColor;
						}
						this.setBackgroundImage(imgElement, "var(" + variableName + ")", backgroundStyle);
						imgElement.removeAttribute(util$2.IMAGE_ATTRIBUTE_NAME);
						return true;
					}
				}
			}

			wrapMediaQuery(stylesheetContent, mediaQuery) {
				if (mediaQuery) {
					return "@media " + mediaQuery + "{ " + stylesheetContent + " }";
				} else {
					return stylesheetContent;
				}
			}

			getAdditionalPageData() {
				return { };
			}

			removeAlternativeFonts(doc, stylesheets, fonts, fontTests) {
				return removeAlternativeFonts$1(doc, stylesheets, fonts, fontTests);
			}

			async processScript(element, resourceURL) {
				const content = await util$2.getContent(resourceURL, {
					asBinary: true,
					inline: true,
					charset: this.charset != UTF8_CHARSET$2 && this.charset,
					maxResourceSize: this.options.maxResourceSize,
					maxResourceSizeEnabled: this.options.maxResourceSizeEnabled,
					frameId: this.options.windowId,
					resourceReferrer: this.options.resourceReferrer,
					baseURI: this.options.baseURI,
					blockMixedContent: this.options.blockMixedContent,
					expectedType: "script",
					acceptHeaders: this.options.acceptHeaders,
					networkTimeout: this.options.networkTimeout
				});
				content.data = getUpdatedResourceContent(resourceURL, content, this.options);
				element.setAttribute("src", content.data);
			}

			setMetaCSP(metaElement) {
				metaElement.content = "default-src 'none'; font-src 'self' data:; img-src 'self' data:; style-src 'unsafe-inline'; media-src 'self' data:; script-src 'unsafe-inline' data:; object-src 'self' data:; frame-src 'self' data:;";
			}

			removeUnusedStylesheets(doc) {
				doc.querySelectorAll("link[rel*=stylesheet][rel*=alternate][title]").forEach(element => element.remove());
			}
		};
	}

	async function removeAlternativeFonts$1(doc, stylesheets, fontDeclarations, fontTests) {
		const fontsDetails = {
			fonts: new Map(),
			medias: new Map(),
			supports: new Map()
		};
		const stats = { rules: { processed: 0, discarded: 0 }, fonts: { processed: 0, discarded: 0 } };
		let sheetIndex = 0;
		stylesheets.forEach(stylesheetInfo => {
			const cssRules = stylesheetInfo.stylesheet.children;
			if (cssRules) {
				stats.rules.processed += cssRules.size;
				stats.rules.discarded += cssRules.size;
				if (stylesheetInfo.mediaText && stylesheetInfo.mediaText != MEDIA_ALL$1) {
					const mediaFontsDetails = createFontsDetailsInfo$1();
					fontsDetails.medias.set("media-" + sheetIndex + "-" + stylesheetInfo.mediaText, mediaFontsDetails);
					getFontsDetails$1(doc, cssRules, sheetIndex, mediaFontsDetails);
				} else {
					getFontsDetails$1(doc, cssRules, sheetIndex, fontsDetails);
				}
			}
			sheetIndex++;
		});
		processFontDetails$1(fontsDetails);
		await Promise.all([...stylesheets].map(async ([, stylesheetInfo], sheetIndex) => {
			const cssRules = stylesheetInfo.stylesheet.children;
			const media = stylesheetInfo.mediaText;
			if (cssRules) {
				if (media && media != MEDIA_ALL$1) {
					await processFontFaceRules$1(cssRules, sheetIndex, fontsDetails.medias.get("media-" + sheetIndex + "-" + media), fontDeclarations, fontTests, stats);
				} else {
					await processFontFaceRules$1(cssRules, sheetIndex, fontsDetails, fontDeclarations, fontTests, stats);
				}
				stats.rules.discarded -= cssRules.size;
			}
		}));
		return stats;
	}

	function getFontsDetails$1(doc, cssRules, sheetIndex, mediaFontsDetails) {
		let mediaIndex = 0, supportsIndex = 0;
		cssRules.forEach(ruleData => {
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.block.children && ruleData.prelude) {
				const mediaText = gb(ruleData.prelude);
				const fontsDetails = createFontsDetailsInfo$1();
				mediaFontsDetails.medias.set("media-" + sheetIndex + "-" + mediaIndex + "-" + mediaText, fontsDetails);
				mediaIndex++;
				getFontsDetails$1(doc, ruleData.block.children, sheetIndex, fontsDetails);
			} else if (ruleData.type == "Atrule" && ruleData.name == "supports" && ruleData.block && ruleData.block.children && ruleData.prelude) {
				const supportsText = gb(ruleData.prelude);
				const fontsDetails = createFontsDetailsInfo$1();
				mediaFontsDetails.supports.set("supports-" + sheetIndex + "-" + supportsIndex + "-" + supportsText, fontsDetails);
				supportsIndex++;
				getFontsDetails$1(doc, ruleData.block.children, sheetIndex, fontsDetails);
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face" && ruleData.block && ruleData.block.children) {
				const fontKey = getFontKey$1(ruleData);
				let fontInfo = mediaFontsDetails.fonts.get(fontKey);
				if (!fontInfo) {
					fontInfo = [];
					mediaFontsDetails.fonts.set(fontKey, fontInfo);
				}
				const src = getPropertyValue$1(ruleData, "src");
				if (src) {
					const fontSources = src.match(REGEXP_URL_FUNCTION$1);
					if (fontSources) {
						fontSources.forEach(source => fontInfo.unshift(source));
					}
				}
			}
		});
	}

	function processFontDetails$1(fontsDetails) {
		fontsDetails.fonts.forEach((fontInfo, fontKey) => {
			fontsDetails.fonts.set(fontKey, fontInfo.map(fontSource => {
				const fontFormatMatch = fontSource.match(REGEXP_FONT_FORMAT_VALUE$1);
				let fontFormat;
				const fontUrl = getURL$1(fontSource);
				if (fontFormatMatch && fontFormatMatch[1]) {
					fontFormat = fontFormatMatch[1].replace(REGEXP_SIMPLE_QUOTES_STRING$1, "$1").replace(REGEXP_DOUBLE_QUOTES_STRING$1, "$1").toLowerCase();
				}
				if (!fontFormat) {
					const fontFormatMatch = fontSource.match(REGEXP_URL_FUNCTION_WOFF$1);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					} else {
						const fontFormatMatch = fontSource.match(REGEXP_URL_FUNCTION_WOFF_ALT$1);
						if (fontFormatMatch && fontFormatMatch[1]) {
							fontFormat = fontFormatMatch[1];
						}
					}
				}
				if (!fontFormat && fontUrl) {
					const fontFormatMatch = fontUrl.match(REGEXP_FONT_FORMAT$1);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					}
				}
				return { src: fontSource.match(REGEXP_FONT_SRC$1)[1], fontUrl, format: fontFormat };
			}));
		});
		fontsDetails.medias.forEach(mediaFontsDetails => processFontDetails$1(mediaFontsDetails));
		fontsDetails.supports.forEach(supportsFontsDetails => processFontDetails$1(supportsFontsDetails));
	}

	async function processFontFaceRules$1(cssRules, sheetIndex, fontsDetails, fontDeclarations, fontTests, stats) {
		const removedRules = [];
		let mediaIndex = 0, supportsIndex = 0;
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.block.children && ruleData.prelude) {
				const mediaText = gb(ruleData.prelude);
				await processFontFaceRules$1(ruleData.block.children, sheetIndex, fontsDetails.medias.get("media-" + sheetIndex + "-" + mediaIndex + "-" + mediaText), fontDeclarations, fontTests, stats);
				mediaIndex++;
			} else if (ruleData.type == "Atrule" && ruleData.name == "supports" && ruleData.block && ruleData.block.children && ruleData.prelude) {
				const supportsText = gb(ruleData.prelude);
				await processFontFaceRules$1(ruleData.block.children, sheetIndex, fontsDetails.supports.get("supports-" + sheetIndex + "-" + supportsIndex + "-" + supportsText), fontDeclarations, fontTests, stats);
				supportsIndex++;
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
				const key = getFontKey$1(ruleData);
				const fontInfo = fontsDetails.fonts.get(key);
				if (fontInfo) {
					const processed = await processFontFaceRule$1(ruleData, fontInfo, fontDeclarations, fontTests, stats);
					if (processed) {
						fontsDetails.fonts.delete(key);
					}
				} else {
					removedRules.push(cssRule);
				}
			}
		}
		removedRules.forEach(cssRule => cssRules.remove(cssRule));
	}

	async function processFontFaceRule$1(ruleData, fontInfo, fontDeclarations, fontTests, stats) {
		const removedNodes = [];
		for (let node = ruleData.block.children.head; node; node = node.next) {
			if (node.data.property == "src") {
				removedNodes.push(node);
			}
		}
		removedNodes.pop();
		removedNodes.forEach(node => ruleData.block.children.remove(node));
		const srcDeclaration = ruleData.block.children.filter(node => node.property == "src").tail;
		if (srcDeclaration) {
			await Promise.all(fontInfo.map(async source => {
				if (fontTests.has(source.src)) {
					source.valid = fontTests.get(source.src);
				} else {
					if (FontFace$1 && source.fontUrl) {
						const fontFace = new FontFace$1("test-font", source.src);
						try {
							let timeout;
							await Promise.race([
								fontFace.load().then(() => fontFace.loaded).then(() => { source.valid = true; globalThis.clearTimeout(timeout); }),
								new Promise(resolve => timeout = globalThis.setTimeout(() => { source.valid = true; resolve(); }, FONT_MAX_LOAD_DELAY$1))
							]);
						} catch (error) {
							const urlNodes = vb(srcDeclaration.data, node => node.type == "Url");
							const declarationFontURLs = Array.from(fontDeclarations).find(([node]) => urlNodes.includes(node) && node.value == source.fontUrl);
							if (declarationFontURLs && declarationFontURLs[1].length) {
								const fontURL = declarationFontURLs[1][0];
								if (fontURL) {
									const fontFace = new FontFace$1("test-font", "url(" + fontURL + ")");
									try {
										let timeout;
										await Promise.race([
											fontFace.load().then(() => fontFace.loaded).then(() => { source.valid = true; globalThis.clearTimeout(timeout); }),
											new Promise(resolve => timeout = globalThis.setTimeout(() => { source.valid = true; resolve(); }, FONT_MAX_LOAD_DELAY$1))
										]);
									} catch (error) {
										// ignored
									}
								}
							} else {
								source.valid = true;
							}
						}
					} else {
						source.valid = true;
					}
					fontTests.set(source.src, source.valid);
				}
			}));
			const findSourceByFormat = (fontFormat, testValidity) => fontInfo.find(source => !source.src.match(EMPTY_URL_SOURCE$1) && source.format == fontFormat && (!testValidity || source.valid));
			const filterSources = fontSource => fontInfo.filter(source => source == fontSource || source.src.startsWith(LOCAL_SOURCE$1));
			stats.fonts.processed += fontInfo.length;
			stats.fonts.discarded += fontInfo.length;
			const woffFontFound =
				findSourceByFormat("woff2-variations", true) || findSourceByFormat("woff2", true) || findSourceByFormat("woff", true);
			if (woffFontFound) {
				fontInfo = filterSources(woffFontFound);
			} else {
				const ttfFontFound =
					findSourceByFormat("truetype-variations", true) || findSourceByFormat("truetype", true);
				if (ttfFontFound) {
					fontInfo = filterSources(ttfFontFound);
				} else {
					const otfFontFound =
						findSourceByFormat("opentype") || findSourceByFormat("embedded-opentype");
					if (otfFontFound) {
						fontInfo = filterSources(otfFontFound);
					} else {
						fontInfo = fontInfo.filter(source => !source.src.match(EMPTY_URL_SOURCE$1) && (source.valid) || source.src.startsWith(LOCAL_SOURCE$1));
					}
				}
			}
			stats.fonts.discarded -= fontInfo.length;
			fontInfo.reverse();
			try {
				srcDeclaration.data.value = db(fontInfo.map(fontSource => fontSource.src).join(","), { context: "value", parseCustomProperty: true });
			}
			catch (error) {
				// ignored
			}
			return true;
		} else {
			return false;
		}
	}

	function getPropertyValue$1(ruleData, propertyName) {
		let property;
		if (ruleData.block.children) {
			property = ruleData.block.children.filter(node => {
				try {
					return node.property == propertyName && !gb(node.value).match(/\\9$/);
				} catch (error) {
					return node.property == propertyName;
				}
			}).tail;
		}
		if (property) {
			try {
				return gb(property.data.value);
			} catch (error) {
				// ignored
			}
		}
	}

	function getFontKey$1(ruleData) {
		return JSON$3.stringify([
			normalizeFontFamily(getPropertyValue$1(ruleData, "font-family")),
			getFontWeight(getPropertyValue$1(ruleData, "font-weight") || "400"),
			getPropertyValue$1(ruleData, "font-style") || "normal",
			getPropertyValue$1(ruleData, "unicode-range"),
			getFontStretch$1(getPropertyValue$1(ruleData, "font-stretch")),
			getPropertyValue$1(ruleData, "font-variant") || "normal",
			getPropertyValue$1(ruleData, "font-feature-settings"),
			getPropertyValue$1(ruleData, "font-variation-settings")
		]);
	}

	function getFontStretch$1(stretch) {
		return FONT_STRETCHES$1[stretch] || stretch;
	}

	function createFontsDetailsInfo$1() {
		return {
			fonts: new Map(),
			medias: new Map(),
			supports: new Map()
		};
	}

	function getURL$1(urlFunction) {
		urlFunction = urlFunction.replace(/url\(-sf-url-original\\\(\\"(.*?)\\"\\\)\\ /g, "");
		const urlMatch = urlFunction.match(REGEXP_URL_SIMPLE_QUOTES_FN$1) ||
			urlFunction.match(REGEXP_URL_DOUBLE_QUOTES_FN$1) ||
			urlFunction.match(REGEXP_URL_NO_QUOTES_FN$1);
		return urlMatch && urlMatch[1];
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 *
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or
	 *   modify it under the terms of the GNU Affero General Public License
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 *
	 *   The code in this file is distributed in the hope that it will be useful,
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
	 *   AGPL normally required by section 4, provided you include this license
	 *   notice and a URL through which recipients can access the Corresponding
	 *   Source.
	 */

	const JSON$2 = globalThis.JSON;
	const FontFace = globalThis.FontFace;

	const ABOUT_BLANK_URI$1 = "about:blank";
	const UTF8_CHARSET$1 = "utf-8";

	const REGEXP_URL_SIMPLE_QUOTES_FN = /url\s*\(\s*'(.*?)'\s*\)/i;
	const REGEXP_URL_DOUBLE_QUOTES_FN = /url\s*\(\s*"(.*?)"\s*\)/i;
	const REGEXP_URL_NO_QUOTES_FN = /url\s*\(\s*(.*?)\s*\)/i;
	const REGEXP_URL_FUNCTION = /(url|local|-sf-url-original)\(.*?\)\s*(,|$)/g;
	const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;
	const REGEXP_URL_FUNCTION_WOFF = /^url\(\s*["']?data:font\/(woff2?)/;
	const REGEXP_URL_FUNCTION_WOFF_ALT = /^url\(\s*["']?data:application\/x-font-(woff)/;
	const REGEXP_FONT_FORMAT = /\.([^.?#]+)((\?|#).*?)?$/;
	const REGEXP_FONT_FORMAT_VALUE = /format\((.*?)\)\s*,?$/;
	const REGEXP_FONT_SRC = /(.*?)\s*,?$/;
	const EMPTY_URL_SOURCE = /^url\(["']?data:[^,]*,?["']?\)/;
	const LOCAL_SOURCE = "local(";
	const MEDIA_ALL = "all";
	const FONT_STRETCHES = {
		"ultra-condensed": "50%",
		"extra-condensed": "62.5%",
		"condensed": "75%",
		"semi-condensed": "87.5%",
		"normal": "100%",
		"semi-expanded": "112.5%",
		"expanded": "125%",
		"extra-expanded": "150%",
		"ultra-expanded": "200%"
	};
	const FONT_MAX_LOAD_DELAY = 5000;

	let util$1;

	function getProcessorHelperClass$1(utilInstance) {
		util$1 = utilInstance;
		const ProcessorHelperCommon = getProcessorHelperCommonClass(util$1, cssTree$1);

		return class ProcessorHelper extends ProcessorHelperCommon {
			async processPageResources(doc, baseURI, options, resources, styles, batchRequest) {
				const processAttributeArgs = [
					["link[href][rel*=\"icon\"]", "href", true],
					["object[type=\"image/svg+xml\"], object[type=\"image/svg-xml\"], object[data*=\".svg\"]", "data"],
					["img[src], input[src][type=image]", "src"],
					["embed[src*=\".svg\"]", "src"],
					["video[poster]", "poster"],
					["*[background]", "background"],
					["image", "xlink:href"],
					["image", "href"]
				];
				if (options.blockImages) {
					doc.querySelectorAll("svg").forEach(element => element.remove());
				}
				let resourcePromises = processAttributeArgs.map(([selector, attributeName, removeElementIfMissing]) =>
					this.processAttribute(doc.querySelectorAll(selector), attributeName, baseURI, options, "image", resources, batchRequest, removeElementIfMissing)
				);
				resourcePromises = resourcePromises.concat([
					this.processXLinks(doc.querySelectorAll("use"), doc, baseURI, options, batchRequest),
					this.processSrcset(doc.querySelectorAll("img[srcset], source[srcset]"), baseURI, options, resources, batchRequest)
				]);
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("object[data*=\".pdf\"]"), "data", baseURI, options, null, resources, batchRequest));
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("embed[src*=\".pdf\"]"), "src", baseURI, options, null, resources, batchRequest));
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("audio[src], audio > source[src]"), "src", baseURI, options, "audio", resources, batchRequest));
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("video[src], video > source[src]"), "src", baseURI, options, "video", resources, batchRequest));
				resourcePromises.push(this.processAttribute(doc.querySelectorAll("model[src]"), "src", baseURI, options, null, resources, batchRequest));
				await Promise.all(resourcePromises);
				if (options.saveFavicon) {
					this.processShortcutIcons(doc);
				}
			}

			async processLinkElement(element, stylesheetInfo, stylesheets, baseURI, options, workStyleElement, resources) {
				if (element.tagName.toUpperCase() == "LINK") {
					element.removeAttribute("integrity");
					if (element.charset) {
						options.charset = element.charset;
					}
					stylesheetInfo.url = element.href;
				}
				await this.processStylesheetElement(element, stylesheetInfo, stylesheets, baseURI, options, workStyleElement, resources);
			}

			async processStylesheetElement(element, stylesheetInfo, stylesheets, baseURI, options, workStyleElement, resources) {
				if (options.blockStylesheets) {
					if (element.tagName.toUpperCase() == "LINK") {
						element.href = util$1.EMPTY_RESOURCE;
					} else {
						element.textContent = "";
					}
				} else {
					if (element.tagName.toUpperCase() == "LINK") {
						await this.resolveLinkStylesheetURLs(stylesheetInfo, element, element.href, baseURI, options, workStyleElement, resources, stylesheets);
					} else {
						stylesheets.set({ element }, stylesheetInfo);
						stylesheetInfo.stylesheet = db(element.textContent, { context: "stylesheet", parseCustomProperty: true });
						await this.resolveImportURLs(stylesheetInfo, baseURI, options, workStyleElement, resources, stylesheets);
					}
				}
			}

			replaceStylesheets(doc, stylesheets, resources, options) {
				for (const [key, stylesheetInfo] of stylesheets) {
					if (key.urlNode) {
						const name = "stylesheet_" + resources.stylesheets.size + ".css";
						if (!isDataURL$1(stylesheetInfo.url) && options.saveOriginalURLs) {
							key.urlNode.value = "-sf-url-original(" + JSON$2.stringify(stylesheetInfo.url) + ") " + name;
						} else {
							key.urlNode.value = name;
						}
						resources.stylesheets.set(resources.stylesheets.size, { name, content: this.generateStylesheetContent(stylesheetInfo.stylesheet, options), url: stylesheetInfo.url });
					}
				}
				for (const [key, stylesheetInfo] of stylesheets) {
					if (key.element) {
						if (key.element.tagName.toUpperCase() == "LINK") {
							const linkElement = key.element;
							const name = "stylesheet_" + resources.stylesheets.size + ".css";
							linkElement.setAttribute("href", name);
							resources.stylesheets.set(resources.stylesheets.size, { name, content: this.generateStylesheetContent(stylesheetInfo.stylesheet, options), url: stylesheetInfo.url });
						} else {
							const styleElement = key.element;
							styleElement.textContent = this.generateStylesheetContent(stylesheetInfo.stylesheet, options);
						}
					}
				}
			}

			async resolveImportURLs(stylesheetInfo, baseURI, options, workStylesheet, resources, stylesheets) {
				const stylesheet = stylesheetInfo.stylesheet;
				const scoped = stylesheetInfo.scoped;
				this.resolveStylesheetURLs(stylesheet, baseURI, workStylesheet);
				const imports = getImportFunctions(stylesheet);
				await Promise.all(imports.map(async node => {
					const urlNode = kb(node, node => node.type == "Url") || kb(node, node => node.type == "String");
					if (urlNode) {
						let resourceURL = normalizeURL$1(urlNode.value);
						if (!testIgnoredPath$1(resourceURL) && testValidPath$1(resourceURL)) {
							urlNode.value = util$1.EMPTY_RESOURCE;
							try {
								resourceURL = util$1.resolveURL(resourceURL, baseURI);
							} catch (error) {
								// ignored
							}
							if (testValidURL$1(resourceURL)) {
								const mediaQueryListNode = kb(node, node => node.type == "MediaQueryList");
								let mediaText;
								if (mediaQueryListNode) {
									mediaText = gb(mediaQueryListNode);
								}
								const existingStylesheet = Array.from(stylesheets).find(([, stylesheetInfo]) => stylesheetInfo.resourceURL == resourceURL);
								if (existingStylesheet) {
									stylesheets.set({ urlNode }, {
										url: resourceURL,
										stylesheet: existingStylesheet[1].stylesheet, scoped
									});
								} else {
									const stylesheetInfo = {
										scoped,
										mediaText
									};
									stylesheets.set({ urlNode }, stylesheetInfo);
									const content = await this.getStylesheetContent(resourceURL, options);
									stylesheetInfo.url = resourceURL = content.resourceURL;
									const existingStylesheet = Array.from(stylesheets).find(([, stylesheetInfo]) => stylesheetInfo.resourceURL == resourceURL);
									if (existingStylesheet) {
										stylesheets.set({ urlNode }, { url: resourceURL, stylesheet: existingStylesheet[1].stylesheet, scoped });
									} else {
										content.data = getUpdatedResourceContent(resourceURL, content, options);
										stylesheetInfo.stylesheet = db(content.data, { context: "stylesheet", parseCustomProperty: true });
										await this.resolveImportURLs(stylesheetInfo, resourceURL, options, workStylesheet, resources, stylesheets);
									}
								}
							}
						}
					}
				}));
			}

			async resolveLinkStylesheetURLs(stylesheetInfo, element, resourceURL, baseURI, options, workStylesheet, resources, stylesheets) {
				resourceURL = normalizeURL$1(resourceURL);
				if (resourceURL && resourceURL != baseURI && resourceURL != ABOUT_BLANK_URI$1) {
					const existingStylesheet = Array.from(stylesheets).find(([, otherStylesheetInfo]) => otherStylesheetInfo.resourceURL == resourceURL);
					if (existingStylesheet) {
						stylesheets.set({ element }, {
							url: resourceURL,
							stylesheet: existingStylesheet[1].stylesheet,
							mediaText: stylesheetInfo.mediaText
						});
					} else {
						stylesheets.set({ element }, stylesheetInfo);
						const content = await util$1.getContent(resourceURL, {
							maxResourceSize: options.maxResourceSize,
							maxResourceSizeEnabled: options.maxResourceSizeEnabled,
							charset: options.charset,
							frameId: options.frameId,
							resourceReferrer: options.resourceReferrer,
							validateTextContentType: true,
							baseURI: baseURI,
							blockMixedContent: options.blockMixedContent,
							expectedType: "stylesheet",
							acceptHeaders: options.acceptHeaders,
							networkTimeout: options.networkTimeout
						});
						if (!(matchCharsetEquals(content.data, content.charset) || matchCharsetEquals(content.data, options.charset))) {
							options = Object.assign({}, options, { charset: getCharset(content.data) });
							this.resolveLinkStylesheetURLs(stylesheetInfo, element, resourceURL, baseURI, options, workStylesheet, resources, stylesheets);
						}
						resourceURL = content.resourceURL;
						if (existingStylesheet) {
							stylesheets.set({ element }, {
								url: resourceURL,
								stylesheet: existingStylesheet[1].stylesheet,
								mediaText: stylesheetInfo.mediaText
							});
						} else {
							content.data = getUpdatedResourceContent(content.resourceURL, content, options);
							stylesheetInfo.stylesheet = db(content.data, { context: "stylesheet", parseCustomProperty: true });
							await this.resolveImportURLs(stylesheetInfo, resourceURL, options, workStylesheet, resources, stylesheets);
						}
					}
				}
			}

			async processFrame(frameElement, pageData, resources, frameWindowId, frameData) {
				const name = "frames/" + resources.frames.size + "/";
				if (frameElement.tagName.toUpperCase() == "OBJECT") {
					frameElement.setAttribute("data", name + "index.html");
				} else {
					frameElement.setAttribute("src", name + "index.html");
				}
				resources.frames.set(frameWindowId, { name, content: pageData.content, resources: pageData.resources, url: frameData.url });
			}

			async processStylesheet(cssRules, baseURI, options, resources, batchRequest) {
				const promises = [];
				const removedRules = [];
				for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
					const ruleData = cssRule.data;
					if (ruleData.type == "Atrule" && ruleData.name == "charset") {
						removedRules.push(cssRule);
					} else if (ruleData.block && ruleData.block.children) {
						if (ruleData.type == "Rule") {
							promises.push(this.processStyle(ruleData, options, resources, batchRequest));
						} else if (ruleData.type == "Atrule" && (ruleData.name == "media" || ruleData.name == "supports")) {
							promises.push(this.processStylesheet(ruleData.block.children, baseURI, options, resources, batchRequest));
						} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
							promises.push(processFontFaceRule(ruleData));
						}
					}
				}
				removedRules.forEach(cssRule => cssRules.remove(cssRule));
				await Promise.all(promises);

				async function processFontFaceRule(ruleData) {
					const urls = getUrlFunctions(ruleData);
					await Promise.all(urls.map(async urlNode => {
						const originalResourceURL = urlNode.value;
						if (!options.blockFonts) {
							const resourceURL = normalizeURL$1(originalResourceURL);
							if (!testIgnoredPath$1(resourceURL) && testValidURL$1(resourceURL)) {
								let { content, extension, indexResource, contentType } = await batchRequest.addURL(resourceURL,
									{ asBinary: true, expectedType: "font", baseURI, blockMixedContent: options.blockMixedContent });
								const name = "fonts/" + indexResource + extension;
								if (!isDataURL$1(resourceURL) && options.saveOriginalURLs) {
									urlNode.value = "-sf-url-original(" + JSON$2.stringify(originalResourceURL) + ") " + name;
								} else {
									urlNode.value = name;
								}
								resources.fonts.set(indexResource, { name, content, extension, contentType, url: resourceURL });
							}
						} else {
							urlNode.value = util$1.EMPTY_RESOURCE;
						}
					}));
				}
			}

			async processStyle(ruleData, options, resources, batchRequest) {
				const urls = getUrlFunctions(ruleData);
				await Promise.all(urls.map(async urlNode => {
					const originalResourceURL = urlNode.value;
					if (!options.blockImages) {
						const resourceURL = normalizeURL$1(originalResourceURL);
						if (!testIgnoredPath$1(resourceURL) && testValidURL$1(resourceURL)) {
							let { content, indexResource, contentType, extension } = await batchRequest.addURL(resourceURL,
								{ asBinary: true, expectedType: "image" });
							const name = "images/" + indexResource + extension;
							if (!isDataURL$1(resourceURL) && options.saveOriginalURLs) {
								urlNode.value = "-sf-url-original(" + JSON$2.stringify(originalResourceURL) + ") " + name;
							} else {
								urlNode.value = name;
							}
							resources.images.set(indexResource, { name, content, extension, contentType, url: resourceURL });
						}
					} else {
						urlNode.value = util$1.EMPTY_RESOURCE;
					}
				}));
			}

			async processAttribute(resourceElements, attributeName, baseURI, options, expectedType, resources, batchRequest, removeElementIfMissing) {
				await Promise.all(Array.from(resourceElements).map(async resourceElement => {
					let resourceURL = resourceElement.getAttribute(attributeName);
					if (resourceURL != null) {
						resourceURL = normalizeURL$1(resourceURL);
						let originURL = resourceElement.dataset.singleFileOriginURL;
						if (options.saveOriginalURLs && !isDataURL$1(resourceURL)) {
							resourceElement.setAttribute("data-sf-original-" + attributeName, resourceURL);
						}
						delete resourceElement.dataset.singleFileOriginURL;
						if (!options["block" + expectedType.charAt(0).toUpperCase() + expectedType.substring(1) + "s"]) {
							if (!testIgnoredPath$1(resourceURL)) {
								setAttributeEmpty(resourceElement, attributeName, expectedType);
								if (testValidPath$1(resourceURL)) {
									try {
										resourceURL = util$1.resolveURL(resourceURL, baseURI);
									} catch (error) {
										// ignored
									}
									if (testValidURL$1(resourceURL)) {
										let { content, indexResource, extension, contentType } = await batchRequest.addURL(resourceURL,
											{ asBinary: true, expectedType });
										if (originURL) {
											if (this.testEmptyResource(content)) {
												try {
													originURL = util$1.resolveURL(originURL, baseURI);
												} catch (error) {
													// ignored
												}
												try {
													resourceURL = originURL;
													content = (await util$1.getContent(resourceURL, {
														asBinary: true,
														expectedType,
														maxResourceSize: options.maxResourceSize,
														maxResourceSizeEnabled: options.maxResourceSizeEnabled,
														frameId: options.windowId,
														resourceReferrer: options.resourceReferrer,
														acceptHeaders: options.acceptHeaders,
														networkTimeout: options.networkTimeout
													})).data;
												} catch (error) {
													// ignored
												}
											}
										}
										if (removeElementIfMissing && this.testEmptyResource(content)) {
											resourceElement.remove();
										} else if (!this.testEmptyResource(content)) {
											const name = "images/" + indexResource + extension;
											resourceElement.setAttribute(attributeName, name);
											resources.images.set(indexResource, { name, content, extension, contentType, url: resourceURL });
										}
									}
								}
							}
						} else {
							setAttributeEmpty(resourceElement, attributeName, expectedType);
						}
					}
				}));

				function setAttributeEmpty(resourceElement, attributeName, expectedType) {
					if (expectedType == "video" || expectedType == "audio") {
						resourceElement.removeAttribute(attributeName);
					} else {
						resourceElement.setAttribute(attributeName, util$1.EMPTY_RESOURCE);
					}
				}
			}

			async processSrcset(resourceElements, baseURI, options, resources, batchRequest) {
				await Promise.all(Array.from(resourceElements).map(async resourceElement => {
					const originSrcset = resourceElement.getAttribute("srcset");
					const srcset = util$1.parseSrcset(originSrcset);
					if (options.saveOriginalURLs && !isDataURL$1(originSrcset)) {
						resourceElement.setAttribute("data-sf-original-srcset", originSrcset);
					}
					if (!options.blockImages) {
						const srcsetValues = await Promise.all(srcset.map(async srcsetValue => {
							let resourceURL = normalizeURL$1(srcsetValue.url);
							if (!testIgnoredPath$1(resourceURL)) {
								if (testValidPath$1(resourceURL)) {
									try {
										resourceURL = util$1.resolveURL(resourceURL, baseURI);
									} catch (error) {
										// ignored
									}
									if (testValidURL$1(resourceURL)) {
										const { content, indexResource, extension, contentType } = await batchRequest.addURL(resourceURL, { asBinary: true, expectedType: "image" });
										const name = "images/" + indexResource + extension;
										resources.images.set(indexResource, { name, content, extension, contentType, url: resourceURL });
										return name + (srcsetValue.w ? " " + srcsetValue.w + "w" : srcsetValue.d ? " " + srcsetValue.d + "x" : "");
									} else {
										return "";
									}
								} else {
									return "";
								}
							} else {
								return resourceURL + (srcsetValue.w ? " " + srcsetValue.w + "w" : srcsetValue.d ? " " + srcsetValue.d + "x" : "");
							}
						}));
						resourceElement.setAttribute("srcset", srcsetValues.join(", "));
					} else {
						resourceElement.setAttribute("srcset", "");
					}
				}));
			}

			testEmptyResource(resource) {
				return !resource;
			}

			generateStylesheetContent(stylesheet, options) {
				if (options.compressCSS) {
					this.removeSingleLineCssComments(stylesheet);
				}
				this.replacePseudoClassDefined(stylesheet);
				let stylesheetContent = gb(stylesheet);
				if (options.compressCSS) {
					stylesheetContent = util$1.compressCSS(stylesheetContent);
				}
				if (options.saveOriginalURLs) {
					stylesheetContent = replaceOriginalURLs(stylesheetContent);
				}
				return stylesheetContent;
			}

			getAdditionalPageData(doc, content, pageResources) {
				const resources = {};
				let textContent = content;
				pageResources.stylesheets.forEach(resource => textContent += resource.content);
				Object.keys(pageResources).forEach(resourceType => {
					const unusedResources = Array.from(pageResources[resourceType]).filter(([, value]) => !textContent.includes(value.name));
					unusedResources.forEach(([indexResource]) => pageResources[resourceType].delete(indexResource));
					resources[resourceType] = Array.from(pageResources[resourceType].values());
				});
				const viewportElement = doc.head.querySelector("meta[name=viewport]");
				const viewport = viewportElement ? viewportElement.content : null;
				const doctype = util$1.getDoctypeString(doc);
				return {
					doctype,
					resources,
					viewport
				};
			}

			removeAlternativeFonts(doc, stylesheets, fontResources, fontTests) {
				return removeAlternativeFonts(doc, stylesheets, fontResources, fontTests);
			}

			async processScript(element, resourceURL) {
				const content = await util$1.getContent(resourceURL, {
					asBinary: true,
					charset: this.charset != UTF8_CHARSET$1 && this.charset,
					maxResourceSize: this.options.maxResourceSize,
					maxResourceSizeEnabled: this.options.maxResourceSizeEnabled,
					frameId: this.options.windowId,
					resourceReferrer: this.options.resourceReferrer,
					baseURI: this.options.baseURI,
					blockMixedContent: this.options.blockMixedContent,
					expectedType: "script",
					acceptHeaders: this.options.acceptHeaders,
					networkTimeout: this.options.networkTimeout
				});
				content.data = getUpdatedResourceContent(resourceURL, content, this.options);
				element.setAttribute("src", content.data);
			}

			setMetaCSP(metaElement) {
				metaElement.content = "default-src 'none'; font-src 'self' data: blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' data: blob:; frame-src 'self' data: blob:; media-src 'self' data: blob:; script-src 'self' 'unsafe-inline' data: blob:; object-src 'self' data: blob:;";
			}

			removeUnusedStylesheets() {
			}
		};
	}

	async function removeAlternativeFonts(doc, stylesheets, fontResources, fontTests) {
		const fontsDetails = {
			fonts: new Map(),
			medias: new Map(),
			supports: new Map()
		};
		const stats = { rules: { processed: 0, discarded: 0 }, fonts: { processed: 0, discarded: 0 } };
		let sheetIndex = 0;
		stylesheets.forEach(stylesheetInfo => {
			const cssRules = stylesheetInfo.stylesheet.children;
			if (cssRules) {
				stats.rules.processed += cssRules.size;
				stats.rules.discarded += cssRules.size;
				if (stylesheetInfo.mediaText && stylesheetInfo.mediaText != MEDIA_ALL) {
					const mediaFontsDetails = createFontsDetailsInfo();
					fontsDetails.medias.set("media-" + sheetIndex + "-" + stylesheetInfo.mediaText, mediaFontsDetails);
					getFontsDetails(doc, cssRules, sheetIndex, mediaFontsDetails);
				} else {
					getFontsDetails(doc, cssRules, sheetIndex, fontsDetails);
				}
			}
			sheetIndex++;
		});
		processFontDetails(fontsDetails, fontResources);
		await Promise.all([...stylesheets].map(async ([, stylesheetInfo], sheetIndex) => {
			const cssRules = stylesheetInfo.stylesheet.children;
			const media = stylesheetInfo.mediaText;
			if (cssRules) {
				if (media && media != MEDIA_ALL) {
					await processFontFaceRules(cssRules, sheetIndex, fontsDetails.medias.get("media-" + sheetIndex + "-" + media), fontResources, fontTests, stats);
				} else {
					await processFontFaceRules(cssRules, sheetIndex, fontsDetails, fontResources, fontTests, stats);
				}
				stats.rules.discarded -= cssRules.size;
			}
		}));
		return stats;
	}

	function getFontsDetails(doc, cssRules, sheetIndex, mediaFontsDetails) {
		let mediaIndex = 0, supportsIndex = 0;
		cssRules.forEach(ruleData => {
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.block.children && ruleData.prelude) {
				const mediaText = gb(ruleData.prelude);
				const fontsDetails = createFontsDetailsInfo();
				mediaFontsDetails.medias.set("media-" + sheetIndex + "-" + mediaIndex + "-" + mediaText, fontsDetails);
				mediaIndex++;
				getFontsDetails(doc, ruleData.block.children, sheetIndex, fontsDetails);
			} else if (ruleData.type == "Atrule" && ruleData.name == "supports" && ruleData.block && ruleData.block.children && ruleData.prelude) {
				const supportsText = gb(ruleData.prelude);
				const fontsDetails = createFontsDetailsInfo();
				mediaFontsDetails.supports.set("supports-" + sheetIndex + "-" + supportsIndex + "-" + supportsText, fontsDetails);
				supportsIndex++;
				getFontsDetails(doc, ruleData.block.children, sheetIndex, fontsDetails);
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face" && ruleData.block && ruleData.block.children) {
				const fontKey = getFontKey(ruleData);
				let fontInfo = mediaFontsDetails.fonts.get(fontKey);
				if (!fontInfo) {
					fontInfo = [];
					mediaFontsDetails.fonts.set(fontKey, fontInfo);
				}
				const src = getPropertyValue(ruleData, "src");
				if (src) {
					const fontSources = src.match(REGEXP_URL_FUNCTION);
					if (fontSources) {
						fontSources.forEach(source => fontInfo.unshift(source));
					}
				}
			}
		});
	}

	function processFontDetails(fontsDetails, fontResources) {
		fontsDetails.fonts.forEach((fontInfo, fontKey) => {
			fontsDetails.fonts.set(fontKey, fontInfo.map(fontSource => {
				const fontFormatMatch = fontSource.match(REGEXP_FONT_FORMAT_VALUE);
				let fontFormat;
				const fontUrl = getURL(fontSource);
				if (fontFormatMatch && fontFormatMatch[1]) {
					fontFormat = fontFormatMatch[1].replace(REGEXP_SIMPLE_QUOTES_STRING, "$1").replace(REGEXP_DOUBLE_QUOTES_STRING, "$1").toLowerCase();
				}
				if (!fontFormat) {
					const fontFormatMatch = fontSource.match(REGEXP_URL_FUNCTION_WOFF);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					} else {
						const fontFormatMatch = fontSource.match(REGEXP_URL_FUNCTION_WOFF_ALT);
						if (fontFormatMatch && fontFormatMatch[1]) {
							fontFormat = fontFormatMatch[1];
						}
					}
				}
				if (!fontFormat && fontUrl) {
					const fontFormatMatch = fontUrl.match(REGEXP_FONT_FORMAT);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					}
				}
				const fontResource = Array.from(fontResources.values()).find(info => info.name == fontUrl);
				return { src: fontSource.match(REGEXP_FONT_SRC)[1], fontUrl, format: fontFormat, contentType: fontResource && fontResource.contentType };
			}));
		});
		fontsDetails.medias.forEach(mediaFontsDetails => processFontDetails(mediaFontsDetails, fontResources));
		fontsDetails.supports.forEach(supportsFontsDetails => processFontDetails(supportsFontsDetails, fontResources));
	}

	async function processFontFaceRules(cssRules, sheetIndex, fontsDetails, fontResources, fontTests, stats) {
		const removedRules = [];
		let mediaIndex = 0, supportsIndex = 0;
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.block.children && ruleData.prelude) {
				const mediaText = gb(ruleData.prelude);
				await processFontFaceRules(ruleData.block.children, sheetIndex, fontsDetails.medias.get("media-" + sheetIndex + "-" + mediaIndex + "-" + mediaText), fontResources, fontTests, stats);
				mediaIndex++;
			} else if (ruleData.type == "Atrule" && ruleData.name == "supports" && ruleData.block && ruleData.block.children && ruleData.prelude) {
				const supportsText = gb(ruleData.prelude);
				await processFontFaceRules(ruleData.block.children, sheetIndex, fontsDetails.supports.get("supports-" + sheetIndex + "-" + supportsIndex + "-" + supportsText), fontResources, fontTests, stats);
				supportsIndex++;
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
				const key = getFontKey(ruleData);
				const fontInfo = fontsDetails.fonts.get(key);
				if (fontInfo) {
					fontsDetails.fonts.delete(key);
					await processFontFaceRule(ruleData, fontInfo, fontResources, fontTests, stats);
				} else {
					removedRules.push(cssRule);
				}
			}
		}
		removedRules.forEach(cssRule => cssRules.remove(cssRule));
	}

	async function processFontFaceRule(ruleData, fontInfo, fontResources, fontTests, stats) {
		await Promise.all(fontInfo.map(async source => {
			if (fontTests.has(source.src)) {
				source.valid = fontTests.get(source.src);
			} else {
				if (FontFace && source.fontUrl) {
					const resourceEntry = [...fontResources].find(([, resource]) => source.fontUrl && resource.name == source.fontUrl);
					if (resourceEntry) {
						const resource = resourceEntry[1];
						const fontFace = new FontFace("test-font", new Uint8Array(resource.content).buffer);
						try {
							let timeout;
							await Promise.race([
								fontFace.load().then(() => fontFace.loaded).then(() => { source.valid = true; globalThis.clearTimeout(timeout); }),
								new Promise(resolve => timeout = globalThis.setTimeout(() => { source.valid = true; resolve(); }, FONT_MAX_LOAD_DELAY))
							]);
						} catch (error) {
							const fontFace = new FontFace("test-font", "url(" + resource.url + ")");
							try {
								let timeout;
								await Promise.race([
									fontFace.load().then(() => fontFace.loaded).then(() => { source.valid = true; globalThis.clearTimeout(timeout); }),
									new Promise(resolve => timeout = globalThis.setTimeout(() => { source.valid = true; resolve(); }, FONT_MAX_LOAD_DELAY))
								]);
							} catch (error) {
								// ignored
							}
						}
					} else {
						source.valid = true;
					}
				} else {
					source.valid = true;
				}
				fontTests.set(source.src, source.valid);
			}
		}));
		const findSourceByFormat = (fontFormat, testValidity) => fontInfo.find(source => !source.src.match(EMPTY_URL_SOURCE) && source.format == fontFormat && (!testValidity || source.valid));
		const findSourceByContentType = (contentType, testValidity) => fontInfo.find(source => !source.src.match(EMPTY_URL_SOURCE) && source.contentType == contentType && (!testValidity || source.valid));
		const filterSources = fontSource => fontInfo.filter(source => source == fontSource || source.src.startsWith(LOCAL_SOURCE));
		stats.fonts.processed += fontInfo.length;
		stats.fonts.discarded += fontInfo.length;
		const woffFontFound =
			findSourceByFormat("woff2-variations", true) || findSourceByFormat("woff2", true) || findSourceByFormat("woff", true) ||
			findSourceByContentType("font/woff2", true) || findSourceByContentType("font/woff", true) || findSourceByContentType("application/font-woff", true) || findSourceByContentType("application/x-font-woff", true);
		if (woffFontFound) {
			fontInfo = filterSources(woffFontFound);
		} else {
			const ttfFontFound =
				findSourceByFormat("truetype-variations", true) || findSourceByFormat("truetype", true) ||
				findSourceByContentType("font/ttf", true) || findSourceByContentType("application/x-font-ttf", true) || findSourceByContentType("application/x-font-ttf", true) || findSourceByContentType("application/x-font-truetype", true);
			if (ttfFontFound) {
				fontInfo = filterSources(ttfFontFound);
			} else {
				const otfFontFound =
					findSourceByFormat("opentype") || findSourceByFormat("embedded-opentype") ||
					findSourceByContentType("font/otf") || findSourceByContentType("application/x-font-opentype") || findSourceByContentType("application/font-sfnt");
				if (otfFontFound) {
					fontInfo = filterSources(otfFontFound);
				} else {
					fontInfo = fontInfo.filter(source => !source.src.match(EMPTY_URL_SOURCE) && (source.valid) || source.src.startsWith(LOCAL_SOURCE));
				}
			}
		}
		stats.fonts.discarded -= fontInfo.length;
		const removedNodes = [];
		for (let node = ruleData.block.children.head; node; node = node.next) {
			if (node.data.property == "src") {
				removedNodes.push(node);
			}
		}
		removedNodes.pop();
		removedNodes.forEach(node => ruleData.block.children.remove(node));
		const srcDeclaration = ruleData.block.children.filter(node => node.property == "src").tail;
		if (srcDeclaration) {
			fontInfo.reverse();
			try {
				srcDeclaration.data.value = db(fontInfo.map(fontSource => fontSource.src).join(","), { context: "value", parseCustomProperty: true });
			}
			catch (error) {
				// ignored
			}
		}
	}

	function getPropertyValue(ruleData, propertyName) {
		let property;
		if (ruleData.block.children) {
			property = ruleData.block.children.filter(node => {
				try {
					return node.property == propertyName && !gb(node.value).match(/\\9$/);
				} catch (error) {
					return node.property == propertyName;
				}
			}).tail;
		}
		if (property) {
			try {
				return gb(property.data.value);
			} catch (error) {
				// ignored
			}
		}
	}

	function getFontKey(ruleData) {
		return JSON$2.stringify([
			normalizeFontFamily(getPropertyValue(ruleData, "font-family")),
			getFontWeight(getPropertyValue(ruleData, "font-weight") || "400"),
			getPropertyValue(ruleData, "font-style") || "normal",
			getPropertyValue(ruleData, "unicode-range"),
			getFontStretch(getPropertyValue(ruleData, "font-stretch")),
			getPropertyValue(ruleData, "font-variant") || "normal",
			getPropertyValue(ruleData, "font-feature-settings"),
			getPropertyValue(ruleData, "font-variation-settings")
		]);
	}

	function getFontStretch(stretch) {
		return FONT_STRETCHES[stretch] || stretch;
	}

	function createFontsDetailsInfo() {
		return {
			fonts: new Map(),
			medias: new Map(),
			supports: new Map()
		};
	}

	function getURL(urlFunction) {
		urlFunction = urlFunction.replace(/url\(-sf-url-original\\\(\\"(.*?)\\"\\\)\\ /g, "");
		const urlMatch = urlFunction.match(REGEXP_URL_SIMPLE_QUOTES_FN) ||
			urlFunction.match(REGEXP_URL_DOUBLE_QUOTES_FN) ||
			urlFunction.match(REGEXP_URL_NO_QUOTES_FN);
		return urlMatch && urlMatch[1];
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 *
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or
	 *   modify it under the terms of the GNU Affero General Public License
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 *
	 *   The code in this file is distributed in the hope that it will be useful,
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
	 *   AGPL normally required by section 4, provided you include this license
	 *   notice and a URL through which recipients can access the Corresponding
	 *   Source.
	 */

	function getProcessorHelperClass(options, utilInstance) {
		return options.compressContent ? getProcessorHelperClass$1(utilInstance) : getProcessorHelperClass$2(utilInstance);
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 *
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or
	 *   modify it under the terms of the GNU Affero General Public License
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 *
	 *   The code in this file is distributed in the hope that it will be useful,
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
	 *   AGPL normally required by section 4, provided you include this license
	 *   notice and a URL through which recipients can access the Corresponding
	 *   Source.
	 */

	const Set$1 = globalThis.Set;
	const Map$1 = globalThis.Map;
	const JSON$1 = globalThis.JSON;

	let util;

	function getClass(...args) {
		[util] = args;
		return SingleFileClass;
	}

	class SingleFileClass {
		constructor(options) {
			this.options = options;
			const ProcessorHelper = getProcessorHelperClass(options, util);
			this.processorHelper = new ProcessorHelper();
		}
		async run() {
			const waitForUserScript = globalThis[util.WAIT_FOR_USERSCRIPT_PROPERTY_NAME];
			if (this.options.userScriptEnabled && waitForUserScript) {
				await waitForUserScript(util.ON_BEFORE_CAPTURE_EVENT_NAME);
			}
			this.runner = new Runner(this.options, this.processorHelper, true);
			await this.runner.loadPage();
			await this.runner.initialize();
			if (this.options.userScriptEnabled && waitForUserScript) {
				await waitForUserScript(util.ON_AFTER_CAPTURE_EVENT_NAME);
			}
			await this.runner.run();
		}
		cancel() {
			this.cancelled = true;
			if (this.runner) {
				this.runner.cancel();
			}
		}
		getPageData() {
			return this.runner.getPageData();
		}
	}

	// -------------
	// ProgressEvent
	// -------------
	const PAGE_LOADING = "page-loading";
	const PAGE_LOADED = "page-loaded";
	const RESOURCES_INITIALIZING = "resource-initializing";
	const RESOURCES_INITIALIZED = "resources-initialized";
	const RESOURCE_LOADED = "resource-loaded";
	const PAGE_ENDED = "page-ended";
	const STAGE_STARTED = "stage-started";
	const STAGE_ENDED = "stage-ended";
	const STAGE_TASK_STARTED = "stage-task-started";
	const STAGE_TASK_ENDED = "stage-task-ended";

	class ProgressEvent {
		constructor(type, detail) {
			return { type, detail, PAGE_LOADING, PAGE_LOADED, RESOURCES_INITIALIZING, RESOURCES_INITIALIZED, RESOURCE_LOADED, PAGE_ENDED, STAGE_STARTED, STAGE_ENDED, STAGE_TASK_STARTED, STAGE_TASK_ENDED };
		}
	}

	// ------
	// Runner
	// ------
	const RESOLVE_URLS_STAGE = 0;
	const REPLACE_DATA_STAGE = 1;
	const REPLACE_DOCS_STAGE = 2;
	const POST_PROCESS_STAGE = 3;
	const STAGES = [{
		sequential: [
			{ action: "preProcessPage" },
			{ option: "loadDeferredImagesKeepZoomLevel", action: "resetZoomLevel" },
			{ action: "replaceStyleContents" },
			{ action: "replaceInvalidElements" },
			{ action: "resetCharsetMeta" },
			{ option: "saveFavicon", action: "saveFavicon" },
			{ action: "insertFonts" },
			{ action: "insertShadowRootContents" },
			{ action: "replaceCanvasElements" },
			{ action: "setInputValues" },
			{ option: "moveStylesInHead", action: "moveStylesInHead" },
			{ option: "blockScripts", action: "removeEmbedScripts" },
			{ option: "selected", action: "removeUnselectedElements" },
			{ option: "blockVideos", action: "insertVideoPosters" },
			{ option: "blockVideos", action: "insertVideoLinks" },
			{ option: "removeFrames", action: "removeFrames" },
			{ action: "removeDiscardedResources" },
			{ option: "removeHiddenElements", action: "removeHiddenElements" },
			{ action: "saveScrollPosition" },
			{ action: "resolveHrefs" },
			{ action: "resolveStyleAttributeURLs" }
		],
		parallel: [
			{ option: "blockVideos", action: "insertMissingVideoPosters" },
			{ action: "resolveStylesheetsURLs" },
			{ option: "!removeFrames", action: "resolveFrameURLs" }
		]
	}, {
		sequential: [
			{ option: "removeUnusedStyles", action: "removeUnusedStyles" },
			{ option: "removeAlternativeMedias", action: "removeAlternativeMedias" },
			{ option: "removeUnusedFonts", action: "removeUnusedFonts" }
		],
		parallel: [
			{ action: "processStylesheets" },
			{ action: "processStyleAttributes" },
			{ action: "processPageResources" },
			{ action: "processScripts" }
		]
	}, {
		sequential: [
			{ option: "removeAlternativeImages", action: "removeAlternativeImages" }
		],
		parallel: [
			{ option: "removeAlternativeFonts", action: "removeAlternativeFonts" },
			{ option: "!removeFrames", action: "processFrames" }
		]
	}, {
		sequential: [
			{ action: "replaceStylesheets" },
			{ action: "replaceStyleAttributes" },
			{ action: "insertVariables" },
			{ option: "compressHTML", action: "compressHTML" },
			{ action: "cleanupPage" }
		],
		parallel: [
			{ option: "enableMaff", action: "insertMAFFMetaData" },
			{ action: "setDocInfo" }
		]
	}];

	class Runner {
		constructor(options, processorHelper, root) {
			const rootDocDefined = root && options.doc;
			this.root = root;
			this.options = options;
			this.options.url = this.options.url || (rootDocDefined && this.options.doc.location.href);
			const matchResourceReferrer = this.options.url.match(/^.*\//);
			this.options.resourceReferrer = this.options.passReferrerOnError && matchResourceReferrer && matchResourceReferrer[0];
			this.options.baseURI = rootDocDefined && this.options.doc.baseURI;
			this.options.rootDocument = root;
			this.options.updatedResources = this.options.updatedResources || {};
			this.options.fontTests = new Map$1();
			this.batchRequest = new BatchRequest();
			this.processor = new Processor(options, processorHelper, this.batchRequest);
			if (rootDocDefined) {
				const docData = util.preProcessDoc(this.options.doc, this.options.win, this.options);
				this.options.canvases = docData.canvases;
				this.options.fonts = docData.fonts;
				this.options.stylesheets = docData.stylesheets;
				this.options.images = docData.images;
				this.options.posters = docData.posters;
				this.options.videos = docData.videos;
				this.options.usedFonts = docData.usedFonts;
				this.options.shadowRoots = docData.shadowRoots;
				this.options.referrer = docData.referrer;
				this.options.adoptedStyleSheets = docData.adoptedStyleSheets;
				this.markedElements = docData.markedElements;
				this.invalidElements = docData.invalidElements;
			}
			if (this.options.saveRawPage) {
				this.options.removeFrames = true;
			}
			this.options.content = this.options.content || (rootDocDefined ? util.serialize(this.options.doc) : null);
			this.onprogress = options.onprogress || (() => { });
		}

		async loadPage() {
			this.onprogress(new ProgressEvent(PAGE_LOADING, { pageURL: this.options.url, frame: !this.root }));
			await this.processor.loadPage(this.options.content);
			this.onprogress(new ProgressEvent(PAGE_LOADED, { pageURL: this.options.url, frame: !this.root }));
		}

		async initialize() {
			this.onprogress(new ProgressEvent(RESOURCES_INITIALIZING, { pageURL: this.options.url }));
			await this.executeStage(RESOLVE_URLS_STAGE);
			this.pendingPromises = this.executeStage(REPLACE_DATA_STAGE);
			if (this.root && this.options.doc) {
				util.postProcessDoc(this.options.doc, this.markedElements, this.invalidElements);
			}
		}

		cancel() {
			this.cancelled = true;
			this.batchRequest.cancel();
			if (this.root) {
				if (this.options.frames) {
					this.options.frames.forEach(cancelRunner);
				}
			}

			function cancelRunner(resourceData) {
				if (resourceData.runner) {
					resourceData.runner.cancel();
				}
			}
		}

		async run() {
			if (this.root) {
				this.processor.initialize(this.batchRequest);
				this.onprogress(new ProgressEvent(RESOURCES_INITIALIZED, { pageURL: this.options.url, max: this.processor.maxResources }));
			}
			await this.batchRequest.run(detail => {
				detail.pageURL = this.options.url;
				this.onprogress(new ProgressEvent(RESOURCE_LOADED, detail));
			}, this.options);
			await this.pendingPromises;
			this.options.doc = null;
			this.options.win = null;
			await this.executeStage(REPLACE_DOCS_STAGE);
			await this.executeStage(POST_PROCESS_STAGE);
			this.processor.finalize();
		}

		getDocument() {
			return this.processor.doc;
		}

		getStyleSheets() {
			return this.processor.stylesheets;
		}

		getPageData() {
			if (this.root) {
				this.onprogress(new ProgressEvent(PAGE_ENDED, { pageURL: this.options.url }));
			}
			return this.processor.getPageData();
		}

		async executeStage(step) {
			const frame = !this.root;
			this.onprogress(new ProgressEvent(STAGE_STARTED, { pageURL: this.options.url, step, frame }));
			STAGES[step].sequential.forEach(task => {
				this.onprogress(new ProgressEvent(STAGE_TASK_STARTED, { pageURL: this.options.url, step, task: task.action, frame }));
				if (!this.cancelled) {
					this.executeTask(task);
				}
				this.onprogress(new ProgressEvent(STAGE_TASK_ENDED, { pageURL: this.options.url, step, task: task.action, frame }));
			});
			let parallelTasksPromise;
			if (STAGES[step].parallel) {
				parallelTasksPromise = await Promise.all(STAGES[step].parallel.map(async task => {
					this.onprogress(new ProgressEvent(STAGE_TASK_STARTED, { pageURL: this.options.url, step, task: task.action, frame }));
					if (!this.cancelled) {
						await this.executeTask(task);
					}
					this.onprogress(new ProgressEvent(STAGE_TASK_ENDED, { pageURL: this.options.url, step, task: task.action, frame }));
				}));
			} else {
				parallelTasksPromise = Promise.resolve();
			}
			this.onprogress(new ProgressEvent(STAGE_ENDED, { pageURL: this.options.url, step, frame }));
			return parallelTasksPromise;
		}

		executeTask(task) {
			if (!task.option || ((task.option.startsWith("!") && !this.options[task.option]) || this.options[task.option])) {
				return this.processor[task.action]();
			}
		}
	}

	// ------------
	// BatchRequest
	// ------------
	class BatchRequest {
		constructor() {
			this.requests = new Map$1();
			this.duplicates = new Map$1();
		}

		addURL(resourceURL, { asBinary, expectedType, groupDuplicates, baseURI, blockMixedContent } = {}) {
			return new Promise((resolve, reject) => {
				const requestKey = JSON$1.stringify([resourceURL, asBinary, expectedType, baseURI, blockMixedContent]);
				let resourceRequests = this.requests.get(requestKey);
				if (!resourceRequests) {
					resourceRequests = [];
					this.requests.set(requestKey, resourceRequests);
				}
				const callbacks = { resolve, reject };
				resourceRequests.push(callbacks);
				if (groupDuplicates) {
					let duplicateRequests = this.duplicates.get(requestKey);
					if (!duplicateRequests) {
						duplicateRequests = [];
						this.duplicates.set(requestKey, duplicateRequests);
					}
					duplicateRequests.push(callbacks);
				}
			});
		}

		getMaxResources() {
			return this.requests.size;
		}

		run(onloadListener, options) {
			const resourceURLs = [...this.requests.keys()];
			let indexResource = 0;
			return Promise.all(resourceURLs.map(async requestKey => {
				const [resourceURL, asBinary, expectedType, baseURI, blockMixedContent] = JSON$1.parse(requestKey);
				const resourceRequests = this.requests.get(requestKey);
				try {
					const currentIndexResource = indexResource;
					indexResource = indexResource + 1;
					const content = await util.getContent(resourceURL, {
						asBinary,
						inline: !options.compressContent,
						expectedType,
						maxResourceSize: options.maxResourceSize,
						maxResourceSizeEnabled: options.maxResourceSizeEnabled,
						frameId: options.windowId,
						resourceReferrer: options.resourceReferrer,
						baseURI,
						blockMixedContent,
						acceptHeaders: options.acceptHeaders,
						networkTimeout: options.networkTimeout
					});
					onloadListener({ url: resourceURL });
					if (!this.cancelled) {
						const extension = util.getContentTypeExtension(content.contentType) || util.getFilenameExtension(resourceURL, options.filenameReplacedCharacters, options.filenameReplacementCharacter);
						resourceRequests.forEach(callbacks => {
							const duplicateCallbacks = this.duplicates.get(requestKey);
							const duplicate = duplicateCallbacks && duplicateCallbacks.length > 1 && duplicateCallbacks.includes(callbacks);
							callbacks.resolve({ content: content.data, indexResource: currentIndexResource, duplicate, contentType: content.contentType, extension });
						});
					}
				} catch (error) {
					indexResource = indexResource + 1;
					onloadListener({ url: resourceURL });
					resourceRequests.forEach(resourceRequest => resourceRequest.reject(error));
				}
				this.requests.delete(requestKey);
			}));
		}

		cancel() {
			this.cancelled = true;
			const resourceURLs = [...this.requests.keys()];
			resourceURLs.forEach(requestKey => {
				const resourceRequests = this.requests.get(requestKey);
				resourceRequests.forEach(callbacks => callbacks.reject());
				this.requests.delete(requestKey);
			});
		}
	}

	// ---------
	// Processor
	// ---------
	const SHADOWROOT_ATTRIBUTE_NAME = "shadowrootmode";
	const SCRIPT_TEMPLATE_SHADOW_ROOT = "data-template-shadow-root";
	const UTF8_CHARSET = "utf-8";

	class Processor {
		constructor(options, processorHelper, batchRequest) {
			this.options = options;
			this.processorHelper = processorHelper;
			this.stats = new Stats(options);
			this.baseURI = normalizeURL(options.baseURI || options.url);
			this.batchRequest = batchRequest;
			this.stylesheets = new Map$1();
			this.styles = new Map$1();
			this.resources = {
				cssVariables: new Map$1(),
				fonts: new Map$1(),
				stylesheets: new Map$1(),
				scripts: new Map$1(),
				images: new Map$1(),
				frames: new Map$1()
			};
			this.fontTests = options.fontTests;
		}

		initialize() {
			this.options.saveDate = new Date();
			this.options.saveUrl = this.options.url;
			if (this.options.enableMaff) {
				this.maffMetaDataPromise = this.batchRequest.addURL(util.resolveURL("index.rdf", this.options.baseURI || this.options.url), { expectedType: "document" });
			}
			this.maxResources = this.batchRequest.getMaxResources();
			if (!this.options.saveRawPage && !this.options.removeFrames && this.options.frames) {
				this.options.frames.forEach(frameData => this.maxResources += frameData.maxResources || 0);
			}
			this.stats.set("processed", "resources", this.maxResources);
		}

		async loadPage(pageContent, charset) {
			let content;
			if (!pageContent || this.options.saveRawPage) {
				content = await util.getContent(this.baseURI, {
					inline: !this.options.compressContent,
					maxResourceSize: this.options.maxResourceSize,
					maxResourceSizeEnabled: this.options.maxResourceSizeEnabled,
					charset,
					frameId: this.options.windowId,
					resourceReferrer: this.options.resourceReferrer,
					expectedType: "document",
					acceptHeaders: this.options.acceptHeaders,
					networkTimeout: this.options.networkTimeout
				});
				pageContent = content.data || "";
			}
			this.doc = util.parseDocContent(pageContent, this.baseURI);
			if (this.options.saveRawPage) {
				let charset;
				this.doc.querySelectorAll("meta[charset], meta[http-equiv=\"content-type\"]").forEach(element => {
					const charsetDeclaration = element.content.split(";")[1];
					if (charsetDeclaration && !charset) {
						charset = charsetDeclaration.split("=")[1].trim().toLowerCase();
					}
				});
				if (charset && content.charset && charset.toLowerCase() != content.charset.toLowerCase()) {
					return this.loadPage(pageContent, charset);
				}
			}
			this.workStyleElement = this.doc.createElement("style");
			this.doc.body.appendChild(this.workStyleElement);
			this.onEventAttributeNames = getOnEventAttributeNames(this.doc);
		}

		finalize() {
			if (this.workStyleElement.parentNode) {
				this.workStyleElement.remove();
			}
		}

		async getPageData() {
			util.postProcessDoc(this.doc);
			const url = util.parseURL(this.baseURI);
			if (this.options.insertSingleFileComment) {
				const firstComment = this.doc.documentElement.firstChild;
				let infobarURL = this.options.saveUrl, infobarSaveDate = this.options.saveDate;
				if (firstComment.nodeType == 8 && (firstComment.textContent.includes(util.COMMENT_HEADER_LEGACY) || firstComment.textContent.includes(util.COMMENT_HEADER))) {
					const info = this.doc.documentElement.firstChild.textContent.split("\n");
					try {
						const [, , url, saveDate] = info;
						infobarURL = url.split("url: ")[1];
						infobarSaveDate = saveDate.split("saved date: ")[1];
						firstComment.remove();
					} catch (error) {
						// ignored
					}
				}
				const infobarContent = (this.options.infobarContent || "").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
				const commentNode = this.doc.createComment(
					"\n " + (this.options.useLegacyCommentHeader ? util.COMMENT_HEADER_LEGACY : util.COMMENT_HEADER) +
					" \n url: " + infobarURL +
					(this.options.removeSavedDate ? " " : " \n saved date: " + infobarSaveDate) +
					(infobarContent ? " \n info: " + infobarContent : "") + "\n"
				);
				this.doc.documentElement.insertBefore(commentNode, this.doc.documentElement.firstChild);
			}
			const legacyInfobarElement = this.doc.querySelector("singlefile-infobar");
			if (legacyInfobarElement) {
				legacyInfobarElement.remove();
			}
			const infobarElement = this.doc.querySelector(util.INFOBAR_TAGNAME);
			if (infobarElement) {
				infobarElement.remove();
			}
			if (this.options.includeInfobar) {
				util.appendInfobar(this.doc, this.options);
			}
			if (this.doc.querySelector("template[" + SHADOWROOT_ATTRIBUTE_NAME + "]") || (this.options.shadowRoots && this.options.shadowRoots.length)) {
				if (this.options.blockScripts) {
					this.doc.querySelectorAll("script[" + SCRIPT_TEMPLATE_SHADOW_ROOT + "]").forEach(element => element.remove());
				}
				const scriptElement = this.doc.createElement("script");
				scriptElement.setAttribute(SCRIPT_TEMPLATE_SHADOW_ROOT, "");
				scriptElement.textContent = `(()=>{document.currentScript.remove();processNode(document);function processNode(node){node.querySelectorAll("template[${SHADOWROOT_ATTRIBUTE_NAME}]").forEach(element=>{let shadowRoot = element.parentElement.shadowRoot;if (!shadowRoot) {try {shadowRoot=element.parentElement.attachShadow({mode:element.getAttribute("${SHADOWROOT_ATTRIBUTE_NAME}")});shadowRoot.innerHTML=element.innerHTML;element.remove()} catch (error) {} if (shadowRoot) {processNode(shadowRoot)}}})}})()`;
				this.doc.body.appendChild(scriptElement);
			}
			if (this.options.insertCanonicalLink && this.options.saveUrl.match(HTTP_URI_PREFIX)) {
				let canonicalLink = this.doc.querySelector("link[rel=canonical]");
				if (!canonicalLink) {
					canonicalLink = this.doc.createElement("link");
					canonicalLink.setAttribute("rel", "canonical");
					this.doc.head.appendChild(canonicalLink);
				}
				if (canonicalLink && !canonicalLink.href) {
					canonicalLink.href = this.options.saveUrl;
				}
			}
			if (this.options.insertMetaCSP) {
				const metaElement = this.doc.createElement("meta");
				metaElement.httpEquiv = "content-security-policy";
				this.processorHelper.setMetaCSP(metaElement);
				this.doc.head.appendChild(metaElement);
			}
			if (this.options.insertMetaNoIndex) {
				let metaElement = this.doc.querySelector("meta[name=robots][content*=noindex]");
				if (!metaElement) {
					metaElement = this.doc.createElement("meta");
					metaElement.setAttribute("name", "robots");
					metaElement.setAttribute("content", "noindex");
					this.doc.head.appendChild(metaElement);
				}
			}
			const styleElement = this.doc.createElement("style");
			styleElement.textContent = "img[src=\"data:,\"],source[src=\"data:,\"]{display:none!important}";
			this.doc.head.appendChild(styleElement);
			let size;
			if (this.options.displayStats) {
				size = util.getContentSize(this.doc.documentElement.outerHTML);
			}
			const content = util.serialize(this.doc, this.options.compressHTML);
			if (this.options.displayStats) {
				const contentSize = util.getContentSize(content);
				this.stats.set("processed", "HTML bytes", contentSize);
				this.stats.add("discarded", "HTML bytes", size - contentSize);
			}
			const filename = await util.formatFilename(content, this.options);
			const matchTitle = this.baseURI.match(/([^/]*)\/?(\.html?.*)$/) || this.baseURI.match(/\/\/([^/]*)\/?$/);
			const additionalData = this.processorHelper.getAdditionalPageData(this.doc, content, this.resources);
			const pageData = Object.assign({
				stats: this.stats.data,
				title: this.options.title || (this.baseURI && matchTitle ? matchTitle[1] : url.hostname ? url.hostname : ""),
				filename,
				content
			}, additionalData);
			if (this.options.addProof) {
				pageData.hash = await util.digest("SHA-256", content);
			}
			if (this.options.retrieveLinks) {
				pageData.links = Array.from(new Set$1(Array.from(this.doc.links).map(linkElement => linkElement.href)));
			}
			return pageData;
		}

		preProcessPage() {
			if (this.options.win) {
				this.doc.body.querySelectorAll(":not(svg) title, meta, link[href][rel*=\"icon\"]").forEach(element => element instanceof this.options.win.HTMLElement && this.doc.head.appendChild(element));
			}
			if (this.options.images && !this.options.saveRawPage) {
				this.doc.querySelectorAll("img[" + util.IMAGE_ATTRIBUTE_NAME + "]").forEach(imgElement => {
					const attributeValue = imgElement.getAttribute(util.IMAGE_ATTRIBUTE_NAME);
					if (attributeValue) {
						const imageData = this.options.images[Number(attributeValue)];
						if (imageData) {
							if (this.options.removeHiddenElements && (
								(imageData.size && !imageData.size.pxWidth && !imageData.size.pxHeight) ||
								imgElement.getAttribute(util.HIDDEN_CONTENT_ATTRIBUTE_NAME) == "")
							) {
								imgElement.setAttribute("src", util.EMPTY_RESOURCE);
							} else {
								if (imageData.currentSrc) {
									imgElement.dataset.singleFileOriginURL = imgElement.getAttribute("src");
									imgElement.setAttribute("src", imageData.currentSrc);
								}
								if (this.options.loadDeferredImages) {
									if ((!imgElement.getAttribute("src") || imgElement.getAttribute("src") == util.EMPTY_RESOURCE) && imgElement.getAttribute("data-src")) {
										imageData.src = imgElement.dataset.src;
										imgElement.setAttribute("src", imgElement.dataset.src);
										imgElement.removeAttribute("data-src");
									}
								}
							}
						}
					}
				});
				if (this.options.loadDeferredImages) {
					this.doc.querySelectorAll("img[data-srcset]").forEach(imgElement => {
						if (!imgElement.getAttribute("srcset") && imgElement.getAttribute("data-srcset")) {
							imgElement.setAttribute("srcset", imgElement.dataset.srcset);
							imgElement.removeAttribute("data-srcset");
						}
					});
				}
			}
		}

		replaceStyleContents() {
			if (this.options.stylesheets) {
				this.doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
					const attributeValue = styleElement.getAttribute(util.STYLESHEET_ATTRIBUTE_NAME);
					if (attributeValue) {
						const stylesheetContent = this.options.stylesheets[Number(styleIndex)];
						if (stylesheetContent) {
							styleElement.textContent = stylesheetContent;
						}
					}
				});
			}
			if (this.options.adoptedStyleSheets && this.options.adoptedStyleSheets.length) {
				const styleElement = this.doc.createElement("style");
				styleElement.textContent = this.options.adoptedStyleSheets.join("\n");
				this.doc.body.appendChild(styleElement);
			}
		}

		removeUnselectedElements() {
			removeUnmarkedElements(this.doc.body);
			this.doc.body.removeAttribute(util.SELECTED_CONTENT_ATTRIBUTE_NAME);

			function removeUnmarkedElements(element) {
				let selectedElementFound = false;
				Array.from(element.childNodes).forEach(node => {
					if (node.nodeType == 1) {
						const isSelectedElement = node.getAttribute(util.SELECTED_CONTENT_ATTRIBUTE_NAME) == "";
						selectedElementFound = selectedElementFound || isSelectedElement;
						if (isSelectedElement) {
							node.removeAttribute(util.SELECTED_CONTENT_ATTRIBUTE_NAME);
							removeUnmarkedElements(node);
						} else if (selectedElementFound) {
							removeNode(node);
						} else {
							hideNode(node);
						}
					}
				});
			}

			function removeNode(node) {
				if ((node.nodeType != 1 || !node.querySelector("svg,style,link")) && canHideNode(node)) {
					node.remove();
				} else {
					hideNode(node);
				}
			}

			function hideNode(node) {
				if (canHideNode(node)) {
					node.style.setProperty("display", "none", "important");
					node.removeAttribute("src");
					node.removeAttribute("srcset");
					node.removeAttribute("srcdoc");
					Array.from(node.childNodes).forEach(removeNode);
				}
			}

			function canHideNode(node) {
				if (node.nodeType == 1) {
					const tagName = node.tagName && node.tagName.toUpperCase();
					return tagName != "SVG" && tagName != "STYLE" && tagName != "LINK";
				}
			}
		}

		insertVideoPosters() {
			if (this.options.posters) {
				this.doc.querySelectorAll("video, video > source").forEach(element => {
					let videoElement;
					if (element.tagName.toUpperCase() == "VIDEO") {
						videoElement = element;
					} else {
						videoElement = element.parentElement;
					}
					const attributeValue = element.getAttribute(util.POSTER_ATTRIBUTE_NAME);
					if (attributeValue) {
						const posterURL = this.options.posters[Number(attributeValue)];
						if (!videoElement.getAttribute("poster") && posterURL) {
							videoElement.setAttribute("poster", posterURL);
						}
					}
				});
			}
		}

		insertVideoLinks() {
			const LINK_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8H+DhhoQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJJJREFUOI3t070NRCEMA2CnYAOyDyPwpHj/Va7hJ3FzV7zy3ET5JIwoAF6Jk4wzAJAkzxAYG9YRTgB+24wBgKmfrGAKTcEfAY4KRlRoIeBTgKOCERVaCPgU4Khge2GqKOBTgKOCERVaAEC/4PNcnyoSWHpjqkhwKxbcig0Q6AorXYF/+A6eIYD1lVbwG/jdA6/kA2THRAURVubcAAAAAElFTkSuQmCC";
			const ICON_SIZE = "16px";
			this.doc.querySelectorAll("video").forEach(videoElement => {
				const attributeValue = videoElement.getAttribute(util.VIDEO_ATTRIBUTE_NAME);
				if (attributeValue) {
					const videoData = this.options.videos[Number(attributeValue)];
					const src = videoData.src || videoElement.src;
					if (videoElement && src) {
						const linkElement = this.doc.createElement("a");
						const imgElement = this.doc.createElement("img");
						linkElement.href = src;
						linkElement.target = "_blank";
						linkElement.style.setProperty("z-index", 2147483647, "important");
						linkElement.style.setProperty("position", "absolute", "important");
						linkElement.style.setProperty("top", "8px", "important");
						linkElement.style.setProperty("left", "8px", "important");
						linkElement.style.setProperty("width", ICON_SIZE, "important");
						linkElement.style.setProperty("height", ICON_SIZE, "important");
						linkElement.style.setProperty("min-width", ICON_SIZE, "important");
						linkElement.style.setProperty("min-height", ICON_SIZE, "important");
						linkElement.style.setProperty("max-width", ICON_SIZE, "important");
						linkElement.style.setProperty("max-height", ICON_SIZE, "important");
						imgElement.src = LINK_ICON;
						imgElement.style.setProperty("width", ICON_SIZE, "important");
						imgElement.style.setProperty("height", ICON_SIZE, "important");
						imgElement.style.setProperty("min-width", ICON_SIZE, "important");
						imgElement.style.setProperty("min-height", ICON_SIZE, "important");
						imgElement.style.setProperty("max-width", ICON_SIZE, "important");
						imgElement.style.setProperty("max-height", ICON_SIZE, "important");
						linkElement.appendChild(imgElement);
						videoElement.insertAdjacentElement("afterend", linkElement);
						const positionInlineParent = videoElement.parentNode.style.getPropertyValue("position");
						if ((!videoData.positionParent && (!positionInlineParent || positionInlineParent != "static")) || videoData.positionParent == "static") {
							videoElement.parentNode.style.setProperty("position", "relative", "important");
						}
					}
				}
			});
		}

		removeFrames() {
			const frameElements = this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]");
			this.stats.set("discarded", "frames", frameElements.length);
			this.stats.set("processed", "frames", frameElements.length);
			this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]").forEach(element => element.remove());
		}

		removeEmbedScripts() {
			const JAVASCRIPT_URI_PREFIX = "javascript:";
			const DISABLED_SCRIPT = "javascript:void(0)";
			this.onEventAttributeNames.forEach(attributeName => this.doc.querySelectorAll("[" + attributeName + "]").forEach(element => element.removeAttribute(attributeName)));
			this.doc.querySelectorAll("[href]").forEach(element => {
				if (element.href && element.href.match && element.href.trim().startsWith(JAVASCRIPT_URI_PREFIX)) {
					element.setAttribute("href", DISABLED_SCRIPT);
				}
			});
			this.doc.querySelectorAll("[src]").forEach(element => {
				if (element.src && element.src.trim().startsWith(JAVASCRIPT_URI_PREFIX)) {
					element.setAttribute("src", DISABLED_SCRIPT);
				}
			});
			const scriptElements = this.doc.querySelectorAll("script:not([type=\"application/ld+json\"]):not([" + SCRIPT_TEMPLATE_SHADOW_ROOT + "])");
			this.stats.set("discarded", "scripts", scriptElements.length);
			this.stats.set("processed", "scripts", scriptElements.length);
			scriptElements.forEach(element => element.remove());
		}

		removeDiscardedResources() {
			this.doc.querySelectorAll("." + util.SINGLE_FILE_UI_ELEMENT_CLASS).forEach(element => element.remove());
			const noscriptPlaceholders = new Map$1();
			this.doc.querySelectorAll("noscript").forEach(noscriptElement => {
				const placeholderElement = this.doc.createElement("div");
				placeholderElement.innerHTML = noscriptElement.dataset[util.NO_SCRIPT_PROPERTY_NAME];
				noscriptElement.replaceWith(placeholderElement);
				noscriptPlaceholders.set(placeholderElement, noscriptElement);
			});
			this.doc.querySelectorAll("meta[http-equiv=refresh], meta[disabled-http-equiv]").forEach(element => element.remove());
			noscriptPlaceholders.forEach((noscriptElement, placeholderElement) => {
				noscriptElement.dataset[util.NO_SCRIPT_PROPERTY_NAME] = placeholderElement.innerHTML;
				placeholderElement.replaceWith(noscriptElement);
			});
			this.doc.querySelectorAll("meta[http-equiv=\"content-security-policy\"]").forEach(element => element.remove());
			const objectElements = this.doc.querySelectorAll("applet, object[data]:not([type=\"image/svg+xml\"]):not([type=\"image/svg-xml\"]):not([type=\"text/html\"]):not([data*=\".svg\"]):not([data*=\".pdf\"]), embed[src]:not([src*=\".svg\"]):not([src*=\".pdf\"])");
			this.stats.set("discarded", "objects", objectElements.length);
			this.stats.set("processed", "objects", objectElements.length);
			objectElements.forEach(element => element.remove());
			const replacedAttributeValue = this.doc.querySelectorAll("link[rel~=preconnect], link[rel~=prerender], link[rel~=dns-prefetch], link[rel~=preload], link[rel~=manifest], link[rel~=prefetch]");
			replacedAttributeValue.forEach(element => {
				const relValue = element
					.getAttribute("rel")
					.replace(/(preconnect|prerender|dns-prefetch|preload|prefetch|manifest)/g, "")
					.trim();
				if (relValue.length) {
					element.setAttribute("rel", relValue);
				} else {
					element.remove();
				}
			});
			this.processorHelper.removeUnusedStylesheets(this.doc);
			this.doc.querySelectorAll("link[rel*=stylesheet]:not([href]),link[rel*=stylesheet][href=\"\"]").forEach(element => element.remove());
			if (this.options.removeHiddenElements) {
				this.doc.querySelectorAll("input[type=hidden]").forEach(element => element.remove());
			}
			if (!this.options.saveFavicon) {
				this.doc.querySelectorAll("link[rel*=\"icon\"]").forEach(element => element.remove());
			}
			this.doc.querySelectorAll("a[ping]").forEach(element => element.removeAttribute("ping"));
			this.doc.querySelectorAll("link[rel=import][href]").forEach(element => element.remove());
		}

		replaceInvalidElements() {
			this.doc.querySelectorAll("template[" + util.INVALID_ELEMENT_ATTRIBUTE_NAME + "]").forEach(templateElement => {
				const placeHolderElement = this.doc.createElement("span");
				if (templateElement.content) {
					const originalElement = templateElement.content.firstChild;
					if (originalElement) {
						if (originalElement.hasAttributes()) {
							Array.from(originalElement.attributes).forEach(attribute => placeHolderElement.setAttribute(attribute.name, attribute.value));
						}
						originalElement.childNodes.forEach(childNode => placeHolderElement.appendChild(childNode.cloneNode(true)));
					}
					templateElement.replaceWith(placeHolderElement);
				}
			});
		}

		resetCharsetMeta() {
			let charset;
			this.doc.querySelectorAll("meta[charset], meta[http-equiv=\"content-type\"]").forEach(element => {
				const charsetDeclaration = element.content.split(";")[1];
				if (charsetDeclaration && !charset) {
					charset = charsetDeclaration.split("=")[1];
					if (charset) {
						this.charset = charset.trim().toLowerCase();
					}
				}
				element.remove();
			});
			const metaElement = this.doc.createElement("meta");
			metaElement.setAttribute("charset", UTF8_CHARSET);
			if (this.doc.head.firstChild) {
				this.doc.head.insertBefore(metaElement, this.doc.head.firstChild);
			} else {
				this.doc.head.appendChild(metaElement);
			}
		}

		setInputValues() {
			this.doc.querySelectorAll("input:not([type=radio]):not([type=checkbox])").forEach(input => {
				const value = input.getAttribute(util.INPUT_VALUE_ATTRIBUTE_NAME);
				input.setAttribute("value", value || "");
			});
			this.doc.querySelectorAll("input[type=radio], input[type=checkbox]").forEach(input => {
				const value = input.getAttribute(util.INPUT_VALUE_ATTRIBUTE_NAME);
				if (value == "true") {
					input.setAttribute("checked", "");
				}
			});
			this.doc.querySelectorAll("textarea").forEach(textarea => {
				const value = textarea.getAttribute(util.INPUT_VALUE_ATTRIBUTE_NAME);
				textarea.textContent = value || "";
			});
			this.doc.querySelectorAll("select").forEach(select => {
				select.querySelectorAll("option").forEach(option => {
					const selected = option.getAttribute(util.INPUT_VALUE_ATTRIBUTE_NAME) != null;
					if (selected) {
						option.setAttribute("selected", "");
					}
				});
			});
		}

		moveStylesInHead() {
			this.doc.querySelectorAll("style").forEach(stylesheet => {
				if (stylesheet.getAttribute(util.STYLE_ATTRIBUTE_NAME) == "") {
					this.doc.head.appendChild(stylesheet);
				}
			});
		}

		saveFavicon() {
			let faviconElement = this.doc.querySelector("link[href][rel=\"shortcut icon\"]");
			if (!faviconElement) {
				faviconElement = this.doc.querySelector("link[href][rel=\"icon\"]");
			}
			if (!faviconElement) {
				faviconElement = this.doc.createElement("link");
				faviconElement.setAttribute("type", "image/x-icon");
				faviconElement.setAttribute("rel", "shortcut icon");
				faviconElement.setAttribute("href", "/favicon.ico");
			}
			this.doc.head.appendChild(faviconElement);
		}

		saveScrollPosition() {
			if (this.options.scrollPosition && this.options.scrolling == "no" && (this.options.scrollPosition.x || this.options.scrollPosition.y)) {
				const scriptElement = this.doc.createElement("script");
				scriptElement.textContent = "document.currentScript.remove();addEventListener(\"load\",()=>scrollTo(" + this.options.scrollPosition.x + "," + this.options.scrollPosition.y + "))";
				this.doc.body.appendChild(scriptElement);
			}
		}

		replaceCanvasElements() {
			if (this.options.canvases) {
				this.doc.querySelectorAll("canvas").forEach(canvasElement => {
					const attributeValue = canvasElement.getAttribute(util.CANVAS_ATTRIBUTE_NAME);
					if (attributeValue) {
						const canvasData = this.options.canvases[Number(attributeValue)];
						if (canvasData) {
							const backgroundStyle = {};
							if (canvasData.backgroundColor) {
								backgroundStyle["background-color"] = canvasData.backgroundColor;
							}
							this.processorHelper.setBackgroundImage(canvasElement, "url(" + canvasData.dataURI + ")", backgroundStyle);
							this.stats.add("processed", "canvas", 1);
						}
					}
				});
			}
		}

		insertFonts() {
			if (this.options.fonts && this.options.fonts.length) {
				let firstStylesheet = this.doc.querySelector("style, link[rel=stylesheet]"), previousStyleElement;
				this.options.fonts.forEach(fontData => {
					if (fontData["font-family"] && fontData.src) {
						let stylesheetContent = "@font-face{";
						let stylesContent = "";
						Object.keys(fontData).forEach(fontStyle => {
							if (stylesContent) {
								stylesContent += ";";
							}
							stylesContent += fontStyle + ":" + fontData[fontStyle];
						});
						stylesheetContent += stylesContent + "}";
						const styleElement = this.doc.createElement("style");
						styleElement.textContent = stylesheetContent;
						if (previousStyleElement) {
							previousStyleElement.insertAdjacentElement("afterend", styleElement);
						} else if (firstStylesheet) {
							firstStylesheet.parentElement.insertBefore(styleElement, firstStylesheet);
						} else {
							this.doc.head.appendChild(styleElement);
						}
						previousStyleElement = styleElement;
					}
				});
			}
		}

		removeHiddenElements() {
			const hiddenElements = this.doc.querySelectorAll("[" + util.HIDDEN_CONTENT_ATTRIBUTE_NAME + "]");
			const removedElements = this.doc.querySelectorAll("[" + util.REMOVED_CONTENT_ATTRIBUTE_NAME + "]");
			this.stats.set("discarded", "hidden elements", removedElements.length);
			this.stats.set("processed", "hidden elements", removedElements.length);
			if (hiddenElements.length) {
				const styleElement = this.doc.createElement("style");
				styleElement.textContent = ".sf-hidden{display:none!important;}";
				this.doc.head.appendChild(styleElement);
				hiddenElements.forEach(element => {
					if (element.style.getPropertyValue("display") != "none") {
						if (element.style.getPropertyPriority("display") == "important") {
							element.style.setProperty("display", "none", "important");
						} else {
							element.classList.add("sf-hidden");
						}
					}
				});
			}
			removedElements.forEach(element => element.remove());
		}

		resolveHrefs() {
			this.doc.querySelectorAll("a[href], area[href], link[href]").forEach(element => {
				const href = element.getAttribute("href").trim();
				if (element.tagName.toUpperCase() == "LINK" && element.rel.includes("stylesheet")) {
					if (this.options.saveOriginalURLs && !isDataURL(href)) {
						element.setAttribute("data-sf-original-href", href);
					}
				}
				if (!testIgnoredPath(href)) {
					let resolvedURL;
					try {
						resolvedURL = util.resolveURL(href, this.options.baseURI || this.options.url);
					} catch (error) {
						// ignored
					}
					if (resolvedURL) {
						const url = normalizeURL(this.options.url);
						if (resolvedURL.startsWith(url + "#") && !resolvedURL.startsWith(url + "#!") && !this.options.resolveFragmentIdentifierURLs) {
							resolvedURL = resolvedURL.substring(url.length);
						}
						try {
							element.setAttribute("href", resolvedURL);
						} catch (error) {
							// ignored
						}
					}
				}
			});
		}

		async insertMissingVideoPosters() {
			await Promise.all(Array.from(this.doc.querySelectorAll("video[src], video > source[src]")).map(async element => {
				let videoElement;
				if (element.tagName.toUpperCase() == "VIDEO") {
					videoElement = element;
				} else {
					videoElement = element.parentElement;
				}
				if (!videoElement.poster) {
					const attributeValue = videoElement.getAttribute(util.VIDEO_ATTRIBUTE_NAME);
					if (attributeValue) {
						const videoData = this.options.videos[Number(attributeValue)];
						const src = videoData.src || videoElement.src;
						if (src) {
							const temporaryVideoElement = this.doc.createElement("video");
							temporaryVideoElement.src = src;
							temporaryVideoElement.style.setProperty("width", videoData.size.pxWidth + "px", "important");
							temporaryVideoElement.style.setProperty("height", videoData.size.pxHeight + "px", "important");
							temporaryVideoElement.style.setProperty("display", "none", "important");
							temporaryVideoElement.crossOrigin = "anonymous";
							const canvasElement = this.doc.createElement("canvas");
							const context = canvasElement.getContext("2d");
							this.options.doc.body.appendChild(temporaryVideoElement);
							return new Promise(resolve => {
								temporaryVideoElement.currentTime = videoData.currentTime;
								temporaryVideoElement.oncanplay = () => {
									canvasElement.width = videoData.size.pxWidth;
									canvasElement.height = videoData.size.pxHeight;
									context.drawImage(temporaryVideoElement, 0, 0, canvasElement.width, canvasElement.height);
									try {
										videoElement.poster = canvasElement.toDataURL("image/png", "");
									} catch (error) {
										// ignored
									}
									temporaryVideoElement.remove();
									resolve();
								};
								temporaryVideoElement.onerror = () => {
									temporaryVideoElement.remove();
									resolve();
								};
							});
						}
					}
				}
			}));
		}

		resolveStyleAttributeURLs() {
			this.doc.querySelectorAll("[style]").forEach(element => {
				if (this.options.blockStylesheets) {
					element.removeAttribute("style");
				} else {
					const styleContent = element.getAttribute("style");
					const declarationList = db(styleContent, { context: "declarationList", parseCustomProperty: true });
					this.processorHelper.resolveStylesheetURLs(declarationList, this.baseURI, this.workStyleElement);
					this.styles.set(element, declarationList);
				}
			});
		}

		async resolveStylesheetsURLs() {
			await Promise.all(Array.from(this.doc.querySelectorAll("style, link[rel*=stylesheet]")).map(async element => {
				const options = Object.assign({}, this.options, { charset: this.charset });
				let mediaText;
				if (element.media) {
					mediaText = element.media.toLowerCase();
				}
				const scoped = Boolean(element.closest("[" + SHADOWROOT_ATTRIBUTE_NAME + "]"));
				const stylesheetInfo = {
					mediaText,
					scoped
				};
				await this.processorHelper.processLinkElement(element, stylesheetInfo, this.stylesheets, this.baseURI, options, this.workStyleElement, this.resources);
			}));
			if (this.options.rootDocument) {
				const newResources = Object.keys(this.options.updatedResources)
					.filter(url => this.options.updatedResources[url].type == "stylesheet" && !this.options.updatedResources[url].retrieved)
					.map(url => this.options.updatedResources[url]);
				await Promise.all(newResources.map(async resource => {
					resource.retrieved = true;
					if (!this.options.blockStylesheets) {
						const stylesheetInfo = {};
						const element = this.doc.createElement("style");
						this.doc.body.appendChild(element);
						element.textContent = resource.content;
						await this.processorHelper.processStylesheetElement(element, stylesheetInfo, this.stylesheets, this.baseURI, this.options, this.workStyleElement, this.resources);
					}
				}));
			}
		}

		async resolveFrameURLs() {
			const processorHelper = this.processorHelper;
			if (!this.options.saveRawPage) {
				const frameElements = Array.from(this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"));
				await Promise.all(frameElements.map(async frameElement => {
					if (frameElement.tagName.toUpperCase() == "OBJECT") {
						frameElement.setAttribute("data", "data:text/html,");
					} else {
						const src = frameElement.getAttribute("src");
						if (this.options.saveOriginalURLs && src && !isDataURL(src)) {
							frameElement.setAttribute("data-sf-original-src", src);
						}
						frameElement.removeAttribute("src");
						frameElement.removeAttribute("srcdoc");
					}
					Array.from(frameElement.childNodes).forEach(node => node.remove());
					const frameWindowId = frameElement.getAttribute(util.WIN_ID_ATTRIBUTE_NAME);
					if (this.options.frames && frameWindowId) {
						const frameData = this.options.frames.find(frame => frame.windowId == frameWindowId);
						if (frameData) {
							await initializeProcessor(frameData, frameElement, frameWindowId, this.batchRequest, Object.create(this.options));
						}
					}
				}));
			}

			async function initializeProcessor(frameData, frameElement, frameWindowId, batchRequest, options) {
				options.insertSingleFileComment = false;
				options.insertCanonicalLink = false;
				options.insertMetaNoIndex = false;
				options.saveFavicon = false;
				options.includeInfobar = false;
				options.url = frameData.baseURI;
				options.windowId = frameWindowId;
				if (frameData.content) {
					options.content = frameData.content;
					options.canvases = frameData.canvases;
					options.fonts = frameData.fonts;
					options.stylesheets = frameData.stylesheets;
					options.images = frameData.images;
					options.posters = frameData.posters;
					options.videos = frameData.videos;
					options.usedFonts = frameData.usedFonts;
					options.shadowRoots = frameData.shadowRoots;
					options.scrollPosition = frameData.scrollPosition;
					options.scrolling = frameData.scrolling;
					options.adoptedStyleSheets = frameData.adoptedStyleSheets;
					frameData.runner = new Runner(options, processorHelper);
					frameData.frameElement = frameElement;
					await frameData.runner.loadPage();
					await frameData.runner.initialize();
					frameData.maxResources = batchRequest.getMaxResources();
				}
			}
		}

		insertShadowRootContents() {
			const doc = this.doc;
			const options = this.options;
			if (options.shadowRoots && options.shadowRoots.length) {
				processElement(this.doc);
			}

			function processElement(element) {
				const shadowRootElements = Array.from(element.querySelectorAll("[" + util.SHADOW_ROOT_ATTRIBUTE_NAME + "]"));
				shadowRootElements.forEach(element => {
					const attributeValue = element.getAttribute(util.SHADOW_ROOT_ATTRIBUTE_NAME);
					if (attributeValue) {
						const shadowRootData = options.shadowRoots[Number(attributeValue)];
						if (shadowRootData) {
							const templateElement = doc.createElement("template");
							templateElement.setAttribute(SHADOWROOT_ATTRIBUTE_NAME, shadowRootData.mode);
							if (shadowRootData.adoptedStyleSheets && shadowRootData.adoptedStyleSheets.length) {
								shadowRootData.adoptedStyleSheets.forEach(stylesheetContent => {
									const styleElement = doc.createElement("style");
									styleElement.textContent = stylesheetContent;
									templateElement.appendChild(styleElement);
								});
							}
							const shadowDoc = util.parseDocContent(shadowRootData.content);
							if (shadowDoc.head) {
								const metaCharset = shadowDoc.head.querySelector("meta[charset]");
								if (metaCharset) {
									metaCharset.remove();
								}
								shadowDoc.head.childNodes.forEach(node => templateElement.appendChild(shadowDoc.importNode(node, true)));
							}
							if (shadowDoc.body) {
								shadowDoc.body.childNodes.forEach(node => templateElement.appendChild(shadowDoc.importNode(node, true)));
							}
							processElement(templateElement);
							if (element.firstChild) {
								element.insertBefore(templateElement, element.firstChild);
							} else {
								element.appendChild(templateElement);
							}
						}
					}
				});
			}
		}

		removeUnusedStyles() {
			if (!this.mediaAllInfo) {
				this.mediaAllInfo = util.getMediaAllInfo(this.doc, this.stylesheets, this.styles);
			}
			const stats = util.minifyCSSRules(this.stylesheets, this.styles, this.mediaAllInfo);
			this.stats.set("processed", "CSS rules", stats.processed);
			this.stats.set("discarded", "CSS rules", stats.discarded);
		}

		removeUnusedFonts() {
			util.removeUnusedFonts(this.doc, this.stylesheets, this.styles, this.options);
		}

		removeAlternativeMedias() {
			const stats = util.minifyMedias(this.stylesheets);
			this.stats.set("processed", "medias", stats.processed);
			this.stats.set("discarded", "medias", stats.discarded);
		}

		async processStylesheets() {
			await Promise.all([...this.stylesheets].map(([, stylesheetInfo]) =>
				this.processorHelper.processStylesheet(stylesheetInfo.stylesheet.children, this.baseURI, this.options, this.resources, this.batchRequest)
			));
		}

		async processStyleAttributes() {
			return Promise.all([...this.styles].map(([, stylesheet]) =>
				this.processorHelper.processStyle(stylesheet, this.options, this.resources, this.batchRequest)
			));
		}

		async processPageResources() {
			await this.processorHelper.processPageResources(this.doc, this.baseURI, this.options, this.resources, this.styles, this.batchRequest);
		}

		async processScripts() {
			await Promise.all(Array.from(this.doc.querySelectorAll("script[src]")).map(async element => {
				let resourceURL;
				let scriptSrc;
				scriptSrc = element.getAttribute("src");
				if (this.options.saveOriginalURLs && !isDataURL(scriptSrc)) {
					element.setAttribute("data-sf-original-src", scriptSrc);
				}
				element.removeAttribute("integrity");
				if (!this.options.blockScripts) {
					element.textContent = "";
					try {
						resourceURL = util.resolveURL(scriptSrc, this.baseURI);
					} catch (error) {
						// ignored
					}
					if (testValidURL(resourceURL)) {
						element.removeAttribute("src");
						await this.processorHelper.processScript(element, resourceURL);
						if (element.getAttribute("async") == "async" || element.getAttribute(util.ASYNC_SCRIPT_ATTRIBUTE_NAME) == "") {
							element.setAttribute("async", "");
						}
					}
				} else {
					element.removeAttribute("src");
				}
				this.stats.add("processed", "scripts", 1);
			}));
		}

		removeAlternativeImages() {
			util.removeAlternativeImages(this.doc);
		}

		async removeAlternativeFonts() {
			await this.processorHelper.removeAlternativeFonts(this.doc, this.stylesheets, this.resources.fonts, this.options.fontTests);
		}

		async processFrames() {
			if (this.options.frames) {
				const frameElements = Array.from(this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"));
				await Promise.all(frameElements.map(async frameElement => {
					const frameWindowId = frameElement.getAttribute(util.WIN_ID_ATTRIBUTE_NAME);
					if (frameWindowId) {
						const frameData = this.options.frames.find(frame => frame.windowId == frameWindowId);
						if (frameData) {
							this.options.frames = this.options.frames.filter(frame => frame.windowId != frameWindowId);
							if (frameData.runner && frameElement.getAttribute(util.HIDDEN_FRAME_ATTRIBUTE_NAME) != "") {
								this.stats.add("processed", "frames", 1);
								await frameData.runner.run();
								const pageData = await frameData.runner.getPageData();
								frameElement.removeAttribute(util.WIN_ID_ATTRIBUTE_NAME);
								this.processorHelper.processFrame(frameElement, pageData, this.resources, frameWindowId, frameData);
								this.stats.addAll(pageData);
							} else {
								frameElement.removeAttribute(util.WIN_ID_ATTRIBUTE_NAME);
								this.stats.add("discarded", "frames", 1);
							}
						}
					}
				}));
			}
		}

		replaceStylesheets() {
			this.processorHelper.replaceStylesheets(this.doc, this.stylesheets, this.resources, this.options);
		}

		replaceStyleAttributes() {
			this.doc.querySelectorAll("[style]").forEach(element => {
				const declarationList = this.styles.get(element);
				if (declarationList) {
					this.styles.delete(element);
					element.setAttribute("style", this.processorHelper.generateStylesheetContent(declarationList, this.options));
				} else {
					element.setAttribute("style", "");
				}
			});
		}

		insertVariables() {
			const { cssVariables } = this.resources;
			if (cssVariables.size) {
				const styleElement = this.doc.createElement("style");
				const firstStyleElement = this.doc.head.querySelector("style");
				if (firstStyleElement) {
					this.doc.head.insertBefore(styleElement, firstStyleElement);
				} else {
					this.doc.head.appendChild(styleElement);
				}
				let stylesheetContent = "";
				cssVariables.forEach(({ content, url }, indexResource) => {
					cssVariables.delete(indexResource);
					if (stylesheetContent) {
						stylesheetContent += ";";
					}
					stylesheetContent += `${SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource}: `;
					if (this.options.saveOriginalURLs) {
						stylesheetContent += `/* original URL: ${url} */ `;
					}
					stylesheetContent += `url("${content}")`;
				});
				styleElement.textContent = ":root{" + stylesheetContent + "}";
			}
		}

		compressHTML() {
			let size;
			if (this.options.displayStats) {
				size = util.getContentSize(this.doc.documentElement.outerHTML);
			}
			util.minifyHTML(this.doc, { PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME: util.PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME });
			if (this.options.displayStats) {
				this.stats.add("discarded", "HTML bytes", size - util.getContentSize(this.doc.documentElement.outerHTML));
			}
		}

		cleanupPage() {
			this.doc.querySelectorAll("base").forEach(element => element.remove());
			const metaCharset = this.doc.head.querySelector("meta[charset]");
			if (metaCharset) {
				this.doc.head.insertBefore(metaCharset, this.doc.head.firstChild);
				if (this.doc.head.querySelectorAll("*").length == 1 && this.doc.body.childNodes.length == 0) {
					this.doc.head.querySelector("meta[charset]").remove();
				}
			}
		}

		resetZoomLevel() {
			const transform = this.doc.documentElement.style.getPropertyValue("-sf-transform");
			const transformPriority = this.doc.documentElement.style.getPropertyPriority("-sf-transform");
			const transformOrigin = this.doc.documentElement.style.getPropertyValue("-sf-transform-origin");
			const transformOriginPriority = this.doc.documentElement.style.getPropertyPriority("-sf-transform-origin");
			const minHeight = this.doc.documentElement.style.getPropertyValue("-sf-min-height");
			const minHeightPriority = this.doc.documentElement.style.getPropertyPriority("-sf-min-height");
			this.doc.documentElement.style.setProperty("transform", transform, transformPriority);
			this.doc.documentElement.style.setProperty("transform-origin", transformOrigin, transformOriginPriority);
			this.doc.documentElement.style.setProperty("min-height", minHeight, minHeightPriority);
			this.doc.documentElement.style.removeProperty("-sf-transform");
			this.doc.documentElement.style.removeProperty("-sf-transform-origin");
			this.doc.documentElement.style.removeProperty("-sf-min-height");
		}

		async insertMAFFMetaData() {
			const maffMetaData = await this.maffMetaDataPromise;
			if (maffMetaData && maffMetaData.content) {
				const NAMESPACE_RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
				const maffDoc = util.parseXMLContent(maffMetaData.content);
				const originalURLElement = maffDoc.querySelector("RDF > Description > originalurl");
				const archiveTimeElement = maffDoc.querySelector("RDF > Description > archivetime");
				if (originalURLElement) {
					this.options.saveUrl = originalURLElement.getAttributeNS(NAMESPACE_RDF, "resource");
				}
				if (archiveTimeElement) {
					const value = archiveTimeElement.getAttributeNS(NAMESPACE_RDF, "resource");
					if (value) {
						const date = new Date(value);
						if (!isNaN(date.getTime())) {
							this.options.saveDate = new Date(value);
						}
					}
				}
			}
		}

		async setDocInfo() {
			const titleElement = this.doc.querySelector("title");
			const descriptionElement = this.doc.querySelector("meta[name=description]");
			const authorElement = this.doc.querySelector("meta[name=author]");
			const creatorElement = this.doc.querySelector("meta[name=creator]");
			const publisherElement = this.doc.querySelector("meta[name=publisher]");
			const headingElement = this.doc.querySelector("h1");
			this.options.title = titleElement ? titleElement.textContent.trim() : "";
			this.options.info = {
				description: descriptionElement && descriptionElement.content ? descriptionElement.content.trim() : "",
				lang: this.doc.documentElement.lang,
				author: authorElement && authorElement.content ? authorElement.content.trim() : "",
				creator: creatorElement && creatorElement.content ? creatorElement.content.trim() : "",
				publisher: publisherElement && publisherElement.content ? publisherElement.content.trim() : "",
				heading: headingElement && headingElement.textContent ? headingElement.textContent.trim() : ""
			};
			this.options.infobarContent = await util.evalTemplate(this.options.infobarTemplate, this.options, null, true);
		}
	}

	// ----
	// Util
	// ----
	const DATA_URI_PREFIX = "data:";
	const ABOUT_BLANK_URI = "about:blank";
	const BLOB_URI_PREFIX = "blob:";
	const HTTP_URI_PREFIX = /^https?:\/\//;
	const FILE_URI_PREFIX = /^file:\/\//;
	const EMPTY_URL = /^https?:\/\/+\s*$/;
	const NOT_EMPTY_URL = /^(https?:\/\/|file:\/\/|blob:).+/;
	const SINGLE_FILE_VARIABLE_NAME_PREFIX = "--sf-img-";

	function normalizeURL(url) {
		if (!url || url.startsWith(DATA_URI_PREFIX)) {
			return url;
		} else {
			return url.split("#")[0];
		}
	}

	function getOnEventAttributeNames(doc) {
		const element = doc.createElement("div");
		const attributeNames = [];
		for (const propertyName in element) {
			if (propertyName.startsWith("on")) {
				attributeNames.push(propertyName);
			}
		}
		attributeNames.push("onunload");
		return attributeNames;
	}

	function isDataURL(url) {
		return url && (url.startsWith(DATA_URI_PREFIX) || url.startsWith(BLOB_URI_PREFIX));
	}

	function testIgnoredPath(resourceURL) {
		return resourceURL && (resourceURL.startsWith(DATA_URI_PREFIX) || resourceURL == ABOUT_BLANK_URI);
	}

	function testValidPath(resourceURL) {
		return resourceURL && !resourceURL.match(EMPTY_URL);
	}

	function testValidURL(resourceURL) {
		return testValidPath(resourceURL) && (resourceURL.match(HTTP_URI_PREFIX) || resourceURL.match(FILE_URI_PREFIX) || resourceURL.startsWith(BLOB_URI_PREFIX)) && resourceURL.match(NOT_EMPTY_URL);
	}

	// -----
	// Stats
	// -----
	const STATS_DEFAULT_VALUES = {
		discarded: {
			"HTML bytes": 0,
			"hidden elements": 0,
			scripts: 0,
			objects: 0,
			"audio sources": 0,
			"video sources": 0,
			frames: 0,
			"CSS rules": 0,
			canvas: 0,
			stylesheets: 0,
			resources: 0,
			medias: 0
		},
		processed: {
			"HTML bytes": 0,
			"hidden elements": 0,
			scripts: 0,
			objects: 0,
			"audio sources": 0,
			"video sources": 0,
			frames: 0,
			"CSS rules": 0,
			canvas: 0,
			stylesheets: 0,
			resources: 0,
			medias: 0
		}
	};

	class Stats {
		constructor(options) {
			this.options = options;
			if (options.displayStats) {
				this.data = JSON$1.parse(JSON$1.stringify(STATS_DEFAULT_VALUES));
			}
		}
		set(type, subType, value) {
			if (this.options.displayStats) {
				this.data[type][subType] = value;
			}
		}
		add(type, subType, value) {
			if (this.options.displayStats) {
				this.data[type][subType] += value;
			}
		}
		addAll(pageData) {
			if (this.options.displayStats) {
				Object.keys(this.data.discarded).forEach(key => this.add("discarded", key, pageData.stats.discarded[key] || 0));
				Object.keys(this.data.processed).forEach(key => this.add("processed", key, pageData.stats.processed[key] || 0));
			}
		}
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const DEBUG = false;
	const ONE_MB = 1024 * 1024;
	const PREFIX_CONTENT_TYPE_TEXT = "text/";
	const DEFAULT_REPLACED_CHARACTERS = ["~", "+", "\\\\", "?", "%", "*", ":", "|", "\"", "<", ">", "\x00-\x1f", "\x7F"];
	const DEFAULT_REPLACEMENT_CHARACTER = "_";
	const CONTENT_TYPE_EXTENSIONS = {
		"image/svg+xml": ".svg",
		"image/png": ".png",
		"image/jpeg": ".jpg",
		"image/gif": ".gif",
		"image/webp": ".webp"
	};

	const URL$1 = globalThis.URL;
	const DOMParser$1 = globalThis.DOMParser;
	const Blob$1 = globalThis.Blob;
	const FileReader$1 = globalThis.FileReader;
	const fetch$1 = (url, options) => globalThis.fetch(url, options);
	const crypto = globalThis.crypto;
	const TextDecoder$1 = globalThis.TextDecoder;
	const TextEncoder = globalThis.TextEncoder;

	function getInstance(utilOptions) {
		utilOptions = utilOptions || {};
		utilOptions.fetch = utilOptions.fetch || fetch$1;
		utilOptions.frameFetch = utilOptions.frameFetch || utilOptions.fetch || fetch$1;
		return {
			getDoctypeString,
			getFilenameExtension(resourceURL, replacedCharacters, replacementCharacter) {
				const matchExtension = new URL$1(resourceURL).pathname.match(/(\.[^\\/.]*)$/);
				return ((matchExtension && matchExtension[1] && this.getValidFilename(matchExtension[1], replacedCharacters, replacementCharacter)) || "").toLowerCase();
			},
			getContentTypeExtension(contentType) {
				return CONTENT_TYPE_EXTENSIONS[contentType] || "";
			},
			getContent,
			parseURL(resourceURL, baseURI) {
				if (baseURI === undefined) {
					return new URL$1(resourceURL);
				} else {
					return new URL$1(resourceURL, baseURI);
				}
			},
			resolveURL(resourceURL, baseURI) {
				return this.parseURL(resourceURL, baseURI).href;
			},
			getSearchParams(searchParams) {
				return Array.from(new URLSearchParams(searchParams));
			},
			getValidFilename(filename, replacedCharacters = DEFAULT_REPLACED_CHARACTERS, replacementCharacter = DEFAULT_REPLACEMENT_CHARACTER) {
				replacedCharacters.forEach(replacedCharacter => filename = filename.replace(new RegExp("[" + replacedCharacter + "]+", "g"), replacementCharacter));
				filename = filename
					.replace(/\.\.\//g, "")
					.replace(/^\/+/, "")
					.replace(/\/+/g, "/")
					.replace(/\/$/, "")
					.replace(/\.$/, "")
					.replace(/\.\//g, "." + replacementCharacter)
					.replace(/\/\./g, "/" + replacementCharacter);
				return filename;
			},
			parseDocContent(content, baseURI) {
				const doc = (new DOMParser$1()).parseFromString(content, "text/html");
				if (!doc.head) {
					doc.documentElement.insertBefore(doc.createElement("HEAD"), doc.body);
				}
				let baseElement = doc.querySelector("base");
				if (!baseElement || !baseElement.getAttribute("href")) {
					if (baseElement) {
						baseElement.remove();
					}
					baseElement = doc.createElement("base");
					baseElement.setAttribute("href", baseURI);
					doc.head.insertBefore(baseElement, doc.head.firstChild);
				}
				return doc;
			},
			parseXMLContent(content) {
				return (new DOMParser$1()).parseFromString(content, "text/xml");
			},
			parseSVGContent(content) {
				const doc = (new DOMParser$1()).parseFromString(content, "image/svg+xml");
				if (doc.querySelector("parsererror")) {
					return (new DOMParser$1()).parseFromString(content, "text/html");
				} else {
					return doc;
				}
			},
			async digest(algo, text) {
				try {
					const hash = await crypto.subtle.digest(algo, new TextEncoder("utf-8").encode(text));
					return hex(hash);
				} catch (error) {
					return "";
				}
			},
			getContentSize(content) {
				return new Blob$1([content]).size;
			},
			formatFilename(content, options) {
				return formatFilename(content, options, this);
			},
			evalTemplate(template, options, content, dontReplaceSlash) {
				return evalTemplate(template, options, this, content, dontReplaceSlash);
			},
			minifyHTML(doc, options) {
				return process$1(doc, options);
			},
			minifyCSSRules(stylesheets, styles, mediaAllInfo) {
				return process$3(stylesheets, styles, mediaAllInfo);
			},
			removeUnusedFonts(doc, stylesheets, styles, options) {
				return process$5(doc, stylesheets, styles, options);
			},
			getMediaAllInfo(doc, stylesheets, styles) {
				return getMediaAllInfo(doc, stylesheets, styles);
			},
			compressCSS(content, options) {
				return processString(content, options);
			},
			minifyMedias(stylesheets) {
				return process$4(stylesheets);
			},
			removeAlternativeImages(doc) {
				return process$2(doc);
			},
			parseSrcset(srcset) {
				return process$6(srcset);
			},
			preProcessDoc(doc, win, options) {
				return preProcessDoc(doc, win, options);
			},
			postProcessDoc(doc, markedElements, invalidElements) {
				postProcessDoc(doc, markedElements, invalidElements);
			},
			serialize(doc, compressHTML) {
				return process(doc, compressHTML);
			},
			removeQuotes(string) {
				return removeQuotes$1(string);
			},
			appendInfobar(doc, options) {
				return appendInfobar(doc, options);
			},
			ON_BEFORE_CAPTURE_EVENT_NAME: ON_BEFORE_CAPTURE_EVENT_NAME,
			ON_AFTER_CAPTURE_EVENT_NAME: ON_AFTER_CAPTURE_EVENT_NAME,
			WIN_ID_ATTRIBUTE_NAME: WIN_ID_ATTRIBUTE_NAME,
			REMOVED_CONTENT_ATTRIBUTE_NAME: REMOVED_CONTENT_ATTRIBUTE_NAME,
			HIDDEN_CONTENT_ATTRIBUTE_NAME: HIDDEN_CONTENT_ATTRIBUTE_NAME,
			HIDDEN_FRAME_ATTRIBUTE_NAME: HIDDEN_FRAME_ATTRIBUTE_NAME,
			IMAGE_ATTRIBUTE_NAME: IMAGE_ATTRIBUTE_NAME,
			POSTER_ATTRIBUTE_NAME: POSTER_ATTRIBUTE_NAME,
			VIDEO_ATTRIBUTE_NAME: VIDEO_ATTRIBUTE_NAME,
			CANVAS_ATTRIBUTE_NAME: CANVAS_ATTRIBUTE_NAME,
			STYLE_ATTRIBUTE_NAME: STYLE_ATTRIBUTE_NAME,
			INPUT_VALUE_ATTRIBUTE_NAME: INPUT_VALUE_ATTRIBUTE_NAME,
			SHADOW_ROOT_ATTRIBUTE_NAME: SHADOW_ROOT_ATTRIBUTE_NAME,
			PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME: PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME,
			STYLESHEET_ATTRIBUTE_NAME: STYLESHEET_ATTRIBUTE_NAME,
			SELECTED_CONTENT_ATTRIBUTE_NAME: SELECTED_CONTENT_ATTRIBUTE_NAME,
			INVALID_ELEMENT_ATTRIBUTE_NAME: INVALID_ELEMENT_ATTRIBUTE_NAME,
			COMMENT_HEADER: COMMENT_HEADER,
			COMMENT_HEADER_LEGACY: COMMENT_HEADER_LEGACY,
			SINGLE_FILE_UI_ELEMENT_CLASS: SINGLE_FILE_UI_ELEMENT_CLASS,
			EMPTY_RESOURCE: EMPTY_RESOURCE$1,
			INFOBAR_TAGNAME: INFOBAR_TAGNAME,
			WAIT_FOR_USERSCRIPT_PROPERTY_NAME: WAIT_FOR_USERSCRIPT_PROPERTY_NAME,
			NO_SCRIPT_PROPERTY_NAME: NO_SCRIPT_PROPERTY_NAME
		};

		async function getContent(resourceURL, options) {
			let response, startTime, networkTimeoutId, networkTimeoutPromise, resolveNetworkTimeoutPromise;
			const fetchResource = utilOptions.fetch;
			const fetchFrameResource = utilOptions.frameFetch;
			if (options.blockMixedContent && /^https:/i.test(options.baseURI) && !/^https:/i.test(resourceURL)) {
				return getFetchResponse(resourceURL, options);
			}
			if (options.networkTimeout) {
				networkTimeoutPromise = new Promise((resolve, reject) => {
					resolveNetworkTimeoutPromise = resolve;
					networkTimeoutId = globalThis.setTimeout(() => reject(new Error("network timeout")), options.networkTimeout);
				});
			} else {
				networkTimeoutPromise = new Promise(resolve => {
					resolveNetworkTimeoutPromise = resolve;
				});
			}
			try {
				const accept = options.acceptHeaders ? options.acceptHeaders[options.expectedType] : "*/*";
				if (options.frameId) {
					try {
						response = await Promise.race([
							fetchFrameResource(resourceURL, { frameId: options.frameId, referrer: options.resourceReferrer, headers: { accept } }),
							networkTimeoutPromise
						]);
					} catch (error) {
						response = await Promise.race([
							fetchResource(resourceURL, { headers: { accept } }),
							networkTimeoutPromise
						]);
					}
				} else {
					response = await Promise.race([
						fetchResource(resourceURL, { referrer: options.resourceReferrer, headers: { accept } }),
						networkTimeoutPromise
					]);
				}
			} catch (error) {
				return getFetchResponse(resourceURL, options);
			} finally {
				resolveNetworkTimeoutPromise();
				if (options.networkTimeout) {
					globalThis.clearTimeout(networkTimeoutId);
				}
			}
			let buffer;
			try {
				buffer = await response.arrayBuffer();
			} catch (error) {
				return options.inline ? { data: options.asBinary ? EMPTY_RESOURCE$1 : "", resourceURL } : { resourceURL };
			}
			resourceURL = response.url || resourceURL;
			let contentType = "", charset;
			try {
				const mimeType = new MIMEType(response.headers.get("content-type"));
				contentType = mimeType.type + "/" + mimeType.subtype;
				charset = mimeType.parameters.get("charset");
			} catch (error) {
				// ignored
			}
			if (!contentType) {
				contentType = guessMIMEType(options.expectedType, buffer);
			}
			if (!charset && options.charset) {
				charset = options.charset;
			}
			if (options.asBinary) {
				if (response.status >= 400) {
					return getFetchResponse(resourceURL, options);
				}
				try {
					if (DEBUG) ;
					if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
						return getFetchResponse(resourceURL, options);
					} else {
						return getFetchResponse(resourceURL, options, buffer, null, contentType);
					}
				} catch (error) {
					return getFetchResponse(resourceURL, options);
				}
			} else {
				if (response.status >= 400 || (options.validateTextContentType && contentType && !contentType.startsWith(PREFIX_CONTENT_TYPE_TEXT))) {
					return getFetchResponse(resourceURL, options);
				}
				if (!charset) {
					charset = "utf-8";
				}
				if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
					return getFetchResponse(resourceURL, options, null, charset);
				} else {
					try {
						return getFetchResponse(resourceURL, options, buffer, charset, contentType);
					} catch (error) {
						return getFetchResponse(resourceURL, options, null, charset);
					}
				}
			}
		}
	}

	async function getFetchResponse(resourceURL, options, data, charset, contentType) {
		if (data) {
			if (options.asBinary) {
				if (options.inline)	{
					const reader = new FileReader$1();
					reader.readAsDataURL(new Blob$1([data], { type: contentType + (options.charset ? ";charset=" + options.charset : "") }));
					data = await new Promise((resolve, reject) => {
						reader.addEventListener("load", () => resolve(reader.result), false);
						reader.addEventListener("error", reject, false);
					});
				} else {
					data = new Uint8Array(data);
				}
			} else {
				const firstBytes = new Uint8Array(data.slice(0, 4));
				if (firstBytes[0] == 132 && firstBytes[1] == 49 && firstBytes[2] == 149 && firstBytes[3] == 51) {
					charset = "gb18030";
				} else if (firstBytes[0] == 255 && firstBytes[1] == 254) {
					charset = "utf-16le";
				} else if (firstBytes[0] == 254 && firstBytes[1] == 255) {
					charset = "utf-16be";
				}
				try {
					data = new TextDecoder$1(charset).decode(data);
				} catch (error) {
					charset = "utf-8";
					data = new TextDecoder$1(charset).decode(data);
				}
				data = data.replace(/\ufeff/gi, "");
			}
		} else if (options.inline) {
			data = options.asBinary ? EMPTY_RESOURCE$1 : "";
		}
		return { data, resourceURL, charset, contentType };
	}

	function guessMIMEType(expectedType, buffer) {
		if (expectedType == "image") {
			if (compareBytes([255, 255, 255, 255], [0, 0, 1, 0])) {
				return "image/x-icon";
			}
			if (compareBytes([255, 255, 255, 255], [0, 0, 2, 0])) {
				return "image/x-icon";
			}
			if (compareBytes([255, 255], [78, 77])) {
				return "image/bmp";
			}
			if (compareBytes([255, 255, 255, 255, 255, 255], [71, 73, 70, 56, 57, 97])) {
				return "image/gif";
			}
			if (compareBytes([255, 255, 255, 255, 255, 255], [71, 73, 70, 56, 59, 97])) {
				return "image/gif";
			}
			if (compareBytes([255, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255], [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80, 86, 80])) {
				return "image/webp";
			}
			if (compareBytes([255, 255, 255, 255, 255, 255, 255, 255], [137, 80, 78, 71, 13, 10, 26, 10])) {
				return "image/png";
			}
			if (compareBytes([255, 255, 255], [255, 216, 255])) {
				return "image/jpeg";
			}
		}
		if (expectedType == "font") {
			if (compareBytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255],
				[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 80])) {
				return "application/vnd.ms-fontobject";
			}
			if (compareBytes([255, 255, 255, 255], [0, 1, 0, 0])) {
				return "font/ttf";
			}
			if (compareBytes([255, 255, 255, 255], [79, 84, 84, 79])) {
				return "font/otf";
			}
			if (compareBytes([255, 255, 255, 255], [116, 116, 99, 102])) {
				return "font/collection";
			}
			if (compareBytes([255, 255, 255, 255], [119, 79, 70, 70])) {
				return "font/woff";
			}
			if (compareBytes([255, 255, 255, 255], [119, 79, 70, 50])) {
				return "font/woff2";
			}
		}

		function compareBytes(mask, pattern) {
			let patternMatch = true, index = 0;
			if (buffer.byteLength >= pattern.length) {
				const value = new Uint8Array(buffer, 0, mask.length);
				for (index = 0; index < mask.length && patternMatch; index++) {
					patternMatch = patternMatch && ((value[index] & mask[index]) == pattern[index]);
				}
				return patternMatch;
			}
		}
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
	function hex(buffer) {
		const hexCodes = [];
		const view = new DataView(buffer);
		for (let i = 0; i < view.byteLength; i += 4) {
			const value = view.getUint32(i);
			const stringValue = value.toString(16);
			const padding = "00000000";
			const paddedValue = (padding + stringValue).slice(-padding.length);
			hexCodes.push(paddedValue);
		}
		return hexCodes.join("");
	}

	function getDoctypeString(doc) {
		const docType = doc.doctype;
		let docTypeString = "";
		if (docType) {
			docTypeString = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeString += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId)
					docTypeString += " \"" + docType.systemId + "\"";
			} else if (docType.systemId)
				docTypeString += " SYSTEM \"" + docType.systemId + "\"";
			if (docType.internalSubset)
				docTypeString += " [" + docType.internalSubset + "]";
			docTypeString += "> ";
		}
		return docTypeString;
	}

	function log(...args) {
		console.log("S-File <browser>", ...args); // eslint-disable-line no-console
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	exports.SingleFile = void 0;

	function init(initOptions) {
		if (typeof exports.SingleFile == "undefined") {
			exports.SingleFile = getClass(getInstance(initOptions));
		}
	}

	async function getPageData(options = {}, initOptions, doc = globalThis.document, win = globalThis) {
		const frames = contentFrameTree;
		let framesSessionId;
		init(initOptions);
		if (doc && win) {
			initDoc(doc);
			const preInitializationPromises = [];
			if (!options.saveRawPage) {
				let lazyLoadPromise;
				if (options.loadDeferredImages) {
					lazyLoadPromise = process$7(options);
					if (options.loadDeferredImagesBeforeFrames) {
						await lazyLoadPromise;
					}
				}
				if (!options.removeFrames && frames && globalThis.frames) {
					let frameTreePromise;
					if (options.loadDeferredImages) {
						frameTreePromise = new Promise(resolve => globalThis.setTimeout(() => resolve(frames.getAsync(options)), options.loadDeferredImagesBeforeFrames || !options.loadDeferredImages ? 0 : options.loadDeferredImagesMaxIdleTime));
					} else {
						frameTreePromise = frames.getAsync(options);
					}
					if (options.loadDeferredImagesBeforeFrames) {
						options.frames = await frameTreePromise;
					} else {
						preInitializationPromises.push(frameTreePromise);
					}
				}
				if (options.loadDeferredImages && !options.loadDeferredImagesBeforeFrames) {
					preInitializationPromises.push(lazyLoadPromise);
				}
			}
			if (!options.loadDeferredImagesBeforeFrames) {
				[options.frames] = await Promise.all(preInitializationPromises);
			}
			framesSessionId = options.frames && options.frames.sessionId;
		}
		options.doc = doc;
		options.win = win;
		options.insertCanonicalLink = true;
		options.onprogress = event => {
			if (event.type === event.RESOURCES_INITIALIZED && doc && win && options.loadDeferredImages) {
				resetZoomLevel(options);
			}
		};
		const processor = new exports.SingleFile(options);
		await processor.run();
		if (framesSessionId) {
			frames.cleanup(framesSessionId);
		}
		const pageData = await processor.getPageData();
		if (options.compressContent) {
			const blob = await process$9(pageData, {
				insertTextBody: options.insertTextBody,
				url: options.url,
				createRootDirectory: options.createRootDirectory,
				selfExtractingArchive: options.selfExtractingArchive,
				extractDataFromPage: options.extractDataFromPage,
				insertCanonicalLink: options.insertCanonicalLink,
				insertMetaNoIndex: options.insertMetaNoIndex,
				password: options.password,
				zipScript: options.zipScript
			});
			delete pageData.resources;
			const reader = new globalThis.FileReader();
			reader.readAsArrayBuffer(blob);
			const arrayBuffer = await new Promise((resolve, reject) => {
				reader.addEventListener("load", () => resolve(reader.result), false);
				reader.addEventListener("error", event => reject(event.detail.error), false);
			});
			pageData.content = Array.from(new Uint8Array(arrayBuffer));
		}
		return pageData;
	}

	exports.getPageData = getPageData;
	exports.helper = helper$4;
	exports.init = init;
	exports.modules = index;
	exports.processors = index$2;
	exports.vendor = index$1;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
