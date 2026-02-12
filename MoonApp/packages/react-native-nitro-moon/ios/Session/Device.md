### Device

### 根证书 RootCert
- 证书类型：P256
- 使用范围：注册设备

| 属性/方法 | 类型 | 描述 |
| --- | --- | --- |
| `roomPublicKey` | `Data` | 根证书公钥 |
| `devicePrivateKey` | `Data` | 设备证书私钥 |
| `getSharedKey(salt: Data)` | `Function` | 获取共享密钥：参数为盐值，返回共享密钥 |
| `encryptData(data: Data, sharedKey: Data)` | `Function` | 加密数据：参数为待加密数据和共享密钥，返回加密后的数据 |
| `decryptData(encryptedData: Data, sharedKey: Data)` | `Function` | 解密数据：参数为待解密数据和共享密钥，返回解密后的数据 |

### 设备证书 DeviceCert
- 证书类型：P256
- 使用范围：设备认证

| 属性 | 类型 | 描述 |
| --- | --- | --- |
| `deviceUID` | `String` | 设备唯一标识，用于注册设备和认证设备 |
| `deviceKey` | `Data` | 设备证书 |
| `getSharedKey(salt: Data)` | `Function` | 获取共享密钥：参数为盐值，返回共享密钥 |
| `encryptData(data: Data, sharedKey: Data)` | `Function` | 加密数据：参数为待加密数据和共享密钥，返回加密后的数据 |
| `decryptData(encryptedData: Data, sharedKey: Data)` | `Function` | 解密数据：参数为待解密数据和共享密钥，返回解密后的数据 |


### 临时证书 TempCert
- 证书类型：P256
- 使用范围：发送与接收数据

| 属性 | 类型 | 描述 |
| --- | --- | --- |
| `tempKey` | `Data` | 设备证书 |
| `getSharedKey(salt: Data)` | `Function` | 获取共享密钥：参数为盐值，返回共享密钥 |
| `encryptData(data: Data, sharedKey: Data)` | `Function` | 加密数据：参数为待加密数据和共享密钥，返回加密后的数据 |
| `decryptData(encryptedData: Data, sharedKey: Data)` | `Function` | 解密数据：参数为待解密数据和共享密钥，返回解密后的数据 |


