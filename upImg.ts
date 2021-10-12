export {}
const fs = require('fs')
require('dotenv').config()
const axios = require('axios').default

const endpoint = process.env.IC_ENDPOINT
const addEndpoint = endpoint + "/add"
const token = process.env.IC_SECRET

const inputFileName = process.argv[2]
const inputFileExt = inputFileName.split('.').pop()
const fileData = fs.readFileSync(inputFileName)
let data = fileData.toString('base64')

console.log(Buffer.byteLength(fileData), "bytes read.")
console.log(data.length, "as b64 string.")

const body = {
	type: inputFileExt?.toLowerCase(),
	data
}

axios.post(addEndpoint, body, {
	headers: {
		"Authorization": `Bearer ${token}`,
		"Content-type": "application/json",
		"Accept": "application/json"
	},
})
.then( (res: any) => {
		console.log(`OK:`, endpoint + "/get/" + res.data)
})
.catch(console.error)