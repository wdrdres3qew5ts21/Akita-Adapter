import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {

    /** Extract each of order item */
    extractOrders(products: any[]) {
        var items = [];
        products.forEach(product => {
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
        var optionList = {};
        options.forEach(option => {
            optionList[option.label] = option.value
        })
        return optionList;
    }

    /** Group address to string */
    groupAddress(streets: any[]) {
        var address = '';
        streets.forEach((street, key, streets) => {
            if (Object.is(streets.length - 1, key)) {
                address += street
            } else {
                address += `${street} `
            }
        })
        return address;
    }

    sumTotal(products: any[]) {
        var net = 0;
        products.forEach(product => {
            net += product.totals.row_total
        })
        return net;
    }

    /** Transform order from VueStorefront to Akita format */
    async createOrder(orderData) {
        var addressInfo = orderData.addressInformation.shippingAddress;
        var parsed = {
            id: orderData.cart_id,
            thirdPartyOrderNo: '',
            vatRate: 7.00,
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
