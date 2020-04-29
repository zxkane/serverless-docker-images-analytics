import * as cdk from '@aws-cdk/core';
import athena = require('@aws-cdk/aws-athena');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3deploy = require('@aws-cdk/aws-s3-deployment');

export class ServerlessDockerImagesAnalyticsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucket = new s3.Bucket(this, 'docker-images-layers-analytics');
    const destPrefix = 'docker-images-layers';
    // upload raw data to s3 bucket
    new s3deploy.BucketDeployment(this, 'DeployImageLayerData', {
      sources: [s3deploy.Source.asset('./data')],
      destinationBucket: sourceBucket,
      destinationKeyPrefix: destPrefix, // optional prefix in destination bucket
    });

    const analyticsDB = new glue.Database(this, 'DockerImageLayersAnalyticsDB', {
      databaseName: `docker_image_db`
    });

    // create table for docker image layers
    const csvImageLayerTable = new glue.CfnTable(this, 'Docker_Image_Layers', {
      catalogId: analyticsDB.catalogId,
      databaseName: analyticsDB.databaseName,
      tableInput: {
        description: 'Docker image layers',
        name: 'layers_csv',
        tableType: 'EXTERNAL_TABLE',
        parameters: {
          'skip.header.line.count': '0'
        },
        partitionKeys: [
        ],
        storageDescriptor: {
          columns: [
            {
              name: 'image-name',
              type: 'string'
            },
            {
              name: 'image-tag',
              type: 'string'
            },
            {
              name: 'layer-digest',
              type: 'string'
            },
            {
              name: 'layer-size',
              type: 'bigint'
            },
          ],
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          location: `s3://${sourceBucket.bucketName}/${destPrefix}/`,
          serdeInfo: {
            parameters: {
              'field.delim"': ',',
              'serialization.format': ',',
            },
            serializationLibrary: 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe',
          }
        }
      }
    });

    new athena.CfnNamedQuery(this, `stats layers and size per image`, {
      database: analyticsDB.databaseName,
      name: 'Docker_Layers_Stats_Per_Image',
      queryString: `\
        select "image-name", count(*) as "total-layers", sum("layer-size") as "total-layers-size(bytes)" from \
        (select "image-name", "layer-digest", max("layer-size") as "layer-size" \
        from "${analyticsDB.databaseName}"."${csvImageLayerTable.ref}" \
        group by "image-name", "layer-digest") group by "image-name"`,
      description: 'Template of stats layers count and size per image'
    });

    new athena.CfnNamedQuery(this, `stats total layers and size`, {
      database: analyticsDB.databaseName,
      name: 'Docker_Layers_Stats',
      queryString: `\
        select count(*) as "total-layers", sum("layer-size") as "total-layers-size(bytes)" from \
        (select "layer-digest", max("layer-size") as "layer-size" \
        from "${analyticsDB.databaseName}"."${csvImageLayerTable.ref}" \
        group by "layer-digest")`,
      description: 'Template of stats total layers and size'
    });
  }
}
