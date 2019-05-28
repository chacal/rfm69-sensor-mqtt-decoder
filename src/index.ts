import {Mqtt, SensorEvents} from '@chacal/js-utils'
import ISensorEvent = SensorEvents.ISensorEvent
import RFM69Message from './RFM69Message'
import decodeRFM69Message from './RFM69MessageDecoder'

const MQTT_BROKER = process.env.MQTT_BROKER ? process.env.MQTT_BROKER : 'mqtt://mqtt-home.chacal.fi'
const MQTT_USERNAME = process.env.MQTT_USERNAME || undefined
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || undefined


const mqttClient = Mqtt.startMqttClient(MQTT_BROKER, MQTT_USERNAME, MQTT_PASSWORD)
mqttClient.subscribe('/rfm69gw/rx')
mqttClient.on('message', handleMessage)
registerProcessSignalHandler()


function handleMessage(topic: string, payload: Buffer): void {
  try {
    const rfm69Msg = JSON.parse(payload.toString()) as RFM69Message
    const event = decodeRFM69Message(rfm69Msg)
    publishEvent(event)
  } catch (e) {
    console.error(`Got invalid MQTT message: ${payload.toString()}`, e)
  }
}


function publishEvent(e: ISensorEvent): void {
  if (isCommand(e)) {
    mqttClient.publish(`/command/${e.instance}/${e.tag}/state`, JSON.stringify(e))  // Don't retain, qos 0
  } else {
    mqttClient.publish(`/sensor/${e.instance}/${e.tag}/state`, JSON.stringify(e), { retain: true, qos: 1 })
  }
}

function isCommand(e: ISensorEvent) { return e.tag === 'a' }  // At the moment only autopilot remote sends commands

function registerProcessSignalHandler() {
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received, closing MQTT connection..')
    mqttClient.end(false, () => {
      console.log('MQTT connection closed. Exiting..')
      process.exit(0)
    })
  })
}