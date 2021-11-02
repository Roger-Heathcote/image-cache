import * as ssm from '@aws-cdk/aws-ssm'

export function getParameters(context: any, paramArr:any): any{
	const out = {} as any
	let paramObj
	for(let param of paramArr){
		if(typeof param === "string") param = {name: param}
		const {name, secure, asObj} = param
		console.log({name, secure, asObj})
		if(secure) {
			paramObj = ssm.StringParameter.fromSecureStringParameterAttributes (
				context, name, {parameterName: `/imagecache/${name}`, version: 1}
			)
		} else {
			paramObj = ssm.StringParameter.fromStringParameterAttributes(
				context, name, {parameterName: `/imagecache/${name}`}
			)
		}
		out[name] = asObj ? paramObj : paramObj.stringValue
	}
	return out
}
