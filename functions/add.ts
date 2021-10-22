export {} // Tell TS we want module scoping
import {
	APIGatewayProxyEvent as GPE,
	APIGatewayProxyResult as GPR
} from "aws-lambda"
const aws = require('aws-sdk')
aws.config.update({region: 'eu-west-2'})
const {DynamoDB} = aws
const crypto = require('crypto')
const TableName = process.env.TABLE_NAME

exports.handler = async function(event:GPE): Promise<GPR>{
	console.log("Addbin handler ran")
	
	if(event.body === null) return sendRes(400, "Missing POST body")	

	const bodyType = event.pathParameters?.type || ""

	if(["webp", "png", "jpg", "jpeg", "svg", "txt"].includes(bodyType) === false) return sendRes(
		415, `Unsupported media format ${bodyType}`
	)
	
	const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
	if(base64regex.test(event.body) === false) return sendRes(400, "data field was not base64 encoded")

	if(event.body.length < 6) return sendRes(415, "Unsupported media size - too short")
	if(event.body.length > 100000) return sendRes(415, "Unsupported media size - too long")

	console.log(`Received ${event.body.length} bytes of base64 encoded data.`)

	const Item = {
		id: crypto.createHash('sha256').update(`${bodyType}${event.body}`).digest('hex'),
		data: event.body,
		type: bodyType
	}

	const db = new DynamoDB.DocumentClient()
	await db.put({
		TableName,
		Item
	}).promise()

	return sendRes(200, `${Item.id}.${Item.type}`)
}

const sendRes = (status:number, body:any) => {
	
	const response = {
		statusCode: status,
		headers: {
			"Content-Type": "text/html"
		},
		body
	}
	return response
}