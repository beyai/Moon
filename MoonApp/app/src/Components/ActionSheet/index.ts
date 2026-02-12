import { registerSheet } from "react-native-actions-sheet";
import { ActionSheetView, ActionSheetPayload } from "./Sheet";
import { ActionSheetPageView, ActionSheetPagePayload } from './Page'


declare module 'react-native-actions-sheet' {
    interface Sheets {
        sheet: {
            payload: ActionSheetPayload<any>;
        },
        page: {
            payload: ActionSheetPagePayload<any>;
        }
    }
}

registerSheet('sheet', ActionSheetView)
registerSheet('page', ActionSheetPageView)