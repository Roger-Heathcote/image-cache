export {} // Tell TS we want module scoping
import {APIGatewayProxyEvent as GPE} from "aws-lambda"
import { sendRes } from "./sendRes"
const gm = require('gm').subClass({
	imageMagick: true,
})
const aws = require('aws-sdk')
aws.config.update({region: 'eu-west-2'})
const axios= require('axios')
const {DynamoDB} = aws
const crypto = require('crypto')
const TableName = process.env.TABLE_NAME
const maxRawFileSize = Number(process.env.MAX_RAW_FILE_SIZE) || 2000000
const maxCookedFileSize = Number(process.env.MAX_COOKED_FILE_SIZE) || 350000
const resizeWidth = Number(process.env.RESIZE_WIDTH) || 350
const downloadTimeout = Number(process.env.DOWNLOAD_TIMEOUT || 5000)

function resize(buffer:Buffer, fileName:string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		gm(buffer, fileName)
		.background("transparent")
		.resize(resizeWidth)
		.gravity("Center")
		.extent(resizeWidth, resizeWidth*0.75)
		.setFormat('webp')
		.toBuffer(
			function(error:any, outputBuffer:Buffer){
				if(error) return reject(error)
				return resolve(outputBuffer)
			}
		)
	})
}

exports.handler = async function(event:GPE) {

	console.log("Running dl.js")

	// Accept and decode b64 encoded JSON payload
	if(event.body === null) return sendRes(400, "Missing POST body")	
	try {
		const bodyJSON = Buffer.from(event.body, 'base64')
		var body = JSON.parse(bodyJSON.toString('utf-8'))
	} catch {
		return sendRes(400, "POST body is not valid JSON")
	}
	
	// Verify URL is specified in received object
	const rawUrl = body?.url || ""
	if(!rawUrl) return sendRes(400, "Missing url")
	const url = rawUrl.split("?").shift() // ditch params

	// Get file extension, refuse if not allowed type
	let fileType = url.split('.').pop().toLowerCase()
	if(["webp", "png", "jpg", "jpeg"].includes(fileType) === false) return sendRes(
		415, `Unsupported media format ${fileType}`
	)

	// Future releases may allow non image files so we need to discriminate
	const isImage = ["webp", "png", "jpg", "jpeg"].includes(fileType)

	// Download file from url and enforce size constraints
	try {
		var responseObject = await axios.get(url, {
			responseType: 'arraybuffer',
			maxContentLength: maxRawFileSize,
        	maxBodyLength: maxRawFileSize,
			timeout: downloadTimeout
		})
	} catch(error) {
		return sendRes(error.response.status, {
			msg: JSON.stringify(error, null, 4)
		})
	}
	const fileBuffer = responseObject.data
	const rawFileSize = Buffer.byteLength(fileBuffer)
	if(rawFileSize < 6) return sendRes(415, "Unsupported media format - too short")
	if(rawFileSize > maxRawFileSize) return sendRes(500, "Axios failed to enforce maxRawFileSize!!!")
	
	// Create key by hashing content and insert in db
	try {
		let saveBuffer
		if(isImage){
			// rescale and convert to webp, if file is image
			saveBuffer = await resize(fileBuffer, fileType)
			const cookedFileSize = saveBuffer.byteLength
			if(cookedFileSize > maxCookedFileSize) return sendRes(415, "Unsupported media format - cooked file too long")
			fileType = "webp"
		}
		saveBuffer = saveBuffer ? saveBuffer : fileBuffer
		const base64String = saveBuffer ?.toString('base64')

		const Item = {
			id: crypto.createHash('sha256').update(`${fileType}${base64String}`).digest('hex'),
			data: base64String,
			type: fileType,
			origUrl: url
		}

		const db = new DynamoDB.DocumentClient()
		await db.put({
			TableName,
			Item
		}).promise()

		return sendRes(200, { path: `${Item.id}.${Item.type}` })

	} catch(error) {
		return sendRes(error?.status || 400, {
			msg: JSON.stringify(error, null, 4)
		})
	}
}
