export {} // Tell TS we want module scoping
const aws = require('aws-sdk')
aws.config.update({region: 'eu-west-2'})
const {DynamoDB} = aws
const crypto = require('crypto')
const TableName = process.env.TABLE_NAME

exports.handler = async function(event:any) {
	console.log("WooHoo! add handler ran")
	
	if(event.body === null) return sendRes(400, "Missing POST body")
	
	console.log("111111111111111111111111111111111111111111")
	console.log("EVT BODY:", event.body)
	
	const bodyJSON = Buffer.from(event.body, 'base64')
	console.log("DECODED EVT BODY:", bodyJSON)
	try {
		console.log("22222222222222222222222222222222222222222")
		var body = JSON.parse(bodyJSON)
		console.log("33333333333333333333333333333333333333333333")
	} catch {
		console.log("44444444444444444444444444444444444444444444")
		return sendRes(400, "POST body is not valid JSON")
	}
	

	if(!body.type || !body.data) return sendRes(400, "Missing type or data param")
	
	
	if(["webm", "png", "jpg", "jpeg", "txt"].includes(body.type) === false) return sendRes(
		415, `Unsupported media format ${body.type}`
		)
	

	// if(body.data.length < 64) return sendRes(415, "Unsupported media format - too short")
	if(body.data.length < 6) return sendRes(415, "Unsupported media format - too short")
	if(body.data.length > 100000) return sendRes(415, "Unsupported media format - too long")

	const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
	if(base64regex.test(body.data) === false) return sendRes(400, "data field was not base64 encoded")


	const Item = {
		id: crypto.createHash('sha256').update(`${body.type}${body.data}`).digest('hex'),
		data: body.data,
		type: body.type
	}


	const db = new DynamoDB.DocumentClient()
	await db.put({
		TableName,
		Item
	}).promise()

	
	return sendRes(200, `${Item.id}.${Item.type}`)
}

const sendRes = (status:any, body:any) => {
	
	console.log("555555555555555555555555555555555555555555555")
	const response = {
		statusCode: status,
		headers: {
			"Content-Type": "text/html"
		},
		body
	}
	return response
}