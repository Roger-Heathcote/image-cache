import { expect as expectCDK, haveResource } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import * as ImageCache from '../lib/image-cache-stack'

test('API Gateway Route Created', () => {
    const app = new cdk.App()
    const stack = new ImageCache.ImageCacheStack(app, 'MyTestStack')
    
    expectCDK(stack).to(haveResource("AWS::ApiGateway::RestApi"))

    // expectCDK(stack).to(haveResource("AWS::ApiGateway::RestApi", {
    //     path: "",
    //     method: "",
    //     visibility: "Public",
    // }))
})

