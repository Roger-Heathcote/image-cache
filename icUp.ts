export {}
const fs = require('fs')
const gm = require('gm').subClass({imageMagick: true})
require('dotenv').config()
const axios = require('axios').default

const endpoint = process.env.IC_ENDPOINT
const addEndpoint = endpoint + "/add"
const token = process.env.IC_SECRET

const inputFileName = process.argv[2]

function convDone(err:any){
	if(err) throw err
	const fileData = fs.readFileSync(`${__dirname}/payload.webp`)
	console.log(Buffer.byteLength(fileData), "bytes of binary data read.")
	console.log(fileData.length, "bytes as b64 string.")

	axios.post(`${addEndpoint}/webp`, fileData, {
		headers: {
			"Authorization": `Bearer ${token}`,
			"Content-type": "application/octet-stream",
			"Accept": "text/html"
		},
	})
	.then( (res: any) => {
		console.log(`OK:`, addEndpoint)
		console.log(JSON.stringify(res.data, null, 4))
	})
	.catch(console.error)

}

const resizeWidth = 300

gm(inputFileName)
.background("transparent")
.resize(resizeWidth)
.gravity("Center")
.extent(resizeWidth, resizeWidth*0.75)
.write(`${__dirname}/payload.webp`, convDone)
