/*
 * Copyright 2019 Immersive Web Community Group. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
Example Gamepad mapping. Any of the values may be omitted for the original
gamepad values to pass through unchanged.

// Chrome 76 Diff: id should instead be an array of profiles.

"Gamepad ID String": { // The Gamepad.id that this entry maps to.
  mapping: 'xr-standard', // Overrides the Gamepad.mapping that is reported
  id: 'gamepad-id-string', // The Gamepad.id that should be reported
  axes: { // Remaps the reported axes
    length: 2, // Overrides the length of the reported axes array
    0: 2, // Remaps axes[0] to report axis[2] from the original gamepad object
  },
  buttons: { // Remaps the reported buttons
    length: 2, // Overrides the length of the reported buttons array
    0: 2, // Remaps buttons[0] to report buttons[2] from the original gamepad object
  },
  gripTransform: { // An additional transform to apply to the gripSpace's pose
    position: [0, 0, 0.5], // Additional translation vector to apply
    orientation: [0, 0, 0, 1] // Additional rotation quaternion to apply
  },
  targetRayTransform: { // An additional transform to apply to the targetRaySpace's pose
    position: [0, 0, 0.5], // Additional translation vector to apply
    orientation: [0, 0, 0, 1] // Additional rotation quaternion to apply
  }
}
*/

// Applies to both left and right Oculus Touch controllers.
let oculusTouch = {
  mapping: 'xr-standard',
  id: 'oculus-touch',
  // Chrome 76 Diff: Spec requires axes to be remapped as shown below for 'xr-standard'
  /*axes: {
    length: 4,
    0: null,
    1: null,
    2: 0,
    3: 1
  },*/
  buttons: {
    length: 6,
    0: 1,
    1: 0, // Chrome 76 Diff: Should be 2
    2: 2, // Chrome 76 Diff: Should be null
    3: null, // Chrome 76 Diff: Should be 0
    4: 3,
    5: 4
  },
  // Grip adjustments determined experimentally.
  gripTransform: {
    position: [0, -0.02, 0.04, 1],
    orientation: [Math.PI * 0.11, 0, 0, 1]
  }
};

let windowsMixedReality = {
  mapping: 'xr-standard',
  id: 'windows-mixed-reality',
  buttons: {
    length: 4,
    0: 1, // index finger trigger
    1: 0, // pressable joystick
    2: 2, // grip trigger
    3: 4, // pressable touchpad
  },
  // Grip adjustments determined experimentally.
  gripTransform: {
    position: [0, -0.02, 0.04, 1],
    orientation: [Math.PI * 0.11, 0, 0, 1]
  }
};

let GamepadMappings = {
  "Oculus Touch (Right)": oculusTouch,
  "Oculus Touch (Left)": oculusTouch,

  "Oculus Go Controller": {
    mapping: 'xr-standard',
    id: 'oculus-go',
    buttons: {
      // length: 3, // Chrome 76 Diff: Uncomment
      0: 1,
      1: 0, // Chrome 76 Diff: Should be null
      //2: 0 // Chrome 76 Diff: Uncomment
    },
    // Grip adjustments determined experimentally.
    gripTransform: {
      orientation: [Math.PI * 0.11, 0, 0, 1]
    }
  },

  "Windows Mixed Reality (Right)": windowsMixedReality,
  "Windows Mixed Reality (Left)": windowsMixedReality,
};

export default GamepadMappings;