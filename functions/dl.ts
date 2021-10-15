export {} // Tell TS we want module scoping
import {
	APIGatewayProxyEvent as GPE,
	APIGatewayProxyResult as GPR
} from "aws-lambda"
const gm = require('gm').subClass({
	imageMagick: true,
})
const aws = require('aws-sdk')
aws.config.update({region: 'eu-west-2'})
const axios= require('axios')
const {DynamoDB} = aws
const crypto = require('crypto')
const TableName = process.env.TABLE_NAME

function resize(buffer:Buffer, fileName:string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		gm(buffer, fileName)
		.resize(128) // Make this a paramstore param
		.setFormat('webp')
		.toBuffer(
			function(error:any, outputBuffer:Buffer){
				if(error){
					console.log("ERRTYPE:", error.errorMessage)
					return reject(error)
				}
				resolve(outputBuffer)
			}
		)
	})
}

exports.handler = async function(event:GPE) {

	console.log("DL handler ran")
	
	if(event.body === null) return sendRes(400, "Missing POST body")	
	try {
		const bodyJSON = Buffer.from(event.body, 'base64')
		var body = JSON.parse(bodyJSON.toString('utf-8'))
	} catch {
		return sendRes(400, "POST body is not valid JSON")
	}
	
	const url = body?.url || ""
	if(!url) return sendRes(400, "Missing url")

	const fileType = url.split('.').pop().toLowerCase()
	if(["webp", "png", "jpg", "jpeg", "txt"].includes(fileType) === false) return sendRes(
		415, `Unsupported media format ${fileType}`
	)

	const responseObject = await axios.get(url, {responseType: 'arraybuffer'})
	const fileBuffer = responseObject.data
	const fileSize = Buffer.byteLength(fileBuffer)
	console.log(`Input image fileSize: ${fileSize} bytes.`)

	if(fileSize < 6) return sendRes(415, "Unsupported media format - too short")
	if(fileSize > 1000000) return sendRes(415, "Unsupported media format - too long")

	try {
		console.log("About to resize", fileType)
		const processedBuffer = await resize(fileBuffer, fileType)
		console.log("Resize complete!")
		console.log('Processed buffer size', processedBuffer.byteLength)

		const base64String = processedBuffer.toString('base64')

		const Item = {
			id: crypto.createHash('sha256').update(`${fileType}${base64String}`).digest('hex'),
			data: base64String,
			type: fileType
		}

		const db = new DynamoDB.DocumentClient()
		await db.put({
			TableName,
			Item
		}).promise()

		return sendRes(200, { url: `${Item.id}.${Item.type}` })

	} catch(error) {
		return sendRes(400, {
			error: true,
			msg: JSON.stringify(error, null, 4)
		})
	}
}

const sendRes = (status:number, body:any) => {
	return {
		statusCode: status,
		headers: {
			"Content-Type": 'application/json',
		},
		body: JSON.stringify(body),
		isBase64Encoded: false,
	}
}