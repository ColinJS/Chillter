export interface RegisterRequest {
  info: {
    firstname: string,
    lastname: string,
    sex: boolean,
    phone: number,
    email: string,
    language: string,
    currency: string,
    pass: string
  }
}
