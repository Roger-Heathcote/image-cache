exports.handler = async function() {
	console.log("WooHoo! Test handler ran")
	return {statusCode: 200, headers: {"Content-Type": "application/json"}, body: "Test handler ran!"}
}
