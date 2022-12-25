import { expose, workerThreadsExposer } from "airpc";
import { Endpoint } from "../../../../../shared/video/packages/core/src";

expose(new Endpoint(), workerThreadsExposer());
