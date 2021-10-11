export {}
const fs = require('fs')
const axios = require('axios').default;

const endpoint = "https://t831ij4hpk.execute-api.eu-west-2.amazonaws.com/prod"
const addEndpoint = endpoint + "/add"
const token = "PARMALADEBARSECHOPS"

const inputFileName = process.argv[2]
const inputFileExt = inputFileName.split('.').pop()
const fileData = fs.readFileSync(inputFileName)
let data = fileData.toString('base64');

console.log(Buffer.byteLength(fileData), "read.")
console.log(data.length, "as string.")


// const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
// if(base64regex.test(data) === false) {
// 	console.log("NOT BASE 64")
// } else {
// 	console.log("BASE 64 VERIFIED")
// }

const body = {
	type: inputFileExt?.toLowerCase(),
	data
}

// console.log("File type is:", inputFileExt?.toLowerCase())

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