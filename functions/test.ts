exports.handler = async function() {
	console.log("Test handler ran")
	return {
		statusCode: 200,
		headers: {"Content-Type": "application/json"},
		body: `${new Date().toLocaleTimeString()} Test handler ran.`}
}
