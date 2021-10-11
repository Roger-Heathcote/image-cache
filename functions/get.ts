export {} // Tell TS we want module scoping
const aws = require('aws-sdk')
aws.config.update({region: 'eu-west-2'})
const {DynamoDB} = aws
const TableName = process.env.TABLE_NAME

const mimeTypes: any = {
	"webp": "image/webp",
	"png": "image/png",
	"jpg": "image/jpeg",
	"jpeg": "image/jpeg",
	"txt": "text/plain"
}


exports.handler = async function(event:any, context:any) {
	console.log("WooHoo! GET handler ran", )
	const {file} = event.pathParameters
	// return sendRes(200, JSON.stringify([event, context], null, 4))
	
	if(file?.length < 67) return sendRes(400, "Too short")
	const id = file.slice(0,64)
	if(false === /^[0-9a-f]{64}$/.test(id)) return sendRes(400, "Bad ID format")
	const ext = file.slice(65)
	if(false === /^webp$|^png$|^jpg$|^jpeg$|^txt$/.test(ext)) return sendRes(400, "Bad ext format")
	
	// Lookup record
	const db = new DynamoDB.DocumentClient()
	const response = await db.get({
		TableName,
		Key: {id}
	}).promise()
	const record = response?.Item

	// Fail if not found
	if(!record) return sendRes(400, "No result")

	const reply = JSON.stringify(record, null, 4)
	console.log("reply:", response)
	
	// Fail if ext doesn't match
	if(record?.type !== ext) return sendRes(400, "Bad ext")

	return sendRes(
		200,
		record.data,
		record.type
	)
}

const sendRes = (status:any, body:any, contentType="txt") => {
	const response = {
		statusCode: status,
		headers: {
			"Content-Type": mimeTypes[contentType],
			"Cache-Control": status===200 ? "private, immutable, max-age=3600;" : "no-store"
		},
		body,
		isBase64Encoded: status===200,
	}
	return response
}