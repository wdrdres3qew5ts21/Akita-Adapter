import { Injectable } from '@nestjs/common';
const elasticsearch = require('elasticsearch')
const elasticClient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
})

const url = require('url')


@Injectable()
export class ProductService {

    categories = []

    categoriesId = []

    urlKey = ""

    urlPath = ""

    removeQueryString = (sourceUrl) => {
        // split url into distinct parts
        // (full list: https://nodejs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost)
        var obj = url.parse(sourceUrl);
        // remove the querystring
        obj.search = obj.query = "";
        // reassemble the url
        return url.format(obj);
    }


    trim = (s, t) => {
        var tr, sr
        tr = t.split('').map(e => `\\\\${e}`).join('')
        sr = s.replace(new RegExp(`^[${tr}]+|[${tr}]+$`, 'g'), '')
        return sr
    }


    extractCategories = (categories, currentData = []) => {
        this.urlKey = categories.name
        this.urlPath += categories.name
        currentData.push({
            "category_id": categories.id,
            "name": categories.name
        })
        this.categoriesId.push(categories.id)
        categories = categories.children

        if (categories != undefined) {
            this.urlPath += "/"
            this.extractCategories(categories, currentData)
        }

        this.categories = currentData
    }

    extractCategoriesId = (categories, currentData = []) => {
        currentData.push(categories.id)
        categories = categories.children
        if (categories != undefined) {
            this.extractCategoriesId(categories, currentData)
        }
        return currentData
    }

    modifierOptions = async (product, { apiConnector, elasticClient, config }) => {
        return apiConnector(config.bc).get('/catalog/products/' + product.id + '/modifiers').catch(err => console.error(err))
    }
    options = async (product, { apiConnector, elasticClient, config }) => {
        return apiConnector(config.bc).get('/catalog/products/' + product.id + '/options').catch(err => console.error(err))
    }
    customFields = async (product, { apiConnector, elasticClient, config }) => {
        return apiConnector(config.bc).get('/catalog/products/' + product.id + '/custom-fields').catch(err => console.error(err))
    }

    async createProduct(source): Promise<any> {
        const VISIBILITY = {
            CATALOG_SEARCH: 4,
            SEARCH: 3,
            CATALOG: 2,
            NOT_VISIBLE_INDIVIDUALLY: 1
        }
        const VARIANT = {
            SIZE: "size",
            COLOR: "color"
        }
        const MOCK_SIZE = {
            XL: "11",
            L: "12"
        }
        const MOCK_COLOR = {
            BLACK: "9",
            WHITE: "10"
        }
        this.extractCategories(source.category)
        this.extractImage(source.photos)
        const filter_options = {}
        let type_id = "simple"
        if (source.skus != null) {
            type_id = "configurable"
        }
        let output = {
            "type_id": type_id, // TODO: add othe product types
            "sku": source.id,
            "has_options": source.options && source.options.length > 0, // todo
            "required_options": 0,
            //      "created_at": moment(source.created_at).toJSON(),
            //      "updated_at": moment(source.updated_at).toJSON(),
            "status": 1,
            "visibility": source.status == "true" ? VISIBILITY.CATALOG_SEARCH : VISIBILITY.NOT_VISIBLE_INDIVIDUALLY,
            "tax_class_id": source.tax_class_id,
            "description": source.description,
            "name": source.name,
            "image": source.images ? this.removeQueryString(source.images[0].url_standard) : '',
            "thumbnail": source.images ? this.removeQueryString(source.images[0].url_thumbnail) : '',
            "media_gallery": this.extractImage(source.photos),
            "weight": source.weight,
            "price": source.price,
            "special_price": null,
            "news_from_date": null,
            "news_to_date": null,
            "special_from_date": null,
            "special_to_date": null,
            "stock_item": {
                "is_in_stock": source.inventory_tracking === 'none' ? true : source.inventory_level > 0
            },
            "id": parseInt(source.id),
            "category": this.categories,
            "category_ids": this.categoriesId,
            "url_key": this.urlKey,
            "url_path": this.urlPath,
            "stock": { // TODO: Add stock quantity - real numbers
                "is_in_stock": source.status == 'true' ? true : false,
            },
            "configurable_children": source.skus ? source.skus.map(sourceVariant => {
                let child = {
                    "sku": sourceVariant.code,
                    "price": sourceVariant.price ? sourceVariant.price : source.price,
                    "image": null,
                    "is_in_stock": true,
                    "stock": {
                        "is_in_stock": sourceVariant.status == "active" ? true : false
                    },
                    "product_id": source.id,
                 //   "color": "9",
                 //   "size": "11"
                }
            if(sourceVariant.variantOption.Size.toUpperCase() == "L".toUpperCase()){
                child[VARIANT.SIZE] = MOCK_SIZE.L
            }
            else{
                child[VARIANT.SIZE] = MOCK_SIZE.XL
            }
            if(sourceVariant.variantOption.Color.toUpperCase() == "black".toUpperCase()){
                child[VARIANT.COLOR] = MOCK_COLOR.BLACK
            }else{
                child[VARIANT.COLOR] = MOCK_COLOR.WHITE
            }
                // sourceVariant.option_values.map((ov) => {
                //     if (!filter_options[ov.option_display_name + '_options']) filter_options[ov.option_display_name + '_options'] = new Set() // we need to aggregate the options from child items
                //     filter_options[ov.option_display_name + '_options'].add(ov.label)
                //     child[ov.option_display_name] = ov.label
                //     child['prodopt-' + ov.option_id] = ov.id // our convention is to store the product options as a attributes with the names = prodopt-{{option_id}}
                // })
                return child
            }) : null,
            "configurable_options": [
                {
                    "id": 3,
                    "attribute_id": "93",
                    "label": "Color",
                    "position": 1,
                    "values": [
                        {
                            "value_index": MOCK_COLOR.BLACK
                        },
                        {
                            "value_index": MOCK_COLOR.WHITE
                        }
                    ],
                    "product_id": 1,
                    "attribute_code": "color"
                },
                {
                    "id": 6,
                    "attribute_id": "138",
                    "label": "size",
                    "position": 1,
                    "values": [
                        {
                            "value_index": MOCK_SIZE.XL
                        },
                        {
                            "value_index": MOCK_SIZE.L
                        }
                    ],
                    "product_id": 12,
                    "attribute_code": "size"
                }
            ]
        }
        for (let key in filter_options) {
            output[key] = Array.from(filter_options[key])
        }
        // const subPromises = []
        // subPromises.push(this.options(source, { apiConnector, elasticClient, config }).then(productOptions => {
        //     if (productOptions && productOptions.data.length > 0) {
        //         output.type_id = "configurable"
        //         output.configurable_options = productOptions.data.map(po => {
        //             return { // TODO: we need to populate product's : product.color_options and product.size_options to make forntend filters work properly
        //                 id: po.id,// TODO: LETS STORE THE ATTRIBUTES DICTIONARY JUST FOR attr config / type - we don't need the available options (which is risky updating Elastic)
        //                 attribute_code: 'prodopt-' + po.id,
        //                 product_id: output.id,
        //                 label: po.display_name,
        //                 position: po.sort_order,
        //                 frontend_label: po.display_name,
        //                 values: po.option_values.map(ov => {
        //                     return {
        //                         label: ov.label,
        //                         default_label: ov.label,
        //                         order: ov.sort_order,
        //                         value_index: ov.id,
        //                         value_data: ov.value_data
        //                     }
        //                 })
        //             }
        //         })
        //     }
        // }))

        // TODO: we need to get custom_attributes for products and store it to product.custom_attributes { attribute_code, value }
        // subPromises.push(this.customFields(source, { apiConnector, elasticClient, config }).then(productCustomFields => {
        //     if (productCustomFields && productCustomFields.data.length > 0) {
        //         output.custom_attributes = productCustomFields.data.map(po => {
        //             return {
        //                 attribute_code: po.name,
        //                 value: po.value,
        //                 label: po.name
        //             }
        //         })
        //         output[po.name] = po.value
        //     }
        // }))


        // TODO: BigCommerce's modifier_options => Magento's custom_options
        // subPromises.push(modifierOptions(source, { apiConnector, elasticClient, config }))


        // Promise.all(subPromises).then((results) => {
        //     // console.log(output)
        //     console.log('Product ' + output.name + ' - ' + output.sku + ' ' + output.type_id + ' - price: ' + output.price + ': imported!')

        //     resolve(output)
        // }
        // )
       // console.log(output)
       console.log('---------------------')

        try {
            await elasticClient.create({
                index: "vue_storefront_catalog",
                type: "product",
                id: output.id,
                body: output
            }).then((output) => {
                console.log("Insert New One !!!")
                console.log(output)
            })
        } catch (e) {
            console.log(e)
            if (e.status === 409) { // document already exists; force update.
                await elasticClient.update({
                    index: "vue_storefront_catalog",
                    type: "product",
                    id: output.id,
                    retry_on_conflict: 2,
                    body: {
                        doc: output
                    }
                }).then((output) => {
                    console.log("Already Exist !!!")
                    console.log(output)
                })
            }
        }

        return output
    }
    extractImage(photos: any[]) {
        let media_gallery = []

        photos.forEach(photo => {
            media_gallery.push({
                "id": null,
                "image": photo.src
            })
        });

        return media_gallery

    }

    getProduct(): string {
        return 'Shirt of Sellsuki !!!';
    }
}
