export default interface RFM69Message {
  sender: number,
  receiver: number,
  data: string,
  rssi: number,
  ts: string
}