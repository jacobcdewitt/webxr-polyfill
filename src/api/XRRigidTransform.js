/*
 * Copyright 2019 Google Inc. All Rights Reserved.
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

import * as mat4 from 'gl-matrix/src/gl-matrix/mat4';
import * as vec3 from 'gl-matrix/src/gl-matrix/vec3';
import * as quat from 'gl-matrix/src/gl-matrix/quat';

export const PRIVATE = Symbol('@@webxr-polyfill/XRRigidTransform');

// TODO: Decompose matrix into position and orientation.
// TODO: Implement constructor that takes position and orientation instead of a matrix.
export default class XRRigidTransform {
  /*
  constructor(position = null, orientation = null) {
    if (!position) {
      position = [0, 0, 0, 1];
    }

    if (!orientation) {
      orientation = [0, 0, 0, 1];
    }

    // TODO: Compose matrix from position and orientation.
  }
  */

  constructor(matrix, inverse = null) {
    this[PRIVATE] = {
      matrix,
      inverse,
    }

    // Decompose matrix into position and orientation.
    let position = vec3.create();
    mat4.getTranslation(position, matrix);
    this[PRIVATE].position = DOMPointReadOnly.fromPoint({x: position[0], y: position[1], z: position[2]});

    let orientation = quat.create();
    mat4.getRotation(orientation, matrix);
    this[PRIVATE].orientation = DOMPointReadOnly.fromPoint({x: orientation[0], y: orientation[1], z: orientation[2], w: orientation[3]});
  }

  get matrix() { return this[PRIVATE].matrix; }

  get inverse() {
    if (this[PRIVATE].inverse === null) {
      let invMatrix = mat4.identity(new Float32Array(16));
      mat4.invert(invMatrix, this[PRIVATE].matrix);
      this[PRIVATE].inverse = new XRRigidTransform(invMatrix, this);
    }

    return this[PRIVATE].inverse;
  }

  _multiply(otherTransform) {
    let newMatrix = mat4.identity(new Float32Array(16));
    mat4.multiply(newMatrix, this[PRIVATE].matrix, otherTransform[PRIVATE].matrix);
    return new XRRigidTransform(newMatrix, this[PRIVATE].inverse);
  }
}
