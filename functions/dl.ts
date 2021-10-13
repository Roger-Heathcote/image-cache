export {} // Tell TS we want module scoping
import {
	APIGatewayProxyEvent as GPE,
	APIGatewayProxyResult as GPR
} from "aws-lambda"
const aws = require('aws-sdk')
aws.config.update({region: 'eu-west-2'})
const axios= require('axios')
const {DynamoDB} = aws
const crypto = require('crypto')
const TableName = process.env.TABLE_NAME


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
	
	return axios.get(url, {responseType: 'arraybuffer'})
	.then(async (responseObject:any)=>{
		const output: any = {}
		const fileBuffer = responseObject.data
		const fileSize = Buffer.byteLength(fileBuffer)
		output["buffer size"] = fileSize
		output["msg"] = `DL Handler got url ${url}`

		if(fileSize < 6) return sendRes(415, "Unsupported media format - too short")
		if(fileSize > 100000) return sendRes(415, "Unsupported media format - too long")

		const base64String = fileBuffer.toString('base64')
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

		output["url"] = `${Item.id}.${Item.type}`
		return sendRes(200, output)
	})
	.catch((error:any)=>{
		return sendRes(400, {
			error: true,
			msg: error
		})
	})
	

	



	// const db = new DynamoDB.DocumentClient()
	// await db.put({
	// 	TableName,
	// 	Item
	// }).promise()

	// return sendRes(200, `${Item.id}.${Item.type}`)
	
	
}

const sendRes = (status:number, body:any, contentType="txt") => {
	const response: GPR = {
		statusCode: status,
		headers: {
			"Content-Type": 'application/json',
		},
		body: JSON.stringify(body),
		isBase64Encoded: false,
	}
	console.log("DL handler GOT TO THIS NEW POINT!", status, body)
	return response
}