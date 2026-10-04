// TerraGrid street sensor: Arduino Uno + XC3700 (LM35, 10 mV per °C).
// Wiring: S (signal) -> A0, + (VCC) -> 5V, - (GND) -> GND.
// Prints the temperature in °C, one number per line, twice a second at 9600 baud.
// The web app reads it over Web Serial ("Sensor" button). Close the IDE Serial Monitor first.

const float OFFSET_C = 0.0;  // calibration: add/subtract if it reads off vs a known thermometer

void setup() {
  Serial.begin(9600);
}

void loop() {
  long sum = 0;
  for (int i = 0; i < 20; i++) sum += analogRead(A0);  // average 20 reads to smooth noise
  float volts = sum / 20.0 * 5.0 / 1023.0;
  Serial.println(volts * 100.0 + OFFSET_C, 1);         // 10 mV per °C
  delay(500);
}
