import { Controller, Post, Body, Res, HttpStatus, Get } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('api/order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    /** Get order for mocking only */
    @Get('/get')
    async getOrder(@Res() res) {
        const result = await this.orderService.getOrder();
        return res.status(HttpStatus.OK).json({ result });
    }

    /** Create order in Akita format from orginal */
    @Post('/')
    async createOrder(@Res() res, @Body() orderData: JSON) {
        const result = await this.orderService.createOrder(orderData);
        console.log(result)
        return res.status(HttpStatus.OK).json({ result });
    }
}
