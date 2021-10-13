export {} // Tell TS we want module scoping
import {
	APIGatewayProxyEvent as GPE,
	APIGatewayProxyResult as GPR
} from "aws-lambda"

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

exports.handler = async function(event:GPE): Promise<GPR> {
	console.log("GET handler ran", )
	const file = event.pathParameters?.file || ""
	if(!file) return sendRes(400, "No param")
	if(file?.length < 67) return sendRes(400, "Too short")
	const id = file.slice(0,64)
	if(false === /^[0-9a-f]{64}$/.test(id)) return sendRes(400, "Bad ID format")
	const ext = file.slice(65)
	if(false === /^webp$|^png$|^jpg$|^jpeg$|^txt$/.test(ext)) return sendRes(400, "Bad ext format")
	
	const db = new DynamoDB.DocumentClient()
	const response = await db.get({
		TableName,
		Key: {id}
	}).promise()
	const record = response?.Item

	if(!record) return sendRes(400, "No result found")
	if(record?.type !== ext) return sendRes(400, "Bad ext")

	return sendRes(
		200,
		record.data,
		record.type
	)
}

const sendRes = (status:number, body:any, contentType="txt") => {
	const response: GPR = {
		statusCode: status,
		headers: {
			"Content-Type": mimeTypes[contentType],
			"Cache-Control": status===200 ? "private, immutable, max-age=3600" : "no-store"
		},
		body,
		isBase64Encoded: status===200,
	}
	return response
}