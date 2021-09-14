import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as apigateway from '@aws-cdk/aws-apigateway';

export class ImageCacheStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "image-cache", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING }
    })
    
    const addLambda = new lambda.Function(this, "addLambdaHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("functions"),
      handler: "add.handler",
      environment: {
        TABLE_NAME: table.tableName
      }
    })

    table.grantReadWriteData(addLambda)

    const api = new apigateway.RestApi(this, "image-cache-api", {
      restApiName: "image cache",
      description: "Caches images and serve with very long expiry"
    })
    
    api.root
      .resourceForPath("add")
      .addMethod("GET", new apigateway.LambdaIntegration(addLambda))

    new cdk.CfnOutput(this, "API URL", {
      value: api.url ?? "Deploy problems"
    })

  }
}
