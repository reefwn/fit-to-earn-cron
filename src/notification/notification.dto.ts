import { NotificationType } from './notification.enum';

export class NotificationData {
  type: NotificationType;
  registrationToken: string;
  coinName?: string;
  coinAmount?: number;
  userSend?: string;
  activityName?: string;
  eventName?: string;
  eventStartCheckin?: string;
  checkinTime?: string;
  checkoutTime?: string;
  rewardName?: string;
  title?: string;
  detail?: string;
}
