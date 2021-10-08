interface authLambdaProps {
	type: string,
	authorizationToken: string
	methodArn: string
}

exports.handler = async function(event: authLambdaProps){

	const token = event.authorizationToken
	const secret = "Bearer " + "FORTS"
	const methodArn = event.methodArn

	// console.log(`TOKEN:${token}, SECRET:${secret}, TOKEN===SECRET:${token===secret}`)
	// console.log(`TY_TOKEN:${typeof token}, TY_SECRET:${typeof secret}`)
	// console.log(`LEN_TOKEN:${token?.length}, LEN_SECRET:${secret?.length}`)

	const Effect = token === secret ? "Allow" : "Deny"

	const response = {
		principalId: "username@example.com",
		policyDocument: {
			Version: '2012-10-17',
			Statement: [{
				Effect,
				Action: 'execute-api:Invoke',
				Resource: methodArn
			}]
		},
	}
	
	// console.log(`RESPONSE:`, JSON.stringify(response, null, 4))

	return response
}
