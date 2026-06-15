export const DUMMY_PHONE = '9420413822';
export const DUMMY_OTP = '123456';

export function isDummyPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits === DUMMY_PHONE || digits === `+91${DUMMY_PHONE}`;
}

export function isDummyOTP(otp: string): boolean {
  return otp === DUMMY_OTP;
}
