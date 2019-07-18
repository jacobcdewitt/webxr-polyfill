/*
 * Copyright 2017 Google Inc. All Rights Reserved.
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

export const PRIVATE = Symbol('@@webxr-polyfill/XRViewerPose');

// TODO: Extend XRPose and set transform. Should that use poseModelMatrix?
export default class XRViewerPose {
  /**
   * @param {XRDevice} device
   */
  constructor(device) {
    this[PRIVATE] = {
      device,
      leftViewMatrix: mat4.identity(new Float32Array(16)),
      rightViewMatrix: mat4.identity(new Float32Array(16)),
      poseModelMatrix: mat4.identity(new Float32Array(16)),
    };
  }

  /**
   * @return {Float32Array}
   */
  get poseModelMatrix() { return this[PRIVATE].poseModelMatrix; }

  /**
   * @param {XRView} view
   * @return {Float32Array}
   */
  getViewMatrix(view) {
    switch (view.eye) {
      case 'left': return this[PRIVATE].leftViewMatrix;
      case 'right': return this[PRIVATE].rightViewMatrix;
    }
    throw new Error(`view is not a valid XREye`);
  }

  /**
   * @return {Array<XRView>}
   */
  get views() {
    return this[PRIVATE].views;
  }

  set views(value) {
    this[PRIVATE].views = value;
  }

  /**
   * NON-STANDARD
   *
   * @param {XRReferenceSpace} refSpace
   */
  updateFromReferenceSpace(refSpace) {
    const pose = this[PRIVATE].device.getBasePoseMatrix();
    const leftViewMatrix = this[PRIVATE].device.getBaseViewMatrix('left');
    const rightViewMatrix = this[PRIVATE].device.getBaseViewMatrix('right');

    if (pose) {
      refSpace.transformBasePoseMatrix(this[PRIVATE].poseModelMatrix, pose);
      refSpace._adjustForOriginOffset(this[PRIVATE].poseModelMatrix);
    }

    if (leftViewMatrix && rightViewMatrix) {
      refSpace.transformBaseViewMatrix(this[PRIVATE].leftViewMatrix,
                                         leftViewMatrix,
                                         this[PRIVATE].poseModelMatrix);
      refSpace.transformBaseViewMatrix(this[PRIVATE].rightViewMatrix,
                                         rightViewMatrix,
                                         this[PRIVATE].poseModelMatrix);

      //refSpace._adjustForOriginOffset(this[PRIVATE].leftViewMatrix);
      //refSpace._adjustForOriginOffset(this[PRIVATE].rightViewMatrix);
      mat4.multiply(this[PRIVATE].leftViewMatrix, this[PRIVATE].leftViewMatrix, refSpace._originOffsetMatrix());
      mat4.multiply(this[PRIVATE].rightViewMatrix, this[PRIVATE].rightViewMatrix, refSpace._originOffsetMatrix());
    }

    for (let view of this[PRIVATE].views) {
      if (view.eye == "left") {
        view._updateViewMatrix(this[PRIVATE].leftViewMatrix);
      } else if (view.eye == "right") {
        view._updateViewMatrix(this[PRIVATE].rightViewMatrix);
      }
    }
  }
}
