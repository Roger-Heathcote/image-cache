interface authLambdaProps {
	type: string,
	authorizationToken: string
	methodArn: string
}

exports.handler = async function(event: authLambdaProps){
	const secret = process.env.IC_PARAM || ""
	const token = event.authorizationToken
	const methodArn = event.methodArn
	const authOK = secret.length && (token === "Bearer " + secret)
	const Effect = authOK ? "Allow" : "Deny"

	// What difference does principalId make???
	const response = {
		principalId: "fartdinkle@example.com",
		policyDocument: {
			Version: '2012-10-17',
			Statement: [{
				Effect,
				Action: 'execute-api:Invoke',
				Resource: methodArn
			}]
		},
	}

	return response
}
