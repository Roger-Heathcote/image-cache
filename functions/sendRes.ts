import {APIGatewayProxyResult as GPR} from "aws-lambda"
const cacheLength = process.env.CACHE_LENGTH || "3600"

const mimeTypes: any = {
	"webp": "image/webp",
	"png": "image/png",
	"jpg": "image/jpeg",
	"jpeg": "image/jpeg",
	"txt": "text/plain",
	"json": "application/json"
}

export function sendRes(statusCode:number, body:any, contentType="json", binary=false): GPR{
	if(!binary && typeof body === "string") body = {msg: body}
	if(!binary) body.code = statusCode
	if(statusCode !== 200) body.error = true
	return {
		statusCode,
		headers: {
			"Content-Type": mimeTypes[contentType],
			"Cache-Control": binary ? `private, immutable, max-age=${cacheLength}` : "no-store"
		},
		body: binary ? body : JSON.stringify(body),
		isBase64Encoded: binary,
	}
}
