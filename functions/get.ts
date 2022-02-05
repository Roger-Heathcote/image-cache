export {} // Tell TS we want module scoping
import {
	APIGatewayProxyEvent as GPE,
	APIGatewayProxyResult as GPR
} from "aws-lambda"
import { sendRes } from "./sendRes"

const aws = require('aws-sdk')
aws.config.update({region: 'eu-west-2'})
const {DynamoDB} = aws
const TableName = process.env.TABLE_NAME

exports.handler = async function(event:GPE): Promise<GPR> {

	console.log("GET handler ran", )
	
	if(event.headers["If-None-Match"]) return {statusCode: 304} as GPR

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

	// console.log("RECORD TYPE", record.type)

	return sendRes(
		200,
		record.data,
		record.type,
		true // binary
	)
}
