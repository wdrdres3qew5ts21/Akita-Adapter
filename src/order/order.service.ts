import { Injectable } from '@nestjs/common';
import MOCK from '../mock/mock-order';

@Injectable()
export class OrderService {
    private parsed = {}

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
        this.parsed = {
            id: orderData.cart_id,
            thirdPartyOrderNo: '',
            vatRate: MOCK.VAT_RATE,
            net: this.sumTotal(orderData.products),
            orderChannel: MOCK.CHANNEL.STOREFRONT,
            note: '',
            orderState: MOCK.ORDER_STATE.NEW,
            paymentState: MOCK.PAYMENT_STATE.NOT_PAID,
            status: MOCK.STATUS.ACTIVE,
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
        return this.parsed;
    }

    /** Show order details in '/api/order/get' route */
    async getOrder() {
        return this.parsed;
    }
}
