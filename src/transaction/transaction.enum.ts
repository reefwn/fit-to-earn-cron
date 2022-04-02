export enum TransactionStatus {
  PENDING = 'PENDING',
  FAIL = 'FAIL',
  SUCCESS = 'SUCCESS',
}

export enum TransactionType {
  GET = 'GET',
  SEND = 'SEND',
  RECEIVE = 'RECEIVE',
  PENALTY = 'PENALTY',
  REDEEM = 'REDEEM',
  DONATE = 'DONATE',
  EXPIRED = 'EXPIRED',
}
