import { Text, ScrollView } from "react-native";
import { getOutputDeviceLabel, SoundOutputDeviceData, TTS } from "react-native-nitro-moon";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ParamListBase } from "@react-navigation/native";
import { SheetManager } from "react-native-actions-sheet";
import { Cell, CellGroup } from "@/Components/Cell";
import { ThemeMode } from "@/Constraint";
import { DeviceActions, useDeviceStore } from "@/Store";
import { VoiceLanguage } from "@/Constraint/TTS";
import { SliderView } from "@/Components/Slider";
import styles from "./styles";


// 主题设置
function setTheme(value: ThemeMode) {
    SheetManager.show('sheet', {
        payload: {
            title: '界面颜色模式',
            value: value,
            data: ThemeMode.values,
            onChange: (value: ThemeMode) => {
                DeviceActions.setThemeMode(value)
            }
        },
    })
}

// 音色设置
function setVoice(value: string) {
    SheetManager.show('page', {
        payload: {
            title: '语音播报音色',
            value: value,
            containerHeight: 300,
            data: TTS.voices.map((item) => {
                return {
                    label: item.name,
                    desc: VoiceLanguage.getLabel(item.language),
                    value: item.identifier,
                }
            }),
            onChange: (item)  => {
                TTS.speak(`您好，我是${ item.label }`, { identifier: item.value })
            },
            onConfirm: (value) => {
                DeviceActions.setVoice(value)
            }
        },
    })
}

// 输出设备
function setSoundOuput(soundOutput: string) {
    SheetManager.show("sheet", {
        payload: {
            title: '声音输出设备',
            value: soundOutput,
            data: SoundOutputDeviceData,
            onChange: (value) => {
                DeviceActions.setSoundOutput(value)
                setImmediate(() => TTS.speak(getOutputDeviceLabel(value)))
            }
        }
    })
}

function SettingPage({ navigation }: NativeStackScreenProps<ParamListBase, "Setting"> ) {
    const { theme, voiceId, voiceRate, soundOutput, volume } = useDeviceStore()
    
    return (
        <>
            <CellGroup title="声音" inset border>
                <Cell 
                    label="输出设备"
                    isLink
                    content={ getOutputDeviceLabel(soundOutput) }
                    onClick={ () => setSoundOuput(soundOutput) }
                />
                <Cell 
                    label="音量"
                    labelWidth={ 120 }
                    border={ false }
                    renderLink={ <Text style={ styles.sliderText }>{ Math.ceil(volume * 100) }</Text> }
                >
                    <SliderView 
                        precision={ 2 }
                        step={ 0.02 }
                        min={ 0 }
                        max={ 1 } 
                        value={ volume }
                        onChange={ DeviceActions.setVolume }
                    />
                </Cell>
            </CellGroup>

            <CellGroup title="语音播报" inset border>
                <Cell 
                    label="音色" 
                    isLink
                    content={ TTS.voice.name }
                    onClick={ () => setVoice(voiceId) }
                />
                <Cell 
                    label="语速" 
                    labelWidth={ 120 }
                    border={ false }
                    renderLink={ <Text style={ styles.sliderText }>{ Math.ceil(voiceRate * 100)  }</Text> }
                >
                    <SliderView 
                        precision={ 2 }
                        step={ 0.02 }
                        min={ TTS.rateMinValue }
                        max={ TTS.rateMaxValue } 
                        value={ voiceRate }
                        onChange={ DeviceActions.setVoiceRate }
                    />
                </Cell>
            </CellGroup>

            {/* <CellGroup inset title="界面" border>
                <Cell 
                    label="颜色模式" 
                    isLink 
                    border={ false }
                    content={ ThemeMode.getLabel(theme) }
                    onClick={ () => setTheme(theme) }
                />
            </CellGroup> */}
        </>
    )
}

export default SettingPage