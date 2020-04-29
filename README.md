# Serverless Docker Image Layers Analytics

It's a fun project to setup a serverless Analytics app in AWS to analyze the layers of docker images.

The app is powered by Amazon S3, AWS Glue and Amazon Athena.

## How to deploy

### Prerequisites

- Install Node LTS(such as 12.x)
- Configure your AWS account for [awscli](https://docs.aws.amazon.com/polly/latest/dg/setup-aws-cli.html)
  
### Deploy it
```shell
# install dependencies & init cdk toolkit
# only need run once
npm run init

# deploy
npm run deploy
```

### Cleanup
```shell
npm run cleanup
```

## How to analyze the data

- Login the AWS console with your account, Go to [Athena][athena]
- Click the **Saved Queries** to find the built-in analysis queries starting with `Docker_Layers_Stats`

Enjoy it!

[athena]: https://aws.amazon.com/athena/?nc2=h_ql_prod_an_ath