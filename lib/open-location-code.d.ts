declare module "open-location-code" {
  interface CodeArea {
    latitudeCenter: number;
    longitudeCenter: number;
    latitudeLo: number;
    latitudeHi: number;
    longitudeLo: number;
    longitudeHi: number;
    codeLength: number;
  }

  class OpenLocationCode {
    encode(lat: number, lon: number, codeLength?: number): string;
    decode(code: string): CodeArea;
    isFull(code: string): boolean;
    isShort(code: string): boolean;
    isValid(code: string): boolean;
    shorten(code: string, lat: number, lon: number): string;
    recoverNearest(code: string, lat: number, lon: number): string;
  }

  export { OpenLocationCode };
}
