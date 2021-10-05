export {} // Tell TS we want module scoping
const aws = require('aws-sdk')
aws.config.update({region: 'eu-west-2'})
const {DynamoDB} = aws
const crypto = require('crypto')
const TableName = process.env.TABLE_NAME

exports.handler = async function(event:any) {
	console.log("WooHoo! GET handler ran")


	// Object.keys(event?.headers || {}).forEach(key=>{
	// 	console.log(`HEADERS ${key} = ${event[key]}`)
	// })
	// Object.keys(event?.multiValueHeaders || {}).forEach(key=>{
	// 	console.log(`MVHEADERS ${key} = ${event[key]}`)
	// })
	// Object.keys(event?.pathParameters || {}).forEach(key=>{
	// 	console.log(`PATHPARAM ${key} = ${event[key]}`)
	// })
	// Object.keys(event?.requestContext || {}).forEach(key=>{
	// 	console.log(`REQUESTCONTEXT ${key} = ${event[key]}`)
	// })

	Object.keys(event).forEach(key=>{
		console.log(`${key} = ${event[key]}`)
	})

	return sendRes(200, `Item requested: >>>${event["id"]}<<<`)



	// if(event.body === null) return sendRes(400, "Missing POST body")

	// try {var body = JSON.parse(event.body)}
	// catch {return {code: 400, msg: "POST body is not valid JSON"}}

	// if(!body.type || !body.data) return sendRes(400, "Missing type or data param")
	

	// if(["webm", "png", "jpg", "jpeg", "txt"].includes(body.type) === false) return sendRes(
	// 	415, `Unsupported media format ${body.type}`
	// )

	// // if(body.data.length < 64) return sendRes(415, "Unsupported media format - too short")
	// if(body.data.length < 6) return sendRes(415, "Unsupported media format - too short")
	// if(body.data.length > 100000) return sendRes(415, "Unsupported media format - too long")

	// const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
	// if(base64regex.test(body.data) === false) return sendRes(400, "data field was not base64 encoded")

	// const Item = {
	// 	id: crypto.createHash('sha256').update(`${body.type}${body.data}`).digest('hex'),
	// 	data: body.data,
	// 	type: body.type
	// }

	// const db = new DynamoDB.DocumentClient()
	// await db.put({
	// 	TableName,
	// 	Item
	// }).promise()

	// return sendRes(200, `Item added:${Item.id}<<<`)
}

const sendRes = (status:any, body:any) => {
	
	const response = {
		statusCode: status,
		headers: {
			"Content-Type": "text/html"
		},
		body
	}
	return response
}