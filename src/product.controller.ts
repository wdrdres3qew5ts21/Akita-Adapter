import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller("api/products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  getHello(): string {
    return this.productService.getProduct();
  }

  @Post()
  createProduct(@Body() product: Object): object {
    return this.productService.createProduct(product);
  }


}
