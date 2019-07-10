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

import XRViewerPose from './XRViewerPose';
import XRView from './XRView';

export const PRIVATE = Symbol('@@webxr-polyfill/XRFrame');

export default class XRFrame {
  /**
   * @param {XRDevice} device
   * @param {XRSession} session
   * @param {number} sessionId
   */
  constructor(device, session, sessionId) {
    const viewerPose = new XRViewerPose(device);

    // Non-immersive sessions only have a monoscopic view.
    const views = [
      new XRView(device, 'left', sessionId),
    ];

    if (session.immersive) {
      views.push(new XRView(device, 'right', sessionId));
    }

    viewerPose.views = views;

    this[PRIVATE] = {
      device,
      viewerPose,
      views,
      session,
    };
  }

  /**
   * @return {XRSession} session
   */
  get session() { return this[PRIVATE].session; }

  /**
   * @return {Array<XRView>} views
   */
  get views() { return this[PRIVATE].views; }

  /**
   * @param {XRSpace} space
   * @return {XRViewerPose?}
   */
  getViewerPose(space) {
    this[PRIVATE].viewerPose.updateFromReferenceSpace(space);
    return this[PRIVATE].viewerPose;
  }

  /**
   * @param {XRInputSource} inputSource
   * @param {XRSpace} space
   * @return {XRInputPose?}
   */
  _getInputPose(inputSource, space) {
    return this[PRIVATE].device.getInputPose(inputSource, space);
  }

  getPose(space, baseSpace) {
    // console.log(space._specialType + " type");
    if (space._specialType === "viewer") {
      // Don't just return the viewer pose since the resulting pose shouldn't
      // include the views array - it should just have the transform.
      let viewerPose = this.getViewerPose(baseSpace);
      return new XRPose(
        new XRRigidTransform(viewerPose.poseModelMatrix),
        viewerPose.emulatedPosition);
    }

    if (space._specialType === "target-ray" || space._specialType === "grip") {
      let inputPose = this._getInputPose(space._inputSource, baseSpace);
      if (!inputPose) {
        return null;
      }
      if (space._specialType === "target-ray") {
        return new XRPose(new XRRigidTransform(inputPose.targetRay.matrix), inputPose.emulatedPosition);
      } else if (space._specialType === "grip") {
        return new XRPose(new XRRigidTransform(inputPose.gripMatrix), inputPose.emulatedPosition);
      }
    }

    return null;
  }
}
