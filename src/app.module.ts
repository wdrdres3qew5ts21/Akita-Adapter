import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
import { OrderModule } from './order/order.module';


@Module({
  imports: [OrderModule],
  controllers: [AppController,ProductController, OrderController],
  providers: [AppService, ProductService, OrderService],
})
export class AppModule {}
