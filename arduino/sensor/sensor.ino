// TerraGrid street sensor: Arduino Uno + Keyestudio DS18B20 module, read as an analog probe on A0
// (same as the AEGIS-CARGO rig): responds to touch on camera. Not a calibrated temperature.
// Wiring (as on the old rig): pin labelled S -> GND, V -> 5V, pin labelled G -> A0.
// Prints one °C value per line every 250 ms at 9600 baud. Close the IDE Serial Monitor before the web app connects.

const int N = 5;              // moving average window
int buf[N];
int idx = 0, filled = 0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  buf[idx] = analogRead(A0);
  idx = (idx + 1) % N;
  if (filled < N) filled++;

  long sum = 0;
  for (int i = 0; i < filled; i++) sum += buf[i];
  Serial.println(sum / (float)filled * (5.0 / 1023.0) * 100.0, 1);  // 10 mV per °C scaling

  delay(250);
}
