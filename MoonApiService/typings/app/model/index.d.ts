// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportActive from '../../../app/model/Active';
import ExportAdmin from '../../../app/model/Admin';
import ExportApplication from '../../../app/model/Application';
import ExportDevice from '../../../app/model/Device';
import ExportDeviceSession from '../../../app/model/DeviceSession';
import ExportGame from '../../../app/model/Game';
import ExportGamePlay from '../../../app/model/GamePlay';
import ExportMove from '../../../app/model/Move';
import ExportPayment from '../../../app/model/Payment';
import ExportUser from '../../../app/model/User';
import ExportIndex from '../../../app/model/index';

declare module 'egg' {
  interface IModel {
    Active: ReturnType<typeof ExportActive>;
    Admin: ReturnType<typeof ExportAdmin>;
    Application: ReturnType<typeof ExportApplication>;
    Device: ReturnType<typeof ExportDevice>;
    DeviceSession: ReturnType<typeof ExportDeviceSession>;
    Game: ReturnType<typeof ExportGame>;
    GamePlay: ReturnType<typeof ExportGamePlay>;
    Move: ReturnType<typeof ExportMove>;
    Payment: ReturnType<typeof ExportPayment>;
    User: ReturnType<typeof ExportUser>;
    Index: ReturnType<typeof ExportIndex>;
  }
}
