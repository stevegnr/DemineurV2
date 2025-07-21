import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GridsModule } from './grids/grids.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.USER,
      password: process.env.PWD,
      database: process.env.DB,
      entities: [],
      autoLoadEntities: true,
      synchronize: true,
    }),
    GridsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
