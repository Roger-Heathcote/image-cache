exports.handler = async function() {
	console.log("Test handler ran")
	return {statusCode: 200, headers: {"Content-Type": "application/json"}, body: "Test handler RAN!!!"}
}
