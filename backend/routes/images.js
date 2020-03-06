const express = require('express');
const router = express.Router();

const { exec } = require('child_process');
const date = require('date-and-time');
const fs = require('fs');
const multer = require('multer');
const now = new Date();

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;

const CryptoJS = require("crypto-js");
const IpfsClient = require('ipfs-http-client');

const Async = require('async');
const bsplit = require('buffer-split');

const ipfs = IpfsClient({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});

const TextEncodingShim = require('text-encoding-shim');
const TextEncoder = TextEncodingShim.TextEncoder;
const TextDecoder = TextEncodingShim.TextDecoder;

const btoa = require('btoa');

const bs58 = require('bs58');

const Tx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
// infura api
const web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/"+API_key));

// insert mongodb uri
const dbUrl = 'mongodb://';
let db;

MongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
	if (err) console.log('Unable to connect to the Server', err);
	db = client.db('drhuang');
});

// upload image
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './public/images/');
	},
	filename: (req, file, cb) => {
		cb(null, dateToString(now) + file.originalname);
	}
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 25 * 1024 * 1024
	},
});

const abi = [
	{
		"constant": false,
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_dataId",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_time",
				"type": "uint256"
			}
		],
		"name": "newAccess",
		"outputs": [
			{
				"internalType": "bool",
				"name": "success",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_dataId",
				"type": "bytes32"
			},
			{
				"internalType": "string",
				"name": "_hash",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "_exist",
				"type": "bool"
			}
		],
		"name": "newData",
		"outputs": [
			{
				"internalType": "bool",
				"name": "success",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "accessIndex",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "accessStructs",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "dataKey",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "time",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "dataIndex",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "dataStructs",
		"outputs": [
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "exists",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_dataRow",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_time",
				"type": "uint256"
			}
		],
		"name": "getData",
		"outputs": [
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getDataCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "count",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
]

function dateToString(dates) {
	let datestr = new Date(dates);
	datestr = date.format(datestr, 'YYYYMMDDHHmmss');

	return datestr;
}

function dateToStringReadable(dates) {
	let datestr = new Date(dates);
	datestr = date.format(datestr, 'YYYY-MM-DD HH:mm:ss');

	return datestr;
}

function sleep(time, callback) {
	let stop = new Date().getTime();
	while(new Date().getTime() < stop + time) {
		;
	}
	callback();
}

function describeData(data) {
	let char = data.split("");

	if(char[0] == '1') {
		spot = 'Face'
	} else if(char[0] == '2') {
		spot = 'Left Eye'
	} else if(char[0] == '3') {
		spot = 'Right Eye'
	} else if(char[0] == '4') {
		spot = 'Mouth'
	} else if(char[0] == '5') {
		spot = 'Nose'
	}

	if(char[1] == '6') {
		symptom = 'Normal'
	} else if(char[1] == '7') {
		symptom = 'Nothing'
	} else if(char[1] == '8') {
		symptom = 'Itchy'
	} else if(char[1] == '9') {
		symptom = 'Swollen'
	} else if(char[1] == 'a') {
		symptom = 'Burn'
	}

	if(char[2] == 'm') {
		degree = 'Front'
	} else if(char[2] == '8') {
		degree = 'Left'
	} else if(char[2] == '9') {
		degree = 'Right'
	}

	if(char[3] == '0') {
		diagnosis = 'Normal'
	} else if(char[3] == '1') {
		diagnosis = 'Food Alergies'
	} else if(char[3] == '2') {
		diagnosis = 'Fever'
	} else if(char[3] == '3') {
		diagnosis = 'Dust Mites'
	}

	if(char[4] == '0') {
		surgeryTreat = 'No Treatment'
	} else if(char[4] == '1') {
		surgeryTreat = 'Face Lifting'
	} else if(char[4] == '2') {
		surgeryTreat = 'Botox'
	} else if(char[4] == '3') {
		surgeryTreat = 'Chin Surgery'
	} else if(char[4] == '4') {
		surgeryTreat = 'Eye Lid Surgery'
	}

	if(char[5] == '0') {
		nonSurgeryTreat = 'No Treatment'
	} else if(char[5] == '1') {
		nonSurgeryTreat = 'Facial'
	} else if(char[5] == '2') {
		nonSurgeryTreat = 'Medicine'
	} else if(char[5] == '3') {
		nonSurgeryTreat = 'Cold Compress'
	}

	let result = {
		objects: spot,
		relationships: 'normal',
		symptoms: symptom,
		degrees: degree,
		diagnosis: diagnosis,
		surgicaltreat: surgeryTreat,
		nonsurgicaltreat: nonSurgeryTreat
	}

	return result;
}

function describeColor(colors) {
	let hex = '';
	
	if(colors) {
		let color = colors.split(' ');
		
		if(parseInt(color[0]) == 1) {
			hex += 'FF';
		} else {
			hex += '00';
		}

		if(parseInt(color[1]) == 1) {
			hex += 'FF';
		} else {
			hex += '00';
		}

		if(parseInt(color[2]) == 1) {
			hex += 'FF';
		} else {
			hex += '00';
		}
	}

	return hex;
}

function callEncrypt(argument) {
	const wordArray = CryptoJS.lib.WordArray.create(argument);
	const str = CryptoJS.enc.Hex.stringify(wordArray);
	ct = CryptoJS.AES.encrypt(str, '123');
	ctstr = ct.toString();

	return ctstr;
}

function toString(words){
	return CryptoJS.enc.Utf8.stringify(words);
}

function uintToString(uintArray) {
	var decodedStr = new Buffer.from(uintArray, 'utf-8');
	return decodedStr;
}

function wordToByteArray(word, length) {
	var ba = [],
		i,
		xFF = 0xFF;
	if (length > 0)
		ba.push(word >>> 24);
	if (length > 1)
		ba.push((word >>> 16) & xFF);
	if (length > 2)
		ba.push((word >>> 8) & xFF);
	if (length > 3)
		ba.push(word & xFF);

	return ba;
}

function flatten(arr, result = []) {
	for (let i = 0, length = arr.length; i < length; i++) {
		const value = arr[i];
		if (Array.isArray(value)) {
			flatten(value, result);
		} else {
			result.push(value);
		}
	}
	return result;
};

function wordArrayToByteArray(wordArray, length) {
	if (wordArray.hasOwnProperty("sigBytes") && wordArray.hasOwnProperty("words")) {
		length = wordArray.sigBytes;
		wordArray = wordArray.words;
	}

	var result = [],
		bytes,
		i = 0;
	while (length > 0) {
		bytes = wordToByteArray(wordArray[i], Math.min(4, length));
		length -= bytes.length;
		result.push(bytes);	
		i++;
	}

	let final = flatten(result);
	return final;
}

function toImage(str) {
	const wordArray = CryptoJS.enc.Hex.parse(str);

	BaText = wordArrayToByteArray(wordArray, wordArray.length);

	return BaText;
}

router.post('/upload-image', upload.single('image_file'), (req, res) => {
	let filename = req.file.filename;
	let username = req.query.username;

	exec('darknet detector test requirement\\obj.data requirement\\obj-tiny.cfg weight\\obj-tiny_last.weights public\\images\\'+filename+' gpu 0 -dont_show > public\\results\\texts\\result'+username+'_'+dateToString(now)+'.txt', (error, stdout, stderr) => {
	});

	sleep(7000, function() {
		exec('copy predictions.jpg public\\results\\images\\prediction'+username+'_'+dateToString(now)+'.jpg', (error, stdout, stderr) => {
		});
		
		fs.readFile('public\\results\\texts\\result'+username+'_'+dateToString(now)+'.txt', 'utf8', (err, data) => {
			if(err) res.send({err: 1, message: 'something went wrong while reading result. Please try again in a moment.'});
			let text = data;
			text = text.split('\r\n');

			let results = [];
			let counter = 1;
			for(let i = 0; i < (text.length - 1); i++) {
				if(i > 2) {
					values = text[i].split(',');
					value = {
						number 		: counter,
						prediction 	: describeData(values[0]),
						score 		: values[1],
						color 		: describeColor(values[2])
					}
					counter += 1;
					results.push(value);
				}
			}

			let dbData = {
				username 		: username,
				result 			: results,
				file_original	: filename,
				file_box		: 'prediction'+username+'_'+dateToString(now)+'.jpg',
				create_at 		: new Date()
			}

			db.collection('images').insertOne(dbData, (err, result) => {
				if (err) {
					res.status(400);
					res.send({error: 1, message: err});
				}
				res.send({id: result.insertedId, username: username});
			});
		})
	})
});

router.get('/bytes32', (req, res) => {
	const bs58 = require('bs58');
	// const crypto = require('crypto');

	// change from ipfs hash to base32
	let ipfsListing = ''; // ipfs address
	let base32 = "0x"+bs58.decode(ipfsListing).slice(2).toString('hex');

	// // change from base32 to ipfs hash
	// let bytes32Hex = base32;
	// let hashHex = "1220" + bytes32Hex.slice(2);
	// let hashBytes = Buffer.from(hashHex, 'hex');
	// let hashStr = bs58.encode(hashBytes);

	// console.log(hashStr);

	res.send(base32);
});

router.get('/data', async(req, res) => {

	// private data by owner
	let address = ''; // address
	let privateKey = ''; // get private key
	privateKey = Buffer.from(privateKey.substring(2), 'hex');

	// contract
	let contract = new web3.eth.Contract(abi, ''); // contract address

	// inserted data
	let allowedAddress = ['', '']; // list of allowed address
	let dataId = ''; // data_id, generated using base32

	// **************************************** DATA **************************************** //
	let dataTypes = ['bytes32', 'string', 'bool'];
	let dataArgs = [dataId, dataId, '1'];

	// creating hex data
	let dataSign = await web3.eth.abi.encodeFunctionSignature({
		name: 'newData',
		type: 'function',
		inputs: [{
			type: 'bytes32',
			name: '_dataId'
		},{
			type: 'string',
			name: '_hash'
		},{
			type: 'bool',
			name: '_exist'
		}]
	});
	let dataBody = await web3.eth.abi.encodeParameters(dataTypes, dataArgs);
	let dataData = dataSign + dataBody.substring(2);

	// creating rawdata
	let dataGasPrice = await web3.eth.getGasPrice();
	res.send(dataGasPrice);
	// let dataTxCount = await web3.eth.getTransactionCount(address);
	// let dataObject = {
	// 	nonce:    web3.utils.toHex(dataTxCount),
	// 	to:       '', // address
	// 	data:     dataData,
	// 	gasLimit: web3.utils.toHex(300000),
	// 	gasPrice: web3.utils.toHex(dataGasPrice)
	// }
	// let dataTx = new Tx(dataObject, { chain: 'ropsten', hardfork: 'istanbul' });
	// dataTx.sign(privateKey);
	// let dataSerializedTx = '0x'+dataTx.serialize().toString('hex');

	// let insertData = await web3.eth.sendSignedTransaction(dataSerializedTx)
	// 	.on('transactionHash', function (hash) {
	// 		console.log(100, hash)
	// 	})
	// 	.on('receipt', function (receipt) {
	// 		console.log(101, receipt)
	// 	})
	// 	.on('confirmation', function (confirmationNumber, receipt) {
	// 		console.log(102, confirmationNumber, receipt)
	// 	})
	// 	.on('error', (e) => {
	// 		console.log(103, e)
	// 	});

	// // **************************************** ACCESS **************************************** //
	// let accessTypes = ['bytes32', 'address', 'uint256'];
	// let accessArgs = [dataId, '', '100']; // address

	// // creating hex data
	// let accessSign = await web3.eth.abi.encodeFunctionSignature({
	// 	name: 'newAccess',
	// 	type: 'function',
	// 	inputs: [{
	// 		type: 'bytes32',
	// 		name: '_dataId'
	// 	},{
	// 		type: 'address',
	// 		name: '_user'
	// 	},{
	// 		type: 'uint256',
	// 		name: '_time'
	// 	}]
	// });
	// let accessbody = await web3.eth.abi.encodeParameters(accessTypes, accessArgs);
	// let accessData = accessSign + accessbody.substring(2);

	// // creating rawdata
	// let accessGasPrice = await web3.eth.getGasPrice();
	// let accessTxCount = await web3.eth.getTransactionCount(address);
	// let accessObject = {
	// 	nonce:    web3.utils.toHex(accessTxCount),
	// 	to:       '', // address
	// 	data:     accessData,
	// 	gasLimit: web3.utils.toHex(1000000),
	// 	gasPrice: web3.utils.toHex(accessGasPrice)
	// }
	// let accessTx = new Tx(accessObject, { chain: 'ropsten', hardfork: 'istanbul' });
	// accessTx.sign(privateKey);
	// let accessSerializedTx = '0x'+accessTx.serialize().toString('hex');

	// let insertAccess = await web3.eth.sendSignedTransaction(accessSerializedTx)
	// 	.on('transactionHash', function (hash) {
	// 		console.log(100, hash)
	// 	})
	// 	.on('receipt', function (receipt) {
	// 		console.log(101, receipt)
	// 	})
	// 	.on('confirmation', function (confirmationNumber, receipt) {
	// 		console.log(102, confirmationNumber, receipt)
	// 	})
	// 	.on('error', (e) => {
	// 		console.log(103, e)
	// 	});;

	// res.send({
	// 	data: insertData, 
	// 	access: insertAccess
	// });
});

router.get('/asdasd', async (req, res) => {
	let dataId = web3.utils.randomHex(32);

	let address = ''; // address
	
	let balance = await web3.eth.getBalance(address);
	balance = web3.utils.fromWei(balance, 'ether');
	balance = parseFloat(balance).toFixed(5);

	// contract
	let contract = new web3.eth.Contract(abi, ''); // contract address
	contract.methods.getDataCount().call().then(console.log);
	contract.methods.getData(1, '', 50).call().then(console.log); // address

	res.send({balance: balance});
});

router.post('/desc-image', upload.single('image_file'), async (req, res) => {
	let filename = req.file.filename;
	let username = req.query.username;

	let buffer = [];
	Async.eachSeries(
		['public\\images\\'+filename, 'public\\images\\'+filename, 'public\\results\\texts\\resultvicky_20191222213114.txt'],
		function(filename, cb) {
			fs.readFile(filename, (err, content) => {
				if(!err) {
					let enctext = callEncrypt(content);

					let testBuffer = new Buffer.from(enctext);
					buffer.push(testBuffer);
				}

				cb(err);
			});
		},
		async function(err) {
			let sep = new Buffer.alloc(2);
			sep.write(";", 0, 1, 'ascii');

			let buf = Buffer.concat([buffer[0], sep, buffer[1], sep, buffer[2]]);
			let original_hash = await ipfs.add(buf);

			let base32 = "0x"+bs58.decode(original_hash[0].hash).slice(2).toString('hex');

			res.send(base32)
		}
	);

	// <Buffer 55 32 46 73 64 47 56 6b 58 31 2f 46 35 4e 59 51 59 4a 6d 67 61 59 58 6e 65 33 35 56 52 62 79 53 78 39 75 67 6b 53 4c 7a 35 53 6a 58 62 6e 68 6b 50 55 ... >
	// <Buffer 55 32 46 73 64 47 56 6b 58 31 2f 53 65 30 42 74 4d 47 6e 47 73 61 6f 66 66 5a 36 70 37 4d 4e 2f 62 35 46 34 55 35 6f 49 73 64 56 59 61 6b 50 62 55 69 ... >
	// <Buffer 55 32 46 73 64 47 56 6b 58 31 39 77 57 67 70 74 78 48 62 33 66 41 36 77 4a 57 72 32 54 4b 54 51 5a 4f 42 34 75 64 63 7a 37 38 4f 30 4a 2f 65 6b 6c 59 ... >

	// ipfs.get('', (err, files) => { // ipfs address
	// 	let content = files[0].content;

	// 	let sep = new Buffer.alloc(2);
	// 	sep.write(";", 0, 1, 'ascii');

	// 	let result = bsplit(content, sep);

	// 	// result.forEach( (element, index) => {
	// 	let str = new TextDecoder("utf-8").decode(result[0]);

	// 	let decrypted = CryptoJS.AES.decrypt(str, '123');

	// 	let str1 = decrypted.toString(CryptoJS.enc.Utf8);

	// 	const wordArray = CryptoJS.enc.Hex.parse(str1);
	// 	BaText = wordArrayToByteArray(wordArray, wordArray.length);

	// 	let q = "data:image/png;base64,"+ btoa(BaText.reduce(function (data, byte) {
	// 		return data + String.fromCharCode(byte);
	// 	}, ''));

	// 	console.log(q); //ini hasil gambarnya

	// 	res.send('ok');
	// });



	// exec('darknet detector test requirement\\obj.data requirement\\obj-tiny.cfg weight\\obj-tiny_last.weights public\\images\\'+filename+' gpu 0 -dont_show > public\\results\\texts\\result'+username+'_'+dateToString(now)+'.txt', (error, stdout, stderr) => {
	// });

	// sleep(7000, function() {
	// 	exec('copy predictions.jpg public\\results\\images\\prediction'+username+'_'+dateToString(now)+'.jpg', (error, stdout, stderr) => {
	// 	});

	// 	sleep(2000, function() {

	// 	});
		
		// fs.readFile('public\\results\\texts\\result'+username+'_'+dateToString(now)+'.txt', 'utf8', (err, data) => {
		// 	if(err) res.send({err: 1, message: 'something went wrong while reading result. Please try again in a moment.'});
		// 	let text = data;
		// 	text = text.split('\r\n');

		// 	let results = [];
		// 	let counter = 1;
		// 	for(let i = 0; i < (text.length - 1); i++) {
		// 		if(i > 2) {
		// 			values = text[i].split(',');
		// 			value = {
		// 				number 		: counter,
		// 				prediction 	: describeData(values[0]),
		// 				score 		: values[1],
		// 				color 		: describeColor(values[2])
		// 			}
		// 			counter += 1;
		// 			results.push(value);
		// 		}
		// 	}

		// 	sleep(2000, function() {
		// 		let bitmap = fs.readFileSync('public\\results\\images\\prediction'+username+'_'+dateToString(now)+'.jpg');
		// 		let base64str = new Buffer.from(bitmap).toString('base64');

		// 		let dbData = {
		// 			username 		: username,
		// 			result 			: results,
		// 			file_original	: filename,
		// 			file_box		: 'prediction'+username+'_'+dateToString(now)+'.jpg',
		// 			file_box_data	: base64str,
		// 			create_at 		: new Date()
		// 		}

		// 		res.json(dbData);
		// 	});
		// })
	// });
});


router.get('/views', (req, res, next) =>  {
	let username = req.query.username;
	let image = req.query.image;
	
	let query;
	if(image) {
		let id = new ObjectID(image);
		query = {username: username, _id: id}
	} else {
		query = {username: username}
	}

	db.collection('images').find(query).sort({"create_at": -1}).toArray((err, result) => {
		if (err) {
			res.status(400);
			res.send({error: 1, message: err});
		}

		result.forEach( function(element, index) {
			element.create_at = dateToStringReadable(element.create_at);
		});
		res.send(result)
	});
});

module.exports = router;
