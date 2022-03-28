export enum ActivityType {
  COMPANY_CSR = 'Company CSR',
  VOLUNTEER = 'Volunteer',
  COMPANY = 'Company',
}

export enum ActivityVerificationType {
  CODE = 'Code',
  CHECKIN = 'Checkin',
}

export enum ActivityStatus {
  PENDING = 'PENDING',
  APPROVE = 'APPROVE',
  CANCEL = 'CANCEL',
}

export enum ActivityRequireRegister {
  YES = 'YES',
  NO = 'NO',
  YES_CODE = 'YES_CODE',
}

export enum ActivityRequireCheckinCheckout {
  LOCATION = 'LOCATION',
  NO = 'NO',
  QR_LOCATION = 'QR_LOCATION',
}
