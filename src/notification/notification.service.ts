import { NotificationBodyLocKey, NotificationType } from './notification.enum';
import { NotificationEntity } from 'src/entities/notification.entity';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { notificationOption } from './notification.const';
import { NotificationData } from './notification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import * as firebaseAdmin from 'firebase-admin';
import { Repository } from 'typeorm';
import {
  MessagingPayload,
  NotificationMessagePayload,
} from 'firebase-admin/lib/messaging/messaging-api';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  onModuleInit() {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE__PROJECT_ID,
        clientEmail: process.env.FIREBASE__CLIENT_EMAIL,
        privateKey: process.env.FIREBASE__PRIVATE_KEY,
      }),
      databaseURL: process.env.FIREBASE__DATABASE_URL,
    });
  }

  async notify(data: NotificationData) {
    const message: MessagingPayload = {};
    message.notification = this.getMessage(data);

    await firebaseAdmin
      .messaging()
      .sendToDevice(data.registrationToken, message, notificationOption);

    return message;
  }

  getMessage(data: NotificationData) {
    let notification: NotificationMessagePayload;

    switch (data.type) {
      case NotificationType.REGISTER_ACTIVITY:
        notification = {
          title: 'ลงทะเบียนเรียบร้อย',
          body: `คุณได้ลงทะเบียนเข้าร่วมกิจกรรม ${data.activityName} เรียบร้อยแล้ว`,
          bodyLocKey: NotificationBodyLocKey.MY_EVENT,
        };
        break;
      case NotificationType.NOTIFY_BEFORE_EVENT_START:
        notification = {
          title: 'กิจกรรมใกล้เริ่มแล้ว',
          body: `กิจกรรม ${data.eventName} ที่ท่านลงทะเบียนไว้จะเริ่มในอีก 3 วัน โปรดเข้าร่วมในวันที่ ${data.eventStartCheckin}`,
          bodyLocKey: NotificationBodyLocKey.MY_EVENT,
        };
        break;
      case NotificationType.CHECKIN_COMPLETE:
        notification = {
          title: 'เช็คอินเรียบร้อย',
          body: `คุณได้เช็คอินเข้าร่วมกิจกรรม ${data.activityName} เวลา ${data.checkinTime}`,
          bodyLocKey: NotificationBodyLocKey.MY_EVENT,
        };
        break;
      case NotificationType.CHECKOUT_COMPLETE:
        notification = {
          title: 'เช็คเอ้าท์เรียบร้อย',
          body: `คุณได้เช็คเอ้าท์เข้าร่วมกิจกรรม ${data.activityName} เวลา ${data.checkoutTime}`,
          bodyLocKey: NotificationBodyLocKey.MY_EVENT,
        };
        break;
      case NotificationType.CANCEL_COMPLETE:
        notification = {
          title: 'ยกเลิกการเข้าร่วม',
          body: 'คุณได้ยกเลิกการเข้าร่วมกิจกรรม xxxxxxxx เรียบร้อยแล้ว',
          bodyLocKey: NotificationBodyLocKey.MY_EVENT,
        };
        break;
      case NotificationType.NOTIFY_BEFORE_CHECKOUT:
        notification = {
          title: 'ยกเลิกการเข้าร่วม',
          body: 'คุณได้ยกเลิกการเข้าร่วมกิจกรรม xxxxxxxx เรียบร้อยแล้ว',
          bodyLocKey: NotificationBodyLocKey.MY_EVENT,
        };
        break;
      case NotificationType.REDEEM_COMPLETE:
        notification = {
          title: 'แลกของรางวัลเรียบร้อย',
          body: `ท่านได้แลกของรางวัล ${data.rewardName} เสร็จสิ้น`,
          bodyLocKey: NotificationBodyLocKey.REDEEM_HISTORY,
        };
        break;
      case NotificationType.EVOUCHER_EXP:
        notification = {
          title: 'บัตรกำนัลใกล้หมด',
          body: 'บัตรกำนัลของท่านใกล้หมดอายุ x รายการ',
          bodyLocKey: NotificationBodyLocKey.REDEEM_HISTORY,
        };
        break;
      case NotificationType.DONATION_SUCCESS:
        notification = {
          title: 'บริจาคเสร็จสิ้น',
          body: 'การบริจาคของท่านดำเนินการเสร็จสิ้นแล้ว',
          bodyLocKey: NotificationBodyLocKey.DONATION_HISTORY,
        };
        break;
      case NotificationType.RECEIVE_COIN:
        notification = {
          title: 'คุณได้รับเหรียญ',
          body: `คุณได้รับเหรียญ ${data.coinName} จำนวน ${data.coinAmount} เหรียญ จาก ${data.userSend}`,
          bodyLocKey: NotificationBodyLocKey.TRANSACTION_HISTORY,
        };
        break;
      case NotificationType.APPROVE_EVENT:
        notification = {
          title: 'กิจกรรมของคุณได้รับการอนุมัติ',
          body: 'กิจกรรม xxxxxxxx ที่คุณร้องขอ ได้รับการยืนยันจากผู้ดูแลระบบแล้ว',
          bodyLocKey: NotificationBodyLocKey.MY_EVENT,
        };
        break;
      case NotificationType.BROADCAST_EVENT:
        notification = {
          title: 'กิจกรรมใหม่',
          body: 'มีกิจกรรมจิตอาสาใหม่ สามารถเข้าร่วมได้แล้ววันนี้',
          bodyLocKey: NotificationBodyLocKey.MY_EVENT,
        };
        break;
      case NotificationType.MY_EVENT:
        notification = {
          title: data.title,
          body: data.detail,
          bodyLocKey: NotificationBodyLocKey.MY_EVENT,
        };
        break;
    }

    // TODO: verify how icon is used
    notification.icon = 'Small';

    return notification;
  }

  create(entity: Partial<NotificationEntity>) {
    return this.notificationRepo.create(entity);
  }

  save(entity: NotificationEntity) {
    return this.notificationRepo.save(entity);
  }
}
