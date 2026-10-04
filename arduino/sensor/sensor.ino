// TerraGrid street sensor: Arduino Uno + Keyestudio DS18B20 module.
// Wiring: this Keyestudio board has S and G silkscreened the wrong way round, so:
// pin labelled G -> D2, V -> 5V, pin labelled S -> GND. Reads -127 = no sensor found.
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
