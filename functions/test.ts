exports.handler = async function() {
	console.log("WooHoo! My test handler RAN!!!")
	return {statusCode: 200, headers: {"Content-Type": "application/json"}, body: "Test handler RAN!!!"}
}
