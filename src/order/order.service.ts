import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {

    /** Extract each of order item */
    extractOrders(products: any[]) {
        let items = [];
        products.map(product => {
            items.push({
                productSkuId: product.id,
                productSkuCode: product.sku,
                productSkuBarcode: product.onlineStockCheckid, // mockup
                productSkuPhotoSrc: product.image,
                quantity: product.qty,
                originalPrice: product.regular_price, 
                sellPrice: product.price,
                vatIncluded: true,
                productName: product.name,
                variantOption: product.options === [] ? {} : this.transformOptions(product.totals.options)
            })
        })
        return items;
    }

    /** Transform variant option format */
    transformOptions(options: any[]) {
        let optionList = {};
        options.map(option => {
            optionList[option.label] = option.value
        })
        return JSON.stringify(optionList);
    }

    /** Group address to string */
    groupAddress(streets: any[]) {
        let address = '';
        streets.map((street, key, streets) => {
            if (Object.is(streets.length - 1, key)) {
                address += street
            } else {
                address += `${street} `
            }
        })
        return address;
    }

    /** Sum order's products price */
    sumTotal(products: any[]) {
        let net = 0;
        products.map(product => {
            net += product.totals.row_total
        })
        return net;
    }

    /** Transform order from VueStorefront to Akita format */
    async createOrder(orderData) {
        let addressInfo = orderData.addressInformation.shippingAddress;
        let parsed = {
            id: orderData.cart_id,
            thirdPartyOrderNo: '',
            vatRate: '7.00',
            net: this.sumTotal(orderData.products),
            orderChannel: 'storefront',
            note: '',
            orderState: 'new',
            paymentState: 'not paid',
            status: 'active',
            shippingAddress: {
                name: `${addressInfo.firstname} ${addressInfo.lastname}`,
                email: addressInfo.email,
                tel: addressInfo.telephone, 
                address: this.groupAddress(addressInfo.street),
                subDistrict: '',
                district: addressInfo.city,
                stateProvince: addressInfo.region,
                postcode: addressInfo.postcode
            },
            orderItems: this.extractOrders(orderData.products)
        }
        return parsed;
    }
}
