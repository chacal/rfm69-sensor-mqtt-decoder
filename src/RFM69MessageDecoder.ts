import {SensorEvents, SensorEvents as Events} from '@chacal/js-utils'
import ISensorEvent = SensorEvents.ISensorEvent
import RFM69Message from './RFM69Message'


const AUTOPILOT_COMMAND_TAG = 'a'
const TEMPERATURE_EVENT_TAG = 't'
const LEVEL_REPORT_EVENT_TAG = 'r'

export default function decodeRFM69Message(rfm69Msg: RFM69Message): ISensorEvent {
  const data = Buffer.from(rfm69Msg.data, 'hex')
  const tag = String.fromCharCode(data.readUInt8(0))
  const meta = { tag, ts: rfm69Msg.ts, rssi: rfm69Msg.rssi }

  switch (tag) {
    case AUTOPILOT_COMMAND_TAG:
      return parseAutopilotCommand(data, meta)
    case TEMPERATURE_EVENT_TAG:
      return parseTemperatureEvent(data, meta)
    case LEVEL_REPORT_EVENT_TAG:
      return parseLevelReportEvent(data, meta)
    default:
      throw new Error(`Unexpected sensor tag: ${tag}`)
  }
}

function parseAutopilotCommand(buf: Buffer, { tag, ts, rssi }: EventMeta): Events.IAutopilotCommand {
  assertLength(buf, 'autopilot command', 10)

  const instance = buf.readUInt8(1).toString()
  const buttonId = buf.readUInt8(2)
  const isLongPress = buf.readUInt8(3) > 0
  const vcc = buf.readInt16LE(4)
  const previousSampleTimeMicros = buf.readUInt32LE(6)

  return { tag, instance, ts, buttonId, isLongPress, vcc, previousSampleTimeMicros, rssi }
}

function parseTemperatureEvent(buf: Buffer, { tag, ts, rssi }: EventMeta): Events.ITemperatureEvent {
  assertLength(buf, 'temperature event', 12)

  const instance = buf.readUInt8(1).toString()
  const temperature = buf.readFloatLE(2)
  const vcc = buf.readInt16LE(6)
  const previousSampleTimeMicros = buf.readUInt32LE(8)

  return { tag, instance, ts, temperature, vcc, previousSampleTimeMicros, rssi }
}

function parseLevelReportEvent(buf: Buffer, { tag, ts, rssi }: EventMeta): Events.ILevelReportEvent {
  assertLength(buf, 'level report event', 9)

  const instance = buf.readUInt8(1).toString()
  const level = buf.readUInt8(2)
  const vcc = buf.readInt16LE(3)
  const previousSampleTimeMicros = buf.readUInt32LE(5)

  return { tag, instance, ts, level, vcc, previousSampleTimeMicros, rssi }
}


function assertLength(buf: Buffer, sensorType: string, expectedBytes: number) {
  if (buf.length !== expectedBytes) {
    const err = `Invalid ${sensorType} packet length: ${buf.length} Expected ${expectedBytes} bytes.`
    console.error(err)
    throw new Error(err)
  }
}

interface EventMeta {
  tag: string,
  ts: string,
  rssi: number
}