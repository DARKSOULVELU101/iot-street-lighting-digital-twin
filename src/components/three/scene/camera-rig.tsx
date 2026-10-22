"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

interface ControlsLike {
  target: THREE.Vector3;
  enabled: boolean;
  update: () => void;
}

interface CameraCommand {
  x: number;
  z: number;
  distance: number;
  height: number;
  token: number;
}

const cameraCommand: CameraCommand = {
  x: 0,
  z: 0,
  distance: 118,
  height: 62,
  token: 0,
};

/** Move the virtual camera towards a point of interest in the city. */
export function focusCamera(x: number, z: number, distance = 62, height = 40): void {
  cameraCommand.x = x;
  cameraCommand.z = z;
  cameraCommand.distance = distance;
  cameraCommand.height = height;
  cameraCommand.token += 1;
}

/** Reset the camera to the establishing shot. */
export function resetCamera(): void {
  focusCamera(0, 0, 118, 62);
}

export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as ControlsLike | null;
  const token = React.useRef(cameraCommand.token);
  const goal = React.useRef(new THREE.Vector3(0, 0, 0));
  const distance = React.useRef(cameraCommand.distance);
  const height = React.useRef(cameraCommand.height);
  const flying = React.useRef(false);
  const offset = React.useMemo(() => new THREE.Vector3(), []);

  useFrame((_state, delta) => {
    if (!controls) return;

    if (cameraCommand.token !== token.current) {
      token.current = cameraCommand.token;
      goal.current.set(cameraCommand.x, 0, cameraCommand.z);
      distance.current = cameraCommand.distance;
      height.current = cameraCommand.height;
      flying.current = true;
      controls.enabled = false;
    }

    if (!flying.current) return;

    const k = Math.min(1, delta * 1.7);
    controls.target.lerp(goal.current, k);

    offset.copy(camera.position).sub(controls.target);
    const current = offset.length();
    const next = current + (distance.current - current) * k;
    offset.setLength(next);

    camera.position.copy(controls.target).add(offset);
    camera.position.y += (height.current - camera.position.y) * k;
    camera.lookAt(controls.target);
    controls.update();

    const settled =
      controls.target.distanceTo(goal.current) < 0.8 &&
      Math.abs(camera.position.y - height.current) < 1.2;
    if (settled) {
      flying.current = false;
      controls.enabled = true;
    }
  });

  return null;
}
