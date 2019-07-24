import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('api/order')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post('/')
    async createOrder(@Res() res, @Body() orderData: JSON) {
        const result = await this.orderService.createOrder(orderData);
        console.log(result)
        return res.status(HttpStatus.OK).json({ result })
    }
}
