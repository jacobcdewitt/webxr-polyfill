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

import XRSpace from './XRSpace';
import * as mat4 from 'gl-matrix/src/gl-matrix/mat4';

const DEFAULT_EMULATION_HEIGHT = 1.6;

export const PRIVATE = Symbol('@@webxr-polyfill/XRReferenceSpace');

// TODO: Code is handling 'local' and 'bounded-floor' reference space types,
// but probably needs to check for the other types and make some adjustments
// accordingly.
export const XRReferenceSpaceTypes = [
  'viewer',
  'local',
  'local-floor',
  'bounded-floor',
  'unbounded'
];

export const XRReferenceSpaceOptions = Object.freeze({
  disableStageEmulation: false,
  stageEmulationHeight: 0,
});

export default class XRReferenceSpace extends XRSpace {
  /**
   * Optionally takes a `transform` from a device's requestFrameOfReferenceMatrix
   * so device's can provide their own transforms for stage (or if they
   * wanted to override eye-level/head-model).
   *
   * @param {XRDevice} device
   * @param {XRReferenceSpaceType} type
   * @param {XRReferenceSpaceOptions} options
   * @param {Float32Array?} transform
   * @param {?} bounds
   */
  constructor(device, type, options, transform, bounds) {
    options = Object.assign({}, XRReferenceSpaceOptions, options);

    if (!XRReferenceSpaceTypes.includes(type)) {
      throw new Error(`XRReferenceSpaceType must be one of ${XRReferenceSpaceTypes}`);
    }

    super((type === 'viewer') ? 'viewer' : null);

    // If stage emulation is disabled, and this is a stage frame of reference,
    // and the XRDevice did not provide a transform, this is an invalid
    // configuration and we shouldn't emulate here. XRSession.requestFrameOfReference
    // should check this as well.
    if (this._isFloor(type) && options.disableStageEmulation && !transform) {
      throw new Error(`XRReferenceSpace cannot use 'bounded-floor' type, if disabling emulation and platform does not provide`);
    }

    if (type === 'bounded-floor') {
      throw new Error('The polyfill does not support creating bounded reference spaces.');
    }

    const { disableStageEmulation, stageEmulationHeight } = options;

    let emulatedHeight = 0;
    // If we're using floor-level reference and no transform, we're emulating.
    // Set emulated height from option or use the default
    if (this._isFloor(type) && !transform) {
      emulatedHeight = stageEmulationHeight !== 0 ? stageEmulationHeight : DEFAULT_EMULATION_HEIGHT;
    }

    // If we're emulating the stage, and the device did not provide
    // a transform, create one here
    if (this._isFloor(type) && !transform) {
      // Apply emulatedHeight to the `y` translation
      transform = mat4.identity(new Float32Array(16));
      transform[13] = emulatedHeight;
    }

    if (!transform) {
      transform = mat4.identity(new Float32Array(16));
    }

    this[PRIVATE] = {
      disableStageEmulation,
      stageEmulationHeight,
      emulatedHeight,
      type,
      transform,
      device,
      bounds,
      options,
      originOffset : mat4.identity(new Float32Array(16)),
    };
    this.onboundschange = undefined;
  }

  /**
   * @param {string} type 
   * @return {boolean}
   */
  _isFloor(type) {
    return type === 'bounded-floor' || type === 'local-floor';
  }

  /**
   * @return {XRStageBounds?}
   */
  get bounds() { return this[PRIVATE].bounds; }

  /**
   * @return {number}
   */
  get emulatedHeight() { return this[PRIVATE].emulatedHeight; }

  /**
   * NON-STANDARD
   *
   * @return {XRReferenceSpaceType}
   */
  get type() { return this[PRIVATE].type; }

  /**
   * NON-STANDARD
   * Takes a base pose model matrix and transforms it by the
   * frame of reference.
   *
   * @param {Float32Array} out
   * @param {Float32Array} pose
   */
  transformBasePoseMatrix(out, pose) {
    // If we have a transform, it was provided by the device
    // (probably "stage" type, but a devices could provide its own head-model)
    // or we could be emulating a stage, in which case a transform
    // was created in the constructor. Either way, if we have a transform, use it.
    if (this[PRIVATE].transform) {
      mat4.multiply(out, this[PRIVATE].transform, pose);
      return;
    }

    switch (this.type) {
      // For 'local', assume the pose given as eye level,
      // so no transformation
      case 'local':
        if (out !== pose) {
          mat4.copy(out, pose);
        }

        return;
    }
  }

  /**
   * NON-STANDARD
   * Takes a base view matrix and transforms it by the
   * pose matrix frame of reference.
   *
   * @param {Float32Array} out
   * @param {Float32Array} view
   */
  transformBaseViewMatrix(out, view) {
    // If we have a transform (native or emulated stage),
    // use it
    let frameOfRef = this[PRIVATE].transform;

    if (frameOfRef) {
      mat4.invert(out, frameOfRef);
      mat4.multiply(out, view, out);
    }
    // Otherwise don't transform the view matrix at all
    // (like for `local` reference spaces).
    else {
      mat4.copy(out, view);
    }

    return out;
  }

  /**
   * @return {Float32Array}
   */
  _inverseOriginOffsetMatrix() {
    let result = mat4.identity(new Float32Array(16));
    mat4.invert(result, this[PRIVATE].originOffset);
    return result;
  }

  _originOffsetMatrix() {
    return this[PRIVATE].originOffset;
  }

  /**
   * @param {Float32Array} transformMatrix 
   */
  _adjustForOriginOffset(transformMatrix) {
    mat4.multiply(transformMatrix, this._inverseOriginOffsetMatrix(), transformMatrix);
  }

  /**
   * Doesn't update the bound geometry for bounded reference spaces.
   * @param {XRRigidTransform} additionalOffset
   * @return {XRReferenceSpace}
  */
  getOffsetReferenceSpace(additionalOffset) {
    let newSpace = new XRReferenceSpace(
      this[PRIVATE].device,
      this[PRIVATE].type,
      this[PRIVATE].options,
      this[PRIVATE].transform,
      this[PRIVATE].bounds);

    // TODO: Might need to invert something here.
    mat4.multiply(newSpace[PRIVATE].originOffset, this[PRIVATE].originOffset, additionalOffset.matrix);
    return newSpace;
  }
}
