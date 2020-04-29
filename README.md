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

## Disclaimer -- about image layers data

This project provides few pilot layers data of some official Docker images of [Docker hub][docker-hub], the data was fetched by the [simple script][image-layer-fetching-script]. This project does **NOT** guarantee the integrity of layers data and provides the continuous maintenance.

You are free to use this project and the script, make sure not violating the user agreements of Docker hub.

[athena]: https://aws.amazon.com/athena/?nc2=h_ql_prod_an_ath
[docker-hub]: https://hub.docker.com/
[image-layer-fetching-script]: https://gist.github.com/zxkane/23de226fee8806ee0ed8c05136972ce0