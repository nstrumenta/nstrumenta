import {
  RTCIceCandidate,
  RTCSessionDescription,
} from "werift";
import { Context } from "./context/context";

export const handleCreate = async ({ roomManager }: Context) => {
  return roomManager.create();
};

export const handleJoin = async ({ roomManager }: Context, name: string) => {
  return roomManager.join(name);
};

export const handleAnswer = async (
  { roomManager }: Context,
  name: string,
  peerId: string,
  answer: RTCSessionDescription
) => {
  return roomManager.answer(name, peerId, answer);
};

export const handleCandidate = async (
  { roomManager }: Context,
  name: string,
  peerId: string,
  candidate: RTCIceCandidate
) => {
  return roomManager.candidate(name, peerId, candidate);
};
