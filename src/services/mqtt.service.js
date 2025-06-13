const mqtt = require('mqtt');
const config = require('../config/mqtt.config');
const employeeController = require('../controllers/employee.controller'); // Import employeeController
const employeeService = require('../services/employee.service'); // Import employeeService
const { parse } = require('date-fns');

class MQTTService {
  constructor(io) {
    this.io = io; // Socket.IO instance
    this.client = null;
  }

  connect() {
    const options = {
      keepalive: config.mqtt.keepalive,
      ...(process.env.MQTT_USERNAME && process.env.MQTT_PASSWORD && {
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD
      })
    };

    this.client = mqtt.connect(config.mqtt.url, options);

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      this.subscribe();
    });

    this.client.on('message', (topic, message) => {
      // console.log("topic : ", topic, " messages : ", message);
      this.handleMessage(topic, message)
    });
    this.client.on('error', (error) => this.handleError(error));
  }

  subscribe() {
    this.client.subscribe(config.mqtt.topic, (err) => {
      if (err) {
        console.error('MQTT subscription error:', err);
      } else {
        console.log('Subscribed to MQTT topic:', config.mqtt.topic);
      }
    });
  }

  async handleMessage(topic, message) {
    try {
      const messageString = message.toString();
      const eventData = JSON.parse(messageString);

      const processedData = await employeeController.processDeviceEventData(eventData);
      console.log("processedData = ", processedData);
      switch (processedData.data.status) {
        case 'đăng ký':
          // Chuẩn bị dữ liệu đăng ký
          let registrationDate = "";
          if(processedData.data.timestamp){
            const [date, time] = processedData.data.timestamp.split(" ");
            const [year, month, day] = date.split("-").map(Number);
            const [hours, minutes, seconds] = time.split(":").map(Number);
            registrationDate =  new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
          }else {
            registrationDate = new Date().toISOString();
          }
          console.log("registrationDate =", registrationDate);
          const registrationData = {
            ...processedData.data, 
            employeeType: processedData.data.employeeType,
            registrationDate: registrationDate
          };

          // Xử lý đăng ký thông qua controller
          employeeController.handleRegistrationSave(registrationData)
            .then(result => {
              console.log('MQTT: Employee registration successful:', result);
              // Thông báo cho frontend
              if (this.io) {
                this.io.emit('employee_added', {
                  ...result.data,
                  employeeType: registrationData.employeeType,
                  registrationDate: registrationData.registrationDate
                });
              }
            })
            .catch(error => {
              console.error('Error in employee registration:', error);
              // Thông báo lỗi cho frontend nếu cần
              if (this.io) {
                this.io.emit('registration_error', {
                  error: error.message,
                  employeeId: registrationData.employeeId
                });
              }
            });
          break;

        case 'cập nhật':
          // Chuẩn bị dữ liệu cập nhật
          const updateData = {
            employeeId: processedData.data.employeeId,
            fullName: processedData.data.employeeName,
            imageAvatar: processedData.data.faceEmbedding,
            faceBase64: processedData.data.faceBase64
          };

          // Xử lý cập nhật thông qua controller
          employeeController.handleUpdateSave(updateData)
            .then(result => {
              console.log('MQTT: Employee update successful:', result);
              // Thông báo cho frontend
              if (this.io) {
                this.io.emit('employee_updated', {
                  ...result.data,
                  employeeType: updateData.employeeType,
                  updateDate: updateData.updateDate
                });
              }
            })
            .catch(error => {
              console.error('Error in employee update:', error);
              // Thông báo lỗi cho frontend
              if (this.io) {
                this.io.emit('update_error', {
                  error: error.message,
                  employeeId: updateData.employeeId
                });
              }
            });
          break;

        case 'checkin':
          // Luồng 1 (Async): Lưu bản ghi check-in vào database
          employeeController.handleCheckinSave(processedData)
            .then(checkinRecord => console.log('Check-in record saved successfully:', checkinRecord))
            .catch(error => console.error('Error saving check-in record:', error));
          break;

        default:
          console.error('MQTT: Unexpected status after processing:', processedData.status);
      }

      // Luồng 2 (Async): Lấy thông tin employee và gửi lên frontend
      (async () => {
        try {
          // Sử dụng processedData.employeeId string để tìm employee
          const employee = await employeeService.getEmployeeByEmployeeIdString(processedData.data.employeeId);
          console.log("vaoooo ->> ",employee);
          if (employee.data) {
            const frontendData = {
              employeeId: employee.data.employeeId,
              fullName: employee.data.fullName,
              position: employee.data.position.name,
              department: employee.data.department.name,
              employeeType: employee.data.employeeType,
              status: processedData.data.status,
              timestamp: processedData.data.timestamp
            };
            // Gửi thông tin lên frontend qua Socket.IO
            if (this.io) {
              this.io.emit('checkin', frontendData);
              console.log('Sent check-in data to frontend:', frontendData);
            } else {
              console.log('Socket.IO instance not available, cannot emit checkin data.');
            }

          } else {
            // console.log(`Employee with employeeId ${processedData.employeeId} not found for frontend update.`);
            // for testing 
            const frontendData = {
              employeeId: processedData.data.employeeId,
              fullName: processedData.data.employeeName,
              position: "Người ngoài công ty",
              department: "Người ngoài công ty",
              employeeType: "unknown",
              status: processedData.data.status,
              timestamp: processedData.data.timestamp,
            };
            // Gửi thông tin lên frontend qua Socket.IO
            if (this.io) {
              this.io.emit('checkin', frontendData);
              console.log('Sent check-in data to frontend:', frontendData);
            } else {
              console.log('Socket.IO instance not available, cannot emit checkin data.');
            }
          }
        } catch (error) {
          console.log('MQTT Service - Error in frontend emission flow:', error);
        }
      })();
    } catch (error) {
      console.error('MQTT Service - Error processing message (parsing or initial processing):', error);
    }
  }

  handleError(error) {
    console.error('MQTT Client Error:', error);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = MQTTService; 