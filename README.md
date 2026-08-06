# Micromouse Simulator

A browser-based simulator for writing, compiling, and testing micromouse control code in C++. It gives you a simple way to experiment with maze-solving robots without needing hardware.

## What it is

This project provides an interactive environment where you can:

- write C++ code for a virtual micromouse
- compile and run it in the browser
- watch the robot navigate a generated maze in real time
- inspect sensor data and serial output through the built-in interface

The simulator is designed to feel similar to programming an ESP32-style robot, while keeping the workflow lightweight and accessible.

## How it works

1. You write your bot logic in the built-in code editor.
2. The code is sent to a compile server, which builds it into WebAssembly.
3. The compiled bot runs inside a web worker so it can interact with the simulation.
4. The simulator updates the robot’s movement, sensors, collisions, and serial output each frame.
5. You can restart the simulation, generate a new maze, and test different strategies quickly.

## Features

- interactive maze simulation
- virtual motors, sensors, and encoders
- serial monitor for debugging output
- example bot code to get started
- documentation for the supported API surface

## Project structure

- [index.html](index.html) — main page and UI layout
- [js/main.js](js/main.js) — app bootstrap
- [js/Simulator.js](js/Simulator.js) — simulation loop and compile/deploy flow
- [js/Bot.js](js/Bot.js) — robot movement and collision logic
- [js/Sensor.js](js/Sensor.js) — virtual distance sensors
- [js/worker.js](js/worker.js) — worker that runs the compiled bot code
- [cpp](cpp) — example C++ bot programs
- [compile-server](compile-server) — server-side compilation endpoint
- [documentation/main.md](documentation/main.md) — documentation for the simulator API

## Getting started

Open [index.html](index.html) in a browser, or serve the repository from a local web server.

Then:

1. edit your bot code in the editor
2. click the compile/run button
3. observe the robot in the simulation and monitor its serial output