// TerraGrid street sensor: Arduino Uno + Keyestudio DS18B20 module.
// Wiring (go by the printed labels): S -> D2 (digital, not A2), V -> 5V, G -> GND.
// Reads -127 = no sensor found: signal wire is on the wrong pin or loose.
// Needs libraries: OneWire, DallasTemperature (Library Manager).
// Prints the temperature in °C, one number per line, twice a second at 9600 baud.
// The web app reads it over Web Serial ("Sensor" button). Close the IDE Serial Monitor first.

#include <OneWire.h>
#include <DallasTemperature.h>

const float OFFSET_C = 0.0;  // calibration: add/subtract if it reads off vs a known thermometer

OneWire wire(2);
DallasTemperature sensor(&wire);

void setup() {
  Serial.begin(9600);
  sensor.begin();
}

void loop() {
  sensor.requestTemperatures();
  Serial.println(sensor.getTempCByIndex(0) + OFFSET_C, 1);
  delay(500);
}
