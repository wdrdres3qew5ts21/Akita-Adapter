import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
    
    createProduct(product): object {
        console.log(product)
        return product
    }

    getProduct(): string {
        return 'Shirt of Sellsuki !!!';
    }
}
