// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportAdmin from '../../../app/model/Admin';
import ExportApplication from '../../../app/model/Application';
import ExportDevice from '../../../app/model/Device';
import ExportDeviceActive from '../../../app/model/DeviceActive';
import ExportDeviceMove from '../../../app/model/DeviceMove';
import ExportDevicePayment from '../../../app/model/DevicePayment';
import ExportDeviceSession from '../../../app/model/DeviceSession';
import ExportGame from '../../../app/model/Game';
import ExportGameMode from '../../../app/model/GameMode';
import ExportGamePlayer from '../../../app/model/GamePlayer';
import ExportUser from '../../../app/model/User';

declare module 'egg' {
  interface IModel {
    Admin: ReturnType<typeof ExportAdmin>;
    Application: ReturnType<typeof ExportApplication>;
    Device: ReturnType<typeof ExportDevice>;
    DeviceActive: ReturnType<typeof ExportDeviceActive>;
    DeviceMove: ReturnType<typeof ExportDeviceMove>;
    DevicePayment: ReturnType<typeof ExportDevicePayment>;
    DeviceSession: ReturnType<typeof ExportDeviceSession>;
    Game: ReturnType<typeof ExportGame>;
    GameMode: ReturnType<typeof ExportGameMode>;
    GamePlayer: ReturnType<typeof ExportGamePlayer>;
    User: ReturnType<typeof ExportUser>;
  }
}
