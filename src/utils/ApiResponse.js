export class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.success = statusCode >= 200 && statusCode < 400;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }
}
