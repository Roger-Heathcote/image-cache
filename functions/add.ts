exports.handler = async function(event:any) {
	console.log("WooHoo! add handler ran")
	return sendRes(200, "HELLOOOOOOOOOOOO FROM ADD!")
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