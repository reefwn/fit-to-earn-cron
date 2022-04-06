import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { TaskService } from './task/task.service';
import { CoinEntity } from './entities/coin.entity';
import { MemberEntity } from './entities/member.entity';
import { ActivityEntity } from './entities/activity.entity';
import { ActivityService } from './activity/activity.service';
import { TransactionEntity } from './entities/transaction.entity';
import { CoinHistoryEntity } from './entities/coin-history.entity';
import { BlockChainService } from './blockchain/blockchain.service';
import { TransactionService } from './transaction/transaction.service';
import { DocumentNumberEntity } from './entities/document-number.entity';
import { CoinHistoryService } from './coin-history/coin-history.service';
import { NotificationService } from './notification/notification.service';
import { UserAppTokenService } from './user-app-token/user-app-token.service';
import { ActivityEnrollmentEntity } from './entities/activity-enrollment.entity';
import { DocumentNumberService } from './document-number/document-number.service';
import { ActivityEnrollmentService } from './activity-enrollment/activity-enrollment.service';
import { UserAppTokenEntity } from './entities/user-app-token.entity';
import { NotificationEntity } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_TYPE || 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: +process.env.DATABASE_PORT || 5432,
      username: process.env.DATABASE_USER || 'dbuser',
      password: process.env.DATABASE_PASSWORD || 'dbpassword',
      database: process.env.DATABASE_NAME || 'app',
      // TODO: for debugging
      logging: true,
      entities: [
        MemberEntity,
        ActivityEntity,
        ActivityEnrollmentEntity,
        CoinEntity,
        DocumentNumberEntity,
        TransactionEntity,
        CoinHistoryEntity,
        UserAppTokenEntity,
        NotificationEntity,
      ],
    }),
    TypeOrmModule.forFeature([
      MemberEntity,
      ActivityEntity,
      ActivityEnrollmentEntity,
      CoinEntity,
      DocumentNumberEntity,
      TransactionEntity,
      CoinHistoryEntity,
      UserAppTokenEntity,
      NotificationEntity,
    ]),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TaskService,
    ActivityService,
    ActivityEnrollmentService,
    DocumentNumberService,
    TransactionService,
    BlockChainService,
    CoinHistoryService,
    UserAppTokenService,
    NotificationService,
  ],
})
export class AppModule {}
