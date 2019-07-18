import * as dotenv from 'dotenv';
import elasticClient from '@elastic/elasticsearch'

const sendToElastic = async (object, entityName) => {
    try {
      await elasticClient.create({
        index: "vue_storefront_catalog",
        type: entityName,
        id: object.id,
        body: object
      })
    } catch (e) {
      if (e.status === 409) { // document already exists; force update.
        await elasticClient.update({
          index: "vue_storefront_catalog",
          type: entityName,
          id: object.id,
          body: {
            doc: object
          }
        })
      }
    }
  }

  module.exports = sendToElastic