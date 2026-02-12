# 基于 Bun.js + Websocket 的房间消息服务

### 功能

- 连接来源
    - device(设备)
    - client(客户端)

- 授权
    - 连接端发送 login 消息，并携带验证数据，如来源、token
    - 根据 来源与token进行身份验证

- 房间：
    - 连接端发送 join 消息，携带 角色、房间名信息，在加入前验证房间是否允许加入
    - 加入成功时，设置连接端可以房间内最大停留时长，接收来自己客户端的pong帧进行时间检测
    - 角色分为：anchor(主播)，audience(观众)
        - 房间内只允许一个主播，如果同一房间内有新主播进来时，将原主播踢出房间
        - 房间内限制观众人数，如果人数超出限制时，将最先进来的观众踢出房间
    - 房间成员发生变化时，同步房间所人成员信息到连接端


### 模块

#### Client
- 处理当前连接
- 登录授权
- 创建当前连接所在房间成员信息
- 向房间成员信息内转发加入、离开、消息

#### RoomManger
- 管理所有房间
- 房间创建、获取、销毁
- 存储房间下的所有成员关系

#### RoomMember
- 验证房间是否可以加入
- 房间停留时长
- 分发消息给房间内所有成员
- 离开房间
- 踢出房间内其它成员

### nginx配置
``` conf
location / {
      proxy_pass http://192.168.10.120:3001;
      proxy_redirect off;
      proxy_http_version 1.1; # 些行必须
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;

      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

      proxy_read_timeout 3600s;
      proxy_send_timeout 3600s;
    }
```