// Import thư viện cần thiết
const fs = require('fs').promises;
const fs2 = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');
const crypto = require('crypto'); // Dùng để hash SHA-256
const { exec } = require("child_process");

// Hàm hash password/email bằng SHA-256 ra BigInt
function hashPasswordNumber(email, password) {
    const hashHex = crypto.createHash('sha256').update(email + ':' + password).digest('hex');
    return BigInt('0x' + hashHex); // Chuyển về số lớn
}

// Lớp xử lý ZKAuth
class ZKAuth {
  constructor() {
    // Tạo thư mục lưu tài khoản (nếu chưa có)
    const dirPath = path.join("zkauthaccounts");
    try {
      fs.mkdir(dirPath, { recursive: true });
    }
    catch (error) {
      console.log("Error:" + error)
    }
  }

  // Đăng ký tài khoản mới
  async setPassword(newEmail, newPassword) {
    // Kiểm tra format password và email
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    var emailRegex = /\S+@\S+\.\S+/;
    if (newPassword === '' || newEmail === '') {
      return { status: 400, message: "Email and password cannot be empty" };
    }
    if (!emailRegex.test(newEmail)) {
      return { status: 400, message: "Invalid Email Format" };
    }
    if (newPassword.length > 20) {
      return { status: 400, message: "Password must be less than 20 characters" };
    }
    if (!passwordRegex.test(newPassword)) {
      return { status: 400, message: "Password must be at least 12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol" };
    }
    // Kiểm tra trùng email
    const newDirPath = path.join("zkauthaccounts/" + newEmail);
    if (fs2.existsSync(newDirPath)) {
      return { status: 400, message: "Email already taken" };
    }

    // Hash email+password ra số lớn để nhúng vào circuit
    const passwordToNum = hashPasswordNumber(newEmail, newPassword);

    // Tạo thư mục user
    await fs.mkdir(newDirPath, { recursive: true });

    // Copy file cấu hình vào thư mục user
    const filesToCopy = ['setup.sh', 'pot14_final.ptau', 'circuit_final.zkey'];
    for (const file of filesToCopy) {
      await fs.copyFile(`node_modules/zkauth/${file}`, path.join(newDirPath, file));
    }

    // Thay giá trị password trong setup.sh
    let setupFileContents = await fs.readFile(path.join(newDirPath, "setup.sh"), 'utf8');
    setupFileContents = setupFileContents.replace(/var password = \d+;/, `var password = ${passwordToNum};`);
    await fs.writeFile(path.join(newDirPath, "setup.sh"), setupFileContents, 'utf8');

    // Chạy script tạo circuit & proving key
    const execPromise = (cmd, options) => new Promise((resolve, reject) => {
      exec(cmd, options, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject({ status: 500, message: "Error executing script" });
        } else {
          console.log(`stdout: ${stdout}`);
          resolve({ status: 200, message: "Password setup successfully" });
        }
      });
    });

    const command = 'bash setup.sh';
    try {
      const result = await execPromise(command, {
        cwd: newDirPath
      });
      return result;
    } catch (error) {
      return error;
    }
  }

  // Kiểm tra đăng nhập
  async checkPassword(emailAttempt, passwordAttempt) {
    try {
      if (emailAttempt === '' || passwordAttempt === '') {
        return { status: 400, message: "Email and Password cannot be empty" };
      }
      const newDirPath = path.join("zkauthaccounts/" + emailAttempt);
      if (!fs2.existsSync(newDirPath)) {
        return { status: 400, message: "Invalid Email Address" };
      }

      // Gọi hàm run để tạo proof và kiểm tra
      const message = await run(emailAttempt, passwordAttempt);
      return { status: 200, message: message };

    } catch (error) {
      console.error(error);
      return { status: 500, message: "An error occured" };
    }
  }

  // Đổi mật khẩu
  async changePassword(email, password) {
    if (email === '' || password === '') {
      return { status: 400, message: "Email and Password cannot be empty" };
    }
    const newDirPath = path.join("zkauthaccounts/" + email);
    if (!fs2.existsSync(newDirPath)) {
      return { status: 400, message: "Invalid Email Address" };
    }
    try {
      await fs.rm(newDirPath, { recursive: true }, (err) => {
        if (err) {
          console.error('An error occurred:', err);
          return;
        }
        console.log('Directory removed');
      });
      const setPasswordResponse = await this.setPassword(email, password);
      return setPasswordResponse;
    }
    catch (error) {
      console.error(error);
      return { status: 500, message: "An error occured" };
    }
  }
}

// Hàm chạy kiểm tra password (tạo proof và so sánh publicSignals)
// Hàm chạy kiểm tra password (tạo proof và xác minh proof)
async function run(emailAttempt, passwordAttempt) {
  // Hash giống lúc đăng ký
  const passwordNum = hashPasswordNumber(emailAttempt, passwordAttempt);
  let message = "";

  // Sinh proof và lấy kết quả so sánh
  const { proof, publicSignals } = await snarkjs.plonk.fullProve(
    { attempt: passwordNum },
    `./zkauthaccounts/${emailAttempt}/circuit.wasm`,
    `./zkauthaccounts/${emailAttempt}/circuit_final.zkey`
  );

  // Đọc verification key
  const verificationKeyPath = `./zkauthaccounts/${emailAttempt}/verification_key.json`;
  let verificationKey;
  try {
    verificationKey = JSON.parse(await fs.readFile(verificationKeyPath, 'utf8'));
  } catch (err) {
    message += "Error reading verification key.\n";
    return message;
  }

  // Xác minh proof
  const isValid = await snarkjs.plonk.verify(verificationKey, publicSignals, proof);

  if (!isValid) {
    message += "Proof invalid! (Có thể do sửa file, lỗi snarkjs, hoặc giả mạo)\n";
    return message;
  }

  // Nếu proof hợp lệ, check kết quả đăng nhập
  const result = publicSignals[0] === '1' ? "Login Successful!" : "Incorrect Password";
  message += result + "\n";

  return message;
}


// --- Hết các hàm chính --- //

// Export class để server.js sử dụng
module.exports = ZKAuth;
