import * as cdk from '@aws-cdk/core';
import athena = require('@aws-cdk/aws-athena');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3deploy = require('@aws-cdk/aws-s3-deployment');

export class ServerlessDockerImagesAnalyticsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucket = new s3.Bucket(this, 'docker-image-layers-analytics');
    const destPrefix = 'docker-image-layers';
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
        description: 'Docker image layers with partition owner and name',
        name: 'layers',
        tableType: 'EXTERNAL_TABLE',
        parameters: {
          'skip.header.line.count': '0'
        },
        partitionKeys: [
          {
            name: 'owner',
            type: 'string'
          },
          {
            name: 'name',
            type: 'string'
          },
        ],
        storageDescriptor: {
          columns: [
            {
              name: 'image-tag',
              type: 'string'
            },
            {
              name: 'image-digest',
              type: 'string'
            },
            {
              name: 'platform-arch',
              type: 'string'
            },
            {
              name: 'platform-os',
              type: 'string'
            },
            {
              name: 'platform-variant',
              type: 'string'
            },
            {
              name: 'platform-os-version',
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

    new athena.CfnNamedQuery(this, `stats layers and size per image, platform`, {
      database: analyticsDB.databaseName,
      name: 'Docker_Layers_Stats_Per_Image_And_Platform',
      queryString: `SELECT "image-name",
          "platform",
          count(*) AS "total-layers",
          sum("layer-size") AS "total-layers-size(bytes)"
      FROM 
          (SELECT concat("owner",
                '/', "name") AS "image-name", concat("platform-arch", '-', "platform-os") AS "platform", "layer-digest", max("layer-size") AS "layer-size"
          FROM "${analyticsDB.databaseName}"."${csvImageLayerTable.ref}"
          GROUP BY  "owner", "name", "platform-arch", "platform-os", "layer-digest")
      GROUP BY  "image-name", "platform"`,
      description: 'Template of stats layers count and size per image and platform'
    });

    new athena.CfnNamedQuery(this, `stats total layers and size per arch and os`, {
      database: analyticsDB.databaseName,
      name: 'Docker_Layers_Stats_Per_Platform',
      queryString: `SELECT "platform",
          count(*) AS "total-layers",
          sum("layer-size") AS "total-layers-size(bytes)"
      FROM 
          (SELECT concat("platform-arch",
                '-', "platform-os") AS platform, "layer-digest", max("layer-size") AS "layer-size"
          FROM "${analyticsDB.databaseName}"."${csvImageLayerTable.ref}"
          GROUP BY  "platform-arch", "platform-os", "layer-digest")
      GROUP BY  "platform"
      ORDER BY "total-layers-size(bytes)" desc`,
      description: 'Template of stats total layers and size per arch and os'
    });
  }
}
